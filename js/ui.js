/* Fruit Farmer: interface helpers. Icons, overlay cards and the heads-up display. */
(() => {
  const FF = window.FF, G = FF.G;
  const $ = FF.$ = id => document.getElementById(id);

  FF.icons = {
    coin: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#ffd23f" stroke="#2b2350" stroke-width="3"/><circle cx="16" cy="16" r="7" fill="none" stroke="#d9a400" stroke-width="2.5"/></svg>',
    apple: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 9c-2-2-9-2-10 5s4 14 10 13c6 1 11-6 10-13s-8-7-10-5z" fill="#e8322f" stroke="#2b2350" stroke-width="2.5"/><path d="M16 9c0-3 1-5 3-6" stroke="#2b2350" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="5" rx="4" ry="2" transform="rotate(-25 22 5)" fill="#5cc24a" stroke="#2b2350" stroke-width="2"/></svg>',
    speed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#ffd23f" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/></svg>',
    magnet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4z" fill="#ff3b5c" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><path d="M5 4h4v3H5zM15 4h4v3h-4z" fill="#e6ecf2" stroke="#2b2350" stroke-width="2"/></svg>',
    luck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#ffd23f" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/></svg>',
    basket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10a5 5 0 0 1 10 0" stroke="#2b2350" stroke-width="2.2" fill="none"/><path d="M3 10h18l-2.5 10h-13z" fill="#cf8f4e" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><path d="M5 14h14M8 10v10M12 10v10M16 10v10" stroke="#a8692c" stroke-width="1.4"/></svg>',
    stall: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l2-5h14l2 5z" fill="#ff6b6b" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><path d="M9 4l-1 5M15 4l1 5" stroke="#fffaf0" stroke-width="2"/><rect x="5" y="9" width="14" height="11" fill="#fffaf0" stroke="#2b2350" stroke-width="2"/><rect x="10" y="13" width="4" height="7" fill="#cf8f4e"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6z" fill="#ffd23f" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#2b2350" stroke-width="2" fill="none"/></svg>',
    tree: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="10.5" y="13" width="3" height="8" fill="#8a5a32" stroke="#2b2350" stroke-width="1.5"/><circle cx="12" cy="9" r="7" fill="#5cbf4a" stroke="#2b2350" stroke-width="2"/><circle cx="9" cy="8" r="1.4" fill="#e8322f"/><circle cx="14" cy="11" r="1.4" fill="#e8322f"/><circle cx="14.5" cy="6.5" r="1.4" fill="#e8322f"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3a8.5 8.5 0 1 0 6 13.5A7 7 0 0 1 15 3z" fill="#ffe680" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><circle cx="19" cy="5" r="1.2" fill="#2b2350"/></svg>',
    orders: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="18" rx="2" fill="#fffaf0" stroke="#2b2350" stroke-width="2"/><rect x="8" y="2" width="8" height="4" rx="1.5" fill="#cf8f4e" stroke="#2b2350" stroke-width="1.8"/><path d="M8 11l2 2 4-4M8 17h8" stroke="#3f9530" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#ff5e7a" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H4z" fill="#4aa3e8" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><path d="M20 4h-7a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h7z" fill="#7fc0f0" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/></svg>',
    field: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="15" width="20" height="7" rx="2" fill="#9a6a3a" stroke="#2b2350" stroke-width="2"/><path d="M7 15V7M12 15V4M17 15V7" stroke="#2b2350" stroke-width="2" stroke-linecap="round"/><ellipse cx="7" cy="7" rx="2" ry="3" fill="#e8c25a" stroke="#2b2350" stroke-width="1.6"/><ellipse cx="12" cy="5" rx="2" ry="3" fill="#ffd23f" stroke="#2b2350" stroke-width="1.6"/><ellipse cx="17" cy="7" rx="2" ry="3" fill="#e8c25a" stroke="#2b2350" stroke-width="1.6"/></svg>',
    barn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 11l3-5 7-3 7 3 3 5z" fill="#6e2a2a" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><rect x="3" y="11" width="18" height="10" fill="#d9443c" stroke="#2b2350" stroke-width="2"/><rect x="8" y="14" width="8" height="7" fill="#fff0d0" stroke="#2b2350" stroke-width="1.6"/><path d="M8 14l8 7M16 14l-8 7" stroke="#d9443c" stroke-width="1.6"/></svg>',
    pot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6c0-2 1-3 2-3M12 6c0-2 1-3 2-3" stroke="#9aa6b8" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="3" y="9" width="18" height="3" rx="1.5" fill="#ff9a1f" stroke="#2b2350" stroke-width="2"/><path d="M4.5 12h15l-1.5 8a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5z" fill="#ff6b6b" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/></svg>',
    house: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12l10-8 10 8z" fill="#ff6b6b" stroke="#2b2350" stroke-width="2" stroke-linejoin="round"/><rect x="5" y="12" width="14" height="9" fill="#fff0d0" stroke="#2b2350" stroke-width="2"/><rect x="10" y="15" width="4" height="6" fill="#a8692c" stroke="#2b2350" stroke-width="1.6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const OVERLAYS = ['title', 'pause', 'full', 'sold', 'shop', 'book', 'village', 'parade', 'pack', 'grove', 'orders', 'build', 'plant', 'sleep', 'basket'];
  FF.ui = {
    show(id) { OVERLAYS.forEach(o => { $(o + 'Ov').hidden = o !== id; }); G.overlay = id; },
    hideAll() { OVERLAYS.forEach(o => { $(o + 'Ov').hidden = true; }); G.overlay = null; },
    hud(which) {
      $('farmHud').hidden = which !== 'farm';
      $('pads').hidden = which !== 'farm';
      $('farmDay').hidden = which !== 'farm';
      $('farmDay').textContent = 'Day ' + FF.save.day;
      $('marketHud').hidden = which !== 'market';
      $('mapHud').hidden = which !== 'village';
      $('mapJump').hidden = which !== 'village';
      $('mapTools').hidden = which !== 'village';
      if (which !== 'village') $('mapTip').hidden = true;
      $('farmPin').hidden = which !== 'farm' || !FF.orders.hudText();
    },
    bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); },
    coinHTML: n => FF.icons.coin + '<span>' + n + '</span>'
  };

  FF.hud = {
    load(bump) {
      const n = FF.carried(), c = FF.cap();
      $('load').textContent = n + '/' + c;
      $('loadChip').classList.toggle('full', n >= c);
      if (bump) FF.ui.bump($('loadChip'));
    },
    // The pinned order's counter during a harvest; the Done button glows once it's filled.
    pin() {
      const text = FF.orders.hudText();
      $('farmPin').textContent = text; $('farmPin').hidden = !text || FF.G.state !== 'farm';
      $('farmDoneBtn').classList.toggle('glow', FF.orders.pinFilled());
    },
    coins(bump) {
      $('coinChip').innerHTML = FF.ui.coinHTML(FF.save.coins);
      if (bump) FF.ui.bump($('coinChip'));
    }
  };

  // Static icons in the markup
  $('loadIcon').innerHTML = FF.icons.apple;
  [['mapSleepBtn', 'moon'], ['mapMarketBtn', 'stall'], ['mapShopBtn', 'bag'], ['mapOrdersBtn', 'orders'], ['mapFriendsBtn', 'heart'], ['mapBookBtn', 'book']].forEach(([id, ic]) => { $(id).insertAdjacentHTML('afterbegin', FF.icons[ic]); });
  const AREA_ICONS = { groves: 'tree', fields: 'field', barnyard: 'barn', kitchen: 'pot', friends: 'house' };
  document.querySelectorAll('#mapJump [data-jump]').forEach(b => { b.innerHTML = FF.icons[AREA_ICONS[b.dataset.jump]]; });
  $('pauseBtn').innerHTML = FF.icons.pause;
  $('shopBtn').innerHTML = FF.icons.bag;
  $('padL').innerHTML = FF.icons.left;
  $('padR').innerHTML = FF.icons.right;
})();
