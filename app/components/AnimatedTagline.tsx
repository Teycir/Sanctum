'use client';

import { motion } from 'framer-motion';

export function AnimatedTagline({ text }: { readonly text: string }) {
  const chars = text.split('').map((char, i) => ({ char, id: `${char}-${i}` }));

  return (
    <motion.p
      className="text-base md:text-xl opacity-90 mb-6 font-bold text-center cursor-default animate-subtle-shimmer"
      style={{ lineHeight: 1.2, padding: '0 16px' }}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
        transition: { duration: 0.3 }
      }}
    >
      {chars.map((item, i) => (
        <motion.span
          key={item.id}
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
          {item.char === ' ' ? '\u00A0' : item.char}
        </motion.span>
      ))}
    </motion.p>
  );
}
