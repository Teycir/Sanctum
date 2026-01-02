// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { BLOB_SIZES } from './constants';
import { randomBytes } from './utils';

export interface EncryptionResult {
  readonly ciphertext: Uint8Array;
  readonly salt: Uint8Array;
  readonly nonce: Uint8Array;
  readonly commitment: Uint8Array;
  readonly header: Uint8Array;
  readonly ciphertextLength: number; // Store length for decryption
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Assemble complete vault blob with padding
 * @param result Encryption result
 * @param targetSize Target size for padding
 * @returns Complete vault blob
 * @throws Error if content too large for target size
 */
export function assembleBlob(result: EncryptionResult, targetSize: number): Uint8Array {
  const fixedSize = BLOB_SIZES.header + BLOB_SIZES.salt + BLOB_SIZES.nonce + BLOB_SIZES.commitment + 4 + result.ciphertext.length;
  const paddingSize = targetSize - fixedSize;
  
  if (paddingSize < 0) {
    throw new Error('Content too large for target size');
  }
  
  const blob = new Uint8Array(targetSize);
  let offset = 0;
  
  blob.set(result.header, offset);
  offset += BLOB_SIZES.header;
  
  blob.set(result.salt, offset);
  offset += BLOB_SIZES.salt;
  
  blob.set(result.nonce, offset);
  offset += BLOB_SIZES.nonce;
  
  blob.set(result.commitment, offset);
  offset += BLOB_SIZES.commitment;
  
  // Store ciphertext length (4 bytes, little-endian)
  const lengthBytes = new Uint8Array(4);
  new DataView(lengthBytes.buffer).setUint32(0, result.ciphertext.length, true);
  blob.set(lengthBytes, offset);
  offset += 4;
  
  blob.set(result.ciphertext, offset);
  offset += result.ciphertext.length;
  
  if (paddingSize > 0) {
    const padding = randomBytes(paddingSize);
    blob.set(padding, offset);
  }
  
  return blob;
}
