# Modular Architecture Rules

**CRITICAL**: All code MUST follow modular architecture principles for reusability and testability.

---

## 🏗️ Module Structure Requirements

### ✅ REQUIRED: Standard Module Pattern

Every module MUST follow this structure:

```typescript
// ============================================================================
// TYPES & INTERFACES (First)
// ============================================================================

export interface ModuleConfig {
  readonly param: string;
}

export interface ModuleResult {
  readonly output: Uint8Array;
}

// ============================================================================
// CONSTANTS (Second)
// ============================================================================

const DEFAULT_CONFIG: ModuleConfig = { param: 'default' };

// ============================================================================
// PURE FUNCTIONS - Exported (Third)
// ============================================================================

/**
 * JSDoc with @param, @returns, @throws, @example
 */
export function mainFunction(input: Uint8Array, config?: Partial<ModuleConfig>): ModuleResult {
  // Implementation
}

// ============================================================================
// INTERNAL HELPERS - Not exported (Fourth)
// ============================================================================

function helperFunction(data: Uint8Array): Uint8Array {
  // Implementation
}
```

### ❌ FORBIDDEN: Violations

```typescript
// ❌ NO: Mixed exports and implementation
export function foo() { /* ... */ }
const helper = () => { /* ... */ };
export function bar() { /* ... */ }

// ❌ NO: Missing types
export function process(data) { /* ... */ }

// ❌ NO: Missing JSDoc on public functions
export function encrypt(data: Uint8Array) { /* ... */ }

// ❌ NO: Global state
let cachedValue: string;
export function setValue(v: string) { cachedValue = v; }
```

---

## 🎯 Single Responsibility Principle

### ✅ REQUIRED: One Purpose Per Module

Each module does ONE thing:

```typescript
// ✅ GOOD: crypto/core.ts - Only encryption/decryption
export function encrypt(params: EncryptionParams): EncryptionResult { }
export function decrypt(params: DecryptionParams): Uint8Array { }

// ✅ GOOD: crypto/kdf.ts - Only key derivation
export function deriveKey(params: KDFParams): Uint8Array { }

// ✅ GOOD: crypto/padding.ts - Only padding
export function addPadding(data: Uint8Array, targetSize: number): Uint8Array { }
```

### ❌ FORBIDDEN: Multiple Responsibilities

```typescript
// ❌ NO: crypto/everything.ts - Too many responsibilities
export function encrypt() { }
export function deriveKey() { }
export function addPadding() { }
export function uploadToIPFS() { }  // Wrong module!
```

---

## 🔬 Pure Functions First

### ✅ REQUIRED: Prefer Pure Functions

Functions should be deterministic with no side effects:

```typescript
// ✅ GOOD: Pure function
export function hash(data: Uint8Array): Uint8Array {
  return sha256(data);
}

// ✅ GOOD: Pure with explicit randomness injection
export function generateNonce(
  randomFn: (n: number) => Uint8Array = randomBytes
): Uint8Array {
  return randomFn(24);
}
```

### ❌ FORBIDDEN: Hidden Side Effects

```typescript
// ❌ NO: Hidden side effect
let lastHash: Uint8Array;
export function hash(data: Uint8Array): Uint8Array {
  lastHash = sha256(data);  // Side effect!
  return lastHash;
}

// ❌ NO: Hidden I/O
export function saveKey(key: Uint8Array): void {
  localStorage.setItem('key', encode(key));  // Side effect!
}
```

---

## 💉 Dependency Injection

### ✅ REQUIRED: Pass Dependencies as Parameters

```typescript
// ✅ GOOD: Dependency injected
export function encrypt(
  data: Uint8Array,
  key: Uint8Array,
  randomFn: (n: number) => Uint8Array = randomBytes
): EncryptionResult {
  const nonce = randomFn(24);
  // ...
}

// ✅ GOOD: Testable with mock
const result = encrypt(data, key, (n) => new Uint8Array(n).fill(0x42));
```

### ❌ FORBIDDEN: Hard-Coded Dependencies

```typescript
// ❌ NO: Hard-coded import
import { randomBytes } from './utils';

export function encrypt(data: Uint8Array, key: Uint8Array): EncryptionResult {
  const nonce = randomBytes(24);  // Can't mock in tests!
  // ...
}
```

---

## 📝 Interface-Driven Design

### ✅ REQUIRED: Define Interfaces First

```typescript
// ✅ GOOD: Interface before implementation
export interface StorageProvider {
  upload(data: Uint8Array): Promise<string>;
  download(cid: string): Promise<Uint8Array>;
}

export class HeliaStorage implements StorageProvider {
  async upload(data: Uint8Array): Promise<string> { /* ... */ }
  async download(cid: string): Promise<Uint8Array> { /* ... */ }
}

// Easy to swap implementations
export function saveVault(
  data: Uint8Array,
  storage: StorageProvider
): Promise<string> {
  return storage.upload(data);
}
```

### ❌ FORBIDDEN: Implementation Without Interface

```typescript
// ❌ NO: Tightly coupled to Helia
export async function saveVault(data: Uint8Array): Promise<string> {
  const helia = await createHelia();  // Hard-coded!
  return helia.add(data);
}
```

---

## 🧪 Test-Driven Development

### ✅ REQUIRED: Tests Alongside Implementation

For every module, create corresponding test file:

```
lib/crypto/core.ts
__tests__/crypto/core.test.ts  ← REQUIRED
```

### ✅ REQUIRED: Test Coverage

- 100% coverage of public API
- Edge cases tested
- Error conditions tested
- Performance benchmarks for critical paths

```typescript
// ✅ GOOD: Comprehensive tests
describe('encrypt', () => {
  it('should encrypt plaintext', () => { /* ... */ });
  it('should produce different ciphertexts', () => { /* ... */ });
  it('should throw on invalid key length', () => { /* ... */ });
  it('should throw on empty plaintext', () => { /* ... */ });
  it('should handle large inputs', () => { /* ... */ });
});
```

---

## 📦 Export Granularly

### ✅ REQUIRED: Explicit Exports

```typescript
// ✅ GOOD: Explicit exports
export { encrypt, decrypt } from './core';
export type { EncryptionParams, DecryptionParams } from './core';

// ✅ GOOD: Barrel export with explicit re-exports
export { encrypt, decrypt } from './core';
export { deriveKey } from './kdf';
export { addPadding } from './padding';
```

### ❌ FORBIDDEN: Wildcard Exports

```typescript
// ❌ NO: Wildcard export
export * from './core';
export * from './internal';  // Exposes internal helpers!
```

---

## 🔄 Refactoring Requirements

### When to Refactor

Refactor immediately if:

1. **Function > 50 lines** → Split into smaller functions
2. **File > 300 lines** → Split into multiple modules
3. **Duplicate code** → Extract to shared utility
4. **Hard-coded values** → Move to constants
5. **Side effects** → Make pure or explicit
6. **No tests** → Add tests before refactoring

### ✅ REQUIRED: Refactoring Pattern

```typescript
// BEFORE: Monolithic function
export function processVault(data: Uint8Array, passphrase: string) {
  // 100 lines of mixed concerns
}

// AFTER: Refactored into composable functions
export function processVault(data: Uint8Array, passphrase: string): VaultResult {
  const key = deriveKey(passphrase);
  const padded = addPadding(data);
  const encrypted = encrypt(padded, key);
  const commitment = generateCommitment(key, encrypted);
  return { encrypted, commitment };
}
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ FORBIDDEN: God Objects

```typescript
// ❌ NO: Class that does everything
class VaultManager {
  encrypt() { }
  decrypt() { }
  deriveKey() { }
  uploadToIPFS() { }
  generateShares() { }
  // ... 20 more methods
}
```

### ❌ FORBIDDEN: Utility Dumping Ground

```typescript
// ❌ NO: utils.ts with unrelated functions
export function encrypt() { }
export function formatDate() { }
export function validateEmail() { }
export function uploadFile() { }
```

### ❌ FORBIDDEN: Circular Dependencies

```typescript
// ❌ NO: crypto/core.ts imports crypto/kdf.ts
// ❌ NO: crypto/kdf.ts imports crypto/core.ts
```

---

## ✅ Module Completion Checklist

Before marking a module as complete:

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
- [ ] **No global state** - All state passed as parameters
- [ ] **No hard-coded deps** - Dependencies injected
- [ ] **Single responsibility** - Module does one thing
- [ ] **Follows template** - Uses standard module structure

---

## 🎯 Enforcement

**Amazon Q will:**

1. **Reject code** that violates these rules
2. **Suggest refactoring** for code > 50 lines per function
3. **Require tests** for all new modules
4. **Enforce structure** using the standard template
5. **Check for side effects** in pure functions
6. **Validate exports** are explicit and minimal

**Before accepting any code, verify:**
- Follows standard module structure
- Has corresponding test file
- Uses dependency injection
- No global state
- Single responsibility
- Proper JSDoc comments

---

## 📚 References

- [MODULAR-ARCHITECTURE.md](../../docs/guides/MODULAR-ARCHITECTURE.md) - Complete guide
- [SPECIFICATION.md](../../docs/core/SPECIFICATION.md) - Technical spec
- [IMPLEMENTATION-PLAN.md](../../docs/core/IMPLEMENTATION-PLAN.md) - Development roadmap
