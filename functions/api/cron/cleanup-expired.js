// Cloudflare Workers Cron - Delete expired vaults
export async function onRequest(context) {
  const { env } = context;
  
  try {
    // Add 1-second grace period to account for mobile lag and clock drift
    const GRACE_PERIOD_MS = 1000;
    const now = Date.now() - GRACE_PERIOD_MS;
    
    // Delete expired vaults
    const result = await env.DB
      .prepare('DELETE FROM vault_keys WHERE expires_at IS NOT NULL AND expires_at < ?')
      .bind(now)
      .run();
    
    return new Response(JSON.stringify({
      success: true,
      deleted: result.meta.changes || 0,
      timestamp: now
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({
      error: 'Cleanup failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
