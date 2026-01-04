import { useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const ESC_DOUBLE_PRESS_WINDOW = 500; // 500ms window for double press

export function useSecurity() {
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEscPressRef = useRef<number>(0);

  useEffect(() => {
    const lockScreen = () => {
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:system-ui';
      document.body.innerHTML = '<div style="text-align:center"><h1>🔒</h1><p>Session Locked</p></div>';
      window.history.replaceState(null, '', 'data:text/html,<html><body style="background:#000"></body></html>');
      setTimeout(() => window.location.reload(), 100);
    };

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        lockScreen();
      }, INACTIVITY_TIMEOUT);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscPressRef.current < ESC_DOUBLE_PRESS_WINDOW) {
          lockScreen();
          return;
        }
        lastEscPressRef.current = now;
      }
      resetInactivityTimer();
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    resetInactivityTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('touchmove', handleActivity);
    window.addEventListener('touchend', handleActivity);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('touchend', handleActivity);
    };
  }, []);
}
