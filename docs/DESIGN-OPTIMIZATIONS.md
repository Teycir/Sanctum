# Design Optimizations

## Implemented

### ✅ 4-Layer Encryption
- Passphrase → Master Key (Split) → CID-based → CID Storage
- **Status**: Complete

### ✅ Rate Limiting
- Per-vault: 5/min
- Global: 50/hour per fingerprint
- **Status**: Complete

### ✅ Honeypot Detection
- Auto-ban enumeration attacks
- **Status**: Complete

## Pending Optimizations

### 1. Remove Redundant CID-Based Encryption Layer
**Impact**: High
**Effort**: Medium

**Current**:
```
Passphrase → Master Key → CID-based → CID Storage
```

**Optimized**:
```
Passphrase → Master Key → CID Storage
```

**Benefits**:
- Remove 2 IPFS uploads (50% reduction)
- Remove 2 encryption operations
- Reduce complexity
- Maintain all security properties

**Implementation**:
- Remove inner CID encryption in `split-key-vault.ts`
- Update schema to remove `inner_decoy_cid`, `inner_hidden_cid`
- Simplify unlock flow

### 2. Optimize Rate Limit Queries
**Impact**: Medium
**Effort**: Low

**Current**: 3 separate queries
```sql
SELECT COUNT(*) FROM vault_access_log WHERE ip = ? AND vault_id = ?
SELECT COUNT(*) FROM vault_access_log WHERE fingerprint = ?
SELECT COUNT(DISTINCT vault_id) FROM vault_access_log WHERE ip = ?
```

**Optimized**: Single query with aggregation
```sql
SELECT 
  COUNT(*) FILTER (WHERE vault_id = ?) as vault_attempts,
  COUNT(*) FILTER (WHERE timestamp > ?) as global_attempts,
  COUNT(DISTINCT vault_id) as suspicious_count
FROM vault_access_log 
WHERE fingerprint = ? AND timestamp > ?
```

**Benefits**:
- 66% fewer D1 queries
- Faster response time
- Lower D1 costs

### 3. Conditional Timing Delays
**Impact**: Medium
**Effort**: Low

**Current**: 100-150ms delay on all requests

**Optimized**: Delay only on failures
```typescript
if (!result) {
  await delay(100 + Math.random() * 50);
  return error;
}
// No delay for successful requests
return result;
```

**Benefits**:
- Faster legitimate access
- Still prevents timing attacks
- Better UX

### 4. Access Log TTL
**Impact**: High
**Effort**: Low

**Add Cloudflare Cron**:
```typescript
// app/api/cron/cleanup/route.ts
export async function GET(request: NextRequest) {
  const db = request.env.DB;
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.prepare('DELETE FROM vault_access_log WHERE timestamp < ?')
    .bind(cutoff)
    .run();
    
  return Response.json({ success: true });
}
```

**Benefits**:
- Prevent database bloat
- Maintain query performance
- Stay within D1 limits

### 5. Batch CID Encryption
**Impact**: Low
**Effort**: Low

**Current**: Encrypt each CID separately

**Optimized**: Encrypt all CIDs in single operation
```typescript
const allCIDs = `${decoyCID}|${hiddenCID}`;
const encryptedCIDs = encryptCID(allCIDs, cidKey);
```

**Benefits**:
- Fewer encryption operations
- Smaller storage footprint
- Simpler code

## Performance Targets

### Current
- Vault creation: ~3-5s
- Vault unlock: ~2-3s
- D1 queries: 3 per request

### Optimized
- Vault creation: ~1.5-2s (50% faster)
- Vault unlock: ~1-1.5s (50% faster)
- D1 queries: 1 per request (66% reduction)

## Implementation Priority

1. **High Priority**: Remove CID-based encryption layer
2. **High Priority**: Add access log TTL
3. **Medium Priority**: Optimize rate limit queries
4. **Medium Priority**: Conditional timing delays
5. **Low Priority**: Batch CID encryption
