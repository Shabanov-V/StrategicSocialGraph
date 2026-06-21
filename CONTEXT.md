# Domain Model — socialGraph

The ubiquitous language of the social-graph visualizer. Use these terms in code, tests, and design discussion.

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

An entry in `people`, identified by a numeric `id`. Carries `name`, `sector`, `circle`, `importance`, `strength`, `direction`, `quality`, `color_group`. Invariant: `circle ∈ {1, 2, 3}`; `name` and `sector` are required.

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
