// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import {
  uploadVault,
  downloadVault,
  serializeVaultMetadata,
  deserializeVaultMetadata,
} from "../storage/vault";
import { CryptoWorker } from "../workers/crypto";
import { base64UrlEncode, base64UrlDecode } from "../crypto/utils";
import { ARGON2_PROFILES, type Argon2Profile } from "../crypto/constants";
import {
  CreateVaultParamsSchema,
  UnlockVaultParamsSchema,
} from "../validation/schemas";
import type { LayerContent } from "../duress/layers";

export interface CreateVaultParams {
  readonly decoyContent: Uint8Array;
  readonly hiddenContent: Uint8Array;
  readonly passphrase: string;
  readonly duressPassphrase?: string;
  readonly argonProfile?: Argon2Profile;
  readonly ipfsCredentials?: {
    pinataJWT: string;
  };
}

export interface CreateVaultResult {
  readonly vaultURL: string;
  readonly decoyCID: string;
  readonly hiddenCID: string;
}

export interface UnlockVaultParams {
  readonly vaultURL: string;
  readonly passphrase: string;
}

export interface UnlockVaultResult {
  readonly content: Uint8Array;
  readonly isDecoy: boolean;
}

// ============================================================================
// VAULT SERVICE
// ============================================================================

export class VaultService {
  private crypto: CryptoWorker;

  constructor() {
    this.crypto = new CryptoWorker();
  }

  /**
   * Create hidden vault and upload to IPFS
   * @param params Vault creation parameters
   * @returns Vault URL with embedded metadata
   */
  async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
    try {
      const validated = CreateVaultParamsSchema.parse(params);

      const content: LayerContent = {
        decoy: validated.decoyContent,
        hidden: validated.hiddenContent,
      };

      // Use worker for non-blocking Argon2
      const vault = await this.crypto.createHiddenVault({
        content,
        passphrase: validated.passphrase,
        duressPassphrase: validated.duressPassphrase,
        argonProfile:
          (typeof validated.argonProfile === "string"
            ? ARGON2_PROFILES[validated.argonProfile]
            : validated.argonProfile) || ARGON2_PROFILES.desktop,
      });

      const stored = await uploadVault(vault, params.ipfsCredentials);
      const metadata = serializeVaultMetadata(stored);
      const encodedMetadata = base64UrlEncode(metadata);

      const baseURL =
        globalThis.window === undefined
          ? ""
          : globalThis.window.location.origin;
      const vaultURL = `${baseURL}/v#${encodedMetadata}`;

      return {
        vaultURL,
        decoyCID: stored.decoyCID,
        hiddenCID: stored.hiddenCID,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create vault: ${error.message}`);
      }
      throw new Error("Failed to create vault");
    }
  }

  /**
   * Unlock vault from URL
   * @param params Unlock parameters
   * @returns Decrypted content
   */
  async unlockVault(params: UnlockVaultParams): Promise<UnlockVaultResult> {
    try {
      const validated = UnlockVaultParamsSchema.parse(params);

      const hash = validated.vaultURL.split("#")[1];
      if (!hash) {
        throw new Error("Invalid vault URL: missing metadata");
      }

      const metadata = base64UrlDecode(hash);
      const stored = deserializeVaultMetadata(metadata);

      // Download directly from Pinata gateway (no JWT needed for public reads)
      const vault = await downloadVault(stored);

      // Use worker for non-blocking Argon2
      const content = await this.crypto.unlockHiddenVault(
        vault,
        validated.passphrase,
      );
      const isDecoy = validated.passphrase === "";

      return { content, isDecoy };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unlock vault: ${error.message}`);
      }
      throw new Error("Failed to unlock vault");
    }
  }

  /**
   * Stop workers
   */
  async stop(): Promise<void> {
    try {
      this.crypto.terminate();
    } catch (workerError) {
      console.error("Worker termination failed:", workerError);
    }
  }
}
