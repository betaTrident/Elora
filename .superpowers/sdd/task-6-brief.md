# Task 6: Phase 6 — Dashboard Page & KPIs

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 6.

## Where this fits

Phase 5 must exist first for frontend (PageLayout, EmptyState, NavMenu, types). Backend `GET /api/dashboard` currently returns hardcoded zeros. This task: real `getDashboardData` via Drizzle + full Dashboard UI.

Work from `k:\Elora`. Do not commit. Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills

- **backend-patterns:** service layer; route stays thin
- **api-design:** existing GET `/api/dashboard` contract
- **tdd-workflow:** tests first
- **shopify-polaris-app-home:** TitleBar, Empty state, metrics cards, Index table — still **Polaris React 13**, not `s-*` web components
- **frontend-patterns** + **accessibility**
- **Design notes:** `k:\Elora\.superpowers\sdd\phase-5-6-design.md`

## Controller resolutions

1. **Schema lives at** `app/server/src/db/schema/*.ts` (not a single `schema.ts`). Import `{ rituals, alerts, activityLogs }` from `../db/schema`.
2. **Columns:** `rituals.lastScore`, `rituals.scoreThreshold`, `rituals.status` (`active`/`archived`), `alerts.status` (`open`/`resolved`), `activityLogs.createdAt`.
3. **`req.shop.shopId`** is the shop UUID string.
4. **Do not break Phase 4 API tests.** `api.test.ts` currently expects dashboard `{ counts: zeros, worst5: [], recentActivity: [] }`. Mock `getDashboardData` in that file to return that shape, **or** make the db mock thenable so empty arrays produce the same JSON. Ping tests use `select().from().where().limit()` — do not break that chain.
5. **Loading:** Phase 6 “Done when” requires a **loading skeleton** (Polaris `SkeletonPage` / `SkeletonBodyText` / `SkeletonDisplayText`). The plan snippet uses `Spinner`; prefer skeleton to satisfy Done when. Spinner alone is not enough.
6. **Empty state** when `!data || data.counts.total === 0` with CTA “Create routine” → `/rituals/new`.
7. **Error:** Banner tone critical + Retry button (`window.location.reload` as snippet, or reset state + refetch — refetch is better; reload is plan-mandated so either is OK).
8. **4 KPI cards:** Total routines, Healthy, At risk / Broken, Open alerts (unscored is in counts but not a 5th card).
9. **RitualHealthTable / RecentActivity** were not fully specified in the plan — follow design notes. Table: title, ScoreBadge, threshold. Activity: summary + relative/absolute time. `selectable={false}` on IndexTable.
10. **No Phase 7** Resource Picker / real ritual create. CTA may navigate to placeholder form.
11. Keep ping, CSP, export app, conditional listen.

## Backend

### `app/server/src/services/dashboard.ts`

Plan’s `getDashboardData(shopId)` verbatim in spirit:

- active rituals for shop
- open alert count
- last 5 activity logs
- healthy = lastScore !== null && lastScore >= scoreThreshold
- broken = lastScore !== null && lastScore < scoreThreshold
- unscored = lastScore === null
- worst5 = scored rituals sorted ascending by lastScore, slice 0,5

Serialize dates as ISO strings in JSON (Express will Date-serialize; frontend types allow string | Date).

### `app/server/src/routes/dashboard.ts`

Call `getDashboardData(req.shop.shopId)` inside try/catch next.

## Frontend (after Phase 5 files exist)

- `pages/Dashboard/index.tsx` — plan snippet + skeleton loading
- `pages/Dashboard/KpiCards.tsx` — plan snippet
- `pages/Dashboard/RitualHealthTable.tsx`
- `pages/Dashboard/RecentActivity.tsx`
- Use existing `api.get` + types from `src/types`

TitleBar: `title="RitualScore"` primaryAction Create routine → `/rituals/new`. If App Bridge v4 TitleBar types reject `primaryAction={{ label, url }}`, use child `<button variant="primary">` or `primaryAction={{ content, url }}` — match installed package types.

## Tests

**Server**

- Unit-test `getDashboardData` with mocked `db` (empty → zeros; mixed scores → correct counts/worst5; open alerts counted; activity limited to 5).
- Keep `api.test.ts` dashboard 200 + 401 cases green.

**Web**

- Dashboard empty state heading visible when counts.total === 0 (mock `api.get`)
- Error banner when `api.get` rejects
- KPI labels render when data present (optional if timeboxed; empty + error are required)

## Commands

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint

Set-Location k:\Elora\app\web
npx tsc --noEmit
npx vitest run
```

## Done when

- Dashboard shows 4 KPI cards, ranked ritual table, recent activity (when data exists)
- Empty state + CTA when no rituals
- Loading skeleton during fetch
- Error banner + retry on failure
- Server + web tests and tsc pass

## Constraints

- No git commit
- No secrets
- No scoring engine / GraphQL
- Windows PowerShell: no `&&`

## Report

`k:\Elora\.superpowers\sdd\task-6-report.md`
