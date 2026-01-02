# Sanctum - Browser-Only Architecture Guide

**⚠️ CRITICAL CHANGE**: Sanctum has **NO BACKEND**. This is a complete departure from TimeSeal's architecture.

## 🎯 Architecture Comparison

| Component | TimeSeal | Sanctum |
|-----------|----------|-------------|
| **Backend** | Cloudflare Workers + D1 | ❌ None |
| **Database** | D1 (metadata storage) | ❌ None |
| **API Routes** | Yes (create/unlock/pulse) | ❌ None |
| **Crypto** | Browser + Worker | ✅ Browser + Web Worker |
| **Storage** | Server metadata + IPFS | ✅ IPFS only (Helia) |
| **State** | Server-side | ✅ URL hash only |

## 📦 What Can Be Reused from TimeSeal

### ✅ Reusable (Browser-Side Only)

These TimeSeal libraries work in the browser and can be adapted:

```bash
# Crypto utilities (browser-compatible)
lib/cryptoUtils.ts          # Base64, hex conversion, random bytes
lib/memoryProtection.ts     # Secure memory handling
lib/timingSafe.ts           # Constant-time operations

# Client-side utilities
lib/clientUtils.ts          # Browser utilities
lib/compression.ts          # Data compression
lib/dataStructures.ts       # Data structures
```

### ❌ NOT Reusable (Server-Side)

These are Cloudflare Workers specific and **cannot be used**:

```bash
# Server-only (DO NOT COPY)
lib/database.ts             # D1 database
lib/apiHandler.ts           # API routes
lib/middleware.ts           # Server middleware
lib/rateLimit.ts            # Server rate limiting
lib/storage.ts              # Server storage
lib/logger.ts               # Server logging
lib/errors.ts               # Server error handling
lib/security.ts             # Server CSRF
lib/turnstile.ts            # Cloudflare Turnstile
```

## 🔧 New Sanctum Libraries (From Spec)

Based on the specification, create these new libraries:

### 1. lib/crypto/constants.ts
```typescript
export const VAULT_VERSION = 0x03;

export const ARGON2_PROFILES = {
  mobile: { m: 65536, t: 3, p: 1, dkLen: 32 },      // 64 MB
  desktop: { m: 262144, t: 3, p: 2, dkLen: 32 },   // 256 MB
  paranoid: { m: 1048576, t: 4, p: 4, dkLen: 32 }  // 1 GB
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

export const IDLE_TIMEOUT_MS = 60000; // 60 seconds
export const CLIPBOARD_CLEAR_MS = 30000; // 30 seconds
```

### 2. lib/crypto/utils.ts
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
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
```

### 3. lib/crypto/kdf.ts
```typescript
import { argon2id } from '@noble/hashes/argon2';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { ARGON2_PROFILES, HKDF_INFO } from './constants';

export async function deriveKeys(
  passphrase: string,
  salt: Uint8Array,
  profile: keyof typeof ARGON2_PROFILES = 'mobile'
): Promise<{ encKey: Uint8Array; comKey: Uint8Array }> {
  const params = ARGON2_PROFILES[profile];
  
  // Step 1: Argon2id
  const masterKey = argon2id(passphrase, salt, params);
  
  // Step 2: HKDF key separation
  const encKey = hkdf(sha256, masterKey, salt, HKDF_INFO.encryption, 32);
  const comKey = hkdf(sha256, masterKey, salt, HKDF_INFO.commitment, 32);
  
  return { encKey, comKey };
}
```

### 4. lib/crypto/core.ts
```typescript
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from './utils';

export function generateSyntheticNonce(
  key: Uint8Array,
  plaintext: Uint8Array
): Uint8Array {
  const random = randomBytes(16);
  const hashInput = new Uint8Array(16 + 64 + 16);
  hashInput.set(key.slice(0, 16), 0);
  hashInput.set(plaintext.slice(0, Math.min(64, plaintext.length)), 16);
  hashInput.set(random, 80);
  
  const deterministic = sha256(hashInput).slice(0, 8);
  const nonce = new Uint8Array(24);
  nonce.set(random, 0);
  nonce.set(deterministic, 16);
  
  return nonce;
}

export function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  aad: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = generateSyntheticNonce(key, plaintext);
  const cipher = xchacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(plaintext, aad);
  
  return { ciphertext, nonce };
}

export function decrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array
): Uint8Array {
  const cipher = xchacha20poly1305(key, nonce);
  return cipher.decrypt(ciphertext, aad);
}
```

### 5. workers/ram.worker.ts (MANDATORY)
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

### 6. lib/helia/client.ts
```typescript
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';

export async function createIPFSNode() {
  const helia = await createHelia();
  const fs = unixfs(helia);
  return { helia, fs };
}

export async function addToIPFS(
  fs: any,
  data: Uint8Array
): Promise<string> {
  const cid = await fs.addBytes(data);
  return cid.toString();
}

export async function getFromIPFS(
  fs: any,
  cid: string
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}
```

## 📋 Migration Checklist

### ❌ Remove from TimeSeal
- [ ] All `app/api/` routes
- [ ] `lib/database.ts`
- [ ] `lib/apiHandler.ts`
- [ ] `lib/middleware.ts`
- [ ] `lib/rateLimit.ts`
- [ ] `lib/storage.ts`
- [ ] `migrations/` directory
- [ ] `wrangler.toml`

### ✅ Create New
- [ ] `lib/crypto/` directory (constants, utils, kdf, core, commitment, padding)
- [ ] `lib/duress/layers.ts`
- [ ] `lib/helia/client.ts`
- [ ] `lib/ram/worker.ts`
- [ ] `lib/recovery/shamir.ts`
- [ ] `lib/url/state.ts`
- [ ] `workers/ram.worker.ts`
- [ ] `workers/crypto.worker.ts`

### ✅ Adapt from TimeSeal
- [ ] `lib/clientUtils.ts` (browser utilities)
- [ ] `lib/compression.ts` (data compression)
- [ ] UI components (see UI-REUSE-GUIDE.md)

## 🎯 Key Differences Summary

| Aspect | TimeSeal | Sanctum |
|--------|----------|-------------|
| **Architecture** | Client-Server | Browser-Only |
| **Crypto** | AES-GCM | XChaCha20-Poly1305 |
| **KDF** | PBKDF2 | Argon2id + HKDF |
| **Storage** | Server + IPFS | IPFS only (Helia) |
| **State** | Database | URL hash |
| **RAM** | Optional | Mandatory |
| **Backend** | Cloudflare Workers | None |
| **Database** | D1 | None |

## 📚 References

- [SPECIFICATION.md](../core/SPECIFICATION.md) - Complete technical spec
- [IMPLEMENTATION-PLAN.md](../core/IMPLEMENTATION-PLAN.md) - Development roadmap
- [UI-REUSE-GUIDE.md](./UI-REUSE-GUIDE.md) - UI component reuse

---

**Bottom Line**: Sanctum is a **complete rewrite** with a fundamentally different architecture. Only browser-side utilities can be reused from TimeSeal.
