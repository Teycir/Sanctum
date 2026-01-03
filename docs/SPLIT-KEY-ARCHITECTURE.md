# Split-Key Architecture (TimeSeal Pattern)

## Overview

Sanctum uses split-key encryption inspired by TimeSeal to provide defense-in-depth security. Encryption keys are split into two parts:

- **Key A**: Stored encrypted on Cloudflare D1 database
- **Key B**: Embedded in vault URL hash (never sent to server)

Both keys are required to decrypt vault content.

## Architecture

```
User Password → Argon2id → Encryption Key
                              ↓
                    Generate Split Keys
                    ├─ Key A (32 bytes random)
                    └─ Key B (32 bytes random)
                              ↓
                    Master Key = SHA-256(Key A || Key B)
                              ↓
                    Encrypt Content with Master Key
                              ↓
                    Upload to Pinata IPFS
```

## Key Storage

### Key A (Server)
```
Vault ID → SHA-256 → Encryption Key
                          ↓
            Encrypt Key A with XChaCha20-Poly1305
                          ↓
            Store in D1: {vault_id, encrypted_key_a, nonce}
```

### Key B (URL)
```
https://sanctum.vault/v#{vault_id}|{key_b}|{decoy_cid}|{hidden_cid}|{salt}
                              ↑
                        Never sent to server
```

## Security Properties

### Defense Against Server Compromise
- Attacker gets: Encrypted Key A + vault metadata
- **Cannot decrypt**: Needs Key B from URL hash
- **Cannot brute-force**: Key B is 32 random bytes (2^256 keyspace)

### Defense Against Pinata Compromise
- Attacker gets: Encrypted vault blobs (CIDs)
- **Cannot decrypt**: Needs both Key A + Key B + password
- **Cannot identify**: No metadata linking CIDs to users

### Defense Against URL Leak
- Attacker gets: Key B + CIDs + salt
- **Cannot decrypt**: Needs Key A from server
- **Cannot retrieve Key A**: Vault ID derived from Key B, but encrypted with vault-specific key

## Implementation

### Creating a Vault

```typescript
import { generateSplitKeys, encryptKeyA, serializeKeyA } from '@/lib/crypto/split-key';
import { createHiddenVault } from '@/lib/duress/layers';

// 1. Generate split keys
const { keyA, keyB, masterKey } = await generateSplitKeys();

// 2. Create vault ID
const vaultId = base64UrlEncode(randomBytes(16));

// 3. Encrypt Key A for storage
const encryptedKeyA = encryptKeyA(keyA, vaultId);
const serializedKeyA = serializeKeyA(encryptedKeyA);

// 4. Store in D1
await db.prepare(
  'INSERT INTO vault_keys (vault_id, encrypted_key_a, nonce, ...) VALUES (?, ?, ?, ...)'
).bind(vaultId, serializedKeyA, ...).run();

// 5. Build vault URL with Key B
const vaultURL = `https://sanctum.vault/v#${vaultId}|${base64UrlEncode(keyB)}|...`;
```

### Unlocking a Vault

```typescript
import { deserializeKeyA, decryptKeyA, deriveMasterKey } from '@/lib/crypto/split-key';

// 1. Parse URL hash
const [vaultId, keyBEncoded, ...] = urlHash.split('|');
const keyB = base64UrlDecode(keyBEncoded);

// 2. Fetch encrypted Key A from D1
const row = await db.prepare(
  'SELECT encrypted_key_a, nonce FROM vault_keys WHERE vault_id = ?'
).bind(vaultId).first();

// 3. Decrypt Key A
const { encrypted, nonce } = deserializeKeyA(row.encrypted_key_a);
const keyA = decryptKeyA(encrypted, nonce, vaultId);

// 4. Derive master key
const masterKey = await deriveMasterKey(keyA, keyB);

// 5. Download from Pinata and decrypt
const decoyBlob = await pinata.download(decoyCID);
const hiddenBlob = await pinata.download(hiddenCID);
// ... decrypt with masterKey + password
```

## Comparison with TimeSeal

| Feature | TimeSeal | Sanctum |
|---------|----------|---------|
| Key Split | ✅ Key A + Key B | ✅ Key A + Key B |
| Key A Storage | D1 (encrypted) | D1 (encrypted) |
| Key B Storage | URL hash | URL hash |
| Content Storage | D1 (encrypted blob) | Pinata IPFS (encrypted CIDs) |
| Master Key Derivation | HKDF | SHA-256(Key A \|\| Key B) |
| Use Case | Timed release | Plausible deniability |

## Migration Path

Current Sanctum vaults (without split-key) can coexist with new split-key vaults:

- **Legacy vaults**: URL contains full metadata (no Key B)
- **Split-key vaults**: URL contains vault ID + Key B

Detection:
```typescript
if (urlHash.includes('|')) {
  // Split-key vault
  await unlockWithSplitKey(urlHash);
} else {
  // Legacy vault
  await unlockLegacy(urlHash);
}
```

## Setup Instructions

### 1. Create D1 Database

```bash
npx wrangler d1 create sanctum-keys
```

Copy the database ID to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sanctum-keys"
database_id = "your-database-id-here"
```

### 2. Run Migrations

```bash
npx wrangler d1 execute sanctum-keys --file=./schema.sql
```

### 3. Deploy

```bash
npm run build
npx wrangler pages deploy out
```

## Security Considerations

1. **Vault ID Derivation**: Vault ID is random, not derived from Key B, to prevent correlation attacks
2. **Key A Encryption**: Uses vault-specific encryption key (SHA-256 of vault ID) to prevent key reuse
3. **URL Hash Security**: Key B never sent to server (stays in browser)
4. **Forward Secrecy**: Rotating master keys doesn't affect existing vaults (each vault has unique keys)

## Testing

```bash
# Unit tests
npm test lib/crypto/split-key.test.ts

# Integration tests
npm test __tests__/integration/split-key-vault.test.ts
```

## References

- [TimeSeal Crypto Implementation](https://github.com/Teycir/TimeSeal/blob/main/lib/crypto.ts)
- [TimeSeal Key Encryption](https://github.com/Teycir/TimeSeal/blob/main/lib/keyEncryption.ts)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
