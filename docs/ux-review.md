# UI/UX Review — socialGraph

Driven through the live dev build (2026-06-27): every side panel, the node detail panel, search, and the underlying CSS. Focus: **style consistency**, **ease of use**, **quality-of-life**. Each finding has evidence + a pointer + a fix. Sorted by impact within each group.

---

## A. Style consistency

### A1. Design tokens exist but are widely bypassed — **high**
`index.css :root` defines a palette (`--primary-blue #007bff`, `--error-red #ff6b6b`, grays…), but components hardcode competing values:
- **Blues:** `#007bff` (token) vs `#2563eb` vs `#004c9e` vs `#0056b3`.
- **Reds:** `#ff6b6b` (token) vs `#dc3545` / `#c82333` / `#c0392b`.
- **Greens:** `#2e7d32` / `#2d7d46` / `#e6f4ea` (no token at all).

Result: buttons/badges that should match don't. **Fix:** route every color through a var; add greens to `:root`; lint raw hex in `*.module.css`.

### A2. Two different select widgets — **high**
Connection editor uses **react-select** for From/To (rounded, chevron, search) but **native `<select>`** for Strength/Direction. The Interactive panel uses native `<select>` for Sector/Circle/Importance. Same panel, two looks. **Fix:** standardize on one (react-select everywhere, or native everywhere).

### A3. Mixed UI language — **high**
NodePanel is **Russian** — "Изменить", "Добавить заметку…", "Закрыть", "Удалить заметку" — while the entire rest of the app is English (`view/NodePanel.jsx`). **Fix:** translate NodePanel to English (or pull all strings into one place).

### A4. Inconsistent tab styling
Add/Edit tabs (Interactive, Connection) render differently from General/Layout/Display tabs (Config). **Fix:** one shared `Tabs` component.

### A5. Inconsistent buttons
Blue "Download/Upload" (Code), dark square "+" add-note (NodePanel), bare "X" delete (Config colors), plain "Add Person". No shared button variants. **Fix:** `primary` / `secondary` / `danger` / `icon` button classes in `common/styles.module.css`.

### A6. Scattered `border-radius` (4 / 6 / 8 / 12 / 20px) — pick a scale (e.g. 4 / 8 / 12) and tokenize.

### A7. a11y: 4 rail toggles share `aria-label="Show sidebar"`
Only the icon `alt` differs; check-in is the only one labeled correctly ("Toggle daily check-in"). Screen-reader users hear "Show sidebar" four times. **Fix:** per-button labels ("Edit YAML", "Add person", "Edit connections", "Settings").

---

## B. Ease of use

### B1. Primary action below the fold — **high**
On the taller panels the main action sits under a scroll: "Add Person" (Interactive) and the check-in "Save" are not visible without scrolling. **Fix:** sticky footer holding the primary button.

### B2. Inconsistent close affordance
NodePanel has an in-panel "×". The side panels have **no title bar and no close button** — you close them by re-clicking the rail icon. **Fix:** give every panel a header with title + ×.

### B3. Panels have no titles
Code / Interactive / Connection panels open with no heading — nothing names what's open (only Config and Check-in self-identify). **Fix:** panel header per B2.

### B4. Color editing is raw hex text
Display → Colors are plain text inputs (`#FF6B6B`) with no swatch and no picker; the "X" delete is unlabeled and unconfirmed. **Fix:** show a color chip + `<input type=color>`; label/confirm delete.

### B5. Mobile-first intent vs desktop overlays
`CONTEXT.md` states mobile-first, touch-primary, "detail surfaces are bottom sheets." Today panels are floating cards centered over the graph, partly covering it. **Fix:** make panels bottom sheets on small screens.

---

## C. Quality-of-life opportunities

### C1. No undo for cascading deletes — **high**
Removing a person cascade-deletes their connections; removing a note is immediate. All silent, no undo. **Fix:** toast with Undo, or a confirm naming the cascade ("also removes 3 connections").

### C2. "Last contact" is hidden in Check-in only
The check-in panel shows "never / Nd" per person, but the NodePanel and the graph don't. **Fix:** surface last-contact on NodePanel; optionally fade/ring stale nodes on the graph (decay cue — fits the Recall domain idea).

### C3. Fragmented find
Three separate finders: top GraphSearch, check-in's own search box, and the person pickers in editors. **Fix:** one shared search/typeahead component.

### C4. No in-panel save feedback
Sync state shows only in the rail (`SyncStatus`); editors give no local "saved" cue. **Fix:** reuse the sync indicator inside panel headers.

### C5. Icon-only rail, no tooltips
The left rail is icons only — no hover tooltips/labels, hurting discoverability (ties to A7). **Fix:** add `title`/tooltip per icon.

---

## Suggested order

**Quick wins (style/clarity):** A3 (translate NodePanel), A7 + C5 (labels/tooltips), B2/B3 (panel headers + ×), A1 (tokenize colors).
**Medium (UX):** B1 (sticky action footer), B4 (color picker), A2/A4/A5 (unify selects/tabs/buttons).
**Bigger (QoL):** C1 (undo), C2 (last-contact everywhere), B5 (bottom sheets), C3 (shared search).
