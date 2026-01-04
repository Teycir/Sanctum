// ============================================================================
// AUTOMATIC JWT ENCRYPTION
// ============================================================================

import { encryptWithDeviceKey, decryptWithDeviceKey } from './device-encryption';

const STORAGE_KEY = 'sanctum_jwt_encrypted';

export async function saveJWT(jwt: string): Promise<void> {
  const encrypted = await encryptWithDeviceKey(jwt);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export async function loadJWT(): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  return decryptWithDeviceKey(stored);
}

export function clearJWT(): void {
  localStorage.removeItem(STORAGE_KEY);
}
