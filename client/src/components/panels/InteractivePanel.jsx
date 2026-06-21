import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import styles from '../common/styles.module.css';
import PersonForm from '../ui/PersonForm';
import {
  listPeople,
  listSectors,
  nextPersonId,
  getIn,
  addPerson,
  editPerson,
  removePerson,
  setIn,
  GraphDocumentError,
} from '../../graph-document';

const blankForm = (id = '') => ({
  name: '',
  id: String(id),
  sector: '',
  customSector: '',
  circle: '2', // default circle is 2
  importance: 'normal',
  strength: 'normal',
  direction: 'mutual',
  quality: 'positive',
  color_group: 'friend',
});

function InteractivePanel({ yamlText, setYamlText }) {
  const [activeTab, setActiveTab] = useState('add');
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [formData, setFormData] = useState(blankForm());

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

  // Recompute people, sectors, color groups, and next id whenever yamlText changes
  useEffect(() => {
    try {
      setPeople(listPeople(yamlText));
      setSectors(listSectors(yamlText));

      const newColorGroups = getIn(yamlText, ['display', 'colors']) || {};
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

      const candidateId = nextPersonId(yamlText);
      setNextId(String(candidateId));
      setFormData(prev => ({ ...prev, id: String(candidateId) }));
    } catch {
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
      setFormData(blankForm(nextId));
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
      setYamlText(removePerson(yamlText, personToDelete.id));
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
      // Clear people, then their connections
      const cleared = setIn(setIn(yamlText, ['people'], []), ['peer_connections'], []);
      setYamlText(cleared);
      setSelectedPerson('');
    } catch (error) {
      console.error('Error deleting all persons:', error);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    try {
      const sectorValue = formData.sector === '__other' ? formData.customSector : formData.sector;
      const patch = {
        ...formData,
        sector: sectorValue,
        circle: parseInt(formData.circle, 10),
      };
      delete patch.customSector;
      delete patch.id; // editPerson takes the id separately
      setYamlText(editPerson(yamlText, parseInt(formData.id, 10), patch));
    } catch (error) {
      if (error instanceof GraphDocumentError) {
        alert(error.message);
        return;
      }
      console.error('Error updating YAML:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Determine sector value: use customSector when user selected Other
      const sectorValue = formData.sector === '__other' ? formData.customSector : formData.sector;
      const draft = {
        ...formData,
        sector: sectorValue,
        circle: parseInt(formData.circle, 10),
      };
      delete draft.customSector;
      delete draft.id; // the module assigns the next free id

      // The derive effect refreshes nextId after the document changes.
      const updatedYaml = addPerson(yamlText, draft);
      setYamlText(updatedYaml);
      setFormData(blankForm(nextPersonId(updatedYaml)));
    } catch (error) {
      if (error instanceof GraphDocumentError) {
        alert(error.message);
        return;
      }
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
