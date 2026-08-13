### Spec Compliance

- ✅ Nine `product-*.png` files exist under `theme/assets/` with the brief’s exact names (`product-nourishing-cleanser.png` … `product-eau-de-parfum.png`). Diff lists all nine; originals remain in `app/web/src/assets/` (copy, not move).
- ✅ New `theme/snippets/product-asset.liquid`: LiquidDoc (`:1-12`); given `product` or `handle` (`:16-20`); explicit `case`/`when` map, not a derived filename (`:23-42`); `airy-sun-fluid-spf-50` → `product-airy-sun-fluid.png` (`:30-31`); unknown handle outputs nothing (`:57-66`).
- ✅ `theme/snippets/product-card.liquid:12-22`: when `product.featured_image` is absent, render `product-asset`; `placeholder_svg_tag` only if that markup is blank.
- ✅ `theme/sections/main-product.liquid:12-30`: same fallback for the main image (`loading: 'eager'`), placeholder last.
- ✅ `theme/sections/featured-collection.liquid:6-39`: `{%- if featured != blank -%}` else a static 9-handle grid (`:19-20`) using `product-asset`, locale titles/prices (`:22-33`), links `{{ routes.root_url }}products/{{ lineup_handle }}` (`:27`). Homepage `theme/templates/index.json:186-191` featured block has title only (no collection), so Home shows the lineup without a merchant-assigned collection.
- ✅ User-facing lineup strings via `t`: `theme/locales/en.default.json:45-82` `lineup.*` titles/prices match the catalog (`$32.00`–`$72.00`). Schema labels stay English. Phase 12 `builder.*` keys in the same JSON are out of scope for 13A.
- ✅ `lp-asset1.png`–`lp-asset6.png` still on disk. `index.json` still sets `fallback_asset` `lp-asset1.png`–`lp-asset6.png` (`:10`, `:34`, `:45`, `:155`, `:167`, `:179`). Hero/routine/scent sections and `ritual-builder.js` are not in this task’s Liquid/JSON diff.
- ✅ 13A did not write `seed.ts` (no `app/server` files in the diff). No `IMPLEMENTATION_PLAN.md` edit.
- ⚠️ Cannot verify from the text diff: which numbered `ChatGPT Image Aug 14, 2026, 01_58_32 AM (1)–(9).png` was copied onto which SKU (report claims the table; binaries are name/size only). Implementer `validate.mjs` 5/5 VALID (not re-run). Visual layout of the 9-card grid in a browser.

### Strengths

- Handle map is a real `case`/`when` table, including the SPF exception the brief forbids deriving (`theme/snippets/product-asset.liquid:30-31`).
- Capture-then-blank check on card and product template keeps unknown handles on the existing SVG placeholder instead of an empty frame (`product-card.liquid:15-21`, `main-product.liquid:23-29`).
- Empty featured section reuses `.product-grid` / `.product-card`, so the static lineup matches collection cards without a new stylesheet. All nine catalog handles are listed in brief order (`featured-collection.liquid:19-20`).
- Locale keys are handle-with-underscores (`airy_sun_fluid_spf_50`), so `replace: '-', '_'` in the loop matches JSON. Product URLs follow the theme’s existing `routes.root_url` concatenation (`footer.liquid`, `main-product.liquid` breadcrumbs).
- Collection grids still pick up stills when Shopify products have no Files: `main-collection.liquid:34` already renders `product-card`. Empty collection-page copy was correctly left alone (not in the 13A file list).

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- None.

#### Minor (Nice to Have)

- **Nine cards in a 4-column grid.** `.product-grid` is two columns, then four at 900px (`theme/assets/base.css:418-431`). The ninth card sits alone on desktop. Spec allowed reusing that grid; a lineup-only 3-column rule would be tighter, not required.
- **Dead `featured_collection.empty`.** The locale string remains (`theme/locales/en.default.json:42`) and `.featured-collection__empty` CSS remains (`base.css:542-544`); Liquid no longer references either after the empty `<p>` was replaced (`featured-collection.liquid:18-39`). Harmless leftover.
- **Explicit `handle` loses to ambient `product`.** `product-asset.liquid:16-20` always prefers `product` when it is non-blank. Snippets still see the global product drop on product templates, so a featured-collection section added there with only `handle:` would map every card to the current product. Homepage (no product drop) is fine. Prefer `handle` when the caller passed it.
- **Full-size ~1.6–1.9MB PNGs via `asset_url`.** Same pattern as `lp-asset*` fallbacks; nine of them on Home is heavier. `asset_img_url: '800x'` would shrink. Not in the brief.

### Assessment

**Task quality:** Approved

**Reasoning:** 13A matches the brief: nine named stills, an explicit handle map, featured-image fallbacks (not placeholder-only), a blank featured-collection lineup with `t` copy and `/products/<handle>` links, and no seed or `lp-asset` churn. Remaining notes are polish (widow card, dead empty string, global product precedence).
