export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    if (!env.VAULT_ENCRYPTION_SECRET) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentLength = Number.parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { vaultId, keyB, encryptedDecoyCID, encryptedHiddenCID, salt, nonce } = body;

    if (!vaultId || !keyB || !encryptedDecoyCID || !encryptedHiddenCID || !salt || !nonce) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!/^[A-Za-z0-9-]{36}$/.test(vaultId)) {
      return new Response(JSON.stringify({ error: 'Invalid vault ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Encrypt KeyB server-side using HKDF + XChaCha20-Poly1305 (TimeSeal pattern adapted)
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
    const keyBNonce = crypto.getRandomValues(new Uint8Array(24));
    const keyBBytes = Uint8Array.from(atob(keyB.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
    
    const cipher = xchacha20poly1305(new Uint8Array(derivedBits), keyBNonce);
    const encryptedKeyB = cipher.encrypt(keyBBytes);
    
    const combined = new Uint8Array(keyBNonce.length + encryptedKeyB.length);
    combined.set(keyBNonce, 0);
    combined.set(encryptedKeyB, keyBNonce.length);
    const encryptedKeyBBase64 = btoa(String.fromCodePoint(...combined)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

    await env.DB
      .prepare(
        'INSERT INTO vault_keys (vault_id, encrypted_key_b, encrypted_decoy_cid, encrypted_hidden_cid, salt, nonce, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(vaultId, encryptedKeyBBase64, encryptedDecoyCID, encryptedHiddenCID, salt, nonce, Date.now())
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Store key error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
