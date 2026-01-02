<div align="center">

![License](https://img.shields.io/badge/license-BSL-neon_green?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-AES--GCM--256-neon_green?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-IPFS-neon_green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge)

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
- ⛓️ **Progressive Disclosure** - Reveal layers under escalating pressure

---

## 🚀 Quick Start

### For Users

1. Visit [duress.vault](https://duress.vault) (coming soon)
2. Select vault mode (Simple, Hidden, Chain, or Stego)
3. Configure free IPFS providers (Filebase + Pinata)
4. Create your vault with optional passphrase
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

### Core Documentation
- [Technical Specification](./docs/core/SPECIFICATION.md) - Complete technical specification
- [Implementation Plan](./docs/core/IMPLEMENTATION-PLAN.md) - Development roadmap and phases
- [Project Roadmap](./docs/core/ROADMAP.md) - Timeline and milestones

### Developer Guides
- [Quick Start Guide](./docs/guides/QUICK-START.md) - Get up and running in 1 hour
- [UI Reuse Guide](./docs/guides/UI-REUSE-GUIDE.md) - Reusing TimeSeal UI components
- [Backend Reuse Guide](./docs/guides/BACKEND-REUSE-GUIDE.md) - Reusing TimeSeal libraries

### User Guides (Coming Soon)
- [How It Works](./docs/HOW-IT-WORKS.md) - Understanding Sanctum
- [OpSec Best Practices](./docs/OPSEC.md) - Security guidelines
- [FAQ](./docs/FAQ.md) - Frequently asked questions

## 🔒 Operating Modes

### 1️⃣ Simple Secure Vault

**Use Case:** Secure backup of sensitive data without duress concerns.

Basic encrypted storage without deniability. Single encrypted blob uploaded to IPFS.

---

### 2️⃣ Duress Hidden (Primary Mode)

**Use Case:** $5 wrench attacks, device seizures, coercion scenarios.

**How it works:**
- **Without passphrase** → Shows decoy (innocent files, small funded wallet)
- **With correct passphrase** → Shows hidden layer (real secrets)
- **Single CID** → Impossible to prove hidden layer exists

```
Base Encrypted Blob
       │
       ├─[No Passphrase]──────────► Decoy Layer (innocent content)
       │
       └─[Correct Passphrase]─────► Hidden Layer (real secrets)
```

---

### 3️⃣ Escalating Chain

**Use Case:** Sophisticated adversaries, prolonged interrogation.

Up to 4 passphrase levels for progressive disclosure under escalating pressure.

**Layers:**
1. **Harmless** (family photos)
2. **Mildly sensitive** (small crypto wallet)
3. **Critical** (activist contacts, evidence)
4. **Ultra-sensitive** (main holdings, identities)

---

### 4️⃣ Stego-Embedded

**Use Case:** Maximum deniability, border crossings, device inspections.

Hide encrypted data inside innocent-looking images using LSB steganography.

**Process:**
1. User uploads cover image (PNG/JPEG)
2. Browser embeds encrypted payload using LSB
3. Upload stego-image to IPFS
4. Retrieval extracts and decrypts hidden data

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 + React + Web Crypto API
- **Hosting**: Cloudflare Pages (static site, free tier)
- **Cryptography**: @noble/ciphers + @noble/hashes (XChaCha20-Poly1305, Argon2id)
- **Storage**: IPFS via Helia (client-side) + user-provided pinning (Filebase/Pinata)
- **State**: RAM-only (Web Workers, no persistence)
- **Backend**: None (fully client-side)

### Zero-Trust Design

```
┌─────────────────────────────────────┐
│           Browser (Client)          │
│  ┌─────────────────────────────┐   │
│  │   Web Worker (RAM-only)     │   │
│  │   • Argon2id key derivation │   │
│  │   • XChaCha20 encryption    │   │
│  │   • Auto-clear on idle      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   Helia (IPFS Client)       │   │
│  │   • Content addressing      │   │
│  │   • P2P retrieval           │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   IPFS Pinning APIs  │
    │   (Filebase, Pinata) │
    │   • User-provided    │
    │   • Free tier        │
    └──────────────────────┘
```

**Critical**: Fully client-side. No backend, no database, no server trust required.

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

**❌ NO.** PBKDF2 with 100,000+ iterations makes brute-force computationally infeasible. Use strong passphrases (6+ Diceware words).

### "What if they seize the IPFS providers?"

**✅ SAFE.** Data is encrypted before upload. Providers only see encrypted blobs. Without Key B (in URL) and passphrase, decryption is impossible.

### "Can they force the server to reveal Key A?"

**❌ NO.** Key A is in the URL hash, never sent to server. Server only has encrypted Key A fragment, which requires Key B (in URL) to decrypt.

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

- **Plausible Deniability**: No metadata reveals hidden layers
- **Timing Attack Prevention**: Constant-time operations
- **Split-Key Architecture**: Keys split between server and URL
- **Rate Limiting**: Protection against brute force
- **CSRF Protection**: Secure cross-origin requests
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

## 🌐 Supported Storage Providers

### Filebase (Recommended Primary)
- **Free Tier**: 5 GB storage, 1,000 files
- **API**: S3-compatible
- **Signup**: Email only (no credit card)
- **Features**: Geo-redundant, fast CDN

### Pinata (Recommended Secondary)
- **Free Tier**: 1 GB storage, 500 files, 10 GB bandwidth/month
- **API**: REST + dedicated gateways
- **Signup**: Email only
- **Features**: Reliable, widely trusted

**Multi-Provider Strategy**: Combine both for 6+ GB free redundant storage.

## ❓ FAQ: How It Works

### How does Sanctum prevent coercion?

**Plausible Deniability Architecture:**

1. Your browser derives multiple keys from a single passphrase using HKDF
2. Each key decrypts a different "layer" of content
3. Without the passphrase, only the decoy layer is visible
4. With the passphrase, the hidden layer is revealed
5. **Critical**: No metadata reveals that hidden layers exist

**Under Duress:**
- Show the decoy layer (funded wallet, innocent files)
- Adversary cannot prove additional layers exist
- Cryptographically indistinguishable from single-layer vault

### How do I create a vault?

1. Visit the Sanctum website (coming soon)
2. Select vault mode (Simple/Hidden/Chain/Stego)
3. Configure IPFS providers (Filebase + Pinata)
   - Enter free API keys (email signup only)
4. Enter content:
   - **Decoy content** (what adversaries see)
   - **Hidden content** (your real secrets)
5. Set passphrase (memorize, never write down)
6. Click "Create Vault"
7. Save vault link securely

### How do I unlock a vault?

1. Open the vault link (contains Key B in URL hash)
2. **Without passphrase**: See decoy content
3. **With passphrase**: See hidden content
4. Download or copy the decrypted content

**Note:** Decryption happens entirely in your browser. The server never sees your decrypted content or passphrase.

### What if I lose the vault link?

**Lost forever.** Key B is in the URL hash. Without it:

- Server cannot decrypt (doesn't have Key B)
- You cannot decrypt (don't have the link)
- No recovery mechanism exists (by design)

**Best practices:**

- Save vault links in password manager
- Use TimeSeal for timed release of vault link
- Print QR code for physical backup
- Never share vault links over unencrypted channels

### Can someone force me to reveal my passphrase?

**This is the core threat model:**

1. **Reveal decoy layer** (no passphrase needed)
2. Adversary sees funded wallet + innocent files
3. **Cannot prove hidden layer exists**
4. Cryptographically indistinguishable from simple vault

**OpSec Critical:**
- Fund decoy wallet with realistic amounts ($50-500)
- Make decoy content believable
- Never hint that hidden layers exist
- Test decoy layer before relying on it

### How secure is the URL hash?

**Very secure by design:**

- URL hash (#KeyB) is never sent to server
- Only visible in your browser
- HTTPS protects it in transit
- Treat vault links like passwords

**Risks to be aware of:**

- Visible in browser history
- Visible in bookmarks
- May appear in referrer logs if you click links from vault page
- Browser extensions can access it

**Mitigation:**

- Use Tor Browser for maximum anonymity
- Clear browser history after use
- Check for browser extensions
- Never paste vault links in public forums

### What are the file size limits?

**Maximum file size: 10 MB (configurable)**

Combined free tier limits:
- Filebase: 5 GB
- Pinata: 1 GB
- **Total**: 6+ GB free storage

**For larger files:**
- Use external storage and seal the download link
- Self-host with custom limits

### How long do vaults last?

**Indefinitely** (as long as IPFS providers maintain the data)

**Provider retention:**
- Filebase: Permanent (while account active)
- Pinata: Permanent (while account active)

**Best practices:**
- Use multiple providers for redundancy
- Periodically verify vault accessibility
- Re-pin to new providers if needed

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

### Current Phase: Foundation (Week 1)

- [x] Project structure
- [x] Documentation
- [ ] Core crypto implementation
- [ ] IPFS integration
- [ ] API routes
- [ ] Frontend MVP

### Roadmap

| Milestone | Duration | Status |
|-----------|----------|--------|
| M0: Setup & Foundation | 1 day | 🔵 In Progress |
| M1: Core Crypto | 3 days | 🟡 Planned |
| M2: IPFS Integration | 3 days | 🟡 Planned |
| M3: API Layer | 2 days | 🟡 Planned |
| M4: Frontend MVP | 4 days | 🟡 Planned |
| M5: Advanced Modes | 3 days | 🟡 Planned |
| M6: Testing & Security | 3 days | 🟡 Planned |
| M7: Polish & Deploy | 2 days | 🟡 Planned |

**Target Launch**: February 2025 (4-6 weeks)

See [docs/core/ROADMAP.md](./docs/core/ROADMAP.md) for detailed timeline.

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
- **Filebase & Pinata** - Free IPFS pinning services
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

**Powered by [TimeSeal](https://timeseal.online) Infrastructure**

</div>
