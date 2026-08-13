(function () {
  /* ── Mobile nav toggle ─────────────────────────────── */
  var mobileToggle = document.querySelector('[data-mobile-toggle]');
  if (mobileToggle) {
    var sectionHeader = mobileToggle.closest('.section-header, .shopify-section');
    var hamburgerIcon = mobileToggle.querySelector('.header__hamburger-icon');
    var closeIcon = mobileToggle.querySelector('.header__close-icon');

    mobileToggle.addEventListener('click', function () {
      var isOpen = sectionHeader && sectionHeader.classList.contains('menu-open');
      if (sectionHeader) sectionHeader.classList.toggle('menu-open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      mobileToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
      if (hamburgerIcon) hamburgerIcon.style.display = isOpen ? '' : 'none';
      if (closeIcon) closeIcon.style.display = isOpen ? 'none' : '';
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (sectionHeader && sectionHeader.classList.contains('menu-open') && !sectionHeader.contains(e.target)) {
        sectionHeader.classList.remove('menu-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-label', 'Open menu');
        if (hamburgerIcon) hamburgerIcon.style.display = '';
        if (closeIcon) closeIcon.style.display = 'none';
      }
    });
  }

  /* ── Skip link ─────────────────────────────────────── */
  var skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', function (event) {
      var href = skipLink.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.setAttribute('tabindex', '-1');
      target.focus();
    });
  }

  /* ── Cart quantity auto-submit ─────────────────────── */
  var cartForm = document.querySelector('.cart-form');
  if (cartForm) {
    cartForm.querySelectorAll('[data-cart-quantity]').forEach(function (input) {
      input.addEventListener('change', function () {
        cartForm.submit();
      });
    });
  }

  document.querySelectorAll('[data-sort-dropdown]').forEach(function (dropdown) {
    var trigger = dropdown.querySelector('summary');

    document.addEventListener('click', function (event) {
      if (dropdown.hasAttribute('open') && !dropdown.contains(event.target)) {
        dropdown.removeAttribute('open');
      }
    });

    dropdown.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && dropdown.hasAttribute('open')) {
        dropdown.removeAttribute('open');
        if (trigger) trigger.focus();
      }
    });
  });

  /* ── Scroll reveal ─────────────────────────────────── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    if (!prefersReduced && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
      );

      revealEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
          el.classList.add('is-visible');
        } else {
          revealObserver.observe(el);
        }
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* ── Product thumbnail switcher ────────────────────── */
  var thumbs = document.querySelectorAll('.product__thumb');
  var mainImage = document.querySelector('[id^="ProductMainImage-"]') || document.querySelector('.product__image');

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var src = thumb.getAttribute('data-thumb-src');
      if (src && mainImage) {
        mainImage.src = src;
      }
      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
    });
  });

  /* ── Variant pill selection ────────────────────────── */
  document.querySelectorAll('.variant-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      var inputSelector = pill.getAttribute('data-variant-input');
      var variantId = pill.getAttribute('data-variant-id');
      if (inputSelector && variantId) {
        var input = document.querySelector(inputSelector);
        if (input) input.value = variantId;
      }
      var price = pill.getAttribute('data-variant-price');
      var priceEl = document.querySelector('[data-product-price]');
      if (price && priceEl) priceEl.textContent = price;
      var pills = pill.closest('.variant-pills');
      if (pills) {
        pills.querySelectorAll('.variant-pill').forEach(function (p) {
          p.classList.remove('is-active');
        });
      }
      pill.classList.add('is-active');
    });
  });

  /* ── Quantity stepper ──────────────────────────────── */
  document.querySelectorAll('.qty-stepper').forEach(function (stepper) {
    var valEl = stepper.querySelector('.qty-stepper__val');
    var hiddenInput = stepper.querySelector('.qty-stepper__input') ||
      (stepper.parentElement ? stepper.parentElement.querySelector('.qty-stepper__input') : null);

    function getVal() {
      return parseInt(valEl.textContent, 10) || 1;
    }

    function setVal(n) {
      var min = 1;
      if (hiddenInput && hiddenInput.getAttribute('min') !== null) {
        min = parseInt(hiddenInput.getAttribute('min'), 10);
        if (isNaN(min)) min = 1;
      }
      var next = Math.max(min, n);
      valEl.textContent = next;
      if (hiddenInput) hiddenInput.value = next;
      if (hiddenInput && hiddenInput.hasAttribute('data-cart-quantity') && cartForm) {
        cartForm.submit();
      }
    }

    stepper.querySelectorAll('.qty-stepper__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-qty-action');
        if (action === 'plus') {
          setVal(getVal() + 1);
        } else if (action === 'minus') {
          setVal(getVal() - 1);
        }
      });
    });
  });

  /* ── Accordion (details/summary enhancement) ───────── */
  document.querySelectorAll('.accordion__header').forEach(function (summary) {
    summary.addEventListener('click', function () {
      var details = summary.closest('details');
      if (!details) return;
      var icon = summary.querySelector('.accordion__icon');
      if (!icon) return;
      /* icon rotation handled by CSS details[open] selector */
    });
  });
})();
