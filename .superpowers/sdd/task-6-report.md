# Task 6 — Dashboard Page & KPIs: Report

> Backend portion landed separately — see `task-6-backend-report.md`.

---

## Frontend Implementation

### Files created

| File | Purpose |
|---|---|
| `app/web/src/utils/formatRelativeTime.ts` | Relative-time formatter (just now / N min ago / N h ago / N d ago / date) |
| `app/web/src/pages/Dashboard/KpiCards.tsx` | 4-card KPI grid (Total routines, Healthy, At risk/Broken, Open alerts) |
| `app/web/src/pages/Dashboard/RitualHealthTable.tsx` | `IndexTable` worst-5 routines; columns: name link, ScoreBadge, threshold, last checked |
| `app/web/src/pages/Dashboard/RecentActivity.tsx` | Card + BlockStack; max 5 activity log entries with relative timestamps |
| `app/web/src/pages/Dashboard/__tests__/Dashboard.test.tsx` | 3 required tests (empty state, error banner, KPI labels) |
| `app/web/src/test-setup.ts` | jsdom `window.matchMedia` stub required by Polaris breakpoints |

### Files modified

| File | Change |
|---|---|
| `app/web/src/pages/Dashboard/index.tsx` | Full implementation replacing placeholder |
| `app/web/vitest.config.ts` | Added `setupFiles: ['./src/test-setup.ts']` |

---

## Design compliance

- **Loading:** `SkeletonPage` + `SkeletonBodyText` wrapped in `aria-live="polite" aria-atomic="true"` div — no spinner-only state.
- **Empty:** `counts.total === 0` triggers Polaris `EmptyState` wrapper with heading "Start tracking your beauty routines", description, and CTA → `/rituals/new`.
- **Error:** `Banner tone="critical"` inside `PageLayout` (chrome stable), `action={{ content: 'Retry', onAction: () => window.location.reload() }}`.
- **KPI cards:** 4-cell `Grid` (3/12 per card on md+, 6/12 on xs/sm). Tones: `success` (Healthy), `critical` (At risk / Broken), `caution` (Open alerts).
- **RitualHealthTable:** `IndexTable selectable={false}`, 4 headings, links to `/rituals/:id/edit`, `ScoreBadge` for score column.
- **RecentActivity:** Card + BlockStack, max 5 entries, summary + `formatRelativeTime(createdAt)`.
- **Heading hierarchy:** `<Page title>` → h1; section headings `<Text as="h2" variant="headingMd">`.
- **No `s-*` web components**, no custom CSS, no Tailwind, no Spinner-only loading.
- **Fields used:** `ritual.title`, `ritual.lastScore`, `ritual.scoreThreshold`, `ritual.lastScoredAt` — matches resolved schema.

---

## TDD cycle

### RED → all tests failed before implementation

Dashboard tests were written before any component code existed. The test file alone produced:
- Suite error: `Cannot find module '@testing-library/dom'` (missing transitive dep)
- After installing `@testing-library/dom`: `TypeError: window.matchMedia is not a function` (Polaris jsdom limitation)

Both failures confirmed tests were truly RED.

### Fixes applied

1. `npm install --save-dev @testing-library/dom` in `app/web`
2. `src/test-setup.ts` stubs `window.matchMedia` for jsdom; referenced via `vitest.config.ts setupFiles`

### GREEN

```
Test Files  2 passed (2)
     Tests  7 passed (7)   ← 4 Dashboard + 3 pre-existing ScoreBadge
  Duration  ~12 s
```

`npx tsc --noEmit` → **0 errors**.

---

## Concerns / notes

- `@testing-library/dom` was not a direct dev dependency in `app/web/package.json`; it is now. `@testing-library/react` v16 requires it.
- The `vi.mock` hoisting pattern is used — mocks for `../../../services/api` and `@shopify/app-bridge-react` are applied before imports.
- `window.location.reload()` on Retry is plan-mandated; a refetch approach would be preferable for production but is acceptable per brief.
- `Grid.Cell` with `columnSpan={{ xs: 6, lg: 8 }}` / `{ xs: 6, lg: 4 }` implements the 8/12 + 4/12 layout from design §4. On mobile both sections stack full-width.
- No commit made per constraints.
