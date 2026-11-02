/* Fruit Farmer: the silly market animals.
   Each one is a head with mismatched googly eyes that follow your shot.
   Colors live in D.animals; a new kind needs ear or snout drawing in drawHead(). */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU } = FF.util;
  const Draw = FF.draw, INK = D.colors.ink;

  function eye(x, y, r, look, mood) {
    const ctx = G.ctx;
    if (mood === 'happy') {
      ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = Math.max(2, r * 0.42); ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      return;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); Draw.fillStroke('#ffffff', Math.max(1.5, r * 0.28));
    ctx.beginPath(); ctx.arc(x + look.x * r * 0.42, y + look.y * r * 0.42, r * 0.5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  }

  function ears(kind, a, r, lw, clock) {
    const ctx = G.ctx;
    if (kind === 'bunny') {
      const sway = Math.sin(clock * 2) * 0.1;
      for (const d of [-1, 1]) {
        ctx.save(); ctx.translate(d * r * 0.42, -r * 0.7); ctx.rotate(d * 0.16 + sway + (d > 0 ? 0.35 : 0));
        ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.27, r * 0.74, 0, 0, TAU); Draw.fillStroke(a.color, lw);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.12, r * 0.5, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
        ctx.restore();
      }
    } else if (kind === 'bear') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.arc(d * r * 0.72, -r * 0.72, r * 0.34, 0, TAU); Draw.fillStroke(a.color, lw);
        ctx.beginPath(); ctx.arc(d * r * 0.72, -r * 0.72, r * 0.16, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
      }
    } else if (kind === 'cat' || kind === 'pig') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.86, -r * 0.34); ctx.lineTo(d * r * 0.72, -r * 1.16); ctx.lineTo(d * r * 0.16, -r * 0.86); ctx.closePath();
        Draw.fillStroke(a.color, lw);
      }
    } else if (kind === 'frog') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * r * 0.46, -r * 0.8, r * 0.42, 0, TAU); Draw.fillStroke(a.color, lw); }
    } else if (kind === 'duck') {
      ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.9); ctx.quadraticCurveTo(-r * 0.3, -r * 1.35, r * 0.05, -r * 1.3); ctx.quadraticCurveTo(r * 0.02, -r * 1.1, r * 0.2, -r * 0.9);
      Draw.fillStroke(a.color, lw);
    }
  }

  function snout(kind, a, r, lw) {
    const ctx = G.ctx;
    if (kind === 'pig') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.36, r * 0.25, 0, 0, TAU); Draw.fillStroke(a.accent, lw * 0.8);
      ctx.fillStyle = INK;
      Draw.circlesPath([[-r * 0.13, r * 0.2, r * 0.05], [r * 0.13, r * 0.2, r * 0.05]]); ctx.fill();
    } else if (kind === 'bear') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.4, r * 0.3, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r * 0.17, r * 0.12, r * 0.08, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    } else if (kind === 'duck') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.36, r * 0.52, r * 0.2, 0, 0, TAU); Draw.fillStroke(a.accent, lw * 0.8);
    }
  }

  function mouth(kind, r, lw, mood) {
    if (kind === 'duck') return;
    const ctx = G.ctx, y = kind === 'pig' ? r * 0.56 : kind === 'bear' ? r * 0.42 : r * 0.36;
    ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (mood === 'happy') {
      ctx.beginPath(); ctx.arc(0, y - r * 0.06, r * 0.3, 0.05 * Math.PI, 0.95 * Math.PI); ctx.closePath(); Draw.fillStroke('#a0263f', lw * 0.8);
      ctx.beginPath(); ctx.ellipse(0, y + r * 0.16, r * 0.14, r * 0.08, 0, 0, TAU); ctx.fillStyle = '#ff7a9c'; ctx.fill();
    } else if (mood === 'excited') {
      ctx.beginPath(); ctx.ellipse(0, y + r * 0.04, r * 0.13, r * 0.17, 0, 0, TAU); Draw.fillStroke('#a0263f', lw * 0.8);
    } else if (mood === 'no') {
      ctx.beginPath(); ctx.arc(0, y + r * 0.26, r * 0.2, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, y - r * 0.06, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      if (kind === 'bunny') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-r * 0.07, y + r * 0.12, r * 0.14, r * 0.15);
        ctx.lineWidth = lw * 0.6; ctx.strokeRect(-r * 0.07, y + r * 0.12, r * 0.14, r * 0.15);
      }
    }
  }

  FF.animals = {
    kinds: Object.keys(D.animals),
    color: kind => D.animals[kind].color,
    // r is the head radius. mood: idle, excited, happy or no. look: a -1..1 direction for the eyes.
    drawHead(kind, x, y, r, mood, clock, look) {
      const ctx = G.ctx, a = D.animals[kind], lw = Math.max(2, r * 0.13);
      ctx.save();
      ctx.translate(x + (mood === 'no' ? Math.sin(clock * 34) * r * 0.16 : 0), y);
      ears(kind, a, r, lw, clock);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.94, 0, 0, TAU); Draw.fillStroke(a.color, lw);

      const blink = mood === 'idle' && Math.sin(clock * 0.9 + x) > 0.985;
      const eyeY = kind === 'frog' ? -r * 0.78 : -r * 0.22, eyeX = kind === 'frog' ? r * 0.46 : r * 0.36;
      const big = mood === 'excited' ? 1.2 : 1;
      if (blink) {
        ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-eyeX - r * 0.2, eyeY); ctx.lineTo(-eyeX + r * 0.2, eyeY); ctx.moveTo(eyeX - r * 0.2, eyeY); ctx.lineTo(eyeX + r * 0.2, eyeY); ctx.stroke();
      } else {
        eye(-eyeX, eyeY, r * 0.25 * big, look, mood);
        eye(eyeX, eyeY, r * 0.33 * big, look, mood);
      }
      snout(kind, a, r, lw);
      mouth(kind, r, lw, mood);
      ctx.restore();
    }
  };
})();
