# Requirements & Traceability Matrix — socialGraph

Reverse-engineered from the running app + source on branch `main` (2026-06-27). Two parts:

1. **Requirements** — app capabilities written as testable requirements, grouped by area.
2. **Traceability matrix** — each requirement → implementation (`file:symbol`) → automated test → coverage verdict.

## Legend

| Coverage | Meaning |
|----------|---------|
| ✅ Full | Behaviour has a direct automated test. |
| 🟡 Partial | Core logic (model) tested, but the UI wiring/handler is not. |
| ❌ None | No automated test; only manual / Playwright-driveable. |

Test file shorthand: **GD** `graph-document/graph-document.test.ts` · **CT** `utils/contact-time.test.js` · **GS** `view/GraphSearch.test.jsx` · **NP** `view/NodePanel.test.jsx` · **PF** `panels/person-form.test.js` · **DC** `panels/DailyCheckin.test.jsx` · **IP** `panels/InteractivePanel.test.jsx`.

---

## 1. Requirements

### Authentication & session (AUTH)
- **REQ-AUTH-1** User signs in with Google; a verified id-token mints a 7-day JWT httpOnly cookie and upserts the user.
- **REQ-AUTH-2** App resolves the current user from the cookie on load (`/me`).
- **REQ-AUTH-3** User can sign out (cookie cleared).
- **REQ-AUTH-4** Graph API endpoints reject unauthenticated requests.

### Cloud sync & conflict (SYNC)
- **REQ-SYNC-1** Edits autosave to the cloud, debounced (2.5 s), skipping no-op saves.
- **REQ-SYNC-2** On login the cloud graph is fetched and adopted.
- **REQ-SYNC-3** Sync state is surfaced (idle / saving / saved / error).
- **REQ-SYNC-4** Local vs cloud divergence raises a conflict dialog with keep-local / keep-cloud.

### Local persistence (PERSIST)
- **REQ-PERSIST-1** Initial graph loads from `localStorage`, else falls back to bundled `/graph.yml`.
- **REQ-PERSIST-2** Every graph change is written back to `localStorage`.

### Graph Document model (GD)
- **REQ-GD-1** Parse the YAML document to a plain object (`read`); empty input → `{}`.
- **REQ-GD-2** List people / list connections.
- **REQ-GD-3** Add a person, preserving comments/formatting.
- **REQ-GD-4** Assign the smallest free positive id when none given (`nextPersonId`).
- **REQ-GD-5** Edit a person; a name change cascades to peer connections.
- **REQ-GD-6** Remove a person; cascade-delete their connections.
- **REQ-GD-7** Carry an optional `recall` phrase (round-trips through add/edit; omitted when blank).
- **REQ-GD-8** Enforce invariants: `circle ∈ {1,2,3}`, name required — on add and edit.
- **REQ-GD-9** Unparseable YAML throws a typed `GraphDocumentError`.
- **REQ-GD-10** Add a connection (creating the list if absent).
- **REQ-GD-11** Remove a connection regardless of from/to direction.
- **REQ-GD-12** Edit a connection by merging a patch in either direction; no-op if none match.
- **REQ-GD-13** Notes: list / add (ordered, newest last) / remove by index; add is a no-op for unknown id; comments preserved.
- **REQ-GD-14** Contact log: read dates; set contacts for a date (sorted, deduped, idempotent, removes when dropped).
- **REQ-GD-15** List sectors (union of people sectors + `layout.sector_distribution` keys, deduped, sorted).
- **REQ-GD-16** List color groups (`display.colors` keys).
- **REQ-GD-17** Rename a color group, cascading to people and connections.
- **REQ-GD-18** Generic config path ops: `getIn` / `setIn` / `deleteIn`, creating intermediates and preserving comments.
- **REQ-GD-19** Rename a map key in place (position + value preserved; no-op when unchanged/empty/absent).

### Contact-time helpers (CT)
- **REQ-CT-1** "Check-in Day" flips at 03:00 local, not midnight (`checkinDayISO`).
- **REQ-CT-2** `daysSince` counts whole days between ISO dates.
- **REQ-CT-3** `formatLastContact` → "never" / "today" / "<n>d", ignoring contacts after the reference day.

### Visualization (VIZ)
- **REQ-VIZ-1** Render a force-directed graph from the parsed document (center, sectors, circles, color groups).
- **REQ-VIZ-2** Zoom and pan the canvas.
- **REQ-VIZ-3** Drag a node, constrained to its sector/circle band.
- **REQ-VIZ-4** Click a node → select it, pan/zoom to it, open its detail panel.
- **REQ-VIZ-5** Compute sector angles for layout (`calculateSectorAngles`).

### Node detail & notes UI (NODE)
- **REQ-NODE-1** Show the person's recall phrase (nothing when absent).
- **REQ-NODE-2** Do **not** show sector / circle / importance meta.
- **REQ-NODE-3** "Edit" fires `onEditPerson(id)`.
- **REQ-NODE-4** Add a note from the panel, stamped with today's date.
- **REQ-NODE-5** Remove a note from the panel.

### Person add/edit (PERSON)
- **REQ-PERSON-1** Add form focuses the Name field on open.
- **REQ-PERSON-2** Advanced fields hidden until toggled.
- **REQ-PERSON-3** Sticky add: keep sector, clear name, show a confirmation (`stickyReset`).
- **REQ-PERSON-4** Write recall when entered; omit the key when blank.
- **REQ-PERSON-5** Edit tab opens preselected on the person named by `editTargetId`.
- **REQ-PERSON-6** Auto-expand Advanced when the selected person has non-default values (`hasNonDefaultAdvanced`).
- **REQ-PERSON-7** `blankAddForm` yields an empty form with field defaults.

### Connection editor (CONN)
- **REQ-CONN-1** Add a connection via from/to person pickers.
- **REQ-CONN-2** Edit an existing connection.
- **REQ-CONN-3** Remove a connection.

### Config editor (CFG)
- **REQ-CFG-1** Edit dynamic maps (add / rename / delete keys — e.g. colors, sector distribution).
- **REQ-CFG-2** Edit dynamic arrays.

### Code panel (CODE)
- **REQ-CODE-1** Edit raw YAML with live parse-error display.
- **REQ-CODE-2** Download the YAML file.
- **REQ-CODE-3** Upload / import a YAML file.

### Graph search (SEARCH)
- **REQ-SEARCH-1** Search people by name.
- **REQ-SEARCH-2** Match against recall when the name does not match.
- **REQ-SEARCH-3** Pick fires `onSelect(id)`; same-named people disambiguated by recall.
- **REQ-SEARCH-4** Clear input and close dropdown after a pick.
- **REQ-SEARCH-5** No dropdown when the input is empty.

### Daily check-in (CHECKIN)
- **REQ-CHECKIN-1** Pre-check people already contacted today.
- **REQ-CHECKIN-2** Save stamps today on checked people; removes today from unchecked, keeping older dates.
- **REQ-CHECKIN-3** Changing the date re-seeds checkboxes from that date's log.
- **REQ-CHECKIN-4** Save can backfill a past date.
- **REQ-CHECKIN-5** Date input is capped at the Check-in Day (no future).
- **REQ-CHECKIN-6** Dirty date-switch guard: Cancel keeps edits, OK discards & re-seeds, no prompt when clean, baseline resets after Save.
- **REQ-CHECKIN-7** Search filters the visible people by name.

---

## 2. Traceability Matrix

| REQ | Implementation (`file:symbol`) | Test | Cov |
|-----|--------------------------------|------|-----|
| REQ-AUTH-1 | `server/src/auth.ts:POST /google` · `client/.../useAuth.jsx:loginWithGoogle` · `auth/GoogleLoginButton.jsx` | — | ❌ |
| REQ-AUTH-2 | `server/src/auth.ts:GET /me` · `useAuth.jsx` | — | ❌ |
| REQ-AUTH-3 | `server/src/auth.ts:POST /logout` · `useAuth.jsx:logout` · `auth/UserMenu.jsx` | — | ❌ |
| REQ-AUTH-4 | `server/src/auth.ts:requireAuth` · `server/src/graph.ts` | — | ❌ |
| REQ-SYNC-1 | `useCloudSync.jsx` (debounce effect, `saveGraph`) · `server/src/graph.ts:PUT /` | — | ❌ |
| REQ-SYNC-2 | `useCloudSync.jsx:fetchGraph` · `App.jsx:handlePostLogin` · `graph.ts:GET /` | — | ❌ |
| REQ-SYNC-3 | `useCloudSync.jsx:syncStatus` · `auth/SyncStatus.jsx` | — | ❌ |
| REQ-SYNC-4 | `App.jsx:handlePostLogin/handleKeepLocal/handleKeepCloud` · `auth/ConflictDialog.jsx` | — | ❌ |
| REQ-PERSIST-1 | `App.jsx` initial-load effect | — | ❌ |
| REQ-PERSIST-2 | `App.jsx` localStorage effect | — | ❌ |
| REQ-GD-1 | `graph-document/index.ts:read` | GD `read` | ✅ |
| REQ-GD-2 | `index.ts:listPeople/listConnections` | GD `listConnections` | 🟡 |
| REQ-GD-3 | `index.ts:addPerson` | GD `addPerson` | ✅ |
| REQ-GD-4 | `index.ts:nextPersonId` | GD `nextPersonId` | ✅ |
| REQ-GD-5 | `index.ts:editPerson` | GD `editPerson` (incl. rename cascade) | ✅ |
| REQ-GD-6 | `index.ts:removePerson` | GD `removePerson` | ✅ |
| REQ-GD-7 | `index.ts:addPerson/editPerson` (recall) | GD `recall` | ✅ |
| REQ-GD-8 | `index.ts:addPerson/editPerson` validation | GD `validation` | ✅ |
| REQ-GD-9 | `cst.ts:parse` · `types.ts:GraphDocumentError` | GD `parse errors` | ✅ |
| REQ-GD-10 | `index.ts:addConnection` | GD `connections` | ✅ |
| REQ-GD-11 | `index.ts:removeConnection` | GD `removeConnection` | ✅ |
| REQ-GD-12 | `index.ts:editConnection` | GD `editConnection` | ✅ |
| REQ-GD-13 | `index.ts:listNotes/addNote/removeNote` | GD `notes` | ✅ |
| REQ-GD-14 | `index.ts:getContactDates/setContactsForDate` | GD `contact log` | ✅ |
| REQ-GD-15 | `index.ts:listSectors` | GD `listSectors` | ✅ |
| REQ-GD-16 | `index.ts:listColorGroups` | GD `listColorGroups` | ✅ |
| REQ-GD-17 | `index.ts:renameColorGroup` | GD `renameColorGroup` | ✅ |
| REQ-GD-18 | `index.ts:getIn/setIn/deleteIn` | GD `config path operations` | ✅ |
| REQ-GD-19 | `index.ts:renameKey` | GD `renameKey` | ✅ |
| REQ-CT-1 | `utils/contact-time.js:checkinDayISO` | CT `checkinDayISO` | ✅ |
| REQ-CT-2 | `contact-time.js:daysSince` | CT `daysSince` | ✅ |
| REQ-CT-3 | `contact-time.js:formatLastContact` | CT `formatLastContact` | ✅ |
| REQ-VIZ-1 | `view/D3Graph.jsx` (simulation render) · `utils/d3-helper.js` | — | ❌ |
| REQ-VIZ-2 | `D3Graph.jsx` (`d3.zoom`) | — | ❌ |
| REQ-VIZ-3 | `D3Graph.jsx:drag` | — | ❌ |
| REQ-VIZ-4 | `D3Graph.jsx` click + `focusNode` | — | ❌ |
| REQ-VIZ-5 | `utils/layout-helper.js:calculateSectorAngles` | — | ❌ |
| REQ-NODE-1 | `view/NodePanel.jsx` | NP `recall` (×2) | ✅ |
| REQ-NODE-2 | `view/NodePanel.jsx` | NP `no longer shows … meta` | ✅ |
| REQ-NODE-3 | `view/NodePanel.jsx` | NP `fires onEditPerson` | ✅ |
| REQ-NODE-4 | `App.jsx:handleAddNote` + `NodePanel.jsx` | GD `addNote` (model only) | 🟡 |
| REQ-NODE-5 | `App.jsx:handleRemoveNote` + `NodePanel.jsx` | GD `removeNote` (model only) | 🟡 |
| REQ-PERSON-1 | `panels/InteractivePanel.jsx` · `ui/PersonForm.jsx` | IP `focuses the Name field` | ✅ |
| REQ-PERSON-2 | `InteractivePanel.jsx` | IP `hides Advanced` | ✅ |
| REQ-PERSON-3 | `panels/person-form.js:stickyReset` | IP `keeps sector…` + PF `stickyReset` | ✅ |
| REQ-PERSON-4 | `InteractivePanel.jsx` (recall) | IP `writes/omits recall` | ✅ |
| REQ-PERSON-5 | `InteractivePanel.jsx` (editTargetId) | IP `jumps to the Edit tab` | ✅ |
| REQ-PERSON-6 | `person-form.js:hasNonDefaultAdvanced` | IP `auto-expands` + PF `hasNonDefaultAdvanced` | ✅ |
| REQ-PERSON-7 | `person-form.js:blankAddForm` | PF `blankAddForm` | ✅ |
| REQ-CONN-1 | `panels/ConnectionEditor.jsx` (add tab) | GD `addConnection` (model only) | 🟡 |
| REQ-CONN-2 | `ConnectionEditor.jsx` (edit tab) | GD `editConnection` (model only) | 🟡 |
| REQ-CONN-3 | `ConnectionEditor.jsx` (remove) | GD `removeConnection` (model only) | 🟡 |
| REQ-CFG-1 | `panels/ConfigEditor.jsx:DynamicMap` | GD `setIn/deleteIn/renameKey/renameColorGroup` (model only) | 🟡 |
| REQ-CFG-2 | `ConfigEditor.jsx:DynamicArray` | GD `setIn` (model only) | 🟡 |
| REQ-CODE-1 | `panels/CodePanel.jsx` · `App.jsx:yamlError` | — | ❌ |
| REQ-CODE-2 | `CodePanel.jsx:handleDownload` | — | ❌ |
| REQ-CODE-3 | `CodePanel.jsx:handleUpload` | — | ❌ |
| REQ-SEARCH-1 | `view/GraphSearch.jsx` | GS `lists people whose name matches` | ✅ |
| REQ-SEARCH-2 | `GraphSearch.jsx` | GS `matches against recall` | ✅ |
| REQ-SEARCH-3 | `GraphSearch.jsx` | GS `fires onSelect` + `distinguishes same-named` | ✅ |
| REQ-SEARCH-4 | `GraphSearch.jsx` | GS `clears the input and closes` | ✅ |
| REQ-SEARCH-5 | `GraphSearch.jsx` | GS `shows no dropdown when empty` | ✅ |
| REQ-CHECKIN-1 | `panels/DailyCheckin.jsx` | DC `pre-checks people` | ✅ |
| REQ-CHECKIN-2 | `DailyCheckin.jsx` | DC `Save stamps today` + `Save removes today` | ✅ |
| REQ-CHECKIN-3 | `DailyCheckin.jsx` | DC `changing the date re-seeds` | ✅ |
| REQ-CHECKIN-4 | `DailyCheckin.jsx` | DC `Save writes contacts onto the selected past date` | ✅ |
| REQ-CHECKIN-5 | `DailyCheckin.jsx` | DC `caps the date input` | ✅ |
| REQ-CHECKIN-6 | `DailyCheckin.jsx` | DC `guards a dirty date switch` (×3) + `Save resets the baseline` | ✅ |
| REQ-CHECKIN-7 | `DailyCheckin.jsx` | DC `search filters` | ✅ |

---

## 3. Coverage summary

| Area | Reqs | ✅ | 🟡 | ❌ |
|------|-----:|---:|---:|---:|
| AUTH | 4 | 0 | 0 | 4 |
| SYNC | 4 | 0 | 0 | 4 |
| PERSIST | 2 | 0 | 0 | 2 |
| GD (model) | 19 | 18 | 1 | 0 |
| CT | 3 | 3 | 0 | 0 |
| VIZ | 5 | 0 | 0 | 5 |
| NODE | 5 | 3 | 2 | 0 |
| PERSON | 7 | 7 | 0 | 0 |
| CONN | 3 | 0 | 3 | 0 |
| CFG | 2 | 0 | 2 | 0 |
| CODE | 3 | 0 | 0 | 3 |
| SEARCH | 5 | 5 | 0 | 0 |
| CHECKIN | 7 | 7 | 0 | 0 |
| **Total** | **69** | **43** | **8** | **18** |

### Biggest gaps (no automated coverage)
- **Whole backend** (AUTH, SYNC server routes) — no server test suite exists.
- **Cloud sync + conflict** client logic (debounce, fetch-on-login, conflict resolution).
- **D3 visualization** (render, zoom, pan, constrained drag, click-to-focus).
- **Code panel** YAML editing + file download/upload.
- **Connection / Config editors** — model is well-tested, but the panel UIs that drive it are not.

> **Dev-only note:** a `POST /api/auth/dev-login` route was added to `server/src/auth.ts` for local UI navigation (hard-404 in production). It is not a product requirement and is excluded from the matrix.
