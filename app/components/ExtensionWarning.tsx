'use client';

export function ExtensionWarning() {
  return (
    <div style={{
      marginTop: '12px',
      padding: '0 16px',
    }}>
      <p style={{
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '11px',
        textAlign: 'center',
        margin: 0,
        lineHeight: '1.6',
      }}>
        ⚠️ Browser extensions can access your passwords.<br />
        Use incognito/private mode.
      </p>
    </div>
  );
}
