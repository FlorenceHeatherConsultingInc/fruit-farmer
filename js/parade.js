/* Fruit Farmer: the Fruit Legend parade. Plays once when the Farm Score first reaches the top
   rank, and again from the Farm book whenever you like. Every friend marches down the street. */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, $ = FF.$, UI = FF.ui;
  const Draw = FF.draw, Animals = FF.animals, { TAU, rand, pick } = FF.util;
  const cv = $('paradeArt'), ctx2 = cv.getContext('2d');
  let from = 'title', t = 0, march = [], bits = [], W = 0, H = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function walker(kind, i, n) {
    const r = Math.max(16, Math.min(W, H) * 0.045);
    return { kind, r, x: -r * 3 - i * r * 3.4, phase: rand(0, TAU), flag: pick(['#ff5e7a', '#ffd23f', '#4aa3e8', '#5cc24a', '#c77dff']) };
  }

  function draw(dt) {
    const ctx = G.ctx, sc = FF.scene(), road = H * 0.68;
    const g = ctx.createLinearGradient(0, 0, 0, road);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sc.hills[0]; ctx.beginPath(); ctx.ellipse(W * 0.3, road, W * 0.6, H * 0.14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sc.ground.top; ctx.fillRect(0, road, W, H - road);
    ctx.fillStyle = sc.plaza[0]; ctx.fillRect(0, road + H * 0.05, W, H * 0.09);
    // bunting across the top
    ctx.strokeStyle = D.colors.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H * 0.08); ctx.quadraticCurveTo(W / 2, H * 0.16, W, H * 0.08); ctx.stroke();
    for (let i = 1; i < 16; i++) {
      const k = i / 16, x = W * k, y = H * 0.08 + H * 0.16 * k * (1 - k);
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 16); ctx.closePath(); Draw.fillStroke(sc.awnings[i % sc.awnings.length], 1.5);
    }
    // the marchers loop back around so the parade keeps going
    const speed = Math.max(60, W * 0.12), y0 = road + H * 0.09, total = march.length * march[0].r * 3.4 + W;
    for (const m of march) {
      m.x += speed * dt;
      if (m.x > W + m.r * 3) m.x -= total;
      const hop = Math.abs(Math.sin(t * 6 + m.phase)) * m.r * 0.4, x = m.x, y = y0 - hop;
      ctx.fillStyle = 'rgba(43,35,80,0.15)'; ctx.beginPath(); ctx.ellipse(x, y0 + m.r * 0.9, m.r, m.r * 0.22, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = D.colors.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + m.r * 0.9, y + m.r * 0.6); ctx.lineTo(x + m.r * 0.9, y - m.r * 2.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + m.r * 0.9, y - m.r * 2.2); ctx.lineTo(x + m.r * 1.9, y - m.r * 1.85); ctx.lineTo(x + m.r * 0.9, y - m.r * 1.5); ctx.closePath(); Draw.fillStroke(m.flag, 2);
      ctx.beginPath(); ctx.ellipse(x, y + m.r * 0.35, m.r * 0.8, m.r * 0.7, 0, 0, TAU); Draw.fillStroke(Animals.color(m.kind), 2.5);
      Animals.drawHead(m.kind, x, y - m.r * 0.6, m.r, 'happy', t + m.phase, { x: 0.6, y: 0 });
    }
    // confetti
    if (bits.length < 90 && !G.reduce) bits.push({ x: rand(0, W), y: -10, vx: rand(-30, 30), vy: rand(60, 160), r: rand(0, TAU), c: pick(['#ff5e7a', '#ffd23f', '#4aa3e8', '#5cc24a', '#c77dff']) });
    for (const b of bits) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.r += dt * 4;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-5, -2.5, 10, 5); ctx.restore();
    }
    bits = bits.filter(b => b.y < H + 10);
  }

  FF.parade = {
    open(origin) {
      FF.sound.ensure();
      from = origin; t = 0; bits = [];
      size();
      const kinds = FF.friends.available();
      march = kinds.map((k, i) => walker(k, i, kinds.length));
      $('paradeText').textContent = 'Farm Score ' + FF.save.lifetime.toLocaleString() + '. Every friend came to celebrate!';
      UI.show('parade');
      FF.sfx.party();
      $('paradeDone').focus({ preventScroll: true });
    },
    tick(dt) {
      t += dt;
      const prev = G.ctx;
      G.ctx = ctx2;
      try { draw(dt); } finally { G.ctx = prev; }
    },
    close() { FF.screens.afterBook(from); }
  };
  $('paradeDone').addEventListener('click', () => FF.parade.close());
  window.addEventListener('resize', () => { if (G.overlay === 'parade') size(); });
})();
