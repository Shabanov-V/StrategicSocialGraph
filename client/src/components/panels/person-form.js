// Pure form logic for the interactive Add/Edit person panel.
// Kept free of React so the behavior is unit-testable in isolation.

// The advanced fields hidden behind the collapsible section, and their defaults.
export const ADVANCED_DEFAULTS = {
  strength: 'normal',
  direction: 'mutual',
  quality: 'positive',
};

export function hasNonDefaultAdvanced(person) {
  return Object.entries(ADVANCED_DEFAULTS).some(
    ([field, def]) => person[field] !== undefined && person[field] !== def
  );
}

export function blankAddForm(id = '') {
  return {
    name: '',
    id: String(id),
    sector: '',
    customSector: '',
    circle: '2', // default circle is 2
    importance: 'normal',
    ...ADVANCED_DEFAULTS,
    color_group: 'friend',
  };
}

export function stickyReset(prevForm, nextId) {
  return {
    ...prevForm,
    name: '',
    customSector: '',
    id: String(nextId),
  };
}
