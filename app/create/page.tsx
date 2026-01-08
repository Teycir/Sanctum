"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SecurityStatus } from "../components/SecurityStatus";
import { CollapsiblePanel } from "../components/CollapsiblePanel";
import { ExtensionWarning } from "../components/ExtensionWarning";
import { EyeCandy } from "../components/EyeCandy";
import { Footer } from "../components/Footer";
import { sanitizeInput, validateVaultForm } from "@/lib/validation/vault-form";
import { 
  isValidFileExtension,
  isValidFileSize,
  getFileSizeError,
  getFileExtensionError
} from "@/lib/validation/file";
import { generateVaultQR } from "@/lib/shared/qrcode";
import { useSecureClipboard } from "@/lib/hooks/useSecureClipboard";
import { PasswordField } from "../components/PasswordField";
import { ErrorMessage } from "../components/ErrorMessage";
import { StorageQuotaDisplay } from "../components/StorageQuotaDisplay";
import TextPressure from "../components/text/text-pressure";
import styles from "./page.module.css";


interface VaultResult {
  vaultURL: string;
  decoyCID: string;
  hiddenCID: string;
}

export default function CreateVault() {
  const router = useRouter();
  const { copied, copyToClipboard } = useSecureClipboard();
  const [decoyContent, setDecoyContent] = useState("");
  const [decoyFile, setDecoyFile] = useState<File | null>(null);
  const [hiddenContent, setHiddenContent] = useState("");
  const [hiddenFile, setHiddenFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [decoyPassphrase, setDecoyPassphrase] = useState("");
  const [decoyPassphraseConfirm, setDecoyPassphraseConfirm] = useState("");
  const [panicPassphrase, setPanicPassphrase] = useState("");
  const [panicPassphraseConfirm, setPanicPassphraseConfirm] = useState("");
  const [pinataJWT, setPinataJWT] = useState("");
  const [filebaseAccessKey, setFilebaseAccessKey] = useState("");
  const [filebaseSecretKey, setFilebaseSecretKey] = useState("");
  const [filebaseBucket, setFilebaseBucket] = useState("sanctum-vaults");
  const [provider, setProvider] = useState("pinata");
  const [expiryDays, setExpiryDays] = useState<7 | 30 | 90 | 180 | 365>(30);
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
  const [copiedDecoy, setCopiedDecoy] = useState(false);
  const [copiedHidden, setCopiedHidden] = useState(false);
  const [qrCode, setQrCode] = useState<string>();
  const [storageQuota, setStorageQuota] = useState<{
    used: number;
    limit: number;
    available: number;
  } | null>(null);
  const [vaultServiceRef, setVaultServiceRef] = useState<{
    stop: () => Promise<void>;
  } | null>(null);
  const [threeJsLoaded, setThreeJsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setThreeJsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (vaultServiceRef) {
        vaultServiceRef.stop().catch(console.error);
      }
    };
  }, [vaultServiceRef]);

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

  const validateJWT = useCallback(
    async (jwt: string) => {
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
    },
    [hasStoredJWT],
  );

  useEffect(() => {
    (async () => {
      const { loadJWT } = await import("@/lib/storage/jwt");
      const jwt = await loadJWT();
      if (jwt) {
        setPinataJWT(jwt);
        setHasStoredJWT(true);
        await validateJWT(jwt);
      }

      const { loadFilebaseCredentials } =
        await import("@/lib/storage/filebase-credentials");
      const credentials = await loadFilebaseCredentials();
      if (credentials) {
        setFilebaseAccessKey(credentials.accessKey);
        setFilebaseSecretKey(credentials.secretKey);
        setHasStoredFilebase(true);
      }
    })();
  }, [validateJWT]);

  useEffect(() => {
    if (!hasStoredJWT && pinataJWT.trim()) {
      const timer = setTimeout(() => validateJWT(pinataJWT), 500);
      return () => clearTimeout(timer);
    }
  }, [pinataJWT, hasStoredJWT, validateJWT]);

  const saveFilebaseCredentials = async (
    accessKey: string,
    secretKey: string,
  ) => {
    if (!accessKey.trim() || !secretKey.trim()) return;

    try {
      const { saveFilebaseCredentials } =
        await import("@/lib/storage/filebase-credentials");
      await saveFilebaseCredentials({
        accessKey: accessKey.trim(),
        secretKey: secretKey.trim(),
      });
      setHasStoredFilebase(true);
    } catch {
      // Ignore save errors
    }
  };

  useEffect(() => {
    if (
      !hasStoredFilebase &&
      filebaseAccessKey.trim() &&
      filebaseSecretKey.trim()
    ) {
      const timer = setTimeout(
        () => saveFilebaseCredentials(filebaseAccessKey, filebaseSecretKey),
        1000,
      );
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
        } catch (err) {
          console.error("Failed to fetch Pinata quota:", err);
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
          const quota = await checkFilebaseQuota();
          setStorageQuota(quota);
        } catch (err) {
          console.error("Failed to fetch Filebase quota:", err);
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
    if (!panicPassphrase.trim()) return false;
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
    const sanitizedDecoyPassphrase = sanitizeInput(decoyPassphrase.trim());
    const sanitizedPanicPassphrase = sanitizeInput(panicPassphrase.trim());

    // Validate password confirmations
    if (sanitizedPassphrase !== sanitizeInput(passphraseConfirm.trim())) {
      setError("Hidden passwords do not match");
      return;
    }
    if (sanitizedPanicPassphrase !== sanitizeInput(panicPassphraseConfirm.trim())) {
      setError("Panic passwords do not match");
      return;
    }
    if (sanitizedDecoyPassphrase !== sanitizeInput(decoyPassphraseConfirm.trim())) {
      setError("Decoy passwords do not match");
      return;
    }

    // Validate panic passphrase
    if (!sanitizedPanicPassphrase) {
      setError("Panic password is required");
      return;
    }
    const { validatePassword } = await import("@/lib/validation/vault-form");
    const panicError = validatePassword(sanitizedPanicPassphrase, "Panic password");
    if (panicError) {
      setError(panicError);
      return;
    }
    if (sanitizedPanicPassphrase === sanitizedPassphrase) {
      setError("Panic password must be different from hidden password");
      return;
    }
    if (sanitizedDecoyPassphrase && sanitizedPanicPassphrase === sanitizedDecoyPassphrase) {
      setError("Panic password must be different from decoy password");
      return;
    }

    // Validate text content if no files
    if (!decoyFile && !hiddenFile) {
      const hasDecoyContent = sanitizedDecoy.trim().length > 0;

      if (hasDecoyContent) {
        if (!sanitizedDecoyPassphrase) {
          setError("Decoy password is required when decoy content is provided");
          return;
        }
        const validationError = validateVaultForm({
          decoyContent: sanitizedDecoy,
          hiddenContent: sanitizedHidden,
          passphrase: sanitizedPassphrase,
          decoyPassphrase: sanitizedDecoyPassphrase,
        });

        if (validationError) {
          setError(validationError);
          return;
        }
      } else {
        const passphraseError = validatePassword(
          sanitizedPassphrase,
          "Hidden password",
        );
        if (passphraseError) {
          setError(passphraseError);
          return;
        }
      }
    } else {
      if (!sanitizedPassphrase) {
        setError("Please enter a password for hidden layer");
        return;
      }
      const passphraseError = validatePassword(
        sanitizedPassphrase,
        "Hidden password",
      );
      if (passphraseError) {
        setError(passphraseError);
        return;
      }
      if (decoyFile) {
        if (!sanitizedDecoyPassphrase) {
          setError("Decoy password is required when decoy file is provided");
          return;
        }
        const decoyError = validatePassword(
          sanitizedDecoyPassphrase,
          "Decoy password",
        );
        if (decoyError) {
          setError(decoyError);
          return;
        }
        if (sanitizedPassphrase === sanitizedDecoyPassphrase) {
          setError("Hidden password must be different from decoy password");
          return;
        }
      } else if (sanitizedDecoyPassphrase) {
        const decoyError = validatePassword(
          sanitizedDecoyPassphrase,
          "Decoy password",
        );
        if (decoyError) {
          setError(decoyError);
          return;
        }
        if (sanitizedPassphrase === sanitizedDecoyPassphrase) {
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
          console.error("Unexpected error checking storage quota:", err);
          setError("Failed to check storage quota. Please try again.");
          return;
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
        const quota = await checkFilebaseQuota();
        const quotaError = validateFilebaseSpace(totalSize, quota);

        if (quotaError) {
          setError(quotaError);
          return;
        }
      } catch (err) {
        if (err instanceof TypeError || err instanceof RangeError) {
          console.warn("Unable to check storage quota:", err);
        } else {
          console.error("Unexpected error checking storage quota:", err);
          setError("Failed to check storage quota. Please try again.");
          return;
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
      { progress: 85, step: "Uploading to IPFS (be patient)...", delay: 2400 },
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
    }, 100);

    const startTime = Date.now();

    try {
      const [{ VaultService }, { ARGON2_PROFILES }] = await Promise.all([
        import("@/lib/services/vault"),
        import("@/lib/crypto/constants"),
      ]);

      const vaultService = new VaultService();
      setVaultServiceRef(vaultService);

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
        decoyPassphrase: sanitizedDecoyPassphrase || undefined,
        panicPassphrase: sanitizedPanicPassphrase,
        argonProfile: ARGON2_PROFILES.desktop,
        decoyFilename: decoyFile?.name,
        hiddenFilename: hiddenFile?.name,
        expiryDays,
        ipfsCredentials:
          provider === "pinata"
            ? {
                provider: "pinata",
                pinataJWT: pinataJWT.trim(),
              }
            : {
                provider: "filebase",
                filebaseToken: btoa(
                  `${filebaseAccessKey.trim()}:${filebaseSecretKey.trim()}`,
                ),
              },
      });

      clearInterval(progressInterval);
      intervalCleared = true;
      setProgress(100);
      setLoadingStep("Complete!");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResult(vaultResult);

      // Generate QR code
      try {
        const qr = await generateVaultQR(vaultResult.vaultURL, {
          errorCorrectionLevel: "H",
          width: 300,
        });
        setQrCode(qr);
      } catch {
        // QR generation failed, continue without it
      }

      vaultService.stop().catch((stopError) => {
        console.error("Failed to stop vault service:", stopError);
      });
      setVaultServiceRef(null);
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
      <EyeCandy />
      {!threeJsLoaded && (
        <div className={`${styles.loader} ${threeJsLoaded ? styles.hidden : ""}`}>
          <div className={styles.lockIcon}>🔒</div>
          <div className={styles.loaderText}>Initializing Sanctum...</div>
          <div className={styles.loaderBar}>
            <div className={styles.loaderProgress}></div>
          </div>
        </div>
      )}
      {loading && <LoadingOverlay step={loadingStep} progress={progress} />}
      <SecurityStatus />
      <ExtensionWarning />
      <div className={`${styles.container} ${threeJsLoaded ? styles.loaded : ""} ${isBlurred ? styles.blurred : ""}`}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <TextPressure
              text="Create Vault"
              flex={true}
              weight={true}
              minFontSize={32}
              className="text-white"
            />
          </h1>

          <button
            type="button"
            onClick={() => router.push("/")}
            className={styles.backButton}
          >
            ←
          </button>

          {result === undefined ? (
            <div className={styles.form}>
              {(() => {
                const warning = getStorageWarning();
                return (
                  warning && (
                    <div
                      className={
                        warning.level === "critical"
                          ? styles.warningCritical
                          : styles.warningNormal
                      }
                    >
                      {warning.level === "critical" ? "🚨" : "⚠️"}{" "}
                      {warning.message}
                    </div>
                  )
                );
              })()}
              <CollapsiblePanel
                title="🔒 Hidden Content (Required)"
                defaultOpen={true}
              >
                <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.9)", marginBottom: 12 }}>
                  💡 Choose either text OR file (.zip/.rar only) • Max: 25MB
                </p>
                <textarea
                  value={hiddenContent}
                  onChange={(e) => {
                    if (hiddenFile) {
                      if (confirm("Switching to text will remove the uploaded file. Continue?")) {
                        setHiddenFile(null);
                        setHiddenContent(e.target.value);
                        setError("");
                      }
                      return;
                    }
                    setHiddenContent(e.target.value);
                    setError("");
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
                  accept=".zip,.rar,application/zip,application/x-rar-compressed"
                  disabled={!!hiddenContent.trim()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (hiddenContent.trim()) {
                      if (confirm("Switching to file will clear your text content. Continue?")) {
                        setHiddenContent("");
                      } else {
                        e.target.value = "";
                        return;
                      }
                    }
                    if (!isValidFileExtension(file.name)) {
                      setError(getFileExtensionError());
                      e.target.value = "";
                      return;
                    }
                    if (!isValidFileSize(file.size)) {
                      setError(getFileSizeError(file.size));
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
                    cursor: hiddenContent.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  📁 Choose File (.zip/.rar)
                </label>
                {hiddenFile && (
                  <div
                    style={{
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#4ade80" }}>
                      ✓ {hiddenFile.name} (
                      {(hiddenFile.size / 1024 / 1024).toFixed(2)} MB)
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
                <PasswordField
                  id="hidden-password"
                  label="Hidden Password"
                  value={passphrase}
                  confirmValue={passphraseConfirm}
                  onChange={(value) => {
                    setPassphrase(value);
                    setError("");
                  }}
                  onConfirmChange={(value) => {
                    setPassphraseConfirm(value);
                    setError("");
                  }}
                  required={true}
                />
              </CollapsiblePanel>

              <CollapsiblePanel
                title="🚨 Panic Password (Required)"
                defaultOpen={true}
              >
                <p style={{ fontSize: 13, color: "rgba(255, 193, 7, 0.9)", marginBottom: 16 }}>
                  ⚠️ Shows &quot;vault deleted&quot; message when entered under duress
                </p>
                <PasswordField
                  id="panic-password"
                  label="Panic Password"
                  value={panicPassphrase}
                  confirmValue={panicPassphraseConfirm}
                  onChange={(value) => {
                    setPanicPassphrase(value);
                    setError("");
                  }}
                  onConfirmChange={(value) => {
                    setPanicPassphraseConfirm(value);
                    setError("");
                  }}
                  placeholder="Emergency password to show 'vault deleted'..."
                  required={true}
                />
              </CollapsiblePanel>

              <CollapsiblePanel
                title="🎭 Decoy Content (Optional)"
                defaultOpen={false}
              >
                <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.9)", marginBottom: 12 }}>
                  💡 Choose either text OR file (.zip/.rar only) • Max: 25MB
                </p>
                <textarea
                  value={decoyContent}
                  onChange={(e) => {
                    if (decoyFile) {
                      if (confirm("Switching to text will remove the uploaded file. Continue?")) {
                        setDecoyFile(null);
                        setDecoyContent(e.target.value);
                        setError("");
                      }
                      return;
                    }
                    setDecoyContent(e.target.value);
                    setError("");
                  }}
                  placeholder="Innocent content shown under duress..."
                  disabled={!!decoyFile}
                  className={styles.textarea}
                  style={{ opacity: decoyFile ? 0.5 : 1 }}
                />
                <input
                  type="file"
                  accept=".zip,.rar,application/zip,application/x-rar-compressed"
                  disabled={!!decoyContent.trim()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (decoyContent.trim()) {
                      if (confirm("Switching to file will clear your text content. Continue?")) {
                        setDecoyContent("");
                      } else {
                        e.target.value = "";
                        return;
                      }
                    }
                    if (!isValidFileExtension(file.name)) {
                      setError(getFileExtensionError());
                      e.target.value = "";
                      return;
                    }
                    if (!isValidFileSize(file.size)) {
                      setError(getFileSizeError(file.size));
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
                    cursor: decoyContent.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  📁 Choose File (.zip/.rar)
                </label>
                {decoyFile && (
                  <div
                    style={{
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#4ade80" }}>
                      ✓ {decoyFile.name} (
                      {(decoyFile.size / 1024 / 1024).toFixed(2)} MB)
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
                <PasswordField
                  id="decoy-password"
                  label={`Decoy Password ${(decoyContent.trim() || decoyFile) ? "(Required)" : "(Optional)"}`}
                  value={decoyPassphrase}
                  confirmValue={decoyPassphraseConfirm}
                  onChange={(value) => {
                    setDecoyPassphrase(value);
                    setError("");
                  }}
                  onConfirmChange={(value) => {
                    setDecoyPassphraseConfirm(value);
                    setError("");
                  }}
                  placeholder="Password to reveal decoy content..."
                  required={!!(decoyContent.trim() || decoyFile)}
                />
              </CollapsiblePanel>

              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: "rgba(255, 193, 7, 0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 193, 7, 0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 16 }}>⏱️</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#ffc107",
                    }}
                  >
                    Vault Expiry
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[7, 30, 90, 180, 365].map((days) => {
                    if (
                      days !== 7 &&
                      days !== 30 &&
                      days !== 90 &&
                      days !== 180 &&
                      days !== 365
                    ) {
                      return null;
                    }
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setExpiryDays(days)}
                        style={{
                          flex:
                            days === 365 ? "1 1 100%" : "1 1 calc(50% - 4px)",
                          minWidth: 100,
                          padding: 10,
                          background:
                            expiryDays === days
                              ? "rgba(255, 193, 7, 0.25)"
                              : "rgba(255, 255, 255, 0.05)",
                          border: `1.5px solid ${expiryDays === days ? "rgba(255, 193, 7, 0.6)" : "rgba(255, 255, 255, 0.15)"}`,
                          borderRadius: 6,
                          color: "#fff",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: expiryDays === days ? 600 : 400,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (expiryDays !== days) {
                            e.currentTarget.style.background =
                              "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.borderColor =
                              "rgba(255, 255, 255, 0.25)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (expiryDays !== days) {
                            e.currentTarget.style.background =
                              "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.borderColor =
                              "rgba(255, 255, 255, 0.15)";
                          }
                        }}
                      >
                        {days === 7 && "1 Week"}
                        {days === 30 && "1 Month"}
                        {days === 90 && "3 Months"}
                        {days === 180 && "6 Months"}
                        {days === 365 && "12 Months"}
                      </button>
                    );
                  })}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    marginTop: 10,
                    lineHeight: 1.4,
                  }}
                >
                  ⚠️ Vault will be automatically deleted after expiry date
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 8,
                    color: "#ffc107",
                  }}
                >
                  📅 Expires: {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: "rgba(13, 71, 161, 0.1)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0d47a1",
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
                          ? "rgba(13, 71, 161, 0.3)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${provider === "pinata" ? "rgba(13, 71, 161, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
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
                          ? "rgba(13, 71, 161, 0.3)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${provider === "filebase" ? "rgba(13, 71, 161, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
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
                      placeholder="ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                            return "#0d47a1";
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
                    <StorageQuotaDisplay quota={storageQuota} />
                  </>
                ) : (
                  <>
                    <label
                      htmlFor="filebase-access-key"
                      className="provider-label"
                    >
                      Access Key
                    </label>
                    <input
                      id="filebase-access-key"
                      type="password"
                      value={filebaseAccessKey}
                      onChange={(e) => setFilebaseAccessKey(e.target.value)}
                      placeholder="ex: F9CE9EEDA069BB4B3214"
                      className="provider-input"
                    />
                    <label
                      htmlFor="filebase-secret-key"
                      className="provider-label"
                    >
                      Secret Key
                    </label>
                    <input
                      id="filebase-secret-key"
                      type="password"
                      value={filebaseSecretKey}
                      onChange={(e) => setFilebaseSecretKey(e.target.value)}
                      placeholder="ex: iUOYzd0UghnCWvFjntDGqKXn3fsIhUoN0l7GbLY4"
                      className="provider-input"
                    />
                    <label htmlFor="filebase-bucket" className="provider-label">
                      Bucket Name
                    </label>
                    <input
                      id="filebase-bucket"
                      type="text"
                      value={filebaseBucket}
                      onChange={(e) => setFilebaseBucket(e.target.value)}
                      placeholder="Bucket Name (must exist in your account)"
                      className="provider-input-last"
                    />
                    <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
                      Create bucket at filebase.com first, then enter name here
                    </p>
                    <StorageQuotaDisplay quota={storageQuota} />
                  </>
                )}
              </div>

              <ErrorMessage message={error} />

              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
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
                  title={!isFormValid() ? "Please fill all required fields" : ""}
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
                {qrCode && (
                  <div style={{ marginBottom: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCode}
                      alt="Vault QR Code"
                      style={{
                        width: "min(200px, 90vw)",
                        height: "min(200px, 90vw)",
                        border: "2px solid rgba(0, 255, 0, 0.3)",
                        borderRadius: 8,
                      }}
                    />
                    <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
                      Scan to access vault
                    </p>
                  </div>
                )}
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
                      await copyToClipboard(result.vaultURL);
                    } catch {
                      setError("Failed to copy to clipboard");
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    background: copied
                      ? "rgba(0, 255, 0, 0.3)"
                      : "rgba(13, 71, 161, 0.2)",
                    color: "#fff",
                    border: `1px solid ${copied ? "rgba(0, 255, 0, 0.5)" : "rgba(13, 71, 161, 0.4)"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: copied ? "default" : "pointer",
                    marginBottom: 16,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.2)";
                    }
                  }}
                >
                  {copied ? "✓ Copied! (Auto-clears in 60s)" : "Copy URL"}
                </button>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
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
                    style={{
                      padding: "4px 8px",
                      background: "rgba(13, 71, 161, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(13, 71, 161, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.1)")
                    }
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
                    style={{
                      padding: "4px 8px",
                      background: "rgba(13, 71, 161, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(13, 71, 161, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.1)")
                    }
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
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const passwords = decoyPassphrase
                        ? `Decoy Password: ${decoyPassphrase}\nHidden Password: ${passphrase}`
                        : `Hidden Password: ${passphrase}`;
                      const blob = new Blob([passwords], {
                        type: "text/plain",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "vault-passwords.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255, 193, 7, 0.1)",
                      color: "#fff",
                      border: "1px solid rgba(255, 193, 7, 0.3)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 193, 7, 0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 193, 7, 0.1)")
                    }
                  >
                    🔑 Download Passwords
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const content = `SANCTUM VAULT DETAILS\n${"=".repeat(50)}\n\nVault URL:\n${result.vaultURL}\n\nDecoy CID:\n${result.decoyCID}\n\nHidden CID:\n${result.hiddenCID}\n\nPASSWORDS:\n${decoyPassphrase ? `Decoy Password: ${decoyPassphrase}\n` : ""}Hidden Password: ${passphrase}\n\n${"=".repeat(50)}\nCreated: ${new Date().toISOString()}\n`;
                      const blob = new Blob([content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "vault-complete.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(13, 71, 161, 0.2)",
                      color: "#fff",
                      border: "1px solid rgba(13, 71, 161, 0.4)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(13, 71, 161, 0.2)")
                    }
                  >
                    ⬇️ Download All
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => router.push(result.vaultURL)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(13, 71, 161, 0.4)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(13, 71, 161, 0.3)")
                  }
                  style={{
                    padding: "12px 24px",
                    background: "rgba(13, 71, 161, 0.3)",
                    color: "#fff",
                    border: "1px solid rgba(13, 71, 161, 0.5)",
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
                    setQrCode(undefined);
                    setDecoyContent("");
                    setDecoyFile(null);
                    setHiddenContent("");
                    setHiddenFile(null);
                    setPassphrase("");
                    setPassphraseConfirm("");
                    setDecoyPassphrase("");
                    setDecoyPassphraseConfirm("");
                    setPanicPassphrase("");
                    setPanicPassphraseConfirm("");
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
      <Footer />
    </>
  );
}
