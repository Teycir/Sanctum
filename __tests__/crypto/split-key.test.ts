import { describe, it, expect } from 'vitest';
import {
  generateSplitKeys,
  encryptKeyA,
  decryptKeyA,
  serializeKeyA,
  deserializeKeyA,
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

  describe('encryptKeyA / decryptKeyA', () => {
    it('should encrypt and decrypt Key A', () => {
      const keyA = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';

      const encrypted = encryptKeyA(keyA, vaultId);
      const decrypted = decryptKeyA(encrypted.encrypted, encrypted.nonce, vaultId);

      expect(decrypted).toEqual(keyA);
    });

    it('should fail with wrong vault ID', () => {
      const keyA = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';

      const encrypted = encryptKeyA(keyA, vaultId);

      expect(() => {
        decryptKeyA(encrypted.encrypted, encrypted.nonce, 'wrong-vault-id');
      }).toThrow();
    });
  });

  describe('serializeKeyA / deserializeKeyA', () => {
    it('should serialize and deserialize encrypted Key A', () => {
      const keyA = new Uint8Array(32).fill(42);
      const vaultId = 'test-vault-123';

      const encrypted = encryptKeyA(keyA, vaultId);
      const serialized = serializeKeyA(encrypted);
      const deserialized = deserializeKeyA(serialized);

      expect(deserialized.nonce).toEqual(encrypted.nonce);
      expect(deserialized.encrypted).toEqual(encrypted.encrypted);
    });
  });

  describe('End-to-End Split-Key Flow', () => {
    it('should complete full split-key cycle', async () => {
      const vaultId = 'test-vault-e2e';
      const { keyA, keyB, masterKey } = await generateSplitKeys();

      const encrypted = encryptKeyA(keyA, vaultId);
      const serialized = serializeKeyA(encrypted);

      const deserialized = deserializeKeyA(serialized);
      const decryptedKeyA = decryptKeyA(deserialized.encrypted, deserialized.nonce, vaultId);
      const derivedMasterKey = await deriveMasterKey(decryptedKeyA, keyB);

      expect(derivedMasterKey).toEqual(masterKey);
    });
  });
});
