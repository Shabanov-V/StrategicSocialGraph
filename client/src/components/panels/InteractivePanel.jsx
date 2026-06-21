import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import styles from '../common/styles.module.css';
import PersonForm from '../ui/PersonForm';
import { blankAddForm, stickyReset, hasNonDefaultAdvanced } from './person-form';
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

// Keep a form's color_group valid against the currently available groups.
function reconcileColor(form, availableGroups) {
  if (availableGroups.length === 0) return { ...form, color_group: '' };
  if (!availableGroups.includes(form.color_group)) {
    return { ...form, color_group: availableGroups[0] };
  }
  return form;
}

function InteractivePanel({ yamlText, setYamlText }) {
  const [activeTab, setActiveTab] = useState('add');
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');

  // Add and Edit keep separate form state so sticky add-values never bleed
  // into Edit (and a person's values never bleed back into the sticky add form).
  const [addForm, setAddForm] = useState(blankAddForm());
  const [editForm, setEditForm] = useState(blankAddForm());

  const [addAdvancedOpen, setAddAdvancedOpen] = useState(false);
  const [editAdvancedOpen, setEditAdvancedOpen] = useState(false);

  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmTimer = useRef(null);
  const nameRef = useRef(null);

  const [sectors, setSectors] = useState([]);
  const [colorGroups, setColorGroups] = useState({});

  const makeHandleChange = (setForm) => (e) => {
    const { name, value } = e.target;
    if (name === 'circle' && !['1', '2', '3', 1, 2, 3].includes(value)) return;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Recompute people, sectors, color groups, and next id whenever yamlText changes.
  useEffect(() => {
    try {
      setPeople(listPeople(yamlText));
      setSectors(listSectors(yamlText));

      const newColorGroups = getIn(yamlText, ['display', 'colors']) || {};
      setColorGroups(newColorGroups);
      const available = Object.keys(newColorGroups);

      const candidateId = nextPersonId(yamlText);
      setAddForm(prev => reconcileColor({ ...prev, id: String(candidateId) }, available));
      setEditForm(prev => reconcileColor(prev, available));
    } catch {
      setSectors([]);
      setAddForm(prev => ({ ...prev, id: '1' }));
    }
  }, [yamlText]);

  // Fill the edit form from the selected person; open Advanced when that
  // person carries non-default advanced values so editing never hides data.
  useEffect(() => {
    if (selectedPerson) {
      const person = people.find(p => p.id === parseInt(selectedPerson));
      if (person) {
        setEditForm({ ...person, id: person.id, circle: String(person.circle) });
        setEditAdvancedOpen(hasNonDefaultAdvanced(person));
      }
    }
  }, [selectedPerson, people]);

  // Focus the name field when the Add tab is shown.
  useEffect(() => {
    if (activeTab === 'add') nameRef.current?.focus();
  }, [activeTab]);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const flashConfirm = (text) => {
    setConfirmMessage(text);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmMessage(''), 2500);
  };

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
      const cleared = setIn(setIn(yamlText, ['people'], []), ['peer_connections'], []);
      setYamlText(cleared);
      setSelectedPerson('');
    } catch (error) {
      console.error('Error deleting all persons:', error);
    }
  };

  const toDraft = (form) => {
    const sectorValue = form.sector === '__other' ? form.customSector : form.sector;
    const draft = { ...form, sector: sectorValue, circle: parseInt(form.circle, 10) };
    delete draft.customSector;
    return draft;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    try {
      const patch = toDraft(editForm);
      delete patch.id; // editPerson takes the id separately
      setYamlText(editPerson(yamlText, parseInt(editForm.id, 10), patch));
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
      const draft = toDraft(addForm);
      const name = draft.name;
      delete draft.id; // the module assigns the next free id

      const updatedYaml = addPerson(yamlText, draft);
      setYamlText(updatedYaml);
      // Sticky: clear name only, keep sector/circle/importance/color for the next add.
      setAddForm(prev => stickyReset(prev, nextPersonId(updatedYaml)));
      flashConfirm(`✓ Added ${name}`);
      nameRef.current?.focus();
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
          formData={addForm}
          sectors={sectors}
          colorGroups={colorGroups}
          handleChange={makeHandleChange(setAddForm)}
          handleSubmit={handleSubmit}
          buttonText="Add Person"
          advancedOpen={addAdvancedOpen}
          onToggleAdvanced={() => setAddAdvancedOpen(o => !o)}
          nameRef={nameRef}
          confirmMessage={confirmMessage}
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
              formData={editForm}
              sectors={sectors}
              colorGroups={colorGroups}
              handleChange={makeHandleChange(setEditForm)}
              handleSubmit={handleEditSubmit}
              buttonText="Save Changes"
              onDelete={handleDelete}
              advancedOpen={editAdvancedOpen}
              onToggleAdvanced={() => setEditAdvancedOpen(o => !o)}
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
