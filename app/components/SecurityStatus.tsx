'use client';
import { useSecurity } from '@/lib/hooks/useSecurity';
import styles from './SecurityStatus.module.css';

export function SecurityStatus() {
  useSecurity();
  
  return (
    <output aria-label="Active security features" className={styles.container}>
      <span className={styles.feature} data-tooltip="Auto-lock after 5min inactivity">🔒 5min</span>
      <span className={styles.separator}>•</span>
      <span className={styles.feature} data-tooltip="Double-press ESC to lock screen">⚡ ESC×2</span>
      <span className={styles.separator}>•</span>
      <span className={styles.feature} data-tooltip="Clipboard auto-clears in 60s">📋 60s</span>
    </output>
  );
}
