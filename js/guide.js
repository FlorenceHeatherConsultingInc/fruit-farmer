/* Fruit Farmer: the village guide. Bar buttons and area buttons appear as the farm grows, so a new
   player meets one thing at a time. A new button pulses until it's tapped. One-time tips point the
   way to places like the barn and the Tool shed; each shows once, with "Show me" to go there. */
(() => {
  const FF = window.FF, D = FF.data, $ = FF.$;
  const sold = () => FF.save.trips > 0;
  const metFriend = () => Object.values(FF.save.friends).some(f => f && f.sold > 0);
  const kitchenReady = () => D.buildings.some(b => b.area === 'kitchen' && (FF.buildings.owned(b.id) || FF.buildings.canBuild(b.id)));

  // When each bar button shows up.
  const TOOLS = {
    market: () => sold() || FF.inBarn() > 0,
    sleep: sold,
    shop: sold,
    book: sold,
    orders: () => FF.level() >= 3,
    friends: metFriend
  };
  // When each area button shows up. The map itself always has every area to drag through.
  const AREAS = {
    groves: () => true,
    fields: () => FF.fields.open(),
    barnyard: () => FF.inBarn() > 0 || sold(),
    kitchen: () => kitchenReady() || FF.save.trees.length >= 2,
    friends: metFriend
  };
  const bare = () => FF.save.trees.some(t => FF.groves.stock(t) === 0);
  const cheapestTree = () => Math.min(...D.trees.filter(t => t.cost && !FF.save.trees.includes(t.type)).map(t => t.cost));
  // Tips, in order. go: an area to jump to, or a bar button to point at.
  const TIPS = [
    { id: 'barn', when: () => FF.inBarn() > 0 && !sold(), text: 'Your fruit went to the barn. Tap the barn at the top to see what’s inside.', go: { tool: 'mapBarnBtn' } },
    { id: 'market', when: () => FF.inBarn() > 0 && !sold(), text: 'Tap the market stall to sell your fruit to your animal friends.', go: { tool: 'mapMarketBtn' } },
    { id: 'sleep', when: () => sold() && bare(), text: 'A tree is picked clean. Tap the moon to go to bed, and it grows more fruit.', go: { tool: 'mapSleepBtn' } },
    { id: 'plant', when: () => sold() && FF.save.challenge !== 'apples' && FF.save.coins >= cheapestTree(), text: 'You have enough coins to plant a new tree in the Groves!', go: { area: 'groves' } },
    { id: 'shed', when: () => sold() && FF.save.coins >= D.upgrades[0].costs[0], text: 'The Tool shed in the Barnyard has upgrades, like Zippy wheels to move faster.', go: { area: 'barnyard' } },
    { id: 'orders', when: TOOLS.orders, text: 'Friends post orders now! Tap the clipboard to see what they want.', go: { tool: 'mapOrdersBtn' } },
    { id: 'friends', when: metFriend, text: 'Every fruit you sell gives your friends hearts. Tap the heart to see them.', go: { tool: 'mapFriendsBtn' } },
    { id: 'fields', when: () => FF.fields.open(), text: 'The Fields are open! Plant hay and corn there.', go: { area: 'fields' } },
    { id: 'kitchen', when: kitchenReady, text: 'You can build a kitchen to make juice and more. Have a look in the Kitchen.', go: { area: 'kitchen' } }
  ];
  let showing = null;

  function refresh() {
    const s = FF.save;
    document.querySelectorAll('#mapTools [data-tool]').forEach(b => {
      const id = b.dataset.tool, on = TOOLS[id]();
      b.hidden = !on;
      b.classList.toggle('new', on && !s.toolsSeen.includes(id));
    });
    document.querySelectorAll('#mapJump [data-jump]').forEach(b => { b.hidden = !AREAS[b.dataset.jump](); });
    const ready = FF.orders.readyCount();
    $('ordersBadge').hidden = !ready; $('ordersBadge').textContent = ready;
    if (!showing) {
      const tip = TIPS.find(t => !s.tips.includes(t.id) && t.when());
      if (tip) { showing = tip; $('mapTipText').textContent = tip.text; $('mapTip').hidden = false; }
    }
  }
  function done(go) {
    const tip = showing;
    if (!tip) return;
    FF.save.tips.push(tip.id); FF.persist();
    showing = null; $('mapTip').hidden = true; FF.sfx.tick();
    if (go && tip.go.area) FF.map.jump(tip.go.area);
    if (go && tip.go.tool) { const b = $(tip.go.tool); b.classList.add('pointing'); setTimeout(() => b.classList.remove('pointing'), 3600); }
    setTimeout(refresh, 400);
  }
  $('mapTipGo').addEventListener('click', () => done(true));
  $('mapTipOk').addEventListener('click', () => done(false));
  $('mapTools').addEventListener('click', e => {
    const b = e.target.closest('[data-tool]');
    if (b && !FF.save.toolsSeen.includes(b.dataset.tool)) { FF.save.toolsSeen.push(b.dataset.tool); b.classList.remove('new'); FF.persist(); }
  }, true);

  FF.guide = { refresh, tool: id => TOOLS[id](), area: id => AREAS[id](), tips: TIPS };
})();
