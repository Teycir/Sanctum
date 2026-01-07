export function Footer() {
  return (
    <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 20px', fontSize: 'clamp(11px, 2.5vw, 12px)', color: 'rgba(255, 255, 255, 0.6)', padding: '12px 20px', background: 'linear-gradient(to top, rgba(10, 14, 39, 0.95), transparent)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
      <a href="/faq.html" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>FAQ</a>
      <span style={{ color: 'rgba(255, 255, 255, 0.3)', userSelect: 'none' }}>•</span>
      <a href="/how-to-use.html" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>How to Use</a>
      <span style={{ color: 'rgba(255, 255, 255, 0.3)', userSelect: 'none' }}>•</span>
      <a href="/canary.html" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>Warrant Canary</a>
      <span style={{ color: 'rgba(255, 255, 255, 0.3)', userSelect: 'none' }}>•</span>
      <a href="https://teycirbensoltane.tn" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>Made by Teycir</a>
    </footer>
  );
}
