"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VaultService } from "@/lib/services/vault";
import { warmUpHelia } from "@/lib/helia/singleton";
import { useConnectionStatus } from "@/lib/helia/connection-monitor";

const INACTIVITY_TIMEOUT_MS = 60000;

export default function ViewVault() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [isDecoy, setIsDecoy] = useState(false);
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const { connectionState, peerCount } = useConnectionStatus();

  const getConnectionBackground = () => {
    if (connectionState === 'connected') return 'rgba(0, 255, 0, 0.1)';
    if (connectionState === 'degraded') return 'rgba(255, 165, 0, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getConnectionBorder = () => {
    if (connectionState === 'connected') return 'rgba(0, 255, 0, 0.3)';
    if (connectionState === 'degraded') return 'rgba(255, 165, 0, 0.3)';
    return 'rgba(255, 255, 255, 0.2)';
  };

  useEffect(() => {
    warmUpHelia();
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      setIsBlurred(false);
      timeout = setTimeout(() => setIsBlurred(true), INACTIVITY_TIMEOUT_MS);
    };
    resetTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => globalThis.window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => globalThis.window.removeEventListener(e, resetTimer));
    };
  }, []);

  const handleUnlock = async () => {
    if (globalThis.window === undefined) return;

    const hash = globalThis.window.location.hash.slice(1);
    if (!hash) {
      setError("Invalid vault URL");
      return;
    }

    setError("");
    setLoading(true);

    const vaultService = new VaultService();
    const warningTimeout = setTimeout(() => {
      setError("Connecting to IPFS network. This may take up to 60 seconds...");
    }, 10000);

    try {
      const vaultURL = `${globalThis.window.location.origin}/v#${hash}`;
      const result = await vaultService.unlockVault({
        vaultURL,
        passphrase: passphrase.trim(),
      });

      clearTimeout(warningTimeout);
      setContent(new TextDecoder().decode(result.content));
      setIsDecoy(result.isDecoy);
    } catch (err) {
      clearTimeout(warningTimeout);
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
    } finally {
      await vaultService.stop();
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        filter: isBlurred ? "blur(8px)" : "none",
        transition: "filter 0.3s ease",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            marginBottom: 24,
            padding: 0,
            background: "transparent",
            color: "#fff",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            opacity: 0.7,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ←
        </button>

        <h1
          style={{
            fontSize: 32,
            marginBottom: 32,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Unlock Vault
        </h1>

        {content ? (
          <div>
            <div
              style={{
                padding: 20,
                background: isDecoy
                  ? "rgba(255, 165, 0, 0.1)"
                  : "rgba(0, 255, 0, 0.1)",
                border: `1px solid ${isDecoy ? "rgba(255, 165, 0, 0.3)" : "rgba(0, 255, 0, 0.3)"}`,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                  opacity: 0.8,
                }}
              >
                {isDecoy ? "⚠️ Decoy Layer" : "✓ Hidden Layer"}
              </p>
              <div
                style={{
                  padding: 12,
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: 6,
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                {content}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(content);
                  } catch {
                    setError("Failed to copy to clipboard");
                  }
                }}
                style={{
                  padding: "12px 24px",
                  background: "rgba(168, 85, 247, 0.3)",
                  color: "#fff",
                  border: "1px solid rgba(168, 85, 247, 0.5)",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Copy Content
              </button>
              <button
                onClick={() => {
                  setContent("");
                  setPassphrase("");
                  setIsDecoy(false);
                }}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Lock Vault
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {connectionState !== "offline" && (
              <div
                style={{
                  padding: 12,
                  background: getConnectionBackground(),
                  border: `1px solid ${getConnectionBorder()}`,
                  borderRadius: 8,
                  fontSize: 13,
                  textAlign: "center",
                  opacity: 0.8,
                }}
              >
                {connectionState === "connecting" &&
                  `Connecting to IPFS network... (${peerCount} peers)`}
                {connectionState === "degraded" &&
                  `⚠️ Limited connectivity (${peerCount} peers) - unlock may be slow`}
                {connectionState === "connected" &&
                  `✓ Connected to IPFS (${peerCount} peers)`}
              </div>
            )}
            <div>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Enter password to unlock..."
                style={{
                  width: "100%",
                  padding: 12,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid rgba(255, 0, 0, 0.3)",
                  borderRadius: 8,
                  color: "#ff6b6b",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="start-btn"
                style={{
                  width: "50%",
                  padding: "14px 12px",
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxSizing: "border-box",
                }}
              >
                {loading ? "Unlocking..." : "Unlock"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
