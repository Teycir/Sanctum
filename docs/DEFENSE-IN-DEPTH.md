# Defense in Depth Architecture

## Overview

Sanctum implements **defense in depth** by combining TWO independent security layers:

1. **URL-Based Security** (Key B in hash) - Pure client-side, zero server trust
2. **Split-Key Security** (Key A on server) - Additional layer requiring server compromise

**Critical**: Both layers must be compromised to decrypt vault content.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VAULT ENCRYPTION                         │
│                                                             │
│  Plaintext → Argon2id(passphrase) → XChaCha20 → Ciphertext │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 1: MASTER KEY SPLIT                  │
│                                                             │
│  Master Key = Key A (server, encrypted) ⊕ Key B (URL hash) │
│                                                             │
│  • Key A: Stored on Cloudflare D1 (encrypted with Key B)   │
│  • Key B: In URL hash fragment (never sent to server)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 2: CID ENCRYPTION                    │
│                                                             │
│  CID → Encrypt(Master Key) → Encrypted CID (stored on D1)  │
│                                                             │
│  • Prevents direct IPFS access bypass                      │
│  • Requires both Key A and Key B to decrypt CID            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 3: IPFS STORAGE                      │
│                                                             │
│  Encrypted Blob → Upload to Pinata/Filebase                │
│                                                             │
│  • Triple-encrypted content                                │
│  • Providers only see encrypted blobs                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Properties

### Threat: Server Compromise (Cloudflare D1)

**Attacker Gets:**
- Encrypted Key A fragments
- Encrypted CIDs
- Vault metadata (mode, timestamps)

**Attacker CANNOT Get:**
- Key B (in URL hash, never sent to server)
- Decrypted CIDs (need Key B to decrypt)
- Vault content (need CID to download from IPFS)
- Passphrases (never stored anywhere)

**Result**: ✅ SAFE - Cannot decrypt without Key B from URL

---

### Threat: URL Leak (Key B Exposed)

**Attacker Gets:**
- Key B from URL hash

**Attacker CANNOT Get:**
- Encrypted Key A (stored on server)
- Master Key (need both Key A and Key B)
- CIDs (encrypted with Master Key)
- Vault content (need CID)

**Result**: ✅ SAFE - Cannot decrypt without Key A from server

---

### Threat: IPFS Provider Compromise (Pinata/Filebase)

**Attacker Gets:**
- Encrypted vault blobs
- CIDs

**Attacker CANNOT Get:**
- Master Key (split between server and URL)
- Passphrases (never stored)
- Decryption keys (need vault access)

**Result**: ✅ SAFE - Cannot decrypt without keys

---

### Threat: Full Stack Compromise (Server + URL + IPFS)

**Attacker Gets:**
- Key A (from server)
- Key B (from URL)
- Master Key (Key A ⊕ Key B)
- Encrypted CIDs (decrypt with Master Key)
- Encrypted vault blobs (download from IPFS)

**Attacker CANNOT Get:**
- Passphrases for hidden layers

**Result**: ⚠️ PARTIAL - Can decrypt decoy layer, CANNOT decrypt hidden layer without passphrase

---

## Fallback Modes

### Mode 1: URL-Only (Zero Server Trust)

If user doesn't trust server:

```typescript
const vault = await createVault({
  mode: 'url-only',
  content: { decoy, hidden },
  passphrase
});

// Returns: URL with full state in hash
// https://duress.vault/v#keyB=...&cid=...&salt=...
```

**Security**: Pure client-side, no server storage  
**Trade-off**: Long URLs, lost if URL lost

---

### Mode 2: Split-Key (Defense in Depth)

Default mode with server storage:

```typescript
const vault = await createVault({
  mode: 'split-key',
  content: { decoy, hidden },
  passphrase
});

// Returns: Short URL with vault ID
// https://duress.vault/v/abc123#keyB=...
```

**Security**: Requires both server and URL compromise  
**Trade-off**: Server stores encrypted metadata

---

## Privacy Considerations

### Access Logging

**What's Logged:**
- Vault ID
- Fingerprint (SHA-256 of IP + User-Agent)
- Action (create/unlock/download)
- Timestamp

**NOT Logged:**
- Raw IP addresses
- User-Agent strings
- Passphrases
- Decrypted content

**Purpose:**
- Rate limiting (5 attempts/min per vault)
- Honeypot detection (enumeration attacks)
- Suspicious pattern detection (>10 vaults in 5min)

**Mitigation:**
- Use Tor Browser for anonymity
- Fingerprints are hashed (not reversible)
- Logs don't reveal vault content or layers

---

## Implementation Status

- ✅ URL-based security (Key B in hash)
- ✅ Database schema (split-key storage)
- ⏳ Split-key service implementation
- ⏳ Mode selection UI
- ⏳ Fallback to URL-only mode

---

## References

- [SPLIT-KEY-ARCHITECTURE.md](./SPLIT-KEY-ARCHITECTURE.md) - Detailed split-key design
- [SPECIFICATION.md](./core/SPECIFICATION.md) - Technical specification
- [SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md) - Security audit checklist
