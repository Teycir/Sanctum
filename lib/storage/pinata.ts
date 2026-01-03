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

    // Check storage space before upload
    const usage = await this.getStorageUsage()
    const availableSpace = usage.limit - usage.used
    if (data.length > availableSpace) {
      const availableMB = (availableSpace / 1024 / 1024).toFixed(2)
      const requiredMB = (data.length / 1024 / 1024).toFixed(2)
      throw new Error(`Not enough storage space. Available: ${availableMB} MB, Required: ${requiredMB} MB`)
    }

    const formData = new FormData()
    formData.append('file', new Blob([data as BlobPart]), filename || 'vault.bin')

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
    const listResponse = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000', {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    })

    if (!listResponse.ok) {
      throw new Error(`Failed to list pins: ${listResponse.statusText}`)
    }

    const listData = await listResponse.json()
    let used = 0
    const rows = listData.rows
    if (rows) {
      const length = rows.length
      for (let i = 0; i < length; i++) {
        used += rows[i].size || 0
      }
    }
    const limit = 1073741824 // 1GB free tier

    return { used, limit, percentage: (used / limit) * 100 }
  }

  async getBytes(cid: string): Promise<Uint8Array> {
    if (!cid?.trim()) throw new Error('CID cannot be empty')

    const response = await fetch(`${this.gateway}/ipfs/${cid}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Pinata fetch failed: ${errorText}`)
    }

    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  }

  // Legacy method names for compatibility
  async upload(data: Uint8Array): Promise<string> {
    return this.uploadBytes(data)
  }

  async download(cid: string): Promise<Uint8Array> {
    return this.getBytes(cid)
  }

  /**
   * Download file and trigger browser save dialog
   */
  async downloadFile(cid: string, filename: string): Promise<void> {
    const data = await this.getBytes(cid);
    downloadFile(data, filename);
  }
}
