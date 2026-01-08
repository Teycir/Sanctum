interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const allValid = Object.values(checks).every(Boolean);

  if (!password) return null;

  return (
    <div style={{ fontSize: 11, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: checks.length ? '#4ade80' : '#ff6b6b' }}>
          {checks.length ? '✓' : '✗'} 12+ chars
        </span>
        <span style={{ color: checks.uppercase ? '#4ade80' : '#ff6b6b' }}>
          {checks.uppercase ? '✓' : '✗'} Uppercase
        </span>
        <span style={{ color: checks.lowercase ? '#4ade80' : '#ff6b6b' }}>
          {checks.lowercase ? '✓' : '✗'} Lowercase
        </span>
        <span style={{ color: checks.number ? '#4ade80' : '#ff6b6b' }}>
          {checks.number ? '✓' : '✗'} Number
        </span>
        <span style={{ color: checks.special ? '#4ade80' : '#ff6b6b' }}>
          {checks.special ? '✓' : '✗'} Special
        </span>
      </div>
      {allValid && (
        <span style={{ color: '#4ade80', fontWeight: 600 }}>
          ✓ Strong password
        </span>
      )}
    </div>
  );
}
