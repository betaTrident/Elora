# Task 11A Review — Theme foundation

**Spec compliance:** Meets Task 11A requirements.

Scope: uncommitted `theme/` only (`review-p11a-uncommitted.diff`). 11B custom sections (hero-editorial, ingredient-honesty, routine-editorial, scent-wardrobe) and Soft Ritual Builder are out of scope. Diff was read once and is complete (22 files, 1080 insertions). On-disk reads of `locales/en.default.json`, `snippets/brand-lockup.liquid`, `layout/theme.liquid`, and `sections/main-product.liquid` were used only to confirm UTF-8 (the review diff shows em dash / `©` as mojibake). validate.mjs / theme check were not re-run; leftover Google Fonts `RemoteAsset` noise is accepted as documented.

---

### Spec Compliance

Meets the Task 11A brief and the 11A “done when” list. Controller resolutions that apply to 11A are honored. 11B homepage composition was correctly omitted.

| Requirement | Verdict | Evidence |
|---|---|---|
| OS 2.0 theme under `theme/` with layout, config (`theme_name` Elora), locales, `header-group` / `footer-group` | ✅ | `settings_schema.json` `theme_info.theme_name`: `"Elora"`; groups `type: header` / `type: footer` |
| `brand.css` tokens: porcelain `#F6EFE8`, `--font-display` | ✅ | Verbatim plan tokens; body porcelain + display headings |
| Four templates: index, collection, product, cart — only existing sections | ✅ | `featured-collection`, `main-collection`, `main-product`, `main-cart` only |
| `index.json`: featured-collection only; **no** `soft-ritual-builder` | ✅ | `"order": ["featured"]`; no `builder`, no 11B types |
| Header wordmark **Elora**; `brand-lockup` from plan + `{% doc %}` | ✅ | Plan markup + LiquidDoc; tagline locked |
| Skip-to-content → `#MainContent` | ✅ | First focusable in `theme.liquid`; `<main id="MainContent">` |
| Google Fonts in `theme.liquid` (plan-mandated) | ✅ | DM Serif Display + DM Sans `<link>`s as in the plan |
| Product `{% form 'product', product %}` with `name="id"` + quantity | ✅ | Hidden `id` or `<select name="id">`; `name="quantity"` |
| Collection `{% paginate collection.products by 12 %}` via `product-card` | ✅ | `main-collection.liquid` |
| Cart `{% form 'cart' %}` + line-item properties; skip `_` keys; show **Elora Ritual** | ✅ | Loop `item.properties`; `slice: 0 != '_'`; prints `property.first`: `property.last` |
| Empty cart: `cart.empty` → `Your bag is empty — start your everyday ritual.` | ✅ | Locale + `{{ 'cart.empty' \| t }}` (UTF-8 em dash on disk) |
| No Liquid ternary; no `app/**`; no commits | ✅ | No `? :` in Liquid; diff is `theme/` only |
| Snippets `{% doc %}`; sections `{% schema %}` | ✅ | Both snippets documented; page sections include `"presets"`; header/footer/announcement are group-only |
| `validate.mjs` passes **or** leftover noise documented | ✅ | Report: INVALID only on mandated Google Fonts CDN links; theme check exit 0 with the same warnings |

Allowed 11A deviations from the plan snippet (not misses): skip-link + `tabindex="-1"` on `<main>`; `theme.js` via `defer` instead of `script_tag` (theme-check parser-blocking). `index.json` does not include 11B `hero` / `editorial` / `ingredients` / `scent` or Phase 12 `builder`.

---

### Strengths

- File set matches the 11A list (22 files), including a real `featured-collection.liquid` with collection setting, product-card grid, and a theme-editor preset so Home can load without Liquid errors.
- Brand lock is copied, not paraphrased: wordmark, tagline, porcelain/sand/ink/sage tokens, display/body font stacks, and locale keys (`cart.empty`, `cart.ritual_property`).
- Cart is Phase-12-ready: properties render from the line-item key (so **Elora Ritual** appears as written), `_` prefixes are skipped, values are escaped, file-upload URLs are the only unescaped `href`. Empty bag uses the locked sentence.
- Product/collection/cart are actually usable: add-to-cart POST, paginate-by-12, cart update + checkout (`name="checkout"`), quantity change auto-submit in `theme.js`.
- Layout is a correct OS 2.0 shell: `content_for_header`, `{% sections 'header-group' %}` / `footer-group`, `#MainContent`, `asset_url` stylesheets. Skip-link lives first in `<body>` (better than burying it in the header section).
- Liquid hygiene: `{% if %}` not ternaries; `| escape` on merchant/customer strings that are not rich text; `{% stylesheet %}` in snippets for component CSS; `enabled_on` keeps header/footer/announcement in groups and main sections on their templates.
- Implementer report is accurate (`DONE_WITH_CONCERNS`), does not claim 11B, and documents validator noise instead of “fixing” the required Google Fonts links.

---

### Issues

#### Critical

_None._

#### Important

_None._ Nothing here blocks 11B (custom sections + `index.json` composition) or Phase 12 ritual line-item properties.

#### Minor

1. **Homepage featured grid is empty until a merchant assigns a collection** (`templates/index.json`, `featured-collection.liquid`)
   - Collection setting is unset; the empty locale string is shown. Spec allows this for 11A.
   - If the collection is assigned but has zero products, an empty `<ul>` and “View …” still render instead of the empty copy.

2. **Product price/media do not follow the selected variant** (`main-product.liquid`)
   - Heading price uses `product.price` / `product.compare_at_price` and only `product.featured_image`. The variant `<select>` does not update price or image. Full-page POST still adds the chosen `id`. Acceptable for 11A (no Ajax required).

3. **Empty main-menu still outputs a nav** (`header.liquid`)
   - `linklists.main-menu` with no links yields `<nav><ul></ul></nav>`. Wrap the nav when `links.size > 0`.

4. **Mobile cart price sits under the thumbnail** (`base.css` `.cart-item`)
   - Two-column grid (`88px 1fr`) places the third child (price) in the image column below 700px. Three-column layout at 700px+ is fine.

5. **Image `alt` uses media alt only** (product, card, cart)
   - Blank `image.alt` yields empty `alt`. Fallback to product/item title would be better.

6. **`html { scroll-behavior: smooth; }` has no `prefers-reduced-motion` opt-out** (`base.css`)
   - Small vestibular a11y miss; not specified.

7. **`validate.mjs` overall INVALID** (documented)
   - Only the plan-mandated Google Fonts `<link>`s. `shopify theme check` exit 0 with the same `RemoteAsset` warnings. Do not strip the fonts for 11A.

8. **Review-package encoding vs disk**
   - `review-p11a-uncommitted.diff` displays `ΓÇö` / `┬⌐` for em dash and `©`. On-disk locales and lockup are correct UTF-8. Not an implementer defect.

Out of 11A file list (do not treat as misses): no `404` / `password` / `gift_card` templates; theme not loaded on a live shop (report concern 3).

---

### Assessment

11A is a complete, spec-faithful OS 2.0 skeleton: four templates resolve, lockup reads **Elora**, tokens and fonts match the plan, and cart will show **Elora Ritual** without printing `_` properties. Build quality is solid for a foundation pass (escaping, LiquidDoc, group JSON, minimal JS). Remaining notes are polish, not gates.

**Task quality:** Approved
