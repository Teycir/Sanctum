# Sanctum Modular Architecture Guide

**Purpose**: Ensure all code is modular, reusable, and testable  
**Principles**: Single Responsibility, Dependency Injection, Pure Functions  
**Last Updated**: January 2026

---

## 🎯 Core Principles

### 1. Single Responsibility Principle
Each module does ONE thing and does it well.

### 2. Pure Functions First
Prefer pure functions (no side effects, deterministic output).

### 3. Dependency Injection
Pass dependencies as parameters, not global imports.

### 4. Interface-Driven Design
Define interfaces before implementation.

### 5. Test-Driven Development
Write tests alongside implementation.

---

## 📦 Module Structure Template

### Standard Module Pattern

```typescript
// lib/crypto/example.ts

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ExampleConfig {
  readonly param1: number;
  readonly param2: string;
}

export interface ExampleResult {
  readonly output: Uint8Array;
  readonly metadata: Record<string, unknown>;
}

export interface ExampleError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ExampleConfig = {
  param1: 42,
  param2: 'default'
};

// ============================================================================
// PURE FUNCTIONS (Exported)
// ============================================================================

/**
 * Main function with clear input/output contract
 * 
 * @param input - Input data
 * @param config - Configuration (optional, uses defaults)
 * @returns Result object
 * @throws {ExampleError} If validation fails
 * 
 * @example
 * ```typescript
 * const result = exampleFunction(data, { param1: 100 });
 * ```
 */
export function exampleFunction(
  input: Uint8Array,
  config: Partial<ExampleConfig> = {}
): ExampleResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Validation
  validateInput(input);
  
  // Processing
  const output = processData(input, finalConfig);
  
  return {
    output,
    metadata: { timestamp: Date.now() }
  };
}

// ============================================================================
// INTERNAL HELPERS (Not exported)
// ============================================================================

function validateInput(input: Uint8Array): void {
  if (input.length === 0) {
    throw createError('INVALID_INPUT', 'Input cannot be empty');
  }
}

function processData(
  input: Uint8Array,
  config: ExampleConfig
): Uint8Array {
  // Pure processing logic
  return new Uint8Array(input.length);
}

function createError(code: string, message: string): ExampleError {
  const error = new Error(message) as ExampleError;
  error.code = code;
  return error;
}
```

---

## 🏗️ Crypto Module Architecture

### lib/crypto/constants.ts

```typescript
// ============================================================================
// VAULT FORMAT
// ============================================================================

export const VAULT_VERSION = 0x03 as const;

export const BLOB_SIZES = {
  header: 9,
  salt: 32,
  nonce: 24,
  commitment: 32,
  authTag: 16
} as const;

// ============================================================================
// ARGON2ID PROFILES
// ============================================================================

export interface Argon2Profile {
  readonly m: number;      // Memory (KB)
  readonly t: number;      // Time (iterations)
  readonly p: number;      // Parallelism (threads)
  readonly dkLen: number;  // Derived key length
}

export const ARGON2_PROFILES = {
  mobile: { m: 65536, t: 3, p: 1, dkLen: 32 },
  desktop: { m: 262144, t: 3, p: 2, dkLen: 32 },
  paranoid: { m: 1048576, t: 4, p: 4, dkLen: 32 }
} as const;

export type Argon2ProfileName = keyof typeof ARGON2_PROFILES;

// ============================================================================
// SIZE CLASSES
// ============================================================================

export const SIZE_CLASSES = [
  1 * 1024,         // 1 KB
  4 * 1024,         // 4 KB
  16 * 1024,        // 16 KB
  64 * 1024,        // 64 KB
  256 * 1024,       // 256 KB
  1 * 1024 * 1024,  // 1 MB
  4 * 1024 * 1024,  // 4 MB
  16 * 1024 * 1024  // 16 MB
] as const;

export const MAX_VAULT_SIZE = SIZE_CLASSES[SIZE_CLASSES.length - 1];

// ============================================================================
// HKDF CONTEXTS
// ============================================================================

export const HKDF_CONTEXTS = {
  encryption: 'duressvault-encryption-v3',
  commitment: 'duressvault-commitment-v3',
  layerDerivation: 'duressvault-layer-v3'
} as const;

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const TIMING = {
  idleTimeout: 60_000,      // 60 seconds
  hiddenTimeout: 15_000,    // 15 seconds
  clipboardClear: 30_000,   // 30 seconds
  activityPing: 30_000      // 30 seconds
} as const;
```

### lib/crypto/utils.ts

```typescript
// ============================================================================
// TYPES
// ============================================================================

export interface EncodingResult {
  readonly encoded: Uint8Array;
  readonly length: number;
}

// ============================================================================
// BYTE OPERATIONS
// ============================================================================

/**
 * Constant-time byte array comparison
 * Prevents timing attacks by ensuring comparison takes same time regardless of where difference occurs
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * Concatenate multiple Uint8Arrays efficiently
 */
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

/**
 * Secure random bytes generation
 */
export function randomBytes(length: number): Uint8Array {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

/**
 * Sanitize memory by overwriting with random data
 */
export function sanitizeMemory(buffer: Uint8Array): void {
  crypto.getRandomValues(buffer);
}

// ============================================================================
// ENCODING/DECODING
// ============================================================================

/**
 * Encode 32-bit unsigned integer (little-endian)
 */
export function encodeU32LE(value: number): Uint8Array {
  if (value < 0 || value > 0xFFFFFFFF) {
    throw new Error('Value out of range for u32');
  }
  
  const buffer = new Uint8Array(4);
  buffer[0] = value & 0xFF;
  buffer[1] = (value >> 8) & 0xFF;
  buffer[2] = (value >> 16) & 0xFF;
  buffer[3] = (value >> 24) & 0xFF;
  return buffer;
}

/**
 * Decode 32-bit unsigned integer (little-endian)
 */
export function decodeU32LE(buffer: Uint8Array, offset = 0): number {
  if (offset + 4 > buffer.length) {
    throw new Error('Buffer too small for u32');
  }
  
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  ) >>> 0;
}

/**
 * Encode 16-bit unsigned integer (little-endian)
 */
export function encodeU16LE(value: number): Uint8Array {
  if (value < 0 || value > 0xFFFF) {
    throw new Error('Value out of range for u16');
  }
  
  const buffer = new Uint8Array(2);
  buffer[0] = value & 0xFF;
  buffer[1] = (value >> 8) & 0xFF;
  return buffer;
}

/**
 * Decode 16-bit unsigned integer (little-endian)
 */
export function decodeU16LE(buffer: Uint8Array, offset = 0): number {
  if (offset + 2 > buffer.length) {
    throw new Error('Buffer too small for u16');
  }
  
  return buffer[offset] | (buffer[offset + 1] << 8);
}

// ============================================================================
// BASE64 URL-SAFE
// ============================================================================

/**
 * Base64 URL-safe encoding (no padding)
 */
export function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL-safe decoding
 */
export function base64UrlDecode(str: string): Uint8Array {
  const base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// ============================================================================
// TEXT ENCODING
// ============================================================================

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeText(text: string): Uint8Array {
  return textEncoder.encode(text);
}

export function decodeText(data: Uint8Array): string {
  return textDecoder.decode(data);
}

// ============================================================================
// SIZE UTILITIES
// ============================================================================

/**
 * Get padded size for data (next power of 4)
 */
export function getPaddedSize(dataSize: number): number {
  const { SIZE_CLASSES, MAX_VAULT_SIZE } = require('./constants');
  
  if (dataSize > MAX_VAULT_SIZE) {
    throw new Error(`Data exceeds maximum vault size (${MAX_VAULT_SIZE / 1024 / 1024} MB)`);
  }
  
  for (const size of SIZE_CLASSES) {
    if (dataSize <= size) return size;
  }
  
  return MAX_VAULT_SIZE;
}

/**
 * Calculate total overhead for vault blob
 */
export function calculateOverhead(): number {
  const { BLOB_SIZES } = require('./constants');
  return BLOB_SIZES.header + BLOB_SIZES.salt + BLOB_SIZES.nonce + 
         BLOB_SIZES.commitment + BLOB_SIZES.authTag;
}
```

### lib/crypto/core.ts

```typescript
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, concat, sanitizeMemory } from './utils';
import { BLOB_SIZES } from './constants';

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptionParams {
  readonly plaintext: Uint8Array;
  readonly key: Uint8Array;
  readonly aad?: Uint8Array;
}

export interface EncryptionResult {
  readonly ciphertext: Uint8Array;
  readonly nonce: Uint8Array;
  readonly authTag: Uint8Array;
}

export interface DecryptionParams {
  readonly ciphertext: Uint8Array;
  readonly key: Uint8Array;
  readonly nonce: Uint8Array;
  readonly aad?: Uint8Array;
}

export interface SyntheticNonceParams {
  readonly key: Uint8Array;
  readonly plaintext: Uint8Array;
  readonly randomPart?: Uint8Array;
}

// ============================================================================
// SYNTHETIC NONCE GENERATION
// ============================================================================

/**
 * Generate synthetic nonce for nonce-misuse resistance
 * Format: random(16) || H(key || plaintext || random)[0:8]
 * 
 * @param params - Nonce generation parameters
 * @returns 24-byte nonce for XChaCha20
 */
export function generateSyntheticNonce(params: SyntheticNonceParams): Uint8Array {
  const { key, plaintext, randomPart = randomBytes(16) } = params;
  
  if (randomPart.length !== 16) {
    throw new Error('Random part must be 16 bytes');
  }
  
  // Sample plaintext (first 64 bytes or less)
  const plaintextSample = plaintext.slice(0, Math.min(64, plaintext.length));
  
  // Hash: key[0:16] || plaintext[0:64] || random[0:16]
  const hashInput = concat(
    key.slice(0, 16),
    plaintextSample,
    randomPart
  );
  
  const hash = sha256(hashInput);
  const deterministicPart = hash.slice(0, 8);
  
  // Combine: 16 random + 8 deterministic = 24 bytes
  return concat(randomPart, deterministicPart);
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt data using XChaCha20-Poly1305 with synthetic nonce
 * 
 * @param params - Encryption parameters
 * @returns Encryption result with ciphertext, nonce, and auth tag
 */
export function encrypt(params: EncryptionParams): EncryptionResult {
  const { plaintext, key, aad } = params;
  
  // Validate inputs
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  
  if (plaintext.length === 0) {
    throw new Error('Plaintext cannot be empty');
  }
  
  // Generate synthetic nonce
  const nonce = generateSyntheticNonce({ key, plaintext });
  
  // Create cipher
  const cipher = xchacha20poly1305(key, nonce, aad);
  
  // Encrypt (includes 16-byte Poly1305 tag)
  const ciphertextWithTag = cipher.encrypt(plaintext);
  
  // Split ciphertext and auth tag
  const ciphertext = ciphertextWithTag.slice(0, -16);
  const authTag = ciphertextWithTag.slice(-16);
  
  return { ciphertext, nonce, authTag };
}

// ============================================================================
// DECRYPTION
// ============================================================================

/**
 * Decrypt data using XChaCha20-Poly1305
 * 
 * @param params - Decryption parameters
 * @returns Decrypted plaintext
 * @throws {Error} If authentication fails
 */
export function decrypt(params: DecryptionParams): Uint8Array {
  const { ciphertext, key, nonce, aad } = params;
  
  // Validate inputs
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  
  if (nonce.length !== 24) {
    throw new Error('Nonce must be 24 bytes');
  }
  
  // Create cipher
  const cipher = xchacha20poly1305(key, nonce, aad);
  
  try {
    // Decrypt and verify (throws if auth fails)
    return cipher.decrypt(ciphertext);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Decryption failed: authentication tag mismatch');
    }
    throw error;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Wipe sensitive data from memory
 */
export function wipeKey(key: Uint8Array): void {
  sanitizeMemory(key);
}
```

---

## 🧪 Test Structure Template

### Corresponding Test File

```typescript
// __tests__/crypto/core.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  encrypt, 
  decrypt, 
  generateSyntheticNonce,
  wipeKey 
} from '@/lib/crypto/core';
import { randomBytes } from '@/lib/crypto/utils';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const TEST_KEY = new Uint8Array(32).fill(0x42);
const TEST_PLAINTEXT = new TextEncoder().encode('Hello, Sanctum!');
const TEST_AAD = new TextEncoder().encode('additional-data');

// ============================================================================
// SYNTHETIC NONCE TESTS
// ============================================================================

describe('generateSyntheticNonce', () => {
  it('should generate 24-byte nonce', () => {
    const nonce = generateSyntheticNonce({
      key: TEST_KEY,
      plaintext: TEST_PLAINTEXT
    });
    
    expect(nonce.length).toBe(24);
  });
  
  it('should be deterministic with same random part', () => {
    const randomPart = randomBytes(16);
    
    const nonce1 = generateSyntheticNonce({
      key: TEST_KEY,
      plaintext: TEST_PLAINTEXT,
      randomPart
    });
    
    const nonce2 = generateSyntheticNonce({
      key: TEST_KEY,
      plaintext: TEST_PLAINTEXT,
      randomPart
    });
    
    expect(nonce1).toEqual(nonce2);
  });
  
  it('should differ with different random parts', () => {
    const nonce1 = generateSyntheticNonce({
      key: TEST_KEY,
      plaintext: TEST_PLAINTEXT
    });
    
    const nonce2 = generateSyntheticNonce({
      key: TEST_KEY,
      plaintext: TEST_PLAINTEXT
    });
    
    expect(nonce1).not.toEqual(nonce2);
  });
  
  it('should throw on invalid random part length', () => {
    expect(() => {
      generateSyntheticNonce({
        key: TEST_KEY,
        plaintext: TEST_PLAINTEXT,
        randomPart: new Uint8Array(15) // Wrong length
      });
    }).toThrow('Random part must be 16 bytes');
  });
});

// ============================================================================
// ENCRYPTION TESTS
// ============================================================================

describe('encrypt', () => {
  it('should encrypt plaintext successfully', () => {
    const result = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY
    });
    
    expect(result.ciphertext.length).toBeGreaterThan(0);
    expect(result.nonce.length).toBe(24);
    expect(result.authTag.length).toBe(16);
  });
  
  it('should produce different ciphertexts for same plaintext', () => {
    const result1 = encrypt({ plaintext: TEST_PLAINTEXT, key: TEST_KEY });
    const result2 = encrypt({ plaintext: TEST_PLAINTEXT, key: TEST_KEY });
    
    expect(result1.ciphertext).not.toEqual(result2.ciphertext);
    expect(result1.nonce).not.toEqual(result2.nonce);
  });
  
  it('should include AAD in authentication', () => {
    const result = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY,
      aad: TEST_AAD
    });
    
    expect(result.ciphertext.length).toBeGreaterThan(0);
  });
  
  it('should throw on invalid key length', () => {
    expect(() => {
      encrypt({
        plaintext: TEST_PLAINTEXT,
        key: new Uint8Array(16) // Wrong length
      });
    }).toThrow('Key must be 32 bytes');
  });
  
  it('should throw on empty plaintext', () => {
    expect(() => {
      encrypt({
        plaintext: new Uint8Array(0),
        key: TEST_KEY
      });
    }).toThrow('Plaintext cannot be empty');
  });
});

// ============================================================================
// DECRYPTION TESTS
// ============================================================================

describe('decrypt', () => {
  it('should decrypt ciphertext successfully', () => {
    const encrypted = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY
    });
    
    const decrypted = decrypt({
      ciphertext: encrypted.ciphertext,
      key: TEST_KEY,
      nonce: encrypted.nonce
    });
    
    expect(decrypted).toEqual(TEST_PLAINTEXT);
  });
  
  it('should verify AAD during decryption', () => {
    const encrypted = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY,
      aad: TEST_AAD
    });
    
    const decrypted = decrypt({
      ciphertext: encrypted.ciphertext,
      key: TEST_KEY,
      nonce: encrypted.nonce,
      aad: TEST_AAD
    });
    
    expect(decrypted).toEqual(TEST_PLAINTEXT);
  });
  
  it('should fail with wrong AAD', () => {
    const encrypted = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY,
      aad: TEST_AAD
    });
    
    expect(() => {
      decrypt({
        ciphertext: encrypted.ciphertext,
        key: TEST_KEY,
        nonce: encrypted.nonce,
        aad: new TextEncoder().encode('wrong-aad')
      });
    }).toThrow('authentication tag mismatch');
  });
  
  it('should fail with wrong key', () => {
    const encrypted = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY
    });
    
    const wrongKey = new Uint8Array(32).fill(0xFF);
    
    expect(() => {
      decrypt({
        ciphertext: encrypted.ciphertext,
        key: wrongKey,
        nonce: encrypted.nonce
      });
    }).toThrow('authentication tag mismatch');
  });
  
  it('should fail with tampered ciphertext', () => {
    const encrypted = encrypt({
      plaintext: TEST_PLAINTEXT,
      key: TEST_KEY
    });
    
    // Tamper with ciphertext
    encrypted.ciphertext[0] ^= 0xFF;
    
    expect(() => {
      decrypt({
        ciphertext: encrypted.ciphertext,
        key: TEST_KEY,
        nonce: encrypted.nonce
      });
    }).toThrow('authentication tag mismatch');
  });
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================

describe('encrypt/decrypt round-trip', () => {
  it('should handle various plaintext sizes', () => {
    const sizes = [1, 16, 64, 256, 1024, 4096];
    
    for (const size of sizes) {
      const plaintext = randomBytes(size);
      const encrypted = encrypt({ plaintext, key: TEST_KEY });
      const decrypted = decrypt({
        ciphertext: encrypted.ciphertext,
        key: TEST_KEY,
        nonce: encrypted.nonce
      });
      
      expect(decrypted).toEqual(plaintext);
    }
  });
  
  it('should handle UTF-8 text', () => {
    const texts = [
      'Hello, World!',
      'Émojis: 🔒🔐🗝️',
      '日本語テキスト',
      'العربية',
      'Русский'
    ];
    
    for (const text of texts) {
      const plaintext = new TextEncoder().encode(text);
      const encrypted = encrypt({ plaintext, key: TEST_KEY });
      const decrypted = decrypt({
        ciphertext: encrypted.ciphertext,
        key: TEST_KEY,
        nonce: encrypted.nonce
      });
      
      expect(new TextDecoder().decode(decrypted)).toBe(text);
    }
  });
});

// ============================================================================
// MEMORY SAFETY TESTS
// ============================================================================

describe('wipeKey', () => {
  it('should overwrite key with random data', () => {
    const key = new Uint8Array(32).fill(0x42);
    const original = new Uint8Array(key);
    
    wipeKey(key);
    
    expect(key).not.toEqual(original);
  });
});
```

---

## 📋 Module Checklist

Before marking a module as "complete", ensure:

- [ ] **Types defined** - All interfaces and types documented
- [ ] **Pure functions** - No side effects where possible
- [ ] **Input validation** - All inputs validated
- [ ] **Error handling** - Proper error types and messages
- [ ] **JSDoc comments** - All public functions documented
- [ ] **Unit tests** - 100% coverage of public API
- [ ] **Integration tests** - Tests with other modules
- [ ] **Performance tests** - Benchmarks for critical paths
- [ ] **Security review** - Constant-time operations verified
- [ ] **Memory safety** - Sensitive data wiped after use

---

## 🎯 Reusability Guidelines

### 1. Export Granularly

```typescript
// ❌ Bad: Export everything
export * from './internal';

// ✅ Good: Export only public API
export { encrypt, decrypt } from './core';
export type { EncryptionParams, DecryptionParams } from './core';
```

### 2. Avoid Global State

```typescript
// ❌ Bad: Global state
let cachedKey: Uint8Array;

export function setKey(key: Uint8Array) {
  cachedKey = key;
}

// ✅ Good: Pass as parameter
export function encrypt(plaintext: Uint8Array, key: Uint8Array) {
  // Use key directly
}
```

### 3. Use Dependency Injection

```typescript
// ❌ Bad: Hard-coded dependency
import { randomBytes } from './utils';

export function generateNonce() {
  return randomBytes(24);
}

// ✅ Good: Inject dependency
export function generateNonce(
  randomFn: (n: number) => Uint8Array = randomBytes
) {
  return randomFn(24);
}
```

### 4. Make Functions Composable

```typescript
// ✅ Good: Small, composable functions
export function encodeHeader(version: number, params: Argon2Params): Uint8Array {
  return concat(
    encodeU8(version),
    encodeArgon2Params(params)
  );
}

export function decodeHeader(header: Uint8Array): HeaderData {
  return {
    version: decodeU8(header, 0),
    params: decodeArgon2Params(header.slice(1))
  };
}
```

---

## 🚀 Next Steps

1. **Apply template** to all new modules
2. **Write tests first** (TDD approach)
3. **Review for reusability** before merging
4. **Document public API** with JSDoc
5. **Benchmark critical paths** for performance

---

**Last Updated**: January 2026  
**Status**: Living Document
