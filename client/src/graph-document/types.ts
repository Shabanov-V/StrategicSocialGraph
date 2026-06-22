export type Circle = 1 | 2 | 3;

/** A single free-text log entry attached to a person, stamped with the date added. */
export interface NoteEntry {
  date: string;
  text: string;
}

export interface Person {
  id: number;
  name: string;
  sector: string;
  circle: Circle;
  importance?: string;
  strength?: string;
  direction?: string;
  quality?: string;
  color_group?: string;
  notes?: NoteEntry[];
  /** ISO dates (YYYY-MM-DD) on which this person was contacted; sorted, deduped. */
  contacts?: string[];
}

/** Fields a caller supplies when adding a person; id is assigned by the module. */
export type PersonDraft = Omit<Person, 'id'> & { id?: number };

export interface Connection {
  from: string;
  to: string;
  strength?: string;
  direction?: string;
  quality?: string;
  color_group?: string;
}

export class GraphDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphDocumentError';
  }
}
