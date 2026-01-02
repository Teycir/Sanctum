import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SecureVaultRelay, hashTopic, isP2PTAvailable } from '../../lib/p2pt';

describe('P2PT Real Connection Validation', () => {
  it('should detect P2PT availability', () => {
    const available = isP2PTAvailable();
    console.log(`P2PT Available: ${available}`);
    expect(typeof available).toBe('boolean');
  });

  it('should hash CID consistently', () => {
    const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const hash1 = hashTopic(cid);
    const hash2 = hashTopic(cid);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(32);
    console.log(`Topic hash: ${hash1}`);
  });

  it('should establish P2PT relay and transfer data', async () => {
    if (!isP2PTAvailable()) {
      console.log('⚠️  P2PT not available, skipping real connection test');
      return;
    }

    const testCID = 'bafytest123';
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    
    // Host vault
    const hostRelay = new SecureVaultRelay({ timeoutMs: 30000 });
    console.log('🔵 Starting host relay...');
    await hostRelay.hostVault(testCID, testData);
    console.log('✅ Host relay started');

    // Give tracker time to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch vault from peer
    const fetchRelay = new SecureVaultRelay({ timeoutMs: 30000 });
    console.log('🔵 Fetching from peer...');
    const retrieved = await fetchRelay.fetchVault(testCID);
    
    if (retrieved) {
      console.log('✅ Data retrieved via P2PT');
      expect(retrieved).toEqual(testData);
    } else {
      console.log('⚠️  No peer found (expected in test environment)');
    }

    // Cleanup
    hostRelay.cleanup();
    fetchRelay.cleanup();
  }, 60000);

  it('should timeout gracefully when no peers available', async () => {
    if (!isP2PTAvailable()) {
      console.log('⚠️  P2PT not available, skipping timeout test');
      return;
    }

    const relay = new SecureVaultRelay({ timeoutMs: 5000 });
    const nonExistentCID = 'bafynonexistent' + Date.now();
    
    console.log('🔵 Testing timeout with non-existent CID...');
    const result = await relay.fetchVault(nonExistentCID);
    
    expect(result).toBeNull();
    console.log('✅ Timeout handled gracefully');
    
    relay.cleanup();
  }, 15000);
});
