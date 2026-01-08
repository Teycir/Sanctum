// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = ['.zip', '.rar'];

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

export function isValidFileExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function formatFileSize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

export function getFileSizeError(size: number): string {
  return `File too large. Maximum size is 25MB (${formatFileSize(size)}MB provided)`;
}

export function getFileExtensionError(): string {
  return 'Only .zip and .rar files are allowed';
}
