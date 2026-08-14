# Task 1 Report: Storage helpers (TDD)

## What was implemented

Pure localStorage list helpers for the recently-viewed storefront feature, exposed as `globalThis.EloraRecentlyViewed`:

| Export | Value / behavior |
|--------|------------------|
| `KEY` | `'elora:recently-viewed'` |
| `MAX` | `4` |
| `upsert(list, item)` | Prepends item, dedupes by `handle`, caps at `MAX`; returns a new array (no mutation) |
| `forDisplay(list, excludeHandle)` | Filters out the current product handle |
| `readList(storage)` | Reads/parses JSON from storage; returns `[]` on missing/invalid data |
| `writeList(storage, list)` | Serializes list to storage; swallows quota/private-mode errors |

Implementation is an IIFE attaching to `globalThis` (or `this` fallback), suitable for Shopify theme asset loading in Task 2+.

## What was tested and test results

Five Node test-runner tests in `theme/assets/recently-viewed.test.mjs`:

1. **upsert puts the item first and unique by handle** — re-inserting `a` moves it to front; `b` remains.
2. **upsert caps at MAX 4** — five inserts yield `['e','d','c','b']`.
3. **forDisplay excludes the current handle** — `'a'` excluded from `['a','b','c']`.
4. **readList returns [] for corrupt JSON** — malformed string does not throw.
5. **writeList no-throws when setItem throws** — quota error swallowed.

**GREEN result:** `5 passed`, `0 failed` (Node v22.17.0).

## TDD Evidence

### RED (before implementation)

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'K:\\Elora\\theme\\assets\\recently-viewed.js'
...
# tests 1
# pass 0
# fail 1
```

### GREEN (after implementation)

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

```
ok 1 - upsert puts the item first and unique by handle
ok 2 - upsert caps at MAX 4
ok 3 - forDisplay excludes the current handle
ok 4 - readList returns [] for corrupt JSON
ok 5 - writeList no-throws when setItem throws
# tests 5
# pass 5
# fail 0
```

## Files changed

| File | Action |
|------|--------|
| `theme/assets/recently-viewed.js` | Created |
| `theme/assets/recently-viewed.test.mjs` | Created |

Commit: `b2c2560` — `feat: add recently viewed storage helpers`

## Self-review findings

- **Completeness:** Matches brief verbatim — constants, all five functions, exact test file content, no DOM/card/init code.
- **Quality:** Immutability preserved (`list.slice()`, new arrays from `upsert`/`filter`). Invalid items guarded in `upsert` and `forDisplay`.
- **YAGNI:** No extra exports, no round-trip read/write tests beyond corrupt JSON and quota failure (sufficient for Task 1 scope).
- **TDD:** Tests written first; RED confirmed (module not found); implementation added; GREEN confirmed (5/5).
- **Scope:** Only the two specified files committed; no `app/**`, Liquid, or docs staged.

## Issues or concerns

- None blocking. `readList` does not validate individual item shape (not required in Task 1; Task 2 may normalize on write).
- `.superpowers/sdd/task-1-brief.md` shows as modified in the working tree but was intentionally left unstaged per instructions.
