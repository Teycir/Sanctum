import styles from './SecurityStatus.module.css';

export function SecurityStatus() {
  return (
    <output aria-label="Active security features" className={styles.container}>
      <span title="Auto-lock after 5min inactivity">🔒 5min</span>
      <span className={styles.separator}>•</span>
      <span title="Double-press ESC to lock">⚡ ESC×2</span>
      <span className={styles.separator}>•</span>
      <span title="Clipboard auto-clears in 60s">📋 60s</span>
    </output>
  );
}
