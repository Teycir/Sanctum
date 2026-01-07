// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { base64UrlEncode, base64UrlDecode } from '../crypto/utils';

export interface VaultState {
  readonly cid: string;
  readonly mode: 'simple' | 'hidden' | 'chain';
  readonly metadata?: Record<string, string>;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Encode vault state into URL hash
 * @param state Vault state
 * @returns URL hash string
 */
export function encodeVaultState(state: VaultState): string {
  const data = {
    c: state.cid,
    m: state.mode,
    ...(state.metadata && { d: state.metadata })
  };
  
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  return base64UrlEncode(bytes);
}

/**
 * Decode vault state from URL hash
 * @param hash URL hash string
 * @returns Vault state
 * @throws Error if invalid format
 */
export function decodeVaultState(hash: string): VaultState {
  try {
    const bytes = base64UrlDecode(hash);
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    
    if (!data.c || !data.m) {
      throw new Error('Missing required fields');
    }
    
    return {
      cid: data.c,
      mode: data.m,
      metadata: data.d
    };
  } catch {
    throw new Error('Invalid vault state');
  }
}

/**
 * Create vault URL with encoded state
 * @param baseUrl Base URL
 * @param state Vault state
 * @returns Complete vault URL
 */
export function createVaultUrl(baseUrl: string, state: VaultState): string {
  const hash = encodeVaultState(state);
  return `${baseUrl}#${hash}`;
}

/**
 * Parse vault URL to extract state
 * @param url Complete vault URL
 * @returns Vault state
 * @throws Error if invalid URL
 */
export function parseVaultUrl(url: string): VaultState {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    throw new Error('No hash in URL');
  }
  
  const hash = url.slice(hashIndex + 1);
  return decodeVaultState(hash);
}
