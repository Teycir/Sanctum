// ============================================================================
// DEVICE-BASED ENCRYPTION UTILITY
// ============================================================================

import { sha256 } from '@noble/hashes/sha2';

const DEFAULT_PIN = 'sanctum_default'; // Default PIN for automatic encryption
let cachedKey: CryptoKey | null = null;
let cachedPin: string | null = null;
let cachedSalt: string | null = null; // RAM-only salt storage

/**
 * Derive device encryption key from user PIN (never stored)
 * @param pin User-supplied PIN (4-8 digits)
 * @returns Non-extractable CryptoKey
 */
async function getDeviceKey(pin: string): Promise<CryptoKey> {
  if (cachedKey && cachedPin === pin) {
    return cachedKey;
  }

  // Generate ephemeral salt (RAM-only, never persisted)
  if (!cachedSalt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    cachedSalt = btoa(String.fromCodePoint(...saltBytes));
  }
  const salt = cachedSalt;

  const saltBytes = Uint8Array.from(atob(salt), (c, i) => c.codePointAt(i) ?? 0);
  const pinBytes = new TextEncoder().encode(pin);
  const combined = new Uint8Array(saltBytes.length + pinBytes.length);
  combined.set(saltBytes, 0);
  combined.set(pinBytes, saltBytes.length);

  const keyMaterial = sha256(combined);
  // Create new Uint8Array with ArrayBuffer to satisfy TypeScript
  const keyBuffer = new Uint8Array(keyMaterial);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable
    ['encrypt', 'decrypt']
  );

  cachedKey = key;
  cachedPin = pin;
  return key;
}

/**
 * Clear cached key from memory
 */
export function clearDeviceKey(): void {
  cachedKey = null;
  cachedPin = null;
  cachedSalt = null; // Clear ephemeral salt
}

/**
 * Encrypt data with device key
 * @param data Data to encrypt
 * @param pin User PIN (optional, uses default if not provided)
 * @returns Encrypted data (IV + ciphertext)
 */
export async function encryptWithDeviceKey(data: string, pin: string = DEFAULT_PIN): Promise<string> {
  const key = await getDeviceKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCodePoint(...combined));
}

/**
 * Decrypt data with device key
 * @param encrypted Encrypted data (base64)
 * @param pin User PIN (optional, uses default if not provided)
 * @returns Decrypted data or null on error
 */
export async function decryptWithDeviceKey(encrypted: string, pin: string = DEFAULT_PIN): Promise<string | null> {
  try {
    const key = await getDeviceKey(pin);
    const combined = Uint8Array.from(atob(encrypted), (c, i) => c.codePointAt(i) ?? 0);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'OperationError') {
      return null; // Invalid/corrupted data
    }
    throw error;
  }
}
