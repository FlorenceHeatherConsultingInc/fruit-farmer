/* Fruit Farmer: the Farm Book. Each trip is a day: everything you harvest, sell and buy goes on
   today's page, and the page closes when you head back out to harvest after selling.
   Score adds up coins earned, which never goes down, so spending doesn't hurt it. Today, this week
   and this month add up across all farms. Starting a new farm keeps old pages and cosmetics. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui;
  const PAGE_STEP = 15, MAX_PAGES = 500;
  let from = 'title', tab = 'score', shown = PAGE_STEP, confirmNew = false;

  const dateKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const blankDay = () => ({ date: dateKey(), harvest: {}, sales: {}, bought: [], perfect: 0, earned: 0, sold: false });
  const today = () => FF.save.today || (FF.save.today = blankDay());
  const hasEntries = t => t.earned > 0 || t.bought.length > 0 || Object.keys(t.harvest).length > 0;

  /* ---------- Recording ---------- */
  function earn(coins) {
    const s = FF.save, key = dateKey();
    s.farmEarned += coins; s.lifetime += coins; today().earned += coins;
    s.byDate[key] = (s.byDate[key] || 0) + coins;
  }
  function closeDay() {
    const s = FF.save, t = today();
    if (!hasEntries(t)) return;
    delete t.sold;
    t.special = FF.special();
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
  const iconCache = {};
  function picture(key, paint) {
    if (!iconCache[key]) iconCache[key] = paint().toDataURL();
    return `<img class="ic" src="${iconCache[key]}" alt="">`;
  }
  const fruitPic = t => picture('f' + t, () => FF.draw.fruitIcon(t, 48));
  const animalPic = k => picture('a' + k, () => FF.draw.toCanvas(56, 56, s => FF.animals.drawHead(k, s / 2, s * 0.58, s * 0.3, 'idle', 0, { x: 0, y: 0.3 })));
  const stat = (label, n) => `<div class="tile"><small>${label}</small><b>${n}</b></div>`;

  /* ---------- Pages ---------- */
  function pageHTML(p, title) {
    const fruit = Object.entries(p.harvest), sales = Object.values(p.sales);
    const sp = p.special;
    return `<article class="page"><h3>${title}</h3>` +
      (sp ? `<div class="row">${animalPic(sp.animal)}<span>craved</span>${fruitPic(sp.fruit)}</div>` : '') +
      (fruit.length ? `<div class="row"><span>Picked</span>${fruit.map(([t, n]) => `<span class="item">${fruitPic(t)}×${n}</span>`).join('')}</div>` : '') +
      sales.map(x => `<div class="row">${animalPic(x.animal)}<span>${FF.friends.name(x.animal)} bought</span><span class="item">${fruitPic(x.fruit)}×${x.n}</span><span class="pay">${I.coin}${x.coins}</span></div>`).join('') +
      (p.perfect ? `<div class="row"><span>${p.perfect} Perfect ${p.perfect > 1 ? 'shots' : 'shot'}!</span></div>` : '') +
      (p.bought.length ? `<div class="row"><span>Got: ${p.bought.join(', ')}</span></div>` : '') +
      (p.earned ? `<div class="row total"><span>Earned</span><span class="pay">${I.coin}${p.earned}</span></div>` : '') +
      `</article>`;
  }
  function scoreHTML() {
    const s = FF.save, t = totals(), rank = rankOf(s.lifetime), next = D.ranks.find(r => r.score > s.lifetime);
    return `<div class="score"><small>Farm Score</small><b>${s.lifetime}</b><span class="rank">${rank.name}</span>` +
      (next ? `<small>${next.score - s.lifetime} more to ${next.name}</small>` : '') + `</div>` +
      `<div class="tiles">${stat('Today', t.day)}${stat('This week', t.week)}${stat('This month', t.month)}${stat('All time', s.lifetime)}${stat('This farm', s.farmEarned)}${stat('Best day', s.bestDay)}</div>` +
      `<p class="note">Farm ${s.farmNo}, day ${s.day}${s.challenge ? ' · ' + challengeName(s.challenge) : ''} · ${s.seeds} Golden Seeds</p>`;
  }
  function diaryHTML() {
    const s = FF.save, t = today(), pages = s.diary.slice().reverse();
    const open = hasEntries(t) ? pageHTML(t, 'Day ' + s.day + ' (today)') : '';
    const list = pages.slice(0, shown).map(p => pageHTML(p, 'Day ' + p.day)).join('');
    if (!open && !list) return `<p class="note">Nothing yet. Go pick some fruit!</p>`;
    return open + list + (pages.length > shown ? `<button class="btn secondary" type="button" data-book="more">Show older days</button>` : '');
  }
  function farmsHTML() {
    const s = FF.save, farms = s.pastFarms.map(f => ({ ...f, now: false })).concat({ no: s.farmNo, days: s.day, earned: s.farmEarned, challenge: s.challenge, now: true });
    farms.sort((a, b) => b.earned - a.earned);
    return `<div class="label">My best farms</div><ol class="board">` +
      farms.map(f => `<li class="${f.now ? 'on' : ''}"><b>Farm ${f.no}</b><span>${f.challenge ? challengeName(f.challenge) + ', ' : ''}${f.days} ${f.days === 1 ? 'day' : 'days'}</span><span class="pay">${I.coin}${f.earned}</span></li>`).join('') + `</ol>` +
      (confirmNew
        ? `<p class="note">Start over? This farm earns you <b>${seedsFromFarm()} Golden Seeds</b>. You keep your friends, village, stickers, colors and scenery.</p>` +
          `<button class="btn primary" type="button" data-book="newyes">Regular farm</button>` +
          `<div class="label">Challenge farms pay double seeds</div><div class="rows">${D.challenges.map(c => `<button class="choice" type="button" data-book="ch-${c.id}"><b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>` +
          `<button class="btn secondary" type="button" data-book="newno">Keep this farm</button>`
        : `<button class="btn secondary" type="button" data-book="new">Start a new farm</button>`) +
      (FF.board.enabled() ? FF.board.saveHTML() : '');
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
    s.seeds += seedsFromFarm();
    s.pastFarms.push({ no: s.farmNo, days: Math.max(1, s.day - 1), earned: s.farmEarned, diary: s.diary, challenge: s.challenge });
    ['coins', 'crate', 'tier', 'up', 'trips', 'trees', 'marketLayout', 'wallOwned', 'wallRevealed', 'filled', 'day', 'farmEarned', 'diary', 'today'].forEach(k => { s[k] = n[k]; });
    s.farmNo++;
    s.challenge = challenge || null;
    if (s.seedBuys.includes('start-basket')) s.tier = 1;
    if (s.seedBuys.includes('start-tree') && challenge !== 'apples') s.trees.push('orange');
    if (challenge === 'wallrush') { s.wallOwned = true; s.wallRevealed = true; s.marketLayout = 'wall'; }
    FF.stickers.check();
    FF.persist(); FF.layout();
  }

  function startOver(challenge) { confirmNew = false; newFarm(challenge); FF.sfx.party(); from = 'title'; FF.book.close(); }

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
      case 'new': confirmNew = true; render(); break;
      case 'newno': confirmNew = false; render(); break;
      case 'newyes': startOver(); break;
      default: if (b.dataset.book && b.dataset.book.startsWith('ch-')) startOver(b.dataset.book.slice(3));
    }
  });

  FF.book = {
    dateKey,
    refresh: () => render(),
    esc: t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    harvest(type) { const t = today(); t.harvest[type] = (t.harvest[type] || 0) + 1; },
    sale(animal, fruit, coins, perfect) {
      const t = today(), key = animal + '|' + fruit, row = t.sales[key] || (t.sales[key] = { animal, fruit, n: 0, coins: 0 });
      row.n++; row.coins += coins;
      if (perfect) t.perfect++;
      earn(coins);
    },
    bonus: earn,
    bought(name) { today().bought.push(name); },
    sold() { today().sold = true; FF.persist(); FF.board.sync(); FF.board.backup(); },
    startDay() { if (today().sold) { closeDay(); FF.stickers.check(); FF.persist(); } },
    open(origin) {
      FF.sound.ensure();
      from = origin; tab = 'score'; shown = PAGE_STEP; confirmNew = false;
      FF.stickers.check();
      $('familyTab').hidden = !FF.board.enabled();
      render();
      UI.show('book');
      $('bookDone').focus({ preventScroll: true });
    },
    close() { FF.screens.afterBook(from); }
  };
})();
