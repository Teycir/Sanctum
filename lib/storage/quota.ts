// ============================================================================
// STORAGE QUOTA CHECKER
// ============================================================================

export interface StorageQuota {
  readonly used: number;
  readonly limit: number;
  readonly available: number;
  readonly percentage: number;
}

/**
 * Check Pinata storage quota (reused from TrustCircle)
 */
export async function checkPinataQuota(jwt: string): Promise<StorageQuota> {
  const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000', {
    headers: { Authorization: `Bearer ${jwt}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to check Pinata quota: ${response.statusText}`);
  }

  const data = await response.json();
  const used = data.rows?.reduce((sum: number, file: any) => sum + (file.size || 0), 0) || 0;
  const limit = 1024 * 1024 * 1024; // 1 GB free tier

  return {
    used,
    limit,
    available: limit - used,
    percentage: (used / limit) * 100
  };
}

/**
 * Check Filebase storage quota
 */
export function checkFilebaseQuota(): StorageQuota {
  const limit = 5 * 1024 * 1024 * 1024; // 5 GB free tier
  
  // Filebase S3 API doesn't provide easy quota checking
  return {
    used: 0,
    limit,
    available: limit,
    percentage: 0
  };
}

/**
 * Validate if content fits in available storage
 */
export function validateStorageSpace(contentSize: number, quota: StorageQuota): string | null {
  if (contentSize > quota.available) {
    const sizeMB = (contentSize / 1024 / 1024).toFixed(2);
    const availableMB = (quota.available / 1024 / 1024).toFixed(2);
    return `Content too large (${sizeMB} MB). Only ${availableMB} MB available.`;
  }
  return null;
}
