// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import type { EncryptionParams, DecryptionParams, EncryptionResult } from '../crypto/core';
import type { DerivedKeys } from '../crypto/kdf';
import type { Argon2Profile } from '../crypto/constants';

export interface RAMVaultOptions {
  readonly onCleared?: () => void;
}

// ============================================================================
// RAM VAULT CLIENT
// ============================================================================

export class RAMVault {
  private worker: Worker;
  private activityInterval: number | null = null;
  private onCleared?: () => void;
  private requestId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();

  constructor(options?: RAMVaultOptions) {
    this.worker = new Worker(new URL('../../workers/ram.worker.ts', import.meta.url));
    this.onCleared = options?.onCleared;
    this.setupMessageHandler();
    this.setupVisibilityHandler();
  }

  /**
   * Store data in RAM
   * @param data Data to store
   */
  async store(data: Uint8Array): Promise<void> {
    return this.sendRequest('store', data);
  }

  /**
   * Retrieve data from RAM
   * @returns Stored data or null
   */
  async retrieve(): Promise<Uint8Array | null> {
    return this.sendRequest('retrieve', null);
  }

  /**
   * Encrypt data in worker
   * @param params Encryption parameters
   * @returns Encryption result
   */
  async encrypt(params: EncryptionParams): Promise<EncryptionResult> {
    return this.sendRequest('encrypt', params);
  }

  /**
   * Decrypt data in worker
   * @param params Decryption parameters
   * @returns Decrypted plaintext
   */
  async decrypt(params: DecryptionParams): Promise<Uint8Array> {
    return this.sendRequest('decrypt', params);
  }

  /**
   * Derive keys in worker
   * @param passphrase User passphrase
   * @param salt Random salt
   * @param profile Argon2 profile
   * @returns Derived keys
   */
  async deriveKeys(
    passphrase: string,
    salt: Uint8Array,
    profile: Argon2Profile
  ): Promise<DerivedKeys> {
    return this.sendRequest('derive-keys', { passphrase, salt, profile });
  }

  /**
   * Lock vault and clear memory
   */
  lock(): void {
    this.worker.postMessage({ type: 'lock' });
    this.stopActivityTracking();
  }

  /**
   * Terminate worker and cleanup
   */
  destroy(): void {
    this.lock();
    this.worker.terminate();
    this.pending.clear();
  }

  private sendRequest<T>(type: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type, payload, id });
      
      if (type === 'store') {
        this.startActivityTracking();
      }
    });
  }

  private setupMessageHandler(): void {
    this.worker.addEventListener('message', (e: MessageEvent) => {
      const { type, payload, error, id } = e.data;

      if (type === 'vault-cleared' && this.onCleared) {
        this.onCleared();
        return;
      }

      const pending = this.pending.get(id);
      if (!pending) return;

      this.pending.delete(id);

      if (type === 'error') {
        pending.reject(new Error(error));
      } else {
        pending.resolve(payload);
      }
    });
  }

  private startActivityTracking(): void {
    this.activityInterval = window.setInterval(() => {
      this.worker.postMessage({ type: 'activity' });
    }, 30_000);
  }

  private stopActivityTracking(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }

  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.lock();
      }
    });
  }
}
