import React from 'react';
import styles from '../common/styles.module.css';
import Field from './Field';
import Select from './Select';

function PersonForm({
  formData,
  sectors,
  colorGroups,
  handleChange,
  handleSubmit,
  buttonText,
  onDelete,
  advancedOpen,
  onToggleAdvanced,
  nameRef,
  confirmMessage,
}) {
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Field label="Name:" htmlFor="name">
        <input
          type="text"
          id="name"
          name="name"
          ref={nameRef}
          value={formData.name}
          onChange={handleChange}
          required
        />
      </Field>

      <input type="hidden" id="id" name="id" value={formData.id} />

      <Field label="Sector:" htmlFor="sector">
        <Select
          id="sector"
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          required
          options={[
            { value: '', label: '-- select sector --' },
            ...sectors.map(s => ({ value: s, label: s })),
            { value: '__other', label: 'Other (custom)' },
          ]}
        />

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
      </Field>

      <Field label="Circle:" htmlFor="circle">
        <Select
          id="circle"
          name="circle"
          value={formData.circle}
          onChange={handleChange}
          required
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
          ]}
        />
      </Field>

      <Field label="Importance:" htmlFor="importance">
        <Select
          id="importance"
          name="importance"
          value={formData.importance}
          onChange={handleChange}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
            { value: 'low', label: 'Low' },
          ]}
        />
      </Field>

      <Field label="Who is this?" htmlFor="recall">
        <input
          type="text"
          id="recall"
          name="recall"
          maxLength={80}
          placeholder="e.g. Tom's sister, barista at Txt"
          value={formData.recall ?? ''}
          onChange={handleChange}
        />
      </Field>

      {colorGroups && Object.keys(colorGroups).length > 0 && (
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

      <button
        type="button"
        className={styles.advancedToggle}
        onClick={onToggleAdvanced}
        aria-expanded={advancedOpen}
      >
        {advancedOpen ? '▾ Advanced' : '▸ Advanced'}
      </button>

      {advancedOpen && (
        <>
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
        </>
      )}

      {confirmMessage && <p className={styles.confirmMessage}>{confirmMessage}</p>}

      <button type="submit" className={styles.submitButton}>
        {buttonText}
      </button>
      {onDelete && (
        <button type="button" className={`${styles.submitButton} ${styles.deleteButton}`} onClick={onDelete}>
          Delete Person
        </button>
      )}
    </form>
  );
}

export default PersonForm;
