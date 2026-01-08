interface StorageQuota {
  readonly used: number;
  readonly limit: number;
  readonly available: number;
}

interface StorageQuotaDisplayProps {
  readonly quota: StorageQuota | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BYTES_PER_MB = 1024 * 1024;

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

function bytesToMB(bytes: number): number {
  return bytes / BYTES_PER_MB;
}

function calculateAvailablePercentage(available: number, limit: number): number {
  return (available / limit) * 100;
}

export function StorageQuotaDisplay({ quota }: StorageQuotaDisplayProps) {
  if (!quota) return null;

  const availableMB = bytesToMB(quota.available);
  const limitMB = bytesToMB(quota.limit);
  const availablePercent = calculateAvailablePercentage(quota.available, quota.limit);

  return (
    <div
      style={{
        marginTop: 8,
        padding: 8,
        background: "rgba(13, 71, 161, 0.15)",
        borderRadius: 6,
      }}
    >
      <p style={{ fontSize: 10, opacity: 0.8 }}>
        {availableMB.toFixed(0)} MB free of {limitMB.toFixed(0)} MB (
        {availablePercent.toFixed(1)}% available)
      </p>
      <p style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>
        💾 Accepts .zip or .rar files
      </p>
    </div>
  );
}
