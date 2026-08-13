# Task 11B Review — Custom sections + home composition

**Spec compliance:** Meets Task 11B requirements.

Scope: uncommitted 11B slice only (`review-p11b-uncommitted.diff`). 11A foundation is in scope solely to confirm product / collection / cart were not broken. Soft Ritual Builder / Phase 12 Ajax add-to-cart are out of scope and correctly omitted. Diff was read once and is complete (6 files, 829 insertions; no truncated hunks). On-disk reads used for the three named focused checks plus UTF-8 (the review diff mojibakes em dash / `·` / `©`). validate.mjs / theme check were not re-run; leftover Google Fonts `RemoteAsset` noise on `theme.liquid` is 11A and accepted.

**Focused checks (one each):**

1. **`index.json` has no builder** — `"order": ["hero", "editorial", "ingredients", "scent", "featured"]`. No `builder` key, no `soft-ritual-builder` type. No `soft-ritual-builder.liquid` in `theme/sections/`.
2. **`main-cart.liquid` still renders Elora Ritual properties (unchanged)** — not in the 11B diff. Still loops `item.properties`, skips keys whose first character is `_`, prints `property.first` / `property.last` (escaped). `cart.json` still points at `main-cart`. Locale keys `cart.empty` and `cart.ritual_property` remain.
3. **No Liquid ternary in new sections** — no `?` in `hero-editorial.liquid`, `ingredient-honesty.liquid`, `routine-editorial.liquid`, or `scent-wardrobe.liquid`. In/Never is `{% if block.settings.type == 'in' %}…{% else %}…{% endif %}`.

---

### Spec Compliance

Meets the Task 11B brief and the 11B “done when” list. Controller resolutions that apply to 11B are honored. 11A product / collection / cart templates still load.

| Requirement | Verdict | Evidence |
|---|---|---|
| Four custom sections: hero-editorial, ingredient-honesty, routine-editorial, scent-wardrobe | ✅ | All four created under `theme/sections/` with markup + `{% stylesheet %}` + `{% schema %}` |
| Each has `"presets"` so they appear in the theme editor | ✅ | Preset names match the plan (“Hero editorial”, “Ingredient honesty”, “Routine editorial”, “Scent wardrobe”). Editorial / ingredients / scent presets include sample blocks |
| `index.json` order exactly `hero, editorial, ingredients, scent, featured` | ✅ | Types: `hero-editorial`, `routine-editorial`, `ingredient-honesty`, `scent-wardrobe`, `featured-collection` |
| **No** builder / Soft Ritual Builder | ✅ | Omitted from JSON; no section file; no `ritual-builder.js` |
| Hero defaults: eyebrow **Elora**; heading **Your everyday beauty ritual.**; porcelain `#F6EFE8`; display font | ✅ | Schema defaults + homepage settings; `--font-display` on `.hero__heading` / `.hero__heading p`; `--hero-bg` default / fallback porcelain |
| No Liquid ternary; In/Never via if/else | ✅ | Locale `ingredient_honesty.in` / `.never`; optional mark via CSS `::before`, not a ternary |
| Routine editorial: `{% render 'product-card', product: block.settings.product %}` | ✅ | No `all_products[handle]`. Two-column steps at 768px+ when an image exists; stacked below |
| ≥3 custom section types on Home | ✅ | Four, plus featured-collection from 11A |
| Collection / Product / Cart still load | ✅ | `collection.json` / `product.json` / `cart.json` still reference `main-collection` / `main-product` / `main-cart`. Not in this diff |
| Cart still shows **Elora Ritual** properties | ✅ | `main-cart.liquid` property loop unchanged |
| No Phase 12 Ajax ritual add-to-cart | ✅ | `theme.js` still skip-link + cart quantity submit only; no `fetch` / XHR / Polaris |
| Polariss / Polaris not used on storefront | ✅ | Liquid + CSS + existing min JS |
| Copy lock: Elora / Your everyday beauty ritual. | ✅ | Hero eyebrow + heading default and homepage values. Locale `general.brand` / `general.tagline` unchanged |
| User-facing In/Never via `t`; schema labels plain English | ✅ | New locale keys only; schema names match the plan |
| No `app/**`, no plan edit, no commits | ✅ | Diff is the six 11B files (locales includes the additive `ingredient_honesty` keys) |

Allowed deviations from the plan snippet (not misses): richtext `body` in a `<div>` instead of nested in `<p>` (valid HTML); product picker passed as object; ternary replaced with `{% if %}`; `builder` omitted; homepage instances include default blocks so Home is not empty before merchant edits; component CSS in `{% stylesheet %}` rather than rewriting `base.css` (matches controller preference).

---

### Strengths

- Homepage composition is the spec, not an approximation: exact section ids, types, and order, with sample blocks so editorial / ingredients / scent render real copy on first load.
- Required plan-snippet bugs are actually fixed: Liquid has no ternary; `routine-editorial` renders the product setting object into `product-card`; builder is absent so Home cannot Liquid-error on a missing Phase 12 section.
- Hero lock is copied, not paraphrased: eyebrow `Elora`, heading `<p>Your everyday beauty ritual.</p>`, background `#F6EFE8`, display font via `--font-display`. Porcelain is both the color default and the CSS fallback.
- Ingredient honesty is the cleanest of the four: if/else labels, escaped merchant strings, `block.shopify_attributes`, In vs Never distinguished with CSS marks (circle / dash) instead of Unicode in Liquid.
- Routine layout matches the brief: `{% stylesheet %}` two-column step grid, stacked under 768px, even rows flip image order when an image exists. Product card is width-capped so it does not stretch the text column.
- Scent wardrobe is a real bonus section (heading + name/note blocks, preset of four moods, porcelain/sand/sage surfaces, `role="list"` on a `list-style: none` grid). Counts toward 3+ custom sections without pretending to be the builder.
- 11A is left standing: product/collection/cart JSON templates untouched; cart property rendering untouched; `theme.js` not expanded into Ajax ATC; locales only add `ingredient_honesty.*`.
- Implementer report is accurate (`DONE_WITH_CONCERNS`), names the h1+richtext leftover, and does not claim a live theme preview or Phase 12 work.

---

### Issues

#### Critical

_None._

#### Important

_None._ Nothing here blocks Phase 12 (Soft Ritual Builder + ritual line-item properties). Cart still prints **Elora Ritual** from `property.first`.

#### Minor

1. **Hero `<h1>` wraps a richtext `<p>`** (`hero-editorial.liquid` heading output; schema default `"<p>Your everyday beauty ritual.</p>"`; `index.json` hero `heading`)
   - Invalid heading content model. The implementer documented this and kept it to match the plan’s `richtext` setting. CSS targets `.hero__heading p` so the tagline still uses the display font if the paragraph stays nested.
   - Not a spec miss (brief: heading from the plan). Optional later fix: `type: text` heading, or unwrap the first `<p>` before printing inside `<h1>`. Do not block 11B on it.

2. **Homepage featured grid is still empty until a merchant assigns a collection** (`templates/index.json` `featured` settings have title only)
   - Same 11A leftover. 11B correctly kept `featured-collection` in the order; it cannot bind a store collection from this repo. Empty copy is `featured_collection.empty`.

3. **Routine product cards are empty until a merchant picks products** (`routine-editorial.liquid` product setting; homepage steps have copy but no product)
   - Correct: a `product` setting cannot ship a real GID without a shop. The `!= blank` guard plus `product-card`’s own blank check avoids empty cards. Documented in the implementer report.

4. **Heading skip in routine editorial** (`routine-editorial.liquid`)
   - Steps are `<h3>` with no section `<h2>`. Product cards then output another `<h3>` (11A snippet) inside a nested `<article>`. Valid, but the outline jumps. A section heading setting, or a `<p>`/`<h4>` product title in this context, would be cleaner. Not specified.

5. **Image `alt` uses media alt only** (hero + routine `image_tag`)
   - Blank `image.alt` yields empty `alt`. Same 11A pattern. Fallback to eyebrow/heading/step heading would be better.

6. **Review-package encoding vs disk**
   - Diff shows `ΓÇö` / `┬╖` / `┬⌐`. On-disk `en.default.json` and section JSON use real `—` / `·` / `©`. Packaging artifact, not a theme bug.

---

### Assessment

11B is the storefront composition the brief asked for: four preset custom sections, locked hero copy on porcelain with the display font, exact `index.json` order without a builder, product object (not `all_products`) in routine editorial, if/else In/Never, and no Polaris / Ajax ritual cart. 11A cart property rendering and product/collection templates are intact. Leftovers are documented HTML/content gaps, not missing requirements.

**Task quality:** Approved
