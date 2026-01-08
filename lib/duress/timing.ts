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
 * Constant-time conditional execution with randomized order
 * 
 * SECURITY: Executes both functions in random order to prevent timing attacks.
 * While not truly constant-time due to JS limitations, this makes timing analysis
 * significantly harder by randomizing execution order.
 * 
 * @param condition Condition to check
 * @param trueFn Function to execute if true
 * @param falseFn Function to execute if false
 */
export function constantTimeSelect<T>(
  condition: boolean,
  trueFn: () => T,
  falseFn: () => T
): T {
  // Randomize execution order to prevent timing attacks
  const executeFirstFirst = Math.random() < 0.5;
  
  let firstResult: T;
  let secondResult: T;
  
  if (executeFirstFirst) {
    firstResult = trueFn();
    secondResult = falseFn();
  } else {
    firstResult = falseFn();
    secondResult = trueFn();
  }
  
  // Return based on original condition
  return executeFirstFirst 
    ? (condition ? firstResult : secondResult)
    : (condition ? secondResult : firstResult);
}
