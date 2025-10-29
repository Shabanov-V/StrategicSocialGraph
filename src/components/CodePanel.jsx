import React from 'react';
import Editor from './Editor';
import styles from './CodePanel.module.css';

function CodePanel({ value, onChange, error }) {
  return (
    <div className={styles.panel}>
      <div className={styles.editorContainer}>
        <Editor value={value} onChange={onChange} />
      </div>
      {error && (
        <div className={styles.errorPanel}>
          <strong>Error parsing YAML:</strong>
          <pre className={styles.errorMessage}>{error}</pre>
        </div>
      )}
    </div>
  );
}

export default CodePanel;