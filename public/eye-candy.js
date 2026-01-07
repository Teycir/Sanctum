// 3D Tubes Cursor Effect - Same as landing page
// Based on soju22's 3D Tubes Cursor Effect
// https://codepen.io/soju22/pen/qEbdVjK
// License: CC BY-NC-SA 4.0

(function() {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'tubes-cursor-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 0.5s ease-in';
  document.body.prepend(canvas);

  // Load TubesCursor module
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    // Suppress WebGPU warnings
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args) => {
      if (args[0]?.includes?.('WebGPU')) return;
      originalWarn.apply(console, args);
    };
    console.error = (...args) => {
      if (args[0]?.includes?.('WebGPU')) return;
      originalError.apply(console, args);
    };
    
    import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
    
    console.warn = originalWarn;
    console.error = originalError;
    
    const canvas = document.getElementById('tubes-cursor-canvas');
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
      setTimeout(() => { canvas.style.opacity = '1'; }, 100);
    }
  `;

  document.body.appendChild(script);
})();
