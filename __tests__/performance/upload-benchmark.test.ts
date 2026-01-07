import { describe, it, expect, beforeAll } from 'vitest';

const mockUpload = async (data: Uint8Array, delayMs: number): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return `Qm${Math.random().toString(36).slice(2)}`;
};

describe('Upload Performance Benchmark', () => {
  const FILE_SIZE = 1024; // 1KB for testing
  const UPLOAD_DELAY = 100; // 100ms delay
  
  let decoyBlob: Uint8Array;
  let hiddenBlob: Uint8Array;

  beforeAll(() => {
    decoyBlob = new Uint8Array(FILE_SIZE);
    hiddenBlob = new Uint8Array(FILE_SIZE);
  });

  it('OLD: Sequential uploads', async () => {
    const start = Date.now();
    
    await mockUpload(decoyBlob, UPLOAD_DELAY);
    await mockUpload(hiddenBlob, UPLOAD_DELAY);
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(UPLOAD_DELAY * 2);
  });

  it('NEW: Parallel uploads', async () => {
    const start = Date.now();
    
    await Promise.all([
      mockUpload(decoyBlob, UPLOAD_DELAY),
      mockUpload(hiddenBlob, UPLOAD_DELAY)
    ]);
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(UPLOAD_DELAY * 1.5);
  });

  it('COMPARISON: Parallel vs Sequential', async () => {
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
    expect(improvement).toBeGreaterThan(40);
  });
});
