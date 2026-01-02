// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import secrets from 'secrets.js-34r7h';

export interface Share {
  readonly id: number;
  readonly data: string; // Hex string from secrets.js
}

export interface ShamirParams {
  readonly threshold: number;
  readonly shares: number;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Split secret into shares using Shamir Secret Sharing
 * @param secret Secret to split
 * @param params Threshold and total shares
 * @returns Array of shares
 * @throws Error if params invalid
 */
export function split(secret: Uint8Array, params: ShamirParams): Share[] {
  const { threshold, shares } = params;

  if (threshold < 2 || threshold > shares) {
    throw new Error('Invalid threshold');
  }
  if (shares > 255) {
    throw new Error('Maximum 255 shares');
  }

  const hex = bytesToHex(secret);
  const shareStrings = secrets.share(hex, shares, threshold);

  return shareStrings.map((data, i) => ({
    id: i + 1,
    data
  }));
}

/**
 * Combine shares to recover secret
 * @param shares Array of shares (minimum threshold required)
 * @returns Recovered secret
 * @throws Error if insufficient shares
 */
export function combine(shares: Share[]): Uint8Array {
  if (shares.length < 2) {
    throw new Error('Need at least 2 shares');
  }

  const shareStrings = shares.map(s => s.data);
  const hex = secrets.combine(shareStrings);
  
  return hexToBytes(hex);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
