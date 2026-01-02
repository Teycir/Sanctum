// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_VAULT_SIZE = 10 * 1024 * 1024; // 10 MB
const CID_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|bafy[a-z0-9]{50,}|test-.+)$/;

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

export function validateCID(cid: string): void {
  if (!cid || typeof cid !== 'string') {
    throw new Error('CID must be a non-empty string');
  }
  
  if (!CID_REGEX.test(cid)) {
    throw new Error('Invalid CID format');
  }
}

export function validateVaultData(data: Uint8Array): void {
  if (!(data instanceof Uint8Array)) {
    throw new Error('Vault data must be Uint8Array');
  }
  
  if (data.length === 0) {
    throw new Error('Vault data cannot be empty');
  }
  
  if (data.length > MAX_VAULT_SIZE) {
    throw new Error(`Vault data exceeds maximum size of ${MAX_VAULT_SIZE} bytes`);
  }
}

export function validateTrackerURL(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new Error('Tracker URL must be a non-empty string');
  }
  
  if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
    throw new Error('Tracker URL must use ws:// or wss:// protocol');
  }
}
