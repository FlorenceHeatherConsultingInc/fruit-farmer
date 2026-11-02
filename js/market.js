/* Fruit Farmer: the market. Animals ask for fruit; you sling it to them.
   Drag down anywhere to pull back the slingshot and let go. A dotted arc shows exactly where the
   fruit will land, so the same pull always makes the same shot. On a keyboard, the arrow keys
   move the aim and Space throws.
   Center shots are Perfect, edge shots rattle around the rim and drop in. Fruit that misses or
   goes to the wrong animal rolls back to your tray, so nothing is ever lost.
   The two layouts (animal friends and the barrel wall) are in market-layouts.js. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp, rand, randi, pick } = FF.util;
  const Draw = FF.draw, FX = FF.fx, Layouts = FF.marketLayouts, Animals = FF.animals;
  const INK = D.colors.ink, CARD = D.colors.card, SUN = D.colors.sun, MK = D.market;
  const FONT = '"Baloo 2", "Trebuchet MS", sans-serif';
  const KEY_STEP = 12, HAPPY_SECONDS = 1.25, COIN_SECONDS = 0.62, REVEAL_SECONDS = 1.5;

  const M = { horizon: 0 };
  let active = 'friends', targets = [], ammo = [], shots = [], loaded = null, reloadT = 0, popIn = 0;
  let coinsFly = [], rings = [], drag = null, aim = null, stretched = 0;
  let earned = 0, streak = 0, streakBump = 0, hits = 0, soldT = -1, shake = 0, wobble = 0, revealT = 0;

  const Market = FF.market = { earned: () => earned, layoutId: () => active, targets: () => targets, metrics: () => M, loaded: () => loaded, aim: () => aim };
  const pay = () => MK[active];

  /* ---------- Layout ---------- */
  Market.layout = () => {
    const { W, H } = G;
    M.trayH = clamp(H * 0.085, 52, 70);
    M.trayY = H - M.trayH;
    M.slingY = M.trayY - clamp(H * 0.11, 64, 96);
    M.ax = W / 2; M.ay = M.slingY - 14;
    M.fr = clamp(W * 0.045, 20, 30);
    M.maxPull = clamp(Math.min(W, H) * MK.aim.pull, MK.aim.pullMin, MK.aim.pullMax);
    Layouts[active].place(M, targets);
  };

  /* ---------- Requests ---------- */
  function available(type) {
    const m = t => type === 'any' || t === type;
    let n = 0;
    for (const t of ammo) if (m(t)) n++;
    for (const s of shots) if (m(s.type)) n++;
    if (loaded && m(loaded)) n++;
    return n;
  }
  // Fruit of this type not already spoken for by another open request.
  function free(type, self) {
    let n = available(type);
    for (const t of targets) if (t !== self && t.state === 'open' && (type === 'any' || t.wants === type || t.wants === 'any')) n -= t.need - t.got;
    return n;
  }
  const takes = (t, type) => t && t.state === 'open' && t.got < t.need && (t.wants === 'any' || t.wants === type);

  function newRequest(t, force) {
    t.got = 0; t.inside = []; t.t = 0; t.pop = 1;
    t.state = 'new';
    const stock = FF.FRUIT_TYPES.filter(f => available(f) > 0);
    if (!stock.length) { t.state = 'closed'; return; }
    const spare = stock.filter(f => free(f, t) > 0);
    t.kind = pick(Animals.kinds.filter(k => k !== t.kind));
    t.wants = force || (Math.random() < MK.anyChance ? 'any' : pick(spare.length ? spare : stock));
    t.need = Math.min(randi(1, pay().maxAsk[t.row]), Math.max(1, free(t.wants, t)));
    let bonus = pay().rowBonus[t.row];
    if (Math.random() < pay().mixChance) bonus = Math.max(0, bonus + pick([-1, 1]));
    t.price = (t.wants === 'any' ? 1 : D.fruits[t.wants].price) + bonus;
    t.state = 'open';
  }
  // A request can outgrow the fruit left in play. Shrink it, or finish it if it's already started.
  function fitRequest(t) {
    if (t.state !== 'open') return;
    const left = available(t.wants);
    if (t.need - t.got <= left) return;
    if (shots.some(s => s.target === t)) return;
    if (t.got === 0 && left === 0) { if (t.t > 0.6) newRequest(t); return; }
    t.need = t.got + left;
    if (left === 0) fillUp(t);
  }
  // Never leave the player holding a fruit nobody wants.
  function askForLoaded() {
    if (!loaded || drag || shots.length || revealT > 0 || targets.some(t => takes(t, loaded))) return;
    const t = targets.find(x => x.state === 'closed') || targets.find(x => x.state === 'open' && x.got === 0);
    if (t) { newRequest(t, loaded); return; }
    // everyone is waiting on fruit further back in the tray, so bring one forward
    const i = ammo.findIndex(f => targets.some(x => takes(x, f)));
    if (i >= 0) { const next = ammo.splice(i, 1)[0]; ammo.push(loaded); loaded = next; popIn = 1; }
  }

  /* ---------- Aiming ---------- */
  // Full pull reaches past the farthest opening; the smallest pull lands just short of the nearest.
  function aimRange() {
    const ys = targets.map(t => t.y);
    return { far: M.ay - (Math.min(...ys) - 40), near: (M.ay - Math.max(...ys)) * 0.7, wide: G.W * MK.aim.reachX };
  }
  function aimFrom(d) {
    if (Math.hypot(d.px - d.sx, d.py - d.sy) < 14) return null;
    const fx = clamp((d.px - d.sx) / M.maxPull, -1, 1), fy = clamp((d.py - d.sy) / M.maxPull, 0, 1);
    const dx = fx * M.maxPull, dy = fy * M.maxPull, power = Math.max(Math.abs(fx), fy), { far, near, wide } = aimRange();
    let x = clamp(M.ax - fx * wide, 10, G.W - 10), y = Math.max(40, M.ay - (near + fy * (far - near)));
    // a soft pull toward an opening, so close shots feel good instead of fiddly
    let best = null, bq = MK.aim.snap;
    for (const t of targets) { const q = offCenter(t, x, y); if (q < bq) { bq = q; best = t; } }
    if (best) { x += (best.x - x) * MK.aim.assist; y += (best.y - y) * MK.aim.assist; }
    return { x, y, power, dx, dy, target: best };
  }
  // The pull that lands on a spot: the reverse of aimFrom().
  Market.pullFor = (x, y) => {
    const { far, near, wide } = aimRange();
    return { dx: (M.ax - x) / wide * M.maxPull, dy: (M.ay - y - near) / (far - near) * M.maxPull };
  };
  const offCenter = (t, x, y) => Math.hypot((x - t.x) / t.R, (y - t.y) / Math.max(t.ry, t.R * 0.72));
  const arcFor = (x, y) => 40 + Math.hypot(x - M.ax, y - M.ay) * 0.24;

  function fire(a) {
    const fromX = M.ax + a.dx * 0.5, fromY = M.ay + a.dy * 0.5, dist = Math.hypot(a.x - M.ax, a.y - M.ay);
    shots.push({ type: loaded, phase: 'fly', t: 0, T: 0.26 + dist / 1500, lx: a.x, ly: a.y, fromX, fromY, arc: arcFor(a.x, a.y), z: a.target ? a.target.z : 0.8, target: a.target, x: fromX, y: fromY, s: 1, rot: 0, vr: rand(-9, 9), trail: [], hot: streak >= 3 });
    loaded = null; reloadT = 0.22; wobble = 1;
    FF.sfx.twang();
  }

  /* ---------- Hits ---------- */
  function coinShower(t, n, delay) {
    for (let i = 0; i < n; i++) coinsFly.push({ x: t.x, y: t.y, t: -delay - i * 0.05, sx: t.x + rand(-40, 40), sy: t.y - rand(30, 90) });
  }
  function fillUp(t) {
    const tip = t.need * MK.tipPerFruit;
    FF.save.coins += tip; earned += tip;
    FF.save.filled++;
    coinShower(t, tip, 0.25);
    setTimeout(() => FX.text(t.x, t.y - t.R - 34, 'Full! +' + tip, true), 280);
    t.state = 'happy'; t.t = 0; t.mood = 'happy'; t.moodT = HAPPY_SECONDS;
    FX.burst(t.x, t.y - 10, ['#ff3b5c', '#ff7a9c'], 14, 'heart');
    setTimeout(FF.sfx.buy, 130);
  }
  function payOut(s, t, q) {
    const perfect = q < MK.aim.perfect;
    streak++; streakBump = 1; hits++;
    const bonus = (perfect ? MK.perfectBonus : 0) + Math.min(MK.streakBonusMax, Math.floor(streak / MK.streakEvery));
    const coins = t.price + bonus;
    t.got++; t.inside.push(s.type); t.bump = 1;
    FF.save.crate[s.type] = Math.max(0, FF.save.crate[s.type] - 1);
    FF.save.coins += coins; earned += coins;
    coinShower(t, clamp(coins, 3, 10), 0);
    t.mood = 'happy'; t.moodT = 0.9;
    FX.burst(t.x, t.y, [SUN, '#fff3a8'], perfect ? 22 : 10, 'star');
    FX.text(t.x, t.y - t.R, (perfect ? 'Perfect! +' : s.rim ? 'Lucky! +' : '+') + coins, perfect || s.rim);
    FF.sfx.coin(streak);
    if (perfect) {
      shake = 1; FF.sfx.star();
      rings.push({ x: t.x, y: t.y, r: t.R, t: 0, ry: t.ry / t.R });
    }
    if (t.got >= t.need) fillUp(t);
    FF.persist(); FF.hud.coins();
  }
  function bounceOff(s, vx, vy) { s.phase = 'fall'; s.t = 0; s.bounced = false; s.vx = vx; s.vy = vy; }
  function land(s) {
    const t = s.target, q = t ? offCenter(t, s.lx, s.ly) : 9;
    s.x = s.lx; s.y = s.ly;
    if (t && takes(t, s.type)) {
      if (q > MK.aim.rim) { s.phase = 'rim'; s.rim = true; s.t = 0; s.q = q; FF.sfx.tick(); t.bump = 0.6; return; }
      payOut(s, t, q); s.phase = 'drop'; s.t = 0;
    } else if (t) {
      bounceOff(s, (s.lx < t.x ? -1 : 1) * rand(130, 210), -320);
      if (t.state === 'open') { t.mood = 'no'; t.moodT = 0.7; }
      FX.text(t.x, t.y - t.R, t.state === 'open' ? 'Not that one!' : 'Full!', false);
      FF.sfx.nope(); streak = 0;
    } else {
      bounceOff(s, rand(-70, 70), -170);
      FF.sfx.miss(); streak = 0;
    }
  }

  /* ---------- Start / update ---------- */
  Market.start = () => {
    active = FF.save.wallOwned ? FF.save.marketLayout : 'friends';
    ammo = [];
    FF.FRUIT_TYPES.forEach(t => { for (let i = 0; i < FF.save.crate[t]; i++) ammo.push(t); });
    FF.util.shuffle(ammo);
    shots = []; coinsFly = []; rings = []; loaded = ammo.shift() || null; reloadT = 0;
    targets = Layouts[active].build();
    targets.forEach(t => { t.bump = 0; t.mood = 'idle'; t.moodT = 0; t.inside = []; t.got = 0; t.need = 0; t.state = 'closed'; });
    Market.layout();
    targets.forEach((t, i) => { newRequest(t); t.pop = 1 + i * 0.1; });
    earned = 0; soldT = -1; streak = 0; hits = FF.save.trips ? 1 : 0; drag = null; aim = null; popIn = 0;
    revealT = active === 'wall' && !FF.save.wallRevealed ? REVEAL_SECONDS : 0;
    FX.clear();
  };

  // Back from the shop: rebuild if the layout changed or a new friend arrived. Fruit already
  // sold stays sold, and this trip's earnings carry on.
  Market.refresh = () => {
    const wanted = FF.save.wallOwned ? FF.save.marketLayout : 'friends';
    if (wanted === active && Layouts[active].build().length === targets.length) return;
    const kept = earned;
    Market.start();
    earned = kept;
  };

  Market.update = dt => {
    shake = Math.max(0, shake - dt * 4); wobble = Math.max(0, wobble - dt * 2.4);
    streakBump = Math.max(0, streakBump - dt * 4); popIn = Math.max(0, popIn - dt * 5);
    reloadT -= dt;
    if (revealT > 0) {
      const was = revealT;
      revealT -= dt;
      if (was > 1 && revealT <= 1) { FX.confetti(); FF.sfx.party(); }
      if (revealT <= 0) { FF.save.wallRevealed = true; FF.persist(); }
    }
    if (!loaded && reloadT <= 0 && ammo.length) { loaded = ammo.shift(); popIn = 1; }
    aim = drag && loaded ? aimFrom(drag) : null;

    const anyLeft = ammo.length || shots.length || loaded;
    for (const t of targets) {
      t.bump = Math.max(0, t.bump - dt * 3.5); t.pop = Math.max(0, t.pop - dt * 3); t.t += dt;
      t.moodT -= dt;
      if (t.moodT <= 0) t.mood = aim && aim.target === t ? 'excited' : 'idle';
      if (t.state === 'happy' && t.t > HAPPY_SECONDS) newRequest(t);
      else if (t.state === 'closed' && anyLeft && t.t > 0.6) newRequest(t);
      else fitRequest(t);
    }
    askForLoaded();

    for (const s of shots) {
      s.rot += s.vr * dt;
      if (s.phase === 'fly') {
        s.t = Math.min(1, s.t + dt / s.T);
        const k = s.t, e = 1 - (1 - k) * (1 - k) * 0.35;
        s.x = s.fromX + (s.lx - s.fromX) * k;
        s.y = s.fromY + (s.ly - s.fromY) * k - s.arc * 4 * k * (1 - k);
        s.s = 1 + (s.z * 0.66 - 1) * e;
        s.trail.push({ x: s.x, y: s.y, r: M.fr * s.s * 0.5, a: 1 });
        if (k >= 1) land(s);
      } else if (s.phase === 'rim') {
        // rattles around the rim, then drops in
        s.t += dt / 0.55;
        const t = s.target, a = Math.atan2(s.ly - t.y, s.lx - t.x) + s.t * 5, hop = Math.abs(Math.sin(s.t * 9)) * 9 * (1 - s.t);
        s.x = t.x + Math.cos(a) * t.R * 0.9 * (1 - s.t * 0.5); s.y = t.y + Math.sin(a) * t.ry * 0.9 * (1 - s.t * 0.5) - hop;
        if (s.t >= 1) {
          if (takes(t, s.type)) { payOut(s, t, s.q); s.phase = 'drop'; s.t = 0; }
          else { s.lx = s.x; s.ly = s.y; land(s); }
        }
      } else if (s.phase === 'drop') {
        s.t += dt; s.s = Math.max(0.1, s.s - dt * 3);
        if (s.t > 0.16) s.done = true;
      } else {
        s.t += dt; s.vy += G.H * 2 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.s += (1 - s.s) * Math.min(1, dt * 3);
        const floor = M.trayY - 6;
        if (s.y > floor && !s.bounced) { s.bounced = true; s.y = floor; s.vy *= -0.42; s.vx = (24 - s.x) * 1.5; FF.sfx.plop(); }
        else if (s.y > floor) { s.y = floor; s.vy = 0; }
        if (s.t > 1.5 || (s.bounced && s.x < 40)) { s.done = true; ammo.push(s.type); }
      }
      for (const p of s.trail) p.a -= dt * 3.4;
      s.trail = s.trail.filter(p => p.a > 0);
    }
    shots = shots.filter(s => !s.done);
    for (const c of coinsFly) {
      c.t += dt;
      if (c.t >= COIN_SECONDS) { c.done = true; FF.hud.coins(true); FF.sfx.tick(); }
    }
    coinsFly = coinsFly.filter(c => !c.done);
    for (const r of rings) r.t += dt * 2.6;
    rings = rings.filter(r => r.t < 1);
    FX.update(dt);
    FF.scenery.update(dt);

    if (!loaded && !ammo.length && !shots.length) {
      if (soldT < 0) soldT = 1.0;
      else { soldT -= dt; if (soldT <= 0) { soldT = -1; FF.screens.showSold(); } }
    } else soldT = -1;
  };

  /* ---------- Pointer and keyboard ---------- */
  function pullFeedback() {
    const a = drag && aimFrom(drag);
    if (!a) return;
    const step = Math.floor(a.power * 5);
    if (step > stretched) FF.sound.tone(150 + step * 60, 0.06, 'sine', 0.05, 0, 200 + step * 60);
    stretched = step;
    if (a.target && (!aim || aim.target !== a.target)) FF.sfx.tick();
  }
  function letGo() {
    const a = drag && aimFrom(drag);
    drag = null; aim = null;
    if (a && loaded) fire(a);
  }
  Market.pointerDown = e => { drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: e.clientX, py: e.clientY }; stretched = 0; };
  Market.pointerMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.px = e.clientX; drag.py = e.clientY;
    pullFeedback();
  };
  Market.pointerUp = e => { if (drag && e.pointerId === drag.id) letGo(); };
  Market.pointerCancel = e => { if (drag && e.pointerId === drag.id) { drag = null; aim = null; } };

  // Arrow keys move the landing spot; Space throws.
  Market.nudge = (dx, dy) => {
    if (!drag) { drag = { key: true, sx: 0, sy: 0, px: 0, py: M.maxPull * 0.5 }; stretched = 0; }
    drag.px = clamp(drag.px - dx * KEY_STEP, -M.maxPull, M.maxPull);
    drag.py = clamp(drag.py - dy * KEY_STEP, 0, M.maxPull);
    pullFeedback();
  };
  Market.keyThrow = () => { if (drag && drag.key) letGo(); else if (!drag) Market.nudge(0, 0); };

  /* ---------- Drawing ---------- */
  function pouch() {
    if (aim) return { x: M.ax + aim.dx * 0.5, y: M.ay + aim.dy * 0.5 };
    return { x: M.ax, y: M.ay + Math.sin(G.clock * 40) * wobble * 14 };
  }
  function drawTray() {
    const ctx = G.ctx, { W, H } = G, y = M.trayY;
    Draw.rr(-10, y, W + 20, H - y + 10, 10); Draw.fillStroke('#b98652', 4);
    ctx.fillStyle = 'rgba(43,35,80,0.12)'; ctx.fillRect(0, y + 10, W, 4);
    const r = Math.min(M.fr * 0.72, M.trayH * 0.34), cy = y + M.trayH * 0.52, step = r * 2.3;
    const room = Math.max(1, Math.floor((M.ax - 50) / step));
    const n = Math.min(ammo.length, ammo.length > room ? room - 1 : room);
    for (let i = 0; i < n; i++) Draw.fruit(ammo[i], 24 + i * step, cy, r);
    ctx.font = `800 22px ${FONT}`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
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
  function drawSling() {
    const ctx = G.ctx, lean = Math.sin(G.clock * 38) * wobble * 6, p = pouch(), pow = aim ? aim.power : 0;
    const tipX = d => M.ax + d * 34 + lean, tipY = M.slingY - 10;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(M.ax, M.trayY + 4); ctx.lineTo(M.ax, M.slingY + 34);
    ctx.moveTo(M.ax, M.slingY + 40); ctx.lineTo(tipX(-1), tipY);
    ctx.moveTo(M.ax, M.slingY + 40); ctx.lineTo(tipX(1), tipY);
    ctx.stroke();
    ctx.strokeStyle = '#a8692c'; ctx.lineWidth = 10; ctx.stroke();
    const band = d => {
      ctx.strokeStyle = '#6b3b1a'; ctx.lineWidth = 7 - pow * 3;
      ctx.beginPath(); ctx.moveTo(tipX(d), tipY); ctx.lineTo(p.x + d * 9, p.y); ctx.stroke();
    };
    band(1);
    if (loaded) {
      const tremble = pow > 0.9 ? Math.sin(G.clock * 60) * 1.6 : 0, grow = 1 + Math.sin(popIn * Math.PI) * 0.35;
      Draw.fruit(loaded, p.x + tremble, p.y, M.fr * grow * (1 + pow * 0.12));
    }
    band(-1);
    ctx.beginPath(); ctx.ellipse(p.x, p.y + M.fr * 0.55, M.fr * 0.8, M.fr * 0.35, 0, 0, Math.PI); ctx.strokeStyle = '#6b3b1a'; ctx.lineWidth = 7; ctx.stroke();
  }
  function drawAim() {
    if (!aim) return;
    const ctx = G.ctx, arc = arcFor(aim.x, aim.y), p = pouch(), good = aim.target && takes(aim.target, loaded);
    ctx.save();
    ctx.fillStyle = good ? '#b6f2a4' : CARD; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const n = 14, off = (G.clock * 2.4) % 1;
    for (let i = 0; i < n; i++) {
      const k = (i + off) / n, x = p.x + (aim.x - p.x) * k, y = p.y + (aim.y - p.y) * k - arc * 4 * k * (1 - k);
      ctx.globalAlpha = 0.95 - k * 0.3;
      ctx.beginPath(); ctx.arc(x, y, 6 - k * 3, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!aim.target) {
      ctx.translate(aim.x, aim.y);
      ctx.beginPath(); ctx.arc(0, 0, M.fr * 0.62, 0, TAU);
      ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = CARD; ctx.stroke();
    }
    ctx.restore();
  }
  function drawShot(s) {
    const ctx = G.ctx;
    for (const p of s.trail) {
      ctx.globalAlpha = Math.max(0, p.a) * 0.55;
      ctx.fillStyle = s.hot ? SUN : D.fruits[s.type].colors[0];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * Math.max(0.2, p.a), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    Draw.fruit(s.type, s.x, s.y, M.fr * s.s, s.rot);
  }
  function drawCoins() {
    const hx = 40, hy = 33;
    for (const c of coinsFly) {
      if (c.t < 0) continue;
      const k = c.t / COIN_SECONDS, up = Math.min(1, k * 3), e = Math.max(0, (k - 0.3) / 0.7), ee = e * e;
      const x0 = c.x + (c.sx - c.x) * up, y0 = c.y + (c.sy - c.y) * up;
      Draw.coin(x0 + (hx - x0) * ee, y0 + (hy - y0) * ee, 9);
    }
  }
  function drawStreak() {
    if (streak < 2) return;
    const ctx = G.ctx, s = 1 + streakBump * 0.3, w = 112;
    ctx.save(); ctx.translate(G.W / 2, 33); ctx.scale(s, s);
    Draw.rr(-w / 2, -19, w, 38, 19); Draw.fillStroke(streak >= 5 ? '#ff9a1f' : CARD, 3);
    ctx.font = `800 18px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = INK;
    ctx.fillText('Streak ' + streak, 0, 1); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  function drawHint() {
    if (hits || drag || !loaded) return;
    const ctx = G.ctx, k = (G.clock * 0.8) % 1, y = M.ay + 16 + k * 50, tx = Math.min(G.W - 80, M.ax + 118);
    ctx.save(); ctx.globalAlpha = 1 - k * 0.7;
    ctx.beginPath(); ctx.arc(M.ax, y, 15, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    ctx.font = `800 22px ${FONT}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = INK;
    ctx.strokeText('Pull back!', tx, M.slingY + 8); ctx.fillStyle = SUN; ctx.fillText('Pull back!', tx, M.slingY + 8);
  }

  Market.draw = () => {
    const ctx = G.ctx, S = FF.scenery, sc = FF.scene(), sk = G.reduce ? 0 : shake * 7;
    ctx.save();
    if (sk) ctx.translate(Math.sin(G.clock * 70) * sk, Math.cos(G.clock * 57) * sk);
    S.sky(M.horizon);
    S.stalls(M.horizon);
    S.plaza(M.horizon);
    Layouts[active].draw(M, targets, aim && aim.target, sc);
    if (revealT > 0) Layouts.wall.drawCloth(M, clamp(1 - revealT, 0, 1), sc);
    drawTray();
    drawSling();
    drawAim();
    for (const r of rings) {
      ctx.globalAlpha = 1 - r.t; ctx.lineWidth = 8 * (1 - r.t) + 1; ctx.strokeStyle = SUN;
      const q = r.r * (1 + r.t * 1.5);
      ctx.beginPath(); ctx.ellipse(r.x, r.y, q, q * r.ry, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    shots.forEach(drawShot);
    S.weather();
    FX.draw();
    drawCoins();
    drawStreak();
    drawHint();
    ctx.restore();
    ctx.textAlign = 'left';
  };

  Layouts.env.takes = t => takes(t, loaded);
  Layouts.env.look = (x, y) => {
    const f = shots[0] || aim || { x: M.ax, y: M.ay }, dx = f.x - x, dy = f.y - y, n = Math.hypot(dx, dy) || 1;
    return { x: dx / n, y: dy / n };
  };
})();
