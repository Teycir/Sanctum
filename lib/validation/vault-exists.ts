export async function validateVaultExists(vaultURL: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const url = new URL(vaultURL);
    const hash = url.hash.slice(1);
    
    if (!hash) {
      return { exists: false, error: 'Invalid vault URL: missing vault ID' };
    }

    // Extract vault ID from hash (format: vaultId#keyB)
    const vaultId = hash.split('#')[0];
    
    if (!vaultId || vaultId.length < 10) {
      return { exists: false, error: 'Invalid vault URL: malformed vault ID' };
    }

    // Check if vault exists in database
    const response = await fetch(`/api/vault/${vaultId}/exists`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, error: 'Vault not found. It may have been deleted or the link is incorrect.' };
      }
      return { exists: false, error: 'Failed to validate vault. Please try again.' };
    }

    const data = await response.json();
    return { exists: data.exists };
  } catch {
    return { exists: false, error: 'Invalid vault URL format' };
  }
}
