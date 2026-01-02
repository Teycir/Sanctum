# Sanctum Quick Start Guide

**⚠️ CRITICAL**: Sanctum is **browser-only** with **NO BACKEND**. This guide reflects the 2026 architecture.

## 🎯 Architecture Overview

- **Frontend**: Next.js 15 + React 18
- **Crypto**: @noble/hashes + @noble/ciphers (browser-only)
- **Storage**: Helia (browser IPFS node)
- **State**: URL hash only (no server, no database)
- **RAM**: Mandatory (Web Worker isolation)

## 🚀 Quick Setup (15 minutes)

### Step 1: Initialize Project (2 minutes)

```bash
# Create Next.js project
npx create-next-app@latest duress-vault --typescript --tailwind --app
cd duress-vault

# Install dependencies
npm install @noble/hashes @noble/ciphers helia @helia/unixfs @helia/verified-fetch qrcode
npm install -D @types/qrcode vitest @vitest/ui
```

### Step 2: Project Structure (3 minutes)

```bash
mkdir -p lib/{crypto,duress,helia,ram,recovery,url}
mkdir -p workers
mkdir -p __tests__/{crypto,duress,recovery}
mkdir -p app/{create,open}/components
```

### Step 3: Core Crypto (5 minutes)

Create the essential crypto files from the spec:

#### lib/crypto/constants.ts
```typescript
export const VAULT_VERSION = 0x03;

export const ARGON2_PROFILES = {
  mobile: { m: 65536, t: 3, p: 1, dkLen: 32 },
  desktop: { m: 262144, t: 3, p: 2, dkLen: 32 },
  paranoid: { m: 1048576, t: 4, p: 4, dkLen: 32 }
} as const;

export const VAULT_SIZES = [
  1 << 20,   // 1 MB
  5 << 20,   // 5 MB
  25 << 20,  // 25 MB
  100 << 20  // 100 MB
] as const;

export const HKDF_INFO = {
  encryption: new TextEncoder().encode('duressvault-encryption-v3'),
  commitment: new TextEncoder().encode('duressvault-commitment-v3')
} as const;

export const IDLE_TIMEOUT_MS = 60000;
export const CLIPBOARD_CLEAR_MS = 30000;
```

#### lib/crypto/utils.ts
```typescript
import { randomBytes as nobleRandomBytes } from '@noble/ciphers/webcrypto';

export function randomBytes(n: number): Uint8Array {
  return nobleRandomBytes(n);
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
```

### Step 4: RAM-Only Worker (MANDATORY) (5 minutes)

#### workers/ram.worker.ts
```typescript
let vaultData: Uint8Array | null = null;
let idleTimer: number | null = null;
const IDLE_TIMEOUT = 60_000;

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = self.setTimeout(clearVault, IDLE_TIMEOUT) as any;
}

function clearVault() {
  if (vaultData) {
    crypto.getRandomValues(vaultData);
    vaultData = null;
  }
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  self.postMessage({ type: 'vault-cleared' });
}

self.onmessage = (e: MessageEvent) => {
  switch (e.data.type) {
    case 'store':
      vaultData = new Uint8Array(e.data.payload);
      resetIdleTimer();
      self.postMessage({ type: 'stored' });
      break;
    case 'retrieve':
      resetIdleTimer();
      self.postMessage({ type: 'data', payload: vaultData });
      break;
    case 'activity':
      resetIdleTimer();
      break;
    case 'lock':
      clearVault();
      break;
  }
};

self.addEventListener('unload', clearVault);
```

#### lib/ram/worker.ts
```typescript
export class RAMVault {
  private worker: Worker;
  private activityInterval: number | null = null;
  
  constructor() {
    this.worker = new Worker(new URL('../../workers/ram.worker.ts', import.meta.url));
    this.setupVisibilityHandler();
  }
  
  async store(data: Uint8Array): Promise<void> {
    this.worker.postMessage({ type: 'store', payload: data });
    this.startActivityTracking();
  }
  
  async retrieve(): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'data') resolve(e.data.payload);
      };
      this.worker.postMessage({ type: 'retrieve' });
    });
  }
  
  lock(): void {
    this.worker.postMessage({ type: 'lock' });
    this.stopActivityTracking();
  }
  
  private startActivityTracking(): void {
    this.activityInterval = setInterval(() => {
      this.worker.postMessage({ type: 'activity' });
    }, 30_000) as any;
  }
  
  private stopActivityTracking(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }
  
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.lock();
      }
    });
  }
}
```

## 📋 Implementation Phases

Follow the [IMPLEMENTATION-PLAN.md](../core/IMPLEMENTATION-PLAN.md) for detailed steps:

### Phase 1: Core Crypto (4 days)
- [ ] Constants & utilities
- [ ] Argon2id + HKDF key derivation
- [ ] XChaCha20-Poly1305 encryption
- [ ] Key commitment scheme
- [ ] Padding & blob structure

### Phase 2: Duress Layers (3 days)
- [ ] Simple mode (single layer)
- [ ] Hidden mode (decoy + secret)
- [ ] Chain mode (4 levels)

### Phase 3: Helia IPFS (3 days)
- [ ] Browser IPFS node setup
- [ ] Add/retrieve encrypted blobs
- [ ] Error handling

### Phase 4: RAM-Only & Recovery (3 days)
- [ ] RAM worker (MANDATORY)
- [ ] Shamir secret sharing
- [ ] Export/import (external only)

### Phase 5: URL State (2 days)
- [ ] URL hash encoding
- [ ] QR code generation

### Phase 6: UI/UX (5 days)
- [ ] Create vault flow
- [ ] Open vault flow
- [ ] Recovery UI

### Phase 7: Testing (4 days)
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] Security audit

### Phase 8: Deploy (2 days)
- [ ] Build for production
- [ ] Deploy to Cloudflare Pages
- [ ] Custom domain

## 🔧 Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Test
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

## 📦 What's Different from TimeSeal

| Aspect | TimeSeal | Sanctum |
|--------|----------|-------------|
| **Backend** | Cloudflare Workers | ❌ None |
| **Database** | D1 | ❌ None |
| **API Routes** | Yes | ❌ None |
| **Crypto** | AES-GCM | XChaCha20-Poly1305 |
| **KDF** | PBKDF2 | Argon2id + HKDF |
| **Storage** | Server + IPFS | Helia (browser IPFS) |
| **State** | Database | URL hash |
| **RAM** | Optional | **MANDATORY** |

## ⚠️ Critical Differences

### NO Backend Components
```bash
# DO NOT create these (TimeSeal has them, Sanctum doesn't):
app/api/                    # ❌ No API routes
lib/database.ts             # ❌ No database
lib/apiHandler.ts           # ❌ No API handler
lib/middleware.ts           # ❌ No middleware
lib/rateLimit.ts            # ❌ No rate limiting
wrangler.toml               # ❌ No Cloudflare config
migrations/                 # ❌ No database migrations
```

### RAM-Only is MANDATORY
```typescript
// ❌ NEVER do this:
localStorage.setItem('vault', data);
sessionStorage.setItem('vault', data);
await indexedDB.put('vault', data);

// ✅ ALWAYS use RAM worker:
const ramVault = new RAMVault();
await ramVault.store(data);
```

### Recovery is REQUIRED
```typescript
// Users MUST use at least one:
1. IPFS CID (primary)
2. Export file (portable)
3. Shamir shares (distributed)

// NO local persistence = NO recovery without these
```

## 🎯 Success Metrics

### MVP (Week 3)
- ✅ All 3 modes working (Simple/Hidden/Chain)
- ✅ XChaCha20-Poly1305 + Argon2id
- ✅ Helia IPFS integration
- ✅ RAM-only worker (mandatory)
- ✅ No backend dependencies

### Production (Week 4)
- ✅ 90%+ test coverage
- ✅ Shamir secret sharing
- ✅ Export/import
- ✅ Browser compatibility
- ✅ Security audit passed
- ✅ Documentation complete

## 📚 Resources

- [SPECIFICATION.md](../core/SPECIFICATION.md) - Complete technical spec
- [IMPLEMENTATION-PLAN.md](../core/IMPLEMENTATION-PLAN.md) - Detailed roadmap
- [BACKEND-REUSE-GUIDE.md](./BACKEND-REUSE-GUIDE.md) - What can/can't be reused
- [UI-REUSE-GUIDE.md](./UI-REUSE-GUIDE.md) - UI component reuse

## 🔒 Security Checklist

- [ ] All crypto in browser (no server)
- [ ] RAM-only (no disk writes)
- [ ] 60s idle timeout
- [ ] Auto-clear on tab hidden
- [ ] Constant-time operations
- [ ] No metadata leakage
- [ ] Recovery mechanisms required
- [ ] OpSec warnings displayed

---

**Total Setup Time**: 15 minutes  
**Development Time**: 3-4 weeks  
**Architecture**: Browser-only, zero backend, RAM-only mandatory
