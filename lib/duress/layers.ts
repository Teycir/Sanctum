// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { HKDF_CONTEXTS } from "../crypto/constants";
import { encrypt, decrypt } from "../crypto/core";
import { assembleBlob } from "../crypto/padding";
import { selectVaultSize, wipeMemory, encodeText } from "../crypto/utils";
import type { Argon2Profile } from "../crypto/constants";

export interface LayerContent {
  readonly decoy: Uint8Array;
  readonly hidden: Uint8Array;
}

export interface HiddenVaultParams {
  readonly content: LayerContent;
  readonly passphrase: string;
  readonly duressPassphrase?: string; // Optional duress password for decoy
  readonly argonProfile: Argon2Profile;
}

export interface HiddenVaultResult {
  readonly decoyBlob: Uint8Array;
  readonly hiddenBlob: Uint8Array;
  readonly salt: Uint8Array;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Derive layer-specific passphrase from master passphrase
 * @param masterPassphrase User's master passphrase
 * @param layerIndex Layer index (0 = decoy, 1 = hidden)
 * @param salt Vault salt
 * @returns Layer-specific passphrase
 */
export function deriveLayerPassphrase(
  masterPassphrase: string,
  layerIndex: number,
  salt: Uint8Array,
): string {
  const input = encodeText(masterPassphrase);
  const context = encodeText(`${HKDF_CONTEXTS.layerDerivation}-${layerIndex}`);
  const derived = hkdf(sha256, input, salt, context, 32);
  // WARNING: Returned string cannot be securely wiped from memory due to JS string immutability
  const passphrase = Array.from(derived)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  wipeMemory(input);
  wipeMemory(derived);
  return passphrase;
}

/**
 * Create hidden vault with decoy and hidden layers
 * @param params Hidden vault parameters
 * @returns Complete decoy and hidden blobs with shared salt
 * @throws Error if encryption fails
 */
export function createHiddenVault(
  params: HiddenVaultParams,
): HiddenVaultResult {
  // Encrypt decoy with duress passphrase (or empty if not provided)
  const decoyPassphrase: string = params.duressPassphrase || "";
  const decoyEncrypted = encrypt({
    plaintext: params.content.decoy,
    passphrase: decoyPassphrase,
    argonProfile: params.argonProfile,
  });

  const salt: Uint8Array = decoyEncrypted.salt;
  const hiddenPassphrase: string = deriveLayerPassphrase(params.passphrase, 1, salt);

  // Encrypt hidden layer with same salt as decoy
  const hiddenEncrypted = encrypt(
    {
      plaintext: params.content.hidden,
      passphrase: hiddenPassphrase,
      argonProfile: params.argonProfile,
    },
    undefined, // Let it generate its own nonce
    salt, // Use decoy's salt
  );

  const maxSize: number = Math.max(
    selectVaultSize(decoyEncrypted.ciphertext.length),
    selectVaultSize(hiddenEncrypted.ciphertext.length),
  );

  const decoyBlob: Uint8Array = assembleBlob(decoyEncrypted, maxSize);
  const hiddenBlob: Uint8Array = assembleBlob(hiddenEncrypted, maxSize);

  return {
    decoyBlob,
    hiddenBlob,
    salt,
  };
}

/**
 * Unlock hidden vault layer
 * @param result Hidden vault result
 * @param passphrase User passphrase (empty for decoy)
 * @returns Decrypted layer content
 * @throws Error if decryption fails
 */
export function unlockHiddenVault(
  result: HiddenVaultResult,
  passphrase: string,
): Uint8Array {
  try {
    return decrypt({ blob: result.decoyBlob, passphrase });
  } catch {
    // If decoy decryption fails, try hidden layer
    // This is expected behavior for plausible deniability
    const hiddenPassphrase: string = deriveLayerPassphrase(passphrase, 1, result.salt);
    return decrypt({ blob: result.hiddenBlob, passphrase: hiddenPassphrase });
  }
}
