// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { sha256 } from '@noble/hashes/sha256';
import { constantTimeEqual } from './utils';

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Generate commitment for vault
 * @param comKey Commitment key
 * @param header Vault header
 * @param ciphertext Encrypted data
 * @returns Commitment hash
 */
export function generateCommitment(
  comKey: Uint8Array,
  header: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const input = new Uint8Array(comKey.length + header.length + ciphertext.length);
  input.set(comKey, 0);
  input.set(header, comKey.length);
  input.set(ciphertext, comKey.length + header.length);
  return sha256(input);
}

/**
 * Verify commitment matches expected value
 * @param stored Stored commitment
 * @param computed Computed commitment
 * @returns True if commitments match
 */
export function verifyCommitment(stored: Uint8Array, computed: Uint8Array): boolean {
  return constantTimeEqual(stored, computed);
}
