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
    FF.scenery.layout(); FF.farm.layout(); FF.market.layout();
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
    $('titleStats').innerHTML =
      stat(I.coin, s.coins, 'coin') +
      stat(I.basket, 'Level ' + FF.level() + ' · ' + c.name + ' ' + '★'.repeat(Math.min(c.tier, 5)) + ' · holds ' + FF.cap()) +
      stat(I.stall, 'Barn: ' + n + (n === 1 ? ' fruit' : ' fruit')) +
      stat(I.tree, s.trees.length + (s.trees.length > 1 ? ' trees' : ' tree'));
    $('titleSpecial').textContent = UI.specialText();
    $('titleMarketBtn').hidden = n === 0;
    $('titleMarketBtn').innerHTML = I.stall + ' Go to market';
  }

  function showSoldCard() {
    $('soldStats').innerHTML = stat(I.coin, FF.save.coins, 'coin');
    UI.show('sold');
    FF.fx.confetti(); FF.sfx.party();
    $('soldShopBtn').focus();
  }

  // Choosing what to take to market. Everything in the barn starts picked.
  let picks = {}, overflow = 0;
  function renderPack() {
    const s = FF.save, kinds = FF.FRUIT_TYPES.filter(t => s.barn[t] > 0), total = kinds.reduce((n, t) => n + picks[t], 0);
    $('packNote').textContent = (overflow ? 'The barn is full! ' + overflow + ' fruit stayed in your basket. ' : '') +
      (kinds.length ? 'Pick what to sell. The rest stays in your barn.' : 'Your barn is empty. Go catch some fruit!');
    $('packRows').innerHTML = kinds.map(t => `<div class="up pack"><div class="badge" data-fruit="${t}"></div><div><h3>${FF.data.fruits[t].name}</h3><p>${picks[t]} of ${s.barn[t]}</p></div>` +
      `<div class="stepper"><button class="mini" type="button" data-pack="${t}" data-d="-1" aria-label="One less ${FF.data.fruits[t].name}" ${picks[t] ? '' : 'disabled'}>−</button><button class="mini" type="button" data-pack="${t}" data-d="1" aria-label="One more ${FF.data.fruits[t].name}" ${picks[t] < s.barn[t] ? '' : 'disabled'}>+</button></div></div>`).join('');
    kinds.forEach(t => $('packRows').querySelector(`[data-fruit="${t}"]`).appendChild(FF.draw.fruitIcon(t)));
    $('packGo').disabled = total === 0;
    $('packGo').textContent = total ? 'Go sell ' + total + ' fruit' : 'Go to market';
  }

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
    toMarket() {
      FF.sound.ensure();
      overflow = FF.unloadBasket();
      if (G.state === 'farm') { G.state = 'title'; FF.farm.reset(); UI.hud(null); }
      picks = { ...FF.save.barn };
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
    farm() {
      FF.sound.ensure();
      FF.book.startDay();
      const sel = document.querySelector('input[name="speed"]:checked');
      if (sel) { FF.save.speed = sel.value; FF.persist(); }
      G.state = 'farm';
      UI.hideAll();
      FF.layout();
      clearInput();
      FF.farm.start();
      UI.hud('farm');
      $('farmSpecial').textContent = UI.specialText();
      FF.hud.load();
    },
    market(chosen) {
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
    showFull() {
      $('fullTitle').textContent = FF.carrier().full;
      $('fullMsg').textContent = 'Take your ' + FF.carried() + ' fruit to the market and sell them!';
      UI.show('full');
      $('goMarketBtn').focus();
    },
    showSold() {
      const earned = FF.market.earned();
      FF.book.sold();
      if (FF.save.legend && !FF.save.legendSeen) { FF.save.legendSeen = true; FF.persist(); FF.parade.open('sold'); return; }
      const left = FF.market.unsold();
      $('soldTitle').textContent = left ? 'All done!' : 'Sold out!';
      $('soldMsg').textContent = (earned ? 'You earned ' + earned + ' coins this trip. ' : '') + (left ? left + ' fruit went back to the barn.' : earned ? 'Nice throwing!' : 'All your fruit is sold.');
      showSoldCard();
      $('soldShopBtn').focus();
    },
    pause() {
      if (G.state !== 'farm' || G.overlay) return;
      clearInput();
      const n = FF.carried();
      $('pauseMsg').textContent = n ? 'You are carrying ' + n + ' of ' + FF.cap() + ' fruit.' : 'You are not carrying any fruit yet.';
      $('pauseMarketBtn').hidden = n === 0;
      UI.show('pause');
      $('resumeBtn').focus();
    },
    resume() { FF.sound.ensure(); UI.hideAll(); last = performance.now(); },
    afterShop(from) {
      if (from === 'market') { UI.hideAll(); FF.market.refresh(); FF.hud.coins(); }
      else if (from === 'sold') { $('soldStats').innerHTML = stat(I.coin, FF.save.coins, 'coin'); UI.show('sold'); }
      else { renderTitle(); UI.show('title'); }
    },
    afterBook(from) {
      if (from === 'sold') { $('soldStats').innerHTML = stat(I.coin, FF.save.coins, 'coin'); UI.show('sold'); }
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
  on('harvestBtn', Screens.farm);
  on('titleShopBtn', () => FF.shop.open('title'));
  on('titleBookBtn', () => FF.book.open('title'));
  on('titleVillageBtn', () => FF.village.open('title'));
  on('soldVillageBtn', () => FF.village.open('sold'));
  on('soldBookBtn', () => FF.book.open('sold'));
  on('titleMarketBtn', Screens.toMarket);
  on('toMarketBtn', Screens.toMarket);
  on('packGo', () => Screens.market(picks));
  on('packBack', Screens.title);
  on('doneBtn', () => FF.market.finish());
  $('packRows').addEventListener('click', e => {
    const b = e.target.closest('[data-pack]');
    if (!b) return;
    const t = b.dataset.pack;
    picks[t] = FF.util.clamp(picks[t] + +b.dataset.d, 0, FF.save.barn[t]);
    FF.sfx.tick(); renderPack();
  });
  on('pauseBtn', Screens.pause);
  on('resumeBtn', Screens.resume);
  on('pauseMarketBtn', Screens.toMarket);
  on('homeBtn', Screens.title);
  on('goMarketBtn', Screens.toMarket);
  on('soldShopBtn', () => FF.shop.open('sold'));
  on('soldFarmBtn', Screens.farm);
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
  const mode = () => G.state === 'farm' ? FF.farm : G.state === 'market' ? FF.market : null;
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
  });

  const isLeft = k => k === 'ArrowLeft' || k === 'a' || k === 'A';
  const isRight = k => k === 'ArrowRight' || k === 'd' || k === 'D';
  window.addEventListener('keydown', e => {
    const k = e.key;
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
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    G.clock += dt;
    if (G.state === 'title') FF.farm.update(dt, true);
    else if (!G.overlay) (G.state === 'farm' ? FF.farm : FF.market).update(dt, false);
    else if (G.overlay === 'sold' || G.overlay === 'full') { FF.fx.update(dt); FF.scenery.update(dt); }
    if (G.overlay === 'village') FF.village.tick();
    if (G.overlay === 'parade') FF.parade.tick(dt);
    if (G.state === 'market') FF.market.draw(); else FF.farm.draw(G.state === 'title');
    requestAnimationFrame(frame);
  }
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
