import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import styles from './InteractivePanel.module.css';

function InteractivePanel({ yamlText, setYamlText }) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    sector: '',
    customSector: '',
    circle: '',
    importance: 'normal',
    strength: 'normal',
    direction: 'mutual',
    quality: 'positive',
    color_group: 'friend'
  });

  const [sectors, setSectors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Recompute sectors list whenever yamlText changes
  useEffect(() => {
    try {
      const data = yaml.load(yamlText) || {};
      const list = [];

      const candidates = [];
      if (Array.isArray(data.nodes)) candidates.push(...data.nodes);
      if (Array.isArray(data.people)) candidates.push(...data.people);

      candidates.forEach(item => {
        if (item && item.sector) {
          // normalize to string
          const s = String(item.sector).trim();
          if (s) list.push(s);
        }
      });

      // dedupe and sort
      const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
      setSectors(unique);
    } catch (err) {
      // If YAML can't be parsed, keep sectors empty
      setSectors([]);
    }
  }, [yamlText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Parse existing YAML
      const currentData = yaml.load(yamlText) || {};

      // Determine sector value: use customSector when user selected Other
      const sectorValue = formData.sector === '__other' ? formData.customSector : formData.sector;

      // Convert id and circle to numbers and set sector
      const newNode = {
        ...formData,
        sector: sectorValue,
        id: parseInt(formData.id),
        circle: parseInt(formData.circle)
      };

      // Add new node to either people or nodes array depending on file format
      if (Array.isArray(currentData.people)) {
        currentData.people.push(newNode);
      } else {
        if (!Array.isArray(currentData.nodes)) currentData.nodes = [];
        currentData.nodes.push(newNode);
      }

      // Convert back to YAML
      const updatedYaml = yaml.dump(currentData, {
        indent: 2,
        lineWidth: -1 // Prevent line wrapping
      });

      // Update the YAML text in the parent component
      setYamlText(updatedYaml);

      // Reset the form
      setFormData({
        name: '',
        id: '',
        sector: '',
        customSector: '',
        circle: '',
        importance: 'normal',
        strength: 'normal',
        direction: 'mutual',
        quality: 'positive',
        color_group: 'friend'
      });

      console.log('Node added successfully');
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="id">ID:</label>
          <input
            type="number"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="sector">Sector:</label>
          <select
            id="sector"
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            required
          >
            <option value="">-- select sector --</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__other">Other (custom)</option>
          </select>

          {formData.sector === '__other' && (
            <input
              type="text"
              id="customSector"
              name="customSector"
              placeholder="Enter custom sector"
              value={formData.customSector}
              onChange={handleChange}
              required
              style={{ marginTop: '6px' }}
            />
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="circle">Circle:</label>
          <input
            type="number"
            id="circle"
            name="circle"
            value={formData.circle}
            min="1"
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="importance">Importance:</label>
          <select
            id="importance"
            name="importance"
            value={formData.importance}
            onChange={handleChange}
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="strength">Strength:</label>
          <select
            id="strength"
            name="strength"
            value={formData.strength}
            onChange={handleChange}
          >
            <option value="normal">Normal</option>
            <option value="strong">Strong</option>
            <option value="weak">Weak</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="direction">Direction:</label>
          <select
            id="direction"
            name="direction"
            value={formData.direction}
            onChange={handleChange}
          >
            <option value="mutual">Mutual</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="quality">Quality:</label>
          <select
            id="quality"
            name="quality"
            value={formData.quality}
            onChange={handleChange}
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="color_group">Color Group:</label>
          <select
            id="color_group"
            name="color_group"
            value={formData.color_group}
            onChange={handleChange}
          >
            <option value="friend">Friend</option>
            <option value="family">Family</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button type="submit" className={styles.submitButton}>
          Add Node
        </button>
      </form>
    </div>
  );
}

export default InteractivePanel;