import React from 'react';
import styles from './Toolbar.module.css';

const CodeIcon = () => (
  <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 01-1.898-.632l4-12a1 1 0 011.265-.633zM5.729 5.729a1 1 0 011.414 0L10 8.586l2.857-2.857a1 1 0 111.414 1.414L11.414 10l2.857 2.857a1 1 0 01-1.414 1.414L10 11.414l-2.857 2.857a1 1 0 01-1.414-1.414L8.586 10 5.729 7.143a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const Toolbar = ({ onToggleEditor }) => {
  return (
    <div className={styles.toolbar}>
      <button className={styles.button} onClick={onToggleEditor}>
        <CodeIcon />
      </button>
    </div>
  );
};

export default Toolbar;
