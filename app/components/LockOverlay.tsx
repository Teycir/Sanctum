'use client';

import { TubesCursor } from './TubesCursor';

export function LockOverlay() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <TubesCursor />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: '#fff',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10000 }}>
          <h1 style={{ fontSize: 64, margin: 0 }}>🔒</h1>
          <p style={{ fontSize: 18, marginTop: 16 }}>Session Locked</p>
          <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
            All sensitive data cleared from memory
          </p>
          <button
            onClick={handleReload}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              background: 'rgba(13, 71, 161, 0.3)',
              color: '#fff',
              border: '1px solid rgba(13, 71, 161, 0.5)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </>
  );
}
