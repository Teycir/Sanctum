# Changelog

All notable changes to Sanctum will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Validation error messages now display cleanly instead of showing malformed JSON with HTML entities

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
