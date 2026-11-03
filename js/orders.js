/* Fruit Farmer: the order board. Three friends always have an order up: some fruit (and later,
   goods) for more coins than the market, plus hearts and farm points. Orders never expire; "Not
   today" swaps one for a new one. Pin an order and the harvest counts toward it, pausing shakes
   once you have everything. Numbers live in D.orders. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, { randi, pick } = FF.util;
  const O = D.orders;
  let from = 'map', cheered = null;

  // What orders can ask for: fruit you grow, plus anything a later step adds (goods, crops).
  const sources = () => FF.save.trees.concat(FF.orderExtras ? FF.orderExtras() : []);
  const have = t => FF.save.barn[t] + (FF.G.state === 'farm' ? FF.save.crate[t] : 0);
  const ready = o => Object.entries(o.items).every(([t, n]) => FF.save.barn[t] >= n);
  const pinned = () => FF.save.orders.find(o => o.id === FF.save.pin) || null;

  function make() {
    const s = FF.save, used = s.orders.map(o => o.animal), pool = FF.friends.available().filter(k => !used.includes(k));
    const kinds = Math.min(sources().length, FF.level() >= 12 ? 3 : FF.level() >= 5 ? 2 : 1);
    const items = {}, list = sources().slice();
    for (let i = 0; i < kinds; i++) {
      const t = list.splice(Math.floor(Math.random() * list.length), 1)[0];
      const cheap = D.fruits[t].price >= 8 ? 0.35 : 1;   // goods are pricier, so ask for fewer
      items[t] = Math.max(1, randi(2, Math.max(3, Math.round(FF.cap() * 0.45 * cheap))));
    }
    const value = Object.entries(items).reduce((n, [t, k]) => n + D.fruits[t].price * k, 0);
    const animal = pick(pool.length ? pool : FF.friends.available());
    return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), animal, items, coins: Math.round(value * O.payBonus) + O.base };
  }
  function fill() { while (FF.save.orders.length < O.count) FF.save.orders.push(make()); }

  function deliver(id) {
    const s = FF.save, o = s.orders.find(x => x.id === id);
    if (!o || !ready(o)) return;
    let count = 0;
    for (const [t, n] of Object.entries(o.items)) { s.barn[t] -= n; count += n; for (let i = 0; i < n; i++) FF.friends.sell(o.animal, t); }
    s.coins += o.coins; FF.book.bonus(o.coins); FF.book.delivered(FF.friends.name(o.animal));
    FF.addPoints(count * O.pointsPerItem);
    FF.stickers.add('orders'); FF.stickers.add('orderItems', count);
    s.orders = s.orders.filter(x => x !== o); if (s.pin === id) s.pin = null;
    fill(); FF.stickers.check(); FF.persist();
    FF.sfx.buy(); FF.fx.confetti();
    return o;
  }

  /* ---------- The board ---------- */
  const pics = {};
  const pic = t => { if (!pics[t]) pics[t] = FF.draw.fruitIcon(t, 48).toDataURL(); return `<img class="ic sm" src="${pics[t]}" alt="">`; };
  const animalPic = k => { const key = 'a' + k; if (!pics[key]) pics[key] = FF.draw.toCanvas(56, 56, s => FF.animals.drawHead(k, s / 2, s * 0.58, s * 0.3, 'happy', 0, { x: 0, y: 0.3 })).toDataURL(); return `<img class="ic" src="${pics[key]}" alt="">`; };
  const itemsHTML = o => Object.entries(o.items).map(([t, n]) => `<span class="item${FF.save.barn[t] >= n ? ' got' : ''}">${pic(t)}${Math.min(FF.save.barn[t], n)}/${n}</span>`).join('');
  function render(note) {
    fill();
    $('ordersCoins').innerHTML = UI.coinHTML(FF.save.coins);
    $('ordersNote').textContent = note || 'Orders wait as long as you like. Pin one and your harvest counts toward it.';
    $('ordersList').innerHTML = FF.save.orders.map(o => {
      const on = FF.save.pin === o.id, can = ready(o);
      return `<div class="order${on ? ' pinned' : ''}"><div class="row">${animalPic(o.animal)}<div class="grow"><b>${FF.friends.name(o.animal)}</b><div class="items">${itemsHTML(o)}</div></div><span class="pill">${I.coin}${o.coins}</span></div>` +
        `<div class="orderbtns"><button class="mini" type="button" data-order="deliver" data-id="${o.id}" ${can ? '' : 'disabled'}>Deliver</button>` +
        `<button class="mini ${on ? 'owned' : ''}" type="button" data-order="pin" data-id="${o.id}" aria-pressed="${on}">${on ? 'Pinned' : 'Pin'}</button>` +
        `<button class="mini" type="button" data-order="skip" data-id="${o.id}">Not today</button></div></div>`;
    }).join('');
  }
  $('ordersOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.id === 'ordersDone') { FF.orders.close(); return; }
    const id = b.dataset.id, s = FF.save;
    if (b.dataset.order === 'deliver') { const o = deliver(id); if (o) render(FF.friends.name(o.animal) + ' says thank you! +' + o.coins + ' coins.'); return; }
    if (b.dataset.order === 'pin') { s.pin = s.pin === id ? null : id; cheered = null; FF.sfx.tick(); }
    if (b.dataset.order === 'skip') { s.orders = s.orders.filter(o => o.id !== id); if (s.pin === id) s.pin = null; FF.sfx.tick(); }
    FF.persist(); render();
  });

  FF.orders = {
    open(origin) { FF.sound.ensure(); from = origin || 'map'; render(); UI.show('orders'); $('ordersDone').focus({ preventScroll: true }); },
    close() { UI.hideAll(); if (from === 'title') FF.screens.title(); else FF.screens.backToMap(); },
    reset() { FF.save.orders = []; FF.save.pin = null; },
    readyCount: () => { fill(); return FF.save.orders.filter(ready).length; },
    // The grove card line for a pinned order that wants this grove's fruit.
    pinLine(type) {
      const o = pinned();
      if (!o || !o.items[type]) return '';
      return `Pinned: ${FF.friends.name(o.animal)} wants ${o.items[type]} ${D.fruits[type].name.toLowerCase()}. You have ${Math.min(FF.save.barn[type], o.items[type])}.`;
    },
    // The harvest's counter for the pinned order.
    hudText() {
      const o = pinned();
      if (!o) return '';
      return FF.friends.name(o.animal) + ': ' + Object.entries(o.items).map(([t, n]) => `${D.fruits[t].name} ${Math.min(have(t), n)}/${n}`).join(', ');
    },
    pinFilled() { const o = pinned(); return !!o && Object.entries(o.items).every(([t, n]) => have(t) >= n); },
    // Called after each catch: one cheer when the pinned order has everything.
    caught() {
      const o = pinned();
      if (o && cheered !== o.id && FF.orders.pinFilled()) {
        cheered = o.id;
        FF.fx.text(FF.G.W / 2, FF.G.H * 0.35, 'Got everything for ' + FF.friends.name(o.animal) + '!', true);
        FF.sfx.star();
      }
    }
  };
})();
