/* Fruit Farmer: the friends panel. The village map opens it as a list of every friend and the
   decorations to buy, or as one friend's card when you tap their home. Homes, decorations and
   friendship carry across every farm. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$, I = FF.icons, UI = FF.ui, F = FF.friends, Animals = FF.animals;
  let only = null;

  /* ---------- The list ---------- */
  const heartsHTML = kind => {
    const n = F.hearts(kind);
    return `<span class="hearts" aria-label="${n} of 5 hearts">${'♥'.repeat(n)}<i>${'♥'.repeat(5 - n)}</i></span>`;
  };
  function friendRow(kind) {
    const a = D.animals[kind], goal = F.nextGoal(kind), n = F.hearts(kind), cost = F.homeCost();
    const fav = n >= D.friendship.favoriteAt ? `Loves ${D.fruits[a.fav].name.toLowerCase()}` : 'Sell more to learn what they love';
    const action = F.hasHome(kind) ? `<span class="tag">Home</span>`
      : F.canMoveIn(kind) ? `<button class="mini" type="button" data-village="home" data-id="${kind}" ${FF.save.coins >= cost ? '' : 'disabled'} aria-label="Build a home for ${a.name} for ${cost} coins">${I.coin}${cost}</button>` : '';
    return `<div class="up" id="friend-${kind}"><div class="badge" data-pic="${kind}"></div><div><h3>${n ? a.name : 'New friend'}</h3>${heartsHTML(kind)}<p>${fav}${goal ? ` · ${F.sold(kind)}/${goal} to the next heart` : ' · Best friends!'}</p></div>${action}</div>`;
  }
  function render() {
    $('villageCoins').innerHTML = UI.coinHTML(FF.save.coins);
    const list = only ? [only] : F.available();
    $('villageTitle').textContent = only ? F.name(only) : 'Friends';
    $('villageMore').hidden = !only;
    $('villageDecorSec').hidden = !!only;
    $('villageFriends').innerHTML = list.map(friendRow).join('');
    list.forEach(k => {
      const pic = FF.draw.toCanvas(84, 84, s => Animals.drawHead(k, s / 2, s * 0.56, s * 0.3, 'idle', 0, { x: 0, y: 0.4 }));
      $('villageFriends').querySelector(`[data-pic="${k}"]`).appendChild(pic);
    });
    const coming = Object.keys(D.animals).filter(k => !list.includes(k) && F.arriveAt(k));
    $('villageNext').textContent = coming.length ? `Earn ${Math.min(...coming.map(F.arriveAt)) - F.totalHearts()} more hearts to meet a new friend.` : 'Everyone has arrived!';
    $('villageDecor').innerHTML = D.decorations.map(d => {
      const on = FF.save.decor.includes(d.id);
      return `<button class="pick${on ? ' on' : ''}" type="button" data-village="decor" data-id="${d.id}" ${on || FF.save.coins >= d.cost ? '' : 'disabled'} aria-pressed="${on}"><b>${d.name}</b><small>${on ? 'Built' : I.coin + d.cost}</small></button>`;
    }).join('');
  }

  $('villageOv').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    FF.sound.ensure();
    if (b.dataset.act === 'villagedone') { UI.hideAll(); FF.screens.backToMap(); return; }
    if (b.dataset.act === 'villagemore') { only = null; render(); return; }
    const id = b.dataset.id, save = FF.save;
    if (b.dataset.village === 'home' && F.canMoveIn(id) && !F.hasHome(id) && save.coins >= F.homeCost()) {
      save.coins -= F.homeCost(); F.buildHome(id); FF.book.bought('Home for ' + F.name(id)); FF.sfx.buy();
    } else if (b.dataset.village === 'decor' && !save.decor.includes(id)) {
      const d = D.decorations.find(x => x.id === id);
      if (save.coins < d.cost) return;
      save.coins -= d.cost; save.decor.push(id); FF.book.bought(d.name); FF.sfx.buy();
    } else return;
    FF.stickers.check();
    FF.persist(); render(); UI.bump($('villageCoins'));
  });
  FF.village = {
    // The whole list, from the map's Friends button.
    open() { only = null; show(); },
    // One friend, from tapping their home on the map.
    card(kind) { only = kind; show(); }
  };
  function show() {
    FF.sound.ensure();
    render();
    UI.show('village');
    $('villageOv').querySelector('.card').scrollTop = 0;
    $('villageDone').focus({ preventScroll: true });
  }
})();
