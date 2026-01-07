import { describe, it, expect } from 'vitest';
import { isValidPassword, getPasswordError } from '../../lib/validation/password';

describe('Password Validation', () => {
  describe('isValidPassword', () => {
    it('should accept empty password', () => {
      expect(isValidPassword('')).toBe(true);
    });

    it('should accept valid password', () => {
      expect(isValidPassword('Test1234!@#$')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd123')).toBe(true);
      expect(isValidPassword('Correct-Horse-Battery-Staple-1')).toBe(true);
    });

    it('should reject password without uppercase', () => {
      expect(isValidPassword('test1234!@#$')).toBe(false);
    });

    it('should reject password without lowercase', () => {
      expect(isValidPassword('TEST1234!@#$')).toBe(false);
    });

    it('should reject password without number', () => {
      expect(isValidPassword('TestTest!@#$')).toBe(false);
    });

    it('should reject password without special character', () => {
      expect(isValidPassword('Test12345678')).toBe(false);
    });

    it('should reject password shorter than 12 characters', () => {
      expect(isValidPassword('Test123!')).toBe(false);
    });
  });

  describe('getPasswordError', () => {
    it('should return null for empty password', () => {
      expect(getPasswordError('')).toBeNull();
    });

    it('should return null for valid password', () => {
      expect(getPasswordError('Test1234!@#$')).toBeNull();
    });

    it('should return error for short password', () => {
      expect(getPasswordError('Test123!', 'Hidden password')).toBe(
        'Hidden password must be at least 12 characters'
      );
    });

    it('should return error for missing uppercase', () => {
      expect(getPasswordError('test1234!@#$', 'Password')).toBe(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should return error for missing lowercase', () => {
      expect(getPasswordError('TEST1234!@#$', 'Password')).toBe(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should return error for missing number', () => {
      expect(getPasswordError('TestTest!@#$', 'Password')).toBe(
        'Password must contain at least one number'
      );
    });

    it('should return error for missing special character', () => {
      expect(getPasswordError('Test12345678', 'Password')).toBe(
        'Password must contain at least one special character'
      );
    });

    it('should use custom label in error message', () => {
      expect(getPasswordError('short', 'Decoy password')).toBe(
        'Decoy password must be at least 12 characters'
      );
    });
  });
});
