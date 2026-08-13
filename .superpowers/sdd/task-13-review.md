### Spec Compliance (the two Important items)

- ✅ both fixed

**1. Untracked `inventoryQuantity` null scored as OOS** — closed.

`availableFromInventoryQuantity` maps `null` → `1` (in-stock) and keeps `0` as OOS; missing/`undefined` stays `0` (`app/server/src/shopify/graphql.ts:85-88`). `ProductNode.inventoryQuantity` is `number | null` (`graphql.ts:79`). `fetchInventory` uses the helper (`graphql.ts:183`) instead of `?? 0`. Scoring treats `available > 0` as in-stock and `available === 0` as `"Out of stock"` (`app/server/src/services/scoring.ts:55`, `:64-66`), so seed-time `createRitual` → `fetchInventory` (`app/server/src/services/rituals.ts:92`) no longer opens Critical `component_unavailable` on untracked SKUs. Setting Glow Drops to `0` still fails `> 0`, so README steps 3–5 still drop the score. Tests: `app/server/src/shopify/graphql.test.ts:12-26`.

**2. Home builder had no products; README seed was after the demo; AM Glow SKUs lacked `scent:clean`** — closed.

Blank collection setting falls back to `collections['all']` (`theme/sections/soft-ritual-builder.liquid:1-3`) before the JSON dump (`:62-63`, `limit: 50`). Homepage builder settings remain heading-only (`theme/templates/index.json:14-18`); the fallback covers that. README reinstall + `cd app/server; npm run db:seed` now sit above the eight steps (`README.md:5-7`). AM Glow SKUs keep `scent:unscented` and add `scent:clean` (`app/server/src/db/elora-catalog.ts:50`, `:70`, `:80`); asserted in `elora-catalog.test.ts:81-86`. Glow → Morning → Clean AND-matches those three handles (`theme/assets/ritual-builder.js:88-96`).

### Issues (new regressions only)

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- None.

#### Minor (Nice to Have)

- **OOS demo then “all 3 items”.** After README step 3, Glow Drops is tracked at `0`, so `product.first_available_variant` is blank (`soft-ritual-builder.liquid:70`) and `addRitualToCart` drops null `variantId`s (`ritual-builder.js:160-163`). Step 8 can land 2 cart lines, not 3. Same 12A guard as before; newly reachable now that `productsData` is non-empty. Restock before the storefront steps if the “all 3 items” line matters. Not a miss on either Important fix.

Deferred Minors from the prior whole-phase review are not re-opened (ninth-card widow, dead empty locale, `product-asset` handle precedence, PNG weight, 401 copy, archived title skip, unordered first shop, unpublished Online Store, `createRitual` `actorType` untested). Already-seeded Shopify products keep old tags until a manual tag edit (seed reuses by handle and does not patch tags).

### Assessment

**Ready to merge?** Yes

**Reasoning:** Both Important demo breakers are fixed in source with tests at the mapper and catalog tags. Untracked `null` is in-stock; tracked `0` is still OOS. Home builder no longer emits `[]` when the collection setting is blank; seed runs before the eight steps; Clean AND-matches AM Glow. No new Critical or Important issues.
