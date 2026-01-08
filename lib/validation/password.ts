// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Password requirements message (reused across validation and UI)
 */
export const PASSWORD_REQUIREMENTS_MESSAGE = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';

/**
 * Validates password strength requirements
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password Password to validate
 * @returns true if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
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
 * @param allowEmpty Whether empty password is allowed (for optional fields)
 * @returns Error message or null if valid
 */
export function getPasswordError(password: string, label: string = 'Password', allowEmpty: boolean = false): string | null {
  if (!password) {
    return allowEmpty ? null : `${label} is required`;
  }
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
