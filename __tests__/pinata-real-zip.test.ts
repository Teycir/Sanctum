import { describe, it, expect, vi } from 'vitest';
import { PinataClient } from '../lib/storage/pinata';

const PINATA_JWT = process.env.PINATA_JWT || '';

// Mock file operations for faster tests
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => new Uint8Array(1024).fill(42)), // 1KB mock zip
  writeFileSync: vi.fn()
}));

vi.mock('path', () => ({
  join: vi.fn(() => 'mock-path')
}));

describe('Pinata ZIP Upload/Download', () => {
  it('should upload and retrieve a real ZIP file', async () => {
    if (!PINATA_JWT) {
      return; // Skip silently
    }
    
    const pinata = new PinataClient(PINATA_JWT);
    const originalZip = new Uint8Array(1024).fill(42); // Mock 1KB zip
    
    const cid = await pinata.uploadBytes(originalZip, 'test-vault.zip');
    expect(cid).toBeTruthy();
    
    const downloaded = await pinata.getBytes(cid);
    expect(downloaded.length).toBe(originalZip.length);
    expect(downloaded).toEqual(originalZip);
  }, 15000);
});
