# Refactoring Rules

**CRITICAL**: Code must be continuously refactored to maintain quality and modularity.

---

## 🔴 Immediate Refactoring Triggers

### 1. Function Length > 50 Lines

**Rule**: Any function exceeding 50 lines MUST be refactored immediately.

```typescript
// ❌ FORBIDDEN: Long function
export function processVault(data: Uint8Array, passphrase: string) {
  // Line 1-20: Key derivation
  // Line 21-40: Encryption
  // Line 41-60: Commitment
  // Line 61-80: Padding
  // STOP! Refactor now!
}

// ✅ REQUIRED: Split into smaller functions
export function processVault(data: Uint8Array, passphrase: string): VaultResult {
  const key = deriveKey(passphrase);
  const encrypted = encryptData(data, key);
  const commitment = generateCommitment(key, encrypted);
  const padded = addPadding(encrypted);
  return { padded, commitment };
}
```

---

### 2. File Length > 300 Lines

**Rule**: Any file exceeding 300 lines MUST be split into multiple modules.

```typescript
// ❌ FORBIDDEN: crypto.ts (500 lines)
// Contains: encryption, key derivation, padding, commitment

// ✅ REQUIRED: Split into modules
// crypto/core.ts (100 lines) - Encryption/decryption
// crypto/kdf.ts (80 lines) - Key derivation
// crypto/padding.ts (60 lines) - Padding
// crypto/commitment.ts (70 lines) - Commitment
// crypto/index.ts (20 lines) - Barrel exports
```

---

### 3. Duplicate Code (DRY Violation)

**Rule**: Code duplicated 2+ times MUST be extracted to shared utility.

```typescript
// ❌ FORBIDDEN: Duplicate validation
export function encrypt(data: Uint8Array, key: Uint8Array) {
  if (key.length !== 32) throw new Error('Key must be 32 bytes');
  // ...
}

export function decrypt(data: Uint8Array, key: Uint8Array) {
  if (key.length !== 32) throw new Error('Key must be 32 bytes');
  // ...
}

// ✅ REQUIRED: Extract to utility
function validateKey(key: Uint8Array): void {
  if (key.length !== 32) throw new Error('Key must be 32 bytes');
}

export function encrypt(data: Uint8Array, key: Uint8Array) {
  validateKey(key);
  // ...
}

export function decrypt(data: Uint8Array, key: Uint8Array) {
  validateKey(key);
  // ...
}
```

---

### 4. Magic Numbers/Strings

**Rule**: All magic values MUST be named constants.

```typescript
// ❌ FORBIDDEN: Magic numbers
export function generateNonce(): Uint8Array {
  return randomBytes(24);  // What is 24?
}

export function deriveKey(passphrase: string): Uint8Array {
  return argon2id(passphrase, { m: 262144, t: 3, p: 2 });  // What are these?
}

// ✅ REQUIRED: Named constants
const NONCE_SIZE = 24;  // XChaCha20 nonce size
const ARGON2_MEMORY = 262144;  // 256 MB
const ARGON2_ITERATIONS = 3;
const ARGON2_PARALLELISM = 2;

export function generateNonce(): Uint8Array {
  return randomBytes(NONCE_SIZE);
}

export function deriveKey(passphrase: string): Uint8Array {
  return argon2id(passphrase, {
    m: ARGON2_MEMORY,
    t: ARGON2_ITERATIONS,
    p: ARGON2_PARALLELISM
  });
}
```

---

### 5. Complex Conditionals

**Rule**: Nested conditionals > 2 levels MUST be refactored.

```typescript
// ❌ FORBIDDEN: Nested conditionals
export function validateVault(vault: Vault): boolean {
  if (vault.version === 3) {
    if (vault.header) {
      if (vault.header.length === 9) {
        if (vault.salt && vault.salt.length === 32) {
          return true;
        }
      }
    }
  }
  return false;
}

// ✅ REQUIRED: Early returns
export function validateVault(vault: Vault): boolean {
  if (vault.version !== 3) return false;
  if (!vault.header) return false;
  if (vault.header.length !== 9) return false;
  if (!vault.salt || vault.salt.length !== 32) return false;
  return true;
}

// ✅ BETTER: Extract validation functions
function isValidVersion(vault: Vault): boolean {
  return vault.version === 3;
}

function isValidHeader(vault: Vault): boolean {
  return vault.header?.length === 9;
}

function isValidSalt(vault: Vault): boolean {
  return vault.salt?.length === 32;
}

export function validateVault(vault: Vault): boolean {
  return isValidVersion(vault) && 
         isValidHeader(vault) && 
         isValidSalt(vault);
}
```

---

### 6. Side Effects in Pure Functions

**Rule**: Functions with side effects MUST be refactored or clearly marked.

```typescript
// ❌ FORBIDDEN: Hidden side effect
export function encrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  console.log('Encrypting data...');  // Side effect!
  localStorage.setItem('lastKey', encode(key));  // Side effect!
  return xchacha20poly1305(key, nonce).encrypt(data);
}

// ✅ REQUIRED: Pure function
export function encrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  return xchacha20poly1305(key, nonce).encrypt(data);
}

// ✅ REQUIRED: Explicit side effects
export function encryptWithLogging(
  data: Uint8Array,
  key: Uint8Array,
  logger: Logger
): Uint8Array {
  logger.log('Encrypting data...');
  return encrypt(data, key);
}
```

---

## 🟡 Refactoring Opportunities

### 1. Extract Method

**When**: Function does multiple things

```typescript
// BEFORE
export function createVault(data: Uint8Array, passphrase: string) {
  // Derive key
  const salt = randomBytes(32);
  const key = argon2id(passphrase, salt, { m: 262144, t: 3, p: 2 });
  
  // Encrypt
  const nonce = randomBytes(24);
  const encrypted = xchacha20poly1305(key, nonce).encrypt(data);
  
  // Add padding
  const targetSize = getPaddedSize(encrypted.length);
  const padding = randomBytes(targetSize - encrypted.length);
  const padded = concat(encrypted, padding);
  
  return { padded, salt, nonce };
}

// AFTER
export function createVault(data: Uint8Array, passphrase: string): VaultResult {
  const { key, salt } = deriveKey(passphrase);
  const { encrypted, nonce } = encrypt(data, key);
  const padded = addPadding(encrypted);
  return { padded, salt, nonce };
}
```

---

### 2. Replace Temp with Query

**When**: Temporary variable used once

```typescript
// BEFORE
export function validateKey(key: Uint8Array): boolean {
  const isCorrectLength = key.length === 32;
  return isCorrectLength;
}

// AFTER
export function validateKey(key: Uint8Array): boolean {
  return key.length === 32;
}
```

---

### 3. Introduce Parameter Object

**When**: Function has > 3 parameters

```typescript
// BEFORE
export function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  memory: number,
  iterations: number,
  parallelism: number
): Uint8Array {
  // ...
}

// AFTER
export interface KDFParams {
  readonly passphrase: string;
  readonly salt: Uint8Array;
  readonly memory: number;
  readonly iterations: number;
  readonly parallelism: number;
}

export function deriveKey(params: KDFParams): Uint8Array {
  // ...
}
```

---

### 4. Replace Conditional with Polymorphism

**When**: Type-based conditionals

```typescript
// BEFORE
export function upload(data: Uint8Array, provider: string): Promise<string> {
  if (provider === 'helia') {
    return uploadToHelia(data);
  } else if (provider === 'filebase') {
    return uploadToFilebase(data);
  } else if (provider === 'pinata') {
    return uploadToPinata(data);
  }
  throw new Error('Unknown provider');
}

// AFTER
export interface StorageProvider {
  upload(data: Uint8Array): Promise<string>;
}

export class HeliaProvider implements StorageProvider {
  async upload(data: Uint8Array): Promise<string> { /* ... */ }
}

export class FilebaseProvider implements StorageProvider {
  async upload(data: Uint8Array): Promise<string> { /* ... */ }
}

export function upload(data: Uint8Array, provider: StorageProvider): Promise<string> {
  return provider.upload(data);
}
```

---

### 5. Decompose Conditional

**When**: Complex boolean expressions

```typescript
// BEFORE
export function shouldEncrypt(vault: Vault): boolean {
  return vault.mode === 'hidden' && vault.passphrase && vault.passphrase.length >= 8;
}

// AFTER
function isHiddenMode(vault: Vault): boolean {
  return vault.mode === 'hidden';
}

function hasValidPassphrase(vault: Vault): boolean {
  return vault.passphrase !== undefined && vault.passphrase.length >= 8;
}

export function shouldEncrypt(vault: Vault): boolean {
  return isHiddenMode(vault) && hasValidPassphrase(vault);
}
```

---

## 🔵 Code Smells to Fix

### 1. Long Parameter List

**Smell**: Function with > 3 parameters  
**Fix**: Introduce parameter object

### 2. Data Clumps

**Smell**: Same group of parameters passed together  
**Fix**: Extract to interface/type

### 3. Primitive Obsession

**Smell**: Using primitives instead of types  
**Fix**: Create domain types

```typescript
// BEFORE
export function createVault(
  data: Uint8Array,
  passphrase: string,
  mode: string,
  memory: number
) { }

// AFTER
export type VaultMode = 'simple' | 'hidden' | 'chain';

export interface VaultConfig {
  readonly data: Uint8Array;
  readonly passphrase: string;
  readonly mode: VaultMode;
  readonly memory: number;
}

export function createVault(config: VaultConfig) { }
```

### 4. Feature Envy

**Smell**: Function uses data from another module more than its own  
**Fix**: Move function to the module it uses

### 5. Shotgun Surgery

**Smell**: Single change requires modifications in many places  
**Fix**: Consolidate related code

---

## 📋 Refactoring Checklist

Before committing code:

- [ ] No function > 50 lines
- [ ] No file > 300 lines
- [ ] No duplicate code (DRY)
- [ ] No magic numbers/strings
- [ ] No nested conditionals > 2 levels
- [ ] No side effects in pure functions
- [ ] No long parameter lists (> 3)
- [ ] No primitive obsession
- [ ] All tests still pass
- [ ] Performance not degraded

---

## 🎯 Refactoring Process

### Step 1: Identify Code Smell

Run automated checks:
```bash
npm run lint
npm run complexity-check
```

### Step 2: Write Tests

Ensure existing behavior is tested:
```bash
npm run test
```

### Step 3: Refactor

Apply refactoring pattern.

### Step 4: Verify Tests

Ensure tests still pass:
```bash
npm run test
```

### Step 5: Commit

Small, atomic commits:
```bash
git commit -m "refactor: extract validateKey utility"
```

---

## 🚫 Refactoring Anti-Patterns

### ❌ FORBIDDEN: Big Bang Refactoring

```typescript
// ❌ NO: Refactor entire codebase at once
// Risk: Breaking everything, no rollback
```

### ❌ FORBIDDEN: Refactoring Without Tests

```typescript
// ❌ NO: Refactor code without test coverage
// Risk: Silent bugs, behavior changes
```

### ❌ FORBIDDEN: Premature Optimization

```typescript
// ❌ NO: Optimize before measuring
// Risk: Complex code, no benefit
```

---

## ✅ Refactoring Best Practices

### 1. Small Steps

Refactor in small, incremental changes.

### 2. Test First

Ensure tests exist before refactoring.

### 3. One Thing at a Time

Don't mix refactoring with feature development.

### 4. Commit Often

Small, atomic commits for easy rollback.

### 5. Measure Impact

Benchmark before and after refactoring.

---

## 🎯 Enforcement

**Amazon Q will:**

1. **Flag functions > 50 lines** for immediate refactoring
2. **Flag files > 300 lines** for module splitting
3. **Detect duplicate code** and suggest extraction
4. **Identify magic numbers** and require constants
5. **Detect complex conditionals** and suggest simplification
6. **Check for side effects** in pure functions

**Before accepting any code:**
- Run complexity analysis
- Check for code smells
- Verify test coverage
- Ensure no regressions

---

## 📚 References

- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html) - Martin Fowler
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [MODULAR-ARCHITECTURE.md](../../docs/guides/MODULAR-ARCHITECTURE.md) - Sanctum guide
