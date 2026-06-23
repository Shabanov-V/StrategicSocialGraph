# Domain Model — socialGraph

The ubiquitous language of the social-graph visualizer. Use these terms in code, tests, and design discussion.

> **Platform constraint: mobile-first.** The primary experience is a phone. Touch is the primary input (hardware keyboard nav is a desktop-only enhancement, never required); detail surfaces are bottom sheets; "focus" and overlay placement must assume a small screen partly covered by the soft keyboard and the open detail sheet.

## Graph Document

The single YAML document that drives the entire app — the one domain object every editor touches. It holds `center`, `people`, `peer_connections`, `layout`, and `display`. It is the app's source of truth, kept as a string in React state and re-derived on change.

The **Graph Document module** (`client/src/graph-document/`) is the deep module that owns this document: it parses, mutates, and serializes it behind a small string-in / string-out interface, so no editor parses YAML itself.

- **Interface:** every mutation is `(yamlText, args) ⇒ yamlText`; reads are `(yamlText) ⇒ value`.
- **Fidelity:** mutations preserve comments and formatting (CST-backed, via the `yaml` package) — not a lossy `load`/`dump` roundtrip.
- **Error mode:** unparseable input throws a typed `GraphDocumentError`; so do violated invariants.
- **Canonical shape:** people live under `people` only (the legacy `nodes` key is dropped).

## Center

The name of the central person (`center`). Rendered as the fixed node at the middle of the graph.

## Person

An entry in `people`, identified by a numeric `id`. Carries `name`, `sector`, `circle`, `importance`, `strength`, `direction`, `quality`, `color_group`, `recall`. Invariant: `circle ∈ {1, 2, 3}`; `name` and `sector` are required.

## Recall

An optional short phrase on a Person describing **how the user knows them** — "Tom's sister", "barista at Txt café". It is the identity anchor that survives memory decay: when the `name` label alone no longer says who the person is months later, the recall phrase re-identifies them.

Distinct from two neighbours it is often confused with:

- **`name`** is the *display label* and the connection key (peer connections reference it). Recall never participates in edge integrity — renaming a person does not touch `recall`.
- **`notes`** is a *time-series log* (appended over time, e.g. by Daily Check-in). Recall is a *single stable descriptor*, not a journal entry.

## Peer Connection

An edge in `peer_connections` between two people, referenced **by name** (`from`/`to`) — not by id. This name reference is the integrity hazard the module owns:

- **removePerson** cascades — deletes connections naming that person.
- **editPerson** cascades a rename — rewrites every `from`/`to` matching the old name, so edges follow the rename instead of orphaning.

## Sector

A named slice of the graph (e.g. "Family", "Work"). A person belongs to one sector. The sector list a form offers is the **union** of sectors used by people and the keys of `layout.sector_distribution`.

## Circle

The closeness ring of a person to the center: `1` (closest), `2`, or `3`.

## Layout / Display

Top-level config subtrees of the Graph Document. `layout` holds `sector_distribution` and `positioning_rules`; `display` holds `colors`, `line_styles`, `point_styles`, and toggles. Edited generically via the module's path operations (`getIn` / `setIn` / `deleteIn`), which preserve comments.

## Selected Person

The Person the user is currently acting on, identified by `id` — never by `name`. Selection is **first-class and independent of the graph render**: it can be set by clicking a node in the SVG *or* by clicking a row in the [Directory](#directory). `name` is a display label that can collide or be renamed, so it is never the selection key. (Supersedes the old SVG-only `selectedNode`, a d3 datum that keyed notes by name.)

## Person Detail

The single surface that shows and edits one [Selected Person](#selected-person): their [Recall](#recall), their [notes](#person), and a jump-to-edit. It is keyed by `id` and has **two entry points** — a graph-node tap and a [Graph Search](#graph-search) pick — but is one surface, not two divergent note UIs. On mobile it is a **bottom sheet** (`NodePanel`); the [Graph Search](#graph-search) focus pan lands the node in the clear area *above* the sheet, not under it.

## Check-in Day

The logical day the [Daily Check-in](#person) panel operates on — **not** the raw calendar date. The day boundary is **03:00 local time**, not midnight: the window 00:00–02:59 belongs to the *previous* Check-in Day. Defined as the calendar date of `now − 3h`.

Rationale: a contact logged late at night (e.g. 01:30) belongs to the day the user is still "living", not the calendar date that already ticked over. A fresh, empty check-in only begins at 03:00.

The Check-in Day is the single notion of "today" the check-in feature uses — it seeds which people are pre-checked, the date written to the contact log on save, the "today" label, and the `formatLastContact` "today"/"<n>d" math. All derive from one producer (`todayISO`), so the boundary lives in exactly one place.

## Graph Search

A search box overlaid on the graph that finds a [Person](#person) by text and takes the user to them — the non-hunting way to reach a [Selected Person](#selected-person). Two effects on pick: it **selects** the Person (opens [Person Detail](#person-detail)) and **focuses** them (pans/zooms the graph to center their node). It does *not* highlight the node with a ring.

- **Search key:** matches `name` **and** [Recall](#recall) — because Recall is the identity anchor when the name is the thing the user has half-forgotten. Same name+recall list pattern Daily Check-in uses, repurposed for selection rather than contact-logging.
- **Scope:** [people](#person) only (id-keyed). The [Center](#center) is excluded — it has no `id`, holds no notes, and already sits fixed in the middle, so there is nothing to search-focus.
- **Focus:** an animated pan + modest zoom to the node's current simulated position, not a snap. The pan target is **offset** so the node settles in the visible area above the open [Person Detail](#person-detail) bottom sheet, not at geometric center.
