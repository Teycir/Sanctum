// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { BLOB_SIZES } from './constants';
import { randomBytes } from './utils';
import { sha256 } from '@noble/hashes/sha2';

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
 * Assemble complete vault blob with padding and vault ID for integrity verification
 * @param result Encryption result
 * @param targetSize Target size for padding
 * @param vaultId Vault identifier for integrity check
 * @returns Complete vault blob with embedded vault ID
 * @throws Error if content too large for target size
 */
export function assembleBlob(result: EncryptionResult, targetSize: number, vaultId?: string): Uint8Array {
  // Calculate vault ID hash (16 bytes) - first 16 bytes of SHA256
  const vaultIdHash = vaultId 
    ? sha256(new TextEncoder().encode(vaultId)).slice(0, 16)
    : new Uint8Array(16); // Zero-filled for legacy vaults
  
  const fixedSize = BLOB_SIZES.header + BLOB_SIZES.salt + BLOB_SIZES.nonce + BLOB_SIZES.commitment + 4 + 16 + result.ciphertext.length;
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
  
  // Store vault ID hash (16 bytes)
  blob.set(vaultIdHash, offset);
  offset += 16;
  
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

/**
 * Verify vault blob integrity by checking embedded vault ID
 * @param blob Vault blob to verify
 * @param vaultId Expected vault identifier
 * @returns True if vault ID matches, false otherwise
 */
export function verifyBlobIntegrity(blob: Uint8Array, vaultId: string): boolean {
  const offset = BLOB_SIZES.header + BLOB_SIZES.salt + BLOB_SIZES.nonce + BLOB_SIZES.commitment;
  
  if (blob.length < offset + 16) {
    return false; // Blob too small, likely legacy format
  }
  
  const embeddedHash = blob.slice(offset, offset + 16);
  const expectedHash = sha256(new TextEncoder().encode(vaultId)).slice(0, 16);
  
  // Constant-time comparison
  let match = 0;
  for (let i = 0; i < 16; i++) {
    match |= embeddedHash[i] ^ expectedHash[i];
  }
  
  return match === 0;
}
