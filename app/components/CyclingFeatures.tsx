'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  'Plausible Deniability - Hidden layers',
  'Decentralized Storage - IPFS pinning',
  'Client-Side Crypto - Browser encryption',
  'Zero Server Trust - No backend access',
  '100% Free - Stack free tiers',
  'Progressive Disclosure - Reveal layers',
  'XChaCha20-Poly1305 - Authenticated encryption',
  'Constant-Time Ops - Timing attack prevention',
  'Memory-Only - Auto-clear on idle',
  'Argon2id KDF - Strong key derivation',
  'Stego Mode - Hide in images',
  'Chain Mode - Up to 4 layers',
  'IPFS Storage - Content-addressed',
  'No Accounts - No email required',
  'Multi-Provider - Filebase + Pinata',
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
      <div className="min-h-[42px] mb-6 flex items-center justify-center relative px-4">
        <div className="text-[10px] md:text-xs opacity-90 font-medium text-center w-full max-w-[95%] leading-relaxed">
          {FEATURES[0]}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[42px] mb-6 flex items-center justify-center relative px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="text-[10px] md:text-xs opacity-90 font-medium text-center absolute w-full max-w-[95%] leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {FEATURES[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
