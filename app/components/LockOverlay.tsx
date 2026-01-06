'use client';

export function LockOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: '#fff',
        fontFamily: 'system-ui',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 64, margin: 0 }}>🔒</h1>
        <p style={{ fontSize: 18, marginTop: 16 }}>Session Locked</p>
        <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
          Reload to unlock
        </p>
      </div>
    </div>
  );
}
