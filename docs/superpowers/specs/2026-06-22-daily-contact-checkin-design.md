# Daily Contact Check-in — Design

**Date:** 2026-06-22
**Status:** Approved (design), pending implementation plan
**Scope:** Check-in panel + `contacts` data model only. Graph overdue-highlight is a separate later spec.

## Problem

At the end of a day the user wants a fast way to mark everyone they had contact
with, so the record can later drive analytics — e.g. surfacing people they
haven't contacted in a long time. This spec delivers the logging mechanism and
immediate per-person "last contact" feedback. It does **not** add graph
highlighting.

## Data model

Each person gains an optional `contacts` field: a list of ISO date strings
(`YYYY-MM-DD`), kept **sorted ascending and deduped**.

```yaml
people:
  - id: 1
    name: Renat
    circle: 1
    contacts: [2026-06-20, 2026-06-22]
```

- Dates are local calendar dates, not timestamps — one entry per day max.
- Stored inline on the person node, keyed implicitly by the person's `id`.
- A person with no recorded contact simply has no `contacts` field.
- Persistence is automatic: the field rides the single YAML document already
  saved to localStorage and cloud-synced via `setYamlText`.

The `Person` type (`graph-document/types.ts`) gains `contacts?: string[]`.

## Module seam (`graph-document`)

All mutation logic lives in the document module, mirroring the existing
`editPerson` / `setIn` style. The React panel stays a dumb view.

- **`getContactDates(yamlText, id): string[]`**
  Returns a person's contact dates (empty array if none or person absent).

- **`setContactsForDate(yamlText, date, ids): string`**
  The Save operation. Makes "the set of people contacted on `date`" exactly
  equal `ids`:
  - For each id in `ids`: ensure `date` is present in that person's `contacts`
    (insert if missing, keep sorted, no duplicates).
  - For each person **not** in `ids` who currently has `date`: remove `date`
    from their `contacts`.
  - All other dates on all people are left untouched.
  - Removing the last date leaves an empty list (or omits the field — either is
    acceptable as long as `getContactDates` returns `[]`).
  - No-op semantics: passing the same set that already matches returns
    equivalent YAML (idempotent).

This single call expresses the agreed "sync today's set" behaviour, including
reversible same-day corrections (unchecking removes today's date).

## Date util (`utils/contact-time.js`)

View-layer date math, kept out of the document module:

- **`todayISO(): string`** — today's **local** calendar date as `YYYY-MM-DD`.
  Must use local date components, not `toISOString()` (which is UTC and can be
  off by a day near midnight).
- **`daysSince(isoDate, today): number`** — whole days between two ISO dates.
- **`formatLastContact(dates, today): string`** — given a person's `contacts`,
  returns `"never"` when empty, `"today"` for 0 days, otherwise `"<n>d"` using
  the most recent date.

## UI — `DailyCheckin` panel

New component `components/panels/DailyCheckin.jsx`, props `{ yamlText, setYamlText }`,
consistent with the other editor panels.

```
Daily Check-in                 2026-06-22
search: [____________]
-- Circle 1 --
[x] Renat     important   today
[ ] Sergey    important   15d
[ ] Kostya    normal      3d
-- Circle 2 --
[ ] ...
-- Circle 3 --
[ ] ...
                    [ Save today's contacts ]
```

Behaviour:

- Reads `listPeople(yamlText)`, groups by `circle` (1 → 2 → 3). Within a group,
  sort importance-first (`important` before others) then by name.
- Local state is a `Set` of checked ids, **initialised** from the people whose
  `contacts` include `todayISO()` — so re-opening the panel the same day shows
  what's already logged, pre-checked.
- Each row: checkbox, name, importance tag, last-contact age via
  `formatLastContact`.
- Search box filters the visible rows by name (case-insensitive substring);
  group headings for empty groups are hidden.
- **Save** calls `setContactsForDate(yamlText, todayISO(), [...checkedIds])`
  then `setYamlText`. Reversible same-day edits fall out of the sync semantics.

### Wiring

- Add a panel/view key in `App.jsx`'s panel switch alongside Code / Interactive /
  Connection / Config.
- Add a corresponding nav entry in the sidebar.

## Testing

- `graph-document` tests:
  - `setContactsForDate` adds `date` to listed people, deduped and sorted.
  - `setContactsForDate` removes `date` from a person dropped from the set,
    while keeping their other dates.
  - Idempotent re-save with the same set.
  - Person with no prior `contacts` field.
  - `getContactDates` returns `[]` for unknown id / no field.
- `contact-time` util tests: `daysSince`, `formatLastContact` including
  `"never"` and `"today"`, and a local-date boundary case for `todayISO`.
- `DailyCheckin.test.jsx`: rows for people contacted today render pre-checked;
  Save syncs the set (checking adds today, unchecking removes today, older dates
  preserved).

## Out of scope (future specs)

- Graph node highlighting / fading by overdue-ness.
- Frequency / streak analytics beyond "last contact".
- Bulk import of historical contact data.
