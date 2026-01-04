import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultService } from "../../lib/services/vault";

const mockStorage = new Map<string, Uint8Array>();
const mockVaultKeys = new Map<string, any>();

// Mock fetch for API calls
global.fetch = vi.fn((url: string | URL, options?: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  if (urlStr.includes('/api/vault/store-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body);
    mockVaultKeys.set(body.vaultId, {
      keyB: body.keyB,
      encryptedDecoyCID: body.encryptedDecoyCID,
      encryptedHiddenCID: body.encryptedHiddenCID,
      nonce: body.nonce
    });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
  }
  if (urlStr.includes('/api/vault/get-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body);
    const stored = mockVaultKeys.get(body.vaultId);
    if (!stored) {
      return Promise.resolve({
        ok: false,
        status: 404
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(stored)
    } as Response);
  }
  return Promise.reject(new Error('Unknown URL'));
}) as any;

vi.mock("../../lib/storage/uploader", () => ({
  uploadToIPFS: async (data: Uint8Array) => {
    const cid = `mock-cid-${Math.random().toString(36).slice(2)}`;
    mockStorage.set(cid, data);
    return { cid };
  }
}));

vi.mock("../../lib/storage/vault", async () => {
  const actual = await vi.importActual("../../lib/storage/vault");
  return {
    ...actual,
    uploadVault: async (vault: any) => {
      const decoyCID = `decoy-${Math.random().toString(36).slice(2)}`;
      const hiddenCID = `hidden-${Math.random().toString(36).slice(2)}`;
      mockStorage.set(decoyCID, vault.decoyBlob);
      mockStorage.set(hiddenCID, vault.hiddenBlob);
      return { decoyCID, hiddenCID, salt: vault.salt };
    },
    downloadVault: async (stored: any) => {
      const decoyBlob = mockStorage.get(stored.decoyCID);
      const hiddenBlob = mockStorage.get(stored.hiddenCID);
      if (!decoyBlob || !hiddenBlob) throw new Error("CID not found");
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    },
  };
});

vi.mock("../../lib/workers/crypto", () => ({
  CryptoWorker: class MockCryptoWorker {
    async createHiddenVault(params: any) {
      const { createHiddenVault } = await import("../../lib/duress/layers");
      return createHiddenVault(params);
    }
    async unlockHiddenVault(result: any, passphrase: string) {
      const { unlockHiddenVault } = await import("../../lib/duress/layers");
      return unlockHiddenVault(result, passphrase);
    }
    terminate() {
      /* no-op */
    }
  },
}));

describe("services/vault", () => {
  let service: VaultService;

  beforeEach(() => {
    service = new VaultService();
  });

  describe("createVault", () => {
    it("should create vault and return URL with metadata", async () => {
      const decoy = new TextEncoder().encode("innocent");
      const hidden = new TextEncoder().encode("secret");

      // Mock store-key response
      (global.fetch as any).mockImplementationOnce((url: string, options: any) => {
        if (url.includes('/api/vault/store-key')) {
          const body = JSON.parse(options.body);
          mockVaultKeys.set(body.vaultId, {
            keyB: body.keyB,
            encryptedDecoyCID: body.encryptedDecoyCID,
            encryptedHiddenCID: body.encryptedHiddenCID,
            nonce: body.nonce
          });
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }
        return (global.fetch as any)(url, options);
      });

      const result = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        decoyPassphrase: "decoy-pass-12345",
        ipfsCredentials: {
          provider: "pinata",
          pinataJWT: "mock-jwt"
        }
      });

      expect(result.vaultURL).toContain("/vault#");
      expect(result.decoyCID).toBeTruthy();
      expect(result.hiddenCID).toBeTruthy();
    }, 10000);
  });

  describe("unlockVault", () => {
    it("should unlock decoy layer with empty passphrase", async () => {
      const decoy = new TextEncoder().encode("innocent");
      const hidden = new TextEncoder().encode("secret");

      const created = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        decoyPassphrase: "decoy-pass-12345",
        ipfsCredentials: {
          provider: "pinata",
          pinataJWT: "mock-jwt"
        }
      });

      const unlocked = await service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: "decoy-pass-12345",
      });

      expect(unlocked.isDecoy).toBe(true);
      expect(unlocked.content).toEqual(decoy);
    }, 10000);

    it("should unlock hidden layer with correct passphrase", async () => {
      const decoy = new TextEncoder().encode("innocent");
      const hidden = new TextEncoder().encode("secret");

      const created = await service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        decoyPassphrase: "decoy-pass-12345",
        ipfsCredentials: {
          provider: "pinata",
          pinataJWT: "mock-jwt"
        }
      });

      const unlocked = await service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: "test-pass-12345",
      });

      expect(unlocked.isDecoy).toBe(false);
      expect(unlocked.content).toEqual(hidden);
    }, 10000);
  });
});
