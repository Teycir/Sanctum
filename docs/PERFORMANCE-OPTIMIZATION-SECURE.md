# Sanctum Performance Optimization (OpSec-Compliant)

**CRITICAL**: All optimizations MUST maintain RAM-only storage and zero-trust architecture.

---

## ✅ APPROVED Optimizations (No OpSec Risk)

### 1. Parallel File Uploads (HIGH PRIORITY)

**Status**: ✅ SAFE - No credential persistence

**Implementation**:
```typescript
// lib/services/vault.ts
async createVault(params: CreateVaultParams): Promise<VaultResult> {
  // Encrypt both layers in parallel
  const [decoyEncrypted, hiddenEncrypted] = await Promise.all([
    this.encryptLayer(params.decoyContent, params.decoyPassphrase),
    this.encryptLayer(params.hiddenContent, params.passphrase)
  ]);
  
  // Upload both blobs in parallel (NO CACHING)
  const [decoyCID, hiddenCID] = await Promise.all([
    uploadToIPFS(decoyEncrypted.blob, params.ipfsCredentials), // RAM-only
    uploadToIPFS(hiddenEncrypted.blob, params.ipfsCredentials)  // RAM-only
  ]);
  
  return { decoyCID, hiddenCID };
}
```

**Expected Improvement**: 50-60% faster uploads  
**OpSec Impact**: ✅ None - credentials stay in RAM

---

### 2. Chunked Uploads for Large Files (HIGH PRIORITY)

**Status**: ✅ SAFE - No data persistence

**Implementation**:
```typescript
// lib/storage/chunked-upload.ts
export async function uploadChunked(
  data: Uint8Array,
  credentials: UploadCredentials, // RAM-only, not cached
  onProgress: (percent: number) => void
): Promise<string> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  
  // Upload chunks in parallel (batch of 3)
  const BATCH_SIZE = 3;
  const results: string[] = [];
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((chunk, idx) => uploadChunk(chunk, i + idx, credentials))
    );
    results.push(...batchResults);
    onProgress(((i + batch.length) / chunks.length) * 100);
  }
  
  return assembleCID(results);
}
```

**Expected Improvement**: 20-30% faster, eliminates timeouts  
**OpSec Impact**: ✅ None - chunks not cached

---

### 3. Streaming Encryption (MEDIUM PRIORITY)

**Status**: ✅ SAFE - Reduces memory footprint

**Implementation**:
```typescript
// lib/crypto/streaming.ts
export async function* encryptStream(
  plaintext: ReadableStream<Uint8Array>,
  key: Uint8Array, // RAM-only, wiped after use
  nonce: Uint8Array
): AsyncGenerator<Uint8Array> {
  const CHUNK_SIZE = 256 * 1024; // 256KB chunks
  const reader = plaintext.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const cipher = xchacha20poly1305(key, nonce);
      const encrypted = cipher.encrypt(value);
      yield encrypted;
    }
  } finally {
    wipeMemory(key); // Clear key from RAM
    reader.releaseLock();
  }
}
```

**Expected Improvement**: 50% memory reduction  
**OpSec Impact**: ✅ None - keys wiped after use

---

### 4. Web Worker for Crypto Operations (HIGH PRIORITY)

**Status**: ✅ SAFE - Isolated memory context

**Implementation**:
```typescript
// lib/workers/crypto-pool.ts
export class CryptoWorkerPool {
  private workers: Worker[] = [];
  
  constructor(size: number = 2) {
    for (let i = 0; i < size; i++) {
      this.workers.push(new Worker('/crypto.worker.js'));
    }
  }
  
  async encryptParallel(
    decoyData: Uint8Array,
    hiddenData: Uint8Array,
    passphrase: string // RAM-only, never persisted
  ): Promise<[EncryptionResult, EncryptionResult]> {
    const [decoyResult, hiddenResult] = await Promise.all([
      this.encryptInWorker(this.workers[0], decoyData, ''),
      this.encryptInWorker(this.workers[1], hiddenData, passphrase)
    ]);
    
    // Workers automatically cleared on tab close
    return [decoyResult, hiddenResult];
  }
  
  destroy(): void {
    this.workers.forEach(w => w.terminate()); // Clear worker memory
    this.workers = [];
  }
}
```

**Expected Improvement**: Non-blocking UI, 30% faster encryption  
**OpSec Impact**: ✅ None - workers isolated, cleared on close

---

### 5. Optimized Progress Tracking (LOW PRIORITY)

**Status**: ✅ SAFE - UI optimization only

**Implementation**:
```typescript
// lib/hooks/useThrottledProgress.ts
export function useThrottledProgress(interval: number = 100) {
  const [progress, setProgress] = useState(0);
  const lastUpdate = useRef(0);
  
  const updateProgress = useCallback((value: number) => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      setProgress(value);
      lastUpdate.current = now;
    }
  }, [interval]);
  
  return { progress, updateProgress };
}
```

**Expected Improvement**: Smoother UI, reduced CPU  
**OpSec Impact**: ✅ None - no data persistence

---

### 6. Connection Pooling (MEDIUM PRIORITY)

**Status**: ✅ SAFE - Network optimization only

**Implementation**:
```typescript
// lib/storage/connection-pool.ts
export class IPFSConnectionPool {
  private client: PinataClient | FilebaseClient;
  
  constructor(credentials: UploadCredentials) { // RAM-only
    this.client = credentials.provider === 'pinata'
      ? new PinataClient(credentials.pinataJWT)
      : new FilebaseClient(credentials.filebaseToken);
  }
  
  async upload(data: Uint8Array): Promise<string> {
    return this.client.upload(data); // Reuses HTTP/2 connection
  }
  
  destroy(): void {
    this.client = null; // Clear reference
  }
}
```

**Expected Improvement**: 20-30% faster uploads  
**OpSec Impact**: ✅ None - credentials in RAM only

---

## ⚠️ CONDITIONAL Optimizations (Require OpSec Review)

### 7. Client-Side Caching

**Status**: ⚠️ DANGEROUS - Violates RAM-only storage

**Original Recommendation**:
```typescript
// ❌ FORBIDDEN
localStorage.setItem('vault_metadata', JSON.stringify(metadata));
indexedDB.put('decrypted_list', fileList);
```

**OpSec-Compliant Alternative**:
```typescript
// ✅ APPROVED: RAM-only cache
let metadataCache: Map<string, VaultMetadata> = new Map();

export function cacheMetadata(vaultId: string, metadata: VaultMetadata): void {
  metadataCache.set(vaultId, metadata); // Cleared on tab close
}

export function getMetadata(vaultId: string): VaultMetadata | null {
  return metadataCache.get(vaultId) || null;
}

// Auto-clear on tab close (no persistence)
window.addEventListener('beforeunload', () => {
  metadataCache.clear();
});
```

**Expected Improvement**: Faster vault reopening (same session only)  
**OpSec Impact**: ✅ SAFE - RAM-only, cleared on close

---

### 8. Lazy Decryption

**Status**: ✅ SAFE - No persistence required

**Implementation**:
```typescript
// lib/services/lazy-decrypt.ts
export class LazyDecryptionService {
  private decryptedCache: Map<string, Uint8Array> = new Map(); // RAM-only
  
  async decryptOnDemand(
    cid: string,
    passphrase: string // RAM-only
  ): Promise<Uint8Array> {
    if (this.decryptedCache.has(cid)) {
      return this.decryptedCache.get(cid)!;
    }
    
    const encrypted = await downloadFromIPFS(cid);
    const decrypted = await decrypt({ blob: encrypted, passphrase });
    
    this.decryptedCache.set(cid, decrypted); // RAM-only cache
    return decrypted;
  }
  
  clear(): void {
    this.decryptedCache.clear(); // Wipe on lock
  }
}
```

**Expected Improvement**: Faster file access  
**OpSec Impact**: ✅ SAFE - cache cleared on lock

---

### 9. Compression Before Encryption

**Status**: ⚠️ REVIEW REQUIRED - May leak metadata

**Security Concern**: Compression ratios leak information about plaintext

**Example**:
```typescript
// ❌ DANGEROUS: Compression ratio reveals content type
const compressed = gzip(plaintext); // 90% compression = text
const compressed = gzip(plaintext); // 5% compression = already compressed
```

**OpSec-Compliant Alternative**:
```typescript
// ✅ APPROVED: Compress then pad to fixed size
export function compressAndPad(data: Uint8Array): Uint8Array {
  const compressed = gzip(data);
  const targetSize = selectVaultSize(data.length); // Fixed size classes
  return addPadding(compressed, targetSize); // Hides compression ratio
}
```

**Expected Improvement**: 20-40% smaller uploads  
**OpSec Impact**: ✅ SAFE - padding hides compression ratio

---

### 10. Prefetching

**Status**: ⚠️ DANGEROUS - May leak access patterns

**Security Concern**: Prefetching reveals which vaults user will access

**Example**:
```typescript
// ❌ FORBIDDEN: Leaks intent to access vault
onMouseHover(() => {
  prefetchVault(vaultId); // Network request reveals interest
});
```

**OpSec-Compliant Alternative**:
```typescript
// ✅ APPROVED: Prefetch only after authentication
export async function prefetchAfterUnlock(vaultId: string): Promise<void> {
  // Only prefetch AFTER user has unlocked vault
  // No speculative prefetching that leaks intent
  const metadata = await fetchMetadata(vaultId);
  metadataCache.set(vaultId, metadata); // RAM-only
}
```

**Expected Improvement**: Minimal (only post-unlock)  
**OpSec Impact**: ✅ SAFE - no speculative access

---

## ❌ REJECTED Optimizations (OpSec Violations)

### 1. Persistent Credential Storage

```typescript
// ❌ FORBIDDEN
localStorage.setItem('pinata_jwt', jwt);
localStorage.setItem('filebase_token', token);
```

**Reason**: Violates RAM-only storage principle  
**Forensic Risk**: Credentials recoverable from disk  
**Alternative**: User re-enters credentials each session

---

### 2. Encrypted localStorage

```typescript
// ❌ FORBIDDEN
const encrypted = encrypt(jwt, deviceKey);
localStorage.setItem('encrypted_jwt', encrypted);
```

**Reason**: Encrypted data still forensically recoverable  
**Forensic Risk**: Adversary can brute-force weak device keys  
**Alternative**: RAM-only storage

---

### 3. IndexedDB Caching

```typescript
// ❌ FORBIDDEN
await indexedDB.put('vault_cache', {
  cid: 'Qm...',
  encryptedBlob: blob
});
```

**Reason**: Persists to disk, forensically recoverable  
**Forensic Risk**: Encrypted blobs reveal vault existence  
**Alternative**: RAM-only cache (cleared on tab close)

---

### 4. Service Worker Caching

```typescript
// ❌ FORBIDDEN
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

**Reason**: Service workers persist to disk  
**Forensic Risk**: Cached responses recoverable  
**Alternative**: No service worker caching for sensitive data

---

### 5. Browser History/Autocomplete

```typescript
// ❌ FORBIDDEN
<input type="text" name="passphrase" autocomplete="on" />
```

**Reason**: Browser saves autocomplete data to disk  
**Forensic Risk**: Passphrases recoverable from browser data  
**Alternative**: `autocomplete="off"` for all sensitive inputs

---

## Implementation Roadmap (OpSec-Compliant)

### Phase 1: High Priority (Week 1-2)
1. ✅ Parallel file uploads
2. ✅ Chunked uploads
3. ✅ Web Worker crypto
4. ✅ Progress UI optimization

**Expected Result**: 5 minutes → 2 minutes (60% improvement)  
**OpSec Impact**: ✅ None - all RAM-only

---

### Phase 2: Medium Priority (Week 3-4)
1. ✅ Streaming encryption
2. ✅ Connection pooling
3. ✅ RAM-only metadata cache
4. ✅ Lazy decryption

**Expected Result**: 2 minutes → 1 minute (50% improvement)  
**OpSec Impact**: ✅ None - all RAM-only

---

### Phase 3: Advanced (Week 5-6)
1. ✅ Compression with padding
2. ✅ Post-unlock prefetching
3. ✅ Worker pool optimization
4. ✅ Performance monitoring

**Expected Result**: 1 minute → 45 seconds (25% improvement)  
**OpSec Impact**: ✅ None - all RAM-only

---

## Security Checklist

Before implementing ANY optimization:

- [ ] Does it persist data to disk? → ❌ REJECT
- [ ] Does it use localStorage/sessionStorage? → ❌ REJECT
- [ ] Does it use IndexedDB? → ❌ REJECT
- [ ] Does it cache credentials? → ❌ REJECT
- [ ] Does it leak access patterns? → ❌ REJECT
- [ ] Is data cleared on tab close? → ✅ REQUIRED
- [ ] Are keys wiped after use? → ✅ REQUIRED
- [ ] Is it RAM-only? → ✅ REQUIRED

---

## Testing Strategy

### Performance Tests
```typescript
// __tests__/performance/upload-optimized.test.ts
describe('Optimized Upload Performance', () => {
  it('should upload 2x 15MB files in <2 minutes', async () => {
    const start = Date.now();
    await vaultService.createVault({
      decoyContent: new Uint8Array(15 * 1024 * 1024),
      hiddenContent: new Uint8Array(15 * 1024 * 1024),
      passphrase: 'test',
      ipfsCredentials: { provider: 'pinata', pinataJWT: 'test' }
    });
    expect(Date.now() - start).toBeLessThan(120000);
  });
});
```

### OpSec Tests
```typescript
// __tests__/security/no-persistence.test.ts
describe('RAM-Only Storage', () => {
  it('should not persist credentials to localStorage', () => {
    saveJWT('test-jwt');
    expect(localStorage.getItem('sanctum_jwt')).toBeNull();
  });
  
  it('should clear cache on tab close', () => {
    cacheMetadata('vault-id', { cid: 'Qm...' });
    window.dispatchEvent(new Event('beforeunload'));
    expect(getMetadata('vault-id')).toBeNull();
  });
});
```

---

## Monitoring (OpSec-Compliant)

```typescript
// lib/monitoring/performance.ts
export interface PerformanceMetrics {
  kdfTime: number;
  encryptionTime: number;
  uploadTime: number;
  totalTime: number;
  fileSize: number;
  // ❌ NO user identifiers
  // ❌ NO vault IDs
  // ❌ NO IP addresses
}

export function trackPerformance(metrics: PerformanceMetrics): void {
  // Only log in development (no telemetry in production)
  if (process.env.NODE_ENV === 'development') {
    console.table(metrics);
  }
  // ❌ NO analytics.track() - violates privacy
}
```

---

## Conclusion

**Approved Optimizations**: 8/10 (80%)  
**Rejected Optimizations**: 2/10 (20%)

**Expected Performance**:
- Before: 5-10 minutes
- After: 45-90 seconds
- **Improvement: 80-85%**

**OpSec Status**: ✅ MAINTAINED
- RAM-only storage preserved
- Zero disk persistence
- No forensic evidence
- Zero-trust architecture intact

**Next Steps**:
1. Implement Phase 1 (parallel uploads + chunking)
2. Test with 2x 15MB files
3. Verify no localStorage/IndexedDB usage
4. Proceed to Phase 2 if tests pass
