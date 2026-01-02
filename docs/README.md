# Sanctum Documentation

Welcome to the Sanctum documentation. This directory contains all technical documentation, guides, and specifications.

**Architecture**: Browser-only, zero backend, RAM-only mandatory, Helia IPFS.

## 📂 Directory Structure

```
docs/
├── core/                           # Core technical documentation
│   ├── SPECIFICATION.md            # Complete technical specification
│   ├── IMPLEMENTATION-PLAN.md      # Development roadmap and phases
│   ├── IMPLEMENTATION-SUMMARY.md   # Quick overview and next steps
│   ├── FILE-STRUCTURE.md           # Complete project structure
│   └── ROADMAP.md                  # Timeline and milestones
├── guides/                         # Developer guides
│   ├── QUICK-START.md              # Get started in 1 hour
│   ├── TIMESEAL-REUSE-MAP.md       # Code reuse strategy from TimeSeal
│   ├── MODULAR-ARCHITECTURE.md     # Modular design patterns
│   ├── UI-REUSE-GUIDE.md           # Reusing TimeSeal UI components
│   └── BACKEND-REUSE-GUIDE.md      # Reusing TimeSeal libraries
├── security/                       # Security documentation (coming soon)
│   ├── THREAT-MODEL.md             # Threat analysis
│   ├── AUDIT-LOG.md                # Security audit reports
│   └── OPSEC.md                    # Operational security guidelines
└── user/                           # User documentation (coming soon)
    ├── HOW-IT-WORKS.md             # Understanding Sanctum
    ├── FAQ.md                      # Frequently asked questions
    └── TUTORIALS.md                # Step-by-step tutorials
```

## 🚀 Quick Links

### For Developers

**Start Here:**
1. ⭐ [Implementation Summary](./core/IMPLEMENTATION-SUMMARY.md) - **START HERE** - Quick overview
2. [File Structure](./core/FILE-STRUCTURE.md) - Complete project layout
3. [TimeSeal Reuse Map](./guides/TIMESEAL-REUSE-MAP.md) - What to copy from TimeSeal
4. [Modular Architecture](./guides/MODULAR-ARCHITECTURE.md) - Design patterns and templates

**Deep Dive:**
5. [Technical Specification](./core/SPECIFICATION.md) - Complete technical spec
6. [Implementation Plan](./core/IMPLEMENTATION-PLAN.md) - 28-day development roadmap
7. [Project Roadmap](./core/ROADMAP.md) - Timeline and milestones

**Code Reuse:**
- [TimeSeal Reuse Map](./guides/TIMESEAL-REUSE-MAP.md) - 15 files to copy, 3 to adapt
- [UI Reuse Guide](./guides/UI-REUSE-GUIDE.md) - TimeSeal UI components
- [Backend Reuse Guide](./guides/BACKEND-REUSE-GUIDE.md) - Browser-side utilities only

### For Users (Coming Soon)

- How It Works - Understanding plausible deniability
- OpSec Best Practices - Security guidelines for high-risk users
- FAQ - Common questions and answers
- Tutorials - Step-by-step guides for each vault mode

### For Security Researchers (Coming Soon)

- Threat Model - Attack scenarios and mitigations
- Security Audit Reports - Third-party security assessments
- Responsible Disclosure - How to report vulnerabilities

## 🎯 Architecture

### Browser-Only
- All crypto operations in browser
- Helia (browser IPFS node)
- URL hash state only
- No backend server
- No database
- No API routes

### RAM-Only (Mandatory)
- Web Worker isolation
- 60s idle timeout
- Auto-clear on tab hidden
- No localStorage
- No sessionStorage
- No IndexedDB
- No disk writes

### Cryptography
- **Cipher**: XChaCha20-Poly1305
- **KDF**: Argon2id + HKDF
- **Nonces**: Synthetic (random + deterministic)
- **Commitment**: SHA-256 key commitment
- **Padding**: Size class padding (1KB-16MB)

### Storage
- **Primary**: Helia (browser IPFS node)
- **Recovery**: IPFS CID / Export file / Shamir shares
- **P2P only**: No fallback gateways

## 📋 Implementation Status

| Phase | Duration | Status |
|-------|----------|--------|
| 0. Documentation | 1 day | ✅ Complete |
| 1. Foundation & Reuse | 2 days | 🔵 In Progress |
| 2. Core Crypto | 5 days | 🟡 Planned |
| 3. Duress & Storage | 7 days | 🟡 Planned |
| 4. Recovery & Polish | 7 days | 🟡 Planned |
| 5. Testing & Security | 5 days | 🟡 Planned |
| 6. Deploy | 1 day | 🟡 Planned |

**Total**: 28 days

### Current Phase: Foundation
- [x] Complete documentation
- [x] File structure defined
- [x] Reuse strategy mapped
- [ ] Copy TimeSeal reusables
- [ ] Implement crypto constants
- [ ] Implement crypto utils

## 🔧 Technology Stack

```
Frontend:  Next.js 15 + React 18 + Tailwind
Crypto:    @noble/hashes + @noble/ciphers
Storage:   Helia (browser IPFS)
State:     URL hash only
Workers:   Web Workers (RAM isolation)
Deploy:    Cloudflare Pages (static)
```

## 📖 Documentation Standards

All documentation follows these principles:

1. **Clear and Concise** - No unnecessary jargon
2. **Actionable** - Includes code examples and commands
3. **Up-to-Date** - Reflects current implementation
4. **Security-Focused** - Emphasizes threat models and mitigations

## 🤝 Contributing to Documentation

We welcome documentation improvements! Please:

1. Keep the same structure and formatting
2. Include code examples where applicable
3. Update the table of contents
4. Test all commands and links
5. Submit a pull request

## 📞 Questions?

- **GitHub Issues**: [Report documentation issues](https://github.com/Teycir/Sanctum/issues)
- **Discussions**: [Ask questions](https://github.com/Teycir/Sanctum/discussions)

---

**Last Updated**: January 2026  
**Documentation Version**: 1.0  
**Spec Version**: 1.0
