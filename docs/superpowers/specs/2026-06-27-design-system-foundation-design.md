# Design System Foundation — Design Spec

**Date:** 2026-06-27
**Status:** Approved (design); pending implementation plan
**Source:** `docs/ux-review.md` (findings A1, A2, A3, A4, A5, A6, A7, B2, B3, C5)

## Problem

The UI has drifted into visual inconsistency. The CSS already defines a `:root` token
block, but components bypass it: three competing blues (`#007bff`, `#2563eb`, `#004c9e`),
four reds (`#ff6b6b`, `#dc3545`, `#c82333`, `#c0392b`), three untokenized greens, and five
`border-radius` values (4/6/8/12/20px). There are two select widgets (`react-select` for
person pickers, native `<select>` for enums), two tab styles, ad-hoc buttons, side panels
with no title/close affordance, an icon-only rail whose four toggles all announce
"Show sidebar", and one panel (NodePanel) in Russian while the rest of the app is English.

A shared primitive layer is the structural backbone the other UX findings depend on.
Building it first makes later polish cheap.

## Goals

- One source of design tokens; no raw hex outside the token file.
- A small set of shared UI primitives every panel uses.
- Two select roles with one visual language (native enums + searchable person picker).
- Every side panel has a title and a close control.
- The icon rail is accessible: real labels + tooltips.
- The app is fully migrated onto the primitives (consistency actually closed, not just available).

## Non-goals (explicitly deferred to later specs)

Sticky action footer (B1), color swatch/picker (B4), mobile bottom sheets (B5),
undo for cascading deletes (C1), last-contact surfacing (C2), unified/shared search (C3),
in-panel save cue (C4).

## Decisions (from brainstorming)

- **Mechanism:** extend the current approach — CSS Modules + a real CSS-custom-property
  token layer. No new dependencies (no Tailwind, no component kit).
- **Selects:** two roles, one look. Native `<select>` for short fixed enums (best mobile
  picker); `react-select` only for searchable person pickers; both styled to match.
- **Migration:** build primitives, then convert every existing consumer incrementally
  (one panel per commit, app green throughout).
- **Scope add:** include the rail icon standardization + tooltips/aria-labels (A7/C5) and
  the NodePanel language fix (A3) in this foundation.

## Architecture & file layout

No new dependencies. Shared UI lives under `components/ui/`; tokens in `styles/`.

```
client/src/
  styles/
    tokens.css          # NEW — all design tokens as CSS custom properties (single source)
  components/
    ui/
      Button.jsx + .module.css        # NEW
      IconButton.jsx + .module.css    # NEW (icon button w/ required label → aria-label + tooltip)
      Tabs.jsx + .module.css          # NEW
      Field.jsx + .module.css         # NEW (label + control wrapper)
      Select.jsx + .module.css        # NEW (styled native <select>)
      PersonSelect.jsx                # NEW (react-select themed from tokens)
      PanelShell.jsx + .module.css    # NEW (header: title + × close, scroll body)
      Editor.jsx                      # exists — leave
      PersonForm.jsx                  # exists — migrate onto Field/Select/Button
```

`tokens.css` is imported once (via `main.jsx` or an `@import` at the top of `index.css`).
The current `:root` block moves into `tokens.css` and grows. Every `*.module.css`
references `var(--…)` only.

Each primitive is a small module: minimal prop surface, internals swappable without
touching consumers (e.g. `PersonSelect` can re-theme react-select without any panel
knowing).

## Token system

Semantic tokens replace scattered literals. Graph node colors (user-editable
`display.colors`) remain data and are untouched — these tokens style chrome only.

- **Color (semantic):** `--color-primary`, `--color-primary-hover`, `--color-primary-active`;
  `--color-danger`, `--color-danger-hover`; `--color-success`; surfaces (`--surface`,
  `--surface-overlay`); text (`--text`, `--text-muted`); `--border`. Existing
  `--primary-blue`/`--error-red`/grays remap onto these; competing literals
  (`#2563eb`, `#004c9e`, `#dc3545`, `#c82333`, `#c0392b`, the greens) collapse into the set.
- **Radius:** `--radius-sm 4px`, `--radius-md 8px`, `--radius-lg 12px`, `--radius-pill`.
  The 6px/20px one-offs snap to the scale.
- **Space:** `--space-1..6` = 4/8/12/16/24/32.
- **Type:** `--font-size-sm/md/lg`, weight tokens.
- **Elevation:** `--shadow-panel` for floating panels.

## Components

| Primitive | Interface (props) | Behavior / role | Replaces |
|-----------|-------------------|-----------------|----------|
| `Button` | `variant: primary\|secondary\|danger\|ghost`, `size: sm\|md`, native button props | Variants via class map, all colors tokenized | Download/Upload, Add Person, color "X" (danger ghost), "+" note button |
| `IconButton` | `icon`, **required** `label`, `active`, native button props | `label` → `aria-label` + CSS tooltip on hover/focus | Rail toggles (all "Show sidebar"), NodePanel × |
| `Tabs` | `tabs: [{id,label}]`, `active`, `onChange` | `role="tablist"`, roving tabindex, arrow-key nav | Add/Edit tabs + General/Layout/Display tabs |
| `Field` | `label`, `htmlFor`, `children`, `hint?`, `error?` | Consistent label spacing/typography | Ad-hoc label markup across forms |
| `Select` | `label`, `options`, `value`, `onChange` (wraps native `<select>`) | Token-styled height/border/radius/focus/chevron | sector, circle, importance, strength, direction |
| `PersonSelect` | `value`, `onChange`, `options` (react-select, themed) | Type-ahead person picker; react-select styled to match `Select`; isolates the dependency | Connection From/To |
| `PanelShell` | `title`, `onClose`, `children` | Header (title + × via IconButton), token padding, `--shadow-panel`, scroll body; leaves room for a future footer | Title-less, close-less side panels |

**Rail labels become real:** "Edit YAML", "Add person", "Edit connections", "Settings",
"Daily check-in". **Side-panel titles:** "YAML", "People", "Connections", "Settings",
"Daily Check-in". **NodePanel language fix (A3):** Russian → English ("Edit", "Add note…",
"Close", "Delete note") while migrating it onto `IconButton`/`Button`.

## Migration order

Build primitives first (each red-green tested), then convert consumers one panel per
commit, visual-checking each against `docs/ux-review.md` baselines. Each step is
independently shippable; the app stays green throughout.

1. **`tokens.css`** — add file, move/remap `:root`, alias old var names so nothing breaks. No visual change.
2. **`Button`** + tests → migrate Code panel, Config color "X", ConflictDialog.
3. **`IconButton`** + tests → migrate left rail (labels + tooltips) and NodePanel ×. Closes A7/C5.
4. **`Tabs`** + tests → migrate Interactive, Connection, Config tab strips.
5. **`Field` + `Select`** + tests → migrate Interactive enums, Connection enums, Config inputs.
6. **`PersonSelect`** + tests → migrate Connection From/To; drop ad-hoc react-select styling.
7. **`PanelShell`** + tests → wrap all five side panels (titles + ×).
8. **NodePanel language** → English strings (A3), onto Button/IconButton.
9. **Token cleanup** — delete aliased legacy vars + remaining raw hex; grep gate passes.

## Testing & verification

- **Unit (vitest + React Testing Library):** every primitive — render, each variant/prop,
  a11y (`Button` disabled; `IconButton` exposes `aria-label`; `Tabs` arrow-key nav + roles;
  `Select` change fires `onChange`). Matches the repo's existing test style.
- **Regression:** existing panel tests (InteractivePanel, DailyCheckin, GraphSearch,
  NodePanel) must still pass after each migration — they assert behavior, not styling, so
  they guard the refactor.
- **Visual:** re-drive the dev stack with Playwright after steps 3/4/7; screenshot each
  panel and compare to the review baselines for layout regressions.
- **Static gate:** after step 9, `grep -rE '#[0-9a-fA-F]{3,6}' client/src --include='*.module.css'`
  returns nothing (all color lives in `tokens.css`). This grep is the consistency guarantee;
  a stylelint rule can formalize it later.

## Success criteria

- No raw hex outside `tokens.css`; one radius scale.
- All buttons/tabs/selects/panels render through the shared primitives.
- Every side panel shows a title + working × close.
- Rail buttons have distinct labels + tooltips; no duplicate "Show sidebar".
- NodePanel is English.
- Full test suite green; no visual regressions vs review baselines.
