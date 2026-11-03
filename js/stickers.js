/* Fruit Farmer: the Sticker Book. Each sticker in D.stickerPages watches one number and is earned
   when that number reaches its goal. Most numbers are counters kept in save.stats; the rest are read
   from the save below. Stickers never go away, and filling a page unlocks a reward you can't buy. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$;
  const PAGES = D.stickerPages, TOAST_MS = 2600;
  let queue = [], showing = false, page = 0, picked = null;

  const stat = name => FF.save.stats[name] || 0;
  const count = (list, f) => list.filter(f).length;
  // Numbers that already live somewhere in the save.
  const READ = {
    hearts: () => FF.friends.totalHearts(),
    homes: () => FF.friends.homesBuilt(),
    bestFriends: () => count(Object.keys(D.animals), k => FF.friends.hearts(k) === D.friendship.hearts.length),
    met: () => FF.friends.available().length,
    decor: () => FF.save.decor.length,
    bestDay: () => FF.save.bestDay,
    lifetime: () => FF.save.lifetime,
    farmDay: () => FF.save.day,
    level: () => FF.level(),
    kinds: () => FF.save.trees.length,
    farms: () => FF.save.farmNo,
    crowns: () => FF.save.crownWeeks.length,
    ribbons: () => FF.save.ribbonWeeks.length,
    joined: () => (FF.save.family && FF.save.family.code ? 1 : 0),
    saved: () => (FF.save.backup ? 1 : 0),
    playDays: () => Object.keys(FF.save.byDate).length
  };
  const value = s => (READ[s.stat] ? READ[s.stat]() : stat(s.stat));
  // "Within" stickers want a low number, like reaching the wall by a certain day.
  const done = s => (s.within ? stat(s.stat) > 0 && stat(s.stat) <= s.within : value(s) >= s.n);
  const allStickers = () => PAGES.flatMap(p => p.stickers);
  const owned = id => FF.save.stickers.includes(id);
  const hasReward = id => { const p = PAGES.find(x => x.reward === id); return !!p && p.stickers.every(s => owned(s.id)); };

  function givePage(p) {
    const s = FF.save, r = D.stickerRewards[p.reward];
    if (r.skin && !s.skins.includes(r.skin)) s.skins.push(r.skin);
    if (r.scene && !s.scenes.includes(r.scene)) s.scenes.push(r.scene);
    queue.push({ page: p, text: 'Page done! ' + r.name });
  }
  function check() {
    const s = FF.save;
    if (!s) return;
    let any = false;
    for (const p of PAGES) {
      const before = p.stickers.every(x => owned(x.id));
      for (const k of p.stickers) if (!owned(k.id) && done(k)) { s.stickers.push(k.id); queue.push({ sticker: k }); any = true; }
      if (!before && p.stickers.every(x => owned(x.id))) givePage(p);
    }
    if (any) { FF.persist(); nextToast(); }
  }
  function nextToast() {
    if (showing || !queue.length) return;
    showing = true;
    const box = $('stickerToast'), item = queue.shift();
    const extra = queue.length > 2 ? queue.splice(0).length : 0;
    box.innerHTML = item.sticker ? `${picture(item.sticker.icon)}<span><small>New sticker!</small><b>${item.sticker.name}</b>${extra ? `<small>and ${extra} more</small>` : ''}</span>` : `<span><b>${item.text}</b></span>`;
    box.hidden = false;
    FF.sfx.star();
    setTimeout(() => { box.hidden = true; showing = false; nextToast(); }, TOAST_MS);
  }

  /* ---------- Pictures ---------- */
  const pics = {};
  function picture(icon) {
    if (!pics[icon]) {
      const paint = D.animals[icon]
        ? FF.draw.toCanvas(64, 64, s => FF.animals.drawHead(icon, s / 2, s * 0.58, s * 0.3, 'happy', 0, { x: 0, y: 0.3 }))
        : FF.draw.fruitIcon(icon, 64);
      pics[icon] = paint.toDataURL();
    }
    return `<img class="ic" src="${pics[icon]}" alt="">`;
  }

  /* ---------- The Stickers tab ---------- */
  function html() {
    const p = PAGES[page], got = count(p.stickers, s => owned(s.id)), total = FF.save.stickers.length;
    const info = picked && p.stickers.find(s => s.id === picked);
    const reward = D.stickerRewards[p.reward];
    return `<div class="periods sixes">${PAGES.map((x, i) => `<button type="button" data-sticker="page-${i}" aria-pressed="${i === page}" aria-label="${x.name}">${picture(x.icon)}<small>${count(x.stickers, s => owned(s.id))}/${x.stickers.length}</small></button>`).join('')}</div>` +
      `<div class="pagehead"><h3>${p.name}</h3><span class="pay">${got}/${p.stickers.length}</span></div>` +
      `<div class="stickers">${p.stickers.map(s => `<button type="button" class="sticker ${owned(s.id) ? 'got' : ''}" data-sticker="${s.id}" aria-label="${s.name}">${picture(s.icon)}</button>`).join('')}</div>` +
      `<p class="note">${info ? `<b>${info.name}</b>: ${owned(info.id) ? 'Earned!' : info.within ? 'Not yet' : `${Math.min(value(info), info.n)}/${info.n}`}` : 'Tap a sticker to see how to earn it.'}</p>` +
      `<p class="note">Fill this page to unlock: <b>${reward.name}</b>${hasReward(p.reward) ? ' (unlocked!)' : ''}</p>` +
      `<p class="note">${total} of ${allStickers().length} stickers</p>`;
  }

  FF.stickers = {
    html, check, hasReward,
    add(name, n = 1) { const s = FF.save.stats; s[name] = (s[name] || 0) + n; },
    best(name, n) { const s = FF.save.stats; s[name] = Math.max(s[name] || 0, n); },
    first(name, n) { const s = FF.save.stats; if (!s[name] || n < s[name]) s[name] = n; },
    act(name) {
      if (name.startsWith('page-')) { page = +name.slice(5); picked = null; }
      else { picked = name; FF.sfx.tick(); }
      FF.book.refresh();
    }
  };
})();
