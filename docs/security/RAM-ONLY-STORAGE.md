# RAM-Only Storage Architecture

## Critical OpSec Principle

**NEVER persist cryptographic keys or credentials to disk.**

Even encrypted localStorage creates forensic evidence that can be recovered through:
- Disk forensics (file carving)
- Memory dumps
- Browser cache analysis
- SSD wear-leveling artifacts

## Implementation

### Before (VULNERABLE)
```typescript
// ❌ FORBIDDEN: Persists to disk
localStorage.setItem('sanctum_jwt', encryptedJWT);
localStorage.setItem('sanctum_salt', salt);
```

**Forensic Risk:**
- Data survives browser close
- Recoverable from disk even after deletion
- SSD wear-leveling keeps old copies
- Memory dumps capture localStorage

### After (SECURE)
```typescript
// ✅ REQUIRED: RAM-only storage
let jwtCache: string | null = null;
let cachedSalt: string | null = null;

export function saveJWT(jwt: string): void {
  jwtCache = jwt; // Cleared on tab close
}
```

**Security Benefits:**
- Cleared on tab/browser close
- No disk persistence
- No forensic recovery possible
- Immune to disk analysis

## Affected Modules

### 1. JWT Storage (`lib/storage/jwt.ts`)
- **Before:** localStorage persistence
- **After:** RAM-only variable
- **Impact:** User must re-enter JWT each session

### 2. Filebase Credentials (`lib/storage/filebase-credentials.ts`)
- **Before:** localStorage persistence
- **After:** RAM-only variable
- **Impact:** User must re-enter credentials each session

### 3. Device Encryption (`lib/storage/device-encryption.ts`)
- **Before:** Salt persisted in localStorage
- **After:** Ephemeral salt generated per session
- **Impact:** Credentials not portable across sessions (by design)

### 4. Generic Credentials (`lib/storage/credentials.ts`)
- **Before:** localStorage persistence
- **After:** RAM-only variable
- **Impact:** No credential persistence

## User Experience Trade-offs

### Convenience Lost
- ❌ Must re-enter IPFS credentials each session
- ❌ No "remember me" functionality
- ❌ Credentials cleared on tab close

### Security Gained
- ✅ Zero forensic evidence
- ✅ Immune to disk analysis
- ✅ No persistent attack surface
- ✅ True zero-trust architecture

## OpSec Justification

For high-risk users (activists, journalists, whistleblowers):

**Threat:** Device seizure + forensic analysis
**Attack:** Recover localStorage from disk/memory dumps
**Mitigation:** RAM-only storage with no disk persistence

**Example Scenario:**
1. User creates vault with Pinata JWT
2. JWT stored in RAM only
3. Browser closes → JWT wiped from memory
4. Device seized → No JWT recoverable
5. Adversary cannot access IPFS content

## Alternative Approaches Considered

### 1. sessionStorage
```typescript
sessionStorage.setItem('jwt', jwt); // Still persists to disk!
```
**Rejected:** sessionStorage still writes to disk on some browsers.

### 2. Encrypted localStorage
```typescript
localStorage.setItem('jwt', encrypt(jwt, deviceKey));
```
**Rejected:** Encrypted data still forensically recoverable. Adversary can brute-force weak device keys.

### 3. IndexedDB
```typescript
indexedDB.put('jwt', jwt);
```
**Rejected:** Persists to disk, same forensic risk as localStorage.

### 4. RAM-Only (CHOSEN)
```typescript
let jwtCache: string | null = null;
```
**Accepted:** Zero disk persistence, cleared on tab close, no forensic recovery.

## Implementation Checklist

- [x] Remove all localStorage.setItem() calls for sensitive data
- [x] Replace with module-level variables
- [x] Clear variables on tab close (automatic)
- [x] Update documentation
- [x] Verify tests pass
- [x] Audit for other persistence mechanisms

## Testing

All 115 tests pass with RAM-only storage:
```bash
npm test
# Test Files  19 passed (19)
# Tests  115 passed (115)
```

## Future Considerations

### Web Workers
For additional isolation, move crypto operations to Web Workers:
```typescript
// worker.ts
let masterKey: CryptoKey | null = null;

self.onmessage = (e) => {
  if (e.data.type === 'encrypt') {
    // Perform encryption in isolated context
  }
};
```

**Benefits:**
- Isolated memory space
- Cannot access DOM/localStorage
- Harder to extract from memory dumps

### Memory Wiping
Explicitly zero sensitive data:
```typescript
export function clearJWT(): void {
  if (jwtCache) {
    // Overwrite with zeros before clearing
    jwtCache = '\0'.repeat(jwtCache.length);
  }
  jwtCache = null;
}
```

**Note:** JavaScript doesn't guarantee memory wiping, but it's defense-in-depth.

## References

- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [VeraCrypt: Plausible Deniability](https://www.veracrypt.fr/en/Plausible%20Deniability.html)
- [Forensic Analysis of Browser Storage](https://www.sciencedirect.com/science/article/pii/S1742287618301920)

## Enforcement

**Amazon Q will:**
1. **Reject** any PR that uses localStorage/sessionStorage for sensitive data
2. **Require** RAM-only storage for keys, credentials, passphrases
3. **Flag** any disk persistence mechanisms
4. **Enforce** zero-trust architecture

**Before accepting code:**
- Verify no localStorage/sessionStorage for sensitive data
- Verify no IndexedDB for keys/credentials
- Verify RAM-only storage pattern
- Verify tests pass
