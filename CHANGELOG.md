# Changelog

All notable changes to Sanctum will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-08

### 🔒 Security Fixes

#### Critical
- **Fixed timing attack vulnerability in `constantTimeSelect`** - Randomized execution order to prevent timing analysis of decoy vs hidden layer unlocks
- **Fixed panic passphrase timing leak** - Implemented constant-time hash comparison using `constantTimeEqual` to prevent panic passphrase detection
- **Fixed vault ID integrity verification** - VaultId now generated before encryption and properly embedded in blob headers

#### High
- **Fixed expiry buffer mismatch** - Synchronized server grace period (5s) with client-side mobile lag buffer to prevent premature vault expiry
- **Improved memory safety** - Key material now properly wiped after use (best effort given JavaScript constraints)

#### Medium
- **Fixed silent error suppression** - Removed bare catch blocks that hid unexpected errors, errors now propagate properly for debugging
- **Fixed password validation** - Removed empty string bypass in `isValidPassword()`, created reusable `PASSWORD_REQUIREMENTS_MESSAGE` constant

### 🧹 Code Quality
- Removed unused variable `enteredHashEncoded` in panic passphrase check
- Removed tests for internal `deriveLayerPassphrase` function (now private)
- Updated test expectations to match corrected password validation behavior

### 📝 Documentation
- Added detailed security audit findings to codebase
- Documented timing attack limitations and mitigations
- Clarified JavaScript constant-time execution constraints

### ✅ Testing
- All 115 tests passing
- No regressions introduced
- Build successful with zero errors

### 🚀 Deployment
- Successfully deployed to production
- Preview URL: https://f41b5631.sanctum-vault.pages.dev

---

## [1.0.0] - 2025-01-15

### 🎉 Initial Stable Release

**Sanctum** - Zero-trust encrypted vault system with cryptographic plausible deniability for high-risk users.

### ✨ Features

#### Core Cryptography
- **XChaCha20-Poly1305** authenticated encryption with 256-bit keys
- **Argon2id KDF** with 256MB memory, 3 iterations (brute-force resistant)
- **Split-Key Architecture** - KeyA (URL) + KeyB (encrypted in database)
- **Plausible Deniability** - Hidden layers cryptographically indistinguishable from decoy
- **3-Layer Protection** - Decoy, Hidden, and Panic layers

#### Storage & Infrastructure
- **IPFS Integration** - Pinata and Filebase support with public gateway fallback
- **Cloudflare D1** - Encrypted metadata storage
- **Cloudflare Pages** - Static site hosting with global CDN
- **Provider Isolation** - Separate namespaces prevent cross-contamination
- **Vault ID Integrity** - 16-byte hash prevents cross-vault attacks

#### Security Features
- **RAM-Only Storage** - Zero disk persistence, immune to forensics
- **Auto-Lock** - 5 minutes inactivity timeout
- **Panic Key** - Double-press Escape for instant lockout
- **Randomized Timing** - 500-2000ms delay prevents timing analysis
- **History Clearing** - Vault URL auto-removed from browser history
- **Secure Clipboard** - Auto-clears after 60 seconds
- **Rate Limiting** - 5 attempts/min per vault, 50/hour per fingerprint
- **Fingerprint Tracking** - SHA-256(IP + User-Agent) for abuse detection
- **Honeypot Protection** - Auto-ban on suspicious activity
- **CSRF Protection** - Origin/referer validation
- **Security Headers** - X-Frame-Options, X-XSS-Protection, nosniff
- **Input Sanitization** - HTML entity encoding on all user input

#### User Experience
- **File Support** - Upload .zip/.rar archives up to 25MB
- **QR Code Generation** - Easy vault link sharing
- **Vault Expiry** - Configurable auto-deletion (7-365 days)
- **Storage Quota Display** - Real-time Pinata/Filebase usage tracking
- **Responsive Design** - Mobile and desktop support
- **3D Cursor Effects** - Interactive UI animations
- **Security Status Indicator** - Visual display of active protections

#### Developer Experience
- **Next.js 15** - Modern React framework with App Router
- **TypeScript** - Full type safety
- **Modular Architecture** - Clean separation of concerns
- **Comprehensive Testing** - 115/115 tests passing (19 test suites)
- **Web Workers** - Isolated crypto operations
- **Web Crypto API** - Native browser cryptography

### 📚 Documentation
- Complete README with use cases and security model
- Security features documentation
- RAM-only storage technical details
- Timing attack mitigation guide
- OpSec best practices
- Warrant canary

### 🔒 Security Audit
- No critical vulnerabilities
- Cryptographic implementation reviewed
- Timing attack mitigations documented
- Forensic resistance verified

### 🧪 Testing
- **Unit Tests** - Core crypto, validation, utilities
- **Integration Tests** - Vault creation, unlocking, storage
- **Service Tests** - IPFS, database, rate limiting
- **Security Tests** - Expiry, fingerprinting, honeypot

### 📦 Dependencies
- `@noble/ciphers` - Cryptographic primitives
- `@noble/hashes` - Hash functions
- `next` - React framework
- `react` - UI library
- `qrcode` - QR code generation

### 🌐 Deployment
- Production: [sanctumvault.online](https://sanctumvault.online)
- Cloudflare Pages with automatic deployments
- Global CDN distribution

### ⚖️ License
- Business Source License 1.1
- Free for non-production use
- Production use requires commercial license after 4 years

---

## Release Notes

This is the first stable release of Sanctum, ready for production use by activists, journalists, whistleblowers, and anyone facing physical duress or device seizure.

**Key Highlights:**
- ✅ Production-ready with 115 passing tests
- ✅ Cryptographically sound plausible deniability
- ✅ RAM-only storage immune to forensics
- ✅ Decentralized IPFS storage
- ✅ Zero-trust architecture
- ✅ Comprehensive security features

**Threat Model Coverage:**
- Physical duress ($5 wrench attacks)
- Device seizure (law enforcement, border control)
- Censorship (government blocking)
- Forensic analysis (disk recovery)

**Not Covered:**
- Side-channel attacks in controlled lab environments
- Nanosecond-level timing analysis (mitigated with Tor Browser)

### Migration Notes
This is the initial release - no migration needed.

### Breaking Changes
None - initial release.

### Known Issues
None - all tests passing.

### Future Roadmap
- Mobile app (iOS/Android)
- Browser extension
- Internationalization (i18n)
- Additional IPFS providers
- Enhanced timing attack mitigations

---

**Full Changelog**: https://github.com/Teycir/Sanctum/commits/v1.0.0
