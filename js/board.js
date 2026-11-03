/* Fruit Farmer: family leaderboards, the Family tab in the Farm Book. Players start a family or
   join one with a code; nothing else about them leaves the device except a made-up farm name and
   coins earned per day. The game never waits on this: if there's no connection, scores simply go
   up next time. Turned off until D.board has a url and key. The server side is supabase/schema.sql. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, { pick } = FF.util;
  const PERIODS = [['day', 'Today'], ['week', 'This week'], ['month', 'This month'], ['all', 'All time']];
  let period = 'week', rows = null, week = null, status = '', draftName = '', showJoin = false;
  let saveStatus = '', showUse = false, pendingLoad = null;

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
      await loadWeek(f);
      status = '';
    } catch (e) { status = "Can't reach the board right now."; }
    FF.book.refresh();
  }
  // The crown and ribbons. Skipped quietly if the server hasn't been updated for them yet.
  async function loadWeek(f) {
    try {
      const monday = since('week'), list = await call('family_week', { p_code: f.code, p_week: monday, p_player: f.id });
      const top = list.reduce((m, r) => Math.max(m, r.last_week), 0);
      week = { crown: top ? list.filter(r => r.last_week === top).map(r => r.name) : [], ribbons: list.filter(r => r.best_before > 0 && r.this_week > r.best_before).map(r => r.name) };
      const me = list.find(r => r.me), s = FF.save;
      if (me && top && me.last_week === top && !s.crownWeeks.includes(monday)) s.crownWeeks.push(monday);
      if (me && week.ribbons.includes(me.name) && !s.ribbonWeeks.includes(monday)) s.ribbonWeeks.push(monday);
      FF.stickers.check(); FF.persist();
    } catch (e) { week = null; }
  }

  /* ---------- Save codes ---------- */
  function backupData() {
    const data = JSON.parse(JSON.stringify(FF.save));
    if (JSON.stringify(data).length > 400000) data.pastFarms.concat(data.otherFarms || []).forEach(f => { f.diary = []; });
    return data;
  }
  async function backup() {
    const b = FF.save.backup;
    if (!on() || !b) return;
    try { await call('update_backup', { p_code: b.code, p_secret: b.secret, p_data: backupData() }); } catch (e) {}
  }
  async function makeCode() {
    saveStatus = 'One moment...'; FF.book.refresh();
    try {
      const key = secret(), code = await call('create_backup', { p_secret: key, p_data: backupData() });
      if (!code) throw new Error('refused');
      FF.save.backup = { code, secret: key };
      await call('update_backup', { p_code: code, p_secret: key, p_data: backupData() });
      FF.persist(); FF.sfx.buy(); saveStatus = '';
    } catch (e) { saveStatus = "Couldn't make a code right now. Try again later."; }
    FF.book.refresh();
  }
  async function findCode() {
    const code = ($('saveCode').value || '').trim().toUpperCase();
    if (code.length !== 8) { saveStatus = 'Save codes have 8 letters and numbers.'; FF.book.refresh(); return; }
    saveStatus = 'One moment...'; FF.book.refresh();
    try {
      const data = await call('load_backup', { p_code: code });
      if (!data) saveStatus = "That code didn't work. Check it and try again.";
      else { pendingLoad = data; saveStatus = ''; }
    } catch (e) { saveStatus = "Can't reach the save right now."; }
    FF.book.refresh();
  }
  function saveHTML() {
    const b = FF.save.backup;
    let html = `<div class="label">Save code</div>`;
    if (pendingLoad) return html + `<p class="note">Replace this game with Farm ${pendingLoad.farmNo || 1}, day ${pendingLoad.day || 1}? The game on this device will be gone.</p>` +
      `<div class="btnrow"><button class="btn primary" type="button" data-board="useyes">Use that save</button><button class="btn secondary" type="button" data-board="useno">Keep this game</button></div>`;
    html += b
      ? `<p class="note">Your code: <b class="code">${b.code}</b><br>Write it down. It backs up after each market trip and works on any device. Anyone with it can load your game.</p>`
      : `<p class="note">Get a code to keep your game safe and move it to another device.</p><button class="btn secondary" type="button" data-board="makecode">Get my code</button>`;
    html += showUse
      ? `<label class="label" for="saveCode">Enter a save code</label><input id="saveCode" class="codebox" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn primary" type="button" data-board="findcode">Find my game</button>`
      : `<button class="btn secondary" type="button" data-board="showuse">Use a code</button>`;
    return html + (saveStatus ? `<p class="note">${saveStatus}</p>` : '');
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
  const daysLeft = () => 7 - (new Date().getDay() + 6) % 7;
  function boardHTML() {
    const f = FF.save.family;
    const list = rows
      ? `<ol class="board">${rows.map(r => `<li class="${r.me ? 'on' : ''}">${week && week.crown.includes(r.name) ? '<span class="crown" aria-label="Last week\'s crown">♛</span>' : ''}<b>${FF.book.esc(r.name)}</b>${week && week.ribbons.includes(r.name) ? '<span class="ribbon">Best week!</span>' : ''}<span class="pay">${I.coin}${r.coins}</span></li>`).join('')}</ol>`
      : `<p class="note">Loading...</p>`;
    return `<div class="periods">${PERIODS.map(([k, name]) => `<button type="button" data-board="p-${k}" aria-pressed="${k === period}">${name}</button>`).join('')}</div>` +
      list + (status ? `<p class="note">${status}</p>` : '') +
      (week ? `<p class="note">${daysLeft()} ${daysLeft() === 1 ? 'day' : 'days'} left to win this week's crown.</p>` : '') +
      `<p class="note">Family code: <b class="code">${f.code}</b><br>Share it with your family to play together.</p>` +
      `<button class="btn secondary" type="button" data-board="leave">Leave family</button>`;
  }

  FF.board = {
    enabled: on,
    html: () => (FF.save.family && FF.save.family.code) ? boardHTML() : setupHTML(),
    opened() { status = ''; load(); },
    sync() { sync().catch(() => {}); },
    backup,
    saveHTML,
    act(name) {
      if (name.startsWith('p-')) { period = name.slice(2); rows = null; FF.book.refresh(); load(); return; }
      if (name === 'makecode') { makeCode(); return; }
      if (name === 'findcode') { findCode(); return; }
      if (name === 'showuse') { showUse = true; FF.book.refresh(); return; }
      if (name === 'useno') { pendingLoad = null; FF.book.refresh(); return; }
      if (name === 'useyes') { FF.replaceSave(pendingLoad); location.reload(); return; }
      if (name === 'rename') { draftName = randomName(); FF.sfx.tick(); FF.book.refresh(); }
      else if (name === 'showjoin') { showJoin = true; FF.book.refresh(); }
      else if (name === 'create') create();
      else if (name === 'join') join();
      else if (name === 'leave') leave();
    }
  };
})();
