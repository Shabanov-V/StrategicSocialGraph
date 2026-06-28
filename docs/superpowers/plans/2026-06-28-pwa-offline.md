# PWA + Offline Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the socialGraph web app installable and offline-capable as a Progressive Web App, and auto-resync local edits to the cloud on reconnect.

**Architecture:** Add `vite-plugin-pwa` (Workbox) to the existing Vite + React 19 client. The plugin emits a web app manifest and a service worker that precaches the built app shell and applies runtime caching rules. The data layer is unchanged — graph YAML stays local-first in `localStorage`. The sync hook (`useCloudSync`) gains offline detection and a reconnect flush.

**Tech Stack:** React 19, Vite 7, `vite-plugin-pwa` + Workbox, `@vite-pwa/assets-generator` (dev-only icon generation), Vitest 4 + @testing-library/react (jsdom), Playwright 1.61.

## Global Constraints

- No new **runtime** dependencies. `vite-plugin-pwa` and `@vite-pwa/assets-generator` are **devDependencies** (Workbox is bundled by the plugin).
- PWA only. No `.apk`, no native packaging, no app-store work.
- All commands run from `client/` unless stated. Single-file test: `npx vitest run <path>`. Component/hook tests run under jsdom — every such test file starts with `// @vitest-environment jsdom` (the Vitest global env is `node`).
- Manifest colors come from existing tokens: `theme_color` = `#007bff` (`--color-primary`), `background_color` = `#ffffff` (`--surface`).
- App name `socialGraph`; `display: standalone`; `start_url` and `scope` = `/`.
- `/api/*` (incl. `/api/auth/*`) must be **NetworkOnly** — never served from cache. `/graph.yml` is **NetworkFirst** (fall back to cache).
- The service worker does not run under `vite dev`; PWA E2E runs against a production build served by `vite preview`.
- `SyncStatus.jsx` already renders an `offline` status (label + CSS exist) — do not re-add it; only make the hook set it.
- Icon source is the existing `client/public/icon.svg`.

---

### Task 1: Add `vite-plugin-pwa` with manifest + Workbox runtime caching

**Files:**
- Modify: `client/package.json` (add devDependency)
- Modify: `client/vite.config.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a configured `VitePWA` plugin so `npm run build` emits `dist/manifest.webmanifest` and `dist/sw.js`. Manifest icon entries (`pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`) are added in Task 2 — list them now so the manifest is complete; Task 2 generates the matching files.

- [ ] **Step 1: Install the plugin**

```bash
cd client && npm install -D vite-plugin-pwa@^1.0.0
```

Expected: `vite-plugin-pwa` appears under `devDependencies` in `client/package.json`.

- [ ] **Step 2: Add the plugin to `vite.config.js`**

Replace the entire contents of `client/vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'socialGraph',
        short_name: 'socialGraph',
        description: 'Personal social graph visualizer',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#007bff',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/graph\.yml$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'graph-seed',
              expiration: { maxEntries: 1 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // unit/component tests live in src; e2e/ is Playwright's (different runner).
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
```

- [ ] **Step 3: Build and verify artifacts exist**

Run: `cd client && npm run build && ls dist/manifest.webmanifest dist/sw.js`
Expected: both paths listed (no "No such file"). Build completes without error.

- [ ] **Step 4: Verify the API NetworkOnly rule is present in the SW**

Run: `cd client && grep -c "NetworkOnly" dist/sw.js`
Expected: a count `>= 1`.

- [ ] **Step 5: Commit**

```bash
cd client && git add package.json package-lock.json vite.config.js && git commit -m "feat(pwa): add vite-plugin-pwa manifest + Workbox caching"
```

---

### Task 2: Generate app icons and add native-feel head tags

**Files:**
- Modify: `client/package.json` (add devDependency)
- Create: `client/pwa-assets-generator.config.js`
- Create (generated, committed): `client/public/pwa-192x192.png`, `client/public/pwa-512x512.png`, `client/public/maskable-icon-512x512.png`, `client/public/apple-touch-icon-180x180.png`
- Modify: `client/index.html`

**Interfaces:**
- Consumes: the manifest icon entries declared in Task 1 (file names must match the generated files).
- Produces: real PNG icons in `public/` and iOS/standalone meta tags in `index.html`.

- [ ] **Step 1: Install the asset generator**

```bash
cd client && npm install -D @vite-pwa/assets-generator@^1.0.0
```

- [ ] **Step 2: Create the generator config**

Create `client/pwa-assets-generator.config.js`:

```js
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
```

- [ ] **Step 3: Generate the icons**

Run: `cd client && npx pwa-assets-generator`
Then: `cd client && ls public/pwa-192x192.png public/pwa-512x512.png public/maskable-icon-512x512.png public/apple-touch-icon-180x180.png`
Expected: all four paths listed. (The generator derives them from `public/icon.svg`.)

- [ ] **Step 4: Add native-feel meta tags to `index.html`**

In `client/index.html`, replace the `<head>` block's icon/viewport lines so the head reads:

```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#007bff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="socialGraph" />
    <title>Personal Social Graph</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
  </head>
```

- [ ] **Step 5: Build and verify icons land in `dist`**

Run: `cd client && npm run build && ls dist/pwa-192x192.png dist/pwa-512x512.png dist/maskable-icon-512x512.png dist/apple-touch-icon-180x180.png`
Expected: all four paths listed.

- [ ] **Step 6: Verify the manifest references the icons**

Run: `cd client && grep -c "pwa-512x512.png" dist/manifest.webmanifest`
Expected: count `>= 1`.

- [ ] **Step 7: Commit**

```bash
cd client && git add package.json package-lock.json pwa-assets-generator.config.js public/pwa-192x192.png public/pwa-512x512.png public/maskable-icon-512x512.png public/apple-touch-icon-180x180.png index.html && git commit -m "feat(pwa): generate app icons + add standalone/iOS head tags"
```

---

### Task 3: Offline-aware sync status in `useCloudSync`

**Files:**
- Modify: `client/src/hooks/useCloudSync.jsx`
- Create: `client/src/hooks/useCloudSync.test.jsx`

**Interfaces:**
- Consumes: the existing `useCloudSync(user, yamlText)` hook returning `{ syncStatus, fetchGraph, saveGraph, markSyncReady }`.
- Produces: `syncStatus` becomes `'offline'` when the browser goes offline, and a failed save while `navigator.onLine === false` yields `'offline'` instead of `'error'`. Adds latest-value refs (`yamlRef`, `userRef`, `readyRef`) reused by Task 4.

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/useCloudSync.test.jsx`:

```jsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudSync } from './useCloudSync.jsx';

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('useCloudSync offline detection', () => {
  beforeEach(() => {
    setOnline(true);
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets status to offline when an offline event fires', () => {
    const { result } = renderHook(() => useCloudSync({ id: 'u1' }, 'a: 1'));
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.syncStatus).toBe('offline');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/hooks/useCloudSync.test.jsx`
Expected: FAIL — `syncStatus` is `'idle'`, not `'offline'` (no offline listener yet).

- [ ] **Step 3: Add latest-value refs + offline listener**

In `client/src/hooks/useCloudSync.jsx`, after the existing ref declarations (after `const statusTimerRef = useRef(null);`) add:

```jsx
  const yamlRef = useRef(yamlText);
  const userRef = useRef(user);
  const readyRef = useRef(syncReady);
  yamlRef.current = yamlText;
  userRef.current = user;
  readyRef.current = syncReady;
```

Then add a new effect after the existing debounce effect (after its closing `}, [user, yamlText, syncReady, saveGraph]);`):

```jsx
  useEffect(() => {
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, []);
```

In the debounce effect, change the result line from:

```jsx
      setSyncStatus(ok ? 'saved' : 'error');
```

to:

```jsx
      setSyncStatus(ok ? 'saved' : (navigator.onLine ? 'error' : 'offline'));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/hooks/useCloudSync.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/hooks/useCloudSync.jsx src/hooks/useCloudSync.test.jsx && git commit -m "feat(sync): show offline status when network drops"
```

---

### Task 4: Reconnect auto-resync in `useCloudSync`

**Files:**
- Modify: `client/src/hooks/useCloudSync.jsx`
- Modify: `client/src/hooks/useCloudSync.test.jsx`

**Interfaces:**
- Consumes: `yamlRef`, `userRef`, `readyRef`, `lastSavedRef`, `saveGraph` from Task 3.
- Produces: on a browser `online` event, if a user is present, sync is ready, and local YAML differs from the last saved value, the hook pushes the latest YAML immediately (bypassing the 2500ms debounce) and sets status `saving` → `saved`/`error`.

- [ ] **Step 1: Write the failing test**

Append this `describe` block to `client/src/hooks/useCloudSync.test.jsx`:

```jsx
describe('useCloudSync reconnect auto-resync', () => {
  beforeEach(() => {
    setOnline(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flushes a pending save when the browser comes back online', async () => {
    const { result } = renderHook(() => useCloudSync({ id: 'u1' }, 'a: 1'));
    act(() => { result.current.markSyncReady(); });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/graph',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(result.current.syncStatus).toBe('saved');
  });

  it('does not flush when there is no logged-in user', async () => {
    const { result } = renderHook(() => useCloudSync(null, 'a: 1'));
    act(() => { result.current.markSyncReady(); });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/hooks/useCloudSync.test.jsx`
Expected: FAIL — the first new test's `fetch` is never called (no online listener flush yet).

- [ ] **Step 3: Add the online flush listener**

In `client/src/hooks/useCloudSync.jsx`, replace the offline-only effect from Task 3:

```jsx
  useEffect(() => {
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, []);
```

with:

```jsx
  useEffect(() => {
    const onOffline = () => setSyncStatus('offline');
    const onOnline = async () => {
      if (!userRef.current || !readyRef.current) return;
      if (yamlRef.current === lastSavedRef.current) return;
      setSyncStatus('saving');
      const ok = await saveGraph(yamlRef.current);
      setSyncStatus(ok ? 'saved' : 'error');
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [saveGraph]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/hooks/useCloudSync.test.jsx`
Expected: PASS (all four tests in the file).

- [ ] **Step 5: Run the full unit suite**

Run: `cd client && npx vitest run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd client && git add src/hooks/useCloudSync.jsx src/hooks/useCloudSync.test.jsx && git commit -m "feat(sync): auto-resync pending edits on reconnect"
```

---

### Task 5: PWA E2E — install metadata + offline boot

**Files:**
- Create: `client/playwright.pwa.config.js`
- Create: `client/e2e/pwa.spec.js`
- Modify: `client/package.json` (add `test:e2e:pwa` script)

**Interfaces:**
- Consumes: the built PWA from Tasks 1–2 (`vite build`) served by `vite preview`.
- Produces: an isolated Playwright config + spec proving the manifest is linked, the SW registers, and the app boots offline. Runs separately from the existing dev-based `test:e2e` suite, which is untouched.

- [ ] **Step 1: Add the PWA Playwright config**

Create `client/playwright.pwa.config.js`:

```js
import { defineConfig, devices } from '@playwright/test';

// PWA tests need a real service worker, which only runs against a production
// build — so serve `vite preview` (not `vite dev`). Isolated from the main
// e2e config (different port + testMatch) so the dev-based suite is unaffected.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'pwa.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5181',
    ...devices['Pixel 5'],
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 5181 --host 127.0.0.1',
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Add the test:e2e:pwa script**

In `client/package.json`, add to `"scripts"`:

```json
    "test:e2e:pwa": "playwright test --config playwright.pwa.config.js",
```

- [ ] **Step 3: Write the failing E2E spec**

Create `client/e2e/pwa.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('manifest is linked and service worker registers', async ({ page }) => {
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg;
  });
});

test('app boots and renders the graph while offline', async ({ page, context }) => {
  // First online load to populate the precache + the service worker.
  await page.goto('/');
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active);
  });
  await expect(page.locator('svg')).toBeVisible();

  // Now cut the network and reload — the shell must come from the SW cache.
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('svg')).toBeVisible();
});
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd client && npm run test:e2e:pwa`
Expected: both tests PASS. (The build runs as part of the webServer command.)

> If the offline reload flakes because the SW has not finished claiming clients, the `waitForFunction` on `reg.active` in Step 3 is the guard — do not add arbitrary timeouts.

- [ ] **Step 5: Commit**

```bash
cd client && git add playwright.pwa.config.js e2e/pwa.spec.js package.json && git commit -m "test(e2e): verify PWA install metadata + offline boot"
```

---

## Verification (whole feature)

- [ ] `cd client && npx vitest run` — all unit/component tests pass.
- [ ] `cd client && npm run test:e2e` — existing mobile regression suite still passes (unaffected by PWA, since the SW does not run under `vite dev`).
- [ ] `cd client && npm run test:e2e:pwa` — PWA install metadata + offline boot pass.
- [ ] Manual: `npm run build && npm run preview`, open in Chrome, run Lighthouse PWA audit → "Installable" passes; confirm the install prompt appears.
- [ ] Manual: on a phone, add to home screen → app opens standalone with the generated icon; airplane mode → app still boots and the graph is editable.
