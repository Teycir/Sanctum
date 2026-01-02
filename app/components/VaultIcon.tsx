'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function VaultIcon() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      style={{ width: 85, height: 85, margin: '0 auto 18px', cursor: 'pointer' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
    >
      <motion.div
        animate={{
          y: isHovered ? -12 : [0, -8, 0],
          rotateY: isHovered ? 15 : 0,
        }}
        transition={{
          y: { duration: isHovered ? 0.3 : 4, repeat: isHovered ? 0 : Infinity, ease: 'easeInOut' },
          rotateY: { duration: 0.6, ease: 'easeOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <svg width="85" height="85" viewBox="0 0 120 120" fill="none">
          <defs>
            <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop
                offset="0%"
                animate={{
                  stopColor: isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.stop
                offset="100%"
                animate={{
                  stopColor: isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                }}
                transition={{ duration: 0.3 }}
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation={isHovered ? '4' : '2'} result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.circle
            cx="60"
            cy="60"
            r="55"
            stroke="url(#vaultGrad)"
            strokeWidth="2"
            fill="rgba(0,0,0,0.2)"
            animate={{
              strokeWidth: isHovered ? 3 : 2,
              r: isHovered ? 56 : 55,
            }}
            transition={{ duration: 0.3 }}
            filter="url(#glow)"
          />
          <motion.rect
            x="40"
            y="50"
            width="40"
            height="30"
            rx="4"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            fill="none"
            animate={{
              strokeWidth: isHovered ? 2.5 : 2,
              stroke: isHovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)',
            }}
            transition={{ duration: 0.3 }}
            filter="url(#glow)"
          />
          <motion.path
            d="M48 50 V42 A12 12 0 0 1 72 42 V50"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            fill="none"
            animate={{
              strokeWidth: isHovered ? 2.5 : 2,
              stroke: isHovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)',
              d: isHovered ? 'M48 50 V40 A12 12 0 0 1 72 40 V50' : 'M48 50 V42 A12 12 0 0 1 72 42 V50',
            }}
            transition={{ duration: 0.3 }}
            filter="url(#glow)"
          />
          <motion.line
            x1="60"
            y1="60"
            x2="60"
            y2="68"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            animate={{
              strokeWidth: isHovered ? 2.5 : 2,
              stroke: isHovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)',
            }}
            transition={{ duration: 0.3 }}
            filter="url(#glow)"
          />
        </svg>
      </motion.div>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
}
