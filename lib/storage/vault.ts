// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import type { HiddenVaultResult } from '../duress/layers';
import { concat, encodeU32LE, decodeU32LE } from '../crypto/utils';
import { StoredVaultSchema } from '../validation/schemas';
import { uploadToIPFS, type UploadCredentials } from './uploader';

export interface StoredVault {
  readonly decoyCID: string;
  readonly hiddenCID: string;
  readonly salt: Uint8Array;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Upload hidden vault to IPFS
 * @param vault Hidden vault result
 * @param credentials IPFS pinning service credentials
 * @returns Stored vault with CIDs
 */
export async function uploadVault(
  vault: HiddenVaultResult,
  credentials?: UploadCredentials
): Promise<StoredVault> {
  if (!credentials) {
    throw new Error('IPFS credentials required');
  }
  
  const decoyResult = await uploadToIPFS(vault.decoyBlob, credentials);
  const hiddenResult = await uploadToIPFS(vault.hiddenBlob, credentials);
  
  return {
    decoyCID: decoyResult.cid,
    hiddenCID: hiddenResult.cid,
    salt: vault.salt
  };
}

/**
 * Download hidden vault from Pinata gateway with public gateway fallback
 * @param stored Stored vault metadata
 * @returns Hidden vault result
 */
export async function downloadVault(
  stored: StoredVault
): Promise<HiddenVaultResult> {
  const { PinataClient } = await import('./pinata');
  const pinata = new PinataClient('');
  
  const decoyBlob = await pinata.download(stored.decoyCID);
  const hiddenBlob = await pinata.download(stored.hiddenCID);
  
  return {
    decoyBlob,
    hiddenBlob,
    salt: stored.salt
  };
}

/**
 * Serialize stored vault metadata for URL encoding
 * @param stored Stored vault metadata
 * @returns Serialized bytes
 */
export function serializeVaultMetadata(stored: StoredVault): Uint8Array {
  const decoyCIDBytes = new TextEncoder().encode(stored.decoyCID);
  const hiddenCIDBytes = new TextEncoder().encode(stored.hiddenCID);
  
  return concat(
    encodeU32LE(decoyCIDBytes.length),
    decoyCIDBytes,
    encodeU32LE(hiddenCIDBytes.length),
    hiddenCIDBytes,
    stored.salt
  );
}

/**
 * Deserialize stored vault metadata from URL
 * @param data Serialized bytes
 * @returns Stored vault metadata
 */
export function deserializeVaultMetadata(data: Uint8Array): StoredVault {
  let offset = 0;
  
  const decoyCIDLength = decodeU32LE(data, offset);
  offset += 4;
  
  const decoyCIDBytes = data.slice(offset, offset + decoyCIDLength);
  const decoyCID = new TextDecoder().decode(decoyCIDBytes);
  offset += decoyCIDLength;
  
  const hiddenCIDLength = decodeU32LE(data, offset);
  offset += 4;
  
  const hiddenCIDBytes = data.slice(offset, offset + hiddenCIDLength);
  const hiddenCID = new TextDecoder().decode(hiddenCIDBytes);
  offset += hiddenCIDLength;
  
  const salt = data.slice(offset, offset + 32);
  
  const result = { decoyCID, hiddenCID, salt };
  return StoredVaultSchema.parse(result);
}
