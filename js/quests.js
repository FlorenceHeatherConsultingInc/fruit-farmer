/* Fruit Farmer: quests. One quest at a time, in the order of D.quests, walks the player through
   the whole farm. A quest starts as soon as the one before it is done (or, if it has a level,
   once the farm reaches it); starting reveals what it needs, so nothing appears before its quest.
   Counting quests count from the moment they start. Finishing pays a few coins and points and
   shows the "Quest done!" card. Saves from before quests tick off whatever they've already done.
   After the last quest everything is open. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, UI = FF.ui, Q = D.quests;
  let introPending = false, doneCard = null, lastShown = null;

  const s = () => FF.save;
  const stat = k => s().stats[k] || 0;
  const isUnlocked = id => s().unlocked.includes('all') || s().unlocked.includes(id);
  const unlock = id => { if (!s().unlocked.includes(id)) s().unlocked.push(id); };
  const current = () => Q.find(q => !s().questsDone.includes(q.id)) || null;
  const waiting = q => !!q && q.level && FF.realLevel() < q.level && s().questOn !== q.id;

  // [have, need] for a quest. base: where counting quests start from.
  function progress(q, base = s().questBase) {
    const n = q.need, B = FF.buildings, sv = s();
    if (n.stat) return [Math.max(0, stat(n.stat) - base), n.n];
    if (n.level) return [Math.min(FF.realLevel(), n.level), n.level];
    if (n.tree) return [sv.trees.includes(n.tree) ? 1 : 0, 1];
    if (n.grown) return [(sv.treeGrows[n.grown] || 0) > 0 ? 1 : 0, 1];
    if (n.basket) return [Math.min(sv.basket, n.basket), n.basket];
    if (n.up) return [(sv.up[n.up] || 0) > 0 ? 1 : 0, 1];
    if (n.skins) return [Math.min(sv.skins.length, n.skins), n.skins];
    if (n.met) return [Math.min(Object.values(sv.friends).filter(f => f && f.sold > 0).length, n.met), n.met];
    if (n.homes) return [Math.min(Object.keys(D.animals).filter(FF.friends.hasHome).length, n.homes), n.homes];
    if (n.built) return [B.owned(n.built) ? 1 : 0, 1];
    if (n.fed) { const id = n.fed, out = D.buildings.find(b => b.id === id).recipes[0].out; return [B.owned(id) && (B.fed(id) > 0 || B.ready(id) > 0 || stat('made' + out[0].toUpperCase() + out.slice(1)) > 0) ? 1 : 0, 1]; }
    if (n.fieldLv) return [Math.min(FF.fields.level(n.fieldLv[0]), n.fieldLv[1]), n.fieldLv[1]];
    if (n.pallet) return [Math.min(Math.max(0, ...D.buildings.filter(b => B.owned(b.id)).map(b => sv.buildings[b.id].pallet)), n.pallet), n.pallet];
    if (n.wall) return [sv.wallOwned ? 1 : 0, 1];
    if (n.ordersToday) return [Math.min(sv.orders.filter(o => o.done && o.day === sv.day).length, n.ordersToday), n.ordersToday];
    return [0, 1];
  }
  const complete = (q, base) => { const [h, n] = progress(q, base); return h >= n; };

  // Whatever the farm already has stays visible, whatever the quests say.
  function unlockOwned() {
    const sv = s();
    sv.trees.forEach(t => unlock('tree:' + t));
    D.buildings.forEach(b => { if (FF.buildings.owned(b.id)) { unlock('b:' + b.id); unlock(b.area); } });
    if (FF.fields.crops().some(c => sv.fieldLv[c] > 0)) unlock('fields');
    FF.fields.crops().forEach(c => { if (sv.fieldLv[c] > 0) unlock('field:' + c); });
    if (sv.wallOwned) unlock('wall');
    if (sv.up.speed > 0 || sv.up.luck > 0 || sv.barnLevel > 0 || sv.basket > D.basket.start) { unlock('barnyard'); unlock('shed'); }
  }
  // A save from before quests: tick off every quest it has already done, counting from zero.
  function migrate() {
    const sv = s();
    // everything up to the furthest quest it has done counts as done (some counters are new)
    const last = Q.reduce((m, q, i) => (complete(q, 0) ? i : m), -1);
    sv.questsDone = Q.filter((q, i) => i <= last || complete(q, 0)).map(q => q.id);
    Q.forEach(q => { if (sv.questsDone.includes(q.id)) (q.reveal || []).forEach(unlock); });
    if (sv.trips > 0) ['barn', 'market', 'sleep', 'book', 'shop'].forEach(unlock);
    if (Object.values(sv.friends).some(f => f && f.sold > 0)) unlock('friends');
    if (FF.level() >= 3) unlock('orders');
    sv.questOn = null;
  }
  // Start a quest: reveal what it needs and note where its count starts.
  function start(q) {
    const sv = s();
    sv.questOn = q.id; sv.questBase = q.need.stat ? stat(q.need.stat) : 0;
    (q.reveal || []).forEach(unlock);
    FF.persist();
  }
  function finish(q) {
    const sv = s();
    sv.questsDone.push(q.id); sv.questOn = null;
    sv.coins += q.reward;
    FF.persist();
  }

  // Called whenever the village shows: finish, start and show quests as needed.
  function check() {
    const sv = s();
    if (sv.questsDone == null) migrate();
    unlockOwned();
    let q = current(), finished = null;
    // One quest finishes per check, so each gets its own card; the next check (when the card closes) does the next.
    if (q && sv.questOn !== q.id && !waiting(q)) { start(q); introPending = true; }
    if (q && sv.questOn === q.id && complete(q)) {
      finish(q); finished = q; q = current();
      if (q && !waiting(q)) start(q);
    }
    if (!current()) unlock('all');
    renderBar();
    if (FF.G.state === 'village' && !FF.G.overlay) {
      if (finished) showDone(finished);
      else if (introPending && lastShown !== (current() || {}).id) showIntro();
    }
  }

  /* ---------- Words for what a quest reveals ---------- */
  const NAMES = { barn: 'Your barn', market: 'The Market', sleep: 'Sleep', book: 'The Farm book', shop: 'The Shop', friends: 'Your friends list',
    orders: 'Orders', street: 'The Friends street', barnyard: 'The Barnyard', shed: 'The Tool shed', kitchen: 'The Kitchen', fields: 'The Fields', wall: 'The Barrel wall' };
  function revealName(id) {
    if (NAMES[id]) return NAMES[id];
    const [kind, what] = id.split(':');
    if (kind === 'tree') return D.trees.find(t => t.type === what).name + ' spot';
    if (kind === 'field') return D.fruits[what].name + ' field';
    if (kind === 'b') return D.buildings.find(b => b.id === what).name;
    return id;
  }
  const bunPic = (() => { let url = null; return () => url || (url = FF.draw.toCanvas(64, 64, sz => FF.animals.drawHead('bunny', sz / 2, sz * 0.62, sz * 0.27, 'happy', 0, { x: 0, y: 0.3 })).toDataURL()); })();
  const number = q => Q.indexOf(q) + 1;

  /* ---------- The quest bar and cards ---------- */
  function renderBar() {
    const bar = $('questBar'), q = current();
    if (!q) { bar.hidden = true; return; }
    bar.hidden = FF.G.state !== 'village';
    let text = q.text, have, need;
    if (waiting(q)) { text = 'Reach level ' + q.level + ' for your next quest'; [have, need] = [FF.realLevel(), q.level]; }
    else [have, need] = progress(q);
    bar.innerHTML = `<img src="${bunPic()}" alt=""><span class="qtext">${text}</span><span class="qmeter"><i style="width:${Math.round(100 * Math.min(1, have / need))}%"></i></span><span class="qcount">${Math.min(have, need)}/${need}</span>`;
  }
  function showIntro() {
    const q = current();
    if (!q) return;
    introPending = false; lastShown = q.id;
    const wait = waiting(q), [have, need] = wait ? [FF.realLevel(), q.level] : progress(q);
    $('questTitle').textContent = 'Quest ' + number(q) + ' of ' + Q.length;
    $('questBody').innerHTML = `<div class="qchapter">Chapter ${q.ch}: ${D.questChapters[q.ch - 1]}</div>` +
      `<div class="qspeech"><img src="${bunPic()}" alt=""><p>${wait ? 'Keep catching, selling and picking. Your next quest starts at level ' + q.level + '!' : q.bun}</p></div>` +
      `<div class="qgoal"><b>${wait ? 'Reach level ' + q.level : q.text}</b><span class="qmeter"><i style="width:${Math.round(100 * Math.min(1, have / need))}%"></i></span><span>${Math.min(have, need)}/${need}</span></div>` +
      `<p class="note">Reward: ${q.reward} coins.</p>`;
    $('questGo').hidden = wait;
    UI.show('quest'); $(wait ? 'questOk' : 'questGo').focus({ preventScroll: true });
  }
  function showDone(q) {
    doneCard = q;
    const next = current(), news = next && s().questOn === next.id ? (next.reveal || []) : [];
    $('questTitle').textContent = 'Quest done!';
    $('questBody').innerHTML = `<div class="qspeech"><img src="${bunPic()}" alt=""><p>You did it: ${q.text.toLowerCase()}!</p></div>` +
      `<div class="qreward">+${q.reward} coins</div>` +
      news.map(id => `<div class="qnew">New: ${revealName(id)}!</div>`).join('') +
      (!next ? `<div class="qnew">Every quest is done! Your whole farm is open. The Sticker Book has more goals.</div>` : waiting(next) ? `<p class="note">Your next quest starts at level ${next.level}.</p>` : '');
    $('questGo').hidden = true;
    $('questOk').textContent = next && !waiting(next) ? 'Next quest' : 'OK';
    UI.show('quest'); FF.fx.confetti(); FF.sfx.party(); $('questOk').focus({ preventScroll: true });
  }
  function closeCard(go) {
    const wasDone = doneCard, q = current();
    doneCard = null; $('questOk').textContent = 'OK';
    UI.hideAll(); FF.screens.backToMap();
    if (FF.G.overlay) return;   // the next quest was already done too: its card is showing
    if (wasDone && q && !waiting(q)) { showIntro(); return; }
    if (go && q && q.go) {
      if (q.go.area && FF.guide.area(q.go.area)) FF.map.jump(q.go.area);
      if (q.go.tool) { const b = $(q.go.tool); if (b) { b.classList.add('pointing'); setTimeout(() => b.classList.remove('pointing'), 3600); } }
    }
  }
  $('questBar').addEventListener('click', () => { FF.sound.ensure(); FF.sfx.tick(); showIntro(); });
  $('questGo').addEventListener('click', () => closeCard(true));
  $('questOk').addEventListener('click', () => closeCard(false));

  /* ---------- The Quests tab in the Farm book ---------- */
  function logHTML() {
    const q = current();
    return `<p class="note">${q ? 'Quest ' + number(q) + ' of ' + Q.length + '.' : 'Every quest is done!'} Done quests are ticked; new ones show up as you go.</p>` +
      D.questChapters.map((name, i) => {
        const list = Q.filter(x => x.ch === i + 1);
        return `<div class="qlog"><b>Chapter ${i + 1}: ${name}</b><ul>${list.map(x => {
          const done = s().questsDone.includes(x.id), now = x === q;
          return `<li class="${done ? 'done' : now ? 'now' : ''}">${done ? '✓ ' + x.text : now ? '★ ' + x.text : '?'}</li>`;
        }).join('')}</ul></div>`;
      }).join('');
  }

  FF.quests = {
    check, current, progress, logHTML, isUnlocked, showIntro,
    // for tests and tools: open everything and mark every quest done
    unlockAll() { const sv = s(); sv.unlocked = ['all']; sv.questsDone = Q.map(q => q.id); sv.questOn = null; FF.persist(); }
  };
})();
