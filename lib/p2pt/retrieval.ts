// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RetrievalOptions {
  readonly timeoutMs?: number;
  readonly skipP2PT?: boolean;
  readonly skipLocalIPFS?: boolean;
}

export interface RetrievalResult {
  readonly data: Uint8Array;
  readonly source: "ram" | "p2pt" | "local-ipfs" | "helia";
}

// ============================================================================
// IMPORTS
// ============================================================================

import { SecureVaultRelay } from "./vault-relay";
import { ramCache } from "./ram-cache";
import { validateCID } from "./validation";
import { isP2PTAvailable } from "./capabilities";

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Security-hardened hybrid retrieval waterfall
 * Prioritizes RAM cache, then P2PT, then local IPFS, finally Helia P2P
 * Never uses HTTP gateways (violates zero-trust)
 *
 * @param cid - IPFS Content Identifier
 * @param options - Retrieval configuration
 * @returns Encrypted vault blob with source indicator
 * @throws Error if all retrieval methods fail
 *
 * @example
 * ```typescript
 * const result = await retrieveVault('bafybei...');
 * console.log(`Retrieved from: ${result.source}`);
 * ```
 */
export async function retrieveVault(
  cid: string,
  options: RetrievalOptions = {},
): Promise<RetrievalResult> {
  validateCID(cid);

  // 1. RAM cache (most secure - current session only)
  const ramCached = ramCache.get(cid);
  if (ramCached) {
    return { data: ramCached, source: "ram" };
  }

  // 2. P2PT direct (secure - encrypted content, hashed topics)
  if (!options.skipP2PT && isP2PTAvailable()) {
    const relay = new SecureVaultRelay();
    const p2ptData = await relay.fetchVault(cid, options.timeoutMs);
    relay.cleanup();

    if (p2ptData) {
      ramCache.set(cid, p2ptData);
      return { data: p2ptData, source: "p2pt" };
    }
  }

  // 3. Local IPFS node (secure - user-controlled)
  // Skip in production (only useful for localhost development)
  if (
    !options.skipLocalIPFS &&
    globalThis.window?.location.hostname === "localhost"
  ) {
    const localData = await tryLocalIPFS(cid);
    if (localData) {
      ramCache.set(cid, localData);
      return { data: localData, source: "local-ipfs" };
    }
  }

  // 4. Helia P2P network (secure - encrypted content)
  const heliaData = await tryHelia(cid);
  ramCache.set(cid, heliaData);
  return { data: heliaData, source: "helia" };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Attempt retrieval from local IPFS node
 */
async function tryLocalIPFS(cid: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(`http://127.0.0.1:8080/ipfs/${cid}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    if (error instanceof TypeError || error instanceof DOMException) {
      return null;
    }
    throw error;
  }
}

/**
 * Retrieve from Helia P2P network
 */
async function tryHelia(cid: string): Promise<Uint8Array> {
  const { HeliaIPFS } = await import("../helia/client");
  const client = new HeliaIPFS();
  await client.init();
  return client.download(cid);
}
