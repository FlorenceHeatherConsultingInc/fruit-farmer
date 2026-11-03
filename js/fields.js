/* Fruit Farmer: fields. Once you grow D.fields.trees kinds of fruit, the Fields open in the village.
   There is one field per crop. Each grows a set amount every day by itself and holds up to
   D.fields.holdDays days of it, like a pallet. Tap a field to bring everything into the barn.
   Upgrades have no top level: each one grows more a day and holds more. The hay field comes free;
   other fields are bought once. Fields belong to the current farm. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, F = D.fields;
  let showing = null;

  const isOpen = () => FF.save.trees.length >= F.trees;
  const crops = () => Object.keys(F.crops);
  // A field's level; 0 means not bought yet. The first crop comes free once the Fields open.
  function level(c) {
    const s = FF.save;
    if (isOpen() && !s.fieldLv[crops()[0]]) s.fieldLv[crops()[0]] = 1;
    return s.fieldLv[c] || 0;
  }
  const grows = (c, l = level(c)) => l ? F.crops[c].grow + F.crops[c].perLevel * (l - 1) : 0;
  const holds = (c, l = level(c)) => grows(c, l) * F.holdDays;
  const upgradeCost = c => Math.round(F.crops[c].upCost * Math.pow(F.costGrowth, level(c) - 1));
  // Bring a field up to date with the days that have passed, then say how much is ready.
  function ready(c) {
    const s = FF.save, l = level(c);
    if (!l) return 0;
    const f = s.fieldStock[c] || (s.fieldStock[c] = { stock: grows(c), day: s.day });
    if (s.day > f.day) { f.stock = Math.min(holds(c), f.stock + (s.day - f.day) * grows(c)); f.day = s.day; }
    return Math.min(f.stock, holds(c));
  }
  // Everything ready goes into the barn, as far as it has room. Returns how many came in.
  function collect(c) {
    const n = Math.min(ready(c), FF.barnSize() - FF.inBarn());
    if (n <= 0) return 0;
    FF.save.fieldStock[c].stock -= n; FF.save.barn[c] += n;
    FF.addPoints(n); FF.stickers.add('crops', n); FF.stickers.check(); FF.persist(); FF.sfx.coin(n);
    return n;
  }
  function buy(c) {
    const cost = F.crops[c].cost, s = FF.save;
    if (!isOpen() || level(c) || s.coins < cost) return false;
    s.coins -= cost; s.fieldLv[c] = 1; s.fieldStock[c] = { stock: grows(c), day: s.day };
    FF.book.bought(D.fruits[c].name + ' field'); FF.persist(); FF.sfx.buy();
    return true;
  }
  function upgrade(c) {
    const cost = upgradeCost(c), s = FF.save;
    if (!level(c) || s.coins < cost) return false;
    ready(c); s.coins -= cost; s.fieldLv[c]++;
    FF.book.bought(D.fruits[c].name + ' field upgrade'); FF.persist(); FF.sfx.buy();
    return true;
  }

  /* ---------- The field card ---------- */
  function render(note) {
    const c = showing, s = FF.save, l = level(c), name = D.fruits[c].name;
    $('plantTitle').textContent = name + ' field' + (l ? ' · level ' + l : '');
    const pic = `<span data-pic="${c}"></span>`;
    $('plantBody').innerHTML = (note ? `<p class="note">${note}</p>` : '') + (l
      ? `<div class="fieldinfo">${pic}<div><b>${ready(c)} ready</b><small>Grows ${grows(c)} a day · holds ${holds(c)} · you have ${s.barn[c]}</small></div></div>` +
        `<button class="btn primary" type="button" data-plant="collect" ${ready(c) ? '' : 'disabled'}>${ready(c) ? 'Bring in ' + ready(c) + ' ' + name.toLowerCase() : 'Nothing ready yet'}</button>` +
        `<button class="btn secondary" type="button" data-plant="up" ${s.coins >= upgradeCost(c) ? '' : 'disabled'}>Upgrade: ${grows(c, l + 1)} a day, holds ${holds(c, l + 1)} · ${I.coin}${upgradeCost(c)}</button>`
      : `<div class="fieldinfo">${pic}<div><b>A ${name.toLowerCase()} field</b><small>Grows ${grows(c, 1)} ${name.toLowerCase()} a day by itself.</small></div></div>` +
        `<button class="btn primary" type="button" data-plant="buy" ${s.coins >= F.crops[c].cost ? '' : 'disabled'}>Start it: ${I.coin}${F.crops[c].cost}</button>`) +
      `<p class="note">${c === 'hay' ? 'Hay feeds the cows.' : c === 'corn' ? 'Corn feeds the chickens and makes popcorn.' : ''}</p>`;
    document.querySelectorAll('#plantBody [data-pic]').forEach(el => el.appendChild(FF.draw.fruitIcon(el.dataset.pic, 64)));
  }
  $('plantOv').addEventListener('click', e => {
    const b = e.target.closest('button[data-plant]');
    if (!b) return;
    FF.sound.ensure();
    const act = b.dataset.plant, c = showing;
    if (act === 'collect') { const n = collect(c); render(n ? '+' + n + ' ' + D.fruits[c].name.toLowerCase() + ' went to the barn.' : 'The barn is full! Sell something first.'); if (n) FF.fx.confetti(); }
    else if (act === 'up' && upgrade(c)) render('Upgraded! It grows more every day.');
    else if (act === 'buy' && buy(c)) render('Your new field is growing.');
    FF.screens.backToMap();
  });

  FF.fields = {
    open: isOpen, crops, level, grows, holds, ready, collect, buy, upgrade, upgradeCost,
    // Tapping a field on the map (x, y: where to show a message, in map units).
    tap(c, x, y) {
      if (!isOpen()) { FF.fx.text(x, y, 'Fields open when you have ' + F.trees + ' trees', false); return; }
      FF.sound.ensure(); showing = c; render(); UI.show('plant'); $('plantDone').focus({ preventScroll: true });
    },
    reset() { FF.save.fieldLv = {}; FF.save.fieldStock = {}; }
  };
})();
