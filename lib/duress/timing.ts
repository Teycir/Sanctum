// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { deriveKeys } from '../crypto/kdf';
import type { Argon2Profile } from '../crypto/constants';

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Perform dummy key derivation to maintain constant time
 * @param salt Salt for derivation
 * @param profile Argon2 profile
 */
export function dummyDerivation(salt: Uint8Array, profile: Argon2Profile): void {
  deriveKeys('dummy-passphrase-for-timing', salt, profile);
}

/**
 * Constant-time conditional execution
 * @param condition Condition to check
 * @param trueFn Function to execute if true
 * @param falseFn Function to execute if false
 */
export function constantTimeSelect<T>(
  condition: boolean,
  trueFn: () => T,
  falseFn: () => T
): T {
  const trueResult = trueFn();
  const falseResult = falseFn();
  return condition ? trueResult : falseResult;
}
