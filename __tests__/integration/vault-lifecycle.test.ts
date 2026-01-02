import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VaultService } from '@/lib/services/vault';
import { warmUpHelia, stopHelia } from '@/lib/helia/singleton';
import { getConnectionStatus } from '@/lib/helia/connection-monitor';

describe('End-to-End Vault Lifecycle', () => {
  beforeAll(async () => {
    warmUpHelia();
    // Wait for initial connection
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, 30000);

  afterAll(async () => {
    await stopHelia();
  });

  describe('Complete Vault Cycle', () => {
    it('should complete full cycle: create → store → retrieve → unlock', async () => {
      const vaultService = new VaultService();
      const originalContent = 'End-to-end test content';
      const passphrase = 'e2e-test-pass';

      // Step 1: Create vault
      const createResult = await vaultService.createVault({
        mode: 'simple',
        content: { simple: new TextEncoder().encode(originalContent) },
        passphrase,
      });

      expect(createResult.vaultURL).toBeTruthy();
      const vaultURL = createResult.vaultURL;

      // Step 2: Simulate page reload (new service instance)
      await vaultService.stop();
      const newVaultService = new VaultService();

      // Step 3: Unlock vault
      const unlockResult = await newVaultService.unlockVault({
        vaultURL,
        passphrase,
      });

      expect(new TextDecoder().decode(unlockResult.content)).toBe(originalContent);
      expect(unlockResult.isDecoy).toBe(false);

      await newVaultService.stop();
    }, 120000);

    it('should handle duress vault complete cycle', async () => {
      const vaultService = new VaultService();
      const decoy = 'Public information';
      const hidden = 'Sensitive data';
      const passphrase = 'duress-pass-123';

      // Create duress vault
      const { vaultURL } = await vaultService.createVault({
        mode: 'duress',
        content: {
          decoy: new TextEncoder().encode(decoy),
          hidden: new TextEncoder().encode(hidden),
        },
        passphrase,
      });

      await vaultService.stop();

      // Unlock decoy layer
      const decoyService = new VaultService();
      const decoyResult = await decoyService.unlockVault({
        vaultURL,
        passphrase: '',
      });
      expect(new TextDecoder().decode(decoyResult.content)).toBe(decoy);
      expect(decoyResult.isDecoy).toBe(true);
      await decoyService.stop();

      // Unlock hidden layer
      const hiddenService = new VaultService();
      const hiddenResult = await hiddenService.unlockVault({
        vaultURL,
        passphrase,
      });
      expect(new TextDecoder().decode(hiddenResult.content)).toBe(hidden);
      expect(hiddenResult.isDecoy).toBe(false);
      await hiddenService.stop();
    }, 180000);
  });

  describe('Connection Status Integration', () => {
    it('should track connection status during operations', async () => {
      const status = await getConnectionStatus();
      
      expect(status).toHaveProperty('peerCount');
      expect(status).toHaveProperty('connectionState');
      expect(status).toHaveProperty('isReady');
      expect(['connecting', 'degraded', 'connected', 'offline']).toContain(status.connectionState);
    }, 10000);

    it('should maintain connection across multiple operations', async () => {
      const vaultService = new VaultService();
      
      const status1 = await getConnectionStatus();
      const initialPeers = status1.peerCount;

      // Perform operation
      await vaultService.createVault({
        mode: 'simple',
        content: { simple: new TextEncoder().encode('test') },
        passphrase: '',
      });

      const status2 = await getConnectionStatus();
      
      // Connection should be maintained or improved
      expect(status2.peerCount).toBeGreaterThanOrEqual(initialPeers);

      await vaultService.stop();
    }, 90000);
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple vault creations concurrently', async () => {
      const vaultService = new VaultService();
      
      const promises = Array.from({ length: 3 }, (_, i) =>
        vaultService.createVault({
          mode: 'simple',
          content: { simple: new TextEncoder().encode(`Content ${i}`) },
          passphrase: '',
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.vaultURL).toBeTruthy();
      });

      // Verify all can be unlocked
      const unlockPromises = results.map(({ vaultURL }) =>
        vaultService.unlockVault({ vaultURL, passphrase: '' })
      );

      const unlocked = await Promise.all(unlockPromises);
      expect(unlocked).toHaveLength(3);

      await vaultService.stop();
    }, 180000);
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const vaultService = new VaultService();
      
      const { vaultURL } = await vaultService.createVault({
        mode: 'simple',
        content: { simple: new Uint8Array(0) },
        passphrase: '',
      });

      const result = await vaultService.unlockVault({
        vaultURL,
        passphrase: '',
      });

      expect(result.content.length).toBe(0);
      await vaultService.stop();
    }, 90000);

    it('should handle special characters in content', async () => {
      const vaultService = new VaultService();
      const specialContent = '🔒 Special chars: \n\t"quotes" & symbols!';
      
      const { vaultURL } = await vaultService.createVault({
        mode: 'simple',
        content: { simple: new TextEncoder().encode(specialContent) },
        passphrase: '',
      });

      const result = await vaultService.unlockVault({
        vaultURL,
        passphrase: '',
      });

      expect(new TextDecoder().decode(result.content)).toBe(specialContent);
      await vaultService.stop();
    }, 90000);

    it('should reject wrong passphrase for duress vault', async () => {
      const vaultService = new VaultService();
      const correctPass = 'correct-pass';
      
      const { vaultURL } = await vaultService.createVault({
        mode: 'duress',
        content: {
          decoy: new TextEncoder().encode('decoy'),
          hidden: new TextEncoder().encode('hidden'),
        },
        passphrase: correctPass,
      });

      // Wrong passphrase should return decoy
      const result = await vaultService.unlockVault({
        vaultURL,
        passphrase: 'wrong-pass',
      });

      expect(result.isDecoy).toBe(true);
      await vaultService.stop();
    }, 90000);
  });
});
