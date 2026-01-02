import { openDB, type IDBPDatabase } from 'idb';

interface CachedPeer {
  multiaddr: string;
  lastSeen: number;
  successCount: number;
}

const DB_NAME = 'sanctum-peers';
const STORE_NAME = 'peers';

async function getDB(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB not available');
  }
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'multiaddr' });
    },
  });
}

export async function cachePeer(multiaddr: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, multiaddr);

  await db.put(STORE_NAME, {
    multiaddr,
    lastSeen: Date.now(),
    successCount: (existing?.successCount ?? 0) + 1,
  });
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getCachedPeers(limit = 10): Promise<string[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);

    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return all
      .filter((p) => p.lastSeen > cutoff)
      .sort((a, b) => b.successCount - a.successCount)
      .slice(0, limit)
      .map((p) => p.multiaddr);
  } catch {
    return [];
  }
}

export async function clearPeerCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
