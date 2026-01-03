import { describe, it, expect } from 'vitest';
import { PinataClient } from '../lib/storage/pinata';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PINATA_JWT = process.env.PINATA_JWT || '';

describe('Pinata ZIP Upload/Download', () => {
  it('should upload and retrieve a real ZIP file', async () => {
    if (!PINATA_JWT) {
      console.log('Skipping test: PINATA_JWT not set');
      return;
    }
    
    const pinata = new PinataClient(PINATA_JWT);
    
    // Read real ZIP file
    const testZipPath = join(__dirname, '..', 'test-real.zip');
    const originalZip = readFileSync(testZipPath);
    console.log('📦 Original ZIP size:', originalZip.length, 'bytes');
    
    // Upload to Pinata
    console.log('⬆️  Uploading ZIP to Pinata...');
    const cid = await pinata.uploadBytes(originalZip, 'test-vault.zip');
    console.log('✅ Uploaded CID:', cid);
    expect(cid).toBeTruthy();
    
    // Download from Pinata
    console.log('⬇️  Downloading ZIP from Pinata...');
    const downloaded = await pinata.getBytes(cid);
    console.log('📦 Downloaded size:', downloaded.length, 'bytes');
    
    // Save retrieved file
    const retrievedPath = join(__dirname, 'retrieved.zip');
    writeFileSync(retrievedPath, downloaded);
    console.log('💾 Saved to:', retrievedPath);
    
    // Verify integrity
    expect(downloaded.length).toBe(originalZip.length);
    expect(Buffer.from(downloaded)).toEqual(originalZip);
    
    console.log('✅ ZIP uploaded and retrieved successfully!');
    console.log('🔗 IPFS CID:', cid);
  }, 60000);
});
