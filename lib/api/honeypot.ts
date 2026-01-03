// ============================================================================
// HONEYPOT VAULT IDS
// ============================================================================

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  meta?: Record<string, unknown>;
}

export const HONEYPOT_VAULT_IDS = [
  'aaaaaaaaaaaaaaaaaaaa',
  'zzzzzzzzzzzzzzzzzzzz',
  '0000000000000000',
  '1111111111111111',
  'testtesteststest',
  'adminadminadmin',
];

export function isHoneypot(vaultId: string): boolean {
  return HONEYPOT_VAULT_IDS.includes(vaultId);
}

export async function banFingerprint(db: D1Database, fingerprint: string): Promise<void> {
  await db
    .prepare('INSERT INTO banned_fingerprints (fingerprint, banned_at, reason) VALUES (?, ?, ?)')
    .bind(fingerprint, Date.now(), 'honeypot_triggered')
    .run();
}

export async function isBanned(db: D1Database, fingerprint: string): Promise<boolean> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM banned_fingerprints WHERE fingerprint = ?')
    .bind(fingerprint)
    .first<{ count: number }>();
  
  return result ? result.count > 0 : false;
}
