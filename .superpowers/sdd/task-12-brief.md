# Task 12: Phase 12 — Soft Ritual Builder

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 12 (lines 2081–2285).

## Where this fits

Phases 0–11 are done. The Elora Online Store 2.0 theme lives in `k:\Elora\theme`. Cart already renders line-item properties (including **Elora Ritual**) in `theme/sections/main-cart.liquid`. This phase adds the interactive Soft Ritual Builder: concern → moment → scent mood → 3-product result → Ajax add to cart.

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not change `app/**`.

## Skills (mandatory)

Read and follow:

- `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid\SKILL.md`
- Search before writing Liquid: `scripts/search_docs.mjs` from that skill directory
- Validate after writing: `scripts/validate.mjs --theme-path k:\Elora\theme --files <rel,rel,...>` with `--model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p12 --revision N`

Copy lock (customer-facing):

- Wordmark: **Elora**
- Tagline: **Your everyday beauty ritual.**
- Voice: soft, elegant, distinctly feminine — never literal, never cute, never clinical

## Controller resolutions (do not re-ask)

1. **Collection setting is an object**, not a handle. Do **not** use `collections[section.settings.collection]`. Follow `theme/sections/featured-collection.liquid`: `{% assign builder_collection = section.settings.collection %}` then loop `builder_collection.products` only when `builder_collection != blank`.
2. **Guard JSON dump.** If collection is blank, emit `[]`. If `product.featured_image` is blank, emit `""` for `image`. If `product.first_available_variant` is blank, emit `null` for `variantId`. Never call `image_url` on nil.
3. **Unique IDs.** Use `id="ritual-builder-{{ section.id }}"` and put JSON in a `<script type="application/json" data-builder-products>` **inside the section** (no global `id="builder-products"`). Add `data-ritual-builder` on the section root so 12B can init every instance.
4. **Keep 11B homepage sections.** Insert `"builder"` after `"hero"`. Do **not** drop scent/featured. Order must be: `["hero", "builder", "editorial", "ingredients", "scent", "featured"]`.
5. **User-facing strings** via `{{ 'key' | t }}` and `locales/en.default.json` (max 3 levels, snake_case). Schema labels/presets may be plain English matching the plan (`"Soft Ritual Builder"`). Choice `data-filter` values are **verbatim** from the plan: `concern:glow`, `concern:hydrate`, `concern:calm`, `concern:barrier`, `moment:am`, `moment:pm`, `moment:body`, `scent:clean`, `scent:warm`, `scent:floral`, `scent:unscented`.
6. **Buttons:** `type="button"` on every choice, add, and restart control. Use existing `.btn` / `.btn--primary` for Add ritual.
7. **CSS in `{% stylesheet %}`** inside the section (Phase 11 pattern). Tokens from `theme/assets/brand.css` (`--color-porcelain`, `--color-sand`, `--color-ink`, `--font-display`, `--spacing-*`). Stacked layout on small screens; result product cards in a column on mobile, row/grid from ~768px. Choice selected state: `.is-selected`. Honor `prefers-reduced-motion`.
8. **Do not** create or edit `theme/assets/ritual-builder.js` in 12A. **Do not** add a script tag for it in `theme.liquid` in 12A (12B owns JS + layout load).
9. **Do not** change `main-cart.liquid` unless you find it cannot display `Elora Ritual` (it already can).
10. **PowerShell: no `&&`.** Use `;` to chain.
11. **Do not** run `shopify theme push` / live `theme dev`. Prefer `validate.mjs`. If `shopify theme check` works locally, run it.
12. **No Liquid comments** (skill). HTML comments in the plan snippet may be omitted.
13. Wrap the section inner content in `page-width` like other custom sections. Heading uses display font via existing `h2` tokens.

## Split

- **12A (this dispatch):** Liquid section + schema + locales + homepage insert + section CSS. Static markup for 3 steps + hidden result. JSON product payload. No JS behavior.
- **12B (later):** `theme/assets/ritual-builder.js` + load from `theme.liquid`. Steps, tag filter, fallback 3, Ajax `/cart/add.js` with `properties: { 'Elora Ritual': '...' }`, restart. Escape injected HTML (no raw `innerHTML` of titles). Init every `[data-ritual-builder]`.

---

# Task 12A — Builder section (Liquid + CSS + wiring)

## Files

```
theme/sections/soft-ritual-builder.liquid   # create
theme/locales/en.default.json               # add builder.* keys
theme/templates/index.json                  # insert builder after hero
```

## Markup contract (12B depends on this — do not rename)

Section root:

- class `ritual-builder`
- `id="ritual-builder-{{ section.id }}"`
- `data-ritual-builder`
- `data-section-id="{{ section.id }}"`

Inside:

- Header: `h2` from `section.settings.heading` (default locale/schema: `Build your soft ritual`); optional subheading paragraph if not blank.
- `div.ritual-builder__steps` with `data-steps`
- Three `.ritual-builder__step` nodes with `data-step="1|2|3"`. Steps 2 and 3 have the `hidden` attribute. Step 1 does not.
- Each step: `.ritual-builder__step-label` + `.ritual-builder__choices` of `button.ritual-builder__choice[data-filter="..."]`
- Result: `.ritual-builder__result[data-result][hidden]` containing `.ritual-builder__result-products[data-result-products]` (empty), `button.btn.btn--primary.ritual-builder__add[data-add-ritual]`, `button.ritual-builder__restart[data-restart]`
- JSON: `<script type="application/json" data-builder-products>` with an array of objects:

```json
{
  "id": <number>,
  "title": <string>,
  "handle": <string>,
  "image": <string>,
  "price": <string>,
  "variantId": <number|null>,
  "tags": <string[]>
}
```

Limit the product loop reasonably (e.g. `limit: 50`) so the JSON stays valid.

Schema (match plan):

- name: Soft Ritual Builder
- settings: heading (default `Build your soft ritual`), subheading, collection (`Builder product collection`)
- presets: `[{ "name": "Soft Ritual Builder" }]`

`index.json` builder entry:

```json
"builder": {
  "type": "soft-ritual-builder",
  "settings": {
    "heading": "Build your soft ritual"
  }
}
```

Keep existing hero/editorial/ingredients/scent/featured settings. New order: `["hero", "builder", "editorial", "ingredients", "scent", "featured"]`.

Locale keys (add under `builder`): heading default, subheading optional unused is fine, step labels, all choice labels, result label `Your soft ritual`, add `Add ritual to bag`, restart `Start over`. Keep the visible copy from the plan.

## 12A done when

- `soft-ritual-builder.liquid` exists with schema presets so it appears as a draggable theme-editor section
- Homepage JSON includes builder after hero; 11B sections still present
- Three steps visible in markup (2–3 + result `hidden`)
- JSON script is `[]` when no collection; valid JSON array when products exist (guards for image/variant)
- Section CSS: stacked on mobile; choice buttons; result card layout ready for 12B
- `validate.mjs` on every file you created or changed (document leftover validator noise)

## Out of scope for 12A

- `ritual-builder.js`
- `theme.liquid` script tag
- Ajax cart
- Filtering logic
- Editing cart section
- Commits

---

# Task 12B — Builder JS + layout load

Depends on 12A markup contract.

## Files

```
theme/assets/ritual-builder.js     # create (plan IIFE, adapted)
theme/layout/theme.liquid          # defer-load ritual-builder.js after theme.js
```

Load like `theme.js`: `<script src="{{ 'ritual-builder.js' | asset_url }}" defer></script>` (not `script_tag` — theme-check parser-blocking).

## Behavior (plan, with required adaptations)

Start from the plan IIFE in IMPLEMENTATION_PLAN.md Phase 12. Adapt:

1. **Init every** `[data-ritual-builder]` section (not a single `getElementById('ritual-builder')`). Parse JSON from `section.querySelector('[data-builder-products]')`. If missing/invalid, `productsData = []`.
2. Click on `[data-filter]` pushes `dataset.filter`, adds `.is-selected`, advances step. After step 3, show result.
3. `filterProducts`: product must include **every** selected filter tag (`concern:…`, `moment:…`, `scent:…`). Take first 3. If zero matches, fallback `productsData.slice(0, 3)`.
4. **Do not** assign `innerHTML` with raw `p.title` / `p.image`. Build nodes with `textContent` / `setAttribute`, or HTML-escape. Empty/missing image: omit `<img>` or use a placeholder class, do not set `src=""`.
5. **Add ritual to bag:** POST `/cart/add.js` JSON `{ items: [...] }` where each item is `{ id: variantId, quantity: 1, properties: { 'Elora Ritual': ritualName } }`. `ritualName` = selected filter values joined with ` · ` (e.g. `glow · am · clean`). Skip products with null/missing `variantId`. If no addable items, show error and re-enable the button.
6. Button copy: Adding... / Added! / Error — try again (locale strings if you pass them via `data-*` on the section; otherwise the plan’s English is acceptable for JS-updated strings). On success, `btn.disabled = true`, then redirect `/cart` after 800ms. On error, re-enable.
7. Restart restores step 1, clears filters, hides result, removes `.is-selected`.
8. Do not attach if the section is absent.

`node --check theme/assets/ritual-builder.js` must pass.

## 12B done when

- 3 steps with selections
- Result shows up to 3 relevant products (or fallback 3)
- Add ritual posts all addable items with `properties: { Elora Ritual: "..." }`
- Restart works
- Layout loads the asset with defer
- Cart display of the property remains 11A’s job (already implemented)
- validate.mjs on changed files; `node --check` on the JS

## Out of scope for 12B

- Rewriting 12A markup unless a selector is broken
- Commits
- IMPLEMENTATION_PLAN.md
- Live theme push

---

## Reports

12A → `k:\Elora\.superpowers\sdd\task-12a-report.md`  
12B → `k:\Elora\.superpowers\sdd\task-12b-report.md`

Include: files created/changed, validation commands + output, leftover Liquid risks, concerns.

Then return under 15 lines: Status, commits (none), one-line verify summary, report path.
