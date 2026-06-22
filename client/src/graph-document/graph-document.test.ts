import { describe, it, expect } from 'vitest';
import {
  addPerson,
  listPeople,
  listConnections,
  listSectors,
  listColorGroups,
  getIn,
  setIn,
  deleteIn,
  renameKey,
  renameColorGroup,
  removePerson,
  editPerson,
  addConnection,
  removeConnection,
  editConnection,
  nextPersonId,
  listNotes,
  addNote,
  removeNote,
  getContactDates,
  setContactsForDate,
  read,
  GraphDocumentError,
} from './index';

const BASE = `center: Alex
people:
  - id: 1
    name: Mom
    sector: Family
    circle: 1
`;

describe('addPerson', () => {
  it('appends a person to the document', () => {
    const out = addPerson(BASE, {
      name: 'Bob',
      sector: 'Work',
      circle: 2,
    });
    const people = listPeople(out);
    expect(people.map((p) => p.name)).toEqual(['Mom', 'Bob']);
  });

  it('assigns the next free id when the draft has none', () => {
    const out = addPerson(BASE, { name: 'Bob', sector: 'Work', circle: 2 });
    const bob = listPeople(out).find((p) => p.name === 'Bob');
    expect(bob?.id).toBe(2);
  });

  it('preserves comments elsewhere in the document', () => {
    const withComment = `# my social graph\ncenter: Alex\npeople:\n  - id: 1\n    name: Mom # closest\n    sector: Family\n    circle: 1\n`;
    const out = addPerson(withComment, { name: 'Bob', sector: 'Work', circle: 2 });
    expect(out).toContain('# my social graph');
    expect(out).toContain('# closest');
  });
});

describe('recall', () => {
  it('round-trips a recall phrase through addPerson', () => {
    const out = addPerson(BASE, {
      name: 'Sarah',
      sector: 'Work',
      circle: 2,
      recall: "Tom's sister",
    });
    const sarah = listPeople(out).find((p) => p.name === 'Sarah');
    expect(sarah?.recall).toBe("Tom's sister");
  });

  it('sets recall via editPerson, leaving other fields and comments intact', () => {
    const withComment = `center: Alex
people:
  - id: 1
    name: Mom # closest
    sector: Family
    circle: 1
`;
    const out = editPerson(withComment, 1, { recall: 'my mother' });
    const mom = listPeople(out).find((p) => p.id === 1);
    expect(mom?.recall).toBe('my mother');
    expect(mom?.sector).toBe('Family');
    expect(mom?.circle).toBe(1);
    expect(out).toContain('# closest');
  });

  it('leaves recall undefined when none was supplied', () => {
    const out = addPerson(BASE, { name: 'Bob', sector: 'Work', circle: 2 });
    const bob = listPeople(out).find((p) => p.name === 'Bob');
    expect(bob?.recall).toBeUndefined();
    expect(out).not.toContain('recall');
  });
});

describe('nextPersonId', () => {
  it('returns the smallest free positive id, skipping gaps', () => {
    const yaml = `people:\n  - id: 1\n    name: A\n  - id: 3\n    name: C\n`;
    expect(nextPersonId(yaml)).toBe(2);
  });

  it('returns 1 when there are no people', () => {
    expect(nextPersonId('center: Alex\n')).toBe(1);
  });
});

const NETWORK = `center: Alex
people:
  - id: 1
    name: Mom
    sector: Family
    circle: 1
  - id: 2
    name: Dad
    sector: Family
    circle: 1
peer_connections:
  - from: Mom
    to: Dad
    strength: strong
`;

describe('listConnections', () => {
  it('returns the peer connections', () => {
    expect(listConnections(NETWORK)).toEqual([
      { from: 'Mom', to: 'Dad', strength: 'strong' },
    ]);
  });

  it('returns an empty list when there are none', () => {
    expect(listConnections('center: Alex\n')).toEqual([]);
  });
});

describe('removePerson', () => {
  it('removes the person and cascades to their connections', () => {
    const out = removePerson(NETWORK, 1); // Mom
    expect(listPeople(out).map((p) => p.name)).toEqual(['Dad']);
    expect(listConnections(out)).toEqual([]);
  });
});

describe('editPerson', () => {
  it('updates the person record', () => {
    const out = editPerson(NETWORK, 1, { circle: 2 });
    const mom = listPeople(out).find((p) => p.id === 1);
    expect(mom?.circle).toBe(2);
  });

  it('cascades a rename to the person connections', () => {
    const out = editPerson(NETWORK, 1, { name: 'Mama' });
    expect(listPeople(out).find((p) => p.id === 1)?.name).toBe('Mama');
    expect(listConnections(out)).toEqual([
      { from: 'Mama', to: 'Dad', strength: 'strong' },
    ]);
  });
});

describe('notes', () => {
  it('listNotes returns an empty list when a person has none', () => {
    expect(listNotes(NETWORK, 1)).toEqual([]);
  });

  it('addNote appends an entry, creating the list if absent', () => {
    const out = addNote(NETWORK, 1, { date: '2026-06-22', text: 'met at conf' });
    expect(listNotes(out, 1)).toEqual([{ date: '2026-06-22', text: 'met at conf' }]);
  });

  it('addNote appends in order, newest last', () => {
    let out = addNote(NETWORK, 1, { date: '2026-06-01', text: 'first' });
    out = addNote(out, 1, { date: '2026-06-22', text: 'second' });
    expect(listNotes(out, 1)).toEqual([
      { date: '2026-06-01', text: 'first' },
      { date: '2026-06-22', text: 'second' },
    ]);
  });

  it('addNote is a no-op for an unknown id', () => {
    const out = addNote(NETWORK, 999, { date: '2026-06-22', text: 'x' });
    expect(out).toBe(NETWORK);
  });

  it('removeNote drops the entry at the given index', () => {
    let out = addNote(NETWORK, 1, { date: '2026-06-01', text: 'first' });
    out = addNote(out, 1, { date: '2026-06-22', text: 'second' });
    out = removeNote(out, 1, 0);
    expect(listNotes(out, 1)).toEqual([{ date: '2026-06-22', text: 'second' }]);
  });

  it('preserves comments when adding a note', () => {
    const withComment = `# graph\n${NETWORK}`;
    const out = addNote(withComment, 1, { date: '2026-06-22', text: 'hi' });
    expect(out).toContain('# graph');
  });
});

describe('validation', () => {
  it('rejects a person whose circle is out of range', () => {
    expect(() => addPerson(BASE, { name: 'X', sector: 'Work', circle: 5 as never })).toThrow(
      GraphDocumentError,
    );
  });

  it('rejects a person with a blank name', () => {
    expect(() => addPerson(BASE, { name: '', sector: 'Work', circle: 2 })).toThrow(
      GraphDocumentError,
    );
  });

  it('rejects editing a circle out of range', () => {
    expect(() => editPerson(NETWORK, 1, { circle: 9 as never })).toThrow(GraphDocumentError);
  });
});

describe('parse errors', () => {
  it('throws GraphDocumentError on unparseable YAML', () => {
    const broken = 'people:\n  - id: 1\n   name: bad indent\n';
    expect(() => listPeople(broken)).toThrow(GraphDocumentError);
    expect(() => addPerson(broken, { name: 'X', sector: 'Y', circle: 1 })).toThrow(
      GraphDocumentError,
    );
  });
});

describe('connections', () => {
  it('addConnection appends an edge, creating the list if absent', () => {
    const out = addConnection(BASE, { from: 'Mom', to: 'Alex', strength: 'weak' });
    expect(listConnections(out)).toEqual([
      { from: 'Mom', to: 'Alex', strength: 'weak' },
    ]);
  });

  it('removeConnection drops the matching edge regardless of direction', () => {
    const out = removeConnection(NETWORK, 'Dad', 'Mom');
    expect(listConnections(out)).toEqual([]);
  });
});

describe('listSectors', () => {
  it('unions people sectors with layout.sector_distribution keys, deduped and sorted', () => {
    const yaml = `people:
  - id: 1
    name: A
    sector: Work
  - id: 2
    name: B
    sector: Family
layout:
  sector_distribution:
    Family: 180
    Hobbies: 180
`;
    expect(listSectors(yaml)).toEqual(['Family', 'Hobbies', 'Work']);
  });
});

describe('listColorGroups', () => {
  it('returns the keys of display.colors', () => {
    const yaml = `display:\n  colors:\n    friend: '#0f0'\n    family: '#00f'\n`;
    expect(listColorGroups(yaml)).toEqual(['friend', 'family']);
  });

  it('returns an empty list when display.colors is absent', () => {
    expect(listColorGroups('center: Alex\n')).toEqual([]);
  });
});

describe('config path operations', () => {
  const cfg = `# config\ndisplay:\n  colors:\n    friend: '#0f0'\n`;

  it('getIn reads a nested value', () => {
    expect(getIn(cfg, ['display', 'colors', 'friend'])).toBe('#0f0');
  });

  it('getIn returns undefined for a missing path', () => {
    expect(getIn(cfg, ['layout', 'angle_spread'])).toBeUndefined();
  });

  it('setIn writes a nested value, creating intermediates, preserving comments', () => {
    const out = setIn(cfg, ['layout', 'positioning_rules', 'angle_spread'], 30);
    expect(getIn(out, ['layout', 'positioning_rules', 'angle_spread'])).toBe(30);
    expect(out).toContain('# config');
  });

  it('deleteIn removes a nested key', () => {
    const out = deleteIn(cfg, ['display', 'colors', 'friend']);
    expect(getIn(out, ['display', 'colors', 'friend'])).toBeUndefined();
  });
});

describe('renameKey', () => {
  const cfg = `display:\n  colors:\n    friend: '#0f0'\n    family: '#00f'\n    work: '#f00'\n`;

  it('renames a map key in place, preserving its position', () => {
    const out = renameKey(cfg, ['display', 'colors'], 'friend', 'buddy');
    expect(listColorGroups(out)).toEqual(['buddy', 'family', 'work']);
    expect(getIn(out, ['display', 'colors', 'buddy'])).toBe('#0f0');
  });

  it('preserves the value while renaming', () => {
    const out = renameKey(cfg, ['display', 'colors'], 'family', 'kin');
    expect(getIn(out, ['display', 'colors', 'kin'])).toBe('#00f');
    expect(getIn(out, ['display', 'colors', 'family'])).toBeUndefined();
  });

  it('is a no-op when the key is unchanged, empty, or absent', () => {
    expect(renameKey(cfg, ['display', 'colors'], 'friend', 'friend')).toBe(cfg);
    expect(renameKey(cfg, ['display', 'colors'], 'friend', '')).toBe(cfg);
    expect(renameKey(cfg, ['display', 'colors'], 'nope', 'x')).toBe(cfg);
  });
});

describe('renameColorGroup', () => {
  const yaml = `display:
  colors:
    friend: '#0f0'
    family: '#00f'
people:
  - id: 1
    name: Mom
    color_group: family
  - id: 2
    name: Pat
    color_group: friend
peer_connections:
  - from: Mom
    to: Pat
    color_group: friend
`;

  it('renames the color in place and cascades to people and connections', () => {
    const out = renameColorGroup(yaml, 'friend', 'buddy');
    expect(listColorGroups(out)).toEqual(['buddy', 'family']);
    expect(getIn(out, ['people', 0, 'color_group'])).toBe('family');
    expect(getIn(out, ['people', 1, 'color_group'])).toBe('buddy');
    expect(getIn(out, ['peer_connections', 0, 'color_group'])).toBe('buddy');
  });
});

describe('contact log', () => {
  const PEOPLE = `people:
  - id: 1
    name: Mom
    circle: 1
  - id: 2
    name: Dad
    circle: 1
`;

  it('getContactDates returns [] for a person with no contacts', () => {
    expect(getContactDates(PEOPLE, 1)).toEqual([]);
  });

  it('getContactDates returns [] for an unknown id', () => {
    expect(getContactDates(PEOPLE, 99)).toEqual([]);
  });

  it('setContactsForDate adds the date to listed people, sorted and deduped', () => {
    let out = setContactsForDate(PEOPLE, '2026-06-22', [1]);
    out = setContactsForDate(out, '2026-06-20', [1]);
    expect(getContactDates(out, 1)).toEqual(['2026-06-20', '2026-06-22']);
    expect(getContactDates(out, 2)).toEqual([]);
  });

  it('setContactsForDate is idempotent for the same date and set', () => {
    let out = setContactsForDate(PEOPLE, '2026-06-22', [1]);
    out = setContactsForDate(out, '2026-06-22', [1]);
    expect(getContactDates(out, 1)).toEqual(['2026-06-22']);
  });

  it('setContactsForDate removes the date from people dropped from the set, keeping their other dates', () => {
    let out = setContactsForDate(PEOPLE, '2026-06-20', [1]);
    out = setContactsForDate(out, '2026-06-22', [1]); // Mom: 20, 22
    out = setContactsForDate(out, '2026-06-22', [2]); // date 22 now only Dad
    expect(getContactDates(out, 1)).toEqual(['2026-06-20']); // 22 removed, 20 kept
    expect(getContactDates(out, 2)).toEqual(['2026-06-22']);
  });
});

describe('read', () => {
  it('returns the whole document as a plain object', () => {
    expect(read(NETWORK)).toMatchObject({
      center: 'Alex',
      people: [{ id: 1, name: 'Mom' }, { id: 2, name: 'Dad' }],
    });
  });

  it('returns an empty object for empty input', () => {
    expect(read('')).toEqual({});
  });
});

describe('editConnection', () => {
  it('merges a patch into the matching edge, in either direction', () => {
    const out = editConnection(NETWORK, 'Dad', 'Mom', { strength: 'weak' });
    expect(listConnections(out)).toEqual([
      { from: 'Mom', to: 'Dad', strength: 'weak' },
    ]);
  });

  it('is a no-op when no edge matches', () => {
    const out = editConnection(NETWORK, 'Mom', 'Nobody', { strength: 'weak' });
    expect(out).toBe(NETWORK);
  });
});
