/* Fruit Farmer: the village map. A wide world you drag left and right, in five areas listed in
   D.map.areas: groves, friends' homes, the kitchen row, the barnyard and the fields. Art is drawn
   in world units 700 tall and scaled to fit between the top bar and the jump buttons. Areas that
   arrive in later steps show wooden "coming soon" signs. Everything restyles with the scene. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, $ = FF.$, { TAU, clamp } = FF.util;
  const Draw = FF.draw, Animals = FF.animals, INK = D.colors.ink;
  const WORLD_H = 700, HORIZON = 250, STREET = 500, TAP_MOVE = 10, GLIDE = 4.5;
  const M = { k: 1, top: 0, cam: 0, vel: 0, target: null, from: 'title' };
  let drag = null, hits = [];

  const Map = FF.map = { metrics: () => M };
  const areaX = id => { let x = 0; for (const a of D.map.areas) { if (a.id === id) return x; x += a.w; } return 0; };
  const worldW = () => D.map.areas.reduce((n, a) => n + a.w, 0);
  const viewW = () => G.W / M.k;
  const clampCam = c => clamp(c, 0, Math.max(0, worldW() - viewW()));

  Map.layout = () => {
    const top = clamp(G.H * 0.09, 62, 80), bottom = clamp(G.H * 0.1, 66, 84);
    M.top = top; M.k = (G.H - top - bottom) / WORLD_H;
    M.cam = clampCam(M.cam);
  };
  Map.start = from => {
    M.from = from || 'title'; M.vel = 0; M.target = null; drag = null;
    if (!M.seen) { M.seen = true; M.cam = clampCam(areaX('friends') - 40); }
    Map.layout();
  };
  Map.jump = id => { M.target = clampCam(areaX(id) - 20); M.vel = 0; FF.sfx.tick(); };
  Map.areaAt = () => { const mid = M.cam + viewW() / 2; let x = 0; for (const a of D.map.areas) { if (mid < x + a.w) return a.id; x += a.w; } return D.map.areas[D.map.areas.length - 1].id; };

  Map.update = dt => {
    if (M.target != null) {
      M.cam += (M.target - M.cam) * Math.min(1, dt * 7);
      if (Math.abs(M.target - M.cam) < 1) { M.cam = M.target; M.target = null; }
    } else if (!drag && M.vel) {
      M.cam = clampCam(M.cam + M.vel * dt);
      M.vel *= Math.exp(-GLIDE * dt);
      if (Math.abs(M.vel) < 5 || M.cam <= 0 || M.cam >= clampCam(1e9)) M.vel = 0;
    }
    document.querySelectorAll('[data-jump]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.jump === Map.areaAt())));
    FF.scenery.update(dt); FF.fx.update(dt);
  };

  /* ---------- Pointer: drag to look around, tap to visit ---------- */
  Map.pointerDown = e => { drag = { id: e.pointerId, x0: e.clientX, x: e.clientX, t: performance.now(), moved: 0, v: 0, last: performance.now() }; M.vel = 0; M.target = null; };
  Map.pointerMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now(), dx = e.clientX - drag.x;
    M.cam = clampCam(M.cam - dx / M.k);
    drag.v = -dx / M.k / Math.max(0.008, (now - drag.last) / 1000);
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x0)); drag.x = e.clientX; drag.last = now;
  };
  Map.pointerUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.moved < TAP_MOVE) return tap(M.cam + e.clientX / M.k, (e.clientY - M.top) / M.k);
    if (performance.now() - d.last < 80) M.vel = clamp(d.v, -2600, 2600);
  };
  Map.pointerCancel = () => { drag = null; };
  function tap(wx, wy) {
    const hit = hits.find(h => wx > h.x0 && wx < h.x1 && wy > h.y0 && wy < h.y1);
    if (hit) hit.go();
  }
  // Tap targets are collected while drawing, in world units.
  const target = (x0, y0, x1, y1, go) => hits.push({ x0, y0, x1, y1, go });

  /* ---------- Shared art ---------- */
  function label(x, text) {
    const ctx = G.ctx;
    ctx.font = `800 38px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = INK;
    ctx.strokeText(text, x, 62); ctx.fillStyle = D.colors.sun; ctx.fillText(text, x, 62);
  }
  function sign(x, y, text, small) {
    const ctx = G.ctx;
    Draw.rr(x - 5, y - 52, 10, 52, 2); Draw.fillStroke('#8a5a32', 3);
    ctx.font = `800 ${small ? 18 : 21}px "Baloo 2", "Trebuchet MS", sans-serif`;
    const lines = text.split('\n'), w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 26, h = 14 + lines.length * 24;
    Draw.rr(x - w / 2, y - 52 - h, w, h, 8); Draw.fillStroke('#e9c79a', 3);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, y - 52 - h + 19 + i * 24));
    ctx.textBaseline = 'alphabetic';
  }
  function fenceRun(x0, x1, y, h = 46) {
    for (let x = x0; x <= x1; x += 34) { Draw.rr(x - 6, y - h, 12, h, 3); Draw.fillStroke('#fff0d0', 3); }
    Draw.rr(x0 - 6, y - h * 0.78, x1 - x0 + 12, 9, 3); Draw.fillStroke('#fff0d0', 3);
    Draw.rr(x0 - 6, y - h * 0.4, x1 - x0 + 12, 9, 3); Draw.fillStroke('#fff0d0', 3);
  }
  function trunkColor(sc) { return sc.trunk === 'candy' ? '#fff0f4' : sc.trunk; }

  /* ---------- Groves ---------- */
  function groves(x0, sc) {
    const ctx = G.ctx;
    label(x0 + 450, 'Groves');
    D.trees.forEach((t, i) => {
      const x = x0 + 95 + i * 178, y = STREET - 10, planted = FF.save.trees.includes(t.type);
      if (!planted) { sign(x, y, D.fruits[t.type].name + '\nin the shop', true); return; }
      Draw.rr(x - 11, y - 96, 22, 96, 4); Draw.fillStroke(trunkColor(sc), 3);
      Draw.blob([[x - 40, y - 120, 40], [x + 40, y - 120, 40], [x, y - 164, 52]], sc.foliage[i % sc.foliage.length], 4);
      // the tree looks as full as the grove is
      const n = FF.groves.stock(t.type), shown = Math.ceil(7 * n / FF.groves.holds(t.type));
      for (let k = 0; k < shown; k++) Draw.fruit(t.type, x - 45 + (k % 4) * 30, y - 130 - Math.floor(k / 4) * 38 - (k % 2) * 7, 14);
      ctx.fillStyle = 'rgba(43,35,80,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 60, 10, 0, 0, TAU); ctx.fill();
      ctx.font = `800 22px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = INK;
      const tag = n ? n + ' left' : 'Bare'; ctx.strokeText(tag, x, y + 40); ctx.fillStyle = D.colors.card; ctx.fillText(tag, x, y + 40);
      target(x - 70, y - 240, x + 70, y + 50, () => { FF.sfx.tick(); FF.groves.open(t.type); });
    });
  }

  /* ---------- Friends' street ---------- */
  function cottage(x, y, roof, kind, i) {
    const ctx = G.ctx, w = 104, h = 70;
    ctx.fillStyle = 'rgba(43,35,80,0.14)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.62, 9, 0, 0, TAU); ctx.fill();
    Draw.rr(x + 22, y - h - 62, 18, 36, 3); Draw.fillStroke('#b05a44', 3);
    Draw.rr(x - w / 2, y - h, w, h, 5); Draw.fillStroke('#fff0d0', 4);
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 12, y - h + 2); ctx.lineTo(x - w / 2 + 12, y - h - 46); ctx.lineTo(x + w / 2 - 12, y - h - 46); ctx.lineTo(x + w / 2 + 12, y - h + 2); ctx.closePath();
    Draw.fillStroke(roof, 4);
    ctx.beginPath(); ctx.moveTo(x - 32, y); ctx.lineTo(x - 32, y - 32); ctx.arc(x - 18, y - 32, 14, Math.PI, 0); ctx.lineTo(x - 4, y); ctx.closePath(); Draw.fillStroke('#a8692c', 3);
    Draw.rr(x + 8, y - 52, 30, 26, 3); Draw.fillStroke('#bfe6fb', 3);
    const bob = Math.abs(Math.sin(G.clock * 2 + i)) * 4;
    Animals.drawHead(kind, x + 42, y - 14 - bob, 24, 'idle', G.clock + i, { x: Math.sin(G.clock * 0.7 + i) * 0.6, y: 0.3 });
  }
  // Only the next couple of empty lots get a sign, so the street doesn't fill up with them.
  function emptyLot(x, y, signed) {
    const ctx = G.ctx;
    ctx.fillStyle = 'rgba(43,35,80,0.1)'; ctx.beginPath(); ctx.ellipse(x, y - 4, 52, 12, 0, 0, TAU); ctx.fill();
    if (signed) sign(x, y, 'For a\nfriend', true);
  }
  function decor(id, x, y, s = 2.3) {
    const ctx = G.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); DECOR[id](ctx); ctx.restore();
  }
  const DECOR = {
    windmill(ctx) {
      Draw.rr(-9, -26, 18, 30, 4); Draw.fillStroke('#e9c79a', 2.5);
      ctx.save(); ctx.translate(0, -26); ctx.rotate(G.clock * 0.8);
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); Draw.rr(-3, -22, 6, 20, 2); Draw.fillStroke('#fff0d0', 2); }
      ctx.restore();
    },
    pond(ctx) { ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, TAU); Draw.fillStroke('#6ec2f5', 2.5); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-8, -2, 9, 2.5, 0, 0, TAU); ctx.fill(); },
    well(ctx) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-9, -18); ctx.moveTo(9, 0); ctx.lineTo(9, -18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -17); ctx.lineTo(0, -27); ctx.lineTo(14, -17); ctx.closePath(); Draw.fillStroke('#ff6b6b', 2.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, TAU); Draw.fillStroke('#b8b4c8', 2.5);
    },
    fountain(ctx) {
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, 0, 0, TAU); Draw.fillStroke('#c9d9e8', 2.5);
      Draw.rr(-3, -18, 6, 16, 2); Draw.fillStroke('#c9d9e8', 2);
      ctx.fillStyle = '#6ec2f5'; ctx.beginPath(); ctx.arc(0, -21 + Math.sin(G.clock * 4), 5, 0, TAU); ctx.fill();
    },
    bench(ctx) { Draw.rr(-15, -9, 30, 6, 2); Draw.fillStroke('#a8692c', 2); Draw.rr(-13, -3, 4, 6, 1); Draw.fillStroke('#8a5a32', 1.5); Draw.rr(9, -3, 4, 6, 1); Draw.fillStroke('#8a5a32', 1.5); },
    lamp(ctx) { Draw.rr(-2, -26, 4, 28, 2); Draw.fillStroke('#5c5870', 2); ctx.beginPath(); ctx.arc(0, -29, 6, 0, TAU); Draw.fillStroke('#ffe680', 2); },
    flowers(ctx) {
      [[-14, 0, '#ff5e7a'], [-4, 3, '#ffd23f'], [7, -1, '#c77dff'], [15, 3, '#ff9a1f']].forEach(([dx, dy, c]) => { ctx.beginPath(); ctx.arc(dx, dy, 4, 0, TAU); Draw.fillStroke(c, 1.5); });
    }
  };
  function friends(x0, sc) {
    const ctx = G.ctx, area = D.map.areas.find(a => a.id === 'friends'), has = id => FF.save.decor.includes(id);
    const spot = id => D.decorations.find(d => d.id === id);
    label(x0 + area.w / 2, 'Friends');
    if (FF.stickers.hasReward('party')) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, 90); ctx.quadraticCurveTo(x0 + area.w / 2, 150, x0 + area.w, 90); ctx.stroke();
      for (let i = 1; i < 24; i++) { const k = i / 24, x = x0 + area.w * k, y = 90 + 120 * k * (1 - k); ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 22); ctx.closePath(); Draw.fillStroke(sc.awnings[i % sc.awnings.length], 2); }
    }
    if (has('windmill')) decor('windmill', x0 + spot('windmill').x, spot('windmill').y, 2.6);
    if (has('fence')) fenceRun(x0 + 20, x0 + area.w - 20, 410);
    if (has('well')) decor('well', x0 + spot('well').x, spot('well').y);
    if (has('lamp')) { decor('lamp', x0 + spot('lamp').x, spot('lamp').y); decor('lamp', x0 + 2 * D.map.square - spot('lamp').x, spot('lamp').y); }
    const living = Object.keys(D.animals).filter(FF.friends.hasHome);
    D.map.homes.forEach((hx, i) => {
      const x = x0 + hx, kind = living[i];
      if (!kind) { emptyLot(x, STREET - 8, i < living.length + 2); return; }
      cottage(x, STREET - 8, sc.awnings[i % sc.awnings.length], kind, i);
      target(x - 70, STREET - 190, x + 70, STREET + 10, () => { FF.sfx.tick(); FF.village.card(kind); });
    });
    // the village square sits on the street between the two rows of homes
    ctx.fillStyle = sc.plaza[0]; ctx.strokeStyle = sc.plaza[1]; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x0 + D.map.square, STREET + 30, 110, 46, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (has('fountain')) decor('fountain', x0 + spot('fountain').x, spot('fountain').y, 2.6);
    // the order board stands by the square
    const bx = x0 + D.map.square + 150, by = STREET + 120;
    Draw.rr(bx - 6, by - 60, 12, 60, 3); Draw.fillStroke('#8a5a32', 3); Draw.rr(bx + 62, by - 60, 12, 60, 3); Draw.fillStroke('#8a5a32', 3);
    Draw.rr(bx - 20, by - 132, 108, 80, 8); Draw.fillStroke('#c99a62', 4);
    for (let i = 0; i < 3; i++) { Draw.rr(bx - 8 + i * 32, by - 120, 26, 34, 3); Draw.fillStroke('#fff8e0', 2); }
    ctx.font = `800 22px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('Orders', bx + 34, by - 64);
    const ready = FF.orders.readyCount();
    if (ready) { ctx.beginPath(); ctx.arc(bx + 86, by - 132, 16, 0, TAU); Draw.fillStroke('#ff5e7a', 3); ctx.fillStyle = '#fff'; ctx.font = `800 20px "Baloo 2", sans-serif`; ctx.fillText(ready, bx + 86, by - 125); }
    target(bx - 30, by - 150, bx + 100, by + 4, () => { FF.sfx.tick(); FF.orders.open('map'); });
    if (has('bench')) decor('bench', x0 + spot('bench').x, spot('bench').y);
    if (has('pond')) decor('pond', x0 + spot('pond').x, spot('pond').y, 2.6);
    if (has('flowers')) [spot('flowers').x, 420, 1120, 1400].forEach(fx => decor('flowers', x0 + fx, spot('flowers').y));
  }

  /* ---------- Coming soon: kitchen, barnyard, fields ---------- */
  function lot(x, y, w, text) {
    const ctx = G.ctx;
    Draw.rr(x - w / 2, y - 26, w, 34, 10); Draw.fillStroke('#c9a77a', 3);
    ctx.strokeStyle = 'rgba(43,35,80,0.15)'; ctx.lineWidth = 3;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i * w / 6, y - 22); ctx.lineTo(x - w / 2 + i * w / 6 - 14, y + 4); ctx.stroke(); }
    sign(x, y - 20, text, true);
  }
  // A market stand for a kitchen building, with its goods on the counter when they're ready.
  function stand(x, y, b, roof, sc) {
    const ctx = G.ctx, w = 170, h = 150, out = b.recipes[0].out;
    Draw.rr(x - w / 2, y - h, w, h, 10); Draw.fillStroke('#fff0d0', 4);
    for (let j = 0; j < 7; j++) { ctx.fillStyle = j % 2 ? '#fffaf0' : roof; ctx.fillRect(x - w / 2 - 6 + j * (w + 12) / 7, y - h - 16, (w + 12) / 7 + 0.5, 30); }
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.strokeRect(x - w / 2 - 6, y - h - 16, w + 12, 30);
    Draw.rr(x - w / 2 + 14, y - h + 30, w - 28, 54, 6); Draw.fillStroke('#bfe6fb', 3);
    Draw.rr(x - w / 2 - 4, y - 58, w + 8, 18, 5); Draw.fillStroke('#c99a62', 3);
    ctx.font = `800 22px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(b.name, x, y - 14);
    const n = FF.buildings.ready(b.id);
    for (let i = 0; i < Math.min(n, 4); i++) Draw.fruit(out, x - 45 + i * 30, y - 72, 15);
    if (n) { ctx.beginPath(); ctx.arc(x + w / 2 - 6, y - h - 16, 18, 0, TAU); Draw.fillStroke('#5cc24a', 3); ctx.fillStyle = '#fff'; ctx.font = `800 20px "Baloo 2", sans-serif`; ctx.fillText(n, x + w / 2 - 6, y - h - 9); }
    else Draw.fruit(out, x, y - h + 57, 18);
  }
  function kitchen(x0, sc) {
    label(x0 + 800, 'Kitchen');
    FF.buildings.inArea('kitchen').forEach((b, i) => {
      const x = x0 + 130 + i * 220, y = STREET - 8;
      if (FF.buildings.owned(b.id)) stand(x, y, b, sc.awnings[i % sc.awnings.length], sc);
      else lot(x, y, 180, b.name + '\n' + (FF.buildings.canBuild(b.id) ? 'tap to build' : 'build here'));
      target(x - 100, y - 220, x + 100, y + 20, () => { FF.sfx.tick(); FF.buildings.open(b.id); });
    });
  }
  function barn(x, y, w, h) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.moveTo(x - w * 0.58, y - h * 0.62); ctx.lineTo(x - w * 0.42, y - h); ctx.lineTo(x, y - h * 1.22); ctx.lineTo(x + w * 0.42, y - h); ctx.lineTo(x + w * 0.58, y - h * 0.62); ctx.closePath(); Draw.fillStroke('#6e2a2a', 4);
    Draw.rr(x - w / 2, y - h * 0.66, w, h * 0.66, 4); Draw.fillStroke('#d9443c', 4);
    ctx.strokeStyle = 'rgba(43,35,80,0.18)'; ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i * w / 8, y - h * 0.64); ctx.lineTo(x - w / 2 + i * w / 8, y - 2); ctx.stroke(); }
    Draw.rr(x - w * 0.22, y - h * 0.44, w * 0.44, h * 0.44, 3); Draw.fillStroke('#fff0d0', 4);
    for (const d of [-1, 1]) {
      const cx = x + d * w * 0.11;
      Draw.rr(cx - w * 0.1, y - h * 0.42, w * 0.2, h * 0.42, 2); Draw.fillStroke('#d9443c', 3);
      ctx.strokeStyle = '#fff0d0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - w * 0.08, y - h * 0.4); ctx.lineTo(cx + w * 0.08, y - 3); ctx.moveTo(cx + w * 0.08, y - h * 0.4); ctx.lineTo(cx - w * 0.08, y - 3); ctx.stroke();
    }
    Draw.rr(x - w * 0.09, y - h * 0.92, w * 0.18, h * 0.18, 3); Draw.fillStroke('#fff0d0', 3);
  }
  function silo(x, y, w, h) {
    const ctx = G.ctx;
    Draw.rr(x - w / 2, y - h, w, h, 6); Draw.fillStroke('#b9c4d6', 4);
    ctx.strokeStyle = 'rgba(43,35,80,0.3)'; ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 3, y - i * h / 5); ctx.lineTo(x + w / 2 - 3, y - i * h / 5); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y - h, w / 2, Math.PI, 0); ctx.closePath(); Draw.fillStroke('#8a96ad', 4);
  }
  function barnyard(x0) {
    const ctx = G.ctx;
    label(x0 + 500, 'Barnyard');
    silo(x0 + 120, STREET - 6, 76, 230);
    barn(x0 + 290, STREET - 2, 240, 230);
    // the barn is real now: it holds what you've caught
    ctx.font = `800 24px "Baloo 2", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff0d0';
    ctx.fillText('Barn', x0 + 290, STREET - 118);
    target(x0 + 160, STREET - 290, x0 + 420, STREET, () => { FF.sfx.tick(); FF.fx.text(x0 + 290, STREET - 300, FF.inBarn() + ' fruit in the barn', false); showBarn(); });
    fenceRun(x0 + 480, x0 + 720, STREET + 4);
    sign(x0 + 600, STREET - 50, 'Cow barn\ncoming soon', true);
    lot(x0 + 860, STREET - 10, 200, 'Chicken coop\ncoming soon');
  }
  function fields(x0) {
    const ctx = G.ctx;
    label(x0 + 450, 'Fields');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
      const x = x0 + 170 + i * 230, y = STREET - 40 + r * 120;
      Draw.rr(x - 95, y - 60, 190, 90, 12); Draw.fillStroke('#9a6a3a', 4);
      ctx.strokeStyle = '#7a4f28'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 80, y - 38 + k * 24); ctx.lineTo(x + 80, y - 38 + k * 24); ctx.stroke(); }
    }
    sign(x0 + 400, STREET - 100, 'Hay and corn\ncoming soon');
  }
  function showBarn() {
    const s = FF.save, list = FF.FRUIT_TYPES.filter(t => s.barn[t] > 0).map(t => s.barn[t] + ' ' + D.fruits[t].name.toLowerCase());
    FF.fx.text(G.W / 2, M.top + 120, list.length ? list.slice(0, 3).join(', ') : 'Empty! Go catch some fruit.', false);
  }

  Map.draw = () => {
    const ctx = G.ctx, sc = FF.scene(), k = M.k;
    FF.scenery.sky(M.top + HORIZON * M.k, sc);
    // hills drift slower than the ground for a little depth
    ctx.fillStyle = sc.hills[0];
    for (let i = -1; i < 12; i++) { const x = i * 420 * k - (M.cam * 0.5 * k) % (420 * k); ctx.beginPath(); ctx.ellipse(x, M.top + (HORIZON + 10) * k, 300 * k, 70 * k, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(-M.cam * k, M.top); ctx.scale(k, k);
    const v0 = M.cam - 20, v1 = M.cam + viewW() + 20;
    ctx.fillStyle = sc.ground.top; ctx.fillRect(v0, HORIZON, v1 - v0, WORLD_H + 200);
    ctx.fillStyle = sc.plaza[0]; ctx.fillRect(v0, STREET, v1 - v0, 60);
    ctx.strokeStyle = sc.plaza[1]; ctx.lineWidth = 3; ctx.strokeRect(v0, STREET, v1 - v0, 60);
    hits = [];
    let x = 0;
    for (const a of D.map.areas) {
      if (x + a.w > v0 && x < v1) ({ groves, friends, kitchen, barnyard, fields })[a.id](x, sc);
      x += a.w;
    }
    ctx.restore();
    FF.scenery.weather();
    FF.fx.draw();
  };
})();
