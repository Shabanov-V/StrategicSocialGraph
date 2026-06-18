import React from 'react';
import styles from './ConflictDialog.module.css';

export default function ConflictDialog({ onKeepLocal, onKeepCloud }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3>Data conflict</h3>
        <p>You have a local graph and a cloud graph. Which do you want to keep?</p>
        <div className={styles.actions}>
          <button className={styles.button} onClick={onKeepLocal}>Keep local</button>
          <button className={`${styles.button} ${styles.primary}`} onClick={onKeepCloud}>Keep cloud</button>
        </div>
      </div>
    </div>
  );
}
