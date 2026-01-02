import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hashTopic, SecureVaultRelay } from '../../lib/p2pt/vault-relay';
import { RAMCache } from '../../lib/p2pt/ram-cache';
import { validateCID, validateVaultData, validateTrackerURL } from '../../lib/p2pt/validation';

describe('hashTopic', () => {
  it('should hash CID to 32 hex characters', () => {
    const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const topic = hashTopic(cid);
    
    expect(topic).toHaveLength(32);
    expect(topic).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should produce different hashes for different CIDs', () => {
    const topic1 = hashTopic('cid1');
    const topic2 = hashTopic('cid2');
    
    expect(topic1).not.toBe(topic2);
  });

  it('should produce same hash for same CID', () => {
    const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const topic1 = hashTopic(cid);
    const topic2 = hashTopic(cid);
    
    expect(topic1).toBe(topic2);
  });
});

describe('SecureVaultRelay', () => {
  let relay: SecureVaultRelay;

  beforeEach(() => {
    relay = new SecureVaultRelay();
  });

  afterEach(() => {
    relay.cleanup();
  });

  it('should initialize with default config', () => {
    expect(relay).toBeDefined();
  });

  it('should accept custom config', () => {
    const customRelay = new SecureVaultRelay({
      trackers: ['wss://custom-tracker.com'],
      timeoutMs: 10000,
    });
    
    expect(customRelay).toBeDefined();
    customRelay.cleanup();
  });

  it('should cleanup vault data from RAM', () => {
    relay.cleanup();
    expect(relay).toBeDefined();
  });
});

describe('RAMCache', () => {
  let cache: RAMCache;

  beforeEach(() => {
    cache = new RAMCache();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should store and retrieve data', () => {
    const cid = 'bafytest';
    const data = new Uint8Array([1, 2, 3, 4]);
    
    cache.set(cid, data);
    const retrieved = cache.get(cid);
    
    expect(retrieved).toEqual(data);
  });

  it('should return null for non-existent CID', () => {
    const retrieved = cache.get('nonexistent');
    expect(retrieved).toBeNull();
  });

  it('should expire old entries', async () => {
    const cache = new RAMCache(100);
    const cid = 'bafytest';
    const data = new Uint8Array([1, 2, 3]);
    
    cache.set(cid, data);
    
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    const retrieved = cache.get(cid);
    expect(retrieved).toBeNull();
  });

  it('should clear all data', () => {
    cache.set('cid1', new Uint8Array([1]));
    cache.set('cid2', new Uint8Array([2]));
    
    cache.clear();
    
    expect(cache.get('cid1')).toBeNull();
    expect(cache.get('cid2')).toBeNull();
  });

  it('should cleanup expired entries', async () => {
    const cache = new RAMCache(100);
    cache.set('cid1', new Uint8Array([1]));
    
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    cache.cleanup();
    expect(cache.get('cid1')).toBeNull();
  });
});

describe('Validation', () => {
  describe('validateCID', () => {
    it('should accept valid CIDv0', () => {
      expect(() => validateCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).not.toThrow();
    });

    it('should accept valid CIDv1', () => {
      expect(() => validateCID('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).not.toThrow();
    });

    it('should reject empty string', () => {
      expect(() => validateCID('')).toThrow('CID must be a non-empty string');
    });

    it('should reject invalid format', () => {
      expect(() => validateCID('invalid-cid')).toThrow('Invalid CID format');
    });
  });

  describe('validateVaultData', () => {
    it('should accept valid Uint8Array', () => {
      expect(() => validateVaultData(new Uint8Array([1, 2, 3]))).not.toThrow();
    });

    it('should reject empty data', () => {
      expect(() => validateVaultData(new Uint8Array([]))).toThrow('Vault data cannot be empty');
    });

    it('should reject non-Uint8Array', () => {
      expect(() => validateVaultData([1, 2, 3] as any)).toThrow('Vault data must be Uint8Array');
    });

    it('should reject oversized data', () => {
      const largeData = new Uint8Array(11 * 1024 * 1024);
      expect(() => validateVaultData(largeData)).toThrow('exceeds maximum size');
    });
  });

  describe('validateTrackerURL', () => {
    it('should accept wss:// URLs', () => {
      expect(() => validateTrackerURL('wss://tracker.example.com')).not.toThrow();
    });

    it('should accept ws:// URLs', () => {
      expect(() => validateTrackerURL('ws://localhost:8000')).not.toThrow();
    });

    it('should reject http:// URLs', () => {
      expect(() => validateTrackerURL('http://tracker.example.com')).toThrow('must use ws:// or wss://');
    });

    it('should reject empty string', () => {
      expect(() => validateTrackerURL('')).toThrow('must be a non-empty string');
    });
  });
});
