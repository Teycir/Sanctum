"use client";

import { Tooltip } from "./ui/Tooltip";
import {
  FILEBASE_BUCKET_NAME,
  FILEBASE_BUCKET_INSTRUCTIONS,
} from "@/lib/storage/uploader";

interface IPFSProviderSelectorProps {
  readonly provider: "pinata" | "filebase";
  readonly onProviderChange: (provider: "pinata" | "filebase") => void;
  readonly pinataJWT: string;
  readonly onPinataJWTChange: (jwt: string) => void;
  readonly filebaseAccessKey: string;
  readonly onFilebaseAccessKeyChange: (key: string) => void;
  readonly filebaseSecretKey: string;
  readonly onFilebaseSecretKeyChange: (key: string) => void;
  readonly jwtStatus: "validating" | "valid" | "invalid" | null;
}

function PinataConfig({
  pinataJWT,
  onPinataJWTChange,
  jwtStatus,
}: Readonly<
  Pick<
    IPFSProviderSelectorProps,
    "pinataJWT" | "onPinataJWTChange" | "jwtStatus"
  >
>) {
  const getStatusColor = () => {
    if (jwtStatus === "valid") return "#4ade80";
    if (jwtStatus === "invalid") return "#ff6b6b";
    return "#a855f7";
  };

  const getBorderColor = () => {
    if (jwtStatus === "valid") return "rgba(0, 255, 0, 0.4)";
    if (jwtStatus === "invalid") return "rgba(255, 0, 0, 0.4)";
    return "rgba(255, 255, 255, 0.2)";
  };

  return (
    <>
      <label
        htmlFor="pinata-jwt-input"
        className="provider-label"
      >
        Pinata JWT
      </label>
      <input
        id="pinata-jwt-input"
        type="password"
        value={pinataJWT}
        onChange={(e) => onPinataJWTChange(e.target.value)}
        placeholder="Enter your Pinata JWT token"
        className="jwt-input"
        style={{
          border: `1px solid ${getBorderColor()}`,
        }}
      />
      {jwtStatus && (
        <p
          style={{
            fontSize: 10,
            marginTop: 6,
            color: getStatusColor(),
          }}
        >
          {jwtStatus === "validating" && "⏳ Validating JWT..."}
          {jwtStatus === "valid" && "✓ Valid JWT - Encrypted and saved"}
          {jwtStatus === "invalid" && "✗ Invalid JWT - Please check your token"}
        </p>
      )}
      <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
        Get free JWT at pinata.cloud (1GB free storage, permanent)
      </p>
    </>
  );
}

function FilebaseConfig({
  filebaseAccessKey,
  onFilebaseAccessKeyChange,
  filebaseSecretKey,
  onFilebaseSecretKeyChange,
}: Readonly<
  Pick<
    IPFSProviderSelectorProps,
    | "filebaseAccessKey"
    | "onFilebaseAccessKeyChange"
    | "filebaseSecretKey"
    | "onFilebaseSecretKeyChange"
  >
>) {
  return (
    <>
      <label
        htmlFor="filebase-access-key-input"
        className="provider-label"
      >
        Filebase Credentials
      </label>
      <input
        id="filebase-access-key-input"
        type="password"
        value={filebaseAccessKey}
        onChange={(e) => onFilebaseAccessKeyChange(e.target.value)}
        placeholder="Access Key"
        className="provider-input"
      />
      <input
        type="password"
        value={filebaseSecretKey}
        onChange={(e) => onFilebaseSecretKeyChange(e.target.value)}
        placeholder="Secret Key"
        style={{
          width: "100%",
          padding: 8,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 6,
          color: "#fff",
          fontSize: 12,
          boxSizing: "border-box",
          marginBottom: 8,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <label htmlFor="filebase-bucket-input" className="bucket-label">
          Bucket Name
        </label>
        <Tooltip content={FILEBASE_BUCKET_INSTRUCTIONS}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "rgba(168, 85, 247, 0.3)",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              fontSize: 10,
              color: "#c084fc",
              cursor: "help",
              fontWeight: 600,
            }}
          >
            ?
          </span>
        </Tooltip>
      </div>
      <input
        id="filebase-bucket-input"
        type="text"
        value={FILEBASE_BUCKET_NAME}
        readOnly
        aria-label="Filebase bucket name (required: sanctum-vaults)"
        title="Required bucket name: sanctum-vaults"
        style={{
          width: "100%",
          padding: 8,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 6,
          color: "#999",
          fontSize: 12,
          boxSizing: "border-box",
          cursor: "not-allowed",
        }}
      />
      <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
        Get free account at filebase.com (5GB free storage, permanent)
      </p>
    </>
  );
}

export function IPFSProviderSelector({
  provider,
  onProviderChange,
  pinataJWT,
  onPinataJWTChange,
  filebaseAccessKey,
  onFilebaseAccessKeyChange,
  filebaseSecretKey,
  onFilebaseSecretKeyChange,
  jwtStatus,
}: IPFSProviderSelectorProps) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        background: "rgba(168, 85, 247, 0.1)",
        borderRadius: 8,
      }}
    >
      <div className="provider-label">
        IPFS Provider
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => onProviderChange("pinata")}
          style={{
            flex: 1,
            padding: 8,
            background:
              provider === "pinata"
                ? "rgba(168, 85, 247, 0.3)"
                : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${provider === "pinata" ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
            borderRadius: 6,
            color: "#fff",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: provider === "pinata" ? 600 : 400,
          }}
        >
          Pinata (1GB, permanent)
        </button>
        <button
          type="button"
          onClick={() => onProviderChange("filebase")}
          style={{
            flex: 1,
            padding: 8,
            background:
              provider === "filebase"
                ? "rgba(168, 85, 247, 0.3)"
                : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${provider === "filebase" ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.2)"}`,
            borderRadius: 6,
            color: "#fff",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: provider === "filebase" ? 600 : 400,
          }}
        >
          Filebase (5GB, permanent)
        </button>
      </div>

      {provider === "pinata" ? (
        <PinataConfig
          pinataJWT={pinataJWT}
          onPinataJWTChange={onPinataJWTChange}
          jwtStatus={jwtStatus}
        />
      ) : (
        <FilebaseConfig
          filebaseAccessKey={filebaseAccessKey}
          onFilebaseAccessKeyChange={onFilebaseAccessKeyChange}
          filebaseSecretKey={filebaseSecretKey}
          onFilebaseSecretKeyChange={onFilebaseSecretKeyChange}
        />
      )}
    </div>
  );
}
