// ============================================================================
// DEVICE-BASED ENCRYPTION UTILITY
// ============================================================================

import { sha256 } from '@noble/hashes/sha2';

const DEVICE_KEY_SALT = 'sanctum_device_salt';
let cachedKey: CryptoKey | null = null;
let cachedPin: string | null = null;

/**
 * Derive device encryption key from user PIN (never stored)
 * @param pin User-supplied PIN (4-8 digits)
 * @returns Non-extractable CryptoKey
 */
async function getDeviceKey(pin: string): Promise<CryptoKey> {
  if (cachedKey && cachedPin === pin) {
    return cachedKey;
  }

  let salt = localStorage.getItem(DEVICE_KEY_SALT);
  if (!salt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...saltBytes));
    localStorage.setItem(DEVICE_KEY_SALT, salt);
  }

  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const pinBytes = new TextEncoder().encode(pin);
  const combined = new Uint8Array(saltBytes.length + pinBytes.length);
  combined.set(saltBytes, 0);
  combined.set(pinBytes, saltBytes.length);

  const keyMaterial = sha256(combined);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
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
}

/**
 * Encrypt data with device key
 * @param data Data to encrypt
 * @param pin User PIN
 * @returns Encrypted data (IV + ciphertext)
 */
export async function encryptWithDeviceKey(data: string, pin: string): Promise<string> {
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
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data with device key
 * @param encrypted Encrypted data (base64)
 * @param pin User PIN
 * @returns Decrypted data or null on error
 */
export async function decryptWithDeviceKey(encrypted: string, pin: string): Promise<string | null> {
  try {
    const key = await getDeviceKey(pin);
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
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
