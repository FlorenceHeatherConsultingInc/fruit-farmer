/* Fruit Farmer: the village guide. Bar buttons and area buttons only show once a quest has
   revealed them (see quests.js), so a new player meets one thing at a time. A new button pulses
   until it's tapped. Refreshing the guide also moves the quests along. */
(() => {
  const FF = window.FF, $ = FF.$;
  const U = id => FF.quests.isUnlocked(id);

  // Which quest reveal shows each bar button and each area.
  const TOOLS = { market: 'market', sleep: 'sleep', shop: 'shop', book: 'book', orders: 'orders', friends: 'friends' };
  const AREAS = { groves: null, fields: 'fields', barnyard: 'barnyard', kitchen: 'kitchen', friends: 'street' };
  const tool = id => U(TOOLS[id]);
  const area = id => AREAS[id] == null || U(AREAS[id]);

  function refresh() {
    const s = FF.save;
    FF.quests.check();
    document.querySelectorAll('#mapTools [data-tool]').forEach(b => {
      const id = b.dataset.tool, on = tool(id);
      b.hidden = !on;
      b.classList.toggle('new', on && !s.toolsSeen.includes(id));
    });
    document.querySelectorAll('#mapJump [data-jump]').forEach(b => { b.hidden = !area(b.dataset.jump); });
    $('mapBarnBtn').hidden = !U('barn');
    const ready = U('orders') ? FF.orders.readyCount() : 0;
    $('ordersBadge').hidden = !ready; $('ordersBadge').textContent = ready;
  }
  $('mapTools').addEventListener('click', e => {
    const b = e.target.closest('[data-tool]');
    if (b && !FF.save.toolsSeen.includes(b.dataset.tool)) { FF.save.toolsSeen.push(b.dataset.tool); b.classList.remove('new'); FF.persist(); }
  }, true);

  FF.guide = { refresh, tool, area };
})();
