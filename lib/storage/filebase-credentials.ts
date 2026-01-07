// ============================================================================
// RAM-ONLY FILEBASE CREDENTIALS (NO DISK PERSISTENCE)
// ============================================================================

import { encryptWithDeviceKey, decryptWithDeviceKey } from './device-encryption';

interface FilebaseCredentials {
  accessKey: string;
  secretKey: string;
}

// RAM-only storage - cleared on tab close
let credentialsCache: string | null = null;

export async function saveFilebaseCredentials(credentials: FilebaseCredentials): Promise<void> {
  credentialsCache = await encryptWithDeviceKey(JSON.stringify(credentials));
}

export async function loadFilebaseCredentials(): Promise<FilebaseCredentials | null> {
  if (!credentialsCache) return null;
  
  const decrypted = await decryptWithDeviceKey(credentialsCache);
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

export function clearFilebaseCredentials(): void {
  credentialsCache = null;
}