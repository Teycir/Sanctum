'use client';

import { useRouter } from 'next/navigation';
import { AnimatedTagline } from './components/AnimatedTagline';
import { CyclingFeatures } from './components/CyclingFeatures';
import { VaultIcon } from './components/VaultIcon';
import DecryptedText from './components/DecryptedText';

export default function Home() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <a
        href="https://github.com/Teycir/Sanctum#readme"
        target="_blank"
        rel="noopener noreferrer"
        style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 10, fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'transform 0.2s, background 0.2s', zIndex: 10 }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Documentation
      </a>
      <div style={{ textAlign: 'center', maxWidth: '90%' }}>
        <VaultIcon />
        <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: 16, fontWeight: 700 }} className="glow-text pulse-glow">
          <DecryptedText
            text="Sanctum"
            animateOn="view"
            speed={75}
            maxIterations={20}
            className="text-white"
            encryptedClassName="opacity-30"
          />
        </h1>
        <AnimatedTagline text="Client‑side encrypted zero‑trust vault" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 32 }}>
          <button onClick={() => router.push('/create')} className="start-btn">
            Create Vault
          </button>
        </div>
        <CyclingFeatures />
      </div>
    </div>
  );
}
