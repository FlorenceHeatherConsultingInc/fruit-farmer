/* Fruit Farmer: the two market layouts. Each one builds its targets, places them on screen and
   draws them; market.js handles throwing and paying and doesn't care which layout is on.
     friends: animals holding baskets. Two in front, plus one in back with the Big basket.
     wall:    the unlockable 4x3 barrel wall, barrels tipped out of their slots to face you.
   A target needs x, y (center of its opening), R, ry (opening size), z (how close it looks)
   and row (index into that layout's rowBonus and maxAsk in data.js). */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp } = FF.util;
  const Draw = FF.draw, Animals = FF.animals, INK = D.colors.ink, CARD = D.colors.card, SUN = D.colors.sun;
  const FONT = '"Baloo 2", "Trebuchet MS", sans-serif';
  const ROW_SCALE = [0.72, 0.86, 1], COLS = 4, PIVOT = 30 * Math.PI / 180;

  // market.js fills these in: env.takes(target) and env.look(x, y).
  const L = FF.marketLayouts = { env: {} };

  // Everything this target still pays: each fruit left, plus the bonus for filling it.
  L.leftToEarn = t => (t.need - t.got) * t.price + t.need * D.market.tipPerFruit;

  /* ---------- Shared pieces ---------- */
  function drawBubble(t, x, y, s, boost = 1) {
    const ctx = G.ctx, fs = G.W < 500 ? Math.round(clamp(15 * s, 11, 15)) : Math.round(clamp(20 * s, 13, 20));
    ctx.font = `800 ${fs}px ${FONT}`; ctx.textBaseline = 'middle';
    const p = t.pop > 0 ? 1 + 0.4 * Math.sin(t.pop * Math.PI) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(p * boost, p * boost);
    if (t.state === 'happy') { Draw.heartPath(fs * 0.9); Draw.fillStroke('#ff5e7a', 2.5); }
    else {
      const label = t.wants === 'any' ? 'Any' : '', qty = '×' + (t.need - t.got);
      const iconW = t.wants === 'any' ? ctx.measureText(label).width : fs * 1.2, qW = ctx.measureText(qty).width;
      const w = fs * 0.5 + iconW + 3 + qW + fs * 0.5, h = fs * 1.7, x0 = -w / 2;
      Draw.rr(x0, -h / 2, w, h, h / 2); Draw.fillStroke(CARD, 2.5);
      ctx.textAlign = 'left'; ctx.fillStyle = INK;
      if (t.wants === 'any') ctx.fillText(label, x0 + fs * 0.5, 1);
      else Draw.fruit(t.wants, x0 + fs * 0.5 + fs * 0.6, 0, fs * 0.48);
      ctx.fillStyle = INK; ctx.fillText(qty, x0 + fs * 0.5 + iconW + 3, 1);
    }
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }

  function drawPrice(t, x, bottom, s) {
    if (t.state !== 'open') return;
    const ctx = G.ctx, ts = Math.round(clamp(17 * s, 12, 17)), left = String(L.leftToEarn(t));
    ctx.font = `800 ${ts}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const pW = ctx.measureText(left).width, tw = ts * 1.15 + pW + ts * 0.6, th = ts * 1.5, tx = x - tw / 2, ty = bottom - th;
    Draw.rr(tx, ty, tw, th, 6); Draw.fillStroke(t.special ? '#ff9a1f' : SUN, 2.5);
    Draw.coin(tx + ts * 0.62, ty + th / 2, ts * 0.38);
    ctx.fillStyle = INK; ctx.fillText(left, tx + ts * 1.15, ty + th / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawMouthRing(t) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.R * 1.04, t.ry * 1.04, 0, 0, TAU);
    ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 4.5; ctx.strokeStyle = L.env.takes(t) ? '#5cc24a' : CARD; ctx.stroke();
  }

  function drawInside(t, fy) {
    const shown = t.inside.slice(-4), fr = t.R * 0.32;
    shown.forEach((f, i) => Draw.fruit(f, t.x + (i - (shown.length - 1) / 2) * fr * 1.25, fy - (i % 2) * fr * 0.5, fr, (i - 1) * 0.3));
  }

  /* ---------- Animal friends ---------- */
  function drawFriend(t, aimed) {
    const ctx = G.ctx, { x, R, ry, z: s } = t, lw = Math.max(2.5, 4 * s);
    const jump = t.mood === 'happy' ? Math.abs(Math.sin(G.clock * 11)) * R * 0.2 : Math.abs(Math.sin(G.clock * 2 + x)) * R * 0.03;
    const y = t.y - jump, color = Animals.color(t.kind), hr = R * 0.82, headY = y - R * 0.98, footY = y + R * 1.02;
    const pop = 1 - t.pop;

    ctx.save();
    ctx.translate(x, t.y + R); ctx.scale(pop, pop); ctx.translate(-x, -t.y - R);
    ctx.fillStyle = 'rgba(43,35,80,0.16)'; ctx.beginPath(); ctx.ellipse(x, t.y + R * 1.12, R * 1.05, R * 0.2, 0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * R * 0.42, footY, R * 0.32, R * 0.17, 0, 0, TAU); Draw.fillStroke(color, lw); }
    ctx.beginPath(); ctx.ellipse(x, y + R * 0.18, R * 0.84, R * 0.92, 0, 0, TAU); Draw.fillStroke(color, lw);
    Animals.drawHead(t.kind, x, headY, hr, t.mood, G.clock + x, L.env.look(x, headY));

    const q = 1 + 0.12 * Math.sin(t.bump * Math.PI);
    ctx.save();
    ctx.translate(x, y); ctx.scale(q, 2 - q); ctx.translate(-x, -y);
    if (aimed) { ctx.fillStyle = 'rgba(255,230,90,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, R * 1.3, ry * 1.5, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(x, y, R, ry, 0, 0, TAU); Draw.fillStroke('#3d2412', lw);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, R * 0.96, ry * 0.96, 0, 0, TAU); ctx.clip();
    drawInside(t, y + ry * 0.35);
    ctx.restore();
    const wall = () => {
      ctx.beginPath(); ctx.moveTo(x - R, y); ctx.bezierCurveTo(x - R * 0.96, y + R * 0.72, x - R * 0.6, y + R * 0.86, x, y + R * 0.86);
      ctx.bezierCurveTo(x + R * 0.6, y + R * 0.86, x + R * 0.96, y + R * 0.72, x + R, y);
      ctx.ellipse(x, y, R, ry, 0, 0, Math.PI, false); ctx.closePath();
    };
    wall(); ctx.save(); ctx.clip();
    ctx.fillStyle = '#d29a55'; ctx.fillRect(x - R * 1.1, y - ry, R * 2.2, R * 2);
    ctx.strokeStyle = '#a8692c'; ctx.lineWidth = 3 * s;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * R * 0.24, y); ctx.lineTo(x + i * R * 0.17, y + R); ctx.stroke(); }
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y + i * R * 0.2, R, ry, 0, 0, Math.PI); ctx.stroke(); }
    ctx.restore();
    wall(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    if (aimed) drawMouthRing(t);
    ctx.restore();
    // paws gripping the rim
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * R * 0.96, y + ry * 0.3, R * 0.2, 0, TAU); Draw.fillStroke(color, lw); }
    ctx.restore();

    if (t.pop >= 1) return;
    if (FF.friends.hearts(t.kind)) {
      ctx.font = `800 ${G.W < 500 ? 13 : 16}px ${FONT}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = INK;
      ctx.strokeText(FF.friends.name(t.kind), x, t.y + R * 1.3); ctx.fillStyle = CARD; ctx.fillText(FF.friends.name(t.kind), x, t.y + R * 1.3);
    }
    drawBubble(t, clamp(x + hr * 1.2, 56, G.W - 56), headY - hr * 0.72, 1, G.W < 500 ? 1 : 1.35);
    drawPrice(t, x, y + R * 0.8, Math.max(0.82, s));
  }

  // The Barrel wall waiting under a cloth, with an animal sneaking a peek.
  function drawCoveredWall(M, sc) {
    const ctx = G.ctx, { W } = G, w = Math.min(W * 0.72, 540), x0 = W / 2 - w / 2, top = M.horizon - 96, bottom = M.horizon + 30;
    ctx.fillStyle = '#8f5a2c';
    ctx.fillRect(x0 + 10, top, 10, bottom - top + 16); ctx.fillRect(x0 + w - 20, top, 10, bottom - top + 16);
    Animals.drawHead('bunny', x0 + w * 0.8, top - 6, 20, 'idle', G.clock, L.env.look(x0 + w * 0.8, top - 6));
    const n = 7, step = w / n;
    ctx.beginPath(); ctx.moveTo(x0, top + 8); ctx.quadraticCurveTo(W / 2, top - 12, x0 + w, top + 8);
    ctx.lineTo(x0 + w, bottom);
    for (let i = n; i > 0; i--) ctx.quadraticCurveTo(x0 + (i - 0.5) * step, bottom + 18, x0 + (i - 1) * step, bottom);
    ctx.closePath();
    Draw.fillStroke(sc.awnings[0], 4);
    ctx.strokeStyle = 'rgba(43,35,80,0.2)'; ctx.lineWidth = 3;
    for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * step, top + 14); ctx.lineTo(x0 + i * step, bottom - 2); ctx.stroke(); }
    ctx.font = `800 ${clamp(w * 0.13, 28, 54)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('?', W / 2, (top + bottom) / 2);
    ctx.fillStyle = SUN; ctx.fillText('?', W / 2, (top + bottom) / 2); ctx.textBaseline = 'alphabetic';
  }

  L.friends = {
    build() {
      const n = FF.save.tier >= D.market.newFriendTier ? 3 : 2;
      return n === 3 ? [{ row: 0 }, { row: 1, side: -1 }, { row: 1, side: 1 }] : [{ row: 1, side: -1 }, { row: 1, side: 1 }];
    },
    place(M, targets) {
      const { W } = G, top = 84, bottom = M.slingY - clamp(G.H * 0.06, 30, 50), avail = bottom - top;
      const R = Math.min(W * 0.19, avail * 0.2, 104);
      M.horizon = top + avail * 0.32;
      for (const t of targets) {
        const back = t.row === 0, z = back ? 0.76 : 1;
        t.x = back ? W / 2 : W / 2 + t.side * W * 0.24; t.y = back ? top + avail * 0.36 : bottom - R * 1.15;
        t.z = z; t.R = R * z; t.ry = R * z * 0.46;
      }
    },
    draw(M, targets, aimed, sc) {
      if (!FF.save.wallOwned) drawCoveredWall(M, sc);
      targets.forEach(t => drawFriend(t, t === aimed));
    }
  };

  /* ---------- Barrel wall ---------- */
  function drawTier(row, sc) {
    const ctx = G.ctx, pad = row.R * 1.3, x0 = row.xs[0] - pad, x1 = row.xs[COLS - 1] + pad, w = x1 - x0, h = row.bottom - row.top;
    Draw.rr(x0, row.top, w, h + 8, 8 * row.s); Draw.fillStroke('#8f5a2c', 4);
    ctx.save(); Draw.rr(x0, row.top, w, h + 8, 8 * row.s); ctx.clip();
    const n = 16, st = w / n;
    for (let j = 0; j < n; j++) { ctx.fillStyle = j % 2 ? '#fff0d0' : sc.awnings[0]; ctx.fillRect(x0 + j * st, row.top, st + 0.5, h + 8); }
    ctx.restore();
    Draw.rr(x0, row.top, w, h + 8, 8 * row.s); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    const lip = 12 * row.s + 3;
    Draw.rr(x0 - 8, row.bottom - 3, w + 16, lip, 4); Draw.fillStroke('#c99a62', 3);
    if (sc.snowCap) { ctx.fillStyle = '#ffffff'; Draw.rr(x0 - 8, row.bottom - 7, w + 16, 7, 3.5); ctx.fill(); }
    ctx.fillStyle = 'rgba(43,35,80,0.15)'; ctx.fillRect(x0 - 8, row.bottom - 3 + lip, w + 16, 3);
  }

  function drawBarrel(t, aimed) {
    const ctx = G.ctx, { x, y, R, ry, z: s } = t, lw = Math.max(2, 3.5 * s), bot = t.floor;
    const sw = R * 1.16, st = y - ry - R * 0.14;
    Draw.rr(x - sw, st, sw * 2, bot - st + 6, R * 0.4); Draw.fillStroke('#40305f', lw);
    const q = 1 + 0.14 * Math.sin(t.bump * Math.PI);
    ctx.save();
    ctx.translate(x, y); ctx.scale(q, 2 - q); ctx.translate(-x, -y);
    const body = () => {
      ctx.beginPath(); ctx.moveTo(x - R * 0.98, y);
      ctx.quadraticCurveTo(x - R, y + (bot - y) * 0.75, x - R * 0.74, bot);
      ctx.lineTo(x + R * 0.74, bot);
      ctx.quadraticCurveTo(x + R, y + (bot - y) * 0.75, x + R * 0.98, y);
      ctx.closePath();
    };
    body(); ctx.save(); ctx.clip();
    ctx.fillStyle = '#b8713a'; ctx.fillRect(x - R * 1.2, y - 2, R * 2.4, bot - y + 4);
    ctx.strokeStyle = '#8f5222'; ctx.lineWidth = 2.5 * s;
    for (let i = -3; i <= 3; i++) { const u = i / 3.4; ctx.beginPath(); ctx.moveTo(x + u * R, y + ry * Math.sqrt(1 - u * u)); ctx.lineTo(x + u * R * 0.76, bot); ctx.stroke(); }
    ctx.strokeStyle = '#5c5870'; ctx.lineWidth = Math.max(4, R * 0.15);
    ctx.beginPath(); ctx.ellipse(x, y + (bot - y - ry) * 0.5 + 4, R * 0.98, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
    body(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();

    ctx.beginPath(); ctx.ellipse(x, y, R, ry, 0, 0, TAU); Draw.fillStroke('#d59a5e', lw);
    ctx.strokeStyle = '#a8692c'; ctx.lineWidth = 2 * s;
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, c = Math.cos(a), n = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(x + c * R * 0.84, y + n * ry * 0.84); ctx.lineTo(x + c * R * 0.98, y + n * ry * 0.98); ctx.stroke();
    }
    const ir = R * 0.84, iry = ry * 0.84;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, ir, iry, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#8a5428'; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.fillStyle = '#2f1a0c'; ctx.beginPath(); ctx.ellipse(x, y + iry * 0.3, ir * 1.04, iry * 0.98, 0, 0, TAU); ctx.fill();
    drawInside(t, y + iry * 0.56);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x, y, ir, iry, 0, 0, TAU); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    if (aimed) drawMouthRing(t);
    ctx.restore();

    // pivot pins on each side of the slot
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * R * 1.03, y + ry * 0.2, Math.max(3.5, 6 * s), 0, TAU); Draw.fillStroke('#8c88a0', 2); }

    if (t.state === 'closed') return;
    const hr = Math.max(11, R * 0.33), hop = t.state === 'happy' ? Math.abs(Math.sin(t.t * 9)) * hr * 0.5 : 0;
    const hx = x - R * 0.68, hy = y - ry - R * 0.06 + hr * 1.4 * t.pop - hop;
    Animals.drawHead(t.kind, hx, hy, hr, t.mood, G.clock + t.row + t.c, L.env.look(hx, hy));
    drawBubble(t, x + R * 0.3, y - ry - R * 0.06, s);
    drawPrice(t, x, bot - 1, s);
  }

  L.wall = {
    build() {
      return Array.from({ length: ROW_SCALE.length * COLS }, (_, i) => ({ row: Math.floor(i / COLS), c: i % COLS }));
    },
    place(M, targets) {
      const { W } = G, top = 76, bottom = M.slingY - clamp(G.H * 0.065, 34, 60);
      const open = Math.cos(PIVOT), bodyK = Math.sin(PIVOT) * 0.8, avail = bottom - top, maxCol = W * 0.97 / COLS;
      const sum = ROW_SCALE.reduce((a, b) => a + b, 0);
      const R = Math.max(24, Math.min(maxCol * 0.42, (avail - 3 * 24) / (sum * (2 * open + bodyK + 0.2))));
      const colW = Math.min(maxCol, R * 2.62);
      const heights = ROW_SCALE.map(s => 12 * s + R * s * (2 * open + bodyK + 0.2));
      const gap = Math.max(8, (avail - heights.reduce((a, b) => a + b, 0)) / 3);
      let y = top;
      M.rows = ROW_SCALE.map(s => {
        const r = R * s, ry = r * open, my = y + 12 * s + r * 0.2 + gap * 0.5 + ry, floor = my + ry + r * bodyK;
        const row = { s, R: r, ry, my, top: y, bottom: floor, xs: Array.from({ length: COLS }, (_, c) => W / 2 + (c - 1.5) * colW * (0.8 + 0.2 * s)) };
        y = floor + gap * 0.5;
        return row;
      });
      M.horizon = M.rows[1].my;
      for (const t of targets) { const row = M.rows[t.row]; t.x = row.xs[t.c]; t.y = row.my; t.R = row.R; t.ry = row.ry; t.z = row.s; t.floor = row.bottom; }
    },
    draw(M, targets, aimed, sc) {
      for (let r = 0; r < M.rows.length; r++) { drawTier(M.rows[r], sc); targets.filter(t => t.row === r).forEach(t => drawBarrel(t, t === aimed)); }
    },
    // The first-time reveal: the cloth lifts off the wall. k runs from 0 (covered) to 1 (gone).
    drawCloth(M, k, sc) {
      const ctx = G.ctx, front = M.rows[M.rows.length - 1], pad = front.R * 1.5;
      const x0 = front.xs[0] - pad, w = front.xs[COLS - 1] + pad - x0, top = M.rows[0].top - 6, h = (front.bottom + 18 - top) * (1 - k);
      if (h <= 0) return;
      Draw.rr(x0, top, w, h, 10); Draw.fillStroke(sc.awnings[0], 4);
      ctx.strokeStyle = 'rgba(43,35,80,0.2)'; ctx.lineWidth = 3;
      for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * w / 8, top + 6); ctx.lineTo(x0 + i * w / 8, top + h - 6); ctx.stroke(); }
    }
  };
})();
