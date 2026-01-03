// ============================================================================
// PINATA IPFS UPLOADER
// ============================================================================

import { PinataClient } from "./pinata";

export interface UploadCredentials {
  pinataJWT: string;
}

export interface UploadResult {
  cid: string;
}

/**
 * Upload to Pinata IPFS
 */
export async function uploadToIPFS(
  data: Uint8Array,
  credentials: UploadCredentials
): Promise<UploadResult> {
  const pinata = new PinataClient(credentials.pinataJWT);
  const cid = await pinata.upload(data);
  return { cid };
}
