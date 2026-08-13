# Task 11A report — Elora theme foundation

**Status:** DONE_WITH_CONCERNS  
**Commits:** none  
**Scope:** `theme/` only. Did not edit `IMPLEMENTATION_PLAN.md` or `app/**`. Did not implement 11B sections (hero-editorial, ingredient-honesty, routine-editorial, scent-wardrobe) or Soft Ritual Builder.

## Files created (22)

```
theme/config/settings_schema.json
theme/config/settings_data.json
theme/layout/theme.liquid
theme/locales/en.default.json
theme/assets/brand.css
theme/assets/base.css
theme/assets/theme.js
theme/snippets/brand-lockup.liquid
theme/snippets/product-card.liquid
theme/sections/header.liquid
theme/sections/footer.liquid
theme/sections/announcement-bar.liquid
theme/sections/header-group.json
theme/sections/footer-group.json
theme/sections/main-product.liquid
theme/sections/main-collection.liquid
theme/sections/main-cart.liquid
theme/sections/featured-collection.liquid
theme/templates/index.json
theme/templates/collection.json
theme/templates/product.json
theme/templates/cart.json
```

## 11A checklist

| Criterion | Result |
| --- | --- |
| Four JSON templates exist and only reference sections that exist | Yes. `index.json` → `featured-collection` only. `product.json` / `collection.json` / `cart.json` → matching `main-*` sections. No `builder`, no 11B types. |
| Header lockup text includes **Elora** | Yes. `snippets/brand-lockup.liquid` wordmark + tagline copied from the plan. |
| `brand.css` has porcelain `#F6EFE8` and `--font-display` | Yes. Tokens copied from the plan. |
| Cart renders line-item properties, including **Elora Ritual**; skip `_` keys | Yes. `main-cart.liquid` loops `item.properties`, skips keys whose first character is `_`, outputs `property.first`: `property.last`. |
| Empty cart uses `cart.empty` | Yes → `Your bag is empty — start your everyday ritual.` |
| Skip-to-content → `#MainContent` | Yes, in `layout/theme.liquid` (first focusable in `<body>`). |
| Product form `{% form 'product', product %}` with `name="id"` and quantity | Yes. |
| Collection `{% paginate collection.products by 12 %}` via `product-card` | Yes. |
| `{% form 'cart' %}` + checkout | Yes (`{% form 'cart', cart, class: 'cart-form' %}`). |
| `theme_info.theme_name` is Elora | Yes. |
| Snippets have `{% doc %}`; sections have `{% schema %}` | Yes. `featured-collection` and `main-*` include `"presets"`. Header/footer/announcement are group-only (`enabled_on.groups`), no page presets. |

## Plan snippet copies / allowed deviations

- **Copied verbatim:** `locales/en.default.json` plan keys (plus extra keys used in UI), `brand.css` tokens, `brand-lockup` markup, `theme.liquid` fonts + `brand.css`/`base.css` + header-group / `#MainContent` / footer-group.
- **Allowed additions to `theme.liquid`:** skip-link; `tabindex="-1"` on `<main>` for skip-link focus; `theme.js` loaded with `<script defer>` instead of `script_tag` (theme-check parser-blocking).
- **Not built (11B / Phase 12):** hero-editorial, ingredient-honesty, routine-editorial, scent-wardrobe, soft-ritual-builder, ritual-builder.js. No Liquid ternary.

## Validation

Skill scripts from:

`C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid`

`npm install` was required in that skill directory (`@shopify/theme-check-*` missing). Not part of the Elora repo.

### `validate.mjs` revision 1

Failed on `layout/theme.liquid` only:

- Google Fonts remote assets (lines 8–9)
- `script_tag` parser-blocking (line 20)

All other 21 files passed.

### `validate.mjs` revision 2 (after defer script)

Command:

```
node scripts/validate.mjs --theme-path k:\Elora\theme --files config/settings_schema.json,config/settings_data.json,layout/theme.liquid,locales/en.default.json,assets/brand.css,assets/base.css,assets/theme.js,snippets/brand-lockup.liquid,snippets/product-card.liquid,sections/header.liquid,sections/footer.liquid,sections/announcement-bar.liquid,sections/header-group.json,sections/footer-group.json,sections/main-product.liquid,sections/main-collection.liquid,sections/main-cart.liquid,sections/featured-collection.liquid,templates/index.json,templates/collection.json,templates/product.json,templates/cart.json --model cursor-grok-4.6-xhigh --client-name cursor --client-version 1.0.0 --artifact-id elora-p11 --revision 2
```

**Overall Status: INVALID** — leftover noise only:

```
layout/theme.liquid:
ERROR [line 8, col 28]: Asset should be served by the Shopify CDN for better performance.
ERROR [line 9, col 11]: Asset should be served by the Shopify CDN for better performance.
```

These are the Google Fonts `<link>` tags required by Task 11 resolution 6 (DM Serif Display + DM Sans stay). Not fixed.

All other listed files: **SUCCESS**.

### `shopify theme check --path k:\Elora\theme`

Exit 0. 19 files inspected, 2 warnings, same `RemoteAsset` Google Fonts offenses on `layout/theme.liquid`. Did not run `shopify theme push` / `shopify theme dev`.

## Leftover Liquid / storefront risks

- Homepage featured grid is empty until a merchant assigns a collection in the theme editor (`featured-collection` collection setting).
- Skip-link lives in `layout/theme.liquid` (correct first-in-tab-order) rather than `sections/header.liquid`. Header still has wordmark, `linklists.main-menu`, and `routes.cart_url` + count.
- Locale key `cart.ritual_property` (`Elora Ritual`) is present per the plan but unused as a label; the cart prints `property.first`, which is the Phase 12 key `Elora Ritual`.
- No `404.json`, `password`, or `gift_card` templates (out of 11A file list). Visiting those URLs will 404 at the theme layer until added later.
- `linklists.main-menu` is empty until the store has a Main menu; header still renders lockup + cart.
- Product form is a full-page POST (no Ajax). Quantity change on cart auto-submits via `theme.js`.
- Google Fonts are a third-party request (privacy / CDN). Intentional brand lock.

## Concerns

1. **`validate.mjs` overall INVALID** solely because of required Google Fonts remote assets. `shopify theme check` treats the same as warnings (exit 0).
2. **11B** still needs custom sections + `index.json` composition (no builder).
3. Theme has not been loaded against a live/dev shop in this task.
