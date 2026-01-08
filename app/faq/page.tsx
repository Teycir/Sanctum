/* trunk-ignore-all(prettier) */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useRouter } from 'next/navigation';
import { Footer } from '../components/Footer';
import { SecurityStatus } from '../components/SecurityStatus';

export default function FAQ() {
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

          <h1 style={{ fontSize: 32, marginBottom: 32, fontWeight: 700 }}>Frequently Asked Questions</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>Why do I see 2 files on IPFS even with empty decoy?</h2>
              <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
                <strong>This is a security feature, not a bug.</strong> Duress vaults always upload 2 encrypted blobs:
              </p>
              <ol style={{ lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>
                <li><strong>Decoy blob</strong> - Even if empty, creates cryptographic chaff</li>
                <li><strong>Hidden blob</strong> - Your actual secret content</li>
              </ol>
              <p style={{ lineHeight: 1.6 }}>
                <strong>Security advantages:</strong> Metadata resistance, plausible deniability, consistent behavior, and future-proofing.
                Even "empty" encrypted blobs have minimum size (salt + nonce + auth tag + padding), making them indistinguishable from real data.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>How do I unlock a vault?</h2>
              <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Open the vault link</li>
                <li>Enter passphrase (empty = decoy, correct passphrase = hidden)</li>
                <li>Download or copy the decrypted content</li>
              </ol>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>What if I lose the vault link?</h2>
              <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
                <strong style={{ color: '#f44336' }}>💀 LOST FOREVER.</strong> No recovery mechanism exists (by design).
              </p>
              <p style={{ lineHeight: 1.6 }}>
                <strong>Best practices:</strong> Save in password manager, print QR code, never share over unencrypted channels.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>What are the file size limits?</h2>
              <p style={{ lineHeight: 1.6 }}>
                <strong>Maximum: 25 MB</strong> (per file, .zip or .rar archives supported)
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>What happens when my vault expires?</h2>
              <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
                Sanctum uses a <strong>two-stage cleanup system</strong>:
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>
                <li><strong>Stage 1 (Soft delete):</strong> Vault marked inactive, shows "deleted" message</li>
                <li><strong>Stage 2 (Hard delete):</strong> After 30 days, permanently removed from database</li>
              </ul>
              <p style={{ lineHeight: 1.6, color: '#4caf50' }}>
                ✅ <strong>30-day grace period:</strong> Contact support to recover accidentally expired vaults!
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>Can I delete a vault after creating it?</h2>
              <p style={{ lineHeight: 1.6 }}>
                <strong>❌ NO.</strong> IPFS data is immutable. <strong>Workaround:</strong> Don't share the link.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>Is my data really secure?</h2>
              <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
                Yes! Sanctum uses:
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li><strong>XChaCha20-Poly1305</strong> - Military-grade encryption</li>
                <li><strong>Argon2id KDF</strong> - 256MB memory, brute-force resistant</li>
                <li><strong>Client-side encryption</strong> - Keys never touch server</li>
                <li><strong>RAM-only storage</strong> - Immune to disk forensics</li>
                <li><strong>Split-key architecture</strong> - Server can't decrypt without URL key</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#0d47a1' }}>What if someone forces me to reveal my passphrase?</h2>
              <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
                <strong>This is exactly what Sanctum is designed for!</strong>
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Reveal the <strong>decoy passphrase</strong> - shows innocent content</li>
                <li>Or use the <strong>panic passphrase</strong> - shows "vault deleted" error</li>
                <li>Adversary <strong>cannot prove</strong> hidden layers exist (cryptographic guarantee)</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
