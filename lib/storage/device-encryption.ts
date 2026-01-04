// ============================================================================
// DEVICE-BASED ENCRYPTION UTILITY
// ============================================================================

const DEVICE_KEY_NAME = 'sanctum_device_key';

/**
 * Get or create device encryption key
 * @returns Device encryption key
 */
async function getDeviceKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(DEVICE_KEY_NAME);
  
  if (stored) {
    const keyData = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  const keyData = new Uint8Array(exported);
  localStorage.setItem(DEVICE_KEY_NAME, btoa(String.fromCharCode(...keyData)));
  
  return key;
}

/**
 * Encrypt data with device key
 * @param data Data to encrypt
 * @returns Encrypted data (IV + ciphertext)
 */
export async function encryptWithDeviceKey(data: string): Promise<string> {
  const key = await getDeviceKey();
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
 * @returns Decrypted data or null on error
 */
export async function decryptWithDeviceKey(encrypted: string): Promise<string | null> {
  try {
    const key = await getDeviceKey();
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
