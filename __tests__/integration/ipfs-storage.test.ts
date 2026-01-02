import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HeliaIPFS } from '@/lib/helia/client';
import { warmUpHelia, stopHelia } from '@/lib/helia/singleton';
import { VaultService } from '@/lib/services/vault';

describe('IPFS Storage Integration Tests', () => {
  let heliaClient: HeliaIPFS;

  beforeAll(async () => {
    warmUpHelia();
    heliaClient = new HeliaIPFS();
    await heliaClient.init();
  }, 60000);

  afterAll(async () => {
    await heliaClient.stop();
    await stopHelia();
  });

  describe('Basic Upload/Download Cycle', () => {
    it('should upload and retrieve data via IPFS', async () => {
      const testData = new TextEncoder().encode('Test content for IPFS');

      const cid = await heliaClient.upload(testData);
      expect(cid).toBeTruthy();
      expect(cid).toMatch(/^[a-z0-9]+$/i);

      const retrieved = await heliaClient.download(cid, { timeout: 30000 });
      expect(retrieved).toEqual(testData);
      expect(new TextDecoder().decode(retrieved)).toBe('Test content for IPFS');
    }, 60000);

    it('should handle large data uploads', async () => {
      const largeData = new Uint8Array(1024 * 100); // 100KB
      largeData.fill(42);

      const cid = await heliaClient.upload(largeData);
      const retrieved = await heliaClient.download(cid, { timeout: 30000 });

      expect(retrieved.length).toBe(largeData.length);
      expect(retrieved[0]).toBe(42);
    }, 60000);
  });

  describe('Vault Service Integration', () => {
    it('should create and unlock simple vault', async () => {
      const vaultService = new VaultService();
      const testContent = 'Secret vault content';

      const result = await vaultService.createVault({
        mode: 'simple',
        content: { simple: new TextEncoder().encode(testContent) },
        passphrase: '',
      });

      expect(result.vaultURL).toBeTruthy();
      expect(result.vaultURL).toContain('#');

      const unlocked = await vaultService.unlockVault({
        vaultURL: result.vaultURL,
        passphrase: '',
      });

      expect(new TextDecoder().decode(unlocked.content)).toBe(testContent);
      expect(unlocked.isDecoy).toBe(false);

      await vaultService.stop();
    }, 90000);

    it('should create and unlock duress vault with decoy', async () => {
      const vaultService = new VaultService();
      const decoyContent = 'Innocent content';
      const hiddenContent = 'Secret content';
      const passphrase = 'test-passphrase-123';

      const result = await vaultService.createVault({
        mode: 'duress',
        content: {
          decoy: new TextEncoder().encode(decoyContent),
          hidden: new TextEncoder().encode(hiddenContent),
        },
        passphrase,
      });

      expect(result.vaultURL).toBeTruthy();

      // Unlock without passphrase (decoy)
      const decoyUnlock = await vaultService.unlockVault({
        vaultURL: result.vaultURL,
        passphrase: '',
      });
      expect(new TextDecoder().decode(decoyUnlock.content)).toBe(decoyContent);
      expect(decoyUnlock.isDecoy).toBe(true);

      // Unlock with passphrase (hidden)
      const hiddenUnlock = await vaultService.unlockVault({
        vaultURL: result.vaultURL,
        passphrase,
      });
      expect(new TextDecoder().decode(hiddenUnlock.content)).toBe(hiddenContent);
      expect(hiddenUnlock.isDecoy).toBe(false);

      await vaultService.stop();
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should timeout on invalid CID', async () => {
      await expect(
        heliaClient.download('invalid-cid', { timeout: 5000 })
      ).rejects.toThrow();
    }, 10000);

    it('should handle network errors gracefully', async () => {
      const vaultService = new VaultService();
      
      await expect(
        vaultService.unlockVault({
          vaultURL: 'http://localhost/v#invalid',
          passphrase: '',
        })
      ).rejects.toThrow();

      await vaultService.stop();
    }, 10000);
  });

  describe('Performance', () => {
    it('should retrieve cached content faster on second attempt', async () => {
      const testData = new TextEncoder().encode('Performance test data');
      const cid = await heliaClient.upload(testData);

      const start1 = Date.now();
      await heliaClient.download(cid, { timeout: 30000 });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await heliaClient.download(cid, { timeout: 30000 });
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1);
    }, 90000);
  });
});
