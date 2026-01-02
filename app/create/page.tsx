"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VaultService } from "@/lib/services/vault";
import { ARGON2_PROFILES } from "@/lib/crypto/constants";

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10 MB

const sanitizeInput = (input: string): string => {
  const entities = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "&": "&amp;",
  };
  return Object.entries(entities).reduce(
    (str, [char, entity]) => str.replaceAll(char, entity),
    input,
  );
};

interface VaultResult {
  vaultURL: string;
  decoyCID: string;
  hiddenCID: string;
}

export default function CreateVault() {
  const router = useRouter();
  const [decoyContent, setDecoyContent] = useState("");
  const [hiddenContent, setHiddenContent] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [duressPassphrase, setDuressPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VaultResult>();
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      setIsBlurred(false);
      timeout = setTimeout(() => setIsBlurred(true), 60000);
    };
    resetTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  const handleCreate = async () => {
    const sanitizedDecoy = sanitizeInput(decoyContent.trim());
    const sanitizedHidden = sanitizeInput(hiddenContent.trim());
    const sanitizedPassphrase = passphrase.trim();
    const sanitizedDuress = duressPassphrase.trim();

    if (!sanitizedDecoy) {
      setError("Please enter decoy content");
      return;
    }
    if (!sanitizedHidden) {
      setError("Please enter hidden content");
      return;
    }
    const decoySize = new TextEncoder().encode(sanitizedDecoy).length;
    const hiddenSize = new TextEncoder().encode(sanitizedHidden).length;
    if (decoySize > MAX_CONTENT_SIZE) {
      setError(
        `Decoy content too large (${(decoySize / 1024 / 1024).toFixed(2)} MB). Maximum size is 10 MB`,
      );
      return;
    }
    if (hiddenSize > MAX_CONTENT_SIZE) {
      setError(
        `Hidden content too large (${(hiddenSize / 1024 / 1024).toFixed(2)} MB). Maximum size is 10 MB`,
      );
      return;
    }
    if (!sanitizedPassphrase) {
      setError("Please enter a passphrase for hidden layer");
      return;
    }
    if (sanitizedPassphrase.length < 12) {
      setError("Passphrase must be at least 12 characters");
      return;
    }
    if (!/[A-Z]/.test(sanitizedPassphrase)) {
      setError("Passphrase must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(sanitizedPassphrase)) {
      setError("Passphrase must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(sanitizedPassphrase)) {
      setError("Passphrase must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(sanitizedPassphrase)) {
      setError("Passphrase must contain at least one special character");
      return;
    }

    setError("");
    setLoading(true);
    setProgress(50);
    setLoadingStep("Encrypting layers...");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 70));
    }, 50);

    try {
      const vaultService = new VaultService();
      const vaultResult = await vaultService.createVault({
        decoyContent: new TextEncoder().encode(sanitizedDecoy),
        hiddenContent: new TextEncoder().encode(sanitizedHidden),
        passphrase: sanitizedPassphrase,
        duressPassphrase: sanitizedDuress || undefined,
        argonProfile: ARGON2_PROFILES.desktop,
      });

      clearInterval(progressInterval);
      setProgress(75);
      await new Promise((resolve) => setTimeout(resolve, 200));

      setLoadingStep("Uploading to IPFS........");
      setProgress(98);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLoadingStep("Finalizing...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await vaultService.stop();
      setResult(vaultResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      setLoading(false);
      setLoadingStep("");
      setProgress(0);
    }
  };

  return (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: 32,
              background:
                "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(168, 85, 247, 0.1))",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: 16,
              textAlign: "center",
              width: 380,
              boxSizing: "border-box",
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#e9d5ff",
                height: 24,
                marginBottom: 20,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {loadingStep || "Processing..."}
              </motion.div>
            </div>

            <div
              style={{
                width: "100%",
                height: 6,
                background: "rgba(168, 85, 247, 0.2)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: "50%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #a855f7, #c084fc)",
                  boxShadow:
                    "0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          filter: isBlurred ? "blur(8px)" : "none",
          transition: "filter 0.3s ease"
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              marginBottom: 24,
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <h1
            style={{
              fontSize: 32,
              marginBottom: 32,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Create Vault
          </h1>

          {!result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Decoy Content
                </label>
                <textarea
                  value={decoyContent}
                  onChange={(e) => setDecoyContent(e.target.value)}
                  placeholder="Enter innocent content (shown under duress)..."
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: 12,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Hidden Content
                </label>
                <textarea
                  value={hiddenContent}
                  onChange={(e) => setHiddenContent(e.target.value)}
                  placeholder="Enter your real secret content..."
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: 12,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Duress Passphrase (Optional)
                </label>
                <input
                  type="password"
                  value={duressPassphrase}
                  onChange={(e) => setDuressPassphrase(e.target.value)}
                  placeholder="Leave empty to show decoy without passphrase..."
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

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Hidden Layer Passphrase
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong passphrase..."
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  Must be 12+ characters with uppercase, lowercase, number, and
                  special character
                </motion.div>
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
                  onClick={handleCreate}
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
                  {loading ? "Creating..." : "Create Vault"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  padding: 20,
                  background: "rgba(0, 255, 0, 0.1)",
                  border: "1px solid rgba(0, 255, 0, 0.3)",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                  ✓ Vault Created!
                </p>
                <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>
                  Vault URL:
                </p>
                <code
                  style={{
                    display: "block",
                    padding: 12,
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 6,
                    fontSize: 11,
                    wordBreak: "break-all",
                    marginBottom: 16,
                  }}
                >
                  {result.vaultURL}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(result.vaultURL)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#fff",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: 16,
                  }}
                >
                  Copy URL
                </button>
                <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
                  Decoy CID: {result.decoyCID.slice(0, 20)}...
                </p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>
                  Hidden CID: {result.hiddenCID.slice(0, 20)}...
                </p>
              </div>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  onClick={() => router.push(result.vaultURL)}
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
                  Open Vault
                </button>
                <button
                  onClick={() => {
                    setResult(undefined);
                    setDecoyContent("");
                    setHiddenContent("");
                    setPassphrase("");
                    setDuressPassphrase("");
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
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
