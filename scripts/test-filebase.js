#!/usr/bin/env node

/**
 * Test Filebase IPFS integration
 * Usage: node scripts/test-filebase.js
 */

import { FilebaseClient } from '../lib/storage/filebase.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testFilebase() {
  const accessKey = process.env.FILEBASE_ACCESS_KEY;
  const secretKey = process.env.FILEBASE_SECRET_KEY;
  const bucket = process.env.FILEBASE_BUCKET || 'sanctum-vault';

  if (!accessKey || !secretKey) {
    console.error('❌ Missing credentials in .env.local:');
    console.error('   FILEBASE_ACCESS_KEY=your_access_key');
    console.error('   FILEBASE_SECRET_KEY=your_secret_key');
    console.error('   FILEBASE_BUCKET=sanctum-vault (optional)');
    process.exit(1);
  }

  console.log('🔧 Testing Filebase IPFS...');
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Access Key: ${accessKey.slice(0, 8)}...`);

  const client = new FilebaseClient(accessKey, secretKey, bucket);

  // Test data
  const testData = new TextEncoder().encode('Hello from Sanctum! ' + Date.now());
  console.log(`\n📤 Uploading ${testData.length} bytes...`);

  try {
    const cid = await client.upload(testData);
    console.log(`✅ Upload successful!`);
    console.log(`   CID: ${cid}`);

    console.log(`\n📥 Downloading from CID...`);
    const downloaded = await client.download(cid);
    const downloadedText = new TextDecoder().decode(downloaded);
    
    console.log(`✅ Download successful!`);
    console.log(`   Data: ${downloadedText}`);

    if (downloadedText === new TextDecoder().decode(testData)) {
      console.log(`\n✅ Test passed! Upload and download match.`);
    } else {
      console.log(`\n❌ Test failed! Data mismatch.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exit(1);
  }
}

testFilebase();
