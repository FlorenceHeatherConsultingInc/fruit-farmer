/* Fruit Farmer: drawing toolkit and effects.
   Art style: flat colors with a thick ink outline, like stickers.
   Everything draws onto FF.G.ctx (swap it to draw into a small icon canvas).

   Rule for shapes made of several circles (tree crowns, bushes, clouds): use circlesPath()
   or blob(). Each circle must start its own sub-path with moveTo; filling several arcs in one
   path without it draws connecting lines that cut see-through triangles into the shape. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU, clamp, rand } = FF.util;
  const INK = D.colors.ink, CARD = D.colors.card, SUN = D.colors.sun;

  const Draw = FF.draw = {};

  Draw.rr = (x, y, w, h, r) => {
    const ctx = G.ctx;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  Draw.fillStroke = (fill, lw) => {
    const ctx = G.ctx;
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  };

  // One path made of circles [[x, y, r], ...]; fills as a single solid shape.
  Draw.circlesPath = circles => {
    const ctx = G.ctx;
    ctx.beginPath();
    for (const [x, y, r] of circles) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  };

  // Solid shape made of circles with one clean outline around the outside.
  Draw.blob = (circles, fill, lw) => {
    const ctx = G.ctx;
    Draw.circlesPath(circles);
    if (lw) { ctx.lineWidth = lw * 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.fillStyle = fill; ctx.fill();
  };

  Draw.starPath = (r, inner = 0.48) => {
    const ctx = G.ctx;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * inner : r;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
  };

  Draw.heartPath = s => {
    const ctx = G.ctx;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 1.1, -s * 0.3, -s * 0.45, -s * 1.05, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.3, 0, s * 0.35);
    ctx.closePath();
  };

  Draw.coin = (x, y, r) => {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); Draw.fillStroke(SUN, Math.max(1.5, r * 0.2));
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.strokeStyle = '#d9a400'; ctx.lineWidth = Math.max(1, r * 0.18); ctx.stroke();
  };

  function leaf(x, y, r, ang) {
    const ctx = G.ctx;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.16, 0, 0, TAU);
    Draw.fillStroke('#5cc24a', Math.max(1.5, r * 0.06)); ctx.restore();
  }
  function shine(x, y, rx, ry) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  }

  /* ---------- Fruit art. r is roughly the radius. ---------- */
  const FRUIT_ART = {
    apple(r, lw) {
      const ctx = G.ctx;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.62);
      ctx.bezierCurveTo(-r * 0.5, -r * 1.05, -r * 1.15, -r * 0.55, -r * 0.95, r * 0.2);
      ctx.bezierCurveTo(-r * 0.8, r * 0.85, -r * 0.3, r * 1.0, 0, r * 0.82);
      ctx.bezierCurveTo(r * 0.3, r * 1.0, r * 0.8, r * 0.85, r * 0.95, r * 0.2);
      ctx.bezierCurveTo(r * 1.15, -r * 0.55, r * 0.5, -r * 1.05, 0, -r * 0.62);
      Draw.fillStroke('#e8322f', lw);
      shine(-r * 0.45, -r * 0.2, r * 0.18, r * 0.3);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.quadraticCurveTo(r * 0.05, -r * 0.95, r * 0.2, -r * 1.1);
      ctx.lineWidth = lw * 1.1; ctx.strokeStyle = INK; ctx.stroke();
      leaf(r * 0.42, -r * 0.92, r, -0.5);
    },
    orange(r, lw) {
      const ctx = G.ctx;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); Draw.fillStroke('#ff9a1f', lw);
      ctx.fillStyle = 'rgba(200,100,0,0.35)';
      [[0.3, 0.3], [-0.35, 0.4], [0.45, -0.1], [-0.1, 0.55], [0.1, -0.35], [-0.5, 0]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.arc(a * r, b * r, r * 0.05, 0, TAU); ctx.fill();
      });
      shine(-r * 0.4, -r * 0.35, r * 0.16, r * 0.26);
      leaf(r * 0.25, -r * 0.95, r, -0.3);
    },
    banana(r, lw) {
      const ctx = G.ctx;
      ctx.beginPath(); ctx.moveTo(-r * 1.0, -r * 0.35);
      ctx.quadraticCurveTo(0, r * 1.2, r * 1.0, -r * 0.4);
      ctx.quadraticCurveTo(0, r * 0.45, -r * 1.0, -r * 0.35);
      Draw.fillStroke('#ffd93b', lw);
      ctx.beginPath(); ctx.moveTo(-r * 0.55, r * 0.2); ctx.quadraticCurveTo(0, r * 0.6, r * 0.55, r * 0.15);
      ctx.strokeStyle = 'rgba(200,150,0,0.6)'; ctx.lineWidth = lw * 0.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.98, -r * 0.4); ctx.lineTo(r * 1.15, -r * 0.62);
      ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = lw * 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(-r * 1.0, -r * 0.35, lw * 0.7, 0, TAU); ctx.fillStyle = '#6b4a22'; ctx.fill();
    },
    strawberry(r, lw) {
      const ctx = G.ctx;
      ctx.beginPath(); ctx.moveTo(0, r * 1.0);
      ctx.bezierCurveTo(-r * 1.05, r * 0.25, -r * 1.05, -r * 0.75, 0, -r * 0.6);
      ctx.bezierCurveTo(r * 1.05, -r * 0.75, r * 1.05, r * 0.25, 0, r * 1.0);
      Draw.fillStroke('#ff3b5c', lw);
      ctx.fillStyle = '#ffe680';
      [[-0.45, -0.2], [0, -0.25], [0.45, -0.2], [-0.25, 0.15], [0.25, 0.15], [0, 0.5], [-0.5, 0.2], [0.5, 0.2]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.ellipse(a * r, b * r, r * 0.05, r * 0.08, 0, 0, TAU); ctx.fill();
      });
      ctx.save(); ctx.translate(0, -r * 0.62);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI + i * Math.PI / 9, rad = i % 2 ? r * 0.18 : r * 0.5;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.6);
      }
      ctx.closePath(); Draw.fillStroke('#5cc24a', lw * 0.8); ctx.restore();
    },
    grapes(r, lw) {
      const ctx = G.ctx;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.08, -r * 0.95);
      ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.1; ctx.stroke();
      leaf(-r * 0.25, -r * 0.85, r, 0.4);
      const g = r * 0.32;
      [[-0.55, -0.3], [0, -0.3], [0.55, -0.3], [-0.28, 0.18], [0.28, 0.18], [0, 0.66]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.arc(a * r, b * r, g, 0, TAU); Draw.fillStroke('#8a4bd6', lw * 0.8);
        ctx.beginPath(); ctx.arc(a * r - g * 0.35, b * r - g * 0.35, g * 0.25, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
      });
    },
    star(r, lw) {
      const ctx = G.ctx;
      ctx.shadowColor = 'rgba(255,220,60,0.9)'; ctx.shadowBlur = r * 0.6;
      Draw.starPath(r * 1.05); Draw.fillStroke(SUN, lw);
      ctx.shadowBlur = 0;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.05, r * 0.08, 0, TAU); ctx.arc(r * 0.2, -r * 0.05, r * 0.08, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = INK; ctx.stroke();
    }
  };

  /* ---------- Goods art, drawn in a box of size s from its top-left corner ---------- */
  const GOODS = {
    juice(ctx, s) {
      Draw.rr(s * 0.34, s * 0.3, s * 0.32, s * 0.58, s * 0.08); Draw.fillStroke('#ff9a1f', s * 0.05);
      Draw.rr(s * 0.42, s * 0.12, s * 0.16, s * 0.2, s * 0.04); Draw.fillStroke('#ffd08a', s * 0.04);
      Draw.rr(s * 0.38, s * 0.5, s * 0.24, s * 0.16, s * 0.03); Draw.fillStroke('#fffaf0', s * 0.03);
    },
    smoothie(ctx, s) {
      ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.3); ctx.lineTo(s * 0.7, s * 0.3); ctx.lineTo(s * 0.64, s * 0.88); ctx.lineTo(s * 0.36, s * 0.88); ctx.closePath(); Draw.fillStroke('#ff8fb1', s * 0.05);
      ctx.strokeStyle = INK; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.32); ctx.lineTo(s * 0.68, s * 0.08); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.3, s * 0.22, s * 0.06, 0, 0, TAU); Draw.fillStroke('#fff0f4', s * 0.04);
    },
    jam(ctx, s) {
      Draw.rr(s * 0.26, s * 0.36, s * 0.48, s * 0.5, s * 0.1); Draw.fillStroke('#e8323f', s * 0.05);
      Draw.rr(s * 0.24, s * 0.24, s * 0.52, s * 0.14, s * 0.04); Draw.fillStroke('#fffaf0', s * 0.04);
      Draw.rr(s * 0.35, s * 0.5, s * 0.3, s * 0.18, s * 0.04); Draw.fillStroke('#fffaf0', s * 0.03);
    }
  };
  GOODS.hay = (ctx, s) => {
    Draw.rr(s * 0.14, s * 0.34, s * 0.72, s * 0.46, s * 0.1); Draw.fillStroke('#e8c25a', s * 0.05);
    ctx.strokeStyle = '#b8902a'; ctx.lineWidth = s * 0.03;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(s * (0.14 + i * 0.144), s * 0.36); ctx.lineTo(s * (0.14 + i * 0.144), s * 0.78); ctx.stroke(); }
    ctx.strokeStyle = '#a8692c'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(s * 0.14, s * 0.57); ctx.lineTo(s * 0.86, s * 0.57); ctx.stroke();
  };
  GOODS.corn = (ctx, s) => {
    ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.5, s * 0.15, s * 0.32, 0, 0, TAU); Draw.fillStroke('#ffd23f', s * 0.05);
    ctx.fillStyle = 'rgba(200,140,0,0.5)';
    for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(s * (0.5 + j * 0.07), s * (0.32 + i * 0.12), s * 0.025, 0, TAU); ctx.fill(); }
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.86); ctx.quadraticCurveTo(s * (0.5 + d * 0.32), s * 0.6, s * (0.5 + d * 0.16), s * 0.3); ctx.quadraticCurveTo(s * (0.5 + d * 0.12), s * 0.62, s * 0.5, s * 0.86); Draw.fillStroke('#5cc24a', s * 0.04); }
  };
  GOODS.egg = (ctx, s) => {
    ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.66, s * 0.36, s * 0.16, 0, 0, TAU); Draw.fillStroke('#c9a06a', s * 0.04);
    for (const [x, rot] of [[0.38, -0.25], [0.62, 0.25], [0.5, 0]]) { ctx.beginPath(); ctx.ellipse(s * x, s * (x === 0.5 ? 0.5 : 0.56), s * 0.14, s * 0.19, rot, 0, TAU); Draw.fillStroke('#fff6e0', s * 0.04); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(s * 0.46, s * 0.44, s * 0.03, s * 0.05, -0.3, 0, TAU); ctx.fill();
  };
  GOODS.milk = (ctx, s) => {
    ctx.beginPath(); ctx.moveTo(s * 0.32, s * 0.36); ctx.lineTo(s * 0.5, s * 0.16); ctx.lineTo(s * 0.68, s * 0.36); ctx.closePath(); Draw.fillStroke('#4aa3e8', s * 0.05);
    Draw.rr(s * 0.32, s * 0.36, s * 0.36, s * 0.52, s * 0.04); Draw.fillStroke('#ffffff', s * 0.05);
    Draw.rr(s * 0.32, s * 0.5, s * 0.36, s * 0.16, 0); Draw.fillStroke('#4aa3e8', s * 0.04);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.5, s * 0.58, s * 0.05, 0, TAU); ctx.fill();
  };
  GOODS.popcorn = (ctx, s) => {
    Draw.blob([[0.36, 0.3, 0.1], [0.5, 0.24, 0.11], [0.64, 0.3, 0.1], [0.43, 0.36, 0.1], [0.58, 0.36, 0.1]].map(([x, y, r]) => [s * x, s * y, s * r]), '#fff6d8', s * 0.04);
    ctx.beginPath(); ctx.moveTo(s * 0.28, s * 0.36); ctx.lineTo(s * 0.72, s * 0.36); ctx.lineTo(s * 0.64, s * 0.88); ctx.lineTo(s * 0.36, s * 0.88); ctx.closePath(); Draw.fillStroke('#fffaf0', s * 0.05);
    ctx.fillStyle = '#e8323f'; for (const x of [0.36, 0.5, 0.64]) { ctx.beginPath(); ctx.moveTo(s * (x - 0.04), s * 0.38); ctx.lineTo(s * (x + 0.04), s * 0.38); ctx.lineTo(s * (x + 0.025), s * 0.86); ctx.lineTo(s * (x - 0.025), s * 0.86); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(s * 0.28, s * 0.36); ctx.lineTo(s * 0.72, s * 0.36); ctx.lineTo(s * 0.64, s * 0.88); ctx.lineTo(s * 0.36, s * 0.88); ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = s * 0.05; ctx.stroke();
  };
  GOODS.salad = (ctx, s) => {
    for (const [x, y, c] of [[0.36, 0.44, '#e8322f'], [0.5, 0.38, '#8a4bd6'], [0.64, 0.44, '#ff9a1f'], [0.44, 0.5, '#ffd93b'], [0.58, 0.5, '#ff3b5c']]) { ctx.beginPath(); ctx.arc(s * x, s * y, s * 0.09, 0, TAU); Draw.fillStroke(c, s * 0.035); }
    ctx.beginPath(); ctx.moveTo(s * 0.18, s * 0.52); ctx.lineTo(s * 0.82, s * 0.52); ctx.quadraticCurveTo(s * 0.8, s * 0.86, s * 0.5, s * 0.86); ctx.quadraticCurveTo(s * 0.2, s * 0.86, s * 0.18, s * 0.52); ctx.closePath(); Draw.fillStroke('#bfe6fb', s * 0.05);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(s * 0.34, s * 0.64, s * 0.05, s * 0.08, 0.4, 0, TAU); ctx.fill();
  };
  GOODS.pie = (ctx, s) => {
    ctx.beginPath(); ctx.moveTo(s * 0.16, s * 0.6); ctx.lineTo(s * 0.84, s * 0.6); ctx.lineTo(s * 0.76, s * 0.8); ctx.lineTo(s * 0.24, s * 0.8); ctx.closePath(); Draw.fillStroke('#c9874a', s * 0.05);
    ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.58, s * 0.36, s * 0.18, 0, Math.PI, 0); ctx.closePath(); Draw.fillStroke('#e8a85a', s * 0.05);
    ctx.strokeStyle = '#b8743a'; ctx.lineWidth = s * 0.035;
    for (const d of [-0.16, 0, 0.16]) { ctx.beginPath(); ctx.moveTo(s * (0.5 + d - 0.05), s * 0.5); ctx.lineTo(s * (0.5 + d + 0.05), s * 0.54); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(s * 0.5, s * 0.38, s * 0.05, 0, TAU); Draw.fillStroke('#e8322f', s * 0.03);
  };
  GOODS.shake = (ctx, s) => {
    Draw.blob([[0.38, 0.3, 0.12], [0.5, 0.24, 0.13], [0.62, 0.3, 0.12]].map(([x, y, r]) => [s * x, s * y, s * r]), '#ffffff', s * 0.04);
    ctx.beginPath(); ctx.arc(s * 0.5, s * 0.13, s * 0.05, 0, TAU); Draw.fillStroke('#e8323f', s * 0.03);
    ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.36); ctx.lineTo(s * 0.7, s * 0.36); ctx.lineTo(s * 0.6, s * 0.88); ctx.lineTo(s * 0.4, s * 0.88); ctx.closePath(); Draw.fillStroke('#ff8fb1', s * 0.05);
    ctx.strokeStyle = INK; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.6, s * 0.3); ctx.lineTo(s * 0.72, s * 0.06); ctx.stroke();
    ctx.strokeStyle = '#4aa3e8'; ctx.lineWidth = s * 0.03; ctx.stroke();
  };
  GOODS.pancakes = (ctx, s) => {
    ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.8, s * 0.4, s * 0.09, 0, 0, TAU); Draw.fillStroke('#ffffff', s * 0.04);
    for (let i = 0; i < 3; i++) { Draw.rr(s * 0.2, s * (0.62 - i * 0.12), s * 0.6, s * 0.14, s * 0.07); Draw.fillStroke('#e8b06a', s * 0.04); }
    ctx.beginPath(); ctx.moveTo(s * 0.26, s * 0.4); ctx.quadraticCurveTo(s * 0.5, s * 0.3, s * 0.74, s * 0.4); ctx.lineTo(s * 0.7, s * 0.5); ctx.quadraticCurveTo(s * 0.5, s * 0.44, s * 0.3, s * 0.5); ctx.closePath(); Draw.fillStroke('#e8323f', s * 0.035);
    Draw.rr(s * 0.43, s * 0.27, s * 0.14, s * 0.08, s * 0.02); Draw.fillStroke('#fff3a8', s * 0.03);
  };
  // Goods draw through the same call as fruit, centered on the spot and about 2r across.
  Draw.goodsArt = GOODS;
  for (const name of Object.keys(GOODS)) FRUIT_ART[name] = r => { const ctx = G.ctx; ctx.save(); ctx.translate(-r * 1.5, -r * 1.55); GOODS[name](ctx, r * 3); ctx.restore(); };

  Draw.fruit = (type, x, y, r, rot = 0, alpha = 1, squash = 1) => {
    const ctx = G.ctx, art = FRUIT_ART[type];
    if (!art) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / squash, squash);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    art(r, Math.max(2, r * 0.09));
    ctx.restore();
  };

  // Draws with any draw function into a fresh little canvas (for shop badges and previews).
  Draw.toCanvas = (w, h, paint) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const prev = G.ctx;
    G.ctx = c.getContext('2d');
    try { paint(w, h); } finally { G.ctx = prev; }
    c.setAttribute('aria-hidden', 'true');
    return c;
  };
  Draw.fruitIcon = (type, size = 84) => Draw.toCanvas(size, size, s => Draw.fruit(type, s / 2, s / 2 + 2, s * 0.32));

  /* ---------- Particles and floating text ---------- */
  const FX = FF.fx = { parts: [], texts: [] };
  FX.clear = () => { FX.parts = []; FX.texts = []; };
  FX.burst = (x, y, colors, n, shape) => {
    if (G.reduce) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0), sp = rand(120, 340);
      FX.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 650, life: 1, max: rand(0.5, 0.9), size: rand(4, 8), color: colors[i % colors.length], shape: shape || (i % 3 === 0 ? 'star' : 'dot'), rot: 0, vr: rand(-6, 6) });
    }
  };
  FX.dust = (x, y, dir) => {
    FX.parts.push({ x, y, vx: -dir * rand(20, 80), vy: rand(-60, -20), g: 30, life: 1, max: rand(0.35, 0.6), size: rand(8, 14), color: 'rgba(160,140,110,0.5)', shape: 'dot', rot: 0, vr: 0 });
  };
  FX.confetti = () => {
    const cols = ['#ff6b35', SUN, '#5cc24a', '#6ec2f5', '#ff3b5c', '#8a4bd6'];
    const n = G.reduce ? 20 : 70;
    for (let i = 0; i < n; i++) {
      FX.parts.push({ x: rand(0, G.W), y: rand(-60, -10), vx: rand(-40, 40), vy: rand(60, 220), g: 120, life: 1, max: rand(2.2, 3.2), size: rand(6, 11), color: cols[i % cols.length], shape: 'rect', rot: rand(0, TAU), vr: rand(-5, 5) });
    }
  };
  FX.text = (x, y, txt, big) => FX.texts.push({ x, y, txt, life: 1, big });
  FX.update = dt => {
    for (const p of FX.parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt / p.max; p.rot += p.vr * dt; }
    FX.parts = FX.parts.filter(p => p.life > 0 && p.y < G.H + 40);
    for (const t of FX.texts) { t.y -= 70 * dt; t.life -= dt * 1.1; }
    FX.texts = FX.texts.filter(t => t.life > 0);
  };
  FX.draw = () => {
    const ctx = G.ctx;
    for (const p of FX.parts) {
      ctx.save(); ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      if (p.shape === 'star') { Draw.starPath(p.size); ctx.fill(); }
      else if (p.shape === 'heart') { ctx.rotate(-p.rot); Draw.heartPath(p.size * 1.4); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    for (const t of FX.texts) {
      ctx.save(); ctx.globalAlpha = clamp(t.life * 1.6, 0, 1);
      ctx.font = `800 ${t.big ? 42 : 32}px "Baloo 2", "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.big ? SUN : CARD; ctx.fillText(t.txt, t.x, t.y);
      ctx.restore();
    }
  };
})();
