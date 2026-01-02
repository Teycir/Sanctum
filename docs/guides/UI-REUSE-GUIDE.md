# Sanctum UI Components - TimeSeal Reuse Guide

**✅ GOOD NEWS**: UI components are browser-side and mostly reusable despite the architecture change.

**⚠️ NOTE**: Sanctum is browser-only (no backend), but UI components work the same way.

## 📦 Components to Copy Directly (No Changes)

### Core UI Components (100% Reusable)

```bash
# Copy these components as-is from TimeSeal
cp TimeSeal/app/components/Button.tsx Sanctum/app/components/
cp TimeSeal/app/components/Input.tsx Sanctum/app/components/
cp TimeSeal/app/components/Card.tsx Sanctum/app/components/
cp TimeSeal/app/components/Tooltip.tsx Sanctum/app/components/
cp TimeSeal/app/components/BottomSheet.tsx Sanctum/app/components/
```

| Component | Purpose | Reusability | Changes Needed |
|-----------|---------|-------------|----------------|
| **Button.tsx** | Primary/secondary buttons | 100% | None |
| **Input.tsx** | Text inputs with validation | 100% | None |
| **Card.tsx** | Container component | 100% | None |
| **Tooltip.tsx** | Hover tooltips | 100% | None |
| **BottomSheet.tsx** | Mobile drawer | 100% | None |

---

### Animation Components (100% Reusable)

```bash
cp TimeSeal/app/components/TextScramble.tsx Sanctum/app/components/
cp TimeSeal/app/components/DecryptedText.tsx Sanctum/app/components/
cp TimeSeal/app/components/DustEffect.tsx Sanctum/app/components/
cp TimeSeal/app/components/FloatingIcons.tsx Sanctum/app/components/
cp TimeSeal/app/components/IdleBlur.tsx Sanctum/app/components/
cp TimeSeal/app/components/MagneticButton.tsx Sanctum/app/components/
cp TimeSeal/app/components/ScrollProgress.tsx Sanctum/app/components/
```

| Component | Purpose | Reusability | Changes Needed |
|-----------|---------|-------------|----------------|
| **TextScramble.tsx** | Text scrambling animation | 100% | None |
| **DecryptedText.tsx** | Reveal animation for secrets | 100% | None |
| **DustEffect.tsx** | Particle effects | 100% | None |
| **FloatingIcons.tsx** | Animated background icons | 100% | None |
| **IdleBlur.tsx** | Privacy blur on idle | 100% | None |
| **MagneticButton.tsx** | Interactive button | 100% | None |
| **ScrollProgress.tsx** | Page scroll indicator | 100% | None |

---

### Layout Components (100% Reusable)

```bash
cp TimeSeal/app/components/Footer.tsx Sanctum/app/components/
cp TimeSeal/app/components/Common.tsx Sanctum/app/components/
cp TimeSeal/app/components/StructuredData.tsx Sanctum/app/components/
cp -r TimeSeal/app/components/ui/ Sanctum/app/components/ui/
```

| Component | Purpose | Reusability | Changes Needed |
|-----------|---------|-------------|----------------|
| **Footer.tsx** | Page footer | 95% | Update links/text |
| **Common.tsx** | Shared utilities | 100% | None |
| **StructuredData.tsx** | SEO metadata | 90% | Update schema |
| **ui/background-beams.tsx** | Background effects | 100% | None |

---

### Icon Components (100% Reusable)

```bash
cp -r TimeSeal/app/components/icons/ Sanctum/app/components/icons/
```

| Component | Purpose | Reusability | Changes Needed |
|-----------|---------|-------------|----------------|
| **icons/RedditIcon.tsx** | Social icon | 100% | None |

---

## 🔧 Components to Adapt (Minor Changes)

### Progress & Status Components

```bash
# Copy and modify these
cp TimeSeal/app/components/EncryptionProgress.tsx Sanctum/app/components/
cp TimeSeal/app/components/SealSuccess.tsx Sanctum/app/components/VaultSuccess.tsx
```

#### EncryptionProgress.tsx
**Reusability**: 95%  
**Changes**:
- ✅ Keep: Progress bar, animation, loading states
- 🔧 Update: Text from "Encrypting seal..." → "Encrypting vault..."
- 🔧 Add: IPFS upload progress stages

**Adaptation**:
```typescript
// Change text only
"Encrypting seal..." → "Encrypting vault..."
"Uploading to R2..." → "Uploading to IPFS..."
"Creating seal..." → "Creating vault..."
```

#### SealSuccess.tsx → VaultSuccess.tsx
**Reusability**: 90%  
**Changes**:
- ✅ Keep: Success animation, confetti, copy button
- 🔧 Update: "Seal created" → "Vault created"
- 🔧 Update: URL format
- 🔧 Add: Provider badges (Filebase/Pinata)

**Adaptation**:
```typescript
// Rename and update text
export function VaultSuccess({ vaultId, url, providers }) {
  return (
    <div>
      <h2>Vault Created Successfully! 🎉</h2>
      <p>Stored on: {providers.join(', ')}</p>
      {/* Rest same as SealSuccess */}
    </div>
  );
}
```

---

### Banner Components

```bash
cp TimeSeal/app/components/SecurityFeaturesBanner.tsx Sanctum/app/components/
```

#### SecurityFeaturesBanner.tsx
**Reusability**: 80%  
**Changes**:
- ✅ Keep: Banner layout, styling, animations
- 🔧 Replace: Security features list
- 🔧 Add: Duress-specific features

**Adaptation**:
```typescript
const features = [
  { icon: '🔐', text: 'Plausible Deniability' },
  { icon: '🌐', text: 'Decentralized Storage' },
  { icon: '🔑', text: 'Split-Key Encryption' },
  { icon: '🚫', text: 'Zero Server Trust' }
];
```

---

## ❌ Components NOT to Copy (TimeSeal-Specific)

### Time-Based Components (Not Applicable)

| Component | Reason | Alternative |
|-----------|--------|-------------|
| **Countdown.tsx** | Time-based unlocking | Not needed (instant access) |
| **ActivityTicker.tsx** | Real-time seal activity | Optional (vault activity) |
| **SealCounter.tsx** | Seal statistics | Adapt to VaultCounter.tsx |
| **QRCodeDisplay.tsx** | QR for seal links | Reusable (copy as-is) |
| **AnimatedTagline.tsx** | "Time-locked secrets" | Create new tagline |
| **CommandPalette.tsx** | Keyboard shortcuts | Optional (copy if needed) |

---

## 🆕 New Components to Create (Sanctum-Specific)

### 1. CreateVaultForm.tsx
**Base**: CreateSealForm.tsx (70% reusable)  
**Changes**:
```typescript
// Remove from CreateSealForm:
- Time picker
- DMS toggle
- Pulse interval
- Countdown preview

// Add to CreateVaultForm:
- Mode selector (simple/hidden/chain/stego)
- Passphrase inputs (1-4 fields)
- Decoy content input
- Provider checkboxes (Filebase/Pinata)
- API key inputs (collapsible)
```

**Copy Strategy**:
```bash
cp TimeSeal/app/components/CreateSealForm.tsx Sanctum/app/components/CreateVaultForm.tsx

# Then modify:
# 1. Remove time-related UI
# 2. Add mode selector
# 3. Add passphrase fields
# 4. Add provider config
```

---

### 2. VaultViewer.tsx
**Base**: DecryptedText.tsx (80% reusable)  
**Changes**:
```typescript
// Keep from DecryptedText:
- Text scramble animation
- Copy to clipboard
- Blur on idle
- Responsive layout

// Add to VaultViewer:
- Optional passphrase input
- Layer switching (decoy/hidden)
- File download buttons
- Provider info display
```

**Copy Strategy**:
```bash
cp TimeSeal/app/components/DecryptedText.tsx Sanctum/app/components/VaultViewer.tsx

# Then modify:
# 1. Add passphrase input (optional)
# 2. Add layer decryption logic
# 3. Add file handling
```

---

### 3. ModeSelector.tsx
**Base**: New component (inspired by TimeSeal's toggle patterns)  
**Purpose**: Select vault mode (simple/hidden/chain/stego)

```typescript
export function ModeSelector({ value, onChange }) {
  const modes = [
    { id: 'simple', name: 'Simple Vault', icon: '🔒' },
    { id: 'hidden', name: 'Hidden Layer', icon: '🎭' },
    { id: 'chain', name: 'Escalating Chain', icon: '⛓️' },
    { id: 'stego', name: 'Steganography', icon: '🖼️' }
  ];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {modes.map(mode => (
        <Card 
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={value === mode.id ? 'border-primary' : ''}
        >
          <span className="text-4xl">{mode.icon}</span>
          <h3>{mode.name}</h3>
        </Card>
      ))}
    </div>
  );
}
```

---

### 4. ProviderConfig.tsx
**Base**: New component  
**Purpose**: Configure IPFS provider credentials

```typescript
export function ProviderConfig({ providers, onChange }) {
  return (
    <div className="space-y-4">
      <label>
        <input type="checkbox" checked={providers.filebase.enabled} />
        Filebase (5 GB free)
      </label>
      {providers.filebase.enabled && (
        <div className="ml-6 space-y-2">
          <Input 
            placeholder="API Key" 
            value={providers.filebase.apiKey}
            onChange={e => onChange('filebase', 'apiKey', e.target.value)}
          />
          <Input 
            placeholder="API Secret" 
            type="password"
            value={providers.filebase.apiSecret}
            onChange={e => onChange('filebase', 'apiSecret', e.target.value)}
          />
        </div>
      )}
      {/* Repeat for Pinata */}
    </div>
  );
}
```

---

### 5. PassphraseInput.tsx
**Base**: Input.tsx (90% reusable)  
**Purpose**: Secure passphrase input with strength meter

```typescript
export function PassphraseInput({ value, onChange, label, showStrength }) {
  const [visible, setVisible] = useState(false);
  const strength = calculateStrength(value);
  
  return (
    <div>
      <label>{label}</label>
      <div className="relative">
        <Input 
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="Enter passphrase..."
        />
        <button onClick={() => setVisible(!visible)}>
          {visible ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      {showStrength && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded">
            <div 
              className={`h-full rounded ${strengthColor(strength)}`}
              style={{ width: `${strength}%` }}
            />
          </div>
          <p className="text-sm">{strengthLabel(strength)}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 6. OpSecWarnings.tsx
**Base**: SecurityFeaturesBanner.tsx (60% reusable)  
**Purpose**: Display critical OpSec warnings

```typescript
export function OpSecWarnings() {
  const warnings = [
    '⚠️ Fund your decoy wallet with realistic amounts ($50-500)',
    '🧠 MEMORIZE passphrases - never store digitally',
    '🌐 Use Tor Browser for maximum anonymity',
    '🗑️ Clear browser cache/history after use',
    '🔗 For timed release: timeseal.online',
    '🧪 Test decoy layer before relying on it'
  ];
  
  return (
    <Card className="bg-yellow-50 border-yellow-300">
      <h3 className="text-lg font-bold mb-4">🔒 Critical Security Practices</h3>
      <ul className="space-y-2">
        {warnings.map((warning, i) => (
          <li key={i} className="text-sm">{warning}</li>
        ))}
      </ul>
    </Card>
  );
}
```

---

## 📋 Complete Copy Checklist

### Phase 1: Direct Copy (No Changes)
```bash
# Core UI
- [ ] Button.tsx
- [ ] Input.tsx
- [ ] Card.tsx
- [ ] Tooltip.tsx
- [ ] BottomSheet.tsx

# Animations
- [ ] TextScramble.tsx
- [ ] DecryptedText.tsx
- [ ] DustEffect.tsx
- [ ] FloatingIcons.tsx
- [ ] IdleBlur.tsx
- [ ] MagneticButton.tsx
- [ ] ScrollProgress.tsx

# Layout
- [ ] Footer.tsx
- [ ] Common.tsx
- [ ] StructuredData.tsx
- [ ] ui/background-beams.tsx

# Icons
- [ ] icons/RedditIcon.tsx
```

### Phase 2: Adapt (Minor Changes)
```bash
- [ ] EncryptionProgress.tsx (update text)
- [ ] SealSuccess.tsx → VaultSuccess.tsx (rename + update)
- [ ] SecurityFeaturesBanner.tsx (update features list)
- [ ] QRCodeDisplay.tsx (copy as-is, optional)
```

### Phase 3: Create New (Sanctum-Specific)
```bash
- [ ] CreateVaultForm.tsx (base: CreateSealForm.tsx)
- [ ] VaultViewer.tsx (base: DecryptedText.tsx)
- [ ] ModeSelector.tsx (new)
- [ ] ProviderConfig.tsx (new)
- [ ] PassphraseInput.tsx (base: Input.tsx)
- [ ] OpSecWarnings.tsx (base: SecurityFeaturesBanner.tsx)
- [ ] VaultCounter.tsx (base: SealCounter.tsx, optional)
```

---

## 🎨 Styling & Theme

### Copy Entire Styling System
```bash
# Copy Tailwind config
cp TimeSeal/tailwind.config.js Sanctum/

# Copy global styles
cp TimeSeal/app/globals.css Sanctum/app/

# Copy component styles (if any)
cp -r TimeSeal/app/styles/ Sanctum/app/styles/
```

**Changes Needed**:
- Update color scheme (optional)
- Update font choices (optional)
- Keep dark mode support

---

## 📊 Reusability Summary

| Category | Components | Reusability | Effort |
|----------|-----------|-------------|--------|
| **Direct Copy** | 18 components | 100% | 30 min |
| **Minor Adapt** | 4 components | 85-95% | 2 hours |
| **Major Adapt** | 2 components | 60-80% | 4 hours |
| **Create New** | 6 components | 0% | 8 hours |

**Total UI Development Time**: ~15 hours (vs 40+ hours from scratch)  
**Time Saved**: 25+ hours (60% reduction)

---

## 🚀 Implementation Order

### Day 1: Foundation
1. Copy all direct-copy components (30 min)
2. Copy styling system (15 min)
3. Test component imports (15 min)

### Day 2: Adaptations
1. Adapt EncryptionProgress.tsx (30 min)
2. Create VaultSuccess.tsx (1 hour)
3. Update SecurityFeaturesBanner.tsx (30 min)

### Day 3-4: New Components
1. Create ModeSelector.tsx (2 hours)
2. Create ProviderConfig.tsx (2 hours)
3. Create PassphraseInput.tsx (1 hour)
4. Create OpSecWarnings.tsx (1 hour)

### Day 5: Main Forms
1. Adapt CreateVaultForm.tsx (4 hours)
2. Adapt VaultViewer.tsx (3 hours)

---

## 🔗 Component Dependencies

```
CreateVaultForm.tsx
├── ModeSelector.tsx
├── PassphraseInput.tsx
├── ProviderConfig.tsx
├── Input.tsx (from TimeSeal)
├── Button.tsx (from TimeSeal)
├── Card.tsx (from TimeSeal)
└── EncryptionProgress.tsx

VaultViewer.tsx
├── DecryptedText.tsx (from TimeSeal)
├── PassphraseInput.tsx
├── Button.tsx (from TimeSeal)
├── TextScramble.tsx (from TimeSeal)
└── IdleBlur.tsx (from TimeSeal)
```

---

## ✅ Quality Checklist

For each copied/adapted component:
- [ ] TypeScript types updated
- [ ] Props interface defined
- [ ] Responsive design tested
- [ ] Dark mode working
- [ ] Accessibility (ARIA labels)
- [ ] Error states handled
- [ ] Loading states implemented

---

**Total Components**: 30  
**Direct Copy**: 18 (60%)  
**Adapt**: 6 (20%)  
**Create New**: 6 (20%)  

**Estimated Time**: 15 hours (vs 40+ from scratch)
