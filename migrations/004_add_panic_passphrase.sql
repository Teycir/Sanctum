-- Add panic passphrase hash to vault_keys table (REQUIRED for security)
-- When user enters panic passphrase, show "vault erased" message
-- This prevents lazy users from creating vulnerable vaults

ALTER TABLE vault_keys ADD COLUMN panic_passphrase_hash TEXT NOT NULL DEFAULT '';

-- Index for quick panic passphrase lookup
CREATE INDEX idx_panic_hash ON vault_keys(panic_passphrase_hash);
