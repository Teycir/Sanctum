import { useEffect, useCallback } from "react";
import { SECURITY } from "../crypto/constants";

export interface AutoLockConfig {
  readonly timeoutMs: number;
  readonly events?: readonly string[];
}

const DEFAULT_CONFIG: AutoLockConfig = {
  timeoutMs: SECURITY.autoLockTimeout,
  events: ["mousedown", "keydown", "scroll", "touchstart"],
};

/**
 * Auto-lock hook that triggers callback after inactivity period
 * @param onLock - Callback to execute on timeout
 * @param config - Configuration options
 * @example
 * ```ts
 * useAutoLock(() => clearSensitiveData(), { timeoutMs: 300000 });
 * ```
 */
export function useAutoLock(
  onLock: () => void,
  config: Partial<AutoLockConfig> = {},
): void {
  const { timeoutMs, events } = { ...DEFAULT_CONFIG, ...config };

  const handleLock = useCallback(() => {
    onLock();
  }, [onLock]);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    let timeout: NodeJS.Timeout;
    const eventList = events || DEFAULT_CONFIG.events || [];

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleLock, timeoutMs);
    };

    resetTimer();
    eventList.forEach((e) => globalThis.window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeout);
      eventList.forEach((e) =>
        globalThis.window.removeEventListener(e, resetTimer),
      );
    };
  }, [handleLock, timeoutMs, events]);
}
