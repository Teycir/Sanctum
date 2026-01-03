// ============================================================================
// FILEBASE QUOTA CHECKER
// ============================================================================

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export interface StorageQuota {
  readonly used: number;
  readonly limit: number;
  readonly available: number;
  readonly percentage: number;
}

const FILEBASE_FREE_TIER = 5 * 1024 * 1024 * 1024; // 5 GB
const SAFETY_BUFFER = 0.05; // 5% buffer

export async function checkFilebaseQuota(
  accessKey: string,
  secretKey: string,
  bucket: string
): Promise<StorageQuota> {
  const client = new S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  });

  let used = 0;
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken
    });

    const response = await client.send(command);
    used += response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return {
    used,
    limit: FILEBASE_FREE_TIER,
    available: FILEBASE_FREE_TIER - used,
    percentage: (used / FILEBASE_FREE_TIER) * 100
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
