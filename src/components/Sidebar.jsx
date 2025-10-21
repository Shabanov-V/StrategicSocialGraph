import React from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <div
      className={styles.sidebar}
    >
      <button
        className={styles.toggleButton}
        onClick={onToggle}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <span className={styles.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect y="4" width="24" height="3" rx="1.5" fill="currentColor" />
            <rect y="10.5" width="24" height="3" rx="1.5" fill="currentColor" />
            <rect y="17" width="24" height="3" rx="1.5" fill="currentColor" />
          </svg>
        </span>
      </button>
      {/* Add more icons/components here if needed */}
    </div>
  );
}
