// ============================================================================
// FILEBASE IPFS CLIENT (S3-Compatible with AWS Signature V4)
// ============================================================================

export class FilebaseClient {
  constructor(
    private readonly accessKey: string,
    private readonly secretKey: string,
    private readonly bucket: string = 'sanctum-vaults'
  ) {}

  private async signRequest(method: string, path: string, headers: Record<string, string>, body?: Uint8Array): Promise<Record<string, string>> {
    const region = 'us-east-1';
    const service = 's3';
    const host = 's3.filebase.com';
    
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replaceAll('-', '');
    const amzDate = now.toISOString().replaceAll(/[:-]|\.\d{3}/g, '');
    
    const payloadHash = await this.sha256(body || new Uint8Array());
    
    const signedHeaders: Record<string, string> = {
      ...headers,
      'host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    };
    
    const canonicalHeaders = Object.keys(signedHeaders)
      .sort((a, b) => a.localeCompare(b))
      .map(k => `${k.toLowerCase()}:${signedHeaders[k]}\n`)
      .join('');
    
    const signedHeadersList = Object.keys(signedHeaders)
      .sort((a, b) => a.localeCompare(b))
      .map(k => k.toLowerCase())
      .join(';');
    
    const canonicalRequest = [
      method,
      path,
      '',
      canonicalHeaders,
      signedHeadersList,
      payloadHash
    ].join('\n');
    
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await this.sha256(new TextEncoder().encode(canonicalRequest))
    ].join('\n');
    
    const signingKey = await this.getSignatureKey(this.secretKey, dateStamp, region, service);
    const signature = await this.hmacSha256(signingKey, stringToSign);
    
    signedHeaders['Authorization'] = `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`;
    
    return signedHeaders;
  }
  
  private async sha256(data: Uint8Array): Promise<string> {
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('SharedArrayBuffer not supported for hashing');
    }
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private async hmacSha256(key: Uint8Array | string, data: string): Promise<string> {
    const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    const keyBuffer = keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength);
    if (!(keyBuffer instanceof ArrayBuffer)) {
      throw new TypeError('SharedArrayBuffer not supported for HMAC');
    }
    const dataBuffer = new TextEncoder().encode(data);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private async getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
    const kDate = await this.hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp);
    const kRegion = await this.hmacSha256Raw(kDate, region);
    const kService = await this.hmacSha256Raw(kRegion, service);
    const kSigning = await this.hmacSha256Raw(kService, 'aws4_request');
    return kSigning;
  }

  private async hmacSha256Raw(key: Uint8Array, data: string): Promise<Uint8Array> {
    const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength);
    if (!(keyBuffer instanceof ArrayBuffer)) {
      throw new TypeError('SharedArrayBuffer not supported for HMAC');
    }
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(signature);
  }

  async upload(data: Uint8Array): Promise<string> {
    const fileName = `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `/${this.bucket}/${fileName}`;
    
    const headers = await this.signRequest('PUT', path, {
      'Content-Type': 'application/octet-stream'
    }, data);

    const response = await fetch(`https://s3.filebase.com${path}`, {
      method: 'PUT',
      headers,
      body: data as BodyInit
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Filebase upload failed: ${response.statusText} - ${error}`);
    }

    const cid = response.headers.get('x-amz-meta-cid');
    if (!cid) {
      throw new Error('No CID returned from Filebase');
    }

    return cid;
  }

  async download(cid: string): Promise<Uint8Array> {
    const gateways = [
      `https://ipfs.filebase.io/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];

    const errors: string[] = [];
    
    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway);
        if (response.ok) {
          return new Uint8Array(await response.arrayBuffer());
        }
        errors.push(`${gateway}: ${response.status} ${response.statusText}`);
      } catch (error) {
        errors.push(`${gateway}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    throw new Error(`Failed to download from all IPFS gateways:\n${errors.join('\n')}`);
  }
}
