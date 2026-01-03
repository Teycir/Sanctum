import { describe, it, expect, beforeAll } from 'vitest';
import { FilebaseClient } from '../lib/storage/filebase';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// @ts-ignore
globalThis.fetch = fetch;

const FILEBASE_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
const FILEBASE_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
const FILEBASE_BUCKET = 'sanctum-vaults';

describe('Filebase ZIP Upload/Download', () => {
  it('should upload and retrieve a real ZIP file', async () => {
    if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
      console.log('Skipping test: FILEBASE credentials not set');
      return;
    }
    
    const filebase = new FilebaseClient(FILEBASE_ACCESS_KEY, FILEBASE_SECRET_KEY, FILEBASE_BUCKET);
    
    // Read real ZIP file
    const testZipPath = join(__dirname, '..', 'test-real.zip');
    const originalZip = readFileSync(testZipPath);
    console.log('📦 Original ZIP size:', originalZip.length, 'bytes');
    
    // Upload to Filebase
    console.log('⬆️  Uploading ZIP to Filebase...');
    const cid = await filebase.upload(originalZip);
    console.log('✅ Uploaded CID:', cid);
    expect(cid).toBeTruthy();
    
    // Download from Filebase
    console.log('⬇️  Downloading ZIP from Filebase...');
    const downloaded = await filebase.download(cid);
    console.log('📦 Downloaded size:', downloaded.length, 'bytes');
    
    // Save retrieved file
    const retrievedPath = join(__dirname, 'retrieved-filebase.zip');
    writeFileSync(retrievedPath, downloaded);
    console.log('💾 Saved to:', retrievedPath);
    
    // Verify integrity
    expect(downloaded.length).toBe(originalZip.length);
    expect(Buffer.from(downloaded)).toEqual(originalZip);
    
    console.log('✅ ZIP uploaded and retrieved successfully!');
    console.log('🔗 IPFS CID:', cid);
  }, 120000);
});
