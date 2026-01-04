'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  'XChaCha20-Poly1305 Encryption',
  'Plausible Deniability - Hidden layers',
  'Auto-Lock - 5min inactivity timeout',
  'Panic Key - Double ESC emergency lock',
  'Secure Clipboard - 60s auto-clear',
  'Duress Mode - Decoy content protection',
  'SHA-256 Hashing - Cryptographic integrity',
  'Commitment Scheme - Tamper detection',
  'Memory Wiping - Sensitive data cleanup',
  'Client-Side Crypto - Browser encryption',
  'Zero-Trust - No backend access',
  'Constant-Time Ops - Timing attack prevention',
  'Secure Random - Cryptographic RNG',
  'Argon2id KDF - Key derivation',
  'Pinata IPFS - Decentralized storage',
  'Content Addressing - Immutable CIDs',
  'Browser-Based - No installation',
  'Web Crypto API - Native encryption',
  '100% Free - No paid features',
  'Open Source - Auditable code',
  'No Accounts - Anonymous usage',
  'No Tracking - Privacy first',
  'Split-Key Architecture - URL + Server',
];

export function CyclingFeatures() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '20px', marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {FEATURES[0]}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '20px', marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5 }}
        >
          {FEATURES[index].split('').map((char, i) => (
            <motion.span
              key={`${index}-${i}-${char}`}
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.15,
                delay: (FEATURES[index].length - 1 - i) * 0.02
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
