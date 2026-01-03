// ============================================================================
// SPLIT-KEY ENCRYPTION (TimeSeal Pattern)
// ============================================================================

import { sha256 } from '@noble/hashes/sha2';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { base64UrlEncode, base64UrlDecode } from './utils';

export interface SplitKeyResult {
  readonly keyA: Uint8Array; // Stored on server (encrypted)
  readonly keyB: Uint8Array; // Embedded in URL hash
  readonly masterKey: Uint8Array; // Combined key for encryption
}

export interface EncryptedKeyA {
  readonly encrypted: Uint8Array;
  readonly nonce: Uint8Array;
}

/**
 * Generate two random 32-byte keys and derive master key
 * @returns Split keys and master key
 */
export async function generateSplitKeys(): Promise<SplitKeyResult> {
  // Generate two random 32-byte keys
  const keyA = randomBytes(32);
  const keyB = randomBytes(32);

  // Derive master key using HKDF-like approach
  const masterKey = await deriveMasterKey(keyA, keyB);

  return { keyA, keyB, masterKey };
}

/**
 * Derive master key from Key A + Key B using SHA-256
 * @param keyA Key from server
 * @param keyB Key from URL
 * @returns Master encryption key
 */
export async function deriveMasterKey(
  keyA: Uint8Array,
  keyB: Uint8Array
): Promise<Uint8Array> {
  if (keyA.length !== 32 || keyB.length !== 32) {
    throw new Error('Both keys must be 32 bytes');
  }

  // Concatenate keys
  const combined = new Uint8Array(64);
  combined.set(keyA, 0);
  combined.set(keyB, 32);

  // Hash to derive master key
  return sha256(combined);
}

/**
 * Encrypt Key A for server storage using vault ID as encryption key
 * @param keyA Key A to encrypt
 * @param vaultId Unique vault identifier
 * @returns Encrypted Key A with nonce
 */
export function encryptKeyA(keyA: Uint8Array, vaultId: string): EncryptedKeyA {
  // Derive encryption key from vault ID
  const idKey = sha256(new TextEncoder().encode(vaultId));
  const nonce = randomBytes(24);
  
  const cipher = xchacha20poly1305(idKey, nonce);
  const encrypted = cipher.encrypt(keyA);

  return { encrypted, nonce };
}

/**
 * Decrypt Key A from server storage
 * @param encrypted Encrypted Key A
 * @param nonce Nonce used for encryption
 * @param vaultId Unique vault identifier
 * @returns Decrypted Key A
 */
export function decryptKeyA(
  encrypted: Uint8Array,
  nonce: Uint8Array,
  vaultId: string
): Uint8Array {
  const idKey = sha256(new TextEncoder().encode(vaultId));
  const cipher = xchacha20poly1305(idKey, nonce);
  
  return cipher.decrypt(encrypted);
}

/**
 * Serialize encrypted Key A for storage
 */
export function serializeKeyA(encryptedKeyA: EncryptedKeyA): string {
  const combined = new Uint8Array(encryptedKeyA.nonce.length + encryptedKeyA.encrypted.length);
  combined.set(encryptedKeyA.nonce, 0);
  combined.set(encryptedKeyA.encrypted, encryptedKeyA.nonce.length);
  return base64UrlEncode(combined);
}

/**
 * Deserialize encrypted Key A from storage
 */
export function deserializeKeyA(serialized: string): EncryptedKeyA {
  const combined = base64UrlDecode(serialized);
  const nonce = combined.slice(0, 24);
  const encrypted = combined.slice(24);
  return { nonce, encrypted };
}
