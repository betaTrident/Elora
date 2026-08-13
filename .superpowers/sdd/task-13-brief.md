# Task 13: Phase 13 — Seed Data & Demo Script

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 13 (lines 2289–2372) plus owner request: scan `app/web/src/assets/` product/page images and use them as seeded catalog **and** on storefront pages.

## Where this fits

Phases 0–12 are done. RitualScore can CRUD rituals but the DB has no demo kits, and Shopify has no Elora catalog unless a merchant typed it. Homepage already references `lp-asset1.png`–`lp-asset6.png` (landing stills copied into `theme/assets/`). The nine individual product stills are **not** in the theme yet.

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not change OAuth/JWT logic except the **scope string** in 13B as specified.

## Skills

- Shopify Liquid (13A): `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid\SKILL.md` — `search_docs.mjs` then `validate.mjs --theme-path k:\Elora\theme --files ... --model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p13 --revision N`
- 13B: follow existing `app/server` Drizzle + Vitest patterns (`onDuplicateKeyUpdate`, not `.ignore()`). PowerShell: **no `&&`**.

## Controller resolutions (do not re-ask)

1. **Use the photographed Elora catalog**, not the plan’s generic “Vitamin C Glow Serum / Gentle Foaming Cleanser” names. Demo OOS step uses **Glow Drops Serum**.
2. **Do not invent Shopify product GIDs.** Resolve by title/handle via Admin GraphQL; create if `write_products` works; if the shop is missing, print `Install app first` and return (plan). If shop exists but products cannot be created (scope), still insert rituals only when IDs were resolved; otherwise print a clear skip message and **do not** insert rituals with fake IDs (scores would lie).
3. **Drizzle:** `onDuplicateKeyUpdate` for `shop_settings` (`.ignore()` is not in this Drizzle version).
4. **Idempotent seed:** if a ritual with the same title already exists for the shop, skip it. If a product with the same handle exists, reuse its id/variant id.
5. **Scopes:** add `write_products` to `app/shopify.app.toml` and the string written in `app/server/src/shopify/auth.ts` (keep `read_products,read_inventory`). Do **not** add `write_files` / staged uploads in this phase — storefront uses theme assets; Admin product images can stay empty until a later polish.
6. **Landing assets already wired:** `theme/assets/lp-asset1.png`–`lp-asset6.png` + `index.json` `fallback_asset`. Do not rename/delete them. 13A adds the **nine product stills**.
7. **User-facing theme strings** via `{{ 'key' | t }}`. Schema labels may be English.
8. **Do not** run `shopify theme push` or live product creates against a store unless already authenticated and the seed is the intended command. 13B may run seed against local Docker MySQL; mock GraphQL in tests.
9. Reuse `createRitual` from `app/server/src/services/rituals.ts` so dashboard scores, activity, and alerts populate (actorType `system` if you pass a seed ShopContext with `userId: null`).

## Canonical catalog (from asset scan)

Nine lineup SKUs (collections grid + `elora-products.png` + `ChatGPT Image Aug 14, 2026, 01_58_32 AM (1)–(9).png`):

| handle | title | subtitle | size | price | builder tags | ritual role |
|---|---|---|---|---|---|---|
| `nourishing-cleanser` | Nourishing Cleanser | Chamomile & Oat Extract | 150 ml | 32.00 | `concern:glow,concern:calm,moment:am,moment:pm,scent:unscented` | cleanse |
| `daily-hydration-gel` | Daily Hydration Gel | Hyaluronic Acid + Aloe Vera | 50 ml | 48.00 | `concern:hydrate,concern:barrier,moment:am,scent:unscented` | seal |
| `glow-drops-serum` | Glow Drops Serum | Niacinamide + Kakadu Plum | 30 ml | 52.00 | `concern:glow,moment:am,scent:unscented` | treat |
| `airy-sun-fluid-spf-50` | Airy Sun Fluid SPF 50 | Broad Spectrum UVA + UVB | 50 ml | 36.00 | `concern:glow,moment:am,scent:unscented` | seal |
| `restorative-night-cream` | Restorative Night Cream | Bakuchiol + Squalane | 50 ml | 58.00 | `concern:barrier,concern:calm,moment:pm,scent:unscented` | seal |
| `balancing-toner` | Balancing Toner | Green Tea + Witch Hazel | 200 ml | 34.00 | `concern:calm,moment:am,moment:pm,scent:unscented` | treat |
| `body-lotion` | Body Lotion | Shea Butter + Niacinamide | 250 ml | 36.00 | `concern:hydrate,moment:body,scent:warm` | seal |
| `body-oil` | Body Oil | Jojoba + Camellia Oil | 100 ml | 42.00 | `concern:glow,moment:body,scent:warm` | scent |
| `eau-de-parfum` | Eau de Parfum | Warm Florals + Soft Woods | 50 ml | 72.00 | `concern:calm,moment:pm,moment:body,scent:floral,scent:warm` | scent |

**Source files → theme asset names** (copy, do not move; keep originals in `app/web/src/assets/`):

| Source under `app/web/src/assets/` | Destination |
|---|---|
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (1).png` | `theme/assets/product-nourishing-cleanser.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (2).png` | `theme/assets/product-daily-hydration-gel.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (3).png` | `theme/assets/product-glow-drops-serum.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (4).png` | `theme/assets/product-airy-sun-fluid.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (5).png` | `theme/assets/product-restorative-night-cream.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (6).png` | `theme/assets/product-balancing-toner.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (7).png` | `theme/assets/product-body-lotion.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (8).png` | `theme/assets/product-body-oil.png` |
| `ChatGPT Image Aug 14, 2026, 01_58_32 AM (9).png` | `theme/assets/product-eau-de-parfum.png` |

Handle → filename: `product-{{ handle | replace: '-spf-50', '' }}` wait — **explicit map** (do not derive):

- `nourishing-cleanser` → `product-nourishing-cleanser.png`
- `daily-hydration-gel` → `product-daily-hydration-gel.png`
- `glow-drops-serum` → `product-glow-drops-serum.png`
- `airy-sun-fluid-spf-50` → `product-airy-sun-fluid.png`
- `restorative-night-cream` → `product-restorative-night-cream.png`
- `balancing-toner` → `product-balancing-toner.png`
- `body-lotion` → `product-body-lotion.png`
- `body-oil` → `product-body-oil.png`
- `eau-de-parfum` → `product-eau-de-parfum.png`

Vendor: **Elora**. Currency amounts are USD numbers for Shopify `price` (string `"32.00"`).

## Three sample rituals (plan structure, catalog names)

1. **AM Glow Ritual** — Morning face routine for radiant skin — threshold 75  
   - cleanse: Nourishing Cleanser  
   - treat: Glow Drops Serum  
   - seal: Airy Sun Fluid SPF 50  
2. **Body Ritual** — After-shower body ritual with matching scent — threshold 70  
   - cleanse: Body Lotion (plan’s body wash does not exist in the photos; lotion is the body cleanse/seal stand-in — **role `seal`** wait: required roles are cleanse/treat/seal. Body ritual: cleanse=Nourishing Cleanser (shared), seal=Body Lotion, scent=Body Oil. That keeps completeness. **Use:** cleanse Nourishing Cleanser, seal Body Lotion, scent Body Oil.
3. **Night Barrier** — PM skin recovery and barrier support — threshold 70  
   - cleanse: Nourishing Cleanser  
   - treat: Balancing Toner  
   - seal: Restorative Night Cream  

---

# Task 13A — Product stills on storefront pages

## Files

- Copy 9 PNGs into `theme/assets/` as named above (PowerShell `Copy-Item -LiteralPath`).
- `theme/snippets/product-asset.liquid` (new) — given `product` (or handle string), output the matching theme asset `<img>` if known; empty if unknown.
- `theme/snippets/product-card.liquid` — if `product.featured_image` blank, render `product-asset` instead of `placeholder_svg_tag`.
- `theme/sections/main-product.liquid` — same fallback for the main image when `product.featured_image` is blank.
- `theme/sections/featured-collection.liquid` — when collection is blank, show a static 9-card grid using the theme assets + titles/prices (locale or escaped catalog strings). Cards may link to `/products/<handle>`. Do not require a merchant-assigned collection to see the lineup.
- `theme/locales/en.default.json` — keys for lineup titles/prices if you use `t`.

Do **not** rewrite hero/routine/scent fallbacks. Do **not** add ritual-builder.js behavior. Do **not** write `seed.ts`.

LiquidDoc on the new snippet. `{% stylesheet %}` for the empty lineup grid if needed; reuse `.product-grid` / `.product-card` if they already fit.

`validate.mjs` on every Liquid/JSON you change.

## 13A done when

- Nine `product-*.png` files exist under `theme/assets/`
- Collection page / featured empty / product card / product template can show those photos without Shopify Files
- Existing `lp-asset*.png` homepage wiring still present
- validate.mjs on touched Liquid/locale files

---

# Task 13B — Catalog, seed script, demo README

Depends on 13A asset filenames (catalog `imageAsset` field must match).

## Files

```
app/server/src/db/elora-catalog.ts     # typed catalog + SAMPLE_RITUALS mapping (pure; no I/O)
app/server/src/db/elora-catalog.test.ts
app/server/src/db/seed.ts              # CLI; uses catalog + GraphQL + createRitual
app/server/package.json                # "db:seed": "tsx src/db/seed.ts"
app/shopify.app.toml                   # scopes include write_products
app/server/src/shopify/auth.ts         # scope string matches toml
app/server/src/shopify/graphql.ts      # add findProductByHandle + createCatalogProduct (or a sibling products.ts)
README.md                              # append 5-minute demo section (file is currently just "# Elora")
```

## Catalog module (test this)

Export `ELORA_PRODUCTS` (handle, title, subtitle, size, price, tags[], imageAsset, vendor `'Elora'`) and `SAMPLE_RITUALS` (title, description, scoreThreshold, components: { handle, role }[]).

Pure helper `resolveRituals(productsByHandle: Map<string, { productId: string; variantId: string | null }>)` → CreateRitualBody[] or skip missing handles. Tests: 3 rituals, AM Glow uses glow-drops-serum as treat, no fake GIDs when map empty.

TDD: write the test file first; it must fail; then implement.

## seed.ts

```
npx tsx src/db/seed.ts
```

1. Load dotenv via existing `./client`.
2. Select first shop (`uninstalledAt` is null if that column is easy to filter; otherwise first row). If none: `console.log('Install app first')`; `process.exit(0)`.
3. Upsert `shop_settings` for that shop.
4. For each catalog product: GraphQL search by handle; if missing, `productCreate` (status ACTIVE, tags as Shopify tags, one variant with price, `handle` set). Collect GID + first variant GID.
5. For each SAMPLE_RITUAL: skip if title exists for shop; else `createRitual`.
6. Log counts: products created/reused, rituals created/skipped.

GraphQL against `https://${shopDomain}/admin/api/2025-01/graphql.json` with the shop access token (same pattern as `fetchInventory`).

If `productCreate` returns ACCESS_DENIED, log that `write_products` is required (reinstall app) and skip product create; still try handle lookup.

Do not print access tokens.

## README demo section (plan copy, names updated)

```
## 5-minute demo script

1. Open app in Admin — see Dashboard with 3 sample rituals
2. Note "AM Glow Ritual" score and breakdown
3. In Shopify Admin → Products, set Glow Drops Serum inventory to 0
4. Back in RitualScore → AM Glow Ritual → click Recalculate
5. Score drops — Critical alert appears: "Out of stock"
6. Open Activity log — see score.recalculated + alert.opened events
7. On storefront Home, click "Build your soft ritual" → complete steps → Add ritual to bag
8. Cart shows all 3 items with "Elora Ritual: glow · am · clean" property
```

Also one line: `cd app/server; npm run db:seed` after the app is installed.

## 13B done when

- `npm run db:seed` script exists
- Catalog tests pass
- Existing server tests still pass (`npm test` in `app/server` — do not “fix” unrelated failures by weakening tests)
- `npx tsc --noEmit` in `app/server` passes
- README has the demo section
- toml + auth scopes include `write_products`

---

## Reports

13A → `k:\Elora\.superpowers\sdd\task-13a-report.md`  
13B → `k:\Elora\.superpowers\sdd\task-13b-report.md`

Then return under 15 lines: Status, commits (none), one-line verify summary, report path.
