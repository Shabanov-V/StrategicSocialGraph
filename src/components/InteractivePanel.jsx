import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import styles from './InteractivePanel.module.css';
import PersonForm from './PersonForm';

function InteractivePanel({ yamlText, setYamlText }) {
  const [activeTab, setActiveTab] = useState('add');
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    sector: '',
    customSector: '',
    circle: '2', // default circle is 2
    importance: 'normal',
    strength: 'normal',
    direction: 'mutual',
    quality: 'positive',
    color_group: 'friend'
  });

  const [sectors, setSectors] = useState([]);
  const [colorGroups, setColorGroups] = useState({});
  const [nextId, setNextId] = useState('1');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only allow circle to be 1, 2, or 3
    if (name === 'circle') {
      if (!['1', '2', '3', 1, 2, 3].includes(value)) return;
    }
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

      setPeople(candidates);

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

      if (data && data.display && data.display.colors) {
        setColorGroups(data.display.colors);
      } else {
        setColorGroups({});
      }
      // --- compute next available numeric ID ---
      try {
        const used = new Set();
        candidates.forEach(item => {
          if (!item) return;
          // consider numeric ids only
          const raw = item.id;
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n) && n > 0) used.add(n);
        });

        // find smallest positive integer not in used
        let candidateId = 1;
        while (used.has(candidateId)) candidateId += 1;
        setNextId(String(candidateId));
        // also update the form id so the input shows the computed id
        setFormData(prev => ({ ...prev, id: String(candidateId) }));
      } catch (err) {
        // fallback to 1
        setNextId('1');
        setFormData(prev => ({ ...prev, id: '1' }));
      }
    } catch (err) {
      // If YAML can't be parsed, keep sectors empty
      setSectors([]);
      setNextId('1');
      setFormData(prev => ({ ...prev, id: '1' }));
    }
  }, [yamlText]);

  useEffect(() => {
    if (selectedPerson) {
      const person = people.find(p => p.id === parseInt(selectedPerson));
      if (person) {
        setFormData({
          ...person,
          id: person.id,
          circle: String(person.circle),
        });
      }
    } else {
      setFormData({
        name: '',
        id: nextId,
        sector: '',
        customSector: '',
        circle: '2',
        importance: 'normal',
        strength: 'normal',
        direction: 'mutual',
        quality: 'positive',
        color_group: 'friend'
      });
    }
  }, [selectedPerson, people, nextId]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    try {
      const currentData = yaml.load(yamlText) || {};
      const sectorValue = formData.sector === '__other' ? formData.customSector : formData.sector;
      const updatedNode = {
        ...formData,
        sector: sectorValue,
        id: parseInt(formData.id, 10),
        circle: parseInt(formData.circle, 10)
      };

      if (![1, 2, 3].includes(updatedNode.circle)) {
        alert('Circle must be 1, 2, or 3');
        return;
      }

      const update = (arr) => {
        const index = arr.findIndex(p => p.id === updatedNode.id);
        if (index !== -1) arr[index] = updatedNode;
      };

      if (Array.isArray(currentData.people)) update(currentData.people);
      if (Array.isArray(currentData.nodes)) update(currentData.nodes);

      const updatedYaml = yaml.dump(currentData, {
        indent: 2,
        lineWidth: -1
      });

      setYamlText(updatedYaml);
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Parse existing YAML
      const currentData = yaml.load(yamlText) || {};

      // Determine sector value: use customSector when user selected Other
      const sectorValue = formData.sector === '__other' ? formData.customSector : formData.sector;

      // Use the computed nextId (formData.id is kept in sync) and ensure numeric id
      const newNode = {
        ...formData,
        sector: sectorValue,
        id: parseInt(formData.id, 10),
        circle: parseInt(formData.circle, 10)
      };
      // Validate circle is 1, 2, or 3
      if (![1, 2, 3].includes(newNode.circle)) {
        alert('Circle must be 1, 2, or 3');
        return;
      }

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

      // After adding, recompute next id from updated YAML by loading it back
      try {
        const reloaded = yaml.load(updatedYaml) || {};
        const items = [];
        if (Array.isArray(reloaded.nodes)) items.push(...reloaded.nodes);
        if (Array.isArray(reloaded.people)) items.push(...reloaded.people);
        const used = new Set();
        items.forEach(item => {
          if (!item) return;
          const n = parseInt(item.id, 10);
          if (!Number.isNaN(n) && n > 0) used.add(n);
        });
        let candidateId = 1;
        while (used.has(candidateId)) candidateId += 1;
        setNextId(String(candidateId));

        setFormData({
          name: '',
          id: String(candidateId),
          sector: '',
          customSector: '',
          circle: '2', // reset to default 2
          importance: 'normal',
          strength: 'normal',
          direction: 'mutual',
          quality: 'positive',
          color_group: 'friend'
        });
      } catch (err) {
        // fallback reset
        setNextId('1');
        setFormData({
          name: '',
          id: '1',
          sector: '',
          customSector: '',
          circle: '2',
          importance: 'normal',
          strength: 'normal',
          direction: 'mutual',
          quality: 'positive',
          color_group: 'friend'
        });
      }

      console.log('Node added successfully');
    } catch (error) {
      console.error('Error updating YAML:', error);
    }
  };

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
        <PersonForm
          formData={formData}
          sectors={sectors}
          colorGroups={colorGroups}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          buttonText="Add Node"
        />
      )}

      {activeTab === 'edit' && (
        <div>
          <div className={styles.formGroup}>
            <label htmlFor="person">Person:</label>
            <select
              id="person"
              name="person"
              value={selectedPerson}
              onChange={e => setSelectedPerson(e.target.value)}
            >
              <option value="">-- select person --</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPerson && (
            <PersonForm
              formData={formData}
              sectors={sectors}
              colorGroups={colorGroups}
              handleChange={handleChange}
              handleSubmit={handleEditSubmit}
              buttonText="Save Changes"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default InteractivePanel;