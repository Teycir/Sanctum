// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod';
import type { Argon2Profile } from '../crypto/constants';

export const StoredVaultSchema = z.object({
  decoyCID: z.string().min(1, 'Decoy CID required'),
  hiddenCID: z.string().min(1, 'Hidden CID required'),
  salt: z.instanceof(Uint8Array).refine(
    (data) => data.length === 32,
    'Salt must be 32 bytes'
  ),
  decoyFilename: z.string().optional(),
  hiddenFilename: z.string().optional()
});

export const CreateVaultParamsSchema = z.object({
  decoyContent: z.instanceof(Uint8Array).optional(),
  hiddenContent: z.instanceof(Uint8Array),
  passphrase: z.string().min(8, 'Passphrase must be at least 8 characters'),
  decoyPassphrase: z.string().min(8, 'Decoy passphrase must be at least 8 characters').optional(),
  argonProfile: z.custom<Argon2Profile>().optional(),
  decoyFilename: z.string().optional(),
  hiddenFilename: z.string().optional()
}).refine(
  (data) => !data.decoyContent || data.decoyPassphrase,
  { message: 'Decoy passphrase required when decoy content is provided', path: ['decoyPassphrase'] }
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
  passphrase: z.string().min(8, 'Passphrase must be at least 8 characters')
});
