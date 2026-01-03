// ============================================================================
// AUTOMATIC JWT ENCRYPTION
// ============================================================================

const STORAGE_KEY = 'sanctum_jwt_encrypted';
const DEVICE_KEY_NAME = 'sanctum_device_key';

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

export async function saveJWT(jwt: string): Promise<void> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(jwt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  localStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...combined)));
}

export async function loadJWT(): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const key = await getDeviceKey();
    const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function clearJWT(): void {
  localStorage.removeItem(STORAGE_KEY);
}
