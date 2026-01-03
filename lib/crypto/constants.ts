// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Argon2Profile {
  readonly m: number; // Memory (KB)
  readonly t: number; // Time (iterations)
  readonly p: number; // Parallelism (threads)
  readonly dkLen: number; // Derived key length
}

export type Argon2ProfileName = "mobile" | "desktop" | "paranoid";
export type VaultMode = "simple" | "hidden" | "chain";

// ============================================================================
// CONSTANTS - VAULT FORMAT
// ============================================================================

export const VAULT_VERSION = 0x03 as const;

export const BLOB_SIZES = {
  header: 9,
  salt: 32,
  nonce: 24,
  commitment: 32,
  authTag: 16,
} as const;

// ============================================================================
// CONSTANTS - ARGON2ID PROFILES
// ============================================================================

export const ARGON2_PROFILES: Record<Argon2ProfileName, Argon2Profile> = {
  mobile: { m: 65536, t: 3, p: 1, dkLen: 32 }, // 64 MB
  desktop: { m: 262144, t: 3, p: 2, dkLen: 32 }, // 256 MB
  paranoid: { m: 1048576, t: 4, p: 4, dkLen: 32 }, // 1 GB
} as const;

// ============================================================================
// CONSTANTS - SIZE CLASSES
// ============================================================================

export const SIZE_CLASSES = [
  1 * 1024, // 1 KB
  4 * 1024, // 4 KB
  16 * 1024, // 16 KB
  64 * 1024, // 64 KB
  256 * 1024, // 256 KB
  1 * 1024 * 1024, // 1 MB
  4 * 1024 * 1024, // 4 MB
  16 * 1024 * 1024, // 16 MB
  64 * 1024 * 1024, // 64 MB
  256 * 1024 * 1024, // 256 MB
] as const;

export const MAX_VAULT_SIZE = SIZE_CLASSES.at(-1) ?? 256 * 1024 * 1024;

// ============================================================================
// CONSTANTS - HKDF CONTEXTS
// ============================================================================

export const HKDF_CONTEXTS = {
  encryption: "duressvault-encryption-v3",
  commitment: "duressvault-commitment-v3",
  layerDerivation: "duressvault-layer-v3",
} as const;

// ============================================================================
// CONSTANTS - TIMING
// ============================================================================

export const TIMING = {
  idleTimeout: 60_000, // 60 seconds
  hiddenTimeout: 15_000, // 15 seconds
  clipboardClear: 30_000, // 30 seconds
  activityPing: 30_000, // 30 seconds
} as const;

// ============================================================================
// CONSTANTS - VAULT MODES
// ============================================================================

export const VAULT_MODES = {
  simple: 0x01,
  hidden: 0x02,
  chain: 0x03,
} as const;
