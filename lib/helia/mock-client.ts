import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import * as raw from 'multiformats/codecs/raw';

// Singleton storage - persists across test operations
const mockStorage = new Map<string, Uint8Array>();

export class MockHeliaIPFS {
  async init(): Promise<void> {
    console.log('[MockIPFS] Initialized');
  }

  async upload(data: Uint8Array): Promise<string> {
    const hash = await sha256.digest(data);
    const cid = CID.create(1, raw.code, hash);
    const cidString = cid.toString();
    
    mockStorage.set(cidString, data);
    console.log(`[MockIPFS] Stored ${data.length} bytes at ${cidString}`);
    
    return cidString;
  }

  async download(cidString: string): Promise<Uint8Array> {
    const data = mockStorage.get(cidString);
    
    if (!data) {
      throw new Error(`[MockIPFS] CID not found: ${cidString}`);
    }
    
    console.log(`[MockIPFS] Retrieved ${data.length} bytes from ${cidString}`);
    return data;
  }

  async stop(): Promise<void> {
    console.log('[MockIPFS] Stopped');
  }
}

export function clearMockStorage(): void {
  mockStorage.clear();
  console.log('[MockIPFS] Storage cleared');
}

export function getMockStorageSize(): number {
  return mockStorage.size;
}
