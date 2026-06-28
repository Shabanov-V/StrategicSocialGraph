# PWA + Offline Support — Design

**Date:** 2026-06-28
**Status:** Approved (design)
**Scope:** Make the socialGraph web app installable and offline-capable as a Progressive Web App. No native binary, no `.apk`, no app store.

## Goal

Two user-facing outcomes:

1. **Feels native** — installable to phone home screen / desktop, opens fullscreen in its own window with an app icon, theme color, and splash.
2. **Works offline** — the app boots and the graph is viewable/editable with no network; cloud sync resumes automatically on reconnect.

PWA only. A PWA can later be wrapped (TWA/Capacitor) into an `.apk` without redesign, but that is explicitly out of scope here.

## Why this is small

The data layer is already local-first: the graph YAML is stored in `localStorage` (`STORAGE_KEY = 'graphYaml'`) and loaded *before* any network call (`client/src/App.jsx`). Cloud sync is secondary. So "offline" mostly requires caching the **app shell** (built JS/CSS/HTML/icons) so the app can boot with no network — the data already survives offline.

One real gap exists: offline edits are saved to `localStorage` but the cloud push (`useCloudSync`) fails silently and only retries on the *next* edit. This design adds reconnect auto-resync to close that gap.

## Approach

Use **`vite-plugin-pwa`** (Workbox under the hood). Rejected alternatives: hand-rolled manifest + service worker (owns cache versioning, error-prone, no upside); Capacitor/Tauri wrap (native shell, app-store scope, ruled out).

## Architecture

Three layers, all in `client/`:

1. **Manifest** — name `socialGraph`, `display: standalone`, theme + background color pulled from `styles/tokens.css`, generated icons. Drives installability and native feel (own window, icon, splash).
2. **Service worker (Workbox via plugin, `registerType: autoUpdate`)** — precache the built app shell so the app boots offline. Runtime caching rules:
   - `/api/*` (incl. `/api/auth/*`) → **NetworkOnly**. Auth and sync must never be served stale.
   - `/graph.yml` (initial seed) → **NetworkFirst**, fall back to cache.
   - New deploy refreshes the SW in the background; it activates on next load.
3. **Data layer** — unchanged. `localStorage` remains the source of truth. Offline = read/edit the local copy.

## Files

New + changed (all in `client/`, none in `server/`):

- **`vite.config.js`** — add `VitePWA({...})` to plugins; manifest + Workbox config live here.
- **`package.json`** — add `vite-plugin-pwa` dev dependency. No new runtime deps (Workbox is bundled by the plugin).
- **`public/icons/`** — generated `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`. Source SVG (graph/node motif) committed for re-export. Placeholder art now; swappable later.
- **`index.html`** — add `<meta name="theme-color">`, `apple-touch-icon` link, and apple mobile-web-app meta tags (iOS standalone + icon).
- **`src/hooks/useCloudSync.jsx`** — reconnect auto-resync + offline-aware status (below).
- **`src/components/auth/SyncStatus.jsx`** — render an `offline` state.

## Reconnect auto-resync + offline indicator

Changes in `useCloudSync.jsx`:

- **Pending detection** — local YAML ≠ `lastSavedRef.current` means a cloud push is owed ("dirty").
- **Reconnect flush** — an effect adds `window.addEventListener('online', ...)`. On fire: if logged in **and** dirty, flush a save immediately via `saveGraph`, bypassing the 2500ms debounce.
- **Offline event** — `window.addEventListener('offline', ...)` sets `syncStatus = 'offline'`.
- **Save-fail branch** — when a save fails and `!navigator.onLine`, set status `offline` (not `error`). Genuine failures while online still surface `error`.

State machine: `idle → saving → saved → idle`; network drop at any point → `offline`; `online` event → flush → `saving → saved`.

`SyncStatus.jsx` gains one branch: `offline` → "Offline — saved locally".

Offline edits continue updating `localStorage` (already handled in `App.jsx`); only the cloud push waits for reconnect.

## Error handling / edge cases

- **SW update while app open** — `autoUpdate`; new SW activates on next load. Worst case: stale shell until reload. No update-prompt UI (YAGNI). Data unaffected (localStorage).
- **`/api/*` offline** — NetworkOnly → fetch throws → already caught in the hooks (`catch { return false/null }`). No stale auth/sync served.
- **`/graph.yml` offline first-run** — NetworkFirst falls to cache; if never cached (brand-new install with zero network ever), the existing `App.jsx` catch sets `yamlError`. Accepted limitation.
- **localStorage blocked/full** — existing try/catch around every `setItem` already swallows; no regression.
- **iOS** — no `beforeinstallprompt` event; install is manual "Add to Home Screen". Apple meta tags provide standalone display + icon. Documented, not coded around.
- **Auth + offline** — Google login needs network. Offline launch with a prior session: `/api/auth/me` fails → treated as logged-out → app runs local-only (read/edit). Reconnect re-auths via the normal flow, then auto-resync flushes.

## Testing

- **Unit (Vitest):** `useCloudSync` reconnect logic — mock `navigator.onLine`, dispatch `online`/`offline` events; assert flush fires when dirty, assert `offline` status set. `SyncStatus` renders the `offline` branch.
- **Build assertion:** `vite build` emits `manifest.webmanifest`, `sw.js`, and a precache manifest. Verified manually / in CI.
- **E2E (Playwright):** manifest linked + SW registers; offline boot via `context.setOffline(true)` then reload asserts the graph renders from cache. Extends the existing `test:e2e` suite.
- **Manual:** Lighthouse PWA audit (installable pass); real-device add-to-home-screen.

## Out of scope

- `.apk` / native packaging / app-store distribution.
- Background sync API / push notifications.
- Update-prompt UI for new service-worker versions.
- Offline-first conflict resolution beyond the existing `ConflictDialog` flow.
