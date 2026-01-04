import { useState, useCallback, useRef, useEffect } from 'react';

const AUTO_CLEAR_DELAY = 60000; // 60 seconds

export function useSecureClipboard() {
  const [copied, setCopied] = useState(false);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Clear previous timer
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      
      // Auto-clear clipboard after 60 seconds
      clearTimerRef.current = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch {
          // Ignore errors
        }
      }, AUTO_CLEAR_DELAY);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  return { copied, copyToClipboard };
}
