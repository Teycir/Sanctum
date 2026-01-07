'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  'XChaCha20-Poly1305 Encryption\nMilitary-grade authenticated encryption',
  'Plausible Deniability\nHidden layers indistinguishable from decoy',
  'Auto-Lock Protection\n5min inactivity timeout',
  'Panic Key Emergency\nDouble ESC for instant lockout',
  'Secure Clipboard\n60s auto-clear protection',
  'Duress Mode\nDecoy content protection',
  'SHA-256 Hashing\nCryptographic integrity verification',
  'Commitment Scheme\nTamper detection system',
  'Memory Wiping\nSensitive data cleanup',
  'Client-Side Crypto\nBrowser-based encryption',
  'Zero-Trust Architecture\nNo backend access to data',
  'Constant-Time Operations\nTiming attack prevention',
  'Secure Random\nCryptographic RNG',
  'Argon2id KDF\nKey derivation function',
  'Pinata IPFS\nDecentralized storage',
  'Content Addressing\nImmutable CIDs',
  'Browser-Based\nNo installation required',
  'Web Crypto API\nNative encryption',
  '100% Free\nNo paid features',
  'Open Source\nAuditable code',
  'No Accounts\nAnonymous usage',
  'No Tracking\nPrivacy first',
  'Split-Key Architecture\nURL + Server separation',
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
      <div style={{ minHeight: '40px', marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {FEATURES[0]}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '40px', marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5, whiteSpace: 'pre-line' }}
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
