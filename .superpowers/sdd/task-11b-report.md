# Task 11B report — Custom sections + home composition

**Status:** DONE_WITH_CONCERNS  
**Commits:** none  
**Scope:** `theme/` only. Did not edit `IMPLEMENTATION_PLAN.md` or `app/**`. Did not implement Soft Ritual Builder (Phase 12). 11A foundation reused as-is (product / collection / cart templates untouched).

## Files created / updated (6)

Created:

```
theme/sections/hero-editorial.liquid
theme/sections/ingredient-honesty.liquid
theme/sections/routine-editorial.liquid
theme/sections/scent-wardrobe.liquid
```

Updated:

```
theme/templates/index.json
theme/locales/en.default.json
```

## 11B checklist

| Criterion | Result |
| --- | --- |
| Home JSON includes ≥3 custom section types with presets | Yes. Four: `hero-editorial`, `routine-editorial`, `ingredient-honesty`, `scent-wardrobe`. Each has `"presets"`. |
| `index.json` order | `["hero", "editorial", "ingredients", "scent", "featured"]`. No `builder`. |
| Hero defaults Elora + tagline | Schema + home settings: eyebrow `Elora`, heading `Your everyday beauty ritual.`, porcelain `#F6EFE8`. Display font via `{% stylesheet %}`. |
| Ingredient honesty uses `{% if %}` not ternary | Yes. In/Never via locale keys; optional mark via CSS `::before`. |
| Routine editorial renders product object | `{% render 'product-card', product: block.settings.product %}`. No `all_products[handle]`. Two-column steps, stacked under 768px. |
| Collection / Product / Cart still load | Unchanged JSON templates; still point at `main-collection` / `main-product` / `main-cart`. |
| Cart still shows **Elora Ritual** properties | Untouched. `main-cart.liquid` still loops `item.properties`, skips `_` keys, prints `property.first`: `property.last`. |
| No Ajax ritual add-to-cart | Not added. |

## Plan snippet copies / allowed deviations

- **Copied from plan:** hero markup + schema ids; ingredient grid + block schema; routine step markup + block settings; hero home settings (eyebrow / heading HTML).
- **Required fixes:** Liquid ternary → `{% if %}`; product picker passed as object; `builder` omitted from `index.json`.
- **Valid HTML:** richtext `body` rendered in a `<div>`, not nested in `<p>`.
- **Foundation alignment:** inner wrappers use `page-width`; section CSS lives in `{% stylesheet %}`.
- **Homepage composition:** default blocks on editorial / ingredients / scent so Home is not empty before merchant edits. Presets include the same sample blocks.
- **Locales:** added `ingredient_honesty.in` / `ingredient_honesty.never`.

## Validation

Skill scripts from:

`C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid`

### `validate.mjs` revision 3 (first pass)

**Overall Status: VALID.** All 6 listed files SUCCESS.

### `validate.mjs` revision 4 (after scent-wardrobe token color)

Command:

```
node scripts/validate.mjs --theme-path k:\Elora\theme --files sections/hero-editorial.liquid,sections/ingredient-honesty.liquid,sections/routine-editorial.liquid,sections/scent-wardrobe.liquid,templates/index.json,locales/en.default.json --model cursor-grok-4.6-xhigh --client-name cursor --client-version 1.0.0 --artifact-id elora-p11 --revision 4
```

**Overall Status: VALID.** All 6 files SUCCESS.

### `shopify theme check --path k:\Elora\theme`

Exit 0. 23 files inspected, 2 warnings — same 11A `RemoteAsset` Google Fonts offenses on `layout/theme.liquid`. No offenses on 11B files.

Did not run `shopify theme push` / `shopify theme dev`.

## Leftover Liquid / storefront risks

- Hero heading is `richtext` inside `<h1>` (plan default wraps the tagline in `<p>`). Browsers may hoist the paragraph; CSS still targets `.hero__heading p`. Display copy remains the tagline.
- Featured collection grid stays empty until a merchant assigns a collection (same as 11A).
- Routine product cards are empty until a merchant picks products on each step.
- Theme has not been previewed against a live/dev shop in this task.
- No Soft Ritual Builder — Home will not Liquid-error for a missing `builder` section.

## Concerns

1. **Hero `<h1>` + richtext `<p>`** is the main leftover HTML risk; kept to match the plan heading setting type and `index.json` value.
2. Full-theme `theme check` is still **INVALID-looking only for Google Fonts**, required by Task 11 resolution 6. 11B files are clean.
3. Visual polish is CSS-only; photography/product picks still need merchant content.
