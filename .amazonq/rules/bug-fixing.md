# Bug Fixing Rules

**CRITICAL**: Never simplify code or remove features to bypass bugs.

---

## ❌ FORBIDDEN: Simplification to Bypass Bugs

### Examples of Forbidden Practices:

```typescript
// ❌ FORBIDDEN: Removing feature because it's hard to implement
export function createDuressVault(params: DuressVaultParams): Uint8Array {
  // Only implement decoy layer, skip hidden layer
  return encryptDecoy(params.content.decoy);
}

// ❌ FORBIDDEN: Throwing error instead of implementing
export function unlockDuressVault(blob: Uint8Array, passphrase: string): Uint8Array {
  if (passphrase !== '') {
    throw new Error('Not implemented');
  }
  return decryptDecoy(blob);
}

// ❌ FORBIDDEN: Skipping tests instead of fixing bugs
it.skip('should unlock hidden layer', () => {
  // Test skipped because implementation is hard
});

// ❌ FORBIDDEN: Removing parameters to simplify API
export function encodeShare(share: Share, threshold: number): string {
  // Removed vaultId parameter because it caused bugs
}
```

---

## ✅ REQUIRED: Proper Bug Fixes

### 1. Identify Root Cause

```typescript
// ✅ GOOD: Analyze the actual problem
// Problem: XOR reconstruction needs plaintext lengths
// Root cause: Can't determine ciphertext boundaries without metadata
// Solution: Store plaintext lengths in blob header
```

### 2. Implement Complete Solution

```typescript
// ✅ GOOD: Add metadata to support full feature
export interface DuressVaultResult {
  readonly blob: Uint8Array;
  readonly salt: Uint8Array;
  readonly decoyLength: number;  // Store for reconstruction
  readonly hiddenLength: number; // Store for reconstruction
}

export function createDuressVault(params: DuressVaultParams): DuressVaultResult {
  // Full implementation with all features
  const decoyEncrypted = encrypt(params.content.decoy, '');
  const hiddenEncrypted = encrypt(params.content.hidden, derivedPass);
  
  // Store lengths for reconstruction
  return {
    blob: xorBlobs(decoyBlob, hiddenBlob),
    salt: decoyEncrypted.salt,
    decoyLength: params.content.decoy.length,
    hiddenLength: params.content.hidden.length
  };
}
```

### 3. Fix Tests to Match Implementation

```typescript
// ✅ GOOD: Update tests to use new API
it('should unlock hidden layer', () => {
  const result = createDuressVault({ decoy, hidden, passphrase });
  
  // Use complete result structure
  const unlocked = unlockDuressVault(
    result.blob,
    passphrase,
    result.decoyLength,
    result.hiddenLength
  );
  
  expect(unlocked).toEqual(hidden);
});
```

---

## 🔧 Bug Fixing Process

### Step 1: Document the Issue

```typescript
/**
 * BUG: XOR reconstruction fails because we can't determine plaintext sizes
 * 
 * Current approach:
 * - XOR decoyBlob with hiddenBlob
 * - To unlock, need to reconstruct one blob to XOR back
 * 
 * Problem:
 * - Ciphertext = plaintext + 16 bytes (auth tag)
 * - Without plaintext length, can't determine ciphertext boundaries
 * - Padding makes it impossible to guess
 * 
 * Solution options:
 * 1. Store plaintext lengths in blob header (4 bytes each)
 * 2. Use fixed-size plaintexts (wasteful)
 * 3. Use different architecture (steganography)
 * 
 * Chosen: Option 1 - store lengths in header
 */
```

### Step 2: Implement Fix

```typescript
// Add length fields to blob structure
const BLOB_SIZES = {
  header: 9,
  salt: 32,
  nonce: 24,
  commitment: 32,
  ciphertextLength: 4,
  decoyLength: 4,      // NEW
  hiddenLength: 4,     // NEW
  authTag: 16
};
```

### Step 3: Update All Affected Code

```typescript
// Update createDuressVault
export function createDuressVault(params: DuressVaultParams): DuressVaultResult {
  // ... encryption logic ...
  
  // Encode lengths in header
  const header = new Uint8Array(8);
  new DataView(header.buffer).setUint32(0, params.content.decoy.length, true);
  new DataView(header.buffer).setUint32(4, params.content.hidden.length, true);
  
  // Prepend header to XORed blob
  const blobWithHeader = new Uint8Array(header.length + combined.length);
  blobWithHeader.set(header, 0);
  blobWithHeader.set(combined, header.length);
  
  return { blob: blobWithHeader, salt };
}

// Update unlockDuressVault
export function unlockDuressVault(blob: Uint8Array, passphrase: string): Uint8Array {
  // Extract lengths from header
  const decoyLength = new DataView(blob.buffer).getUint32(0, true);
  const hiddenLength = new DataView(blob.buffer).getUint32(4, true);
  const xorBlob = blob.slice(8);
  
  // Now we can reconstruct properly
  if (passphrase === '') {
    const hiddenBlob = reconstructHiddenBlob(hiddenLength, salt);
    const decoyBlob = xorBlobs(xorBlob, hiddenBlob);
    return decrypt(decoyBlob, '');
  } else {
    const decoyBlob = reconstructDecoyBlob(decoyLength, salt);
    const hiddenBlob = xorBlobs(xorBlob, decoyBlob);
    return decrypt(hiddenBlob, derivedPass);
  }
}
```

### Step 4: Verify All Tests Pass

```bash
npm test
# All tests must pass, no skipped tests
```

---

## 🚫 Anti-Patterns

### ❌ "It's too hard, let's skip it"

```typescript
// ❌ FORBIDDEN
export function complexFeature() {
  throw new Error('Not implemented - too complex');
}
```

### ❌ "Let's make the test easier"

```typescript
// ❌ FORBIDDEN
it('should work', () => {
  // Changed test to only check simple case
  expect(simpleCase()).toBe(true);
  // Removed complex case that was failing
});
```

### ❌ "Let's remove the parameter"

```typescript
// ❌ FORBIDDEN
// Before: encodeShare(share, threshold, total, vaultId)
// After: encodeShare(share, threshold, total)
// Reason: vaultId caused bugs, so removed it
```

---

## ✅ Correct Approach

### 1. Understand the Requirement

- Why does this feature exist?
- What security property does it provide?
- What would we lose by removing it?

### 2. Identify the Real Problem

- What exactly is failing?
- What is the root cause?
- What assumptions were wrong?

### 3. Design Proper Solution

- How can we fix the root cause?
- What data do we need to store?
- What changes are needed across the codebase?

### 4. Implement Completely

- Fix the implementation
- Update all affected code
- Ensure all tests pass
- Add new tests if needed

---

## 📋 Checklist Before Committing

- [ ] All features fully implemented (no stubs, no "not implemented" errors)
- [ ] All tests passing (no skipped tests)
- [ ] No features removed to bypass bugs
- [ ] No simplified APIs that remove important parameters
- [ ] Root cause documented and fixed
- [ ] Security properties maintained
- [ ] Forward compatibility preserved

---

## 🎯 Enforcement

**Amazon Q will:**

1. **Reject** any PR that removes features to fix bugs
2. **Reject** any PR that skips tests instead of fixing them
3. **Reject** any PR that simplifies APIs by removing security-critical parameters
4. **Require** documentation of root cause for all bug fixes
5. **Require** complete implementation before marking as done

**Before accepting code:**
- Verify all features work as specified
- Verify all tests pass
- Verify no shortcuts were taken
- Verify security properties maintained
