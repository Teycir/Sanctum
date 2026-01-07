-- CRITICAL: Clear all existing vaults due to breaking schema change
-- Old vaults lack provider column and vault ID integrity verification
-- Users must recreate vaults with new security features
DELETE FROM vault_keys;

-- Add provider column to track IPFS storage provider
ALTER TABLE vault_keys ADD COLUMN provider TEXT NOT NULL DEFAULT 'pinata';
