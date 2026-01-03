// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { generateSplitKeys, encryptKeyA, serializeKeyA, deserializeKeyA, decryptKeyA, deriveMasterKey } from '../crypto/split-key';
import { base64UrlEncode, base64UrlDecode } from '../crypto/utils';
import { randomBytes } from '@noble/hashes/utils';
import type { HiddenVaultResult, LayerContent } from '../duress/layers';
import { createHiddenVault, unlockHiddenVault } from '../duress/layers';
import { uploadToIPFS, type UploadCredentials } from '../storage/uploader';
import type { Argon2Profile } from '../crypto/constants';
import { constantTimeSelect } from '../duress/timing';
import { generateCIDKey, encryptCID, decryptCID } from '../api/cid-encryption';

export interface SplitKeyVaultParams {
  readonly content: LayerContent;
  readonly passphrase: string;
  readonly decoyPassphrase?: string;
  readonly argonProfile: Argon2Profile;
  readonly ipfsCredentials: UploadCredentials;
}

export interface SplitKeyVaultResult {
  readonly vaultURL: string;
  readonly vaultId: string;
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Create vault with split-key encryption
 */
export async function createSplitKeyVault(
  params: SplitKeyVaultParams
): Promise<SplitKeyVaultResult> {
  const { keyA, keyB, masterKey } = await generateSplitKeys();
  const vaultId = base64UrlEncode(randomBytes(16));

  const vault = createHiddenVault({
    content: params.content,
    passphrase: params.passphrase,
    decoyPassphrase: params.decoyPassphrase,
    argonProfile: params.argonProfile,
  });

  const { xchacha20poly1305 } = await import('@noble/ciphers/chacha');
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(masterKey, nonce);
  
  const decoyEncrypted = cipher.encrypt(vault.decoyBlob);
  const hiddenEncrypted = cipher.encrypt(vault.hiddenBlob);

  const decoyResult = await uploadToIPFS(decoyEncrypted, params.ipfsCredentials);
  const hiddenResult = await uploadToIPFS(hiddenEncrypted, params.ipfsCredentials);

  const cidKey = generateCIDKey();
  const encryptedDecoyCID = encryptCID(decoyResult.cid, cidKey);
  const encryptedHiddenCID = encryptCID(hiddenResult.cid, cidKey);

  const encryptedKeyA = encryptKeyA(keyA, vaultId);
  const serializedKeyA = serializeKeyA(encryptedKeyA);

  await fetch('/api/vault/store-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vaultId,
      encryptedKeyA: serializedKeyA,
      decoyCID: encryptedDecoyCID,
      hiddenCID: encryptedHiddenCID,
      salt: base64UrlEncode(vault.salt),
      nonce: base64UrlEncode(nonce),
      cidKey: base64UrlEncode(cidKey),
    }),
  });

  const baseURL = globalThis.window?.location.origin || '';
  const vaultURL = `${baseURL}/vault#${vaultId}|${base64UrlEncode(keyB)}`;

  return { vaultURL, vaultId };
}

/**
 * Unlock vault with split-key decryption
 */
export async function unlockSplitKeyVault(
  vaultURL: string,
  passphrase: string
): Promise<Uint8Array> {
  const hash = vaultURL.split('#')[1];
  if (!hash) throw new Error('Invalid vault URL');

  const [vaultId, keyBEncoded] = hash.split('|');
  const keyB = base64UrlDecode(keyBEncoded);

  const response = await fetch(`/api/vault/retrieve-key?vaultId=${vaultId}`);
  if (!response.ok) throw new Error('Vault not found');

  const data = await response.json();
  const { encryptedKeyA, decoyCID, hiddenCID, salt, nonce, cidKey } = data;

  const { encrypted, nonce: keyNonce } = deserializeKeyA(encryptedKeyA);
  const keyA = decryptKeyA(encrypted, keyNonce, vaultId);
  const masterKey = await deriveMasterKey(keyA, keyB);

  const cidKeyBytes = base64UrlDecode(cidKey);
  const decryptedDecoyCID = decryptCID(decoyCID, cidKeyBytes);
  const decryptedHiddenCID = decryptCID(hiddenCID, cidKeyBytes);

  const { PinataClient } = await import('../storage/pinata');
  const pinata = new PinataClient('');
  
  const decoyEncrypted = await pinata.download(decryptedDecoyCID);
  const hiddenEncrypted = await pinata.download(decryptedHiddenCID);
  
  const { xchacha20poly1305 } = await import('@noble/ciphers/chacha');
  const masterNonce = base64UrlDecode(nonce);
  const cipher = xchacha20poly1305(masterKey, masterNonce);
  
  const decoyBlob = constantTimeSelect(
    true,
    () => cipher.decrypt(decoyEncrypted),
    () => cipher.decrypt(hiddenEncrypted)
  );
  const hiddenBlob = constantTimeSelect(
    true,
    () => cipher.decrypt(hiddenEncrypted),
    () => cipher.decrypt(decoyEncrypted)
  );

  const vault: HiddenVaultResult = {
    decoyBlob,
    hiddenBlob,
    salt: base64UrlDecode(salt),
  };

  return unlockHiddenVault(vault, passphrase);
}
