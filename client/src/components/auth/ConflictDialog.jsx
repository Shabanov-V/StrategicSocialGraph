import React from 'react';
import Button from '../ui/Button';
import styles from './ConflictDialog.module.css';

export default function ConflictDialog({ onKeepLocal, onKeepCloud }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3>Data conflict</h3>
        <p>You have a local graph and a cloud graph. Which do you want to keep?</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onKeepLocal}>Keep local</Button>
          <Button variant="primary" onClick={onKeepCloud}>Keep cloud</Button>
        </div>
      </div>
    </div>
  );
}
