'use client';

import { useEffect, useRef } from 'react';

interface TubesCursorApp {
  dispose?: () => void;
}

interface TubesConfig {
  colors: string[];
  lights: {
    intensity: number;
    colors: string[];
  };
}

interface TubesCursorProps {
  /** Array of tube colors (hex format) */
  tubeColors?: string[];
  /** Array of light colors (hex format) */
  lightColors?: string[];
  /** Light intensity (default: 200) */
  lightIntensity?: number;
  /** Z-index for positioning (default: 1) */
  zIndex?: number;
  /** Whether to enable pointer events (default: false) */
  pointerEvents?: boolean;
}

/**
 * 3D Tubes Cursor Effect
 * 
 * A Three.js-based cursor effect that creates animated 3D tubes following the mouse.
 * 
 * @example
 * ```tsx
 * // Default blue theme
 * <TubesCursor />
 * 
 * // Custom colors
 * <TubesCursor 
 *   tubeColors={["#ff0000", "#00ff00", "#0000ff"]}
 *   lightColors={["#ffff00", "#ff00ff", "#00ffff", "#ffffff"]}
 *   lightIntensity={150}
 * />
 * ```
 * 
 * @attribution
 * Based on soju22's 3D Tubes Cursor Effect
 * https://codepen.io/soju22/pen/qEbdVjK
 * License: CC BY-NC-SA 4.0
 */
export function TubesCursor({
  tubeColors = ["#0d47a1", "#1976d2", "#4169e1"],
  lightColors = ["#4169e1", "#1976d2", "#0d47a1", "#5a9fd4"],
  lightIntensity = 200,
  zIndex = 1,
  pointerEvents = false
}: TubesCursorProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof globalThis === 'undefined') return;

    let app: TubesCursorApp | undefined;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js';
    script.type = 'module';
    
    script.onload = () => {
      try {
        const TubesCursor = (globalThis as typeof globalThis & { 
          TubesCursor?: (canvas: HTMLCanvasElement, config: { tubes: TubesConfig }) => TubesCursorApp 
        }).TubesCursor;
        
        if (TubesCursor && canvasRef.current) {
          app = TubesCursor(canvasRef.current, {
            tubes: {
              colors: tubeColors,
              lights: {
                intensity: lightIntensity,
                colors: lightColors
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize tubes cursor:', error);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (app?.dispose) app.dispose();
      script.remove();
    };
  }, [tubeColors, lightColors, lightIntensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: pointerEvents ? 'auto' : 'none',
        zIndex
      }}
    />
  );
}
