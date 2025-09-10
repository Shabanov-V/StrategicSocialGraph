import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';

const Editor = ({ value, onChange }) => {
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ height: '100%' }}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[yaml()]}
        onChange={handleChange}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default Editor;
