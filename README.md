<div align="center">

![License](https://img.shields.io/badge/license-BSL-neon_green?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-XChaCha20--Poly1305-neon_green?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-IPFS-neon_green?style=for-the-badge)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-neon_green?style=for-the-badge)

<a href="https://sanctumvault.online">
  <img src="public/sanctum_ascii.svg" alt="Sanctum Vault Animation">
</a>

**Zero-trust encrypted vault system for high-risk users.**

### _"What cannot be proven to exist cannot be coerced."_

[Create a Vault](#-quick-start) · [View Architecture](#️-architecture) · [Report Bug](https://github.com/teycir/Sanctum/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Operating Modes](#-operating-modes)
- [Architecture](#️-architecture)
- [Security Attack Scenarios](#️-security-attack-scenarios)
- [Storage Providers](#-storage-providers)
- [FAQ](#-faq)
- [Project Status](#-project-status)
- [Contributing](#-contributing)
- [License](#-license)

---

## ⚡ Overview

**Sanctum** is a zero-trust, client-side encrypted vault system designed for activists, journalists, whistleblowers, and anyone facing physical duress, device seizure, or censorship. It provides **cryptographically sound plausible deniability** through passphrase-derived hidden layers while leveraging decentralized IPFS storage.

### Why is this different?

> Most "secure storage" apps rely on "trust me bro" promises. Sanctum is **Cryptographically Deniable** with **Decentralized Storage**.

### Key Features

-🎭 **Plausible Deniability** - Hidden layers indistinguishable from decoy content
- 🌐 **Decentralized Storage** - Data pinned on IPFS via free services (Pinata/Filebase)
- 🔑 **XChaCha20-Poly1305** - Military-grade encryption with split-key architecture
- 🚫 **Zero Server Trust** - All crypto operations in browser, keys never touch server
- 💰 **100% Free** - No credit card required, stack multiple free tiers
- 🔒 **Auto-Lock** - Locks after 5 minutes of inactivity
- ⚡ **Panic Key** - Double-press Escape for instant lockout
- 📋 **Secure Clipboard** - Auto-clears after 60 seconds
- 📦 **File Support** - Upload .zip/.rar archives up to 25MB

---

## 🚀 Quick Start

### For Users

1. Visit [sanctumvault.online](https://sanctumvault.online)
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

See [QUICK-START.md](./docs/QUICK-START.md) for detailed setup instructions.

## 📚 Documentation

- [Project Status](./docs/PROJECT-STATUS.md) - Current implementation status
- [Security Features](./docs/SECURITY-FEATURES.md) - Auto-lock, panic key, secure clipboard
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
- **Without passphrase (or decoy passphrase)** → Shows decoy layer
- **With hidden passphrase** → Shows hidden layer (real secrets)
- **Two separate CIDs** → Each layer stored independently on IPFS

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 + React + Web Crypto API
- **Hosting**: Cloudflare Pages (static site, free tier)
- **Database**: Cloudflare D1 (split-key storage)
- **Cryptography**: @noble/ciphers + @noble/hashes (XChaCha20-Poly1305, Argon2id)
- **Storage**: IPFS via Pinata/Filebase with public gateway fallback
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
│  │   • Split-key architecture │   │
│  │   • Auto-clear on idle      │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ├──────────► Cloudflare D1
               │            • Encrypted KeyB
               │            • Encrypted CIDs
               │            • Vault metadata
               │
               ├──────────► IPFS (Pinata/Filebase)
               │            • Encrypted blobs
               │            • Public gateways
               │            • Decentralized storage
```

**Critical**: All encryption client-side. Server only stores encrypted fragments.

## 🛡️ Security: Attack Scenarios

### "Can I just reveal the passphrase under torture?"

**✅ YES, BY DESIGN.** Reveal the decoy layer. The adversary:
- Sees funded wallet + innocent files
- **Cannot prove** hidden layers exist
- Cryptographically indistinguishable from simple vault

### "What if they analyze the encrypted blob size?"

**✅ MITIGATED.** Each layer is padded to standard sizes, making size analysis unreliable.

### "Can they brute-force the passphrase?"

**❌ NO.** Argon2id with 256MB memory and 3 iterations makes brute-force computationally infeasible. Use strong passphrases (6+ Diceware words).

### "What if they seize the IPFS providers?"

**✅ SAFE.** Data is encrypted before upload. Providers only see encrypted blobs. Without your passphrase and vault link, decryption is impossible.

### "What if they compromise Cloudflare Workers?"

**⚠️ LIMITED IMPACT.** Attacker gets encrypted metadata only. Cannot get: Passphrases, decrypted content, or KeyA (in URL).

### "What if I lose the vault link?"

**💀 LOST FOREVER.** No recovery mechanism exists (by design). **Save your links securely.**

### "Can I delete a vault after creating it?"

**❌ NO.** IPFS data is immutable. **Workaround:** Don't share the link.

---

### Threat Model Coverage

- ✅ **Physical duress** ($5 wrench attacks, torture)
- ✅ **Device seizure** (law enforcement, border control)
- ✅ **Censorship** (government blocking, deplatforming)
- ✅ **Long-term availability** (data permanence)

### Security Features

- **Plausible Deniability** - No metadata reveals hidden layers
- **Split-Key Architecture** - KeyA (URL) + KeyB (encrypted in DB with HKDF)
- **Timing Attack Prevention** - Constant-time decryption prevents layer detection
- **CID Encryption** - IPFS CIDs encrypted with master key (KeyA + KeyB)
- **Auto-Lock** - Locks vault after 5 minutes of inactivity
- **Panic Key** - Double-press Escape for instant lockout
- **Secure Clipboard** - Auto-clears after 60 seconds
- **Rate Limiting** - 5 attempts/min per vault, 50/hour per fingerprint
- **CSRF Protection** - Origin/referer validation
- **Security Headers** - X-Frame-Options, CSP, nosniff

### OpSec Best Practices

⚠️ **Critical Security Practices**:

1. **Fund decoy wallet** with realistic amounts ($50-500)
2. **MEMORIZE passphrases** - never store digitally
3. **Use Tor Browser** for maximum anonymity
4. **Clear browser data** after each use
5. **Test decoy layer** before relying on it
6. **Never reveal** you have hidden layers

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

1. Open the vault link
2. Enter passphrase (no passphrase = decoy, correct passphrase = hidden)
3. Download or copy the decrypted content

### What if I lose the vault link?

**💀 LOST FOREVER.** No recovery mechanism exists (by design).

**Best practices:** Save in password manager, print QR code, never share over unencrypted channels

### What are the file size limits?

**Maximum: 25 MB** (per file, .zip or .rar archives supported)

## 📊 Project Status

**Phase**: Production Ready ✅  
**Tests**: 115/115 passing (19 test suites)  
**Coverage**: Core crypto, duress layers, storage, services, vault expiry, security features

See [PROJECT-STATUS.md](./docs/PROJECT-STATUS.md) for details.

## 💼 Contributing

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

- **Website**: [sanctum-vault.pages.dev](https://sanctum-vault.pages.dev)
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
