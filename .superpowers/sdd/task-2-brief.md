### Task 2: Card DOM matching `product-card`

**Files:**
- Modify: `theme/assets/recently-viewed.js`
- Modify: `theme/assets/recently-viewed.test.mjs`

**Interfaces:**
- Consumes: Task 1 helpers
- Produces: `buildCard(item)` â†’ `HTMLElement` (`article.product-card`); `render(container, items)` fills a `<ul>` with `<li>` children

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

- [ ] **Step 2: Run â€” expect FAIL** (`cardModel` missing)

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

At file bottom, if `document` exists, run on `DOMContentLoaded` (script is `defer`, so DOM is ready â€” call `init(document)` immediately):

```js
  if (typeof document !== 'undefined') {
    init(document)
  }
```

- [ ] **Step 4: Run tests â€” expect PASS**

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

