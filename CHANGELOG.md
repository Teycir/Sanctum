# Changelog

All notable changes to Sanctum will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/teycir/Sanctum/compare/v1.0.0...HEAD
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
