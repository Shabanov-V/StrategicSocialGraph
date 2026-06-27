import React from 'react';
import styles from './IconButton.module.css';

function IconButton({ label, active = false, type = 'button', className = '', children, ...rest }) {
  const cls = [styles.iconBtn, active ? styles.active : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export default IconButton;
