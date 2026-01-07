# Critical OpSec Fix: RAM-Only Storage

## Summary

Removed all localStorage persistence for cryptographic keys and credentials to prevent forensic recovery after device seizure.

## Changes Made

### 1. Device Encryption (`lib/storage/device-encryption.ts`)
- **Before:** Salt persisted in localStorage
- **After:** Ephemeral salt in RAM, regenerated per session
- **Impact:** No forensic recovery of encryption salt

### 2. JWT Storage (`lib/storage/jwt.ts`)
- **Before:** Encrypted JWT in localStorage
- **After:** JWT cached in RAM only
- **Impact:** JWT cleared on tab close, no disk persistence

### 3. Filebase Credentials (`lib/storage/filebase-credentials.ts`)
- **Before:** Encrypted credentials in localStorage
- **After:** Credentials cached in RAM only
- **Impact:** Credentials cleared on tab close

### 4. Generic Credentials (`lib/storage/credentials.ts`)
- **Before:** Encrypted credentials in localStorage
- **After:** Credentials cached in RAM only
- **Impact:** No credential persistence across sessions

## Security Benefits

✅ **Zero Forensic Evidence**
- No localStorage artifacts on disk
- No SSD wear-leveling copies
- No browser cache persistence

✅ **Automatic Cleanup**
- All sensitive data cleared on tab close
- No manual cleanup required
- Immune to "forgot to clear" mistakes

✅ **True Zero-Trust**
- Keys never touch disk
- No persistent attack surface
- Aligned with threat model

## User Experience Impact

⚠️ **Convenience Trade-off:**
- Users must re-enter IPFS credentials each session
- No "remember me" functionality
- Credentials not portable across tabs

✅ **Security Justification:**
For high-risk users facing device seizure, the security benefit far outweighs the convenience loss.

## Testing

All 115 tests pass:
```bash
npm test
# Test Files  19 passed (19)
# Tests  115 passed (115)
```

## Documentation

- [RAM-ONLY-STORAGE.md](./docs/security/RAM-ONLY-STORAGE.md) - Complete technical documentation
- [README.md](./README.md) - Updated with RAM-only storage feature

## Threat Model Alignment

**Threat:** Device seizure + forensic disk analysis  
**Attack:** Recover localStorage from disk/SSD  
**Mitigation:** RAM-only storage with zero disk persistence  
**Result:** No recoverable cryptographic material

## Enforcement

This fix is now enforced by project rules:
- `.amazonq/rules/modular-architecture.md` - No global state
- `.amazonq/rules/error-handling.md` - No silent errors
- New rule: No localStorage for sensitive data

## Next Steps

Consider additional hardening:
1. Web Worker isolation for crypto operations
2. Explicit memory wiping (defense-in-depth)
3. User education on OpSec best practices

## References

- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [VeraCrypt: Plausible Deniability](https://www.veracrypt.fr/en/Plausible%20Deniability.html)
- [Forensic Analysis of Browser Storage](https://www.sciencedirect.com/science/article/pii/S1742287618301920)
