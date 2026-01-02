# Sanctum Quick Reference

**Status**: Ready for Development  
**Next Step**: `npm run copy-timeseal`

---

## 📊 Project Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sanctum                              │
│         Browser-Only • RAM-Only • Zero Backend                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         Architecture Layers             │
        ├─────────────────────────────────────────┤
        │  UI Layer (React 18 + Next.js 15)      │
        │  ├─ Create Vault                        │
        │  ├─ Open Vault (URL hash)               │
        │  └─ Recovery (Shamir shares)            │
        ├─────────────────────────────────────────┤
        │  Crypto Layer (@noble ecosystem)        │
        │  ├─ XChaCha20-Poly1305                  │
        │  ├─ Argon2id + HKDF                     │
        │  └─ Key Commitment                      │
        ├─────────────────────────────────────────┤
        │  Duress Layer (NEW)                     │
        │  ├─ Nested Encryption                   │
        │  └─ Constant-Time Operations            │
        ├─────────────────────────────────────────┤
        │  Storage Layer (Helia IPFS)             │
        │  └─ Browser P2P Node                    │
        ├─────────────────────────────────────────┤
        │  RAM Layer (Web Workers)                │
        │  ├─ Isolated Memory                     │
        │  └─ Auto-Clear (60s idle)               │
        └─────────────────────────────────────────┘
```

---

## 📁 File Structure (54 files total)

```
Sanctum/
│
├─ lib/                                    [32 files]
│  ├─ crypto/          [7 NEW]  ← XChaCha20, Argon2id
│  ├─ duress/          [2 NEW]  ← Layer encryption
│  ├─ helia/           [1 NEW]  ← Browser IPFS
│  ├─ ram/             [2 NEW]  ← RAM-only storage
│  ├─ recovery/        [2 NEW]  ← Shamir shares
│  ├─ url/             [1 NEW]  ← URL state
│  └─ reusable/        [7 COPY] ← From TimeSeal
│
├─ app/                                    [18 files]
│  ├─ components/      [10 NEW] ← UI components
│  └─ components/ui/   [8 COPY] ← shadcn/ui
│
├─ workers/            [2 NEW]  ← Web Workers
├─ hooks/              [3 NEW]  ← React hooks
└─ __tests__/          [15 NEW] ← Test suite
```

---

## 🔄 Code Reuse from TimeSeal

### ✅ Copy Directly (15 files)

```
TimeSeal → Sanctum

lib/memoryProtection.ts    → lib/reusable/memoryProtection.ts
lib/cryptoUtils.ts         → lib/reusable/cryptoUtils.ts
lib/utils.ts               → lib/reusable/utils.ts
lib/qrcode.ts              → lib/reusable/qrcode.ts
lib/constants.ts           → lib/reusable/constants.ts
lib/ui/textAnimation.ts    → lib/reusable/ui/textAnimation.ts
lib/ui/hooks.ts            → lib/reusable/ui/hooks.ts

app/components/ui/button.tsx   → app/components/ui/button.tsx
app/components/ui/card.tsx     → app/components/ui/card.tsx
app/components/ui/input.tsx    → app/components/ui/input.tsx
app/components/ui/tooltip.tsx  → app/components/ui/tooltip.tsx
app/components/ui/dialog.tsx   → app/components/ui/dialog.tsx
app/components/ui/progress.tsx → app/components/ui/progress.tsx
app/components/ui/badge.tsx    → app/components/ui/badge.tsx
app/components/ui/alert.tsx    → app/components/ui/alert.tsx
```

**Time Saved**: 9 days

---

## 🎯 Implementation Phases (28 days)

```
Week 1: Foundation
├─ Day 1: Copy TimeSeal reusables
├─ Day 2: Crypto constants + utils
└─ Day 3: Browser capabilities

Week 2: Crypto Core
├─ Day 4-5: XChaCha20-Poly1305
├─ Day 6-7: Argon2id + HKDF
└─ Day 8: Key commitment + padding

Week 3: Duress & Storage
├─ Day 9-10: Layer encryption
├─ Day 11-12: Helia IPFS
└─ Day 13-15: RAM-only storage

Week 4: Recovery & Polish
├─ Day 16-18: Shamir shares
├─ Day 19-21: UI components
└─ Day 22-24: Testing

Final Days
├─ Day 25-27: Security audit
└─ Day 28: Deploy
```

---

## 🚀 Getting Started (5 Steps)

### Step 1: Copy TimeSeal Reusables

```bash
npm run copy-timeseal
```

**Result**: 15 files copied to `lib/reusable/` and `app/components/ui/`

---

### Step 2: Implement Crypto Constants

**File**: `lib/crypto/constants.ts`

```typescript
export const VAULT_VERSION = 0x03;

export const ARGON2_PROFILES = {
  mobile: { m: 65536, t: 3, p: 1, dkLen: 32 },
  desktop: { m: 262144, t: 3, p: 2, dkLen: 32 },
  paranoid: { m: 1048576, t: 4, p: 4, dkLen: 32 }
};

export const SIZE_CLASSES = [
  1 * 1024, 4 * 1024, 16 * 1024, 64 * 1024,
  256 * 1024, 1 * 1024 * 1024, 4 * 1024 * 1024, 16 * 1024 * 1024
];
```

**Template**: See [MODULAR-ARCHITECTURE.md](./guides/MODULAR-ARCHITECTURE.md)

---

### Step 3: Implement Crypto Utils

**File**: `lib/crypto/utils.ts`

```typescript
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean;
export function concat(...arrays: Uint8Array[]): Uint8Array;
export function randomBytes(length: number): Uint8Array;
export function sanitizeMemory(buffer: Uint8Array): void;
export function encodeU32LE(value: number): Uint8Array;
export function decodeU32LE(buffer: Uint8Array, offset?: number): number;
```

**Template**: See [MODULAR-ARCHITECTURE.md](./guides/MODULAR-ARCHITECTURE.md)

---

### Step 4: Write Tests First (TDD)

**File**: `__tests__/crypto/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { constantTimeEqual, concat, randomBytes } from '@/lib/crypto/utils';

describe('constantTimeEqual', () => {
  it('should return true for equal arrays', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });
});
```

**Run**: `npm run test:watch`

---

### Step 5: Implement Core Encryption

**File**: `lib/crypto/core.ts`

```typescript
import { xchacha20poly1305 } from '@noble/ciphers/chacha';

export function encrypt(params: EncryptionParams): EncryptionResult;
export function decrypt(params: DecryptionParams): Uint8Array;
export function generateSyntheticNonce(params: SyntheticNonceParams): Uint8Array;
```

**Template**: See [MODULAR-ARCHITECTURE.md](./guides/MODULAR-ARCHITECTURE.md)

---

## 📚 Documentation Map

```
docs/
├─ core/
│  ├─ IMPLEMENTATION-SUMMARY.md  ← ⭐ START HERE
│  ├─ FILE-STRUCTURE.md          ← Project layout
│  ├─ SPECIFICATION.md           ← Technical spec
│  ├─ IMPLEMENTATION-PLAN.md     ← 28-day roadmap
│  └─ ROADMAP.md                 ← Timeline
│
└─ guides/
   ├─ TIMESEAL-REUSE-MAP.md      ← What to copy
   ├─ MODULAR-ARCHITECTURE.md    ← Design patterns
   ├─ UI-REUSE-GUIDE.md          ← UI components
   └─ BACKEND-REUSE-GUIDE.md     ← Utilities
```

---

## 🔐 Security Checklist

Before marking a module as "complete":

- [ ] **Types defined** - All interfaces documented
- [ ] **Pure functions** - No side effects
- [ ] **Input validation** - All inputs validated
- [ ] **Error handling** - Proper error types
- [ ] **JSDoc comments** - All public functions documented
- [ ] **Unit tests** - 100% coverage
- [ ] **Integration tests** - Tests with other modules
- [ ] **Performance tests** - Benchmarks for critical paths
- [ ] **Security review** - Constant-time operations verified
- [ ] **Memory safety** - Sensitive data wiped after use

---

## 📊 Progress Tracker

### Week 1: Foundation ⏳
- [ ] Copy TimeSeal reusables
- [ ] Crypto constants
- [ ] Crypto utils
- [ ] Browser capabilities

### Week 2: Crypto Core 🔜
- [ ] XChaCha20-Poly1305
- [ ] Argon2id + HKDF
- [ ] Key commitment
- [ ] Padding

### Week 3: Duress & Storage 🔜
- [ ] Layer encryption
- [ ] Helia IPFS
- [ ] RAM-only storage

### Week 4: Recovery & Polish 🔜
- [ ] Shamir shares
- [ ] UI components
- [ ] Testing
- [ ] Deploy

---

## 🎯 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Total Files | 54 | 0 |
| Reused Files | 15 | 0 |
| New Files | 39 | 0 |
| Test Coverage | 100% | 0% |
| Lines of Code | ~6,000 | 0 |
| Time Saved (Reuse) | 9 days | - |

---

## 🔗 Quick Commands

```bash
# Copy TimeSeal reusables
npm run copy-timeseal

# Start development server
npm run dev

# Run tests (watch mode)
npm run test:watch

# Run tests (UI)
npm run test:ui

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📞 Next Actions

1. ✅ **Read this document** - You're here!
2. 🔵 **Run copy script** - `npm run copy-timeseal`
3. 🔵 **Implement constants** - `lib/crypto/constants.ts`
4. 🔵 **Implement utils** - `lib/crypto/utils.ts`
5. 🔵 **Write tests** - `__tests__/crypto/utils.test.ts`
6. 🔵 **Implement core** - `lib/crypto/core.ts`

---

## 🆘 Need Help?

| Question | Document |
|----------|----------|
| What's the overall architecture? | [SPECIFICATION.md](./core/SPECIFICATION.md) |
| What files do I need to create? | [FILE-STRUCTURE.md](./core/FILE-STRUCTURE.md) |
| What can I reuse from TimeSeal? | [TIMESEAL-REUSE-MAP.md](./guides/TIMESEAL-REUSE-MAP.md) |
| How do I write modular code? | [MODULAR-ARCHITECTURE.md](./guides/MODULAR-ARCHITECTURE.md) |
| What's the development timeline? | [IMPLEMENTATION-PLAN.md](./core/IMPLEMENTATION-PLAN.md) |
| Where do I start? | [IMPLEMENTATION-SUMMARY.md](./core/IMPLEMENTATION-SUMMARY.md) |

---

**Last Updated**: January 2026  
**Status**: Ready for Development  
**Next Step**: `npm run copy-timeseal`
