# Task 14A — Phase 14 unit tests

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 14 unit-test table (lines 2380–2386).

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not edit theme files. Do not edit `app/server/src/__tests__/api.test.ts` (Task 14B owns it).

## Where this fits

Phases 0–13 are done. Unit files already exist and pass. This task fills the **named gaps** in the Phase 14 table and adds `npm run test:coverage`.

## Existing tests (do not break)

- `app/server/src/services/scoring.test.ts` — full stock, empty, OOS, missing role, mid margin when no cost
- `app/server/src/services/alerts.test.ts` — open, resolve, no duplicate
- `app/server/src/services/rituals.test.ts` — create/get/archive/list/update/recalculate; `db.transaction` is mocked to run the callback with `{ insert, update, delete }`

## Required additions

### `scoring.test.ts`

Add threshold-adjacent / edge cases the table asks for (`null cost` is already covered as mid margin; keep it):

1. Fully stocked kit with **null** `unitCost` still awards margin 15 (if not already asserted as its own named case, keep the existing one).
2. Score **never exceeds 100**.
3. Completeness is **20** when cleanse+treat+seal are present; **0** when only `scent` is present.
4. Availability is **0** when inventory is empty (products not found).

### `alerts.test.ts`

If missing: opening an alert when score is **exactly** at threshold should **not** open `low_score` (below means open). Read `upsertAlerts` and match actual behavior — do not change production code unless a test proves a real bug that contradicts existing Phase 9 tests.

### `rituals.test.ts`

Add **transaction rollback on error**:

- Arrange `createRitual` so the transaction callback throws (e.g. `mockInsert` / `values` rejects on the **components** insert).
- Expect `createRitual` to reject.
- Expect `upsertAlerts` **not** to have been called (alerts run after the transaction in `createRitual`).

Do not introduce a real MySQL. Keep the existing mock style (`createThenableChain`, `mockTransaction`).

### Coverage script

In `app/server/package.json` add:

```json
"test:coverage": "vitest run --coverage"
```

Add `@vitest/coverage-v8` as a **devDependency** (npm install in `app/server`). Do not fail the task if coverage is under 80% — report the percentage. Do not rewrite vitest config beyond what coverage needs.

## TDD

Write the failing tests first, run them (RED), then only change production code if a test is correct and production is wrong. Prefer adding tests over changing scoring/alerts/rituals.

## Commands (PowerShell — no `&&`)

```
Set-Location k:\Elora\app\server
npx vitest run src/services/scoring.test.ts src/services/alerts.test.ts src/services/rituals.test.ts
npm run test:coverage
```

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-14a-report.md`.

Return only: Status, test summary, coverage %, concerns, report path.
