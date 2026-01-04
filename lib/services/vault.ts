// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import {
  uploadVault,
  downloadVault,
  serializeVaultMetadata,
  deserializeVaultMetadata,
} from "../storage/vault";
import type { UploadCredentials } from "../storage/uploader";
import { CryptoWorker } from "../workers/crypto";
import { base64UrlEncode, base64UrlDecode } from "../crypto/utils";
import { ARGON2_PROFILES, type Argon2Profile } from "../crypto/constants";
import {
  CreateVaultParamsSchema,
  UnlockVaultParamsSchema,
} from "../validation/schemas";
import type { LayerContent } from "../duress/layers";

export interface CreateVaultParams {
  readonly decoyContent?: Uint8Array;
  readonly hiddenContent: Uint8Array;
  readonly passphrase: string;
  readonly decoyPassphrase?: string;
  readonly argonProfile?: Argon2Profile;
  readonly ipfsCredentials?: UploadCredentials;
  readonly decoyFilename?: string;
  readonly hiddenFilename?: string;
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
  readonly filename?: string;
}

// ============================================================================
// VAULT SERVICE
// ============================================================================

export class VaultService {
  private readonly crypto: CryptoWorker;

  constructor() {
    this.crypto = new CryptoWorker();
  }

  /**
   * Create hidden vault and upload to IPFS
   * @param params Vault creation parameters
   * @returns Vault URL with embedded metadata
   * @throws Error if validation fails, encryption fails, or upload fails
   */
  async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
    const result = CreateVaultParamsSchema.safeParse(params);
    if (!result.success) {
      const firstError = result.error.issues[0];
      throw new Error(firstError.message);
    }
    const validated = result.data;

    const content: LayerContent = {
      decoy: validated.decoyContent || new Uint8Array(0),
      hidden: validated.hiddenContent,
    };

    // Use worker for non-blocking Argon2
    const vault = await this.crypto.createHiddenVault({
      content,
      passphrase: validated.passphrase,
      decoyPassphrase: validated.decoyPassphrase,
      argonProfile:
        (typeof validated.argonProfile === "string"
          ? ARGON2_PROFILES[validated.argonProfile]
          : validated.argonProfile) || ARGON2_PROFILES.desktop,
    });

    const stored = await uploadVault(vault, params.ipfsCredentials);
    
    // Add filenames to metadata
    const storedWithFilenames = {
      ...stored,
      decoyFilename: params.decoyFilename,
      hiddenFilename: params.hiddenFilename
    };
    
    const metadata = serializeVaultMetadata(storedWithFilenames);
    const encodedMetadata = base64UrlEncode(metadata);

    const baseURL =
      globalThis.window === undefined
        ? ""
        : globalThis.window.location.origin;
    const vaultURL = `${baseURL}/vault#${encodedMetadata}`;

    return {
      vaultURL,
      decoyCID: stored.decoyCID,
      hiddenCID: stored.hiddenCID,
    };
  }

  /**
   * Unlock vault from URL
   * @param params Unlock parameters
   * @returns Decrypted content
   * @throws Error if URL invalid, download fails, or decryption fails
   */
  async unlockVault(params: UnlockVaultParams): Promise<UnlockVaultResult> {
    const result = UnlockVaultParamsSchema.safeParse(params);
    if (!result.success) {
      const firstError = result.error.issues[0];
      throw new Error(firstError.message);
    }
    const validated = result.data;

    const hash = validated.vaultURL.split("#")[1];
    if (!hash) {
      throw new Error("Invalid vault URL: missing metadata");
    }

    const metadata = base64UrlDecode(hash);
    const stored = deserializeVaultMetadata(metadata);

    // Download directly from Pinata gateway (no JWT needed for public reads)
    const vault = await downloadVault(stored);

    // Use worker for non-blocking Argon2
    const { content, isDecoy } = await this.crypto.unlockHiddenVault(
      vault,
      validated.passphrase,
    );
    const filename = isDecoy ? stored.decoyFilename : stored.hiddenFilename;

    return { content, isDecoy, filename };
  }

  /**
   * Stop workers
   */
  async stop(): Promise<void> {
    this.crypto.terminate();
  }
}
