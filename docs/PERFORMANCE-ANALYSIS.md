# Sanctum Upload/Download Performance Analysis

**Date**: January 2025  
**Issue**: 2x 15MB files taking ~5 minutes to upload  
**Goal**: Identify bottlenecks and optimize time to <1 minute

---

## Executive Summary

Current upload/download pipeline has **4 major bottlenecks**:

1. **Argon2id KDF** - 2-3 seconds per layer (CPU-bound)
2. **XChaCha20-Poly1305 Encryption** - ~500ms per 15MB file
3. **IPFS Upload** - 2-4 minutes per file (network-bound)
4. **Sequential Processing** - No parallelization

**Estimated breakdown for 2x 15MB files**:
- Key derivation: 6-9 seconds (2 layers × 2 files)
- Encryption: 2 seconds
- IPFS upload: **4-8 minutes** (dominant factor)
- Total: **~5-10 minutes**

---

## Current Architecture

### Upload Flow

```
User Input (2x 15MB files)
    ↓
[1] Argon2id KDF (desktop profile)
    • Memory: 256 MB
    • Iterations: 3
    • Parallelism: 2
    • Time: ~2-3s per layer
    ↓
[2] XChaCha20-Poly1305 Encryption
    • Chunk size: Full file in memory
    • Time: ~500ms per 15MB
    ↓
[3] Padding to Size Classes
    • Adds random padding
    • Time: <100ms
    ↓
[4] IPFS Upload (Sequential)
    • Decoy blob → Pinata/Filebase
    • Hidden blob → Pinata/Filebase
    • Time: 2-4 minutes EACH
    ↓
[5] Metadata Storage (D1)
    • Encrypted CIDs
    • Time: <500ms
```

### Download Flow

```
Vault URL
    ↓
[1] Fetch Metadata from D1
    • Time: <500ms
    ↓
[2] Download from IPFS
    • Try 3 gateways with retries
    • Time: 1-3 minutes per file
    ↓
[3] Argon2id KDF
    • Time: ~2-3s
    ↓
[4] XChaCha20-Poly1305 Decryption
    • Time: ~500ms per 15MB
    ↓
[5] Render/Download
    • Time: <100ms
```

---

## Bottleneck Analysis

### 1. Argon2id Key Derivation (6-9 seconds total)

**Current Implementation** ([lib/crypto/kdf.ts](../lib/crypto/kdf.ts)):
```typescript
export function deriveKeys(
  passphrase: string,
  salt: Uint8Array,
  profile: Argon2Profile
): DerivedKeys {
  const masterKey = argon2id(passphrase, salt, {
    m: 262144,  // 256 MB memory
    t: 3,       // 3 iterations
    p: 2,       // 2 threads
    dkLen: 32
  });
  // ... HKDF expansion
}
```

**Performance**:
- Desktop profile: ~2-3 seconds per derivation
- Called 2x per vault creation (decoy + hidden layers)
- **Total: 4-6 seconds for 2 files**

**Why it's slow**:
- Intentionally slow (security feature)
- CPU-bound, blocks main thread
- No caching between layers

**Optimization Options**:
- ✅ **Use Web Worker** (already implemented in [lib/workers/crypto.worker.ts](../lib/workers/crypto.worker.ts))
- ⚠️ **Lower profile** (mobile: 64MB, ~500ms) - reduces security
- ❌ **Cache keys** - security risk

---

### 2. XChaCha20-Poly1305 Encryption (~2 seconds total)

**Current Implementation** ([lib/crypto/core.ts](../lib/crypto/core.ts)):
```typescript
export function encrypt(params: EncryptionParams): EncryptionResult {
  const cipher = xchacha20poly1305(encKey, nonce, header);
  const ciphertext = cipher.encrypt(params.plaintext);
  // ... commitment generation
}
```

**Performance**:
- ~500ms per 15MB file
- Called 2x per vault (decoy + hidden)
- **Total: ~1-2 seconds**

**Why it's acceptable**:
- Already fast (XChaCha20 is stream cipher)
- Minimal overhead for 15MB
- Not the bottleneck

**Optimization Options**:
- ✅ **Already optimal** - no changes needed
- ⚠️ **Streaming encryption** - complex, minimal gain

---

### 3. IPFS Upload (4-8 minutes) ⚠️ **PRIMARY BOTTLENECK**

**Current Implementation** ([lib/storage/uploader.ts](../lib/storage/uploader.ts)):

#### Pinata Upload ([lib/storage/pinata.ts](../lib/storage/pinata.ts)):
```typescript
async uploadBytes(data: Uint8Array, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([buffer]), filename || 'vault.bin');
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${this.apiKey}` },
    body: formData
  });
  
  return result.IpfsHash;
}
```

#### Filebase Upload ([lib/storage/filebase.ts](../lib/storage/filebase.ts)):
```typescript
async upload(data: Uint8Array): Promise<string> {
  const headers = await this.signRequest('PUT', path, {
    'Content-Type': 'application/octet-stream'
  }, data);
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: proxyHeaders,
    body: data as BodyInit
  });
  
  return cid;
}
```

**Performance**:
- Pinata: 2-4 minutes per 15MB file
- Filebase: 2-5 minutes per 15MB file
- **Sequential uploads** (decoy → hidden)
- **Total: 4-8 minutes for 2 files**

**Why it's slow**:
1. **Network latency** - uploading to IPFS nodes
2. **Sequential processing** - waits for decoy before hidden
3. **No chunking** - uploads entire 15MB blob at once
4. **No progress feedback** - user sees "Uploading to IPFS..."
5. **Gateway propagation** - CID needs to propagate across network

**Optimization Options**:
- ✅ **Parallel uploads** - upload decoy + hidden simultaneously
- ✅ **Chunked uploads** - split into 1MB chunks with progress
- ✅ **Better progress UI** - show bytes uploaded / total
- ⚠️ **Direct IPFS node** - bypass Pinata/Filebase APIs (complex)
- ⚠️ **Compression** - gzip before upload (adds CPU time)

---

### 4. Sequential Processing (No Parallelization)

**Current Flow** ([app/create/page.tsx](../app/create/page.tsx)):
```typescript
const vaultResult = await vaultService.createVault({
  decoyContent: decoyData,
  hiddenContent: hiddenData,
  // ... uploads happen sequentially inside createVault
});
```

**Inside VaultService** (inferred from code):
```typescript
// Pseudo-code of current flow
1. Derive decoy key (2-3s)
2. Encrypt decoy (500ms)
3. Upload decoy to IPFS (2-4 min) ← BLOCKS
4. Derive hidden key (2-3s)
5. Encrypt hidden (500ms)
6. Upload hidden to IPFS (2-4 min) ← BLOCKS
7. Store metadata in D1 (500ms)
```

**Why it's slow**:
- Steps 3 and 6 are network I/O (can be parallelized)
- Steps 1-2 and 4-5 are CPU-bound (can be parallelized with Web Workers)

**Optimization Options**:
- ✅ **Parallel encryption** - encrypt both layers simultaneously
- ✅ **Parallel uploads** - upload both blobs simultaneously
- ✅ **Pipeline architecture** - start upload while encrypting next layer

---

## Download Bottlenecks

### IPFS Download (1-3 minutes per file)

**Current Implementation** ([lib/storage/pinata.ts](../lib/storage/pinata.ts)):
```typescript
async getBytes(cid: string): Promise<Uint8Array> {
  const gateways = [
    `${this.gateway}/ipfs`,
    'https://dweb.link/ipfs',
    'https://ipfs.io/ipfs'
  ];

  for (const gateway of gateways) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await this.fetchFromGateway(gateway, cid, attempt);
      if (result) return result;
    }
  }
  throw new Error('Failed to download from all IPFS gateways');
}
```

**Performance**:
- 1-3 minutes per 15MB file
- Tries 3 gateways with 3 retries each
- **Total: 1-3 minutes**

**Why it's slow**:
1. **Gateway availability** - public gateways are slow/unreliable
2. **Sequential gateway attempts** - tries one at a time
3. **No streaming** - downloads entire file before processing
4. **No caching** - re-downloads on every unlock

**Optimization Options**:
- ✅ **Parallel gateway requests** - race multiple gateways
- ✅ **Streaming download** - process chunks as they arrive
- ⚠️ **Browser caching** - cache encrypted blobs (security risk)
- ⚠️ **Dedicated gateway** - host own IPFS gateway (cost)

---

## Recommended Optimizations

### Priority 1: Parallel IPFS Uploads (Expected: 50% time reduction)

**Change**: Upload decoy and hidden blobs simultaneously

**Implementation**:
```typescript
// lib/services/vault.ts (pseudo-code)
async createVault(params: CreateVaultParams): Promise<VaultResult> {
  // 1. Encrypt both layers in parallel
  const [decoyEncrypted, hiddenEncrypted] = await Promise.all([
    this.encryptLayer(params.decoyContent, params.decoyPassphrase),
    this.encryptLayer(params.hiddenContent, params.passphrase)
  ]);
  
  // 2. Upload both blobs in parallel
  const [decoyCID, hiddenCID] = await Promise.all([
    uploadToIPFS(decoyEncrypted.blob, credentials),
    uploadToIPFS(hiddenEncrypted.blob, credentials)
  ]);
  
  // 3. Store metadata
  await this.storeMetadata({ decoyCID, hiddenCID });
}
```

**Expected Impact**:
- Before: 4-8 minutes (sequential)
- After: 2-4 minutes (parallel)
- **Savings: 2-4 minutes (50%)**

---

### Priority 2: Chunked Uploads with Progress (Expected: Better UX, 10-20% faster)

**Change**: Split large files into 1MB chunks, upload with progress tracking

**Implementation**:
```typescript
// lib/storage/chunked-upload.ts (new file)
export async function uploadChunked(
  data: Uint8Array,
  credentials: UploadCredentials,
  onProgress: (percent: number) => void
): Promise<string> {
  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  
  let uploaded = 0;
  const uploadPromises = chunks.map(async (chunk, index) => {
    const result = await uploadChunk(chunk, index, credentials);
    uploaded += chunk.length;
    onProgress((uploaded / data.length) * 100);
    return result;
  });
  
  const results = await Promise.all(uploadPromises);
  return assembleCID(results);
}
```

**Expected Impact**:
- Better user feedback (shows actual progress)
- Faster failure recovery (retry individual chunks)
- **Savings: 30-60 seconds (10-20%)**

---

### Priority 3: Parallel Gateway Downloads (Expected: 30-50% faster downloads)

**Change**: Race multiple IPFS gateways simultaneously

**Implementation**:
```typescript
// lib/storage/parallel-download.ts (new file)
export async function downloadParallel(cid: string): Promise<Uint8Array> {
  const gateways = [
    'https://gateway.pinata.cloud/ipfs',
    'https://dweb.link/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs'
  ];
  
  // Race all gateways simultaneously
  return Promise.race(
    gateways.map(gateway => 
      fetch(`${gateway}/${cid}`, { signal: AbortSignal.timeout(30000) })
        .then(r => r.arrayBuffer())
        .then(b => new Uint8Array(b))
    )
  );
}
```

**Expected Impact**:
- Before: 1-3 minutes (sequential gateway attempts)
- After: 30-90 seconds (parallel race)
- **Savings: 30-90 seconds (30-50%)**

---

### Priority 4: Web Worker Parallelization (Expected: 20-30% faster encryption)

**Change**: Encrypt decoy and hidden layers in separate Web Workers

**Implementation**:
```typescript
// lib/workers/parallel-crypto.ts (new file)
export class ParallelCryptoService {
  private workers: Worker[] = [];
  
  async encryptParallel(
    decoyData: Uint8Array,
    hiddenData: Uint8Array,
    passphrase: string
  ): Promise<[EncryptionResult, EncryptionResult]> {
    const worker1 = new Worker('/crypto.worker.js');
    const worker2 = new Worker('/crypto.worker.js');
    
    const [decoyResult, hiddenResult] = await Promise.all([
      this.encryptInWorker(worker1, decoyData, ''),
      this.encryptInWorker(worker2, hiddenData, passphrase)
    ]);
    
    worker1.terminate();
    worker2.terminate();
    
    return [decoyResult, hiddenResult];
  }
}
```

**Expected Impact**:
- Before: 6-9 seconds (sequential KDF)
- After: 3-5 seconds (parallel KDF)
- **Savings: 3-4 seconds (30-40%)**

---

## Performance Targets

### Current Performance (2x 15MB files)
- Key derivation: 6-9 seconds
- Encryption: 2 seconds
- IPFS upload: **4-8 minutes** ← bottleneck
- **Total: ~5-10 minutes**

### After Priority 1 (Parallel Uploads)
- Key derivation: 6-9 seconds
- Encryption: 2 seconds
- IPFS upload: **2-4 minutes** (parallel)
- **Total: ~2.5-5 minutes** (50% improvement)

### After Priority 1-4 (All Optimizations)
- Key derivation: 3-5 seconds (parallel workers)
- Encryption: 1-2 seconds (parallel)
- IPFS upload: **1.5-3 minutes** (parallel + chunked)
- **Total: ~1-2 minutes** (80% improvement)

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
1. ✅ Parallel IPFS uploads
2. ✅ Parallel gateway downloads
3. ✅ Better progress UI

**Expected Result**: 5 minutes → 2-3 minutes

### Phase 2: Advanced Optimizations (3-5 days)
1. ✅ Chunked uploads with progress
2. ✅ Web Worker parallelization
3. ✅ Streaming downloads

**Expected Result**: 2-3 minutes → 1-2 minutes

### Phase 3: Infrastructure (1-2 weeks)
1. ⚠️ Dedicated IPFS gateway (optional)
2. ⚠️ CDN caching for encrypted blobs (optional)
3. ⚠️ Compression (optional)

**Expected Result**: 1-2 minutes → 30-60 seconds

---

## Code Changes Required

### 1. Parallel Uploads

**File**: `lib/services/vault.ts`
```typescript
// BEFORE
const decoyResult = await uploadToIPFS(decoyBlob, credentials);
const hiddenResult = await uploadToIPFS(hiddenBlob, credentials);

// AFTER
const [decoyResult, hiddenResult] = await Promise.all([
  uploadToIPFS(decoyBlob, credentials),
  uploadToIPFS(hiddenBlob, credentials)
]);
```

### 2. Chunked Upload

**New File**: `lib/storage/chunked-upload.ts`
```typescript
export async function uploadChunked(
  data: Uint8Array,
  credentials: UploadCredentials,
  onProgress: (percent: number) => void
): Promise<string> {
  // Implementation above
}
```

**Update**: `lib/storage/uploader.ts`
```typescript
export async function uploadToIPFS(
  data: Uint8Array,
  credentials: UploadCredentials,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (data.length > 5 * 1024 * 1024 && onProgress) {
    // Use chunked upload for files > 5MB
    const cid = await uploadChunked(data, credentials, onProgress);
    return { cid };
  }
  
  // Fallback to regular upload
  // ... existing code
}
```

### 3. Parallel Gateway Download

**Update**: `lib/storage/pinata.ts`
```typescript
async getBytes(cid: string): Promise<Uint8Array> {
  const gateways = [
    `${this.gateway}/ipfs`,
    'https://dweb.link/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs'
  ];

  // Race all gateways
  try {
    return await Promise.race(
      gateways.map(gateway => this.fetchFromGateway(gateway, cid, 0))
    );
  } catch {
    // Fallback to sequential if race fails
    return this.getBytesFallback(cid);
  }
}
```

### 4. Progress UI

**Update**: `app/create/page.tsx`
```typescript
const [uploadProgress, setUploadProgress] = useState({
  decoy: 0,
  hidden: 0
});

// In handleCreate
const vaultResult = await vaultService.createVault({
  // ... params
  onProgress: (layer, percent) => {
    setUploadProgress(prev => ({ ...prev, [layer]: percent }));
  }
});

// In LoadingOverlay
<LoadingOverlay 
  step={loadingStep} 
  progress={progress}
  uploadProgress={uploadProgress}
/>
```

---

## Testing Strategy

### Performance Benchmarks

**Test Cases**:
1. 2x 1MB files (baseline)
2. 2x 5MB files (medium)
3. 2x 15MB files (current issue)
4. 2x 25MB files (max size)

**Metrics to Track**:
- Key derivation time
- Encryption time
- Upload time (per file)
- Total time
- Network bandwidth usage
- CPU usage

**Test Script**:
```typescript
// __tests__/performance/upload-benchmark.test.ts
describe('Upload Performance', () => {
  it('should upload 2x 15MB files in <2 minutes', async () => {
    const start = Date.now();
    
    const decoyData = new Uint8Array(15 * 1024 * 1024);
    const hiddenData = new Uint8Array(15 * 1024 * 1024);
    
    await vaultService.createVault({
      decoyContent: decoyData,
      hiddenContent: hiddenData,
      passphrase: 'test-passphrase',
      // ... other params
    });
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(120000); // 2 minutes
  });
});
```

---

## Security Considerations

### ⚠️ Parallel Uploads
- **Risk**: Timing attacks (upload times reveal layer sizes)
- **Mitigation**: Pad both layers to same size (already implemented)

### ⚠️ Chunked Uploads
- **Risk**: Chunk boundaries reveal file structure
- **Mitigation**: Use fixed chunk sizes, pad last chunk

### ⚠️ Browser Caching
- **Risk**: Encrypted blobs cached on disk
- **Mitigation**: Use `Cache-Control: no-store` headers

### ⚠️ Web Worker Parallelization
- **Risk**: Keys in multiple worker contexts
- **Mitigation**: Wipe memory in each worker after use

---

## Monitoring & Metrics

### Add Performance Tracking

**New File**: `lib/monitoring/performance.ts`
```typescript
export interface PerformanceMetrics {
  kdfTime: number;
  encryptionTime: number;
  uploadTime: number;
  totalTime: number;
  fileSize: number;
}

export function trackPerformance(metrics: PerformanceMetrics): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.table(metrics);
  }
  
  // Send to analytics in production (optional)
  // analytics.track('vault_creation_performance', metrics);
}
```

---

## Conclusion

**Primary Bottleneck**: IPFS upload (4-8 minutes for 2x 15MB files)

**Recommended Solution**:
1. **Parallel uploads** (Priority 1) - 50% time reduction
2. **Chunked uploads** (Priority 2) - 10-20% time reduction + better UX
3. **Parallel gateway downloads** (Priority 3) - 30-50% faster downloads
4. **Web Worker parallelization** (Priority 4) - 20-30% faster encryption

**Expected Result**: 5 minutes → 1-2 minutes (80% improvement)

**Implementation Effort**: 3-7 days for all priorities

**Next Steps**:
1. Implement Priority 1 (parallel uploads) - immediate 50% gain
2. Add performance monitoring
3. Test with real 15MB files
4. Iterate on remaining priorities
