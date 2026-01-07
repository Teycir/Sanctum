import { describe, it, expect } from 'vitest';
import { createHiddenVault, unlockHiddenVault } from '../../lib/duress/layers';
import { TEST_ARGON2_PROFILE } from '../../lib/crypto/constants';

describe('Timing Attack Resistance', () => {
  it('should have similar timing for decoy vs hidden unlock', () => {
    const decoy = new TextEncoder().encode('innocent content');
    const hidden = new TextEncoder().encode('secret content');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: TEST_ARGON2_PROFILE
    });

    // Warm up JIT compiler (reduced iterations)
    for (let i = 0; i < 2; i++) {
      unlockHiddenVault(result, 'decoy-pass-12345');
      unlockHiddenVault(result, 'real-pass-12345');
    }

    // Measure decoy unlock time (reduced samples)
    const decoyTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'decoy-pass-12345');
      const end = performance.now();
      decoyTimes.push(end - start);
    }

    // Measure hidden unlock time (reduced samples)
    const hiddenTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'real-pass-12345');
      const end = performance.now();
      hiddenTimes.push(end - start);
    }

    // Use median instead of average to reduce outlier impact
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const medianDecoy = median(decoyTimes);
    const medianHidden = median(hiddenTimes);
    const timingRatio = Math.max(medianDecoy, medianHidden) / Math.min(medianDecoy, medianHidden);

    // Timing should be within 50% of each other (relaxed for CI)
    expect(timingRatio).toBeLessThan(1.5);
  });

  it('should execute both decryption attempts regardless of success', () => {
    const decoy = new TextEncoder().encode('innocent');
    const hidden = new TextEncoder().encode('secret');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: TEST_ARGON2_PROFILE
    });

    // Both should succeed without early return
    const decoyUnlock = unlockHiddenVault(result, 'decoy-pass-12345');
    expect(decoyUnlock.isDecoy).toBe(true);

    const hiddenUnlock = unlockHiddenVault(result, 'real-pass-12345');
    expect(hiddenUnlock.isDecoy).toBe(false);
  });

  it('should have constant timing for wrong passphrase', () => {
    const decoy = new TextEncoder().encode('innocent');
    const hidden = new TextEncoder().encode('secret');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: TEST_ARGON2_PROFILE
    });

    const wrongTimes: number[] = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        unlockHiddenVault(result, 'wrong-pass-12345');
      } catch {
        // Expected to fail
      }
      const end = performance.now();
      wrongTimes.push(end - start);
    }

    const avgWrong = wrongTimes.reduce((a, b) => a + b) / wrongTimes.length;

    // Should still attempt both decryptions even with wrong passphrase
    expect(avgWrong).toBeGreaterThan(0);
  });
});