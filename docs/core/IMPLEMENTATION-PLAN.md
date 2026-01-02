# Sanctum Implementation Plan

**Architecture**: Browser-based, zero backend, RAM-only mandatory, Helia IPFS  
**Timeline**: 4 weeks (28 days)  
**Complexity**: Production-grade cryptography with hardened security  
**Spec Version**: 1.0  
**Status**: Ready for Implementation

---

## 🔐 Security-Critical Requirements

> These items are **non-negotiable** and must be verified before release.

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| RAM-only storage | Web Worker isolation, no localStorage/IndexedDB | Audit browser storage APIs |
| Commitment-first verification | Verify commitment BEFORE decryption attempt | Unit test ordering |
| AAD binding | Header authenticated via XChaCha20-Poly1305 AAD | Tamper detection tests |
| Constant-time layer decryption | Dummy derivation for timing resistance | Timing analysis |
| Memory sanitization | Random overwrite before release | Memory dump analysis |
| Key separation | HKDF with distinct contexts | Test vector validation |

---

## 🎯 Core Architecture

### Core Components

```
lib/
├── crypto/
│   ├── constants.ts      # Vault version, Argon2 profiles, size classes
│   ├── utils.ts          # Encoding, constant-time ops, device detection
│   ├── capabilities.ts   # Browser capability detection
│   ├── core.ts           # XChaCha20-Poly1305 + synthetic nonces + AAD
│   ├── kdf.ts            # Argon2id + HKDF key separation
│   ├── commitment.ts     # Key commitment scheme (verify-first)
│   └── padding.ts        # Size class padding
├── duress/
│   ├── layers.ts         # Nested encryption (Simple/Hidden/Chain)
│   └── timing.ts         # Constant-time helpers, dummy derivation
├── helia/
│   └── client.ts         # Browser IPFS node
├── ram/
│   ├── worker.ts         # Main thread interface
│   └── sanitize.ts       # Memory sanitization utilities
├── recovery/
│   ├── shamir.ts         # Secret sharing (GF256)
│   └── shares.ts         # Share format encoding/decoding
└── url/
    └── state.ts          # URL hash encoding
```

---

## 📁 Complete Project Structure

```
Sanctum/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── create/page.tsx             # Create vault UI
│   ├── open/page.tsx               # Open vault UI
│   ├── layout.tsx                  # Root layout with headers
│   └── components/
│       ├── ModeSelector.tsx        # Simple/Hidden/Chain
│       ├── PassphraseInput.tsx     # With entropy meter + Diceware
│       ├── EntropyMeter.tsx        # Visual strength indicator
│       ├── FileUpload.tsx          # Drag & drop
│       ├── VaultViewer.tsx         # Decrypted content display
│       ├── RecoveryShares.tsx      # Shamir shares UI
│       ├── QRCodeDisplay.tsx       # Share/CID QR codes
│       ├── OpSecWarnings.tsx       # Context-sensitive warnings
│       ├── CapabilityCheck.tsx     # Browser compatibility
│       └── LockTimer.tsx           # Idle countdown display
├── lib/
│   ├── crypto/
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── capabilities.ts
│   │   ├── core.ts
│   │   ├── kdf.ts
│   │   ├── commitment.ts
│   │   └── padding.ts
│   ├── duress/
│   │   ├── layers.ts
│   │   └── timing.ts
│   ├── helia/
│   │   └── client.ts
│   ├── ram/
│   │   ├── worker.ts
│   │   └── sanitize.ts
│   ├── recovery/
│   │   ├── shamir.ts
│   │   └── shares.ts
│   └── url/
│       └── state.ts
├── workers/
│   ├── crypto.worker.ts            # Heavy crypto operations
│   └── ram.worker.ts               # RAM-only vault storage
├── hooks/
│   ├── useVault.ts                 # Vault state management
│   ├── useIdleTimer.ts             # Activity tracking
│   └── useCapabilities.ts          # Browser feature detection
├── __tests__/
│   ├── crypto/
│   │   ├── core.test.ts
│   │   ├── kdf.test.ts
│   │   ├── commitment.test.ts      # Verify-first ordering tests
│   │   └── padding.test.ts
│   ├── duress/
│   │   ├── layers.test.ts
│   │   └── timing.test.ts          # Timing resistance tests
│   ├── recovery/
│   │   ├── shamir.test.ts
│   │   └── shares.test.ts
│   ├── ram/
│   │   └── worker.test.ts
│   └── integration/
│       ├── e2e-create.test.ts
│       ├── e2e-open.test.ts
│       └── e2e-recovery.test.ts
├── public/
│   └── wordlist.json               # Diceware wordlist
├── next.config.js                  # Security headers
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── SPECIFICATION.md
├── IMPLEMENTATION.md               # This file
└── SECURITY.md                     # Security audit checklist
```

---

## 🚀 Implementation Phases

### Phase 1: Core Crypto Foundation (5 days)

#### Day 1: Constants, Utilities & Browser Capabilities

**File: `lib/crypto/constants.ts`**

```typescript
// Vault format version
export const VAULT_VERSION = 0x03;

// Argon2id profiles (adaptive based on device)
export const ARGON2_PROFILES = {
  mobile: { 
    m: 65536,    // 64 MB
    t: 3,        // 3 iterations  
    p: 1,        // 1 thread
    dkLen: 32 
  },
  desktop: { 
    m: 262144,   // 256 MB
    t: 3,        // 3 iterations
    p: 2,        // 2 threads
    dkLen: 32 
  },
  paranoid: { 
    m: 1048576,  // 1 GB
    t: 4,        // 4 iterations
    p: 4,        // 4 threads
    dkLen: 32 
  }
} as const;

export type Argon2Profile = keyof typeof ARGON2_PROFILES;

// Size classes for padding (powers of 4, max 16 MB)
export const SIZE_CLASSES = [
  1 * 1024,         // 1 KB
  4 * 1024,         // 4 KB
  16 * 1024,        // 16 KB
  64 * 1024,        // 64 KB
  256 * 1024,       // 256 KB
  1 * 1024 * 1024,  // 1 MB
  4 * 1024 * 1024,  // 4 MB
  16 * 1024 * 1024  // 16 MB (maximum)
] as const;

export const MAX_VAULT_SIZE = SIZE_CLASSES[SIZE_CLASSES.length - 1];

// HKDF context strings (domain separation)
export const HKDF_CONTEXTS = {
  encryption: 'duressvault-encryption-v3',
  commitment: 'duressvault-commitment-v3',
  layerDerivation: 'duressvault-layer-v3'
} as const;

// Timing constants
export const IDLE_TIMEOUT_MS = 60_000;        // 60 seconds active
export const HIDDEN_TIMEOUT_MS = 15_000;      // 15 seconds when hidden
export const CLIPBOARD_CLEAR_MS = 30_000;     // 30 seconds
export const ACTIVITY_PING_MS = 30_000;       // 30 seconds

// Blob structure sizes
export const BLOB_SIZES = {
  header: 9,        // version(1) + m(4) + t(2) + p(2)
  salt: 32,
  nonce: 24,        // 16 random + 8 deterministic
  commitment: 32,
  authTag: 16       // Poly1305 tag (included in ciphertext)
} as const;

// Vault modes
export const VAULT_MODES = {
  simple: 0x01,
  hidden: 0x02,
  chain: 0x03
} as const;

export type VaultMode = keyof typeof VAULT_MODES;
```

**File: `lib/crypto/utils.ts`**

```typescript
import { SIZE_CLASSES, MAX_VAULT_SIZE } from './constants';

// Constant-time comparison (timing-safe)
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Encode 32-bit unsigned integer (little-endian)
export function encodeU32LE(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  buf[2] = (value >> 16) & 0xff;
  buf[3] = (value >> 24) & 0xff;
  return buf;
}

// Decode 32-bit unsigned integer (little-endian)
export function decodeU32LE(buf: Uint8Array, offset = 0): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  ) >>> 0;
}

// Encode 16-bit unsigned integer (little-endian)
export function encodeU16LE(value: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  return buf;
}

// Decode 16-bit unsigned integer (little-endian)
export function decodeU16LE(buf: Uint8Array, offset = 0): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

// Concatenate Uint8Arrays
export function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Get padded size for data
export function getPaddedSize(dataSize: number): number {
  if (dataSize > MAX_VAULT_SIZE) {
    throw new Error(`Data exceeds maximum vault size (${MAX_VAULT_SIZE / 1024 / 1024} MB)`);
  }
  for (const size of SIZE_CLASSES) {
    if (dataSize <= size) return size;
  }
  return MAX_VAULT_SIZE;
}

// Secure random bytes
export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

// Sanitize memory (overwrite with random data)
export function sanitizeMemory(buffer: Uint8Array): void {
  crypto.getRandomValues(buffer);
}

// Base64 URL-safe encoding
export function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Base64 URL-safe decoding
export function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// Text encoder/decoder
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeText(text: string): Uint8Array {
  return textEncoder.encode(text);
}

export function decodeText(data: Uint8Array): string {
  return textDecoder.decode(data);
}
```

**File: `lib/crypto/capabilities.ts`**

```typescript
export interface BrowserCapabilities {
  sharedArrayBuffer: boolean;
  crossOriginIsolated: boolean;
  webWorkers: boolean;
  webCrypto: boolean;
  bigInt: boolean;
  wasm: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;  // We detect but DON'T use
  recommendedProfile: 'mobile' | 'desktop' | 'paranoid';
  warnings: string[];
  errors: string[];
}

export function detectCapabilities(): BrowserCapabilities {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Core requirements
  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const crossOriginIsolated = 
    typeof window !== 'undefined' && (window as any).crossOriginIsolated === true;
  const webWorkers = typeof Worker !== 'undefined';
  const webCrypto = typeof crypto?.subtle !== 'undefined';
  const bigInt = typeof BigInt !== 'undefined';
  const wasm = typeof WebAssembly !== 'undefined';
  const serviceWorker = 'serviceWorker' in navigator;
  const indexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
  
  // Check critical requirements
  if (!webWorkers) {
    errors.push('Web Workers not supported - Sanctum cannot run');
  }
  if (!webCrypto) {
    errors.push('Web Crypto API not supported - Sanctum cannot run');
  }
  if (!wasm) {
    errors.push('WebAssembly not supported - Argon2 cannot run');
  }
  
  // Check performance requirements
  if (!sharedArrayBuffer) {
    warnings.push('SharedArrayBuffer not available - using reduced Argon2 parameters');
  }
  if (!crossOriginIsolated) {
    warnings.push('Cross-origin isolation not enabled - some features limited');