/* Fruit Farmer: the village, where your animal friends live. A small canvas picture of the homes
   and decorations sits above a list of friends. Everything here carries across every farm, and the
   picture restyles with the current scene. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, F = FF.friends;
  const Draw = FF.draw, Animals = FF.animals, { TAU } = FF.util;
  const W = 360, H = 300, DPR = 2;
  // Two rows of cottages face a main street, with a gap in the middle for the village square.
  const BACK_Y = 170, FRONT_Y = 272, STREET_Y = 197, SQUARE_X = 180;
  const LOT_X = [26, 72, 118, 242, 288, 334];
  let from = 'title', spots = [];

  const lot = i => ({ x: LOT_X[i % LOT_X.length], y: i < LOT_X.length ? BACK_Y : FRONT_Y });

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
      for (let px = 6; px < W; px += 17) { Draw.rr(px, y - 11, 6, 13, 2); Draw.fillStroke('#fff0d0', 1.5); }
      Draw.rr(-4, y - 7, W + 8, 3, 1.5); Draw.fillStroke('#fff0d0', 1.2);
    }
  };

  function tree(ctx, x, y, sc) {
    ctx.fillStyle = sc.trunk === 'candy' ? '#fff0f4' : sc.trunk; ctx.fillRect(x - 3, y - 16, 6, 16);
    Draw.blob([[x - 9, y - 22, 10], [x + 9, y - 22, 10], [x, y - 32, 13]], sc.foliage[0], 2);
  }
  function emptyLot(ctx, x, y) {
    ctx.fillStyle = 'rgba(43,35,80,0.1)'; ctx.beginPath(); ctx.ellipse(x, y - 2, 19, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 1.5, y - 15, 3, 14);
    Draw.rr(x - 9, y - 21, 18, 10, 2); Draw.fillStroke('#e9c79a', 1.5);
  }
  function cottage(ctx, x, y, roof, kind, i) {
    const w = 38, h = 24;
    ctx.fillStyle = 'rgba(43,35,80,0.14)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.62, 4, 0, 0, TAU); ctx.fill();
    Draw.rr(x + 9, y - h - 23, 7, 14, 1); Draw.fillStroke('#b05a44', 2);
    Draw.rr(x - w / 2, y - h, w, h, 2); Draw.fillStroke('#fff0d0', 2);
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - h + 1); ctx.lineTo(x - w / 2 + 5, y - h - 17); ctx.lineTo(x + w / 2 - 5, y - h - 17); ctx.lineTo(x + w / 2 + 5, y - h + 1); ctx.closePath();
    Draw.fillStroke(roof, 2);
    ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x - 11, y - 11); ctx.arc(x - 6, y - 11, 5, Math.PI, 0); ctx.lineTo(x - 1, y); ctx.closePath(); Draw.fillStroke('#a8692c', 1.5);
    Draw.rr(x + 3, y - 18, 11, 10, 1.5); Draw.fillStroke('#bfe6fb', 1.5);
    // the friend stands out front, by the door
    const bob = Math.abs(Math.sin(G.clock * 2 + i)) * 1.5;
    Animals.drawHead(kind, x + 14, y - 4 - bob, 9, 'idle', G.clock + i, { x: Math.sin(G.clock + i) * 0.5, y: 0.3 });
  }
  function row(ctx, from, to, living, sc) {
    for (let i = from; i < to; i++) {
      const { x, y } = lot(i), kind = living[i];
      if (!kind) { emptyLot(ctx, x, y); continue; }
      cottage(ctx, x, y, sc.awnings[i % sc.awnings.length], kind, i);
      spots.push({ kind, x, y: y - 18 });
    }
  }

  function paint() {
    const ctx = G.ctx, sc = FF.scene(), has = id => FF.save.decor.includes(id);
    const place = id => { const d = D.decorations.find(x => x.id === id); DECOR[id](ctx, d.x, d.y); };
    const g = ctx.createLinearGradient(0, 0, 0, 86);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sc.hills[0]; ctx.beginPath(); ctx.ellipse(90, 92, 190, 34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.hills[1]; ctx.beginPath(); ctx.ellipse(300, 94, 170, 28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.ground.top; ctx.fillRect(0, 84, W, H - 84);
    if (FF.stickers.hasReward('party')) {
      ctx.strokeStyle = D.colors.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(W / 2, 34, W, 8); ctx.stroke();
      for (let i = 1; i < 12; i++) {
        const k = i / 12, x = W * k, y = 8 + 52 * k * (1 - k);
        ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 13); ctx.closePath(); Draw.fillStroke(sc.awnings[i % sc.awnings.length], 1.5);
      }
    }
    if (has('windmill')) place('windmill');
    if (has('pond')) place('pond');
    tree(ctx, 16, 112, sc); tree(ctx, 214, 110, sc);
    if (has('fence')) place('fence');

    // street and square, with a lane to the front of the village
    ctx.fillStyle = sc.plaza[0]; ctx.strokeStyle = sc.plaza[1]; ctx.lineWidth = 2;
    ctx.fillRect(0, STREET_Y - 11, W, 22); ctx.strokeRect(-4, STREET_Y - 11, W + 8, 22);
    ctx.fillRect(SQUARE_X - 11, STREET_Y, 22, H - STREET_Y);
    ctx.beginPath(); ctx.ellipse(SQUARE_X, STREET_Y, 44, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();

    spots = [];
    const living = Object.keys(D.animals).filter(F.hasHome);
    row(ctx, 0, LOT_X.length, living, sc);
    if (has('well')) place('well');
    if (has('lamp')) { DECOR.lamp(ctx, SQUARE_X - 34, STREET_Y - 14); DECOR.lamp(ctx, SQUARE_X + 34, STREET_Y - 14); }
    if (has('fountain')) place('fountain');
    if (has('bench')) place('bench');
    row(ctx, LOT_X.length, LOT_X.length * 2, living, sc);
    ctx.fillStyle = sc.ground.deep; ctx.fillRect(0, H - 12, W, 12);
    if (has('flowers')) [46, 118, 242, 314].forEach(x => DECOR.flowers(ctx, x, 293));
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
    const coming = Object.keys(D.animals).filter(k => !list.includes(k) && D.animals[k].arrive);
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
