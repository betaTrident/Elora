# Task 2 Report: Card DOM matching product-card

## Summary

Added `cardModel`, `buildCard`, `render`, and `init` to `theme/assets/recently-viewed.js`, exported on `globalThis.EloraRecentlyViewed`. Two new Node tests cover `cardModel` field mapping and blank subtitle handling. Task 1 helpers and tests remain unchanged and passing.

## Changes

### `theme/assets/recently-viewed.js`

- **`cardModel(item)`** — Maps snapshot `{ handle, url, title, subtitle, image, price }` to `{ href, title, subtitle, image, price, alt }` with safe string coercion and empty defaults.
- **`buildCard(doc, item)`** — Builds `article.product-card` DOM via `createElement` + `textContent` / `setAttribute`; omits `<img>` when image is empty; omits subtitle `<p>` when subtitle is empty. Matches `theme/snippets/product-card.liquid` structure.
- **`render(container, items)`** — Clears container with `replaceChildren()`, appends `<li>` children each containing a built card.
- **`init(doc, storage)`** — Finds `[data-recently-viewed]`, reads/upserts from `[data-recently-viewed-record]`, filters with `forDisplay`, hides root when empty, otherwise renders into `[data-recently-viewed-list]`.
- **Auto-init** — `if (typeof document !== 'undefined') { init(document) }` so Node tests do not throw.

### `theme/assets/recently-viewed.test.mjs`

- `cardModel maps snapshot fields` — Asserts href, title, subtitle, image, price, alt.
- `cardModel omits blank subtitle` — Asserts empty subtitle string from minimal item fixture.

## TDD Evidence

### RED (Step 2 — before implementation)

Command: `node --test theme/assets/recently-viewed.test.mjs`

```
# pass 5
# fail 2
not ok 6 - cardModel maps snapshot fields
  error: 'RV.cardModel is not a function'
not ok 7 - cardModel omits blank subtitle
  error: 'RV.cardModel is not a function'
```

### GREEN (Step 4 — after implementation)

Command: `node --test theme/assets/recently-viewed.test.mjs`

```
# tests 7
# pass 7
# fail 0
ok 1 - upsert puts the item first and unique by handle
ok 2 - upsert caps at MAX 4
ok 3 - forDisplay excludes the current handle
ok 4 - readList returns [] for corrupt JSON
ok 5 - writeList no-throws when setItem throws
ok 6 - cardModel maps snapshot fields
ok 7 - cardModel omits blank subtitle
```

## Self-review

| Requirement | Status |
|-------------|--------|
| Task 1 helpers unchanged | OK — original 5 tests pass |
| Export cardModel, buildCard, render, init | OK |
| init guarded for Node (`typeof document`) | OK |
| No innerHTML for stored strings | OK — createElement + textContent/setAttribute only |
| Markup matches product-card.liquid | OK — same class names and conditional subtitle/image |
| No Liquid / template edits | OK |
| Commit only two theme files | OK |

## Concerns

None. `buildCard` / `render` / `init` are not covered by Node DOM tests (by design per brief); Task 3–4 will wire Liquid markup and browser verification.

## Commit

`feat: render recently viewed cards with product-card classes`

---

## Review fix (Important findings)

### Changes

**`theme/assets/recently-viewed.js` — `init`**

- Resolve storage in `try/catch`; on throw (e.g. private browsing `localStorage`), set `hidden` on root and return.
- Reuse `resolvedStorage` for `readList` / `writeList`.
- Only `removeAttribute('hidden')` when `[data-recently-viewed-list]` exists **and** `shown.length > 0`; otherwise set `hidden` and return.

**`theme/assets/recently-viewed.test.mjs`**

- `makeInitDoc` helper for minimal DOM mocks.
- `init keeps section hidden when list element is missing` — items in storage but no list container stays hidden.
- `init fails closed when localStorage access throws` — no throw; section stays hidden.

### Tests

Command: `node --test theme/assets/recently-viewed.test.mjs`

```
TAP version 13
# Subtest: upsert puts the item first and unique by handle
ok 1 - upsert puts the item first and unique by handle
  ---
  duration_ms: 1.4518
  type: 'test'
  ...
# Subtest: upsert caps at MAX 4
ok 2 - upsert caps at MAX 4
  ---
  duration_ms: 0.2234
  type: 'test'
  ...
# Subtest: forDisplay excludes the current handle
ok 3 - forDisplay excludes the current handle
  ---
  duration_ms: 0.1648
  type: 'test'
  ...
# Subtest: readList returns [] for corrupt JSON
ok 4 - readList returns [] for corrupt JSON
  ---
  duration_ms: 0.2148
  type: 'test'
  ...
# Subtest: writeList no-throws when setItem throws
ok 5 - writeList no-throws when setItem throws
  ---
  duration_ms: 0.2598
  type: 'test'
  ...
# Subtest: cardModel maps snapshot fields
ok 6 - cardModel maps snapshot fields
  ---
  duration_ms: 0.1536
  type: 'test'
  ...
# Subtest: cardModel omits blank subtitle
ok 7 - cardModel omits blank subtitle
  ---
  duration_ms: 0.1644
  type: 'test'
  ...
# Subtest: init keeps section hidden when list element is missing
ok 8 - init keeps section hidden when list element is missing
  ---
  duration_ms: 0.3433
  type: 'test'
  ...
# Subtest: init fails closed when localStorage access throws
ok 9 - init fails closed when localStorage access throws
  ---
  duration_ms: 0.4533
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 101.4154
```

### Commit

`fix: fail closed when recently viewed list or storage missing` (`3fe2524`)
