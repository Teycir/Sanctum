// ============================================================================
// RAM-ONLY VAULT WORKER
// ============================================================================

import { TIMING } from '../lib/crypto/constants';
import { encrypt, decrypt } from '../lib/crypto/core';
import { deriveKeys } from '../lib/crypto/kdf';
import type { EncryptionParams, DecryptionParams } from '../lib/crypto/core';
import type { Argon2Profile } from '../lib/crypto/constants';

interface VaultState {
  data: Uint8Array | null;
  idleTimer: number | null;
}

const state: VaultState = {
  data: null,
  idleTimer: null
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function clearVault(): void {
  if (state.data) {
    crypto.getRandomValues(state.data);
    state.data = null;
  }
  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }
  self.postMessage({ type: 'vault-cleared' });
}

function resetIdleTimer(): void {
  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
  }
  state.idleTimer = self.setTimeout(clearVault, TIMING.idleTimeout) as unknown as number;
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case 'store':
        state.data = new Uint8Array(payload);
        resetIdleTimer();
        self.postMessage({ type: 'stored', id });
        break;

      case 'retrieve':
        resetIdleTimer();
        self.postMessage({ type: 'data', payload: state.data, id });
        break;

      case 'activity':
        resetIdleTimer();
        break;

      case 'lock':
        clearVault();
        break;

      case 'encrypt': {
        const params = payload as EncryptionParams;
        const result = encrypt(params);
        self.postMessage({ type: 'encrypt-result', payload: result, id });
        break;
      }

      case 'decrypt': {
        const params = payload as DecryptionParams;
        const result = decrypt(params);
        self.postMessage({ type: 'decrypt-result', payload: result, id });
        break;
      }

      case 'derive-keys': {
        const { passphrase, salt, profile } = payload as {
          passphrase: string;
          salt: Uint8Array;
          profile: Argon2Profile;
        };
        const result = deriveKeys(passphrase, salt, profile);
        self.postMessage({ type: 'derive-keys-result', payload: result, id });
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

self.addEventListener('unload', clearVault);
