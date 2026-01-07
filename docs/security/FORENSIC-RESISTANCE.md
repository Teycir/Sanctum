# Forensic Resistance

## Overview

Sanctum implements multiple layers of forensic resistance to prevent recovery of sensitive data from seized devices.

---

## 1. RAM-Only Storage

**Implementation:** All cryptographic keys and decrypted content stored only in RAM.

**Protection:**
- Keys never written to disk
- No localStorage/sessionStorage for sensitive data
- Auto-wiped on browser close
- Immune to disk forensics

**See:** [RAM-ONLY-STORAGE.md](./RAM-ONLY-STORAGE.md)

---

## 2. Browser History Clearing

**Implementation:** Vault URL automatically removed from browser history after successful unlock.

**Code:**
```typescript
// After unlock success
if (globalThis.window?.history) {
  globalThis.window.history.replaceState(null, "", "/vault");
}
```

**Protection:**
- Vault URL not recoverable from browser history
- Forensic tools cannot find vault link
- User can safely leave browser open

**Limitations:**
- Does not clear history from before unlock
- User must manually clear full history if needed
- Browser extensions may still log URLs

---

## 3. Randomized Unlock Timing

**Implementation:** Random 500-2000ms delay added to all unlock attempts.

**Code:**
```typescript
// Before unlock
const randomDelay = 500 + Math.random() * 1500;
await new Promise((resolve) => setTimeout(resolve, randomDelay));
```

**Protection:**
- Prevents timing analysis attacks
- Decoy and hidden unlocks indistinguishable
- Works even with source code access

**Why it works:**
- Attacker cannot measure consistent timing difference
- Random delay >> cryptographic timing differences
- Applies to both successful and failed unlocks

---

## 4. Auto-Lock on Inactivity

**Implementation:** Vault locks after 5 minutes of inactivity.

**Protection:**
- Prevents unauthorized access if device left unattended
- All sensitive data cleared from memory
- Requires re-entering passphrase

**See:** [SECURITY-FEATURES.md](../SECURITY-FEATURES.md)

---

## 5. Panic Key (ESC×2)

**Implementation:** Double-press Escape key for instant lockout.

**Protection:**
- Immediate memory wipe
- No time for attacker to see content
- Works even during unlock process

**See:** [SECURITY-FEATURES.md](../SECURITY-FEATURES.md)

---

## 6. Secure Clipboard

**Implementation:** Clipboard auto-clears after 60 seconds.

**Protection:**
- Prevents clipboard forensics
- No persistent clipboard history
- Automatic cleanup

**See:** [SECURITY-FEATURES.md](../SECURITY-FEATURES.md)

---

## Threat Model

### ✅ Protected Against

1. **Disk Forensics**
   - No keys on disk
   - No decrypted content on disk
   - RAM-only storage

2. **Browser History Analysis**
   - Vault URL cleared after unlock
   - No persistent history entries

3. **Timing Analysis**
   - Randomized delays prevent timing attacks
   - Decoy/hidden indistinguishable

4. **Clipboard Forensics**
   - Auto-clear after 60 seconds
   - No persistent clipboard data

5. **Idle Device Seizure**
   - Auto-lock after 5 minutes
   - Panic key for instant lockout

### ⚠️ Partial Protection

1. **Browser Extensions**
   - May log URLs before clearing
   - User should disable extensions

2. **Network Logs**
   - ISP/VPN may log IPFS requests
   - Use Tor Browser for anonymity

3. **Memory Dumps**
   - Live RAM capture could recover keys
   - Only possible while vault unlocked

### ❌ Not Protected Against

1. **Screen Recording**
   - Malware recording screen
   - Physical camera pointed at screen

2. **Keyloggers**
   - Hardware or software keyloggers
   - Captures passphrase as typed

3. **Shoulder Surfing**
   - Physical observation
   - User must ensure privacy

---

## Best Practices

### Before Creating Vault

1. **Use Tor Browser** - Hides IP from IPFS gateways
2. **Disable extensions** - Prevents URL logging
3. **Use private/incognito mode** - No persistent history
4. **Verify HTTPS** - Prevents MITM attacks

### After Creating Vault

1. **Close browser** - Clears RAM
2. **Clear full history** - Removes all traces
3. **Restart device** - Ensures memory cleared
4. **Test vault link** - Verify it works before relying on it

### When Accessing Vault

1. **Use Tor Browser** - Network anonymity
2. **Access from safe location** - No surveillance
3. **Clear history after** - Remove vault URL
4. **Lock immediately** - Don't leave unlocked

### If Device Seized

1. **RAM cleared on close** - Keys not recoverable
2. **History cleared** - Vault URL not in history
3. **Plausible deniability** - Cannot prove hidden layer exists
4. **Reveal decoy** - Show decoy passphrase if coerced

---

## Implementation Details

### History Clearing

**When:** Immediately after successful unlock  
**Method:** `history.replaceState(null, "", "/vault")`  
**Effect:** Vault URL replaced with generic `/vault` path

**Limitations:**
- Only clears current history entry
- Previous history entries remain
- Browser may cache URL elsewhere

### Randomized Timing

**When:** Before every unlock attempt  
**Range:** 500-2000ms random delay  
**Method:** `Math.random() * 1500 + 500`  
**Effect:** Timing analysis impossible

**Why this range:**
- 500ms minimum: Not noticeable to user
- 2000ms maximum: Still feels responsive
- 1500ms variance: >> cryptographic timing differences

---

## Verification

### Test History Clearing

1. Open vault URL in browser
2. Check browser history (Ctrl+H)
3. Enter passphrase and unlock
4. Check history again - vault URL should be gone

### Test Randomized Timing

1. Unlock vault 10 times with same passphrase
2. Measure time from click to unlock
3. Times should vary by 500-2000ms
4. No consistent pattern

### Test RAM-Only Storage

1. Unlock vault
2. Check localStorage/sessionStorage (DevTools)
3. Should be empty (no keys or content)
4. Close browser and check disk - no traces

---

## Future Improvements

### Potential Enhancements

1. **Full History Clearing**
   - Clear all browser history on unlock
   - Requires user permission

2. **Cache Clearing**
   - Clear browser cache after unlock
   - Removes IPFS download traces

3. **IndexedDB Clearing**
   - Clear all IndexedDB entries
   - Removes any persistent storage

4. **Browser Fingerprint Resistance**
   - Randomize browser fingerprint
   - Prevents tracking across sessions

### Not Planned

1. **Disk Encryption**
   - Out of scope (OS-level)
   - User should use full-disk encryption

2. **Anti-Keylogger**
   - Not possible in browser
   - User must ensure clean device

3. **Anti-Screen Recording**
   - Not possible in browser
   - User must ensure no malware

---

## References

- [RAM-ONLY-STORAGE.md](./RAM-ONLY-STORAGE.md) - Memory safety details
- [SECURITY-FEATURES.md](../SECURITY-FEATURES.md) - Auto-lock, panic key, secure clipboard
- [TIMING-ATTACK-MITIGATION.md](./TIMING-ATTACK-MITIGATION.md) - Timing attack defenses
- [OPSEC.md](../OPSEC.md) - Operational security guidelines
