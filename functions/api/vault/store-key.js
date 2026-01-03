export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const contentLength = Number.parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { vaultId, encryptedKeyA, decoyCID, hiddenCID, salt, nonce, cidKey } = body;

    if (!vaultId || !encryptedKeyA || !decoyCID || !hiddenCID || !salt || !nonce || !cidKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!/^[A-Za-z0-9_-]{16,32}$/.test(vaultId)) {
      return new Response(JSON.stringify({ error: 'Invalid vault ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB
      .prepare(
        'INSERT INTO vault_keys (vault_id, encrypted_key_a, encrypted_decoy_cid, encrypted_hidden_cid, salt, master_nonce, cid_encryption_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(vaultId, encryptedKeyA, decoyCID, hiddenCID, salt, nonce, cidKey, Date.now())
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
