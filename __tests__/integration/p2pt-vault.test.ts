import { describe, it, expect } from "vitest";
import { isP2PTAvailable, isWebRTCSupported } from "../../lib/p2pt";
import {
  downloadVault,
  uploadVault,
  serializeVaultMetadata,
  deserializeVaultMetadata,
} from "../../lib/storage/vault";
import type { HiddenVaultResult } from "../../lib/duress/layers";
import { HeliaIPFS } from "../../lib/helia";

describe("P2PT Integration E2E", () => {
  it("should detect WebRTC capability", () => {
    const webrtc = isWebRTCSupported();
    const p2pt = isP2PTAvailable();

    expect(typeof webrtc).toBe("boolean");
    expect(typeof p2pt).toBe("boolean");
  });

  it("should integrate P2PT with vault storage", async () => {
    const ipfs = new HeliaIPFS();
    await ipfs.init();

    // Create mock vault data
    const vault: HiddenVaultResult = {
      decoyBlob: new Uint8Array([1, 2, 3]),
      hiddenBlob: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array(32).fill(0),
    };

    // Upload to IPFS
    const stored = await uploadVault(vault, ipfs);
    expect(stored.decoyCID).toBeTruthy();
    expect(stored.hiddenCID).toBeTruthy();

    // Test serialization
    const serialized = serializeVaultMetadata(stored);
    const deserialized = deserializeVaultMetadata(serialized);
    expect(deserialized.decoyCID).toBe(stored.decoyCID);

    // Download with P2PT integration (will fallback to Helia in test env)
    const downloaded = await downloadVault(stored, ipfs);
    expect(downloaded.decoyBlob).toEqual(vault.decoyBlob);
    expect(downloaded.hiddenBlob).toEqual(vault.hiddenBlob);

    await ipfs.stop();
  }, 60000);
});
