// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface IPFSUploadResult {
  readonly cid: string;
  readonly size: number;
}

// ============================================================================
// HELIA IPFS CLIENT
// ============================================================================

export class HeliaIPFS {
  private helia: any = null;

  /**
   * Initialize Helia node
   */
  async init() {
    if (this.helia) return;

    // Suppress all IPFS connection errors globally
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args) => {
      const msg = String(args[0] || '');
      if (msg.includes('WebSocket') || msg.includes('libp2p') || msg.includes('connection')) return;
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      const msg = String(args[0] || '');
      if (msg.includes('WebSocket') || msg.includes('libp2p') || msg.includes('connection')) return;
      originalWarn.apply(console, args);
    };

    try {
      const { createHelia } = await import("helia");
      this.helia = await createHelia();
    } finally {
      console.error = originalError;
      console.warn = originalWarn;
    }
  }

  /**
   * Upload data to IPFS
   * @param data Data to upload
   * @returns CID string
   */
  async upload(data: Uint8Array): Promise<string> {
    if (!this.helia) await this.init();

    const { unixfs } = await import("@helia/unixfs");
    const fs = unixfs(this.helia);
    const cid = await fs.addBytes(data);

    return cid.toString();
  }

  /**
   * Download data from IPFS
   * @param cid Content identifier
   * @returns Downloaded data
   */
  async download(cid: string) {
    if (!this.helia) await this.init();

    const { unixfs } = await import("@helia/unixfs");
    const { CID } = await import("multiformats/cid");

    const fs = unixfs(this.helia);
    const cidObj = CID.parse(cid);

    const chunks = [];
    for await (const chunk of fs.cat(cidObj)) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Stop Helia node
   */
  async stop(): Promise<void> {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
    }
  }
}
