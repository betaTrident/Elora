# Task 8: Phase 8 — Activity Log

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 8.

## Where this fits

Phases 0–7 are done. `logActivity` already inserts on create/update/archive. `GET /api/activity` still returns `[]`. Recalculate does **not** log. Activity page is a placeholder.

Work from `k:\Elora`. Do not commit. Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills

- **shopify-polaris-app-home:** IndexTable, Filters, EmptyState, Skeleton — Polariss React 13, **not** `s-*`
- **frontend-patterns, accessibility, tdd-workflow, backend-patterns, api-design**
- Copy: merchant UI says **routine**; server summaries may still say ritual from Phase 7 — **new** log lines for recalculate should say **routine**. Optionally update create/update/archive summaries to “routine” while touching those calls (small, in-scope).

## Controller resolutions (do not re-ask)

1. **`logActivity` already exists** — do not rewrite it unless the insert contract is wrong. Add `listActivity`.
2. **Recalculate must log** `action: 'ritual.recalculated'` (keep action key stable; summary: `Recalculated routine "…"`), `afterJson: { score }`.
3. **GET `/api/activity`:** shop-scoped, `orderBy desc createdAt`, **hard cap 100** (Done when: <500ms for ≤100 entries). Optional filters: `action`, `entityType`, `actorType` as query strings (exact match). Ignore unknown params.
4. **Loading:** SkeletonPage / SkeletonBodyText, not spinner-only (Phase 6 design). TitleBar `Activity log`, Page title `Activity` (`titleBarTitle` on PageLayout).
5. **IndexTable + expand:** Polariss `IndexTable` children must be rows, not anonymous fragments. Use keyed fragments or an array of `IndexTable.Row`. Expand shows `afterJson` (and `beforeJson` if present) as JSON. `selectable={false}`.
6. **Filters:** Goal says filterable — Filters or Select for actorType (`all` / `merchant` / `system`) and/or action. Client can refetch with query params. Empty state when no rows.
7. **Do not** implement Phase 9 alerts UI or upsertAlerts (alert.opened logs can wait).
8. **ActivityLog type:** extend with `action`, `entityId?`, `beforeJson?` so expand/filter work.
9. **Dashboard RecentActivity** already reads last 5 from `getDashboardData` — do not break that shape (`id`, `summary`, `createdAt` still required).

## Backend

### `services/activity.ts`

Keep `logActivity`. Add:

```ts
listActivity(shopId: string, filters?: { action?: string; entityType?: string; actorType?: string; limit?: number })
```

Return rows for the shop, newest first, `Math.min(limit ?? 100, 100)`.

### `routes/activity.ts`

`GET /` → `listActivity(req.shop.shopId, req.query)` try/catch next. Do not require extra Zod beyond optional strings (empty string = unset).

### `services/rituals.ts`

`recalculateRitual`: after score update, `logActivity`. Include `shopId` on the score UPDATE WHERE if easy (defense-in-depth, not required unless you touch that line).

## Frontend

Replace `pages/Activity/index.tsx` placeholder.

- Fetch `/api/activity` (with filter query string when set)
- Error banner + retry
- EmptyState when `logs.length === 0` (heading like “No activity yet”)
- IndexTable: Action (summary), Entity (`entityType` Badge), Who (`actorType`), When (locale or `formatRelativeTime`)
- Row click toggles expand of JSON payload
- Keep Polariss-native; no custom CSS framework. A small `<pre>` for JSON is OK (plan snippet).

## Tests (TDD)

**Server**
- `listActivity` empty shop → `[]`
- returns newest first, capped at 100
- filters by `actorType` / `action`
- `recalculateRitual` calls `logActivity` (spy or mock insert)
- `GET /api/activity` 200 array with token; 401 without (existing 401 sweep)

**Web**
- Empty heading when `api.get` returns `[]`
- Renders a summary row when logs present
- Optional: click expands afterJson text

## Commands (PowerShell: no `&&`)

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint

Set-Location k:\Elora\app\web
npx vitest run
npx tsc --noEmit
```

## Done when

- create/update/archive/recalculate appear in Activity
- Row expands to show afterJson
- List capped at 100; page usable
- Tests + tsc pass

## Constraints

- No git commit, no secrets
- No Phase 9 scoring UI / alerts engine

## Reports

Backend only → `k:\Elora\.superpowers\sdd\task-8-backend-report.md`  
Frontend only → `k:\Elora\.superpowers\sdd\task-8-frontend-report.md`  
Both → `k:\Elora\.superpowers\sdd\task-8-report.md`
