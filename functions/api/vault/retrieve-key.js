export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const vaultId = url.searchParams.get('vaultId');
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    if (!vaultId || !/^[A-Za-z0-9_-]{16,32}$/.test(vaultId)) {
      return new Response(JSON.stringify({ error: 'Invalid vault ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB
      .prepare(
        'SELECT encrypted_key_a, encrypted_decoy_cid, encrypted_hidden_cid, salt, master_nonce, cid_encryption_key FROM vault_keys WHERE vault_id = ?'
      )
      .bind(vaultId)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Vault not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      encryptedKeyA: result.encrypted_key_a,
      decoyCID: result.encrypted_decoy_cid,
      hiddenCID: result.encrypted_hidden_cid,
      salt: result.salt,
      nonce: result.master_nonce,
      cidKey: result.cid_encryption_key,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Retrieve key error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
