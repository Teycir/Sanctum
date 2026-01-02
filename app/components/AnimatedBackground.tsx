'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          rotate: [360, 180, 0],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/30 rounded-full blur-3xl"
      />
      
      {/* Floating particles - only render on client */}
      {mounted && [...Array(20)].map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = 10 + Math.random() * 10;
        const delay = Math.random() * 5;
        const xOffset = Math.random() * 100 - 50;
        
        return (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, xOffset, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
            }}
          />
        );
      })}
    </div>
  );
}
