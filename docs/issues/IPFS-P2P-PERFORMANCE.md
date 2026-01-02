# IPFS P2P Performance Issue

## Problem Statement

Vault unlocking is extremely slow (60+ seconds) or fails entirely when retrieving data from IPFS using Helia's P2P network in the browser.

## Current Behavior

1. **Upload works fine** - Data is successfully uploaded to IPFS and CIDs are generated
2. **Download hangs** - Browser-based Helia struggles to connect to IPFS peers via WebSocket
3. **Connection failures** - Hundreds of WebSocket connection failures to libp2p bootstrap nodes
4. **Gateway timeouts** - Trustless gateway returns 504 errors
5. **User experience** - Users wait 60+ seconds or get timeout errors

## Root Causes

### 1. Browser WebSocket Limitations
- Browsers can't establish direct P2P connections like native IPFS nodes
- WebSocket connections to libp2p peers frequently fail
- NAT traversal doesn't work in browsers
- Limited to WebSocket/WebRTC transports only

### 2. Bootstrap Node Connectivity
- Default libp2p bootstrap nodes are optimized for native nodes, not browsers
- Many bootstrap nodes don't support browser-compatible transports
- Connection attempts spam console with errors

### 3. Content Discovery Delay
- DHT queries from browser take much longer than native nodes
- Need to find peers that have the content AND support browser transports
- Cold start problem - no existing connections to IPFS network

### 4. No Local Cache
- Each unlock requires full network retrieval
- No persistent IPFS node between sessions
- Can't leverage existing peer connections

## Constraints

**MUST maintain:**
- ✅ Fully autonomous (no centralized servers)
- ✅ P2P architecture (no HTTP gateways)
- ✅ Zero-trust (client-side only)
- ✅ Censorship resistant

**CANNOT use:**
- ❌ HTTP gateways (centralized, can be blocked)
- ❌ Backend servers (violates zero-trust)
- ❌ Pinning services for retrieval (centralized)

## Proposed Solutions

### Option 1: Optimize Helia Configuration ⭐ RECOMMENDED
**Approach:** Configure Helia with browser-optimized settings

**Changes:**
```typescript
// lib/helia/client.ts
const helia = await createHelia({
  libp2p: {
    addresses: {
      listen: ['/webrtc', '/wss']  // Browser-compatible only
    },
    transports: [webRTC(), webSockets()],  // Remove TCP
    peerDiscovery: [
      bootstrap({
        list: [
          // Browser-friendly bootstrap nodes
          '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
          '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
        ]
      })
    ],
    connectionManager: {
      maxConnections: 10,  // Limit for browser
      minConnections: 3
    }
  }
})
```

**Pros:**
- Maintains P2P architecture
- No centralized dependencies
- Better browser compatibility

**Cons:**
- Still slower than HTTP gateways
- Requires finding browser-compatible peers

**Estimated improvement:** 60s → 15-30s

---

### Option 2: Pre-warm IPFS Node
**Approach:** Initialize Helia on page load, before user clicks unlock

**Changes:**
```typescript
// app/v/page.tsx
useEffect(() => {
  // Pre-initialize IPFS node
  const vaultService = new VaultService();
  vaultService.init();  // Don't await, let it warm up
}, []);
```

**Pros:**
- Node is already connected when user unlocks
- No code architecture changes
- Maintains P2P

**Cons:**
- Uses resources even if user doesn't unlock
- Still slow on first connection

**Estimated improvement:** 60s → 30-45s (after warm-up)

---

### Option 3: Service Worker + Persistent IPFS Node
**Approach:** Run Helia in a service worker for persistence across sessions

**Changes:**
- Move Helia to service worker
- Keep node alive between page loads
- Maintain peer connections

**Pros:**
- Persistent connections across sessions
- Much faster subsequent unlocks
- True P2P architecture

**Cons:**
- Complex implementation
- Service worker limitations
- First unlock still slow

**Estimated improvement:** 
- First unlock: 60s → 30s
- Subsequent: 30s → 5-10s

---

### Option 4: Hybrid P2P + Local Relay
**Approach:** User runs optional local IPFS node as relay

**Changes:**
- Detect local IPFS node (localhost:5001)
- Use as relay if available
- Fallback to pure P2P

**Pros:**
- Fast when local node available
- Still works without local node
- Maintains decentralization

**Cons:**
- Requires user setup
- Not truly "zero setup"
- Complexity

**Estimated improvement:** 60s → 2-5s (with local node)

---

### Option 5: WebRTC Direct Connections
**Approach:** Use WebRTC for direct peer-to-peer connections

**Changes:**
```typescript
import { webRTC } from '@libp2p/webrtc'

const helia = await createHelia({
  libp2p: {
    transports: [webRTC()],
    peerDiscovery: [/* WebRTC discovery */]
  }
})
```

**Pros:**
- True P2P in browser
- No WebSocket limitations
- Better NAT traversal

**Cons:**
- Requires signaling server (centralization point)
- Complex setup
- Browser support varies

**Estimated improvement:** 60s → 10-20s

---

## Recommended Implementation Plan

### Phase 1: Quick Wins ✅ IMPLEMENTED
1. ✅ Add 60s timeout
2. ✅ Add progress messages
3. ✅ Pre-warm IPFS node on page load
4. ✅ Optimize Helia config for browser
5. ✅ Add connection status indicator

### Phase 2: Architecture Improvements (1-2 days)
1. ⬜ Implement service worker persistence
2. ⬜ Add WebRTC transport
3. ⬜ Configure browser-optimized bootstrap nodes

### Phase 3: Advanced Optimizations (3-5 days)
1. ⬜ Local IPFS node detection
2. ⬜ Peer connection caching
3. ⬜ Content pre-fetching

## Testing Strategy

1. **Measure baseline:** Current unlock time with various network conditions
2. **Test each optimization:** Measure improvement
3. **Browser compatibility:** Test Chrome, Firefox, Safari
4. **Network conditions:** Test on slow/fast connections
5. **Cold vs warm start:** Test first unlock vs subsequent

## Success Metrics

- **Target:** < 10 seconds for unlock
- **Acceptable:** < 30 seconds
- **Current:** 60+ seconds (timeout)

## Alternative: Accept Slow P2P

If optimizations don't achieve acceptable performance:

**Option:** Document slow retrieval as expected behavior
- Add prominent warning: "First unlock may take 30-60 seconds"
- Explain P2P trade-offs vs centralized gateways
- Provide "advanced" option for users who want HTTP gateways

**Messaging:**
> "Sanctum uses peer-to-peer IPFS for maximum censorship resistance. First-time vault unlocking may take 30-60 seconds while connecting to the network. This ensures no central authority can block access to your data."

## References

- [Helia Browser Examples](https://github.com/ipfs/helia/tree/main/examples)
- [libp2p Browser Connectivity](https://github.com/libp2p/js-libp2p/blob/master/doc/BROWSER.md)
- [IPFS WebRTC Transport](https://github.com/libp2p/js-libp2p-webrtc)
- [Browser IPFS Performance](https://blog.ipfs.tech/2022-01-20-libp2p-in-2021/)

## Decision Required

**Choose one approach and implement:**
1. Option 1 (Optimize Helia) + Option 2 (Pre-warm) - RECOMMENDED
2. Option 3 (Service Worker) - More complex but better long-term
3. Accept slow P2P with clear user messaging

**Next Steps:**
1. Decide on approach
2. Implement Phase 1 quick wins
3. Test and measure improvements
4. Iterate based on results
