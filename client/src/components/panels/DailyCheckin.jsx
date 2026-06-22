import React, { useState } from 'react';
import styles from '../common/styles.module.css';
import { listPeople, setContactsForDate } from '../../graph-document';
import { todayISO, formatLastContact } from '../../utils/contact-time';

const CIRCLES = [1, 2, 3];

// Important people first, then alphabetical — within a circle group.
const byImportanceThenName = (a, b) => {
  const ai = a.importance === 'important' ? 0 : 1;
  const bi = b.importance === 'important' ? 0 : 1;
  if (ai !== bi) return ai - bi;
  return String(a.name).localeCompare(String(b.name));
};

function DailyCheckin({ yamlText, setYamlText }) {
  const today = todayISO();
  const people = listPeople(yamlText);

  // Seed the working set once from who's already logged today; the user edits from there.
  const [checked, setChecked] = useState(
    () => new Set(people.filter(p => (p.contacts ?? []).includes(today)).map(p => p.id)),
  );
  const [search, setSearch] = useState('');

  const toggle = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    setYamlText(setContactsForDate(yamlText, today, [...checked]));
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? people.filter(p => String(p.name).toLowerCase().includes(term))
    : people;

  return (
    <div className={styles.panel} style={{ height: 'auto', minHeight: '100%' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Daily Check-in</strong>
        <span style={{ color: '#555' }}>{today}</span>
      </div>
      <div style={{ padding: '0 16px 8px' }}>
        <input
          type="text"
          placeholder="Search people…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ padding: '0 16px 32px' }}>
        {CIRCLES.map(circle => {
          const group = visible
            .filter(p => Number(p.circle) === circle)
            .sort(byImportanceThenName);
          if (group.length === 0) return null;
          return (
            <div key={circle} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.85em', color: '#888', margin: '8px 0 4px' }}>
                Circle {circle}
              </div>
              {group.map(p => (
                <label
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}
                >
                  <input
                    type="checkbox"
                    aria-label={p.name}
                    checked={checked.has(p.id)}
                    onChange={() => toggle(p.id)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {p.importance === 'important' && (
                    <span style={{ fontSize: '0.8em', color: '#a60' }}>important</span>
                  )}
                  <span style={{ fontSize: '0.8em', color: '#888', minWidth: '48px', textAlign: 'right' }}>
                    {formatLastContact(p.contacts ?? [], today)}
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 16px 24px' }}>
        <button type="button" onClick={save}>Save today's contacts</button>
      </div>
    </div>
  );
}

export default DailyCheckin;
