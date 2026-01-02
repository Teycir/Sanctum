import { HeliaIPFS } from './client';
import { MockHeliaIPFS } from './mock-client';

export interface IHeliaClient {
  init(): Promise<void>;
  upload(data: Uint8Array): Promise<string>;
  download(cid: string, options?: { timeout?: number }): Promise<Uint8Array>;
  stop(): Promise<void>;
}

export function createHeliaClient(): IHeliaClient {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_IPFS === 'true';
  
  if (useMock) {
    console.log('[Helia] Using mock IPFS client');
    return new MockHeliaIPFS() as unknown as IHeliaClient;
  }
  
  console.log('[Helia] Using real IPFS client');
  return new HeliaIPFS() as unknown as IHeliaClient;
}

export { HeliaIPFS } from './client';
export { MockHeliaIPFS, clearMockStorage, getMockStorageSize } from './mock-client';
