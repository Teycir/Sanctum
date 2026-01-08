import { describe, it, expect } from 'vitest';
import { createHiddenVault, unlockHiddenVault, deriveLayerPassphrase } from '../../lib/duress/layers';
import { TEST_ARGON2_PROFILE } from '../test-constants';

describe('hidden/vault', () => {
  describe('deriveLayerPassphrase', () => {
    it('should derive consistent layer passphrases', () => {
      const master = 'master-passphrase';
      const salt = new Uint8Array(32).fill(1);

      const layer1a = deriveLayerPassphrase(master, 1, salt);
      const layer1b = deriveLayerPassphrase(master, 1, salt);

      expect(layer1a).toBe(layer1b);
    });

    it('should derive different passphrases for different layers', () => {
      const master = 'master-passphrase';
      const salt = new Uint8Array(32).fill(1);

      const layer0 = deriveLayerPassphrase(master, 0, salt);
      const layer1 = deriveLayerPassphrase(master, 1, salt);

      expect(layer0).not.toBe(layer1);
    });
  });

  describe('createHiddenVault/unlockHiddenVault', () => {
    it('should create and unlock decoy layer', async () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass-12345',
        decoyPassphrase: 'decoy-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      const unlocked = await unlockHiddenVault(result, 'decoy-pass-12345');
      expect(unlocked.content).toEqual(decoy);
      expect(unlocked.isDecoy).toBe(true);
    });

    it('should create and unlock hidden layer', async () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass-12345',
        decoyPassphrase: 'decoy-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      const unlocked = await unlockHiddenVault(result, 'master-pass-12345');
      expect(unlocked.content).toEqual(hidden);
      expect(unlocked.isDecoy).toBe(false);
    });

    it('should fail with wrong passphrase', async () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'correct-pass-12345',
        decoyPassphrase: 'decoy-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      await expect(async () => {
        await unlockHiddenVault(result, 'wrong-pass-12345');
      }).rejects.toThrow();
    });

    it('should handle empty decoy content', async () => {
      const decoy = new Uint8Array(0);
      const hidden = new TextEncoder().encode('secret content');
      const decoyPassphrase = 'decoy-pass-12345';

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass-12345',
        decoyPassphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const unlocked = await unlockHiddenVault(result, decoyPassphrase);
      expect(unlocked.content.length).toBe(0);
      expect(unlocked.isDecoy).toBe(true);
    });

    it('should create hidden-only vault without decoy passphrase', async () => {
      const decoy = new Uint8Array(0);
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      // Should unlock hidden layer with master passphrase
      const unlocked = await unlockHiddenVault(result, 'master-pass-12345');
      expect(unlocked.content).toEqual(hidden);
      expect(unlocked.isDecoy).toBe(false);
    });

    it('should unlock decoy with duress passphrase', async () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'real-pass-12345',
        decoyPassphrase: 'duress-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      const unlocked = await unlockHiddenVault(result, 'duress-pass-12345');
      expect(unlocked.content).toEqual(decoy);
      expect(unlocked.isDecoy).toBe(true);
    });

    it('should unlock hidden with real passphrase when duress set', async () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'real-pass-12345',
        decoyPassphrase: 'duress-pass-12345',
        argonProfile: TEST_ARGON2_PROFILE
      });

      const unlocked = await unlockHiddenVault(result, 'real-pass-12345');
      expect(unlocked.content).toEqual(hidden);
      expect(unlocked.isDecoy).toBe(false);
    });
  });
});