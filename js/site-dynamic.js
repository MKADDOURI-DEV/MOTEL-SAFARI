// Contenu éditable depuis /admin (Supabase). Si config vide / erreur / table vide => le HTML statique reste affiché.
(function () {
  var cfg = window.SAFARI_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  var H = { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey };

  function get(path) {
    return fetch(cfg.url + '/rest/v1/' + path, { headers: H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // **gras** et retours à la ligne
  function fmt(v, flat) {
    var h = esc(v).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return flat ? h.replace(/\s*\n\s*/g, ', ') : h.replace(/\n/g, '<br>');
  }
  function intl(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = '212' + d.slice(1);
    return d;
  }
  function hrefFor(type, v) {
    v = String(v).trim();
    if (type === 'tel') return 'tel:+' + intl(v);
    if (type === 'wa') return 'https://wa.me/' + intl(v);
    if (type === 'mailto') return 'mailto:' + v;
    if (type === 'ig') return 'https://www.instagram.com/' + v.replace(/^@/, '');
    return null;
  }

  // ---------- Textes + infos établissement ----------
  get('site_content?select=key,value').then(function (rows) {
    rows.forEach(function (r) {
      if (!/^[a-z0-9_]+$/.test(r.key) || r.value == null || r.value === '') return;
      document.querySelectorAll('[data-content="' + r.key + '"]').forEach(function (el) {
        el.innerHTML = fmt(r.value, el.hasAttribute('data-flat'));
      });
      document.querySelectorAll('[data-href-key="' + r.key + '"]').forEach(function (a) {
        var h = hrefFor(a.getAttribute('data-href-type'), r.value);
        if (h) a.setAttribute('href', h);
      });
    });
  });

  // ---------- Chambres ----------
  function icon(text) {
    var t = text.toLowerCase();
    if (/wi-?fi/.test(t)) return 'fa-wifi';
    if (/clim|air/.test(t)) return 'fa-snowflake';
    if (/lit|bed/.test(t)) return 'fa-bed';
    if (/tv|télé|tele/.test(t)) return 'fa-tv';
    if (/douche|bain|shower/.test(t)) return 'fa-shower';
    if (/parking/.test(t)) return 'fa-parking';
    return 'fa-check';
  }
  function roomCard(r) {
    var price = r.price == null || r.price === '' ? 'À confirmer / nuit' : 'À partir de ' + Number(r.price) + ' MAD / nuit';
    var thumbs = (r.images || []).slice(0, 3).map(function (u) {
      return '<img src="' + esc(u) + '" alt="Autre vue de la chambre" loading="lazy" onclick="swapImg(this)">';
    }).join('');
    var feats = (r.features || []).map(function (f) {
      return '<li><i class="fas ' + icon(f) + '"></i> ' + esc(f) + '</li>';
    }).join('');
    return '<div class="col-md-6 col-lg-4"><div class="room-card">' +
      (r.image_url ? '<img class="room-main-img" src="' + esc(r.image_url) + '" alt="' + esc(r.name) + ' du Motel Safari Budget à Ouarzazate" loading="lazy">' : '') +
      (thumbs ? '<div class="room-thumbs">' + thumbs + '</div>' : '') +
      '<div class="room-card-body"><h3>' + esc(r.name) + '</h3><p class="room-price">' + esc(price) + '</p>' +
      (r.description ? '<p style="font-size:.85rem;color:#666;margin:8px 0 0;">' + esc(r.description) + '</p>' : '') +
      (feats ? '<ul class="room-features">' + feats + '</ul>' : '') +
      '</div></div></div>';
  }
  var roomRows = document.querySelectorAll('#chambres .container > .row');
  if (roomRows[1]) {
    get('rooms?visible=eq.true&order=sort_order.asc,created_at.asc&select=*').then(function (list) {
      if (Array.isArray(list) && list.length) roomRows[1].innerHTML = list.map(roomCard).join('');
    });
  }

  // ---------- Galerie ----------
  var grid = document.querySelector('#galerie .gallery-grid');
  if (grid) {
    get('gallery?order=sort_order.asc,created_at.asc&select=image_url,alt').then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      grid.innerHTML = list.map(function (g, i) {
        return '<div class="g-item" onclick="openLb(' + i + ')"><img src="' + esc(g.image_url) + '" alt="' +
          esc(g.alt || ('Photo ' + (i + 1) + ' — Motel Safari Budget, Ouarzazate')) + '" loading="lazy" decoding="async"></div>';
      }).join('');
      // met à jour la visionneuse (variables globales de index.html)
      window.lbImages = list.map(function (g) { return g.image_url; });
      window.total = window.lbImages.length;
      var c = document.getElementById('galCount');
      if (c) c.textContent = list.length + ' photos — cliquez pour agrandir';
    });
  }
})();
