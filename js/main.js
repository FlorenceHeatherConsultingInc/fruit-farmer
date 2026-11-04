/* Fruit Farmer: screens, input and the game loop. Start reading here.
   Flow: title -> farm (harvest until full) -> market (sell) -> shop -> farm ... */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, UI = FF.ui, $ = FF.$, I = FF.icons;
  const cv = $('game');
  const screenCtx = cv.getContext('2d');
  G.ctx = screenCtx;

  FF.layout = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = cv.getBoundingClientRect();
    G.W = Math.round(box.width); G.H = Math.round(box.height);
    cv.width = Math.round(G.W * dpr); cv.height = Math.round(G.H * dpr);
    screenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    FF.scenery.layout(); FF.farm.layout(); FF.market.layout(); FF.map.layout();
  };
  window.addEventListener('resize', FF.layout);
  FF.layout();
  $('sp-' + FF.save.speed).checked = true;

  /* ---------- Screens ---------- */
  const stat = (icon, text, cls = '') => `<span class="stat ${cls}">${icon}<span>${text}</span></span>`;

  function renderTitle() {
    const s = FF.save, n = FF.inBarn(), c = FF.carrier();
    const brandNew = s.trips === 0 && s.points === 0 && s.coins === 0;
    $('titleIntro').textContent = brandNew
      ? "You're a brand-new fruit farmer! For now you only have your hands, so you can carry 2 fruit. Catch them, then sell them at the market."
      : 'Grow your fruit farm! Catch fruit, keep it in your barn, and sell it at the market. Your basket grows as your farm levels up.';
    $('titleIntro').hidden = !brandNew;
    $('titleFarm').textContent = FF.farmName() + ' · Day ' + s.day;
    const p = FF.levelProgress();
    $('titleStats').innerHTML = stat(I.coin, s.coins + ' coins', 'coin') + stat(I.luck, 'Farm Score ' + s.lifetime) +
      `<button class="stat statbtn" type="button" id="titleLevelBtn">${I.basket}<span>Level ${p.level}: ${p.need - p.into} more points to level ${p.level + 1} ›</span></button>` +
      `<p class="note">${c.look === 'hands' ? 'Your hands hold' : 'Your ' + c.name.toLowerCase() + ' holds'} ${FF.cap()} fruit. Catch, sell and pick to earn points.</p>`;
  }


  // Choosing what to take to market. Everything in the barn starts picked.
  let picks = {}, overflow = 0, mapFrom = 'title', packFrom = null;
  // Spread the default pick across kinds, up to D.market.tripSize. Steppers can still add the rest.
  function startPicks() {
    const s = FF.save, out = {}, kinds = FF.FRUIT_TYPES.filter(t => s.barn[t] > 0);
    FF.FRUIT_TYPES.forEach(t => { out[t] = 0; });
    let left = D.market.tripSize;
    while (left > 0 && kinds.some(t => out[t] < s.barn[t])) for (const t of kinds) if (left > 0 && out[t] < s.barn[t]) { out[t]++; left--; }
    return out;
  }
  function renderPack() {
    const s = FF.save, kinds = FF.FRUIT_TYPES.filter(t => s.barn[t] > 0), total = kinds.reduce((n, t) => n + picks[t], 0);
    $('packNote').textContent = (overflow ? 'The barn is full! ' + overflow + ' fruit stayed in your basket. ' : '') +
      (kinds.length ? 'Pick what to sell. The rest stays in your barn.' : 'Your barn is empty. Go catch some fruit!');
    const all = kinds.reduce((n, t) => n + s.barn[t], 0);
    const step = (t, d) => {
      const name = FF.data.fruits[t].name, n = Math.abs(d), less = d < 0;
      const label = (n === 1 ? (less ? 'One less ' : 'One more ') : (less ? n + ' less ' : n + ' more ')) + name;
      return `<button class="mini" type="button" data-pack="${t}" data-d="${d}" aria-label="${label}" ${(less ? picks[t] > 0 : picks[t] < s.barn[t]) ? '' : 'disabled'}>${less ? '−' : '+'}${n}</button>`;
    };
    $('packRows').innerHTML = (kinds.length ? `<div class="packall"><button class="mini" type="button" data-packall="all" ${total < all ? '' : 'disabled'}>Take all</button><button class="mini" type="button" data-packall="none" ${total ? '' : 'disabled'}>Take none</button></div>` : '') +
      kinds.map(t => `<div class="up pack"><div class="badge" data-fruit="${t}"></div><div><h3>${FF.data.fruits[t].name}</h3><p>${picks[t]} of ${s.barn[t]}</p></div>` +
      `<div class="stepper">${[-10, -5, -1, 1, 5, 10].map(d => step(t, d)).join('')}</div></div>`).join('');
    kinds.forEach(t => $('packRows').querySelector(`[data-fruit="${t}"]`).appendChild(FF.draw.fruitIcon(t)));
    $('packGo').disabled = total === 0;
    $('packGo').textContent = total ? 'Go sell ' + total + ' fruit' : 'Go to market';
  }

  const fruitImg = {};
  const img = t => { if (!fruitImg[t]) fruitImg[t] = FF.draw.fruitIcon(t, 48).toDataURL(); return `<img class="ic sm" src="${fruitImg[t]}" alt="">`; };
  // What Keep picking would pick: this grove while it has fruit, then the next grove that does.
  let keepGrove = null;
  function nextPick() {
    const here = FF.farm.grove(), left = t => FF.groves.stock(t);
    if (here && left(here) > 0) return here;
    return FF.save.trees.find(t => left(t) > 0) || null;
  }
  function summaryHTML(up) {
    const s = FF.save, v = FF.farm.visit, got = FF.FRUIT_TYPES.filter(t => v.caught[t] > 0), pts = s.points - v.points;
    const bonus = Object.values(FF.farm.bonus).reduce((a, b) => a + b, 0);
    // What the barn will hold once this basket is unloaded.
    const have = t => s.barn[t] + s.crate[t], stored = FF.FRUIT_TYPES.filter(t => have(t) > 0), size = FF.barnSize();
    const total = stored.reduce((a, t) => a + have(t), 0);
    const p = FF.levelProgress(), next = p.level + 1, nextLook = FF.lookFor(next), nowLook = FF.lookFor(p.level);
    const gives = nextLook.look !== nowLook.look ? ` Then you get a ${nextLook.name.toLowerCase()} that carries ${FF.capAt(next)} fruit!` : FF.capAt(next) > FF.capAt(p.level) ? ` Then you can carry ${FF.capAt(next)} fruit.` : '';
    const newLook = up && up.newLook, row = (t, n) => `<span class="item">${img(t)}<b>${n}</b></span>`;
    return (newLook ? `<div class="newlook"><span data-look="${FF.carrier().look}"></span><b>Your new ${FF.carrier().name.toLowerCase()} carries ${FF.cap()} fruit!</b></div>` : '') +
      (up && !newLook ? `<div class="grew">You can carry <b>${FF.cap()}</b> fruit now!</div>` : '') +
      `<div class="label">You picked</div>` +
      `<div class="caught">${got.length ? got.map(t => row(t, v.caught[t])).join('') : '<span>Nothing this time.</span>'}</div>` +
      (bonus ? `<div class="pts">${bonus} of them ${bonus === 1 ? 'was a' : 'were'} sparkly bonus fruit!</div>` : '') +
      `<div class="label">Now in your barn${size === Infinity ? '' : `: ${total} of ${size}`}</div>` +
      `<div class="caught">${stored.length ? stored.map(t => row(t, have(t))).join('') : '<span>Empty</span>'}</div>` +
      `<div class="pts">You earned <b>${pts}</b> farm ${pts === 1 ? 'point' : 'points'}.</div>` +
      `<div class="lvl"><span>Level ${p.level}</span><div class="meter"><i style="width:${Math.round(100 * p.into / p.need)}%"></i></div><span>${next}</span></div>` +
      `<p class="note">${p.need - p.into} more ${p.need - p.into === 1 ? 'point' : 'points'} to level ${next}.${gives}</p>`;
  }

  /* ---------- The Basket path ---------- */
  let pathFrom = 'title';
  FF.basketPath = {
    open(origin) {
      pathFrom = origin || 'title';
      const p = FF.levelProgress(), lvl = p.level, looks = D.basketLooks, L = D.levels;
      const holds = (l, i) => { const next = looks[i + 1]; return next ? FF.capAt(l.from) + '–' + FF.capAt(next.from - 1) : FF.capAt(l.from) + '+'; };
      $('basketBody').innerHTML =
        `<div class="summary"><div class="lvl"><span>Level ${lvl}</span><div class="meter"><i style="width:${Math.round(100 * p.into / p.need)}%"></i></div><span>${lvl + 1}</span></div>` +
        `<p class="note">${p.need - p.into} more points to level ${lvl + 1}. Your ${FF.carrier().name.toLowerCase()} holds ${FF.cap()}.</p></div>` +
        `<div class="path">${looks.map((l, i) => {
          const here = FF.lookFor(lvl) === l, got = lvl >= l.from;
          return `<div class="pathrow${here ? ' on' : ''}${got ? '' : ' locked'}"><span data-look="${l.look}"></span><div><b>${l.name}</b><small>${l.from === 1 ? 'To start' : 'Level ' + l.from} · holds ${holds(l, i)}</small></div>${here ? '<span class="pill">You</span>' : got ? '<span class="pill tick">Got it</span>' : ''}</div>`;
        }).join('')}</div>` +
        `<div class="label">How to earn farm points</div><ul class="ways">` +
        `<li>Catch a fruit: ${L.pointsPerCatch}</li><li>Sell a fruit: ${L.pointsPerSale}</li><li>Pick a crop: 1</li>` +
        `<li>Deliver an order: ${D.orders.pointsPerItem} for each item</li><li>Collect goods from a kitchen: ${D.goodsPoints} each</li><li>Build a building: 10</li></ul>` +
        `<p class="note">Your basket only changes at the end of a harvest.</p>`;
      document.querySelectorAll('#basketBody [data-look]').forEach(el => el.appendChild(FF.farm.lookPreview(el.dataset.look)));
      UI.show('basket'); $('basketDone').focus({ preventScroll: true });
    },
    close() { if (pathFrom === 'map') { UI.hideAll(); Screens.backToMap(); } else Screens.title(); }
  };

  // Level-up cheers, wherever you are.
  FF.levelUp = (level, newLook) => {
    const c = FF.carrier(), fx = FF.fx;
    FF.sfx.buy();
    fx.text(G.W / 2, G.H * 0.32, 'Level ' + level + '!', true);
    setTimeout(() => fx.text(G.W / 2, G.H * 0.32 + 50, newLook ? 'Your basket became a ' + c.name + '!' : c.name + ' holds ' + FF.cap(), newLook), 450);
    if (newLook) fx.confetti();
    FF.layout(); FF.hud.load(); FF.stickers.check();
  };

  const Screens = FF.screens = {
    // The village map. Back returns to the title, or to the Sold card if that's where you came from.
    village(from, area) {
      FF.sound.ensure();
      FF.unloadBasket();
      if (G.state === 'farm') FF.farm.reset();
      const up = FF.releaseLevel();
      if (up) setTimeout(() => FF.levelUp(up.to, up.newLook), 300);
      mapFrom = from === 'sold' ? 'sold' : 'title';
      G.state = 'village';
      UI.hideAll(); clearInput();
      FF.map.start(mapFrom);
      if (area) FF.map.jump(area);
      UI.hud('village');
      Screens.backToMap();
    },
    backToMap() {
      const s = FF.save, size = FF.barnSize();
      $('mapCoins').innerHTML = `<span class="day">Day ${s.day}</span>` + UI.coinHTML(s.coins);
      const p = FF.levelProgress();
      $('mapBasketBtn').innerHTML = `<span>Lv ${p.level}</span><span class="lvbar"><i style="width:${Math.round(100 * p.into / p.need)}%"></i></span>`;
      $('mapBarnBtn').innerHTML = I.barn + '<span>' + FF.inBarn() + (size === Infinity ? '' : '/' + size) + '</span>';
      FF.guide.refresh();
      FF.hud.barn();
    },
    // Bedtime: tell the player what tomorrow brings, then start the next day.
    sleep() {
      const s = FF.save, list = [];
      const bare = s.trees.filter(t => FF.groves.stock(t) < FF.groves.holds(t));
      if (bare.length) list.push('Your trees grow more fruit.');
      if (FF.fields && FF.fields.crops().some(c => FF.fields.level(c))) list.push('Your fields grow more.');
      if (D.buildings.some(b => FF.buildings.owned(b.id) && FF.buildings.busy(b.id))) list.push('Your kitchens and animals make more.');
      $('sleepMsg').textContent = 'Tomorrow is Day ' + (s.day + 1) + '. ' + (list.join(' ') || 'A brand-new day on the farm.');
      UI.show('sleep'); $('sleepYes').focus();
    },
    toMarket() {
      FF.sound.ensure();
      overflow = FF.unloadBasket();
      if (G.state === 'farm') { G.state = 'title'; FF.farm.reset(); UI.hud(null); }
      picks = startPicks();
      renderPack();
      UI.show('pack');
      $('packGo').focus();
    },
    title() {
      FF.unloadBasket();
      G.state = 'title';
      FF.farm.reset(); FF.fx.clear();
      UI.hud(null);
      renderTitle();
      UI.show('title');
      $('harvestBtn').focus();
    },
    // A harvest round in one grove.
    farm(grove, keep) {
      FF.sound.ensure();
      const sel = document.querySelector('input[name="speed"]:checked');
      if (sel) { FF.save.speed = sel.value; FF.persist(); }
      G.state = 'farm';
      UI.hideAll();
      FF.layout();
      clearInput();
      FF.holdLevel();
      FF.farm.start(grove, keep);
      UI.hud('farm');
      FF.hud.load(); FF.hud.pin();
    },
    market(chosen) {
      packFrom = null;
      FF.sound.ensure();
      G.state = 'market';
      UI.hideAll();
      clearInput();
      UI.hud('market');
      FF.layout();
      FF.market.start(chosen);
      FF.save.trips++; FF.persist();
      FF.hud.coins();
    },
    // The end of a harvest: full, bare or Done. Shows what you caught and what the next level brings.
    showFull(why) {
      const up = FF.releaseLevel(), c = FF.carrier(), next = nextPick(), room = FF.barnSize() - FF.inBarn() - FF.carried() > 0;
      $('fullTitle').textContent = up && up.newLook ? 'New: ' + c.name + '!' : up ? 'Level ' + up.to + '!' : why === true ? 'All picked!' : why === 'done' ? 'Harvest done' : c.full;
      $('fullMsg').textContent = !room ? 'The barn is full! Sell some at the market, or build a bigger barn.' : why === true && !next ? 'Every tree is picked. They grow more fruit tomorrow.' : why === true ? 'This grove refills tomorrow.' : '';
      // One tap to carry on: the same tree if it still has fruit, otherwise the next tree that does.
      keepGrove = room ? next : null;
      $('keepBtn').hidden = !keepGrove;
      if (keepGrove) { const f = D.fruits[keepGrove].name.toLowerCase(), n = FF.groves.stock(keepGrove); $('keepBtn').textContent = (keepGrove === FF.farm.grove() ? 'Keep picking ' : 'Pick ') + f + ' (' + n + ' left)'; }
      $('fullSummary').innerHTML = summaryHTML(up);
      document.querySelectorAll('#fullSummary [data-look]').forEach(el => el.appendChild(FF.farm.lookPreview(el.dataset.look)));
      UI.show('full');
      if (up) { FF.sfx.buy(); if (up.newLook) { FF.fx.confetti(); FF.sfx.party(); } FF.stickers.check(); FF.hud.load(); }
      $(keepGrove ? 'keepBtn' : 'fullVillageBtn').focus();
    },
    showSold() {
      const earned = FF.market.earned();
      FF.book.sold();
      const left = FF.market.unsold();
      // Selling ends back in the village. The day only changes when you go to bed.
      Screens.village('sold');
      if (FF.save.legend && !FF.save.legendSeen) { FF.save.legendSeen = true; FF.persist(); FF.parade.open('sold'); return; }
      const x = FF.map.midX();
      FF.fx.text(x, 200, left ? 'Done selling!' : 'All sold!', true);
      if (earned) setTimeout(() => FF.fx.text(x, 260, '+' + earned + ' coins', true), 400);
      if (left) setTimeout(() => FF.fx.text(x, 320, left + ' back in the barn', false), 800);
      FF.fx.confetti(); FF.sfx.party();
    },
    pause() {
      if (G.state !== 'farm' || G.overlay) return;
      clearInput();
      const n = FF.carried();
      $('pauseMsg').textContent = n ? 'You are carrying ' + n + ' of ' + FF.cap() + ' fruit.' : 'You are not carrying any fruit yet.';
      UI.show('pause');
      $('resumeBtn').focus();
    },
    resume() { FF.sound.ensure(); UI.hideAll(); last = performance.now(); },
    afterShop(from) {
      if (from === 'map') { UI.hideAll(); Screens.backToMap(); FF.layout(); }
      else if (from === 'market') { UI.hideAll(); FF.market.refresh(); FF.hud.coins(); }
      else { renderTitle(); UI.show('title'); }
    },
    afterBook(from) {
      if (from === 'map' || from === 'sold') { UI.hideAll(); Screens.backToMap(); }
      else Screens.title();
    }
  };

  /* ---------- Buttons ---------- */
  function renderSoundBtns() {
    document.querySelectorAll('.soundBtn').forEach(b => {
      b.innerHTML = FF.sound.on ? I.soundOn : I.soundOff;
      b.setAttribute('aria-pressed', String(FF.sound.on));
      b.setAttribute('aria-label', FF.sound.on ? 'Sound on' : 'Sound off');
    });
  }
  renderSoundBtns();
  document.querySelectorAll('.soundBtn').forEach(b => b.addEventListener('click', () => {
    FF.sound.on = !FF.sound.on;
    if (FF.sound.on) FF.sound.ensure();
    renderSoundBtns();
  }));
  const on = (id, fn) => $(id).addEventListener('click', fn);
  on('harvestBtn', () => Screens.village('title', 'groves'));
  $('titleStats').addEventListener('click', e => { if (e.target.closest('#titleLevelBtn') && FF.basketPath) FF.basketPath.open('title'); });
  on('farmDoneBtn', () => { if (G.state === 'farm' && !G.overlay) Screens.showFull('done'); });
  on('fullVillageBtn', () => Screens.village('title', 'groves'));
  on('titleBookBtn', () => FF.book.open('title'));
  on('mapBasketBtn', () => FF.basketPath.open('map'));
  on('mapBarnBtn', () => FF.shop.open('map', 'barn'));
  on('mapBookBtn', () => FF.book.open('map'));
  on('mapFriendsBtn', () => FF.village.open());
  on('mapOrdersBtn', () => FF.orders.open('map'));
  on('mapSleepBtn', Screens.sleep);
  on('basketDone', () => FF.basketPath.close());
  on('sleepNo', () => { UI.hideAll(); Screens.backToMap(); });
  on('sleepYes', () => {
    FF.book.sleep(); UI.hideAll(); Screens.backToMap();
    FF.fx.text(FF.map.midX(), 200, 'Good morning! Day ' + FF.save.day, true); FF.sfx.star();
  });
  on('mapMarketBtn', () => { if (FF.inBarn()) { packFrom = 'map'; Screens.toMarket(); } else FF.fx.text(FF.map.midX(), 200, 'The barn is empty. Go pick some fruit!', false); });
  on('mapShopBtn', () => FF.shop.open('map'));
  on('plantDone', () => { UI.hideAll(); Screens.backToMap(); });
  $('mapJump').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) FF.map.jump(b.dataset.jump); });
  on('packGo', () => Screens.market(picks));
  on('packBack', () => { if (packFrom === 'map') { packFrom = null; UI.hideAll(); Screens.backToMap(); } else Screens.title(); });
  on('doneBtn', () => FF.market.finish());
  $('packRows').addEventListener('click', e => {
    const a = e.target.closest('[data-packall]');
    if (a) {
      FF.FRUIT_TYPES.forEach(t => { picks[t] = a.dataset.packall === 'all' ? FF.save.barn[t] || 0 : 0; });
      FF.sfx.tick(); renderPack(); return;
    }
    const b = e.target.closest('[data-pack]');
    if (!b) return;
    const t = b.dataset.pack;
    picks[t] = FF.util.clamp(picks[t] + +b.dataset.d, 0, FF.save.barn[t]);
    FF.sfx.tick(); renderPack();
  });
  on('pauseBtn', Screens.pause);
  on('resumeBtn', Screens.resume);
  on('homeBtn', () => Screens.village('title', 'groves'));
  on('keepBtn', () => { const g = keepGrove; if (!g) return; FF.unloadBasket(); Screens.farm(g, true); });
  on('shopBtn', () => FF.shop.open('market'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) Screens.pause(); });

  /* ---------- Input ---------- */
  function clearInput() {
    const inp = G.input;
    inp.keys.left = inp.keys.right = inp.pads.left = inp.pads.right = false;
    document.querySelectorAll('.pad').forEach(p => p.classList.remove('held'));
  }

  // Hold-to-move pads
  [['padL', 'left'], ['padR', 'right']].forEach(([id, side]) => {
    const el = $(id);
    const up = () => { G.input.pads[side] = false; el.classList.remove('held'); };
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); FF.sound.ensure();
      G.input.pads[side] = true; el.classList.add('held');
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  // The canvas routes pointers to whichever mode is active
  const mode = () => G.state === 'farm' ? FF.farm : G.state === 'market' ? FF.market : G.state === 'village' ? FF.map : null;
  cv.addEventListener('pointerdown', e => {
    if (G.overlay || !mode()) return;
    FF.sound.ensure();
    mode().pointerDown(e);
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => { if (!G.overlay && mode()) mode().pointerMove(e); });
  cv.addEventListener('pointerup', e => { if (!G.overlay && mode()) mode().pointerUp(e); });
  cv.addEventListener('pointercancel', e => {
    if (G.state === 'farm') FF.farm.pointerUp(e);
    else if (G.state === 'market') FF.market.pointerCancel(e);
    else if (G.state === 'village') FF.map.pointerCancel(e);
  });

  const isLeft = k => k === 'ArrowLeft' || k === 'a' || k === 'A';
  const isRight = k => k === 'ArrowRight' || k === 'd' || k === 'D';
  window.addEventListener('keydown', e => {
    const k = e.key;
    if (G.state === 'village' && !G.overlay && (isLeft(k) || isRight(k))) {
      const areas = FF.data.map.areas.map(a => a.id), i = areas.indexOf(FF.map.areaAt());
      FF.map.jump(areas[FF.util.clamp(i + (isLeft(k) ? -1 : 1), 0, areas.length - 1)]); e.preventDefault(); return;
    }
    if (G.state === 'farm' && !G.overlay) {
      if (isLeft(k)) { G.input.keys.left = true; e.preventDefault(); }
      else if (isRight(k)) { G.input.keys.right = true; e.preventDefault(); }
      else if (k === 'p' || k === 'P' || k === 'Escape') Screens.pause();
    } else if (G.state === 'market' && !G.overlay && (k === ' ' || k === 'Enter')) {
      if (!e.repeat) { FF.sound.ensure(); FF.market.keyThrow(); }
      e.preventDefault();
    } else if (G.state === 'market' && !G.overlay && (isLeft(k) || isRight(k) || k === 'ArrowUp' || k === 'ArrowDown')) {
      FF.sound.ensure();
      FF.market.nudge(isLeft(k) ? -1 : isRight(k) ? 1 : 0, k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0);
      e.preventDefault();
    } else if (G.overlay === 'pause' && (k === 'p' || k === 'P' || k === 'Escape')) Screens.resume();
  });
  window.addEventListener('keyup', e => {
    if (isLeft(e.key)) G.input.keys.left = false;
    if (isRight(e.key)) G.input.keys.right = false;
  });
  window.addEventListener('blur', () => { G.input.keys.left = G.input.keys.right = false; });

  /* ---------- Game loop ---------- */
  let last = performance.now();
  let lastError = '';
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    G.clock += dt;
    try {
      if (G.state === 'title') FF.farm.update(dt, true);
      else if (G.state === 'village') { if (!G.overlay) FF.map.update(dt); }
      else if (!G.overlay) (G.state === 'farm' ? FF.farm : FF.market).update(dt, false);
      else if (G.overlay === 'full') { FF.fx.update(dt); FF.scenery.update(dt); }
      if (G.overlay === 'parade') FF.parade.tick(dt);
      if (G.state === 'market') FF.market.draw(); else if (G.state === 'village') FF.map.draw(); else FF.farm.draw(G.state === 'title');
    } catch (e) {
      // Keep playing. Note the error once (in the console and in this browser) so it can be fixed.
      G.ctx = screenCtx; G.ctx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
      const msg = String(e && e.stack || e).slice(0, 600);
      if (msg !== lastError) { lastError = msg; console.error(e); try { localStorage.setItem('fruitfarmer.lastError', new Date().toISOString() + ' ' + G.state + ' ' + msg); } catch (x) {} }
    }
  }
  // If the browser drops the drawing surface (low memory on a phone), set it up again.
  cv.addEventListener('contextrestored', () => FF.layout());
  Screens.title();
  requestAnimationFrame(frame);

  // Add to Home Screen and offline play only work from a web address, not a double-clicked file.
  if (location.protocol !== 'file:') {
    const link = document.createElement('link');
    link.rel = 'manifest'; link.href = 'manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
