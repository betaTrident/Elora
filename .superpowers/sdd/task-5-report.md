# Task 5 Report: Phase 5 Frontend Shell

## Status

COMPLETE

## Commits

None

## Test Summary

**RED (before implementation):**
- `src/components/__tests__/ScoreBadge.test.ts` — 1 file failed, 0 tests ran
- Cause: `getScoreStatus` import resolved to a non-existent file

**GREEN (after implementation):**
- `src/components/__tests__/ScoreBadge.test.ts` — 1 file passed, **4/4 tests passed**
  - returns not-scored for null score ✓
  - returns healthy when score >= threshold and >= 80 ✓
  - returns at-risk when score >= threshold but < 80 ✓
  - returns broken when score < threshold ✓
- `npx tsc --noEmit` — exit 0, no errors

## Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | `DashboardCounts`, `RitualSummary`, `ActivityLog`, `DashboardData` |
| `src/utils/scoreStatus.ts` | Pure `getScoreStatus` function (extracted for testability) |
| `src/components/ScoreBadge.tsx` | Polaris `Badge` wrapper with score/threshold/tone logic |
| `src/components/PageLayout.tsx` | Polaris `Frame` + `Page` + App Bridge `TitleBar` |
| `src/components/ScoreBreakdown.tsx` | Routine title + ScoreBadge layout |
| `src/components/EmptyState.tsx` | Polaris `EmptyState` with "Start tracking" copy and CTA |
| `src/pages/Dashboard/index.tsx` | Placeholder Dashboard (title: "Dashboard") |
| `src/pages/Rituals/index.tsx` | Placeholder Routines list (title: "Routines") |
| `src/pages/Rituals/RitualForm/index.tsx` | Create / Edit form placeholder |
| `src/pages/Activity/index.tsx` | Placeholder Activity log (title: "Activity") |
| `src/pages/Settings/index.tsx` | Placeholder Settings (title: "Settings") |
| `src/routes.tsx` | NavMenu + all 6 routes + catch-all Navigate |
| `vitest.config.ts` | Vitest with jsdom environment |

## Architecture Decisions

- `getScoreStatus` extracted to `src/utils/scoreStatus.ts` (pure function, no Polaris dependency) — avoids `window.matchMedia` in jsdom tests while still being re-exported from `ScoreBadge.tsx` for consumers.
- `NavMenu` rendered once at routes level; `Frame` + `TitleBar` per-page inside `PageLayout` (only one page active at a time via React Router).
- `ScoreBadge` uses U+00B7 `·` separator per design spec.
- `Page primaryAction` typed as Polaris `ComplexAction` per controller resolution.

## Concerns

- `vitest.config.ts` emits a CJS/ESM warning (Vite deprecation noise); functional, non-blocking. Can be resolved by adding `"type": "module"` to `package.json` in a later cleanup.
- `@shopify/app-bridge-react` v4.2.12 `TitleBar`/`NavMenu` are custom web element wrappers (`ui-title-bar`, `ui-nav-menu`) — they only function in a real Shopify embedded context. Local dev shows placeholder pages without the admin chrome.

## Report Path

`k:\Elora\.superpowers\sdd\task-5-report.md`

---

## Fix Report (Critical + Important review findings)

### Status

FIXED

### Files Changed

| File | Change |
|------|--------|
| `src/components/ScoreBreakdown.tsx` | Replaced wrong `RitualSummary`-based impl with plan API: `BreakdownItem { label, value, max, description }[]`; renders `BlockStack` of `Box` + label text + `ProgressBar size="small"` + subdued description |
| `src/components/PageLayout.tsx` | Added `titleBarTitle?: string` prop (defaults to `title`); `TitleBar` now uses `titleBarTitle ?? title` |
| `src/components/EmptyState.tsx` | Converted from zero-arg hardcoded component to props wrapper: `heading`, `description`, `action?`, `image?`; default image is Shopify CDN emptystate-files.png |
| `src/pages/Dashboard/index.tsx` | Passes `titleBarTitle="RitualScore"` so admin chrome shows `RitualScore` while Page heading reads `Dashboard` |
| `src/assets/elora-logo.png` | Deleted (unused; design forbids Elora logo in admin) |
| `src/assets/` (directory) | Removed (empty after logo deletion) |

### Test Commands

```
Set-Location k:\Elora\app\web
npx vitest run
npx tsc --noEmit
```

### Test Results

```
Test Files  1 passed (1)
     Tests  4 passed (4)
  Duration  1.67s
```

`npx tsc --noEmit` — exit 0, no errors.

### Concerns

- None introduced by this fix. Pre-existing CJS/ESM Vite deprecation warnings remain (non-blocking).
