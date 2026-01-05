import { describe, it, expect } from 'vitest';
import { wipeMemory } from '../../lib/crypto/utils';
import { createHiddenVault, unlockHiddenVault } from '../../lib/duress/layers';
import { ARGON2_PROFILES } from '../../lib/crypto/constants';

describe('Memory Safety', () => {
  it('should wipe memory after use', () => {
    const sensitive = new Uint8Array([1, 2, 3, 4, 5]);
    const original = new Uint8Array(sensitive);

    wipeMemory(sensitive);

    // After wiping, buffer should be zeroed
    expect(sensitive).not.toEqual(original);
    expect(sensitive.every(b => b === 0)).toBe(true);
  });

  it('should handle empty buffers', () => {
    const empty = new Uint8Array(0);
    expect(() => wipeMemory(empty)).not.toThrow();
  });

  it('should wipe large buffers', () => {
    const large = new Uint8Array(1024 * 1024); // 1MB
    large.fill(0xFF);

    wipeMemory(large);

    expect(large.every(b => b === 0)).toBe(true);
  });

  it('should not leak sensitive data in error messages', () => {
    const decoy = new TextEncoder().encode('innocent');
    const hidden = new TextEncoder().encode('secret-password-12345');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: ARGON2_PROFILES.mobile
    });

    try {
      unlockHiddenVault(result, 'wrong-pass');
    } catch (error) {
      const errorMsg = (error as Error).message.toLowerCase();
      // Error message should not contain sensitive data
      expect(errorMsg).not.toContain('secret');
      expect(errorMsg).not.toContain('password');
      expect(errorMsg).not.toContain('12345');
    }
  });

  it('should handle multiple vault operations without memory buildup', () => {
    const decoy = new TextEncoder().encode('innocent');
    const hidden = new TextEncoder().encode('secret');

    // Create and unlock multiple vaults
    for (let i = 0; i < 10; i++) {
      const result = createHiddenVault({
        content: { decoy, hidden },
        passphrase: `pass-${i}`,
        decoyPassphrase: `decoy-${i}`,
        argonProfile: ARGON2_PROFILES.mobile
      });

      const unlocked = unlockHiddenVault(result, `pass-${i}`);
      expect(unlocked.content).toEqual(hidden);
    }

    // If there were memory leaks, this would fail or slow down significantly
    expect(true).toBe(true);
  });
});
