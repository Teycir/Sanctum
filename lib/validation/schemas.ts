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
  decoyContent: z.instanceof(Uint8Array),
  hiddenContent: z.instanceof(Uint8Array),
  passphrase: z.string().min(1, 'Passphrase required'),
  decoyPassphrase: z.string().optional(),
  argonProfile: z.custom<Argon2Profile>().optional(),
  decoyFilename: z.string().optional(),
  hiddenFilename: z.string().optional()
});

export const UnlockVaultParamsSchema = z.object({
  vaultURL: z.string().url('Invalid vault URL'),
  passphrase: z.string()
});
