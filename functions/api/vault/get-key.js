export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    if (!env.VAULT_ENCRYPTION_SECRET) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { vaultId } = body;

    if (!vaultId) {
      return new Response(JSON.stringify({ error: 'Missing vaultId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Two-stage cleanup to prevent DB overflow:
    // 1. Lazy deactivation: Mark recently expired vaults as inactive (soft delete)
    // 2. Hard deletion: Remove vaults that have been inactive for 30+ days
    const GRACE_PERIOD_MS = 5000; // Match client-side MOBILE_LAG_BUFFER_MS
    const HARD_DELETE_AFTER_DAYS = 30;
    const HARD_DELETE_THRESHOLD = Date.now() - (HARD_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    
    // Stage 1: Deactivate expired vaults
    await env.DB
      .prepare('UPDATE vault_keys SET is_active = 0 WHERE expires_at IS NOT NULL AND expires_at < ? AND is_active = 1')
      .bind(Date.now() - GRACE_PERIOD_MS)
      .run();
    
    // Stage 2: Hard delete vaults that expired 30+ days ago
    await env.DB
      .prepare('DELETE FROM vault_keys WHERE expires_at IS NOT NULL AND expires_at < ? AND is_active = 0')
      .bind(HARD_DELETE_THRESHOLD)
      .run();

    const result = await env.DB
      .prepare('SELECT encrypted_key_b, encrypted_decoy_cid, encrypted_hidden_cid, nonce, provider, expires_at, panic_passphrase_hash, is_active FROM vault_keys WHERE vault_id = ?')
      .bind(vaultId)
      .first();

    // Check if vault exists AND is active
    // Return same error message as panic/expired to maintain plausible deniability
    if (!result || result.is_active === 0) {
      return new Response(JSON.stringify({ error: 'Vault content has been deleted from storage providers' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Decrypt KeyB server-side using HKDF + XChaCha20-Poly1305 (TimeSeal pattern adapted)
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(env.VAULT_ENCRYPTION_SECRET);
    
    const hkdfKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode(vaultId),
        info: encoder.encode('keyb-encryption'),
      },
      hkdfKey,
      256
    );
    
    // Use XChaCha20-Poly1305 for consistency with vault encryption
    const { xchacha20poly1305 } = await import('@noble/ciphers/chacha');
    const encryptedKeyBBytes = Uint8Array.from(atob(result.encrypted_key_b.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
    const keyBNonce = encryptedKeyBBytes.slice(0, 24);
    const ciphertext = encryptedKeyBBytes.slice(24);
    
    const cipher = xchacha20poly1305(new Uint8Array(derivedBits), keyBNonce);
    const decryptedKeyB = cipher.decrypt(ciphertext);
    
    const keyBBase64 = btoa(String.fromCodePoint(...decryptedKeyB)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

    return new Response(JSON.stringify({
      keyB: keyBBase64,
      encryptedDecoyCID: result.encrypted_decoy_cid,
      encryptedHiddenCID: result.encrypted_hidden_cid,
      nonce: result.nonce,
      provider: result.provider || 'pinata',
      expiresAt: result.expires_at,
      panicPassphraseHash: result.panic_passphrase_hash,
      isActive: result.is_active !== 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get key error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
