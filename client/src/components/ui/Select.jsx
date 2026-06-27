import React from 'react';
import styles from './Select.module.css';

function Select({ options, className = '', ...rest }) {
  const cls = [styles.select, className].filter(Boolean).join(' ');
  return (
    <select className={cls} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default Select;
