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

    // Clean up expired vaults before querying (lazy deletion)
    // Add 1-second grace period to account for mobile lag and clock drift
    const GRACE_PERIOD_MS = 1000;
    await env.DB
      .prepare('DELETE FROM vault_keys WHERE expires_at IS NOT NULL AND expires_at < ?')
      .bind(Date.now() - GRACE_PERIOD_MS)
      .run();

    const result = await env.DB
      .prepare('SELECT encrypted_key_b, encrypted_decoy_cid, encrypted_hidden_cid, nonce, provider, expires_at, panic_passphrase_hash FROM vault_keys WHERE vault_id = ?')
      .bind(vaultId)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Vault not found' }), {
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
      panicPassphraseHash: result.panic_passphrase_hash
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
