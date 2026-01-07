<div align="center">

![License](https://img.shields.io/badge/license-BSL-neon_green?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-XChaCha20--Poly1305-neon_green?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-IPFS-neon_green?style=for-the-badge)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-neon_green?style=for-the-badge)

<a href="https://sanctumvault.online">
  <img src="public/sanctum_ascii.svg" alt="Sanctum Vault Animation">
</a>

**Zero-trust encrypted vault system for high-risk users.**

### _"Deny everything."_

[Create a Vault](#-quick-start) · [View Architecture](#️-architecture) · [Report Bug](https://github.com/teycir/Sanctum/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Warrant Canary](#-warrant-canary)
- [Quick Start](#-quick-start)
- [Operating Modes](#-operating-modes)
- [Architecture](#️-architecture)
- [Security Attack Scenarios](#️-security-attack-scenarios)
- [OpSec Guidelines](#-opsec-guidelines)
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
- 🧠 **RAM-Only Storage** - No disk persistence, immune to forensic recovery
- 💰 **100% Free** - No credit card required, stack multiple free tiers
- 🔒 **Auto-Lock** - Locks after 5 minutes of inactivity
- ⚡ **Panic Key** - Double-press Escape for instant lockout
- 📋 **Secure Clipboard** - Auto-clears after 60 seconds
- 📦 **File Support** - Upload .zip/.rar archives up to 25MB

---

## 🐦 Warrant Canary

**Last Updated:** January 2025

**Statement:**

As of the date above, Sanctum developers have:

✅ **NOT received any:**
- National Security Letters (NSLs)
- FISA court orders
- Gag orders preventing disclosure of legal demands
- Requests to implement backdoors or weaken encryption
- Requests to log user activity or decrypt user data
- Warrants requiring disclosure of user information

✅ **NOT been:**
- Compelled to modify source code
- Required to hand over cryptographic keys (none exist server-side)
- Forced to compromise the integrity of the system

✅ **Architecture guarantees:**
- Zero-knowledge: We cannot decrypt user vaults (client-side encryption)
- No user logs: We don't collect IP addresses, usage patterns, or metadata
- No backdoors: All code is open-source and auditable
- RAM-only: No persistent storage of keys or credentials

**Verification:**
- This canary is updated quarterly
- Signed commits verify authenticity
- If this section is removed or not updated for >90 days, assume compromise
- Check commit history: `git log --show-signature README.md`

**What We CAN Be Compelled To Do:**
- Take down the hosted service (users can self-host)
- Remove specific vault IDs from our database (data remains on IPFS)
- Provide encrypted vault metadata (useless without KeyA in URL)

**What We CANNOT Be Compelled To Do:**
- Decrypt user vaults (cryptographically impossible)
- Provide user passphrases (never transmitted to server)
- Log future user activity (architecture prevents it)

**If This Canary Dies:**
1. Assume legal compromise
2. Self-host immediately: `npm run dev`
3. Use Tor Browser for all vault access
4. Rotate all passphrases
5. Migrate to new IPFS providers

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
- [RAM-Only Storage](./docs/security/RAM-ONLY-STORAGE.md) - Forensic-resistant architecture
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

### "What if they perform disk forensics on my device?"

**✅ SAFE.** Sanctum uses RAM-only storage with zero disk persistence:
- No localStorage/sessionStorage for sensitive data
- Keys cleared on tab close
- Ephemeral salts regenerated per session
- Immune to disk carving and SSD wear-leveling analysis

See [RAM-ONLY-STORAGE.md](./docs/security/RAM-ONLY-STORAGE.md) for technical details.

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

---

## 🔐 OpSec Guidelines

### Critical Operational Security Rules

#### 1. Device Security

**Before Creating Vault:**
- ✅ Use Tor Browser or VPN
- ✅ Disable browser extensions (can log keystrokes)
- ✅ Use private/incognito mode
- ✅ Verify HTTPS connection
- ❌ Never use public/shared computers
- ❌ Never use work/school devices

**After Creating Vault:**
- ✅ Close all browser tabs
- ✅ Clear browser history/cache
- ✅ Restart browser
- ✅ Verify vault link works before relying on it

#### 2. Passphrase Security

**Strength Requirements:**
- ✅ Minimum 6 Diceware words (e.g., `correct-horse-battery-staple-mountain-river`)
- ✅ Use different passphrases for decoy vs hidden
- ✅ Make decoy passphrase memorable but plausible
- ❌ Never reuse passphrases from other services
- ❌ Never store passphrases digitally

**Memory Techniques:**
- Create a story linking the words
- Practice entering passphrase 10+ times
- Test recall after 24 hours
- Have a trusted contact who knows the passphrase (dead man's switch)

#### 3. Decoy Layer Strategy

**Make It Believable:**
- ✅ Fund decoy wallet with realistic amount ($50-500)
- ✅ Include plausible documents (tax returns, receipts)
- ✅ Add personal photos (non-sensitive)
- ✅ Make it look like "what you're trying to hide"
- ❌ Don't leave decoy empty (suspicious)
- ❌ Don't make it obviously fake

**Plausible Deniability Script:**
> "This is my crypto wallet backup. I keep it encrypted because I'm paranoid about hackers. The passphrase is [decoy passphrase]."

#### 4. Vault Link Management

**Storage Options (Ranked by Security):**

1. **Memory Only** (Most Secure)
   - Memorize the vault ID
   - Reconstruct URL manually
   - Risk: Forget the link

2. **Password Manager** (Recommended)
   - Use KeePassXC or Bitwarden
   - Encrypt database with strong master password
   - Store offline backup

3. **QR Code Print** (Physical Backup)
   - Print QR code on paper
   - Store in safe/safety deposit box
   - Risk: Physical seizure

4. **Encrypted USB** (Portable)
   - Use VeraCrypt container
   - Store on USB drive
   - Risk: Device seizure

**Never:**
- ❌ Email vault links to yourself
- ❌ Store in cloud services (Google Drive, Dropbox)
- ❌ Share over unencrypted messaging (SMS, WhatsApp)
- ❌ Post on social media (even privately)

#### 5. Access Patterns

**When Accessing Vault:**
- ✅ Use Tor Browser (hides IP from IPFS gateways)
- ✅ Access from safe location (home, trusted network)
- ✅ Verify URL before entering passphrase
- ✅ Check for HTTPS and valid certificate
- ❌ Never access from public WiFi
- ❌ Never access from compromised devices

**Timing Considerations:**
- Access during normal hours (avoid 3 AM patterns)
- Don't access immediately before/after sensitive events
- Randomize access intervals

#### 6. Duress Scenarios

**If Coerced to Reveal Passphrase:**

1. **Reveal decoy passphrase** (not hidden passphrase)
2. **Act naturally** - don't show relief when decoy unlocks
3. **Claim ignorance** - "This is all I have"
4. **Never mention** hidden layers exist

**If Device Seized:**

1. **RAM-only storage protects you** - keys cleared on browser close
2. **No forensic evidence** - nothing on disk to recover
3. **Vault link in URL** - KeyA never stored server-side
4. **Plausible deniability** - adversary cannot prove hidden layers exist

**If Threatened with Violence:**

- Your safety > data security
- Reveal decoy layer to de-escalate
- Cryptography protects hidden layer
- Adversary cannot prove you're lying

#### 7. Threat-Specific Guidance

**Border Crossings:**
- Don't carry vault links on device
- Memorize vault ID only
- Access after crossing border
- Use local Tor exit node

**Authoritarian Regimes:**
- Self-host Sanctum on local machine
- Use Tor hidden service
- Avoid government-monitored IPFS gateways
- Consider Tails OS for maximum security

**Domestic Abuse:**
- Access only when safe
- Clear all browser data immediately
- Use decoy layer for "allowed" content
- Hidden layer for escape plans/evidence

**Whistleblowing:**
- Use Tails OS on USB
- Access via Tor only
- Never access from work network
- Use burner IPFS credentials

#### 8. Compromise Indicators

**Assume Compromise If:**
- Warrant canary not updated >90 days
- Unexpected vault access errors
- IPFS gateway returns wrong content
- Browser shows certificate warnings
- Unusual network activity

**Response Plan:**
1. Stop using compromised vault immediately
2. Create new vault with new passphrases
3. Migrate data to new vault
4. Destroy old vault link
5. Self-host if necessary

#### 9. Self-Hosting

**When to Self-Host:**
- Warrant canary dies
- Service unavailable
- Maximum paranoia required
- Custom security requirements

**How to Self-Host:**
```bash
git clone https://github.com/Teycir/Sanctum.git
cd Sanctum
npm install
npm run dev
# Access at http://localhost:3000
```

**Benefits:**
- No reliance on hosted service
- Full control over infrastructure
- Can modify code for specific needs
- Immune to service takedowns

#### 10. Emergency Procedures

**Panic Situations:**
- Double-press `Escape` key (instant lockout)
- Close browser immediately
- Restart device (clears RAM)
- Deny everything

**Dead Man's Switch:**
- Share vault link + decoy passphrase with lawyer
- Share hidden passphrase with trusted contact
- Include instructions in will
- Use time-locked encryption for future access

**Data Destruction:**
- IPFS data is immutable (cannot delete)
- Destroy vault link = data inaccessible
- Forget passphrase = permanent loss
- No recovery mechanism exists

### Verification Checklist

Before relying on Sanctum for high-risk data:

- [ ] Tested decoy layer unlocks correctly
- [ ] Tested hidden layer unlocks correctly
- [ ] Verified vault link works from different device
- [ ] Memorized both passphrases
- [ ] Funded decoy wallet with realistic amount
- [ ] Stored vault link securely (password manager)
- [ ] Practiced duress scenario response
- [ ] Configured Tor Browser
- [ ] Cleared browser data after test
- [ ] Read full OpSec documentation

**Remember:** Cryptography protects data, OpSec protects you.

---

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
