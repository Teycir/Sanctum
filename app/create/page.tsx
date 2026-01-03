"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10 MB

const sanitizeInput = (input: string): string => {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };
  try {
    return Object.entries(entities).reduce(
      (str, [char, entity]) => str.replaceAll(char, entity),
      input,
    );
  } catch {
    return input;
  }
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
  const [pinataJWT, setPinataJWT] = useState("");
  const [hasStoredJWT, setHasStoredJWT] = useState(false);
  const [jwtStatus, setJwtStatus] = useState<'validating' | 'valid' | 'invalid' | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VaultResult>();
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedDecoy, setCopiedDecoy] = useState(false);
  const [copiedHidden, setCopiedHidden] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      setIsBlurred(false);
      timeout = setTimeout(() => setIsBlurred(true), 60000);
    };
    resetTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => globalThis.window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeout);
      events.forEach((e) =>
        globalThis.window.removeEventListener(e, resetTimer),
      );
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { loadJWT } = await import('@/lib/storage/jwt');
      const jwt = await loadJWT();
      if (jwt) {
        setPinataJWT(jwt);
        setHasStoredJWT(true);
        validateJWT(jwt);
      }
    })();
  }, []);

  const validateJWT = async (jwt: string) => {
    if (!jwt.trim()) return;
    
    setJwtStatus('validating');
    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      
      if (response.ok) {
        setJwtStatus('valid');
        if (!hasStoredJWT) {
          const { saveJWT } = await import('@/lib/storage/jwt');
          await saveJWT(jwt);
          setHasStoredJWT(true);
        }
      } else {
        setJwtStatus('invalid');
        if (hasStoredJWT) {
          const { clearJWT } = await import('@/lib/storage/jwt');
          clearJWT();
          setHasStoredJWT(false);
        }
      }
    } catch {
      setJwtStatus('invalid');
    }
  };

  useEffect(() => {
    if (!hasStoredJWT && pinataJWT.trim()) {
      const timer = setTimeout(() => validateJWT(pinataJWT), 500);
      return () => clearTimeout(timer);
    }
  }, [pinataJWT, hasStoredJWT]);

  const validatePassword = (password: string, label: string): string | null => {
    if (password.length < 12) return `${label} must be at least 12 characters`;
    if (!/[A-Z]/.test(password)) return `${label} must contain at least one uppercase letter`;
    if (!/[a-z]/.test(password)) return `${label} must contain at least one lowercase letter`;
    if (!/\d/.test(password)) return `${label} must contain at least one number`;
    if (!/[^A-Za-z0-9]/.test(password)) return `${label} must contain at least one special character`;
    return null;
  };

  const handleCreate = async () => {
    const sanitizedDecoy = sanitizeInput(decoyContent.trim());
    const sanitizedHidden = sanitizeInput(hiddenContent.trim());
    const sanitizedPassphrase = sanitizeInput(passphrase.trim());
    const sanitizedDuress = sanitizeInput(duressPassphrase.trim());

    if (!sanitizedHidden) {
      setError("Please enter hidden content");
      return;
    }
    if (!sanitizedDecoy) {
      setError("Please enter decoy content");
      return;
    }
    if (!sanitizedDuress) {
      setError("Please enter duress password");
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
      setError("Please enter a password for hidden layer");
      return;
    }
    
    const hiddenError = validatePassword(sanitizedPassphrase, "Hidden password");
    if (hiddenError) {
      setError(hiddenError);
      return;
    }
    
    const duressError = validatePassword(sanitizedDuress, "Duress password");
    if (duressError) {
      setError(duressError);
      return;
    }
    if (sanitizedPassphrase === sanitizedDuress) {
      setError("Hidden password must be different from duress password");
      return;
    }

    // Validate JWT before proceeding
    if (jwtStatus !== 'valid') {
      setError("Please provide a valid Pinata JWT");
      return;
    }

    setError("");
    setLoading(true);
    setProgress(10);
    setLoadingStep("Deriving keys...");

    let intervalCleared = false;
    const progressSteps = [
      { progress: 10, step: "Deriving keys...", delay: 0 },
      { progress: 30, step: "Encrypting decoy layer...", delay: 800 },
      { progress: 50, step: "Encrypting hidden layer...", delay: 1600 },
      { progress: 85, step: "Uploading to Pinata...", delay: 2400 },
    ];

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTime;
        const currentStep = progressSteps.find(s => elapsed >= s.delay && elapsed < s.delay + 800);
        if (currentStep && loadingStep !== currentStep.step) {
          setLoadingStep(currentStep.step);
        }
        return Math.min(prev + 1, 90);
      });
    }, 50);

    const startTime = Date.now();

    try {
      const [{ VaultService }, { ARGON2_PROFILES }] = await Promise.all([
        import("@/lib/services/vault"),
        import("@/lib/crypto/constants")
      ]);
      
      const vaultService = new VaultService();

      const vaultResult = await vaultService.createVault({
        decoyContent: new TextEncoder().encode(sanitizedDecoy),
        hiddenContent: new TextEncoder().encode(sanitizedHidden),
        passphrase: sanitizedPassphrase,
        duressPassphrase: sanitizedDuress,
        argonProfile: ARGON2_PROFILES.desktop,
        ipfsCredentials: {
          pinataJWT: pinataJWT.trim(),
        },
      });

      clearInterval(progressInterval);
      intervalCleared = true;
      setProgress(100);
      setLoadingStep("Complete!");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResult(vaultResult);
      vaultService.stop().catch(() => {}); // Stop in background
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      if (!intervalCleared) clearInterval(progressInterval);
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
                initial={{ width: "10%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
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
          justifyContent: "flex-start",
          padding: "20px 20px 20px",
          filter: isBlurred ? "blur(8px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          <h1
            style={{
              fontSize: 28,
              marginBottom: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Create Vault
          </h1>

          <button
            onClick={() => router.push("/")}
            style={{
              marginBottom: 20,
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

          {!result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Decoy Content
                </label>
                <textarea
                  value={decoyContent}
                  onChange={(e) => setDecoyContent(e.target.value)}
                  placeholder="Innocent content shown under duress..."
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
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
                    minHeight: 80,
                    padding: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Duress Password
                </label>
                <input
                  type="password"
                  value={duressPassphrase}
                  onChange={(e) => setDuressPassphrase(e.target.value)}
                  placeholder="Password to reveal decoy content..."
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Hidden Layer Password
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong password..."
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    lineHeight: 1.4,
                    textAlign: "center",
                  }}
                >
                  Both passwords must be 12+ characters with uppercase, lowercase, number, and special character
                </motion.div>
              </div>

              <div style={{ marginTop: 8, padding: 12, background: "rgba(168, 85, 247, 0.1)", borderRadius: 8 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: "#c084fc" }}>
                  Pinata JWT
                </label>
                <input
                  type="password"
                  value={pinataJWT}
                  onChange={(e) => {
                    setPinataJWT(e.target.value);
                    setJwtStatus(null);
                  }}
                  placeholder="Enter your Pinata JWT token"
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${jwtStatus === 'valid' ? 'rgba(0, 255, 0, 0.4)' : jwtStatus === 'invalid' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 12,
                    boxSizing: "border-box",
                  }}
                />
                {jwtStatus && (
                  <p style={{ fontSize: 10, marginTop: 6, color: jwtStatus === 'valid' ? '#4ade80' : jwtStatus === 'invalid' ? '#ff6b6b' : '#a855f7' }}>
                    {jwtStatus === 'validating' && '⏳ Validating JWT...'}
                    {jwtStatus === 'valid' && '✓ Valid JWT - Encrypted and saved'}
                    {jwtStatus === 'invalid' && '✗ Invalid JWT - Please check your token'}
                  </p>
                )}
                <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
                  Get free JWT at pinata.cloud (1GB free storage)
                </p>
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
                  type="button"
                  onClick={handleCreate}
                  disabled={loading || jwtStatus !== 'valid' || !hiddenContent.trim() || !decoyContent.trim() || !duressPassphrase.trim() || !passphrase.trim()}
                  className="start-btn"
                  style={{
                    width: "50%",
                    padding: "14px 12px",
                    opacity: (loading || jwtStatus !== 'valid' || !hiddenContent.trim() || !decoyContent.trim() || !duressPassphrase.trim() || !passphrase.trim()) ? 0.5 : 1,
                    cursor: (loading || jwtStatus !== 'valid' || !hiddenContent.trim() || !decoyContent.trim() || !duressPassphrase.trim() || !passphrase.trim()) ? "not-allowed" : "pointer",
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
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.vaultURL);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1000);
                    } catch {
                      setError("Failed to copy to clipboard");
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#fff",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: 16,
                    transition: "background 0.2s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy URL"}
                </button>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.decoyCID);
                        setCopiedDecoy(true);
                        setTimeout(() => setCopiedDecoy(false), 1000);
                      } catch {
                        setError("Failed to copy CID");
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)"}
                    style={{
                      padding: "4px 8px",
                      background: "rgba(168, 85, 247, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedDecoy ? "✓ Copied!" : "Copy Decoy CID"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.hiddenCID);
                        setCopiedHidden(true);
                        setTimeout(() => setCopiedHidden(false), 1000);
                      } catch {
                        setError("Failed to copy CID");
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)"}
                    style={{
                      padding: "4px 8px",
                      background: "rgba(168, 85, 247, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedHidden ? "✓ Copied!" : "Copy Hidden CID"}
                  </button>
                </div>
                <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12, wordBreak: "break-all" }}>
                  Decoy CID: {result.decoyCID}
                </p>
                <p style={{ fontSize: 12, opacity: 0.6, wordBreak: "break-all" }}>
                  Hidden CID: {result.hiddenCID}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  type="button"
                  onClick={() => router.push(result.vaultURL)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.4)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(168, 85, 247, 0.3)"}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(168, 85, 247, 0.3)",
                    color: "#fff",
                    border: "1px solid rgba(168, 85, 247, 0.5)",
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  Open Vault
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(undefined);
                    setDecoyContent("");
                    setHiddenContent("");
                    setPassphrase("");
                    setDuressPassphrase("");
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "background 0.2s",
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
