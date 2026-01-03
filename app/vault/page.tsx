"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 60000;

function triggerConfetti() {
  if (globalThis.window === undefined) return;
  
  import("canvas-confetti").then(({ default: confetti }) => {
    const duration = 2000;
    const end = Date.now() + duration;
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#a855f7", "#ffffff", "#a855f7"]
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#a855f7", "#ffffff", "#a855f7"]
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  });
}

interface UnlockedContentProps {
  readonly content: string;
  readonly isDecoy: boolean;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onLock: () => void;
}

function UnlockedContent({ content, isDecoy, copied, onCopy, onLock }: UnlockedContentProps) {
  return (
    <div style={{ position: "relative" }}>
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: [1, 1.2, 0],
          opacity: [1, 1, 0],
          rotate: [0, 0, 45]
        }}
        transition={{ duration: 0.5, times: [0, 0.3, 1] }}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          pointerEvents: "none"
        }}
      >
        <Lock style={{ width: 128, height: 128, color: "#a855f7" }} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.2, delay: 0.5 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "#a855f7",
          zIndex: 10,
          pointerEvents: "none"
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.7 }}
        style={{
          padding: 20,
          background: isDecoy ? "rgba(255, 165, 0, 0.1)" : "rgba(0, 255, 0, 0.1)",
          border: `1px solid ${isDecoy ? "rgba(255, 165, 0, 0.3)" : "rgba(0, 255, 0, 0.3)"}`,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>
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
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ display: "flex", gap: 12, justifyContent: "center" }}
      >
        {content !== '[File downloaded]' && (
          <button
            onClick={onCopy}
            style={{
              padding: "12px 24px",
              background: "rgba(168, 85, 247, 0.3)",
              color: "#fff",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(168, 85, 247, 0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(168, 85, 247, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {copied ? "Copied!" : "Copy Content"}
          </button>
        )}
        <button
          onClick={onLock}
          style={{
            padding: "12px 24px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Lock Vault
        </button>
      </motion.div>
    </div>
  );
}

export default function ViewVault() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [isDecoy, setIsDecoy] = useState(false);
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [copied, setCopied] = useState(false);

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

    const { VaultService } = await import("@/lib/services/vault");
    const vaultService = new VaultService();

    try {
      const vaultURL = `${globalThis.window.location.origin}/vault#${hash}`;
      const result = await vaultService.unlockVault({
        vaultURL,
        passphrase: passphrase.trim(),
      });
      
      // Try to decode as text, if fails it's a binary file
      try {
        const decoded = new TextDecoder().decode(result.content);
        setContent(decoded);
      } catch {
        // Binary file - trigger download
        const blob = new Blob([new Uint8Array(result.content)]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.isDecoy ? 'decoy-content' : 'hidden-content';
        a.click();
        URL.revokeObjectURL(url);
        setContent('[File downloaded]');
      }
      
      setIsDecoy(result.isDecoy);
      triggerConfetti();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
    } finally {
      await vaultService.stop();
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const handleLock = () => {
    setContent("");
    setPassphrase("");
    setIsDecoy(false);
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
          <UnlockedContent
            content={content}
            isDecoy={isDecoy}
            copied={copied}
            onCopy={handleCopy}
            onLock={handleLock}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
