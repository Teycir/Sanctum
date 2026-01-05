'use client';

import { useEffect, useState } from 'react';
import { detectSuspiciousExtensions, type SecurityWarning } from '@/lib/security/extension-detection';

export function ExtensionWarning() {
  const [warnings, setWarnings] = useState<SecurityWarning[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setWarnings(detectSuspiciousExtensions());
  }, []);

  if (warnings.length === 0 || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 rounded-lg border bg-yellow-950/95 border-yellow-500 backdrop-blur-sm shadow-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-2">Security Warning</h3>
          {warnings.map((warning, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-sm text-white/90">{warning.message}</p>
              <p className="text-xs text-white/70 mt-1">{warning.recommendation}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white text-xl leading-none"
          aria-label="Dismiss warning"
        >
          ×
        </button>
      </div>
    </div>
  );
}
