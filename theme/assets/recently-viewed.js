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

  root.EloraRecentlyViewed = {
    KEY: KEY,
    MAX: MAX,
    upsert: upsert,
    forDisplay: forDisplay,
    readList: readList,
    writeList: writeList,
    cardModel: cardModel,
    buildCard: buildCard,
    render: render,
    init: init,
  }

  if (typeof document !== 'undefined') {
    init(document)
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
