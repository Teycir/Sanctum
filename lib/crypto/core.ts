// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';
import { VAULT_VERSION, BLOB_SIZES, type Argon2Profile } from './constants';
import { randomBytes, encodeArgonParams, decodeArgonParams, wipeMemory } from './utils';
import { deriveKeys } from './kdf';
import { generateCommitment, verifyCommitment } from './commitment';
import { type EncryptionResult } from './padding';

export type { EncryptionResult } from './padding';

export interface EncryptionParams {
  readonly plaintext: Uint8Array;
  readonly passphrase: string;
  readonly argonProfile: Argon2Profile;
}

export interface DecryptionParams {
  readonly blob: Uint8Array;
  readonly passphrase: string;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

export { deriveKeys };
export { assembleBlob } from './padding';

/**
 * Generate synthetic nonce for nonce-misuse resistance
 * @param key Encryption key
 * @param plaintext Plaintext data
 * @returns 24-byte nonce
 */
export function generateSyntheticNonce(key: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const random = randomBytes(16);
  const hashInput = new Uint8Array(16 + Math.min(64, plaintext.length) + 16);
  hashInput.set(key.slice(0, 16), 0);
  hashInput.set(plaintext.slice(0, Math.min(64, plaintext.length)), 16);
  hashInput.set(random, 16 + Math.min(64, plaintext.length));

  const deterministic = sha256(hashInput).slice(0, 8);
  const nonce = new Uint8Array(24);
  nonce.set(random, 0);
  nonce.set(deterministic, 16);

  return nonce;
}

/**
 * Encrypt plaintext with passphrase
 * @param params Encryption parameters
 * @param providedNonce Optional nonce (for XOR reconstruction)
 * @param providedSalt Optional salt (for XOR reconstruction)
 * @returns Encryption result
 * @throws Error if encryption fails
 */
export function encrypt(
  params: EncryptionParams,
  providedNonce?: Uint8Array,
  providedSalt?: Uint8Array
): EncryptionResult {
  const salt = providedSalt || randomBytes(BLOB_SIZES.salt);
  const { encKey, comKey } = deriveKeys(params.passphrase, salt, params.argonProfile);

  const header = new Uint8Array(BLOB_SIZES.header);
  header[0] = VAULT_VERSION;
  const argonParams = encodeArgonParams(params.argonProfile);
  header.set(argonParams, 1);

  const nonce = providedNonce || generateSyntheticNonce(encKey, params.plaintext);
  const cipher = xchacha20poly1305(encKey, nonce, header);
  const ciphertext = cipher.encrypt(params.plaintext);

  const commitment = generateCommitment(comKey, header, ciphertext);

  wipeMemory(encKey);
  wipeMemory(comKey);

  return { ciphertext, salt, nonce, commitment, header, ciphertextLength: ciphertext.length };
}

/**
 * Decrypt ciphertext with passphrase
 * @param params Decryption parameters
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or authentication fails
 */
export function decrypt(params: DecryptionParams): Uint8Array {
  let offset = 0;

  const header = params.blob.slice(offset, offset + BLOB_SIZES.header);
  offset += BLOB_SIZES.header;

  if (header[0] !== VAULT_VERSION) {
    throw new Error('Unsupported vault version');
  }

  const argonParams = decodeArgonParams(header.slice(1));

  const salt = params.blob.slice(offset, offset + BLOB_SIZES.salt);
  offset += BLOB_SIZES.salt;

  const nonce = params.blob.slice(offset, offset + BLOB_SIZES.nonce);
  offset += BLOB_SIZES.nonce;

  const storedCommitment = params.blob.slice(offset, offset + BLOB_SIZES.commitment);
  offset += BLOB_SIZES.commitment;

  // Read ciphertext length (4 bytes, little-endian)
  const lengthBytes = params.blob.slice(offset, offset + 4);
  const ciphertextLength = new DataView(lengthBytes.buffer, lengthBytes.byteOffset).getUint32(0, true);
  offset += 4;

  const ciphertext = params.blob.slice(offset, offset + ciphertextLength);

  const { encKey, comKey } = deriveKeys(params.passphrase, salt, argonParams);

  const computedCommitment = generateCommitment(comKey, header, ciphertext);

  if (!verifyCommitment(storedCommitment, computedCommitment)) {
    wipeMemory(encKey);
    wipeMemory(comKey);
    throw new Error('Commitment verification failed');
  }

  const cipher = xchacha20poly1305(encKey, nonce, header);
  const plaintext = cipher.decrypt(ciphertext);

  wipeMemory(encKey);
  wipeMemory(comKey);

  return plaintext;
}


