-- Cloudflare D1 Schema for Sanctum Split-Key Storage
-- Defense in Depth: Split-key architecture (KeyA in URL + KeyB encrypted in DB)

CREATE TABLE IF NOT EXISTS vault_keys (
  vault_id TEXT PRIMARY KEY,
  encrypted_key_b TEXT NOT NULL,           -- KeyB encrypted with SHA256(server secret + vaultId)
  encrypted_decoy_cid TEXT NOT NULL,       -- Encrypted CID for decoy layer
  encrypted_hidden_cid TEXT NOT NULL,      -- Encrypted CID for hidden layer
  salt TEXT NOT NULL,                      -- Salt for Argon2id
  nonce TEXT NOT NULL,                     -- Combined nonces for CID encryption (48 bytes)
  created_at INTEGER NOT NULL,
  expires_at INTEGER                       -- Unix timestamp when vault expires (NULL = never)
);

CREATE INDEX idx_created_at ON vault_keys(created_at);
CREATE INDEX idx_expires_at ON vault_keys(expires_at);

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
