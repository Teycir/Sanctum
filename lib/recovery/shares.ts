// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import type { Share } from './shamir';
import { base64UrlEncode, base64UrlDecode } from '../crypto/utils';

export interface ShareMetadata {
  readonly share: Share;
  readonly threshold: number;
  readonly total: number;
  readonly vaultId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SHARE_VERSION = 0x01;
const SHARE_PREFIX = 'SANCTUM-SHARE-';

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Encode share for storage/transmission
 * @param share Share to encode
 * @param threshold Minimum shares needed
 * @param total Total shares
 * @param vaultId Vault identifier (prevents mixing shares)
 * @returns Encoded share string (SANCTUM-SHARE-{base64})
 */
export function encodeShare(
  share: Share,
  threshold: number,
  total: number,
  vaultId: string
): string {
  const vaultIdBytes = new TextEncoder().encode(vaultId.slice(0, 32).padEnd(32, '\0'));
  const dataBytes = new TextEncoder().encode(share.data);
  
  const header = new Uint8Array(4);
  header[0] = SHARE_VERSION;
  header[1] = share.id;
  header[2] = threshold;
  header[3] = total;

  const combined = new Uint8Array(header.length + vaultIdBytes.length + dataBytes.length);
  combined.set(header, 0);
  combined.set(vaultIdBytes, header.length);
  combined.set(dataBytes, header.length + vaultIdBytes.length);

  return SHARE_PREFIX + base64UrlEncode(combined);
}

/**
 * Decode share from string
 * @param encoded Encoded share string
 * @returns Decoded share with metadata
 * @throws Error if invalid format
 */
export function decodeShare(encoded: string): ShareMetadata {
  if (!encoded.startsWith(SHARE_PREFIX)) {
    throw new Error('Invalid share format');
  }

  const data = base64UrlDecode(encoded.slice(SHARE_PREFIX.length));
  
  if (data.length < 36) {
    throw new Error('Share too short');
  }

  const version = data[0];
  if (version !== SHARE_VERSION) {
    throw new Error(`Unsupported share version: ${version}`);
  }

  const id = data[1];
  const threshold = data[2];
  const total = data[3];
  const vaultId = new TextDecoder().decode(data.slice(4, 36)).replace(/\0+$/, '');
  const shareData = new TextDecoder().decode(data.slice(36));

  return {
    share: { id, data: shareData },
    threshold,
    total,
    vaultId
  };
}

/**
 * Parse share from text (extracts SANCTUM-SHARE-* pattern)
 * @param text Text containing share
 * @returns Encoded share string or null
 */
export function parseShare(text: string): string | null {
  const match = text.match(/SANCTUM-SHARE-[A-Za-z0-9_-]+/);
  return match ? match[0] : null;
}
