/* Fruit Farmer: groves and filters. Each planted tree is a grove holding a set amount of fruit.
   Catching takes fruit out; groves refill over days of play (a day ends when you come back from market).
   Tapping a grove on the map opens its card: how much is on the tree, a filter to apply, and Go.
   Filters are single-use: only that fruit goes into your basket for one round. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let open = null, chosen = null;

  const tree = type => D.trees.find(t => t.type === type);
  const holds = type => { const t = tree(type); return t.holds + Math.floor(FF.level() * t.perLevel); };
  // Bring a grove up to date with the days that have passed, then return what's on the tree.
  function stock(type) {
    const s = FF.save, g = s.groves[type] || (s.groves[type] = { stock: holds(type), day: s.day });
    if (s.day > g.day) { g.stock = Math.min(holds(type), g.stock + Math.ceil((s.day - g.day) * holds(type) / tree(type).refill)); g.day = s.day; }
    return Math.min(g.stock, holds(type));
  }
  const take = type => { if (!tree(type)) return; stock(type); FF.save.groves[type].stock = Math.max(0, FF.save.groves[type].stock - 1); };
  const filtersAllowed = () => FF.save.challenge !== 'nomagnet';

  function render() {
    const s = FF.save, n = stock(open), f = D.fruits[open];
    $('groveTitle').textContent = tree(open).name.replace(' tree', ' grove');
    $('groveStock').textContent = n ? `${n} ${f.name.toLowerCase()} on the tree. Some fruit from nearby trees falls too.` : `The grove is bare. It refills in ${tree(open).refill === 1 ? 'a day' : tree(open).refill + ' days'}.`;
    const owned = FF.FRUIT_TYPES.filter(t => (s.filters[t] || 0) > 0);
    $('groveFilterSec').hidden = !filtersAllowed();
    $('groveFilters').innerHTML = [null, ...owned].map(t => {
      const on = chosen === t;
      return `<button class="pick${on ? ' on' : ''}" type="button" data-filter="${t || ''}" aria-pressed="${on}">${t ? '' : '<b>No filter</b>'}${t ? `<b>${D.fruits[t].name}</b><small>${s.filters[t]} left</small>` : '<small>Catch a mix</small>'}</button>`;
    }).join('');
    owned.forEach(t => $('groveFilters').querySelector(`[data-filter="${t}"]`).prepend(FF.draw.fruitIcon(t, 48)));
    $('groveFilterNote').textContent = owned.length ? '' : 'Buy filters in the shop to catch just one kind of fruit.';
    $('grovePin').innerHTML = FF.orders ? FF.orders.pinLine(open) : '';
    $('groveGo').disabled = n === 0;
  }

  $('groveOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.filter !== undefined) { chosen = b.dataset.filter || null; FF.sfx.tick(); render(); return; }
    if (b.id === 'groveGo') {
      if (chosen) { FF.save.filters[chosen]--; FF.persist(); }
      const type = open, f = chosen; open = null;
      FF.screens.farm(type, f);
    } else if (b.id === 'groveBack') { UI.hideAll(); FF.screens.backToMap(); }
  });

  FF.groves = {
    holds, stock, take, filtersAllowed,
    open(type) {
      FF.sound.ensure();
      open = type; chosen = null;
      render();
      UI.show('grove');
      $('groveGo').focus({ preventScroll: true });
    },
    // Filter bundles in the shop: one row per fruit you grow.
    shopHTML(buyBtn, closedBtn) {
      const s = FF.save;
      return s.trees.map(t => {
        const cost = D.filters.cost[t];
        return `<div class="up"><div class="badge" data-fruit="${t}"></div><div><h3>${D.fruits[t].name} filter</h3><p>Only ${D.fruits[t].name.toLowerCase()} go in your basket for one round. You have ${s.filters[t] || 0}.</p></div>` +
          (filtersAllowed() ? buyBtn('filter', t, cost, `Buy ${D.filters.bundle} ${D.fruits[t].name.toLowerCase()} filters`) : closedBtn()) + `</div>`;
      }).join('');
    }
  };
})();
