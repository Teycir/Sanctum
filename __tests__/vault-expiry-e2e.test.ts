import { describe, it, expect, beforeEach } from 'vitest';
import { MockVaultDatabase } from '@/lib/test/mock-database';

describe('Vault Expiry E2E (MockDatabase)', () => {
  let db: MockVaultDatabase;
  const MOBILE_LAG_BUFFER_MS = 5000;
  const GRACE_PERIOD_MS = 1000;

  beforeEach(() => {
    db = new MockVaultDatabase();
  });

  it('should store vault with expiry timestamp', async () => {
    const now = Date.now();
    const expiryDays = 30;
    const expiresAt = now + (expiryDays * 24 * 60 * 60 * 1000) + MOBILE_LAG_BUFFER_MS;

    await db.storeVault({
      vault_id: 'test-vault-1',
      encrypted_key_b: 'encrypted-key',
      encrypted_decoy_cid: 'decoy-cid',
      encrypted_hidden_cid: 'hidden-cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: expiresAt,
    });

    const vault = await db.getVault('test-vault-1');
    expect(vault).toBeDefined();
    expect(vault?.expires_at).toBe(expiresAt);
  });

  it('should retrieve vault before expiry', async () => {
    const now = Date.now();
    const expiresAt = now + 60000; // 1 minute

    await db.storeVault({
      vault_id: 'test-vault-2',
      encrypted_key_b: 'encrypted-key',
      encrypted_decoy_cid: 'decoy-cid',
      encrypted_hidden_cid: 'hidden-cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: expiresAt,
    });

    const vault = await db.getVault('test-vault-2');
    expect(vault).toBeDefined();
    expect(vault?.vault_id).toBe('test-vault-2');
  });

  it('should delete expired vaults on access (lazy deletion)', async () => {
    const now = Date.now();
    const expiredAt = now - 2000; // Expired 2 seconds ago

    await db.storeVault({
      vault_id: 'expired-vault',
      encrypted_key_b: 'encrypted-key',
      encrypted_decoy_cid: 'decoy-cid',
      encrypted_hidden_cid: 'hidden-cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now - 10000,
      expires_at: expiredAt,
    });

    // Try to access - should be deleted by lazy cleanup
    const vault = await db.getVault('expired-vault');
    expect(vault).toBeNull();
  });

  it('should handle vaults without expiry (legacy support)', async () => {
    const now = Date.now();

    await db.storeVault({
      vault_id: 'legacy-vault',
      encrypted_key_b: 'encrypted-key',
      encrypted_decoy_cid: 'decoy-cid',
      encrypted_hidden_cid: 'hidden-cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: null,
    });

    const vault = await db.getVault('legacy-vault');
    expect(vault).toBeDefined();
    expect(vault?.expires_at).toBeNull();
  });

  it('should actually delete vault after expiry (realistic timing)', async () => {
    const now = Date.now();
    const expiresAt = now + 500; // Expires in 500ms

    await db.storeVault({
      vault_id: 'timed-vault',
      encrypted_key_b: 'encrypted-key',
      encrypted_decoy_cid: 'decoy-cid',
      encrypted_hidden_cid: 'hidden-cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: expiresAt,
    });

    // Verify it exists before expiry
    let vault = await db.getVault('timed-vault');
    expect(vault).toBeDefined();

    // Wait for expiry + grace period
    await new Promise(resolve => setTimeout(resolve, 500 + GRACE_PERIOD_MS + 100));

    // Should be deleted
    vault = await db.getVault('timed-vault');
    expect(vault).toBeNull();
  }, 3000);

  it('should handle multiple vaults with different expiry times', async () => {
    const now = Date.now();

    // Expired vault
    await db.storeVault({
      vault_id: 'expired',
      encrypted_key_b: 'key',
      encrypted_decoy_cid: 'cid',
      encrypted_hidden_cid: 'cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now - 10000,
      expires_at: now - 2000,
    });

    // Expiring soon
    await db.storeVault({
      vault_id: 'expiring-soon',
      encrypted_key_b: 'key',
      encrypted_decoy_cid: 'cid',
      encrypted_hidden_cid: 'cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: now + 500,
    });

    // Long-lived
    await db.storeVault({
      vault_id: 'long-lived',
      encrypted_key_b: 'key',
      encrypted_decoy_cid: 'cid',
      encrypted_hidden_cid: 'cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now,
      expires_at: now + 365 * 24 * 60 * 60 * 1000,
    });

    // Expired should be gone
    expect(await db.getVault('expired')).toBeNull();

    // Expiring soon should exist
    expect(await db.getVault('expiring-soon')).toBeDefined();

    // Long-lived should exist
    expect(await db.getVault('long-lived')).toBeDefined();

    // Wait for expiring-soon to expire
    await new Promise(resolve => setTimeout(resolve, 500 + GRACE_PERIOD_MS + 100));

    // Now expiring-soon should be gone
    expect(await db.getVault('expiring-soon')).toBeNull();

    // Long-lived should still exist
    expect(await db.getVault('long-lived')).toBeDefined();
  }, 3000);

  it('should apply grace period correctly', async () => {
    const now = Date.now();
    const expiresAt = now - 500; // Expired 500ms ago (within grace period)

    await db.storeVault({
      vault_id: 'grace-vault',
      encrypted_key_b: 'key',
      encrypted_decoy_cid: 'cid',
      encrypted_hidden_cid: 'cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now - 10000,
      expires_at: expiresAt,
    });

    // Should still exist (within grace period)
    const vault = await db.getVault('grace-vault');
    expect(vault).toBeDefined();
  });

  it('should delete vault after grace period', async () => {
    const now = Date.now();
    const expiresAt = now - 1500; // Expired 1.5s ago (beyond grace period)

    await db.storeVault({
      vault_id: 'beyond-grace',
      encrypted_key_b: 'key',
      encrypted_decoy_cid: 'cid',
      encrypted_hidden_cid: 'cid',
      salt: 'salt',
      nonce: 'nonce',
      created_at: now - 10000,
      expires_at: expiresAt,
    });

    // Should be deleted (beyond grace period)
    const vault = await db.getVault('beyond-grace');
    expect(vault).toBeNull();
  });
});
