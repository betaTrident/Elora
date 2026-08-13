# Task 12B Report — Soft Ritual Builder JS + layout load

## What was implemented

### `theme/assets/ritual-builder.js` (created)
- IIFE that exits early when no `[data-ritual-builder]` sections exist
- Initializes **every** builder section independently (multi-instance safe)
- Parses product JSON from `section.querySelector('[data-builder-products]')`; missing/invalid JSON → `[]`
- Step flow: click `[data-filter]` → push filter, add `.is-selected`, advance step via `hidden` on `[data-step]`
- After step 3, `showResult()` hides all steps and sets `resultEl.hidden = false` (compatible with 12A `:not([hidden])` CSS)
- `filterProducts`: product tags must include **every** selected filter string (`concern:glow`, etc.); takes first 3 matches
- Zero matches → fallback `productsData.slice(0, 3)`
- Result cards built with DOM APIs (`createElement`, `textContent`, `setAttribute`) — no raw `innerHTML` of titles/URLs; empty image omitted (no `src=""`)
- **Add ritual:** POST `/cart/add.js` with `{ items: [{ id, quantity: 1, properties: { 'Elora Ritual': ritualName } }] }`
- `ritualName` = filter value suffixes joined with ` · ` (e.g. `glow · am · clean`)
- Skips products with null/missing `variantId`; if no addable items, shows error and re-enables button
- Button states: Adding... / Added! / Error — try again (plan English); restores default label on restart
- Success: disable button, redirect `/cart` after 800ms
- Restart: step 1 visible, filters cleared, result hidden, `.is-selected` removed, product cards cleared, add button reset

### `theme/layout/theme.liquid` (updated)
- Added deferred script load after `theme.js`:
  `{{ 'ritual-builder.js' | asset_url }}` (not `script_tag`, per brief)

## What was tested

### `node --check`
```text
node --check k:\Elora\theme\assets\ritual-builder.js
```
**Result:** Exit code 0 (syntax OK).

### `validate.mjs`
```text
node scripts/validate.mjs --theme-path k:\Elora\theme --files layout/theme.liquid --model composer-2.5 --client-name cursor --client-version 1.0.0 --artifact-id elora-p12b --revision 1
```
**Result:** ❌ INVALID — 3 pre-existing `RemoteAsset` offenses on Google Fonts links (lines 8–10), unchanged from 12A. No offenses on the new `ritual-builder.js` script tag (line 22).

## Files changed

| File | Action |
|------|--------|
| `theme/assets/ritual-builder.js` | Created |
| `theme/layout/theme.liquid` | Updated (defer script tag) |

## Self-review findings

- **XSS:** Product title, price, image URL, and alt text use DOM APIs only; no string interpolation into `innerHTML`.
- **Multi-instance:** Each section has isolated state; click handlers scoped to `section` via `closest('[data-ritual-builder]') === section`.
- **12A contract:** All selectors unchanged; uses `hidden` property for steps/result as required.
- **Cart property:** Uses exact key `'Elora Ritual'` matching `main-cart.liquid` (not edited).
- **Variant guard:** Filters out null/empty `variantId` before cart POST.
- **Style match:** Uses `var` and IIFE pattern consistent with `theme.js`.
- **Button copy:** English plan strings used; locale keys for Adding/Added/Error not added (brief allows this).

## Issues or concerns

1. **Empty collection** — With `[]` product data (no collection assigned in theme editor), result shows no cards and add-to-cart shows error. Expected until merchant configures collection + product tags.
2. **Tag matching** — Products must carry exact tag strings (`concern:glow`, `moment:am`, `scent:clean`, etc.) for filtered results; untagged products only appear via fallback slice.
3. **validate.mjs noise** — Google Fonts RemoteAsset warnings in `theme.liquid` pre-date this task; not introduced by 12B.
4. **No browser E2E** — Logic verified via syntax check and code review; live Ajax cart flow not exercised in this environment.

## Out of scope (confirmed not done)

- 12A markup/locale/template changes
- Commits
- `IMPLEMENTATION_PLAN.md` / `app/**`
- `main-cart.liquid` edits
- Live theme push

## Whole-phase fix pass

### What changed (`theme/assets/ritual-builder.js`)

1. **Double-click / click-through guard**
   - Ignore `[data-filter]` clicks unless the choice sits inside the currently visible `[data-step]` (`dataset.step === String(currentStep)` and step is not `hidden`).
   - Added `advancing` re-entrancy lock around `nextStep()` / `showResult()`; released on the next animation frame. Click handler bails when `advancing` is true.
   - `resetBuilder()` clears `advancing` so restart is never stuck.

2. **Restart during in-flight add**
   - `addGeneration` token invalidates stale fetch callbacks.
   - `AbortController` aborts the in-flight `/cart/add.js` POST on restart or a new add.
   - `addRedirectTimeout` cleared on restart; redirect and `Added!` only apply when `requestGeneration === addGeneration`.
   - Aborted requests do not surface error UI; `resetBuilder()` re-enables Add after discarding in-flight work.

No Liquid/CSS changes; filter semantics, `'Elora Ritual'`, fallback-to-3, DOM-safe cards, and 12A markup contract unchanged.

### Covering test files

- None (no automated unit tests for this asset; syntax check only).

### Command run

```text
node --check k:\Elora\theme\assets\ritual-builder.js
```

### Output

```text
Exit code: 0 (syntax OK)
```

## Fix pass 2 (double-click lock)

### What changed (`theme/assets/ritual-builder.js`)

- Replaced `requestAnimationFrame` lock release (~16ms) with `setTimeout` held for **400ms** — covers the real double-click window after the next step paints.
- Added `advancingTimeout` on the section instance; cleared before scheduling a new lock and on `resetBuilder()`.
- `if (advancing) return` in the click handler still ignores all `[data-filter]` clicks while locked, including clicks on the newly visible step.
- Current-step membership guard unchanged (`stepEl.dataset.step === String(currentStep)` and not `hidden`).
- No CSS `pointer-events` supplement needed; JS lock alone blocks stray clicks for 400ms.

### Command run

```text
node --check k:\Elora\theme\assets\ritual-builder.js
```

### Output

```text
Exit code: 0 (syntax OK)
```
