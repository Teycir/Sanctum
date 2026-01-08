import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultService } from "../../lib/services/vault";

const mockStorage = new Map<string, Uint8Array>();
interface MockVaultKey {
  keyB: string;
  encryptedDecoyCID: string;
  encryptedHiddenCID: string;
  nonce: string;
  panicPassphraseHash?: string;
  provider: string;
  isActive: boolean;
  expiresAt: number | null;
}

const mockVaultKeys = new Map<string, MockVaultKey>();

globalThis.fetch = vi.fn((url: string | URL, options?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  if (urlStr.includes('/api/vault/store-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    mockVaultKeys.set(body.vaultId, {
      keyB: body.keyB,
      encryptedDecoyCID: body.encryptedDecoyCID,
      encryptedHiddenCID: body.encryptedHiddenCID,
      nonce: body.nonce,
      panicPassphraseHash: body.panicPassphraseHash,
      provider: body.provider || 'pinata',
      isActive: true,
      expiresAt: body.expiresAt || null
    });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
  }
  if (urlStr.includes('/api/vault/get-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
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
}) as unknown as typeof fetch;

vi.mock("../../lib/storage/vault", async () => {
  const actual = await vi.importActual<typeof import("../../lib/storage/vault")>("../../lib/storage/vault");
  return {
    ...actual,
    uploadVault: async (vault: { decoyBlob: Uint8Array; hiddenBlob: Uint8Array; salt: Uint8Array }) => {
      const decoyCID = `decoy-${Math.random().toString(36).slice(2)}`;
      const hiddenCID = `hidden-${Math.random().toString(36).slice(2)}`;
      mockStorage.set(decoyCID, vault.decoyBlob);
      mockStorage.set(hiddenCID, vault.hiddenBlob);
      return { decoyCID, hiddenCID, salt: vault.salt, provider: 'pinata' as const };
    },
    downloadVault: async (stored: { decoyCID: string; hiddenCID: string; salt: Uint8Array }) => {
      const decoyBlob = mockStorage.get(stored.decoyCID);
      const hiddenBlob = mockStorage.get(stored.hiddenCID);
      if (!decoyBlob || !hiddenBlob) throw new Error("CID not found");
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    },
  };
});

vi.mock("../../lib/workers/crypto", () => ({
  CryptoWorker: class MockCryptoWorker {
    async createHiddenVault(params: Parameters<typeof import("../../lib/duress/layers").createHiddenVault>[0]) {
      const { createHiddenVault } = await import("../../lib/duress/layers");
      return createHiddenVault(params);
    }
    async unlockHiddenVault(result: ReturnType<typeof import("../../lib/duress/layers").createHiddenVault>, passphrase: string, vaultId?: string) {
      const { unlockHiddenVault } = await import("../../lib/duress/layers");
      return unlockHiddenVault(result, passphrase, vaultId);
    }
    terminate() {
      // no-op for mock
    }
  },
}));

describe("Panic Passphrase", () => {
  let service: VaultService;

  beforeEach(() => {
    service = new VaultService();
    mockStorage.clear();
    mockVaultKeys.clear();
  });

  it("should require panic passphrase during vault creation", async () => {
    const hidden = new TextEncoder().encode("secret");

    await expect(
      service.createVault({
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        // Missing panicPassphrase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).rejects.toThrow("Required");
  });

  it("should reject panic passphrase same as hidden passphrase", async () => {
    const hidden = new TextEncoder().encode("secret");

    await expect(
      service.createVault({
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        panicPassphrase: "test-pass-12345", // Same as hidden
      })
    ).rejects.toThrow("Panic passphrase must be different from hidden passphrase");
  });

  it("should reject panic passphrase same as decoy passphrase", async () => {
    const decoy = new TextEncoder().encode("innocent");
    const hidden = new TextEncoder().encode("secret");

    await expect(
      service.createVault({
        decoyContent: decoy,
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        decoyPassphrase: "decoy-pass-12345",
        panicPassphrase: "decoy-pass-12345", // Same as decoy
      })
    ).rejects.toThrow("Panic passphrase must be different from decoy passphrase");
  });

  it("should show 'vault deleted' error when panic passphrase entered", async () => {
    const decoy = new TextEncoder().encode("innocent");
    const hidden = new TextEncoder().encode("secret");

    const created = await service.createVault({
      decoyContent: decoy,
      hiddenContent: hidden,
      passphrase: "Hidden-Pass-12345!",
      decoyPassphrase: "Decoy-Pass-12345!",
      panicPassphrase: "Panic-Pass-12345!",
    });

    await expect(
      service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: "Panic-Pass-12345!",
      })
    ).rejects.toThrow("Vault content has been deleted from storage providers");
  });

  it("should still unlock decoy layer after panic passphrase exists", async () => {
    const decoy = new TextEncoder().encode("innocent");
    const hidden = new TextEncoder().encode("secret");

    const created = await service.createVault({
      decoyContent: decoy,
      hiddenContent: hidden,
      passphrase: "Hidden-Pass-12345!",
      decoyPassphrase: "Decoy-Pass-12345!",
      panicPassphrase: "Panic-Pass-12345!",
    });

    const unlocked = await service.unlockVault({
      vaultURL: created.vaultURL,
      passphrase: "Decoy-Pass-12345!",
    });

    expect(unlocked.isDecoy).toBe(true);
    expect(unlocked.content).toEqual(decoy);
  });

  it("should still unlock hidden layer after panic passphrase exists", async () => {
    const decoy = new TextEncoder().encode("innocent");
    const hidden = new TextEncoder().encode("secret");

    const created = await service.createVault({
      decoyContent: decoy,
      hiddenContent: hidden,
      passphrase: "Hidden-Pass-12345!",
      decoyPassphrase: "Decoy-Pass-12345!",
      panicPassphrase: "Panic-Pass-12345!",
    });

    const unlocked = await service.unlockVault({
      vaultURL: created.vaultURL,
      passphrase: "Hidden-Pass-12345!",
    });

    expect(unlocked.isDecoy).toBe(false);
    expect(unlocked.content).toEqual(hidden);
  });

  it("should enforce minimum 12 character length for panic passphrase", async () => {
    const hidden = new TextEncoder().encode("secret");

    await expect(
      service.createVault({
        hiddenContent: hidden,
        passphrase: "test-pass-12345",
        panicPassphrase: "short", // Too short
      })
    ).rejects.toThrow("Panic password must be at least 12 characters");
  });

  it("should handle panic passphrase with special characters", async () => {
    const hidden = new TextEncoder().encode("secret");

    const created = await service.createVault({
      hiddenContent: hidden,
      passphrase: "Hidden-Pass-12345!",
      panicPassphrase: "Panic!@#$%^&*()_+1A",
    });

    await expect(
      service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: "Panic!@#$%^&*()_+1A",
      })
    ).rejects.toThrow("Vault content has been deleted from storage providers");
  });

  it("should handle panic passphrase with unicode characters", async () => {
    const hidden = new TextEncoder().encode("secret");

    const created = await service.createVault({
      hiddenContent: hidden,
      passphrase: "Hidden-Pass-12345!",
      panicPassphrase: "Panicpass123456?",
    });

    await expect(
      service.unlockVault({
        vaultURL: created.vaultURL,
        passphrase: "Panicpass123456?",
      })
    ).rejects.toThrow("Vault content has been deleted from storage providers");
  });
});
