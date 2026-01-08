import type { Argon2Profile } from '../lib/crypto/constants';

// ============================================================================
// TEST-ONLY CONSTANTS
// ============================================================================

// Ultra-fast profile for testing only - NEVER use in production
export const TEST_ARGON2_PROFILE: Argon2Profile = {
  m: 1024, // 1 MB
  t: 1, // 1 iteration
  p: 1, // 1 thread
  dkLen: 32
} as const;