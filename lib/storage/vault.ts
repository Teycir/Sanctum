// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import type { HiddenVaultResult } from "../duress/layers";
import { concat, encodeU32LE, decodeU32LE } from "../crypto/utils";
import { StoredVaultSchema } from "../validation/schemas";
import { uploadToIPFS, type UploadCredentials } from "./uploader";

export interface StoredVault {
  readonly decoyCID: string;
  readonly hiddenCID: string;
  readonly salt: Uint8Array;
  readonly decoyFilename?: string;
  readonly hiddenFilename?: string;
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
  credentials?: UploadCredentials,
): Promise<StoredVault> {
  if (!credentials) {
    throw new Error('IPFS credentials are required for vault upload');
  }
  
  const [decoyResult, hiddenResult] = await Promise.all([
    uploadToIPFS(vault.decoyBlob, credentials),
    uploadToIPFS(vault.hiddenBlob, credentials)
  ]);

  return {
    decoyCID: decoyResult.cid,
    hiddenCID: hiddenResult.cid,
    salt: vault.salt,
  };
}

/**
 * Download hidden vault from IPFS gateway with public gateway fallback
 * @param stored Stored vault metadata
 * @returns Hidden vault result
 * @throws Error if content not found on any gateway
 */
export async function downloadVault(
  stored: StoredVault,
): Promise<HiddenVaultResult> {
  const { PinataClient } = await import("./pinata");
  const { FilebaseClient } = await import("./filebase");

  const errors: string[] = [];

  // Try Pinata first (public gateway, no auth needed)
  try {
    const pinata = new PinataClient("", "https://gateway.pinata.cloud");
    const decoyBlob = await pinata.download(stored.decoyCID);
    const hiddenBlob = await pinata.download(stored.hiddenCID);
    return { decoyBlob, hiddenBlob, salt: stored.salt };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(`Pinata: ${errorMsg}`);
    console.warn("Pinata download failed, trying Filebase fallback:", error);
  }

  // Try Filebase fallback
  try {
    const filebase = new FilebaseClient("");
    const decoyBlob = await filebase.download(stored.decoyCID);
    const hiddenBlob = await filebase.download(stored.hiddenCID);
    return { decoyBlob, hiddenBlob, salt: stored.salt };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(`Filebase: ${errorMsg}`);
  }

  // All gateways failed
  throw new Error(
    `Vault content not found on IPFS. The files may have been deleted from storage providers. Tried: ${errors.join(", ")}`
  );
}

/**
 * Serialize stored vault metadata for URL encoding
 * @param stored Stored vault metadata
 * @returns Serialized bytes
 */
export function serializeVaultMetadata(stored: StoredVault): Uint8Array {
  if (stored.salt.length !== 32) {
    throw new Error("Invalid salt length: must be 32 bytes");
  }

  const decoyCIDBytes = new TextEncoder().encode(stored.decoyCID);
  const hiddenCIDBytes = new TextEncoder().encode(stored.hiddenCID);
  const decoyFilenameBytes = new TextEncoder().encode(
    stored.decoyFilename || "",
  );
  const hiddenFilenameBytes = new TextEncoder().encode(
    stored.hiddenFilename || "",
  );

  if (decoyCIDBytes.length > 1000 || hiddenCIDBytes.length > 1000) {
    throw new Error("CID length exceeds maximum allowed size");
  }
  if (decoyFilenameBytes.length > 255 || hiddenFilenameBytes.length > 255) {
    throw new Error("Filename length exceeds maximum allowed size");
  }

  return concat(
    encodeU32LE(decoyCIDBytes.length),
    decoyCIDBytes,
    encodeU32LE(hiddenCIDBytes.length),
    hiddenCIDBytes,
    stored.salt,
    encodeU32LE(decoyFilenameBytes.length),
    decoyFilenameBytes,
    encodeU32LE(hiddenFilenameBytes.length),
    hiddenFilenameBytes,
  );
}

// ============================================================================
// INTERNAL HELPERS - Not exported
// ============================================================================

function readCID(data: Uint8Array, offset: number): { cid: string; newOffset: number } {
  if (offset + 4 > data.length) throw new Error("Invalid vault metadata: buffer too short");
  const length = decodeU32LE(data, offset);
  if (length > 1000) throw new Error("Invalid vault metadata: CID length too large");
  offset += 4;
  
  if (offset + length > data.length) throw new Error("Invalid vault metadata: buffer too short");
  const bytes = data.slice(offset, offset + length);
  const cid = new TextDecoder().decode(bytes);
  return { cid, newOffset: offset + length };
}

function readFilename(data: Uint8Array, offset: number): { filename: string | undefined; newOffset: number } {
  if (offset >= data.length) return { filename: undefined, newOffset: offset };
  if (offset + 4 > data.length) throw new Error("Invalid vault metadata: buffer too short");
  
  const length = decodeU32LE(data, offset);
  if (length > 255) throw new Error("Invalid vault metadata: filename length too large");
  offset += 4;
  
  if (length === 0) return { filename: undefined, newOffset: offset };
  if (offset + length > data.length) throw new Error("Invalid vault metadata: buffer too short");
  
  const bytes = data.slice(offset, offset + length);
  const filename = new TextDecoder().decode(bytes);
  return { filename, newOffset: offset + length };
}

/**
 * Deserialize stored vault metadata from URL
 * @param data Serialized bytes
 * @returns Stored vault metadata
 */
export function deserializeVaultMetadata(data: Uint8Array): StoredVault {
  let offset = 0;

  const decoy = readCID(data, offset);
  offset = decoy.newOffset;

  const hidden = readCID(data, offset);
  offset = hidden.newOffset;

  if (offset + 32 > data.length) throw new Error("Invalid vault metadata: insufficient data for salt");
  const salt = data.slice(offset, offset + 32);
  offset += 32;

  const decoyFile = readFilename(data, offset);
  offset = decoyFile.newOffset;

  const hiddenFile = readFilename(data, offset);

  const result = { 
    decoyCID: decoy.cid, 
    hiddenCID: hidden.cid, 
    salt, 
    decoyFilename: decoyFile.filename, 
    hiddenFilename: hiddenFile.filename 
  };
  return StoredVaultSchema.parse(result);
}
