// ============================================================================
// SHAMIR SECRET SHARING TESTS
// ============================================================================

import { describe, it, expect } from 'vitest';
import { split, combine } from '@/lib/recovery/shamir';
import { TEST_DATA } from '../utils';

describe('shamir', () => {
  describe('split', () => {
    it('should split secret into shares', () => {
      const shares = split(TEST_DATA.plaintext, { threshold: 2, shares: 3 });
      
      expect(shares).toHaveLength(3);
      expect(shares[0].id).toBe(1);
      expect(shares[1].id).toBe(2);
      expect(shares[2].id).toBe(3);
      expect(shares[0].data).toBeTypeOf('string');
    });

    it('should throw on invalid threshold', () => {
      expect(() => split(TEST_DATA.plaintext, { threshold: 1, shares: 3 }))
        .toThrow('Invalid threshold');
      expect(() => split(TEST_DATA.plaintext, { threshold: 4, shares: 3 }))
        .toThrow('Invalid threshold');
    });

    it('should throw on too many shares', () => {
      expect(() => split(TEST_DATA.plaintext, { threshold: 2, shares: 256 }))
        .toThrow('Maximum 255 shares');
    });
  });

  describe('combine', () => {
    it('should recover secret from threshold shares', () => {
      const shares = split(TEST_DATA.plaintext, { threshold: 2, shares: 3 });
      const recovered = combine([shares[0], shares[1]]);
      
      expect(recovered).toEqual(TEST_DATA.plaintext);
    });

    it('should recover from any threshold combination', () => {
      const shares = split(TEST_DATA.plaintext, { threshold: 2, shares: 4 });
      
      expect(combine([shares[0], shares[1]])).toEqual(TEST_DATA.plaintext);
      expect(combine([shares[0], shares[2]])).toEqual(TEST_DATA.plaintext);
      expect(combine([shares[1], shares[3]])).toEqual(TEST_DATA.plaintext);
    });

    it('should throw on insufficient shares', () => {
      const shares = split(TEST_DATA.plaintext, { threshold: 3, shares: 5 });
      
      expect(() => combine([shares[0]])).toThrow('Need at least 2 shares');
    });

    it('should handle large secrets', () => {
      const large = new Uint8Array(1024).fill(42);
      const shares = split(large, { threshold: 3, shares: 5 });
      const recovered = combine([shares[0], shares[2], shares[4]]);
      
      expect(recovered).toEqual(large);
    });
  });
});
