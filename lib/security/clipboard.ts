import { useState, useCallback } from 'react';
import { SECURITY } from '../crypto/constants';

export interface SecureClipboardConfig {
  readonly autoClearDelayMs: number;
  readonly copiedStateResetMs: number;
}

const DEFAULT_CONFIG: SecureClipboardConfig = {
  autoClearDelayMs: SECURITY.clipboardAutoClear,
  copiedStateResetMs: SECURITY.clipboardCopiedStateReset,
};

export interface SecureClipboardResult {
  readonly copied: boolean;
  readonly copyToClipboard: (text: string) => Promise<void>;
}

/**
 * Secure clipboard hook that auto-clears after delay
 * @param config - Configuration options
 * @returns Object with copied state and copyToClipboard function
 * @example
 * ```ts
 * const { copied, copyToClipboard } = useSecureClipboard({ autoClearDelayMs: 30000 });
 * await copyToClipboard('sensitive data');
 * ```
 */
export function useSecureClipboard(
  config: Partial<SecureClipboardConfig> = {}
): SecureClipboardResult {
  const { autoClearDelayMs, copiedStateResetMs } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch (error) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            return; // User denied clipboard permission
          }
          throw error;
        }
      }, autoClearDelayMs);

      setTimeout(() => setCopied(false), copiedStateResetMs);
    },
    [autoClearDelayMs, copiedStateResetMs]
  );

  return { copied, copyToClipboard };
}
