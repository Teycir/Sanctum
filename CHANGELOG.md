# Changelog

All notable changes to Sanctum will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-08

### Added - UI/UX Enhancements
- **3D Tubes Cursor Effect**: Interactive Three.js-based cursor animation with animated tubes following mouse movement
  - 14 animated tubes with customizable colors and lighting
  - Motion parallax and bloom effects for depth
  - Smooth fade-in transition to prevent loading flash
  - WebGPU warnings suppressed for cleaner console
  - Applied to all pages including lock screen overlay
- **TextPressure Animation**: Mouse proximity-based text animation for all major titles
  - Dynamic font weight changes based on cursor distance
  - Mobile touch support with proper event handling
  - Applied to: Home page "Sanctum", Create page "Create Vault", Unlock page "Unlock Vault"
  - Graceful fallback on mobile (bold text by default)
- **Lock Screen Enhancement**: TubesCursor animation continues on lock screen with semi-transparent backdrop

### Changed - IPFS Download Optimization
- Optimized gateway priority: Pinata gateway first, then ipfs.io (removed unreliable dweb.link)
- Parallel gateway racing for faster downloads (Promise.race)
- Fixed gateway URL construction (was causing 404 errors)
- Added retry logic with exponential backoff (3 attempts per gateway)
- Updated CSP headers to allow IPFS subdomain gateways
- Download speeds now match upload speeds

### Security - Timing Attack Documentation
- **CRITICAL**: Documented timing attack limitations in JavaScript implementation
- Added comprehensive security notice in `lib/duress/layers.ts`:
  - Protected: Cryptographic analysis, static analysis, metadata analysis, forensic disk analysis
  - Vulnerable (theoretical): High-precision timing, memory patterns, CPU cache, JIT optimization, GC timing
  - Threat model clarification: Safe for physical coercion, risky for lab-controlled timing attacks
- Updated README.md with timing attack limitations section
- Recommendations: Use Tor Browser, avoid unlocking under surveillance, native implementation for maximum security
- Acknowledged JavaScript cannot provide true constant-time execution

### Fixed
- Fixed TubesCursor component to properly fade in (prevents flash of unstyled canvas)
- Fixed mobile text animation support (touch events now trigger TextPressure effect)
- Removed unused `isReady` state variable in TubesCursor
- Fixed IPFS gateway errors (removed broken `.ipfs.dweb.link/` URLs)
- Suppressed WebGPU console warnings for cleaner developer experience

### Technical Debt
- Removed stroke prop from TextPressure (not implemented in component)
- Cleaned up unused imports and state variables
- Improved code organization in cursor and text animation components

## [1.1.0] - 2025-01-07

### Security
- **CRITICAL**: Implemented RAM-only storage for all sensitive data (JWT, credentials, encryption salts)
- **CRITICAL**: Removed localStorage persistence to prevent forensic recovery after device seizure
- Ephemeral salts regenerated per session (no disk persistence)
- Zero forensic evidence - all keys cleared on tab close
- Immune to disk carving and SSD wear-leveling recovery
- Added warrant canary with quarterly updates for transparency on legal demands

### Added
- Comprehensive OpSec guidelines with 10 critical security sections
- Threat-specific guidance for border crossings, authoritarian regimes, domestic abuse, whistleblowing
- 12 documented attack scenarios with detailed countermeasures in FAQ
- Verification checklist for high-risk users
- Emergency procedures including panic key and dead man's switch
- Self-hosting instructions for maximum security
- Documentation: `docs/security/RAM-ONLY-STORAGE.md`
- Documentation: `docs/security/OPSEC-FIX-RAM-ONLY.md`

### Changed
- `lib/storage/jwt.ts`: Replaced localStorage with RAM-only variable
- `lib/storage/filebase-credentials.ts`: Replaced localStorage with RAM-only variable
- `lib/storage/device-encryption.ts`: Ephemeral salt generation (no localStorage)
- `lib/storage/credentials.ts`: Replaced localStorage with RAM-only variable
- `public/faq.html`: Added 12 attack scenarios with countermeasures
- `README.md`: Added warrant canary and comprehensive OpSec section

### Impact
- **User Experience**: Must re-enter IPFS credentials each session (no "remember me")
- **Security Benefit**: True zero-trust architecture, forensic-resistant
- **Threat Model**: Aligned with high-risk users facing device seizure

### Testing
- All 115 tests passing (19 test suites)
- RAM-only storage verified
- No breaking changes to API

### Security
- **CRITICAL**: Fixed timing attack vulnerability in vault unlocking - now uses constant-time execution to prevent layer detection
- Implemented split-key architecture with HKDF + XChaCha20-Poly1305 (server-side KeyB encryption)
- CID encryption with master key prevents direct IPFS access
- Removed insecure server secret exposure endpoint
- Synthetic nonces (hash of plaintext + key) protect against RNG failure
- Argon2id with strong defaults (64MB+ memory cost) prevents brute-force attacks
- Proper memory wiping with random bytes before zeroing for sensitive data

### Fixed
- Validation error messages now display cleanly instead of showing malformed JSON with HTML entities
- Fixed variable name collision in KeyB encryption (nonce shadowing)
- Removed obsolete endpoints and dead code (retrieve-key.js, split-key-vault.ts, cid-encryption.ts)
- Backend vault retrieval now correctly decrypts KeyB server-side before returning to client

### Changed
- Migrated from `String.fromCharCode()` to `String.fromCodePoint()` for better Unicode support
- Replaced regex-based `replace()` with `replaceAll()` for cleaner code

### Verified
- All 94 tests passing
- Security audit completed - cryptography, memory hygiene, and timing attacks addressed
- Split-key architecture verified: KeyA (URL) + KeyB (encrypted in DB) + master key derivation

## [1.0.0] - 2026-01-04

### Added
- Initial release
- Duress vault with plausible deniability
- XChaCha20-Poly1305 encryption
- Split-key architecture
- IPFS storage (Pinata/Filebase)
- Cloudflare Pages hosting
- Cloudflare D1 database
- Rate limiting and honeypot detection
- Comprehensive test suite (59 tests)
- Auto-lock security feature (5 min inactivity)
- Panic key (double-press Escape)
- Secure clipboard (60s auto-clear)

[Unreleased]: https://github.com/teycir/Sanctum/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/teycir/Sanctum/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/teycir/Sanctum/releases/tag/v1.0.0


### Changed
- Extracted device encryption logic to reusable `lib/storage/device-encryption.ts` utility
- Refactored `lib/storage/jwt.ts` to use shared device encryption (removed 50+ lines of duplicate code)
- Refactored `lib/storage/filebase-credentials.ts` to use shared device encryption (removed 50+ lines of duplicate code)
- Extracted security timing constants to `lib/crypto/constants.ts` (SECURITY object)
- Updated `lib/security/auto-lock.ts` to use named constants
- Updated `lib/security/clipboard.ts` to use named constants
- Updated `lib/security/panic-key.ts` to use named constants
- Fixed error handling in device encryption to check for expected errors and re-throw unexpected ones
- Fixed error handling in clipboard auto-clear to check for NotAllowedError
- Fixed error handling in filebase credentials to check for SyntaxError
