/* Fruit Farmer: groves. Each planted tree is a grove holding a set amount of fruit.
   Catching takes fruit out; groves refill over days of play (a day ends when you come back from market).
   Tapping a grove on the map opens its card: how much is on the tree, the harvest speed, and Go. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let open = null;

  const tree = type => D.trees.find(t => t.type === type);
  const grows = type => FF.save.treeGrows[type] || 0;
  const holds = type => FF.treeSize(type, grows(type));
  const growCost = type => FF.treeGrowCost(type, grows(type));
  // Bring a grove up to date with the days that have passed, then return what's on the tree.
  function stock(type) {
    const s = FF.save, g = s.groves[type] || (s.groves[type] = { stock: holds(type), day: s.day });
    if (s.day > g.day) { g.stock = Math.min(holds(type), g.stock + Math.ceil((s.day - g.day) * holds(type) / tree(type).refill)); g.day = s.day; }
    g.stock = Math.min(g.stock, holds(type));
    return g.stock;
  }
  const take = type => { if (!tree(type)) return; stock(type); FF.save.groves[type].stock = Math.max(0, FF.save.groves[type].stock - 1); };

  function render() {
    const s = FF.save, n = stock(open), f = D.fruits[open];
    $('groveTitle').textContent = tree(open).name.replace(' tree', ' grove');
    const trips = Math.ceil(n / FF.cap());
    $('groveStock').textContent = n ? `${n} ${f.name.toLowerCase()} on the tree. Your basket holds ${FF.cap()}, so that's ${trips === 1 ? 'one trip' : trips + ' trips'}.` + (s.trees.length > 1 ? ' Watch for sparkly bonus fruit!' : '') : `The grove is bare. It refills in ${tree(open).refill === 1 ? 'a day' : tree(open).refill + ' days'}.`;
    $('grovePin').innerHTML = FF.orders ? FF.orders.pinLine(open) : '';
    $('groveGo').disabled = n === 0;
    const cost = growCost(open), next = FF.treeSize(open, grows(open) + 1);
    $('groveGrow').innerHTML = `Grow it to hold ${next}: ${I.coin}${cost}`;
    $('groveGrow').disabled = s.coins < cost;
    $('groveSize').innerHTML = `This tree holds <b>${holds(open)}</b>. A bigger tree grows more every day. You have ${s.coins} coins.`;
  }

  $('groveOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'groveGrow') { if (grow(open)) { FF.fx.confetti(); render(); FF.screens.backToMap(); } else FF.sfx.nope(); return; }
    if (b.id === 'groveGo') {
      const type = open; open = null;
      FF.screens.farm(type);
    } else if (b.id === 'groveBack') { UI.hideAll(); FF.screens.backToMap(); }
  });

  // Grow a tree: it holds more from now on, and the new fruit are on it straight away.
  function grow(type) {
    const s = FF.save, cost = growCost(type);
    if (!s.trees.includes(type) || s.coins < cost) return false;
    const before = stock(type), added = FF.treeSize(type, grows(type) + 1) - holds(type);
    s.coins -= cost; s.treeGrows[type] = grows(type) + 1;
    s.groves[type].stock = before + added;
    FF.book.bought(tree(type).name + ' grew');
    FF.stickers.add('treeGrows'); FF.persist(); FF.sfx.buy();
    return true;
  }

  FF.groves = {
    holds, stock, take, grows, growCost, grow,
    open(type) {
      FF.sound.ensure();
      open = type;
      render();
      UI.show('grove');
      $('groveGo').focus({ preventScroll: true });
    }
  };
})();
