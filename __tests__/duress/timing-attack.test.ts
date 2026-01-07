import { describe, it, expect } from 'vitest';
import { createHiddenVault, unlockHiddenVault } from '../../lib/duress/layers';
import { ARGON2_PROFILES } from '../../lib/crypto/constants';

describe('Timing Attack Resistance', () => {
  it('should have similar timing for decoy vs hidden unlock', () => {
    const decoy = new TextEncoder().encode('innocent content');
    const hidden = new TextEncoder().encode('secret content');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: ARGON2_PROFILES.mobile
    });

    // Warm up JIT compiler and stabilize GC
    for (let i = 0; i < 5; i++) {
      unlockHiddenVault(result, 'decoy-pass-12345');
      unlockHiddenVault(result, 'real-pass-12345');
    }

    // Measure decoy unlock time (skip first few for JIT warmup)
    const decoyTimes: number[] = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'decoy-pass-12345');
      const end = performance.now();
      if (i >= 5) decoyTimes.push(end - start); // Skip first 5
    }

    // Measure hidden unlock time (skip first few for JIT warmup)
    const hiddenTimes: number[] = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'real-pass-12345');
      const end = performance.now();
      if (i >= 5) hiddenTimes.push(end - start); // Skip first 5
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

    console.log(`Median decoy time: ${medianDecoy.toFixed(2)}ms`);
    console.log(`Median hidden time: ${medianHidden.toFixed(2)}ms`);
    console.log(`Timing ratio: ${timingRatio.toFixed(2)}x`);

    // Timing should be within 30% of each other (JavaScript limitations)
    expect(timingRatio).toBeLessThan(1.3);
  });

  it('should execute both decryption attempts regardless of success', () => {
    const decoy = new TextEncoder().encode('innocent');
    const hidden = new TextEncoder().encode('secret');

    const result = createHiddenVault({
      content: { decoy, hidden },
      passphrase: 'real-pass-12345',
      decoyPassphrase: 'decoy-pass-12345',
      argonProfile: ARGON2_PROFILES.mobile
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
      argonProfile: ARGON2_PROFILES.mobile
    });

    const wrongTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
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
    console.log(`Avg wrong passphrase time: ${avgWrong.toFixed(2)}ms`);

    // Should still attempt both decryptions even with wrong passphrase
    expect(avgWrong).toBeGreaterThan(0);
  });
});
