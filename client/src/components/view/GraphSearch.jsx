import React, { useState } from 'react';
import styles from './GraphSearch.module.css';

// Always-on search box overlaid on the graph. Owns search UI only: filter the
// people list by text, fire onSelect(id) on pick. Focus/pan is the caller's job.
function GraphSearch({ people, onSelect }) {
  const [term, setTerm] = useState('');

  const pick = (id) => {
    onSelect(id);
    setTerm('');
  };

  const q = term.trim().toLowerCase();
  const matches = q
    ? people.filter(p =>
        `${p.name} ${p.recall ?? ''}`.toLowerCase().includes(q),
      )
    : [];

  return (
    <div>
      <input
        className={styles.input}
        type="text"
        placeholder="Search people…"
        value={term}
        onChange={e => setTerm(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className={styles.dropdown}>
          {matches.map(p => (
            <li key={p.id}>
              <button type="button" className={styles.row} onClick={() => pick(p.id)}>
                <span className={styles.name}>{p.name}</span>
                {p.recall && <small className={styles.recall}>{p.recall}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GraphSearch;
