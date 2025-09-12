## Social Graph Visualization

This project renders a personal social graph from a simple YAML file. It visualizes your social universe around a central person, grouping people by sectors (contexts), separating them by closeness (concentric circles), and drawing optional peer-to-peer connections.

### Purpose
- **Map relationships around a central person**: who is close, which context they belong to, and how they interconnect.
- **Provide a deterministic layout** so the graph stays stable across renders given the same YAML.
- **Be editable via YAML**: non-developers can update the graph without touching code.

### What data is rendered
- **Center node**: the focal person.
- **People nodes**: individuals with sector, circle (closeness), importance, and color grouping.
- **Peer connections** (optional): relationships between any two people (or the center), with configurable strength and color group.
- **Sector guides and labels**: radial dividers and optional labels for each sector.
- **Concentric circles** (optional): visual rings for proximity levels.

### How the visualization is constructed
- **Engine**: Cytoscape.js via `react-cytoscapejs`.
- **Elements**: built by `processGraphDataForCytoscape(data)` in `src/utils/graph-helper.js`.
- **Styling**: returned by `getCytoscapeStyle(data)` from the same module.

#### Layout logic
- Each sector gets a **fixed base angle** from `layout.sector_distribution`.
- Within a sector and circle, people are spread across `positioning_rules.angle_spread` degrees.
- Each circle index uses its **own radius** from `positioning_rules.circle_radius`.
- The layout is deterministic for the same YAML input.

#### Visual encodings (final representation)
- **Node color**: `people[].color_group` mapped through `display.colors`.
- **Node size**: `people[].importance` mapped through `display.point_styles[*].size`.
- **Edge width/style**: `peer_connections[].strength` mapped through `display.line_styles`.
- **Edge color**: `peer_connections[].color_group` mapped through `display.colors`.
- **Sector dividers/labels**: optional guides and labels drawn at each sector midpoint.
- **Concentric rings**: optional circle guides at configured radii for visual reference.

#### Interactions
- Click/tap on a person or the center to see a small info panel with:
  - Name (and for people: Sector, Circle, Importance).
- Zooming and panning are enabled; bounds are constrained for usability.

### Getting started
- **Requirements**: Node.js 18+ and npm.
- **Install**:
  - `npm install`
- **Run (dev)**:
  - `npm run dev` then open the local URL shown in the terminal.
- **Build and preview**:
  - `npm run build`
  - `npm run preview`

### Editing data
- The app loads data from `public/graph.yml` on first run and caches it in `localStorage` (key: `graphYaml`).
- To update the graph:
  - Edit `public/graph.yml` and reload, or
  - Paste YAML into the in-app editor (if present), which overwrites the cached value.
- To reset to the file content, clear browser storage for the site (remove `graphYaml`).

### Key files
- `public/graph.yml`: default sample data loaded on first run.
- `graph.local.yml`: private local data example (structure-compatible with `graph.yml`).
- `src/utils/graph-helper.js`: builds Cytoscape elements and stylesheet.
- `src/components/GraphCanvas.jsx`: renders the graph and handles interactions.
- `src/App.jsx`: loads YAML, parses it, and wires data into the graph.

### Properties of the final representation
- **Deterministic**: Same YAML → same positions and styling.
- **Configurable**: Colors, sizes, edges, sector angles, spreads, and radii are YAML-driven.
- **Legible**: Sector grouping, circle separation, and labels aid quick scanning.
- **Extensible**: Add new sectors, circles, styles, or connection semantics by extending YAML and style mappings.

### Display principles (from method, distilled)
- **Center = you**: The central node represents you (`center`). Two concentric rings around it define proximity.
- **Three rings by proximity**:
  - Inner ring = Support circle (closest ties) → `circle: 1`
  - Middle ring = Productivity circle (stable ties) → `circle: 2`
  - Outer area = Development circle (new/weak ties) → `circle: 3`
  Rings are optionally drawn when `display.show_circles: true` and radii set in `layout.positioning_rules.circle_radius`.
- **Sectors = life domains**: Radial wedges for contexts like family, work, friends, study, hobby, other → keys in `layout.sector_distribution` with angles in degrees. Labels shown when `display.show_sector_labels: true`.
- **One person = one dot**: Add each person once (`people[]`). Use `importance` to scale node size via `display.point_styles`.
- **Label points**: Names or initials can be used; labels are rendered from `people[].name`.
- **Connections by importance**: Draw edges for meaningful ties to keep the picture readable.
  - Intensity → `strength: strong|normal|weak` mapped to `display.line_styles` (bold/solid vs dashed).
  - Initiative → `direction: mutual|outgoing|incoming` (stored; optional arrows could be added in styles).
  - Peer ties → add `peer_connections` between any two people.
- **Relationship quality**: `quality: positive|neutral|negative` captured in data; color or symbols may be used. Current implementation primarily colors by `color_group`.
- **Color groups**: Use `color_group` to highlight interest-based clusters; colors come from `display.colors`.
- **Iterate for clarity**: If sectors/rings are crowded or sparse, adjust `angle_spread`, `circle_radius`, and sector angles in YAML until legible.
