import { useEffect, useCallback } from 'react';

export interface PanicKeyConfig {
  readonly key: string;
  readonly doublePressDelayMs: number;
  readonly requireCtrl?: boolean;
  readonly requireShift?: boolean;
}

const DEFAULT_CONFIG: PanicKeyConfig = {
  key: 'Escape',
  doublePressDelayMs: 500,
};

/**
 * Panic key hook that triggers callback on double key press
 * @param onPanic - Callback to execute on panic trigger
 * @param config - Configuration options
 * @example
 * ```ts
 * usePanicKey(() => lockVault(), { key: 'Escape', doublePressDelayMs: 500 });
 * usePanicKey(() => lockVault(), { key: 'l', requireCtrl: true, requireShift: true });
 * ```
 */
export function usePanicKey(
  onPanic: () => void,
  config: Partial<PanicKeyConfig> = {}
): void {
  const { key, doublePressDelayMs, requireCtrl, requireShift } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const handlePanic = useCallback(() => {
    onPanic();
  }, [onPanic]);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    let lastPress = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      if (requireCtrl && !e.ctrlKey) return;
      if (requireShift && !e.shiftKey) return;

      const now = Date.now();
      if (now - lastPress < doublePressDelayMs) {
        e.preventDefault();
        handlePanic();
      }
      lastPress = now;
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    return () => globalThis.window.removeEventListener('keydown', handleKeyDown);
  }, [handlePanic, key, doublePressDelayMs, requireCtrl, requireShift]);
}
