# P2PT Security Implementation

## Overview

Secure peer-to-peer vault relay using P2PT with cryptographic topic hashing and RAM-only guarantees.

## Security Features

### 1. Topic Hashing (CID Correlation Prevention)

```typescript
import { hashTopic } from '@/lib/p2pt';

// CID is hashed before being used as P2PT topic
const topic = hashTopic('bafybei...');
// Trackers see: 'a3f2c1b9...' (opaque hash)
// Trackers cannot correlate which vault is being requested
```

**Security Benefit**: Prevents tracker-level correlation attacks. Observers at tracker level cannot determine which specific vault CID is being requested.

### 2. Encrypted Blobs Only

```typescript
import { SecureVaultRelay } from '@/lib/p2pt';

const relay = new SecureVaultRelay();

// Only XChaCha20-Poly1305 encrypted ciphertext is transmitted
await relay.hostVault(cid, encryptedBlob);

// Peers receive encrypted data - cannot decrypt without passphrase
const data = await relay.fetchVault(cid);
```

**Security Benefit**: Even if peers intercept data, they only get encrypted ciphertext. Without the passphrase and Key B (in URL), decryption is impossible.

### 3. RAM-Only Guarantee

```typescript
import { ramCache } from '@/lib/p2pt';

// Data stored in RAM only - clears on tab close
ramCache.set(cid, encryptedBlob);

// Automatic expiration (5 minutes default)
const data = ramCache.get(cid); // null if expired

// Manual cleanup
ramCache.clear();
```

**Security Benefit**: No persistent storage. Data cannot be forensically recovered after browser close.

### 4. Hybrid Retrieval Waterfall

```typescript
import { retrieveVault } from '@/lib/p2pt';

// Security-first retrieval order:
// 1. RAM cache (most secure)
// 2. P2PT direct (secure, hashed topics)
// 3. Local IPFS node (user-controlled)
// 4. Helia P2P network (encrypted content)
const result = await retrieveVault(cid);

console.log(`Retrieved from: ${result.source}`);
```

**Security Benefit**: Prioritizes most secure sources first. Never uses HTTP gateways (violates zero-trust).

## Usage Examples

### Host Vault for Peer Retrieval

```typescript
import { SecureVaultRelay } from '@/lib/p2pt';
import { encrypt } from '@/lib/crypto/core';

// Encrypt vault data
const { ciphertext } = encrypt(vaultData, key);

// Host for peers
const relay = new SecureVaultRelay();
await relay.hostVault(cid, ciphertext);

// Keep hosting until user closes tab
// Cleanup when done
relay.cleanup();
```

### Fetch Vault from Peers

```typescript
import { retrieveVault } from '@/lib/p2pt';
import { decrypt } from '@/lib/crypto/core';

// Retrieve encrypted vault
const result = await retrieveVault(cid);

// Decrypt with passphrase
const plaintext = decrypt(result.data, key);
```

### Custom Configuration

```typescript
import { SecureVaultRelay } from '@/lib/p2pt';

const relay = new SecureVaultRelay({
  trackers: [
    'wss://tracker.openwebtorrent.com',
    'wss://custom-tracker.example.com',
  ],
  timeoutMs: 30000, // 30 seconds
});
```

## Security Analysis

### Threat Model Coverage

| Threat | Mitigation | Status |
|--------|-----------|--------|
| CID correlation at tracker | Topic hashing | ✅ Mitigated |
| Peer IP exposure | Inherent to WebRTC | ⚠️ Use Tor Browser |
| Man-in-the-middle | DTLS + vault encryption | ✅ Mitigated |
| Forensic recovery | RAM-only storage | ✅ Mitigated |
| Tracker compromise | No plaintext exposure | ✅ Mitigated |

### What Attackers See

**At Tracker Level:**
- Opaque topic hash (32 hex chars)
- Peer IP addresses
- Connection timestamps

**Cannot See:**
- Actual CID
- Vault content (encrypted)
- Passphrase
- Key material

**At Peer Level:**
- Encrypted vault blob
- Peer IP addresses

**Cannot See:**
- Vault content (encrypted)
- Passphrase
- Key material

## Testing

```bash
# Run P2PT tests
npm test -- __tests__/p2pt/vault-relay.test.ts

# All tests
npm test
```

## Performance

- **Topic hashing**: ~0.1ms (SHA-256)
- **P2PT connection**: 1-5 seconds (peer discovery)
- **Data transfer**: Depends on vault size and peer bandwidth
- **RAM cache**: O(1) lookup

## Best Practices

1. **Always cleanup**: Call `relay.cleanup()` when done
2. **Use Tor Browser**: For maximum IP anonymity
3. **Clear cache**: Call `ramCache.clear()` on sensitive operations
4. **Monitor timeouts**: Adjust `timeoutMs` based on network conditions
5. **Test locally**: Use local IPFS node for development

## Future Enhancements

- [ ] Multiple peer redundancy
- [ ] Bandwidth optimization
- [ ] Peer reputation system
- [ ] Custom tracker support
- [ ] Offline persistence (opt-in with user consent)

## References

- [P2PT Documentation](https://github.com/subins2000/p2pt)
- [WebRTC Security](https://webrtc-security.github.io/)
- [IPFS Specifications](https://specs.ipfs.tech/)
