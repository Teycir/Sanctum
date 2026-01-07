// ============================================================================
// CRYPTO WORKER WRAPPER
// ============================================================================

import type {
  HiddenVaultParams,
  HiddenVaultResult,
  UnlockResult,
} from "../duress/layers";
import { createHiddenVault, unlockHiddenVault } from "../duress/layers";

// Detect if we're in a test/Node environment
const isNode = typeof process !== 'undefined' && process.versions?.node;

export class CryptoWorker {
  private worker: Worker | null = null;
  private messageId = 0;
  private readonly pending = new Map<
    number,
    {
      resolve: (value: HiddenVaultResult | UnlockResult) => void;
      reject: (error: Error) => void;
    }
  >();

  async init(): Promise<void> {
    if (this.worker) return;
    
    // Skip Worker initialization in Node/test environment
    if (isNode) return;

    this.worker = new Worker(new URL("./crypto.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload, id, error } = e.data;
      const pending = this.pending.get(id);

      if (!pending) return;

      this.pending.delete(id);

      if (type === "error") {
        pending.reject(new Error(error));
      } else {
        pending.resolve(payload);
      }
    };
  }

  async createHiddenVault(
    params: HiddenVaultParams,
  ): Promise<HiddenVaultResult> {
    // Use inline crypto in Node/test environment
    if (isNode) {
      return createHiddenVault(params);
    }
    
    if (!this.worker) await this.init();

    const id = this.messageId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: HiddenVaultResult | UnlockResult) => void, reject });
      this.worker!.postMessage({ type: "create-vault", payload: params, id });
    });
  }

  async unlockHiddenVault(
    result: HiddenVaultResult,
    passphrase: string,
    vaultId?: string,
  ): Promise<UnlockResult> {
    // Use inline crypto in Node/test environment
    if (isNode) {
      return unlockHiddenVault(result, passphrase, vaultId);
    }
    
    if (!this.worker) await this.init();

    const id = this.messageId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: HiddenVaultResult | UnlockResult) => void, reject });
      this.worker!.postMessage({
        type: "unlock-vault",
        payload: { result, passphrase, vaultId },
        id,
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
