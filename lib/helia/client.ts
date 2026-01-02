import { getHelia, stopHelia } from "./singleton";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type UnixFS = Awaited<ReturnType<typeof import("@helia/unixfs").unixfs>>;

// ============================================================================
// HELIA IPFS CLIENT
// ============================================================================

export class HeliaIPFS {
  private fs: UnixFS | null = null;

  /**
   * Initialize Helia node
   */
  async init() {
    if (this.fs) return;

    const helia = await getHelia();
    const { unixfs } = await import("@helia/unixfs");
    this.fs = unixfs(helia);
  }

  /**
   * Upload data to IPFS
   * @param data Data to upload
   * @returns CID string
   */
  async upload(data: Uint8Array): Promise<string> {
    if (!this.fs) await this.init();

    const cid = await this.fs!.addBytes(data, {
      cidVersion: 1,
      rawLeaves: true,
    });

    return cid.toString();
  }

  /**
   * Download data from IPFS
   * @param cid Content identifier
   * @param options Download options
   * @returns Downloaded data
   */
  async download(
    cid: string,
    options?: { timeout?: number },
  ): Promise<Uint8Array> {
    if (!this.fs) await this.init();

    const timeout = options?.timeout ?? 60000;
    const { CID } = await import("multiformats/cid");
    const cidObj = CID.parse(cid);

    const chunks: Uint8Array[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      for await (const chunk of this.fs!.cat(cidObj, {
        signal: controller.signal,
      })) {
        chunks.push(chunk);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(
          `IPFS download timeout after ${timeout / 1000} seconds`,
        );
      }
      if (err instanceof Error) {
        throw new Error(`IPFS download failed: ${err.message}`, { cause: err });
      }
      throw new Error("IPFS download failed with unknown error");
    } finally {
      clearTimeout(timeoutId);
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
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
    try {
      await stopHelia();
    } finally {
      this.fs = null;
    }
  }
}
