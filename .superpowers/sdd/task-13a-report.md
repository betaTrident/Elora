# Task 13A Report — Product stills on Elora storefront pages

**Status:** DONE  
**Date:** 2026-08-14  
**Commits:** none (per instructions)

## Summary

Copied nine product photographs from `app/web/src/assets/` into `theme/assets/` with canonical kebab-case filenames, added a reusable `product-asset` snippet with an explicit handle→asset map, and wired fallbacks into product cards, the main product template, and the featured-collection empty state so the Elora catalog lineup renders from theme assets without Shopify Files.

## Assets copied

| Source | Destination |
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

Originals remain in `app/web/src/assets/`. Existing `lp-asset1.png`–`lp-asset6.png` and `index.json` fallback wiring were not modified.

## Files changed

| File | Change |
|---|---|
| `theme/snippets/product-asset.liquid` | **New.** LiquidDoc snippet; explicit handle→asset map; outputs `<img>` via `asset_url` or nothing for unknown handles |
| `theme/snippets/product-card.liquid` | Falls back to `product-asset` when `product.featured_image` is blank; keeps placeholder only for unknown handles |
| `theme/sections/main-product.liquid` | Same fallback for main product image (eager loading) |
| `theme/sections/featured-collection.liquid` | When no collection is assigned, renders a static 9-card lineup grid with locale titles/prices and links to `/products/<handle>` |
| `theme/locales/en.default.json` | Added `lineup.*` keys for nine catalog titles and USD display prices |

## Behavior

1. **Product cards** (`product-card`, used on collection grids, related products, etc.): If Shopify has no `featured_image` but the product handle matches the Elora catalog, the theme still is shown.
2. **Product page** (`main-product`): Same fallback for the hero image when no Shopify image exists.
3. **Featured collection empty state**: Merchants see the full nine-SKU lineup without assigning a collection in the theme editor.
4. **Unknown handles**: `product-asset` renders nothing; cards/product page still fall back to the existing placeholder SVG.

## Validation

```
node .../validate.mjs --theme-path k:\Elora\theme \
  --files snippets/product-asset.liquid,snippets/product-card.liquid,sections/main-product.liquid,sections/featured-collection.liquid,locales/en.default.json \
  --model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p13 --revision 1
```

**Result:** ✅ VALID — all 5 files passed.

`search_docs.mjs` was run before implementation for `asset_url` / `image_tag` and LiquidDoc patterns.

## Self-review

| Check | Result |
|---|---|
| Nine `product-*.png` in `theme/assets/` | ✅ Verified via directory listing |
| `lp-asset*.png` homepage wiring untouched | ✅ Not modified |
| Explicit handle map (not derived) | ✅ `case`/`when` in `product-asset.liquid` |
| LiquidDoc on new snippet | ✅ |
| User-facing strings via `t` | ✅ `lineup.*` locale keys |
| No `IMPLEMENTATION_PLAN.md` / `app/server` / `ritual-builder.js` edits | ✅ |
| No commit | ✅ |
| Task 13B not implemented | ✅ |

## Concerns / follow-ups

1. **Collection page empty state** (`main-collection.liquid`): An empty Shopify collection still shows the generic empty message, not the nine-card lineup. Only `featured-collection` empty state was in scope; consider mirroring the lineup grid there in a later polish if desired.
2. **Static USD prices** in the featured-collection fallback use locale strings (`$32.00`, etc.) rather than `money` filter output — acceptable for demo/static cards but won't auto-format for other currencies.
3. **13B dependency**: `imageAsset` field in `elora-catalog.ts` should use the same filenames (`product-nourishing-cleanser.png`, etc.).

## Out of scope (not done)

- Task 13B (seed script, catalog module, `write_products` scope)
- `main-collection.liquid` empty-state lineup
- Shopify theme push or live store testing
