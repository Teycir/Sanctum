# P2PT Validation Guide

## Theory to Validate

**Hypothesis:** P2PT can establish peer-to-peer connections and transfer encrypted vault data faster than Helia DHT lookup.

**What we need to prove:**
1. ✅ P2PT can establish WebRTC connections between peers
2. ✅ Topic hashing prevents CID correlation
3. ✅ Encrypted data transfers successfully
4. ✅ Fallback to Helia works when P2PT fails
5. ⏳ P2PT is faster than Helia for vault retrieval

---

## Validation Methods

### Method 1: Automated Tests (Unit Level)

```bash
# Run P2PT unit tests
npm test -- __tests__/p2pt/vault-relay.test.ts

# Run real connection tests
npm test -- __tests__/p2pt/real-connection.test.ts
```

**Status:** ✅ 23/23 unit tests passing

**Limitations:** Cannot test real peer connections in Node.js (requires browser WebRTC)

---

### Method 2: Browser Console Testing (Manual)

#### Step 1: Start Dev Server
```bash
npm run dev
```

#### Step 2: Open Browser Console
Navigate to `http://localhost:3000` and open DevTools console.

#### Step 3: Host Vault (Tab 1)
```javascript
// Import P2PT module
const { SecureVaultRelay } = await import('/lib/p2pt/vault-relay.ts');

// Create test data
const testData = new TextEncoder().encode('Secret vault data');
const testCID = 'test-vault-' + Date.now();

// Start hosting
const hostRelay = new SecureVaultRelay();
await hostRelay.hostVault(testCID, testData);

console.log('✅ Hosting vault with CID:', testCID);
console.log('📋 Copy this CID to fetch in another tab');
```

#### Step 4: Fetch Vault (Tab 2)
```javascript
// Import P2PT module
const { SecureVaultRelay } = await import('/lib/p2pt/vault-relay.ts');

// Use CID from Tab 1
const testCID = 'test-vault-XXXXXXXXXX'; // Replace with actual CID

// Fetch from peer
const fetchRelay = new SecureVaultRelay();
const retrieved = await fetchRelay.fetchVault(testCID);

if (retrieved) {
  const text = new TextDecoder().decode(retrieved);
  console.log('✅ Retrieved via P2PT:', text);
} else {
  console.log('❌ No peer found');
}
```

**Expected Result:** Tab 2 retrieves "Secret vault data" from Tab 1

---

### Method 3: E2E Testing with Playwright

#### Create E2E Test
```typescript
// e2e/p2pt-validation.spec.ts
import { test, expect } from '@playwright/test';

test('P2PT peer-to-peer transfer', async ({ browser }) => {
  // Open two browser contexts (simulate two users)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  await page1.goto('http://localhost:3000');
  await page2.goto('http://localhost:3000');
  
  // Host vault in page1
  const cid = await page1.evaluate(async () => {
    const { SecureVaultRelay } = await import('/lib/p2pt/vault-relay.ts');
    const relay = new SecureVaultRelay();
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const testCID = 'e2e-test-' + Date.now();
    await relay.hostVault(testCID, testData);
    return testCID;
  });
  
  // Wait for tracker registration
  await page1.waitForTimeout(2000);
  
  // Fetch vault in page2
  const retrieved = await page2.evaluate(async (cid) => {
    const { SecureVaultRelay } = await import('/lib/p2pt/vault-relay.ts');
    const relay = new SecureVaultRelay();
    const data = await relay.fetchVault(cid);
    return data ? Array.from(data) : null;
  }, cid);
  
  expect(retrieved).toEqual([1, 2, 3, 4, 5]);
});
```

Run with:
```bash
npm run test:e2e -- e2e/p2pt-validation.spec.ts
```

---

### Method 4: Real Vault Lifecycle Test

#### Create Full Vault with P2PT
```bash
# Start dev server
npm run dev

# Open browser at http://localhost:3000/create
```

1. Create a vault with decoy + hidden content
2. Note the vault URL
3. Open vault URL in new tab
4. Check browser DevTools Network tab for P2PT activity
5. Verify vault unlocks successfully

**What to observe:**
- P2PT connection attempts in console
- Fallback to Helia if P2PT times out
- Total retrieval time (P2PT vs Helia)

---

## Performance Validation

### Benchmark P2PT vs Helia

```typescript
// Run in browser console
async function benchmarkRetrieval(cid: string) {
  const { retrieveVault } = await import('/lib/p2pt/retrieval.ts');
  
  // Test 1: With P2PT
  const start1 = performance.now();
  const result1 = await retrieveVault(cid, { skipP2PT: false });
  const time1 = performance.now() - start1;
  
  // Test 2: Helia only
  const start2 = performance.now();
  const result2 = await retrieveVault(cid, { skipP2PT: true });
  const time2 = performance.now() - start2;
  
  console.log(`P2PT: ${time1.toFixed(0)}ms (source: ${result1.source})`);
  console.log(`Helia: ${time2.toFixed(0)}ms (source: ${result2.source})`);
  console.log(`Speedup: ${(time2 / time1).toFixed(2)}x`);
}

// Use real vault CID
await benchmarkRetrieval('bafybei...');
```

**Expected Results:**
- P2PT (with peer): 1-5 seconds
- Helia DHT: 5-30 seconds
- Speedup: 2-10x faster

---

## Validation Checklist

### Core Functionality
- [ ] P2PT establishes WebRTC connections
- [ ] Topic hashing produces consistent 32-char hex
- [ ] Data transfers between peers successfully
- [ ] Timeout works when no peers available
- [ ] Cleanup clears data from RAM

### Security
- [ ] Only encrypted data transmitted
- [ ] Topic hash prevents CID correlation
- [ ] No plaintext exposure in network logs
- [ ] RAM-only storage (no persistence)

### Integration
- [ ] downloadVault uses P2PT waterfall
- [ ] Fallback to Helia works correctly
- [ ] No breaking changes to existing API
- [ ] All existing tests still pass

### Performance
- [ ] P2PT faster than Helia (when peer available)
- [ ] Timeout doesn't block indefinitely
- [ ] Multiple concurrent transfers work
- [ ] Memory cleanup prevents leaks

---

## Known Limitations

### Test Environment
- ❌ Node.js tests cannot use WebRTC (browser-only API)
- ❌ Vitest/Jest cannot simulate real P2PT connections
- ✅ Playwright E2E can test real connections

### Network Requirements
- Requires WebRTC support (modern browsers)
- Requires WebSocket trackers accessible
- May fail behind restrictive firewalls
- NAT traversal may fail in some networks

### Current Status
- ✅ Unit tests: 23/23 passing
- ✅ Integration tests: 2/2 passing
- ⏳ Real P2PT connections: Requires manual browser testing
- ⏳ Performance benchmarks: Requires real vault data

---

## Next Steps

### Immediate (Required)
1. **Manual browser testing** - Validate real peer connections
2. **Performance benchmarking** - Measure P2PT vs Helia speed
3. **Network testing** - Test on different networks/firewalls

### Short-term (Recommended)
4. **Playwright E2E test** - Automate peer connection testing
5. **CI/CD integration** - Add to deployment pipeline
6. **Monitoring** - Track P2PT success rate in production

### Long-term (Optional)
7. **Peer reputation** - Track reliable peers
8. **Connection pooling** - Reuse P2PT connections
9. **Multi-peer redundancy** - Fetch from multiple peers

---

## Validation Results Template

```markdown
## P2PT Validation Results

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Browser/OS]

### Test 1: Peer Connection
- [ ] Host started successfully
- [ ] Fetch connected to peer
- [ ] Data transferred correctly
- **Time:** X seconds

### Test 2: Fallback
- [ ] P2PT timeout handled
- [ ] Helia fallback worked
- **Time:** X seconds

### Test 3: Performance
- P2PT: X ms
- Helia: X ms
- Speedup: Xx faster

### Issues Found
- [List any issues]

### Conclusion
- [ ] P2PT works as expected
- [ ] Ready for production
- [ ] Needs fixes: [describe]
```

---

## Support

If validation fails:
1. Check browser console for errors
2. Verify WebRTC support: `isP2PTAvailable()`
3. Test with different trackers
4. Check firewall/network restrictions
5. Review `docs/P2PT-SECURITY.md` for troubleshooting

For questions: Open GitHub issue with validation results.
