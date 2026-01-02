# Testing Infrastructure

State-of-the-art testing setup for Sanctum using **Vitest** + **V8 Coverage** + **Happy-DOM**.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage

# Coverage with UI
npm run test:coverage:ui
```

## 📦 Tech Stack

- **[Vitest](https://vitest.dev/)** - Fast, ESM-native test runner (Vite-powered)
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage)** - Native V8 coverage (fast, accurate)
- **[@vitest/ui](https://vitest.dev/guide/ui)** - Interactive test UI
- **[happy-dom](https://github.com/capricorn86/happy-dom)** - Lightweight DOM for browser APIs

## 📁 Structure

```
__tests__/
├── setup.ts              # Global test setup
├── utils.ts              # Test utilities & fixtures
├── crypto/               # Crypto module tests
│   ├── core.test.ts
│   └── constants.test.ts
├── duress/               # Duress layer tests
│   └── layers.test.ts
├── recovery/             # Recovery module tests
│   └── shamir.test.ts
└── url/                  # URL state tests
    └── state.test.ts
```

## ✅ Coverage Thresholds

Enforced minimums (configured in `vitest.config.ts`):

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## 🧪 Test Utilities

### Fixtures (`__tests__/utils.ts`)

```typescript
import { TEST_DATA } from '__tests__/utils';

TEST_DATA.plaintext      // Standard test data
TEST_DATA.passphrase     // Test passphrase
TEST_DATA.decoyContent   // Decoy layer content
TEST_DATA.hiddenContent  // Hidden layer content
```

### Assertions

```typescript
import { expectUint8Array, expectValidCommitment } from '__tests__/utils';

expectUint8Array(value);           // Assert Uint8Array type
expectValidCommitment(commitment); // Assert 32-byte SHA-256
expectValidNonce(nonce);           // Assert 24-byte XChaCha20
expectWiped(buffer);               // Assert all zeros
```

### Timing Helpers

```typescript
import { measureTime, expectConstantTime } from '__tests__/utils';

const time = await measureTime(async () => {
  await cryptoOperation();
});

expectConstantTime([time1, time2, time3], 0.1); // 10% tolerance
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/module';
import { TEST_DATA } from '../utils';

describe('module', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction(TEST_DATA.plaintext);
      expect(result).toBeDefined();
    });

    it('should throw on invalid input', () => {
      expect(() => myFunction(new Uint8Array(0)))
        .toThrow('Invalid input');
    });
  });
});
```

### Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Mocking

```typescript
import { vi } from 'vitest';

it('should call dependency', () => {
  const mockFn = vi.fn();
  myFunction(mockFn);
  expect(mockFn).toHaveBeenCalledWith('expected-arg');
});
```

## 🎯 Best Practices

### 1. Test Naming

```typescript
// ✅ GOOD: Descriptive, behavior-focused
it('should encrypt plaintext with XChaCha20-Poly1305', () => {});
it('should throw on invalid key length', () => {});

// ❌ BAD: Vague, implementation-focused
it('works', () => {});
it('test encryption', () => {});
```

### 2. Arrange-Act-Assert

```typescript
it('should derive consistent keys', () => {
  // Arrange
  const passphrase = 'test';
  const salt = new Uint8Array(32);

  // Act
  const keys1 = deriveKeys(passphrase, salt);
  const keys2 = deriveKeys(passphrase, salt);

  // Assert
  expect(keys1.encKey).toEqual(keys2.encKey);
});
```

### 3. Test One Thing

```typescript
// ✅ GOOD: Single assertion
it('should return 32-byte key', () => {
  const key = deriveKey('passphrase');
  expect(key.length).toBe(32);
});

// ❌ BAD: Multiple unrelated assertions
it('should work', () => {
  const key = deriveKey('passphrase');
  expect(key.length).toBe(32);
  expect(encrypt(data, key)).toBeDefined();
  expect(decrypt(encrypted, key)).toEqual(data);
});
```

### 4. Use Test Utilities

```typescript
// ✅ GOOD: Reusable utilities
import { TEST_DATA, expectValidCommitment } from '../utils';

it('should generate valid commitment', () => {
  const commitment = generateCommitment(TEST_DATA.plaintext);
  expectValidCommitment(commitment);
});

// ❌ BAD: Duplicate assertions
it('should generate valid commitment', () => {
  const commitment = generateCommitment(new TextEncoder().encode('test'));
  expect(commitment).toBeInstanceOf(Uint8Array);
  expect(commitment.length).toBe(32);
});
```

## 🔍 Coverage Reports

### View Coverage

```bash
# Generate HTML report
npm run test:coverage

# Open in browser
open coverage/index.html
```

### Coverage Output

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
lib/crypto/core.ts    |   95.2  |   88.9   |  100.0  |   95.2
lib/crypto/kdf.ts     |  100.0  |  100.0   |  100.0  |  100.0
lib/duress/layers.ts  |   92.3  |   85.7   |  100.0  |   92.3
```

## 🐛 Debugging Tests

### Run Single Test File

```bash
npm test -- __tests__/crypto/core.test.ts
```

### Run Single Test

```bash
npm test -- -t "should encrypt plaintext"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## 🚨 CI/CD Integration

### GitHub Actions

```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Thresholds](https://vitest.dev/config/#coverage-thresholds)

## 🎯 Checklist for New Modules

Before marking a module complete:

- [ ] Unit tests for all public functions
- [ ] Edge case tests (empty input, max size, etc.)
- [ ] Error condition tests (invalid params, etc.)
- [ ] Async operation tests (if applicable)
- [ ] Timing attack tests (for crypto operations)
- [ ] Memory safety tests (wipe after use)
- [ ] Coverage > 80% for all metrics
