'use client';

import { motion } from 'framer-motion';
import { useTextScramble } from '@/lib/ui/hooks';

interface DecryptedTextProps {
  readonly text: string;
  readonly speed?: number;
  readonly maxIterations?: number;
  readonly useOriginalCharsOnly?: boolean;
  readonly characters?: string;
  readonly className?: string;
  readonly encryptedClassName?: string;
  readonly animateOn?: 'view' | 'hover';
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?',
  className = '',
  encryptedClassName = '',
  animateOn = 'hover',
}: DecryptedTextProps) {
  const { displayText, scramble } = useTextScramble(text, {
    speed,
    maxIterations,
    useOriginalCharsOnly,
    characters,
    animateOn,
  });

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      scramble();
    }
  };

  const handleMouseLeave = () => {
    // No-op
  };

  return (
    <motion.span
      className="inline-block whitespace-nowrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={className}>
        {displayText.split('').map((char, index) => {
          const isOriginal = char === text[index];
          return (
            <span
              key={index}
              className={isOriginal ? undefined : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
