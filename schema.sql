-- Cloudflare D1 Schema for Sanctum Split-Key Storage
-- Defense in Depth: Both URL-based (Key B) AND server-based (Key A) storage

CREATE TABLE IF NOT EXISTS vault_keys (
  vault_id TEXT PRIMARY KEY,
  encrypted_key_a TEXT NOT NULL,           -- Encrypted with Key B (from URL)
  encrypted_decoy_cid TEXT NOT NULL,       -- Encrypted CID for decoy layer
  encrypted_hidden_cid TEXT,               -- Encrypted CID for hidden layer (NULL if simple vault)
  salt TEXT NOT NULL,                      -- Argon2id salt
  master_nonce TEXT NOT NULL,              -- XChaCha20 nonce
  cid_encryption_key TEXT NOT NULL,        -- Key for CID encryption
  mode TEXT NOT NULL DEFAULT 'simple',     -- 'simple' | 'duress'
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_created_at ON vault_keys(created_at);

-- Access logging for rate limiting and honeypot detection
-- WARNING: Logs IP addresses - consider privacy implications
CREATE TABLE IF NOT EXISTS vault_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vault_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,               -- SHA-256(IP + User-Agent)
  action TEXT NOT NULL,                    -- 'create' | 'unlock' | 'download'
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_access_log ON vault_access_log(vault_id, timestamp);
CREATE INDEX idx_fingerprint ON vault_access_log(fingerprint, timestamp);

-- Honeypot detection: Ban suspicious fingerprints
CREATE TABLE IF NOT EXISTS banned_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  banned_at INTEGER NOT NULL,
  reason TEXT NOT NULL,                    -- 'enumeration' | 'rate_limit' | 'suspicious_pattern'
  expires_at INTEGER                       -- NULL = permanent ban
);
