# Task 15B Report — Phase 15 polish (Admin UI + mobile builder)

**Status:** DONE  
**Commits:** none  
**Work from:** `k:\Elora`  
**Did not edit:** `IMPLEMENTATION_PLAN.md`, `app/server/**`

## TDD evidence

1. **RED** — Added failing tests first, then ran `npx vitest run` from `app/web`.
   - Result: `Test Files  3 failed | 3 passed (6)` / `Tests  7 failed | 22 passed (29)`
   - Failures were the new behaviors only:
     - Dashboard: no `Resolve` button
     - Rituals: no `Routine archived` toast
     - RitualForm: no `Routine saved` toast, no `save-bar`, no load-error `Retry`
2. **GREEN** — Implemented Admin UI + CSS, re-ran tests.
   - Result: `Test Files  6 passed (6)` / `Tests  29 passed (29)`
3. Existing RitualForm / Rituals / Dashboard / Settings tests stayed green.

## What landed

### 1. Toast on every mutation

Polaris `Toast` inside existing `PageLayout` `Frame` (same pattern as Settings).

| Mutation | Message |
|----------|---------|
| RitualForm create / update | `Routine saved` |
| Rituals archive | `Routine archived` |
| Dashboard alert resolve | `Alert resolved` |

Create still navigates to `/rituals/:id/edit`. Toast + score Banner are passed via location state so they survive remount. Score Banner is not dropped.

### 2. Contextual Save Bar

App Bridge React `SaveBar` from `@shopify/app-bridge-react` (`open={isDirty}`).

- Dirty vs last loaded/saved snapshot: title, description, threshold, components
- Save → existing `handleSubmit`
- Discard → restore snapshot
- Successful save marks clean
- Tests mock `SaveBar` like `TitleBar`

Docs: searched `SaveBar` via shopify-polaris-app-home `search_docs.mjs` before writing. Used React `SaveBar` `open` prop (typed in `@shopify/app-bridge-react@4.2.12`).

### 3. Resolve alerts from Dashboard

`AlertBanner` now `Resolve` per alert. Dashboard calls `api.post(\`/api/alerts/${id}/resolve\`, {})`. Success removes that alert and toasts `Alert resolved`. Resolve failures show `Could not resolve alert` without replacing the dashboard.

### 4. RitualForm load error retry

Load-error Banner now has **Retry** (`GET /api/rituals/:id`) as primary action and **Back to routines** as secondary.

### 5. Mobile ritual builder stacked

In `theme/sections/soft-ritual-builder.liquid`, `.ritual-builder__result-products` is 1 column at `max-width: 479px` (matches existing `min-width: 480px` choice breakpoint). Tablet `max-width: 699px` stays 3-col. CSS-only; no locale changes.

Shopify Liquid skill:

1. `search_docs.mjs "stylesheet media query CSS grid"` before the edit
2. `validate.mjs` after the edit — **Overall Status: VALID** (artifact `task-15b-builder-css`, revision 1)

### 6. Console-clean build

```
Set-Location k:\Elora\app\web
npx vitest run
npm run build
```

- `tsc` passed (no TS errors, including SaveBar `variant="primary"` buttons)
- Vite production build succeeded

Pre-existing Vite notices (not introduced here, not trivial to remove without upgrading Vite / splitting Polaris):

- CJS Node API deprecation
- `outDir` (`app/server/public`) outside project root
- chunk > 500 kB after minification

Did not change server `console.log('Server ready')`. No eslint config churn.

## Files changed

| File | Change |
|------|--------|
| `app/web/src/pages/Rituals/RitualForm/index.tsx` | Toast, SaveBar, dirty snapshot, create location state, load Retry |
| `app/web/src/pages/Rituals/RitualForm/__tests__/RitualForm.test.tsx` | SaveBar mock; create/update toast; dirty/discard/clean; Retry |
| `app/web/src/pages/Rituals/index.tsx` | Archive toast (`Routine archived`) |
| `app/web/src/pages/Rituals/__tests__/Rituals.test.tsx` | Archive confirm → toast |
| `app/web/src/pages/Dashboard/index.tsx` | Resolve handler, toast, resolve-error Banner |
| `app/web/src/pages/Dashboard/__tests__/Dashboard.test.tsx` | `api.post` mock; Resolve click test |
| `app/web/src/components/AlertBanner.tsx` | Optional `onResolve` → Banner `Resolve` action |
| `theme/sections/soft-ritual-builder.liquid` | 1-col result cards at `max-width: 479px` |

## Tests

From `k:\Elora\app\web`:

```
npx vitest run
```

**29 passed / 6 files.** New coverage:

- RitualForm create toast + score Banner
- RitualForm update toast
- SaveBar shows when dirty; Discard restores snapshot
- SaveBar hides after successful save
- Load-error Retry re-fetches `GET /api/rituals/ritual-1`
- Rituals archive toast
- Dashboard Resolve → `POST /api/alerts/a1/resolve` + toast + alert removed

## Build result

```
npm run build
```

`tsc && vite build` **succeeded**. Output: `app/server/public` (existing config). No new TS/Vite errors.

## Concerns

None blocking.

- Create → edit still flashes the existing load skeleton while `GET /api/rituals/:id` runs; toast and score Banner return after load via location state.
- Vite CJS / chunk-size / outDir notices are pre-existing; left unchanged.
- Dashboard resolve failure Banner (`Could not resolve alert`) is extra defensive UI, not in the named checklist.

## Self-review

- Followed existing Polaris `PageLayout` / `Toast` / Banner retry patterns
- Did not restyle Admin or invent pages
- Did not touch `app/server`
- Copy used verbatim from the brief
- Immutability: discard/save snapshots copy component objects; alert list filtered without mutation
