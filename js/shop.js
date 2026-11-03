/* Fruit Farmer: the shop. Everything for sale comes from the tables in data.js. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let from = 'title';

  const buyBtn = (act, id, cost, label) =>
    `<button class="mini" type="button" data-act="${act}" data-id="${id}" ${FF.save.coins >= cost ? '' : 'disabled'} aria-label="${label} for ${cost} coins">${I.coin}${cost}</button>`;
  const ownedBtn = text => `<button class="mini owned" type="button" disabled>${text}</button>`;
  const closedBtn = () => `<button class="mini" type="button" disabled>Not here</button>`;
  const pips = (on, total) => `<div class="pips" aria-label="Level ${on} of ${total}">${Array.from({ length: total }, (_, i) => `<span class="pip${i < on ? ' on' : ''}"></span>`).join('')}</div>`;
  const pickStatus = (on, owned, cost) => on ? 'Using' : owned ? 'Use it' : I.coin + cost;

  const wallGoals = () => {
    const save = FF.save, W = D.market.wallUnlock, kinds = save.trees.length;
    return [
      { text: 'Reach farm level ' + W.level, done: FF.level() >= W.level },
      { text: 'Grow ' + W.fruitKinds + ' kinds of fruit (' + Math.min(kinds, W.fruitKinds) + '/' + W.fruitKinds + ')', done: kinds >= W.fruitKinds },
      { text: 'Fill ' + W.filled + ' baskets (' + Math.min(save.filled, W.filled) + '/' + W.filled + ')', done: save.filled >= W.filled }
    ];
  };
  const animalBadge = kind => FF.draw.toCanvas(84, 84, s => FF.animals.drawHead(kind, s / 2, s * 0.56, s * 0.3, 'idle', 0, { x: 0, y: 0.4 }));

  function renderMarket() {
    const save = FF.save, box = $('shopMarket'), goals = wallGoals(), W = D.market.wallUnlock;
    box.innerHTML = '';
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

  function renderSeeds() {
    const save = FF.save, box = $('shopSeedsSec');
    box.hidden = !save.seeds && !save.seedBuys.length && save.farmNo === 1;
    $('shopSeedsLabel').textContent = 'Golden Seeds: ' + save.seeds;
    $('shopSeeds').innerHTML = D.seedShop.map(x => {
      const has = save.seedBuys.includes(x.id);
      return `<div class="up"><div class="badge">${I.luck}</div><div><h3>${x.name}</h3><p>${x.desc}</p></div>` +
        (has ? ownedBtn('Owned') : `<button class="mini" type="button" data-act="seed" data-id="${x.id}" ${save.seeds >= x.cost ? '' : 'disabled'} aria-label="Buy ${x.name} for ${x.cost} seeds">${x.cost} seeds</button>`) + `</div>`;
    }).join('');
  }

  function render() {
    const save = FF.save, fa = document.activeElement;
    const focusKey = fa && fa.dataset && fa.dataset.act ? fa.dataset.act + ':' + (fa.dataset.id || '') : '';
    $('shopCoins').innerHTML = UI.coinHTML(save.coins);

    const cur = FF.carrier(), prog = FF.levelProgress(), size = FF.barnSize(), next = D.barn.sizes[save.barnLevel + 1];
    const carry = $('shopCarry');
    carry.innerHTML = `<p class="note">Farm level ${prog.level}: ${cur.name} ${'★'.repeat(Math.min(cur.tier, 5))} holds ${FF.cap()}. ${prog.need - prog.into} more farm points to level ${prog.level + 1}.</p><div class="grid3" id="shopLooks"></div>` +
      `<div class="up"><div class="badge">${I.stall}</div><div><h3>Barn</h3><p>${FF.inBarn()} fruit stored. ${size === Infinity ? 'Holds as much as you like.' : 'Holds ' + size + '.'}${next ? ' Next: ' + (next === Infinity ? 'no limit' : next) + '.' : ''}</p></div>` +
      (next ? buyBtn('barn', 'next', D.barn.costs[save.barnLevel], 'Buy a bigger barn') : ownedBtn('Max')) + `</div>`;
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
    D.trees.filter(t => t.cost).forEach(t => {
      const row = document.createElement('div'); row.className = 'up';
      const badge = document.createElement('div'); badge.className = 'badge'; badge.appendChild(FF.draw.fruitIcon(t.type));
      row.appendChild(badge);
      row.insertAdjacentHTML('beforeend', `<div><h3>${t.name}</h3><p>${D.fruits[t.type].name} start falling in your orchard. They sell for ${D.fruits[t.type].price} coins each.</p></div>` +
        (save.trees.includes(t.type) ? ownedBtn('Planted') : save.challenge === 'apples' ? closedBtn() : buyBtn('tree', t.type, t.cost, 'Plant ' + t.name)));
      trees.appendChild(row);
    });

    renderMarket();
    renderSeeds();
    $('shopFilters').innerHTML = FF.groves.shopHTML(buyBtn, closedBtn);
    save.trees.forEach(t => { const b = $('shopFilters').querySelector(`[data-fruit="${t}"]`); if (b) b.appendChild(FF.draw.fruitIcon(t)); });

    $('shopUps').innerHTML = D.upgrades.map(u => {
      const lvl = save.up[u.id], max = lvl >= u.costs.length;
      return `<div class="up"><div class="badge">${I[u.icon]}</div><div><h3>${u.name}</h3><p>${u.desc}</p>${pips(lvl, u.costs.length)}</div>` +
        (max ? ownedBtn('Max') : u.id === 'magnet' && save.challenge === 'nomagnet' ? closedBtn() : buyBtn('up', u.id, u.costs[lvl], 'Buy ' + u.name)) + `</div>`;
    }).join('');

    $('shopSkins').innerHTML = D.skins.filter(s => !s.reward || save.skins.includes(s.id)).map(s => {
      const owned = save.skins.includes(s.id), on = save.skin === s.id;
      const bg = s.rainbow ? `linear-gradient(${D.rainbow.join(',')})` : s.body;
      return `<button class="pick${on ? ' on' : ''}" type="button" data-act="skin" data-id="${s.id}" ${owned || save.coins >= s.cost ? '' : 'disabled'} aria-pressed="${on}">` +
        `<span class="sw" style="background:${bg}"></span><b>${s.name}</b><small>${pickStatus(on, owned, s.cost)}</small></button>`;
    }).join('');

    const scenes = $('shopScenes'); scenes.innerHTML = '';
    D.scenes.filter(s => !s.reward || save.scenes.includes(s.id)).forEach(s => {
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
      case 'barn': { const cost = D.barn.costs[save.barnLevel]; if (cost != null && spend(cost)) { save.barnLevel++; FF.book.bought('Bigger barn'); } break; }
      case 'tree': { const t = D.trees.find(x => x.type === id); if (t && !save.trees.includes(id) && spend(t.cost)) { save.trees.push(id); FF.book.bought(t.name); } break; }
      case 'up': { const u = D.upgrades.find(x => x.id === id), lvl = save.up[id]; if (u && lvl < u.costs.length && spend(u.costs[lvl])) { save.up[id]++; FF.book.bought(u.name); } break; }
      case 'wall': if (wallGoals().every(g => g.done) && spend(D.market.wallUnlock.cost)) { save.wallOwned = true; save.marketLayout = 'wall'; FF.book.bought('Barrel wall'); FF.stickers.first('wallDay', save.day); } break;
      case 'layout': if (save.wallOwned) { save.marketLayout = id; FF.sfx.coin(); } break;
      case 'filter': if (FF.groves.filtersAllowed() && spend(D.filters.cost[id])) { save.filters[id] = (save.filters[id] || 0) + D.filters.bundle; FF.book.bought(D.fruits[id].name + ' filters'); } break;
      case 'seed': {
        const x = D.seedShop.find(i => i.id === id);
        if (x && !save.seedBuys.includes(id) && save.seeds >= x.cost) {
          save.seeds -= x.cost; save.seedBuys.push(id); FF.sfx.buy();
          if (x.scene) save.scenes.push(x.scene);
        }
        break;
      }
      case 'skin': wear('skins', 'skin', D.skins.find(x => x.id === id)); break;
      case 'scene': wear('scenes', 'scene', D.scenes.find(x => x.id === id)); break;
      case 'done': FF.shop.close(); return;
    }
    FF.stickers.check();
    FF.persist(); render(); UI.bump($('shopCoins'));
  });

  FF.shop = {
    open(origin) {
      FF.sound.ensure();
      from = origin;
      render();
      UI.show('shop');
      $('shopDone').focus({ preventScroll: true });
      $('shopOv').querySelector('.card').scrollTop = 0;
    },
    close() { FF.screens.afterShop(from); }
  };
})();
