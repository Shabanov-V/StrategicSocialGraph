import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import styles from '../common/styles.module.css';
import {
  listPeople,
  listConnections,
  getIn,
  addConnection,
  editConnection,
  removeConnection,
} from '../../graph-document';

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
  const [colorGroups, setColorGroups] = useState({});

  // Load people list from YAML
  useEffect(() => {
    try {
      setPeople(listPeople(yamlText));

      const newColorGroups = getIn(yamlText, ['display', 'colors']) || {};
      setColorGroups(newColorGroups);

      setFormData(prev => {
        const availableColorGroups = Object.keys(newColorGroups);
        const currentGroup = prev.color_group;

        if (availableColorGroups.length === 0) {
          return { ...prev, color_group: '' };
        }

        if (!availableColorGroups.includes(currentGroup)) {
          return { ...prev, color_group: availableColorGroups[0] };
        }

        return prev;
      });
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
      const newConnection = {
        from: formData.from,
        to: formData.to,
        strength: formData.strength,
        direction: formData.direction,
        quality: formData.quality,
        color_group: formData.color_group
      };

      setYamlText(addConnection(yamlText, newConnection));

      // Reset form
      setFormData({
        from: '',
        to: '',
        strength: 'normal',
        direction: 'mutual',
        quality: 'positive',
        color_group: 'friend'
      });
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  const [activeTab, setActiveTab] = useState('add');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [selectedConnection, setSelectedConnection] = useState(null);

  const handleDelete = () => {
    try {
      setYamlText(removeConnection(yamlText, editFrom, editTo));
      setEditFrom('');
      setEditTo('');
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    try {
      setYamlText(editConnection(yamlText, editFrom, editTo, formData));
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'edit') {
      setEditFrom('');
      setEditTo('');
      setSelectedConnection(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (editFrom && editTo) {
      try {
        const connection = listConnections(yamlText).find(
          c =>
            (c.from === editFrom && c.to === editTo) ||
            (c.from === editTo && c.to === editFrom)
        );
        setSelectedConnection(connection);
        if (connection) {
          setFormData(connection);
        }
      } catch (err) {
        console.error('Error parsing YAML:', err);
      }
    } else {
      setSelectedConnection(null);
    }
  }, [editFrom, editTo, yamlText]);

  const peopleOptions = people.map(p => ({ value: p.name, label: p.name }));

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'add' ? styles.active : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'edit' ? styles.active : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
      </div>

      {activeTab === 'add' && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="from">From Person:</label>
            <Select
              inputId="from"
              name="from"
              options={peopleOptions}
              value={peopleOptions.find(o => o.value === formData.from) || null}
              onChange={opt => handleChange({ target: { name: 'from', value: opt ? opt.value : '' } })}
              isClearable
              placeholder="-- select person --"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="to">To Person:</label>
            <Select
              inputId="to"
              name="to"
              options={peopleOptions}
              value={peopleOptions.find(o => o.value === formData.to) || null}
              onChange={opt => handleChange({ target: { name: 'to', value: opt ? opt.value : '' } })}
              isClearable
              placeholder="-- select person --"
            />
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

          {Object.keys(colorGroups).length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="color_group">Color Group:</label>
              <select
                id="color_group"
                name="color_group"
                value={formData.color_group}
                onChange={handleChange}
              >
                {Object.keys(colorGroups).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className={styles.submitButton}>
            Add Connection
          </button>
        </form>
      )}

      {activeTab === 'edit' && (
        <div>
          <div className={styles.formGroup}>
            <label htmlFor="editFrom">Person 1:</label>
            <Select
              inputId="editFrom"
              name="editFrom"
              options={peopleOptions}
              value={peopleOptions.find(o => o.value === editFrom) || null}
              onChange={opt => setEditFrom(opt ? opt.value : '')}
              isClearable
              placeholder="-- select person --"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="editTo">Person 2:</label>
            <Select
              inputId="editTo"
              name="editTo"
              options={peopleOptions}
              value={peopleOptions.find(o => o.value === editTo) || null}
              onChange={opt => setEditTo(opt ? opt.value : '')}
              isClearable
              placeholder="-- select person --"
            />
          </div>
          {selectedConnection && (
            <form className={styles.form}>
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
              {Object.keys(colorGroups).length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="color_group">Color Group:</label>
                  <select
                    id="color_group"
                    name="color_group"
                    value={formData.color_group}
                    onChange={handleChange}
                  >
                    {Object.keys(colorGroups).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className={styles.submitButton} onClick={handleEditSubmit}>
                Save Changes
              </button>
              <button type="button" className={`${styles.submitButton} ${styles.deleteButton}`} onClick={handleDelete}>
                Delete Connection
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectionEditor;
