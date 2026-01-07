// ============================================================================
// RAM-ONLY JWT STORAGE (NO DISK PERSISTENCE)
// ============================================================================

import { encryptWithDeviceKey, decryptWithDeviceKey } from './device-encryption';

// RAM-only storage - cleared on tab close
let jwtCache: string | null = null;

export async function saveJWT(jwt: string): Promise<void> {
  jwtCache = await encryptWithDeviceKey(jwt);
}

export async function loadJWT(): Promise<string | null> {
  if (!jwtCache) return null;
  return decryptWithDeviceKey(jwtCache);
}

export function clearJWT(): void {
  jwtCache = null;
}
