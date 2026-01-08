/* trunk-ignore-all(prettier) */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useRouter } from 'next/navigation';
import { Footer } from '../components/Footer';
import { SecurityStatus } from '../components/SecurityStatus';

export default function HowItWorks() {
  const router = useRouter();

  return (
    <>
      <SecurityStatus />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '40px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => router.push('/')}
            style={{ marginBottom: 20, padding: 0, background: 'transparent', color: '#fff', border: 'none', fontSize: 24, cursor: 'pointer', opacity: 0.7 }}
          >
            ←
          </button>

          <h1 style={{ fontSize: 32, marginBottom: 32, fontWeight: 700 }}>How It Works</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>Client-Side (Browser)</h2>
              <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li>User creates vault with decoy + hidden content</li>
                <li>Browser encrypts both layers with XChaCha20-Poly1305</li>
                <li>Uploads encrypted blobs to IPFS (Pinata/Filebase)</li>
                <li>Generates split keys: KeyA (stays in URL) + KeyB (sent to server)</li>
                <li>Server encrypts KeyB and stores with encrypted IPFS CIDs</li>
              </ol>
            </section>

            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>Server-Side (Cloudflare D1)</h2>
              <p style={{ marginBottom: 12 }}>Stores: Encrypted KeyB, Encrypted CIDs, vault metadata</p>
              <div style={{ background: 'rgba(13, 71, 161, 0.1)', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                <strong>Two-stage cleanup</strong> prevents database overflow:
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li><strong>Stage 1:</strong> Expired vaults marked inactive (is_active = 0) - soft delete</li>
                  <li><strong>Stage 2:</strong> Vaults inactive for 30+ days permanently deleted</li>
                </ul>
              </div>
              <p style={{ color: '#4caf50' }}>✅ <strong>30-day grace period:</strong> Accidentally expired vaults can be recovered</p>
            </section>

            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>Unlock Flow</h2>
              <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li>User enters passphrase</li>
                <li>Browser fetches encrypted metadata from server</li>
                <li>Combines KeyA (from URL) + KeyB (from server) to decrypt IPFS CIDs</li>
                <li>Downloads encrypted blobs from IPFS</li>
                <li>Decrypts with passphrase → reveals decoy or hidden layer</li>
              </ol>
            </section>

            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>Passphrase Behavior</h2>
              <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li><strong>Empty/Decoy passphrase</strong> → Shows decoy layer (innocent content)</li>
                <li><strong>Hidden passphrase</strong> → Shows hidden layer (real secrets)</li>
                <li><strong>Panic passphrase</strong> → Shows "vault deleted" error (duress protection)</li>
                <li><strong>Wrong passphrase</strong> → Error: "Invalid passphrase"</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>Error Messages (Plausible Deniability)</h2>
              <p style={{ marginBottom: 12 }}>All unavailable scenarios show identical message:</p>
              <div style={{ background: 'rgba(255, 0, 0, 0.1)', padding: 16, borderRadius: 8, fontFamily: 'monospace' }}>
                "Vault content has been deleted from storage providers"
              </div>
              <ul style={{ marginTop: 12, lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Panic passphrase entered</li>
                <li>Vault expired (soft deleted)</li>
                <li>Vault doesn't exist</li>
                <li>IPFS blobs missing</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 24, marginBottom: 16, color: '#0d47a1' }}>3-Layer Protection</h2>
              <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li><strong>Decoy Layer</strong> - Innocent content (optional)</li>
                <li><strong>Hidden Layer</strong> - Real secrets (required)</li>
                <li><strong>Panic Layer</strong> - Shows "vault erased" (cryptographically indistinguishable from real deletion)</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
