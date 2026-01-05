// ============================================================================
// EXTENSION DETECTION - Malicious Extension Protection
// ============================================================================

interface RuntimeAPI {
  runtime: unknown;
}

declare const chrome: RuntimeAPI | undefined;
declare const browser: RuntimeAPI | undefined;

type Severity = 'low' | 'medium' | 'high';

export type SecurityWarning = {
  severity: Severity;
  message: string;
  recommendation: string;
};

/**
 * Detect suspicious browser extensions that could compromise vault security
 * @returns Array of security warnings
 */
export function detectSuspiciousExtensions(): SecurityWarning[] {
  const warnings: Array<SecurityWarning> = [];
  
  // Check for extensions in all browsers
  const hasExtensions = chrome?.runtime || browser?.runtime;
  
  if (hasExtensions) {
    warnings.push({
      severity: 'medium',
      message: 'Browser extensions detected',
      recommendation: 'Disable extensions or use incognito/private mode',
    });
  }
  
  return warnings;
}
