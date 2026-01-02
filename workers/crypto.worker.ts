// ============================================================================
// CRYPTO WORKER - Non-blocking Argon2
// ============================================================================

import { createHiddenVault, unlockHiddenVault } from '../lib/duress/layers';
import type { HiddenVaultParams, HiddenVaultResult } from '../lib/duress/layers';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case 'create-vault': {
        const params = payload as HiddenVaultParams;
        const result = createHiddenVault(params);
        self.postMessage({ type: 'create-vault-result', payload: result, id });
        break;
      }

      case 'unlock-vault': {
        const { result, passphrase } = payload as { result: HiddenVaultResult; passphrase: string };
        const content = unlockHiddenVault(result, passphrase);
        self.postMessage({ type: 'unlock-vault-result', payload: content, id });
        break;
      }

      default:
        self.postMessage({ type: 'error', error: 'Unknown message type', id });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
  }
};
