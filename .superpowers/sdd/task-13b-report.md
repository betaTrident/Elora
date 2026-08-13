# Task 13B Report — Elora catalog, seed script, and demo README

**Status:** DONE_WITH_CONCERNS  
**Date:** 2026-08-14  
**Commits:** none (per instructions)

## Summary

Added a pure Elora catalog module (9 photographed SKUs + 3 sample rituals), GraphQL product lookup/create against Admin API `2025-01`, an idempotent `db:seed` CLI, `write_products` on app scopes, and the 5-minute demo section in the root README. Catalog `imageAsset` filenames match Task 13A theme assets.

## TDD evidence

### RED — test file first, catalog module absent

```
Set-Location k:\Elora\app\server; npx vitest run src/db/elora-catalog.test.ts
```

```
 RUN  v2.1.9 K:/Elora/app/server

 ❯ src/db/elora-catalog.test.ts (0 test)

 FAIL  src/db/elora-catalog.test.ts [ src/db/elora-catalog.test.ts ]
Error: Failed to load url ./elora-catalog (resolved id: ./elora-catalog) in K:/Elora/app/server/src/db/elora-catalog.test.ts. Does the file exist?

 Test Files  1 failed (1)
      Tests  no tests
```

Failure reason: missing `./elora-catalog` (feature not implemented). Tests were not run because the module did not exist.

### GREEN — after `elora-catalog.ts`

```
Set-Location k:\Elora\app\server; npx vitest run src/db/elora-catalog.test.ts
```

```
 RUN  v2.1.9 K:/Elora/app/server

 ✓ src/db/elora-catalog.test.ts (10 tests) 12ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Catalog tests cover: 9 SKUs + vendor `Elora`; 13A `imageAsset` filenames; titles/prices/tags; 3 sample rituals; AM Glow treat = `glow-drops-serum`; Body/Night mappings; no GIDs in `SAMPLE_RITUALS`; empty map → `[]` (no fake GIDs); full map → 3 resolved rituals; missing handle skips only that ritual.

## Verification

| Command | Result |
|---|---|
| `npx vitest run src/db/elora-catalog.test.ts` (RED) | Fail — `./elora-catalog` missing |
| `npx vitest run src/db/elora-catalog.test.ts` (GREEN) | **10 passed** |
| `npx vitest run` (app/server) | **77 passed** (9 files) |
| `npx tsc --noEmit` (app/server) | Exit 0 |
| `npm test -- --run` | Same 77 passed, then Vitest watch (script is `"vitest"` without `run`) |

`api.test.ts` still prints expected stderr for the 500-handler case (`Error: Unexpected failure`). Pre-existing; not introduced by 13B.

## Files

| File | Change |
|---|---|
| `app/server/src/db/elora-catalog.test.ts` | **New.** TDD tests written first |
| `app/server/src/db/elora-catalog.ts` | **New.** `ELORA_PRODUCTS`, `SAMPLE_RITUALS`, `resolveRituals` (pure, no I/O) |
| `app/server/src/db/seed.ts` | **New.** CLI: first installed shop, settings upsert, GraphQL catalog, `createRitual` |
| `app/server/src/shopify/graphql.ts` | `findProductByHandle`, `createCatalogProduct` (+ variant price), `ShopifyGraphqlAccessDeniedError`; shared `2025-01` fetch helper |
| `app/server/src/shopify/auth.ts` | Scope string `read_products,read_inventory,write_products` on insert and `onDuplicateKeyUpdate` |
| `app/server/src/services/rituals.ts` | `createRitual` activity `actorType` is `system` when `userId` is null (seed ShopContext) |
| `app/server/package.json` | `"db:seed": "tsx src/db/seed.ts"` |
| `app/shopify.app.toml` | `scopes = "read_products,read_inventory,write_products"` |
| `README.md` | 5-minute demo script (Glow Drops Serum OOS) + `cd app/server; npm run db:seed` |

Not edited: `IMPLEMENTATION_PLAN.md`, `theme/**`.

## Seed behavior

1. Loads dotenv via `./client`.
2. Selects first shop with `uninstalledAt IS NULL`. None → `Install app first` then `process.exit(0)`.
3. Upserts `shop_settings` with `onDuplicateKeyUpdate` (not `.ignore()`).
4. Per catalog product: `productByIdentifier` by handle; if missing, `productCreate` (ACTIVE, tags, handle, vendor Elora) then `productVariantsBulkUpdate` for price. Reuses existing handles.
5. `ACCESS_DENIED` on create → logs `write_products is required (reinstall app)` once, skips create, retries handle lookup. Does not invent GIDs.
6. `resolveRituals` then `createRitual` only for rituals whose handles all resolved. Existing titles skipped. Empty resolution → skip rituals with a clear message.
7. Logs `Products: N created, M reused` and `Rituals: N created, M skipped`.
8. Access tokens are passed to GraphQL headers only; never printed.

## Self-review

| Check | Result |
|---|---|
| TDD: failing test before `elora-catalog.ts` | ✅ RED then GREEN |
| `imageAsset` matches 13A filenames | ✅ including `airy-sun-fluid-spf-50` → `product-airy-sun-fluid.png` |
| No invented product GIDs | ✅ lookup/create only; empty map returns `[]` |
| Rituals not inserted without resolved IDs | ✅ |
| Scopes toml + auth match | ✅ `read_products,read_inventory,write_products` |
| Tokens not logged | ✅ seed/graphql never `console.*` the token |
| `onDuplicateKeyUpdate` not `.ignore()` | ✅ |
| GraphQL `2025-01`, same fetch pattern as `fetchInventory` | ✅ |
| No commit / no plan / no theme edits | ✅ |
| Existing tests not weakened | ✅ 77/77 |

## Concerns / follow-ups

1. **Reinstall required for `write_products`.** Toml + auth string are updated, but an already-installed shop’s Shopify token still has read-only scopes until the merchant reinstalls (or otherwise re-grants). Seed logs the skip message and will not insert rituals with fake IDs.
2. **Live seed not run.** Per controller: do not create products against a store unless that is the intended command. `npm run db:seed` was not executed here.
3. **`npm test` watch mode.** `"test": "vitest"` still opens watch; full suite was verified with `npx vitest run` (77 passed). Pre-existing script.
4. **`createRitual` actorType.** One-line change so seed (`userId: null`) logs `system`; merchant JWT flows with a `userId` still log `merchant`. Update/archive/recalculate still use `merchant`.
5. **Default variant price** is a second mutation (`productVariantsBulkUpdate`) because `ProductCreateInput` has no price field on 2025-01. If price update fails after create, seed logs the error and retries handle lookup so the product is still reused.

## Out of scope (not done)

- Task 13A theme/assets (owned by 13A)
- `write_files` / staged uploads / Admin product images
- `IMPLEMENTATION_PLAN.md`
- Git commit
- Live `db:seed` against the Shopify store

## Fix pass

**Issue:** `npm run db:seed` hung after successful work because the mysql2 pool in `client.ts` kept the event loop alive. Only the no-shop branch and the catch block called `process.exit`.

**Changes (`app/server/src/db/seed.ts` only):**
- `process.exit(0)` after `Products: N created, M reused` on the unresolved-products path (after skip message + rituals count line).
- `process.exit(0)` after `Rituals: N created, M skipped` on the full success path.
- Added `Rituals: 0 created, ${SAMPLE_RITUALS.length} skipped` on the unresolved-products path so both count lines always print.
- Top-level catch already had `process.exit(1)` after logging — unchanged.

**Verification:**

```
Set-Location k:\Elora\app\server; npx vitest run src/db/elora-catalog.test.ts
```

```
 ✓ src/db/elora-catalog.test.ts (10 tests) 13ms
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

```
Set-Location k:\Elora\app\server; npx tsc --noEmit
```

Exit 0.

**Commits:** none.

## Whole-phase fix pass

**Status:** DONE  
**Date:** 2026-08-14  
**Commits:** none

Phase 13 whole-phase review: seeded rituals scored OOS because untracked `inventoryQuantity` is `null`; Home builder emitted `[]` with no collection; AM Glow SKUs lacked `scent:clean` so README step 8 AND-filter fell back.

### Changes

| File | Change |
|---|---|
| `app/server/src/shopify/graphql.ts` | `availableFromInventoryQuantity`: `null` → in-stock (`1`), `0` stays OOS, missing → `0`. `fetchInventory` uses it. `inventoryQuantity` typed `number \| null`. No `write_inventory`. |
| `app/server/src/shopify/graphql.test.ts` | **New.** Mapping tests: null in-stock, `0` OOS, positive passthrough, undefined OOS |
| `app/server/src/db/elora-catalog.ts` | Added `scent:clean` (kept `scent:unscented`) on nourishing-cleanser, glow-drops-serum, airy-sun-fluid-spf-50 |
| `app/server/src/db/elora-catalog.test.ts` | Tag assertions + AM Glow both-scent test |
| `theme/sections/soft-ritual-builder.liquid` | Blank collection setting → `collections['all']` (docs: `collections['handle']`), limit 50, same 12A JSON guards |
| `README.md` | Reinstall for `write_products` + `cd app/server; npm run db:seed` **before** the 8 steps. Glow Drops Serum OOS. Cart line `Elora Ritual: glow · am · clean` |

Not edited: `IMPLEMENTATION_PLAN.md`, `seed.ts` GraphQL create, `write_files`, git commit.

### Commands and output

```
Set-Location k:\Elora\app\server; npx vitest run src/db/elora-catalog.test.ts
```

```
 ✓ src/db/elora-catalog.test.ts (11 tests) 16ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

```
npx vitest run src/shopify/graphql.test.ts
```

```
 ✓ src/shopify/graphql.test.ts (4 tests) 6ms
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

```
npx tsc --noEmit
```

Exit 0.

```
npx vitest run
```

```
 Test Files  10 passed (10)
      Tests  82 passed (82)
```

Scoring tests that pass `available: 0` still pass (`scoring.test.ts` 5/5). Pre-existing `api.test.ts` stderr for the 500-handler case unchanged.

Liquid (`search_docs.mjs` `global collections` → `collections['sale-potions'].products`; artifact-id `elora-p13-fix`, revision 1):

```
node .../validate.mjs --theme-path k:\Elora\theme --files sections/soft-ritual-builder.liquid
  --model cursor-grok-4.6 --client-name cursor --client-version 1.0.0
  --artifact-id elora-p13-fix --revision 1
```

**Overall Status:** ✅ VALID — `sections/soft-ritual-builder.liquid` passed all checks.

### Follow-ups (not in this pass)

- Already-seeded Shopify products still have old tags until re-seed or manual tag edit.
- Untracked inventory maps to available `1` (any `> 0` is in-stock for scoring). Setting Glow Drops to `0` in Admin still produces OOS after Recalculate.
