import React from 'react';
import styles from './D3Graph.module.css';
import IconButton from '../ui/IconButton';

// Presentational detail panel for a selected graph node. Kept free of d3 so its
// behavior (recall display, edit-jump, notes) is testable without the SVG.
function NodePanel({
  node,
  recall,
  notes,
  noteInput,
  onNoteInputChange,
  onAddNote,
  onRemoveNote,
  onClose,
  onEditPerson,
}) {
  if (!node) return null;
  const isCenter = node.type === 'center';

  return (
    <div className={styles.infoPanel}>
      <IconButton label="Закрыть" className={styles.closeBtn} onClick={onClose}>×</IconButton>
      <div className={styles.nodeName}>{node.name}</div>

      {recall && <div className={styles.nodeRecall}>{recall}</div>}

      {!isCenter && (
        <button
          type="button"
          className={styles.editBtn}
          onClick={() => onEditPerson?.(node.id)}
        >
          Изменить
        </button>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.noteInput}
          value={noteInput}
          onChange={(e) => onNoteInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAddNote();
          }}
          placeholder="Добавить заметку..."
        />
        <button className={styles.addBtn} onClick={onAddNote}>
          +
        </button>
      </div>

      {notes.length > 0 && (
        <ul className={styles.noteList}>
          {notes.map((n, i) => i).reverse().map((i) => (
            <li key={i} className={styles.noteItem}>
              <span className={styles.noteDate}>{notes[i].date}</span>
              <span className={styles.noteText}>{notes[i].text}</span>
              <button
                className={styles.noteDel}
                onClick={() => onRemoveNote?.(node, i)}
                aria-label="Удалить заметку"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NodePanel;
