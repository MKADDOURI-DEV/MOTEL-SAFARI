// Charge les chambres depuis Supabase. Si config vide / erreur / aucune chambre => le HTML statique reste affiché.
(function () {
  var cfg = window.SAFARI_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
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
  function priceLabel(p) {
    return p == null || p === '' ? 'À confirmer / nuit' : 'À partir de ' + Number(p) + ' MAD / nuit';
  }
  function card(r) {
    var thumbs = (r.images || []).slice(0, 3).map(function (u) {
      return '<img src="' + esc(u) + '" alt="Autre vue de la chambre" loading="lazy" onclick="swapImg(this)">';
    }).join('');
    var feats = (r.features || []).map(function (f) {
      return '<li><i class="fas ' + icon(f) + '"></i> ' + esc(f) + '</li>';
    }).join('');
    return '<div class="col-md-6 col-lg-4"><div class="room-card">' +
      (r.image_url ? '<img class="room-main-img" src="' + esc(r.image_url) + '" alt="' + esc(r.name) + ' du Motel Safari Budget à Ouarzazate" loading="lazy">' : '') +
      (thumbs ? '<div class="room-thumbs">' + thumbs + '</div>' : '') +
      '<div class="room-card-body"><h3>' + esc(r.name) + '</h3>' +
      '<p class="room-price">' + esc(priceLabel(r.price)) + '</p>' +
      (r.description ? '<p style="font-size:.85rem;color:#666;margin:8px 0 0;">' + esc(r.description) + '</p>' : '') +
      (feats ? '<ul class="room-features">' + feats + '</ul>' : '') +
      '</div></div></div>';
  }

  var rows = document.querySelectorAll('#chambres .container > .row');
  var target = rows[1];
  if (!target) return;

  fetch(cfg.url + '/rest/v1/rooms?visible=eq.true&order=sort_order.asc,created_at.asc&select=*', {
    headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey }
  })
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      target.innerHTML = list.map(card).join('');
    })
    .catch(function () { /* on garde le HTML statique */ });
})();
