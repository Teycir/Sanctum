'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function AnimatedTagline({ text }: { text: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <p className="text-xl md:text-2xl opacity-90 mb-6 font-medium text-center">
        {text}
      </p>
    );
  }

  const chars = text.split('');

  return (
    <motion.p
      className="text-xl md:text-2xl opacity-90 mb-6 font-medium text-center cursor-default"
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
        transition: { duration: 0.3 }
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: (chars.length - 1 - i) * 0.05
          }}
          whileHover={{
            y: -2,
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255, 255, 255, 1)',
            transition: { duration: 0.2 }
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.p>
  );
}
