// ============================================================================
// IPFS UPLOADER (Pinata & Filebase)
// ============================================================================

import { PinataClient } from "./pinata";
import { FilebaseClient } from "./filebase";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Required Filebase bucket name for Sanctum vaults */
export const FILEBASE_BUCKET_NAME = 'sanctum-vaults';

/** Filebase bucket configuration instructions */
export const FILEBASE_BUCKET_INSTRUCTIONS = 
  'Create a private bucket named "sanctum-vaults" at https://console.filebase.com/buckets';

// ============================================================================
// TYPES
// ============================================================================

export type UploadCredentials =
  | { provider: 'pinata'; pinataJWT: string }
  | { provider: 'filebase'; filebaseToken: string };

export interface UploadResult {
  cid: string;
}

/**
 * Upload to IPFS via selected provider
 */
export async function uploadToIPFS(
  data: Uint8Array,
  credentials: UploadCredentials
): Promise<UploadResult> {
  if (credentials.provider === 'filebase') {
    const filebase = new FilebaseClient(credentials.filebaseToken);
    const cid = await filebase.upload(data);
    return { cid };
  }
  
  const pinata = new PinataClient(credentials.pinataJWT);
  const cid = await pinata.upload(data);
  return { cid };
}
