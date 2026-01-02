import { describe, it, expect } from 'vitest';
import {
  VAULT_VERSION,
  BLOB_SIZES,
  ARGON2_PROFILES,
  SIZE_CLASSES,
  MAX_VAULT_SIZE,
  HKDF_CONTEXTS,
  TIMING,
  VAULT_MODES
} from '@/lib/crypto/constants';

describe('crypto/constants', () => {
  describe('VAULT_VERSION', () => {
    it('should be version 3', () => {
      expect(VAULT_VERSION).toBe(0x03);
    });
  });

  describe('BLOB_SIZES', () => {
    it('should have correct header size', () => {
      expect(BLOB_SIZES.header).toBe(9);
    });

    it('should have correct salt size', () => {
      expect(BLOB_SIZES.salt).toBe(32);
    });

    it('should have correct nonce size for XChaCha20', () => {
      expect(BLOB_SIZES.nonce).toBe(24);
    });

    it('should have correct commitment size', () => {
      expect(BLOB_SIZES.commitment).toBe(32);
    });

    it('should have correct auth tag size for Poly1305', () => {
      expect(BLOB_SIZES.authTag).toBe(16);
    });
  });

  describe('ARGON2_PROFILES', () => {
    it('should have mobile profile with 64 MB memory', () => {
      expect(ARGON2_PROFILES.mobile.m).toBe(65536);
      expect(ARGON2_PROFILES.mobile.t).toBe(3);
      expect(ARGON2_PROFILES.mobile.p).toBe(1);
      expect(ARGON2_PROFILES.mobile.dkLen).toBe(32);
    });

    it('should have desktop profile with 256 MB memory', () => {
      expect(ARGON2_PROFILES.desktop.m).toBe(262144);
      expect(ARGON2_PROFILES.desktop.t).toBe(3);
      expect(ARGON2_PROFILES.desktop.p).toBe(2);
      expect(ARGON2_PROFILES.desktop.dkLen).toBe(32);
    });

    it('should have paranoid profile with 1 GB memory', () => {
      expect(ARGON2_PROFILES.paranoid.m).toBe(1048576);
      expect(ARGON2_PROFILES.paranoid.t).toBe(4);
      expect(ARGON2_PROFILES.paranoid.p).toBe(4);
      expect(ARGON2_PROFILES.paranoid.dkLen).toBe(32);
    });
  });

  describe('SIZE_CLASSES', () => {
    it('should have 8 size classes', () => {
      expect(SIZE_CLASSES.length).toBe(8);
    });

    it('should start at 1 KB', () => {
      expect(SIZE_CLASSES[0]).toBe(1024);
    });

    it('should end at 16 MB', () => {
      expect(SIZE_CLASSES[7]).toBe(16 * 1024 * 1024);
    });

    it('should be powers of 4', () => {
      for (let i = 1; i < SIZE_CLASSES.length; i++) {
        expect(SIZE_CLASSES[i]).toBe(SIZE_CLASSES[i - 1] * 4);
      }
    });
  });

  describe('MAX_VAULT_SIZE', () => {
    it('should be 16 MB', () => {
      expect(MAX_VAULT_SIZE).toBe(16 * 1024 * 1024);
    });
  });

  describe('HKDF_CONTEXTS', () => {
    it('should have unique context strings', () => {
      const contexts = Object.values(HKDF_CONTEXTS);
      const uniqueContexts = new Set(contexts);
      expect(uniqueContexts.size).toBe(contexts.length);
    });

    it('should include version in context strings', () => {
      expect(HKDF_CONTEXTS.encryption).toContain('v3');
      expect(HKDF_CONTEXTS.commitment).toContain('v3');
      expect(HKDF_CONTEXTS.layerDerivation).toContain('v3');
    });
  });

  describe('TIMING', () => {
    it('should have idle timeout of 60 seconds', () => {
      expect(TIMING.idleTimeout).toBe(60_000);
    });

    it('should have hidden timeout less than idle timeout', () => {
      expect(TIMING.hiddenTimeout).toBeLessThan(TIMING.idleTimeout);
    });
  });

  describe('VAULT_MODES', () => {
    it('should have unique mode values', () => {
      const modes = Object.values(VAULT_MODES);
      const uniqueModes = new Set(modes);
      expect(uniqueModes.size).toBe(modes.length);
    });
  });
});
