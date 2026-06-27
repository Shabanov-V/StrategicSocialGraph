import React from 'react';
import styles from './PanelShell.module.css';
import IconButton from './IconButton';

function PanelShell({ title, onClose, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {onClose && <IconButton label="Close" onClick={onClose}>×</IconButton>}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default PanelShell;
