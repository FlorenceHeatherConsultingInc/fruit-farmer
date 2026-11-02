/* Fruit Farmer: the market, played like skee-ball.
   Twelve barrels sit on three shelves. Each barrel asks for a fruit and shows its price;
   the back rows usually pay more. Throw fruit from the slingshot three ways:
     1. Tap to lock the swinging aim, tap again to lock the power.
     2. Pull back the slingshot and let go.
     3. Flick upward.
   Aim and power map to a landing spot (shown as a ring). Fruit that misses or goes in the
   wrong barrel rolls back to your tray, so nothing is ever lost. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp, rand, randi, pick } = FF.util;
  const Draw = FF.draw, FX = FF.fx, INK = D.colors.ink, CARD = D.colors.card, SUN = D.colors.sun;
  const ROWS = 3, COLS = 4, ROW_SCALE = [0.72, 0.86, 1];   // back, middle, front

  const M = {};
  let ammo = [], shots = [], loaded = null, reloadT = 0, barrels = [];
  let earned = 0, shotsFired = 0, soldT = -1, streak = 0, hintPulse = 0;
  let phase = 'aim', aimT = 0, powT = 0, lockedAngle = 0, drag = null;

  const Market = FF.market = { earned: () => earned };

  /* ---------- Layout ---------- */
  Market.layout = () => {
    const { W, H } = G;
    M.trayH = clamp(H * 0.085, 52, 70);
    M.trayY = H - M.trayH;
    M.slingY = M.trayY - clamp(H * 0.11, 64, 96);
    M.ax = W / 2; M.ay = M.slingY - 14;
    M.fr = clamp(W * 0.045, 20, 30);
    const top = 84, frontBottom = M.slingY - clamp(H * 0.09, 48, 80);
    const colW = W / COLS, avail = frontBottom - top;
    M.bw = Math.max(40, Math.min(colW * 0.74, 118, (avail - 3 * 34) / 2.45));
    const heights = ROW_SCALE.map(s => 30 * s + M.bw * s * 0.9);
    const gap = Math.max(8, (avail - heights.reduce((a, b) => a + b, 0)) / 3);
    M.rows = [];
    let y = top + gap * 0.5;
    ROW_SCALE.forEach(s => {
      const bw = M.bw * s, bh = bw * 0.9, mouth = y + 30 * s;
      M.rows.push({ s, bw, bh, mouth, bottom: mouth + bh, xs: Array.from({ length: COLS }, (_, c) => W / 2 + (c - 1.5) * colW * (0.8 + 0.2 * s)) });
      y = mouth + bh + gap;
    });
    M.horizon = M.rows[0].mouth + M.rows[0].bh * 0.4;
    M.dMin = (M.ay - M.rows[2].mouth) * 0.55;
    M.dMax = (M.ay - M.rows[0].mouth) * 1.15;
    M.maxAngle = Math.atan((W / 2 - colW * 0.2) / (M.ay - M.rows[2].mouth));
    M.maxPull = clamp(Math.min(W, H) * 0.22, 90, 170);
    M.g = H * 2.2;
  };

  const landing = (angle, power) => {
    const d = M.dMin + power * (M.dMax - M.dMin);
    return { x: M.ax + Math.tan(angle) * d, y: M.ay - d };
  };
  // How big things look at a given height on screen (smaller toward the back).
  function depthScale(y) {
    const r = M.rows;
    if (y >= r[2].mouth) return clamp(1 + (y - r[2].mouth) / (M.ay - r[2].mouth) * 0.15, 1, 1.15);
    if (y >= r[1].mouth) return r[1].s + (r[2].s - r[1].s) * (y - r[1].mouth) / (r[2].mouth - r[1].mouth);
    if (y >= r[0].mouth) return r[0].s + (r[1].s - r[0].s) * (y - r[0].mouth) / (r[1].mouth - r[0].mouth);
    return Math.max(0.55, r[0].s - (r[0].mouth - y) / 400);
  }

  /* ---------- Barrels ---------- */
  function available(type) {
    const m = t => type === 'any' || t === type;
    let n = 0;
    for (const t of ammo) if (m(t)) n++;
    for (const s of shots) if (m(s.type)) n++;
    if (loaded && m(loaded)) n++;
    return n;
  }
  function newRequest(b) {
    const mk = D.market, types = FF.FRUIT_TYPES.filter(t => available(t) > 0);
    b.got = 0; b.inBarrel = []; b.t = 0; b.pop = 1;
    if (!types.length) { b.state = 'closed'; return; }
    b.state = 'open';
    b.wants = Math.random() < mk.anyChance ? 'any' : pick(types);
    b.need = randi(1, mk.maxAsk[b.r]);
    let bonus = mk.rowBonus[b.r];
    if (Math.random() < mk.mixChance) bonus = Math.max(0, bonus + pick([-1, 1]));
    b.price = (b.wants === 'any' ? 1 : D.fruits[b.wants].price) + bonus;
  }
  function barrelAt(x, y) {
    for (const b of barrels) {
      const row = M.rows[b.r], bx = row.xs[b.c];
      if (Math.abs(x - bx) < row.bw * 0.5 + M.fr * 0.25 && Math.abs(y - row.mouth) < row.bh * 0.38) return b;
    }
    return null;
  }
  const wantsFruit = (b, type) => b && b.state === 'open' && b.got < b.need && (b.wants === 'any' || b.wants === type);

  /* ---------- Throwing ---------- */
  function fire(angle, power) {
    if (!loaded) return false;
    const L = landing(angle, power);
    shots.push({ type: loaded, phase: 'fly', t: 0, T: 0.42 + 0.38 * power, arc: 50 + 170 * power, lx: L.x, ly: L.y, s1: depthScale(L.y), x: M.ax, y: M.ay, s: 1, rot: 0, vr: rand(-6, 6), vx: 0, vy: 0 });
    loaded = null; reloadT = 0.18;
    shotsFired++; phase = 'aim';
    FF.sfx.twang();
    return true;
  }
  Market.tap = () => {
    if (!loaded) { hintPulse = 1; return; }
    if (phase === 'aim') { lockedAngle = currentAngle(); phase = 'power'; powT = 0; FF.sfx.tick(); }
    else fire(lockedAngle, currentPower());
  };
  const currentAngle = () => M.maxAngle * Math.sin(aimT * TAU / D.market.aimSeconds);
  const currentPower = () => 0.5 - 0.5 * Math.cos(powT * TAU / D.market.powerSeconds);

  function land(s) {
    const b = barrelAt(s.lx, s.ly);
    s.x = s.lx; s.y = s.ly;
    if (wantsFruit(b, s.type)) {
      s.phase = 'drop'; s.t = 0;
      const row = M.rows[b.r], bx = row.xs[b.c];
      b.got++; b.inBarrel.push(s.type); b.bump = 1;
      FF.save.crate[s.type] = Math.max(0, FF.save.crate[s.type] - 1);
      FF.save.coins += b.price; earned += b.price;
      FX.text(bx, row.mouth - 30 * row.s, '+' + b.price, b.price >= 5);
      FX.burst(bx, row.mouth, [SUN, '#fff3a8'], 8, 'star');
      FF.sfx.coin(streak++);
      if (b.got >= b.need) {
        const tip = b.need * D.market.tipPerFruit;
        FF.save.coins += tip; earned += tip;
        b.state = 'happy'; b.t = 0;
        setTimeout(() => FX.text(bx, row.mouth - 60 * row.s, 'Full! +' + tip, true), 250);
        FX.burst(bx, row.mouth - 10, ['#ff3b5c', '#ff7a9c'], 10, 'heart');
        setTimeout(FF.sfx.buy, 120);
      }
      FF.persist(); FF.hud.coins(true);
    } else if (b) {
      s.phase = 'fall'; s.vx = (s.lx < M.rows[b.r].xs[b.c] ? -1 : 1) * rand(120, 200); s.vy = -260;
      FX.text(s.x, s.y - 20, b.state === 'open' && b.got < b.need ? 'Wrong fruit!' : 'All full!', false);
      FF.sfx.nope(); streak = 0;
    } else {
      s.phase = 'fall'; s.vx = rand(-60, 60); s.vy = -160;
      FX.burst(s.x, s.y + 6, ['rgba(160,140,110,0.6)'], 5, 'dot');
      FF.sfx.miss(); streak = 0;
    }
  }

  /* ---------- Start / update ---------- */
  Market.start = () => {
    ammo = [];
    FF.FRUIT_TYPES.forEach(t => { for (let i = 0; i < FF.save.crate[t]; i++) ammo.push(t); });
    FF.util.shuffle(ammo);
    shots = []; loaded = ammo.shift() || null; reloadT = 0;
    barrels = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const b = { r, c, bump: 0 };
      newRequest(b); b.pop = 1 + (r * COLS + c) * 0.06;
      barrels.push(b);
    }
    earned = 0; shotsFired = 0; soldT = -1; streak = 0; phase = 'aim'; aimT = 0; drag = null;
    FX.clear();
  };

  Market.update = dt => {
    hintPulse = Math.max(0, hintPulse - dt);
    if (!drag || drag.mode === 'tap') { if (phase === 'aim') aimT += dt; else powT += dt; }
    reloadT -= dt;
    if (!loaded && reloadT <= 0 && ammo.length) loaded = ammo.shift();

    const anyLeft = ammo.length || shots.length || loaded;
    for (const b of barrels) {
      b.bump = Math.max(0, b.bump - dt * 4);
      b.pop = Math.max(0, b.pop - dt * 3);
      b.t += dt;
      if (b.state === 'happy' && b.t > 1.0) newRequest(b);
      else if (b.state === 'open' && b.wants !== 'any' && !available(b.wants) && anyLeft && b.t > 0.6) newRequest(b);
      else if (b.state === 'closed' && anyLeft && b.t > 0.6) newRequest(b);
    }

    for (const s of shots) {
      s.rot += s.vr * dt;
      if (s.phase === 'fly') {
        s.t = Math.min(1, s.t + dt / s.T);
        const k = s.t;
        s.x = M.ax + (s.lx - M.ax) * k;
        s.y = M.ay + (s.ly - M.ay) * k - s.arc * 4 * k * (1 - k);
        s.s = 1 + (s.s1 - 1) * k;
        if (k >= 1) land(s);
      } else if (s.phase === 'drop') {
        s.t += dt; s.y += 60 * dt * s.s1;
        if (s.t > 0.18) s.done = true;
      } else {
        s.vy += M.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        s.s += (1 - s.s) * Math.min(1, dt * 2);
        if (s.y > G.H + 50 || s.x < -60 || s.x > G.W + 60) { s.done = true; ammo.push(s.type); FF.sfx.plop(); }
      }
    }
    shots = shots.filter(s => !s.done);
    FX.update(dt);
    FF.scenery.update(dt);

    if (!loaded && !ammo.length && !shots.length) {
      if (soldT < 0) soldT = 1.0;
      else { soldT -= dt; if (soldT <= 0) { soldT = -1; FF.screens.showSold(); } }
    } else soldT = -1;
  };

  /* ---------- Pointer: tap-tap, pull back, or flick ---------- */
  function dragAim(d) {
    const dx = d.px - d.sx, dy = d.py - d.sy, len = Math.hypot(dx, dy);
    if (len < 1) return null;
    return { angle: clamp(Math.atan2(-dx, dy), -M.maxAngle, M.maxAngle), power: Math.min(len, M.maxPull) / M.maxPull };
  }
  Market.pointerDown = e => {
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: e.clientX, py: e.clientY, mode: 'tap', samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }], stretched: 0 };
  };
  Market.pointerMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now();
    drag.px = e.clientX; drag.py = e.clientY;
    drag.samples.push({ x: e.clientX, y: e.clientY, t: now });
    while (drag.samples.length > 2 && now - drag.samples[0].t > 110) drag.samples.shift();
    const dx = drag.px - drag.sx, dy = drag.py - drag.sy, len = Math.hypot(dx, dy);
    if (drag.mode === 'tap' && len > 14) drag.mode = dy > 0 ? 'pull' : 'flick';
    if (drag.mode === 'pull') {
      const step = Math.floor(Math.min(len, M.maxPull) / (M.maxPull / 4));
      if (step > drag.stretched) { drag.stretched = step; FF.sfx.stretch(); }
    }
  };
  Market.pointerUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.mode === 'tap') return Market.tap();
    if (d.mode === 'pull') { const a = dragAim(d); if (a) fire(a.angle, a.power); return; }
    const s0 = d.samples[0], s1 = d.samples[d.samples.length - 1];
    const dt = Math.max(0.016, (s1.t - s0.t) / 1000);
    let vx = (s1.x - s0.x) / dt, vy = (s1.y - s0.y) / dt;
    if (vy > -50) { vx = d.px - d.sx; vy = d.py - d.sy; }
    const speed = Math.hypot(vx, vy);
    fire(clamp(Math.atan2(vx, -vy), -M.maxAngle, M.maxAngle), clamp(speed / 2600, 0.15, 1));
  };
  Market.pointerCancel = e => { if (drag && e.pointerId === drag.id) drag = null; };

  /* ---------- Drawing ---------- */
  function drawShelf(row, sc) {
    const ctx = G.ctx, h = 10 * row.s + 4;
    Draw.rr(-12, row.bottom - 3, G.W + 24, h, 4); Draw.fillStroke('#c99a62', 3);
    ctx.fillStyle = 'rgba(43,35,80,0.15)'; ctx.fillRect(0, row.bottom + h - 6, G.W, 3);
    if (sc.snowCap) { ctx.fillStyle = '#ffffff'; Draw.rr(-12, row.bottom - 7, G.W + 24, 7, 3.5); ctx.fill(); }
  }

  function drawBarrel(b, highlight) {
    const ctx = G.ctx, row = M.rows[b.r], s = row.s, bw = row.bw, bh = row.bh, x = row.xs[b.c], top = row.mouth;
    const lw = Math.max(2, 3.5 * s);
    const sq = 1 + 0.1 * Math.sin(b.bump * Math.PI);
    ctx.save();
    ctx.translate(x, top + bh); ctx.scale(sq, 1 / sq); ctx.translate(-x, -(top + bh));
    if (highlight) {
      ctx.fillStyle = 'rgba(255,230,90,0.45)';
      ctx.beginPath(); ctx.ellipse(x, top, bw * 0.62, bh * 0.28, 0, 0, TAU); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(x, top, bw * 0.42, bh * 0.1, 0, 0, TAU); ctx.fillStyle = '#4a2c14'; ctx.fill();
    const shown = b.inBarrel.slice(-4);
    shown.forEach((t, i) => Draw.fruit(t, x + (i - (shown.length - 1) / 2) * bw * 0.2, top - 1, bw * 0.15, (i - 1) * 0.3));
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x - bw * 0.42, top); ctx.quadraticCurveTo(x - bw * 0.56, top + bh * 0.5, x - bw * 0.42, top + bh);
      ctx.lineTo(x + bw * 0.42, top + bh); ctx.quadraticCurveTo(x + bw * 0.56, top + bh * 0.5, x + bw * 0.42, top);
      ctx.ellipse(x, top, bw * 0.42, bh * 0.1, 0, 0, Math.PI, false);
      ctx.closePath();
    };
    path();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#c07a3c'; ctx.fillRect(x - bw, top - bh, bw * 2, bh * 3);
    ctx.strokeStyle = '#9a5a26'; ctx.lineWidth = 2.5 * s;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * bw * 0.17, top); ctx.lineTo(x + i * bw * 0.17, top + bh); ctx.stroke(); }
    ctx.fillStyle = '#5c5870';
    ctx.fillRect(x - bw, top + bh * 0.22, bw * 2, bh * 0.1); ctx.fillRect(x - bw, top + bh * 0.72, bw * 2, bh * 0.1);
    ctx.restore();
    path(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    if (b.state === 'closed') {
      ctx.beginPath(); ctx.ellipse(x, top, bw * 0.46, bh * 0.13, 0, 0, TAU); Draw.fillStroke('#a8692c', lw);
    }
    ctx.restore();

    if (b.state === 'closed' || b.pop >= 1) return;
    // badges pop in when a barrel gets a new request
    const bp = b.pop > 0 ? 1 + 0.35 * Math.sin(b.pop * Math.PI) : 1;
    ctx.save(); ctx.translate(x, top); ctx.scale(bp, bp); ctx.translate(-x, -top);
    const fs = Math.round(clamp(20 * s, 13, 20));
    ctx.font = `800 ${fs}px "Baloo 2", "Trebuchet MS", sans-serif`;
    ctx.textBaseline = 'middle';
    // request badge on top
    const by = top - 18 * s - fs * 0.5;
    if (b.state === 'happy') {
      ctx.save(); ctx.translate(x, by); Draw.heartPath(fs * 0.9); Draw.fillStroke('#ff5e7a', 2.5); ctx.restore();
    } else {
      const label = b.wants === 'any' ? 'Any' : '', qty = '×' + (b.need - b.got);
      const iconW = b.wants === 'any' ? ctx.measureText(label).width : fs * 1.2, qW = ctx.measureText(qty).width;
      const w = fs * 0.5 + iconW + 3 + qW + fs * 0.5, h = fs * 1.7, x0 = x - w / 2;
      Draw.rr(x0, by - h / 2, w, h, h / 2); Draw.fillStroke(CARD, 2.5);
      ctx.textAlign = 'left'; ctx.fillStyle = INK;
      if (b.wants === 'any') ctx.fillText(label, x0 + fs * 0.5, by + 1);
      else Draw.fruit(b.wants, x0 + fs * 0.5 + fs * 0.6, by, fs * 0.48);
      ctx.fillStyle = INK; ctx.fillText(qty, x0 + fs * 0.5 + iconW + 3, by + 1);
    }
    // price tag at the bottom left
    if (b.state === 'open') {
      const ts = Math.round(clamp(17 * s, 12, 17));
      ctx.font = `800 ${ts}px "Baloo 2", "Trebuchet MS", sans-serif`;
      const pW = ctx.measureText(String(b.price)).width, w = ts * 1.15 + pW + ts * 0.6, h = ts * 1.5;
      const tx = x - bw * 0.56, ty = top + bh - h * 0.7;
      Draw.rr(tx, ty, w, h, 6); Draw.fillStroke(SUN, 2.5);
      Draw.coin(tx + ts * 0.62, ty + h / 2, ts * 0.38);
      ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.fillText(String(b.price), tx + ts * 1.15, ty + h / 2 + 1);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawAimGuide() {
    const ctx = G.ctx;
    if (!loaded) return null;
    let angle, power = null;
    if (drag && drag.mode === 'pull') { const a = dragAim(drag); if (!a) return null; angle = a.angle; power = a.power; }
    else if (drag && drag.mode === 'flick') return null;
    else if (phase === 'aim') angle = currentAngle();
    else { angle = lockedAngle; power = currentPower(); }
    const dirX = Math.sin(angle), dirY = -Math.cos(angle);
    const reachD = power === null ? (M.dMin + M.dMax) * 0.42 : M.dMax / Math.cos(angle);
    ctx.save();
    ctx.fillStyle = CARD; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let d = 40; d < reachD; d += 22) {
      const k = d / reachD;
      ctx.globalAlpha = power === null ? 0.95 - k * 0.4 : 0.55;
      ctx.beginPath(); ctx.arc(M.ax + dirX * d, M.ay + dirY * d, 4.5 - k * 1.5, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (power === null) {
      const hx = M.ax + dirX * reachD, hy = M.ay + dirY * reachD;
      ctx.translate(hx, hy); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-12, 4); ctx.lineTo(12, 4); ctx.closePath(); Draw.fillStroke(SUN, 3);
      ctx.restore();
      return null;
    }
    ctx.restore();
    const L = landing(angle, power), ds = depthScale(L.y), b = barrelAt(L.x, L.y), good = wantsFruit(b, loaded);
    ctx.save();
    ctx.translate(L.x, L.y);
    ctx.beginPath(); ctx.ellipse(0, 0, M.fr * 1.3 * ds, M.fr * 0.55 * ds, 0, 0, TAU);
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = good ? '#5cc24a' : CARD; ctx.stroke();
    ctx.restore();
    return { power, target: good ? b : null };
  }

  function drawPowerMeter(power) {
    const ctx = G.ctx, h = clamp(G.H * 0.12, 60, 100), w = 18, x = M.ax + 64, y = M.slingY - h + 30;
    Draw.rr(x, y, w, h, 8); Draw.fillStroke(CARD, 3);
    ctx.save(); Draw.rr(x, y, w, h, 8); ctx.clip();
    const g = ctx.createLinearGradient(0, y + h, 0, y);
    g.addColorStop(0, '#5cc24a'); g.addColorStop(0.55, '#ffd23f'); g.addColorStop(1, '#ff5e3a');
    ctx.fillStyle = g; ctx.fillRect(x, y + h * (1 - power), w, h * power);
    ctx.restore();
    Draw.rr(x, y, w, h, 8); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }

  function pouchPos() {
    if (drag && drag.mode === 'pull') {
      const dx = drag.px - drag.sx, dy = drag.py - drag.sy, len = Math.hypot(dx, dy) || 1, k = Math.min(len, M.maxPull * 0.5) / len;
      return { x: M.ax + dx * k, y: M.ay + dy * k };
    }
    return { x: M.ax, y: M.ay };
  }

  function drawTray() {
    const ctx = G.ctx, { W, H } = G, y = M.trayY;
    Draw.rr(-10, y, W + 20, H - y + 10, 10); Draw.fillStroke('#b98652', 4);
    ctx.fillStyle = 'rgba(43,35,80,0.12)'; ctx.fillRect(0, y + 10, W, 4);
    const r = Math.min(M.fr * 0.72, M.trayH * 0.34), cy = y + M.trayH * 0.52, step = r * 2.3;
    const room = Math.max(1, Math.floor((M.ax - 50) / step));
    const n = Math.min(ammo.length, ammo.length > room ? room - 1 : room);
    for (let i = 0; i < n; i++) Draw.fruit(ammo[i], 24 + i * step, cy, r);
    ctx.font = '800 22px "Baloo 2", "Trebuchet MS", sans-serif'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (ammo.length > n) {
      ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = INK;
      const tx = 24 + n * step;
      ctx.strokeText('+' + (ammo.length - n), tx, cy); ctx.fillStyle = CARD; ctx.fillText('+' + (ammo.length - n), tx, cy);
    }
    Draw.coin(M.ax + 52, cy, 12);
    ctx.textAlign = 'left'; ctx.lineWidth = 5; ctx.strokeStyle = INK;
    ctx.strokeText('+' + earned, M.ax + 70, cy + 1); ctx.fillStyle = SUN; ctx.fillText('+' + earned, M.ax + 70, cy + 1);
    ctx.textBaseline = 'alphabetic';
  }

  Market.draw = () => {
    const ctx = G.ctx, S = FF.scenery, sc = FF.scene();
    S.sky(M.horizon);
    S.stalls(M.horizon);
    S.plaza(M.horizon);

    const guide = drawAimTargetOnly();
    for (let r = 0; r < ROWS; r++) {
      drawShelf(M.rows[r], sc);
      barrels.filter(b => b.r === r).forEach(b => drawBarrel(b, guide && guide.target === b));
    }
    drawTray();

    // slingshot standing on the tray
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(M.ax, M.trayY + 4); ctx.lineTo(M.ax, M.slingY + 34);
    ctx.moveTo(M.ax, M.slingY + 40); ctx.lineTo(M.ax - 34, M.slingY - 10);
    ctx.moveTo(M.ax, M.slingY + 40); ctx.lineTo(M.ax + 34, M.slingY - 10);
    ctx.stroke();
    ctx.strokeStyle = '#a8692c'; ctx.lineWidth = 10; ctx.stroke();

    const g2 = drawAimGuide();
    if (g2 && g2.power !== null) drawPowerMeter(g2.power);

    const p = pouchPos();
    const band = back => { ctx.strokeStyle = '#6b3b1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(back ? M.ax + 34 : M.ax - 34, M.slingY - 10); ctx.lineTo(p.x + (back ? 8 : -8), p.y); ctx.stroke(); };
    band(true);
    if (loaded) Draw.fruit(loaded, p.x, p.y, M.fr);
    band(false);
    ctx.beginPath(); ctx.ellipse(p.x, p.y + M.fr * 0.55, M.fr * 0.8, M.fr * 0.35, 0, 0, Math.PI); ctx.strokeStyle = '#6b3b1a'; ctx.lineWidth = 7; ctx.stroke();

    for (const s of shots) {
      const a = s.phase === 'drop' ? Math.max(0, 1 - s.t / 0.18) : 1;
      if (s.phase === 'fly') {
        ctx.fillStyle = 'rgba(43,35,80,0.15)';
        const gx = M.ax + (s.lx - M.ax) * s.t, gy = M.ay + (s.ly - M.ay) * s.t;
        ctx.beginPath(); ctx.ellipse(gx, gy, M.fr * s.s * 0.8, M.fr * s.s * 0.3, 0, 0, TAU); ctx.fill();
      }
      Draw.fruit(s.type, s.x, s.y, M.fr * s.s, s.rot, a);
    }
    S.weather();
    FX.draw();

    // coaching for new players
    let msg = null;
    if (loaded && !drag) {
      if (shotsFired < 2) msg = phase === 'aim' ? 'Tap to aim!' : 'Tap to throw!';
      else if (shotsFired < 5 && FF.save.trips < 3) msg = 'Or pull back the slingshot!';
    }
    if (msg) {
      const pulse = 1 + 0.05 * Math.sin(G.clock * 6) + hintPulse * 0.1;
      // beside the slingshot on wide screens, above it on phones
      const front = M.rows[ROWS - 1].bottom, wide = G.W >= 640;
      const mx = wide ? M.ax - 190 : G.W / 2, my = wide ? M.slingY + 10 : front + (M.ay - M.fr - front) * 0.5;
      ctx.save(); ctx.translate(mx, my); ctx.scale(pulse, pulse);
      ctx.font = '800 21px "Baloo 2", "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.strokeText(msg, 0, 0); ctx.fillStyle = SUN; ctx.fillText(msg, 0, 0);
      ctx.restore();
    }
  };

  // Which barrel the landing ring is over right now (for the highlight), without drawing anything.
  function drawAimTargetOnly() {
    if (!loaded || (drag && drag.mode === 'flick')) return null;
    let angle, power;
    if (drag && drag.mode === 'pull') { const a = dragAim(drag); if (!a) return null; angle = a.angle; power = a.power; }
    else if (phase === 'power') { angle = lockedAngle; power = currentPower(); }
    else return null;
    const L = landing(angle, power), b = barrelAt(L.x, L.y);
    return { target: wantsFruit(b, loaded) ? b : null };
  }
})();
