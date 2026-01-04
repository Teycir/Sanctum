// ============================================================================
// FILEBASE CREDENTIALS ENCRYPTION
// ============================================================================

import { encryptWithDeviceKey, decryptWithDeviceKey } from './device-encryption';

const STORAGE_KEY = 'sanctum_filebase_encrypted';

interface FilebaseCredentials {
  accessKey: string;
  secretKey: string;
}

export async function saveFilebaseCredentials(credentials: FilebaseCredentials): Promise<void> {
  const encrypted = await encryptWithDeviceKey(JSON.stringify(credentials));
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export async function loadFilebaseCredentials(): Promise<FilebaseCredentials | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  const decrypted = await decryptWithDeviceKey(stored);
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null; // Invalid JSON
    }
    throw error;
  }
}

export function clearFilebaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}