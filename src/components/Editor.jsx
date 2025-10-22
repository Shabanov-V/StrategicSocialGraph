import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import styles from './Editor.module.css';

const Editor = ({ value, onChange }) => {
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[yaml()]}
        onChange={handleChange}
        className={styles.editor}
      />
    </div>
  );
};

export default Editor;
