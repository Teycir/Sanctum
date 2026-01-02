// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

import { beforeEach, afterEach } from 'vitest';

// ============================================================================
// CLEANUP
// ============================================================================

beforeEach(() => {
  // Clear any timers
  vi.clearAllTimers();
});

afterEach(() => {
  // Restore all mocks
  vi.restoreAllMocks();
});

// ============================================================================
// CRYPTO POLYFILLS (if needed)
// ============================================================================

if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto as Crypto;
}
