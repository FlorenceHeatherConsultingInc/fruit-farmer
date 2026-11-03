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
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const OVERLAYS = ['title', 'pause', 'full', 'sold', 'shop', 'book', 'village', 'parade', 'pack', 'grove', 'orders', 'build', 'plant'];
  FF.ui = {
    show(id) { OVERLAYS.forEach(o => { $(o + 'Ov').hidden = o !== id; }); G.overlay = id; },
    hideAll() { OVERLAYS.forEach(o => { $(o + 'Ov').hidden = true; }); G.overlay = null; },
    hud(which) {
      $('farmHud').hidden = which !== 'farm';
      $('pads').hidden = which !== 'farm';
      $('farmSpecial').hidden = which !== 'farm';
      $('marketHud').hidden = which !== 'market';
      $('mapHud').hidden = which !== 'village';
      $('mapJump').hidden = which !== 'village';
      $('farmPin').hidden = which !== 'farm' || !FF.orders.hudText();
    },
    specialText() {
      const sp = FF.special(), name = FF.data.fruits[sp.fruit].name.toLowerCase(), who = FF.friends.name(sp.animal);
      return who + ' is craving ' + name + '! Double pay today.';
    },
    bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); },
    coinHTML: n => FF.icons.coin + '<span>' + n + '</span>'
  };

  FF.hud = {
    load(bump) {
      const n = FF.carried(), c = FF.cap();
      $('load').textContent = n + '/' + c;
      $('loadChip').classList.toggle('full', n >= c);
      $('toMarketBtn').hidden = n === 0;
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
  $('toMarketBtn').innerHTML = FF.icons.stall + '<span class="txt">Market</span>';
  $('pauseBtn').innerHTML = FF.icons.pause;
  $('shopBtn').innerHTML = FF.icons.bag;
  $('padL').innerHTML = FF.icons.left;
  $('padR').innerHTML = FF.icons.right;
})();
