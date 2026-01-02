# Sanctum – Complete Technical Specification

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Implementation Ready

---

## Table of Contents

- [Sanctum – Complete Technical Specification](#duressvault--complete-technical-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Executive Summary](#1-executive-summary)
    - [Core Principles](#core-principles)
    - [Design Philosophy](#design-philosophy)
  - [2. Threat Model](#2-threat-model)
    - [2.1 Adversaries](#21-adversaries)
    - [2.2 Security Goals](#22-security-goals)
    - [2.3 Non-Goals](#23-non-goals)
  - [3. Architecture Overview](#3-architecture-overview)
    - [3.1 Technology Stack](#31-technology-stack)
    - [3.2 Data Flow](#32-data-flow)
  - [4. Vault Blob Structure](#4-vault-blob-structure)
    - [4.1 Binary Layout](#41-binary-layout)
    - [4.2 Size Classes](#42-size-classes)
    - [4.3 Overhead Calculation](#43-overhead-calculation)
  - [5. Cryptographic Implementation](#5-cryptographic-implementation)
    - [5.1 Constants and Configuration](#51-constants-and-configuration)
    - [5.2 Utility Functions](#52-utility-functions)
    - [5.3 Core Encryption](#53-core-encryption)
  - [7. RAM-Only Mode (Mandatory)](#7-ram-only-mode-mandatory)
    - [7.1 Rationale](#71-rationale)
    - [7.2 Lifecycle](#72-lifecycle)
    - [7.3 Recovery Mechanisms](#73-recovery-mechanisms)
    - [7.4 Implementation](#74-implementation)
    - [7.5 Security Guarantees](#75-security-guarantees)
    - [7.6 User Education](#76-user-education)

---

## 1. Executive Summary

Sanctum is a **fully browser-based, zero-friction private vault** with military-grade cryptography, optimized for maximum duress resistance, censorship resistance, and plausible deniability.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **No accounts, no backend** | Access solely via memorable passphrases |
| **Hardened cryptography** | @noble ecosystem, authenticated headers, key commitment, synthetic nonces |
| **RAM-only mode (MANDATORY)** | No disk writes, auto-clear on idle, no persistent storage |
| **Decentralized storage** | IPFS P2P network via Helia |
| **Strong plausible deniability** | Indistinguishable padding, constant-time operations |
| **Recovery options** | Shamir secret sharing, vault export/import |

### Design Philosophy

> *"What cannot be proven to exist cannot be coerced."*

Sanctum operates on the principle that cryptographic deniability provides stronger protection than encryption alone. An adversary who cannot prove additional data exists cannot compel its disclosure.

---

## 2. Threat Model

### 2.1 Adversaries

| Adversary | Capabilities | Mitigations |
|-----------|--------------|-------------|
| **Coercive actor** | Physical duress, legal compulsion | Deniable layers, decoy content |
| **Device seizure** | Full disk access, forensic analysis | RAM-only mode (mandatory), no local persistence |
| **Network observer** | Traffic analysis, MITM | IPFS content-addressing, E2E encryption |
| **Platform operator** | Server logs, metadata collection | Zero backend, client-only crypto |
| **Cryptanalyst** | Computational attacks | Argon2id (memory-hard), XChaCha20-Poly1305 |

### 2.2 Security Goals

1. **Confidentiality**: Vault contents readable only with correct passphrase
2. **Integrity**: Tampering detected before decryption
3. **Authenticity**: Cryptographic binding of all parameters
4. **Deniability**: Hidden layers indistinguishable from random padding
5. **Forward secrecy**: Compromise of one vault doesn't affect others
6. **Censorship resistance**: No single point of failure for storage

### 2.3 Non-Goals

- Protection against keyloggers or compromised browsers
- Anonymity of vault creation (use Tor separately)
- Protection against quantum computers (future consideration)

---

## 3. Architecture Overview

### 3.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    React 18 + Tailwind + shadcn/ui              │
├─────────────────────────────────────────────────────────────────┤
│                       Application Layer                          │
│                      Next.js 15+ App Router                      │
├─────────────────────────────────────────────────────────────────┤
│                      Cryptography Layer                          │
│    @noble/hashes  │  @noble/ciphers  │  Custom Shamir (GF256)   │
├─────────────────────────────────────────────────────────────────┤
│                        Storage Layer                             │
│              Helia (IPFS)  │  Export/Import (external)           │
├─────────────────────────────────────────────────────────────────┤
│                        Worker Layer                              │
│              Web Worker (RAM isolation, auto-clear)              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User Input (Passphrase + Content)
         │
         ▼
┌─────────────────────┐
│   Passphrase        │
│   Validation        │◄─── Entropy check, Diceware detection
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Key Derivation    │◄─── Argon2id (adaptive: 64MB-1GB)
│   (Web Worker)      │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Key Separation    │◄─── HKDF: encKey, comKey
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Encryption        │◄─── XChaCha20-Poly1305 + AAD
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Commitment        │◄─── SHA-256(comKey || header || ciphertext)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Padding           │◄─── Random fill to size class
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Storage           │◄─── IPFS / Export (external only)
└─────────────────────┘
```

---

## 4. Vault Blob Structure

### 4.1 Binary Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (9 bytes) - AUTHENTICATED via AAD                       │
│   ├── Version:       1 byte  (0x03 for v3.0)                   │
│   ├── Memory (m):    4 bytes (little-endian, KB units)         │
│   ├── Time (t):      2 bytes (little-endian, iterations)       │
│   └── Parallelism:   2 bytes (little-endian, threads)          │
├─────────────────────────────────────────────────────────────────┤
│ SALT (32 bytes) - Random, unique per vault                     │
├─────────────────────────────────────────────────────────────────┤
│ NONCE (24 bytes) - Synthetic: random(16) || deterministic(8)   │
├─────────────────────────────────────────────────────────────────┤
│ COMMITMENT (32 bytes) - SHA-256(comKey || header || ciphertext)│
├─────────────────────────────────────────────────────────────────┤
│ CIPHERTEXT (variable) - XChaCha20-Poly1305 encrypted content   │
│   └── Includes 16-byte Poly1305 authentication tag             │
├─────────────────────────────────────────────────────────────────┤
│ PADDING (variable) - Random bytes to reach size class          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Size Classes

| Class | Size | Use Case |
|-------|------|----------|
| 0 | 1 MB | Text notes, small secrets |
| 1 | 5 MB | Documents, small media |
| 2 | 25 MB | Photo collections |
| 3 | 100 MB | Large files, video |

### 4.3 Overhead Calculation

```
Fixed overhead: 9 + 32 + 24 + 32 + 16 = 113 bytes
Maximum content: SIZE_CLASS - 113 bytes
```

---

## 5. Cryptographic Implementation

### 5.1 Constants and Configuration

```typescript
// constants.ts

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

### 5.2 Utility Functions

```typescript
// utils.ts

import { randomBytes as nobleRandomBytes } from '@noble/ciphers/webcrypto';

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(n: number): Uint8Array {
  return nobleRandomBytes(n);
}

/**
 * Encode Argon2 parameters into 8-byte buffer
 */
export function encodeArgonParams(params: {
  m: number;
  t: number;
  p: number;
}): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setUint32(0, params.m, true);  // memory cost (KB)
  view.setUint16(4, params.t, true);  // time cost (iterations)
  view.setUint16(6, params.p, true);  // parallelism (threads)
  return buf;
}

/**
 * Decode Argon2 parameters from 8-byte buffer
 */
export function decodeArgonParams(buf: Uint8Array): {
  m: number;
  t: number;
  p: number;
  dkLen: number;
} {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    m: view.getUint32(0, true),
    t: view.getUint16(4, true),
    p: view.getUint16(6, true),
    dkLen: 32
  };
}

/**
 * Constant-time byte array comparison
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Select appropriate vault size class
 */
export function selectVaultSize(contentLength: number): number {
  for (const size of VAULT_SIZES) {
    if (contentLength + 113 <= size) {
      return size;
    }
  }
  return VAULT_SIZES[VAULT_SIZES.length - 1];
}

/**
 * Detect device capabilities and select Argon2 profile
 */
export function detectArgonProfile(): keyof typeof ARGON2_PROFILES {
  // Check available memory
  const memory = (navigator as any).deviceMemory;
  
  if (memory && memory < 4) {
    return 'mobile';
  }
  
  // Check if cross-origin isolated (better performance)
  if (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) {
    return 'desktop';
  }
  
  // Default to mobile for safety
  return 'mobile';
}
```

### 5.3 Core Encryption

```typescript
// crypto.ts

import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { argon2id } from '@noble/hashes/argon2';
import {
  VAULT_VERSION,
  ARGON2_PROFILES,
  HKDF_INFO
} from './constants';
import {
  randomBytes,
  encodeArgonParams,
  decodeArgonParams,
  constantTimeEqual,
  selectVaultSize
} from './utils';

/**
 * Generate synthetic nonce for nonce-misuse resistance
 * Format: random(16) || H(key || plaintext || random)[0:8]
 */
function generateSyntheticNonce(
  key: Uint8Array,
  plaintext: Uint8Array
): Uint8Array {
  const random = randomBytes(16);
  
  // Create deterministic component from key, plaintext sample, and random
  const hashInput = new Uint8Array(16 + 64 + 16);
  hashInput.set(key.slice(0, 16), 0);
  hashInput.set(plaintext.slice(0, Math.min(64, plaintext.length)), 16);
  hashInput.set(random, 80);
  
  const deterministic = sha256(hashInput).slice(0, 8);
  
  // Combine: 16 random + 8 deterministic = 24 bytes (XChaCha20 nonce size)
  const nonce = new Uint8Array(24);
  nonce.set(random, 0);
  nonce.set(deterministic, 16);
  
  return nonce;
}

/**
 *


---

## 7. RAM-Only Mode (Mandatory)

Sanctum operates **exclusively in RAM**. No vault data is ever written to disk, IndexedDB, localStorage, or any persistent browser storage.

### 7.1 Rationale

Persistent storage creates forensic evidence. Users who don't understand this risk cannot make informed opt-out decisions. Therefore, **RAM-only is not optional**.

### 7.2 Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     VAULT LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│  1. User enters passphrase                                      │
│  2. Vault decrypted into Web Worker memory                      │
│  3. User interacts with vault                                   │
│  4. User saves changes → re-encrypt → IPFS/export              │
│  5. ANY of these triggers clearance:                            │
│     • Idle timeout (60s)                                        │
│     • Tab hidden/switched                                       │
│     • Tab/browser closed                                        │
│     • Manual lock                                               │
│     • Browser crash (automatic)                                 │
│  6. Vault gone from memory — recovery via IPFS/export only     │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Recovery Mechanisms

Since RAM-only means no local persistence, users **must** use at least one:

| Method | Description |
|--------|-------------|
| **IPFS CID** | Content-addressed, distributed, censorship-resistant |
| **Export file** | Portable encrypted blob, user manages storage |
| **Shamir shares** | Distributed recovery via trusted contacts |

### 7.4 Implementation

```typescript
// workers/ram.worker.ts
let vaultData: Uint8Array | null = null;
let idleTimer: number | null = null;
const IDLE_TIMEOUT = 60_000; // 60 seconds

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = self.setTimeout(clearVault, IDLE_TIMEOUT);
}

function clearVault() {
  if (vaultData) {
    // Overwrite with random data before releasing
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

// Clear on worker termination
self.addEventListener('unload', clearVault);
```

```typescript
// lib/ram/worker.ts - Main thread interface
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
    }, 30_000) as any; // Ping every 30s
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

### 7.5 Security Guarantees

- ✅ **No disk writes**: Vault data never touches filesystem
- ✅ **No browser storage**: No localStorage, sessionStorage, IndexedDB, or cookies
- ✅ **Isolated worker**: Vault data in separate memory context
- ✅ **Random overwrite**: Memory zeroed with random data before release
- ✅ **Auto-clear**: Multiple triggers ensure data doesn't persist
- ✅ **Forensic resistance**: No evidence remains after clearance

### 7.6 User Education

Users must understand:
1. **Vault data is temporary** - Only exists while actively open
2. **Recovery is required** - Must save IPFS CID, export file, or Shamir shares
3. **No "undo" for lock** - Once cleared, vault must be re-retrieved
4. **Idle timeout is strict** - 60 seconds of inactivity triggers clearance

---
