# Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad-hoc styling and one-off UI markup with a shared token layer plus reusable primitives (Button, IconButton, Tabs, Field, Select, PersonSelect, PanelShell), then migrate every existing consumer onto them.

**Architecture:** Stay in React + CSS Modules; no new dependencies. All design tokens become CSS custom properties in one `styles/tokens.css`. Shared primitives live in `components/ui/`. Build each primitive test-first, then migrate consumers one commit at a time so the app stays green throughout.

**Tech Stack:** React 19, Vite 7, CSS Modules, `react-select` (already present), Vitest 4 + @testing-library/react + jsdom.

## Global Constraints

- No new runtime dependencies. Use only what is in `client/package.json`.
- All color values in `*.module.css` must come from `var(--…)` tokens defined in `styles/tokens.css`. After Task 9, raw hex outside `tokens.css` is forbidden.
- Component tests run under jsdom — every component test file starts with the pragma `// @vitest-environment jsdom` (the Vitest global env is `node`).
- Test runner command: from `client/`, `npx vitest run <path>` (single file) or `npx vitest run` (all).
- Radius scale only: `--radius-sm` 4px, `--radius-md` 8px, `--radius-lg` 12px, `--radius-pill` 999px.
- Preserve existing component behavior and existing test assertions except where a task explicitly updates a test.
- UI copy is English. NodePanel's Russian strings are translated in Task 8 (and only there).
- Work happens on branch `feat/design-system-foundation` (already checked out).

---

### Task 1: Token layer (`styles/tokens.css`)

Introduce the single source of design tokens and wire it in. No visual change: old variable names are kept as aliases so nothing breaks yet. CSS-only task — verified by the test suite staying green plus a grep.

**Files:**
- Create: `client/src/styles/tokens.css`
- Modify: `client/src/index.css` (move `:root` out, `@import` tokens)
- Modify: `client/src/main.jsx` (no change needed if `index.css` imports tokens; confirm)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties available globally:
  - Color: `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-danger`, `--color-danger-hover`, `--color-success`, `--surface`, `--surface-overlay`, `--text`, `--text-muted`, `--border`.
  - Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`.
  - Space: `--space-1`..`--space-6`.
  - Type: `--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-weight-normal`, `--font-weight-bold`.
  - Elevation: `--shadow-panel`.
  - Legacy aliases (kept until Task 9): `--primary-blue`, `--primary-blue-hover`, `--light-gray`, `--medium-gray`, `--dark-gray`, `--very-dark-gray`, `--white`, `--off-white`, `--error-red`, `--error-red-hover`.

- [ ] **Step 1: Create `client/src/styles/tokens.css`**

```css
:root {
  /* Color — semantic */
  --color-primary: #007bff;
  --color-primary-hover: #0056b3;
  --color-primary-active: #004c9e;
  --color-danger: #dc3545;
  --color-danger-hover: #c82333;
  --color-success: #2e7d32;

  --surface: #ffffff;
  --surface-overlay: #f5f7fa;
  --text: #333333;
  --text-muted: #666666;
  --border: #cccccc;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* Space */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Type */
  --font-size-sm: 0.85rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.2rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;

  /* Elevation */
  --shadow-panel: 0 4px 16px rgba(0, 0, 0, 0.12);

  /* Legacy aliases — removed in Task 9 */
  --primary-blue: var(--color-primary);
  --primary-blue-hover: var(--color-primary-hover);
  --light-gray: #f0f0f0;
  --medium-gray: var(--border);
  --dark-gray: var(--text-muted);
  --very-dark-gray: var(--text);
  --white: var(--surface);
  --off-white: var(--surface-overlay);
  --error-red: #ff6b6b;
  --error-red-hover: #ee5253;
}
```

- [ ] **Step 2: Replace the `:root` block in `client/src/index.css` with an import**

Delete the existing `:root { … }` block (lines 1–12) and put this at the very top of the file, above the reset comment:

```css
@import './styles/tokens.css';
```

Leave the rest of `index.css` (the `html, body, #root` reset) unchanged.

- [ ] **Step 3: Run the full test suite to confirm nothing broke**

Run: `cd client && npx vitest run`
Expected: PASS — same test count as before this task (CSS change only).

- [ ] **Step 4: Confirm the dev build resolves the import**

Run: `cd client && npx vite build`
Expected: build completes with no "failed to resolve import './styles/tokens.css'" error.

- [ ] **Step 5: Commit**

```bash
git add client/src/styles/tokens.css client/src/index.css
git commit -m "feat(ui): add design token layer with legacy aliases"
```

---

### Task 2: `Button` primitive + migrate buttons

A single button component with variants, then migrate the obvious ad-hoc buttons.

**Files:**
- Create: `client/src/components/ui/Button.jsx`
- Create: `client/src/components/ui/Button.module.css`
- Create: `client/src/components/ui/Button.test.jsx`
- Modify: `client/src/components/panels/CodePanel.jsx` (Download/Upload)
- Modify: `client/src/components/auth/ConflictDialog.jsx` (its action buttons)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `Button` (default export) with props `{ variant = 'primary' | 'secondary' | 'danger' | 'ghost', size = 'sm' | 'md', ...rest }`. `...rest` spreads onto the native `<button>` (so `onClick`, `type`, `disabled`, `children`, `aria-*` all pass through). Default `variant='primary'`, `size='md'`, `type='button'` unless overridden.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ui/Button.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('applies the variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toMatch(/danger/);
  });

  it('forwards onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('honors disabled', () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/Button.test.jsx`
Expected: FAIL — cannot resolve `./Button`.

- [ ] **Step 3: Write the component and styles**

Create `client/src/components/ui/Button.module.css`:

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-md);
  font-family: inherit;
  line-height: 1.2;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.md { padding: var(--space-2) var(--space-3); }
.sm { padding: var(--space-1) var(--space-2); font-size: var(--font-size-sm); }

.primary { background-color: var(--color-primary); color: var(--surface); }
.primary:hover:not(:disabled) { background-color: var(--color-primary-hover); }

.secondary { background-color: var(--surface); color: var(--text); border-color: var(--border); }
.secondary:hover:not(:disabled) { background-color: var(--surface-overlay); }

.danger { background-color: var(--color-danger); color: var(--surface); }
.danger:hover:not(:disabled) { background-color: var(--color-danger-hover); }

.ghost { background: none; color: var(--color-primary); border-color: transparent; }
.ghost:hover:not(:disabled) { text-decoration: underline; }
```

Create `client/src/components/ui/Button.jsx`:

```jsx
import React from 'react';
import styles from './Button.module.css';

function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...rest }) {
  const cls = [styles.btn, styles[size], styles[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}

export default Button;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/Button.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Migrate `CodePanel.jsx` buttons**

In `client/src/components/panels/CodePanel.jsx`, add the import:

```jsx
import Button from '../ui/Button';
```

Replace the two toolbar `<button className={styles.button} …>` elements with:

```jsx
<Button variant="primary" size="sm" onClick={handleDownload}>Download</Button>
<Button variant="secondary" size="sm" onClick={handleUploadClick}>Upload</Button>
```

(Leave the hidden file `<input>` and the rest untouched.)

- [ ] **Step 6: Migrate `ConflictDialog.jsx` buttons**

Read `client/src/components/auth/ConflictDialog.jsx`. Add `import Button from '../ui/Button';`. Replace its "keep local" / "keep cloud" `<button>` elements with `<Button variant="secondary" onClick={onKeepLocal}>…</Button>` and `<Button variant="primary" onClick={onKeepCloud}>…</Button>`, keeping the existing label text and handlers exactly.

- [ ] **Step 7: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS — all prior tests plus the 5 Button tests.

- [ ] **Step 8: Commit**

```bash
git add client/src/components/ui/Button.jsx client/src/components/ui/Button.module.css client/src/components/ui/Button.test.jsx client/src/components/panels/CodePanel.jsx client/src/components/auth/ConflictDialog.jsx
git commit -m "feat(ui): add Button primitive and migrate Code panel + ConflictDialog"
```

---

### Task 2.5: Note on react-select theme tokens

(No standalone task — captured so Task 6 implementers have the values.) The themed react-select in Task 6 maps: control height `36px`, `borderRadius: 4` (`--radius-sm`), border `1px solid var(--border)`, focused border/box-shadow `var(--color-primary)`. These are passed via the `styles` prop, reading the literal pixel values above (react-select's `styles` callback cannot read CSS vars at runtime, so use the same numeric values the tokens resolve to).

---

### Task 3: `IconButton` primitive + migrate rail and NodePanel close

Icon-only button with a required label that drives both `aria-label` and a hover/focus tooltip. Fixes the four duplicate "Show sidebar" labels and the missing rail tooltips.

**Files:**
- Create: `client/src/components/ui/IconButton.jsx`
- Create: `client/src/components/ui/IconButton.module.css`
- Create: `client/src/components/ui/IconButton.test.jsx`
- Modify: `client/src/components/layouts/Sidebar.jsx`
- Modify: `client/src/components/view/NodePanel.jsx` (close button only; Russian text stays until Task 8)

**Interfaces:**
- Consumes: tokens; nothing from other tasks.
- Produces: `IconButton` (default export) with props `{ label (required string), active = false, children (the icon node), ...rest }`. Sets `aria-label={label}`, `title={label}`, applies an `active` class when `active`. `...rest` spreads onto `<button>` (`onClick`, `type` default `'button'`).

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ui/IconButton.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IconButton from './IconButton';

describe('IconButton', () => {
  it('exposes the label as accessible name', () => {
    render(<IconButton label="Add person"><span>+</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Add person' })).toBeInTheDocument();
  });

  it('sets a title tooltip equal to the label', () => {
    render(<IconButton label="Settings"><span>⚙</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('title', 'Settings');
  });

  it('marks the active state with a class', () => {
    render(<IconButton label="Edit YAML" active><span>x</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Edit YAML' }).className).toMatch(/active/);
  });

  it('forwards onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton label="Go" onClick={onClick}><span>x</span></IconButton>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/IconButton.test.jsx`
Expected: FAIL — cannot resolve `./IconButton`.

- [ ] **Step 3: Write the component and styles**

Create `client/src/components/ui/IconButton.module.css`:

```css
.iconBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: inherit;
  padding: var(--space-2);
}
.iconBtn:hover { background-color: rgba(255, 255, 255, 0.1); }
.active { background-color: rgba(255, 255, 255, 0.18); }
```

Create `client/src/components/ui/IconButton.jsx`:

```jsx
import React from 'react';
import styles from './IconButton.module.css';

function IconButton({ label, active = false, type = 'button', className = '', children, ...rest }) {
  const cls = [styles.iconBtn, active ? styles.active : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export default IconButton;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/IconButton.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Migrate the rail in `Sidebar.jsx`**

Rewrite `client/src/components/layouts/Sidebar.jsx` to use `IconButton`, giving each toggle a distinct label. Note the `active` prop now reflects `selectedPanel === <id>`:

```jsx
import React from 'react';
import styles from './Sidebar.module.css';
import IconButton from '../ui/IconButton';
import codeIcon from '../../assets/code.svg';
import formIcon from '../../assets/form.svg';
import connectionIcon from '../../assets/connection.svg';
import settingsIcon from '../../assets/settings.svg';

const ITEMS = [
  { id: 'code', label: 'Edit YAML', icon: codeIcon, alt: 'Toggle code' },
  { id: 'interactive', label: 'Add person', icon: formIcon, alt: 'Toggle interactive' },
  { id: 'connection', label: 'Edit connections', icon: connectionIcon, alt: 'Toggle connection editor' },
  { id: 'config', label: 'Settings', icon: settingsIcon, alt: 'Toggle config editor' },
];

export default function Sidebar({ selectedPanel, setSelectedPanel, authSlot }) {
  function togglePanel(targetPanel) {
    setSelectedPanel(selectedPanel === targetPanel ? null : targetPanel);
  }

  return (
    <div className={styles.sidebar}>
      {ITEMS.map(({ id, label, icon, alt }) => (
        <IconButton
          key={id}
          label={label}
          active={selectedPanel === id}
          onClick={() => togglePanel(id)}
        >
          <span className={styles.icon}><img src={icon} alt={alt} /></span>
        </IconButton>
      ))}
      <IconButton
        label="Daily check-in"
        active={selectedPanel === 'checkin'}
        onClick={() => togglePanel('checkin')}
      >
        <span className={styles.icon} style={{ fontSize: '20px', lineHeight: 1 }}>✓</span>
      </IconButton>
      <div className={styles.spacer} />
      {authSlot}
    </div>
  );
}
```

Note: the `isOpen` prop is no longer used by Sidebar. Leave `Layout.jsx` passing it (harmless) — do not remove unrelated code.

- [ ] **Step 6: Migrate the NodePanel close button**

In `client/src/components/view/NodePanel.jsx`, add `import IconButton from '../ui/IconButton';`. Replace the close `<button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>` with:

```jsx
<IconButton label="Закрыть" className={styles.closeBtn} onClick={onClose}>×</IconButton>
```

(Keep the Russian label for now — Task 8 translates it together with the test.)

- [ ] **Step 7: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS. NodePanel tests still pass (close button still exposes `aria-label="Закрыть"`; the "Изменить" assertions are untouched).

- [ ] **Step 8: Commit**

```bash
git add client/src/components/ui/IconButton.jsx client/src/components/ui/IconButton.module.css client/src/components/ui/IconButton.test.jsx client/src/components/layouts/Sidebar.jsx client/src/components/view/NodePanel.jsx
git commit -m "feat(ui): add IconButton, give rail distinct labels + tooltips"
```

---

### Task 4: `Tabs` primitive + migrate tab strips

One accessible tab strip for the three panels that have tabs.

**Files:**
- Create: `client/src/components/ui/Tabs.jsx`
- Create: `client/src/components/ui/Tabs.module.css`
- Create: `client/src/components/ui/Tabs.test.jsx`
- Modify: `client/src/components/panels/InteractivePanel.jsx`
- Modify: `client/src/components/panels/ConnectionEditor.jsx`
- Modify: `client/src/components/panels/ConfigEditor.jsx`

**Interfaces:**
- Consumes: tokens.
- Produces: `Tabs` (default export) with props `{ tabs: [{ id, label }], active, onChange }`. Renders a `role="tablist"` of `role="tab"` buttons; clicking or pressing Arrow keys calls `onChange(id)`. The active tab has `aria-selected="true"` and an `active` class.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ui/Tabs.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Tabs from './Tabs';

const tabs = [{ id: 'add', label: 'Add' }, { id: 'edit', label: 'Edit' }];

describe('Tabs', () => {
  it('renders a tablist of the given tabs', () => {
    render(<Tabs tabs={tabs} active="add" onChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Add' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="add" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Edit' }));
    expect(onChange).toHaveBeenCalledWith('edit');
  });

  it('moves selection with ArrowRight', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="add" onChange={onChange} />);
    screen.getByRole('tab', { name: 'Add' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('edit');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/Tabs.test.jsx`
Expected: FAIL — cannot resolve `./Tabs`.

- [ ] **Step 3: Write the component and styles**

Create `client/src/components/ui/Tabs.module.css`:

```css
.tablist { display: flex; gap: var(--space-1); margin-bottom: var(--space-4); }
.tab {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background-color: var(--surface-overlay);
  color: var(--text);
  cursor: pointer;
  font-size: var(--font-size-md);
  font-family: inherit;
}
.active { background-color: var(--surface); border-bottom-color: transparent; font-weight: var(--font-weight-bold); }
```

Create `client/src/components/ui/Tabs.jsx`:

```jsx
import React from 'react';
import styles from './Tabs.module.css';

function Tabs({ tabs, active, onChange }) {
  const idx = tabs.findIndex((t) => t.id === active);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') onChange(tabs[(idx + 1) % tabs.length].id);
    if (e.key === 'ArrowLeft') onChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
  }

  return (
    <div className={styles.tablist} role="tablist" onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={[styles.tab, selected ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/Tabs.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Migrate the three panels**

For each of `InteractivePanel.jsx`, `ConnectionEditor.jsx`, `ConfigEditor.jsx`:
1. Read the file to find its tab state (a `useState` holding `'add'`/`'edit'` or `'general'`/`'layout'`/`'display'`) and its hand-rolled tab buttons (the `styles.tabButton` / `styles.tab` markup).
2. Add `import Tabs from '../ui/Tabs';`.
3. Replace the hand-rolled tab `<button>`s with a single `<Tabs>`, wiring its existing state setter:

InteractivePanel and ConnectionEditor:
```jsx
<Tabs
  tabs={[{ id: 'add', label: 'Add' }, { id: 'edit', label: 'Edit' }]}
  active={activeTab}
  onChange={setActiveTab}
/>
```
(Use whatever the file's existing state variable/setter are named; do not rename them.)

ConfigEditor:
```jsx
<Tabs
  tabs={[{ id: 'general', label: 'General' }, { id: 'layout', label: 'Layout' }, { id: 'display', label: 'Display' }]}
  active={activeTab}
  onChange={setActiveTab}
/>
```

Keep all panel body logic unchanged.

- [ ] **Step 6: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS. `InteractivePanel.test.jsx` still passes — it selects tabs by their visible text ("Add"/"Edit"), which `Tabs` preserves.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ui/Tabs.jsx client/src/components/ui/Tabs.module.css client/src/components/ui/Tabs.test.jsx client/src/components/panels/InteractivePanel.jsx client/src/components/panels/ConnectionEditor.jsx client/src/components/panels/ConfigEditor.jsx
git commit -m "feat(ui): add Tabs primitive and migrate panel tab strips"
```

---

### Task 5: `Field` + `Select` primitives + migrate enum selects

`Field` is a label+control wrapper; `Select` is a styled native `<select>`. Migrate the short fixed-enum dropdowns.

**Files:**
- Create: `client/src/components/ui/Field.jsx`
- Create: `client/src/components/ui/Field.module.css`
- Create: `client/src/components/ui/Select.jsx`
- Create: `client/src/components/ui/Select.module.css`
- Create: `client/src/components/ui/Field.test.jsx`
- Create: `client/src/components/ui/Select.test.jsx`
- Modify: `client/src/components/ui/PersonForm.jsx` (sector/circle/importance/strength/direction/quality/color_group)

**Interfaces:**
- Consumes: tokens.
- Produces:
  - `Field` (default export): props `{ label, htmlFor, hint, error, children }`. Renders a `<label htmlFor>` then `children`, plus optional hint/error text.
  - `Select` (default export): props `{ options: [{ value, label }], ...rest }`. Renders a styled native `<select>` with one `<option>` per entry; `...rest` spreads onto `<select>` (`id`, `name`, `value`, `onChange`, `required`). Does NOT render a label (compose with `Field`).

- [ ] **Step 1: Write the failing tests**

Create `client/src/components/ui/Field.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Field from './Field';

describe('Field', () => {
  it('associates the label with the control via htmlFor', () => {
    render(
      <Field label="Sector:" htmlFor="sector">
        <input id="sector" />
      </Field>
    );
    expect(screen.getByLabelText('Sector:')).toBeInTheDocument();
  });

  it('shows an error message when provided', () => {
    render(
      <Field label="Name:" htmlFor="name" error="Required">
        <input id="name" />
      </Field>
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
```

Create `client/src/components/ui/Select.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Select from './Select';

const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

describe('Select', () => {
  it('renders one option per entry', () => {
    render(<Select aria-label="x" options={options} value="a" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
  });

  it('fires onChange with the selected value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select aria-label="x" options={options} value="a" onChange={onChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/components/ui/Field.test.jsx src/components/ui/Select.test.jsx`
Expected: FAIL — cannot resolve `./Field` / `./Select`.

- [ ] **Step 3: Write the components and styles**

Create `client/src/components/ui/Field.module.css`:

```css
.field { margin-bottom: var(--space-4); }
.label { display: block; margin-bottom: var(--space-2); color: var(--text); }
.hint { color: var(--text-muted); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.error { color: var(--color-danger); font-size: var(--font-size-sm); margin-top: var(--space-1); }
```

Create `client/src/components/ui/Field.jsx`:

```jsx
import React from 'react';
import styles from './Field.module.css';

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label} htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default Field;
```

Create `client/src/components/ui/Select.module.css`:

```css
.select {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-md);
  font-family: inherit;
}
.select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary); }
```

Create `client/src/components/ui/Select.jsx`:

```jsx
import React from 'react';
import styles from './Select.module.css';

function Select({ options, className = '', ...rest }) {
  const cls = [styles.select, className].filter(Boolean).join(' ');
  return (
    <select className={cls} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default Select;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/components/ui/Field.test.jsx src/components/ui/Select.test.jsx`
Expected: PASS (4 tests total).

- [ ] **Step 5: Migrate `PersonForm.jsx` enum selects**

In `client/src/components/ui/PersonForm.jsx`, add:

```jsx
import Field from './Field';
import Select from './Select';
```

Replace each `<div className={styles.formGroup}>` that contains a `<label>` + native `<select>` with a `Field` + `Select` pair. The selects with FIXED option lists (circle, importance, strength, direction, quality) convert directly. Example for `importance`:

```jsx
<Field label="Importance:" htmlFor="importance">
  <Select
    id="importance"
    name="importance"
    value={formData.importance}
    onChange={handleChange}
    options={[
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' },
    ]}
  />
</Field>
```

Apply the same pattern to:
- `circle` → options `[{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'}]`
- `strength` → `[{value:'normal',label:'Normal'},{value:'strong',label:'Strong'},{value:'weak',label:'Weak'}]`
- `direction` → `[{value:'mutual',label:'Mutual'},{value:'incoming',label:'Incoming'},{value:'outgoing',label:'Outgoing'}]`
- `quality` → `[{value:'positive',label:'Positive'},{value:'negative',label:'Negative'},{value:'neutral',label:'Neutral'}]`

For `sector` and `color_group` (dynamic option lists with a leading placeholder / "Other" option), keep them as native `<select>` for now but wrap their `<label>`+`<select>` in `<Field label="Sector:" htmlFor="sector">…</Field>` (the placeholder/`__other` logic does not fit `Select`'s flat options prop — leave the raw `<select>` inside the Field). Also wrap the plain text inputs (name, recall, customSector) in `<Field>` where they currently use `formGroup`.

Keep `name`, `id`, `value`, `onChange`, `required` attributes exactly as before so `InteractivePanel.test.jsx` and `person-form.test.js` still pass.

- [ ] **Step 6: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS. `InteractivePanel.test.jsx` interacts via labels/roles preserved by Field/Select.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ui/Field.jsx client/src/components/ui/Field.module.css client/src/components/ui/Field.test.jsx client/src/components/ui/Select.jsx client/src/components/ui/Select.module.css client/src/components/ui/Select.test.jsx client/src/components/ui/PersonForm.jsx
git commit -m "feat(ui): add Field + Select primitives and migrate PersonForm enums"
```

---

### Task 6: `PersonSelect` (themed react-select) + migrate Connection pickers

Searchable person picker styled to match `Select`.

**Files:**
- Create: `client/src/components/ui/PersonSelect.jsx`
- Create: `client/src/components/ui/PersonSelect.test.jsx`
- Modify: `client/src/components/panels/ConnectionEditor.jsx` (From/To pickers)

**Interfaces:**
- Consumes: tokens (as literal pixel values per Task 2.5); `react-select`.
- Produces: `PersonSelect` (default export) with props `{ value (string name | ''), onChange (fn receiving the selected name string | ''), options: [{ value, label }], placeholder, inputId }`. Wraps react-select; converts between react-select's `{value,label}` objects and the bare name string the connection logic expects.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ui/PersonSelect.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonSelect from './PersonSelect';

const options = [{ value: 'Alex', label: 'Alex' }, { value: 'Mom', label: 'Mom' }];

describe('PersonSelect', () => {
  it('renders the placeholder when no value is selected', () => {
    render(<PersonSelect value="" onChange={() => {}} options={options} placeholder="-- select person --" inputId="from" />);
    expect(screen.getByText('-- select person --')).toBeInTheDocument();
  });

  it('shows the selected value label', () => {
    render(<PersonSelect value="Mom" onChange={() => {}} options={options} placeholder="-- select person --" inputId="from" />);
    expect(screen.getByText('Mom')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/PersonSelect.test.jsx`
Expected: FAIL — cannot resolve `./PersonSelect`.

- [ ] **Step 3: Write the component**

Create `client/src/components/ui/PersonSelect.jsx`:

```jsx
import React from 'react';
import ReactSelect from 'react-select';

const theme = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    borderRadius: 4,
    borderColor: state.isFocused ? '#007bff' : '#cccccc',
    boxShadow: state.isFocused ? '0 0 0 2px #007bff' : 'none',
    '&:hover': { borderColor: '#007bff' },
  }),
};

function PersonSelect({ value, onChange, options, placeholder, inputId }) {
  const selected = options.find((o) => o.value === value) || null;
  return (
    <ReactSelect
      inputId={inputId}
      styles={theme}
      options={options}
      value={selected}
      placeholder={placeholder}
      isClearable
      onChange={(opt) => onChange(opt ? opt.value : '')}
    />
  );
}

export default PersonSelect;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/PersonSelect.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Migrate `ConnectionEditor.jsx` From/To**

Read `client/src/components/panels/ConnectionEditor.jsx`. It already builds `peopleOptions = people.map(p => ({ value: p.name, label: p.name }))` and uses `react-select` directly for From/To. Replace those two `react-select` usages with `PersonSelect`, wrapped in `Field`:

```jsx
import PersonSelect from '../ui/PersonSelect';
import Field from '../ui/Field';
```

```jsx
<Field label="From Person:" htmlFor="from">
  <PersonSelect
    inputId="from"
    options={peopleOptions}
    value={editFrom /* or the file's existing "from" state */}
    onChange={/* the file's existing setter, receiving a name string */}
    placeholder="-- select person --"
  />
</Field>
```

Match the file's existing state variables and handlers (do not rename them). The `Strength`/`Direction`/`Quality` selects in this panel are fixed enums — also convert them to `Field` + `Select` (Task 5 pattern) while you are here.

- [ ] **Step 6: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ui/PersonSelect.jsx client/src/components/ui/PersonSelect.test.jsx client/src/components/panels/ConnectionEditor.jsx
git commit -m "feat(ui): add themed PersonSelect and unify ConnectionEditor selects"
```

---

### Task 7: `PanelShell` + wrap all side panels

Give every side panel a header with a title and an × close control.

**Files:**
- Create: `client/src/components/ui/PanelShell.jsx`
- Create: `client/src/components/ui/PanelShell.module.css`
- Create: `client/src/components/ui/PanelShell.test.jsx`
- Modify: `client/src/App.jsx` (pass a close handler + titles into panels OR wrap in `choosePanel`)
- Modify: each panel: `CodePanel.jsx`, `InteractivePanel.jsx`, `ConnectionEditor.jsx`, `ConfigEditor.jsx`, `DailyCheckin.jsx`

**Interfaces:**
- Consumes: tokens; `IconButton` (Task 3).
- Produces: `PanelShell` (default export) with props `{ title, onClose, children }`. Renders a header (`title` text + an `IconButton label="Close"` firing `onClose`) above a scrollable body containing `children`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/ui/PanelShell.test.jsx`:

```jsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PanelShell from './PanelShell';

describe('PanelShell', () => {
  it('renders the title and children', () => {
    render(<PanelShell title="People" onClose={() => {}}><p>body</p></PanelShell>);
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('fires onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PanelShell title="People" onClose={onClose}><p>body</p></PanelShell>);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/PanelShell.test.jsx`
Expected: FAIL — cannot resolve `./PanelShell`.

- [ ] **Step 3: Write the component and styles**

Create `client/src/components/ui/PanelShell.module.css`:

```css
.shell { display: flex; flex-direction: column; height: 100%; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text); }
.body { flex: 1; overflow-y: auto; padding: var(--space-4); }
```

Create `client/src/components/ui/PanelShell.jsx`:

```jsx
import React from 'react';
import styles from './PanelShell.module.css';
import IconButton from './IconButton';

function PanelShell({ title, onClose, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {onClose && <IconButton label="Close" onClick={onClose}>×</IconButton>}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default PanelShell;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/PanelShell.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wrap panels in `App.jsx`**

In `client/src/App.jsx`, the `choosePanel()` function returns one panel per `selectedPanel`. Wrap each return value in `PanelShell`, passing a title and `onClose={() => setSelectedPanel(null)}`. Add `import PanelShell from './components/ui/PanelShell';`. Example:

```jsx
const choosePanel = () => {
  const close = () => setSelectedPanel(null);
  if (selectedPanel === 'code') {
    return <PanelShell title="YAML" onClose={close}><CodePanel value={yamlText} onChange={setYamlText} error={yamlError} /></PanelShell>;
  } else if (selectedPanel === 'interactive') {
    return <PanelShell title="People" onClose={close}><InteractivePanel yamlText={yamlText} setYamlText={setYamlText} editTargetId={editTargetId} onEditTargetConsumed={() => setEditTargetId(null)} /></PanelShell>;
  } else if (selectedPanel === 'connection') {
    return <PanelShell title="Connections" onClose={close}><ConnectionEditor yamlText={yamlText} setYamlText={setYamlText} /></PanelShell>;
  } else if (selectedPanel === 'config') {
    return <PanelShell title="Settings" onClose={close}><ConfigEditor yamlText={yamlText} setYamlText={setYamlText} /></PanelShell>;
  } else if (selectedPanel === 'checkin') {
    return <PanelShell title="Daily Check-in" onClose={close}><DailyCheckin yamlText={yamlText} setYamlText={setYamlText} /></PanelShell>;
  }
  return null;
};
```

If a panel renders its own internal heading (e.g. DailyCheckin's "Daily Check-in" title), remove that internal heading element so it is not duplicated — but do NOT remove any control the panel's tests reference. Check `DailyCheckin.test.jsx` first: it interacts with the date input, search box, checkboxes, and Save — none assert on a heading, so removing a duplicate `<h…>Daily Check-in</h…>` is safe.

- [ ] **Step 6: Run the full suite**

Run: `cd client && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Visual check**

Re-drive the dev stack (see the project's run/verify skill) and screenshot each panel; confirm each shows a title + working ×, and no layout breakage versus `docs/ux-review.md` baselines.

- [ ] **Step 8: Commit**

```bash
git add client/src/components/ui/PanelShell.jsx client/src/components/ui/PanelShell.module.css client/src/components/ui/PanelShell.test.jsx client/src/App.jsx client/src/components/panels/DailyCheckin.jsx
git commit -m "feat(ui): add PanelShell and give every side panel a title + close"
```

---

### Task 8: Translate NodePanel to English

The node detail panel is the last Russian surface. Translate it and update its test in the same commit.

**Files:**
- Modify: `client/src/components/view/NodePanel.jsx`
- Modify: `client/src/components/view/NodePanel.test.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no API change.

- [ ] **Step 1: Update the test to expect English (red)**

In `client/src/components/view/NodePanel.test.jsx`, change the "Изменить" assertions to "Edit":

```jsx
it('fires onEditPerson with the node id when Edit is clicked', async () => {
  const user = userEvent.setup();
  const onEditPerson = vi.fn();
  render(
    <NodePanel
      node={{ id: 3, name: 'Sarah' }}
      recall={undefined}
      {...baseProps}
      onEditPerson={onEditPerson}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(onEditPerson).toHaveBeenCalledWith(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/view/NodePanel.test.jsx`
Expected: FAIL — no button named "Edit" (still "Изменить").

- [ ] **Step 3: Translate the strings in `NodePanel.jsx`**

- Edit button text `Изменить` → `Edit`
- Close button label `label="Закрыть"` → `label="Close"`
- Note input `placeholder="Добавить заметку..."` → `placeholder="Add note…"`
- Remove-note `aria-label="Удалить заметку"` → `aria-label="Delete note"`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/view/NodePanel.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/view/NodePanel.jsx client/src/components/view/NodePanel.test.jsx
git commit -m "feat(ui): translate NodePanel to English"
```

---

### Task 9: Token cleanup + consistency gate

Remove legacy aliases and remaining raw hex; lock the gate.

**Files:**
- Modify: `client/src/styles/tokens.css` (delete the legacy alias block)
- Modify: any `*.module.css` still using legacy var names or raw hex (notably `components/common/styles.module.css`, `Sidebar.module.css`, `D3Graph.module.css`, `CodePanel.module.css`, `GraphSearch.module.css`, `SyncStatus.module.css`, `UserMenu.module.css`)

**Interfaces:** none.

- [ ] **Step 1: Find remaining raw hex and legacy aliases**

Run:
```bash
cd client && grep -rnE '#[0-9a-fA-F]{3,6}' src --include='*.module.css'
grep -rnE 'var\(--(primary-blue|error-red|light-gray|medium-gray|dark-gray|very-dark-gray|white|off-white)' src --include='*.module.css'
```
Expected: a list of occurrences to fix.

- [ ] **Step 2: Replace each occurrence with a semantic token**

For every hit from Step 1, swap to the matching token:
- `#dc3545` / `var(--error-red)` used for destructive UI → `var(--color-danger)`; its hover → `var(--color-danger-hover)`.
- `#2e7d32` and other greens → `var(--color-success)`.
- `var(--primary-blue)` → `var(--color-primary)`; `var(--primary-blue-hover)` → `var(--color-primary-hover)`.
- `var(--white)` → `var(--surface)`; `var(--off-white)` → `var(--surface-overlay)`; `var(--medium-gray)` → `var(--border)`; `var(--dark-gray)` → `var(--text-muted)`; `var(--very-dark-gray)` → `var(--text)`.
- `--light-gray` (`#f0f0f0`) has no semantic token: either map to `var(--surface-overlay)` if it's a subtle background, or add `--neutral-100: #f0f0f0` to `tokens.css` and use that. Pick per usage.

In `components/common/styles.module.css` specifically: replace the `#dc3545`/`#c82333` in `.deleteButton`/`.deleteAllButton` and the `#2e7d32` in `.confirmMessage` with `var(--color-danger)`/`var(--color-danger-hover)`/`var(--color-success)`.

- [ ] **Step 3: Delete the legacy alias block from `tokens.css`**

Remove the entire `/* Legacy aliases — removed in Task 9 */` section. Keep `--error-red`/`--error-red-hover` ONLY if Step 1 shows a remaining non-danger use of the lighter red `#ff6b6b`; otherwise delete them too.

- [ ] **Step 4: Verify the gate is clean**

Run:
```bash
cd client && grep -rnE '#[0-9a-fA-F]{3,6}' src --include='*.module.css'
```
Expected: NO output (all color now in `tokens.css`).

Then confirm no dangling legacy var references:
```bash
grep -rnE 'var\(--(primary-blue|error-red|light-gray|medium-gray|dark-gray|very-dark-gray|white|off-white)' src --include='*.module.css'
```
Expected: NO output.

- [ ] **Step 5: Run the full suite + build**

Run: `cd client && npx vitest run && npx vite build`
Expected: tests PASS, build succeeds.

- [ ] **Step 6: Visual regression check**

Re-drive the dev stack and screenshot every panel + NodePanel; compare to `docs/ux-review.md` baselines. Confirm colors look correct (no missing-variable fallbacks rendering black/transparent).

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "refactor(ui): route all color through tokens, drop legacy aliases"
```

---

## Self-Review

**Spec coverage:**
- A1 (token sprawl) → Task 1 + Task 9. ✓
- A2 (two selects) → Task 5 (`Select`) + Task 6 (`PersonSelect`). ✓
- A3 (mixed language) → Task 8. ✓
- A4 (tab styles) → Task 4. ✓
- A5 (buttons) → Task 2. ✓
- A6 (radius scale) → Task 1 tokens + Task 9 enforcement. ✓
- A7 (duplicate aria-labels) → Task 3. ✓
- B2/B3 (no panel title/close) → Task 7. ✓
- C5 (no tooltips) → Task 3 (IconButton `title`). ✓
- Non-goals (B1, B4, B5, C1, C2, C3, C4) → correctly absent. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Migration steps that depend on a file's existing state-variable names instruct the implementer to read the file and match names rather than guessing — concrete, not placeholder.

**Type consistency:** `variant`/`size` props consistent across `Button`. `Tabs` uses `{id,label}` + `active`/`onChange` consistently. `Select` and `PersonSelect` both take `options:[{value,label}]`; `PersonSelect.onChange` emits a bare name string (matches ConnectionEditor's name-based connection model). `PanelShell` `{title,onClose,children}` matches its consumer in App.jsx and its test ("Close" button name matches IconButton label).
