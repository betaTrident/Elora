# Recently Viewed Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the last four viewed Elora products in `localStorage` (keyed by handle) and render them as existing `product-card` markup on the product page and home, with no Shopify Ajax/Admin API.

**Architecture:** Liquid cannot `{% render 'product-card' %}` from `localStorage` handles — that snippet needs a product drop at request time, and fetching `/products/{handle}.js` would be a Shopify API. On each PDP view, Liquid writes a JSON **snapshot** of the current product (handle, url, title, subtitle, image, price). Vanilla JS upserts that snapshot into `localStorage` (max 4, most recent first, unique by handle) and paints cards with the same BEM classes as `theme/snippets/product-card.liquid`. A dedicated OS 2.0 section (not the existing “You'll love these” related grid inside `main-product.liquid`) provides the heading, empty grid, and (on product templates) the snapshot script tag. Pure list helpers are unit-tested with Node’s test runner so theme JS stays small and safe.

**Tech Stack:** Shopify OS 2.0 Liquid JSON templates, `theme.js`-style IIFE, `localStorage` + `JSON.stringify`/`JSON.parse` (MDN), existing `.product-card` / `.product-grid` CSS, `en.default.json` (`t` filter), Node `node:test`.

## Global Constraints

- Storefront copy only via `{{ 'key' | t }}` ([Shopify locale `t` filter](https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files)); locale keys at most **three** levels (e.g. `products.recently_viewed`).
- Do **not** call `/products/{handle}.js`, Section Rendering API, Storefront API, or Admin API.
- Cap **4** snapshots; identity is `handle`; most recent first; skip the product currently on the PDP when rendering.
- DOM: `document.createElement` + `textContent` for title/subtitle/price (no `innerHTML` for stored strings). Image `src` only from the snapshot written by Liquid `image_url`.
- `localStorage` may throw (`QuotaExceededError`, private mode): wrap get/set in try/catch; fail closed (hide the section). Persist arrays with `JSON.stringify` / `JSON.parse` ([MDN Storage.setItem](https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem)); never store a raw object.
- PowerShell: never chain with `&&`; never use `$home` as a variable.
- Theme Liquid: implementer must `search_docs.mjs` then `validate.mjs` on new/changed Liquid (shopify-liquid skill).
- Do not edit RitualScore `app/**`. Do not restyle the whole catalog grid.
- User-facing heading: **Recently viewed**.

## File map

| File | Responsibility |
|------|----------------|
| `theme/assets/recently-viewed.js` | Pure list helpers + record/render; `globalThis.EloraRecentlyViewed` |
| `theme/assets/recently-viewed.test.mjs` | Node tests for upsert, cap, exclude-current, corrupt JSON |
| `theme/sections/recently-viewed.liquid` | Section chrome, `product-grid`, optional snapshot JSON, schema `enabled_on` product + index |
| `theme/templates/product.json` | Mount section after `main` |
| `theme/templates/index.json` | Mount section after `featured` |
| `theme/layout/theme.liquid` | Defer-load `recently-viewed.js` |
| `theme/locales/en.default.json` | `products.recently_viewed` |
| `theme/assets/base.css` | Section spacing/heading only (reuse `.product-grid`) |

---

### Task 1: Storage helpers (TDD)

**Files:**
- Create: `theme/assets/recently-viewed.js`
- Create: `theme/assets/recently-viewed.test.mjs`

**Interfaces:**
- Consumes: none
- Produces: `EloraRecentlyViewed.MAX === 4`, `KEY === 'elora:recently-viewed'`, `upsert(list, item)`, `forDisplay(list, excludeHandle)`, `readList(storage)`, `writeList(storage, list)`

Snapshot item shape (all strings; empty string allowed for subtitle/image):

```js
{
  handle: 'glow-drops-serum',
  url: '/products/glow-drops-serum',
  title: 'Glow Drops Serum',
  subtitle: 'Niacinamide + Kakadu Plum',
  image: 'https://cdn.shopify.com/example.jpg',
  price: '$52.00'
}
```

- [ ] **Step 1: Write the failing tests**

Create `theme/assets/recently-viewed.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
await import(pathToFileURL(path.join(dir, 'recently-viewed.js')).href)
const RV = globalThis.EloraRecentlyViewed

function item(handle) {
  return {
    handle,
    url: '/products/' + handle,
    title: handle,
    subtitle: '',
    image: '',
    price: '$1.00',
  }
}

test('upsert puts the item first and unique by handle', () => {
  const a = RV.upsert([], item('a'))
  const b = RV.upsert(a, item('b'))
  const aAgain = RV.upsert(b, item('a'))
  assert.deepEqual(aAgain.map((row) => row.handle), ['a', 'b'])
})

test('upsert caps at MAX 4', () => {
  let list = []
  ;['a', 'b', 'c', 'd', 'e'].forEach((handle) => {
    list = RV.upsert(list, item(handle))
  })
  assert.equal(list.length, 4)
  assert.deepEqual(list.map((row) => row.handle), ['e', 'd', 'c', 'b'])
})

test('forDisplay excludes the current handle', () => {
  const list = [item('a'), item('b'), item('c')]
  const shown = RV.forDisplay(list, 'a')
  assert.deepEqual(shown.map((row) => row.handle), ['b', 'c'])
})

test('readList returns [] for corrupt JSON', () => {
  const storage = {
    getItem() {
      return '{not json'
    },
  }
  assert.deepEqual(RV.readList(storage), [])
})

test('writeList no-throws when setItem throws', () => {
  const storage = {
    setItem() {
      throw new Error('quota')
    },
  }
  assert.doesNotThrow(() => RV.writeList(storage, [item('a')]))
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

Expected: FAIL (`EloraRecentlyViewed` undefined or functions missing).

- [ ] **Step 3: Minimal implementation**

Create `theme/assets/recently-viewed.js`:

```js
(function (root) {
  var KEY = 'elora:recently-viewed'
  var MAX = 4

  function upsert(list, item) {
    if (!item || typeof item.handle !== 'string' || !item.handle) return list.slice()
    var next = [item].concat(list.filter(function (row) {
      return row && row.handle !== item.handle
    }))
    return next.slice(0, MAX)
  }

  function forDisplay(list, excludeHandle) {
    return list.filter(function (row) {
      return row && row.handle && row.handle !== excludeHandle
    })
  }

  function readList(storage) {
    if (!storage || typeof storage.getItem !== 'function') return []
    try {
      var raw = storage.getItem(KEY)
      if (!raw) return []
      var parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      return []
    }
  }

  function writeList(storage, list) {
    if (!storage || typeof storage.setItem !== 'function') return
    try {
      storage.setItem(KEY, JSON.stringify(list))
    } catch (err) {
      /* private mode / quota — fail closed */
    }
  }

  root.EloraRecentlyViewed = {
    KEY: KEY,
    MAX: MAX,
    upsert: upsert,
    forDisplay: forDisplay,
    readList: readList,
    writeList: writeList,
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
```

- [ ] **Step 4: Run tests — expect PASS**

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```
Set-Location k:\Elora
git add theme/assets/recently-viewed.js theme/assets/recently-viewed.test.mjs
git commit -m "feat: add recently viewed storage helpers"
```

---

### Task 2: Card DOM matching `product-card`

**Files:**
- Modify: `theme/assets/recently-viewed.js`
- Modify: `theme/assets/recently-viewed.test.mjs`

**Interfaces:**
- Consumes: Task 1 helpers
- Produces: `buildCard(item)` → `HTMLElement` (`article.product-card`); `render(container, items)` fills a `<ul>` with `<li>` children

Markup must match `theme/snippets/product-card.liquid`:

```html
<article class="product-card">
  <a class="product-card__link" href="...">
    <div class="product-card__image-wrap">
      <img class="product-card__image" src="..." alt="..." loading="lazy" width="800" height="800">
    </div>
    <div class="product-card__body">
      <h3 class="product-card__title">...</h3>
      <p class="product-card__subtitle">...</p> <!-- omit if subtitle empty -->
      <p class="product-card__price">...</p>
    </div>
  </a>
</article>
```

If `image` is empty, omit the `<img>` (wrap still present). Never set `innerHTML` from snapshot fields.

- [ ] **Step 1: Write failing tests**

Append to `theme/assets/recently-viewed.test.mjs` (jsdom is **not** required if `buildCard` is skipped in Node). Instead test a `cardHtml` helper that returns a plain object tree, OR use Node 22 + linkedom. Fast path: add `cardModel(item)` that returns `{ href, title, subtitle, price, image, alt }` and `render` uses it.

Prefer testing `cardModel` + that `render` uses `createElement` when `document` exists.

Add:

```js
test('cardModel maps snapshot fields', () => {
  const model = RV.cardModel({
    handle: 'glow-drops-serum',
    url: '/products/glow-drops-serum',
    title: 'Glow Drops Serum',
    subtitle: 'Niacinamide',
    image: 'https://cdn.example/x.jpg',
    price: '$52.00',
  })
  assert.equal(model.href, '/products/glow-drops-serum')
  assert.equal(model.title, 'Glow Drops Serum')
  assert.equal(model.subtitle, 'Niacinamide')
  assert.equal(model.image, 'https://cdn.example/x.jpg')
  assert.equal(model.price, '$52.00')
  assert.equal(model.alt, 'Glow Drops Serum')
})

test('cardModel omits blank subtitle', () => {
  const model = RV.cardModel(item('a'))
  assert.equal(model.subtitle, '')
})
```

- [ ] **Step 2: Run — expect FAIL** (`cardModel` missing)

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

- [ ] **Step 3: Implement `cardModel` and `mount`**

Add to `recently-viewed.js` inside the IIFE, then export on `EloraRecentlyViewed`:

```js
  function cardModel(item) {
    var title = item && item.title ? String(item.title) : ''
    return {
      href: item && item.url ? String(item.url) : '#',
      title: title,
      subtitle: item && item.subtitle ? String(item.subtitle) : '',
      image: item && item.image ? String(item.image) : '',
      price: item && item.price ? String(item.price) : '',
      alt: title,
    }
  }

  function buildCard(doc, item) {
    var model = cardModel(item)
    var article = doc.createElement('article')
    article.className = 'product-card'
    var link = doc.createElement('a')
    link.className = 'product-card__link'
    link.setAttribute('href', model.href)
    var wrap = doc.createElement('div')
    wrap.className = 'product-card__image-wrap'
    if (model.image) {
      var img = doc.createElement('img')
      img.className = 'product-card__image'
      img.setAttribute('src', model.image)
      img.setAttribute('alt', model.alt)
      img.setAttribute('loading', 'lazy')
      img.setAttribute('width', '800')
      img.setAttribute('height', '800')
      wrap.appendChild(img)
    }
    var body = doc.createElement('div')
    body.className = 'product-card__body'
    var h3 = doc.createElement('h3')
    h3.className = 'product-card__title'
    h3.textContent = model.title
    body.appendChild(h3)
    if (model.subtitle) {
      var sub = doc.createElement('p')
      sub.className = 'product-card__subtitle'
      sub.textContent = model.subtitle
      body.appendChild(sub)
    }
    var price = doc.createElement('p')
    price.className = 'product-card__price'
    price.textContent = model.price
    body.appendChild(price)
    link.appendChild(wrap)
    link.appendChild(body)
    article.appendChild(link)
    return article
  }

  function render(container, items) {
    if (!container) return
    container.replaceChildren()
    var doc = container.ownerDocument
    items.forEach(function (row) {
      var li = doc.createElement('li')
      li.appendChild(buildCard(doc, row))
      container.appendChild(li)
    })
  }

  function init(doc, storage) {
    if (!doc) return
    var root = doc.querySelector('[data-recently-viewed]')
    if (!root) return
    var listEl = root.querySelector('[data-recently-viewed-list]')
    var exclude = root.getAttribute('data-exclude-handle') || ''
    var recordEl = root.querySelector('[data-recently-viewed-record]')
    var list = readList(storage || root.defaultView.localStorage)
    if (recordEl && recordEl.textContent) {
      try {
        var snapshot = JSON.parse(recordEl.textContent)
        list = upsert(list, snapshot)
        writeList(storage || root.defaultView.localStorage, list)
      } catch (err) {
        /* ignore bad snapshot */
      }
    }
    var shown = forDisplay(list, exclude)
    if (!shown.length) {
      root.setAttribute('hidden', '')
      return
    }
    root.removeAttribute('hidden')
    render(listEl, shown)
  }
```

Export `cardModel`, `buildCard`, `render`, `init`.

At file bottom, if `document` exists, run on `DOMContentLoaded` (script is `defer`, so DOM is ready — call `init(document)` immediately):

```js
  if (typeof document !== 'undefined') {
    init(document)
  }
```

- [ ] **Step 4: Run tests — expect PASS**

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

Expected: all tests pass (previous 5 + 2). `init(document)` in Node: `typeof document === 'undefined'` so no throw.

- [ ] **Step 5: Commit**

```
git add theme/assets/recently-viewed.js theme/assets/recently-viewed.test.mjs
git commit -m "feat: render recently viewed cards with product-card classes"
```

---

### Task 3: Liquid section + locale

**Files:**
- Create: `theme/sections/recently-viewed.liquid`
- Modify: `theme/locales/en.default.json` (`products` object — add `"recently_viewed": "Recently viewed"`)
- Modify: `theme/assets/base.css` (append section rules only)

**Interfaces:**
- Consumes: `data-recently-viewed`, `data-recently-viewed-list`, `data-exclude-handle`, `data-recently-viewed-record` from Task 2 `init`
- Produces: OS 2.0 section usable on product and index templates

Shopify theme JSON templates add sections by `type` matching the filename (`recently-viewed` → `theme/sections/recently-viewed.liquid`). Restrict with `enabled_on.templates`: `product`, `index` ([section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)).

Copy: `{{ 'products.recently_viewed' | t }}` ([`t` filter](https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files)).

Start the section **hidden** so first paint has no empty heading; JS removes `hidden` when there is at least one card.

On product pages only (`request.page_type == 'product'`), emit snapshot JSON. Use Liquid:

- `product.handle`
- `product.url`
- `product.title`
- `product.metafields.elora.subtitle.value` (same as product-card)
- `product.featured_image | image_url: width: 800` (empty if no image)
- `product.price | money` (same as `theme/snippets/product-card.liquid`)

- [ ] **Step 1: Locale**

In `theme/locales/en.default.json` inside `"products"` add:

```json
"recently_viewed": "Recently viewed"
```

- [ ] **Step 2: Section Liquid**

Create `theme/sections/recently-viewed.liquid`. Implementer: run shopify-liquid `search_docs.mjs` for `enabled_on` / `image_url` / `money` then `validate.mjs` on this file.

```liquid
{%- liquid
  assign exclude_handle = ''
  if request.page_type == 'product' and product != blank
    assign exclude_handle = product.handle
  endif
-%}
<section
  class="recently-viewed page-width"
  data-recently-viewed
  data-exclude-handle="{{ exclude_handle | escape }}"
  hidden
>
  <h2 class="recently-viewed__heading">{{ 'products.recently_viewed' | t }}</h2>
  <ul class="product-grid" role="list" data-recently-viewed-list></ul>
  {%- if request.page_type == 'product' and product != blank -%}
    <script type="application/json" data-recently-viewed-record>
      {
        "handle": {{ product.handle | json }},
        "url": {{ product.url | json }},
        "title": {{ product.title | json }},
        "subtitle": {{ product.metafields.elora.subtitle.value | json }},
        "image": {{ product.featured_image | image_url: width: 800 | json }},
        "price": {{ product.price | money | json }}
      }
    </script>
  {%- endif -%}
</section>

{% schema %}
{
  "name": "Recently viewed",
  "tag": "section",
  "class": "section-recently-viewed",
  "enabled_on": {
    "templates": ["product", "index"]
  },
  "settings": [],
  "presets": [
    {
      "name": "Recently viewed"
    }
  ]
}
{% endschema %}
```

Note: `| json` emits a quoted JSON value (including `null`). If subtitle is nil, `JSON.parse` may get `"subtitle": null` — `cardModel` already treats falsy subtitle as `''`. If `image_url` on blank image is empty string, that is fine.

If `| json` on a blank `featured_image` errors in Liquid, use:

```liquid
{%- if product.featured_image != blank -%}
  {%- assign recent_image = product.featured_image | image_url: width: 800 -%}
{%- else -%}
  {%- assign recent_image = '' -%}
{%- endif -%}
```

then `"image": {{ recent_image | json }}`.

- [ ] **Step 3: CSS** (append to `theme/assets/base.css`)

```css
.recently-viewed {
  padding-top: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
}

.recently-viewed__heading {
  margin: 0 0 var(--spacing-lg);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-ink);
}
```

- [ ] **Step 4: Validate Liquid**

From the shopify-liquid skill directory, `validate.mjs` on `theme/sections/recently-viewed.liquid` until VALID.

- [ ] **Step 5: Commit**

```
git add theme/sections/recently-viewed.liquid theme/locales/en.default.json theme/assets/base.css
git commit -m "feat: add recently viewed theme section"
```

---

### Task 4: Mount on product + home and load JS

**Files:**
- Modify: `theme/templates/product.json`
- Modify: `theme/templates/index.json`
- Modify: `theme/layout/theme.liquid`

JSON templates list sections in `order` ([OS 2.0 product.json](https://shopify.dev/docs/storefronts/themes/os20/migration.md)).

- [ ] **Step 1: `product.json`**

```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "settings": {}
    },
    "recently-viewed": {
      "type": "recently-viewed",
      "settings": {}
    }
  },
  "order": ["main", "recently-viewed"]
}
```

- [ ] **Step 2: `index.json`**

Inside `"sections"`, after the existing `"featured"` object, add:

```json
"recently-viewed": {
  "type": "recently-viewed",
  "settings": {}
}
```

Replace the `order` array with this exact list so home still leads with hero/builder and the new rail sits under the featured collection:

```json
"order": ["hero", "builder", "editorial", "ingredients", "scent", "featured", "recently-viewed"]
```

- [ ] **Step 3: `theme.liquid`**

Immediately after the existing `ritual-builder.js` script tag (`theme/layout/theme.liquid` around line 29):

```liquid
<script src="{{ 'recently-viewed.js' | asset_url }}" defer></script>
```

Do not fold this logic into `theme.js`. Keep `ritual-builder.js` as-is.

- [ ] **Step 4: Re-run unit tests**

```
Set-Location k:\Elora
node --test theme/assets/recently-viewed.test.mjs
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add theme/templates/product.json theme/templates/index.json theme/layout/theme.liquid
git commit -m "feat: show recently viewed on product and home"
```

---

### Task 5: Click-through QA

**Files:** none (verify only)

`theme dev` is already pointed at `elora-lg1vomev.myshopify.com`. Hard-refresh after sync.

- [ ] **Step 1: First product — section hidden**

Open PDP A (e.g. Glow Drops Serum). Recently viewed stays **hidden** (nothing else stored yet). DevTools → Application → Local Storage → `elora:recently-viewed` is a JSON array of length 1 with that handle.

- [ ] **Step 2: Second product — one card**

Open PDP B (Nourishing Cleanser). Section **visible**, heading **Recently viewed**, **one** card for Glow Drops (not Cleanser). Card looks like collection cards (image, title, price). Click returns to Glow Drops.

- [ ] **Step 3: Cap at 4**

Visit 5 distinct PDPs. Storage length is **4**; newest first; oldest dropped. Current PDP is never in the grid.

- [ ] **Step 4: Home**

Open `/`. Same up-to-4 cards (no exclude). Section hidden if storage empty (incognito).

- [ ] **Step 5: Resilience**

Set the key to `{bad`. Reload PDP: no JS exception in console; section hidden or recovers after a valid view.

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Last 3–4 handles (cap 4, unique, recent first) | 1 |
| No Shopify Ajax/API | 1–4 (snapshots only) |
| Visual reuse of product-card | 2 |
| Product page | 3–4 |
| Home | 4 |
| Copy via `t`, ≤3 locale levels | 3 |
| localStorage JSON + quota/private mode | 1 (`readList`/`writeList`) |
| XSS-safe DOM | 2 |
| Theme JSON mount | 4 |
| Manual QA | 5 |

## Placeholder scan

No TBD/TODO. `cardModel` / `upsert` / `init` names are consistent across tasks.

## Type consistency

Snapshot fields: `handle`, `url`, `title`, `subtitle`, `image`, `price` — same in Liquid JSON, `upsert`, `cardModel`.

## Sources (Context7)

- Shopify OS 2.0 JSON templates: add a sibling section and list it in `order` ([product.json migration](https://shopify.dev/docs/storefronts/themes/os20/migration.md)).
- Section `enabled_on.templates`: `["product", "index"]` ([section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)).
- Copy: `{{ 'products.recently_viewed' | t }}` ([storefront locale files](https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files)).
- Persistence: `localStorage.setItem(key, JSON.stringify(list))` / `JSON.parse(localStorage.getItem(key))`; catch `QuotaExceededError` ([MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)).
