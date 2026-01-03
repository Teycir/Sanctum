<div align="center">

![License](https://img.shields.io/badge/license-BSL-neon_green?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-XChaCha20--Poly1305-neon_green?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-IPFS-neon_green?style=for-the-badge)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-neon_green?style=for-the-badge)

# 🎭 Sanctum

**Cryptographically sound plausible deniability for high-risk users.**

### _"What cannot be proven to exist cannot be coerced."_

[Create a Vault](#-quick-start) · [View Architecture](#️-architecture) · [Report Bug](https://github.com/teycir/Sanctum/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Operating Modes](#-operating-modes)
- [Architecture](#️-architecture)
- [Security](#️-security-attack-scenarios)
- [Storage Providers](#-supported-storage-providers)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)

---

## ⚡ Overview

**Sanctum** is a zero-trust, client-side encrypted vault system designed for activists, journalists, whistleblowers, and anyone facing physical duress, device seizure, or censorship. It provides **cryptographically sound plausible deniability** through passphrase-derived hidden layers while leveraging decentralized IPFS storage.

### Why is this different?

> Most "secure storage" apps rely on "trust me bro" promises. Sanctum is **Cryptographically Deniable** with **Decentralized Storage**.

### Key Features

- 🎭 **Plausible Deniability** - Hidden layers indistinguishable from decoy content
- 🌐 **Decentralized Storage** - Data pinned on IPFS via user-provided free services  
- 🔑 **Split-Key Encryption** - AES-GCM-256 with keys split between server and URL
- 🚫 **Zero Server Trust** - All crypto operations happen in your browser
- 💰 **100% Free** - No credit card, no paid services, stack multiple free tiers

---

## 🚀 Quick Start

### For Users

1. Visit [duress.vault](https://duress.vault) (coming soon)
2. Configure Pinata or Filebase (free IPFS providers)
3. Create your vault with optional decoy content
4. Set passphrase for hidden layer
5. Share the link - only you know the passphrase

### For Developers

```bash
# Clone repository
git clone https://github.com/Teycir/Sanctum.git
cd Sanctum

# Install dependencies
npm install

# Login to Cloudflare (for deployment)
npx wrangler login

# Run development server
npm run dev
```

See [QUICK-START.md](./QUICK-START.md) for detailed setup instructions.

## 📚 Documentation

- [Project Status](./docs/PROJECT-STATUS.md) - Current implementation status
- [Technical Specification](./docs/core/SPECIFICATION.md) - Complete technical spec
- [Implementation Plan](./docs/core/IMPLEMENTATION-PLAN.md) - Development roadmap

## 🔒 Operating Modes

### 1️⃣ Simple Secure Vault

**Use Case:** Secure backup of sensitive data without duress concerns.

Basic encrypted storage without deniability. Single encrypted blob uploaded to IPFS.

---

### 2️⃣ Duress Hidden (Current Implementation)

**Use Case:** $5 wrench attacks, device seizures, coercion scenarios.

**How it works:**
- **Without passphrase** → Shows decoy (innocent files, small funded wallet)
- **With correct passphrase** → Shows hidden layer (real secrets)
- **Single CID** → Impossible to prove hidden layer exists

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 + React + Web Crypto API
- **Hosting**: Cloudflare Pages (static site, free tier)
- **Database**: Cloudflare D1 (split-key storage)
- **Cryptography**: @noble/ciphers + @noble/hashes (XChaCha20-Poly1305, Argon2id)
- **Storage**: IPFS via Pinata (primary) with public gateway fallback
- **State**: RAM-only (Web Workers, no persistence)
  - Keys never written to disk
  - Auto-wiped on browser close
  - Protected from disk forensics
  - Isolated in Web Worker memory
- **Backend**: Minimal (only split-key storage, no content access)

### Zero-Trust Design

```
┌─────────────────────────────────────┐
│           Browser (Client)          │
│  ┌─────────────────────────────┐   │
│  │   Web Worker (RAM-only)     │   │
│  │   • Argon2id key derivation │   │
│  │   • XChaCha20 encryption    │   │
│  │   • 3-layer encryption      │   │
│  │   • Auto-clear on idle      │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ├──────────► Cloudflare D1
               │            • Encrypted Key A
               │            • Encrypted CIDs
               │            • Access logs
               │
               └──────────► IPFS Pinata
                            • Encrypted blobs
                            • Public gateways
```

**Critical**: All encryption client-side. Server only stores encrypted fragments.

## 🛡️ Security: Attack Scenarios

### "Can I just reveal the passphrase under torture?"

**✅ YES, BY DESIGN.** Reveal the decoy layer. The adversary:
- Sees funded wallet + innocent files
- **Cannot prove** hidden layers exist
- Has no metadata indicating additional content
- Cryptographically indistinguishable from simple vault

### "What if they analyze the encrypted blob size?"

**❌ NO.** All layers are encrypted and concatenated into a single blob. Size analysis reveals nothing about layer count or content.

### "Can they brute-force the passphrase?"

**❌ NO.** Argon2id with 256MB memory and 3 iterations makes brute-force computationally infeasible. Use strong passphrases (6+ Diceware words).

### "What if they seize the IPFS providers?"

**✅ SAFE.** Data is triple-encrypted:
1. Passphrase encryption (user secret)
2. Master key encryption (Key A + Key B)
3. CID storage encryption (prevents direct access)

Providers only see encrypted blobs. Without vault access through our API, decryption is impossible.

### "Can they force the server to reveal Key A?"

**❌ NO.** Key A is encrypted and stored on server. Key B is in the URL hash, never sent to server. Server only has encrypted Key A fragment, which requires Key B (in URL) to decrypt.

### "What if they compromise Cloudflare Workers?"

**⚠️ LIMITED IMPACT.** Attacker gets:
- Encrypted Key A fragments (need Key B from URL)
- Vault metadata (CID list, mode)
- **Cannot get**: Passphrases, decrypted content, Key B

### "Can timing attacks reveal hidden layers?"

**❌ NO.** Constant-time operations prevent timing-based information leakage. Decoy and hidden decryption take identical time.

### "What if I lose the vault link?"

**💀 LOST FOREVER.** Key B is in the URL hash. No Key B = No decryption. **Save your links securely.**

### "Can the admin/creator decrypt my vault?"

**❌ NO.** Not even the creator can decrypt without:
1. Vault link (Key B in URL hash)
2. Passphrase (for hidden layers)

Server only stores encrypted fragments and CIDs.

### "Can I delete a vault after creating it?"

**❌ NO.** Vaults are immutable once created. Data is pinned on IPFS and cannot be deleted by the server.

**Workaround:** Create new vault and don't share old link.

---

### Threat Model Coverage

- ✅ **Physical duress** ($5 wrench attacks, torture)
- ✅ **Device seizure** (law enforcement, border control)
- ✅ **Censorship** (government blocking, deplatforming)
- ✅ **Long-term availability** (data permanence)

### Security Features

- **3-Layer Encryption**: Passphrase → Master Key (Split) → CID Storage
- **Plausible Deniability**: No metadata reveals hidden layers
- **Timing Attack Prevention**: Constant-time operations with random delays
- **Split-Key Architecture**: Key A (server, encrypted) + Key B (URL hash)
- **Rate Limiting**: 5 attempts/min per vault, 50/hour per fingerprint
- **Honeypot Detection**: Auto-ban enumeration attacks
- **Request Fingerprinting**: SHA-256(IP + User-Agent)
- **Suspicious Pattern Detection**: >10 vaults in 5min = blocked
- **CID Encryption**: Prevents direct Pinata access bypass
- **Input Validation**: Vault ID, key format, request size checks
- **CSRF Protection**: Origin/referer validation
- **Security Headers**: X-Frame-Options, CSP, nosniff
- **Access Logging**: Full audit trail with fingerprints
- **Nonce Replay Protection**: Prevent replay attacks

### OpSec Best Practices

⚠️ **Critical Security Practices**:

1. Fund your decoy wallet with realistic amounts ($50-500)
2. MEMORIZE passphrases - never store digitally
3. Use Tor Browser for maximum anonymity
4. Clear browser cache/history after use
5. Test decoy layer before relying on it
6. Never reveal you have hidden layers

See [OPSEC.md](./docs/OPSEC.md) for comprehensive guidelines.

## 🌐 Storage Providers

### Pinata
- **Free Tier**: 1 GB storage, 500 files, 10 GB bandwidth/month
- **Signup**: Email only (no credit card)

### Filebase
- **Free Tier**: 5 GB storage, unlimited bandwidth
- **Signup**: Email only (no credit card)

## ❓ FAQ

### Why do I see 2 files on IPFS even with empty decoy?

**This is a security feature, not a bug.** Duress vaults always upload 2 encrypted blobs:

1. **Decoy blob** - Even if empty, creates cryptographic chaff
2. **Hidden blob** - Your actual secret content

**Security advantages:**
- **Metadata resistance** - Adversary cannot determine which blob is decoy vs hidden
- **Plausible deniability** - You can claim "I forgot the other passphrase" or "It's a backup"
- **Consistent behavior** - All vaults look identical (2 blobs, same size), preventing pattern analysis
- **Future-proofing** - Can add decoy content later without changing structure

Even "empty" encrypted blobs have minimum size (salt + nonce + auth tag + padding), making them indistinguishable from real data. This is exactly how VeraCrypt's hidden volumes work.

**The small IPFS storage cost (~few KB) is worth the security benefit.**

### How do I unlock a vault?

1. Open the vault link (contains Key B in URL hash)
2. **Without passphrase**: See decoy content
3. **With passphrase**: See hidden content
4. Download or copy the decrypted content

### What if I lose the vault link?

**Lost forever.** No recovery mechanism exists (by design).

**Best practices:**
- Save vault links in password manager
- Print QR code for physical backup
- Never share vault links over unencrypted channels

### How secure is the URL hash?

URL hash (#KeyB) is never sent to server. Treat vault links like passwords.

**Risks:** Browser history, bookmarks, extensions can access it.

**Mitigation:** Use Tor Browser, clear history after use.

### What are the file size limits?

**Maximum: 10 MB** (configurable for self-hosted instances)

### How long do vaults last?

**Indefinitely** (as long as IPFS providers maintain the data and your account remains active)

---

### Prerequisites

- Node.js 18+
- Cloudflare account (for Pages deployment)
- Modern browser with Web Crypto API support

### Project Structure

```
Sanctum/
├── app/
│   ├── api/              # API routes
│   ├── components/       # React components
│   └── v/[id]/          # Vault viewer page
├── lib/
│   ├── crypto.ts        # Split-key encryption (from TimeSeal)
│   ├── duress.ts        # Layer derivation (new)
│   ├── ipfs.ts          # IPFS uploads (new)
│   └── [35+ libraries]  # Reused from TimeSeal
├── migrations/          # Database schemas
└── docs/               # Documentation
```

### Code Reuse from TimeSeal

**Sanctum builds on TimeSeal's proven patterns**:

- ✅ Client-side cryptography architecture
- ✅ UI components & animations
- ✅ Security best practices
- ✅ Zero-trust design philosophy

See [TimeSeal](https://github.com/Teycir/TimeSeal) for the parent project.

### Building

```bash
# Development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Test
npm test
```

## 📊 Project Status

**Phase**: Foundation Complete ✅  
**Tests**: 59/59 passing  
**Coverage**: Core crypto, duress layers, storage, services

See [PROJECT-STATUS.md](./docs/PROJECT-STATUS.md) for details.

## 💼 Services Offered

- 🔒 **Privacy-First Development** - P2P applications, encrypted communication, zero-knowledge systems
- 🚀 **Web Application Development** - Full-stack development with Next.js, React, TypeScript
- 🛡️ **Security Tool Development** - Cryptographic systems, penetration testing tools, automation
- 🤖 **AI Integration** - LLM-powered applications, intelligent automation, custom AI solutions

**Get in Touch**: [teycirbensoltane.tn](https://teycirbensoltane.tn) | Available for freelance projects and consulting

---

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Areas We Need Help

- 🔐 Security auditing
- 🧪 Testing (unit, integration, e2e)
- 📱 Mobile app development
- 🌍 Internationalization
- 📚 Documentation
- 🎨 UI/UX improvements

## 📜 License

Business Source License 1.1 - see [LICENSE](./LICENSE) for details.

**Summary**: Free for non-production use. Production use requires a commercial license after 4 years from release date.

## 🙏 Acknowledgments

- **TimeSeal** - Parent project providing cryptographic patterns
- **Cloudflare Pages** - Free static site hosting
- **Pinata** - Free IPFS pinning service
- **VeraCrypt** - Inspiration for plausible deniability

## 🔗 Links

- **Website**: [duress.vault](https://duress.vault) (coming soon)
- **GitHub**: [github.com/Teycir/Sanctum](https://github.com/Teycir/Sanctum)
- **TimeSeal**: [timeseal.online](https://timeseal.online)
- **Documentation**: [docs.duress.vault](https://docs.duress.vault) (coming soon)

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/Teycir/Sanctum/issues)
- **Security**: security@duress.vault (PGP key coming soon)
- **Twitter**: [@Sanctum](https://twitter.com/Sanctum) (coming soon)

## ⚖️ Legal & Ethics

### Intended Use Cases

✅ **Legitimate Privacy Needs**:
- Journalists protecting sources
- Activists in authoritarian regimes
- Crypto holders preventing theft
- Whistleblowers securing evidence
- Individuals under threat of violence

❌ **Prohibited Use**:
- Illegal content storage
- Facilitating crimes
- Evading lawful investigations (where no duress exists)

### Disclaimer

Sanctum is a tool for legitimate privacy and security needs. Users are responsible for complying with local laws. The developers do not condone illegal activities.

---

<div align="center">

**Built with ❤️ and 🔒 by [Teycir Ben Soltane](https://teycirbensoltane.tn)**


</div>
