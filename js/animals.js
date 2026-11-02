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
    } else if (kind === 'cat' || kind === 'pig' || kind === 'fox') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.86, -r * 0.34); ctx.lineTo(d * r * 0.72, -r * 1.16); ctx.lineTo(d * r * 0.16, -r * 0.86); ctx.closePath();
        Draw.fillStroke(a.color, lw);
      }
    } else if (kind === 'frog') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * r * 0.46, -r * 0.8, r * 0.42, 0, TAU); Draw.fillStroke(a.color, lw); }
    } else if (kind === 'duck') {
      ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.9); ctx.quadraticCurveTo(-r * 0.3, -r * 1.35, r * 0.05, -r * 1.3); ctx.quadraticCurveTo(r * 0.02, -r * 1.1, r * 0.2, -r * 0.9);
      Draw.fillStroke(a.color, lw);
    } else if (kind === 'owl') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.8, -r * 0.5); ctx.lineTo(d * r * 0.9, -r * 1.2); ctx.lineTo(d * r * 0.26, -r * 0.82); ctx.closePath();
        Draw.fillStroke(a.color, lw);
      }
    } else if (kind === 'goat') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.3, -r * 0.8); ctx.quadraticCurveTo(d * r * 0.4, -r * 1.4, d * r * 0.95, -r * 1.3); ctx.quadraticCurveTo(d * r * 0.65, -r * 1.05, d * r * 0.62, -r * 0.65); ctx.closePath();
        Draw.fillStroke(a.accent, lw);
        ctx.beginPath(); ctx.ellipse(d * r * 1.06, -r * 0.2, r * 0.3, r * 0.15, d * 0.35, 0, TAU); Draw.fillStroke(a.color, lw);
      }
    } else if (kind === 'sheep') {
      const wool = [];
      for (let i = 0; i < 10; i++) { const t = i / 10 * TAU; wool.push([Math.cos(t) * r * 0.92, Math.sin(t) * r * 0.86 - r * 0.08, r * 0.42]); }
      Draw.blob(wool, a.accent, lw);
    } else if (kind === 'hedgehog') {
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) { const t = Math.PI * 0.85 + i / 18 * Math.PI * 1.3, rad = i % 2 ? r * 1.5 : r * 1.02; ctx.lineTo(Math.cos(t) * rad, Math.sin(t) * rad); }
      ctx.closePath(); Draw.fillStroke(a.accent, lw);
    } else if (kind === 'turtle') {
      ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 1.2, r * 0.8, 0, Math.PI, 0); ctx.closePath(); Draw.fillStroke(a.accent, lw);
      ctx.strokeStyle = 'rgba(43,35,80,0.35)'; ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 0.3, -r * 1.2); ctx.moveTo(r * 0.5, -r * 0.6); ctx.lineTo(r * 0.3, -r * 1.2); ctx.stroke();
    }
  }

  // A party hat for friends with four hearts.
  function hat(r, lw) {
    const ctx = G.ctx;
    ctx.save(); ctx.translate(r * 0.42, -r * 0.72); ctx.rotate(0.3);
    ctx.beginPath(); ctx.moveTo(-r * 0.3, 0); ctx.lineTo(0, -r * 0.72); ctx.lineTo(r * 0.3, 0); ctx.closePath(); Draw.fillStroke(FF.stickers && FF.stickers.hasReward('crown') ? D.colors.sun : '#c77dff', lw);
    ctx.beginPath(); ctx.arc(0, -r * 0.72, r * 0.11, 0, TAU); Draw.fillStroke(D.colors.sun, lw * 0.7);
    ctx.restore();
  }

  function snout(kind, a, r, lw) {
    const ctx = G.ctx;
    if (kind === 'pig') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.36, r * 0.25, 0, 0, TAU); Draw.fillStroke(a.accent, lw * 0.8);
      ctx.fillStyle = INK;
      Draw.circlesPath([[-r * 0.13, r * 0.2, r * 0.05], [r * 0.13, r * 0.2, r * 0.05]]); ctx.fill();
    } else if (kind === 'bear' || kind === 'fox' || kind === 'goat') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.4, r * 0.3, 0, 0, TAU); ctx.fillStyle = kind === 'goat' ? '#ffffff' : a.accent; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r * 0.17, r * 0.12, r * 0.08, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    } else if (kind === 'duck') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.36, r * 0.52, r * 0.2, 0, 0, TAU); Draw.fillStroke(a.accent, lw * 0.8);
    } else if (kind === 'owl') {
      ctx.beginPath(); ctx.moveTo(-r * 0.16, r * 0.12); ctx.lineTo(r * 0.16, r * 0.12); ctx.lineTo(0, r * 0.42); ctx.closePath(); Draw.fillStroke(a.accent, lw * 0.8);
    } else if (kind === 'hedgehog') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.11, r * 0.08, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    }
  }

  function mouth(kind, r, lw, mood) {
    if (kind === 'duck' || kind === 'owl') return;
    const ctx = G.ctx, y = kind === 'pig' ? r * 0.56 : kind === 'bear' || kind === 'fox' || kind === 'goat' ? r * 0.42 : r * 0.36;
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
      if (FF.friends && FF.friends.wearsHat(kind)) hat(r, lw);
      ctx.restore();
    }
  };
})();
