/* Fruit Farmer: the silly market animals.
   Each one is a head with mismatched googly eyes that follow your shot.
   Colors live in D.animals; a new kind needs ear or snout drawing in drawHead(). */
(() => {
  const FF = window.FF, G = FF.G, D = FF.data, { TAU } = FF.util;
  const Draw = FF.draw, INK = D.colors.ink;
  let happyInk = INK;   // white on dark eye patches

  function eye(x, y, r, look, mood) {
    const ctx = G.ctx;
    if (mood === 'happy') {
      ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = Math.max(2, r * 0.42); ctx.strokeStyle = happyInk; ctx.lineCap = 'round'; ctx.stroke();
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
    } else if (kind === 'panda' || kind === 'mouse' || kind === 'koala') {
      const big = kind === 'panda' ? 0.3 : kind === 'mouse' ? 0.46 : 0.44, out = kind === 'panda' ? 0.72 : 0.82;
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.arc(d * r * out, -r * 0.7, r * big, 0, TAU); Draw.fillStroke(kind === 'panda' ? a.accent : a.color, lw);
        if (kind !== 'panda') { ctx.beginPath(); ctx.arc(d * r * out, -r * 0.7, r * big * 0.55, 0, TAU); ctx.fillStyle = a.accent; ctx.fill(); }
      }
    } else if (kind === 'raccoon') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.84, -r * 0.4); ctx.lineTo(d * r * 0.66, -r * 1.1); ctx.lineTo(d * r * 0.2, -r * 0.84); ctx.closePath(); Draw.fillStroke(a.color, lw);
        ctx.beginPath(); ctx.moveTo(d * r * 0.7, -r * 0.55); ctx.lineTo(d * r * 0.62, -r * 0.92); ctx.lineTo(d * r * 0.36, -r * 0.8); ctx.closePath(); ctx.fillStyle = a.accent; ctx.fill();
      }
    } else if (kind === 'llama') {
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * r * 0.5, -r * 0.8); ctx.rotate(d * 0.25); ctx.beginPath(); ctx.ellipse(0, -r * 0.35, r * 0.16, r * 0.42, 0, 0, TAU); Draw.fillStroke(a.color, lw); ctx.restore(); }
      Draw.blob([[-r * 0.28, -r * 0.9, r * 0.22], [0, -r * 1.0, r * 0.24], [r * 0.28, -r * 0.9, r * 0.22]], a.accent, lw);
    } else if (kind === 'dog') {
      for (const d of [-1, 1]) {
        ctx.save(); ctx.translate(d * r * 0.95, -r * 0.4); ctx.rotate(d * 0.25);
        ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.27, r * 0.6, 0, 0, TAU); Draw.fillStroke(a.accent, lw);
        ctx.restore();
      }
    } else if (kind === 'flamingo' || kind === 'parrot') {
      const cols = kind === 'parrot' ? [a.accent, '#ffd23f', a.accent] : [a.accent, a.accent, a.accent];
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate((i - 1) * r * 0.16, -r * 0.82); ctx.rotate((i - 1) * 0.45 + 0.15);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.3, r * 0.11, r * 0.36, 0, 0, TAU); Draw.fillStroke(cols[i], lw * 0.8);
        ctx.restore();
      }
    } else if (kind === 'skunk') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * r * 0.68, -r * 0.68, r * 0.26, 0, TAU); Draw.fillStroke(a.color, lw); }
    } else if (kind === 'camel') {
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * r * 0.82, -r * 0.5); ctx.rotate(d * 0.9); ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.13, r * 0.24, 0, 0, TAU); Draw.fillStroke(a.color, lw); ctx.restore(); }
      Draw.blob([[-r * 0.2, -r * 0.92, r * 0.18], [0, -r * 1.02, r * 0.2], [r * 0.2, -r * 0.92, r * 0.18]], a.accent, lw);
    } else if (kind === 'donkey') {
      // one ear up, one flopped over
      for (const [d, tilt] of [[-1, -0.3], [1, 1.25]]) {
        ctx.save(); ctx.translate(d * r * 0.45, -r * 0.75); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.2, r * 0.62, 0, 0, TAU); Draw.fillStroke(a.color, lw);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.48, r * 0.09, r * 0.42, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
        ctx.restore();
      }
      Draw.blob([[-r * 0.12, -r * 0.92, r * 0.16], [r * 0.08, -r * 1.0, r * 0.17], [r * 0.24, -r * 0.88, r * 0.14]], a.accent, lw);
    } else if (kind === 'tiger') {
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * r * 0.86, -r * 0.34); ctx.lineTo(d * r * 0.72, -r * 1.06); ctx.lineTo(d * r * 0.2, -r * 0.84); ctx.closePath(); Draw.fillStroke(a.color, lw);
        ctx.beginPath(); ctx.moveTo(d * r * 0.72, -r * 0.55); ctx.lineTo(d * r * 0.68, -r * 0.88); ctx.lineTo(d * r * 0.42, -r * 0.78); ctx.closePath(); ctx.fillStyle = '#fff3e0'; ctx.fill();
      }
    } else if (kind === 'turtle') {
      ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 1.2, r * 0.8, 0, Math.PI, 0); ctx.closePath(); Draw.fillStroke(a.accent, lw);
      ctx.strokeStyle = 'rgba(43,35,80,0.35)'; ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 0.3, -r * 1.2); ctx.moveTo(r * 0.5, -r * 0.6); ctx.lineTo(r * 0.3, -r * 1.2); ctx.stroke();
    }
  }

  // The hat friends with four hearts wear: the one picked in the shop.
  function hat(r, lw, style) {
    const ctx = G.ctx;
    ctx.save();
    if (style === 'flower') {
      for (let i = 0; i < 5; i++) {
        const a = -2.5 + i * 0.42, x = Math.cos(a) * r * 0.92, y = Math.sin(a) * r * 0.92;
        Draw.blob([[x - r * 0.08, y, r * 0.09], [x + r * 0.08, y, r * 0.09], [x, y - r * 0.08, r * 0.09], [x, y + r * 0.08, r * 0.09]], ['#ff8fb1', '#ffd23f', '#ffffff', '#c9a6ff', '#ff8fb1'][i], lw * 0.6);
        ctx.beginPath(); ctx.arc(x, y, r * 0.05, 0, TAU); ctx.fillStyle = '#ff9a1f'; ctx.fill();
      }
    } else if (style === 'bow') {
      ctx.translate(r * 0.42, -r * 0.82); ctx.rotate(0.25);
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d * r * 0.36, -r * 0.2); ctx.lineTo(d * r * 0.36, r * 0.2); ctx.closePath(); Draw.fillStroke('#ff5e7a', lw * 0.8); }
      ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, TAU); Draw.fillStroke('#ff8fb1', lw * 0.7);
    } else if (style === 'top') {
      ctx.translate(r * 0.3, -r * 0.82); ctx.rotate(0.18);
      Draw.rr(-r * 0.28, -r * 0.62, r * 0.56, r * 0.64, r * 0.05); Draw.fillStroke('#3a3a58', lw);
      Draw.rr(-r * 0.28, -r * 0.2, r * 0.56, r * 0.12, 0); Draw.fillStroke('#ff5e7a', lw * 0.6);
      Draw.rr(-r * 0.46, -r * 0.02, r * 0.92, r * 0.13, r * 0.06); Draw.fillStroke('#3a3a58', lw);
    } else if (style === 'cowboy') {
      ctx.translate(r * 0.15, -r * 0.86); ctx.rotate(0.12);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.14, 0, 0, TAU); Draw.fillStroke('#c9874a', lw);
      ctx.beginPath(); ctx.moveTo(-r * 0.34, 0); ctx.quadraticCurveTo(-r * 0.36, -r * 0.5, 0, -r * 0.46); ctx.quadraticCurveTo(r * 0.36, -r * 0.5, r * 0.34, 0); ctx.closePath(); Draw.fillStroke('#c9874a', lw);
      Draw.rr(-r * 0.34, -r * 0.14, r * 0.68, r * 0.1, 0); Draw.fillStroke('#8a5a32', lw * 0.6);
    } else if (style === 'chef') {
      ctx.translate(r * 0.2, -r * 0.86); ctx.rotate(0.15);
      Draw.blob([[-r * 0.24, -r * 0.34, r * 0.22], [r * 0.24, -r * 0.34, r * 0.22], [0, -r * 0.48, r * 0.26]], '#ffffff', lw);
      Draw.rr(-r * 0.32, -r * 0.2, r * 0.64, r * 0.24, r * 0.05); Draw.fillStroke('#ffffff', lw);
    } else {
      ctx.translate(r * 0.42, -r * 0.72); ctx.rotate(0.3);
      ctx.beginPath(); ctx.moveTo(-r * 0.3, 0); ctx.lineTo(0, -r * 0.72); ctx.lineTo(r * 0.3, 0); ctx.closePath(); Draw.fillStroke(FF.stickers && FF.stickers.hasReward('crown') ? D.colors.sun : '#c77dff', lw);
      ctx.beginPath(); ctx.arc(0, -r * 0.72, r * 0.11, 0, TAU); Draw.fillStroke(D.colors.sun, lw * 0.7);
    }
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
    } else if (kind === 'hedgehog' || kind === 'panda' || kind === 'raccoon') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.11, r * 0.08, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    } else if (kind === 'penguin') {
      ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.14); ctx.lineTo(r * 0.2, r * 0.14); ctx.lineTo(0, r * 0.44); ctx.closePath(); Draw.fillStroke(a.accent, lw * 0.8);
    } else if (kind === 'mouse') {
      ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.5;
      for (const d of [-1, 1]) for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * r * 0.2, r * 0.22); ctx.lineTo(d * r * 0.75, r * (0.16 + k * 0.1)); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.1, 0, TAU); Draw.fillStroke(a.accent, lw * 0.7);
    } else if (kind === 'llama') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.34, r * 0.38, r * 0.3, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.fillStyle = INK; Draw.circlesPath([[-r * 0.1, r * 0.22, r * 0.04], [r * 0.1, r * 0.22, r * 0.04]]); ctx.fill();
    } else if (kind === 'dog' || kind === 'tiger') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.32, r * 0.42, r * 0.3, 0, 0, TAU); ctx.fillStyle = '#fff3e0'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r * 0.17, r * 0.13, r * 0.09, 0, 0, TAU); ctx.fillStyle = kind === 'tiger' ? '#ff7a9c' : INK; ctx.fill();
    } else if (kind === 'skunk') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.11, r * 0.08, 0, 0, TAU); ctx.fillStyle = '#ff8fb1'; ctx.fill();
    } else if (kind === 'flamingo') {
      // a pale beak that bends down to a dark tip
      ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.06); ctx.quadraticCurveTo(r * 0.42, -r * 0.02, r * 0.34, r * 0.36);
      ctx.lineTo(r * 0.18, r * 0.62); ctx.quadraticCurveTo(r * 0.14, r * 0.34, -r * 0.16, r * 0.28); ctx.closePath(); Draw.fillStroke('#fff0e6', lw * 0.8);
      ctx.beginPath(); ctx.moveTo(r * 0.33, r * 0.4); ctx.lineTo(r * 0.18, r * 0.62); ctx.lineTo(r * 0.15, r * 0.42); ctx.closePath(); Draw.fillStroke(INK, lw * 0.5);
    } else if (kind === 'parrot') {
      ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.06); ctx.quadraticCurveTo(r * 0.05, -r * 0.08, r * 0.24, r * 0.1);
      ctx.quadraticCurveTo(r * 0.34, r * 0.4, r * 0.06, r * 0.56); ctx.quadraticCurveTo(r * 0.14, r * 0.3, -r * 0.2, r * 0.28); ctx.closePath(); Draw.fillStroke('#ffd23f', lw * 0.8);
    } else if (kind === 'camel' || kind === 'donkey') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.38, r * 0.5, r * 0.32, 0, 0, TAU); Draw.fillStroke(kind === 'camel' ? '#f0d8a8' : '#dcd8e8', lw * 0.8);
      ctx.fillStyle = INK; Draw.circlesPath([[-r * 0.16, r * 0.3, r * 0.05], [r * 0.16, r * 0.3, r * 0.05]]); ctx.fill();
    } else if (kind === 'koala') {
      ctx.beginPath(); ctx.ellipse(0, r * 0.18, r * 0.16, r * 0.22, 0, 0, TAU); Draw.fillStroke('#3a3550', lw * 0.7);
    }
  }
  // Markings under the eyes: a panda's patches, a raccoon's mask, a penguin's white face, a skunk's stripe, a tiger's stripes.
  function face(kind, a, r) {
    const ctx = G.ctx;
    if (kind === 'panda') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * r * 0.37, -r * 0.18, r * 0.27, r * 0.33, d * -0.5, 0, TAU); ctx.fillStyle = a.accent; ctx.fill(); }
    } else if (kind === 'raccoon') {
      ctx.beginPath(); ctx.ellipse(0, -r * 0.2, r * 0.82, r * 0.28, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r * 0.32, r * 0.42, r * 0.3, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (kind === 'dog') {
      ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 0.24, r * 0.3, r * 0.3, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
    } else if (kind === 'parrot') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * r * 0.36, -r * 0.18, r * 0.36, r * 0.36, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    } else if (kind === 'skunk' || kind === 'tiger') {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.94, 0, 0, TAU); ctx.clip();
      if (kind === 'skunk') {
        ctx.beginPath(); ctx.ellipse(0, -r * 0.82, r * 0.17, r * 0.62, 0, 0, TAU); ctx.fillStyle = a.accent; ctx.fill();
      } else {
        // stripes on the forehead and cheeks
        ctx.strokeStyle = a.accent; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        for (const d of [-1, 0, 1]) { ctx.moveTo(d * r * 0.2, -r * 0.98); ctx.lineTo(d * r * 0.16, -r * 0.66 + Math.abs(d) * r * 0.08); }
        for (const d of [-1, 1]) for (const k of [0, 1]) { ctx.moveTo(d * r * 1.02, r * (0.02 + k * 0.24)); ctx.lineTo(d * r * 0.72, r * (0.06 + k * 0.22)); }
        ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.94, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, r * 0.13); ctx.stroke();
    } else if (kind === 'penguin') {
      Draw.blob([[-r * 0.32, -r * 0.1, r * 0.4], [r * 0.32, -r * 0.1, r * 0.4], [0, r * 0.3, r * 0.5]], '#ffffff', 0);
    }
  }

  function mouth(kind, r, lw, mood) {
    if (kind === 'duck' || kind === 'owl' || kind === 'penguin' || kind === 'flamingo' || kind === 'parrot') return;
    const ctx = G.ctx, y = kind === 'pig' ? r * 0.56 : kind === 'camel' || kind === 'donkey' ? r * 0.58 : kind === 'bear' || kind === 'fox' || kind === 'goat' || kind === 'dog' || kind === 'tiger' ? r * 0.42 : r * 0.36;
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
      const ctx = G.ctx, who = kind, a = D.animals[kind], lw = Math.max(2, r * 0.13);
      kind = a.like || kind;
      ctx.save();
      ctx.translate(x + (mood === 'no' ? Math.sin(clock * 34) * r * 0.16 : 0), y);
      ears(kind, a, r, lw, clock);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.94, 0, 0, TAU); Draw.fillStroke(a.color, lw);
      face(kind, a, r);
      happyInk = kind === 'panda' || kind === 'raccoon' || kind === 'skunk' ? '#ffffff' : INK;

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
      if (FF.animals.showHat) hat(r, lw, FF.animals.showHat);
      else if (FF.friends && FF.friends.wearsHat(who)) hat(r, lw, FF.save.hat);
      ctx.restore();
    }
  };
})();
