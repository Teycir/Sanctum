// ============================================================================
// VAULT FORM VALIDATION
// ============================================================================

import { getPasswordError } from './password';

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10 MB

export const sanitizeInput = (input: string): string => {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };
  try {
    return Object.entries(entities).reduce(
      (str, [char, entity]) => str.replaceAll(char, entity),
      input,
    );
  } catch {
    return input;
  }
};

export const validatePassword = (password: string, label: string, allowEmpty: boolean = false): string | null => {
  return getPasswordError(password, label, allowEmpty);
};

export const validateContentSize = (content: string, label: string): string | null => {
  const size = new TextEncoder().encode(content).length;
  if (size > MAX_CONTENT_SIZE) {
    return `${label} too large (${(size / 1024 / 1024).toFixed(2)} MB). Maximum size is 10 MB`;
  }
  return null;
};

export const getFileSize = (file: File): number => file.size;

export const calculateTotalSize = (
  decoyContent: string,
  hiddenContent: string,
  decoyFile?: File,
  hiddenFile?: File
): number => {
  const decoyTextSize = new TextEncoder().encode(decoyContent).length;
  const hiddenTextSize = new TextEncoder().encode(hiddenContent).length;
  const decoyFileSize = decoyFile ? decoyFile.size : 0;
  const hiddenFileSize = hiddenFile ? hiddenFile.size : 0;
  
  // Add 20% overhead for encryption (auth tags, padding, etc.)
  return Math.ceil((decoyTextSize + hiddenTextSize + decoyFileSize + hiddenFileSize) * 1.2);
};

export interface VaultFormData {
  decoyContent: string;
  hiddenContent: string;
  passphrase: string;
  decoyPassphrase: string;
}

export const validateVaultForm = (data: VaultFormData): string | null => {
  const { decoyContent, hiddenContent, passphrase, decoyPassphrase } = data;

  if (!hiddenContent.trim()) {
    return "Please enter hidden content";
  }

  if (!passphrase) {
    return "Please enter a password for hidden layer";
  }

  const passphraseError = validatePassword(passphrase, "Hidden password");
  if (passphraseError) return passphraseError;

  if (decoyContent.trim() && !decoyPassphrase) {
    return "Decoy password is required when decoy content is provided";
  }

  if (decoyPassphrase) {
    const decoyError = validatePassword(decoyPassphrase, "Decoy password", false);
    if (decoyError) return decoyError;

    if (passphrase === decoyPassphrase) {
      return "Hidden password must be different from decoy password";
    }
  }

  const decoyContentError = validateContentSize(decoyContent, "Decoy content");
  if (decoyContentError) return decoyContentError;

  const hiddenError = validateContentSize(hiddenContent, "Hidden content");
  if (hiddenError) return hiddenError;

  return null;
};
