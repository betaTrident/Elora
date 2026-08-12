# Task 5: Phase 5 — Frontend Shell (Vite + Polaris)

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 5.

## Where this fits

Phases 0–4 are done. Phase 3 already has Vite + Polaris 13 `AppProvider` + App Bridge CDN + `shopify.idToken()` in `api.ts`. Home is a ping page. This task replaces that with the admin shell: NavMenu, PageLayout, shared components, and **placeholder** pages for all 5 routes.

Work from `k:\Elora`. Do not commit. Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills (follow these)

- **shopify-polaris-app-home:** NavMenu + TitleBar from `@shopify/app-bridge-react`. Search docs before coding (`scripts/search_docs.mjs` in that skill). **Do NOT migrate to `s-*` Polaris web components.** This app is Polaris React 13 (plan + Phase 3). The skill’s “never import `@shopify/polaris`” applies to the new web-component stack, not this repo.
- **frontend-patterns:** composition, one Frame, loading/empty/error later in Phase 6
- **accessibility:** WCAG 2.2 AA — semantic headings, button names, 24px targets via Polaris
- **tdd-workflow:** tests first for ScoreBadge status logic
- **coding-standards:** small files, no mutation
- **Design notes:** read `k:\Elora\.superpowers\sdd\phase-5-6-design.md` if it exists; follow it for copy, layout, and placeholder UX. If missing, use Polariss-native admin (not marketing taste-skill).

## Controller resolutions (do not re-ask)

1. **Keep Polaris React 13** (`Frame`, `Page`, `Badge`, `EmptyState`, etc. from `@shopify/polaris`). Keep `App.tsx` as `BrowserRouter` + `AppProvider`. **No `AppBridgeProvider`** (v4 does not export it; CDN script is in `index.html`).
2. **PageLayout `primaryAction`:** Polariss `Page` expects `ComplexAction` (`{ content, url?, onAction? }`), not `React.ReactNode`. Type it that way. TitleBar stays App Bridge.
3. **One `Frame`:** put `Frame` in `PageLayout` as the plan shows. Do not also wrap `App.tsx` in `Frame`.
4. **Nav labels (plan verbatim):** Dashboard, Routines, Activity, Settings. Merchant copy says “routine”, not “ritual”.
5. **Replace ping homepage.** Dashboard route `/` is a **placeholder** in Phase 5 (Phase 6 fills KPIs). A tiny “Connected to {shop}” line is optional, not required.
6. **Do not implement Phase 6 dashboard data UI** (no KPI cards / health table / activity feed yet). Placeholder Dashboard is enough.
7. **Do not implement Phase 7+** ritual form logic or Resource Picker.

## Files

### `app/web/src/routes.tsx`

Plan snippet: `NavMenu` + Routes for `/`, `/rituals`, `/rituals/new`, `/rituals/:id/edit`, `/activity`, `/settings`, catch-all `Navigate` to `/`.

### `app/web/src/components/PageLayout.tsx`

Polaris `Frame` + `Page`. Fix primaryAction type as resolved above.

### `app/web/src/components/ScoreBadge.tsx`

Plan snippet verbatim (Healthy ≥ threshold and ≥ 80; At risk ≥ threshold; Broken below; Not scored if null).

### `app/web/src/components/ScoreBreakdown.tsx`

Plan snippet.

### `app/web/src/components/EmptyState.tsx`

Plan snippet wrapping Polariss `EmptyState`.

### Placeholder pages (Polaris PageLayout + TitleBar)

- `pages/Dashboard/index.tsx` — title Dashboard; short placeholder copy
- `pages/Rituals/index.tsx` — Routines list placeholder
- `pages/Rituals/RitualForm/index.tsx` — used for new + edit
- `pages/Activity/index.tsx`
- `pages/Settings/index.tsx`

### `app/web/src/types/index.ts`

Add shared types used by shell components (`ScoreBadge` props are local; still add stubs for `DashboardData` / `DashboardCounts` / ritual list item / `ActivityLog` so Phase 6 can fill them). Keep fields aligned with Phase 4/6 API:

```ts
export interface DashboardCounts {
  total: number
  healthy: number
  broken: number
  unscored: number
  openAlerts: number
}
export interface RitualSummary {
  id: string
  title: string
  lastScore: number | null
  scoreThreshold: number
  lastScoredAt?: string | Date | null
  status?: string
}
export interface ActivityLog {
  id: string
  summary: string
  entityType: string
  actorType: string
  createdAt: string | Date
  afterJson?: unknown
}
export interface DashboardData {
  counts: DashboardCounts
  worst5: RitualSummary[]
  recentActivity: ActivityLog[]
}
```

## Tests (TDD)

Add Vitest to `app/web` if missing (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`). Test `ScoreBadge` (or a extracted `getScoreStatus`):

- null → Not scored
- 90, threshold 70 → Healthy
- 75, threshold 70 → At risk
- 50, threshold 70 → Broken

Do not require Playwright/E2E (Phase 14).

## Commands (PowerShell: no `&&`)

```
Set-Location k:\Elora\app\web
npx tsc --noEmit
npx vitest run
```

If web has no lint script, skip eslint.

## Done when

- App loads with Polariss Frame + NavMenu
- `/rituals`, `/activity`, `/settings` (and form routes) render placeholders without errors
- ScoreBadge tests pass; `tsc --noEmit` passes
- No new CORS/CSP headers needed (Phase 3 already set server CSP)

## Constraints

- No git commit
- No secrets in report
- Do not change server routes except if a type-only import is required (it should not be)
- Keep `api.ts` idToken fetch helper

## Report

`k:\Elora\.superpowers\sdd\task-5-report.md`
