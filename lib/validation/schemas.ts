// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod';
import type { Argon2Profile } from '../crypto/constants';
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from './password';

export const StoredVaultSchema = z.object({
  decoyCID: z.string().min(1, 'Decoy CID required'),
  hiddenCID: z.string().min(1, 'Hidden CID required'),
  salt: z.instanceof(Uint8Array).refine(
    (data) => data.length === 32,
    'Salt must be 32 bytes'
  ),
  provider: z.enum(['pinata', 'filebase']),
  decoyFilename: z.string().optional(),
  hiddenFilename: z.string().optional()
});

export const CreateVaultParamsSchema = z.object({
  decoyContent: z.instanceof(Uint8Array).optional(),
  hiddenContent: z.instanceof(Uint8Array),
  passphrase: z.string().min(12, 'Hidden password must be at least 12 characters'),
  decoyPassphrase: z.string().min(12, 'Decoy password must be at least 12 characters').optional(),
  panicPassphrase: z.string().min(12, 'Panic password must be at least 12 characters'),
  argonProfile: z.custom<Argon2Profile>().optional(),
  decoyFilename: z.string().optional(),
  hiddenFilename: z.string().optional()
}).refine(
  (data) => !data.decoyContent || (data.decoyContent.length === 0) || data.decoyPassphrase,
  { message: 'Decoy passphrase required when decoy content is provided', path: ['decoyPassphrase'] }
).refine(
  (data) => data.panicPassphrase !== data.passphrase,
  { message: 'Panic passphrase must be different from hidden passphrase', path: ['panicPassphrase'] }
).refine(
  (data) => !data.decoyPassphrase || data.panicPassphrase !== data.decoyPassphrase,
  { message: 'Panic passphrase must be different from decoy passphrase', path: ['panicPassphrase'] }
);

export const UnlockVaultParamsSchema = z.object({
  vaultURL: z.string().min(1, 'Vault URL required').refine(
    (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid vault URL' }
  ),
  passphrase: z.string().refine(
    (pass) => isValidPassword(pass),
    { message: PASSWORD_REQUIREMENTS_MESSAGE }
  )
});
