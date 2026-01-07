// ============================================================================
// RAM-ONLY CREDENTIAL STORAGE (NO DISK PERSISTENCE)
// ============================================================================

import { encrypt, decrypt } from '../crypto/core';
import { ARGON2_PROFILES } from '../crypto/constants';

export interface StoredCredentials {
  pinataJWT: string;
}

// RAM-only storage - cleared on tab close
let credentialsCache: string | null = null;

/**
 * Save credentials encrypted in RAM only
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

  credentialsCache = btoa(String.fromCodePoint(...blob));
}

/**
 * Load credentials from RAM
 */
export async function loadCredentials(
  masterPassword: string
): Promise<StoredCredentials | null> {
  if (!credentialsCache) return null;

  try {
    const blob = Uint8Array.from(atob(credentialsCache), (c, i) => c.codePointAt(i) ?? 0);
    
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
 * Clear stored credentials from RAM
 */
export function clearCredentials(): void {
  credentialsCache = null;
}
