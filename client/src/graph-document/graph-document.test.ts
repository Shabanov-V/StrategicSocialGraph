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
  removePerson,
  editPerson,
  addConnection,
  removeConnection,
  nextPersonId,
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
