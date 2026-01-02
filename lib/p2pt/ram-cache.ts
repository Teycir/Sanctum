// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CacheEntry {
  readonly data: Uint8Array;
  readonly timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// RAM-ONLY SESSION CACHE
// ============================================================================

/**
 * RAM-only cache for vault data
 * Clears on tab close, maintains zero-trust security model
 * 
 * @example
 * ```typescript
 * const cache = new RAMCache();
 * cache.set('cid123', encryptedBlob);
 * const data = cache.get('cid123');
 * cache.clear();
 * ```
 */
export class RAMCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Store encrypted vault in RAM
   * 
   * @param cid - IPFS Content Identifier
   * @param data - Encrypted vault blob
   */
  set(cid: string, data: Uint8Array): void {
    this.cache.set(cid, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieve encrypted vault from RAM
   * Returns null if expired or not found
   * 
   * @param cid - IPFS Content Identifier
   * @returns Encrypted vault blob or null
   */
  get(cid: string): Uint8Array | null {
    const entry = this.cache.get(cid);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(cid);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Clear all cached data from RAM
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [cid, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(cid);
      }
    }
  }
}

// Singleton instance for session-scoped caching
export const ramCache = new RAMCache();
