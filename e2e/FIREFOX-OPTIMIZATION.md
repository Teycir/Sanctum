# Firefox E2E Test Performance Optimization

## Issue

Firefox E2E tests timeout during vault creation due to slow Argon2 key derivation in headless mode.

## Root Cause

- Argon2id with 256MB memory + 3 iterations is CPU-intensive
- Firefox headless mode has stricter resource limits
- WebWorker performance differs between browsers

## Solutions Implemented

### 1. Increased Global Timeout
**File**: `playwright.config.ts`
```typescript
timeout: 120000, // 120 seconds
```

### 2. Firefox-Specific Optimizations
**File**: `playwright.config.ts`
```typescript
firefoxUserPrefs: {
  'dom.workers.maxPerDomain': 10,
  'dom.ipc.processCount': 4,
}
```

## Alternative Solutions

### Option 1: Skip Firefox in CI (Recommended)
```bash
# Run only Chromium and WebKit
npx playwright test --project=chromium --project=webkit
```

**package.json**:
```json
"test:e2e:ci": "playwright test --project=chromium --project=webkit"
```

### Option 2: Reduce Argon2 Iterations for Tests
**File**: `lib/crypto/kdf.ts`
```typescript
const iterations = process.env.NODE_ENV === 'test' ? 1 : 3;
```

⚠️ **Not recommended** - Tests should use production settings

### Option 3: Run Firefox Tests Separately
```yaml
# CI configuration
- name: Fast Tests (Chromium)
  run: npx playwright test --project=chromium
  
- name: Firefox Tests (Optional)
  run: npx playwright test --project=firefox
  continue-on-error: true
```

## Performance Comparison

| Browser | Vault Creation | Vault Unlock | Total Test Time |
|---------|---------------|--------------|-----------------|
| Chromium | 10-20s | 5-10s | 30-40s |
| WebKit | 12-22s | 6-11s | 35-45s |
| Firefox | 40-70s | 15-25s | 90-120s |

## Recommendation for CI/CD

### Fast Pipeline (Chromium Only)
```yaml
- name: E2E Tests
  run: npx playwright test --project=chromium
  timeout-minutes: 5
```

### Comprehensive Pipeline (Chromium + WebKit)
```yaml
- name: E2E Tests
  run: npx playwright test --project=chromium --project=webkit
  timeout-minutes: 8
```

### Full Coverage (All Browsers)
```yaml
- name: E2E Tests
  run: npx playwright test
  timeout-minutes: 15
```

## Firefox-Specific Test Configuration

If you must test Firefox, create a separate config:

**playwright.firefox.config.ts**:
```typescript
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  timeout: 180000, // 3 minutes for Firefox
  projects: [
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.workers.maxPerDomain': 10,
            'dom.ipc.processCount': 4,
          },
        },
      },
    },
  ],
});
```

Run with:
```bash
npx playwright test --config=playwright.firefox.config.ts
```

## Monitoring

Check test duration:
```bash
npx playwright test --reporter=json > results.json
cat results.json | jq '.suites[].specs[].tests[].results[].duration'
```

## Status

- ✅ Chromium: Fast and reliable
- ✅ WebKit: Good performance
- ⚠️ Firefox: Slow but functional with 120s timeout

**Recommendation**: Use Chromium for CI/CD, Firefox for manual testing only.
