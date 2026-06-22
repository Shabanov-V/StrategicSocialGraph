import React from 'react';
import styles from './Sidebar.module.css';
import codeIcon from '../../assets/code.svg';
import formIcon from '../../assets/form.svg';
import connectionIcon from '../../assets/connection.svg';
import settingsIcon from '../../assets/settings.svg';

export default function Sidebar({ isOpen, selectedPanel, setSelectedPanel, authSlot }) {

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
      <button
        className={styles.toggleButton}
        onClick={() => togglePanel('config')}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <span className={styles.icon}>
          <img src={settingsIcon} alt="Toggle config editor" />
        </span>
      </button>
      <button
        className={styles.toggleButton}
        onClick={() => togglePanel('checkin')}
        aria-label="Toggle daily check-in"
        title="Daily check-in"
      >
        <span className={styles.icon} style={{ fontSize: '20px', lineHeight: 1 }}>✓</span>
      </button>
      <div className={styles.spacer} />
      {authSlot}
    </div>
  );
}
