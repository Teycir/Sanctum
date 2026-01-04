// ============================================================================
// SPLIT-KEY ENCRYPTION (TimeSeal Pattern)
// ============================================================================

import { sha256 } from '@noble/hashes/sha2';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { base64UrlEncode, base64UrlDecode } from './utils';

export interface SplitKeyResult {
  readonly keyA: Uint8Array; // Given to user (in URL)
  readonly keyB: Uint8Array; // Stored encrypted in DB
  readonly masterKey: Uint8Array; // Derived from KeyA + KeyB
}

export interface EncryptedKeyB {
  readonly encrypted: Uint8Array;
  readonly iv: Uint8Array;
}

/**
 * Generate two random 32-byte keys and derive master key
 * @returns Split keys and master key
 */
export async function generateSplitKeys(): Promise<SplitKeyResult> {
  const keyA = randomBytes(32);
  const keyB = randomBytes(32);
  const masterKey = await deriveMasterKey(keyA, keyB);
  return { keyA, keyB, masterKey };
}

/**
 * Derive master key from KeyA + KeyB using HKDF-like approach
 * @param keyA Key from URL
 * @param keyB Key from database
 * @returns Master encryption key
 */
export async function deriveMasterKey(
  keyA: Uint8Array,
  keyB: Uint8Array
): Promise<Uint8Array> {
  if (keyA.length !== 32 || keyB.length !== 32) {
    throw new Error('Both keys must be 32 bytes');
  }

  const combined = new Uint8Array(64);
  combined.set(keyA, 0);
  combined.set(keyB, 32);

  return sha256(combined);
}

/**
 * Encrypt KeyB for database storage using HKDF-derived key
 * 
 * SECURITY: Follows TimeSeal pattern - KeyB encrypted with key derived from
 * vaultId + server secret. Attacker needs: database access + server secret + KeyA from URL.
 * 
 * @param keyB KeyB to encrypt
 * @param vaultId Unique vault identifier
 * @param serverSecret Server-side secret from environment
 * @returns Encrypted KeyB with IV
 */
export function encryptKeyB(
  keyB: Uint8Array,
  vaultId: string,
  serverSecret: string
): EncryptedKeyB {
  const combined = new TextEncoder().encode(serverSecret + vaultId);
  const encryptionKey = sha256(combined);
  const iv = randomBytes(24);
  
  const cipher = xchacha20poly1305(encryptionKey, iv);
  const encrypted = cipher.encrypt(keyB);

  return { encrypted, iv };
}

/**
 * Decrypt KeyB from database storage
 * @param encrypted Encrypted KeyB
 * @param iv IV used for encryption
 * @param vaultId Unique vault identifier
 * @param serverSecret Server-side secret from environment
 * @returns Decrypted KeyB
 */
export function decryptKeyB(
  encrypted: Uint8Array,
  iv: Uint8Array,
  vaultId: string,
  serverSecret: string
): Uint8Array {
  const combined = new TextEncoder().encode(serverSecret + vaultId);
  const encryptionKey = sha256(combined);
  const cipher = xchacha20poly1305(encryptionKey, iv);
  
  return cipher.decrypt(encrypted);
}

/**
 * Serialize encrypted KeyB for storage
 */
export function serializeKeyB(encryptedKeyB: EncryptedKeyB): string {
  const combined = new Uint8Array(encryptedKeyB.iv.length + encryptedKeyB.encrypted.length);
  combined.set(encryptedKeyB.iv, 0);
  combined.set(encryptedKeyB.encrypted, encryptedKeyB.iv.length);
  return base64UrlEncode(combined);
}

/**
 * Deserialize encrypted KeyB from storage
 */
export function deserializeKeyB(serialized: string): EncryptedKeyB {
  const combined = base64UrlDecode(serialized);
  const iv = combined.slice(0, 24);
  const encrypted = combined.slice(24);
  return { iv, encrypted };
}
