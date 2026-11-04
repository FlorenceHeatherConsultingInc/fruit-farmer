/* Fruit Farmer: scenery.
   Sky, hills, orchard trees, ground details and weather for the farm, plus the market's
   stalls and plaza. Every color comes from the current scene in data.js, so buying a new
   scene restyles the whole world. Functions take an optional scene so the shop can preview. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp, rand, pick } = FF.util;
  const Draw = FF.draw, INK = D.colors.ink, CARD = D.colors.card;

  const S = FF.scenery = { fruitShare: 1 };
  const some = list => list.slice(0, Math.ceil(list.length * Math.max(0, Math.min(1, S.fruitShare))));
  let clouds = [], stars = [], bits = [], plazaBits = [], cobbles = [], weather = [];
  let bitsKey = '', cobbleKey = '';

  S.layout = () => {
    const { W } = G;
    if (!clouds.length) for (let i = 0; i < 4; i++) clouds.push({ x: rand(0, W), y: rand(0.12, 0.42), s: rand(0.6, 1.1), v: rand(8, 22) });
    if (!stars.length) for (let i = 0; i < 60; i++) stars.push({ x: Math.random(), y: Math.random() * 0.75, r: rand(0.8, 2.2), p: rand(0, TAU) });
    bitsKey = ''; cobbleKey = '';
  };

  // Scatter positions for ground details; rebuilt when the screen size or scene changes.
  function ensureBits(sc) {
    const key = sc.id + ':' + G.W + 'x' + G.H;
    if (key === bitsKey) return;
    bitsKey = key;
    const make = n => Array.from({ length: n }, () => ({ x: rand(0, G.W), y: Math.random(), k: Math.random(), s: rand(0.8, 1.25), a: rand(0, TAU) }));
    bits = make(Math.round(G.W / 30));
    plazaBits = make(Math.round(G.W / 45));
    weather = [];
  }

  /* ---------- Sky ---------- */
  function cloudPath(c, bottom) {
    const ctx = G.ctx;
    ctx.save(); ctx.translate(c.x, c.y * bottom); ctx.scale(c.s, c.s);
    Draw.circlesPath([[-40, 8, 26], [-10, -8, 34], [28, 2, 28], [55, 14, 18]]);
    ctx.moveTo(-51, 8); ctx.lineTo(59, 8); ctx.arcTo(74, 8, 74, 23, 15); ctx.arcTo(74, 38, 59, 38, 15);
    ctx.lineTo(-51, 38); ctx.arcTo(-66, 38, -66, 23, 15); ctx.arcTo(-66, 8, -51, 8, 15); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  S.sky = (bottom, sc = FF.scene()) => {
    const ctx = G.ctx, { W } = G;
    const g = ctx.createLinearGradient(0, 0, 0, bottom);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, bottom + 2);
    if (sc.moon) {
      ctx.fillStyle = '#fff6c8';
      for (const s of stars) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 2 + s.p);
        ctx.beginPath(); ctx.arc(s.x * W, s.y * bottom, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const sx = W * 0.82, sy = Math.max(120, bottom * 0.28), sr = clamp(W * 0.06, 28, 46);
    if (sc.moon) {
      // crescent: the moon circle minus an offset circle
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.clip();
      Draw.circlesPath([[sx, sy, sr], [sx + sr * 0.45, sy - sr * 0.2, sr * 0.85]]);
      ctx.fillStyle = sc.sun; ctx.fill('evenodd');
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(G.reduce ? 0 : G.clock * 0.25);
      ctx.strokeStyle = sc.sun; ctx.globalAlpha = 0.75; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * sr * 1.3, Math.sin(a) * sr * 1.3); ctx.lineTo(Math.cos(a) * sr * 1.65, Math.sin(a) * sr * 1.65); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fillStyle = sc.sun; ctx.fill();
    }
    ctx.fillStyle = sc.cloud;
    for (const c of clouds) cloudPath(c, bottom);
  };

  S.hills = (groundY, sc = FF.scene()) => {
    const ctx = G.ctx, { W, H } = G;
    ctx.fillStyle = sc.hills[1];
    ctx.beginPath(); ctx.ellipse(W * 0.85, groundY + 10, W * 0.38, H * 0.1, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = sc.hills[0];
    ctx.beginPath(); ctx.ellipse(W * 0.2, groundY + 10, W * 0.42, H * 0.13, 0, Math.PI, TAU); ctx.fill();
  };

  /* ---------- Trees ---------- */
  function trunk(x, base, w, h, sc) {
    const ctx = G.ctx;
    Draw.rr(x - w / 2, base - h, w, h + 6, w * 0.3);
    if (sc.trunk === 'candy') {
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w, base - h - 4, w * 2, h + 12);
      ctx.strokeStyle = '#ff5ea8'; ctx.lineWidth = w * 0.3;
      for (let y = base - h - w; y < base + w * 2; y += w * 0.75) { ctx.beginPath(); ctx.moveTo(x - w, y + w * 0.6); ctx.lineTo(x + w, y - w * 0.6); ctx.stroke(); }
      ctx.restore();
      Draw.rr(x - w / 2, base - h, w, h + 6, w * 0.3);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    } else {
      Draw.fillStroke(sc.trunk, 3);
      ctx.strokeStyle = 'rgba(43,35,80,0.28)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      [[0.22, 0.25], [-0.18, 0.5], [0.12, 0.72]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.moveTo(x + a * w, base - h * b); ctx.lineTo(x + a * w, base - h * b + h * 0.12); ctx.stroke();
      });
    }
  }

  // Leafy crown: dark outlined base, lighter body lifted up so the underside reads as shade,
  // soft highlights, and snow on top in snowy scenes. Everything inside is clipped to the outline.
  function crown(circles, sc) {
    const ctx = G.ctx;
    Draw.blob(circles, sc.foliage[2], 3);
    ctx.save();
    Draw.circlesPath(circles); ctx.clip();
    ctx.fillStyle = sc.foliage[0];
    Draw.circlesPath(circles.map(([x, y, r]) => [x, y - r * 0.16, r])); ctx.fill();
    ctx.fillStyle = sc.foliage[1];
    Draw.circlesPath(circles.map(([x, y, r]) => [x - r * 0.32, y - r * 0.42, r * 0.38])); ctx.fill();
    if (sc.snowCap) {
      ctx.fillStyle = '#ffffff';
      Draw.circlesPath(circles.map(([x, y, r]) => [x, y - r * 0.9, r * 0.7])); ctx.fill();
    }
    ctx.restore();
  }

  const SHAPES = {
    round(x, base, th, sc, type) {
      trunk(x, base, th * 0.13, th * 0.6, sc);
      crown([
        [x, base - th * 0.8, th * 0.3],
        [x - th * 0.26, base - th * 0.64, th * 0.23],
        [x + th * 0.26, base - th * 0.64, th * 0.23],
        [x - th * 0.13, base - th * 0.97, th * 0.2],
        [x + th * 0.15, base - th * 0.95, th * 0.19]
      ], sc);
      some([[-0.27, -0.6], [-0.32, -0.78], [0.02, -0.66], [0.06, -0.93], [0.27, -0.62], [0.2, -0.82]])
        .forEach(([a, b]) => Draw.fruit(type, x + a * th, base + b * th, th * 0.055));
    },
    palm(x, base, th, sc, type) {
      const ctx = G.ctx, tx = x + th * 0.12, ty = base - th * 0.86;
      const path = () => { ctx.beginPath(); ctx.moveTo(x, base + 6); ctx.quadraticCurveTo(x - th * 0.04, base - th * 0.45, tx, ty); };
      ctx.lineCap = 'round';
      path(); ctx.strokeStyle = INK; ctx.lineWidth = th * 0.11 + 6; ctx.stroke();
      path(); ctx.strokeStyle = sc.trunk === 'candy' ? '#ffffff' : sc.trunk; ctx.lineWidth = th * 0.11; ctx.stroke();
      ctx.strokeStyle = sc.trunk === 'candy' ? '#ff5ea8' : 'rgba(43,35,80,0.3)'; ctx.lineWidth = sc.trunk === 'candy' ? 5 : 2;
      for (let k = 0.12; k < 0.92; k += 0.13) {
        const px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * (x - th * 0.04) + k * k * tx;
        const py = (1 - k) * (1 - k) * (base + 6) + 2 * (1 - k) * k * (base - th * 0.45) + k * k * ty;
        ctx.beginPath(); ctx.moveTo(px - th * 0.05, py); ctx.lineTo(px + th * 0.05, py - th * 0.015); ctx.stroke();
      }
      [[-1, -0.75], [1, -0.75], [-1, -0.1], [1, -0.1], [-1, 0.45], [1, 0.45], [1, -1.35]].forEach(([side, tilt]) => {
        ctx.save(); ctx.translate(tx, ty); ctx.scale(side, 1); ctx.rotate(tilt);
        const len = th * 0.48;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.5, -len * 0.34, len, len * 0.1);
        ctx.quadraticCurveTo(len * 0.5, len * 0.1, 0, 0);
        ctx.closePath(); Draw.fillStroke(sc.foliage[0], 3);
        ctx.beginPath(); ctx.moveTo(len * 0.08, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.14, len * 0.94, len * 0.09);
        ctx.strokeStyle = sc.foliage[2]; ctx.lineWidth = 2.5; ctx.stroke();
        if (sc.snowCap) {
          ctx.beginPath(); ctx.moveTo(len * 0.12, -len * 0.06); ctx.quadraticCurveTo(len * 0.45, -len * 0.3, len * 0.75, -len * 0.12);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
        }
        ctx.restore();
      });
      for (let i = 0; i < some([0, 1, 2, 3]).length; i++) Draw.fruit(type, tx + (i - 1.5) * th * 0.065, ty + th * 0.1 + (i % 2) * th * 0.03, th * 0.065, 1.35);
    },
    bush(x, base, th, sc, type) {
      crown([
        [x - th * 0.27, base - th * 0.12, th * 0.17],
        [x, base - th * 0.22, th * 0.21],
        [x + th * 0.27, base - th * 0.12, th * 0.17],
        [x - th * 0.13, base - th * 0.07, th * 0.15],
        [x + th * 0.14, base - th * 0.07, th * 0.15]
      ], sc);
      some([[-0.3, -0.12], [-0.08, -0.28], [0.12, -0.16], [0.3, -0.1], [-0.14, -0.05], [0.04, -0.06]])
        .forEach(([a, b]) => Draw.fruit(type, x + a * th, base + b * th, th * 0.05));
    },
    vine(x, base, th, sc, type) {
      const w = th * 0.9, top = base - th * 0.62, post = th * 0.07;
      const wood = sc.trunk === 'candy' ? '#ffb3dc' : sc.trunk;
      Draw.rr(x - w / 2, top, post, base - top + 6, 3); Draw.fillStroke(wood, 3);
      Draw.rr(x + w / 2 - post, top, post, base - top + 6, 3); Draw.fillStroke(wood, 3);
      const leaves = [];
      for (let i = 0; i < 6; i++) leaves.push([x - w * 0.42 + i * w * 0.168, top - post * 0.3 + (i % 2) * th * 0.035, th * 0.115]);
      crown(leaves, sc);
      some([-0.28, 0.02, 0.3]).forEach(a => Draw.fruit(type, x + a * th, top + th * 0.18, th * 0.075));
    }
  };
  const DEPTH = ['vine', 'palm', 'round', 'bush'];

  S.treeHeight = () => clamp(Math.min(G.H * 0.22, G.W * 0.3), 90, 190);
  S.trees = (groundY, sc = FF.scene()) => {
    const th = S.treeHeight();
    D.trees
      .filter(t => FF.save.trees.includes(t.type))
      .sort((a, b) => DEPTH.indexOf(a.shape) - DEPTH.indexOf(b.shape))
      .forEach(t => SHAPES[t.shape](G.W * t.spot, groundY + 6, th, sc, t.type));
  };
  S.drawTree = (shape, x, base, th, sc, type) => SHAPES[shape](x, base, th, sc, type);

  /* ---------- Ground ---------- */
  const BITS = {
    flowers(b, x, y, sc) {
      const ctx = G.ctx;
      if (b.k < 0.45) return BITS.tufts(b, x, y, sc);
      const col = ['#ffffff', '#ffe066', '#ff9ec4', '#c9a6ff'][Math.floor(b.k * 40) % 4], r = 3.2 * b.s;
      ctx.fillStyle = col;
      Draw.circlesPath([0, 1, 2, 3, 4].map(i => [x + Math.cos(i * TAU / 5 + b.a) * r, y + Math.sin(i * TAU / 5 + b.a) * r, r * 0.8])); ctx.fill();
      ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.fill();
    },
    tufts(b, x, y, sc) {
      const ctx = G.ctx, h = 9 * b.s;
      ctx.strokeStyle = sc.ground.edge; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 4, y); ctx.lineTo(x - 6, y - h * 0.8);
      ctx.moveTo(x, y); ctx.lineTo(x, y - h);
      ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - h * 0.7);
      ctx.stroke();
    },
    leaves(b, x, y) {
      const ctx = G.ctx;
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.a);
      ctx.fillStyle = ['#e0782c', '#c4521f', '#f4a540', '#a8692c'][Math.floor(b.k * 40) % 4];
      ctx.beginPath(); ctx.ellipse(0, 0, 7 * b.s, 3.5 * b.s, 0, 0, TAU); ctx.fill();
      ctx.restore();
    },
    sparkle(b, x, y) {
      const ctx = G.ctx;
      if (b.k < 0.55) {
        ctx.fillStyle = 'rgba(160,190,225,0.45)';
        ctx.beginPath(); ctx.ellipse(x, y + 3, 16 * b.s, 4 * b.s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(x, y, 16 * b.s, 5 * b.s, 0, Math.PI, TAU); ctx.fill();
      } else {
        const tw = G.reduce || G.caching ? 1 : 0.5 + 0.5 * Math.sin(G.clock * 3 + b.a * 3), r = 4 * b.s * tw;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      }
    },
    sprinkles(b, x, y) {
      const ctx = G.ctx;
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.a);
      ctx.strokeStyle = ['#ff5ea8', '#ffd23f', '#ffffff', '#8a6bff', '#ff9a1f'][Math.floor(b.k * 50) % 5];
      ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4 * b.s, 0); ctx.lineTo(4 * b.s, 0); ctx.stroke();
      ctx.restore();
    },
    mushrooms(b, x, y, sc) {
      const ctx = G.ctx;
      if (b.k < 0.6) return BITS.tufts(b, x, y, sc);
      const s = 5 * b.s;
      Draw.rr(x - s * 0.35, y - s * 1.2, s * 0.7, s * 1.3, 2); Draw.fillStroke('#f4ecdc', 1.5);
      ctx.beginPath(); ctx.arc(x, y - s * 1.1, s, Math.PI, TAU); ctx.closePath(); Draw.fillStroke('#e8463a', 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x - s * 0.4, y - s * 1.45, s * 0.18, 0, TAU); ctx.arc(x + s * 0.3, y - s * 1.6, s * 0.15, 0, TAU); ctx.fill();
    }
  };

  S.ground = (groundY, sc = FF.scene()) => {
    ensureBits(sc);
    const ctx = G.ctx, { W, H } = G, g = sc.ground, bump = 22;
    const edge = (off) => {
      ctx.beginPath(); ctx.moveTo(-bump, groundY + off);
      for (let x = -bump; x <= W + bump; x += bump) ctx.quadraticCurveTo(x + bump / 2, groundY - 9 + off, x + bump, groundY + off);
    };
    edge(0); ctx.lineTo(W + bump, H + 2); ctx.lineTo(-bump, H + 2); ctx.closePath();
    ctx.fillStyle = g.top; ctx.fill();
    ctx.save(); ctx.clip();
    edge(9); ctx.strokeStyle = g.edge; ctx.lineWidth = 5; ctx.stroke();
    const deepY = groundY + (H - groundY) * 0.58;
    ctx.fillStyle = g.deep; ctx.fillRect(0, deepY, W, H - deepY + 2);
    const band = H - groundY - 22, draw = BITS[g.bits];
    if (draw) for (const b of bits) draw(b, b.x, groundY + 16 + b.y * band, sc);
    ctx.restore();
  };

  // Hills, trees and ground for the harvest, kept as one saved picture (Draw.layer) and
  // repainted only when the scene, the trees or the fruit left on them change.
  S.farmBack = (groundY, sc = FF.scene()) => {
    const key = [sc.id, FF.save.trees.join(), S.fruitShare, groundY, S.treeHeight()].join(';');
    Draw.layer('farm', key, () => { S.hills(groundY, sc); S.trees(groundY, sc); S.ground(groundY, sc); });
  };

  /* ---------- Weather ---------- */
  const WEATHER = {
    snow: { count: 70,
      spawn: (p, init) => Object.assign(p, { x: rand(0, G.W), y: init ? rand(0, G.H) : rand(-30, -5), vy: rand(28, 70), r: rand(1.6, 3.6), ph: rand(0, TAU) }),
      update: (p, dt) => { p.y += p.vy * dt; p.x += Math.sin(G.clock * 1.4 + p.ph) * 18 * dt; return p.y < G.H + 10; },
      draw: p => { const ctx = G.ctx; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } },
    leaves: { count: 12,
      spawn: (p, init) => Object.assign(p, { x: rand(0, G.W), y: init ? rand(0, G.H) : -20, vy: rand(35, 70), rot: rand(0, TAU), vr: rand(-2, 2), ph: rand(0, TAU), c: pick(['#e0782c', '#c4521f', '#f4a540']) }),
      update: (p, dt) => { p.y += p.vy * dt; p.x += Math.sin(G.clock * 1.2 + p.ph) * 40 * dt; p.rot += p.vr * dt; return p.y < G.H + 20; },
      draw: p => {
        const ctx = G.ctx;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); Draw.fillStroke(p.c, 1.5);
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.strokeStyle = 'rgba(43,35,80,0.4)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      } },
    fireflies: { count: 16,
      spawn: p => Object.assign(p, { x: rand(0, G.W), y: rand(G.H * 0.35, G.H * 0.92), ph: rand(0, TAU), sp: rand(0.4, 0.9), life: rand(4, 9) }),
      update: (p, dt) => { p.life -= dt; p.x += Math.cos(G.clock * p.sp + p.ph) * 22 * dt; p.y += Math.sin(G.clock * p.sp * 1.3 + p.ph) * 14 * dt; return p.life > 0; },
      draw: p => {
        const ctx = G.ctx, a = 0.35 + 0.65 * Math.max(0, Math.sin(G.clock * 2.4 + p.ph));
        ctx.fillStyle = `rgba(255,236,120,${0.25 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,246,170,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, TAU); ctx.fill();
      } },
    sparkles: { count: 16,
      spawn: p => Object.assign(p, { x: rand(0, G.W), y: rand(0, G.H * 0.75), t: 0, d: rand(1.2, 2.4), c: pick(['#ffffff', '#fff07a', '#ffd1ec']) }),
      update: (p, dt) => { p.t += dt; return p.t < p.d; },
      draw: p => {
        const ctx = G.ctx, k = Math.sin(Math.PI * p.t / p.d), r = 6 * k;
        ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = k; ctx.fillStyle = p.c; Draw.starPath(r, 0.35); ctx.fill(); ctx.restore();
      } },
    butterflies: { count: 3,
      spawn: (p, init) => { const dir = Math.random() < 0.5 ? 1 : -1; return Object.assign(p, { dir, x: init ? rand(0, G.W) : dir > 0 ? -20 : G.W + 20, y: rand(G.H * 0.3, G.H * 0.65), ph: rand(0, TAU), c: pick(['#ff9ec4', '#ffd23f', '#9ad0ff', '#c9a6ff']) }); },
      update: (p, dt) => { p.x += p.dir * 34 * dt; p.y += Math.sin(G.clock * 2 + p.ph) * 26 * dt; return p.x > -40 && p.x < G.W + 40; },
      draw: p => {
        const ctx = G.ctx, f = 0.35 + 0.65 * Math.abs(Math.sin(G.clock * 12 + p.ph));
        ctx.save(); ctx.translate(p.x, p.y);
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * 5 * f, -2, 5.5 * f, 6.5, 0, 0, TAU); Draw.fillStroke(p.c, 1.5); });
        ctx.fillStyle = INK; ctx.fillRect(-1.2, -6, 2.4, 10);
        ctx.restore();
      } },
    birds: { count: 3,
      spawn: (p, init) => Object.assign(p, { x: init ? rand(0, G.W) : -30, y: rand(G.H * 0.08, G.H * 0.3), v: rand(40, 70), ph: rand(0, TAU) }),
      update: (p, dt) => { p.x += p.v * dt; return p.x < G.W + 40; },
      draw: p => {
        const ctx = G.ctx, f = Math.sin(G.clock * 7 + p.ph) * 5;
        ctx.strokeStyle = 'rgba(43,35,80,0.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(p.x - 10, p.y - f); ctx.quadraticCurveTo(p.x - 4, p.y - 4, p.x, p.y); ctx.quadraticCurveTo(p.x + 4, p.y - 4, p.x + 10, p.y - f); ctx.stroke();
      } }
  };

  S.update = dt => {
    if (!G.reduce) for (const c of clouds) { c.x += c.v * dt; if (c.x - c.s * 100 > G.W) c.x = -c.s * 100; }
    const sc = FF.scene(), kind = WEATHER[sc.ambient];
    if (!kind || G.reduce) { weather.length = 0; return; }
    if (weather.length && weather[0].kind !== sc.ambient) weather.length = 0;
    const first = weather.length === 0;
    while (weather.length < kind.count) weather.push(kind.spawn({ kind: sc.ambient }, first));
    for (const p of weather) if (!kind.update(p, dt)) kind.spawn(p, false);
  };
  S.weather = () => {
    const kind = WEATHER[FF.scene().ambient];
    if (kind) for (const p of weather) kind.draw(p);
  };

  /* ---------- Market: stalls and plaza ---------- */
  S.stalls = (horizon, sc = FF.scene()) => {
    const ctx = G.ctx, { W } = G;
    const sw = clamp(W * 0.24, 120, 190), n = Math.ceil(W / sw) + 1, top = horizon - 92;
    const fruitCols = Object.values(D.fruits).map(f => f.colors[0]);
    for (let i = 0; i < n; i++) {
      const x0 = i * sw - sw * 0.35, col = sc.awnings[i % sc.awnings.length];
      ctx.fillStyle = '#e9c79a'; ctx.fillRect(x0 + 8, top + 26, sw - 16, horizon - top - 26);
      ctx.fillStyle = '#c99a62'; ctx.fillRect(x0 + 4, horizon - 30, sw - 8, 12);
      for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(x0 + 22 + j * (sw - 44) / 4, horizon - 34, 7, 0, TAU); ctx.fillStyle = fruitCols[(i + j) % 5]; ctx.fill(); }
      const stripes = 6, stw = sw / stripes;
      for (let j = 0; j < stripes; j++) {
        ctx.fillStyle = j % 2 ? CARD : col;
        ctx.fillRect(x0 + j * stw, top, stw + 0.5, 22);
        ctx.beginPath(); ctx.arc(x0 + j * stw + stw / 2, top + 22, stw / 2, 0, Math.PI); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(43,35,80,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 0.5, top + 0.5, sw - 1, 22);
      if (sc.snowCap) {
        ctx.fillStyle = '#ffffff';
        Draw.rr(x0 - 2, top - 7, sw + 4, 12, 6); ctx.fill();
        Draw.circlesPath([0.15, 0.4, 0.7, 0.9].map(k => [x0 + sw * k, top + 4, 4 + (k * 10 % 3)])); ctx.fill();
      }
    }
  };
  // String lights over the stalls twinkle, so they're drawn every frame on top of the saved stalls.
  S.lights = (horizon, sc = FF.scene()) => {
    if (!sc.lights) return;
    const ctx = G.ctx, { W } = G, y = horizon - 92 + 34, sag = 10;
    ctx.strokeStyle = 'rgba(20,16,40,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x < W; x += 80) ctx.quadraticCurveTo(x + 40, y + sag * 2, x + 80, y);
    ctx.stroke();
    for (let x = 20; x < W; x += 40) {
      const k = ((x % 80) - 40) / 40, by = y + sag * (1 - k * k) + 4;
      const on = 0.6 + 0.4 * Math.sin(G.clock * 3 + x);
      ctx.fillStyle = `rgba(255,220,120,${0.25 * on})`; ctx.beginPath(); ctx.arc(x, by, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = ['#ffe680', '#ff9ec4', '#9ad0ff'][(x / 40 | 0) % 3]; ctx.beginPath(); ctx.arc(x, by, 4, 0, TAU); ctx.fill();
    }
  };

  S.plaza = (horizon, sc = FF.scene()) => {
    const ctx = G.ctx, { W, H } = G;
    const key = W + 'x' + H + ':' + horizon;
    if (key !== cobbleKey) {
      cobbleKey = key; cobbles = [];
      const rows = 9;
      for (let i = 0; i < rows; i++) {
        const k = (i + 0.5) / rows, y = horizon + (H - horizon) * Math.pow(k, 1.3);
        const sz = 8 + 26 * k, n = Math.ceil(W / (sz * 2.6)) + 1;
        for (let j = 0; j < n; j++) cobbles.push({ x: (j + (i % 2) * 0.5) * sz * 2.6, y, rx: sz, ry: sz * 0.42 });
      }
    }
    ensureBits(sc);
    ctx.fillStyle = sc.plaza[0]; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.fillStyle = sc.plaza[1]; ctx.globalAlpha = 0.45;
    ctx.beginPath();
    for (const c of cobbles) { ctx.moveTo(c.x + c.rx, c.y); ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, TAU); }
    ctx.fill();
    ctx.globalAlpha = 1;
    const draw = { leaves: BITS.leaves, sparkle: BITS.sparkle, sprinkles: BITS.sprinkles }[sc.ground.bits];
    if (draw) for (const b of plazaBits) draw(b, b.x, horizon + 14 + b.y * (H - horizon - 20), sc);
    ctx.fillStyle = 'rgba(43,35,80,0.15)'; ctx.fillRect(0, horizon, W, 3);
  };

  // Stalls and plaza for the market, kept as one saved picture; the lights go on top.
  S.marketBack = (horizon, sc = FF.scene()) => {
    Draw.layer('market', sc.id + ';' + horizon, () => { S.stalls(horizon, sc); S.plaza(horizon, sc); });
    S.lights(horizon, sc);
  };

  /* ---------- Small preview for the shop ---------- */
  S.preview = (sc, w = 128, h = 80) => Draw.toCanvas(w, h, () => {
    const ctx = G.ctx, gy = h * 0.72;
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = sc.sun; ctx.beginPath(); ctx.arc(w * 0.82, h * 0.25, h * 0.11, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.hills[0]; ctx.beginPath(); ctx.ellipse(w * 0.75, gy + 4, w * 0.45, h * 0.2, 0, Math.PI, TAU); ctx.fill();
    SHAPES.round(w * 0.32, gy + 3, h * 0.62, sc, 'apple');
    ctx.fillStyle = sc.ground.top; ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = sc.ground.deep; ctx.fillRect(0, gy + (h - gy) * 0.6, w, h);
  });
})();
