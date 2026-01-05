-- Add expiry column to vault_keys table
ALTER TABLE vault_keys ADD COLUMN expires_at INTEGER;

-- Create index for efficient expiry queries
CREATE INDEX idx_expires_at ON vault_keys(expires_at);
