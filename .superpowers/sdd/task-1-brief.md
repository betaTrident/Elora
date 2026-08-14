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

- [ ] **Step 2: Run tests â€” expect FAIL**

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
      /* private mode / quota â€” fail closed */
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

- [ ] **Step 4: Run tests â€” expect PASS**

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

