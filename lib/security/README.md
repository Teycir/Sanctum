# Security Module

Reusable security hooks for React applications handling sensitive data.

## Features

- **Auto-Lock**: Automatically lock/clear sensitive data after inactivity
- **Panic Key**: Emergency lockout with configurable key combinations
- **Secure Clipboard**: Auto-clearing clipboard for sensitive data

## Installation

```bash
# Copy lib/security to your project
cp -r lib/security your-project/lib/
```

## Usage

### Auto-Lock

```tsx
import { useAutoLock } from '@/lib/security';

function VaultPage() {
  const clearSensitiveData = () => {
    // Clear vault content, keys, etc.
  };

  // Default: 5 minutes timeout
  useAutoLock(clearSensitiveData);

  // Custom timeout
  useAutoLock(clearSensitiveData, { timeoutMs: 10 * 60 * 1000 });

  // Custom events
  useAutoLock(clearSensitiveData, {
    timeoutMs: 300000,
    events: ['mousedown', 'keydown', 'touchstart']
  });
}
```

### Panic Key

```tsx
import { usePanicKey } from '@/lib/security';

function VaultPage() {
  const lockVault = () => {
    // Immediately lock vault
  };

  // Default: Double Escape
  usePanicKey(lockVault);

  // Custom key
  usePanicKey(lockVault, { key: 'l' });

  // With modifiers
  usePanicKey(lockVault, {
    key: 'l',
    requireCtrl: true,
    requireShift: true
  });

  // Custom delay
  usePanicKey(lockVault, { doublePressDelayMs: 300 });
}
```

### Secure Clipboard

```tsx
import { useSecureClipboard } from '@/lib/security';

function VaultContent() {
  const { copied, copyToClipboard } = useSecureClipboard();

  // Default: 60 seconds auto-clear
  const handleCopy = async () => {
    await copyToClipboard('sensitive data');
  };

  // Custom delays
  const { copied, copyToClipboard } = useSecureClipboard({
    autoClearDelayMs: 30000,
    copiedStateResetMs: 1000
  });

  return (
    <button onClick={handleCopy} disabled={copied}>
      {copied ? '✓ Copied! (Auto-clears in 60s)' : 'Copy'}
    </button>
  );
}
```

## API Reference

### useAutoLock

```ts
function useAutoLock(
  onLock: () => void,
  config?: Partial<AutoLockConfig>
): void

interface AutoLockConfig {
  timeoutMs: number;           // Default: 300000 (5 min)
  events?: readonly string[];  // Default: ['mousedown', 'keydown', 'scroll', 'touchstart']
}
```

### usePanicKey

```ts
function usePanicKey(
  onPanic: () => void,
  config?: Partial<PanicKeyConfig>
): void

interface PanicKeyConfig {
  key: string;                 // Default: 'Escape'
  doublePressDelayMs: number;  // Default: 500
  requireCtrl?: boolean;       // Default: false
  requireShift?: boolean;      // Default: false
}
```

### useSecureClipboard

```ts
function useSecureClipboard(
  config?: Partial<SecureClipboardConfig>
): SecureClipboardResult

interface SecureClipboardConfig {
  autoClearDelayMs: number;    // Default: 60000 (60s)
  copiedStateResetMs: number;  // Default: 2000
}

interface SecureClipboardResult {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<void>;
}
```

## Testing

```bash
npm test __tests__/security
```

## License

Same as parent project (BSL 1.1)
