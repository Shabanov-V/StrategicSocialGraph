import React from 'react';
import styles from './Sidebar.module.css';
import codeIcon from '../../assets/code.svg';
import formIcon from '../../assets/form.svg';
import connectionIcon from '../../assets/connection.svg';

export default function Sidebar({ isOpen, selectedPanel, setSelectedPanel }) {

  function togglePanel(targetPanel) {
    if (selectedPanel === targetPanel) {
      setSelectedPanel(null);
    } else {
      setSelectedPanel(targetPanel);
    }
  }

  return (
    <div
      className={styles.sidebar}
    >
      <button
        className={styles.toggleButton}
        onClick={() => togglePanel('code')}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <span className={styles.icon}>
          <img src={codeIcon} alt="Toggle code" />
        </span>
      </button>
      <button
        className={styles.toggleButton}
        onClick={() => togglePanel('interactive')}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <span className={styles.icon}>
          <img src={formIcon} alt="Toggle interactive" />
        </span>
      </button>
      <button
        className={styles.toggleButton}
        onClick={() => togglePanel('connection')}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <span className={styles.icon}>
          <img src={connectionIcon} alt="Toggle connection editor" />
        </span>
      </button>
    </div>
  );
}
