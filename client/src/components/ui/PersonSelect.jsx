import React from 'react';
import ReactSelect from 'react-select';

const theme = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    borderRadius: 4,
    borderColor: state.isFocused ? '#007bff' : '#cccccc',
    boxShadow: state.isFocused ? '0 0 0 2px #007bff' : 'none',
    '&:hover': { borderColor: '#007bff' },
  }),
};

function PersonSelect({ value, onChange, options, placeholder, inputId }) {
  const selected = options.find((o) => o.value === value) || null;
  return (
    <ReactSelect
      inputId={inputId}
      styles={theme}
      options={options}
      value={selected}
      placeholder={placeholder}
      isClearable
      onChange={(opt) => onChange(opt ? opt.value : '')}
    />
  );
}

export default PersonSelect;
