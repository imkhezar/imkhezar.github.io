(function () {
  'use strict';

  /* -----------------------------------------------------
     Mobile nav toggle
  ----------------------------------------------------- */
  var header = document.querySelector('.header');
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primary-nav');

  if (navToggle && header) {
    navToggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -----------------------------------------------------
     Contact / audit request form (front-end only placeholder)
     Replace this with a real submit handler — e.g. POST to
     Formspree, Netlify Forms, or your own API endpoint.
  ----------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        status.textContent = 'Please fill in the required fields before sending.';
        status.style.color = 'var(--coral-dark)';
        return;
      }

      // TODO: replace with an actual request to your backend or
      // form service. Example using fetch to Formspree:
      //
      // fetch('https://formspree.io/f/your-id', {
      //   method: 'POST',
      //   headers: { 'Accept': 'application/json' },
      //   body: new FormData(form)
      // });

      status.textContent = 'Request sent — I will reply with your audit within 1-2 business days.';
      status.style.color = 'var(--brand)';
      form.reset();
    });
  }

  /* -----------------------------------------------------
     Active nav link highlighting on scroll
  ----------------------------------------------------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.header__nav a');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.getAttribute('id');
          var link = document.querySelector(
            '.header__nav a[href="#' + id + '"]'
          );
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.style.color = '';
              l.style.fontWeight = '';
            });
            link.style.color = 'var(--ink)';
            link.style.fontWeight = '600';
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
  /* -----------------------------------------------------
     Gig card "Show more / Show less" toggles (services.html)
     Uses event delegation since cards are loaded from the API
     after the page renders — a direct querySelectorAll binding
     wouldn't reach cards that don't exist yet at load time.
  ----------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.gig__toggle');
    if (!btn) return;

    var gig = btn.closest('.gig');
    var details = gig ? gig.querySelector('.gig__details') : null;
    if (!details) return;

    var isHidden = details.hasAttribute('hidden');
    if (isHidden) {
      details.removeAttribute('hidden');
      btn.textContent = 'Show less';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      details.setAttribute('hidden', '');
      btn.textContent = 'Show more';
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  /* -----------------------------------------------------
     Load services from the API (services.html)
  ----------------------------------------------------- */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function renderGigCard(item) {
    var priceHtml = item.price_type === 'fixed'
      ? '<span class="gig__price">' + escapeHtml(item.price_label || '') + '</span>'
      : '<a href="index.html#contact" class="gig__quote">Get quote</a>';

    var detailsHtml = (item.details || [])
      .map(function (d) { return '<li>' + escapeHtml(d) + '</li>'; })
      .join('');

    return (
      '<article class="gig">' +
        '<div class="gig__head">' +
          '<span class="gig__category">' + escapeHtml(item.category) + '</span>' +
          priceHtml +
        '</div>' +
        '<h3 class="gig__title">' + escapeHtml(item.title) + '</h3>' +
        '<p class="gig__desc">' + escapeHtml(item.description) + '</p>' +
        (item.delivery_time
          ? '<div class="gig__meta"><span>⏱ ' + escapeHtml(item.delivery_time) + '</span></div>'
          : '') +
        '<div class="gig__details" hidden><ul>' + detailsHtml + '</ul></div>' +
        '<button class="gig__toggle" type="button" aria-expanded="false">Show more</button>' +
      '</article>'
    );
  }

  var gigGrid = document.getElementById('gigGrid');
  if (gigGrid) {
    fetch('/api/services')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        if (!items.length) {
          gigGrid.innerHTML = '<p class="section__sub">No services published yet.</p>';
          return;
        }
        gigGrid.innerHTML = items.map(renderGigCard).join('');
        gigGrid.setAttribute('data-state', 'loaded');
      })
      .catch(function () {
        gigGrid.innerHTML = '<p class="section__sub">Unable to load services right now — please try again shortly.</p>';
      });
  }

  /* -----------------------------------------------------
     Load portfolio items from the API (index.html)
  ----------------------------------------------------- */
  function renderPortfolioItem(item) {
    return (
      '<figure class="portfolio-item">' +
        '<div class="portfolio-item__visual">' +
          '<img src="' + escapeHtml(item.image_url) + '" alt="' + escapeHtml(item.title) + ' thumbnail" loading="lazy">' +
        '</div>' +
        '<figcaption>' + escapeHtml(item.caption) + '</figcaption>' +
      '</figure>'
    );
  }

  var portfolioGrid = document.getElementById('portfolioGrid');
  if (portfolioGrid) {
    fetch('/api/portfolio')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        if (!items.length) {
          portfolioGrid.innerHTML = '<p class="section__sub">No portfolio items published yet.</p>';
          return;
        }
        portfolioGrid.innerHTML = items.map(renderPortfolioItem).join('');
        portfolioGrid.setAttribute('data-state', 'loaded');
      })
      .catch(function () {
        portfolioGrid.innerHTML = '<p class="section__sub">Unable to load portfolio right now — please try again shortly.</p>';
      });
  }

})();