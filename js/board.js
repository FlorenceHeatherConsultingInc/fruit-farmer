/* Fruit Farmer: family leaderboards, the Family tab in the Farm Book. Players start a family or
   join one with a code; nothing else about them leaves the device except a made-up farm name and
   coins earned per day. The game never waits on this: if there's no connection, scores simply go
   up next time. Turned off until D.board has a url and key. The server side is supabase/schema.sql. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, { pick } = FF.util;
  const PERIODS = [['day', 'Today'], ['week', 'This week'], ['month', 'This month'], ['all', 'All time']];
  let period = 'week', rows = null, status = '', draftName = '', showJoin = false;

  const on = () => !!(D.board.url && D.board.key);
  const words = D.boardWords;
  const randomName = () => pick(words.first) + ' ' + pick(words.second) + ' Farm';
  const secret = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
  const playerId = () => {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  async function call(fn, body) {
    const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 8000);
    const headers = { 'Content-Type': 'application/json', apikey: D.board.key };
    if (D.board.key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + D.board.key;
    try {
      const res = await fetch(`${D.board.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body), signal: stop.signal });
      if (!res.ok) throw new Error('server ' + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  /* ---------- Talking to the board ---------- */
  function ensureIdentity() {
    const s = FF.save;
    if (!s.family) s.family = { code: '', id: playerId(), secret: secret(), name: draftName || randomName() };
    s.family.name = draftName || s.family.name;
    return s.family;
  }
  const since = key => {
    const now = new Date();
    if (key === 'day') return FF.book.dateKey(now);
    if (key === 'month') return FF.book.dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    if (key === 'all') return '2000-01-01';
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
    return FF.book.dateKey(monday);
  };
  async function sync() {
    const f = FF.save.family;
    if (!on() || !f || !f.code) return;
    await call('submit_scores', { p_player: f.id, p_secret: f.secret, p_scores: FF.save.byDate });
  }
  async function load() {
    const f = FF.save.family;
    if (!on() || !f || !f.code) return;
    try {
      await sync();
      rows = await call('family_board', { p_code: f.code, p_since: since(period), p_player: f.id });
      status = '';
    } catch (e) { status = "Can't reach the board right now."; }
    FF.book.refresh();
  }
  async function create() {
    const f = ensureIdentity();
    status = 'One moment...'; FF.book.refresh();
    try {
      const code = await call('create_family', { p_player: f.id, p_secret: f.secret, p_name: f.name });
      if (!code) throw new Error('refused');
      f.code = code; FF.persist(); FF.sfx.buy();
      await load();
    } catch (e) { status = "Couldn't start a family. Try again."; FF.book.refresh(); }
  }
  async function join() {
    const code = ($('boardCode').value || '').trim().toUpperCase(), f = ensureIdentity();
    if (code.length !== 6) { status = 'Family codes have 6 letters and numbers.'; FF.book.refresh(); return; }
    status = 'One moment...'; FF.book.refresh();
    try {
      if (!await call('join_family', { p_code: code, p_player: f.id, p_secret: f.secret, p_name: f.name })) { status = "That code didn't work. Check it and try again."; FF.book.refresh(); return; }
      f.code = code; FF.persist(); FF.sfx.buy();
      await load();
    } catch (e) { status = "Can't reach the board right now."; FF.book.refresh(); }
  }
  async function leave() {
    const f = FF.save.family;
    try { await call('leave_family', { p_player: f.id, p_secret: f.secret }); } catch (e) {}
    FF.save.family = null; rows = null; status = ''; draftName = ''; showJoin = false;
    FF.persist(); FF.book.refresh();
  }

  /* ---------- The Family tab ---------- */
  function setupHTML() {
    if (!draftName) draftName = (FF.save.family && FF.save.family.name) || randomName();
    return `<div class="score"><small>Your farm name</small><span class="rank">${draftName}</span></div>` +
      `<button class="btn secondary" type="button" data-board="rename">New name</button>` +
      `<button class="btn primary" type="button" data-board="create">Start a family</button>` +
      (showJoin
        ? `<label class="label" for="boardCode">Family code</label><input id="boardCode" class="codebox" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn primary" type="button" data-board="join">Join</button>`
        : `<button class="btn secondary" type="button" data-board="showjoin">Join with a code</button>`) +
      (status ? `<p class="note">${status}</p>` : '');
  }
  function boardHTML() {
    const f = FF.save.family;
    const list = rows
      ? `<ol class="board">${rows.map(r => `<li class="${r.me ? 'on' : ''}"><b>${FF.book.esc(r.name)}</b><span class="pay">${I.coin}${r.coins}</span></li>`).join('')}</ol>`
      : `<p class="note">Loading...</p>`;
    return `<div class="periods">${PERIODS.map(([k, name]) => `<button type="button" data-board="p-${k}" aria-pressed="${k === period}">${name}</button>`).join('')}</div>` +
      list + (status ? `<p class="note">${status}</p>` : '') +
      `<p class="note">Family code: <b class="code">${f.code}</b><br>Share it with your family to play together.</p>` +
      `<button class="btn secondary" type="button" data-board="leave">Leave family</button>`;
  }

  FF.board = {
    enabled: on,
    html: () => (FF.save.family && FF.save.family.code) ? boardHTML() : setupHTML(),
    opened() { status = ''; load(); },
    sync() { sync().catch(() => {}); },
    act(name) {
      if (name.startsWith('p-')) { period = name.slice(2); rows = null; FF.book.refresh(); load(); return; }
      if (name === 'rename') { draftName = randomName(); FF.sfx.tick(); FF.book.refresh(); }
      else if (name === 'showjoin') { showJoin = true; FF.book.refresh(); }
      else if (name === 'create') create();
      else if (name === 'join') join();
      else if (name === 'leave') leave();
    }
  };
})();
