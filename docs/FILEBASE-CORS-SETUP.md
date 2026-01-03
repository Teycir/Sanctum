# Filebase CORS Configuration

## Problem
Browser requests to Filebase S3 API are blocked by CORS policy.

## Solution
Configure CORS on your Filebase bucket using AWS CLI or S3 Browser.

### Option 1: Using AWS CLI

1. Install AWS CLI:
```bash
npm install -g aws-cli
```

2. Configure AWS CLI with Filebase credentials:
```bash
aws configure --profile filebase
# AWS Access Key ID: <your-filebase-access-key>
# AWS Secret Access Key: <your-filebase-secret-key>
# Default region: us-east-1
# Default output format: json
```

3. Create CORS configuration file `cors.json`:
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

4. Apply CORS configuration:
```bash
aws s3api put-bucket-cors \
  --bucket sanctum-vaults \
  --cors-configuration file://cors.json \
  --endpoint-url https://s3.filebase.com \
  --profile filebase
```

### Option 2: Using Filebase Console

1. Go to https://console.filebase.com
2. Select your bucket (`sanctum-vaults`)
3. Go to "Settings" → "CORS Configuration"
4. Add CORS rule:
   - Allowed Origins: `https://sanctum-vault.pages.dev`
   - Allowed Methods: `GET, PUT, POST, DELETE, HEAD`
   - Allowed Headers: `*`
   - Expose Headers: `ETag, x-amz-meta-cid`

### Option 3: Use Cloudflare Worker Proxy (Recommended)

Since direct browser access has CORS issues, create a Cloudflare Worker proxy:

See `functions/api/filebase-proxy.ts` for implementation.

## Verification

Test CORS configuration:
```bash
curl -X OPTIONS https://s3.filebase.com/sanctum-vaults \
  -H "Origin: https://sanctum-vault.pages.dev" \
  -H "Access-Control-Request-Method: PUT" \
  -v
```

Should return:
```
Access-Control-Allow-Origin: https://sanctum-vault.pages.dev
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
```
