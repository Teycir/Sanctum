interface ErrorMessageProps {
  readonly message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      style={{
        marginTop: 20,
        padding: 12,
        background: "rgba(255, 0, 0, 0.1)",
        border: "1px solid rgba(255, 0, 0, 0.3)",
        borderRadius: 8,
        color: "#ff6b6b",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
