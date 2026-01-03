import { describe, it, expect, beforeAll } from 'vitest';
import { VaultService } from '@/lib/services/vault';
import { uploadToIPFS } from '@/lib/storage/uploader';
import type { UploadCredentials } from '@/lib/storage/uploader';

describe('IPFS Storage Integration Tests', () => {
  let credentials: UploadCredentials;

  beforeAll(() => {
    // Mock credentials for testing
    credentials = {
      provider: 'pinata',
      pinataJWT: process.env.PINATA_JWT || 'test-jwt'
    };
  });

  describe('Basic Upload/Download Cycle', () => {
    it('should upload data via IPFS', async () => {
      const testData = new TextEncoder().encode('Test content for IPFS');

      const result = await uploadToIPFS(testData, credentials);
      expect(result.cid).toBeTruthy();
      expect(result.cid).toMatch(/^[a-z0-9]+$/i);
    }, 60000);

    it('should handle large data uploads', async () => {
      const largeData = new Uint8Array(1024 * 100); // 100KB
      largeData.fill(42);

      const result = await uploadToIPFS(largeData, credentials);
      expect(result.cid).toBeTruthy();
    }, 60000);
  });

  describe('Vault Service Integration', () => {
    it('should create and unlock vault with decoy only', async () => {
      const vaultService = new VaultService();
      const testContent = 'Secret vault content';

      const result = await vaultService.createVault({
        decoyContent: new TextEncoder().encode(testContent),
        hiddenContent: new Uint8Array(0),
        passphrase: '',
        ipfsCredentials: credentials,
      });

      expect(result.vaultURL).toBeTruthy();
      expect(result.vaultURL).toContain('#');

      const unlocked = await vaultService.unlockVault({
        vaultURL: result.vaultURL,
        passphrase: '',
      });

      expect(new TextDecoder().decode(unlocked.content)).toBe(testContent);
      expect(unlocked.isDecoy).toBe(true);

      await vaultService.stop();
    }, 90000);

    it('should create and unlock duress vault with decoy', async () => {
      const vaultService = new VaultService();
      const decoyContent = 'Innocent content';
      const hiddenContent = 'Secret content';
      const passphrase = 'test-passphrase-123';

      const result = await vaultService.createVault({
        decoyContent: new TextEncoder().encode(decoyContent),
        hiddenContent: new TextEncoder().encode(hiddenContent),
        passphrase,
        ipfsCredentials: credentials,
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
    it('should reject invalid vault URL', async () => {
      const vaultService = new VaultService();
      
      await expect(
        vaultService.unlockVault({
          vaultURL: 'invalid-url',
          passphrase: '',
        })
      ).rejects.toThrow();

      await vaultService.stop();
    }, 10000);

    it('should handle network errors gracefully', async () => {
      const vaultService = new VaultService();
      
      await expect(
        vaultService.unlockVault({
          vaultURL: 'http://localhost/vault#invalid',
          passphrase: '',
        })
      ).rejects.toThrow();

      await vaultService.stop();
    }, 10000);
  });

  describe('Performance', () => {
    it('should create vault within reasonable time', async () => {
      const vaultService = new VaultService();
      const testData = new TextEncoder().encode('Performance test data');

      const start = Date.now();
      const result = await vaultService.createVault({
        decoyContent: testData,
        hiddenContent: new Uint8Array(0),
        passphrase: '',
        ipfsCredentials: credentials,
      });
      const elapsed = Date.now() - start;

      expect(result.vaultURL).toBeTruthy();
      expect(elapsed).toBeLessThan(60000); // Should complete within 60s

      await vaultService.stop();
    }, 90000);
  });
});
