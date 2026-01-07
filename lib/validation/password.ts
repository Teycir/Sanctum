// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validates password strength requirements
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - OR empty string (for decoy layer without password)
 * 
 * @param password Password to validate
 * @returns true if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  // Allow empty passphrase for decoy layer without password
  if (password === '') return true;
  
  // Enforce strict validation for non-empty passwords
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/**
 * Get detailed password validation error message
 * 
 * @param password Password to validate
 * @param label Label for the password field (e.g., "Hidden password")
 * @returns Error message or null if valid
 */
export function getPasswordError(password: string, label: string = 'Password'): string | null {
  if (password === '') return null; // Empty is valid
  
  if (password.length < 12) {
    return `${label} must be at least 12 characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return `${label} must contain at least one uppercase letter`;
  }
  if (!/[a-z]/.test(password)) {
    return `${label} must contain at least one lowercase letter`;
  }
  if (!/\d/.test(password)) {
    return `${label} must contain at least one number`;
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return `${label} must contain at least one special character`;
  }
  
  return null;
}
