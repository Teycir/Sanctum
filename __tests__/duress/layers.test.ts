import { describe, it, expect } from 'vitest';
import { createHiddenVault, unlockHiddenVault, deriveLayerPassphrase } from '../../lib/duress/layers';
import { ARGON2_PROFILES } from '../../lib/crypto/constants';

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
    it('should create and unlock decoy layer', () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, '');
      expect(unlocked).toEqual(decoy);
    });

    it('should create and unlock hidden layer', () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, 'master-pass');
      expect(unlocked).toEqual(hidden);
    });

    it('should fail with wrong passphrase', () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'correct-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      expect(() => {
        unlockHiddenVault(result, 'wrong-pass');
      }).toThrow();
    });

    it('should handle empty decoy content', () => {
      const decoy = new Uint8Array(0);
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'master-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, '');
      expect(unlocked.length).toBe(0);
    });

    it('should unlock decoy with duress passphrase', () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'real-pass',
        duressPassphrase: 'duress-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, 'duress-pass');
      expect(unlocked).toEqual(decoy);
    });

    it('should unlock hidden with real passphrase when duress set', () => {
      const decoy = new TextEncoder().encode('innocent content');
      const hidden = new TextEncoder().encode('secret content');

      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: 'real-pass',
        duressPassphrase: 'duress-pass',
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, 'real-pass');
      expect(unlocked).toEqual(hidden);
    });
  });
});
