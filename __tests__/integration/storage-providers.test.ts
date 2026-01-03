// ============================================================================
// STORAGE PROVIDERS INTEGRATION TESTS
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { PinataClient } from '../../lib/storage/pinata';

describe('Storage Providers Integration', () => {
  const testData = new TextEncoder().encode('Test vault data for integration');

  describe('Pinata', () => {
    let pinataJWT: string;

    beforeAll(() => {
      pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
      if (!pinataJWT) {
        throw new Error('NEXT_PUBLIC_PINATA_JWT not found in environment');
      }
    });

    it('should upload to Pinata and return CID', async () => {
      const client = new PinataClient(pinataJWT);
      const cid = await client.upload(testData);
      
      expect(cid).toBeTruthy();
      expect(typeof cid).toBe('string');
      expect(cid.length).toBeGreaterThan(0);
    }, 30000);
  });
});
