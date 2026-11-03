/* Fruit Farmer: groves. Each planted tree is a grove holding a set amount of fruit.
   Catching takes fruit out; groves refill over days of play (a day ends when you come back from market).
   Tapping a grove on the map opens its card: how much is on the tree, the harvest speed, and Go. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let open = null;

  const tree = type => D.trees.find(t => t.type === type);
  const holds = type => { const t = tree(type); return t.holds + Math.floor(FF.level() * t.perLevel); };
  // Bring a grove up to date with the days that have passed, then return what's on the tree.
  function stock(type) {
    const s = FF.save, g = s.groves[type] || (s.groves[type] = { stock: holds(type), day: s.day });
    if (s.day > g.day) { g.stock = Math.min(holds(type), g.stock + Math.ceil((s.day - g.day) * holds(type) / tree(type).refill)); g.day = s.day; }
    return Math.min(g.stock, holds(type));
  }
  const take = type => { if (!tree(type)) return; stock(type); FF.save.groves[type].stock = Math.max(0, FF.save.groves[type].stock - 1); };

  function render() {
    const s = FF.save, n = stock(open), f = D.fruits[open];
    $('groveTitle').textContent = tree(open).name.replace(' tree', ' grove');
    const trips = Math.ceil(n / FF.cap());
    $('groveStock').textContent = n ? `${n} ${f.name.toLowerCase()} on the tree. Your basket holds ${FF.cap()}, so that's ${trips === 1 ? 'one trip' : trips + ' trips'}.` + (s.trees.length > 1 ? ' Watch for sparkly bonus fruit!' : '') : `The grove is bare. It refills in ${tree(open).refill === 1 ? 'a day' : tree(open).refill + ' days'}.`;
    $('grovePin').innerHTML = FF.orders ? FF.orders.pinLine(open) : '';
    $('groveGo').disabled = n === 0;
  }

  $('groveOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'groveGo') {
      const type = open; open = null;
      FF.screens.farm(type);
    } else if (b.id === 'groveBack') { UI.hideAll(); FF.screens.backToMap(); }
  });

  FF.groves = {
    holds, stock, take,
    open(type) {
      FF.sound.ensure();
      open = type;
      render();
      UI.show('grove');
      $('groveGo').focus({ preventScroll: true });
    }
  };
})();
