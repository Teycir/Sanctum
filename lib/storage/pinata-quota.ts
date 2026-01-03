// ============================================================================
// PINATA QUOTA CHECKER (from TrustCircle)
// ============================================================================

export interface StorageQuota {
  readonly used: number;
  readonly limit: number;
  readonly available: number;
  readonly percentage: number;
}

const PINATA_FREE_TIER = 1024 * 1024 * 1024; // 1 GB
const SAFETY_BUFFER = 0.05; // 5% buffer

export async function checkPinataQuota(jwt: string): Promise<StorageQuota> {
  const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000', {
    headers: { Authorization: `Bearer ${jwt}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to check Pinata quota: ${response.statusText}`);
  }

  const data = await response.json();
  const used = data.rows?.reduce((sum: number, file: any) => sum + (file.size || 0), 0) || 0;

  return {
    used,
    limit: PINATA_FREE_TIER,
    available: PINATA_FREE_TIER - used,
    percentage: (used / PINATA_FREE_TIER) * 100
  };
}

export function validatePinataSpace(contentSize: number, quota: StorageQuota): string | null {
  const requiredSpace = contentSize * (1 + SAFETY_BUFFER);
  
  if (requiredSpace > quota.available) {
    const sizeMB = (contentSize / 1024 / 1024).toFixed(2);
    const availableMB = (quota.available / 1024 / 1024).toFixed(2);
    return `Content too large (${sizeMB} MB). Only ${availableMB} MB available in Pinata.`;
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
