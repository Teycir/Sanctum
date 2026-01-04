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
import {
  generateSplitKeys,
  deriveMasterKey,
  encryptKeyB,
  decryptKeyB,
  serializeKeyB,
  deserializeKeyB,
} from "../crypto/split-key";
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';

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
    
    // Generate split keys (TimeSeal pattern)
    const { keyA, keyB, masterKey } = await generateSplitKeys();
    const vaultId = crypto.randomUUID();
    
    // Encrypt KeyB with server-side secret (server will do this)
    // Client only sends KeyB, server encrypts it with VAULT_ENCRYPTION_SECRET
    
    // Encrypt CIDs with master key (separate nonces for each CID)
    const decoyNonce = randomBytes(24);
    const hiddenNonce = randomBytes(24);
    const decoyCipher = xchacha20poly1305(masterKey, decoyNonce);
    const hiddenCipher = xchacha20poly1305(masterKey, hiddenNonce);
    const encryptedDecoyCID = decoyCipher.encrypt(new TextEncoder().encode(stored.decoyCID));
    const encryptedHiddenCID = hiddenCipher.encrypt(new TextEncoder().encode(stored.hiddenCID));
    
    // Combine nonces for storage
    const combinedNonces = new Uint8Array(48);
    combinedNonces.set(decoyNonce, 0);
    combinedNonces.set(hiddenNonce, 24);
    
    // Store KeyB + encrypted CIDs on server (server will encrypt KeyB)
    const storeResponse = await fetch('/api/vault/store-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vaultId,
        keyB: base64UrlEncode(keyB),
        encryptedDecoyCID: base64UrlEncode(encryptedDecoyCID),
        encryptedHiddenCID: base64UrlEncode(encryptedHiddenCID),
        salt: base64UrlEncode(vault.salt),
        nonce: base64UrlEncode(combinedNonces),
      }),
    });
    
    if (!storeResponse.ok) {
      throw new Error('Failed to store vault metadata');
    }
    
    // Embed KeyA + vaultId in URL hash
    const urlData = {
      vaultId,
      keyA: base64UrlEncode(keyA),
      salt: base64UrlEncode(vault.salt),
      decoyFilename: params.decoyFilename,
      hiddenFilename: params.hiddenFilename,
    };
    const encodedData = base64UrlEncode(new TextEncoder().encode(JSON.stringify(urlData)));

    const baseURL =
      globalThis.window === undefined
        ? ""
        : globalThis.window.location.origin;
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

    // Decode URL data (contains vaultId + KeyA + salt)
    const urlDataBytes = base64UrlDecode(hash);
    const urlDataStr = new TextDecoder().decode(urlDataBytes);
    const urlData = JSON.parse(urlDataStr);
    
    const { vaultId, keyA: keyAEncoded, salt: saltEncoded, decoyFilename, hiddenFilename } = urlData;
    const keyA = base64UrlDecode(keyAEncoded);
    const salt = base64UrlDecode(saltEncoded);
    
    // Fetch decrypted KeyB and encrypted CIDs from server
    // Server decrypts KeyB using VAULT_ENCRYPTION_SECRET before sending
    const fetchResponse = await fetch('/api/vault/get-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaultId }),
    });
    if (!fetchResponse.ok) {
      throw new Error('Vault not found');
    }
    const { keyB: keyBEncoded, encryptedDecoyCID, encryptedHiddenCID, nonce } = await fetchResponse.json();
    
    // Decode KeyB (already decrypted by server)
    const keyB = base64UrlDecode(keyBEncoded);
    
    // Derive master key and decrypt CIDs
    const masterKey = await deriveMasterKey(keyA, keyB);
    const combinedNonces = base64UrlDecode(nonce);
    const decoyNonce = combinedNonces.slice(0, 24);
    const hiddenNonce = combinedNonces.slice(24, 48);
    
    const decoyCipher = xchacha20poly1305(masterKey, decoyNonce);
    const hiddenCipher = xchacha20poly1305(masterKey, hiddenNonce);
    
    const decoyCID = new TextDecoder().decode(
      decoyCipher.decrypt(base64UrlDecode(encryptedDecoyCID))
    );
    const hiddenCID = new TextDecoder().decode(
      hiddenCipher.decrypt(base64UrlDecode(encryptedHiddenCID))
    );
    
    // Reconstruct stored metadata for download
    const stored = {
      decoyCID,
      hiddenCID,
      salt,
      decoyFilename,
      hiddenFilename,
    };

    const vault = await downloadVault(stored);

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
