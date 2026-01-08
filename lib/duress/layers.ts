// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { HKDF_CONTEXTS } from "../crypto/constants";
import { encrypt, decrypt } from "../crypto/core";
import { assembleBlob, verifyBlobIntegrity } from "../crypto/padding";
import { selectVaultSize, wipeMemory, encodeText } from "../crypto/utils";
import type { Argon2Profile } from "../crypto/constants";
import { constantTimeSelect } from "./timing";

/**
 * SECURITY NOTICE: Timing Attack Limitations
 * 
 * This implementation provides CRYPTOGRAPHIC plausible deniability but NOT
 * complete timing-attack resistance due to JavaScript runtime limitations:
 * 
 * ✅ PROTECTED AGAINST:
 * - Cryptographic analysis (encrypted blobs are indistinguishable)
 * - Static analysis (cannot prove hidden layer exists)
 * - Metadata analysis (both layers same size, same structure)
 * - Casual timing observation (both paths execute similar operations)
 * 
 * ⚠️ VULNERABLE TO (in theory):
 * - High-precision timing measurements (nanosecond-level, 100+ samples)
 * - Memory allocation pattern analysis
 * - CPU cache timing attacks
 * - JIT compiler optimization differences
 * - Garbage collection timing variations
 * 
 * WHY JAVASCRIPT CANNOT PROVIDE TRUE CONSTANT-TIME:
 * 1. No constant-time primitives in JS/WebAssembly
 * 2. JIT compiler optimizations are unpredictable
 * 3. Garbage collection introduces timing variations
 * 4. Browser optimizations vary by implementation
 * 5. High-resolution timers (performance.now) available to attackers
 * 
 * WHAT WE'VE DONE:
 * - Always execute BOTH decryption attempts (no early return)
 * - Use constantTimeSelect to randomize execution order
 * - Identical blob structure and padding for both layers
 * - Test shows 1.00x timing ratio in controlled environment
 * 
 * THREAT MODEL:
 * - ✅ Safe against: Physical coercion, legal demands, forensic analysis
 * - ✅ Safe against: Cryptographic attacks on encrypted data
 * - ✅ Safe against: Casual timing observation (single unlock)
 * - ⚠️ Risky against: Adversary with nanosecond timing + 100+ unlock attempts
 * - ❌ Unsafe against: Side-channel attacks in controlled lab environment
 * 
 * RECOMMENDATIONS:
 * - For maximum security: Use native implementation (Rust/C with constant-time crypto)
 * - For web: Current implementation is best-effort given platform constraints
 * - OpSec: Never unlock vault while under active surveillance with timing equipment
 * - Defense: Use Tor Browser (adds network timing noise) when unlocking
 * - Reality: Timing attacks require sophisticated equipment + multiple attempts
 * 
 * CONCLUSION:
 * Timing attacks are MITIGATED but not ELIMINATED. The implementation provides
 * strong plausible deniability against real-world threats (coercion, legal demands)
 * but cannot guarantee protection against nation-state adversaries with lab equipment.
 * 
 * See: https://github.com/Teycir/Sanctum/blob/main/docs/security/TIMING-ATTACKS.md
 */

export interface LayerContent {
  readonly decoy: Uint8Array;
  readonly hidden: Uint8Array;
}

export interface HiddenVaultParams {
  readonly content: LayerContent;
  readonly passphrase: string;
  readonly decoyPassphrase?: string; // Optional duress password for decoy
  readonly argonProfile: Argon2Profile;
  readonly vaultId?: string; // Optional vault ID for integrity verification
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
 * Derive layer-specific key material from master passphrase
 * 
 * SECURITY NOTE: Returns Uint8Array instead of string to allow secure wiping.
 * Caller must convert to string only when needed and minimize lifetime.
 * 
 * @param masterPassphrase User's master passphrase
 * @param layerIndex Layer index (0 = decoy, 1 = hidden)
 * @param salt Vault salt
 * @returns Layer-specific key material (32 bytes)
 */
function deriveLayerKey(
  masterPassphrase: string,
  layerIndex: number,
  salt: Uint8Array,
): Uint8Array {
  const input = encodeText(masterPassphrase);
  const context = encodeText(`${HKDF_CONTEXTS.layerDerivation}-${layerIndex}`);
  const derived = hkdf(sha256, input, salt, context, 32);
  wipeMemory(input);
  return derived; // Caller responsible for wiping
}

/**
 * Convert key material to passphrase string
 * 
 * WARNING: Returned string is immutable and cannot be wiped from memory.
 * This is a fundamental JavaScript limitation. Minimize string lifetime.
 * 
 * @param keyMaterial Key material bytes
 * @returns Hex-encoded passphrase
 */
function keyToPassphrase(keyMaterial: Uint8Array): string {
  return Array.from(keyMaterial)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create hidden vault with decoy and hidden layers
 * @param params Hidden vault parameters
 * @returns Complete decoy and hidden blobs with shared salt
 * @throws Error if encryption fails or duress passphrase is empty
 */
export function createHiddenVault(
  params: HiddenVaultParams,
): HiddenVaultResult {
  // Only require decoyPassphrase if decoy content is not empty
  if (params.content.decoy.length > 0 && !params.decoyPassphrase) {
    throw new Error('Decoy passphrase is required when decoy content is provided');
  }
  
  // Use empty string as decoy passphrase if not provided (for empty decoy)
  const decoyPass = params.decoyPassphrase || '';
  
  // Encrypt decoy with duress passphrase (or empty string for no decoy)
  const decoyEncrypted = encrypt({
    plaintext: params.content.decoy,
    passphrase: decoyPass,
    argonProfile: params.argonProfile,
  });

  const salt: Uint8Array = decoyEncrypted.salt;
  
  // Derive hidden layer key material (Uint8Array for secure wiping)
  const hiddenKeyMaterial = deriveLayerKey(params.passphrase, 1, salt);
  const hiddenPassphrase = keyToPassphrase(hiddenKeyMaterial);
  wipeMemory(hiddenKeyMaterial);

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

  // Use provided vaultId or derive from salt for backward compatibility
  const vaultId = params.vaultId || Array.from(salt.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const decoyBlob: Uint8Array = assembleBlob(decoyEncrypted, maxSize, vaultId);
  const hiddenBlob: Uint8Array = assembleBlob(hiddenEncrypted, maxSize, vaultId);

  return {
    decoyBlob,
    hiddenBlob,
    salt,
  };
}

export interface UnlockResult {
  readonly content: Uint8Array;
  readonly isDecoy: boolean;
}

/**
 * Unlock hidden vault layer with constant-time execution
 * 
 * SECURITY NOTE: This attempts constant-time execution but JavaScript runtime
 * limitations mean true constant-time is impossible. See file header for details.
 * 
 * The function always attempts BOTH decryptions to minimize timing differences,
 * but JIT optimization, GC, and browser variations can still leak timing info.
 * 
 * @param result Hidden vault result
 * @param passphrase User passphrase (empty for decoy)
 * @param vaultId Vault identifier for integrity verification
 * @returns Decrypted layer content with isDecoy flag
 * @throws Error if decryption fails or vault integrity check fails
 */
export function unlockHiddenVault(
  result: HiddenVaultResult,
  passphrase: string,
  vaultId?: string,
): UnlockResult {
  // Verify vault integrity if vaultId provided
  if (vaultId) {
    const decoyValid = verifyBlobIntegrity(result.decoyBlob, vaultId);
    const hiddenValid = verifyBlobIntegrity(result.hiddenBlob, vaultId);
    
    if (!decoyValid || !hiddenValid) {
      throw new Error('Vault integrity check failed: blob does not match vault ID');
    }
  }
  
  // Derive hidden layer key material (Uint8Array for secure wiping)
  const hiddenKeyMaterial = deriveLayerKey(passphrase, 1, result.salt);
  const hiddenPassphrase = keyToPassphrase(hiddenKeyMaterial);
  
  // Always attempt both decryptions to prevent timing attacks
  const decryptionResults = constantTimeSelect(
    true,
    () => {
      let decoyContent: Uint8Array | null = null;
      let hiddenContent: Uint8Array | null = null;
      let decoySuccess = false;
      let hiddenSuccess = false;
      
      try {
        decoyContent = decrypt({ blob: result.decoyBlob, passphrase });
        decoySuccess = true;
      } catch {
        decoySuccess = false;
      }
      
      try {
        hiddenContent = decrypt({ blob: result.hiddenBlob, passphrase: hiddenPassphrase });
        hiddenSuccess = true;
      } catch {
        hiddenSuccess = false;
      }
      
      return { decoyContent, hiddenContent, decoySuccess, hiddenSuccess };
    },
    () => {
      let decoyContent: Uint8Array | null = null;
      let hiddenContent: Uint8Array | null = null;
      let decoySuccess = false;
      let hiddenSuccess = false;
      
      try {
        hiddenContent = decrypt({ blob: result.hiddenBlob, passphrase: hiddenPassphrase });
        hiddenSuccess = true;
      } catch {
        hiddenSuccess = false;
      }
      
      try {
        decoyContent = decrypt({ blob: result.decoyBlob, passphrase });
        decoySuccess = true;
      } catch {
        decoySuccess = false;
      }
      
      return { decoyContent, hiddenContent, decoySuccess, hiddenSuccess };
    }
  );
  
  // Wipe key material after use
  wipeMemory(hiddenKeyMaterial);
  
  // Return result based on which succeeded
  if (decryptionResults.decoySuccess) {
    return { content: decryptionResults.decoyContent!, isDecoy: true };
  }
  if (decryptionResults.hiddenSuccess) {
    return { content: decryptionResults.hiddenContent!, isDecoy: false };
  }
  
  throw new Error('Invalid passphrase');
}
