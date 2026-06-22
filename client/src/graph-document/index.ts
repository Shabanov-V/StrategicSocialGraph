import { isMap, isScalar } from 'yaml';
import { parse, serialize } from './cst';
import {
  GraphDocumentError,
  type Connection,
  type NoteEntry,
  type Person,
  type PersonDraft,
} from './types';

export { GraphDocumentError } from './types';
export type { Person, PersonDraft, Connection, Circle, NoteEntry } from './types';

/** Throw GraphDocumentError if any supplied person field violates an invariant. */
function validatePersonFields(fields: Partial<Person>): void {
  if ('name' in fields && (fields.name == null || String(fields.name).trim() === '')) {
    throw new GraphDocumentError('name is required');
  }
  if ('circle' in fields && ![1, 2, 3].includes(Number(fields.circle))) {
    throw new GraphDocumentError('circle must be 1, 2, or 3');
  }
}

/** The whole document as a plain JS object (empty object for empty input). */
export function read(yamlText: string): Record<string, unknown> {
  return (parse(yamlText).toJS() as Record<string, unknown>) ?? {};
}

/** All people in the document, in document order. */
export function listPeople(yamlText: string): Person[] {
  const doc = parse(yamlText);
  const people = doc.get('people');
  if (people == null) return [];
  return (doc.toJS().people ?? []) as Person[];
}

/** All peer connections in the document, in document order. */
export function listConnections(yamlText: string): Connection[] {
  const doc = parse(yamlText);
  if (doc.get('peer_connections') == null) return [];
  return (doc.toJS().peer_connections ?? []) as Connection[];
}

/** Append a peer connection, creating the list if absent. */
export function addConnection(yamlText: string, connection: Connection): string {
  const doc = parse(yamlText);
  if (doc.get('peer_connections') == null) {
    doc.set('peer_connections', doc.createNode([]));
  }
  doc.addIn(['peer_connections'], { ...connection });
  return serialize(doc);
}

/** Merge a patch into the peer connection between two people (either direction). No-op if none matches. */
export function editConnection(
  yamlText: string,
  a: string,
  b: string,
  patch: Partial<Connection>,
): string {
  const connections = listConnections(yamlText);
  const index = connections.findIndex(
    (c) => (c.from === a && c.to === b) || (c.from === b && c.to === a),
  );
  if (index === -1) return yamlText;

  const doc = parse(yamlText);
  for (const [key, value] of Object.entries(patch)) {
    doc.setIn(['peer_connections', index, key], value);
  }
  return serialize(doc);
}

/** Remove the peer connection between two people, in either direction. */
export function removeConnection(yamlText: string, a: string, b: string): string {
  const doc = parse(yamlText);
  const connections = listConnections(yamlText);
  for (let i = connections.length - 1; i >= 0; i -= 1) {
    const c = connections[i];
    if ((c.from === a && c.to === b) || (c.from === b && c.to === a)) {
      doc.deleteIn(['peer_connections', i]);
    }
  }
  return serialize(doc);
}

/**
 * Patch a person by id. If the patch renames them, cascade the new name across
 * every peer connection that referenced the old name. A no-op if no such person.
 */
export function editPerson(
  yamlText: string,
  id: number,
  patch: Partial<Person>,
): string {
  validatePersonFields(patch);
  const people = listPeople(yamlText);
  const index = people.findIndex((p) => p.id === id);
  if (index === -1) return yamlText;

  const doc = parse(yamlText);
  for (const [key, value] of Object.entries(patch)) {
    doc.setIn(['people', index, key], value);
  }

  const oldName = people[index].name;
  const newName = patch.name;
  if (newName != null && newName !== oldName) {
    const connections = listConnections(yamlText);
    connections.forEach((conn, i) => {
      if (conn.from === oldName) doc.setIn(['peer_connections', i, 'from'], newName);
      if (conn.to === oldName) doc.setIn(['peer_connections', i, 'to'], newName);
    });
  }
  return serialize(doc);
}

/**
 * Remove a person by id and cascade: drop every peer connection that names them.
 * A no-op (returns input unchanged) if no person has that id.
 */
export function removePerson(yamlText: string, id: number): string {
  const person = listPeople(yamlText).find((p) => p.id === id);
  if (!person) return yamlText;

  const doc = parse(yamlText);
  const name = person.name;

  const peopleIndex = listPeople(yamlText).findIndex((p) => p.id === id);
  doc.deleteIn(['people', peopleIndex]);

  const connections = listConnections(yamlText);
  for (let i = connections.length - 1; i >= 0; i -= 1) {
    if (connections[i].from === name || connections[i].to === name) {
      doc.deleteIn(['peer_connections', i]);
    }
  }
  return serialize(doc);
}

/** A person's free-text log entries, in document order; empty list if none. */
export function listNotes(yamlText: string, id: number): NoteEntry[] {
  const person = listPeople(yamlText).find((p) => p.id === id);
  return (person?.notes ?? []) as NoteEntry[];
}

/** Append a dated log entry to a person, creating the list if absent. No-op for an unknown id. */
export function addNote(yamlText: string, id: number, entry: NoteEntry): string {
  const index = listPeople(yamlText).findIndex((p) => p.id === id);
  if (index === -1) return yamlText;

  const doc = parse(yamlText);
  if (doc.getIn(['people', index, 'notes']) == null) {
    doc.setIn(['people', index, 'notes'], doc.createNode([]));
  }
  doc.addIn(['people', index, 'notes'], { ...entry });
  return serialize(doc);
}

/** Remove the log entry at the given index from a person. No-op for an unknown id. */
export function removeNote(yamlText: string, id: number, noteIndex: number): string {
  const index = listPeople(yamlText).findIndex((p) => p.id === id);
  if (index === -1) return yamlText;

  const doc = parse(yamlText);
  doc.deleteIn(['people', index, 'notes', noteIndex]);
  return serialize(doc);
}

/**
 * Sectors a form should offer: the union of sectors used by people and the keys
 * of layout.sector_distribution, deduped and case-insensitively sorted.
 */
export function listSectors(yamlText: string): string[] {
  const doc = parse(yamlText);
  const data = doc.toJS() ?? {};
  const sectors = new Set<string>();

  for (const person of (data.people ?? []) as Person[]) {
    const s = person?.sector != null ? String(person.sector).trim() : '';
    if (s) sectors.add(s);
  }
  const distribution = data.layout?.sector_distribution;
  if (distribution && typeof distribution === 'object') {
    for (const key of Object.keys(distribution)) {
      const s = String(key).trim();
      if (s) sectors.add(s);
    }
  }
  return [...sectors].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

export type Path = (string | number)[];

/** Read a nested value by path as plain JS; undefined if the path is absent. */
export function getIn(yamlText: string, path: Path): unknown {
  let current: unknown = parse(yamlText).toJS();
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/** Write a nested value by path, creating intermediate maps; preserves comments. */
export function setIn(yamlText: string, path: Path, value: unknown): string {
  const doc = parse(yamlText);
  doc.setIn(path, value);
  return serialize(doc);
}

/** Delete a nested key by path; preserves comments elsewhere. */
export function deleteIn(yamlText: string, path: Path): string {
  const doc = parse(yamlText);
  doc.deleteIn(path);
  return serialize(doc);
}

/**
 * Rename a map key in place at `path`, keeping its position, value, and comments.
 * Unlike deleteIn + setIn (which appends the new key at the map's end), this leaves
 * the entry where it was — so a form rendering the map keeps stable row order and focus.
 * No-op (returns input unchanged) if oldKey is unchanged, newKey is empty, or oldKey is absent.
 */
export function renameKey(
  yamlText: string,
  path: Path,
  oldKey: string | number,
  newKey: string | number,
): string {
  if (oldKey === newKey || newKey === '') return yamlText;
  const doc = parse(yamlText);
  const node = doc.getIn(path, true);
  if (!isMap(node)) return yamlText;
  const pair = node.items.find((p) => {
    const k = isScalar(p.key) ? p.key.value : p.key;
    return String(k) === String(oldKey);
  });
  if (!pair) return yamlText;
  pair.key = doc.createNode(newKey);
  return serialize(doc);
}

/**
 * Rename a display.colors group in place and cascade the new name to every person
 * and connection that referenced it — so already-colored nodes keep their color
 * instead of orphaning to the fallback. No-op if unchanged or newName is empty.
 */
export function renameColorGroup(
  yamlText: string,
  oldName: string,
  newName: string,
): string {
  if (oldName === newName || newName === '') return yamlText;
  const doc = parse(renameKey(yamlText, ['display', 'colors'], oldName, newName));
  const data = (doc.toJS() ?? {}) as {
    people?: Person[];
    peer_connections?: Connection[];
  };
  (data.people ?? []).forEach((p, i) => {
    if (p?.color_group === oldName) doc.setIn(['people', i, 'color_group'], newName);
  });
  (data.peer_connections ?? []).forEach((c, i) => {
    if (c?.color_group === oldName) doc.setIn(['peer_connections', i, 'color_group'], newName);
  });
  return serialize(doc);
}

/** Color group names: the keys of display.colors, in document order. */
export function listColorGroups(yamlText: string): string[] {
  const doc = parse(yamlText);
  const colors = doc.toJS()?.display?.colors;
  if (!colors || typeof colors !== 'object') return [];
  return Object.keys(colors);
}

/** Smallest free positive integer id not already used by a person. */
export function nextPersonId(yamlText: string): number {
  const used = new Set<number>();
  for (const person of listPeople(yamlText)) {
    const n = Number(person.id);
    if (Number.isInteger(n) && n > 0) used.add(n);
  }
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

/** Append a person to the document. */
export function addPerson(yamlText: string, draft: PersonDraft): string {
  validatePersonFields(draft);
  const id = draft.id ?? nextPersonId(yamlText);
  const doc = parse(yamlText);
  if (doc.get('people') == null) {
    doc.set('people', doc.createNode([]));
  }
  doc.addIn(['people'], { ...draft, id });
  return serialize(doc);
}
