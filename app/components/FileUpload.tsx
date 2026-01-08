import { 
  isValidFileExtension,
  isValidFileSize,
  getFileSizeError,
  getFileExtensionError
} from "@/lib/validation/file";

interface FileUploadProps {
  readonly id: string;
  readonly file: File | null;
  readonly textContent: string;
  readonly onFileChange: (file: File | null) => void;
  readonly onTextClear: () => void;
  readonly onError: (error: string) => void;
}

export function FileUpload({
  id,
  file,
  textContent,
  onFileChange,
  onTextClear,
  onError,
}: FileUploadProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (textContent.trim()) {
      if (confirm("Switching to file will clear your text content. Continue?")) {
        onTextClear();
      } else {
        e.target.value = "";
        return;
      }
    }

    if (!isValidFileExtension(selectedFile.name)) {
      onError(getFileExtensionError());
      e.target.value = "";
      return;
    }

    if (!isValidFileSize(selectedFile.size)) {
      onError(getFileSizeError(selectedFile.size));
      e.target.value = "";
      return;
    }

    onFileChange(selectedFile);
    onError("");
  };

  return (
    <>
      <input
        type="file"
        accept=".zip,.rar,application/zip,application/x-rar-compressed"
        disabled={!!textContent.trim()}
        onChange={handleFileSelect}
        className="custom-file-input"
        id={id}
      />
      <label
        htmlFor={id}
        className="custom-file-button"
        style={{
          opacity: textContent.trim() ? 0.5 : 1,
          cursor: textContent.trim() ? "not-allowed" : "pointer",
        }}
      >
        📁 Choose File (.zip/.rar)
      </label>
      {file && (
        <div
          style={{
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#4ade80" }}>
            ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
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
    </>
  );
}
