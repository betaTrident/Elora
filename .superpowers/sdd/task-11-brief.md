# Task 11: Phase 11 — Shopify Theme (Elora)

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 11 (lines 1831–2077) plus the `theme/` tree in §1.

## Where this fits

Phases 0–10 (embedded app) are done. **There is no `theme/` directory yet.** This phase is the customer-facing Elora storefront (Liquid + CSS + minimal JS). Phase 12 is Soft Ritual Builder — **do not build it here.**

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not change `app/**`.

## Skills (mandatory)

Read and follow:

- `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid\SKILL.md`
- Search before writing Liquid: `scripts/search_docs.mjs` from that skill directory
- Validate after writing: `scripts/validate.mjs --theme-path k:\Elora\theme --files <rel,rel,...>` with `--model cursor-grok-4.6-xhigh --client-name cursor --client-version 1.0.0 --artifact-id elora-p11 --revision N`

Copy lock (customer-facing):

- Wordmark: **Elora**
- Tagline: **Your everyday beauty ritual.**
- Voice: soft, elegant, distinctly feminine — never literal, never cute, never clinical

## Controller resolutions (do not re-ask)

1. **No Soft Ritual Builder.** Do not create `soft-ritual-builder.liquid` or `ritual-builder.js`. **Omit** `"builder"` from `templates/index.json` so Home does not Liquid-error. Phase 12 will add it.
2. **Plan snippet uses a Liquid ternary** (`type == 'in' ? '✓ In' : '✕ Never'`). Liquid has **no ternary**. Use `{% if %}`. Same for any other ternaries.
3. **Product picker settings return objects**, not handles. In `routine-editorial`, render `{% render 'product-card', product: block.settings.product %}` — do **not** `all_products[block.settings.product]`.
4. **Snippets need `{% doc %}`** (LiquidDoc). Sections need `{% schema %}` + `"presets"` so they appear as draggable theme-editor sections.
5. **`{% sections 'header-group' %}` / `footer-group`** require `theme/sections/header-group.json` and `footer-group.json` (`type: header` / `type: footer`).
6. **Google Fonts in `theme.liquid` stay** (plan brand lock: DM Serif Display + DM Sans) even though the generic Liquid skill prefers no CDN libraries.
7. **Layout may use `asset_url`** for `brand.css`, `base.css`, `theme.js`. Prefer `{% stylesheet %}` inside sections/snippets for component CSS.
8. **Cart properties:** cart template must render line-item properties, especially key **`Elora Ritual`** (Phase 12 writes `properties: { 'Elora Ritual': '...' }`). Skip keys starting with `_`. Empty cart copy: `{{ 'cart.empty' | t }}` → `Your bag is empty — start your everyday ritual.`
9. **Do not** run `shopify theme push` / `shopify theme dev` against a live store unless it is already authenticated and non-destructive. Prefer `validate.mjs` + file checklist. If `shopify theme check` works locally, run it.
10. PowerShell: **no `&&`**.
11. User-facing strings via `{{ 'key' | t }}` and `locales/en.default.json` (expand keys as needed). Schema labels may be plain English matching the plan (`"Hero editorial"`).
12. **Bonus section `scent-wardrobe.liquid` is in scope** (file tree). Simple editorial grid of scent moods (blocks: name + note). Counts toward 3+ custom sections.

## Split

- **11A (foundation):** OS 2.0 skeleton + 4 templates that load + header wordmark + tokens + working product/collection/cart (including property display).
- **11B (storefront):** custom sections + index composition + visual CSS. Does not rewrite 11A unless a template cannot host a section.

---

# Task 11A — Theme foundation

## Files

```
theme/config/settings_schema.json     # theme_name: Elora
theme/config/settings_data.json
theme/layout/theme.liquid             # from plan (fonts + brand.css + base.css + header-group/main/footer-group + theme.js)
theme/locales/en.default.json         # plan keys + extra keys you use
theme/assets/brand.css                # plan tokens verbatim
theme/assets/base.css                 # layout, header, footer, buttons, product, cart, a11y
theme/assets/theme.js                 # skip-link focus; optional cart quantity — keep minimal
theme/snippets/brand-lockup.liquid    # plan markup + {% doc %}
theme/sections/header.liquid          # brand-lockup + nav (linklists.main-menu) + cart link with count
theme/sections/footer.liquid          # brand-lockup + copyright
theme/sections/announcement-bar.liquid
theme/sections/header-group.json
theme/sections/footer-group.json
theme/sections/main-product.liquid    # image, title, price, description, {% form 'product' %} add to cart
theme/sections/main-collection.liquid # title + paginated product grid via product-card
theme/sections/main-cart.liquid       # {% form 'cart' %}; line items; properties; empty state; checkout
theme/snippets/product-card.liquid    # image, title, price, link; {% doc %}
theme/templates/index.json            # 11A: featured-collection OR a single placeholder section that exists
theme/templates/collection.json
theme/templates/product.json
theme/templates/cart.json
```

For 11A `index.json`, a `featured-collection` section is enough (create a simple `featured-collection.liquid` with preset, collection setting, product-card grid). 11B will prepend hero + editorial sections.

`settings_schema.json` must include a `theme_info` object with `"theme_name": "Elora"`.

Header: skip-to-content link targeting `#MainContent`. Wordmark visible **Elora**. Cart link uses `routes.cart_url`.

Product form: `{% form 'product', product %}` with variant `name="id"` and quantity. Collection: `{% paginate collection.products by 12 %}`.

Cart: for each `item.properties` as `property`, if `property.first` does not start with `_`, show `property.first`: `property.last`. Empty: locale `cart.empty`.

## 11A done when

- The four JSON templates exist and only reference sections that exist
- Header lockup text includes **Elora**
- `brand.css` has porcelain `#F6EFE8` and `--font-display`
- `validate.mjs --theme-path k:\Elora\theme` passes on the files you created (or you document leftover validator noise)
- Cart markup includes property rendering for `Elora Ritual`

---

# Task 11B — Custom sections + home composition

Depends on 11A files existing.

## Files (plan snippets — fix ternary / product object per resolutions)

```
theme/sections/hero-editorial.liquid
theme/sections/ingredient-honesty.liquid
theme/sections/routine-editorial.liquid
theme/sections/scent-wardrobe.liquid          # bonus; presets required
theme/templates/index.json                    # update order (NO builder)
```

**`index.json` order:**

```json
"order": ["hero", "editorial", "ingredients", "scent", "featured"]
```

Types: `hero-editorial`, `routine-editorial`, `ingredient-honesty`, `scent-wardrobe`, `featured-collection`.

Hero default heading / eyebrow from the plan so the homepage shows **Your everyday beauty ritual.**

Each custom section: `{% schema %}` + `"presets": [{ "name": "..." }]` so they appear in the theme editor.

Ingredient honesty labels: `{% if block.settings.type == 'in' %}In{% else %}Never{% endif %}` (no ternary). Optional checkmark via CSS, not a ternary.

Routine editorial: `{% stylesheet %}` for a two-column step layout; stacked on small screens.

Scent wardrobe: heading setting + blocks (`name`, `note`). Porcelain/sand/sage visual language.

Polish `base.css` / section styles so hero uses display font and porcelain background.

Do **not** add Ajax ritual add-to-cart (Phase 12). Product add-to-cart via Liquid form is enough.

## 11B done when

- Home JSON includes ≥3 custom section types with presets
- Hero settings default to Elora + tagline
- Collection / Product / Cart templates still load (do not break 11A)
- Cart still shows `Elora Ritual` properties
- validate.mjs on new/changed files

---

## Reports

11A → `k:\Elora\.superpowers\sdd\task-11a-report.md`  
11B → `k:\Elora\.superpowers\sdd\task-11b-report.md`

Include: files created, validation commands + output, leftover Liquid risks, concerns.

Then return under 15 lines: Status, commits (none), one-line verify summary, report path.
