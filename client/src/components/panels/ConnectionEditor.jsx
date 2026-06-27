import React, { useState, useEffect } from 'react';
import styles from '../common/styles.module.css';
import Tabs from '../ui/Tabs';
import Field from '../ui/Field';
import Select from '../ui/Select';
import PersonSelect from '../ui/PersonSelect';
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
      <Tabs
        tabs={[{ id: 'add', label: 'Add' }, { id: 'edit', label: 'Edit' }]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'add' && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="From Person:" htmlFor="from">
            <PersonSelect
              inputId="from"
              options={peopleOptions}
              value={formData.from}
              onChange={val => handleChange({ target: { name: 'from', value: val } })}
              placeholder="-- select person --"
            />
          </Field>

          <Field label="To Person:" htmlFor="to">
            <PersonSelect
              inputId="to"
              options={peopleOptions}
              value={formData.to}
              onChange={val => handleChange({ target: { name: 'to', value: val } })}
              placeholder="-- select person --"
            />
          </Field>

          <Field label="Strength:" htmlFor="strength">
            <Select
              id="strength"
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'strong', label: 'Strong' },
                { value: 'weak', label: 'Weak' },
              ]}
            />
          </Field>

          <Field label="Direction:" htmlFor="direction">
            <Select
              id="direction"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              options={[
                { value: 'mutual', label: 'Mutual' },
                { value: 'incoming', label: 'Incoming' },
                { value: 'outgoing', label: 'Outgoing' },
              ]}
            />
          </Field>

          <Field label="Quality:" htmlFor="quality">
            <Select
              id="quality"
              name="quality"
              value={formData.quality}
              onChange={handleChange}
              options={[
                { value: 'positive', label: 'Positive' },
                { value: 'negative', label: 'Negative' },
                { value: 'neutral', label: 'Neutral' },
              ]}
            />
          </Field>

          {Object.keys(colorGroups).length > 0 && (
            <Field label="Color Group:" htmlFor="color_group">
              <Select
                id="color_group"
                name="color_group"
                value={formData.color_group}
                onChange={handleChange}
                options={Object.keys(colorGroups).map(group => ({ value: group, label: group }))}
              />
            </Field>
          )}

          <button type="submit" className={styles.submitButton}>
            Add Connection
          </button>
        </form>
      )}

      {activeTab === 'edit' && (
        <div>
          <Field label="Person 1:" htmlFor="editFrom">
            <PersonSelect
              inputId="editFrom"
              options={peopleOptions}
              value={editFrom}
              onChange={val => setEditFrom(val)}
              placeholder="-- select person --"
            />
          </Field>
          <Field label="Person 2:" htmlFor="editTo">
            <PersonSelect
              inputId="editTo"
              options={peopleOptions}
              value={editTo}
              onChange={val => setEditTo(val)}
              placeholder="-- select person --"
            />
          </Field>
          {selectedConnection && (
            <form className={styles.form}>
              <Field label="Strength:" htmlFor="strength">
                <Select
                  id="strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'strong', label: 'Strong' },
                    { value: 'weak', label: 'Weak' },
                  ]}
                />
              </Field>
              <Field label="Direction:" htmlFor="direction">
                <Select
                  id="direction"
                  name="direction"
                  value={formData.direction}
                  onChange={handleChange}
                  options={[
                    { value: 'mutual', label: 'Mutual' },
                    { value: 'incoming', label: 'Incoming' },
                    { value: 'outgoing', label: 'Outgoing' },
                  ]}
                />
              </Field>
              <Field label="Quality:" htmlFor="quality">
                <Select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  options={[
                    { value: 'positive', label: 'Positive' },
                    { value: 'negative', label: 'Negative' },
                    { value: 'neutral', label: 'Neutral' },
                  ]}
                />
              </Field>
              {Object.keys(colorGroups).length > 0 && (
                <Field label="Color Group:" htmlFor="color_group">
                  <Select
                    id="color_group"
                    name="color_group"
                    value={formData.color_group}
                    onChange={handleChange}
                    options={Object.keys(colorGroups).map(group => ({ value: group, label: group }))}
                  />
                </Field>
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
