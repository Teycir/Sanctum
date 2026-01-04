export function SecurityStatus() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '8px 12px',
        background: 'rgba(0, 255, 0, 0.1)',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        borderRadius: 8,
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#4ade80' }}>🔒</span>
        <span style={{ opacity: 0.8 }}>Auto-lock: 5min</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#4ade80' }}>⚡</span>
        <span style={{ opacity: 0.8 }}>Panic: ESC×2</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#4ade80' }}>📋</span>
        <span style={{ opacity: 0.8 }}>Clipboard: 60s</span>
      </div>
    </div>
  );
}
