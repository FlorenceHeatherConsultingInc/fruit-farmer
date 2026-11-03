/* Fruit Farmer: the Farm Book. Each trip is a day: everything you harvest, sell and buy goes on
   today's page, and the page closes when you come back to the village after selling.
   Score adds up coins earned, which never goes down, so spending doesn't hurt it. Today, this week
   and this month add up across all farms. Starting a new farm keeps old pages and cosmetics. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  const PAGE_STEP = 15, MAX_PAGES = 500;
  let from = 'title', tab = 'score', shown = PAGE_STEP, confirmNew = false, period = null, confirmRemove = null, confirmWipe = false;
  // Everything that belongs to one farm. The rest (score, friends, stickers, looks, seeds) is shared.
  const FARM_KEYS = ['coins', 'crate', 'barn', 'points', 'groves', 'filters', 'orders', 'pin', 'buildings', 'plots', 'up', 'trips', 'trees', 'marketLayout', 'wallOwned', 'wallRevealed', 'filled', 'day', 'farmEarned', 'diary', 'today', 'farmNo', 'farmName', 'challenge', 'seedsPaid'];

  const dateKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const blankDay = () => ({ date: dateKey(), harvest: {}, sales: {}, bought: [], perfect: 0, earned: 0, sold: false });
  const today = () => FF.save.today || (FF.save.today = blankDay());
  const hasEntries = t => t.earned > 0 || t.bought.length > 0 || Object.keys(t.harvest).length > 0;

  /* ---------- Recording ---------- */
  function earn(coins) {
    const s = FF.save, key = dateKey();
    s.farmEarned += coins; s.lifetime += coins; today().earned += coins;
    s.byDate[key] = (s.byDate[key] || 0) + coins;
    if (!s.legend && s.lifetime >= D.ranks[D.ranks.length - 1].score) { s.legend = true; today().legend = true; }
  }
  function closeDay() {
    const s = FF.save, t = today();
    if (!hasEntries(t)) return;
    delete t.sold;
    s.diary = s.diary.concat({ day: s.day, ...t }).slice(-MAX_PAGES);
    s.bestDay = Math.max(s.bestDay, t.earned);
    const fruits = new Set(Object.values(t.sales).map(x => x.fruit));
    if (fruits.size === 1 && Object.values(t.sales).reduce((n, x) => n + x.n, 0) >= 5) FF.stickers.add('oneFruitDay');
    s.day++; s.today = blankDay();
  }

  /* ---------- Numbers ---------- */
  function sumSince(start) {
    const from = dateKey(start);
    return Object.entries(FF.save.byDate).reduce((n, [k, v]) => k >= from ? n + v : n, 0);
  }
  function totals() {
    const now = new Date(), week = new Date(now), monday = (now.getDay() + 6) % 7;
    week.setDate(now.getDate() - monday);
    return { day: sumSince(now), week: sumSince(week), month: sumSince(new Date(now.getFullYear(), now.getMonth(), 1)) };
  }
  const rankOf = n => D.ranks.filter(r => n >= r.score).pop();

  /* ---------- Small icons, drawn once ---------- */
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iconCache = {};
  function picture(key, paint) {
    if (!iconCache[key]) iconCache[key] = paint().toDataURL();
    return `<img class="ic" src="${iconCache[key]}" alt="">`;
  }
  const fruitPic = t => picture('f' + t, () => FF.draw.fruitIcon(t, 48));
  const animalPic = k => picture('a' + k, () => FF.draw.toCanvas(56, 56, s => FF.animals.drawHead(k, s / 2, s * 0.58, s * 0.3, 'idle', 0, { x: 0, y: 0.3 })));
  const stat = (label, n, id) => id
    ? `<button type="button" class="tile${period === id ? ' on' : ''}" data-book="period-${id}" aria-pressed="${period === id}"><small>${label} ›</small><b>${n}</b></button>`
    : `<div class="tile"><small>${label}</small><b>${n}</b></div>`;

  /* ---------- Pages ---------- */
  function pageHTML(p, title) {
    const fruit = Object.entries(p.harvest), sales = Object.values(p.sales);
    return `<article class="page"><h3>${title}</h3>` +
      (fruit.length ? `<div class="row"><span>Picked</span>${fruit.map(([t, n]) => `<span class="item">${fruitPic(t)}×${n}</span>`).join('')}</div>` : '') +
      sales.map(x => `<div class="row">${animalPic(x.animal)}<span>${FF.friends.name(x.animal)} bought</span><span class="item">${fruitPic(x.fruit)}×${x.n}</span><span class="pay">${I.coin}${x.coins}</span></div>`).join('') +
      (p.perfect ? `<div class="row"><span>${p.perfect} Perfect ${p.perfect > 1 ? 'shots' : 'shot'}!</span></div>` : '') +
      (p.bought.length ? `<div class="row"><span>Got: ${p.bought.join(', ')}</span></div>` : '') +
      (p.delivered && p.delivered.length ? `<div class="row"><span>Delivered orders to ${p.delivered.join(', ')}</span></div>` : '') +
      (p.legend ? `<div class="row"><b>Became a Fruit Legend! The whole village held a parade.</b></div>` : '') +
      (p.earned ? `<div class="row total"><span>Earned</span><span class="pay">${I.coin}${p.earned}</span></div>` : '') +
      `</article>`;
  }
  // The days behind a tile: one bar per calendar date, with the game days played on it.
  function periodHTML(id) {
    const now = new Date(), dates = [];
    if (id === 'day') dates.push(new Date(now));
    else if (id === 'week') { const mon = new Date(now); mon.setDate(now.getDate() - (now.getDay() + 6) % 7); for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); dates.push(d); } }
    else for (let i = 1; i <= now.getDate(); i++) dates.push(new Date(now.getFullYear(), now.getMonth(), i));
    const s = FF.save, pages = s.diary.concat(hasEntries(today()) ? [{ day: s.day, ...today() }] : []);
    const rows = dates.map(d => { const k = dateKey(d); const days = pages.filter(p => p.date === k).map(p => p.day); return { d, coins: s.byDate[k] || 0, days }; });
    const top = Math.max(1, ...rows.map(r => r.coins)), name = d => d.toLocaleDateString(undefined, id === 'month' ? { day: 'numeric' } : { weekday: 'short' });
    const dayText = days => days.length ? 'Day' + (days.length > 1 ? 's ' + days[0] + '–' + days[days.length - 1] : ' ' + days[0]) : '';
    return `<div class="period"><div class="pbars${id === 'month' ? ' many' : ''}">${rows.map(r => `<div class="pbar"><span style="height:${Math.round(100 * r.coins / top)}%"></span><small>${name(r.d)}</small></div>`).join('')}</div>` +
      `<ul class="plist">${rows.filter(r => r.coins).reverse().map(r => `<li><span>${r.d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span>${dayText(r.days)}</span><span class="pay">${I.coin}${r.coins}</span></li>`).join('') || '<li>No coins earned yet.</li>'}</ul></div>`;
  }
  function scoreHTML() {
    const s = FF.save, t = totals(), rank = rankOf(s.lifetime), next = D.ranks.find(r => r.score > s.lifetime);
    return `<div class="score"><small>Farm Score</small><b>${s.lifetime}</b><span class="rank">${rank.name}</span>` +
      (next ? `<small>${next.score - s.lifetime} more to ${next.name}</small>` : '') + `</div>` +
      `<p class="note">Your Farm Score is every coin you have ever earned, on all your farms. Spending never lowers it.</p>` +
      `<ol class="ranks">${D.ranks.map(r => `<li class="${r === rank ? 'on' : s.lifetime >= r.score ? 'got' : ''}"><b>${r.name}</b><small>${r.score.toLocaleString()}</small></li>`).join('')}</ol>` +
      `<div class="tiles">${stat('Today', t.day, 'day')}${stat('This week', t.week, 'week')}${stat('This month', t.month, 'month')}${stat('All time', s.lifetime)}${stat('This farm', s.farmEarned)}${stat('Best day', s.bestDay)}</div>` +
      (period ? periodHTML(period) : '<p class="note">Tap Today, This week or This month to see the days behind it. These count coins by the real date.</p>') +
      `<div class="label">What resets?</div><p class="note">Your Farm Score, stickers, friends and looks stay forever. Coins, trees, buildings, fields and orders belong to one farm and start over on a new farm.</p>` +
      (s.legend ? `<button class="btn secondary" type="button" data-book="parade">Watch the parade</button>` : '') +
      `<p class="note">Farm ${s.farmNo}, day ${s.day}${s.challenge ? ' · ' + challengeName(s.challenge) : ''} · ${s.seeds} Golden Seeds</p>`;
  }
  function diaryHTML() {
    const s = FF.save, t = today(), pages = s.diary.slice().reverse();
    const open = hasEntries(t) ? pageHTML(t, 'Day ' + s.day + ' (today)') : '';
    const list = pages.slice(0, shown).map(p => pageHTML(p, 'Day ' + p.day)).join('');
    if (!open && !list) return `<p class="note">Nothing yet. Go pick some fruit!</p>`;
    return open + list + (pages.length > shown ? `<button class="btn secondary" type="button" data-book="more">Show older days</button>` : '');
  }
  // One card per farm: the one you're on, farms you can go back to, and old finished farms.
  function farmCard(f, kind) {
    const name = f.farmName || 'Farm ' + (f.farmNo || f.no), key = kind === 'old' ? 'old-' + f.no : f.farmNo;
    const info = kind === 'old' ? `Finished · ${f.days} ${f.days === 1 ? 'day' : 'days'}` : `Day ${f.day} · Level ${FF.levelOfPoints(f.points || 0)} · ${I.coin}${f.coins || 0}`;
    const btns = kind === 'now' ? `<span class="pill">Playing</span>`
      : confirmRemove === String(key) ? `<button class="mini" type="button" data-book="removeyes-${key}">Yes, remove it</button><button class="mini" type="button" data-book="removeno">Keep</button>`
      : (kind === 'other' ? `<button class="mini" type="button" data-book="switch-${key}">Play</button>` : '') + `<button class="mini" type="button" data-book="remove-${key}">Remove</button>`;
    return `<div class="farmcard${kind === 'now' ? ' on' : ''}"><div><b>${esc(name)}</b><small>${f.challenge ? challengeName(f.challenge) + ' · ' : ''}${info}</small><small>Earned ${I.coin}${f.farmEarned != null ? f.farmEarned : f.earned}</small></div><div class="farmbtns">${btns}</div></div>`;
  }
  function farmsHTML() {
    const s = FF.save;
    return `<div class="label">Your farms</div><div class="farms">` + farmCard(s, 'now') + s.otherFarms.map(f => farmCard(f, 'other')).join('') + s.pastFarms.map(f => farmCard(f, 'old')).join('') + `</div>` +
      (confirmNew
        ? `<p class="note">Start a new farm? This one stays in your list so you can come back to it${Math.max(0, seedsFromFarm() - FF.save.seedsPaid) ? `, and it earns you <b>${Math.max(0, seedsFromFarm() - FF.save.seedsPaid)} Golden Seeds</b>` : ''}. You keep your friends, stickers, colors and scenery.</p>` +
          `<button class="btn primary" type="button" data-book="newyes">Regular farm</button>` +
          `<div class="label">Challenge farms pay double seeds</div><div class="rows">${D.challenges.map(c => `<button class="choice" type="button" data-book="ch-${c.id}"><b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>` +
          `<button class="btn secondary" type="button" data-book="newno">Keep this farm</button>`
        : `<button class="btn secondary" type="button" data-book="new">Start a new farm</button>`) +
      (FF.board.enabled() ? FF.board.saveHTML() : '') +
      `<div class="label">Start over from nothing</div>` +
      (confirmWipe
        ? `<p class="note">This removes <b>everything</b>: every farm, your friends, stickers, looks and Farm Score. It can't be undone. Press and hold the red button to start over.</p>` +
          `<button class="btn danger hold" type="button" id="wipeHold"><span class="fillbar"></span><span>Hold to start over</span></button>` +
          `<button class="btn secondary" type="button" data-book="wipeno">Keep everything</button>`
        : `<button class="btn secondary" type="button" data-book="wipe">Start over from nothing</button>`);
  }
  function render() {
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    $('bookBody').innerHTML = tab === 'score' ? scoreHTML() : tab === 'diary' ? diaryHTML() : tab === 'family' ? FF.board.html() : tab === 'stickers' ? FF.stickers.html() : farmsHTML();
  }

  /* ---------- New farm ---------- */
  function seedsFromFarm() {
    const s = FF.save, base = Math.floor(Math.sqrt(s.farmEarned / D.seeds.per));
    return s.challenge ? base * D.seeds.challengePay : base;
  }
  const challengeName = id => { const c = D.challenges.find(x => x.id === id); return c ? c.name : ''; };

  function newFarm(challenge) {
    const s = FF.save, n = FF.freshSave();
    closeDay();
    const seeds = Math.max(0, seedsFromFarm() - s.seedsPaid);
    s.seeds += seeds; s.seedsPaid += seeds;
    s.otherFarms.push(stash());
    const next = Math.max(s.farmNo, ...s.otherFarms.map(f => f.farmNo), ...s.pastFarms.map(f => f.no || 0)) + 1;
    FARM_KEYS.forEach(k => { s[k] = n[k] === undefined ? null : JSON.parse(JSON.stringify(n[k])); });
    s.farmNo = next; s.seedsPaid = 0;
    s.challenge = challenge || null;
    if (s.seedBuys.includes('start-basket')) s.points = FF.pointsFor(5);
    if (s.seedBuys.includes('start-tree') && challenge !== 'apples') s.trees.push('orange');
    if (challenge === 'wallrush') { s.wallOwned = true; s.wallRevealed = true; s.marketLayout = 'wall'; }
    FF.stickers.check();
    FF.persist(); FF.layout();
  }

  // A copy of the current farm's own things, to put away while you play another.
  const stash = () => JSON.parse(JSON.stringify(Object.fromEntries(FARM_KEYS.map(k => [k, FF.save[k] === undefined ? null : FF.save[k]]))));
  function switchFarm(no) {
    const s = FF.save, i = s.otherFarms.findIndex(f => String(f.farmNo) === String(no));
    if (i < 0) return false;
    closeDay();
    const target = s.otherFarms.splice(i, 1)[0], fresh = FF.freshSave();
    s.otherFarms.push(stash());
    FARM_KEYS.forEach(k => { s[k] = target[k] != null ? target[k] : JSON.parse(JSON.stringify(fresh[k] === undefined ? null : fresh[k])); });
    FF.FRUIT_TYPES.forEach(t => { s.crate[t] = s.crate[t] || 0; s.barn[t] = s.barn[t] || 0; });
    s.otherFarms.sort((a, b) => a.farmNo - b.farmNo);
    FF.stickers.check(); FF.persist(); FF.layout();
    return true;
  }
  function removeFarm(key) {
    const s = FF.save;
    if (key.startsWith('old-')) s.pastFarms = s.pastFarms.filter(f => String(f.no) !== key.slice(4));
    else s.otherFarms = s.otherFarms.filter(f => String(f.farmNo) !== key);
    confirmRemove = null; FF.persist();
  }
  function wipe() { FF.wipeSave(); location.reload(); }

  function startOver(challenge) { confirmNew = false; newFarm(challenge); FF.sfx.party(); from = 'title'; FF.book.close(); }

  let holdTimer = null;
  const endHold = () => { clearTimeout(holdTimer); holdTimer = null; const b = $('wipeHold'); if (b) b.classList.remove('holding'); };
  $('bookOv').addEventListener('pointerdown', e => {
    const b = e.target.closest('#wipeHold');
    if (!b) return;
    b.classList.add('holding'); holdTimer = setTimeout(wipe, 2000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => $('bookOv').addEventListener(t, endHold));

  $('bookOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.dataset.tab) {
      tab = b.dataset.tab; shown = PAGE_STEP; confirmNew = false; FF.sfx.tick(); render();
      $('bookOv').querySelector('.card').scrollTop = 0;
      if (tab === 'family') FF.board.opened();
      return;
    }
    if (b.dataset.board) { FF.board.act(b.dataset.board); return; }
    if (b.dataset.sticker) { FF.stickers.act(b.dataset.sticker); return; }
    switch (b.dataset.book) {
      case 'done': FF.book.close(); break;
      case 'more': shown += PAGE_STEP; render(); break;
      case 'period-day': case 'period-week': case 'period-month': { const id = b.dataset.book.slice(7); period = period === id ? null : id; FF.sfx.tick(); render(); break; }
      case 'new': confirmNew = true; render(); break;
      case 'newno': confirmNew = false; render(); break;
      case 'newyes': startOver(); break;
      case 'removeno': confirmRemove = null; render(); break;
      case 'wipe': confirmWipe = true; render(); break;
      case 'wipeno': confirmWipe = false; render(); break;
      case 'parade': FF.parade.open(from === 'sold' ? 'sold' : 'title'); break;
      default: {
        const act = b.dataset.book || '';
        if (act.startsWith('ch-')) startOver(act.slice(3));
        else if (act.startsWith('switch-')) { if (switchFarm(act.slice(7))) { FF.sfx.party(); from = 'title'; FF.book.close(); } }
        else if (act.startsWith('removeyes-')) { removeFarm(act.slice(10)); FF.sfx.tick(); render(); }
        else if (act.startsWith('remove-')) { confirmRemove = act.slice(7); render(); }
      }
    }
  });

  FF.book = {
    dateKey,
    refresh: () => render(),
    esc: t => esc(t),
    harvest(type) { const t = today(); t.harvest[type] = (t.harvest[type] || 0) + 1; },
    sale(animal, fruit, coins, perfect) {
      const t = today(), key = animal + '|' + fruit, row = t.sales[key] || (t.sales[key] = { animal, fruit, n: 0, coins: 0 });
      row.n++; row.coins += coins;
      if (perfect) t.perfect++;
      earn(coins);
    },
    bonus: earn,
    bought(name) { today().bought.push(name); },
    delivered(name) { const t = today(); (t.delivered || (t.delivered = [])).push(name); },
    sold() { today().sold = true; FF.persist(); FF.board.sync(); FF.board.backup(); },
    startDay() { if (today().sold) { closeDay(); FF.stickers.check(); FF.persist(); } },
    // Going to bed ends the day even if nothing happened in it.
    sleep() { const d = FF.save.day; closeDay(); if (FF.save.day === d) { FF.save.day++; FF.save.today = blankDay(); } FF.stickers.check(); FF.persist(); },
    open(origin) {
      FF.sound.ensure();
      from = origin; tab = 'score'; shown = PAGE_STEP; confirmNew = false; period = null; confirmRemove = null; confirmWipe = false;
      FF.stickers.check();
      $('familyTab').hidden = !FF.board.enabled();
      render();
      UI.show('book');
      $('bookDone').focus({ preventScroll: true });
    },
    close() { FF.screens.afterBook(from); },
    switchFarm, removeFarm, wipe
  };
})();
