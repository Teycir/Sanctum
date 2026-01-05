// Mock Database for Testing Vault Expiry
// Based on TimeSeal's MockDatabase pattern

export interface VaultRecord {
  vault_id: string;
  encrypted_key_b: string;
  encrypted_decoy_cid: string;
  encrypted_hidden_cid: string;
  salt: string;
  nonce: string;
  created_at: number;
  expires_at: number | null;
}

export class MockVaultDatabase {
  private vaults = new Map<string, VaultRecord>();

  async storeVault(vault: VaultRecord): Promise<void> {
    this.vaults.set(vault.vault_id, vault);
  }

  async getVault(vaultId: string): Promise<VaultRecord | null> {
    // Lazy deletion - remove expired vaults
    const GRACE_PERIOD_MS = 1000;
    const now = Date.now();
    
    for (const [id, vault] of this.vaults.entries()) {
      if (vault.expires_at && vault.expires_at < (now - GRACE_PERIOD_MS)) {
        this.vaults.delete(id);
      }
    }
    
    return this.vaults.get(vaultId) || null;
  }

  async deleteExpiredVaults(): Promise<number> {
    const GRACE_PERIOD_MS = 1000;
    const now = Date.now();
    let deleted = 0;
    
    for (const [id, vault] of this.vaults.entries()) {
      if (vault.expires_at && vault.expires_at < (now - GRACE_PERIOD_MS)) {
        this.vaults.delete(id);
        deleted++;
      }
    }
    
    return deleted;
  }

  clear(): void {
    this.vaults.clear();
  }
}
