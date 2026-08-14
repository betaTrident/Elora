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

function makeInitDoc(options) {
  const opts = options || {}
  let doc
  const defaultListEl = {
    replaceChildren() {},
    get ownerDocument() {
      return doc
    },
  }
  const root = {
    attributes: {},
    children: [],
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value)
    },
    removeAttribute(name) {
      delete this.attributes[name]
    },
    querySelector(selector) {
      if (selector === '[data-recently-viewed-list]') {
        return opts.listEl === undefined ? defaultListEl : opts.listEl
      }
      if (selector === '[data-recently-viewed-record]') {
        return opts.recordEl || null
      }
      return null
    },
    defaultView: {
      get localStorage() {
        if (opts.localStorageThrows) {
          throw new Error('localStorage unavailable')
        }
        return opts.storage || { getItem() { return null }, setItem() {} }
      },
    },
  }
  doc = {
    querySelector(selector) {
      if (selector === '[data-recently-viewed]') return root
      return null
    },
  }
  return { doc, root }
}

test('init keeps section hidden when list element is missing', () => {
  const { doc, root } = makeInitDoc({ listEl: null })
  const storage = {
    getItem() {
      return JSON.stringify([item('a'), item('b')])
    },
    setItem() {},
  }
  RV.init(doc, storage)
  assert.equal(root.getAttribute('hidden'), '')
})

test('init fails closed when localStorage access throws', () => {
  const { doc, root } = makeInitDoc({ localStorageThrows: true })
  assert.doesNotThrow(() => RV.init(doc))
  assert.equal(root.getAttribute('hidden'), '')
})
