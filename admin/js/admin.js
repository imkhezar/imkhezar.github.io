(function () {
  'use strict';

  var API = '/api';
  var TOKEN_KEY = 'adminToken';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function authHeaders() {
    var t = getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  var loginView = document.getElementById('loginView');
  var dashboardView = document.getElementById('dashboardView');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var logoutBtn = document.getElementById('logoutBtn');

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loadServices();
    loadPortfolio();
  }
  function showLogin(message) {
    clearToken();
    dashboardView.hidden = true;
    loginView.hidden = false;
    loginError.textContent = message || '';
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var password = document.getElementById('password').value;
    loginError.textContent = '';

    fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          loginError.textContent = res.data.error || 'Login failed';
          return;
        }
        setToken(res.data.token);
        showDashboard();
      })
      .catch(function () { loginError.textContent = 'Network error — try again.'; });
  });

  logoutBtn.addEventListener('click', function () { showLogin(''); });

  // Check for an existing valid session on page load.
  if (getToken()) {
    fetch(API + '/services?all=true', { headers: authHeaders() }).then(function (r) {
      if (r.ok) { showDashboard(); } else { showLogin(''); }
    }).catch(function () { showLogin(''); });
  }

  /* -----------------------------------------------------
     Tabs
  ----------------------------------------------------- */
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      document.getElementById('panel-services').hidden = tab.dataset.tab !== 'services';
      document.getElementById('panel-portfolio').hidden = tab.dataset.tab !== 'portfolio';
    });
  });

  /* -----------------------------------------------------
     SERVICES
  ----------------------------------------------------- */
  var serviceForm = document.getElementById('serviceForm');
  var serviceStatus = document.getElementById('serviceStatus');
  var serviceFormTitle = document.getElementById('serviceFormTitle');
  var serviceCancelBtn = document.getElementById('serviceCancelBtn');
  var priceTypeSelect = document.getElementById('servicePriceType');
  var priceLabelRow = document.getElementById('priceLabelRow');

  priceTypeSelect.addEventListener('change', function () {
    priceLabelRow.hidden = priceTypeSelect.value !== 'fixed';
  });

  function loadServices() {
    fetch(API + '/services?all=true', { headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(renderServiceList)
      .catch(function () {});
  }

  function renderServiceList(items) {
    var list = document.getElementById('servicesList');
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<p class="admin-empty">No services yet — add one below.</p>';
      return;
    }
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML =
        '<div class="admin-row__main">' +
          '<div class="admin-row__title">' + escapeHtml(item.title) + '</div>' +
          '<div class="admin-row__meta">' + escapeHtml(item.category) + ' · ' +
            (item.price_type === 'fixed' ? escapeHtml(item.price_label || '') : 'Get quote') + '</div>' +
        '</div>' +
        '<span class="admin-row__badge' + (item.is_published ? ' admin-row__badge--published' : '') + '">' +
          (item.is_published ? 'Published' : 'Hidden') + '</span>' +
        '<div class="admin-row__actions">' +
          '<button data-action="edit">Edit</button>' +
          '<button data-action="delete" class="is-danger">Delete</button>' +
        '</div>';

      row.querySelector('[data-action="edit"]').addEventListener('click', function () { editService(item); });
      row.querySelector('[data-action="delete"]').addEventListener('click', function () { deleteService(item.id); });
      list.appendChild(row);
    });
  }

  function editService(item) {
    document.getElementById('serviceId').value = item.id;
    document.getElementById('serviceCategory').value = item.category;
    document.getElementById('serviceDelivery').value = item.delivery_time || '';
    document.getElementById('serviceTitle').value = item.title;
    document.getElementById('serviceDesc').value = item.description;
    priceTypeSelect.value = item.price_type;
    priceLabelRow.hidden = item.price_type !== 'fixed';
    document.getElementById('servicePriceLabel').value = item.price_label || '';
    document.getElementById('serviceDetails').value = (item.details || []).join('\n');
    document.getElementById('serviceSortOrder-published').checked = !!item.is_published;
    serviceFormTitle.textContent = 'Edit service';
    serviceCancelBtn.hidden = false;
    serviceForm.scrollIntoView({ behavior: 'smooth' });
  }

  function resetServiceForm() {
    serviceForm.reset();
    document.getElementById('serviceId').value = '';
    priceLabelRow.hidden = true;
    serviceFormTitle.textContent = 'Add a service';
    serviceCancelBtn.hidden = true;
  }
  serviceCancelBtn.addEventListener('click', resetServiceForm);

  serviceForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('serviceId').value;
    var payload = {
      category: document.getElementById('serviceCategory').value,
      delivery_time: document.getElementById('serviceDelivery').value,
      title: document.getElementById('serviceTitle').value,
      description: document.getElementById('serviceDesc').value,
      price_type: priceTypeSelect.value,
      price_label: document.getElementById('servicePriceLabel').value,
      details: document.getElementById('serviceDetails').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      is_published: document.getElementById('serviceSortOrder-published').checked,
    };
    if (id) payload.id = Number(id);

    fetch(API + '/services', {
      method: id ? 'PUT' : 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) { serviceStatus.textContent = res.data.error || 'Save failed'; return; }
        serviceStatus.textContent = 'Saved.';
        resetServiceForm();
        loadServices();
      })
      .catch(function () { serviceStatus.textContent = 'Network error — try again.'; });
  });

  function deleteService(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    fetch(API + '/services?id=' + id, { method: 'DELETE', headers: authHeaders() })
      .then(function () { loadServices(); });
  }

  /* -----------------------------------------------------
     PORTFOLIO
  ----------------------------------------------------- */
  var portfolioForm = document.getElementById('portfolioForm');
  var portfolioStatus = document.getElementById('portfolioStatus');
  var portfolioFormTitle = document.getElementById('portfolioFormTitle');
  var portfolioCancelBtn = document.getElementById('portfolioCancelBtn');

  function loadPortfolio() {
    fetch(API + '/portfolio?all=true', { headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(renderPortfolioList)
      .catch(function () {});
  }

  function renderPortfolioList(items) {
    var list = document.getElementById('portfolioList');
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<p class="admin-empty">No portfolio items yet — add one below.</p>';
      return;
    }
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML =
        '<div class="admin-row__main">' +
          '<div class="admin-row__title">' + escapeHtml(item.title) + '</div>' +
          '<div class="admin-row__meta">' + escapeHtml(item.image_url) + '</div>' +
        '</div>' +
        '<span class="admin-row__badge' + (item.is_published ? ' admin-row__badge--published' : '') + '">' +
          (item.is_published ? 'Published' : 'Hidden') + '</span>' +
        '<div class="admin-row__actions">' +
          '<button data-action="edit">Edit</button>' +
          '<button data-action="delete" class="is-danger">Delete</button>' +
        '</div>';

      row.querySelector('[data-action="edit"]').addEventListener('click', function () { editPortfolio(item); });
      row.querySelector('[data-action="delete"]').addEventListener('click', function () { deletePortfolio(item.id); });
      list.appendChild(row);
    });
  }

  function editPortfolio(item) {
    document.getElementById('portfolioId').value = item.id;
    document.getElementById('portfolioTitle').value = item.title;
    document.getElementById('portfolioCaption').value = item.caption;
    document.getElementById('portfolioImage').value = item.image_url;
    document.getElementById('portfolioPublished').checked = !!item.is_published;
    portfolioFormTitle.textContent = 'Edit portfolio item';
    portfolioCancelBtn.hidden = false;
    portfolioForm.scrollIntoView({ behavior: 'smooth' });
  }

  function resetPortfolioForm() {
    portfolioForm.reset();
    document.getElementById('portfolioId').value = '';
    portfolioFormTitle.textContent = 'Add a portfolio item';
    portfolioCancelBtn.hidden = true;
  }
  portfolioCancelBtn.addEventListener('click', resetPortfolioForm);

  portfolioForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('portfolioId').value;
    var payload = {
      title: document.getElementById('portfolioTitle').value,
      caption: document.getElementById('portfolioCaption').value,
      image_url: document.getElementById('portfolioImage').value,
      is_published: document.getElementById('portfolioPublished').checked,
    };
    if (id) payload.id = Number(id);

    fetch(API + '/portfolio', {
      method: id ? 'PUT' : 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) { portfolioStatus.textContent = res.data.error || 'Save failed'; return; }
        portfolioStatus.textContent = 'Saved.';
        resetPortfolioForm();
        loadPortfolio();
      })
      .catch(function () { portfolioStatus.textContent = 'Network error — try again.'; });
  });

  function deletePortfolio(id) {
    if (!confirm('Delete this portfolio item? This cannot be undone.')) return;
    fetch(API + '/portfolio?id=' + id, { method: 'DELETE', headers: authHeaders() })
      .then(function () { loadPortfolio(); });
  }

  /* -----------------------------------------------------
     Utility
  ----------------------------------------------------- */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
})();