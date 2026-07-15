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
  ----------------------------------------------------- */
  document.querySelectorAll('.gig__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
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
  });

})();