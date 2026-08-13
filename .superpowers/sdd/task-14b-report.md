# Task 14B Report — Phase 14 integration tests (Supertest)

**Status:** DONE_WITH_CONCERNS  
**Date:** 2026-08-14  
**Commits:** none (per instructions)

## Summary

Filled the remaining Phase 14 integration table rows in `app/server/src/__tests__/api.test.ts`. Added explicit dashboard auth + `counts` assertions, 400 when `components` is omitted, shop-isolation 404 on PUT, recalculate 200 score object, and activity array / recent-log cases. No production route or service changes. Did not edit `services/*.test.ts`, `package.json`, `IMPLEMENTATION_PLAN.md`, or theme files.

## Phase 14 table coverage

| Route | Scenario | Test |
|-------|----------|------|
| `GET /api/dashboard` | Auth required | `requires auth and returns 401 without a token` (plus existing `it.each`) |
| `GET /api/dashboard` | Returns counts | `returns 200 body that includes counts` |
| `POST /api/rituals` | 201 with valid body | already present |
| `POST /api/rituals` | 400 on missing component | `returns 400 when components field is omitted` (distinct from empty `[]`) |
| `PUT /api/rituals/:id` | 404 for wrong shop (isolation) | `returns 404 when ritual belongs to another shop` |
| `POST /api/rituals/:id/recalculate` | Returns score object | `returns 200 with score object` |
| `GET /api/activity` | Returns recent logs | existing one-log case + `returns recent logs as an array` + `Array.isArray` |

## TDD evidence

### RED — spies omitted on isolation + recalculate

Added the new cases first. Isolation and recalculate hit the real service against the file-level `db` mock (`select`/`limit` already consumed by `authRequest` shop lookup), so the handler returned 500 (`TypeError: (intermediate value) is not iterable`) instead of the expected 404/200.

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts
```

```
 RUN  v2.1.9 K:/Elora/app/server

 ❯ src/__tests__/api.test.ts (35 tests | 2 failed) 664ms
   × PUT /api/rituals/:id > returns 404 when ritual belongs to another shop
     → expected 500 to be 404
   × POST /api/rituals/:id/recalculate > returns 200 with score object
     → expected 500 to be 200

 Test Files  1 failed (1)
      Tests  2 failed | 33 passed (35)
```

Dashboard auth/counts, omitted `components`, and activity array cases passed immediately (handlers + Zod + existing mocks already correct). No production code change.

### GREEN — spies added

Spy `updateRitual` to reject `{ status: 404, message: 'Not found' }` (same isolation path as missing: `eq(rituals.shopId, shop.shopId)`). Spy `recalculateRitual` to resolve the real service shape `{ score, breakdown }`.

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts
```

```
 RUN  v2.1.9 K:/Elora/app/server

 ✓ src/__tests__/api.test.ts (35 tests) 564ms

 Test Files  1 passed (1)
      Tests  35 passed (35)
```

## Verification

| Command | Result |
|---|---|
| `npx vitest run src/__tests__/api.test.ts` (RED) | 2 failed / 33 passed |
| `npx vitest run src/__tests__/api.test.ts` (GREEN) | **35 passed** |

Pre-existing stderr for the 500-handler case (`Error: Unexpected failure`) unchanged.

## Files

| File | Change |
|---|---|
| `app/server/src/__tests__/api.test.ts` | 6 new cases + `Array.isArray` on existing activity test |

Not edited: `IMPLEMENTATION_PLAN.md`, `theme/**`, `app/server/src/services/*.test.ts`, `package.json`, route/service production code.

## Self-review

| Check | Result |
|---|---|
| TDD: failing tests before spies | ✅ RED then GREEN |
| Phase 14 table rows named clearly | ✅ |
| Omitted `components` distinct from `[]` | ✅ |
| Isolation named as other-shop 404 | ✅ service-level spy, no second JWT |
| Recalculate asserts `score` number + `breakdown` | ✅ real `{ score, breakdown }` shape |
| Activity JSON is an array + one-log case | ✅ |
| No production code change | ✅ |
| No commit / no plan / no theme / no 14A files | ✅ |

## Concerns / follow-ups

1. **`recalculateRitual` return shape.** The brief suggested `{ id, score, breakdown, threshold }`. The live service (`rituals.ts` `recalculateRitual`) returns `{ score, breakdown }` only — `id`/`threshold` are on create/update. The spy matches the real shape. Asserted `score` (number) and `breakdown` as required.
2. **Shop isolation is mocked.** Per brief: no second JWT shop. The 404 documents the isolation contract (`eq(rituals.shopId, shop.shopId)` → Not found). A true cross-shop JWT test is not in this file.
3. **Pre-existing 500-handler stderr** still prints during the unhandled-error case. Not introduced here.

## Out of scope (not done)

- Task 14A (`services/*.test.ts`, `package.json`)
- `IMPLEMENTATION_PLAN.md`
- Theme files
- Git commit
- Production route/service edits
