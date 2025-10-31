import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import styles from './DisplayPanel.module.css';

// A reusable component to handle name edits without losing focus
function EditableNameInput({ initialValue, onSave, className }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent form submission if it's in a form
      if (value !== initialValue) {
        onSave(value);
      }
      e.target.blur(); // remove focus from input
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
}

export default function DisplayPanel({ yamlText, setYamlText }) {
  const data = yaml.load(yamlText) || {};
  const displayData = data.display || {};

  const handleDisplayChange = (key, value) => {
    const newData = { ...data, display: { ...displayData, [key]: value } };
    setYamlText(yaml.dump(newData));
  };

  const handleNestedChange = (category, name, key, value) => {
    const newCategory = { ...displayData[category], [name]: { ...displayData[category][name], [key]: value } };
    handleDisplayChange(category, newCategory);
  };

  const handleNameChange = (category, oldName, newName) => {
    const newCategory = { ...displayData[category] };
    if (Object.prototype.hasOwnProperty.call(newCategory, newName)) {
      // Don't allow renaming to an existing name to prevent data loss
      return;
    }
    newCategory[newName] = newCategory[oldName];
    delete newCategory[oldName];
    handleDisplayChange(category, newCategory);
  };

  const handleColorChange = (name, value) => {
    const newColors = { ...displayData.colors, [name]: value };
    handleDisplayChange('colors', newColors);
  };

  const handleAddItem = (category) => {
    const newCategory = { ...displayData[category] };
    const newItemName = `new_${category.slice(0, -1)}_${Object.keys(newCategory).length + 1}`;
    if (category === 'colors') {
      newCategory[newItemName] = '#000000';
    } else if (category === 'line_styles') {
      newCategory[newItemName] = { width: 1, style: 'solid' };
    } else if (category === 'point_styles') {
      newCategory[newItemName] = { size: 5, style: 'filled' };
    }
    handleDisplayChange(category, newCategory);
  };

  const handleDeleteItem = (category, name) => {
    const newCategory = { ...displayData[category] };
    delete newCategory[name];
    handleDisplayChange(category, newCategory);
  };

  return (
    <div className={styles.container}>
      <h2>Display Settings</h2>

      <div className={styles.section}>
        <label>
          <input
            type="checkbox"
            checked={displayData.show_sector_labels || false}
            onChange={(e) => handleDisplayChange('show_sector_labels', e.target.checked)}
          />
          Show Sector Labels
        </label>
        <label>
          <input
            type="checkbox"
            checked={displayData.show_circles || false}
            onChange={(e) => handleDisplayChange('show_circles', e.target.checked)}
          />
          Show Circles
        </label>
      </div>

      <div className={styles.section}>
        <h3>Line Styles</h3>
        {Object.entries(displayData.line_styles || {}).map(([name, style]) => (
          <div key={name} className={styles.item}>
            <EditableNameInput
              initialValue={name}
              onSave={(newName) => handleNameChange('line_styles', name, newName)}
              className={styles.nameInput}
            />
            <input
              type="number"
              value={style.width}
              onChange={(e) => handleNestedChange('line_styles', name, 'width', parseInt(e.target.value, 10))}
              className={`${styles.valueInput} ${styles.numberInput}`}
            />
            <select
              value={style.style}
              onChange={(e) => handleNestedChange('line_styles', name, 'style', e.target.value)}
              className={`${styles.valueInput} ${styles.selectInput}`}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </select>
            <button onClick={() => handleDeleteItem('line_styles', name)} className={styles.deleteButton}>X</button>
          </div>
        ))}
        <button onClick={() => handleAddItem('line_styles')} className={styles.addButton}>+ Add Line Style</button>
      </div>

      <div className={styles.section}>
        <h3>Point Styles</h3>
        {Object.entries(displayData.point_styles || {}).map(([name, style]) => (
          <div key={name} className={styles.item}>
            <EditableNameInput
              initialValue={name}
              onSave={(newName) => handleNameChange('point_styles', name, newName)}
              className={styles.nameInput}
            />
            <input
              type="number"
              value={style.size}
              onChange={(e) => handleNestedChange('point_styles', name, 'size', parseInt(e.target.value, 10))}
              className={`${styles.valueInput} ${styles.numberInput}`}
            />
            <select
              value={style.style}
              onChange={(e) => handleNestedChange('point_styles', name, 'style', e.target.value)}
              className={`${styles.valueInput} ${styles.selectInput}`}
            >
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
            </select>
            <button onClick={() => handleDeleteItem('point_styles', name)} className={styles.deleteButton}>X</button>
          </div>
        ))}
        <button onClick={() => handleAddItem('point_styles')} className={styles.addButton}>+ Add Point Style</button>
      </div>

      <div className={styles.section}>
        <h3>Colors</h3>
        {Object.entries(displayData.colors || {}).map(([name, color]) => (
          <div key={name} className={styles.item}>
            <EditableNameInput
              initialValue={name}
              onSave={(newName) => handleNameChange('colors', name, newName)}
              className={styles.nameInput}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(name, e.target.value)}
              className={styles.valueInput}
            />
            <button onClick={() => handleDeleteItem('colors', name)} className={styles.deleteButton}>X</button>
          </div>
        ))}
        <button onClick={() => handleAddItem('colors')} className={styles.addButton}>+ Add Color</button>
      </div>
    </div>
  );
}
