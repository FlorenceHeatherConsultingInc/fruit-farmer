/* Fruit Farmer: the shop. Everything for sale comes from the tables in data.js. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  let from = 'title';

  const buyBtn = (act, id, cost, label) =>
    `<button class="mini" type="button" data-act="${act}" data-id="${id}" ${FF.save.coins >= cost ? '' : 'disabled'} aria-label="${label} for ${cost} coins">${I.coin}${cost}</button>`;
  const ownedBtn = text => `<button class="mini owned" type="button" disabled>${text}</button>`;
  const pips = (on, total) => `<div class="pips" aria-label="Level ${on} of ${total}">${Array.from({ length: total }, (_, i) => `<span class="pip${i < on ? ' on' : ''}"></span>`).join('')}</div>`;
  const pickStatus = (on, owned, cost) => on ? 'Using' : owned ? 'Use it' : I.coin + cost;

  const wallGoals = () => {
    const save = FF.save, W = D.market.wallUnlock, kinds = save.trees.length;
    return [
      { text: 'Get the ' + D.carriers[W.tier].name, done: save.tier >= W.tier },
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

  function render() {
    const save = FF.save, fa = document.activeElement;
    const focusKey = fa && fa.dataset && fa.dataset.act ? fa.dataset.act + ':' + (fa.dataset.id || '') : '';
    $('shopCoins').innerHTML = UI.coinHTML(save.coins);

    const cur = FF.carrier(), nx = D.carriers[save.tier + 1];
    $('shopCarry').innerHTML =
      `<div class="up"><div class="badge">${I.basket}</div><div><h3>${nx ? nx.name : cur.name}</h3>` +
      `<p>${nx ? 'Holds ' + nx.cap + ' fruit and is easier to catch with. Right now you can carry ' + cur.cap + '.' : 'Your biggest! It holds ' + cur.cap + ' fruit.'}</p>` +
      pips(save.tier, D.carriers.length - 1) + `</div>` +
      (nx ? buyBtn('tier', 'next', nx.cost, 'Buy ' + nx.name) : ownedBtn('Max')) + `</div>`;

    const trees = $('shopTrees'); trees.innerHTML = '';
    D.trees.filter(t => t.cost).forEach(t => {
      const row = document.createElement('div'); row.className = 'up';
      const badge = document.createElement('div'); badge.className = 'badge'; badge.appendChild(FF.draw.fruitIcon(t.type));
      row.appendChild(badge);
      row.insertAdjacentHTML('beforeend', `<div><h3>${t.name}</h3><p>${D.fruits[t.type].name} start falling in your orchard. They sell for ${D.fruits[t.type].price} coins each.</p></div>` +
        (save.trees.includes(t.type) ? ownedBtn('Planted') : buyBtn('tree', t.type, t.cost, 'Plant ' + t.name)));
      trees.appendChild(row);
    });

    renderMarket();

    $('shopUps').innerHTML = D.upgrades.map(u => {
      const lvl = save.up[u.id], max = lvl >= u.costs.length;
      return `<div class="up"><div class="badge">${I[u.icon]}</div><div><h3>${u.name}</h3><p>${u.desc}</p>${pips(lvl, u.costs.length)}</div>` +
        (max ? ownedBtn('Max') : buyBtn('up', u.id, u.costs[lvl], 'Buy ' + u.name)) + `</div>`;
    }).join('');

    $('shopSkins').innerHTML = D.skins.map(s => {
      const owned = save.skins.includes(s.id), on = save.skin === s.id;
      const bg = s.rainbow ? `linear-gradient(${D.rainbow.join(',')})` : s.body;
      return `<button class="pick${on ? ' on' : ''}" type="button" data-act="skin" data-id="${s.id}" ${owned || save.coins >= s.cost ? '' : 'disabled'} aria-pressed="${on}">` +
        `<span class="sw" style="background:${bg}"></span><b>${s.name}</b><small>${pickStatus(on, owned, s.cost)}</small></button>`;
    }).join('');

    const scenes = $('shopScenes'); scenes.innerHTML = '';
    D.scenes.forEach(s => {
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
      case 'tier': { const nx = D.carriers[save.tier + 1]; if (nx && spend(nx.cost)) { save.tier++; FF.book.bought(nx.name); FF.layout(); } break; }
      case 'tree': { const t = D.trees.find(x => x.type === id); if (t && !save.trees.includes(id) && spend(t.cost)) { save.trees.push(id); FF.book.bought(t.name); } break; }
      case 'up': { const u = D.upgrades.find(x => x.id === id), lvl = save.up[id]; if (u && lvl < u.costs.length && spend(u.costs[lvl])) { save.up[id]++; FF.book.bought(u.name); } break; }
      case 'wall': if (wallGoals().every(g => g.done) && spend(D.market.wallUnlock.cost)) { save.wallOwned = true; save.marketLayout = 'wall'; FF.book.bought('Barrel wall'); } break;
      case 'layout': if (save.wallOwned) { save.marketLayout = id; FF.sfx.coin(); } break;
      case 'skin': wear('skins', 'skin', D.skins.find(x => x.id === id)); break;
      case 'scene': wear('scenes', 'scene', D.scenes.find(x => x.id === id)); break;
      case 'done': FF.shop.close(); return;
    }
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
