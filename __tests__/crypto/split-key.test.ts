import { describe, it, expect } from 'vitest';
import {
  generateSplitKeys,
  encryptKeyB,
  decryptKeyB,
  serializeKeyB,
  deserializeKeyB,
  deriveMasterKey,
} from '../../lib/crypto/split-key';

describe('Split-Key Encryption', () => {
  describe('generateSplitKeys', () => {
    it('should generate two 32-byte keys and master key', async () => {
      const { keyA, keyB, masterKey } = await generateSplitKeys();

      expect(keyA).toHaveLength(32);
      expect(keyB).toHaveLength(32);
      expect(masterKey).toHaveLength(32);
    });

    it('should generate unique keys each time', async () => {
      const result1 = await generateSplitKeys();
      const result2 = await generateSplitKeys();

      expect(result1.keyA).not.toEqual(result2.keyA);
      expect(result1.keyB).not.toEqual(result2.keyB);
      expect(result1.masterKey).not.toEqual(result2.masterKey);
    });
  });

  describe('deriveMasterKey', () => {
    it('should derive same master key from same inputs', async () => {
      const keyA = new Uint8Array(32).fill(1);
      const keyB = new Uint8Array(32).fill(2);

      const master1 = await deriveMasterKey(keyA, keyB);
      const master2 = await deriveMasterKey(keyA, keyB);

      expect(master1).toEqual(master2);
    });

    it('should throw on invalid key lengths', async () => {
      const keyA = new Uint8Array(16);
      const keyB = new Uint8Array(32);

      await expect(deriveMasterKey(keyA, keyB)).rejects.toThrow('Both keys must be 32 bytes');
    });
  });

  describe('encryptKeyB / decryptKeyB', () => {
    it('should encrypt and decrypt KeyB', () => {
      const keyB = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';
      const serverSecret = 'test-secret';

      const encrypted = encryptKeyB(keyB, vaultId, serverSecret);
      const decrypted = decryptKeyB(encrypted.encrypted, encrypted.iv, vaultId, serverSecret);

      expect(decrypted).toEqual(keyB);
    });

    it('should fail with wrong vault ID', () => {
      const keyB = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';
      const serverSecret = 'test-secret';

      const encrypted = encryptKeyB(keyB, vaultId, serverSecret);

      expect(() => {
        decryptKeyB(encrypted.encrypted, encrypted.iv, 'wrong-vault-id', serverSecret);
      }).toThrow();
    });
  });

  describe('serializeKeyB / deserializeKeyB', () => {
    it('should serialize and deserialize encrypted KeyB', () => {
      const keyB = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';
      const serverSecret = 'test-secret';

      const encrypted = encryptKeyB(keyB, vaultId, serverSecret);
      const serialized = serializeKeyB(encrypted);
      const deserialized = deserializeKeyB(serialized);

      expect(deserialized.iv).toEqual(encrypted.iv);
      expect(deserialized.encrypted).toEqual(encrypted.encrypted);
    });
  });

  describe('End-to-End Split-Key Flow', () => {
    it('should complete full split-key cycle', async () => {
      const vaultId = 'test-vault-e2e';
      const serverSecret = 'test-secret';
      const { keyA, keyB, masterKey } = await generateSplitKeys();

      const encrypted = encryptKeyB(keyB, vaultId, serverSecret);
      const serialized = serializeKeyB(encrypted);

      const deserialized = deserializeKeyB(serialized);
      const decryptedKeyB = decryptKeyB(deserialized.encrypted, deserialized.iv, vaultId, serverSecret);
      const derivedMasterKey = await deriveMasterKey(keyA, decryptedKeyB);

      expect(derivedMasterKey).toEqual(masterKey);
    });
  });
});
