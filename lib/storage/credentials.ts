// ============================================================================
// ENCRYPTED CREDENTIAL STORAGE
// ============================================================================

import { encrypt, decrypt } from '../crypto/core';
import { ARGON2_PROFILES } from '../crypto/constants';

const STORAGE_KEY = 'sanctum_credentials';

export interface StoredCredentials {
  pinataJWT: string;
}

/**
 * Save credentials encrypted in localStorage
 */
export async function saveCredentials(
  credentials: StoredCredentials,
  masterPassword: string
): Promise<void> {
  const json = JSON.stringify(credentials);
  const plaintext = new TextEncoder().encode(json);
  
  const encrypted = encrypt({
    plaintext,
    passphrase: masterPassword,
    argonProfile: ARGON2_PROFILES.desktop
  });

  const blob = new Uint8Array([
    ...encrypted.salt,
    ...encrypted.nonce,
    ...encrypted.ciphertext
  ]);

  localStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...blob)));
}

/**
 * Load credentials from encrypted localStorage
 */
export async function loadCredentials(
  masterPassword: string
): Promise<StoredCredentials | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const blob = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    
    const plaintext = decrypt({
      blob,
      passphrase: masterPassword
    });

    const json = new TextDecoder().decode(plaintext);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Clear stored credentials
 */
export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}
