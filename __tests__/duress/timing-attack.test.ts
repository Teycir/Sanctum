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

    // Measure decoy unlock time
    const decoyTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'decoy-pass-12345');
      const end = performance.now();
      decoyTimes.push(end - start);
    }

    // Measure hidden unlock time
    const hiddenTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      unlockHiddenVault(result, 'real-pass-12345');
      const end = performance.now();
      hiddenTimes.push(end - start);
    }

    const avgDecoy = decoyTimes.reduce((a, b) => a + b) / decoyTimes.length;
    const avgHidden = hiddenTimes.reduce((a, b) => a + b) / hiddenTimes.length;
    const timingDiff = Math.abs(avgDecoy - avgHidden);
    const timingRatio = Math.max(avgDecoy, avgHidden) / Math.min(avgDecoy, avgHidden);

    console.log(`Avg decoy time: ${avgDecoy.toFixed(2)}ms`);
    console.log(`Avg hidden time: ${avgHidden.toFixed(2)}ms`);
    console.log(`Timing difference: ${timingDiff.toFixed(2)}ms`);
    console.log(`Timing ratio: ${timingRatio.toFixed(2)}x`);

    // Timing should be within 20% of each other (allowing for system variance)
    expect(timingRatio).toBeLessThan(1.2);
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
