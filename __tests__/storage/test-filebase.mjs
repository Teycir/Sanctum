#!/usr/bin/env node

/**
 * Test Filebase IPFS integration
 */

import { FilebaseClient } from '../lib/storage/filebase.js';

const accessKey = 'F9CE9EEDA069BB4B3203';
const secretKey = 'iUOYzd0UghnCWvFjntDGqKXn3fsIhUoN0l7GbLX3';
const bucket = 'sanctum-vault';

console.log('🔧 Testing Filebase IPFS...');
console.log(`   Bucket: ${bucket}`);
console.log(`   Access Key: ${accessKey.slice(0, 8)}...`);

const client = new FilebaseClient(accessKey, secretKey, bucket);

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
  console.error(error);
  process.exit(1);
}
