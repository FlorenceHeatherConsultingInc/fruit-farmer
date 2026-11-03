/* Fruit Farmer: animal friends. Every fruit sold to an animal fills its hearts, and its favorite
   fruit counts double. Three hearts lets it move into the village, four earns a silly hat and
   five makes you best friends. Friendship, homes and decorations stay across every farm. */
(() => {
  const FF = window.FF, D = FF.data, FR = D.friendship;

  const record = kind => FF.save.friends[kind] || (FF.save.friends[kind] = { sold: 0, home: false });
  const hearts = kind => {
    const sold = FF.save.friends[kind] ? FF.save.friends[kind].sold : 0;
    return FR.hearts.filter(n => sold >= n).length;
  };
  const totalHearts = () => Object.keys(D.animals).reduce((n, k) => n + hearts(k), 0);
  // Total hearts needed before an animal arrives (see newFriends in data.js). Starters are always here.
  const waiting = Object.keys(D.animals).filter(k => !D.animals[k].starter && !D.animals[k].rare);
  const arriveAt = k => (waiting.includes(k) ? D.newFriends.firstAt + waiting.indexOf(k) * D.newFriends.every : 0);
  const arrived = k => {
    const a = D.animals[k];
    return a.rare ? FF.save.seedBuys.includes(D.seedShop.find(x => x.animal === k).id) : totalHearts() >= arriveAt(k);
  };
  const available = () => Object.keys(D.animals).filter(arrived);

  // Saves from before friends existed: count what the diaries remember.
  function seedFromDiaries() {
    const s = FF.save;
    if (s.friendsSeeded) return;
    s.friendsSeeded = true;
    const pages = s.diary.concat(...s.pastFarms.map(f => f.diary || []), s.today ? [s.today] : []);
    for (const p of pages) for (const row of Object.values(p.sales || {})) {
      if (D.animals[row.animal]) record(row.animal).sold += row.n * (row.fruit === D.animals[row.animal].fav ? FR.favoriteCounts : 1);
    }
  }
  seedFromDiaries();

  FF.friends = {
    hearts, totalHearts, available, arriveAt,
    name: kind => D.animals[kind].name,
    sold: kind => (FF.save.friends[kind] ? FF.save.friends[kind].sold : 0),
    nextGoal: kind => FR.hearts[hearts(kind)] || null,
    hasHome: kind => !!(FF.save.friends[kind] && FF.save.friends[kind].home),
    homesBuilt: () => Object.values(FF.save.friends).filter(f => f.home).length,
    homeCost() { const list = D.homeCosts, n = this.homesBuilt(); return list[Math.min(n, list.length - 1)]; },
    canMoveIn: kind => !D.animals[kind].rare && hearts(kind) >= FR.homeAt,
    buildHome(kind) { record(kind).home = true; },
    wearsHat: kind => hearts(kind) >= FR.hatAt,
    // Returns what changed, so the market can celebrate it.
    sell(kind, fruit) {
      const before = hearts(kind), known = available();
      record(kind).sold += fruit === D.animals[kind].fav ? FR.favoriteCounts : 1;
      const now = hearts(kind), newcomers = available().filter(k => !known.includes(k));
      if (now === FR.hearts.length && before < now) {
        const id = 'friend-' + kind;
        if (!FF.save.skins.includes(id)) FF.save.skins.push(id);
      }
      return { hearts: now > before ? now : 0, arrived: newcomers };
    }
  };
})();
