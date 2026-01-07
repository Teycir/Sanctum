import { describe, it, expect } from 'vitest';
import { serializeVaultMetadata, deserializeVaultMetadata } from '../../lib/storage/vault';

describe('storage/vault', () => {
  describe('serializeVaultMetadata/deserializeVaultMetadata', () => {
    it('should serialize and deserialize vault metadata', () => {
      const stored = {
        decoyCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        hiddenCID: 'bafybeihkoviema5eqheudqvnu5xsx5qzhs4e5qjxh5qxqzqzqzqzqzqzqz',
        salt: new Uint8Array(32).fill(42),
        provider: 'pinata' as const
      };

      const serialized = serializeVaultMetadata(stored);
      const deserialized = deserializeVaultMetadata(serialized);

      expect(deserialized.decoyCID).toBe(stored.decoyCID);
      expect(deserialized.hiddenCID).toBe(stored.hiddenCID);
      expect(deserialized.salt).toEqual(stored.salt);
    });

    it('should handle different CID lengths', () => {
      const stored = {
        decoyCID: 'Qm',
        hiddenCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        salt: new Uint8Array(32).fill(1),
        provider: 'filebase' as const
      };

      const serialized = serializeVaultMetadata(stored);
      const deserialized = deserializeVaultMetadata(serialized);

      expect(deserialized.decoyCID).toBe(stored.decoyCID);
      expect(deserialized.hiddenCID).toBe(stored.hiddenCID);
    });
  });
});
