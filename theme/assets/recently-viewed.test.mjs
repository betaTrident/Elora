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
