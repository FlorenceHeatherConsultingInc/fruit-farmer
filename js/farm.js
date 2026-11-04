/* Fruit Farmer: the orchard.
   Move your hands, basket or cart to catch falling fruit until it's full, then head to market.
   Every fruit is placed so it can be reached from where the previous one lands. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp, rand, pick } = FF.util;
  const Draw = FF.draw, FX = FF.fx, INK = D.colors.ink;

  const basket = { x: 0, tx: 0, y: 0, w: 100, h: 50, bounce: 0, vel: 0, wheel: 0 };
  let fruits = [], pile = [], spawnT = 0.5, combo = 0, fullT = -1, grove = null, shakeT = 0, bareT = -1;
  let moveHold = 0, moveDir = 0, zipping = false, drag = null, groundY = 0;

  const Farm = FF.farm = { basket };

  Farm.layout = () => {
    const { W, H } = G, c = FF.carrier();
    basket.w = Math.min(W * 0.6, clamp(W * 0.25, 108, 165));   // every look catches the same width
    const baseH = clamp(W * 0.25, 108, 165) * 0.5;
    basket.h = c.look === 'hands' ? baseH * 0.85 : baseH;
    groundY = H - clamp(H * 0.11, 56, 110);
    const lift = { hands: 0.95, barrow: 1.12, cart: 1.12, wagon: 1.12 }[c.look] || 0.75;
    basket.y = groundY - basket.h * lift;
    if (!basket.x) basket.x = basket.tx = W / 2;
    basket.x = clamp(basket.x, basket.w / 2, W - basket.w / 2);
    basket.tx = clamp(basket.tx, basket.w / 2, W - basket.w / 2);
  };

  /* ---------- Movement feel ---------- */
  // A tap glides a short, precise distance; holding eases smoothly into a full zip.
  function tuning() {
    const m = D.movement, lv = FF.save.up.speed || 0, W = G.W;
    return {
      tap: W * (m.tapSpeed + m.wheels.tap * lv),
      top: W * (m.topSpeed + m.wheels.top * lv),
      ramp: Math.max(0.12, m.rampSeconds + m.wheels.ramp * lv),
      delay: m.rampDelay, grip: m.grip, brake: m.brake
    };
  }
  function targetSpeed(t, mt) {
    const k = clamp((t - mt.delay) / mt.ramp, 0, 1);
    return mt.tap + (mt.top - mt.tap) * k * k * (3 - 2 * k);
  }
  // How far a player can comfortably travel in `gap` seconds, used to keep every fruit catchable.
  function reach(gap) {
    const mt = tuning();
    let d = 0;
    for (let t = 0; t < gap; t += 0.02) d += targetSpeed(t, mt) * 0.02;
    return d * 0.6 + basket.w * 0.25;
  }

  /* ---------- Fruit ---------- */
  // Mostly this grove's own fruit, some from nearby trees, and now and then a gold star.
  // Fruit only falls while the grove still has some; a grove only loses fruit you catch.
  const flying = t => fruits.filter(f => !f.landed && f.type === t).length;
  const left = t => FF.groves.stock(t) - flying(t);
  function pickType(demo) {
    if (Math.random() < D.stars.base + D.stars.perLevel * (FF.save.up.luck || 0)) return 'star';
    if (demo) return pick(FF.save.trees);
    if (left(grove) <= 0) return null;
    const others = FF.save.trees.filter(t => t !== grove && left(t) > 0);
    return !others.length || Math.random() < D.groveMix ? grove : pick(others);
  }
  function spawnFruit(demo, shake) {
    const r = clamp(G.W * 0.055, 26, 42), edge = Math.max(r + 8, G.W * D.speeds.edge);
    const type = pickType(demo);
    if (!type) return false;
    const vy = G.H * D.speeds[FF.save.speed].fall * (shake ? 1.12 : 1);
    const y0 = -r * 1.5 - (shake ? shake.i * 26 : 0);
    const arrive = G.clock + (basket.y - y0) / vy;
    if (shake) {
      // a shake drops fruit across the whole width: you choose which to chase
      const x = clamp(edge + (G.W - 2 * edge) * (shake.i + 0.5) / shake.n + rand(-0.04, 0.04) * G.W, edge, G.W - edge);
      fruits.push({ x, y: y0, r, type, vy, arrive, rot: rand(-0.3, 0.3), vr: rand(-0.8, 0.8), landed: false, life: 1, caught: false, shake: true, bonus: !demo && type !== grove && type !== 'star' });
      return true;
    }
    let prev = null;
    for (const f of fruits) if (!f.landed && !f.shake && (!prev || f.arrive > prev.arrive)) prev = f;
    if (prev && arrive < prev.arrive + 0.35) return false;
    const fromX = prev ? prev.x : basket.x;
    const d = demo ? G.W : reach(prev ? arrive - prev.arrive : arrive - G.clock);
    const lo = Math.max(edge, fromX - d), hi = Math.min(G.W - edge, fromX + d);
    // Fruit falls near its own tree, as far as staying catchable allows. Stars can come from anywhere.
    const tree = D.trees.find(t => t.type === type);
    const x = tree ? clamp(G.W * (tree.spot + rand(-0.09, 0.09)), lo, Math.max(lo, hi)) : rand(lo, Math.max(lo, hi));
    fruits.push({ x, y: y0, r, type, vy, arrive, rot: rand(-0.3, 0.3), vr: rand(-0.8, 0.8), landed: false, life: 1, caught: false, bonus: !demo && type !== grove && type !== 'star' });
    return true;
  }

  // Any contact with the carrier counts: the wide rim or the sides.
  function touches(f) {
    const { x, y, w, h } = basket;
    const fr = f.r * 0.85, top = y - h * 0.15, bottom = y + h;
    if (f.y + fr < top || f.y - fr > bottom) return false;
    const yy = clamp(f.y, top, bottom);
    const half = yy <= y + h * 0.13 ? w / 2 + 7 : w / 2 - w * 0.1 * ((yy - y) / h);
    return Math.abs(f.x - x) < half + fr;
  }

  function onCatch(f, demo) {
    basket.bounce = 1;
    FX.burst(f.x, basket.y, D.fruits[f.type].colors, f.type === 'star' ? 26 : 12);
    pile.push({ type: f.type, dx: rand(-1, 1), rot: rand(-0.5, 0.5) });
    if (pile.length > 9) pile.shift();
    if (demo || FF.carried() >= FF.cap()) return;
    FF.save.crate[f.type]++;
    Farm.visit.caught[f.type] = (Farm.visit.caught[f.type] || 0) + 1;
    if (f.type !== 'star') FF.groves.take(f.type);
    FF.book.harvest(f.type);
    FF.addPoints(D.levels.pointsPerCatch);
    FF.orders.caught(); FF.hud.pin();
    combo++;
    FF.persist();
    FF.hud.load(true);
    if (f.bonus) { FX.text(f.x, basket.y - 50, 'Bonus!', true); FX.burst(f.x, basket.y, ['#ffd23f', '#ffffff'], 14, 'star'); Farm.bonus[f.type] = (Farm.bonus[f.type] || 0) + 1; }
    FX.text(f.x, basket.y - 18, FF.carried() + '/' + FF.cap(), f.type === 'star');
    if (f.type === 'star') FF.sfx.star(); else FF.sfx.catch(combo - 1);
    if (FF.carried() >= FF.cap()) { fullT = 0.8; FX.confetti(); setTimeout(FF.sfx.party, 150); }
  }

  /* ---------- Start / update ---------- */
  // g: which grove to pick from.
  Farm.bonus = {}; Farm.visit = { caught: {}, points: 0 };
  // keep: true when Keep picking carries on the same visit, so the summary adds up every trip.
  Farm.start = (g, keep) => {
    grove = FF.save.trees.includes(g) ? g : FF.save.trees[0];
    if (!keep) { Farm.visit = { caught: {}, points: FF.save.points }; Farm.bonus = {}; }
    Farm.startPoints = Farm.visit.points;
    shakeT = D.speeds[FF.save.speed].shakeEvery * 0.6; bareT = -1;
    fruits = []; FX.clear();
    pile = [];
    FF.FRUIT_TYPES.forEach(t => { for (let i = 0; i < FF.save.crate[t]; i++) pile.push({ type: t, dx: rand(-1, 1), rot: rand(-0.5, 0.5) }); });
    pile = pile.slice(-9);
    basket.x = basket.tx = G.W / 2; basket.vel = 0;
    spawnT = 0.6; combo = 0; drag = null; moveHold = 0; moveDir = 0;
    fullT = FF.carried() >= FF.cap() ? 0.4 : -1;
  };
  Farm.reset = () => { fruits = []; pile = []; };
  Farm.grove = () => grove;
  Farm.falling = () => fruits.filter(f => !f.landed);
  Farm.nextFruitX = () => { let n = null; for (const f of fruits) if (!f.landed && (!n || f.y > n.y)) n = f; return n ? n.x : null; };

  Farm.update = (dt, demo) => {
    const inp = G.input, mt = tuning(), prevX = basket.x;
    if (!demo) {
      const dir = ((inp.keys.right || inp.pads.right) ? 1 : 0) - ((inp.keys.left || inp.pads.left) ? 1 : 0);
      if (dir) {
        inp.mode = 'keys';
        if (dir !== moveDir) { moveHold = 0; if (Math.sign(basket.vel) !== dir) FF.sfx.tick(); }
        moveDir = dir; moveHold += dt;
        basket.vel += (dir * targetSpeed(moveHold, mt) - basket.vel) * Math.min(1, dt * mt.grip);
        basket.x += basket.vel * dt;
        basket.tx = basket.x;
      } else if (inp.mode === 'keys') {
        moveHold = 0; moveDir = 0;
        basket.vel -= basket.vel * Math.min(1, dt * mt.brake);
        if (Math.abs(basket.vel) < 3) basket.vel = 0;
        basket.x += basket.vel * dt;
        basket.tx = basket.x;
      } else {
        const maxStep = mt.top * 1.1 * dt;
        const step = clamp((basket.tx - basket.x) * Math.min(1, dt * 16), -maxStep, maxStep);
        basket.x += step; basket.vel = dt > 0 ? step / dt : 0;
      }
    } else {
      let target = null;
      for (const f of fruits) if (!f.landed && f.y < basket.y && (!target || f.y > target.y)) target = f;
      if (target) basket.tx = target.x;
      const step = clamp((basket.tx - basket.x) * Math.min(1, dt * 4), -G.W * 0.45 * dt, G.W * 0.45 * dt);
      basket.x += step; basket.vel = dt > 0 ? step / dt : 0;
    }
    const lo = basket.w / 2, hi = G.W - basket.w / 2;
    if (basket.x <= lo || basket.x >= hi) { basket.x = clamp(basket.x, lo, hi); if (inp.mode === 'keys') basket.vel = 0; }
    basket.tx = clamp(basket.tx, lo, hi);
    basket.wheel += (basket.x - prevX) / Math.max(10, basket.h * 0.3);
    const fast = Math.abs(basket.vel) > mt.top * 0.62;
    if (fast && !zipping && !demo) FF.sfx.zip();
    zipping = fast;
    if (fast && !demo && Math.random() < dt * 30) FX.dust(basket.x - Math.sign(basket.vel) * basket.w * 0.4, groundY - 4, Math.sign(basket.vel));
    basket.bounce = Math.max(0, basket.bounce - dt * 4);

    const sp = D.speeds[FF.save.speed], falling = fruits.filter(f => !f.landed).length;
    const full = !demo && FF.carried() + falling >= FF.cap();
    spawnT -= dt;
    if (spawnT <= 0) {
      if (full) spawnT = 0.3;
      else if (spawnFruit(demo)) spawnT = sp.gap * rand(0.75, 1.25);
      else spawnT = 0.2;
    }
    // now and then the tree shakes and drops a clump; it waits while a pinned order is filled
    if (!demo) {
      shakeT -= dt;
      if (shakeT <= 0 && !(FF.orders && FF.orders.pinFilled())) {
        shakeT = sp.shakeEvery * rand(0.85, 1.15);
        const n = Math.min(sp.shakeSize, FF.cap() - FF.carried() - falling);
        for (let i = 0; i < n; i++) spawnFruit(false, { i, n });
        if (n > 0) { FX.burst(G.W / 2, 4, ['#5cc24a', '#8bd16a'], 10, 'dot'); FF.sfx.zip(); }
      }
      // the grove is bare when it has nothing left and nothing is falling
      if (bareT < 0 && fullT < 0 && left(grove) <= 0 && !fruits.some(f => !f.landed)) bareT = 0.8;
      if (bareT > 0 && (bareT -= dt) <= 0) FF.screens.showFull(true);
    }

    for (const f of fruits) {
      if (f.landed) { f.life -= dt * 1.4; continue; }
      f.y += f.vy * dt; f.rot += f.vr * dt;
      if (touches(f)) { f.caught = true; onCatch(f, demo); continue; }
      if (f.y + f.r * 0.75 >= groundY) {
        f.landed = true; f.y = groundY - f.r * 0.75;
        if (!demo) { combo = 0; FX.burst(f.x, groundY, ['#8bd16a', '#b98a5a'], 6); FF.sfx.miss(); }
      }
    }
    fruits = fruits.filter(f => !f.caught && f.life > 0);
    FX.update(dt);
    FF.scenery.update(dt);

    if (fullT > 0) { fullT -= dt; if (fullT <= 0) { fullT = -1; FF.screens.showFull(); } }
  };

  /* ---------- Pointer: drag is relative, so the basket never jumps to your finger ---------- */
  Farm.pointerDown = e => { G.input.mode = 'pointer'; drag = { id: e.pointerId, offset: basket.x - e.clientX }; basket.tx = basket.x; };
  Farm.pointerMove = e => {
    const k = G.input.keys;
    if (drag && e.pointerId === drag.id) basket.tx = e.clientX + drag.offset;
    else if (!drag && e.pointerType === 'mouse' && !k.left && !k.right) { G.input.mode = 'pointer'; basket.tx = e.clientX; }
  };
  Farm.pointerUp = e => { if (drag && e.pointerId === drag.id) drag = null; };

  /* ---------- Drawing the carrier ---------- */
  function bodyPath(look, w, h) {
    const ctx = G.ctx;
    if (look === 'cart' || look === 'wagon') { Draw.rr(-w / 2, 0, w, h * 0.78, 6); return; }
    ctx.beginPath();
    if (look === 'barrow') {
      ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w * 0.32, h * 0.72); ctx.lineTo(-w * 0.36, h * 0.72); ctx.closePath();
    } else {
      ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0);
      ctx.lineTo(w * 0.4, h * 0.9); ctx.quadraticCurveTo(w * 0.38, h, w * 0.3, h);
      ctx.lineTo(-w * 0.3, h); ctx.quadraticCurveTo(-w * 0.38, h, -w * 0.4, h * 0.9);
      ctx.closePath();
    }
  }
  function paintBody(look, w, h, sk) {
    const ctx = G.ctx;
    bodyPath(look, w, h);
    ctx.save(); ctx.clip();
    if (sk.rainbow) D.rainbow.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-w, i * h / D.rainbow.length, w * 2, h / D.rainbow.length + 1); });
    else { ctx.fillStyle = sk.body; ctx.fillRect(-w, 0, w * 2, h); }
    ctx.strokeStyle = sk.weave; ctx.lineWidth = 3;
    if (look === 'cart' || look === 'wagon') {
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w, i * h * 0.195); ctx.lineTo(w, i * h * 0.195); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-w * 0.45, 4); ctx.lineTo(w * 0.45, h * 0.74); ctx.moveTo(w * 0.45, 4); ctx.lineTo(-w * 0.45, h * 0.74); ctx.stroke();
    } else if (look === 'barrow') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w * 0.4, h * 0.1, w * 0.8, h * 0.1);
    } else {
      for (let row = 1; row < 4; row++) { ctx.beginPath(); ctx.moveTo(-w, row * h / 4); ctx.lineTo(w, row * h / 4); ctx.stroke(); }
      for (let row = 0; row < 4; row++) for (let col = -7; col <= 7; col++) {
        const cx = col * w * 0.12 + (row % 2 ? w * 0.06 : 0);
        ctx.beginPath(); ctx.moveTo(cx, row * h / 4 + 4); ctx.lineTo(cx, (row + 1) * h / 4 - 4); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    bodyPath(look, w, h); ctx.stroke();
  }
  function wheel(x, y, r) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); Draw.fillStroke('#4a4560', 4);
    ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, TAU); Draw.fillStroke('#d8d4e6', 3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(basket.wheel);
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0); ctx.stroke(); }
    ctx.restore();
  }

  // Small stars on the rim show the basket's tier.
  function tierStars(w, h, tier) {
    const ctx = G.ctx, n = Math.min(tier, 5), gap = Math.min(16, w * 0.12);
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate((i - (n - 1) / 2) * gap, -h * 0.02); Draw.starPath(6.5); Draw.fillStroke(D.colors.sun, 2); ctx.restore(); }
    if (tier > 5) {
      ctx.font = `800 13px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.strokeText('+' + (tier - 5), n * gap / 2 + 14, 4); ctx.fillStyle = D.colors.sun; ctx.fillText('+' + (tier - 5), n * gap / 2 + 14, 4);
    }
  }

  function drawCarrier(demo, lookOverride) {
    const ctx = G.ctx, { x, y, w, h } = basket, preview = !!lookOverride;
    const look = lookOverride || FF.carrier().look, sk = FF.skin(), top = tuning().top;
    const b = Math.sin(basket.bounce * Math.PI);
    const lean = clamp(basket.vel / top, -1, 1) * (look === 'hands' ? 0.06 : 0.09);
    ctx.save();
    ctx.translate(x, y + h); ctx.rotate(lean); ctx.scale(1 + 0.06 * b, 1 - 0.09 * b); ctx.translate(0, -h);

    if (!preview) {
      ctx.fillStyle = 'rgba(43,35,80,0.18)';
      ctx.beginPath(); ctx.ellipse(0, groundY - y + 2, w * 0.45, 7, 0, 0, TAU); ctx.fill();
    }

    if (look === 'handle') {
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.36, h * 0.8, 0, Math.PI, TAU);
      ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = sk.rim; ctx.stroke();
    }

    const n = pile.length, fr = Math.min(h * 0.24, w * 0.11), spread = look === 'hands' ? w * 0.22 : w * 0.11;
    pile.forEach((p, i) => {
      const px = (i - (n - 1) / 2) * spread + p.dx * 4;
      Draw.fruit(p.type, px, (look === 'hands' ? h * 0.18 : -2) - (i % 2) * 5, look === 'hands' ? h * 0.3 : fr, p.rot);
    });

    if (look === 'hands') {
      // two cupped garden gloves
      [-1, 1].forEach(side => {
        ctx.save(); ctx.translate(side * w * 0.24, h * 0.42); ctx.rotate(side * -0.35);
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.3, h * 0.42, 0, 0, TAU);
        Draw.fillStroke(sk.rainbow ? D.rainbow[side > 0 ? 4 : 0] : sk.body, 4);
        ctx.beginPath(); ctx.ellipse(side * w * 0.22, -h * 0.32, w * 0.09, h * 0.2, side * 0.6, 0, TAU);
        Draw.fillStroke(sk.rainbow ? D.rainbow[2] : sk.body, 3.5);
        ctx.strokeStyle = sk.weave; ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.09, h * 0.05); ctx.lineTo(i * w * 0.09, h * 0.32); ctx.stroke(); }
        ctx.restore();
        ctx.save(); ctx.translate(side * w * 0.42, h * 0.78);
        Draw.rr(-w * 0.1, -h * 0.08, w * 0.2, h * 0.22, 6); Draw.fillStroke(sk.rim, 3);
        ctx.restore();
      });
    } else {
      if (look === 'barrow') {
        ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-w * 0.2, h * 0.65); ctx.lineTo(-w * 0.62, h * 0.35); ctx.stroke();
        ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-w * 0.28, h * 0.7); ctx.lineTo(-w * 0.3, h * 1.12); ctx.stroke();
      }
      paintBody(look, w, h, sk);
      Draw.rr(-w / 2 - 7, -h * 0.13, w + 14, h * 0.26, h * 0.13);
      Draw.fillStroke(sk.rim, 4);
      if (look === 'barrow') wheel(w * 0.28, h * 0.92, h * 0.28);
      if (look === 'cart') { wheel(-w * 0.3, h * 0.86, h * 0.3); wheel(w * 0.3, h * 0.86, h * 0.3); }
      if (look === 'wagon') {
        // tall side rails and a pull handle make it read as bigger without being wider
        ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round';
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * w * 0.46, -h * 0.1); ctx.lineTo(d * w * 0.46, -h * 0.62); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.58); ctx.lineTo(w * 0.5, -h * 0.58); ctx.stroke();
        ctx.strokeStyle = sk.rim; ctx.lineWidth = 4; ctx.stroke();
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * w * 0.46, -h * 0.1); ctx.lineTo(d * w * 0.46, -h * 0.62); ctx.stroke(); }
        ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.45); ctx.lineTo(w * 0.72, h * 0.25); ctx.stroke();
        ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 3.5; ctx.stroke();
        wheel(-w * 0.3, h * 0.88, h * 0.34); wheel(w * 0.3, h * 0.88, h * 0.34);
      }
    }
    ctx.restore();
  }

  // A small picture of any basket look, for the shop.
  Farm.lookPreview = look => {
    const saved = { ...basket }, savedPile = pile;
    try {
      return Draw.toCanvas(132, 104, () => {
        Object.assign(basket, { x: 66, y: 34, w: 80, h: 40, bounce: 0, vel: 0 });
        pile = [{ type: 'apple', dx: 0, rot: 0 }, { type: 'orange', dx: 0, rot: 0.2 }];
        drawCarrier(true, look);
      });
    } finally { Object.assign(basket, saved); pile = savedPile; }
  };

  function drawSpeedLines() {
    const ctx = G.ctx, v = Math.abs(basket.vel), top = tuning().top;
    if (v < top * 0.45) return;
    const a = clamp((v - top * 0.45) / (top * 0.5), 0, 1) * 0.45, dir = Math.sign(basket.vel);
    ctx.save();
    ctx.strokeStyle = `rgba(43,35,80,${a})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
    [0.15, 0.45, 0.75].forEach((k, i) => {
      const yy = basket.y + basket.h * k, x0 = basket.x - dir * (basket.w * 0.5 + 10), len = 24 + i * 16 + v * 0.05;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 - dir * len, yy); ctx.stroke();
    });
    ctx.restore();
  }

  Farm.draw = demo => {
    const S = FF.scenery;
    S.sky(groundY);
    S.hills(groundY);
    S.trees(groundY);
    S.ground(groundY);
    for (const f of fruits) if (f.landed) Draw.fruit(f.type, f.x, f.y, f.r, f.rot, Math.max(0, f.life), 0.85);
    if (!demo) drawSpeedLines();
    drawCarrier(demo);
    const ctx = G.ctx;
    for (const f of fruits) {
      if (f.landed || !f.bonus) continue;
      const tw = 0.5 + 0.5 * Math.sin(G.clock * 9 + f.x);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * tw; ctx.fillStyle = '#fff6a8';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.45 + 0.15 * tw), 0, TAU); ctx.fill(); ctx.restore();
    }
    for (const f of fruits) if (!f.landed) Draw.fruit(f.type, f.x, f.y, f.r, f.rot);
    S.weather();
    FX.draw();
  };
})();
