import React from 'react';
import styles from './Sidebar.module.css';
import IconButton from '../ui/IconButton';
import codeIcon from '../../assets/code.svg';
import formIcon from '../../assets/form.svg';
import connectionIcon from '../../assets/connection.svg';
import settingsIcon from '../../assets/settings.svg';

const ITEMS = [
  { id: 'code', label: 'Edit YAML', icon: codeIcon, alt: 'Toggle code' },
  { id: 'interactive', label: 'Add person', icon: formIcon, alt: 'Toggle interactive' },
  { id: 'connection', label: 'Edit connections', icon: connectionIcon, alt: 'Toggle connection editor' },
  { id: 'config', label: 'Settings', icon: settingsIcon, alt: 'Toggle config editor' },
];

export default function Sidebar({ selectedPanel, setSelectedPanel, authSlot }) {
  function togglePanel(targetPanel) {
    setSelectedPanel(selectedPanel === targetPanel ? null : targetPanel);
  }

  return (
    <div className={styles.sidebar}>
      {ITEMS.map(({ id, label, icon, alt }) => (
        <IconButton
          key={id}
          label={label}
          active={selectedPanel === id}
          onClick={() => togglePanel(id)}
        >
          <span className={styles.icon}><img src={icon} alt={alt} /></span>
        </IconButton>
      ))}
      <IconButton
        label="Daily check-in"
        active={selectedPanel === 'checkin'}
        onClick={() => togglePanel('checkin')}
      >
        <span className={styles.icon} style={{ fontSize: '20px', lineHeight: 1 }}>✓</span>
      </IconButton>
      <div className={styles.spacer} />
      {authSlot}
    </div>
  );
}
