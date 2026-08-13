# Task 10 Backend Report — Phase 10 Settings Page (server-side)

**Status:** DONE_WITH_CONCERNS  
**Date:** 2026-08-13  
**Scope:** Backend only. No `app/web/**` changes. No commit. No `IMPLEMENTATION_PLAN.md` edits.

## What you implemented

Replaced the in-memory settings `Map` with shop-scoped Drizzle persistence, kept the thin settings route, and added sequential “recalculate all active rituals”.

### Settings service (`app/server/src/services/settings.ts`)

- `getSettings(shopId)` is async. Reads `shop_settings` for the shop. Missing row still returns `{ defaultThreshold: 70 }`.
- `updateSettings(shop, defaultThreshold)` is async and takes `ShopContext` (for `logActivity` `actorId`).
- Persist with `insert` + `onDuplicateKeyUpdate` on `shopSettings` (same pattern as `auth.ts`). Plan `db.update` was rejected by the controller because a missing row would be a no-op.
- On successful PUT: `logActivity` with `actorType: 'merchant'`, `actorId: shop.userId ?? undefined`, `action: 'settings.updated'`, `entityType: 'shop_settings'`, `summary: Default threshold set to ${defaultThreshold}`, `afterJson: { defaultThreshold }`.
- Existing rituals’ `scoreThreshold` is not changed when the default changes. New rituals still pick up the stored default via existing `createRitual` (`input.scoreThreshold ?? settings?.defaultThreshold ?? 70`).

### Settings route (`app/server/src/routes/settings.ts`)

- GET: `await getSettings(req.shop.shopId)`
- PUT: Zod parse, `await updateSettings(req.shop, body.defaultThreshold)`, JSON `{ defaultThreshold }`
- Route stays thin: Zod + service + `next(e)`. No Drizzle in the route.

### Recalculate all (`app/server/src/services/rituals.ts`, `app/server/src/routes/scores.ts`)

- `recalculateAllRituals(shop)` lists **active** rituals (`listRituals(shop.shopId, 'active')`), calls existing `recalculateRitual` **sequentially**, returns `{ recalculated: number }`.
- Reuses scoring, `logActivity`, and `upsertAlerts` inside `recalculateRitual`.
- `POST /api/scores/recalculate-all` → `recalculateAllRituals(req.shop)` then `{ recalculated }`.
- `GET /api/scores/:id` stub is unchanged. POST is registered **before** `GET /:id` so `recalculate-all` is not captured as an id.

## What you tested and test results

| Suite | Result |
|---|---|
| `npx vitest run` (GREEN) | **67 passed** (8 files) |
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass (pre-existing `MODULE_TYPELESS_PACKAGE_JSON` warning on `eslint.config.js`) |

Coverage added:

- **`services/settings.test.ts` (new)**
  - GET missing row → `{ defaultThreshold: 70 }`
  - GET existing row → stored threshold (`80`)
  - PUT upserts (`insert` + `onDuplicateKeyUpdate`) and returns the new threshold
  - PUT calls `logActivity` with `settings.updated` and `Default threshold set to 85`
- **`services/rituals.test.ts`**
  - empty active list → `{ recalculated: 0 }`
  - two active rituals → `recalculateRitual` path runs twice (`upsertAlerts` twice, once per id)
- **`__tests__/api.test.ts`**
  - PUT 400 out-of-range kept
  - PUT 200 spies async `updateSettings` with `req.shop` + threshold
  - GET `/api/settings` 200 with spy
  - POST `/api/scores/recalculate-all` 200 `{ recalculated }` with spy
  - POST `/api/scores/recalculate-all` added to the 401 sweep

Optional `createRitual` default `80` test was **skipped** (brief: skip if too invasive). Persistence + existing `createRitual` settings read is the Done-when.

Web tests were **not** run (backend-only task).

## TDD Evidence

### RED

```
Set-Location k:\Elora\app\server
npx vitest run
```

Tests written first against the Map / missing `recalculateAllRituals`. **8 failed | 59 passed (67)**.

Failing tests (abridged):

```
 FAIL  src/services/rituals.test.ts > recalculateAllRituals returns { recalculated: 0 } ...
 TypeError: recalculateAllRituals is not a function

 FAIL  src/services/rituals.test.ts > recalculateAllRituals calls recalculateRitual once per active ritual
 TypeError: recalculateAllRituals is not a function

 FAIL  src/services/settings.test.ts > getSettings > returns the stored threshold when a row exists
 AssertionError: expected { defaultThreshold: 70 } to deeply equal { defaultThreshold: 80 }

 FAIL  src/services/settings.test.ts > updateSettings > upserts and returns the new threshold
 AssertionError: expected "spy" to be called with arguments: [ { shopId: 'shop-1', …(1) } ]
 Number of calls: 0

 FAIL  src/services/settings.test.ts > updateSettings > calls logActivity with settings.updated ...
 AssertionError: expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]
 Number of calls: 0

 FAIL  src/__tests__/api.test.ts > GET /api/settings > returns 200 with defaultThreshold from the service
 AssertionError: expected {} to deeply equal { defaultThreshold: 80 }
 (route did not await the spy Promise)

 FAIL  src/__tests__/api.test.ts > PUT /api/settings > returns 200 for valid defaultThreshold
 AssertionError: expected {} to deeply equal { defaultThreshold: 75 }
 (route did not await; still passed shopId not ShopContext)

 FAIL  src/__tests__/api.test.ts > POST /api/scores/recalculate-all > returns 200 with recalculated count
 Error: recalculateAllRituals does not exist
```

Note: `getSettings` missing-row → `70` was already green during RED because the Map defaulted to 70.

### GREEN

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint
```

```
 Test Files  8 passed (8)
      Tests  67 passed (67)
```

`npx tsc --noEmit` — exit 0  
`npm run lint` — exit 0

## Files changed

- `app/server/src/services/settings.ts` — Map → Drizzle upsert + `logActivity`
- `app/server/src/services/settings.test.ts` — **new**
- `app/server/src/routes/settings.ts` — await async service; PUT passes `req.shop`
- `app/server/src/services/rituals.ts` — `recalculateAllRituals`
- `app/server/src/services/rituals.test.ts` — empty + two-active cases
- `app/server/src/routes/scores.ts` — `POST /recalculate-all`; GET `/:id` stub kept
- `app/server/src/__tests__/api.test.ts` — spies + 401 sweep

Not changed: `app/web/**`, `IMPLEMENTATION_PLAN.md`, git config, scoring math, `GET /api/scores/:id` stub, `logActivity` implementation.

## Self-review findings

- Service layer kept; routes stay Zod + service + `next(e)`.
- Upsert, not update-only. Shop-scoped `eq(shopSettings.shopId, shopId)`.
- `0` is a valid threshold: GET uses `?? 70`, not `|| 70`.
- Immutability: new `{ defaultThreshold }` objects; no in-place mutation.
- `POST /recalculate-all` is registered before `GET /:id`.
- Sequential `for...of` + `await recalculateRitual` (not `Promise.all`).
- No secrets. PUT still Zod-validated `0–100` int.
- Namespace imports (`* as settingsService` / `* as ritualsService`) so `api.test.ts` spies bind.

## Issues or concerns

1. **Recalculate-all is not atomic.** If `recalculateRitual` throws mid-loop, earlier rituals stay rescored and the handler returns 500. Spec requires sequential per-ritual calls; no wrapping transaction. Fine for v1; merchants may see a partial rescore on failure.
2. **Optional `createRitual` default-80 test skipped.** Existing `createRitual` already reads `shop_settings.defaultThreshold`. Persistence tests cover the settings row.
3. **Frontend is out of this slice.** Threshold save / recalculate-all UI, Toast, Activity filter option, and web tests belong to the frontend implementer.
4. **Auth already inserts a `shop_settings` row** on first shop upsert, so production GET will usually hit a real row. The missing-row `70` fallback still covers shops that never got that insert.
