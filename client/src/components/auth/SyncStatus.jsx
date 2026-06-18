import React from 'react';
import styles from './SyncStatus.module.css';

export default function SyncStatus({ status }) {
  if (!status || status === 'idle') return null;

  const labels = {
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Sync error',
    offline: 'Offline',
  };

  return (
    <div className={`${styles.status} ${styles[status]}`}>
      {labels[status] || status}
    </div>
  );
}
