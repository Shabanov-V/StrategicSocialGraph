import React from 'react';
import Editor from '../ui/Editor';
import styles from './CodePanel.module.css';

function CodePanel({ value, onChange, error }) {
  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileInputRef = React.useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <button className={styles.button} onClick={handleDownload}>
          Download
        </button>
        <button className={styles.button} onClick={handleUploadClick}>
          Upload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".yml,.yaml"
        />
      </div>
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