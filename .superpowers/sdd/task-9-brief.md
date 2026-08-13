# Task 9: Phase 9 — Health Score Engine + Alerts

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 9 (lines 1550–1735) plus Phase 14 test names for alerts.

## Where this fits

Phases 0–8 are done. `calculateHealthScore` already lives in `app/server/src/services/scoring.ts` with the five unit tests in `scoring.test.ts` (copied in Phase 7). Recalculate already scores and logs. `GET /api/alerts` still returns `[]`. `upsertAlerts` does not exist. Score breakdown is not rendered in the UI. `ScoreBreakdown.tsx` exists but is unused.

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills

- **tdd-workflow:** tests first (RED then GREEN). Record RED/GREEN evidence in the report.
- **backend-patterns, api-design:** shop-scoped queries, try/catch `next(e)`, no secrets.
- **frontend-patterns, accessibility:** Polaris React 13 only — **not** `s-*` web components. Merchant copy says **routine**, not ritual.
- **shopify-polaris-app-home:** Banner, ProgressBar, Button, Page secondaryActions.

## Controller resolutions (do not re-ask)

1. **`calculateHealthScore` already matches the Phase 9 snippet.** Do not rewrite it unless a test fails. Confirm the five tests pass. Do not add extra scoring formulas.
2. **Implement `upsertAlerts` from the plan snippet** in `app/server/src/services/alerts.ts`. Match alerts by **`type` only** (one open `low_score` and one open `component_unavailable` per ritual) — that is plan-mandated, even if multiple products are OOS. Do **not** import unused `rituals` from schema.
3. **`logActivity` already exists.** Call it as `logActivity(db, { shopId, actorType: 'system', action: 'alert.opened' | 'alert.resolved', entityType: 'alert', entityId, summary })`. Do not rewrite `logActivity`.
4. **Call `upsertAlerts` AFTER the DB transaction returns** on create/update (avoid using global `db` inside an open transaction). On `recalculateRitual`, call it after the score UPDATE + recalculate activity log. Use `ritual.scoreThreshold` (fallback 70). Pass `shop.shopId`, ritual id, score, threshold, breakdown.
5. **Mock `upsertAlerts` in existing `rituals.test.ts`** so current chains do not break. Add one real assertion that `recalculateRitual` (and create or update) **calls** `upsertAlerts` with score/threshold/breakdown.
6. **`GET /api/alerts`:** shop-scoped open alerts, newest first. Return the row fields the UI needs: `id`, `ritualId`, `type`, `severity`, `message`, `status`, `createdAt`. Do not invent pagination.
7. **`POST /api/alerts/:id/resolve`:** shop-scoped; set `status: 'resolved'`, `resolvedAt: new Date()`; 404 if missing or wrong shop. Keep existing 401 sweep in `api.test.ts`.
8. **Do not** implement Phase 10 settings, scoreSnapshots writes, or change `GET /api/scores/:id` (leave the stub).
9. **Frontend Done when:** three labelled factor bars (Availability, Completeness, Margin) using existing `ScoreBreakdown`. Map API `ScoreBreakdown` → `BreakdownItem[]` (label + value/max + short description). Show after save (`saveResult.breakdown`) **and** after Recalculate on the edit form.
10. **Recalculate control:** secondary action on **edit** RitualForm (`POST /api/rituals/:id/recalculate`). Show returned breakdown. Do not add Recalculate to the list page.
11. **`AlertBanner`:** new component. Dashboard fetches `GET /api/alerts` (in addition to dashboard). Render banners for open alerts (severity `critical` → `tone="critical"`, `warning` → `tone="warning"`). Empty alerts → render nothing extra. Update Dashboard tests so `api.get` is path-aware (`/api/dashboard` vs `/api/alerts`).
12. **Immutability:** no in-place mutation of existing objects/arrays.
13. PowerShell: **no `&&`**. Separate commands.

## Backend

### `app/server/src/services/alerts.ts`

```ts
export async function upsertAlerts(
  shopId: string,
  ritualId: string,
  score: number,
  threshold: number,
  breakdown: ScoreBreakdown,
): Promise<void>
```

Behavior (plan):

- If `score < threshold`, open/keep `low_score` (`critical` if `score < threshold * 0.5`, else `warning`). Message: `Routine score ${score} is below threshold ${threshold}`.
- Each `breakdown.factors` where `!available` contributes `component_unavailable` / `critical` / `Product ${productId}: ${reason}`. Deduped by type when inserting (see resolution 2).
- Existing open alerts whose type is no longer in `issues` → set resolved + `logActivity` `alert.resolved`.
- New types not already open → insert + `logActivity` `alert.opened`.
- Do not insert a second open row of the same type.

Also export:

```ts
listOpenAlerts(shopId: string)
resolveAlert(shopId: string, id: string) // throws 404 `{ status: 404 }` like rituals `notFound()`
```

### Wire-up

- `createRitual` / `updateRitual`: after successful transaction.
- `recalculateRitual`: after score update + `ritual.recalculated` log.

### `app/server/src/routes/alerts.ts`

- `GET /` → `listOpenAlerts(req.shop.shopId)`
- `POST /:id/resolve` → `resolveAlert(req.shop.shopId, req.params.id)` then `{ ok: true }`
- try/catch `next(e)`

## Frontend

- `app/web/src/components/AlertBanner.tsx` — Polaris `Banner` list; props like `{ alerts: Array<{ id, severity, message, type }> }`.
- `app/web/src/pages/Dashboard/index.tsx` — fetch alerts; show `AlertBanner` above KPIs when `counts.total > 0` (same populated dashboard view). Do not block empty-state on alerts fetch failure; Banner + retry is fine if alerts fail while dashboard succeeded.
- `app/web/src/pages/Rituals/RitualForm/index.tsx` — ScoreBreakdown after save; Recalculate on edit; show breakdown after recalculate too.
- Helper (form-local or tiny util): map availability/completeness/margin to three items. Labels: **Availability**, **Completeness**, **Margin**.

## Tests (TDD)

**Server — `services/scoring.test.ts`:** already has the five cases; they must still pass.

**Server — `services/alerts.test.ts` (new):**

- Opens `low_score` when score below threshold
- Opens `component_unavailable` when a factor is unavailable
- Resolves when the issue is gone (second `upsertAlerts` call with healthy score + all available)
- Does not insert a duplicate open alert of the same type
- `listOpenAlerts` returns only that shop’s open rows
- `resolveAlert` marks resolved; missing id 404

**Server — `rituals.test.ts`:** mock `./alerts`; assert recalculate calls `upsertAlerts`.

**Server — `api.test.ts`:** `GET /api/alerts` 200 array with token (spy `listOpenAlerts`). Keep 401 sweep.

**Web — RitualForm:** after a successful save mock that returns a breakdown, the three labels appear. Edit mode has a Recalculate control; clicking it POSTs `/api/rituals/:id/recalculate`.

**Web — Dashboard:** when `/api/alerts` returns an open alert, its message is visible. When `[]`, no alert message.

**Web — optional:** AlertBanner unit test if easier than only Dashboard.

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

- All 5 score tests pass
- Recalculate calls `upsertAlerts` (OOS → `component_unavailable`; restock + recalculate → resolved)
- Score breakdown renders as 3 labelled factor bars
- Tests + tsc pass (server + web)

## Constraints

- No git commit, no secrets, no `IMPLEMENTATION_PLAN.md` edits
- No Phase 10 settings / Recalculate-all
- No scoreSnapshots persistence

## Reports

Backend only → `k:\Elora\.superpowers\sdd\task-9-backend-report.md`  
Frontend only → `k:\Elora\.superpowers\sdd\task-9-frontend-report.md`  
Both → `k:\Elora\.superpowers\sdd\task-9-report.md`
