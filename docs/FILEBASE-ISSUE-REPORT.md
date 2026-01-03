# Filebase Integration Issue Report

**Date**: 2024
**Status**: ❌ CORS Error - Blocking Production Use
**Priority**: HIGH

---

## 🔴 Current Error

```
Access to fetch at 'https://s3.filebase.com/sanctum-vaults' from origin 'https://sanctum-vault.pages.dev' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

Failed to load resource: net::ERR_FAILED
```

**Error Location**: `app/create/page.tsx:1`
**Trigger**: Attempting to upload vault data to Filebase S3 API from browser

---

## 📋 Root Cause Analysis

### Problem
Filebase S3 API does not allow direct browser requests due to missing CORS headers. When the browser attempts to make a PUT request to `https://s3.filebase.com/sanctum-vaults/{filename}`, it first sends an OPTIONS preflight request. Filebase S3 does not respond with the required `Access-Control-Allow-Origin` header, causing the browser to block the actual PUT request.

### Why This Happens
1. **Browser Security**: Modern browsers enforce CORS policy for cross-origin requests
2. **S3 API Default**: AWS S3-compatible APIs (including Filebase) do not enable CORS by default
3. **Client-Side Architecture**: Sanctum performs all encryption in the browser, requiring direct S3 access

---

## 📁 Affected Files

### 1. `/lib/storage/filebase.ts` (Primary Issue)

**Current Implementation**:
```typescript
async upload(data: Uint8Array): Promise<string> {
  // ... key derivation and signing ...
  
  const url = `https://s3.filebase.com${path}`;
  const response = await fetch(url, {  // ❌ CORS blocked here
    method: "PUT",
    headers,
    body: data as BodyInit,
  });
  
  // ...
}
```

**Line 192**: Direct fetch to `s3.filebase.com` fails due to CORS

**Issues**:
- No CORS headers from Filebase
- Browser blocks preflight OPTIONS request
- Cannot complete PUT request for upload

---

### 2. `/app/create/page.tsx` (User-Facing Error)

**Line 456-462**: Filebase credentials handling
```typescript
ipfsCredentials:
  provider === "pinata"
    ? {
        provider: "pinata",
        pinataJWT: pinataJWT.trim(),
      }
    : {
        provider: "filebase",
        filebaseToken: btoa(`${filebaseAccessKey.trim()}:${filebaseSecretKey.trim()}`),
      },
```

**Issues**:
- Credentials are correct but cannot be used due to CORS
- Error message "Failed to create vault: Failed to fetch" is not user-friendly
- No fallback or alternative upload method

---

### 3. `/lib/storage/uploader.ts` (Service Layer)

**Current Flow**:
```typescript
export async function uploadToIPFS(
  data: Uint8Array,
  credentials: IPFSCredentials,
): Promise<string> {
  if (credentials.provider === "pinata") {
    const client = new PinataClient(credentials.pinataJWT);
    return client.upload(data);
  } else {
    const client = new FilebaseClient(credentials.filebaseToken);
    return client.upload(data);  // ❌ Fails here
  }
}
```

**Issues**:
- No error handling for CORS failures
- No retry logic or fallback provider
- Throws generic error to user

---

## 🔧 Solution Options

### ✅ Option 1: Cloudflare Worker Proxy (RECOMMENDED)

**Pros**:
- No bucket CORS configuration needed
- Works immediately
- Maintains client-side encryption
- Free on Cloudflare Pages

**Implementation**:
1. Create proxy at `/functions/api/filebase-proxy.ts` (already created)
2. Update `filebase.ts` to use proxy endpoint
3. Deploy with existing Cloudflare Pages setup

**Code Changes Required**:

**File**: `/lib/storage/filebase.ts`
```typescript
async upload(data: Uint8Array): Promise<string> {
  // ... signing logic ...
  
  const filebaseUrl = `https://s3.filebase.com${path}`;
  
  // Use proxy to bypass CORS
  const proxyUrl = "/api/filebase-proxy";
  const proxyHeaders: Record<string, string> = {
    "X-Filebase-URL": filebaseUrl,
    "X-Filebase-Method": "PUT",
    ...headers,
  };

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: proxyHeaders,
    body: data as BodyInit,
  });
  
  // ... error handling ...
}
```

**File**: `/functions/api/filebase-proxy.ts` (already created)
- Forwards requests to Filebase with CORS headers
- Preserves AWS signature headers
- Returns CID to client

---

### Option 2: Configure Bucket CORS

**Pros**:
- Direct S3 access (no proxy)
- Standard S3 approach

**Cons**:
- Requires AWS CLI or S3 tools
- User must configure their own bucket
- More complex setup for users

**Steps**:
1. Install AWS CLI: `npm install -g aws-cli`
2. Configure credentials:
```bash
aws configure --profile filebase
# Access Key: <user-key>
# Secret Key: <user-secret>
# Region: us-east-1
```

3. Create `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://sanctum-vault.pages.dev", "http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-cid"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

4. Apply CORS:
```bash
aws s3api put-bucket-cors \
  --bucket sanctum-vaults \
  --cors-configuration file://cors.json \
  --endpoint-url https://s3.filebase.com \
  --profile filebase
```

**Issues**:
- Too complex for average users
- Requires technical knowledge
- Not suitable for production app

---

### Option 3: Server-Side Upload API

**Pros**:
- Complete control over upload process
- Can add rate limiting, validation
- Better error handling

**Cons**:
- ❌ **VIOLATES ZERO-TRUST ARCHITECTURE**
- Server sees unencrypted data
- Requires backend infrastructure
- Against Sanctum's security model

**Status**: ❌ REJECTED - Breaks core security promise

---

## 🎯 Recommended Implementation

### Step 1: Update Filebase Client

**File**: `/lib/storage/filebase.ts`

Replace `upload()` method (lines 172-213):

```typescript
async upload(data: Uint8Array): Promise<string> {
  if (!data || data.length === 0) throw new Error("Data cannot be empty");

  const fileName = `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `/${this.bucketName}/${fileName}`;

  const headers = await this.signRequest(
    "PUT",
    path,
    {
      "Content-Type": "application/octet-stream",
    },
    data,
  );

  const filebaseUrl = `https://s3.filebase.com${path}`;
  
  // Use proxy to bypass CORS
  const proxyUrl = "/api/filebase-proxy";
  const proxyHeaders: Record<string, string> = {
    "X-Filebase-URL": filebaseUrl,
    "X-Filebase-Method": "PUT",
    ...headers,
  };

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: proxyHeaders,
    body: data as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    if (response.status === 404) {
      throw new Error(`Bucket '${this.bucketName}' not found. Create it at filebase.com first.`);
    }
    if (response.status === 403) {
      throw new Error("Invalid Filebase credentials. Check your access key and secret key.");
    }
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  const cid = response.headers.get("x-amz-meta-cid");
  if (!cid) {
    throw new Error("No CID returned from Filebase");
  }

  return cid;
}
```

### Step 2: Update getStorageUsage() Method

**File**: `/lib/storage/filebase.ts`

Replace `getStorageUsage()` method (lines 215-237):

```typescript
async getStorageUsage(): Promise<{
  used: number;
  limit: number;
  percentage: number;
}> {
  const path = `/${this.bucketName}`;
  const headers = await this.signRequest("GET", path, {});

  const filebaseUrl = `https://s3.filebase.com${path}`;
  const proxyUrl = "/api/filebase-proxy";
  const proxyHeaders: Record<string, string> = {
    "X-Filebase-URL": filebaseUrl,
    "X-Filebase-Method": "GET",
    ...headers,
  };

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: proxyHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to list bucket: ${response.statusText}`);
  }

  const xml = await response.text();
  const sizeMatches = xml.matchAll(/<Size>(\d+)<\/Size>/g);
  let used = 0;
  for (const match of sizeMatches) {
    used += parseInt(match[1], 10);
  }

  const limit = 5368709120; // 5GB free tier
  return { used, limit, percentage: (used / limit) * 100 };
}
```

### Step 3: Verify Proxy File Exists

**File**: `/functions/api/filebase-proxy.ts` (already created)

Ensure this file exists with correct implementation.

### Step 4: Deploy

```bash
npm run build
npx wrangler pages deploy out --project-name=sanctum-vault --branch=main --commit-dirty=true
```

---

## 🧪 Testing Plan

### Test 1: Filebase Upload
1. Go to https://sanctum-vault.pages.dev/create
2. Select "Filebase" provider
3. Enter valid credentials
4. Upload small file (< 1MB)
5. Verify vault creation succeeds
6. Check CID is returned

### Test 2: Error Handling
1. Enter invalid credentials
2. Verify error message: "Invalid Filebase credentials"
3. Enter non-existent bucket
4. Verify error message: "Bucket not found"

### Test 3: Large File Upload
1. Upload 20MB file
2. Verify progress indicator works
3. Verify upload completes successfully

### Test 4: Storage Quota
1. Check storage quota displays correctly
2. Verify percentage calculation
3. Test warning at 80% usage

---

## 📊 Current Code State

### Working Components ✅
- AWS Signature V4 signing (lines 28-88)
- Token parsing and validation (lines 10-26)
- Download functionality with gateway fallbacks (lines 239-310)
- Credential storage and encryption

### Broken Components ❌
- Direct S3 upload (line 192) - CORS blocked
- Storage quota check (line 222) - CORS blocked
- Error messages not user-friendly

### Untested Components ⚠️
- Proxy integration (not yet implemented)
- Fallback to Pinata on Filebase failure
- Rate limiting on proxy

---

## 🔐 Security Considerations

### Current Security ✅
- Client-side encryption maintained
- AWS signatures prevent tampering
- Credentials never sent to Sanctum servers
- Zero-trust architecture preserved

### Proxy Security ✅
- Proxy only forwards signed requests
- Cannot decrypt vault data
- No credential storage on proxy
- CORS headers added safely

### Potential Risks ⚠️
- Proxy could log requests (mitigation: no logging in worker)
- Proxy could be DDoS target (mitigation: Cloudflare rate limiting)
- Malicious proxy could intercept data (mitigation: use HTTPS, verify signatures)

---

## 📝 Implementation Checklist

- [x] Create proxy worker (`/functions/api/filebase-proxy.ts`)
- [ ] Update `filebase.ts` upload method
- [ ] Update `filebase.ts` getStorageUsage method
- [ ] Add better error messages in `create/page.tsx`
- [ ] Test proxy locally with `npm run dev`
- [ ] Deploy to production
- [ ] Test with real Filebase credentials
- [ ] Update documentation
- [ ] Add proxy monitoring/logging (optional)

---

## 🚀 Deployment Steps

1. **Update Code**:
```bash
# Apply changes to filebase.ts
# Verify proxy file exists
```

2. **Build**:
```bash
npm run build
```

3. **Deploy**:
```bash
npx wrangler pages deploy out --project-name=sanctum-vault --branch=main --commit-dirty=true
```

4. **Test**:
```bash
# Visit https://sanctum-vault.pages.dev/create
# Test Filebase upload
# Verify no CORS errors
```

---

## 📚 References

- **Filebase Docs**: https://docs.filebase.com/
- **AWS S3 CORS**: https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **CORS Specification**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

## 💡 Alternative: Disable Filebase Temporarily

If proxy implementation is delayed, consider:

1. **Remove Filebase option from UI**:
```typescript
// In create/page.tsx, remove Filebase button
// Only show Pinata option
```

2. **Add "Coming Soon" message**:
```typescript
<p>Filebase support coming soon (CORS configuration required)</p>
```

3. **Focus on Pinata** (which works perfectly)

---

## 🎯 Success Criteria

- [ ] No CORS errors in browser console
- [ ] Filebase uploads complete successfully
- [ ] CID returned and vault created
- [ ] Storage quota displays correctly
- [ ] Error messages are user-friendly
- [ ] Download from Filebase works
- [ ] Zero-trust architecture maintained

---

**Status**: Ready for implementation
**Estimated Time**: 30 minutes
**Risk Level**: Low (proxy is simple, well-tested pattern)
