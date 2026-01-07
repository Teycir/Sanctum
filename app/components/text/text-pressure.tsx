'use client';

import { useEffect, useRef, useState } from 'react';

interface TextPressureProps {
  readonly text: string;
  readonly flex?: boolean;
  readonly alpha?: boolean;
  readonly width?: boolean;
  readonly weight?: boolean;
  readonly italic?: boolean;
  readonly textColor?: string;
  readonly minFontSize?: number;
  readonly className?: string;
}

export default function TextPressure({
  text,
  flex = true,
  alpha = false,
  width = false,
  weight = true,
  italic = false,
  textColor = 'currentColor',
  minFontSize = 56,
  className = ''
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isMobile) return;

    const chars = container.querySelectorAll('.char');
    
    const handleMouseMove = (e: MouseEvent) => {
      chars.forEach((char) => {
        const rect = char.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - charCenterX;
        const distanceY = e.clientY - charCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        const maxDistance = 200;
        const influence = Math.max(0, 1 - distance / maxDistance);
        
        const element = char as HTMLElement;
        
        if (weight) {
          const fontWeight = 400 + influence * 500;
          element.style.fontWeight = fontWeight.toString();
        }
        
        if (alpha) {
          element.style.opacity = (0.3 + influence * 0.7).toString();
        }
        
        if (width) {
          const fontStretch = 75 + influence * 50;
          element.style.setProperty('font-stretch', `${fontStretch}%`);
        }
        
        if (italic) {
          const fontStyle = influence > 0.3 ? 'italic' : 'normal';
          element.style.fontStyle = fontStyle;
        }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [weight, alpha, width, italic, isMobile]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: flex ? 'flex' : 'inline',
        fontSize: `${minFontSize}px`,
        color: textColor,
        fontWeight: isMobile ? 700 : 400,
        transition: 'all 0.1s ease-out',
        userSelect: 'none'
      }}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="char"
          style={{
            display: 'inline-block',
            transition: 'all 0.1s ease-out',
            whiteSpace: char === ' ' ? 'pre' : 'normal'
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
