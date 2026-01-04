-- Migration: Remove cid_encryption_key column (security fix)
-- Reason: Storing master key defeats split-key architecture
-- Date: 2024

ALTER TABLE vault_keys DROP COLUMN cid_encryption_key;
