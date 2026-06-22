# Graph-view edit-jump keys the person by `id`, not `name`

The graph view's node panel has an "Изменить" (edit) link that switches the left panel to the InteractivePanel and preselects the tapped person. We key that jump by the node's numeric `id` (lifted into App as `editTargetId`), **not** by `name` — even though the sibling note handlers (`handleAddNote`/`handleRemoveNote`) and `peer_connections` both reference people by `name`.

We chose `id` because the feature exists to defeat first-name ambiguity (the user adds "Sarah", forgets who she is, and may have several Sarahs). Keying the jump by `name` would reintroduce exactly that ambiguity — `people.find(p => p.name === ...)` resolves to whichever Sarah is first. The node already carries the numeric `id` (`d3-helper.js` spreads `...person` last, overwriting the `id: person.name` used for d3 link resolution), so `selectedNode.id` is available with no extra plumbing.

Consequence: a reader will notice the inconsistency (notes by name, edit-jump by id). The name-based note lookups are a pre-existing wart we deliberately did not expand; the integrity hazard of name-as-key is documented under "Peer Connection" in `CONTEXT.md`.
