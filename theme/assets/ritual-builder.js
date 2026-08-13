(function () {
  var sections = document.querySelectorAll('[data-ritual-builder]');
  if (!sections.length) return;

  sections.forEach(function (section) {
    initRitualBuilder(section);
  });

  function initRitualBuilder(section) {
    var productsData = [];
    var jsonEl = section.querySelector('[data-builder-products]');

    if (jsonEl) {
      try {
        var parsed = JSON.parse(jsonEl.textContent);
        productsData = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        productsData = [];
      }
    }

    var selectedFilters = [];
    var selectedLabels = [];
    var currentStep = 1;
    var matchedProducts = [];
    var advancing = false;
    var advancingTimeout = null;
    var addGeneration = 0;
    var addRedirectTimeout = null;
    var addAbortController = null;
    var addBtn = section.querySelector('[data-add-ritual]');
    var addBtnDefaultText = addBtn ? addBtn.textContent : '';

    section.addEventListener('click', function (event) {
      var choice = event.target.closest('[data-filter]');
      var addButton = event.target.closest('[data-add-ritual]');
      var restart = event.target.closest('[data-restart]');

      if (choice && choice.closest('[data-ritual-builder]') === section) {
        if (advancing) return;

        var stepEl = choice.closest('[data-step]');
        if (
          !stepEl ||
          stepEl.hidden ||
          stepEl.dataset.step !== String(currentStep)
        ) {
          return;
        }

        selectedFilters.push(choice.dataset.filter);
        if (choice.dataset.choiceLabel) {
          selectedLabels.push(choice.dataset.choiceLabel);
        }
        choice.classList.add('is-selected');
        nextStep();
      }

      if (addButton && addButton.closest('[data-ritual-builder]') === section) {
        addRitualToCart();
      }

      if (restart && restart.closest('[data-ritual-builder]') === section) {
        resetBuilder();
      }
    });

    function nextStep() {
      if (advancing) return;
      advancing = true;

      currentStep += 1;
      var steps = section.querySelectorAll('[data-step]');

      steps.forEach(function (stepEl) {
        stepEl.hidden = parseInt(stepEl.dataset.step, 10) !== currentStep;
      });

      if (currentStep > steps.length) {
        showResult();
      }

      if (advancingTimeout) {
        clearTimeout(advancingTimeout);
      }
      advancingTimeout = setTimeout(function () {
        advancing = false;
        advancingTimeout = null;
      }, 400);
    }

    function clearResultProducts(productsEl) {
      if (!productsEl) return;
      while (productsEl.firstChild) {
        productsEl.removeChild(productsEl.firstChild);
      }
    }

    function filterProducts() {
      var matched = productsData.filter(function (product) {
        var tags = product.tags || [];
        return selectedFilters.every(function (filter) {
          return tags.indexOf(filter) !== -1;
        });
      });

      if (matched.length === 0) {
        matched = productsData.slice();
      }

      var seen = {};
      var padded = [];
      matched.forEach(function (product) {
        if (padded.length >= 3) return;
        if (!product || product.id == null) return;
        seen[product.id] = true;
        padded.push(product);
      });
      productsData.forEach(function (product) {
        if (padded.length >= 3) return;
        if (!product || product.id == null || seen[product.id]) return;
        seen[product.id] = true;
        padded.push(product);
      });
      return padded.slice(0, 3);
    }

    function productHref(product) {
      if (product.url) return product.url;
      if (product.handle) return '/products/' + product.handle;
      return '#';
    }

    function createProductCard(product) {
      var card = document.createElement('article');
      card.className = 'ritual-builder__product-card';

      var link = document.createElement('a');
      link.className = 'ritual-builder__product-link';
      link.href = productHref(product);

      if (product.image) {
        var media = document.createElement('div');
        media.className = 'ritual-builder__product-media';
        var img = document.createElement('img');
        img.src = product.image;
        img.alt = product.title || '';
        img.loading = 'lazy';
        img.width = 280;
        img.height = 373;
        media.appendChild(img);
        link.appendChild(media);
      }

      var title = document.createElement('h3');
      title.textContent = product.title || '';
      link.appendChild(title);

      if (product.subtitle) {
        var subtitle = document.createElement('p');
        subtitle.className = 'ritual-builder__product-subtitle';
        subtitle.textContent = product.subtitle;
        link.appendChild(subtitle);
      }

      var price = document.createElement('small');
      price.textContent = product.price || '';
      link.appendChild(price);

      card.appendChild(link);
      return card;
    }

    function showResult() {
      matchedProducts = filterProducts();

      var resultEl = section.querySelector('[data-result]');
      var productsEl = section.querySelector('[data-result-products]');
      var summaryEl = section.querySelector('[data-result-summary]');

      clearResultProducts(productsEl);

      matchedProducts.forEach(function (product) {
        productsEl.appendChild(createProductCard(product));
      });

      if (summaryEl) {
        summaryEl.textContent = selectedLabels.join(' · ');
      }

      section.querySelectorAll('[data-step]').forEach(function (stepEl) {
        stepEl.hidden = true;
      });

      resultEl.hidden = false;
    }

    function addRitualToCart() {
      if (!addBtn) return;

      var ritualName = selectedFilters
        .map(function (filter) {
          return filter.split(':')[1];
        })
        .join(' · ');

      var items = matchedProducts
        .filter(function (product) {
          return product.variantId != null && product.variantId !== '';
        })
        .map(function (product) {
          return {
            id: product.variantId,
            quantity: 1,
            properties: { 'Elora Ritual': ritualName },
          };
        });

      if (items.length === 0) {
        addBtn.textContent = 'Error — try again';
        addBtn.disabled = false;
        return;
      }

      addGeneration += 1;
      var requestGeneration = addGeneration;

      if (addAbortController) {
        addAbortController.abort();
      }
      addAbortController = new AbortController();

      if (addRedirectTimeout) {
        clearTimeout(addRedirectTimeout);
        addRedirectTimeout = null;
      }

      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items }),
        signal: addAbortController.signal,
      })
        .then(function (response) {
          if (requestGeneration !== addGeneration) return;
          if (!response.ok) throw new Error('Cart add failed');
          addBtn.textContent = 'Added!';
          addRedirectTimeout = setTimeout(function () {
            if (requestGeneration !== addGeneration) return;
            window.location.href = '/cart';
          }, 800);
        })
        .catch(function (err) {
          if (requestGeneration !== addGeneration) return;
          if (err && err.name === 'AbortError') return;
          addBtn.textContent = 'Error — try again';
          addBtn.disabled = false;
        });
    }

    function resetBuilder() {
      addGeneration += 1;

      if (addAbortController) {
        addAbortController.abort();
        addAbortController = null;
      }

      if (addRedirectTimeout) {
        clearTimeout(addRedirectTimeout);
        addRedirectTimeout = null;
      }

      if (advancingTimeout) {
        clearTimeout(advancingTimeout);
        advancingTimeout = null;
      }

      selectedFilters = [];
      selectedLabels = [];
      currentStep = 1;
      matchedProducts = [];
      advancing = false;

      section.querySelectorAll('[data-step]').forEach(function (stepEl) {
        stepEl.hidden = parseInt(stepEl.dataset.step, 10) !== 1;
      });

      var resultEl = section.querySelector('[data-result]');
      if (resultEl) resultEl.hidden = true;

      section.querySelectorAll('.is-selected').forEach(function (el) {
        el.classList.remove('is-selected');
      });

      if (addBtn) {
        addBtn.disabled = false;
        addBtn.textContent = addBtnDefaultText;
      }

      var productsEl = section.querySelector('[data-result-products]');
      if (productsEl) clearResultProducts(productsEl);

      var summaryEl = section.querySelector('[data-result-summary]');
      if (summaryEl) summaryEl.textContent = '';
    }
  }
})();
