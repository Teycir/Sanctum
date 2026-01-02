# Integration Tests for IPFS Storage

## Overview

Complete end-to-end tests for the IPFS storage cycle: create → upload → retrieve → unlock.

## Test Suites

### 1. IPFS Storage Integration (`ipfs-storage.test.ts`)
Tests the core IPFS upload/download functionality:
- Basic upload and retrieval
- Large file handling
- Vault service integration
- Error handling
- Performance benchmarks

### 2. Vault Lifecycle (`vault-lifecycle.test.ts`)
Tests complete vault workflows:
- Simple vault creation and unlock
- Duress vault with decoy/hidden layers
- Connection status tracking
- Concurrent operations
- Edge cases (empty content, special characters, wrong passphrase)

## Running Tests

### Run all integration tests
```bash
npm run test:integration
```

### Watch mode (re-run on changes)
```bash
npm run test:integration:watch
```

### Run specific test file
```bash
npx vitest run __tests__/integration/ipfs-storage.test.ts
```

## Requirements

### Network Connection
Integration tests require internet connectivity to:
- Connect to IPFS bootstrap nodes
- Upload/download content via P2P network
- May take 30-60 seconds for initial connection

### Timeouts
- Test timeout: 120 seconds
- Hook timeout: 60 seconds
- Individual operations: 30-90 seconds

## Test Structure

```
__tests__/integration/
├── setup.ts                    # Global test setup
├── ipfs-storage.test.ts        # IPFS client tests
└── vault-lifecycle.test.ts     # End-to-end vault tests
```

## Expected Behavior

### First Run
- Takes 30-60 seconds to establish IPFS connections
- Bootstrap nodes discovery
- Peer connections established

### Subsequent Runs
- Faster due to peer caching
- Cached peers from IndexedDB
- 10-20 seconds for connection

## Troubleshooting

### Tests timeout
- Check internet connection
- Verify IPFS bootstrap nodes are accessible
- Increase timeout in `vitest.integration.config.ts`

### Connection failures
- Clear IndexedDB peer cache
- Restart tests
- Check firewall/proxy settings

### Slow performance
- First run is always slower (cold start)
- Subsequent runs use cached peers
- Network conditions affect speed

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Integration Tests
  run: npm run test:integration
  timeout-minutes: 10
  env:
    NODE_ENV: test
```

### Skip in CI (optional)
```bash
# Only run unit tests in CI
npm run test

# Run integration tests manually
npm run test:integration
```

## Coverage

Integration tests cover:
- ✅ IPFS upload/download cycle
- ✅ Vault creation and unlocking
- ✅ Simple vault mode
- ✅ Duress vault mode (decoy + hidden)
- ✅ Connection status monitoring
- ✅ Peer caching
- ✅ Error handling
- ✅ Concurrent operations
- ✅ Edge cases

## Performance Benchmarks

Tests include performance assertions:
- Second retrieval faster than first (caching)
- Connection maintained across operations
- Concurrent operations complete successfully

## Notes

- Tests use real IPFS network (not mocked)
- Data uploaded during tests persists on IPFS
- Tests clean up resources after completion
- Singleton pattern ensures connection reuse
