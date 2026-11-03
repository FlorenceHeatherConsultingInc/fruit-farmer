/* Fruit Farmer: production buildings. Each building in D.buildings has a cost, things it needs
   first, and one or more recipes. Put ingredients in today and the goods are ready after your next
   harvest (when the day changes); collect them into the barn. Upgrading adds slots. Buildings belong
   to the current farm and start over with a new one. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let open = null;

  const def = id => D.buildings.find(b => b.id === id);
  const state = id => FF.save.buildings[id] || null;
  const owned = id => !!state(id);
  const slots = id => def(id).slots[state(id).level - 1];
  const has = items => Object.entries(items).every(([t, n]) => FF.save.barn[t] >= n);
  const ready = id => (state(id) ? state(id).queue.filter(q => FF.save.day >= q.ready).length : 0);

  // Everything a building needs before you can build it, each with whether it's done yet.
  function needs(id) {
    const b = def(id), s = FF.save, out = [];
    out.push({ text: b.cost + ' coins', done: s.coins >= b.cost });
    (b.needs.trees || []).forEach(t => out.push({ text: D.trees.find(x => x.type === t).name, done: s.trees.includes(t) }));
    (b.needs.buildings || []).forEach(x => out.push({ text: def(x).name, done: owned(x) }));
    if (b.needs.fields) out.push({ text: 'Fields', done: FF.fields ? FF.fields.open() : false });
    Object.entries(b.deliver || {}).forEach(([t, n]) => out.push({ text: `Deliver ${n} ${D.fruits[t].name.toLowerCase()}`, done: s.barn[t] >= n }));
    return out;
  }
  function build(id) {
    const b = def(id), s = FF.save;
    if (owned(id) || !needs(id).every(n => n.done)) return false;
    s.coins -= b.cost;
    Object.entries(b.deliver || {}).forEach(([t, n]) => { s.barn[t] -= n; });
    s.buildings[id] = { level: 1, queue: [] };
    FF.book.bought(b.name); FF.stickers.add('built'); FF.addPoints(10);
    FF.persist(); FF.sfx.buy(); FF.fx.confetti();
    return true;
  }
  function make(id, r) {
    const st = state(id), recipe = def(id).recipes[r], s = FF.save;
    if (!st || st.queue.length >= slots(id) || !has(recipe.in)) return false;
    Object.entries(recipe.in).forEach(([t, n]) => { s.barn[t] -= n; });
    st.queue.push({ out: recipe.out, ready: s.day + 1 });
    FF.persist(); FF.sfx.tick();
    return true;
  }
  // Ready goods go into the barn, as far as it has room.
  function collect(id) {
    const st = state(id), s = FF.save;
    let room = FF.barnSize() - FF.inBarn(), got = 0;
    st.queue = st.queue.filter(q => {
      if (s.day < q.ready || room <= 0) return true;
      s.barn[q.out]++; room--; got++;
      return false;
    });
    if (got) { FF.addPoints(got * D.goodsPoints); FF.stickers.add('made', got); FF.stickers.check(); FF.sfx.coin(got); FF.persist(); }
    return got;
  }
  function upgrade(id) {
    const st = state(id), b = def(id), cost = b.upgrade[st.level - 1];
    if (cost == null || FF.save.coins < cost) return false;
    FF.save.coins -= cost; st.level++; FF.book.bought(b.name + ' upgrade'); FF.persist(); FF.sfx.buy();
    return true;
  }

  /* ---------- The building card ---------- */
  const pics = {};
  const pic = (t, cls = 'ic sm') => { if (!pics[t]) pics[t] = FF.draw.fruitIcon(t, 56).toDataURL(); return `<img class="${cls}" src="${pics[t]}" alt="">`; };
  const recipeHTML = r => Object.entries(r.in).map(([t, n]) => `${n > 1 ? n + '×' : ''}${pic(t)}`).join('<b>+</b>') + `<b>=</b>${pic(r.out)}`;
  function render(note) {
    const b = def(open), st = state(open), s = FF.save;
    $('buildTitle').textContent = b.name;
    $('buildCoins').innerHTML = UI.coinHTML(s.coins);
    $('buildNote').textContent = note || '';
    let html = '';
    if (!st) {
      const list = needs(open);
      html = `<div class="recipes">${b.recipes.map(r => `<div class="recipe">${recipeHTML(r)}<small>Sells for ${D.fruits[r.out].price}</small></div>`).join('')}</div>` +
        `<ul class="goals">${list.map(n => `<li class="${n.done ? 'done' : ''}">${n.text}</li>`).join('')}</ul>` +
        `<button class="btn primary" type="button" data-build="build" ${list.every(n => n.done) ? '' : 'disabled'}>Build it</button>`;
    } else {
      const n = slots(open), q = st.queue;
      html = b.recipes.map((r, i) => `<div class="recipe">${recipeHTML(r)}<button class="mini" type="button" data-build="make" data-r="${i}" ${q.length < n && has(r.in) ? '' : 'disabled'}>Make</button></div>`).join('') +
        `<div class="label">Making (${q.length} of ${n})</div><div class="slots">` +
        Array.from({ length: n }, (_, i) => { const item = q[i]; return item ? `<span class="slot ${s.day >= item.ready ? 'ready' : 'making'}">${pic(item.out)}<small>${s.day >= item.ready ? 'Ready' : 'Tomorrow'}</small></span>` : '<span class="slot empty"></span>'; }).join('') + '</div>' +
        `<button class="btn primary" type="button" data-build="collect" ${ready(open) ? '' : 'disabled'}>Collect ${ready(open) || ''}</button>` +
        (b.upgrade[st.level - 1] != null ? `<button class="btn secondary" type="button" data-build="upgrade" ${s.coins >= b.upgrade[st.level - 1] ? '' : 'disabled'}>More slots: ${b.upgrade[st.level - 1]} coins</button>` : '');
    }
    $('buildBody').innerHTML = html;
  }
  $('buildOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.id === 'buildDone') { UI.hideAll(); FF.screens.backToMap(); return; }
    const act = b.dataset.build;
    if (act === 'build' && build(open)) render('Built! Put ingredients in and they\'re ready after your next harvest.');
    else if (act === 'make' && make(open, +b.dataset.r)) render('Ready after your next harvest.');
    else if (act === 'collect') { const got = collect(open); render(got ? got + ' went to the barn.' : 'The barn is full! Sell something first.'); }
    else if (act === 'upgrade' && upgrade(open)) render('One more slot!');
  });

  FF.buildings = {
    def, owned, ready, slots, needs,
    inArea: area => D.buildings.filter(b => b.area === area),
    // What orders can ask for, once you can make it.
    outputs: () => D.buildings.filter(b => owned(b.id)).flatMap(b => b.recipes.map(r => r.out)),
    canBuild: id => !owned(id) && needs(id).every(n => n.done),
    open(id) { FF.sound.ensure(); open = id; render(); UI.show('build'); $('buildDone').focus({ preventScroll: true }); },
    reset() { FF.save.buildings = {}; },
    // for tests
    build, make, collect, upgrade
  };
  FF.orderExtras = () => [...new Set(FF.buildings.outputs())];
})();
