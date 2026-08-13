# Task 9 Frontend Report — Health Score Engine + Alerts (Web UI)

## What Was Implemented

### `AlertBanner.tsx`
- New component rendering a Polaris `Banner` list from open alerts.
- `critical` severity → `tone="critical"`; `warning` → `tone="warning"`.
- Empty array → renders nothing (`null`).

### Dashboard (`pages/Dashboard/index.tsx`)
- Fetches `GET /api/alerts` in parallel with `GET /api/dashboard` on mount.
- Shows `AlertBanner` above KPIs on the populated dashboard view (`counts.total > 0`).
- Alerts fetch failure does not block the empty-state path; if dashboard succeeded but alerts failed, shows a critical Banner with Retry that re-fetches alerts only.

### RitualForm (`pages/Rituals/RitualForm/index.tsx`)
- Maps API `ScoreBreakdown` to three `BreakdownItem` bars via `mapScoreBreakdownToItems`: **Availability**, **Completeness**, **Margin**.
- Renders existing `ScoreBreakdown` component inside the success Banner after save and after Recalculate.
- Edit form only: secondary action **Recalculate** calls `POST /api/rituals/:id/recalculate` and displays returned score + breakdown.

### Supporting changes
- `types/index.ts`: `Alert`, `RitualRecalculateResponse`.
- `utils/mapScoreBreakdown.ts`: breakdown → `BreakdownItem[]` mapper.
- `PageLayout.tsx`: `secondaryActions` prop for Polaris Page secondary actions.
- `test-setup.ts`: `afterEach(cleanup)`, `ResizeObserver` mock for Polaris Popover in tests.

## What Was Tested and Test Results

| Suite | Result |
|-------|--------|
| `npx vitest run` (app/web) | **17 passed** (5 files) |
| `npx tsc --noEmit` (app/web) | **0 errors** |

### New / updated tests
- **Dashboard**: path-aware `api.get` mocks; alert message visible when alerts returned; no alert text when `[]`.
- **RitualForm**: three breakdown labels after save with breakdown; Recalculate button on edit + POST to recalculate endpoint.

## TDD Evidence

### RED — `Set-Location k:\Elora\app\web; npx vitest run`

Before implementation (tests added, components not yet built):

```
Test Files  2 failed | 3 passed (5)
Tests       4 failed | 13 passed (17)

FAIL Dashboard > shows alert message when /api/alerts returns an open alert
  Unable to find an element with the text: Routine score 45 is below threshold 70

FAIL Dashboard > does not show alert message when /api/alerts returns empty array
  (mockGet not path-aware — dashboard/alerts conflation)

FAIL RitualForm > shows three breakdown labels after successful save with breakdown
  Unable to find an element with the text: /Availability/

FAIL RitualForm > shows Recalculate on edit form and POSTs recalculate endpoint
  Unable to find role "button" and name "Recalculate"
```

### GREEN — `Set-Location k:\Elora\app\web; npx vitest run`

After implementation:

```
Test Files  5 passed (5)
Tests       17 passed (17)
```

## Files Changed

| File | Change |
|------|--------|
| `app/web/src/components/AlertBanner.tsx` | **New** |
| `app/web/src/components/PageLayout.tsx` | `secondaryActions` support |
| `app/web/src/pages/Dashboard/index.tsx` | Alerts fetch + AlertBanner |
| `app/web/src/pages/Dashboard/__tests__/Dashboard.test.tsx` | Alert tests + path-aware mocks |
| `app/web/src/pages/Rituals/RitualForm/index.tsx` | Breakdown UI + Recalculate |
| `app/web/src/pages/Rituals/RitualForm/__tests__/RitualForm.test.tsx` | Breakdown + Recalculate tests |
| `app/web/src/types/index.ts` | `Alert`, `RitualRecalculateResponse` |
| `app/web/src/utils/mapScoreBreakdown.ts` | **New** mapper util |
| `app/web/src/test-setup.ts` | cleanup + ResizeObserver mock |

## Self-Review Findings

1. **Polaris ActionMenu** renders duplicate secondary-action buttons in a layout measurer; tests use `findAllByRole` and click the first Recalculate button. Production UI shows one visible control.
2. **Recalculate errors** reuse the validation Banner titled "Could not save routine" — functional but copy could say "recalculate" in a follow-up.
3. **Alert resolve UI** not in scope (no `POST /api/alerts/:id/resolve` on dashboard); banners are read-only as specified.
4. **Immutability** preserved: mapper returns new arrays; state updates use new objects.
5. **Merchant copy** uses "routine" consistently.

## Issues or Concerns

- None blocking. Optional follow-ups: dedicated error copy for Recalculate failures; AlertBanner unit test (Dashboard coverage is sufficient); alert dismiss/resolve actions when product adds that flow.
