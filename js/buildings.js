/* Fruit Farmer: production buildings. Each building in D.buildings has a cost, things it needs
   first, and one or more recipes. You stock its feed box with as many ingredients as you like.
   Every round (each new day) each slot takes one batch from the feed box and puts what it makes on
   the pallet. A full pallet makes the slots wait; nothing is lost. Collect the pallet into the barn.
   More slots means more made each round; a bigger pallet holds more. Buildings belong to the
   current farm and start over with a new one. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, P = D.pallets;
  let open = null;

  const def = id => D.buildings.find(b => b.id === id);
  const state = id => FF.save.buildings[id] || null;
  const owned = id => !!state(id);
  const slots = id => def(id).slots[state(id).level - 1];
  const palletSize = id => P.sizes[state(id).pallet];
  const fits = (items, pool) => Object.entries(items).every(([t, n]) => (pool[t] || 0) >= n);
  // How many batches of a recipe the feed box (or the barn) has.
  const batches = (r, pool) => Math.min(...Object.entries(r.in).map(([t, n]) => Math.floor((pool[t] || 0) / n)));

  // Run the rounds since the building was last looked at. Each round, each slot makes one thing,
  // taking turns between recipes, as long as the feed box has a batch and the pallet has room.
  function update(id) {
    const st = state(id), b = def(id), s = FF.save;
    if (!st) return null;
    while (st.day < s.day) {
      st.day++;
      for (let k = 0; k < slots(id) && st.palletItems.length < palletSize(id); k++) {
        let made = false;
        for (let j = 0; j < b.recipes.length && !made; j++) {
          const r = b.recipes[(st.turn + j) % b.recipes.length];
          if (!fits(r.in, st.feed)) continue;
          Object.entries(r.in).forEach(([t, n]) => { st.feed[t] -= n; });
          st.palletItems.push(r.out); st.turn = (st.turn + j + 1) % b.recipes.length; made = true;
        }
        if (!made) break;
      }
    }
    return st;
  }
  const ready = id => (update(id) ? state(id).palletItems.length : 0);
  // How many slots will be busy next round: limited by the feed box and the pallet's room.
  function busy(id) {
    const st = update(id), b = def(id);
    if (!st) return 0;
    const pool = { ...st.feed };
    let n = 0;
    for (let k = 0; k < slots(id) && st.palletItems.length + n < palletSize(id); k++) {
      const r = b.recipes.find(x => fits(x.in, pool));
      if (!r) break;
      Object.entries(r.in).forEach(([t, c]) => { pool[t] -= c; }); n++;
    }
    return n;
  }
  // How many things the feed box holds enough for, across every recipe.
  const fed = id => def(id).recipes.reduce((n, r) => n + batches(r, state(id).feed), 0);

  // Everything a building needs before you can build it, each with whether it's done yet.
  function needs(id) {
    const b = def(id), s = FF.save, out = [];
    out.push({ text: b.cost + ' coins', done: s.coins >= b.cost });
    (b.needs.trees || []).forEach(t => out.push({ text: D.trees.find(x => x.type === t).name, done: s.trees.includes(t) }));
    (b.needs.buildings || []).forEach(x => out.push({ text: def(x).name, done: owned(x) }));
    if (b.needs.fields) out.push({ text: 'Fields (grow ' + D.fields.trees + ' trees)', done: FF.fields ? FF.fields.open() : false });
    Object.entries(b.deliver || {}).forEach(([t, n]) => out.push({ text: `Deliver ${n} ${D.fruits[t].name.toLowerCase()}`, done: s.barn[t] >= n }));
    return out;
  }
  function build(id) {
    const b = def(id), s = FF.save;
    if (owned(id) || !needs(id).every(n => n.done)) return false;
    s.coins -= b.cost;
    Object.entries(b.deliver || {}).forEach(([t, n]) => { s.barn[t] -= n; });
    s.buildings[id] = { level: 1, pallet: 0, feed: {}, palletItems: [], day: s.day, turn: 0 };
    FF.book.bought(b.name); FF.stickers.add('built'); FF.addPoints(10);
    FF.persist(); FF.sfx.buy(); FF.fx.confetti();
    return true;
  }
  // Moves k batches of recipe r from the barn into the feed box (as many as the barn has).
  function feed(id, r, k = 1) {
    const st = update(id), recipe = def(id).recipes[r], s = FF.save;
    const n = Math.min(k, batches(recipe, s.barn));
    if (!st || n <= 0) return 0;
    Object.entries(recipe.in).forEach(([t, c]) => { s.barn[t] -= c * n; st.feed[t] = (st.feed[t] || 0) + c * n; });
    FF.persist(); FF.sfx.tick();
    return n;
  }
  // Everything on the pallet goes into the barn, as far as it has room.
  function collect(id) {
    const st = update(id), s = FF.save;
    let room = FF.barnSize() - FF.inBarn(), got = 0;
    while (room > 0 && st.palletItems.length) {
      const out = st.palletItems.shift();
      s.barn[out]++; room--; got++;
      FF.stickers.add('made' + out[0].toUpperCase() + out.slice(1));
    }
    if (got) { FF.addPoints(got * D.goodsPoints); FF.stickers.add('made', got); FF.stickers.check(); FF.sfx.coin(got); FF.persist(); }
    return got;
  }
  // More slots (more animals or machines), or a bigger pallet.
  function upgrade(id) {
    const st = update(id), b = def(id), cost = b.upgrade[st.level - 1];
    if (cost == null || FF.save.coins < cost) return false;
    FF.save.coins -= cost; st.level++; FF.book.bought(b.name + ': ' + (b.more || 'more slots')); FF.persist(); FF.sfx.buy();
    return true;
  }
  function biggerPallet(id) {
    const st = update(id), cost = P.costs[st.pallet];
    if (cost == null || FF.save.coins < cost) return false;
    FF.save.coins -= cost; st.pallet++; FF.book.bought(def(id).name + ': bigger pallet'); FF.persist(); FF.sfx.buy();
    return true;
  }

  /* ---------- The building card ---------- */
  const pics = {};
  const pic = (t, cls = 'ic sm') => { if (!pics[t]) pics[t] = FF.draw.fruitIcon(t, 56).toDataURL(); return `<img class="${cls}" src="${pics[t]}" alt="">`; };
  const recipeHTML = r => Object.entries(r.in).map(([t, n]) => `${n > 1 ? n + '×' : ''}${pic(t)}`).join('<b>+</b>') + `<b>=</b>${pic(r.out)}`;
  function render(note) {
    const b = def(open), st = update(open), s = FF.save;
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
      const n = slots(open), on = busy(open), cap = palletSize(open), items = st.palletItems;
      // slots that have feed but no room on the pallet are waiting, not free
      const wait = Math.max(0, Math.min(n, fed(open)) - on);
      const slotCost = b.upgrade[st.level - 1], palCost = P.costs[st.pallet];
      html =
        `<div class="label">${n} ${b.worker || 'slots'} · ${on} making next round${wait ? ' · ' + wait + ' waiting for pallet room' : ''}${n - on - wait ? ' · ' + (n - on - wait) + ' need feed' : ''}</div>` +
        `<div class="slots">${Array.from({ length: n }, (_, i) => i < on ? `<span class="slot making">${pic(b.recipes[0].out)}<small>Busy</small></span>` : i < on + wait ? `<span class="slot waiting">${pic(b.recipes[0].out)}<small>Waiting</small></span>` : `<span class="slot empty"><small>Needs feed</small></span>`).join('')}</div>` +
        `<div class="label">Pallet · ${items.length} of ${cap}</div>` +
        `<div class="pallet">${items.length ? items.slice(0, 16).map(t => pic(t)).join('') : '<small>Empty. Things made each round wait here.</small>'}</div>` +
        `<button class="btn primary" type="button" data-build="collect" ${items.length ? '' : 'disabled'}>${items.length ? 'Collect ' + items.length + ' into the barn' : 'Nothing to collect yet'}</button>` +
        `<div class="label">Feed box · enough for ${fed(open)}</div>` +
        b.recipes.map((r, i) => {
          const can = batches(r, s.barn);
          return `<div class="recipe">${recipeHTML(r)}<small class="have">${Object.keys(r.in).map(t => `you have ${s.barn[t]} ${D.fruits[t].name.toLowerCase()}`).join(', ')}</small>` +
            `<div class="feedbtns"><button class="mini" type="button" data-build="feed" data-r="${i}" data-k="1" ${can ? '' : 'disabled'}>+1</button>` +
            `<button class="mini" type="button" data-build="feed" data-r="${i}" data-k="5" ${can >= 5 ? '' : 'disabled'}>+5</button>` +
            `<button class="mini" type="button" data-build="feed" data-r="${i}" data-k="all" ${can ? '' : 'disabled'}>All ${can || ''}</button></div></div>`;
        }).join('') +
        `<div class="upgrades">` +
        (slotCost != null ? `<button class="btn secondary" type="button" data-build="upgrade" ${s.coins >= slotCost ? '' : 'disabled'}>${b.more || 'More slots'}: ${I.coin}${slotCost}</button>` : `<button class="btn secondary" type="button" disabled>Most ${b.worker || 'slots'}</button>`) +
        (palCost != null ? `<button class="btn secondary" type="button" data-build="pallet" ${s.coins >= palCost ? '' : 'disabled'}>Bigger pallet (${P.sizes[st.pallet + 1]}): ${I.coin}${palCost}</button>` : `<button class="btn secondary" type="button" disabled>Biggest pallet</button>`) +
        `</div>`;
    }
    $('buildBody').innerHTML = html;
  }
  $('buildOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.id === 'buildDone') { UI.hideAll(); FF.screens.backToMap(); return; }
    const act = b.dataset.build;
    if (act === 'build' && build(open)) render('Built! Fill the feed box, and it makes things every day by itself.');
    else if (act === 'feed') { const n = feed(open, +b.dataset.r, b.dataset.k === 'all' ? Infinity : +b.dataset.k); render(n ? 'In the feed box! It gets made a little every day.' : ''); }
    else if (act === 'collect') { const got = collect(open); render(got ? got + ' went to the barn.' : 'The barn is full! Sell something first.'); }
    else if (act === 'upgrade' && upgrade(open)) render('One more! More gets made each round.');
    else if (act === 'pallet' && biggerPallet(open)) render('A bigger pallet holds more.');
  });

  FF.buildings = {
    def, owned, ready, slots, needs, busy, fed, palletSize, update,
    inArea: area => D.buildings.filter(b => b.area === area).sort((a, b) => a.cost - b.cost),
    // What orders can ask for, once you can make it.
    outputs: () => D.buildings.filter(b => owned(b.id)).flatMap(b => b.recipes.map(r => r.out)),
    canBuild: id => !owned(id) && needs(id).every(n => n.done),
    open(id) { FF.sound.ensure(); open = id; render(); UI.show('build'); $('buildDone').focus({ preventScroll: true }); },
    reset() { FF.save.buildings = {}; },
    // make: one batch into the feed box (kept for tests and older callers)
    build, feed, make: (id, r) => feed(id, r, 1) > 0, collect, upgrade, biggerPallet
  };
  FF.orderExtras = () => [...new Set([...FF.buildings.outputs(), ...(FF.fields ? FF.fields.crops().filter(c => FF.fields.level(c)) : [])])];
})();
