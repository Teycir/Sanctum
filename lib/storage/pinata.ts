// ============================================================================
// PINATA IPFS CLIENT
// ============================================================================

export class PinataClient {
  constructor(private jwt: string) {}

  async upload(data: Uint8Array): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(data)]));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.jwt}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  async download(cid: string): Promise<Uint8Array> {
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway);
        if (response.ok) {
          return new Uint8Array(await response.arrayBuffer());
        }
      } catch {
        continue;
      }
    }
    throw new Error('Failed to download from all IPFS gateways');
  }
}
