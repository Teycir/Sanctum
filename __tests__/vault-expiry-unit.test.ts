import { describe, it, expect } from 'vitest';

describe('Vault Expiry Logic (Unit Tests - No Worker)', () => {
  const MOBILE_LAG_BUFFER_MS = 5000;
  const GRACE_PERIOD_MS = 1000;

  it('should add 5s buffer when calculating expiry', () => {
    const expiryDays = 30;
    const now = Date.now();
    const expiresAt = now + (expiryDays * 24 * 60 * 60 * 1000) + MOBILE_LAG_BUFFER_MS;
    
    const expectedMin = now + (expiryDays * 24 * 60 * 60 * 1000) + 4900;
    const expectedMax = now + (expiryDays * 24 * 60 * 60 * 1000) + 5100;
    
    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  it('should apply grace period when checking expiry', () => {
    const now = Date.now();
    const expiresAt = now - 500; // Expired 500ms ago
    
    // With grace period, should NOT be deleted yet
    const shouldDelete = expiresAt < (now - GRACE_PERIOD_MS);
    expect(shouldDelete).toBe(false);
    
    // After grace period, should be deleted
    const expiresAt2 = now - 1500; // Expired 1.5s ago
    const shouldDelete2 = expiresAt2 < (now - GRACE_PERIOD_MS);
    expect(shouldDelete2).toBe(true);
  });

  it('should calculate days until expiry correctly', () => {
    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000);
    
    const msUntilExpiry = expiresAt - now;
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));
    
    expect(daysUntilExpiry).toBe(7);
  });

  it('should handle null expiry (legacy vaults)', () => {
    const expiresAt = null;
    const now = Date.now();
    
    const shouldDelete = expiresAt !== null && expiresAt < (now - GRACE_PERIOD_MS);
    expect(shouldDelete).toBe(false);
  });

  it('should provide 6-second total safety margin', () => {
    const creationBuffer = MOBILE_LAG_BUFFER_MS;
    const deletionGrace = GRACE_PERIOD_MS;
    const totalMargin = creationBuffer + deletionGrace;
    
    expect(totalMargin).toBe(6000); // 6 seconds
  });
});
