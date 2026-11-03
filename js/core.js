/* Fruit Farmer: shared helpers, saved progress and sound. */
(() => {
  const FF = window.FF, D = FF.data;
  const TAU = Math.PI * 2;

  const U = FF.util = {
    TAU,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      return arr;
    }
  };

  // Shared runtime state. W and H are the screen size in CSS pixels; ctx is the canvas being drawn to.
  FF.G = {
    W: 0, H: 0, ctx: null, clock: 0,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    state: 'title',   // title | farm | market
    overlay: null,    // which card is open, if any
    input: { keys: { left: false, right: false }, pads: { left: false, right: false }, mode: 'keys' }
  };

  /* ---------- Saved progress (kept in this browser only) ---------- */
  FF.FRUIT_TYPES = Object.keys(D.fruits);
  const SAVE_KEY = 'fruitfarmer.save';

  /* ---------- Farm levels and the basket ---------- */
  const lookFor = level => D.basketLooks.filter(l => level >= l.from).pop();
  const capAt = level => { const l = lookFor(level); return Math.round(l.start + Math.min(level - l.from, l.tiers - 1) * l.step); };
  // Points needed to go from `level` to the next one.
  const stepAt = level => Math.ceil(2 * capAt(level) * (1 + level / D.levels.levelPace));
  function pointsFor(level) { let p = 0; for (let l = 1; l < level; l++) p += stepAt(l); return p; }
  function levelOf(points) { let l = 1, need = stepAt(1); while (points >= need) { points -= need; l++; need = stepAt(l); } return l; }

  function freshSave() {
    const s = {
      coins: 0, crate: {}, barn: {}, barnLevel: 0, points: 0, basketLook: null, up: {}, trips: 0, speed: 'slow',
      trees: D.trees.filter(t => !t.cost).map(t => t.type),
      skins: [D.skins[0].id], skin: D.skins[0].id,
      scenes: [D.scenes[0].id], scene: D.scenes[0].id,
      marketLayout: 'friends', wallOwned: false, wallRevealed: false, filled: 0,
      day: 1, farmNo: 1, farmEarned: 0, lifetime: 0, bestDay: 0, byDate: {}, diary: [], pastFarms: [], otherFarms: [], seedsPaid: 0, today: null, family: null, backup: null, crownWeeks: [], ribbonWeeks: [],
      friends: {}, friendsSeeded: false, decor: [], stickers: [], stats: {}, hats: ['party'], hat: 'party',
      seeds: 0, seedBuys: [], challenge: null, legend: false, legendSeen: false, groves: {}, filters: {}, orders: [], pin: null, buildings: {}, plots: []
    };
    FF.FRUIT_TYPES.forEach(t => { s.crate[t] = 0; s.barn[t] = 0; });
    D.upgrades.forEach(u => s.up[u.id] = 0);
    return s;
  }

  function loadSave() {
    const s = freshSave();
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
    if (!raw || typeof raw !== 'object') return s;
    const n = v => Math.max(0, v | 0);
    const has = (list, id) => Array.isArray(list) && list.includes(id);
    s.coins = n(raw.coins);
    FF.FRUIT_TYPES.forEach(t => s.crate[t] = n(raw.crate && raw.crate[t]));
    if (raw.barn && typeof raw.barn === 'object') FF.FRUIT_TYPES.forEach(t => s.barn[t] = n(raw.barn[t]));
    else FF.FRUIT_TYPES.forEach(t => { s.barn[t] = s.crate[t]; s.crate[t] = 0; });   // before the barn, carried fruit waited for market
    s.barnLevel = U.clamp(n(raw.barnLevel), 0, D.barn.sizes.length - 1);
    // before farm levels, the carrier you'd bought sets your level
    s.points = raw.points != null ? n(raw.points) : pointsFor([1, 5, 15, 30, 50][U.clamp(n(raw.tier), 0, 4)]);
    if (D.basketLooks.some(l => l.look === raw.basketLook)) s.basketLook = raw.basketLook;
    s.trees = D.trees.filter(t => !t.cost || has(raw.trees, t.type)).map(t => t.type);
    D.upgrades.forEach(u => s.up[u.id] = U.clamp(n(raw.up && raw.up[u.id]), 0, u.costs.length));
    s.skins = D.skins.filter(k => !k.cost || has(raw.skins, k.id)).map(k => k.id);
    if (s.skins.includes(raw.skin)) s.skin = raw.skin;
    s.scenes = D.scenes.filter(k => !k.cost || has(raw.scenes, k.id)).map(k => k.id);
    if (s.scenes.includes(raw.scene)) s.scene = raw.scene;
    s.trips = n(raw.trips);
    if (D.speeds[raw.speed]) s.speed = raw.speed;
    s.wallOwned = raw.wallOwned === true;
    s.wallRevealed = raw.wallRevealed === true;
    if (s.wallOwned && raw.marketLayout === 'wall') s.marketLayout = 'wall';
    s.filled = n(raw.filled);
    s.day = Math.max(1, n(raw.day) || s.trips + 1);
    s.farmNo = Math.max(1, n(raw.farmNo));
    s.farmEarned = n(raw.farmEarned); s.lifetime = n(raw.lifetime); s.bestDay = n(raw.bestDay);
    if (raw.byDate && typeof raw.byDate === 'object') s.byDate = raw.byDate;
    if (Array.isArray(raw.diary)) s.diary = raw.diary;
    if (Array.isArray(raw.pastFarms)) s.pastFarms = raw.pastFarms;
    if (Array.isArray(raw.hats)) s.hats = ['party'].concat(raw.hats.filter(h => h !== 'party' && D.hats.some(x => x.id === h)));
    if (s.hats.includes(raw.hat)) s.hat = raw.hat;
    if (Array.isArray(raw.otherFarms)) s.otherFarms = raw.otherFarms.filter(f => f && typeof f === 'object' && f.farmNo > 0);
    s.seedsPaid = n(raw.seedsPaid);
    if (raw.today && typeof raw.today === 'object') s.today = raw.today;
    if (raw.family && typeof raw.family === 'object') s.family = raw.family;
    if (raw.backup && typeof raw.backup === 'object') s.backup = raw.backup;
    if (Array.isArray(raw.crownWeeks)) s.crownWeeks = raw.crownWeeks;
    if (raw.friends && typeof raw.friends === 'object') s.friends = raw.friends;
    s.friendsSeeded = raw.friendsSeeded === true;
    if (Array.isArray(raw.decor)) s.decor = raw.decor;
    if (Array.isArray(raw.stickers)) s.stickers = raw.stickers;
    if (raw.stats && typeof raw.stats === 'object') s.stats = raw.stats;
    s.seeds = n(raw.seeds);
    if (raw.groves && typeof raw.groves === 'object') s.groves = raw.groves;
    if (Array.isArray(raw.orders)) s.orders = raw.orders.filter(o => o && o.items && D.animals[o.animal] && Object.keys(o.items).every(t => D.fruits[t]));
    if (s.orders.some(o => o.id === raw.pin)) s.pin = raw.pin;
    if (Array.isArray(raw.plots)) s.plots = raw.plots.slice(0, D.fields.max).map(p => ({ crop: p && D.fields.crops[p.crop] ? p.crop : null, day: n(p && p.day) }));
    if (raw.buildings && typeof raw.buildings === 'object') for (const b of D.buildings) {
      const v = raw.buildings[b.id];
      if (v && typeof v === 'object') s.buildings[b.id] = { level: U.clamp(n(v.level), 1, b.slots.length), queue: Array.isArray(v.queue) ? v.queue.filter(q => q && D.fruits[q.out]) : [] };
    }
    if (raw.filters && typeof raw.filters === 'object') FF.FRUIT_TYPES.forEach(t => { if (raw.filters[t]) s.filters[t] = n(raw.filters[t]); });
    // the Fruit magnet became filters: anyone who bought it gets those coins back
    const magnet = U.clamp(n(raw.up && raw.up.magnet), 0, 2);
    s.coins += [60, 240].slice(0, magnet).reduce((a, b) => a + b, 0);
    s.legend = raw.legend === true; s.legendSeen = raw.legendSeen === true;
    if (Array.isArray(raw.seedBuys)) s.seedBuys = raw.seedBuys;
    if (D.challenges.some(c => c.id === raw.challenge)) s.challenge = raw.challenge;
    if (Array.isArray(raw.ribbonWeeks)) s.ribbonWeeks = raw.ribbonWeeks;
    return s;
  }

  FF.freshSave = freshSave;
  FF.replaceSave = data => localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  FF.wipeSave = () => localStorage.removeItem(SAVE_KEY);
  FF.save = loadSave();
  FF.persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(FF.save)); } catch (e) {} };

  // Handy lookups for the current progress
  FF.pointsFor = pointsFor;
  FF.levelOfPoints = levelOf;
  FF.capAt = capAt; FF.lookFor = lookFor;
  // During a harvest the level is held where it started; points still add up and the level-up comes at the end.
  let held = null;
  FF.realLevel = () => levelOf(FF.save.points);
  FF.level = () => (held != null ? held : FF.realLevel());
  FF.holdLevel = () => { held = FF.realLevel(); };
  // Ends the hold and returns { from, to, newLook } if the harvest earned a level.
  FF.releaseLevel = () => {
    if (held == null) return null;
    const from = held, to = FF.realLevel(), newLook = lookFor(to).look !== lookFor(from).look;
    held = null;
    if (to > from) { FF.layout(); return { from, to, newLook }; }
    return null;
  };
  FF.levelProgress = () => { const l = FF.realLevel(); return { level: l, into: FF.save.points - pointsFor(l), need: stepAt(l) }; };
  FF.looksReached = () => D.basketLooks.filter(l => FF.level() >= l.from);
  // What you carry: its name, tier and capacity come from your level; how it looks can be any look you've reached.
  FF.carrier = () => {
    const level = FF.level(), now = lookFor(level), shown = FF.looksReached().find(l => l.look === FF.save.basketLook) || now;
    return { look: shown.look, name: now.name, full: now.full, tier: Math.min(level - now.from, now.tiers - 1) + 1, cap: capAt(level) };
  };
  FF.cap = () => (FF.save.challenge === 'tiny' ? Math.min(D.seeds.tinyCap, capAt(FF.level())) : capAt(FF.level()));
  FF.carried = () => FF.FRUIT_TYPES.reduce((sum, t) => sum + FF.save.crate[t], 0);
  FF.inBarn = () => FF.FRUIT_TYPES.reduce((sum, t) => sum + FF.save.barn[t], 0);
  FF.barnSize = () => D.barn.sizes[FF.save.barnLevel];
  // Moves the basket into the barn, as far as there's room. Returns how much had to stay in the basket.
  FF.unloadBasket = () => {
    let room = FF.barnSize() - FF.inBarn();
    for (const t of FF.FRUIT_TYPES) { const k = Math.min(FF.save.crate[t], room); FF.save.crate[t] -= k; FF.save.barn[t] += k; room -= k; }
    FF.persist();
    return FF.carried();
  };
  FF.addPoints = n => {
    const before = FF.level(), look = lookFor(before).look;
    FF.save.points += n;
    if (held != null) return;
    const after = FF.level();
    if (after > before && FF.levelUp) FF.levelUp(after, lookFor(after).look !== look);
  };
  FF.farmName = () => FF.save.farmName || 'Farm ' + FF.save.farmNo;
  FF.scene = () => D.scenes.find(s => s.id === FF.save.scene) || D.scenes[0];
  FF.skin = () => D.skins.find(s => s.id === FF.save.skin) || D.skins[0];

  /* ---------- Sound: tiny synthesized blips, no audio files ---------- */
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  let actx = null;
  const Sound = FF.sound = {
    on: true,
    ensure() {
      if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
      if (actx && actx.state === 'suspended') actx.resume();
    },
    tone(freq, dur = 0.14, type = 'sine', vol = 0.18, when = 0, slideTo = 0) {
      if (!Sound.on || !actx) return;
      const t = actx.currentTime + when;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.03);
    }
  };
  const tone = Sound.tone;
  FF.sfx = {
    catch(n) { const f = NOTES[n % NOTES.length]; tone(f, 0.16, 'triangle', 0.2); tone(f * 2, 0.08, 'sine', 0.06, 0.02); },
    star() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, 0.14, 'triangle', 0.14, i * 0.06)); },
    miss() { tone(220, 0.18, 'sine', 0.07, 0, 120); },
    party() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => tone(f, 0.2, 'square', 0.06, i * 0.09)); },
    zip() { tone(260, 0.22, 'triangle', 0.07, 0, 820); },
    tick() { tone(1400, 0.03, 'sine', 0.03); },
    coin(n = 0) { const b = 987.8 * Math.pow(1.06, n % 8); tone(b, 0.07, 'square', 0.06); tone(b * 1.335, 0.2, 'square', 0.06, 0.07); },
    buy() { [783.99, 987.8, 1174.66, 1567.98].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, i * 0.07)); },
    nope() { tone(200, 0.12, 'square', 0.05); tone(160, 0.16, 'square', 0.05, 0.1); },
    twang() { tone(160, 0.14, 'triangle', 0.14, 0, 520); },
    stretch() { tone(120, 0.05, 'sine', 0.03, 0, 160); },
    plop() { tone(320, 0.12, 'sine', 0.06, 0, 160); }
  };
})();
