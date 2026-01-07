'use client';

import { useEffect, useRef } from 'react';

/**
 * 3D Tubes Cursor Effect
 * Based on soju22's 3D Tubes Cursor Effect
 * https://codepen.io/soju22/pen/qEbdVjK
 * License: CC BY-NC-SA 4.0
 */
export function TubesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasId = 'tubes-cursor-canvas';
    canvas.id = canvasId;

    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
      
      const canvas = document.getElementById('${canvasId}');
      if (canvas) {
        const app = TubesCursor(canvas, {
          tubes: {
            count: 14,
            colors: ["#0d47a1", "#1976d2", "#4169e1"],
            speed: 1.5,
            radius: 0.008,
            lights: {
              intensity: 250,
              colors: ["#4169e1", "#1976d2", "#0d47a1", "#5a9fd4"]
            }
          },
          motion: {
            parallax: 0.03,
            smoothness: 0.08
          },
          bloom: {
            strength: 0.9,
            radius: 0.6,
            threshold: 0.1
          }
        });
        window.__tubesApp = app;
      }
    `;

    document.body.appendChild(script);

    return () => {
      const tubesApp = (window as { __tubesApp?: { dispose?: () => void } }).__tubesApp;
      if (tubesApp?.dispose) {
        tubesApp.dispose();
      }
      script.remove();
      canvas.id = '';
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
