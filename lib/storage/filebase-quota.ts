// ============================================================================
// FILEBASE QUOTA CHECKER
// ============================================================================

export interface StorageQuota {
  readonly used: number;
  readonly limit: number;
  readonly available: number;
  readonly percentage: number;
}

const FILEBASE_FREE_TIER = 5 * 1024 * 1024 * 1024; // 5 GB
const SAFETY_BUFFER = 0.05; // 5% buffer

export async function checkFilebaseQuota(): Promise<StorageQuota> {
  // Skip quota check to avoid CORS issues
  // Return default quota assuming free tier
  return {
    used: 0,
    limit: FILEBASE_FREE_TIER,
    available: FILEBASE_FREE_TIER,
    percentage: 0
  };
}

export function validateFilebaseSpace(contentSize: number, quota: StorageQuota): string | null {
  const requiredSpace = contentSize * (1 + SAFETY_BUFFER);
  
  if (requiredSpace > quota.available) {
    const sizeMB = (contentSize / 1024 / 1024).toFixed(2);
    const availableMB = (quota.available / 1024 / 1024).toFixed(2);
    return `Content too large (${sizeMB} MB). Only ${availableMB} MB available in Filebase.`;
  }
  return null;
}

export function validateFileType(file: File): string | null {
  const allowedTypes = ['.zip', '.rar'];
  const fileName = file.name.toLowerCase();
  
  if (!allowedTypes.some(ext => fileName.endsWith(ext))) {
    return 'Only .zip and .rar files are allowed';
  }
  return null;
}
