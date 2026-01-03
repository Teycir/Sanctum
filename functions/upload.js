export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { provider, data, credentials } = await request.json();

      let result;
      if (provider === 'pinata') {
        result = await uploadToPinata(data, credentials.jwt);
      } else if (provider === 'filebase') {
        result = await uploadToFilebase(data, credentials);
      } else {
        return new Response('Invalid provider', { status: 400 });
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

async function uploadToPinata(data, jwt) {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
  formData.append('file', blob, `sanctum-vault-${Date.now()}`);
  
  const metadata = JSON.stringify({
    name: `sanctum-vault-${Date.now()}`,
    keyvalues: { app: 'sanctum', type: 'vault' }
  });
  formData.append('pinataMetadata', metadata);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}` },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return { cid: result.IpfsHash };
}

async function uploadToFilebase(data, credentials) {
  // Implement Filebase S3 upload with proper signing
  const { accessKey, secretKey, bucket = 'sanctum-vaults' } = credentials;
  
  const fileName = `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url = `https://s3.filebase.com/${bucket}/${fileName}`;
  
  // Create AWS Signature V4
  const region = 'us-east-1';
  const service = 's3';
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  const payloadHash = await sha256(new Uint8Array(data));
  
  const headers = {
    'host': 's3.filebase.com',
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'content-type': 'application/octet-stream'
  };
  
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(k => `${k.toLowerCase()}:${headers[k]}\n`)
    .join('');
    
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(k => k.toLowerCase())
    .join(';');
    
  const canonicalRequest = [
    'PUT',
    `/${bucket}/${fileName}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(new TextEncoder().encode(canonicalRequest))
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signature = await hmacSha256(signingKey, stringToSign);
  
  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: new Uint8Array(data)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Filebase upload failed: ${response.status} - ${error}`);
  }
  
  // Extract CID from response headers
  const cid = response.headers.get('x-amz-meta-cid') || fileName;
  return { cid };
}

async function sha256(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key, dateStamp, region, service) {
  const kDate = await hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256Raw(kDate, region);
  const kService = await hmacSha256Raw(kRegion, service);
  return await hmacSha256Raw(kService, 'aws4_request');
}

async function hmacSha256Raw(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}