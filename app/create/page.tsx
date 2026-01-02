'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { encrypt } from '@/lib/crypto/core';
import { ARGON2_PROFILES } from '@/lib/crypto/constants';
import { HeliaIPFS } from '@/lib/helia/client';

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10 MB

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
};

export default function CreateVault() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<{ cid: string } | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const sanitizedContent = sanitizeInput(content.trim());
    const sanitizedPassphrase = passphrase.trim();

    if (!sanitizedContent) {
      setError('Please enter some content');
      return;
    }
    const contentSize = new TextEncoder().encode(sanitizedContent).length;
    if (contentSize > MAX_CONTENT_SIZE) {
      setError(`Content too large (${(contentSize / 1024 / 1024).toFixed(2)} MB). Maximum size is 10 MB`);
      return;
    }
    if (!sanitizedPassphrase) {
      setError('Please enter a passphrase');
      return;
    }
    if (sanitizedPassphrase.length < 12) {
      setError('Passphrase must be at least 12 characters');
      return;
    }
    if (!/[A-Z]/.test(sanitizedPassphrase)) {
      setError('Passphrase must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(sanitizedPassphrase)) {
      setError('Passphrase must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(sanitizedPassphrase)) {
      setError('Passphrase must contain at least one number');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(sanitizedPassphrase)) {
      setError('Passphrase must contain at least one special character');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Encrypt the content
      setLoadingStep('Encrypting with XChaCha20-Poly1305...');
      const plaintext = new TextEncoder().encode(sanitizedContent);
      const encrypted = encrypt({
        plaintext,
        passphrase: sanitizedPassphrase,
        argonProfile: ARGON2_PROFILES.desktop
      });

      // Upload to IPFS
      setLoadingStep('Uploading to IPFS via Helia...');
      const ipfs = new HeliaIPFS();
      await ipfs.init();
      const cid = await ipfs.upload(encrypted.ciphertext);
      await ipfs.stop();

      setLoadingStep('Finalizing...');
      setResult({ cid });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <button 
          onClick={() => router.push('/')} 
          style={{ 
            marginBottom: 24,
            padding: '8px 16px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            color: '#fff', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            borderRadius: 8, 
            fontSize: 14, 
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: 32, marginBottom: 32, fontWeight: 700, textAlign: 'center' }}>
          Create Vault
        </h1>

        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your secret content..."
                style={{
                  width: '100%',
                  minHeight: 150,
                  padding: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Passphrase</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter a strong passphrase..."
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5, textAlign: 'center' }}
              >
                Must be 12+ characters with uppercase, lowercase, number, and special character
              </motion.div>
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 14 }}>
                {error}
              </div>
            )}

            {loading && loadingStep && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(168, 85, 247, 0.05))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#e9d5ff',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)'
                }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {loadingStep}
                </motion.div>
              </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="start-btn"
                style={{
                  width: '50%',
                  padding: '14px 12px',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                {loading ? 'Creating...' : 'Create Vault'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: 20, background: 'rgba(0, 255, 0, 0.1)', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: 8, marginBottom: 20 }}>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>✓ Vault Created!</p>
              <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>IPFS CID:</p>
              <code style={{ display: 'block', padding: 12, background: 'rgba(0, 0, 0, 0.3)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>
                {result.cid}
              </code>
            </div>
            <button
              onClick={() => { setResult(null); setContent(''); setPassphrase(''); }}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Create Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
