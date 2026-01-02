// ============================================================================
// TEST UTILITIES
// ============================================================================

import { expect } from 'vitest';

// ============================================================================
// FIXTURES
// ============================================================================

export const TEST_DATA = {
  plaintext: new TextEncoder().encode('test data'),
  passphrase: 'correct horse battery staple',
  decoyContent: new TextEncoder().encode('decoy content'),
  hiddenContent: new TextEncoder().encode('hidden content'),
};

// ============================================================================
// ASSERTIONS
// ============================================================================

export function expectUint8Array(value: unknown): asserts value is Uint8Array {
  expect(value).toBeInstanceOf(Uint8Array);
}

export function expectValidCommitment(commitment: Uint8Array): void {
  expectUint8Array(commitment);
  expect(commitment.length).toBe(32); // SHA-256
}

export function expectValidNonce(nonce: Uint8Array): void {
  expectUint8Array(nonce);
  expect(nonce.length).toBe(24); // XChaCha20
}

// ============================================================================
// TIMING HELPERS
// ============================================================================

export async function measureTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

export function expectConstantTime(times: number[], tolerance = 0.1): void {
  const avg = times.reduce((a, b) => a + b) / times.length;
  const maxDeviation = Math.max(...times.map(t => Math.abs(t - avg) / avg));
  expect(maxDeviation).toBeLessThan(tolerance);
}

// ============================================================================
// MEMORY HELPERS
// ============================================================================

export function expectWiped(buffer: Uint8Array): void {
  expect(buffer.every(b => b === 0)).toBe(true);
}
