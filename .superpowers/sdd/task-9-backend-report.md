# Task 9 Backend Report — Health Score Engine + Alerts

## Status

**Complete (backend only).** `upsertAlerts` opens/resolves shop-scoped alerts by type. `GET /api/alerts` lists open alerts newest first. `POST /api/alerts/:id/resolve` marks resolved. Create/update/recalculate call `upsertAlerts` after the write (after the transaction on create/update). Scoring was not rewritten; all 5 score tests still pass.

## Commits

None (per instructions).

## What was implemented

### `upsertAlerts(shopId, ritualId, score, threshold, breakdown)`

- If `score < threshold`, open/keep `low_score`. Severity `critical` when `score < threshold * 0.5`, else `warning`. Message: `Routine score ${score} is below threshold ${threshold}`.
- Each unavailable factor contributes `component_unavailable` / `critical` / `Product ${productId}: ${reason}`. Inserts are **deduped by type** (one open `low_score` and one open `component_unavailable` per ritual).
- Existing open alerts whose type is no longer in the issue set → `status: 'resolved'`, `resolvedAt: new Date()`, `logActivity` `alert.resolved`.
- New types not already open → insert + `logActivity` `alert.opened`.
- Existing query is shop-scoped (`shopId` + `ritualId` + `status: 'open'`). Does not import unused `rituals` from schema.

### `listOpenAlerts(shopId)` / `resolveAlert(shopId, id)`

- List: shop-scoped open rows, `orderBy desc createdAt`. Fields: `id`, `ritualId`, `type`, `severity`, `message`, `status`, `createdAt`.
- Resolve: shop-scoped; sets `status: 'resolved'`, `resolvedAt: new Date()`; throws `{ status: 404 }` if missing or wrong shop.

### Rituals wiring

- `createRitual` / `updateRitual`: `upsertAlerts` **after** the DB transaction returns (avoids using global `db` inside an open transaction).
- `recalculateRitual`: after score UPDATE + `ritual.recalculated` log. Threshold is `ritual.scoreThreshold` with fallback `70`.

### Routes

- `GET /` → `listOpenAlerts(req.shop.shopId)`
- `POST /:id/resolve` → `resolveAlert(req.shop.shopId, req.params.id)` then `{ ok: true }`
- try/catch `next(e)`

Scoring (`calculateHealthScore`) was left unchanged.

## What was tested

| Suite | Cases |
|-------|--------|
| `scoring.test.ts` | Existing 5 score cases (untouched) |
| `alerts.test.ts` | Opens `low_score`; opens `component_unavailable`; resolves when healthy; no duplicate open type; `listOpenAlerts` shop open rows; `resolveAlert` marks resolved; missing id 404 |
| `rituals.test.ts` | `upsertAlerts` mocked; create + recalculate assert call with score/threshold/breakdown |
| `api.test.ts` | `GET /api/alerts` 200 array with token (spy `listOpenAlerts`); 401 sweep kept |

## TDD Evidence

### RED

Command:

```
Set-Location k:\Elora\app\server
npx vitest run src/services/alerts.test.ts src/services/rituals.test.ts src/__tests__/api.test.ts src/services/scoring.test.ts
```

Failing output (excerpt):

```
 FAIL  src/services/alerts.test.ts [ src/services/alerts.test.ts ]
Error: Failed to load url ./alerts (resolved id: ./alerts) in K:/Elora/app/server/src/services/alerts.test.ts. Does the file exist?

 FAIL  src/__tests__/api.test.ts [ src/__tests__/api.test.ts ]
Error: Failed to load url ../services/alerts (resolved id: ../services/alerts) in K:/Elora/app/server/src/__tests__/api.test.ts. Does the file exist?

 FAIL  src/services/rituals.test.ts > rituals service > createRitual inserts ritual and components and returns score
AssertionError: expected "spy" to be called with arguments: [ 'shop-1', …(4) ]
Number of calls: 0

 FAIL  src/services/rituals.test.ts > rituals service > recalculateRitual logs ritual.recalculated with a routine summary
AssertionError: expected "spy" to be called with arguments: [ 'shop-1', 'ritual-1', 72, 70, …(1) ]
Number of calls: 0

 Test Files  3 failed | 1 passed (4)
      Tests  2 failed | 10 passed (12)
```

Scoring already passed (5 tests) during RED.

### GREEN

Command:

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint
```

Passing output (excerpt):

```
 ✓ src/services/scoring.test.ts (5 tests)
 ✓ src/services/activity.test.ts (5 tests)
 ✓ src/__tests__/dashboard.test.ts (4 tests)
 ✓ src/services/alerts.test.ts (7 tests)
 ✓ src/services/rituals.test.ts (7 tests)
 ✓ src/__tests__/ping.test.ts (4 tests)
 ✓ src/__tests__/api.test.ts (26 tests)

 Test Files  7 passed (7)
      Tests  58 passed (58)

npx tsc --noEmit   → exit 0
npm run lint       → exit 0
```

## Files changed

| File | Action |
|------|--------|
| `app/server/src/services/alerts.ts` | Created — `upsertAlerts`, `listOpenAlerts`, `resolveAlert` |
| `app/server/src/services/alerts.test.ts` | Created — 7 unit tests |
| `app/server/src/routes/alerts.ts` | Replaced stub with service calls |
| `app/server/src/services/rituals.ts` | Call `upsertAlerts` after create/update transaction and after recalculate log |
| `app/server/src/services/rituals.test.ts` | Mock `./alerts`; assert create + recalculate call `upsertAlerts` |
| `app/server/src/__tests__/api.test.ts` | `GET /api/alerts` 200 via `listOpenAlerts` spy |

Not changed: `scoring.ts`, `scoring.test.ts`, `app/web/**`, `IMPLEMENTATION_PLAN.md`. No git commit.

## Self-review findings

- Shop-scoped reads/writes on alerts; 404 uses the same `{ status: 404 }` pattern as rituals.
- `upsertAlerts` runs **outside** the create/update transaction, matching the controller resolution.
- Type-only matching is enforced: `uniqueByType` plus `alreadyOpen` by `type` prevents a second open row of the same type even when several products are OOS.
- No unused `rituals` schema import. `logActivity` signature unchanged.
- Immutability: issue lists are newly built; `breakdown.factors` is filtered, not mutated.
- Frontend not touched. Phase 10 settings / scoreSnapshots / `GET /api/scores/:id` not touched.

## Issues or concerns

1. **Manual `resolveAlert` does not `logActivity`.** Only `upsertAlerts` writes `alert.opened` / `alert.resolved`. Phase 14 QA mentions resolving an alert showing in activity; that will not happen for `POST /api/alerts/:id/resolve` unless logging is added later.
2. **If `upsertAlerts` fails after create/update**, the ritual row is already committed. That is the intended tradeoff (no global `db` inside the open transaction).
3. **Multiple OOS products share one `component_unavailable` row**; the stored message is the first unavailable factor. Plan-mandated.
4. **No HTTP test for `POST /api/alerts/:id/resolve`** (brief only required GET 200 + 401 sweep). Service-level 404 is covered.
5. **No real MySQL integration tests.** Alert query assertions are mock-level (`where` / `orderBy` called), same as activity/dashboard tests.

## Report path

`k:\Elora\.superpowers\sdd\task-9-backend-report.md`
