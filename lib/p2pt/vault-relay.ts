// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VaultRelayConfig {
  readonly trackers?: string[];
  readonly timeoutMs?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
];

const DEFAULT_TIMEOUT_MS = 15000;

// ============================================================================
// IMPORTS
// ============================================================================

import { validateCID, validateVaultData, validateTrackerURL } from './validation';

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Hash CID to create opaque topic string for P2PT
 * Prevents CID correlation attacks at tracker level
 * 
 * @param cid - IPFS Content Identifier
 * @returns Hashed topic string (32 hex chars)
 * 
 * @example
 * ```typescript
 * const topic = hashTopic('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi');
 * // Returns: 'a3f2c1b9...' (opaque hash)
 * ```
 */
export function hashTopic(cid: string): string {
  const { sha256 } = require('@noble/hashes/sha256');
  const { bytesToHex } = require('@noble/hashes/utils');
  
  const hash = sha256(new TextEncoder().encode(`sanctum:v1:${cid}`));
  return bytesToHex(hash).slice(0, 32);
}

/**
 * Secure vault relay using P2PT with encrypted blobs only
 * Maintains RAM-only guarantee and zero-trust security model
 * 
 * @example
 * ```typescript
 * // Host encrypted vault
 * const relay = new SecureVaultRelay();
 * await relay.hostVault(cid, encryptedBlob);
 * 
 * // Fetch from peer
 * const data = await relay.fetchVault(cid);
 * relay.cleanup();
 * ```
 */
export class SecureVaultRelay {
  private p2pt: any = null;
  private vaultData: Uint8Array | null = null;
  private config: Required<VaultRelayConfig>;

  constructor(config: VaultRelayConfig = {}) {
    if (config.trackers) {
      config.trackers.forEach(validateTrackerURL);
    }
    
    this.config = {
      trackers: config.trackers || DEFAULT_TRACKERS,
      timeoutMs: config.timeoutMs || DEFAULT_TIMEOUT_MS,
    };
  }

  /**
   * Host encrypted vault for peer retrieval
   * Only encrypted ciphertext is transmitted - never plaintext
   * 
   * @param cid - IPFS Content Identifier
   * @param encryptedData - XChaCha20-Poly1305 encrypted vault blob
   * @throws Error if P2PT initialization fails
   */
  async hostVault(cid: string, encryptedData: Uint8Array): Promise<void> {
    validateCID(cid);
    validateVaultData(encryptedData);
    
    const P2PT = (await import('p2pt')).default;
    
    this.vaultData = encryptedData;
    const topic = hashTopic(cid);
    
    this.p2pt = new P2PT(this.config.trackers, topic);
    
    this.p2pt.on('peerconnect', (peer: any) => {
      if (this.vaultData) {
        peer.send(this.vaultData);
      }
    });
    
    await this.p2pt.start();
  }

  /**
   * Fetch encrypted vault from peers
   * Returns null if no peers found within timeout
   * 
   * @param cid - IPFS Content Identifier
   * @param timeoutMs - Optional timeout override
   * @returns Encrypted vault blob or null
   */
  async fetchVault(
    cid: string,
    timeoutMs?: number
  ): Promise<Uint8Array | null> {
    validateCID(cid);
    
    const P2PT = (await import('p2pt')).default;
    const timeout = timeoutMs || this.config.timeoutMs;
    const topic = hashTopic(cid);
    
    return new Promise((resolve) => {
      this.p2pt = new P2PT(this.config.trackers, topic);
      
      const timer = setTimeout(() => {
        this.cleanup();
        resolve(null);
      }, timeout);

      this.p2pt.on('msg', (_peer: any, data: any) => {
        clearTimeout(timer);
        this.cleanup();
        resolve(data as Uint8Array);
      });

      this.p2pt.start();
    });
  }

  /**
   * Clear vault data from RAM and destroy P2PT instance
   * Critical for maintaining RAM-only security guarantee
   */
  cleanup(): void {
    this.vaultData = null;
    this.p2pt?.destroy();
    this.p2pt = null;
  }
}
