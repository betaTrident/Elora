# Task 6 Backend Report — Dashboard Service & Route

**Status:** DONE  
**Date:** 2026-08-13  
**Commits:** none (per instructions)  
**Scope:** Backend only (`app/server`). Did not touch `app/web`.

## Summary

Replaced Phase 4 mock `GET /api/dashboard` zeros with Drizzle `getDashboardData(shopId)`. Route stays thin: `req.shop.shopId` → service → JSON. Existing 401 dashboard test and 200 contract kept green by mocking `getDashboardData` in `api.test.ts`. Ping tests’ `select().from().where().limit()` db mock chain is unchanged.

## TDD Workflow

| Phase | Result |
|-------|--------|
| RED | Added `dashboard.test.ts` importing `../services/dashboard` before the file existed. Vitest failed: `Failed to load url ../services/dashboard`. |
| GREEN | Implemented `services/dashboard.ts` (plan’s `getDashboardData` verbatim in spirit), wired `routes/dashboard.ts`, mocked service in `api.test.ts`. 31/31 tests pass. |

## Files Created

| File | Purpose |
|------|---------|
| `app/server/src/services/dashboard.ts` | `getDashboardData(shopId)` — active rituals, open alert count, last 5 activity logs, KPI counts, worst5 |
| `app/server/src/__tests__/dashboard.test.ts` | Unit tests with mocked `db` query chains |

## Files Modified

| File | Changes |
|------|---------|
| `app/server/src/routes/dashboard.ts` | `try/catch next`; `res.json(await getDashboardData(req.shop.shopId))` |
| `app/server/src/__tests__/api.test.ts` | `vi.mock('../services/dashboard')` returning zero counts + empty arrays so the 200 contract stays stable without changing the ping-style db mock |

## Service Behavior

- Active rituals: `and(eq(rituals.shopId, shopId), eq(rituals.status, 'active'))`
- Open alerts: `count()` where shop + `status = 'open'`
- Recent activity: shop filter, `orderBy(desc(createdAt))`, `.limit(5)`
- healthy = `lastScore !== null && lastScore >= scoreThreshold`
- broken = `lastScore !== null && lastScore < scoreThreshold`
- unscored = `lastScore === null`
- worst5 = scored rituals sorted ascending by `lastScore`, slice 0,5
- Dates left as `Date`; Express JSON serialization emits ISO strings

Imports: `{ rituals, alerts, activityLogs }` from `../db/schema` (index re-exports). No scoring engine, no GraphQL.

## Test Coverage

**`dashboard.test.ts` (4)**

1. Empty shop → zeros + empty `worst5` / `recentActivity`
2. Mixed scores → total/healthy/broken/unscored; threshold equality is healthy; worst5 ascending, unscored excluded, length 5
3. Open alerts aggregate `{ count: 3 }` → `counts.openAlerts === 3`
4. Activity query calls `.orderBy()` and `.limit(5)`; returns those 5 rows

**`api.test.ts`**

- GET `/api/dashboard` without token → 401 `{ error: 'Missing token' }` (unchanged parameterized case)
- GET `/api/dashboard` with token → 200 `{ counts: zeros, worst5: [], recentActivity: [] }` via mocked service

**`ping.test.ts`**

- Unchanged; db mock chain `select().from().where().limit()` still used for shop lookup

## Verification

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint
```

| Command | Result |
|---------|--------|
| `npx vitest run` | 3 files, **31 passed** (dashboard 4, ping 4, api 23) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 (existing eslint `MODULE_TYPELESS_PACKAGE_JSON` warning on `eslint.config.js` only) |

## Concerns

None blocking. Frontend half of Task 6 is out of scope for this report.
