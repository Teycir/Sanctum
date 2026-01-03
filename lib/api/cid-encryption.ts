// ============================================================================
// CID ENCRYPTION - Prevent Pinata Direct Access
// ============================================================================

import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha2';
import { base64UrlEncode, base64UrlDecode } from '../crypto/utils';

export function generateCIDKey(): Uint8Array {
  return randomBytes(32);
}

export function encryptCID(cid: string, key: Uint8Array): string {
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(key, nonce);
  const encrypted = cipher.encrypt(new TextEncoder().encode(cid));
  
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce, 0);
  combined.set(encrypted, nonce.length);
  
  return base64UrlEncode(combined);
}

export function decryptCID(encryptedCID: string, key: Uint8Array): string {
  const combined = base64UrlDecode(encryptedCID);
  const nonce = combined.slice(0, 24);
  const encrypted = combined.slice(24);
  
  const cipher = xchacha20poly1305(key, nonce);
  const decrypted = cipher.decrypt(encrypted);
  
  return new TextDecoder().decode(decrypted);
}

export function deriveCIDKeyFromVaultId(vaultId: string): Uint8Array {
  return sha256(new TextEncoder().encode(`cid-key:${vaultId}`));
}
