# Task 8 Backend Report — Activity Log

## Status

**Complete.** `listActivity` added (shop-scoped, newest first, hard cap 100, optional filters). `GET /api/activity` wired. `recalculateRitual` logs `ritual.recalculated` with a “routine” summary. Create/update/archive summaries updated to “routine”.

## Commits

None (per instructions).

## Test Summary

### RED (before implementation)

| Suite | Result |
|-------|--------|
| `activity.test.ts` | 5 failed — `listActivity is not a function` |
| `rituals.test.ts` | 1 failed — insert spy called 0 times (`recalculateRitual` did not log) |
| `api.test.ts` | 1 failed — `listActivity does not exist` (spyOn) |

### GREEN (after implementation)

| Suite | Result |
|-------|--------|
| `activity.test.ts` | 5 passed |
| `rituals.test.ts` | 7 passed |
| `api.test.ts` | 25 passed |
| `dashboard.test.ts` | 4 passed |
| `scoring.test.ts` | 5 passed |
| `ping.test.ts` | 4 passed |
| **Total** | **50 passed** (6 files) |

```
Set-Location k:\Elora\app\server
npx vitest run     → 6 files, 50 passed
npx tsc --noEmit   → exit 0
npm run lint       → exit 0
```

## Files Created / Modified

| File | Action |
|------|--------|
| `src/services/activity.ts` | Added `listActivity`; kept `logActivity` |
| `src/services/activity.test.ts` | Created — empty shop, cap 100, actorType/action filters |
| `src/routes/activity.ts` | `GET /` → `listActivity(shopId, query)`; empty string = unset |
| `src/services/rituals.ts` | Recalculate logs `ritual.recalculated`; score UPDATE includes `shopId`; summaries say “routine” |
| `src/services/rituals.test.ts` | Recalculate asserts insert of `ritual.recalculated` |
| `src/__tests__/api.test.ts` | `GET /api/activity` 200 via `listActivity` spy; 401 already covered |

## API Behavior

- **GET `/api/activity`** — shop-scoped logs, `orderBy desc createdAt`, `limit min(n, 100)` (default 100). Optional query: `action`, `entityType`, `actorType` (exact match; empty string ignored; unknown params ignored).
- Recalculate: `action: 'ritual.recalculated'`, `summary: Recalculated routine "…"`, `afterJson: { score }`, `actorType: 'merchant'`.

## Concerns

1. **HTTP test spies `listActivity`** — same pattern as rituals 201/404; drizzle path covered in `activity.test.ts`.
2. **Filter assertions are mock-level** — tests prove `where`/`orderBy`/`limit` are called, not generated SQL.
3. **No integration tests** against a real MySQL instance.
4. **Recalculate actor is merchant** (UI-triggered). System auto-rescore remains Phase 9.

## Report Path

`k:\Elora\.superpowers\sdd\task-8-backend-report.md`
