# TimeSeal → Sanctum Code Reuse Map

**Purpose**: Detailed mapping of TimeSeal code that can be reused in Sanctum  
**Last Updated**: January 2026

---

## 🎯 Reuse Strategy

- **✅ Direct Copy**: Use as-is with no modifications
- **🔧 Adapt**: Modify for browser-only architecture
- **❌ Skip**: Not needed (backend-specific)

---

## 📦 Library Files

### ✅ Direct Copy (No Changes)

| TimeSeal File | Sanctum Location | Purpose |
|---------------|----------------------|---------|
| `lib/memoryProtection.ts` | `lib/reusable/memoryProtection.ts` | SecureMemory class for key obfuscation |
| `lib/cryptoUtils.ts` | `lib/reusable/cryptoUtils.ts` | Base64 encoding, random bytes |
| `lib/utils.ts` | `lib/reusable/utils.ts` | cn() helper for Tailwind |
| `lib/qrcode.ts` | `lib/reusable/qrcode.ts` | QR code generation |
| `lib/ui/textAnimation.ts` | `lib/reusable/ui/textAnimation.ts` | Text scramble effects |
| `lib/ui/hooks.ts` | `lib/reusable/ui/hooks.ts` | React hooks (useMediaQuery, etc.) |
| `lib/constants.ts` | `lib/reusable/constants.ts` | Shared constants (BASE64_CHUNK_SIZE, etc.) |

### 🔧 Adapt for Browser-Only

| TimeSeal File | Sanctum Location | Changes Needed |
|---------------|----------------------|----------------|
| `lib/crypto.ts` | ❌ **Replace** | Use XChaCha20-Poly1305 instead of AES-GCM |
| `lib/clientUtils.ts` | `lib/reusable/clientUtils.ts` | Remove server-side checks |
| `lib/timeUtils.ts` | `lib/reusable/timeUtils.ts` | Keep date formatting only |

### ❌ Skip (Backend-Specific)

| TimeSeal File | Reason |
|---------------|--------|
| `lib/database.ts` | No database in Sanctum |
| `lib/apiHandler.ts` | No API routes |
| `lib/apiHelpers.ts` | No API routes |
| `lib/rateLimit.ts` | No server-side rate limiting |
| `lib/middleware.ts` | No server middleware |
| `lib/security.ts` | Server-side security (CSRF, etc.) |
| `lib/auditLogger.ts` | No server-side logging |
| `lib/analytics.ts` | No server-side analytics |
| `lib/metrics.ts` | No server-side metrics |
| `lib/sealService.ts` | Backend seal management |
| `lib/storage.ts` | D1 database storage |
| `lib/turnstile.ts` | Cloudflare Turnstile (server-side) |
| `lib/validation.ts` | Server-side validation |

---

## 🎨 UI Components

### ✅ Direct Copy (shadcn/ui)

| TimeSeal Component | Sanctum Location | Purpose |
|--------------------|----------------------|---------|
| `app/components/ui/button.tsx` | `app/components/ui/button.tsx` | Button component |
| `app/components/ui/card.tsx` | `app/components/ui/card.tsx` | Card component |
| `app/components/ui/input.tsx` | `app/components/ui/input.tsx` | Input component |
| `app/components/ui/tooltip.tsx` | `app/components/ui/tooltip.tsx` | Tooltip component |
| `app/components/ui/dialog.tsx` | `app/components/ui/dialog.tsx` | Dialog/modal component |
| `app/components/ui/progress.tsx` | `app/components/ui/progress.tsx` | Progress bar |
| `app/components/ui/badge.tsx` | `app/components/ui/badge.tsx` | Badge component |
| `app/components/ui/alert.tsx` | `app/components/ui/alert.tsx` | Alert component |

### 🔧 Adapt for Sanctum

| TimeSeal Component | Sanctum Component | Changes Needed |
|--------------------|----------------------|----------------|
| `app/components/QRCodeDisplay.tsx` | `app/components/QRCodeDisplay.tsx` | Adapt for IPFS CID + Shamir shares |
| `app/components/EncryptionProgress.tsx` | `app/components/EncryptionProgress.tsx` | Adapt for Argon2id progress |
| `app/components/TextScramble.tsx` | `app/components/TextScramble.tsx` | Reuse for vault unlock animation |
| `app/components/Countdown.tsx` | `app/components/LockTimer.tsx` | Adapt for idle timeout countdown |

### ❌ Skip (TimeSeal-Specific)

| TimeSeal Component | Reason |
|--------------------|--------|
| `app/components/CreateSealForm.tsx` | TimeSeal-specific seal creation |
| `app/components/DecryptedText.tsx` | TimeSeal-specific unlock UI |
| `app/components/SealSuccess.tsx` | TimeSeal-specific success screen |
| `app/components/ActivityTicker.tsx` | Server-side activity feed |
| `app/components/SealCounter.tsx` | Server-side seal count |

---

## 🔧 Detailed Adaptation Guide

### 1. memoryProtection.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/memoryProtection.ts`  
**Sanctum**: `lib/reusable/memoryProtection.ts`

```bash
# Copy as-is
cp /home/teycir/Repos/TimeSeal/lib/memoryProtection.ts \
   lib/reusable/memoryProtection.ts
```

**Usage in Sanctum**:
```typescript
import { SecureMemory } from '@/lib/reusable/memoryProtection';

const memory = new SecureMemory();
const protected = memory.protect(sensitiveData);
// ... later
const retrieved = memory.retrieve(protected);
memory.destroy();
```

---

### 2. cryptoUtils.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/cryptoUtils.ts`  
**Sanctum**: `lib/reusable/cryptoUtils.ts`

```bash
# Copy as-is
cp /home/teycir/Repos/TimeSeal/lib/cryptoUtils.ts \
   lib/reusable/cryptoUtils.ts
```

**Usage in Sanctum**:
```typescript
import { 
  arrayBufferToBase64, 
  base64ToArrayBuffer,
  generateRandomBytes 
} from '@/lib/reusable/cryptoUtils';

const random = generateRandomBytes(32);
const encoded = arrayBufferToBase64(random.buffer);
```

---

### 3. utils.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/utils.ts`  
**Sanctum**: `lib/reusable/utils.ts`

```bash
# Copy as-is
cp /home/teycir/Repos/TimeSeal/lib/utils.ts \
   lib/reusable/utils.ts
```

**Usage in Sanctum**:
```typescript
import { cn } from '@/lib/reusable/utils';

<div className={cn('base-class', isActive && 'active-class')} />
```

---

### 4. qrcode.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/qrcode.ts`  
**Sanctum**: `lib/reusable/qrcode.ts`

```bash
# Copy as-is
cp /home/teycir/Repos/TimeSeal/lib/qrcode.ts \
   lib/reusable/qrcode.ts
```

**Usage in Sanctum**:
```typescript
import { generateQRCode } from '@/lib/reusable/qrcode';

// For IPFS CID
const qrCode = await generateQRCode(ipfsCID);

// For Shamir share
const shareQR = await generateQRCode(shamirShare);
```

---

### 5. textAnimation.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/ui/textAnimation.ts`  
**Sanctum**: `lib/reusable/ui/textAnimation.ts`

```bash
# Copy as-is
mkdir -p lib/reusable/ui
cp /home/teycir/Repos/TimeSeal/lib/ui/textAnimation.ts \
   lib/reusable/ui/textAnimation.ts
```

**Usage in Sanctum**:
```typescript
import { useTextScramble } from '@/lib/reusable/ui/textAnimation';

const scrambledText = useTextScramble('Vault Unlocked', { duration: 1000 });
```

---

### 6. constants.ts (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/lib/constants.ts`  
**Sanctum**: `lib/reusable/constants.ts`

```bash
# Copy as-is
cp /home/teycir/Repos/TimeSeal/lib/constants.ts \
   lib/reusable/constants.ts
```

**Usage in Sanctum**:
```typescript
import { BASE64_CHUNK_SIZE } from '@/lib/reusable/constants';

// Used in cryptoUtils for chunked base64 encoding
```

---

### 7. shadcn/ui Components (✅ Direct Copy)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/app/components/ui/*`  
**Sanctum**: `app/components/ui/*`

```bash
# Copy entire ui directory
cp -r /home/teycir/Repos/TimeSeal/app/components/ui \
      app/components/ui
```

**Components Included**:
- button.tsx
- card.tsx
- input.tsx
- tooltip.tsx
- dialog.tsx
- progress.tsx
- badge.tsx
- alert.tsx

---

### 8. QRCodeDisplay.tsx (🔧 Adapt)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/app/components/QRCodeDisplay.tsx`  
**Sanctum**: `app/components/QRCodeDisplay.tsx`

**Changes**:
```typescript
// TimeSeal: Shows seal URL
<QRCodeDisplay url={sealUrl} />

// Sanctum: Shows IPFS CID or Shamir share
<QRCodeDisplay 
  data={ipfsCID} 
  label="IPFS CID" 
  type="cid" 
/>

<QRCodeDisplay 
  data={shamirShare} 
  label="Recovery Share 1/3" 
  type="share" 
/>
```

---

### 9. EncryptionProgress.tsx (🔧 Adapt)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/app/components/EncryptionProgress.tsx`  
**Sanctum**: `app/components/EncryptionProgress.tsx`

**Changes**:
```typescript
// TimeSeal: Shows AES-GCM encryption progress
<EncryptionProgress stage="encrypting" />

// Sanctum: Shows Argon2id + XChaCha20 progress
<EncryptionProgress 
  stage="deriving-key"  // Argon2id (slow)
  progress={45}
  message="Deriving encryption key (this may take 10-30 seconds)..."
/>

<EncryptionProgress 
  stage="encrypting"    // XChaCha20 (fast)
  progress={90}
  message="Encrypting vault..."
/>
```

---

### 10. Countdown.tsx → LockTimer.tsx (🔧 Adapt)

**TimeSeal**: `/home/teycir/Repos/TimeSeal/app/components/Countdown.tsx`  
**Sanctum**: `app/components/LockTimer.tsx`

**Changes**:
```typescript
// TimeSeal: Countdown to seal unlock time
<Countdown targetDate={unlockTime} />

// Sanctum: Countdown to idle timeout
<LockTimer 
  idleTimeout={60}  // 60 seconds
  onTimeout={() => lockVault()}
  onActivity={() => resetTimer()}
/>
```

---

## 📋 Copy Script

Create `scripts/copy-timeseal.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TIMESEAL_PATH = '/home/teycir/Repos/TimeSeal';
const DURESSVAULT_PATH = process.cwd();

const filesToCopy = [
  // Libraries
  { src: 'lib/memoryProtection.ts', dest: 'lib/reusable/memoryProtection.ts' },
  { src: 'lib/cryptoUtils.ts', dest: 'lib/reusable/cryptoUtils.ts' },
  { src: 'lib/utils.ts', dest: 'lib/reusable/utils.ts' },
  { src: 'lib/qrcode.ts', dest: 'lib/reusable/qrcode.ts' },
  { src: 'lib/constants.ts', dest: 'lib/reusable/constants.ts' },
  { src: 'lib/ui/textAnimation.ts', dest: 'lib/reusable/ui/textAnimation.ts' },
  { src: 'lib/ui/hooks.ts', dest: 'lib/reusable/ui/hooks.ts' },
  
  // UI Components (shadcn/ui)
  { src: 'app/components/ui/button.tsx', dest: 'app/components/ui/button.tsx' },
  { src: 'app/components/ui/card.tsx', dest: 'app/components/ui/card.tsx' },
  { src: 'app/components/ui/input.tsx', dest: 'app/components/ui/input.tsx' },
  { src: 'app/components/ui/tooltip.tsx', dest: 'app/components/ui/tooltip.tsx' },
  { src: 'app/components/ui/dialog.tsx', dest: 'app/components/ui/dialog.tsx' },
  { src: 'app/components/ui/progress.tsx', dest: 'app/components/ui/progress.tsx' },
  { src: 'app/components/ui/badge.tsx', dest: 'app/components/ui/badge.tsx' },
  { src: 'app/components/ui/alert.tsx', dest: 'app/components/ui/alert.tsx' },
];

console.log('📦 Copying TimeSeal reusable code to Sanctum...\n');

let copied = 0;
let skipped = 0;

for (const { src, dest } of filesToCopy) {
  const srcPath = path.join(TIMESEAL_PATH, src);
  const destPath = path.join(DURESSVAULT_PATH, dest);
  
  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  Skipped: ${src} (not found)`);
    skipped++;
    continue;
  }
  
  // Create destination directory if it doesn't exist
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(srcPath, destPath);
  console.log(`✅ Copied: ${src} → ${dest}`);
  copied++;
}

console.log(`\n✨ Done! Copied ${copied} files, skipped ${skipped} files.`);
```

**Usage**:
```bash
chmod +x scripts/copy-timeseal.js
npm run copy-timeseal
```

---

## 🎯 Summary

### Reuse Statistics

| Category | Files | Lines of Code | Reuse % |
|----------|-------|---------------|---------|
| Direct Copy | 15 | ~1,500 | 100% |
| Adapted | 3 | ~300 | 70% |
| New Code | 22 | ~4,200 | 0% |
| **Total** | **40** | **~6,000** | **30%** |

### Time Savings

| Task | Without Reuse | With Reuse | Savings |
|------|---------------|------------|---------|
| UI Components | 5 days | 1 day | 4 days |
| Crypto Utils | 2 days | 0 days | 2 days |
| QR Codes | 1 day | 0 days | 1 day |
| Memory Protection | 2 days | 0 days | 2 days |
| **Total** | **10 days** | **1 day** | **9 days** |

---

## 🚀 Next Steps

1. **Run copy script**: `npm run copy-timeseal`
2. **Verify imports**: Check all import paths
3. **Test reused code**: Run unit tests
4. **Adapt components**: Modify QRCodeDisplay, EncryptionProgress, LockTimer
5. **Start new code**: Begin implementing crypto core

---

**Last Updated**: January 2026  
**Status**: Ready for Implementation
