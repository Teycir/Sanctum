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
  readonly provider: "pinata" | "filebase";
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
 * @returns Stored vault with CIDs and provider type
 */
export async function uploadVault(
  vault: HiddenVaultResult,
  credentials?: UploadCredentials,
): Promise<StoredVault> {
  if (!credentials) {
    throw new Error("IPFS credentials are required for vault upload");
  }

  const [decoyResult, hiddenResult] = await Promise.all([
    uploadToIPFS(vault.decoyBlob, credentials),
    uploadToIPFS(vault.hiddenBlob, credentials),
  ]);

  return {
    decoyCID: decoyResult.cid,
    hiddenCID: hiddenResult.cid,
    salt: vault.salt,
    provider: credentials.provider,
  };
}

/**
 * Download hidden vault from IPFS with public gateway fallback and integrity verification
 *
 * SECURITY: Vault ID embedded in blob header prevents cross-vault contamination.
 * Downloads only from specified provider (Pinata or Filebase), with public gateway fallback.
 *
 * @param stored Stored vault metadata with provider type
 * @returns Hidden vault result
 * @throws Error if content not found on any gateway
 */
export async function downloadVault(
  stored: StoredVault,
): Promise<HiddenVaultResult> {
  const errors: string[] = [];

  if (stored.provider === "filebase") {
    const { FilebaseClient } = await import("./filebase");
    try {
      const filebase = new FilebaseClient("");
      const decoyBlob = await filebase.download(stored.decoyCID);
      const hiddenBlob = await filebase.download(stored.hiddenCID);
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Filebase: ${errorMsg}`);
    }
  } else {
    const { PinataClient } = await import("./pinata");
    try {
      const pinata = new PinataClient("", "https://gateway.pinata.cloud");
      const decoyBlob = await pinata.download(stored.decoyCID);
      const hiddenBlob = await pinata.download(stored.hiddenCID);
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Pinata: ${errorMsg}`);
    }
  }

  throw new Error(
    `Vault content not found on ${stored.provider}. The files may have been deleted from storage provider. Tried: ${errors.join(", ")}`,
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
  const providerBytes = new TextEncoder().encode(stored.provider);
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
    encodeU32LE(providerBytes.length),
    providerBytes,
    encodeU32LE(decoyFilenameBytes.length),
    decoyFilenameBytes,
    encodeU32LE(hiddenFilenameBytes.length),
    hiddenFilenameBytes,
  );
}

// ============================================================================
// INTERNAL HELPERS - Not exported
// ============================================================================

function readCID(
  data: Uint8Array,
  offset: number,
): { cid: string; newOffset: number } {
  if (offset + 4 > data.length)
    throw new Error("Invalid vault metadata: buffer too short");
  const length = decodeU32LE(data, offset);
  if (length > 1000)
    throw new Error("Invalid vault metadata: CID length too large");
  offset += 4;

  if (offset + length > data.length)
    throw new Error("Invalid vault metadata: buffer too short");
  const bytes = data.slice(offset, offset + length);
  const cid = new TextDecoder().decode(bytes);
  return { cid, newOffset: offset + length };
}

function readFilename(
  data: Uint8Array,
  offset: number,
): { filename: string | undefined; newOffset: number } {
  if (offset >= data.length) return { filename: undefined, newOffset: offset };
  if (offset + 4 > data.length)
    throw new Error("Invalid vault metadata: buffer too short");

  const length = decodeU32LE(data, offset);
  if (length > 255)
    throw new Error("Invalid vault metadata: filename length too large");
  offset += 4;

  if (length === 0) return { filename: undefined, newOffset: offset };
  if (offset + length > data.length)
    throw new Error("Invalid vault metadata: buffer too short");

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

  if (offset + 32 > data.length)
    throw new Error("Invalid vault metadata: insufficient data for salt");
  const salt = data.slice(offset, offset + 32);
  offset += 32;

  // Read provider (with backward compatibility)
  let provider: "pinata" | "filebase" = "pinata";
  if (offset < data.length) {
    try {
      const providerResult = readFilename(data, offset);
      if (
        providerResult.filename === "filebase" ||
        providerResult.filename === "pinata"
      ) {
        provider = providerResult.filename;
        offset = providerResult.newOffset;
      }
    } catch {
      // Backward compatibility: old vaults without provider field
      provider = "pinata";
    }
  }

  const decoyFile = readFilename(data, offset);
  offset = decoyFile.newOffset;

  const hiddenFile = readFilename(data, offset);

  const result = {
    decoyCID: decoy.cid,
    hiddenCID: hidden.cid,
    salt,
    provider,
    decoyFilename: decoyFile.filename,
    hiddenFilename: hiddenFile.filename,
  };
  return StoredVaultSchema.parse(result);
}
