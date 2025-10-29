import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import styles from './InteractivePanel.module.css';

function ConnectionEditor({ yamlText, setYamlText }) {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    strength: 'normal',
    direction: 'mutual',
    quality: 'positive',
    color_group: 'friend'
  });

  const [people, setPeople] = useState([]);

  // Load people list from YAML
  useEffect(() => {
    try {
      const data = yaml.load(yamlText) || {};
      const peopleList = [];
      
      // Check both people and nodes arrays for compatibility
      if (Array.isArray(data.people)) {
        peopleList.push(...data.people);
      } else if (Array.isArray(data.nodes)) {
        peopleList.push(...data.nodes);
      }
      
      setPeople(peopleList);
    } catch (err) {
      console.error('Error parsing YAML:', err);
      setPeople([]);
    }
  }, [yamlText]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const currentData = yaml.load(yamlText) || {};
      
      console.log('Current Data before adding connection:', currentData);

      // Initialize connections array if it doesn't exist
      if (!Array.isArray(currentData.peer_connections)) {
        currentData.peer_connections = [];
      }

      // Add new connection
      const newConnection = {
        from: formData.from,
        to: formData.to,
        strength: formData.strength,
        direction: formData.direction,
        quality: formData.quality,
        color_group: formData.color_group
      };

      currentData.peer_connections.push(newConnection);

      // Convert back to YAML
      const updatedYaml = yaml.dump(currentData, {
        indent: 2,
        lineWidth: -1 // Prevent line wrapping
      });

      // Update the YAML text
      setYamlText(updatedYaml);

      // Reset form
      setFormData({
        from: '',
        to: '',
        strength: 'normal',
        direction: 'mutual',
        quality: 'positive',
        color_group: 'friend'
      });

      console.log('Connection added successfully');
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="from">From Person:</label>
          <select
            id="from"
            name="from"
            value={formData.from}
            onChange={handleChange}
            required
          >
            <option value="">-- select person --</option>
            {people.map(person => (
              <option key={person.id} value={person.name}>{person.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="to">To Person:</label>
          <select
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            required
          >
            <option value="">-- select person --</option>
            {people.map(person => (
              <option key={person.id} value={person.name}>{person.name}</option>
            ))}
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
          Add Connection
        </button>
      </form>
    </div>
  );
}

export default ConnectionEditor;
