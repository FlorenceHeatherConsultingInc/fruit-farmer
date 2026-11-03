/* Fruit Farmer: fields. Once you grow D.fields.trees kinds of fruit, plots open in the village's Fields
   area. Tap an empty plot to plant hay or corn; they grow over days of play and you tap a ripe plot
   to pick it into the barn. Hay feeds the cow, corn feeds the chickens and makes popcorn. More
   plots can be bought, up to D.fields.max. Fields belong to the current farm. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, F = D.fields;
  let plotIndex = -1;

  const isOpen = () => FF.save.trees.length >= F.trees;
  const plots = () => {
    const s = FF.save;
    if (isOpen() && s.plots.length < F.start) while (s.plots.length < F.start) s.plots.push({ crop: null, day: 0 });
    return s.plots;
  };
  const daysLeft = p => Math.max(0, F.crops[p.crop].days - (FF.save.day - p.day));
  const ripe = p => !!p.crop && daysLeft(p) === 0;
  const nextPlotCost = () => F.plotCosts[plots().length - F.start];

  function plant(i, crop) { const p = plots()[i]; if (!p || p.crop) return; p.crop = crop; p.day = FF.save.day; FF.persist(); FF.sfx.tick(); }
  function pick(i) {
    const p = plots()[i], s = FF.save;
    if (!p || !ripe(p)) return 0;
    const n = Math.min(F.crops[p.crop].yield, FF.barnSize() - FF.inBarn());
    if (n <= 0) return -1;
    s.barn[p.crop] += n; p.crop = null;
    FF.addPoints(n); FF.stickers.add('crops', n); FF.stickers.check(); FF.persist(); FF.sfx.coin(n);
    return n;
  }
  function buyPlot() {
    const cost = nextPlotCost();
    if (cost == null || FF.save.coins < cost) return false;
    FF.save.coins -= cost; FF.save.plots.push({ crop: null, day: 0 }); FF.book.bought('New field'); FF.persist(); FF.sfx.buy();
    return true;
  }

  /* ---------- The plant card ---------- */
  function render() {
    const s = FF.save, buying = plotIndex >= plots().length;
    $('plantTitle').textContent = buying ? 'New field' : 'Plant a field';
    $('plantBody').innerHTML = buying
      ? `<p>One more field to plant. It costs ${nextPlotCost()} coins.</p><button class="btn primary" type="button" data-plant="buy" ${s.coins >= nextPlotCost() ? '' : 'disabled'}>${I.coin} ${nextPlotCost()}</button>`
      : `<div class="grid3 two">${Object.entries(F.crops).map(([c, info]) => `<button class="pick" type="button" data-plant="${c}"><span data-pic="${c}"></span><b>${D.fruits[c].name}</b><small>Ready ${info.days === 1 ? 'tomorrow' : 'in ' + info.days + ' days'}</small></button>`).join('')}</div>` +
        `<p class="note">${Object.entries(F.crops).map(([c, info]) => `${D.fruits[c].name} gives ${info.yield}.`).join(' ')} ${D.fruits.hay.name} feeds the cow, and ${D.fruits.corn.name.toLowerCase()} feeds the chickens.</p>`;
    document.querySelectorAll('#plantBody [data-pic]').forEach(el => el.appendChild(FF.draw.fruitIcon(el.dataset.pic, 64)));
  }
  $('plantOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    const act = b.dataset.plant;
    if (act === 'buy') buyPlot();
    else if (act) plant(plotIndex, act);
    UI.hideAll(); FF.screens.backToMap();
  });

  FF.fields = {
    open: isOpen, plots, ripe, daysLeft, nextPlotCost, plant, pick, buyPlot,
    // Tapping a plot on the map (x, y: where to show a message, in map units): plant it, pick it, say when it's ready, or offer a new one.
    tap(i, x, y) {
      if (!isOpen()) { FF.fx.text(x, y, 'Fields open when you have ' + F.trees + ' trees', false); return; }
      const p = plots()[i];
      if (!p) { if (i === plots().length && nextPlotCost() != null) { plotIndex = i; render(); UI.show('plant'); } return; }
      if (!p.crop) { plotIndex = i; render(); UI.show('plant'); return; }
      if (ripe(p)) { const crop = p.crop, n = pick(i); FF.fx.text(x, y, n > 0 ? '+' + n + ' ' + D.fruits[crop].name.toLowerCase() : 'The barn is full!', n > 0); return; }
      FF.fx.text(x, y, D.fruits[p.crop].name + ' is ready ' + (daysLeft(p) === 1 ? 'tomorrow' : 'in ' + daysLeft(p) + ' days'), false);
    },
    reset() { FF.save.plots = []; }
  };
})();
