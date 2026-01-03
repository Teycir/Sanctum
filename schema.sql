-- Cloudflare D1 Schema for Sanctum Split-Key Storage

CREATE TABLE IF NOT EXISTS vault_keys (
  vault_id TEXT PRIMARY KEY,
  encrypted_key_a TEXT NOT NULL,
  encrypted_decoy_cid TEXT NOT NULL,
  encrypted_hidden_cid TEXT NOT NULL,
  salt TEXT NOT NULL,
  master_nonce TEXT NOT NULL,
  cid_encryption_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_created_at ON vault_keys(created_at);

CREATE TABLE IF NOT EXISTS vault_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  vault_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_access_log ON vault_access_log(ip, vault_id, timestamp);
CREATE INDEX idx_suspicious ON vault_access_log(ip, timestamp);
CREATE INDEX idx_fingerprint ON vault_access_log(fingerprint, timestamp);

CREATE TABLE IF NOT EXISTS banned_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  banned_at INTEGER NOT NULL,
  reason TEXT NOT NULL
);
