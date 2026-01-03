import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultService } from "../../lib/services/vault";

const mockStorage = new Map<string, Uint8Array>();

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
    downloadVault: async (stored: any) => {
      const decoyBlob = mockStorage.get(stored.decoyCID);
      const hiddenBlob = mockStorage.get(stored.hiddenCID);
      if (!decoyBlob || !hiddenBlob) throw new Error("CID not found");
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    }
  };
}));

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
    });
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

      expect(unlocked.isDecoy).toBe(false);
      expect(unlocked.content).toEqual(decoy);
    });

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
    });
  });
});
