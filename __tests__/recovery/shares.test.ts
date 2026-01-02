// ============================================================================
// SHARE ENCODING TESTS
// ============================================================================

import { describe, it, expect } from 'vitest';
import { encodeShare, decodeShare, parseShare } from '@/lib/recovery/shares';

describe('recovery/shares', () => {
  describe('encodeShare', () => {
    it('should encode share with metadata', () => {
      const share = {
        id: 1,
        data: '801d8e171d3933d0367fadc438a9f97aaba'
      };
      
      const encoded = encodeShare(share, 2, 3, 'vault-123');
      
      expect(encoded).toMatch(/^SANCTUM-SHARE-/);
      expect(encoded.length).toBeGreaterThan(20);
    });

    it('should include threshold and total in encoding', () => {
      const share = { id: 1, data: '801234' };
      const encoded = encodeShare(share, 3, 5, 'vault-abc');
      
      const decoded = decodeShare(encoded);
      expect(decoded.threshold).toBe(3);
      expect(decoded.total).toBe(5);
      expect(decoded.vaultId).toBe('vault-abc');
    });
  });

  describe('decodeShare', () => {
    it('should decode valid share', () => {
      const original = { id: 2, data: '802abc' };
      const encoded = encodeShare(original, 2, 3, 'test-vault');
      const decoded = decodeShare(encoded);
      
      expect(decoded.share.id).toBe(2);
      expect(decoded.share.data).toBe('802abc');
      expect(decoded.threshold).toBe(2);
      expect(decoded.total).toBe(3);
      expect(decoded.vaultId).toBe('test-vault');
    });

    it('should throw on invalid format', () => {
      expect(() => decodeShare('invalid')).toThrow();
      expect(() => decodeShare('SANCTUM-SHARE-!!!')).toThrow();
    });
  });

  describe('parseShare', () => {
    it('should parse share from text', () => {
      const share = { id: 1, data: '801234' };
      const encoded = encodeShare(share, 2, 3, 'vault-xyz');
      const text = `Here is your share:\n${encoded}\nKeep it safe!`;
      
      const parsed = parseShare(text);
      expect(parsed).toBe(encoded);
    });

    it('should return null if no share found', () => {
      expect(parseShare('no share here')).toBeNull();
    });
  });
});
