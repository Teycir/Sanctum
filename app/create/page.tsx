"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CollapsiblePanel } from "../components/CollapsiblePanel";
import { sanitizeInput, validateVaultForm } from "@/lib/validation/vault-form";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface VaultResult {
  vaultURL: string;
  decoyCID: string;
  hiddenCID: string;
}

export default function CreateVault() {
  const router = useRouter();
  const [decoyContent, setDecoyContent] = useState("");
  const [decoyFile, setDecoyFile] = useState<File | null>(null);
  const [hiddenContent, setHiddenContent] = useState("");
  const [hiddenFile, setHiddenFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [decoyPassphrase, setDecoyPassphrase] = useState("");
  const [pinataJWT, setPinataJWT] = useState("");
  const [filebaseAccessKey, setFilebaseAccessKey] = useState("");
  const [filebaseSecretKey, setFilebaseSecretKey] = useState("");
  const [filebaseBucket, setFilebaseBucket] = useState("sanctum-vaults");
  const [provider, setProvider] = useState<"pinata" | "filebase">("pinata");
  const [hasStoredJWT, setHasStoredJWT] = useState(false);
  const [hasStoredFilebase, setHasStoredFilebase] = useState(false);
  const [jwtStatus, setJwtStatus] = useState<
    "validating" | "valid" | "invalid" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VaultResult>();
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedDecoy, setCopiedDecoy] = useState(false);
  const [copiedHidden, setCopiedHidden] = useState(false);
  const [storageQuota, setStorageQuota] = useState<{
    used: number;
    limit: number;
    available: number;
  } | null>(null);

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
      const { loadJWT } = await import("@/lib/storage/jwt");
      const jwt = await loadJWT();
      if (jwt) {
        setPinataJWT(jwt);
        setHasStoredJWT(true);
        validateJWT(jwt);
      }
      
      const { loadFilebaseCredentials } = await import("@/lib/storage/filebase-credentials");
      const credentials = await loadFilebaseCredentials();
      if (credentials) {
        setFilebaseAccessKey(credentials.accessKey);
        setFilebaseSecretKey(credentials.secretKey);
        setHasStoredFilebase(true);
      }
    })();
  }, []);

  const validateJWT = async (jwt: string) => {
    if (!jwt.trim()) return;

    setJwtStatus("validating");
    try {
      const response = await fetch(
        "https://api.pinata.cloud/data/testAuthentication",
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      if (response.ok) {
        setJwtStatus("valid");
        if (!hasStoredJWT) {
          const { saveJWT } = await import("@/lib/storage/jwt");
          await saveJWT(jwt);
          setHasStoredJWT(true);
        }
      } else {
        setJwtStatus("invalid");
        if (hasStoredJWT) {
          const { clearJWT } = await import("@/lib/storage/jwt");
          clearJWT();
          setHasStoredJWT(false);
        }
      }
    } catch {
      setJwtStatus("invalid");
    }
  };

  useEffect(() => {
    if (!hasStoredJWT && pinataJWT.trim()) {
      const timer = setTimeout(() => validateJWT(pinataJWT), 500);
      return () => clearTimeout(timer);
    }
  }, [pinataJWT, hasStoredJWT]);

  const saveFilebaseCredentials = async (accessKey: string, secretKey: string) => {
    if (!accessKey.trim() || !secretKey.trim()) return;
    
    try {
      const { saveFilebaseCredentials } = await import("@/lib/storage/filebase-credentials");
      await saveFilebaseCredentials({ accessKey: accessKey.trim(), secretKey: secretKey.trim() });
      setHasStoredFilebase(true);
    } catch {
      // Ignore save errors
    }
  };

  useEffect(() => {
    if (!hasStoredFilebase && filebaseAccessKey.trim() && filebaseSecretKey.trim()) {
      const timer = setTimeout(() => saveFilebaseCredentials(filebaseAccessKey, filebaseSecretKey), 1000);
      return () => clearTimeout(timer);
    }
  }, [filebaseAccessKey, filebaseSecretKey, hasStoredFilebase]);

  useEffect(() => {
    const fetchQuota = async () => {
      if (provider === "pinata" && jwtStatus === "valid") {
        try {
          const { checkPinataQuota } =
            await import("@/lib/storage/pinata-quota");
          const quota = await checkPinataQuota(pinataJWT.trim());
          setStorageQuota(quota);
        } catch {
          setStorageQuota(null);
        }
      } else if (
        provider === "filebase" &&
        filebaseAccessKey &&
        filebaseSecretKey
      ) {
        try {
          const { checkFilebaseQuota } =
            await import("@/lib/storage/filebase-quota");
          const quota = await checkFilebaseQuota(
            filebaseAccessKey.trim(),
            filebaseSecretKey.trim(),
            filebaseBucket.trim(),
          );
          setStorageQuota(quota);
        } catch {
          setStorageQuota(null);
        }
      } else {
        setStorageQuota(null);
      }
    };
    fetchQuota();
  }, [
    provider,
    jwtStatus,
    pinataJWT,
    filebaseAccessKey,
    filebaseSecretKey,
    filebaseBucket,
  ]);

  const getStorageWarning = () => {
    if (!storageQuota) return null;
    const percentage = (storageQuota.used / storageQuota.limit) * 100;
    if (percentage >= 95) {
      return {
        level: "critical" as const,
        message: `Storage at ${percentage.toFixed(1)}% (${(storageQuota.used / 1024 / 1024).toFixed(1)}MB/${(storageQuota.limit / 1024 / 1024).toFixed(0)}MB). Uploads blocked.`,
      };
    }
    if (percentage >= 80) {
      return {
        level: "warning" as const,
        message: `Storage at ${percentage.toFixed(1)}% (${(storageQuota.used / 1024 / 1024).toFixed(1)}MB/${(storageQuota.limit / 1024 / 1024).toFixed(0)}MB). Consider deleting old vaults.`,
      };
    }
    return null;
  };

  const isFormValid = () => {
    if (loading) return false;
    if (!hiddenContent.trim() && !hiddenFile) return false;
    if (!passphrase.trim()) return false;
    if (provider === "pinata") return jwtStatus === "valid";
    return filebaseAccessKey.trim() && filebaseSecretKey.trim();
  };

  const getButtonOpacity = () => (isFormValid() ? 1 : 0.5);
  const getButtonCursor = () => (isFormValid() ? "pointer" : "not-allowed");

  const handleCreate = async () => {
    if (!hiddenContent.trim() && !hiddenFile) {
      setError("Please enter hidden content or upload a file");
      return;
    }

    const sanitizedDecoy = decoyFile ? "" : sanitizeInput(decoyContent.trim());
    const sanitizedHidden = hiddenFile
      ? ""
      : sanitizeInput(hiddenContent.trim());
    const sanitizedPassphrase = sanitizeInput(passphrase.trim());
    const sanitizedDuress = sanitizeInput(decoyPassphrase.trim());

    // Only validate text content if no files
    if (!decoyFile && !hiddenFile) {
      const validationError = validateVaultForm({
        decoyContent: sanitizedDecoy,
        hiddenContent: sanitizedHidden,
        passphrase: sanitizedPassphrase,
        decoyPassphrase: sanitizedDuress,
      });

      if (validationError) {
        setError(validationError);
        return;
      }
    } else {
      // Validate passwords only
      if (!sanitizedPassphrase) {
        setError("Please enter a password for hidden layer");
        return;
      }
      const { validatePassword } = await import("@/lib/validation/vault-form");
      const passphraseError = validatePassword(
        sanitizedPassphrase,
        "Hidden password",
      );
      if (passphraseError) {
        setError(passphraseError);
        return;
      }
      if ((decoyContent.trim() || decoyFile) && !sanitizedDuress) {
        setError("Decoy password is required when decoy content is provided");
        return;
      }
      if (sanitizedDuress) {
        const decoyError = validatePassword(sanitizedDuress, "Decoy password");
        if (decoyError) {
          setError(decoyError);
          return;
        }
        if (sanitizedPassphrase === sanitizedDuress) {
          setError("Hidden password must be different from decoy password");
          return;
        }
      }
    }

    if (provider === "pinata" && jwtStatus !== "valid") {
      setError("Please provide a valid Pinata JWT");
      return;
    }
    if (
      provider === "filebase" &&
      (!filebaseAccessKey.trim() || !filebaseSecretKey.trim())
    ) {
      setError("Please provide Filebase access key and secret key");
      return;
    }

    // Check storage quota
    if (provider === "pinata") {
      try {
        const { calculateTotalSize } =
          await import("@/lib/validation/vault-form");
        const { checkPinataQuota, validatePinataSpace } =
          await import("@/lib/storage/pinata-quota");

        const totalSize = calculateTotalSize(
          sanitizedDecoy,
          sanitizedHidden,
          decoyFile || undefined,
          hiddenFile || undefined,
        );
        const quota = await checkPinataQuota(pinataJWT.trim());
        const quotaError = validatePinataSpace(totalSize, quota);

        if (quotaError) {
          setError(quotaError);
          return;
        }
      } catch (err) {
        if (err instanceof TypeError || err instanceof RangeError) {
          console.warn("Unable to check storage quota:", err);
        } else {
          throw err;
        }
      }
    } else {
      try {
        const { calculateTotalSize } =
          await import("@/lib/validation/vault-form");
        const { checkFilebaseQuota, validateFilebaseSpace } =
          await import("@/lib/storage/filebase-quota");

        const totalSize = calculateTotalSize(
          sanitizedDecoy,
          sanitizedHidden,
          decoyFile || undefined,
          hiddenFile || undefined,
        );
        const quota = await checkFilebaseQuota(
          filebaseAccessKey.trim(),
          filebaseSecretKey.trim(),
          filebaseBucket.trim(),
        );
        const quotaError = validateFilebaseSpace(totalSize, quota);

        if (quotaError) {
          setError(quotaError);
          return;
        }
      } catch (err) {
        if (err instanceof TypeError || err instanceof RangeError) {
          console.warn("Unable to check storage quota:", err);
        } else {
          throw err;
        }
      }
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
      { progress: 85, step: "Uploading to IPFS...", delay: 2400 },
    ];

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTime;
        const currentStep = progressSteps.find(
          (s) => elapsed >= s.delay && elapsed < s.delay + 800,
        );
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
        import("@/lib/crypto/constants"),
      ]);

      const vaultService = new VaultService();

      // Convert files to Uint8Array if present
      let decoyData: Uint8Array;
      let hiddenData: Uint8Array;

      if (decoyFile) {
        const arrayBuffer = await decoyFile.arrayBuffer();
        decoyData = new Uint8Array(arrayBuffer);
      } else {
        decoyData = new TextEncoder().encode(sanitizedDecoy);
      }

      if (hiddenFile) {
        const arrayBuffer = await hiddenFile.arrayBuffer();
        hiddenData = new Uint8Array(arrayBuffer);
      } else {
        hiddenData = new TextEncoder().encode(sanitizedHidden);
      }

      const vaultResult = await vaultService.createVault({
        decoyContent: decoyData,
        hiddenContent: hiddenData,
        passphrase: sanitizedPassphrase,
        decoyPassphrase: sanitizedDuress,
        argonProfile: ARGON2_PROFILES.desktop,
        decoyFilename: decoyFile?.name,
        hiddenFilename: hiddenFile?.name,
        ipfsCredentials:
          provider === "pinata"
            ? {
                provider: "pinata",
                pinataJWT: pinataJWT.trim(),
              }
            : {
                provider: "filebase",
                filebaseToken: btoa(`${filebaseAccessKey.trim()}:${filebaseSecretKey.trim()}`),
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
      {loading && <LoadingOverlay step={loadingStep} progress={progress} />}

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

          {result === undefined ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
                const warning = getStorageWarning();
                return (
                  warning && (
                    <div
                      style={{
                        padding: 12,
                        background:
                          warning.level === "critical"
                            ? "rgba(255, 0, 0, 0.1)"
                            : "rgba(255, 193, 7, 0.1)",
                        border: `1px solid ${warning.level === "critical" ? "rgba(255, 0, 0, 0.3)" : "rgba(255, 193, 7, 0.3)"}`,
                        borderRadius: 8,
                        color:
                          warning.level === "critical" ? "#ff6b6b" : "#fbbf24",
                        fontSize: 13,
                      }}
                    >
                      {warning.level === "critical" ? "🚨" : "⚠️"}{" "}
                      {warning.message}
                    </div>
                  )
                );
              })()}
              <CollapsiblePanel title="🎭 Decoy Content (Optional)" defaultOpen={false}>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                  💡 Choose either text OR file (.zip/.rar only) • Max: 25MB
                </p>
                <textarea
                  value={decoyContent}
                  onChange={(e) => {
                    if (decoyFile) {
                      setError("Clear file first to enter text");
                      return;
                    }
                    setDecoyContent(e.target.value);
                  }}
                  placeholder="Innocent content shown under duress..."
                  disabled={!!decoyFile}
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
                    opacity: decoyFile ? 0.5 : 1,
                  }}
                />
                <input
                  type="file"
                  accept=".zip,.rar"
                  disabled={!!decoyContent.trim()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (decoyContent.trim()) {
                      setError("Clear text first to upload file");
                      e.target.value = "";
                      return;
                    }
                    if (!file.name.toLowerCase().endsWith(".zip") && !file.name.toLowerCase().endsWith(".rar")) {
                      setError("Only .zip and .rar files are allowed");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      setError(`File too large. Maximum size is 25MB (${(file.size / 1024 / 1024).toFixed(2)}MB provided)`);
                      e.target.value = "";
                      return;
                    }
                    setDecoyFile(file);
                    setError("");
                  }}
                  className="custom-file-input"
                  id="decoy-file-input"
                />
                <label 
                  htmlFor="decoy-file-input" 
                  className="custom-file-button"
                  style={{
                    opacity: decoyContent.trim() ? 0.5 : 1,
                    cursor: decoyContent.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  📁 Choose File (.zip/.rar)
                </label>
                {decoyFile && (
                  <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#4ade80" }}>
                      ✓ {decoyFile.name} ({(decoyFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setDecoyFile(null)}
                      style={{
                        padding: "2px 6px",
                        background: "rgba(255, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 0, 0, 0.3)",
                        borderRadius: 4,
                        color: "#ff6b6b",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <div>
                  <label htmlFor="decoy-password" style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    Decoy Password
                  </label>
                  <input
                    id="decoy-password"
                    type="password"
                    value={decoyPassphrase}
                    onChange={(e) => setDecoyPassphrase(e.target.value)}
                    placeholder="Password to reveal decoy content..."
                    className="form-input"
                  />
                  {(decoyContent.trim() || decoyFile) && (
                    <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, color: "#fbbf24", opacity: 0.9 }}>
                      ⚠️ Decoy password is required when decoy content is provided
                    </p>
                  )}
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel title="🔒 Hidden Content (Required)" defaultOpen={true}>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                  💡 Choose either text OR file (.zip/.rar only) • Max: 25MB
                </p>
                <textarea
                  value={hiddenContent}
                  onChange={(e) => {
                    if (hiddenFile) {
                      setError("Clear file first to enter text");
                      return;
                    }
                    setHiddenContent(e.target.value);
                  }}
                  placeholder="Enter your real secret content..."
                  disabled={!!hiddenFile}
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
                    opacity: hiddenFile ? 0.5 : 1,
                  }}
                />
                <input
                  type="file"
                  accept=".zip,.rar"
                  disabled={!!hiddenContent.trim()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (hiddenContent.trim()) {
                      setError("Clear text first to upload file");
                      e.target.value = "";
                      return;
                    }
                    if (!file.name.toLowerCase().endsWith(".zip") && !file.name.toLowerCase().endsWith(".rar")) {
                      setError("Only .zip and .rar files are allowed");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      setError(`File too large. Maximum size is 25MB (${(file.size / 1024 / 1024).toFixed(2)}MB provided)`);
                      e.target.value = "";
                      return;
                    }
                    setHiddenFile(file);
                    setError("");
                  }}
                  className="custom-file-input"
                  id="hidden-file-input"
                />
                <label 
                  htmlFor="hidden-file-input" 
                  className="custom-file-button"
                  style={{
                    opacity: hiddenContent.trim() ? 0.5 : 1,
                    cursor: hiddenContent.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  📁 Choose File (.zip/.rar)
                </label>
                {hiddenFile && (
                  <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#4ade80" }}>
                      ✓ {hiddenFile.name} ({(hiddenFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setHiddenFile(null)}
                      style={{
                        padding: "2px 6px",
                        background: "rgba(255, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 0, 0, 0.3)",
                        borderRadius: 4,
                        color: "#ff6b6b",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <div>
                  <label htmlFor="hidden-password" style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    Hidden Password (Required)
                  </label>
                  <input
                    id="hidden-password"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter a strong password..."
                    className="form-input"
                  />
                  <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, textAlign: "center", opacity: 0.7 }}>
                    Both passwords must be 12+ characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
              </CollapsiblePanel>

              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "rgba(30, 144, 255, 0.1)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1e90ff",
                  }}
                >
                  IPFS Provider
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setProvider("pinata")}
                    style={{
                      flex: 1,
                      padding: 8,
                      background:
                        provider === "pinata"
                          ? "rgba(30, 144, 255, 0.3)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${provider === "pinata" ? "rgba(30, 144, 255, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: provider === "pinata" ? 600 : 400,
                    }}
                  >
                    Pinata (1GB free)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("filebase")}
                    style={{
                      flex: 1,
                      padding: 8,
                      background:
                        provider === "filebase"
                          ? "rgba(30, 144, 255, 0.3)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${provider === "filebase" ? "rgba(30, 144, 255, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: provider === "filebase" ? 600 : 400,
                    }}
                  >
                    Filebase (5GB free)
                  </button>
                </div>

                {provider === "pinata" ? (
                  <>
                    <label htmlFor="pinata-jwt" className="provider-label">
                      Pinata JWT
                    </label>
                    <input
                      id="pinata-jwt"
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
                        border: `1px solid ${(() => {
                          if (jwtStatus === "valid")
                            return "rgba(0, 255, 0, 0.4)";
                          if (jwtStatus === "invalid")
                            return "rgba(255, 0, 0, 0.4)";
                          return "rgba(255, 255, 255, 0.2)";
                        })()}`,
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 12,
                        boxSizing: "border-box",
                      }}
                    />
                    {jwtStatus && (
                      <p
                        style={{
                          fontSize: 10,
                          marginTop: 6,
                          color: (() => {
                            if (jwtStatus === "valid") return "#4ade80";
                            if (jwtStatus === "invalid") return "#ff6b6b";
                            return "#1e90ff";
                          })(),
                        }}
                      >
                        {jwtStatus === "validating" && "⏳ Validating JWT..."}
                        {jwtStatus === "valid" &&
                          "✓ Valid JWT - Encrypted and saved"}
                        {jwtStatus === "invalid" &&
                          "✗ Invalid JWT - Please check your token"}
                      </p>
                    )}
                    <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
                      Get free JWT at pinata.cloud (1GB free storage)
                    </p>
                    {storageQuota && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "rgba(30, 144, 255, 0.15)",
                          borderRadius: 6,
                        }}
                      >
                        <p style={{ fontSize: 10, opacity: 0.8 }}>
                          {(storageQuota.available / 1024 / 1024).toFixed(0)} MB
                          free of{" "}
                          {(storageQuota.limit / 1024 / 1024).toFixed(0)} MB (
                          {(
                            (storageQuota.available / storageQuota.limit) *
                            100
                          ).toFixed(1)}
                          % available)
                        </p>
                        <p style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>
                          💾 Accepts .zip or .rar files
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label
                      htmlFor="filebase-access-key"
                      className="provider-label"
                    >
                      Filebase Credentials
                    </label>
                    <input
                      id="filebase-access-key"
                      type="password"
                      value={filebaseAccessKey}
                      onChange={(e) => setFilebaseAccessKey(e.target.value)}
                      placeholder="Access Key"
                      className="provider-input"
                    />
                    <input
                      type="password"
                      value={filebaseSecretKey}
                      onChange={(e) => setFilebaseSecretKey(e.target.value)}
                      placeholder="Secret Key"
                      className="provider-input"
                    />
                    <input
                      type="text"
                      value={filebaseBucket}
                      onChange={(e) => setFilebaseBucket(e.target.value)}
                      placeholder="Bucket Name (must exist in your account)"
                      className="provider-input-last"
                    />
                    <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
                      Create bucket at filebase.com first, then enter name here
                    </p>
                    {storageQuota && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "rgba(30, 144, 255, 0.15)",
                          borderRadius: 6,
                        }}
                      >
                        <p style={{ fontSize: 10, opacity: 0.8 }}>
                          {(storageQuota.available / 1024 / 1024).toFixed(0)} MB
                          free of{" "}
                          {(storageQuota.limit / 1024 / 1024).toFixed(0)} MB (
                          {(
                            (storageQuota.available / storageQuota.limit) *
                            100
                          ).toFixed(1)}
                          % available)
                        </p>
                        <p style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>
                          💾 Accepts .zip or .rar files
                        </p>
                      </div>
                    )}
                  </>
                )}
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
                  disabled={!isFormValid()}
                  className="start-btn"
                  style={{
                    width: "50%",
                    padding: "14px 12px",
                    opacity: getButtonOpacity(),
                    cursor: getButtonCursor(),
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(30, 144, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(30, 144, 255, 0.2)")
                  }
                  style={{
                    padding: "8px 16px",
                    background: "rgba(30, 144, 255, 0.2)",
                    color: "#fff",
                    border: "1px solid rgba(30, 144, 255, 0.4)",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: 16,
                    transition: "background 0.2s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy URL"}
                </button>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(30, 144, 255, 0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(30, 144, 255, 0.1)")
                    }
                    style={{
                      padding: "4px 8px",
                      background: "rgba(30, 144, 255, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(30, 144, 255, 0.3)",
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(30, 144, 255, 0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(30, 144, 255, 0.1)")
                    }
                    style={{
                      padding: "4px 8px",
                      background: "rgba(30, 144, 255, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(30, 144, 255, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedHidden ? "✓ Copied!" : "Copy Hidden CID"}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                    marginTop: 12,
                    wordBreak: "break-all",
                  }}
                >
                  Decoy CID: {result.decoyCID}
                </p>
                <p
                  style={{ fontSize: 12, opacity: 0.6, wordBreak: "break-all" }}
                >
                  Hidden CID: {result.hiddenCID}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  type="button"
                  onClick={() => router.push(result.vaultURL)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(30, 144, 255, 0.4)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(30, 144, 255, 0.3)")
                  }
                  style={{
                    padding: "12px 24px",
                    background: "rgba(30, 144, 255, 0.3)",
                    color: "#fff",
                    border: "1px solid rgba(30, 144, 255, 0.5)",
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
                    setDecoyFile(null);
                    setHiddenContent("");
                    setHiddenFile(null);
                    setPassphrase("");
                    setDecoyPassphrase("");
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)")
                  }
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
