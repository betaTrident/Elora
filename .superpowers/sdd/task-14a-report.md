# Task 14A Report — Phase 14 unit tests

## Status: DONE

## Summary

Added Phase 14 unit-test gaps across `scoring.test.ts`, `alerts.test.ts`, and `rituals.test.ts`, plus `npm run test:coverage` with `@vitest/coverage-v8@2.1.9` (matched to vitest 2.1.9). No production code changes.

## Tests added

### `scoring.test.ts` (+5)

| Case | Assertion |
|------|-----------|
| Null `unitCost` on fully stocked kit | `margin === 15` |
| Score cap | `score <= 100` with max availability + low costs |
| Completeness (full kit) | `completeness === 20` for cleanse+treat+seal |
| Completeness (scent only) | `completeness === 0` |
| Empty inventory | `availability === 0`, factors report "Product not found" |

Existing `awards mid margin when no costs set` retained.

### `alerts.test.ts` (+1)

| Case | Assertion |
|------|-----------|
| Score exactly at threshold (70/70) | No `low_score` insert (`score < threshold` is the open condition in `collectIssues`) |

### `rituals.test.ts` (+1)

| Case | Assertion |
|------|-----------|
| Component insert fails inside transaction | `createRitual` rejects; `upsertAlerts` not called |

Uses `mockInsert` call-order: first `values` succeeds (ritual), second rejects (components).

## Coverage script

- `package.json`: `"test:coverage": "vitest run --coverage"`
- DevDependency: `@vitest/coverage-v8@^2.1.9` (initial npm install pulled 4.x incompatible with vitest 2; pinned to 2.1.9)

## Test run

```
npx vitest run src/services/scoring.test.ts src/services/alerts.test.ts src/services/rituals.test.ts
→ 3 files, 28 tests, all passed
```

```
npm run test:coverage
→ 10 files, 96 tests, all passed
```

## Coverage

| Metric | All files |
|--------|-----------|
| Statements | **45.79%** |
| Branches | 73.36% |
| Functions | 64.7% |
| Lines | 45.79% |

Below 80% target — expected: coverage includes scripts, db client/migrate/seed, and much of `shopify/graphql.ts` / `auth.ts` not exercised by unit tests. Service layer coverage is strong (alerts 100%, scoring 98.57%, rituals 75.1%).

## Concerns

1. **Coverage version pin**: `@vitest/coverage-v8` must match vitest major/minor (2.1.9); unpinned install resolved to 4.x and failed at runtime.
2. **Overall coverage %**: 45.79% all-files — not a gate for this task; improving would need more integration tests or excluding scripts from coverage scope.
3. **No production changes**: All new assertions passed without modifying scoring/alerts/rituals — behavior already matched Phase 14 expectations.

## Files changed

- `app/server/src/services/scoring.test.ts`
- `app/server/src/services/alerts.test.ts`
- `app/server/src/services/rituals.test.ts`
- `app/server/package.json`
- `app/server/package-lock.json` (via npm install at workspace root)

## Commit

Not committed (per task instructions).
