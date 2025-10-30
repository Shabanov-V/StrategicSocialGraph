import React from 'react';
import styles from './InteractivePanel.module.css';

function PersonForm({ formData, sectors, colorGroups, handleChange, handleSubmit, buttonText }) {
  return (
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

      <input type="hidden" id="id" name="id" value={formData.id} />

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
        <select
          id="circle"
          name="circle"
          value={formData.circle}
          onChange={handleChange}
          required
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
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
          {colorGroups && Object.keys(colorGroups).map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.submitButton}>
        {buttonText}
      </button>
    </form>
  );
}

export default PersonForm;