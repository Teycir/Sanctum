import { PasswordStrength } from "./PasswordStrength";
import { PasswordRequirements } from "./PasswordRequirements";

interface PasswordFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly confirmValue: string;
  readonly onChange: (value: string) => void;
  readonly onConfirmChange: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  confirmValue,
  onChange,
  onConfirmChange,
  placeholder = "Enter a strong password...",
  required = false,
}: PasswordFieldProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label} {required && "(Required)"}
      </label>
      <PasswordRequirements />
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
      <PasswordStrength password={value} />
      <input
        id={`${id}-confirm`}
        type="password"
        value={confirmValue}
        onChange={(e) => onConfirmChange(e.target.value)}
        placeholder="Confirm password..."
        className="form-input"
        style={{ marginTop: 10 }}
      />
      {confirmValue && (
        <p style={{ fontSize: 11, marginTop: 6, color: value === confirmValue ? '#4ade80' : '#ff6b6b' }}>
          {value === confirmValue ? '✓ Passwords match' : '✗ Passwords do not match'}
        </p>
      )}
    </div>
  );
}
