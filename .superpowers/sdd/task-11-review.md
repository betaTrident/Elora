# Phase 11 Review — Shopify Theme (Elora)

Scope: uncommitted `theme/` working tree (11A foundation + 11B storefront). Diffs read: `review-p11a-uncommitted.diff`, `review-p11b-uncommitted.diff`. On-disk reads of layout, templates, lockup, tokens, cart, and the four custom sections. validate.mjs / theme check were not re-run; implementer reports are accepted (11A leftover `RemoteAsset` on mandated Google Fonts; 11B files VALID; `shopify theme check` exit 0). Task-level 11A and 11B reviews are already **Approved** with Minors only; those Minors are triaged below and are **not** promoted. Soft Ritual Builder / Phase 12 Ajax add-to-cart are out of scope and correctly omitted.

### Spec Compliance

- ✅ Spec compliant against `task-11-brief.md` and Phase 11 Done when
- ⚠️ validate.mjs / theme check: implementer report only (not re-run)
- ⚠️ Live/dev shop preview: not performed (brief prefers validate + file checklist; `theme push` / `theme dev` against a live store was disallowed unless already authenticated)

Controller deviations from the plan snippet are **justified**, not misses: no Liquid ternary; product picker passed as object (not `all_products[handle]`); `"builder"` omitted from `index.json`; `{% stylesheet %}` for component CSS instead of `component-*.css`; `theme.js` via `defer` instead of `script_tag`.

| Done when / requirement | Verdict | Evidence |
|---|---|---|
| Home, Collection, Product, Cart load without Liquid errors | ✅ | JSON templates only reference existing sections: `hero-editorial`, `routine-editorial`, `ingredient-honesty`, `scent-wardrobe`, `featured-collection`, `main-collection`, `main-product`, `main-cart`. No `soft-ritual-builder`. Groups: `header-group.json` / `footer-group.json` (`type: header` / `footer`) |
| Header wordmark reads **Elora** | ✅ | `snippets/brand-lockup.liquid` (plan markup); rendered from `sections/header.liquid` |
| Hero shows tagline **Your everyday beauty ritual.** | ✅ | `hero-editorial` schema default + `templates/index.json` hero `heading`; eyebrow **Elora** |
| Brand tokens: porcelain background, display font hero | ✅ | `brand.css` `--color-porcelain: #F6EFE8`, `body` background, `--font-display`; hero `{% stylesheet %}` uses both (`--hero-bg` default/fallback porcelain; `.hero__heading` / `p` display font) |
| 3+ custom sections appear in theme editor as draggable sections | ✅ | Four, each with `"presets"`: Hero editorial, Ingredient honesty, Routine editorial, Scent wardrobe |
| Cart accepts line items with **Elora Ritual** properties | ✅ | `main-cart.liquid` loops `item.properties`, skips keys starting `_`, prints `property.first`: `property.last` (escaped). Phase 12 can write `properties: { 'Elora Ritual': '...' }` without a theme change |
| No Soft Ritual Builder on Home | ✅ | `index.json` `"order": ["hero", "editorial", "ingredients", "scent", "featured"]`. No `builder` key, no section file, no `ritual-builder.js` |
| Copy lock / Google Fonts stay | ✅ | Wordmark + tagline copied; DM Serif Display + DM Sans `<link>`s in `theme.liquid` as mandated |
| User-facing strings via `t`; schema labels plain English | ✅ | Locales include plan keys + extras; schema names match the plan |

**Focused checks (one per named risk):**

- **Home cannot Liquid-error on a missing builder** — `templates/index.json` has no `builder` / `soft-ritual-builder`. `theme/sections/` has no builder file.
- **No Liquid ternary** — none in `theme/**/*.liquid`. Ingredient In/Never is `{% if block.settings.type == 'in' %}…{% else %}…{% endif %}`.
- **Routine product picker is an object** — `{% render 'product-card', product: block.settings.product %}` (`routine-editorial.liquid`). No `all_products[…]`.
- **Cart still prints Elora Ritual from the line-item key** — `main-cart.liquid` uses `property.first` / `property.last`, not the unused locale `cart.ritual_property`. `_` prefix skip via `slice: 0`.
- **Four templates resolve** — `collection.json` / `product.json` / `cart.json` still point at `main-*` only; `index.json` types all exist on disk.
- **Presets for theme editor** — all four custom sections include `"presets"` with plan names. Header/footer/announcement are group-only (`enabled_on.groups`), so they do not pollute Add section on pages.

---

### Strengths

- Phase 11 is the storefront the plan asked for, with the plan’s known Liquid bugs actually fixed: no ternary, product setting rendered as an object, builder omitted so Home cannot 404 a Phase 12 section.
- Copy lock is copied, not paraphrased: wordmark **Elora**, tagline **Your everyday beauty ritual.**, porcelain/sand/ink/sage tokens, DM Serif Display / DM Sans, empty-bag sentence, locale `cart.ritual_property`.
- OS 2.0 shell is correct: `content_for_header`, `{% sections 'header-group' %}` / `footer-group`, `#MainContent`, skip-link first in `<body>`, `theme_info.theme_name` **Elora**, snippets with `{% doc %}`, sections with `{% schema %}`.
- Homepage composition matches the brief exactly (`hero` → `editorial` → `ingredients` → `scent` → `featured`) and ships sample blocks so editorial / ingredients / scent are not empty before merchant edits.
- Cart is Phase-12-ready without pretending to be the builder: generic property rendering, `_` keys skipped, values escaped, checkout via `name="checkout"`. Product add-to-cart remains a Liquid `{% form 'product' %}` POST.
- Visual system is coherent: porcelain page background, display font on headings and hero, section CSS in `{% stylesheet %}`, scent wardrobe on porcelain/sand/sage, ingredient In vs Never distinguished in CSS rather than cute Unicode in Liquid.
- 11A commerce paths stay intact: paginate-by-12 collection grid, product variant `name="id"` + quantity, cart quantity auto-submit. 11B did not rewrite those templates.
- Implementer reports are accurate (`DONE_WITH_CONCERNS`), document Google Fonts validator noise and the h1+richtext leftover, and do not claim a live preview or Phase 12 work.

---

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None blocking Phase 12 or later planned work._ The deferred Minors do not break template load, the Elora lockup, the hero tagline, brand tokens, draggable presets, or **Elora Ritual** property display. None need to be promoted.

#### Minor (Nice to Have)

Triage key: **Defer** = not needed before Phase 12 (Soft Ritual Builder) or later planned phases. None of these must be fixed first.

**Already logged (11A)**

1. **Homepage featured grid is empty until a merchant assigns a collection** (`templates/index.json`, `featured-collection.liquid`)
   - Collection setting is unset; empty copy is `featured_collection.empty`. If a collection is assigned but has zero products, an empty `<ul>` and “View …” still render.
   - **Triage: Defer.** Spec allows this; a repo cannot bind a store collection GID. Not a Liquid error.

2. **Product price/media do not follow the selected variant** (`main-product.liquid`)
   - Heading price uses `product.price` / `product.compare_at_price` and `product.featured_image`. Full-page POST still adds the chosen `id`.
   - **Triage: Defer.** Ajax variant UI was not required. Optional later with Phase 12 cart JS, not a Phase 11 miss.

3. **Empty main-menu still outputs a nav** (`header.liquid`)
   - `linklists.main-menu` with no links yields `<nav><ul></ul></nav>`.
   - **Triage: Defer.** Wrap when `links.size > 0`.

4. **Mobile cart price sits under the thumbnail** (`base.css` `.cart-item`)
   - Two-column grid (`88px 1fr`) places the third child (price) in the image column below 700px.
   - **Triage: Defer.** Layout polish only.

5. **Image `alt` uses media alt only** (product, card, cart; also hero/routine in 11B)
   - Blank `image.alt` yields empty `alt`. Fallback to product/item/heading text would be better.
   - **Triage: Defer.** Same pattern in both slices.

6. **`html { scroll-behavior: smooth; }` has no `prefers-reduced-motion` opt-out** (`base.css`)
   - **Triage: Defer.** Small vestibular a11y miss; not specified.

7. **`validate.mjs` overall INVALID** (documented)
   - Only the plan-mandated Google Fonts `<link>`s. `shopify theme check` exit 0 with the same `RemoteAsset` warnings.
   - **Triage: Defer.** Do not strip the fonts. Resolution 6 wins.

8. **Review-package encoding vs disk**
   - Diffs display `ΓÇö` / `┬⌐` for em dash and `©`. On-disk locales and lockup are UTF-8.
   - **Triage: Defer.** Packaging artifact, not a theme bug.

**Already logged (11B)**

9. **Hero `<h1>` wraps a richtext `<p>`** (`hero-editorial.liquid`; schema default and `index.json` heading `"<p>Your everyday beauty ritual.</p>"`)
   - Invalid heading content model. Kept to match the plan’s `richtext` setting. CSS targets `.hero__heading p` so the tagline still uses the display font.
   - **Triage: Defer.** Visible copy is the locked tagline. Optional later: `type: text` heading, or unwrap the first `<p>` before printing inside `<h1>`. Do not block Phase 12 on it.

10. **Routine product cards are empty until a merchant picks products** (`routine-editorial.liquid`; homepage steps have copy but no product)
    - **Triage: Defer.** A `product` setting cannot ship a real GID without a shop. `!= blank` plus `product-card`’s blank check avoids empty cards.

11. **Heading skip in routine editorial** (`routine-editorial.liquid`)
    - Steps are `<h3>` with no section `<h2>`. Product cards then output another `<h3>`.
    - **Triage: Defer.** Outline polish; not specified.

**New (not in the prior task reviews; still not blocking)**

12. **Google Fonts file origin is not preconnected** (`layout/theme.liquid`)
    - Plan (and implementation) preconnect only `fonts.googleapis.com`. Font files come from `fonts.gstatic.com`.
    - **Triage: Defer.** Optional: add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`. Does not affect Done when.

No other new behavioral gap. `cart.ritual_property` remains unused as a label because the cart prints `property.first` — that is what Phase 12 needs. `score-badge.liquid` / `ritual-tag.liquid` / `icon-*.liquid` / `component-*.css` / `ritual-builder.js` from the monorepo tree are Phase 12 or superseded by `{% stylesheet %}`; not Phase 11 misses.

---

### Recommendations

- Proceed to Phase 12 (Soft Ritual Builder) without waiting on the Minors above. Do not treat the hero h1+richtext nesting, empty featured collection, or Google Fonts `RemoteAsset` noise as builder blockers.
- When Phase 12 adds `soft-ritual-builder.liquid` + `ritual-builder.js`, insert `"builder"` into `templates/index.json` **after** the section file exists (order from the plan: hero, builder, editorial, ingredients — current Home also has scent + featured, which should stay). Until then, keep builder omitted.
- Line-item write path should use the exact key **`Elora Ritual`** (space, that capitalization). Cart already displays whatever `property.first` is; no theme change required for display.
- Before the first `shopify theme push` / store preview, assign a featured collection (and optional routine products / hero image) in the editor so Home is not copy-only. That is merchant content, not a code fix.
- Optional later (not Phase 12): unwrap hero heading to `type: text`; `prefers-reduced-motion`; image `alt` fallbacks; cart grid `88px 1fr auto` on small screens; `404` / `password` templates when the theme is first installed on a shop.
- When committing, this is still an uncommitted `theme/` tree; do not include `.superpowers/sdd/*` review artifacts unless that is intentional.

---

### Assessment

**Ready to merge?** Yes

**Reasoning:** Phase 11 Done when is met: the four templates resolve without a missing-section error, the header lockup reads **Elora**, the hero shows **Your everyday beauty ritual.** on porcelain with the display font, four preset custom sections are draggable, and cart will show **Elora Ritual** line-item properties. Remaining items are documented polish and merchant content gaps — none should block Soft Ritual Builder.
