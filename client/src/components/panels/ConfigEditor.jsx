import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import styles from '../common/styles.module.css';


const DynamicMap = ({ label, path, data, commitChanges, styles, keyType = 'string', valType = 'string' }) => {
  let mapObj = {};
  let current = data;
  path.forEach(p => {
    if (current && current[p]) current = current[p];
    else current = null;
  });
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    mapObj = current;
  }

  const entries = Object.entries(mapObj);

  const updateMap = (oldKey, newKey, value) => {
    const newData = { ...data };
    let curr = newData;
    path.forEach(p => {
       if (!curr[p]) curr[p] = {};
       curr = curr[p];
    });
    if (oldKey !== newKey) {
      delete curr[oldKey];
    }
    if (value !== null) {
       let finalKey = keyType === 'number' && !isNaN(newKey) && String(newKey).trim() !== '' ? Number(newKey) : newKey;
       let finalValue = valType === 'number' && !isNaN(value) && String(value).trim() !== '' ? Number(value) : value;
       curr[finalKey] = finalValue;
    } else {
      delete curr[newKey];
    }
    commitChanges(newData);
  };

  const addEntry = () => {
    let suffix = 1;
    let newKey = 'new_key_' + suffix;
    while (mapObj[newKey] !== undefined) {
        suffix++;
        newKey = 'new_key_' + suffix;
    }
    if (keyType === 'number') newKey = suffix;
    updateMap('', newKey, valType === 'number' ? 0 : 'value');
  };

  return (
    <div className={styles.formGroup} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4, boxSizing: 'border-box', width: '100%' }}>
      <label>{label}</label>
      {entries.map(([k, v], idx) => (
        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input 
            value={k} 
            onChange={e => updateMap(k, e.target.value, v)} 
            placeholder="Key" 
            style={{ width: '40%', boxSizing: 'border-box' }} 
          />
          <input 
            type={valType === 'number' ? 'number' : 'text'}
            value={v} 
            onChange={e => updateMap(k, k, e.target.value)} 
            placeholder="Value" 
            style={{ width: '40%', boxSizing: 'border-box' }} 
          />
          <button type="button" onClick={() => updateMap(k, k, null)}>X</button>
        </div>
      ))}
      <button type="button" onClick={addEntry}>+ Add</button>
    </div>
  );
};

const DynamicArray = ({ label, path, data, commitChanges, styles }) => {
  let arr = [];
  let current = data;
  path.forEach(p => {
    if (current && current[p]) current = current[p];
    else current = null;
  });
  if (Array.isArray(current)) arr = current;

  const updateArray = (newArr) => {
    const newData = { ...data };
    let curr = newData;
    path.slice(0, -1).forEach(p => {
       if (!curr[p]) curr[p] = {};
       curr = curr[p];
    });
    curr[path[path.length - 1]] = newArr;
    commitChanges(newData);
  };

  return (
    <div className={styles.formGroup} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4, boxSizing: 'border-box', width: '100%' }}>
      <label>{label}</label>
      {arr.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input 
            value={item} 
            onChange={e => {
              const copy = [...arr];
              copy[idx] = e.target.value;
              updateArray(copy);
            }}
            style={{ width: '80%', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => {
            const copy = [...arr];
            copy.splice(idx, 1);
            updateArray(copy);
          }}>X</button>
        </div>
      ))}
      <button type="button" onClick={() => updateArray([...arr, ''])}>+ Add</button>
    </div>
  );
};

const DynamicStyleMap = ({ label, path, fields, data, commitChanges, styles }) => {
  let mapObj = {};
  let current = data;
  path.forEach(p => {
    if (current && current[p]) current = current[p];
    else current = null;
  });
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    mapObj = current;
  }

  const entries = Object.entries(mapObj);

  const updateEntry = (oldKey, newKey, newObj) => {
    const newData = { ...data };
    let curr = newData;
    path.forEach(p => {
       if (!curr[p]) curr[p] = {};
       curr = curr[p];
    });
    if (oldKey !== newKey) delete curr[oldKey];
    if (newObj !== null) {
      curr[newKey] = newObj;
    } else {
      delete curr[newKey];
    }
    commitChanges(newData);
  };

  const addStyle = () => {
     let def = {};
     fields.forEach(f => def[f.name] = f.type === 'number' ? 1 : 'solid');
     let suffix = 1;
     let newKey = 'new_style_' + suffix;
     while (mapObj[newKey] !== undefined) {
         suffix++;
         newKey = 'new_style_' + suffix;
     }
     updateEntry('', newKey, def);
  };

  return (
    <div className={styles.formGroup} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4, boxSizing: 'border-box', width: '100%' }}>
      <label>{label}</label>
      {entries.map(([k, v], idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={k} onChange={e => updateEntry(k, e.target.value, v)} placeholder="Style Name" style={{ fontWeight: 'bold', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => updateEntry(k, k, null)}>X</button>
          </div>
          {fields.map(f => (
            <div key={f.name} style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
               <label style={{ width: '60px', alignSelf: 'center', margin: 0, fontSize: '0.9em', color: '#555' }}>{f.name}</label>
               <input 
                 type={f.type === 'number' ? 'number' : 'text'}
                 value={v[f.name] || ''} 
                 onChange={e => updateEntry(k, k, { ...v, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })} 
                 style={{ boxSizing: 'border-box' }}
               />
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={addStyle}>+ Add Style</button>
    </div>
  );
};

function ConfigEditor({ yamlText, setYamlText }) {
  const [activeTab, setActiveTab] = useState('general');
  const [data, setData] = useState({});

  useEffect(() => {
    try {
      const parsed = yaml.load(yamlText) || {};
      setData(parsed);
    } catch (err) {
      console.error(err);
    }
  }, [yamlText]);

  const commitChanges = (newData) => {
    setData(newData);
    try {
      const updatedYaml = yaml.dump(newData, { indent: 2, lineWidth: -1 });
      setYamlText(updatedYaml);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStringChange = (path, value) => {
    const newData = { ...data };
    let current = newData;
    path.slice(0, -1).forEach(p => {
      if (!current[p]) current[p] = {};
      current = current[p];
    });
    const last = path[path.length - 1];
    if (value === '') {
      delete current[last];
    } else {
      current[last] = value;
    }
    commitChanges(newData);
  };
  
  const handleNumberChange = (path, value) => {
    handleStringChange(path, Number(value));
  };
  
  const handleCheckboxChange = (path, value) => {
    const newData = { ...data };
    let current = newData;
    path.slice(0, -1).forEach(p => {
      if (!current[p]) current[p] = {};
      current = current[p];
    });
    current[path[path.length - 1]] = value;
    commitChanges(newData);
  };

  const getVal = (path) => {
    let curr = data;
    for (let p of path) {
      if (curr && curr[p] !== undefined) curr = curr[p];
      else return '';
    }
    return curr;
  };

  return (
    <div className={styles.panel} style={{ height: 'auto', minHeight: '100%' }}>
      <div className={styles.tabs} style={{ flexShrink: 0 }}>
        <button className={`${styles.tabButton} ${activeTab === 'general' ? styles.active : ''}`} onClick={() => setActiveTab('general')}>General</button>
        <button className={`${styles.tabButton} ${activeTab === 'layout' ? styles.active : ''}`} onClick={() => setActiveTab('layout')}>Layout</button>
        <button className={`${styles.tabButton} ${activeTab === 'display' ? styles.active : ''}`} onClick={() => setActiveTab('display')}>Display</button>
      </div>
      <div style={{ padding: '0 16px', overflow: 'visible', paddingBottom: '32px' }}>
        {activeTab === 'general' && (
          <div className={styles.formGroup} style={{ boxSizing: 'border-box', width: '100%' }}>
             <label>Center Name</label>
             <input style={{ boxSizing: 'border-box', width: '100%' }} value={getVal(['center'])} onChange={e => handleStringChange(['center'], e.target.value)} />
          </div>
        )}
        {activeTab === 'layout' && (
          <div style={{ boxSizing: 'border-box', width: '100%' }}>
            {(() => {
              const dist = getVal(['layout', 'sector_distribution']);
              const sum = dist ? Object.values(dist).reduce((acc, val) => acc + (Number(val) || 0), 0) : 0;
              const is360 = sum === 360;
              return (
                <div style={{ marginBottom: '12px', padding: '8px', borderRadius: '4px', backgroundColor: is360 ? '#d4edda' : '#f8d7da', color: is360 ? '#155724' : '#721c24' }}>
                   <strong>Sector Angles Sum:</strong> {sum} / 360 {is360 ? '✓' : '⚠️ Must equal 360'}
                </div>
              );
            })()}
            <DynamicMap label="Sector Distribution (Sector: Angle)" path={['layout', 'sector_distribution']} data={data} commitChanges={commitChanges} styles={styles} keyType="string" valType="number" />
            <div className={styles.formGroup} style={{ boxSizing: 'border-box', width: '100%' }}>
               <label>Angle Spread</label>
               <input style={{ boxSizing: 'border-box', width: '100%' }} type="number" value={getVal(['layout', 'positioning_rules', 'angle_spread'])} onChange={e => handleNumberChange(['layout', 'positioning_rules', 'angle_spread'], e.target.value)} />
            </div>
            <DynamicArray label="Sort By" path={['layout', 'positioning_rules', 'sort_by']} data={data} commitChanges={commitChanges} styles={styles} />
            <DynamicMap label="Circle Radius (Circle Level: Radius)" path={['layout', 'positioning_rules', 'circle_radius']} data={data} commitChanges={commitChanges} styles={styles} keyType="number" valType="number" />
          </div>
        )}
        {activeTab === 'display' && (
          <div style={{ boxSizing: 'border-box', width: '100%' }}>
            <div className={styles.formGroup}>
               <label style={{ display: 'flex', alignItems: 'center' }}>
                 <input type="checkbox" style={{ width: 'auto', marginRight: '8px', marginBottom: 0, boxSizing: 'border-box' }} checked={!!getVal(['display', 'show_sector_labels'])} onChange={e => handleCheckboxChange(['display', 'show_sector_labels'], e.target.checked)} />
                 Show Sector Labels
               </label>
            </div>
            <div className={styles.formGroup}>
               <label style={{ display: 'flex', alignItems: 'center' }}>
                 <input type="checkbox" style={{ width: 'auto', marginRight: '8px', marginBottom: 0, boxSizing: 'border-box' }} checked={!!getVal(['display', 'show_circles'])} onChange={e => handleCheckboxChange(['display', 'show_circles'], e.target.checked)} />
                 Show Circles
               </label>
            </div>
            <DynamicMap label="Colors (Name: Hex/Color)" path={['display', 'colors']} data={data} commitChanges={commitChanges} styles={styles} />
            <DynamicStyleMap label="Line Styles" path={['display', 'line_styles']} fields={[{name: 'width', type: 'number'}, {name: 'style', type: 'text'}]} data={data} commitChanges={commitChanges} styles={styles} />
            <DynamicStyleMap label="Point Styles" path={['display', 'point_styles']} fields={[{name: 'size', type: 'number'}, {name: 'style', type: 'text'}]} data={data} commitChanges={commitChanges} styles={styles} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfigEditor;
