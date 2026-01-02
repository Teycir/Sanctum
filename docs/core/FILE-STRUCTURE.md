# Sanctum File Structure

**Architecture**: Browser-only, zero backend, RAM-only mandatory, Helia IPFS  
**Spec Version**: 1.0  
**Last Updated**: January 2026

---

## 🎯 Design Principles

1. **Browser-Only**: No backend server, no API routes, no database
2. **RAM-Only**: Web Worker isolation, no persistent storage
3. **Reuse TimeSeal**: Leverage 80% of battle-tested infrastructure
4. **Minimal Dependencies**: @noble ecosystem, Helia, React 18
5. **Security-First**: Constant-time operations, memory sanitization

---

## 📁 Complete Project Structure

```
Sanctum/
├── .amazonq/
│   └── rules/
│       └── error-handling.md           # Error handling rules (from TimeSeal)
│
├── app/                                 # Next.js 15 App Router
│   ├── page.tsx                        # Landing page
│   ├── create/
│   │   └── page.tsx                    # Create vault UI
│   ├── open/
│   │   └── page.tsx                    # Open vault UI (URL hash state)
│   ├── layout.tsx                      # Root layout with security headers
│   ├── globals.css                     # Global styles
│   └── components/                     # React components
│       ├── ModeSelector.tsx            # Simple/Hidden/Chain mode picker
│       ├── PassphraseInput.tsx         # Passphrase input with entropy meter
│       ├── EntropyMeter.tsx            # Visual passphrase strength indicator
│       ├── FileUpload.tsx              # Drag & drop file upload
│       ├── VaultViewer.tsx             # Decrypted content display
│       ├── RecoveryShares.tsx          # Shamir shares UI
│       ├── QRCodeDisplay.tsx           # QR codes for shares/CID
│       ├── OpSecWarnings.tsx           # Context-sensitive security warnings
│       ├── CapabilityCheck.tsx         # Browser compatibility check
│       ├── LockTimer.tsx               # Idle countdown display
│       └── ui/                         # shadcn/ui components (from TimeSeal)
│           ├── button.tsx
│           ├── card.tsx
│           ├── input.tsx
│           ├── tooltip.tsx
│           └── ...
│
├── lib/                                # Core libraries
│   ├── crypto/                         # Cryptography (NEW - @noble based)
│   │   ├── constants.ts                # Vault version, Argon2 profiles, size classes
│   │   ├── utils.ts                    # Encoding, constant-time ops, device detection
│   │   ├── capabilities.ts             # Browser capability detection
│   │   ├── core.ts                     # XChaCha20-Poly1305 + synthetic nonces + AAD
│   │   ├── kdf.ts                      # Argon2id + HKDF key separation
│   │   ├── commitment.ts               # Key commitment scheme (verify-first)
│   │   └── padding.ts                  # Size class padding
│   │
│   ├── duress/                         # Duress layers (NEW)
│   │   ├── layers.ts                   # Nested encryption (Simple/Hidden/Chain)
│   │   └── timing.ts                   # Constant-time helpers, dummy derivation
│   │
│   ├── helia/                          # IPFS (NEW)
│   │   └── client.ts                   # Browser IPFS node (Helia)
│   │
│   ├── ram/                            # RAM-only storage (NEW)
│   │   ├── worker.ts                   # Main thread interface
│   │   └── sanitize.ts                 # Memory sanitization utilities
│   │
│   ├── recovery/                       # Recovery mechanisms (NEW)
│   │   ├── shamir.ts                   # Secret sharing (GF256)
│   │   └── shares.ts                   # Share format encoding/decoding
│   │
│   ├── url/                            # URL state management (NEW)
│   │   └── state.ts                    # URL hash encoding/decoding
│   │
│   └── reusable/                       # Reused from TimeSeal
│       ├── memoryProtection.ts         # SecureMemory class (REUSE)
│       ├── cryptoUtils.ts              # Base64, random bytes (REUSE)
│       ├── utils.ts                    # cn() helper (REUSE)
│       ├── qrcode.ts                   # QR code generation (REUSE)
│       └── ui/                         # UI utilities (REUSE)
│           ├── textAnimation.ts        # Text scramble effects
│           └── hooks.ts                # React hooks
│
├── workers/                            # Web Workers
│   ├── crypto.worker.ts                # Heavy crypto operations (Argon2id)
│   └── ram.worker.ts                   # RAM-only vault storage
│
├── hooks/                              # React hooks
│   ├── useVault.ts                     # Vault state management
│   ├── useIdleTimer.ts                 # Activity tracking
│   └── useCapabilities.ts              # Browser feature detection
│
├── __tests__/                          # Test suite
│   ├── crypto/
│   │   ├── core.test.ts                # XChaCha20-Poly1305 tests
│   │   ├── kdf.test.ts                 # Argon2id + HKDF tests
│   │   ├── commitment.test.ts          # Verify-first ordering tests
│   │   └── padding.test.ts             # Size class padding tests
│   ├── duress/
│   │   ├── layers.test.ts              # Layer encryption tests
│   │   └── timing.test.ts              # Timing resistance tests
│   ├── recovery/
│   │   ├── shamir.test.ts              # Secret sharing tests
│   │   └── shares.test.ts              # Share encoding tests
│   ├── ram/
│   │   └── worker.test.ts              # RAM-only storage tests
│   └── integration/
│       ├── e2e-create.test.ts          # End-to-end create flow
│       ├── e2e-open.test.ts            # End-to-end open flow
│       └── e2e-recovery.test.ts        # End-to-end recovery flow
│
├── public/                             # Static assets
│   ├── wordlist.json                   # Diceware wordlist (7776 words)
│   ├── favicon.svg
│   ├── og-image.png
│   └── manifest.json
│
├── docs/                               # Documentation
│   ├── core/
│   │   ├── SPECIFICATION.md            # Complete technical spec
│   │   ├── IMPLEMENTATION-PLAN.md      # Development roadmap
│   │   ├── ROADMAP.md                  # Timeline and milestones
│   │   └── FILE-STRUCTURE.md           # This file
│   ├── guides/
│   │   ├── QUICK-START.md              # Get started in 1 hour
│   │   ├── UI-REUSE-GUIDE.md           # Reusing TimeSeal UI
│   │   └── BACKEND-REUSE-GUIDE.md      # Reusing TimeSeal libraries
│   └── security/
│       ├── THREAT-MODEL.md             # Threat analysis
│       ├── AUDIT-LOG.md                # Security audit reports
│       └── OPSEC.md                    # Operational security guidelines
│
├── migrations/                         # REMOVED (no database)
├── scripts/                            # Build and deployment scripts
│   └── generate-wordlist.ts            # Generate Diceware wordlist
│
├── .gitignore
├── .eslintrc.json
├── next.config.js                      # Security headers, static export
├── package.json
├── tsconfig.json
├── vitest.config.ts                    # Test configuration
├── tailwind.config.js
├── components.json                     # shadcn/ui config
├── README.md
├── LICENSE
└── SECURITY.md                         # Security audit checklist
```

---

## 🔄 Code Reuse from TimeSeal

### ✅ Direct Reuse (Copy as-is)

| File | Purpose | Status |
|------|---------|--------|
| `lib/reusable/memoryProtection.ts` | SecureMemory class | ✅ Copy |
| `lib/reusable/cryptoUtils.ts` | Base64, random bytes | ✅ Copy |
| `lib/reusable/utils.ts` | cn() helper | ✅ Copy |
| `lib/reusable/qrcode.ts` | QR code generation | ✅ Copy |
| `lib/reusable/ui/textAnimation.ts` | Text scramble | ✅ Copy |
| `lib/reusable/ui/hooks.ts` | React hooks | ✅ Copy |
| `app/components/ui/*` | shadcn/ui components | ✅ Copy |

### 🔧 Adapt for Sanctum

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `lib/crypto.ts` | Split-key encryption | ❌ Replace with XChaCha20-Poly1305 |
| `lib/database.ts` | D1 database | ❌ Remove (no backend) |
| `lib/apiHandler.ts` | API routes | ❌ Remove (no backend) |
| `lib/rateLimit.ts` | Rate limiting | ❌ Remove (no backend) |
| `lib/security.ts` | Security middleware | ⚠️ Adapt for client-side |

### ❌ Not Needed

- All `app/api/*` routes (no backend)
- `migrations/*` (no database)
- `lib/database.ts` (no database)
- `lib/apiHandler.ts` (no API)
- `lib/rateLimit.ts` (no server)
- `lib/middleware.ts` (no server)
- `wrangler.jsonc` (no Cloudflare Workers)

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "^15.1.0",
    "@noble/hashes": "^1.5.0",
    "@noble/ciphers": "^1.0.0",
    "helia": "^5.1.0",
    "@helia/unixfs": "^4.0.0",
    "qrcode": "^1.5.4",
    "tailwindcss": "^3.4.17",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/node": "^22.10.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "playwright": "^1.49.1",
    "eslint": "^9.18.0",
    "prettier": "^3.4.2"
  }
}
```

### Key Differences from TimeSeal

| TimeSeal | Sanctum | Reason |
|----------|-------------|--------|
| AES-GCM | XChaCha20-Poly1305 | Nonce-misuse resistance |
| PBKDF2 | Argon2id | Memory-hard KDF |
| Cloudflare Workers | Static export | No backend |
| D1 Database | None | Browser-only |
| Filebase/Pinata | Helia | P2P IPFS |

---

## 🏗️ Build Configuration

### next.config.js

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export (no server)
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Web Worker support
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' }
    });
    return config;
  }
};

module.exports = nextConfig;
```

---

## 🚀 Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/Teycir/Sanctum.git
cd Sanctum

# Install dependencies
npm install

# Copy reusable files from TimeSeal
npm run copy-timeseal

# Run development server
npm run dev
```

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "copy-timeseal": "node scripts/copy-timeseal.js"
  }
}
```

---

## 📊 File Size Estimates

| Category | Files | Lines of Code | Complexity |
|----------|-------|---------------|------------|
| Crypto | 7 | ~1,500 | High |
| Duress | 2 | ~500 | High |
| Helia | 1 | ~300 | Medium |
| RAM | 2 | ~200 | Medium |
| Recovery | 2 | ~400 | High |
| URL | 1 | ~100 | Low |
| UI | 10 | ~1,000 | Low |
| Tests | 15 | ~2,000 | Medium |
| **Total** | **40** | **~6,000** | **Medium-High** |

---

## 🔐 Security-Critical Files

These files require extra scrutiny and testing:

1. **lib/crypto/core.ts** - XChaCha20-Poly1305 implementation
2. **lib/crypto/kdf.ts** - Argon2id key derivation
3. **lib/crypto/commitment.ts** - Key commitment (verify-first)
4. **lib/duress/layers.ts** - Nested encryption
5. **lib/duress/timing.ts** - Constant-time operations
6. **lib/ram/worker.ts** - RAM-only storage
7. **lib/recovery/shamir.ts** - Secret sharing
8. **workers/crypto.worker.ts** - Heavy crypto operations
9. **workers/ram.worker.ts** - RAM isolation

---

## 📝 Implementation Priority

### Phase 1: Foundation (Week 1)
- ✅ Project structure
- ✅ Copy TimeSeal reusables
- 🔵 Core crypto (constants, utils, capabilities)
- 🔵 Basic UI components

### Phase 2: Crypto Core (Week 2)
- 🟡 XChaCha20-Poly1305 encryption
- 🟡 Argon2id + HKDF
- 🟡 Key commitment
- 🟡 Padding

### Phase 3: Duress & Storage (Week 3)
- 🟡 Layer encryption
- 🟡 Helia IPFS integration
- 🟡 RAM-only storage
- 🟡 URL state management

### Phase 4: Recovery & Polish (Week 4)
- 🟡 Shamir secret sharing
- 🟡 QR codes
- 🟡 Testing & security audit
- 🟡 Documentation

---

## 🎯 Next Steps

1. **Copy TimeSeal reusables** → `npm run copy-timeseal`
2. **Implement crypto constants** → `lib/crypto/constants.ts`
3. **Implement crypto utils** → `lib/crypto/utils.ts`
4. **Implement browser capabilities** → `lib/crypto/capabilities.ts`
5. **Start core encryption** → `lib/crypto/core.ts`

---

**Last Updated**: January 2026  
**Spec Version**: 1.0  
**Status**: Ready for Implementation
