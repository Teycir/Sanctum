// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

import { beforeEach, afterEach, vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

// Load .env.local for tests
config({ path: path.resolve(process.cwd(), '.env.local') });

// Set test environment variables
if (process.env.NEXT_PUBLIC_PINATA_JWT) {
  process.env.PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
}

if (process.env.NEXT_PUBLIC_FILEBASE_ACCESS_KEY && process.env.NEXT_PUBLIC_FILEBASE_SECRET_KEY) {
  process.env.FILEBASE_ACCESS_KEY = process.env.NEXT_PUBLIC_FILEBASE_ACCESS_KEY;
  process.env.FILEBASE_SECRET_KEY = process.env.NEXT_PUBLIC_FILEBASE_SECRET_KEY;
  process.env.FILEBASE_BUCKET = process.env.NEXT_PUBLIC_FILEBASE_BUCKET || 'sanctum-vaults';
}

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
  const { webcrypto } = await import('node:crypto');
  globalThis.crypto = webcrypto as Crypto;
}
