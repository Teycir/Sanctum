import { describe, it, expect } from 'vitest';
import { encodeVaultState, decodeVaultState, createVaultUrl, parseVaultUrl } from '../../lib/url/state';

describe('url/state', () => {
  describe('encodeVaultState/decodeVaultState', () => {
    it('should encode and decode vault state', () => {
      const state = {
        cid: 'QmTest123',
        mode: 'simple' as const
      };

      const encoded = encodeVaultState(state);
      const decoded = decodeVaultState(encoded);

      expect(decoded).toEqual(state);
    });

    it('should handle metadata', () => {
      const state = {
        cid: 'QmTest456',
        mode: 'hidden' as const,
        metadata: { key: 'value' }
      };

      const encoded = encodeVaultState(state);
      const decoded = decodeVaultState(encoded);

      expect(decoded).toEqual(state);
    });

    it('should throw on invalid state', () => {
      expect(() => decodeVaultState('invalid')).toThrow();
    });
  });

  describe('createVaultUrl/parseVaultUrl', () => {
    it('should create and parse vault URL', () => {
      const state = {
        cid: 'QmTest789',
        mode: 'chain' as const
      };

      const url = createVaultUrl('https://example.com/vault', state);
      const parsed = parseVaultUrl(url);

      expect(parsed).toEqual(state);
    });

    it('should throw on URL without hash', () => {
      expect(() => parseVaultUrl('https://example.com/vault')).toThrow();
    });
  });
});
