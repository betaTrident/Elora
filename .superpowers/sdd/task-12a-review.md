### Spec Compliance

- ✅ Spec compliant: 12A Liquid/CSS/schema/homepage only. Markup contract, verbatim `data-filter` values, `type="button"`, collection-object JSON with nil guards and `limit: 50`, schema/preset `"Soft Ritual Builder"`, `builder.*` locales, homepage insert and order `["hero", "builder", "editorial", "ingredients", "scent", "featured"]`, `{% stylesheet %}` + `page-width`, no `ritual-builder.js` / no `theme.liquid` script tag. Prior Important finding is fixed in the current diff: `.ritual-builder__result:not([hidden])` at `theme/sections/soft-ritual-builder.liquid:166-170` no longer sets `display` while the `hidden` attribute is present (`:49`). Steps 2–3 stay attribute-hidden (`:30`, `:39`) with no `display` on `.ritual-builder__step`.
- ⚠️ Cannot verify from diff: cart line-item **Elora Ritual** label (`main-cart.liquid` unchanged; 12A did not edit it). Visual stacked layout on a real phone (CSS is column-first; not device-tested here). Implementer `validate.mjs` revision 2 / `shopify theme check` runs (not re-executed).

### Strengths

- Prior `hidden` override is actually gone in this tree, not just claimed: `theme/sections/soft-ritual-builder.liquid:166` is `.ritual-builder__result:not([hidden]) { display: flex; ... }`. Inner `.ritual-builder__result-products { display: flex }` (`:172-176`) does not unhide the parent. Theme CSS has no `[hidden]` / `display` restore that would reintroduce the bug. No `ritual-builder.js` in the repo.
- 12B markup contract is complete: unique `id="ritual-builder-{{ section.id }}"`, `data-ritual-builder`, `data-section-id`, JSON in `<script type="application/json" data-builder-products>` (`:3-7`, `:57-73`).
- Collection setting treated as an object (`:1`, `:59-60`). Blank collection emits `[]`; `image_url` only when `featured_image != blank` else `""` (`:65`); `variantId` is `null` when no `first_available_variant` (`:67`).
- Choice `data-filter` values are exactly the mandated set (`:23-26`, `:33-35`, `:42-45`). All choice/add/restart controls are `type="button"` (`:23-26`, `:33-35`, `:42-45`, `:52-53`). Add uses `.btn.btn--primary`.
- Homepage wiring matches the brief (`theme/templates/index.json:12-17`, `:133`): builder after hero; 11B sections left in place (diff is +builder block and order only).
- Locale copy matches the plan (`theme/locales/en.default.json:53-70`): step labels, choice labels including “Barrier repair” / “After shower”, `Your soft ritual`, `Add ritual to bag`, `Start over`. Two-level snake_case keys.
- CSS uses existing brand tokens, stacks choices on small screens, switches result cards to a row at 768px (`theme/sections/soft-ritual-builder.liquid:119-130`, `:172-183`), and defines `.is-selected` (`:155-159`) plus 12B-ready `.ritual-builder__product-card` rules. Scope stayed in 12A (no JS, no cart, no layout script).

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- None. Previous Important (`.ritual-builder__result { display: flex }` defeating `hidden` at `:166-173`) is resolved by `:not([hidden])` at `:166-170`.

#### Minor (Nice to Have)

- **Incomplete `prefers-reduced-motion`.** `theme/sections/soft-ritual-builder.liquid:145` always sets choice `transition`; `:148-153` only gates choice hover. Restart still transitions and restyles on hover with no reduced-motion guard (`:233`, `:236-238`). Honor reduce by disabling those transitions as well.
- **Reported `shopify theme check` is not pristine.** Implementer output: 3 RemoteAsset warnings in `theme.liquid` (Google Fonts). Pre-existing; 12A did not touch that file. Not a 12A code defect; the recorded run is still noisy.
- **Heading typography is duplicated on the section class** (`theme/sections/soft-ritual-builder.liquid:12`, `:88-95`) instead of relying only on existing `h2` / `--font-display` tokens. Harmless; slightly extra.

### Assessment

**Task quality:** Approved

**Reasoning:** The only prior blocker is present and correct in the current diff (`:not([hidden])` on the result, steps 2–3 still CSS-clean). The rest of the 12A contract — markup hooks, JSON guards, schema, locales, homepage order, and 12A-only scope — already matched the brief.
