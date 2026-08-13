# Task 14B — Phase 14 integration tests (Supertest)

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 14 integration table (lines 2388–2396).

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not edit theme files. Do not edit `app/server/src/services/*.test.ts` or `package.json` (Task 14A owns those).

## Where this fits

`app/server/src/__tests__/api.test.ts` already covers much of the API with mocked services + `supertest`. Fill the **named Phase 14 scenarios** that are still missing.

## Already present (keep)

- `requireAuth` 401 on GET `/api/dashboard` and other routes (`Missing token`)
- GET `/api/dashboard` 200 with counts
- POST `/api/rituals` 400 empty body / empty components; 201 valid body
- PUT `/api/rituals/:id` 404 when service throws Not found
- GET `/api/activity` 200 array

## Required additions in `api.test.ts`

Follow existing helpers: `authRequest`, `signToken`, `validRitualBody`, `vi.spyOn` on services.

1. **GET `/api/dashboard` — auth required**  
   If the 401 `it.each` already hits this path, add an explicit test named clearly so the Phase 14 table is obviously covered (can be a thin alias of the same assertion). Also assert **200 body includes `counts`**.

2. **POST `/api/rituals` — 400 on missing component**  
   Already has empty `components: []`. Add **400 when `components` is omitted** (missing field), distinct from empty array if not already.

3. **PUT `/api/rituals/:id` — 404 for wrong shop (isolation)**  
   Spy `updateRitual` to reject with `{ status: 404, message: 'Not found' }` (same as missing). Name the test so it documents shop isolation: e.g. `returns 404 when ritual belongs to another shop`. Do not build a second JWT shop unless easy — service-level 404 is how isolation is implemented (`eq(rituals.shopId, shop.shopId)`).

4. **POST `/api/rituals/:id/recalculate` — returns score object**  
   Spy `recalculateRitual` to resolve `{ id, score, breakdown, threshold }` matching the real return shape from `app/server/src/services/rituals.ts` `recalculateRitual`. Assert **200** and body includes `score` (number) and `breakdown`.

5. **GET `/api/activity` — returns recent logs**  
   Already 200. If the mock is an empty array, keep it but assert the JSON is an **array**. Add a case where the spy returns one log object if that is a one-line change.

## TDD

Add the failing test first, run it, then add spy/mock as needed. Do not change route production code unless a test proves the handler is wrong.

## Commands (PowerShell — no `&&`)

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts
```

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-14b-report.md`.

Return only: Status, test summary, concerns, report path.
