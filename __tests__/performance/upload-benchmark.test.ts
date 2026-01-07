// ============================================================================
// UPLOAD PERFORMANCE BENCHMARK
// ============================================================================

const mockUpload = async (data: Uint8Array, delayMs: number): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return `Qm${Math.random().toString(36).slice(2)}`;
};

describe('Upload Performance Benchmark', () => {
  const FILE_SIZE = 15 * 1024 * 1024;
  const UPLOAD_DELAY = 2000;
  
  let decoyBlob: Uint8Array;
  let hiddenBlob: Uint8Array;

  beforeAll(() => {
    decoyBlob = new Uint8Array(FILE_SIZE);
    hiddenBlob = new Uint8Array(FILE_SIZE);
  });

  it('OLD: Sequential uploads', async () => {
    const start = Date.now();
    
    const decoyCID = await mockUpload(decoyBlob, UPLOAD_DELAY);
    const hiddenCID = await mockUpload(hiddenBlob, UPLOAD_DELAY);
    
    const elapsed = Date.now() - start;
    
    console.log('\n📊 SEQUENTIAL: ' + elapsed + 'ms (' + (elapsed / 1000).toFixed(1) + 's)');
    
    expect(elapsed).toBeGreaterThanOrEqual(UPLOAD_DELAY * 2);
  });

  it('NEW: Parallel uploads', async () => {
    const start = Date.now();
    
    const [decoyCID, hiddenCID] = await Promise.all([
      mockUpload(decoyBlob, UPLOAD_DELAY),
      mockUpload(hiddenBlob, UPLOAD_DELAY)
    ]);
    
    const elapsed = Date.now() - start;
    
    console.log('\n📊 PARALLEL: ' + elapsed + 'ms (' + (elapsed / 1000).toFixed(1) + 's)');
    
    expect(elapsed).toBeLessThan(UPLOAD_DELAY * 1.5);
  });

  it('COMPARISON: Parallel vs Sequential', { timeout: 10000 }, async () => {
    const seqStart = Date.now();
    await mockUpload(decoyBlob, UPLOAD_DELAY);
    await mockUpload(hiddenBlob, UPLOAD_DELAY);
    const seqTime = Date.now() - seqStart;
    
    const parStart = Date.now();
    await Promise.all([
      mockUpload(decoyBlob, UPLOAD_DELAY),
      mockUpload(hiddenBlob, UPLOAD_DELAY)
    ]);
    const parTime = Date.now() - parStart;
    
    const improvement = ((seqTime - parTime) / seqTime) * 100;
    
    console.log('\n🚀 RESULTS:');
    console.log('   Sequential: ' + seqTime + 'ms');
    console.log('   Parallel:   ' + parTime + 'ms');
    console.log('   Improvement: ' + improvement.toFixed(1) + '% faster');
    console.log('   Time saved: ' + ((seqTime - parTime) / 1000).toFixed(1) + 's');
    
    expect(improvement).toBeGreaterThan(40);
  });
});
