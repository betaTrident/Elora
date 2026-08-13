# Task 7 Backend Report — Ritual CRUD

## Status

**Complete.** Mock `rituals.ts` replaced with Drizzle CRUD, score-on-save, activity logging, and Shopify GraphQL inventory fetch.

## Commits

None (per instructions).

## Test Summary

### RED (before implementation)

| Suite | Result |
|-------|--------|
| `scoring.test.ts` | Failed — `scoring.ts` missing (0 tests loaded) |
| `rituals.test.ts` | 5 failed — mock service returned `mock-ritual-id`, no DB calls, no 404 on missing ids |

### GREEN (after implementation)

| Suite | Result |
|-------|--------|
| `scoring.test.ts` | 5 passed |
| `rituals.test.ts` | 5 passed |
| `api.test.ts` | 23 passed |
| `dashboard.test.ts` | 4 passed |
| `ping.test.ts` | 4 passed |
| **Total** | **41 passed** |

`npx tsc --noEmit` and `npm run lint` pass.

## Files Created / Modified

| File | Action |
|------|--------|
| `src/services/scoring.ts` | Created — `calculateHealthScore` + types |
| `src/services/scoring.test.ts` | Created — 5 plan cases |
| `src/services/activity.ts` | Created — insert-only `logActivity` |
| `src/shopify/graphql.ts` | Created — `fetchInventory` (2025-01, validated) |
| `src/services/rituals.ts` | Replaced mocks with Drizzle CRUD + score-on-save |
| `src/services/rituals.test.ts` | Created — 5 service tests |
| `src/routes/rituals.ts` | Zod: optional `productTitleCache`, nullable `shopifyVariantId` |
| `src/__tests__/api.test.ts` | 201 expects UUID; 404 via service spies |

## API Behavior

- **GET `/api/rituals`** — lists rituals; defaults `status=active`
- **GET `/api/rituals/:id`** — ritual + components; 404 if missing
- **POST `/api/rituals`** — 201 `{ id, score, breakdown, threshold }`
- **PUT `/api/rituals/:id`** — 200 same shape; replaces components; 404 if missing
- **POST `/api/rituals/:id/archive`** — 200 `{ ok: true }`; sets `archived`
- **POST `/api/rituals/:id/recalculate`** — rescores from DB components

Score path: `fetchInventory` → `calculateHealthScore` → update `lastScore` / `lastScoredAt`. GraphQL failure logs error and scores with empty inventory (write still succeeds).

Activity: `ritual.created`, `ritual.updated`, `ritual.archived` logged via `logActivity`. No `upsertAlerts`.

## GraphQL Validation

Inventory query validated via shopify-admin `validate.mjs` (artifact `task7-inventory`, revision 2). Required scope: `read_products`.

```graphql
query FetchProductInventory($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product {
      id
      status
      variants(first: 1) {
        nodes {
          id
          price
          inventoryQuantity
        }
      }
    }
  }
}
```

## Concerns

1. **`fetchInventory` inside transaction** — create/update hold a DB transaction open during the Shopify HTTP call; acceptable for v1 but may warrant moving inventory fetch outside the transaction later.
2. **`inventoryQuantity` aggregate** — uses variant-level aggregate across locations (plan spec); location-specific stock not modeled.
3. **api.test 404/201** — HTTP layer uses `vi.spyOn` on rituals service rather than full DB mock chain; service tests cover real Drizzle paths with mocked db client.
4. **No integration tests** — all tests use mocked db/graphql; manual verification against a dev store recommended before production.

## Report Path

`k:\Elora\.superpowers\sdd\task-7-backend-report.md`

---

## Review Fix Report (Important)

**Status:** Complete

### Changes

| File | Fix |
|------|-----|
| `src/services/rituals.ts` | `archiveRitual` UPDATE now includes `shopId` in WHERE (`and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id))`) for tenant isolation |
| `src/__tests__/api.test.ts` | Added POST `/api/rituals` with `{ title: 'X', components: [] }` → 400 Validation failed |
| `src/services/rituals.test.ts` | Added `createRitual persists and scores with empty inventory when fetchInventory fails` — mocks `fetchInventory` rejection, asserts write succeeds and factors show unavailable |

### Test commands + results

```
Set-Location k:\Elora\app\server
npx vitest run   → 5 files, 43 passed (+2)
npx tsc --noEmit → exit 0
npm run lint     → exit 0
```

### Concerns

- Minor items from review (fetch outside transaction, archive UX, activity copy) intentionally not addressed per scope.
- `fetchInventory` inside transaction remains acceptable for v1.
