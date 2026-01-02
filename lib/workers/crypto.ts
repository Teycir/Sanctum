// ============================================================================
// CRYPTO WORKER WRAPPER
// ============================================================================

import type { HiddenVaultParams, HiddenVaultResult } from '../duress/layers';

export class CryptoWorker {
  private worker: Worker | null = null;
  private messageId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();

  async init(): Promise<void> {
    if (this.worker) return;
    
    this.worker = new Worker(new URL('../../workers/crypto.worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload, id, error } = e.data;
      const pending = this.pending.get(id);
      
      if (!pending) return;
      
      this.pending.delete(id);
      
      if (type === 'error') {
        pending.reject(new Error(error));
      } else {
        pending.resolve(payload);
      }
    };
  }

  async createHiddenVault(params: HiddenVaultParams): Promise<HiddenVaultResult> {
    if (!this.worker) await this.init();
    
    const id = this.messageId++;
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: 'create-vault', payload: params, id });
    });
  }

  async unlockHiddenVault(result: HiddenVaultResult, passphrase: string): Promise<Uint8Array> {
    if (!this.worker) await this.init();
    
    const id = this.messageId++;
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: 'unlock-vault', payload: { result, passphrase }, id });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
