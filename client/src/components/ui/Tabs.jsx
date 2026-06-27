import React from 'react';
import styles from './Tabs.module.css';

function Tabs({ tabs, active, onChange }) {
  const idx = tabs.findIndex((t) => t.id === active);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') onChange(tabs[(idx + 1) % tabs.length].id);
    if (e.key === 'ArrowLeft') onChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
  }

  return (
    <div className={styles.tablist} role="tablist" onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={[styles.tab, selected ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
