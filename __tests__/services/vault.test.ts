import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VaultService } from '../../lib/services/vault';

const mockStorage = new Map<string, Uint8Array>();

vi.mock('../../lib/helia/client', () => ({
  HeliaIPFS: class MockHeliaIPFS {
    async init() {}
    async upload(data: Uint8Array) {
      const cid = `mock-cid-${Math.random().toString(36).slice(2)}`;
      mockStorage.set(cid, data);
      return cid;
    }
    async download(cid: string) {
      const data = mockStorage.get(cid);
      if (!data) throw new Error(`CID not found: ${cid}`);
      return data;
    }
    async stop() {}
  }
}));

vi.mock('../../lib/workers/crypto', () => ({
  CryptoWorker: class MockCryptoWorker {
    async createHiddenVault(params: any) {
      const { createHiddenVault } = await import('../../lib/duress/layers');
      return createHiddenVault(params);
    }
    async unlockHiddenVault(result: any, passphrase: string) {
      const { unlockHiddenVault } = await import('../../lib/duress/layers');
      return unlockHiddenVault(result, passphrase);
    }
    terminate() { /* no-op */ }
  }
}));

describe('services/vault', () => {
  let service: VaultService;

  beforeEach(() => {
    service = new VaultService();
  });

  describe('createVault', () => {
    it('should create vault and return URL with metadata', async () => {
      const decoy = new TextEncoder().encode('innocent');
      const hidden = new TextEncoder().encode('secret');

      const result = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: 'test-pass'
      });

      expect(result.vaultURL).toContain('/v#');
      expect(result.decoyCID).toBeTruthy();
      expect(result.hiddenCID).toBeTruthy();
    });
  });

  describe('unlockVault', () => {
    it('should unlock decoy layer with empty passphrase', async () => {
      const decoy = new TextEncoder().encode('innocent');
      const hidden = new TextEncoder().encode('secret');

      const created = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: 'test-pass'
      });

      const unlocked = await service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: ''
      });

      expect(unlocked.isDecoy).toBe(true);
      expect(unlocked.content).toEqual(decoy);
    });

    it('should unlock hidden layer with correct passphrase', async () => {
      const decoy = new TextEncoder().encode('innocent');
      const hidden = new TextEncoder().encode('secret');

      const created = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: 'test-pass'
      });

      const unlocked = await service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: 'test-pass'
      });

      expect(unlocked.isDecoy).toBe(false);
      expect(unlocked.content).toEqual(hidden);
    });
  });
});
