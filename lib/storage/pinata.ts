// ============================================================================
// PINATA IPFS CLIENT (from TrustCircle)
// ============================================================================

import { downloadFile } from './download';

export class PinataClient {
  private readonly apiKey: string
  private readonly gateway: string

  constructor(apiKey: string, gateway: string = 'https://gateway.pinata.cloud') {
    this.apiKey = apiKey
    this.gateway = gateway
  }

  async uploadBytes(data: Uint8Array, filename?: string): Promise<string> {
    if (!data || data.length === 0) throw new Error('Data cannot be empty')

    try {
      // Check storage space before upload
      const usage = await this.getStorageUsage()
      const availableSpace = usage.limit - usage.used
      if (data.length > availableSpace) {
        const availableMB = (availableSpace / 1024 / 1024).toFixed(2)
        const requiredMB = (data.length / 1024 / 1024).toFixed(2)
        throw new Error(`Not enough storage space. Available: ${availableMB} MB, Required: ${requiredMB} MB`)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('storage space')) {
        throw error
      }
      console.warn('Unable to check storage quota:', error)
    }

    const formData = new FormData();
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('SharedArrayBuffer not supported');
    }
    formData.append('file', new Blob([buffer]), filename || 'vault.bin');

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Pinata upload failed: ${errorText}`)
    }

    const result = await response.json()
    if (!result?.IpfsHash) throw new Error('Invalid response: missing IpfsHash')
    return result.IpfsHash
  }

  async getStorageUsage(): Promise<{ used: number; limit: number; percentage: number }> {
    const response = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to get storage usage: ${response.statusText}`)
    }

    const data = await response.json();
    const used = data.pin_size_total || 0;
    const limit = 1073741824; // 1GB free tier

    return { used, limit, percentage: (used / limit) * 100 }
  }

  private async fetchFromGateway(gateway: string, cid: string, attempt: number): Promise<Uint8Array | null> {
    try {
      const response = await fetch(`${gateway}/${cid}`, { 
        signal: AbortSignal.timeout(30000)
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      }
      
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
      return null;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      return null;
    }
  }

  async getBytes(cid: string): Promise<Uint8Array> {
    if (!cid?.trim()) throw new Error('CID cannot be empty')

    const gateways = [
      `${this.gateway}/ipfs`,
      'https://dweb.link/ipfs',
      'https://ipfs.io/ipfs'
    ];

    for (const gateway of gateways) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await this.fetchFromGateway(gateway, cid, attempt);
        if (result) return result;
      }
    }

    throw new Error('Failed to download from all IPFS gateways')
  }

  // Legacy method names for compatibility
  async upload(data: Uint8Array): Promise<string> {
    return this.uploadBytes(data);
  }

  async download(cid: string): Promise<Uint8Array> {
    return this.getBytes(cid);
  }

  /**
   * Download file and trigger browser save dialog
   */
  async downloadFile(cid: string, filename: string): Promise<void> {
    const data = await this.getBytes(cid);
    downloadFile(data, filename);
  }
}
