// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { argon2id } from '@noble/hashes/argon2';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { HKDF_CONTEXTS, type Argon2Profile } from './constants';
import { wipeMemory, encodeText } from './utils';

export interface DerivedKeys {
  readonly encKey: Uint8Array;
  readonly comKey: Uint8Array;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Derive encryption and commitment keys from passphrase
 * @param passphrase User passphrase
 * @param salt Random salt
 * @param profile Argon2 profile
 * @returns Encryption and commitment keys
 * @throws Error if key derivation fails
 */
export function deriveKeys(
  passphrase: string,
  salt: Uint8Array,
  profile: Argon2Profile
): DerivedKeys {
  const masterKey = argon2id(passphrase, salt, {
    m: profile.m,
    t: profile.t,
    p: profile.p,
    dkLen: profile.dkLen
  });

  const encKey = hkdf(sha256, masterKey, salt, encodeText(HKDF_CONTEXTS.encryption), 32);
  const comKey = hkdf(sha256, masterKey, salt, encodeText(HKDF_CONTEXTS.commitment), 32);

  wipeMemory(masterKey);

  return { encKey, comKey };
}
