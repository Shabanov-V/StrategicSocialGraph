import React from 'react';
import styles from './Button.module.css';

function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...rest }) {
  const cls = [styles.btn, styles[size], styles[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}

export default Button;
