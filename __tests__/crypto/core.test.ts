import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateSyntheticNonce } from '../../lib/crypto/core';
import { deriveKeys } from '../../lib/crypto/kdf';
import { assembleBlob } from '../../lib/crypto/padding';
import { TEST_ARGON2_PROFILE } from '../test-constants';
import { selectVaultSize } from '../../lib/crypto/utils';

describe('crypto/core', () => {
  describe('deriveKeys', () => {
    it('should derive consistent keys from same inputs', () => {
      const passphrase = 'test-passphrase';
      const salt = new Uint8Array(32).fill(1);

      const result1 = deriveKeys(passphrase, salt, TEST_ARGON2_PROFILE);
      const result2 = deriveKeys(passphrase, salt, TEST_ARGON2_PROFILE);

      expect(result1.encKey).toEqual(result2.encKey);
      expect(result1.comKey).toEqual(result2.comKey);
    });

    it('should derive different keys for different passphrases', () => {
      const salt = new Uint8Array(32).fill(1);

      const result1 = deriveKeys('passphrase1', salt, TEST_ARGON2_PROFILE);
      const result2 = deriveKeys('passphrase2', salt, TEST_ARGON2_PROFILE);

      expect(result1.encKey).not.toEqual(result2.encKey);
      expect(result1.comKey).not.toEqual(result2.comKey);
    });
  });

  describe('generateSyntheticNonce', () => {
    it('should generate 24-byte nonce', () => {
      const key = new Uint8Array(32).fill(1);
      const plaintext = new TextEncoder().encode('test data');

      const nonce = generateSyntheticNonce(key, plaintext);

      expect(nonce.length).toBe(24);
    });

    it('should generate different nonces for different inputs', () => {
      const key = new Uint8Array(32).fill(1);
      const plaintext1 = new TextEncoder().encode('test data 1');
      const plaintext2 = new TextEncoder().encode('test data 2');

      const nonce1 = generateSyntheticNonce(key, plaintext1);
      const nonce2 = generateSyntheticNonce(key, plaintext2);

      expect(nonce1).not.toEqual(nonce2);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt plaintext', () => {
      const plaintext = new TextEncoder().encode('secret message');
      const passphrase = 'strong-passphrase';

      const encrypted = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const targetSize = selectVaultSize(encrypted.ciphertext.length);
      const blob = assembleBlob(encrypted, targetSize);

      const decrypted = decrypt({ blob, passphrase });

      expect(decrypted).toEqual(plaintext);
    });

    it('should fail with wrong passphrase', () => {
      const plaintext = new TextEncoder().encode('secret message');
      const passphrase = 'correct-passphrase';

      const encrypted = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const targetSize = selectVaultSize(encrypted.ciphertext.length);
      const blob = assembleBlob(encrypted, targetSize);

      expect(() => {
        decrypt({ blob, passphrase: 'wrong-passphrase' });
      }).toThrow();
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = new TextEncoder().encode('secret message');
      const passphrase = 'strong-passphrase';

      const encrypted1 = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const encrypted2 = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toEqual(encrypted2.salt);
    });

    it('should handle empty plaintext', () => {
      const plaintext = new Uint8Array(0);
      const passphrase = 'strong-passphrase';

      const encrypted = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const targetSize = selectVaultSize(encrypted.ciphertext.length);
      const blob = assembleBlob(encrypted, targetSize);

      const decrypted = decrypt({ blob, passphrase });

      expect(decrypted.length).toBe(0);
    });

    it('should handle large plaintext', () => {
      const plaintext = new Uint8Array(100000).fill(42);
      const passphrase = 'strong-passphrase';

      const encrypted = encrypt({
        plaintext,
        passphrase,
        argonProfile: TEST_ARGON2_PROFILE
      });

      const targetSize = selectVaultSize(encrypted.ciphertext.length);
      const blob = assembleBlob(encrypted, targetSize);

      const decrypted = decrypt({ blob, passphrase });

      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('assembleBlob', () => {
    it('should create blob with correct structure', () => {
      const plaintext = new TextEncoder().encode('test');
      const encrypted = encrypt({
        plaintext,
        passphrase: 'test',
        argonProfile: TEST_ARGON2_PROFILE
      });

      const targetSize = selectVaultSize(encrypted.ciphertext.length);
      const blob = assembleBlob(encrypted, targetSize);

      expect(blob.length).toBe(targetSize);
      expect(blob[0]).toBe(0x03); // VAULT_VERSION
    });

    it('should throw if content too large', () => {
      const plaintext = new TextEncoder().encode('test');
      const encrypted = encrypt({
        plaintext,
        passphrase: 'test',
        argonProfile: TEST_ARGON2_PROFILE
      });

      expect(() => {
        assembleBlob(encrypted, 100);
      }).toThrow('Content too large');
    });
  });
});