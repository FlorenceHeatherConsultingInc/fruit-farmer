/* Fruit Farmer: the shop card, built from the tables in data.js. It opens in one of four modes:
   looks (the Shop: basket looks and colors, scenery, hats, decorations, the market), shed (the
   barnyard's Tool shed: upgrades and a bigger barn), tree (planting from the groves) and barn. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let from = 'title', mode = 'looks';
  const TITLES = { looks: 'Shop', shed: 'Tool shed', tree: 'Plant a tree', barn: 'Barn' };
  const NOTES = { looks: 'Looks for your farm and your friends.', shed: 'Tools that make harvesting easier, and a bigger barn.', tree: 'Each tree is a new grove in the village.', barn: 'Everything you catch waits here until you sell it.' };

  const buyBtn = (act, id, cost, label) =>
    `<button class="mini" type="button" data-act="${act}" data-id="${id}" ${FF.save.coins >= cost ? '' : 'disabled'} aria-label="${label} for ${cost} coins">${I.coin}${cost}</button>`;
  const ownedBtn = text => `<button class="mini owned" type="button" disabled>${text}</button>`;
  const closedBtn = () => `<button class="mini" type="button" disabled>Not here</button>`;
  const pips = (on, total) => `<div class="pips" aria-label="Level ${on} of ${total}">${Array.from({ length: total }, (_, i) => `<span class="pip${i < on ? ' on' : ''}"></span>`).join('')}</div>`;
  const pickStatus = (on, owned, cost) => on ? 'Using' : owned ? 'Use it' : cost >= 1e9 ? 'Reward' : I.coin + cost;
  // Cheapest first; the sort is stable, so equal prices keep their order in data.js.
  const byCost = (list, cost) => list.slice().sort((a, b) => cost(a) - cost(b));

  const wallGoals = () => {
    const save = FF.save, W = D.market.wallUnlock, kinds = save.trees.length;
    return [
      { text: 'Reach farm level ' + W.level, done: FF.level() >= W.level },
      { text: 'Grow ' + W.fruitKinds + ' kinds of fruit (' + Math.min(kinds, W.fruitKinds) + '/' + W.fruitKinds + ')', done: kinds >= W.fruitKinds },
      { text: 'Fill ' + W.filled + ' baskets (' + Math.min(save.filled, W.filled) + '/' + W.filled + ')', done: save.filled >= W.filled }
    ];
  };
  const barnPics = {};
  const barnPic = t => barnPics[t] || (barnPics[t] = FF.draw.fruitIcon(t, 48).toDataURL());
  const animalBadge = kind => FF.draw.toCanvas(84, 84, s => FF.animals.drawHead(kind, s / 2, s * 0.56, s * 0.3, 'idle', 0, { x: 0, y: 0.4 }));

  function renderMarket() {
    const save = FF.save, box = $('shopMarket'), goals = wallGoals(), W = D.market.wallUnlock;
    box.innerHTML = '';
    box.parentElement.hidden = mode !== 'looks' || !(save.wallOwned || FF.quests.isUnlocked('wall'));
    if (box.parentElement.hidden) return;
    if (save.wallOwned) {
      box.className = 'grid3';
      [['friends', 'Animal friends', 'bunny'], ['wall', 'Barrel wall', 'pig']].forEach(([id, name, kind]) => {
        const on = save.marketLayout === id, btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'pick' + (on ? ' on' : '');
        btn.dataset.act = 'layout'; btn.dataset.id = id;
        btn.setAttribute('aria-pressed', String(on));
        btn.appendChild(animalBadge(kind));
        btn.insertAdjacentHTML('beforeend', `<b>${name}</b><small>${pickStatus(on, true)}</small>`);
        box.appendChild(btn);
      });
      return;
    }
    box.className = 'rows';
    const ready = goals.every(g => g.done), row = document.createElement('div'); row.className = 'up';
    const badge = document.createElement('div'); badge.className = 'badge'; badge.appendChild(animalBadge('pig'));
    row.appendChild(badge);
    row.insertAdjacentHTML('beforeend', `<div><h3>Barrel wall</h3><p>12 barrels. Far ones pay the most!</p></div>` +
      (ready ? buyBtn('wall', 'buy', W.cost, 'Buy the Barrel wall') : `<button class="mini" type="button" disabled>Locked</button>`) +
      `<ul class="goals">` + goals.map(g => `<li class="${g.done ? 'done' : ''}">${g.text}</li>`).join('') + `</ul>`);
    box.appendChild(row);
  }

  function render() {
    const save = FF.save, fa = document.activeElement;
    const focusKey = fa && fa.dataset && fa.dataset.act ? fa.dataset.act + ':' + (fa.dataset.id || '') : '';
    $('shopCoins').innerHTML = UI.coinHTML(save.coins);

    $('shopTitle').textContent = TITLES[mode]; $('shopNote').textContent = NOTES[mode];
    document.querySelectorAll('#shopOv [data-modes]').forEach(sec => { sec.hidden = !sec.dataset.modes.split(' ').includes(mode); });
    const cur = FF.carrier(), size = FF.barnSize(), next = D.barn.sizes[save.barnLevel + 1];
    const inside = FF.FRUIT_TYPES.filter(t => save.barn[t] > 0);
    $('shopBarn').innerHTML = `<div class="up"><div class="badge">${I.barn}</div><div><h3>${FF.inBarn()} of ${size === Infinity ? 'any amount' : size}</h3><p>${next ? 'A bigger barn holds ' + (next === Infinity ? 'as much as you like' : next) + '.' : 'The biggest barn.'}</p></div>` +
      (next ? buyBtn('barn', 'next', D.barn.costs[save.barnLevel], 'Buy a bigger barn') : ownedBtn('Biggest')) + `</div>` +
      (inside.length ? `<div class="barnlist">${inside.map(t => `<span><img src="${barnPic(t)}" alt="${D.fruits[t].name}">${save.barn[t]}</span>`).join('')}</div>` : '<p class="note">Empty. Go catch some fruit!</p>');
    const carry = $('shopCarry');
    carry.innerHTML = `<p class="note">Pick how your basket looks. It holds ${FF.cap()} whichever you pick.</p><div class="grid3" id="shopLooks"></div>`;
    FF.looksReached().forEach(l => {
      const on = cur.look === l.look, btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pick' + (on ? ' on' : ''); btn.dataset.act = 'look'; btn.dataset.id = l.look;
      btn.setAttribute('aria-pressed', String(on));
      const pic = FF.farm.lookPreview(l.look); pic.className = 'scene';
      btn.appendChild(pic);
      btn.insertAdjacentHTML('beforeend', `<b>${l.name}</b><small>${on ? 'Using' : 'Use it'}</small>`);
      $('shopLooks').appendChild(btn);
    });

    const trees = $('shopTrees'); trees.innerHTML = '';
    byCost(D.trees.filter(t => t.cost && (save.trees.includes(t.type) || FF.quests.isUnlocked('tree:' + t.type))), t => t.cost).forEach(t => {
      const row = document.createElement('div'); row.className = 'up';
      const badge = document.createElement('div'); badge.className = 'badge'; badge.appendChild(FF.draw.fruitIcon(t.type));
      row.appendChild(badge);
      row.insertAdjacentHTML('beforeend', `<div><h3>${t.name}</h3><p>${D.fruits[t.type].name} start falling in your orchard. They sell for ${D.fruits[t.type].price} coins each.</p></div>` +
        (save.trees.includes(t.type) ? ownedBtn('Planted') : save.challenge === 'apples' ? closedBtn() : FF.level() < (t.level || 1) ? `<button class="mini" type="button" disabled>Level ${t.level}</button>` : buyBtn('tree', t.type, t.cost, 'Plant ' + t.name)));
      trees.appendChild(row);
    });

    renderMarket();
    $('shopHats').innerHTML = byCost(D.hats, h => h.cost).map(h => {
      const owned = save.hats.includes(h.id), on = save.hat === h.id;
      return `<button class="pick${on ? ' on' : ''}" type="button" data-act="hat" data-id="${h.id}" ${owned || save.coins >= h.cost ? '' : 'disabled'} aria-pressed="${on}"><span data-hat="${h.id}"></span><b>${h.name}</b><small>${pickStatus(on, owned, h.cost)}</small></button>`;
    }).join('');
    document.querySelectorAll('#shopHats [data-hat]').forEach(el => {
      FF.animals.showHat = el.dataset.hat;
      el.appendChild(FF.draw.toCanvas(72, 72, s => FF.animals.drawHead('bunny', s / 2, s * 0.62, s * 0.26, 'happy', 0, { x: 0, y: 0.3 })));
      FF.animals.showHat = null;
    });
    $('shopDecor').innerHTML = byCost(D.decorations, d => d.cost).map(d => {
      const on = save.decor.includes(d.id);
      return `<button class="pick${on ? ' on' : ''}" type="button" data-act="decor" data-id="${d.id}" ${on || save.coins >= d.cost ? '' : 'disabled'} aria-pressed="${on}"><b>${d.name}</b><small>${on ? 'Built' : I.coin + d.cost}</small></button>`;
    }).join('');

    // A bigger basket first (it never runs out), then the other upgrades, cheapest first.
    const bigger = FF.basketNext(save.basket), nextLook = FF.lookFor(bigger), newLook = nextLook.look !== FF.lookFor(save.basket).look;
    $('shopUps').innerHTML =
      `<div class="up"><div class="badge">${I.basket}</div><div><h3>Bigger basket</h3><p>You carry ${FF.cap()}. ` +
      (FF.canGrowBasket() ? (newLook ? `Next: a ${nextLook.name.toLowerCase()} that carries ${bigger}!` : `Next: carry ${bigger}.`) + ' Fewer trips!' : 'Tiny Hands stays small.') + `</p></div>` +
      (FF.canGrowBasket() ? buyBtn('basket', 'next', FF.basketPrice(save.basket), 'Buy a bigger basket') : closedBtn()) + `</div>` +
      byCost(D.upgrades, u => u.costs[Math.min(save.up[u.id] || 0, u.costs.length - 1)]).map(u => {
      const lvl = save.up[u.id], max = lvl >= u.costs.length;
      return `<div class="up"><div class="badge">${I[u.icon]}</div><div><h3>${u.name}</h3><p>${u.desc}</p>${pips(lvl, u.costs.length)}</div>` +
        (max ? ownedBtn('Max') : save.challenge === 'noups' ? closedBtn() : buyBtn('up', u.id, u.costs[lvl], 'Buy ' + u.name)) + `</div>`;
    }).join('');

    $('shopSkins').innerHTML = byCost(D.skins.filter(s => !s.reward || save.skins.includes(s.id)), s => s.reward ? Infinity : s.cost).map(s => {
      const owned = save.skins.includes(s.id), on = save.skin === s.id;
      const bg = s.rainbow ? `linear-gradient(${D.rainbow.join(',')})` : s.body;
      return `<button class="pick${on ? ' on' : ''}" type="button" data-act="skin" data-id="${s.id}" ${owned || save.coins >= s.cost ? '' : 'disabled'} aria-pressed="${on}">` +
        `<span class="sw" style="background:${bg}"></span><b>${s.name}</b><small>${pickStatus(on, owned, s.cost)}</small></button>`;
    }).join('');

    const scenes = $('shopScenes'); scenes.innerHTML = '';
    byCost(D.scenes.filter(s => !s.reward || save.scenes.includes(s.id)), s => s.reward ? Infinity : s.cost).forEach(s => {
      const owned = save.scenes.includes(s.id), on = save.scene === s.id;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pick' + (on ? ' on' : '');
      btn.dataset.act = 'scene'; btn.dataset.id = s.id;
      btn.disabled = !(owned || save.coins >= s.cost);
      btn.setAttribute('aria-pressed', String(on));
      const prev = FF.scenery.preview(s); prev.className = 'scene';
      btn.appendChild(prev);
      btn.insertAdjacentHTML('beforeend', `<b>${s.name}</b><small>${pickStatus(on, owned, s.cost)}</small>`);
      scenes.appendChild(btn);
    });

    if (focusKey) {
      const [a, id] = focusKey.split(':');
      const el = $('shopOv').querySelector(`[data-act="${a}"]${id ? `[data-id="${id}"]` : ''}`);
      if (el && !el.disabled) el.focus();
    }
  }

  function spend(cost) {
    if (FF.save.coins < cost) { FF.sfx.nope(); return false; }
    FF.save.coins -= cost; FF.sfx.buy();
    return true;
  }
  function wear(list, key, item) {
    const save = FF.save;
    if (!save[list].includes(item.id)) { if (!spend(item.cost)) return; save[list].push(item.id); FF.book.bought(item.name); }
    else FF.sfx.coin();
    save[key] = item.id;
  }

  $('shopOv').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    FF.sound.ensure();
    const id = b.dataset.id, save = FF.save;
    switch (b.dataset.act) {
      case 'look': if (FF.looksReached().some(l => l.look === id)) { save.basketLook = id; FF.sfx.coin(); FF.layout(); } break;
      case 'basket': {
        const got = FF.growBasket();
        if (!got) { FF.sfx.nope(); break; }
        FF.sfx.buy(); FF.book.bought('Bigger basket (' + got.to + ')');
        if (got.newLook) { FF.fx.confetti(); FF.sfx.party(); }
        FF.persist(); render(); UI.bump($('shopCoins'));
        $('shopNote').textContent = got.newLook ? 'Wow! You got a ' + FF.carrier().name.toLowerCase() + '! It carries ' + got.to + '.' : 'Now you carry ' + got.to + '!';
        FF.stickers.check();
        return;
      }
      case 'barn': { const cost = D.barn.costs[save.barnLevel]; if (cost != null && spend(cost)) { save.barnLevel++; FF.book.bought('Bigger barn'); } break; }
      case 'tree': { const t = D.trees.find(x => x.type === id); if (t && FF.treeReady(t) && spend(t.cost)) { save.trees.push(id); FF.book.bought(t.name); } break; }
      case 'up': { const u = D.upgrades.find(x => x.id === id), lvl = save.up[id]; if (u && lvl < u.costs.length && spend(u.costs[lvl])) { save.up[id]++; FF.book.bought(u.name); } break; }
      case 'wall': if (wallGoals().every(g => g.done) && spend(D.market.wallUnlock.cost)) { save.wallOwned = true; save.marketLayout = 'wall'; FF.book.bought('Barrel wall'); FF.stickers.first('wallDay', save.day); } break;
      case 'layout': if (save.wallOwned) { save.marketLayout = id; FF.sfx.coin(); } break;
      case 'skin': wear('skins', 'skin', D.skins.find(x => x.id === id)); break;
      case 'hat': wear('hats', 'hat', D.hats.find(x => x.id === id)); break;
      case 'decor': { const d = D.decorations.find(x => x.id === id); if (d && !save.decor.includes(id) && spend(d.cost)) { save.decor.push(id); FF.book.bought(d.name); FF.stickers.best('decor', save.decor.length); } break; }
      case 'scene': wear('scenes', 'scene', D.scenes.find(x => x.id === id)); break;
      case 'done': FF.shop.close(); return;
    }
    FF.stickers.check();
    FF.persist(); render(); UI.bump($('shopCoins'));
  });

  FF.shop = {
    open(origin, m) {
      FF.sound.ensure();
      from = origin; mode = TITLES[m] ? m : 'looks';
      if (mode === 'barn') FF.stickers.add('barnLooks');
      render();
      UI.show('shop');
      $('shopDone').focus({ preventScroll: true });
      $('shopOv').querySelector('.card').scrollTop = 0;
    },
    close() { FF.screens.afterShop(from); }
  };
})();
