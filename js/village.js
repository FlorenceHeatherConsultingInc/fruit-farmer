/* Fruit Farmer: the village, where your animal friends live. A small canvas picture of the homes
   and decorations sits above a list of friends. Everything here carries across every farm, and the
   picture restyles with the current scene. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, F = FF.friends;
  const Draw = FF.draw, Animals = FF.animals, { TAU } = FF.util;
  const COLS = 4, ROWS = 3, W = 360, H = 270, DPR = 2;
  let from = 'title', spots = [];

  const homeSpot = i => ({ x: W * (0.5 + i % COLS) / COLS, y: H * (0.42 + 0.26 * Math.floor(i / COLS)) });

  /* ---------- Decorations, each in its own fixed spot ---------- */
  const DECOR = {
    windmill(ctx, x, y) {
      Draw.rr(x - 9, y - 26, 18, 30, 4); Draw.fillStroke('#e9c79a', 2.5);
      ctx.save(); ctx.translate(x, y - 26); ctx.rotate(G.clock * 0.8);
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); Draw.rr(-3, -22, 6, 20, 2); Draw.fillStroke('#fff0d0', 2); }
      ctx.restore();
    },
    pond(ctx, x, y) { ctx.beginPath(); ctx.ellipse(x, y, 30, 12, 0, 0, TAU); Draw.fillStroke('#6ec2f5', 2.5); },
    well(ctx, x, y) {
      ctx.strokeStyle = D.colors.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 9, y - 18); ctx.moveTo(x + 9, y); ctx.lineTo(x + 9, y - 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 14, y - 17); ctx.lineTo(x, y - 27); ctx.lineTo(x + 14, y - 17); ctx.closePath(); Draw.fillStroke('#ff6b6b', 2.5);
      ctx.beginPath(); ctx.ellipse(x, y, 13, 6, 0, 0, TAU); Draw.fillStroke('#b8b4c8', 2.5);
    },
    fountain(ctx, x, y) {
      ctx.beginPath(); ctx.ellipse(x, y, 20, 8, 0, 0, TAU); Draw.fillStroke('#c9d9e8', 2.5);
      Draw.rr(x - 3, y - 18, 6, 16, 2); Draw.fillStroke('#c9d9e8', 2);
      ctx.fillStyle = '#6ec2f5'; ctx.beginPath(); ctx.arc(x, y - 21 + Math.sin(G.clock * 4), 5, 0, TAU); ctx.fill();
    },
    bench(ctx, x, y) { Draw.rr(x - 15, y - 9, 30, 6, 2); Draw.fillStroke('#a8692c', 2); Draw.rr(x - 13, y - 3, 4, 6, 1); Draw.fillStroke('#8a5a32', 1.5); Draw.rr(x + 9, y - 3, 4, 6, 1); Draw.fillStroke('#8a5a32', 1.5); },
    lamp(ctx, x, y) {
      Draw.rr(x - 2, y - 26, 4, 28, 2); Draw.fillStroke('#5c5870', 2);
      ctx.beginPath(); ctx.arc(x, y - 29, 6, 0, TAU); Draw.fillStroke('#ffe680', 2);
    },
    flowers(ctx, x, y) {
      [[-14, 0, '#ff5e7a'], [-4, 3, '#ffd23f'], [7, -1, '#c77dff'], [15, 3, '#ff9a1f']].forEach(([dx, dy, c]) => {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 4, 0, TAU); Draw.fillStroke(c, 1.5);
      });
    },
    fence(ctx, x, y) {
      for (let i = 0; i < 8; i++) { Draw.rr(x - 66 + i * 19, y - 12, 7, 15, 2); Draw.fillStroke('#fff0d0', 2); }
      Draw.rr(x - 68, y - 7, 138, 4, 2); Draw.fillStroke('#fff0d0', 1.5);
    }
  };

  function paint() {
    const ctx = G.ctx, sc = FF.scene();
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sc.hills[0]; ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.42, W * 0.5, H * 0.18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.hills[1]; ctx.beginPath(); ctx.ellipse(W * 0.8, H * 0.44, W * 0.5, H * 0.18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.ground.top; ctx.fillRect(0, H * 0.32, W, H * 0.68);
    ctx.fillStyle = sc.ground.deep; ctx.fillRect(0, H * 0.93, W, H * 0.07);

    if (FF.stickers.hasReward('party')) {
      ctx.strokeStyle = D.colors.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(W / 2, 44, W, 18); ctx.stroke();
      for (let i = 1; i < 12; i++) {
        const k = i / 12, x = W * k, y = 18 + 52 * k * (1 - k);
        ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 13); ctx.closePath(); Draw.fillStroke(sc.awnings[i % sc.awnings.length], 1.5);
      }
    }
    D.decorations.forEach(d => { if (FF.save.decor.includes(d.id)) DECOR[d.id](ctx, W * d.x, H * d.y); });

    spots = [];
    const living = Object.keys(D.animals).filter(F.hasHome), s = 36;
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x, y } = homeSpot(i), kind = living[i];
      if (!kind) {
        ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,35,80,0.35)';
        Draw.rr(x - 26, y - 34, 52, 40, 8); ctx.stroke(); ctx.setLineDash([]);
        continue;
      }
      Draw.rr(x - s * 0.72, y - s * 0.85, s * 1.44, s * 1, 5); Draw.fillStroke('#fff0d0', 2.5);
      ctx.beginPath(); ctx.moveTo(x - s * 0.92, y - s * 0.78); ctx.lineTo(x, y - s * 1.45); ctx.lineTo(x + s * 0.92, y - s * 0.78); ctx.closePath();
      Draw.fillStroke(sc.awnings[i % sc.awnings.length], 2.5);
      const bob = Math.abs(Math.sin(G.clock * 2 + i)) * 2;
      Animals.drawHead(kind, x, y - s * 0.22 - bob, s * 0.42, 'idle', G.clock + i, { x: Math.sin(G.clock + i) * 0.5, y: 0.3 });
      spots.push({ kind, x, y: y - 14 });
    }
  }
  function drawPicture() {
    const cv = $('villageArt'), prev = G.ctx, ctx = cv.getContext('2d');
    G.ctx = ctx;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    try { paint(); } finally { G.ctx = prev; }
  }

  /* ---------- The list ---------- */
  const heartsHTML = kind => {
    const n = F.hearts(kind);
    return `<span class="hearts" aria-label="${n} of 5 hearts">${'♥'.repeat(n)}<i>${'♥'.repeat(5 - n)}</i></span>`;
  };
  function friendRow(kind) {
    const a = D.animals[kind], goal = F.nextGoal(kind), n = F.hearts(kind), cost = F.homeCost();
    const fav = n >= D.friendship.favoriteAt ? `Loves ${D.fruits[a.fav].name.toLowerCase()}` : 'Sell more to learn what they love';
    const action = F.hasHome(kind) ? `<span class="tag">Home</span>`
      : F.canMoveIn(kind) ? `<button class="mini" type="button" data-village="home" data-id="${kind}" ${FF.save.coins >= cost ? '' : 'disabled'} aria-label="Build a home for ${a.name} for ${cost} coins">${I.coin}${cost}</button>` : '';
    return `<div class="up" id="friend-${kind}"><div class="badge" data-pic="${kind}"></div><div><h3>${n ? a.name : 'New friend'}</h3>${heartsHTML(kind)}<p>${fav}${goal ? ` · ${F.sold(kind)}/${goal} to the next heart` : ' · Best friends!'}</p></div>${action}</div>`;
  }
  function render() {
    $('villageCoins').innerHTML = UI.coinHTML(FF.save.coins);
    const list = F.available();
    $('villageFriends').innerHTML = list.map(friendRow).join('');
    list.forEach(k => {
      const pic = FF.draw.toCanvas(84, 84, s => Animals.drawHead(k, s / 2, s * 0.56, s * 0.3, 'idle', 0, { x: 0, y: 0.4 }));
      $('villageFriends').querySelector(`[data-pic="${k}"]`).appendChild(pic);
    });
    const coming = Object.keys(D.animals).filter(k => !list.includes(k));
    $('villageNext').textContent = coming.length ? `Earn ${Math.min(...coming.map(k => D.animals[k].arrive)) - F.totalHearts()} more hearts to meet a new friend.` : 'Everyone has arrived!';
    $('villageDecor').innerHTML = D.decorations.map(d => {
      const on = FF.save.decor.includes(d.id);
      return `<button class="pick${on ? ' on' : ''}" type="button" data-village="decor" data-id="${d.id}" ${on || FF.save.coins >= d.cost ? '' : 'disabled'} aria-pressed="${on}"><b>${d.name}</b><small>${on ? 'Built' : I.coin + d.cost}</small></button>`;
    }).join('');
    drawPicture();
  }

  $('villageOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.dataset.act === 'villagedone') { FF.screens.afterBook(from); return; }
    const id = b.dataset.id, save = FF.save;
    if (b.dataset.village === 'home' && F.canMoveIn(id) && !F.hasHome(id) && save.coins >= F.homeCost()) {
      save.coins -= F.homeCost(); F.buildHome(id); FF.book.bought('Home for ' + F.name(id)); FF.sfx.buy();
    } else if (b.dataset.village === 'decor' && !save.decor.includes(id)) {
      const d = D.decorations.find(x => x.id === id);
      if (save.coins < d.cost) return;
      save.coins -= d.cost; save.decor.push(id); FF.book.bought(d.name); FF.sfx.buy();
    } else return;
    FF.stickers.check();
    FF.persist(); render(); UI.bump($('villageCoins'));
  });
  // Tap an animal's home to jump to its card.
  $('villageArt').addEventListener('click', e => {
    const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    const hit = spots.find(s => Math.hypot(s.x - x, s.y - y) < 34);
    if (hit) { FF.sfx.tick(); $('friend-' + hit.kind).scrollIntoView({ block: 'center' }); }
  });

  FF.village = {
    open(origin) {
      FF.sound.ensure();
      from = origin;
      const cv = $('villageArt');
      cv.width = W * DPR; cv.height = H * DPR;
      render();
      UI.show('village');
      $('villageOv').querySelector('.card').scrollTop = 0;
      $('villageDone').focus({ preventScroll: true });
    },
    tick() { drawPicture(); }
  };
})();
