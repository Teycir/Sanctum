#!/usr/bin/env node

/**
 * P2PT Manual Validation Script
 * 
 * This script helps validate P2PT functionality by:
 * 1. Starting a host that shares test data
 * 2. Providing instructions to test retrieval from another browser
 * 
 * Usage:
 *   node scripts/validate-p2pt.js host    # Start hosting test data
 *   node scripts/validate-p2pt.js fetch   # Fetch from peer
 */

const mode = process.argv[2];

if (!mode || !['host', 'fetch'].includes(mode)) {
  console.log(`
P2PT Validation Script
======================

Usage:
  node scripts/validate-p2pt.js host    # Start hosting test data
  node scripts/validate-p2pt.js fetch   # Fetch from peer

Steps to validate:
1. Open Terminal 1: node scripts/validate-p2pt.js host
2. Open Terminal 2: node scripts/validate-p2pt.js fetch
3. Verify data transfer succeeds

Or test in browser:
1. npm run dev
2. Open browser console
3. Run validation code (see docs/P2PT-VALIDATION.md)
`);
  process.exit(1);
}

console.log(`
⚠️  P2PT requires browser environment (WebRTC)

To validate P2PT:

1. Start dev server:
   npm run dev

2. Open browser console at http://localhost:3000

3. Run this code:

   // Host vault
   import { SecureVaultRelay } from './lib/p2pt';
   const relay = new SecureVaultRelay();
   const testData = new Uint8Array([1, 2, 3, 4, 5]);
   await relay.hostVault('test-cid-123', testData);
   console.log('✅ Hosting vault');

4. Open another browser tab/window

5. Run this code:

   // Fetch vault
   import { SecureVaultRelay } from './lib/p2pt';
   const relay = new SecureVaultRelay();
   const data = await relay.fetchVault('test-cid-123');
   console.log('Retrieved:', data);

Expected: Second tab retrieves [1, 2, 3, 4, 5]

See docs/P2PT-VALIDATION.md for detailed instructions.
`);
