# Task 12A Report — Soft Ritual Builder (Liquid + CSS + wiring)

## What was implemented

### `theme/sections/soft-ritual-builder.liquid` (created)
- Full section markup per 12B contract: `ritual-builder` root with `id="ritual-builder-{{ section.id }}"`, `data-ritual-builder`, `data-section-id`
- Header with `section.settings.heading` / optional subheading inside `page-width`
- Three `.ritual-builder__step` nodes (`data-step="1|2|3"`); steps 2–3 and result have `hidden`
- Choice buttons with verbatim `data-filter` values (`concern:*`, `moment:*`, `scent:*`), all `type="button"`
- Result block with empty `[data-result-products]`, add (`btn btn--primary`), and restart controls
- Product JSON in `<script type="application/json" data-builder-products>` using collection object pattern from `featured-collection.liquid`
- Guards: `[]` when no collection; `""` for missing image (no `image_url` on nil); `null` for missing `first_available_variant`
- Product loop limited to 50
- User-facing copy via `{{ 'builder.*' | t }}`
- `{% stylesheet %}` block: stacked mobile layout, choice buttons with `.is-selected`, result product cards column → row at 768px, `prefers-reduced-motion` on hover
- Schema: heading, subheading, collection settings; preset `"Soft Ritual Builder"`

### `theme/locales/en.default.json` (updated)
- Added `builder.*` keys: step labels, all choice labels, result title, add/restart CTA copy

### `theme/templates/index.json` (updated)
- Inserted `"builder"` section after `"hero"`
- Order: `["hero", "builder", "editorial", "ingredients", "scent", "featured"]`
- All Phase 11B sections preserved unchanged

## What was tested

### validate.mjs
```text
node scripts/validate.mjs --theme-path k:\Elora\theme --files sections/soft-ritual-builder.liquid,locales/en.default.json,templates/index.json --model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p12 --revision 1
```
**Result:** ✅ VALID — all 3 files passed.

### shopify theme check
```text
shopify theme check
```
**Result:** 24 files inspected, 0 offenses in new/changed files. 3 pre-existing RemoteAsset warnings in `theme.liquid` (Google Fonts).

## Files changed

| File | Action |
|------|--------|
| `theme/sections/soft-ritual-builder.liquid` | Created |
| `theme/locales/en.default.json` | Updated |
| `theme/templates/index.json` | Updated |

## Self-review findings

- **Completeness:** All 12A deliverables present; 12B markup contract honored exactly.
- **Patterns:** Matches `featured-collection.liquid` (collection object), `scent-wardrobe.liquid` / `hero-editorial.liquid` (`{% stylesheet %}`, `page-width`, `reveal`, brand tokens).
- **YAGNI:** No JS, no `theme.liquid` changes, no cart edits — correctly scoped to 12A.
- **Accessibility:** Semantic buttons, `focus-visible` outlines, `type="button"` on all interactive controls.
- **JSON safety:** Nil guards prevent Liquid errors when products lack images or variants.

## Issues or concerns

1. **No collection in homepage JSON** — Builder ships with `[]` product data until a merchant assigns "Builder product collection" in the theme editor. Expected; filtering/add-to-cart will be empty until then.
2. **JS button states** (Adding… / Added! / Error) are out of scope for 12A; 12B may add locale keys or `data-*` attributes.
3. **Theme check noise** — Only unrelated Google Fonts RemoteAsset warnings in `theme.liquid`.

## Fix pass

### What changed
- `theme/sections/soft-ritual-builder.liquid`: gated `.ritual-builder__result` layout on `:not([hidden])` so the UA `[hidden] { display: none }` rule is not overridden by `display: flex` on first paint or when 12B sets `resultEl.hidden = true` on restart.
- No change to `.ritual-builder__step` — steps 2–3 do not set `display` in CSS, so `hidden` already works there.

### Covering test file(s)
- `sections/soft-ritual-builder.liquid`

### Command run
```text
node "C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid\scripts\validate.mjs" --theme-path k:\Elora\theme --files sections/soft-ritual-builder.liquid --model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p12 --revision 2
```

### Full relevant output
```text
## Validation Summary

**Overall Status:** ✅ VALID
**Total Files:** 1

## Detailed Results

### File 1
**Artifact ID:** elora-p12
**Revision:** 2
*Use same ID & increment revision when retrying on an improvement of this artifact*

**Status:** ✅ SUCCESS
**Details:** sections/soft-ritual-builder.liquid passed all checks.
```

## Out of scope (confirmed not done)

- `theme/assets/ritual-builder.js`
- `theme/layout/theme.liquid` script tag
- Ajax cart / filtering logic
- `main-cart.liquid` changes
- Commits
