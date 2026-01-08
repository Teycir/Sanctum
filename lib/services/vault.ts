// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { uploadVault, downloadVault } from "../storage/vault";
import type { UploadCredentials } from "../storage/uploader";
import { CryptoWorker } from "../workers/crypto";
import { base64UrlEncode, base64UrlDecode } from "../crypto/utils";
import { ARGON2_PROFILES, type Argon2Profile } from "../crypto/constants";
import {
  CreateVaultParamsSchema,
  UnlockVaultParamsSchema,
} from "../validation/schemas";
import type { HiddenVaultResult, LayerContent } from "../duress/layers";
import { generateSplitKeys, deriveMasterKey } from "../crypto/split-key";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/hashes/utils";

export interface CreateVaultParams {
  readonly decoyContent?: Uint8Array;
  readonly hiddenContent: Uint8Array;
  readonly passphrase: string;
  readonly decoyPassphrase?: string;
  readonly panicPassphrase: string; // REQUIRED: Shows "vault erased" message
  readonly argonProfile?: Argon2Profile;
  readonly ipfsCredentials?: UploadCredentials;
  readonly decoyFilename?: string;
  readonly hiddenFilename?: string;
  readonly expiryDays?: 7 | 30 | 90 | 180 | 365; // Vault expiry in days
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
  readonly expiresAt?: number | null; // Unix timestamp when vault expires
  readonly daysUntilExpiry?: number | null; // Days remaining until expiry
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

    // Generate vault ID first (before encryption) for integrity verification
    const vaultId = crypto.randomUUID();

    const vault = await this.crypto.createHiddenVault({
      content,
      passphrase: validated.passphrase,
      decoyPassphrase: validated.decoyPassphrase,
      argonProfile:
        (typeof validated.argonProfile === "string"
          ? ARGON2_PROFILES[validated.argonProfile]
          : validated.argonProfile) || ARGON2_PROFILES.desktop,
      vaultId, // Pass vaultId for integrity embedding
    });

    const stored = await uploadVault(vault, params.ipfsCredentials);

    // Generate split keys (TimeSeal pattern)
    const { keyA, keyB, masterKey } = await generateSplitKeys();

    // Hash panic passphrase (SHA-256) - REQUIRED for security
    if (!params.panicPassphrase) {
      throw new Error("Panic passphrase is required");
    }
    const { sha256 } = await import("@noble/hashes/sha2");
    const hash = sha256(new TextEncoder().encode(params.panicPassphrase));
    const panicPassphraseHash = base64UrlEncode(hash);

    // Calculate expiry timestamp with 5-second buffer for mobile lag
    // This ensures vaults don't expire prematurely due to clock drift or processing delays
    const MOBILE_LAG_BUFFER_MS = 5000; // 5 seconds
    const expiresAt = params.expiryDays
      ? Date.now() +
        params.expiryDays * 24 * 60 * 60 * 1000 +
        MOBILE_LAG_BUFFER_MS
      : null;

    // Encrypt KeyB with server-side secret (server will do this)
    // Client only sends KeyB, server encrypts it with VAULT_ENCRYPTION_SECRET

    // Encrypt CIDs with master key (separate nonces for each CID)
    const decoyNonce = randomBytes(24);
    const hiddenNonce = randomBytes(24);
    const decoyCipher = xchacha20poly1305(masterKey, decoyNonce);
    const hiddenCipher = xchacha20poly1305(masterKey, hiddenNonce);
    const encryptedDecoyCID = decoyCipher.encrypt(
      new TextEncoder().encode(stored.decoyCID),
    );
    const encryptedHiddenCID = hiddenCipher.encrypt(
      new TextEncoder().encode(stored.hiddenCID),
    );

    // Combine nonces for storage
    const combinedNonces = new Uint8Array(48);
    combinedNonces.set(decoyNonce, 0);
    combinedNonces.set(hiddenNonce, 24);

    // Store KeyB + encrypted CIDs on server (server will encrypt KeyB)
    const storeResponse = await fetch("/api/vault/store-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId,
        keyB: base64UrlEncode(keyB),
        encryptedDecoyCID: base64UrlEncode(encryptedDecoyCID),
        encryptedHiddenCID: base64UrlEncode(encryptedHiddenCID),
        salt: base64UrlEncode(vault.salt),
        nonce: base64UrlEncode(combinedNonces),
        provider: stored.provider,
        expiresAt,
        panicPassphraseHash,
      }),
    });

    if (!storeResponse.ok) {
      throw new Error("Failed to store vault metadata");
    }

    // Embed KeyA + vaultId in URL hash
    const urlData = {
      vaultId,
      keyA: base64UrlEncode(keyA),
      salt: base64UrlEncode(vault.salt),
      decoyFilename: params.decoyFilename,
      hiddenFilename: params.hiddenFilename,
    };
    const encodedData = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(urlData)),
    );

    const baseURL =
      globalThis.window === undefined ? "" : globalThis.window.location.origin;
    const vaultURL = `${baseURL}/vault#${encodedData}`;

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
    const validated = this.validateUnlockParams(params);
    const urlData = this.parseVaultURL(validated.vaultURL);
    const serverData = await this.fetchVaultMetadata(urlData.vaultId);
    
    await this.checkPanicPassphrase(validated.passphrase, serverData.panicPassphraseHash);
    this.checkVaultActive(serverData.isActive, serverData.expiresAt);
    
    const vault = await this.downloadAndDecryptVault(urlData, serverData);
    const { content, isDecoy } = await this.unlockVaultContent(vault, validated.passphrase, urlData.vaultId);
    
    return {
      content,
      isDecoy,
      filename: isDecoy ? urlData.decoyFilename : urlData.hiddenFilename,
      expiresAt: serverData.expiresAt,
      daysUntilExpiry: this.calculateDaysUntilExpiry(serverData.expiresAt),
    };
  }

  private validateUnlockParams(params: UnlockVaultParams) {
    const result = UnlockVaultParamsSchema.safeParse(params);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    return result.data;
  }

  private parseVaultURL(vaultURL: string) {
    const hash = vaultURL.split("#")[1];
    if (!hash) {
      throw new Error("Invalid vault URL: missing metadata");
    }
    const urlDataBytes = base64UrlDecode(hash);
    const urlData = JSON.parse(new TextDecoder().decode(urlDataBytes));
    return {
      vaultId: urlData.vaultId,
      keyA: base64UrlDecode(urlData.keyA),
      salt: base64UrlDecode(urlData.salt),
      decoyFilename: urlData.decoyFilename,
      hiddenFilename: urlData.hiddenFilename,
    };
  }

  private async fetchVaultMetadata(vaultId: string) {
    const response = await fetch("/api/vault/get-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultId }),
    });
    if (!response.ok) {
      throw new Error("Vault not found");
    }
    return response.json();
  }

  private async checkPanicPassphrase(passphrase: string, panicPassphraseHash?: string) {
    if (!panicPassphraseHash || !passphrase) return;
    
    const { sha256 } = await import("@noble/hashes/sha2");
    const enteredHash = sha256(new TextEncoder().encode(passphrase));
    
    // Constant-time comparison to prevent timing attacks
    const { constantTimeEqual } = await import("../crypto/utils");
    const storedHashBytes = base64UrlDecode(panicPassphraseHash);
    
    if (constantTimeEqual(enteredHash, storedHashBytes)) {
      throw new Error("Vault content has been deleted from storage providers");
    }
  }

  private checkVaultActive(isActive: boolean, expiresAt?: number) {
    if (!isActive || (expiresAt && Date.now() > expiresAt)) {
      throw new Error("Vault content has been deleted from storage providers");
    }
  }

  private async downloadAndDecryptVault(
    urlData: { vaultId: string; keyA: Uint8Array; salt: Uint8Array; decoyFilename?: string; hiddenFilename?: string },
    serverData: { keyB: string; encryptedDecoyCID: string; encryptedHiddenCID: string; nonce: string; provider: string }
  ): Promise<HiddenVaultResult> {
    const keyB = base64UrlDecode(serverData.keyB);
    const masterKey = await deriveMasterKey(urlData.keyA, keyB);
    const combinedNonces = base64UrlDecode(serverData.nonce);
    
    const decoyCipher = xchacha20poly1305(masterKey, combinedNonces.slice(0, 24));
    const hiddenCipher = xchacha20poly1305(masterKey, combinedNonces.slice(24, 48));
    
    const stored = {
      decoyCID: new TextDecoder().decode(decoyCipher.decrypt(base64UrlDecode(serverData.encryptedDecoyCID))),
      hiddenCID: new TextDecoder().decode(hiddenCipher.decrypt(base64UrlDecode(serverData.encryptedHiddenCID))),
      salt: urlData.salt,
      provider: serverData.provider as "pinata" | "filebase",
      decoyFilename: urlData.decoyFilename,
      hiddenFilename: urlData.hiddenFilename,
    };

    try {
      return await downloadVault(stored);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("not found") || errorMsg.includes("deleted from storage")) {
        throw new Error("Vault content has been deleted from storage providers");
      }
      throw error;
    }
  }

  private async unlockVaultContent(vault: HiddenVaultResult, passphrase: string, vaultId: string) {
    return this.crypto.unlockHiddenVault(vault, passphrase, vaultId);
  }

  private calculateDaysUntilExpiry(expiresAt?: number): number | null {
    if (!expiresAt) return null;
    const msUntilExpiry = expiresAt - Date.now();
    return Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));
  }

  /**
   * Stop workers
   */
  async stop(): Promise<void> {
    this.crypto.terminate();
  }
}
