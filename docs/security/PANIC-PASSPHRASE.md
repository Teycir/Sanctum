# Panic Passphrase Feature

## Overview

Panic passphrase is a **REQUIRED** duress feature that shows "vault erased" message when entered, making it **cryptographically indistinguishable** from a vault that was actually deleted from IPFS storage.

**Why Required?** Prevents lazy users from creating vulnerable vaults without duress protection.

## How It Works

### During Vault Creation

1. User optionally sets a panic passphrase (different from decoy/hidden passphrases)
2. Client hashes panic passphrase with SHA-256
3. Hash stored encrypted in D1 database alongside vault metadata
4. No additional IPFS storage or metadata changes

### During Vault Unlock

1. User enters passphrase
2. Client hashes entered passphrase with SHA-256
3. **Before any crypto operations**, compare hash with stored panic hash
4. If match → throw error: `"Vault content has been deleted from storage providers"`
5. Frontend shows exact same UI as real vault deletion

## Security Properties

### ✅ Plausible Deniability

- **Same error message** as real IPFS deletion
- **Same UI state** (vaultExists = false)
- **No timing differences** (hash check happens before crypto)
- **No metadata leakage** (adversary cannot distinguish panic from deletion)

### ✅ Zero Server Trust

- Server only stores SHA-256 hash (one-way function)
- Server cannot reverse hash to get panic passphrase
- Server cannot decrypt vault even with panic hash
- Hash comparison happens client-side

### ✅ Constant-Time Comparison

```typescript
// Client-side hash comparison (constant-time via SHA-256)
const enteredHash = sha256(passphrase);
if (enteredHash === storedHash) {
  throw new Error('Vault content has been deleted from storage providers');
}
```

## Implementation

### Database Schema

```sql
ALTER TABLE vault_keys ADD COLUMN panic_passphrase_hash TEXT;
CREATE INDEX idx_panic_hash ON vault_keys(panic_passphrase_hash);
```

### API Changes

**store-key.js**
```javascript
const { panicPassphraseHash } = body;
// Store hash alongside vault metadata
```

**get-key.js**
```javascript
// Return panic hash to client for comparison
return { keyB, ..., panicPassphraseHash };
```

### Client Changes

**lib/services/vault.ts**
```typescript
// Check panic passphrase before crypto operations
if (panicPassphraseHash && passphrase) {
  const enteredHash = sha256(passphrase);
  if (enteredHash === panicPassphraseHash) {
    throw new Error('Vault content has been deleted from storage providers');
  }
}
```

**app/vault/page.tsx**
```typescript
// Same error handling as real deletion
if (errorMessage.includes('deleted from storage')) {
  setError('⚠️ Vault content has been deleted from IPFS storage providers...');
  setVaultExists(false);
}
```

## Usage Example

### Creating Vault with Panic Passphrase

```typescript
const vault = await vaultService.createVault({
  hiddenContent: secretData,
  passphrase: 'correct-horse-battery-staple',
  decoyPassphrase: 'fake-wallet-password',
  panicPassphrase: 'emergency-destroy-123', // NEW
  expiryDays: 90
});
```

### Duress Scenario

**Adversary:** "Give me the password or else!"

**User enters panic passphrase:** `emergency-destroy-123`

**System shows:**
```
❌ Vault Not Found

⚠️ Vault content has been deleted from IPFS storage providers. 
The encrypted files are no longer available for download.
```

**Adversary cannot prove:**
- Whether vault was actually deleted
- Whether panic passphrase was used
- Whether hidden layers exist
- Whether user is lying

## Threat Model

### ✅ Protected Against

- **Physical coercion** - Show "vault deleted" message
- **Legal demands** - Cannot prove vault exists
- **Forensic analysis** - No evidence of panic passphrase
- **Timing attacks** - Hash check before crypto operations
- **Metadata analysis** - Same error as real deletion

### ⚠️ Limitations

- **Adversary with database access** - Can see panic hash exists (but cannot reverse it)
- **Multiple unlock attempts** - Adversary might try all 3 passphrases (decoy, hidden, panic)
- **Social engineering** - User might reveal panic passphrase under extreme duress

## Best Practices

### Choosing Panic Passphrase

✅ **DO:**
- Use completely different passphrase from decoy/hidden
- Make it memorable under stress
- Test it before relying on it
- Share with trusted contact (dead man's switch)

❌ **DON'T:**
- Use similar passphrase to decoy/hidden
- Use common passwords (adversary might guess)
- Store digitally (defeats purpose)
- Reveal existence of panic passphrase

### OpSec Guidelines

1. **Never mention** panic passphrase exists
2. **Practice entering** under stress (muscle memory)
3. **Have plausible story** - "I deleted it because I was scared"
4. **Use with Tor Browser** - Prevents network timing analysis
5. **Clear browser data** after showing "deleted" message

## Testing

```bash
# Run panic passphrase tests
npm test -- panic-passphrase

# Test indistinguishability
npm test -- vault-deletion-equivalence
```

## Migration

Existing vaults without panic passphrase:
- `panic_passphrase_hash` column is NULL
- No panic passphrase check performed
- Backward compatible with existing vaults

New vaults:
- Optional panic passphrase during creation
- Hash stored in database
- Check performed on every unlock attempt

## Future Enhancements

- **Multiple panic passphrases** - Different actions (show decoy, show "deleted", wipe KeyA)
- **Time-delayed panic** - Show "deleted" after N hours
- **Panic gesture** - Triple-tap Escape key
- **Panic URL parameter** - `?panic=1` in vault URL

## References

- [Plausible Deniability](../../docs/security/PLAUSIBLE-DENIABILITY.md)
- [Duress Scenarios](../../docs/security/DURESS-SCENARIOS.md)
- [OpSec Guidelines](../../docs/OPSEC.md)
