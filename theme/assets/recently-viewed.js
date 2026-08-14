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
