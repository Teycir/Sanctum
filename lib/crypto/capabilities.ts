// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BrowserCapabilities {
  readonly sharedArrayBuffer: boolean;
  readonly crossOriginIsolated: boolean;
  readonly webWorkers: boolean;
  readonly webCrypto: boolean;
  readonly bigInt: boolean;
  readonly wasm: boolean;
  readonly recommendedProfile: 'mobile' | 'desktop' | 'paranoid';
  readonly warnings: string[];
  readonly errors: string[];
}

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Detect browser capabilities
 * @returns Browser capabilities and recommendations
 */
export function detectCapabilities(): BrowserCapabilities {
  const warnings: string[] = [];
  const errors: string[] = [];

  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const crossOriginIsolated = typeof globalThis.crossOriginIsolated !== 'undefined' && globalThis.crossOriginIsolated;
  const webWorkers = typeof Worker !== 'undefined';
  const webCrypto = typeof crypto?.subtle !== 'undefined';
  const bigInt = typeof BigInt !== 'undefined';
  const wasm = typeof WebAssembly !== 'undefined';

  if (!webWorkers) {
    errors.push('Web Workers not supported - Sanctum cannot run');
  }
  if (!webCrypto) {
    errors.push('Web Crypto API not supported - Sanctum cannot run');
  }
  if (!wasm) {
    errors.push('WebAssembly not supported - Argon2 cannot run');
  }

  if (!sharedArrayBuffer) {
    warnings.push('SharedArrayBuffer not available - using reduced Argon2 parameters');
  }
  if (!crossOriginIsolated) {
    warnings.push('Cross-origin isolation not enabled - some features limited');
  }

  const memory = (navigator as any).deviceMemory;
  let recommendedProfile: 'mobile' | 'desktop' | 'paranoid' = 'mobile';

  if (memory && memory >= 8 && crossOriginIsolated) {
    recommendedProfile = 'paranoid';
  } else if (memory && memory >= 4) {
    recommendedProfile = 'desktop';
  }

  return {
    sharedArrayBuffer,
    crossOriginIsolated,
    webWorkers,
    webCrypto,
    bigInt,
    wasm,
    recommendedProfile,
    warnings,
    errors
  };
}
