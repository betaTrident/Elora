# Task 10 Frontend Report — Phase 10 Settings Page (web UI)

**Status:** DONE  
**Date:** 2026-08-13  
**Scope:** Frontend only. No `app/server/**` changes. No commit. No `IMPLEMENTATION_PLAN.md` edits.

## What you implemented

Replaced the Settings placeholder with a Polariss React 13 page (no `s-*`, no second TitleBar). Merchant copy uses **routine**.

### Settings page (`app/web/src/pages/Settings/index.tsx`)

- Kept named export `Settings` (matches `routes.tsx`).
- `PageLayout title="Settings"` only. No extra App Bridge `TitleBar`.
- GET `/api/settings` on load. SkeletonPage + SkeletonBodyText while loading (`aria-live`, same pattern as Dashboard/Activity).
- GET failure: critical Banner **Settings failed to load** with **Retry** (refetch, not full page reload).
- Card with heading **Default health threshold** and help **Routines scoring below this will trigger an alert.**
- RangeSlider `0–100`, `step={5}`, label `Threshold: ${threshold}`, `output`.
- Primary **Save settings** → `PUT /api/settings` `{ defaultThreshold: threshold }`. Toast **Settings saved**.
- Secondary **Recalculate all routines** → `POST /api/scores/recalculate-all` `{}`. Toast **Recalculated 1 routine** / **Recalculated N routines**.
- Save/recalculate failures: Banner + Retry. Buttons show `loading` and disable the other action.
- Toast is a Polariss `<Toast>` under `PageLayout` children (existing `Frame`).

### Activity filter (`app/web/src/pages/Activity/index.tsx`)

Added `{ label: 'Settings', value: 'settings.updated' }` to `ACTION_OPTIONS`.

### Types (`app/web/src/types/index.ts`)

Added `ShopSettings` and `RecalculateAllResponse`.

### Out of scope (honored)

- No Recalculate all on Dashboard or ritual list (single-ritual Recalculate on the form is unchanged).
- No Phase 11 theme / scoreSnapshots / scoring math.
- Did not edit `app/server/**`.

## What you tested and test results

| Suite | Result |
|---|---|
| `npx vitest run` (web) | **23 passed** (6 files) |
| `npx tsc --noEmit` (web) | pass |

Coverage:

- **`pages/Settings/__tests__/Settings.test.tsx` (new)**
  - RangeSlider from GET `{ defaultThreshold: 75 }` (label, heading, help copy)
  - Save clicks PUT `/api/settings` `{ defaultThreshold: 75 }` and toast **Settings saved**
  - Recalculate all clicks POST `/api/scores/recalculate-all` `{}` and toast **Recalculated 3 routines**
  - Banner + Retry when GET rejects
  - Banner + Retry when PUT rejects
- **`pages/Activity/__tests__/Activity.test.tsx`**
  - Action filter includes option **Settings**

## TDD Evidence

### RED

Tests written first against the Settings placeholder and Activity options without `settings.updated`.

```
Set-Location k:\Elora\app\web
npx vitest run src/pages/Settings/__tests__/Settings.test.tsx src/pages/Activity/__tests__/Activity.test.tsx
```

**5 failed | 4 passed (9)** (2 files).

Failing tests (abridged):

```
 FAIL  src/pages/Activity/__tests__/Activity.test.tsx > Activity > includes Settings in the action filter options
 TestingLibraryElementError: Unable to find an accessible element with the role "option" and name "Settings"

 FAIL  src/pages/Settings/__tests__/Settings.test.tsx > Settings > renders RangeSlider from GET defaultThreshold 75
 TestingLibraryElementError: Unable to find an element with the text: Threshold: 75

 FAIL  src/pages/Settings/__tests__/Settings.test.tsx > Settings > saves settings via PUT /api/settings with the loaded threshold
 TestingLibraryElementError: Unable to find an element with the text: Threshold: 75

 FAIL  src/pages/Settings/__tests__/Settings.test.tsx > Settings > recalculates all via POST /api/scores/recalculate-all
 TestingLibraryElementError: Unable to find an element with the text: Threshold: 75

 FAIL  src/pages/Settings/__tests__/Settings.test.tsx > Settings > shows a Banner when GET settings rejects
 TestingLibraryElementError: Unable to find an element with the text: Settings failed to load

 Test Files  2 failed (2)
      Tests  5 failed | 4 passed (9)
```

(Toast and PUT-failure assertions were added after the first GREEN to lock controller copy / save-error Banner.)

### GREEN

```
Set-Location k:\Elora\app\web
npx vitest run
npx tsc --noEmit
```

**23 passed** (6 files). `tsc --noEmit` exit 0.

## Files changed

- `app/web/src/pages/Settings/index.tsx` — Settings page implementation
- `app/web/src/pages/Settings/__tests__/Settings.test.tsx` — new
- `app/web/src/pages/Activity/index.tsx` — Settings action filter option
- `app/web/src/pages/Activity/__tests__/Activity.test.tsx` — Settings option assertion
- `app/web/src/types/index.ts` — `ShopSettings`, `RecalculateAllResponse`

## Self-review findings

- Named export, Polariss 13 only, no second TitleBar, routine copy, Recalculate all Settings-only: **pass**.
- Loading/error match Dashboard/Activity (skeleton + Banner retry), not spinner-only: **pass**.
- Toast uses Frame context via `PageLayout`; save/recalculate toasts asserted in tests: **pass**.
- `Settings()` is long (~160 lines), same shape as Dashboard / Activity / RitualForm. Not split.
- Help copy is a subdued paragraph, not RangeSlider `helpText`, matching the plan snippet. Screen readers may not associate it with the slider.
- Recalculate-all failure Banner is implemented; no dedicated unit test (save failure is covered).
- GET Retry presence is asserted; the refetch click itself is not.
- Backend recalculate-all is sequential; UI only shows button loading, no progress count.

## Issues or concerns

None blocking. Recalculate-all on a shop with many active routines will sit on a loading button until the sequential POST returns.
