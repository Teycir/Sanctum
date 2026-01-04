// ============================================================================
// FILEBASE IPFS CLIENT (S3-Compatible with AWS Signature V4)
// ============================================================================

export class FilebaseClient {
  private readonly bucketName = "sanctum-vaults";

  constructor(private readonly token: string) {}

  private parseToken(): { accessKey: string; secretKey: string } {
    try {
      const decoded = atob(this.token);
      const [accessKey, secretKey] = decoded.split(":");
      if (!accessKey || !secretKey) {
        throw new Error("Invalid token format");
      }
      return { accessKey, secretKey };
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid token format") {
        throw error;
      }
      throw new Error("Invalid Filebase token");
    }
  }

  private async signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: Uint8Array,
  ): Promise<Record<string, string>> {
    const { accessKey } = this.parseToken();
    const region = "us-east-1";
    const service = "s3";
    const host = "s3.filebase.com";

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replaceAll("-", "");
    const amzDate = now.toISOString().replaceAll(/[:-]|\.\d{3}/g, "");

    const payloadHash = await this.sha256(body || new Uint8Array());

    const signedHeaders: Record<string, string> = {
      ...headers,
      host: host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };

    const sortedKeys = Object.keys(signedHeaders).sort((a, b) =>
      a.localeCompare(b),
    );

    const canonicalHeaders = sortedKeys
      .map((k) => `${k.toLowerCase()}:${signedHeaders[k]}\n`)
      .join("");

    const signedHeadersList = sortedKeys.map((k) => k.toLowerCase()).join(";");

    const canonicalRequest = [
      method,
      path,
      "",
      canonicalHeaders,
      signedHeadersList,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await this.sha256(new TextEncoder().encode(canonicalRequest)),
    ].join("\n");

    const signingKey = await this.getSignatureKey(dateStamp, region, service);
    const signature = await this.hmacSha256(signingKey, stringToSign);

    signedHeaders["Authorization"] =
      `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`;

    return signedHeaders;
  }

  private async sha256(data: Uint8Array): Promise<string> {
    const buffer = this.getArrayBuffer(data);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return this.toHexString(new Uint8Array(hash));
  }

  private async hmacSha256(
    key: Uint8Array | string,
    data: string,
  ): Promise<string> {
    const keyData =
      typeof key === "string" ? new TextEncoder().encode(key) : key;
    const keyBuffer = this.getArrayBuffer(keyData);
    const dataBuffer = new TextEncoder().encode(data);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
    return this.toHexString(new Uint8Array(signature));
  }

  private async getSignatureKey(
    dateStamp: string,
    region: string,
    service: string,
  ): Promise<Uint8Array> {
    const { secretKey } = this.parseToken();
    const kDate = await this.hmacSha256Raw(
      new TextEncoder().encode("AWS4" + secretKey),
      dateStamp,
    );
    const kRegion = await this.hmacSha256Raw(kDate, region);
    const kService = await this.hmacSha256Raw(kRegion, service);
    return this.hmacSha256Raw(kService, "aws4_request");
  }

  private toHexString(bytes: Uint8Array): string {
    let result = "";
    for (const byte of bytes) {
      result += byte.toString(16).padStart(2, "0");
    }
    return result;
  }

  private getArrayBuffer(data: Uint8Array): ArrayBuffer {
    const buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError("SharedArrayBuffer not supported");
    }
    return buffer;
  }

  private async hmacSha256Raw(
    key: Uint8Array,
    data: string,
  ): Promise<Uint8Array> {
    const keyBuffer = this.getArrayBuffer(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(data),
    );
    return new Uint8Array(signature);
  }

  async upload(data: Uint8Array): Promise<string> {
    if (!data || data.length === 0) throw new Error("Data cannot be empty");

    const fileName = `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `/${this.bucketName}/${fileName}`;

    const headers = await this.signRequest(
      "PUT",
      path,
      {
        "Content-Type": "application/octet-stream",
      },
      data,
    );

    const filebaseUrl = `https://s3.filebase.com${path}`;
    const proxyUrl = "/api/filebase-proxy";
    const proxyHeaders: Record<string, string> = {
      "X-Filebase-URL": filebaseUrl,
      "X-Filebase-Method": "PUT",
      ...headers,
    };

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: proxyHeaders,
      body: data as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      if (response.status === 404) {
        throw new Error(`Bucket '${this.bucketName}' not found. Create it at filebase.com first.`);
      }
      if (response.status === 403) {
        throw new Error("Invalid Filebase credentials. Check your access key and secret key.");
      }
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const cid = response.headers.get("x-amz-meta-cid");
    if (!cid) {
      throw new Error("No CID returned from Filebase");
    }

    return cid;
  }

  async getStorageUsage(): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    const path = `/${this.bucketName}`;
    const headers = await this.signRequest("GET", path, {});

    const filebaseUrl = `https://s3.filebase.com${path}`;
    const proxyUrl = "/api/filebase-proxy";
    const proxyHeaders: Record<string, string> = {
      "X-Filebase-URL": filebaseUrl,
      "X-Filebase-Method": "GET",
      ...headers,
    };

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: proxyHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to list bucket: ${response.statusText}`);
    }

    const xml = await response.text();
    const sizeMatches = xml.matchAll(/<Size>(\d+)<\/Size>/g);
    let used = 0;
    for (const match of sizeMatches) {
      used += parseInt(match[1], 10);
    }

    const limit = 5368709120; // 5GB free tier
    return { used, limit, percentage: (used / limit) * 100 };
  }

  async download(cid: string): Promise<Uint8Array> {
    const gateways = [
      `https://ipfs.filebase.io/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
    ];

    const errors: string[] = [];

    for (const gateway of gateways) {
      try {
        const data = await this.downloadFromGateway(gateway);
        if (data) return data;
      } catch (error) {
        errors.push(
          `${gateway}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    throw new Error(
      `Failed to download from all IPFS gateways:\n${errors.join("\n")}`,
    );
  }

  private async downloadFromGateway(
    gateway: string,
  ): Promise<Uint8Array | null> {
    try {
      const response = await fetch(gateway, {
        headers: { Accept: "application/octet-stream" },
      });

      if (!response.ok) return null;

      if (response.body && typeof response.body.getReader === "function") {
        return await this.streamResponse(response.body);
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      throw new Error(
        `Gateway error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async streamResponse(
    body: ReadableStream<Uint8Array>,
  ): Promise<Uint8Array> {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}
