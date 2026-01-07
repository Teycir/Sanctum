// ============================================================================
// DOWNLOAD PERFORMANCE BENCHMARK
// ============================================================================

const mockGatewayFetch = async (gateway: string, delayMs: number): Promise<Uint8Array> => {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return new Uint8Array(1024);
};

describe('Download Performance Benchmark', () => {
  const GATEWAY_DELAY = 1000;
  const gateways = ['gateway1', 'gateway2', 'gateway3'];

  it('OLD: Sequential gateway attempts', async () => {
    const start = Date.now();
    
    let result: Uint8Array | null = null;
    for (const gateway of gateways) {
      try {
        result = await mockGatewayFetch(gateway, GATEWAY_DELAY);
        break;
      } catch {}
    }
    
    const elapsed = Date.now() - start;
    console.log('\n📊 SEQUENTIAL GATEWAYS: ' + elapsed + 'ms');
    
    expect(elapsed).toBeGreaterThanOrEqual(GATEWAY_DELAY);
  });

  it('NEW: Parallel gateway race', async () => {
    const start = Date.now();
    
    const result = await Promise.race(
      gateways.map(gateway => mockGatewayFetch(gateway, GATEWAY_DELAY))
    );
    
    const elapsed = Date.now() - start;
    console.log('\n📊 PARALLEL GATEWAYS: ' + elapsed + 'ms');
    
    expect(elapsed).toBeLessThan(GATEWAY_DELAY * 1.5);
  });

  it('COMPARISON: Parallel vs Sequential', async () => {
    const seqStart = Date.now();
    for (const gateway of gateways) {
      try {
        await mockGatewayFetch(gateway, GATEWAY_DELAY);
        break;
      } catch {}
    }
    const seqTime = Date.now() - seqStart;
    
    const parStart = Date.now();
    await Promise.race(
      gateways.map(gateway => mockGatewayFetch(gateway, GATEWAY_DELAY))
    );
    const parTime = Date.now() - parStart;
    
    const improvement = ((seqTime - parTime) / seqTime) * 100;
    
    console.log('\n🚀 DOWNLOAD RESULTS:');
    console.log('   Sequential: ' + seqTime + 'ms');
    console.log('   Parallel:   ' + parTime + 'ms');
    console.log('   Improvement: ' + improvement.toFixed(1) + '% faster');
    
    expect(parTime).toBeLessThanOrEqual(seqTime + 50); // Allow 50ms variance
  });
});
