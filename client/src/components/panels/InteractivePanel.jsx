import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import Select from 'react-select';
import styles from '../common/styles.module.css';
import PersonForm from '../ui/PersonForm';

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

      // Also include sectors defined in layout configuration
      if (data.layout && data.layout.sector_distribution) {
        Object.keys(data.layout.sector_distribution).forEach(s => {
          if (s && typeof s === 'string') {
            const trimmed = s.trim();
            if (trimmed) list.push(trimmed);
          }
        });
      }

      // dedupe and sort
      const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setSectors(unique);

      const newColorGroups = (data && data.display && data.display.colors) || {};
      setColorGroups(newColorGroups);

      setFormData(prev => {
        const availableColorGroups = Object.keys(newColorGroups);
        const currentGroup = prev.color_group;

        // If no groups are available, the selection must be empty.
        if (availableColorGroups.length === 0) {
          return { ...prev, color_group: '' };
        }

        // If groups are available, check if the current selection is valid.
        if (!availableColorGroups.includes(currentGroup)) {
          // If not valid, set it to the first available group.
          return { ...prev, color_group: availableColorGroups[0] };
        }

        // Otherwise, the selection is valid, so no change is needed.
        return prev;
      });
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

  const handleDelete = () => {
    if (!selectedPerson) return;
    const personToDelete = people.find(p => p.id === parseInt(selectedPerson));
    if (!personToDelete) return;

    if (!window.confirm(`Are you sure you want to delete ${personToDelete.name}? This will also remove all their connections.`)) {
      return;
    }

    try {
      const currentData = yaml.load(yamlText) || {};
      const personName = personToDelete.name;

      // Filter out the person
      if (Array.isArray(currentData.people)) {
        currentData.people = currentData.people.filter(p => p.id !== personToDelete.id);
      }
      if (Array.isArray(currentData.nodes)) {
        currentData.nodes = currentData.nodes.filter(p => p.id !== personToDelete.id);
      }

      // Filter out connections involving this person's name
      if (Array.isArray(currentData.peer_connections)) {
        currentData.peer_connections = currentData.peer_connections.filter(
          c => c.from !== personName && c.to !== personName
        );
      }

      const updatedYaml = yaml.dump(currentData, {
        indent: 2,
        lineWidth: -1
      });

      setYamlText(updatedYaml);
      setSelectedPerson('');
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  const handleDeleteAll = () => {
    if (!window.confirm("Are you sure you want to delete ALL persons? This will also remove all connections and cannot be undone.")) {
      return;
    }

    try {
      const currentData = yaml.load(yamlText) || {};

      // Clear people and nodes
      currentData.people = [];
      currentData.nodes = [];

      // Clear peer connections as they depend on people
      currentData.peer_connections = [];

      const updatedYaml = yaml.dump(currentData, {
        indent: 2,
        lineWidth: -1
      });

      setYamlText(updatedYaml);
      setSelectedPerson('');
      console.log('All persons and connections deleted successfully');
    } catch (error) {
      console.error('Error deleting all persons:', error);
    }
  };

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

  const peopleOptions = people.map(p => ({ value: p.id, label: p.name }));

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
            <Select
              inputId="person"
              name="person"
              options={peopleOptions}
              value={peopleOptions.find(o => String(o.value) === String(selectedPerson)) || null}
              onChange={opt => setSelectedPerson(opt ? opt.value : '')}
              isClearable
              placeholder="-- select person --"
            />
          </div>

          {selectedPerson && (
            <PersonForm
              formData={formData}
              sectors={sectors}
              colorGroups={colorGroups}
              handleChange={handleChange}
              handleSubmit={handleEditSubmit}
              buttonText="Save Changes"
              onDelete={handleDelete}
            />
          )}

          <button
            type="button"
            className={`${styles.submitButton} ${styles.deleteAllButton}`}
            onClick={handleDeleteAll}
          >
            Delete All Persons
          </button>
        </div>
      )}
    </div>
  );
}

export default InteractivePanel;
