# P2PT Integration Guide

## Current Status

✅ **Completed:**
- Core P2PT vault relay implementation
- Input validation (CID, vault data, tracker URLs)
- Error handling (compliant with error-handling.md)
- RAM-only session cache
- Comprehensive test coverage (23/23 passing)

## Integration with Vault Service

### Option 1: Add P2PT to Retrieval Waterfall (Recommended)

Modify `lib/storage/vault.ts` downloadVault function:

```typescript
import { retrieveVault } from '../p2pt';

export async function downloadVault(
  stored: StoredVault,
  ipfs: IHeliaClient
): Promise<HiddenVault> {
  // Try P2PT first for faster retrieval
  try {
    const result = await retrieveVault(stored.decoyCID, { timeoutMs: 10000 });
    const decoyBlob = result.data;
    // ... continue with existing logic
  } catch {
    // Fallback to Helia
    const decoyBlob = await ipfs.download(stored.decoyCID);
  }
}
```

### Option 2: Opt-in P2PT Hosting

Add to `VaultService.createVault`:

```typescript
import { SecureVaultRelay } from '../p2pt';

async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
  // ... existing code ...
  
  // Optional: Host vault for P2PT retrieval
  if (params.enableP2PT) {
    const relay = new SecureVaultRelay();
    await relay.hostVault(stored.decoyCID, vault.decoyBlob);
    // Keep relay alive until user closes tab
  }
  
  return { vaultURL, decoyCID, hiddenCID };
}
```

## Production Readiness Checklist

✅ Error handling (proper try-catch with re-throws)  
✅ Input validation (CID, data size, tracker URLs)  
✅ Test coverage (23 tests, all passing)  
✅ RAM-only guarantee (no persistent storage)  
✅ Security audit (topic hashing, encrypted blobs only)  
⚠️ Browser compatibility (WebRTC required)  
⚠️ P2PT library vulnerabilities (10 npm audit issues)  
⚠️ Performance testing (not yet done)  
⚠️ E2E testing (not yet done)

## Next Steps

1. **Address npm audit vulnerabilities** in P2PT dependencies
2. **Add browser compatibility checks** (WebRTC detection)
3. **Performance testing** (large vault transfers)
4. **E2E testing** (real P2PT connections)
5. **UI integration** (user consent, progress indicators)

## Security Notes

- P2PT uses WebRTC DataChannels (DTLS encrypted)
- Topic hashing prevents CID correlation at tracker level
- Only encrypted ciphertext transmitted (never plaintext)
- RAM-only storage (clears on tab close)
- No HTTP gateways (maintains zero-trust)

## Usage Example

```typescript
import { SecureVaultRelay, retrieveVault } from '@/lib/p2pt';

// Host vault
const relay = new SecureVaultRelay();
await relay.hostVault(cid, encryptedBlob);

// Retrieve vault
const result = await retrieveVault(cid);
console.log(`Retrieved from: ${result.source}`);

// Cleanup
relay.cleanup();
```
