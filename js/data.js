/* Fruit Farmer: game content and tuning.
   Everything you'd want to tweak lives in this file: prices, carriers, trees, upgrades,
   basket colors, scenery and customers. Add or change a row and it shows up in the game
   and in the shop. Other files only need changing when you add a new *kind* of thing
   (for example a new tree shape or a new kind of weather). */
window.FF = window.FF || {};

FF.data = {
  colors: { ink: '#2b2350', card: '#fffaf0', sun: '#ffd23f' },

  // Sell price in coins and the sparkle colors when caught. Gold stars fall rarely from any tree.
  fruits: {
    apple:      { name: 'Apples',       price: 1,  colors: ['#e8322f', '#ff8a7a'] },
    orange:     { name: 'Oranges',      price: 2,  colors: ['#ff9a1f', '#ffd08a'] },
    banana:     { name: 'Bananas',      price: 3,  colors: ['#ffd93b', '#fff3a8'] },
    strawberry: { name: 'Strawberries', price: 4,  colors: ['#ff3b5c', '#ffd23f'] },
    grapes:     { name: 'Grapes',       price: 5,  colors: ['#8a4bd6', '#c9a6ff'] },
    star:       { name: 'Gold stars',   price: 10, colors: ['#ffd23f', '#ffffff'] },
    // Goods made in buildings. They sit in the barn and sell like fruit.
    juice:      { name: 'Orange juice', price: 10, colors: ['#ff9a1f', '#ffd08a'], kind: 'good' },
    smoothie:   { name: 'Smoothies',    price: 16, colors: ['#ff8fb1', '#fff0f4'], kind: 'good' },
    jam:        { name: 'Jam jars',     price: 18, colors: ['#e8323f', '#fffaf0'], kind: 'good' },
    // Crops grown in fields.
    hay:        { name: 'Hay',          price: 2,  colors: ['#e8c25a', '#fff3a8'], kind: 'crop' },
    corn:       { name: 'Corn',         price: 2,  colors: ['#ffd23f', '#5cc24a'], kind: 'crop' },
    // Goods from farm animals.
    egg:        { name: 'Eggs',         price: 8,  colors: ['#fff6e0', '#f2d9a8'], kind: 'good' },
    milk:       { name: 'Milk',         price: 12, colors: ['#ffffff', '#4aa3e8'], kind: 'good' },
    // Second-step goods, made from other goods.
    popcorn:    { name: 'Popcorn',      price: 10, colors: ['#fff6d8', '#e8323f'], kind: 'good' },
    salad:      { name: 'Fruit salads', price: 26, colors: ['#5cc24a', '#ff3b5c'], kind: 'good' },
    pie:        { name: 'Apple pies',   price: 36, colors: ['#e8a85a', '#e8322f'], kind: 'good' },
    shake:      { name: 'Milkshakes',   price: 40, colors: ['#ff8fb1', '#ffffff'], kind: 'good' },
    pancakes:   { name: 'Pancakes',     price: 55, colors: ['#e8b06a', '#e8323f'], kind: 'good' }
  },
  // Fields open at farm `level`, with `start` plots; each extra plot costs the next price in plotCosts.
  // days: how many days a crop takes. yield: how many you pick from one plot.
  fields: { level: 8, start: 4, max: 12, plotCosts: [80, 120, 160, 200, 260, 320, 400, 500], crops: { hay: { days: 1, yield: 3 }, corn: { days: 2, yield: 3 } } },
  // Farm points for each good you collect from a building.
  goodsPoints: 2,
  // Production buildings. needs: trees, buildings or fields you must have first. deliver: items you hand
  // over to build it. recipes: what goes in and what comes out. slots: how many it makes at once at each
  // level, and upgrade: what each next level costs. area: where it stands on the village map.
  buildings: [
    { id: 'juice',    name: 'Juice press',    area: 'kitchen', cost: 150, needs: { trees: ['orange'] }, recipes: [{ in: { orange: 3 }, out: 'juice' }], slots: [2, 3, 4], upgrade: [200, 500] },
    { id: 'smoothie', name: 'Smoothie stand', area: 'kitchen', cost: 250, needs: { trees: ['banana', 'strawberry'] }, deliver: { banana: 10 }, recipes: [{ in: { banana: 2, strawberry: 1 }, out: 'smoothie' }], slots: [2, 3, 4], upgrade: [250, 600] },
    { id: 'jam',      name: 'Jam kitchen',    area: 'kitchen', cost: 300, needs: { trees: ['strawberry'] }, recipes: [{ in: { strawberry: 3 }, out: 'jam' }], slots: [2, 3, 4], upgrade: [300, 700] },
    { id: 'popcorn',  name: 'Popcorn cart',   area: 'kitchen', cost: 350, needs: { fields: true }, recipes: [{ in: { corn: 3 }, out: 'popcorn' }], slots: [2, 3, 4], upgrade: [300, 700] },
    { id: 'salad',    name: 'Salad bar',      area: 'kitchen', cost: 500, needs: { trees: ['apple', 'orange', 'banana', 'strawberry', 'grapes'] }, recipes: [{ in: { apple: 1, orange: 1, banana: 1, strawberry: 1, grapes: 1 }, out: 'salad' }], slots: [2, 3, 4], upgrade: [400, 900] },
    { id: 'bakery',   name: 'Bakery',         area: 'kitchen', cost: 900, needs: { buildings: ['coop', 'cows'] }, deliver: { egg: 5 }, recipes: [{ in: { apple: 3, egg: 1, milk: 1 }, out: 'pie' }], slots: [2, 3, 4], upgrade: [600, 1200] },
    { id: 'diner',    name: 'Diner',          area: 'kitchen', cost: 1500, needs: { buildings: ['bakery', 'jam'] }, deliver: { pie: 3 }, recipes: [{ in: { milk: 1, smoothie: 1 }, out: 'shake' }, { in: { egg: 1, milk: 1, jam: 1 }, out: 'pancakes' }], slots: [2, 3, 4], upgrade: [800, 1600] },
    // Farm animals live in the barnyard. More slots means more animals.
    { id: 'coop',     name: 'Chicken coop',   area: 'barnyard', cost: 400, needs: { fields: true }, recipes: [{ in: { corn: 2 }, out: 'egg' }], slots: [2, 3, 4], upgrade: [300, 700] },
    { id: 'cows',     name: 'Cow barn',       area: 'barnyard', cost: 600, needs: { fields: true }, recipes: [{ in: { hay: 3 }, out: 'milk' }], slots: [2, 3, 4], upgrade: [400, 900] }
  ],

  // Harvest speed picked on the title screen.
  // fall: screen-heights per second. gap: seconds between fruit (before a little randomness).
  // shakeEvery: seconds between tree shakes. shakeSize: how many fruit drop in a shake.
  speeds: {
    edge: 0.09,   // fruit falls at least this far in from each side, as a fraction of screen width
    slow:   { fall: 0.16, gap: 1.2,  shakeEvery: 10, shakeSize: 3 },
    medium: { fall: 0.23, gap: 0.9,  shakeEvery: 9,  shakeSize: 4 },
    fast:   { fall: 0.31, gap: 0.7,  shakeEvery: 8,  shakeSize: 5 }
  },
  // How much of the fruit in a grove round is the grove's own. The rest comes from nearby trees.
  groveMix: 0.7,
  // The order board. Orders pay payBonus times what the items sell for, plus base, and give farm points per item.
  orders: { count: 3, payBonus: 1.4, base: 5, pointsPerItem: 2 },
  // Filters: sold in bundles, priced per fruit.
  filters: { bundle: 3, cost: { apple: 6, orange: 8, banana: 10, strawberry: 12, grapes: 15 } },

  // How the basket feels when you hold the arrows. Speeds are fractions of screen width per second.
  movement: {
    tapSpeed: 0.30,     // speed the moment you press, so short taps stay slow and precise
    topSpeed: 1.00,     // full "zip" speed
    rampDelay: 0.10,    // seconds of holding before it starts speeding up
    rampSeconds: 0.42,  // seconds to go from tap speed to full zip
    grip: 16,           // how quickly the basket matches the target speed
    brake: 18,          // how quickly it stops when you let go
    wheels: { top: 0.22, tap: 0.03, ramp: -0.07 }  // added for each Zippy wheels level
  },

  // Gold star chance for each fruit: base + perLevel × Lucky stars level.
  stars: { base: 0.04, perLevel: 0.05 },

  // Your basket grows a tier every farm level. Each look covers the levels from `from` onward: it
  // holds `start` at its first tier and `step` more each tier after. The last look never stops.
  // look picks the drawing in farm.js. Every look catches the same width.
  basketLooks: [
    { look: 'hands',  name: 'Your hands',    full: 'Hands full!',       from: 1,  tiers: 4,        start: 2,   step: 1 },
    { look: 'basket', name: 'Little basket', full: 'Basket full!',      from: 5,  tiers: 10,       start: 6,   step: 1 },
    { look: 'handle', name: 'Big basket',    full: 'Basket full!',      from: 15, tiers: 15,       start: 17,  step: 1 },
    { look: 'barrow', name: 'Wheelbarrow',   full: 'Wheelbarrow full!', from: 30, tiers: 20,       start: 34,  step: 1.5 },
    { look: 'cart',   name: 'Fruit cart',    full: 'Cart full!',        from: 50, tiers: 25,       start: 66,  step: 2 },
    { look: 'wagon',  name: 'Wagon',         full: 'Wagon full!',       from: 75, tiers: Infinity, start: 118, step: 2 }
  ],

  // Farm points and levels. Points to reach the next level = 2 x what you can carry x (1 + level / levelPace),
  // so early levels take about one trip and later ones about three. Bigger levelPace = faster levels.
  levels: { pointsPerCatch: 1, pointsPerSale: 1, levelPace: 12 },

  // How much the barn holds, and what each bigger barn costs.
  barn: { sizes: [100, 200, 400, 800, Infinity], costs: [150, 400, 1000, 2500] },

  // Orchard trees, each one a grove. The apple tree is free. spot = where it stands (0 = left edge, 1 = right edge).
  // A grove holds `holds` fruit plus `perLevel` for each farm level, and refills over `refill` days.
  // shape picks the drawing in scenery.js: round, palm, bush or vine.
  trees: [
    { type: 'apple',      name: 'Apple tree',       cost: 0,   spot: 0.30, shape: 'round', holds: 10, perLevel: 2, refill: 1 },
    { type: 'orange',     name: 'Orange tree',      cost: 15,  spot: 0.70, shape: 'round', holds: 10, perLevel: 2, refill: 1 },
    { type: 'banana',     name: 'Banana tree',      cost: 35,  spot: 0.10, shape: 'palm', holds: 10, perLevel: 1.5, refill: 1 },
    { type: 'strawberry', name: 'Strawberry patch', cost: 70,  spot: 0.50, shape: 'bush', holds: 10, perLevel: 1.5, refill: 2 },
    { type: 'grapes',     name: 'Grape vine',       cost: 140, spot: 0.90, shape: 'vine', holds: 10, perLevel: 1, refill: 2 }
  ],

  // Upgrades with one price per level. The ids are used by the game: speed, luck.
  upgrades: [
    { id: 'speed',  icon: 'speed',  name: 'Zippy wheels', desc: 'Zip across the orchard faster and smoother.', costs: [20, 60, 190] },
    { id: 'luck',   icon: 'luck',   name: 'Lucky stars',  desc: 'More gold stars fall. Stars sell for 10!',   costs: [40, 160] }
  ],

  // Basket colors. body = main color, rim = top band, weave = the woven lines.
  skins: [
    { id: 'wicker',  name: 'Wicker',  cost: 0,   body: '#cf8f4e', rim: '#a8692c', weave: '#a8692c' },
    { id: 'berry',   name: 'Berry',   cost: 20,  body: '#ff7a9c', rim: '#d6456b', weave: '#e0577c' },
    { id: 'ocean',   name: 'Ocean',   cost: 20,  body: '#5bb4f0', rim: '#2f86c6', weave: '#3a93d2' },
    { id: 'mint',    name: 'Mint',    cost: 30,  body: '#6fd39b', rim: '#3fa56c', weave: '#4cb67b' },
    { id: 'gold',    name: 'Gold',    cost: 120, body: '#ffd23f', rim: '#d9a400', weave: '#e8b800' },
    { id: 'comet', name: 'Comet', cost: 1e9, reward: true, body: '#3a3a78', rim: '#ffd23f', weave: '#6a6ac0' },
    { id: 'goofy', name: 'Goofy', cost: 1e9, reward: true, body: '#ffffff', rim: '#ff5e7a', weave: '#d0c8e8' },
    { id: 'chef',  name: 'Chef',  cost: 1e9, reward: true, body: '#fffaf0', rim: '#e8323f', weave: '#f2b8b8' },
    { id: 'rainbow', name: 'Rainbow', cost: 330, body: '#ff9a1f', rim: '#8a4bd6', weave: 'rgba(255,255,255,0.5)', rainbow: true },
    { id: 'lemon',   name: 'Lemon',   cost: 40,  body: '#fff06a', rim: '#e0c400', weave: '#e8d13a' },
    { id: 'peach',   name: 'Peach',   cost: 40,  body: '#ffb38a', rim: '#e8855a', weave: '#f09a70' },
    { id: 'grape',   name: 'Grape',   cost: 60,  body: '#a77de0', rim: '#7448b8', weave: '#8a5fcc' },
    { id: 'lime',    name: 'Lime',    cost: 60,  body: '#b8e65a', rim: '#7fb52e', weave: '#9acc44' },
    { id: 'cocoa',   name: 'Cocoa',   cost: 80,  body: '#9a6a48', rim: '#6a4228', weave: '#7e5234' },
    { id: 'cherry',  name: 'Cherry',  cost: 100, body: '#e8323f', rim: '#a8141f', weave: '#c4222e' },
    { id: 'cloud',   name: 'Cloud',   cost: 150, body: '#f4f8ff', rim: '#a8bcd8', weave: '#c8d6ea' },
    { id: 'night',   name: 'Midnight', cost: 200, body: '#2f3a78', rim: '#ffd23f', weave: '#4a56a0' }
  ],
  // Hats your best friends wear (friends with enough hearts). Pick one in the shop.
  hats: [
    { id: 'party',  name: 'Party hat',    cost: 0 },
    { id: 'flower', name: 'Flower crown', cost: 60 },
    { id: 'bow',    name: 'Big bow',      cost: 80 },
    { id: 'top',    name: 'Top hat',      cost: 120 },
    { id: 'cowboy', name: 'Cowboy hat',   cost: 150 },
    { id: 'chef',   name: 'Chef hat',     cost: 200 }
  ],
  // Rewards you can't buy. Best friends each add one more below.
  rainbow: ['#ff4d4d', '#ff9a1f', '#ffd93b', '#5cc24a', '#4aa3e8', '#8a4bd6'],

  // Scenery changes everything around you: sky, hills, tree leaves and trunks, the ground,
  // the market's awnings and plaza, and the weather.
  //   ground.bits: little details on the grass (flowers, tufts, leaves, sparkle, sprinkles, mushrooms)
  //   ambient: floating weather (butterflies, birds, leaves, snow, sparkles, fireflies)
  //   trunk: a color, or 'candy' for candy-cane stripes
  scenes: [
    { id: 'sunny', name: 'Sunny day', cost: 0,
      sky: ['#6ec2f5', '#dcf2ff'], sun: '#ffd23f', cloud: 'rgba(255,255,255,0.92)',
      hills: ['#9bdc7c', '#86cf68'],
      ground: { top: '#67bf45', edge: '#57ab38', deep: '#489a2f', bits: 'flowers' },
      foliage: ['#4fae3a', '#6cc957', '#3f9530'], trunk: '#8a5a32',
      plaza: ['#e8d8b8', '#c9b48c'], awnings: ['#ff6b6b', '#4aa3e8', '#ffb02e', '#5cc24a'],
      ambient: 'butterflies' },
    { id: 'fest', name: 'Fruit Fest', cost: 1e9, reward: true,
      sky: ['#ffb7c5', '#fff0d6'], sun: '#ffd23f', cloud: 'rgba(255,255,255,0.95)',
      hills: ['#ffc98f', '#f5ad7a'],
      ground: { top: '#8fd06a', edge: '#7ac058', deep: '#62a848', bits: 'flowers' },
      foliage: ['#ff8fb1', '#ffc0d4', '#e86d94'], trunk: '#8a5a32',
      plaza: ['#fff0d0', '#f5d6a8'], awnings: ['#ff5e7a', '#ffd23f', '#4aa3e8', '#5cc24a'],
      ambient: 'butterflies' },
    { id: 'gold', name: 'Golden Hour', cost: 1e9, reward: true,
      sky: ['#ffb84d', '#ffeeb0'], sun: '#fff0a0', cloud: 'rgba(255,244,214,0.92)',
      hills: ['#e0b04a', '#cf9a38'],
      ground: { top: '#a8bf4a', edge: '#94ab3e', deep: '#7c9230', bits: 'sparkle' },
      foliage: ['#d9a52c', '#f0c84a', '#b88a20'], trunk: '#7a4c2a',
      plaza: ['#f5e3b0', '#dcc081'], awnings: ['#ffb02e', '#e8743a', '#d9a400', '#c86bd6'],
      ambient: 'sparkles' },
    { id: 'sunset', name: 'Sunset', cost: 40,
      sky: ['#ff7f6b', '#ffd9a0'], sun: '#ff5e3a', cloud: 'rgba(255,232,214,0.9)',
      hills: ['#d9a35e', '#c98e4c'],
      ground: { top: '#7fb446', edge: '#9cc24e', deep: '#5b8e30', bits: 'tufts' },
      foliage: ['#5c9a3a', '#8cc255', '#4a8030'], trunk: '#7a4c2a',
      plaza: ['#f0cfae', '#d4a57c'], awnings: ['#ff7a59', '#ffb02e', '#c86bd6', '#ff5e7a'],
      ambient: 'birds' },
    { id: 'autumn', name: 'Autumn', cost: 60,
      sky: ['#8fc3e8', '#f3e6cf'], sun: '#ffc23f', cloud: 'rgba(255,255,255,0.9)',
      hills: ['#e08a3c', '#cf7430'],
      ground: { top: '#b9a04a', edge: '#9e8638', deep: '#8a6e2c', bits: 'leaves' },
      foliage: ['#e0782c', '#f4a540', '#c4521f'], trunk: '#6e4224',
      plaza: ['#e2cfae', '#bf9e6e'], awnings: ['#d9542b', '#e8a33a', '#8a5a32', '#c43c3c'],
      ambient: 'leaves' },
    { id: 'candy', name: 'Candy land', cost: 90,
      sky: ['#ff9ad5', '#ffe3f4'], sun: '#fff07a', cloud: 'rgba(255,255,255,0.95)',
      hills: ['#ffd1ec', '#ffbfe4'],
      ground: { top: '#7de3c3', edge: '#a8f0d9', deep: '#4cc4a0', bits: 'sprinkles' },
      foliage: ['#ff8fc8', '#ffbde0', '#e86aa8'], trunk: 'candy',
      plaza: ['#ffe9c9', '#ffc4dd'], awnings: ['#ff8fc8', '#7de3c3', '#c9a6ff', '#ffd23f'],
      ambient: 'sparkles' },
    { id: 'snow', name: 'Snowy day', cost: 100,
      sky: ['#9fcff0', '#eef7ff'], sun: '#ffe38a', cloud: 'rgba(255,255,255,0.95)',
      hills: ['#ffffff', '#e3eef9'],
      ground: { top: '#f4f8ff', edge: '#ffffff', deep: '#d3e2f2', bits: 'sparkle' },
      foliage: ['#2f7d5a', '#45996f', '#24654a'], trunk: '#6b4a32', snowCap: true,
      plaza: ['#e9eef6', '#c8d4e6'], awnings: ['#d94848', '#3f8f5a', '#4a7fd0', '#d94848'],
      ambient: 'snow' },
    { id: 'night', name: 'Starry night', cost: 120,
      sky: ['#1d1b4a', '#5a4fa0'], sun: '#fff6c8', moon: true, cloud: 'rgba(210,210,255,0.22)',
      hills: ['#3e6a5c', '#33594d'],
      ground: { top: '#2f7a4a', edge: '#3c8c58', deep: '#1f5a36', bits: 'mushrooms' },
      foliage: ['#2b6a40', '#3d8a55', '#1f5232'], trunk: '#5a3d26',
      plaza: ['#8e86a8', '#6e6690'], awnings: ['#4a3f8a', '#2f6a8a', '#6a3f8a', '#2f8a6a'], lights: true,
      ambient: 'fireflies' },
    { id: 'blossom', name: 'Cherry blossom', cost: 70,
      sky: ['#a8dcff', '#fff4fa'], sun: '#ffe07a', cloud: 'rgba(255,255,255,0.95)',
      hills: ['#b8e6a0', '#a2d98a'],
      ground: { top: '#86d066', edge: '#9cdc7c', deep: '#6cb84e', bits: 'flowers' },
      foliage: ['#ffb6d0', '#ffd6e6', '#f48fb5'], trunk: '#6e4a3a',
      plaza: ['#f6e6dc', '#e2c4b4'], awnings: ['#ff8fb1', '#ffffff', '#9ad0ff', '#ffb6d0'],
      ambient: 'butterflies' },
    { id: 'beach', name: 'Sunny beach', cost: 80,
      sky: ['#3fb8f0', '#c8f0ff'], sun: '#ffd23f', cloud: 'rgba(255,255,255,0.95)',
      hills: ['#5ad0d8', '#3fbcc6'],
      ground: { top: '#f2d99a', edge: '#ffe8b8', deep: '#e0c27e', bits: 'tufts' },
      foliage: ['#3fae5a', '#5cc874', '#2f9248'], trunk: '#a8784a',
      plaza: ['#fff3d6', '#ecd3a0'], awnings: ['#ff6b6b', '#3fb8f0', '#ffd23f', '#ff9a1f'],
      ambient: 'birds' },
    { id: 'lavender', name: 'Lavender fields', cost: 110,
      sky: ['#b9a8f0', '#f4ecff'], sun: '#fff0a8', cloud: 'rgba(255,255,255,0.9)',
      hills: ['#a68ae0', '#9278d0'],
      ground: { top: '#7cb85a', edge: '#94c870', deep: '#5e9a42', bits: 'flowers' },
      foliage: ['#9c7cd8', '#b89ae8', '#7c5cc0'], trunk: '#6a4a3a',
      plaza: ['#ece4f6', '#cbbde4'], awnings: ['#9c7cd8', '#ffd23f', '#ff8fb1', '#7cb85a'],
      ambient: 'butterflies' },
    { id: 'jungle', name: 'Jungle', cost: 140,
      sky: ['#5cc8b8', '#e0fff4'], sun: '#ffe066', cloud: 'rgba(255,255,255,0.85)',
      hills: ['#2f8a5a', '#267a4e'],
      ground: { top: '#3f9a42', edge: '#52ae54', deep: '#2c7a32', bits: 'tufts' },
      foliage: ['#1f7a3a', '#2f9a4a', '#16602c'], trunk: '#5a3a22',
      plaza: ['#dccfa8', '#b8a478'], awnings: ['#ff9a1f', '#e8323f', '#ffd23f', '#2f9a4a'],
      ambient: 'birds' }
  ],

  // Family leaderboards and save codes. Empty url and key turn them off. This key is the public one, safe to ship.
  board: { url: 'https://wurecjpetnooddiftoao.supabase.co', key: 'sb_publishable_8dFdsxOWlMA9UnlbzH9YbA_pBhpsjuk' },
  // Farm names are built from these lists only. They must match valid_farm_name in supabase/schema.sql.
  boardWords: {
    first: ['Sunny', 'Happy', 'Silly', 'Jolly', 'Lucky', 'Golden', 'Bouncy', 'Sleepy', 'Rainbow', 'Sparkly', 'Cozy', 'Giggly', 'Mighty', 'Tiny', 'Windy', 'Starry'],
    second: ['Pig', 'Bunny', 'Bear', 'Frog', 'Cat', 'Duck', 'Apple', 'Berry', 'Banana', 'Grape', 'Orange', 'Barrel', 'Basket', 'Sprout', 'Acorn', 'Clover']
  },

  // Farm Score ranks. score = coins earned across all farms. Reaching the last one plays the parade.
  ranks: [
    { name: 'Sprout', score: 0 },
    { name: 'Grower', score: 250 },
    { name: 'Farmer', score: 1000 },
    { name: 'Master Farmer', score: 5000 },
    { name: 'Fruit Legend', score: 100000 }
  ],

  // The silly animals who shop at the market. New kinds also need drawing in animals.js.
  // How fast new friends show up. The six starter animals are there from the beginning. The rest
  // arrive in the order listed below: the first once you've earned firstAt hearts in total, then
  // one more every `every` hearts. Smaller numbers bring friends sooner.
  newFriends: { firstAt: 3, every: 3 },

  animals: {
    bunny:    { name: 'Bun',       fav: 'strawberry', color: '#f6f0e6', accent: '#ffb3c7', starter: true },
    pig:      { name: 'Sir Oink',  fav: 'apple',      color: '#ffb0c0', accent: '#ff8fa8', starter: true },
    bear:     { name: 'Honey',     fav: 'grapes',     color: '#b9804a', accent: '#e8c79a', starter: true },
    frog:     { name: 'Hopper',    fav: 'orange',     color: '#7ed35f', accent: '#5cb044', starter: true },
    cat:      { name: 'Whiskers',  fav: 'banana',     color: '#ffb65c', accent: '#ffe0b0', starter: true },
    duck:     { name: 'Waddles',   fav: 'apple',      color: '#ffe066', accent: '#ff9a1f', starter: true },
    owl:      { name: 'Hoot',      fav: 'grapes',     color: '#a98565', accent: '#ffb238' },
    fox:      { name: 'Rusty',     fav: 'strawberry', color: '#ff8a3c', accent: '#fff3e0' },
    goat:     { name: 'Nibbles',   fav: 'orange',     color: '#e8e0d0', accent: '#b8a890' },
    sheep:    { name: 'Woolly',    fav: 'banana',     color: '#ffe9d6', accent: '#ffffff' },
    hedgehog: { name: 'Spike',     fav: 'apple',      color: '#f0d2a8', accent: '#7a5230' },
    turtle:   { name: 'Shelly',    fav: 'strawberry', color: '#8fd07a', accent: '#a8692c' },
    // Rare animals are bought with Golden Seeds. They shop at the market but don't take a home.
    // like = which animal's shape to draw.
    goldie:   { name: 'Goldie',    fav: 'banana',     color: '#ffd23f', accent: '#ff9a1f', like: 'bunny', rare: true },
    moon:     { name: 'Moonbeam',  fav: 'grapes',     color: '#b8a8f0', accent: '#8a6fe0', like: 'pig', rare: true }
  },

  // Golden Seeds are earned when you leave a farm: the square root of (coins earned / per), rounded
  // down. Farms played as a challenge pay challengePay times as many.
  seeds: { per: 100, challengePay: 2, tinyCap: 5 },
  challenges: [
    { id: 'apples',   name: 'Apples Only', desc: 'One tree, forever' },
    { id: 'nomagnet', name: 'No Filters',  desc: 'Catch everything yourself' },
    { id: 'tiny',     name: 'Tiny Hands',  desc: 'Carry 5 fruit at most' },
    { id: 'wallrush', name: 'Wall Rush',   desc: 'The Barrel wall from day one' }
  ],
  // Bought with Golden Seeds and kept forever.
  seedShop: [
    { id: 'rare-goldie', name: 'Goldie',      desc: 'A rare golden bunny comes to market.', cost: 5, animal: 'goldie' },
    { id: 'rare-moon',   name: 'Moonbeam',    desc: 'A rare moonlit pig comes to market.',  cost: 5, animal: 'moon' },
    { id: 'scene-gold',  name: 'Golden Hour', desc: 'Special scenery for every farm.',      cost: 8, scene: 'gold' },
    { id: 'start-basket', name: 'Head start: basket', desc: 'New farms start with the Little basket.', cost: 6 },
    { id: 'start-tree',   name: 'Head start: tree',   desc: 'New farms start with the Orange tree.',   cost: 10 }
  ],

  // The Sticker Book. stat is the number a sticker watches (see stickers.js), n is the goal,
  // and within means "at this number or lower", such as reaching the wall by a certain day.
  stickerPages: [
    { id: 'shooter', name: 'Sharp Shooter', icon: 'apple', reward: 'gold', stickers: [
      { id: 'shooter1', name: 'First Perfect', stat: 'perfect', n: 1, icon: 'star' },
      { id: 'shooter2', name: '10 Perfect shots', stat: 'perfect', n: 10, icon: 'star' },
      { id: 'shooter3', name: '50 Perfect shots', stat: 'perfect', n: 50, icon: 'star' },
      { id: 'shooter4', name: '200 Perfect shots', stat: 'perfect', n: 200, icon: 'star' },
      { id: 'shooter5', name: 'Streak of 5', stat: 'bestStreak', n: 5, icon: 'orange' },
      { id: 'shooter6', name: 'Streak of 10', stat: 'bestStreak', n: 10, icon: 'orange' },
      { id: 'shooter7', name: 'Streak of 20', stat: 'bestStreak', n: 20, icon: 'orange' },
      { id: 'shooter8', name: 'A Lucky shot', stat: 'lucky', n: 1, icon: 'grapes' },
      { id: 'shooter9', name: '10 Lucky shots', stat: 'lucky', n: 10, icon: 'grapes' },
      { id: 'shooter10', name: '50 Lucky shots', stat: 'lucky', n: 50, icon: 'grapes' }
    ] },
    { id: 'boss', name: 'Fruit Boss', icon: 'banana', reward: 'fest', stickers: [
      { id: 'boss1', name: '100 apples sold', stat: 'soldApple', n: 100, icon: 'apple' },
      { id: 'boss2', name: '100 oranges sold', stat: 'soldOrange', n: 100, icon: 'orange' },
      { id: 'boss3', name: '100 bananas sold', stat: 'soldBanana', n: 100, icon: 'banana' },
      { id: 'boss4', name: '100 strawberries sold', stat: 'soldStrawberry', n: 100, icon: 'strawberry' },
      { id: 'boss5', name: '100 grapes sold', stat: 'soldGrapes', n: 100, icon: 'grapes' },
      { id: 'boss6', name: '10 gold stars sold', stat: 'soldStar', n: 10, icon: 'star' },
      { id: 'boss7', name: '50 goods sold', stat: 'soldGoods', n: 50, icon: 'juice' },
      { id: 'boss8', name: 'One fruit for a day', stat: 'oneFruitDay', n: 1, icon: 'grapes' },
      { id: 'boss9', name: '500 fruit sold', stat: 'sold', n: 500, icon: 'apple' },
      { id: 'boss10', name: '2,000 fruit sold', stat: 'sold', n: 2000, icon: 'banana' }
    ] },
    { id: 'friends', name: 'Best Friends', icon: 'bunny', reward: 'party', stickers: [
      { id: 'friends1', name: '5 hearts', stat: 'hearts', n: 5, icon: 'bunny' },
      { id: 'friends2', name: '20 hearts', stat: 'hearts', n: 20, icon: 'pig' },
      { id: 'friends3', name: '40 hearts', stat: 'hearts', n: 40, icon: 'bear' },
      { id: 'friends4', name: 'First home', stat: 'homes', n: 1, icon: 'frog' },
      { id: 'friends5', name: '5 homes', stat: 'homes', n: 5, icon: 'cat' },
      { id: 'friends6', name: '12 homes', stat: 'homes', n: 12, icon: 'duck' },
      { id: 'friends7', name: 'First best friend', stat: 'bestFriends', n: 1, icon: 'owl' },
      { id: 'friends8', name: '3 best friends', stat: 'bestFriends', n: 3, icon: 'fox' },
      { id: 'friends9', name: 'Met everyone', stat: 'met', n: 12, icon: 'goat' },
      { id: 'friends10', name: '8 decorations', stat: 'decor', n: 8, icon: 'sheep' }
    ] },
    { id: 'speedy', name: 'Speedy Farmer', icon: 'orange', reward: 'comet', stickers: [
      { id: 'speedy1', name: 'Wall by Day 30', stat: 'wallDay', within: 30, icon: 'orange' },
      { id: 'speedy2', name: 'Wall by Day 15', stat: 'wallDay', within: 15, icon: 'orange' },
      { id: 'speedy3', name: 'Reach level 20', stat: 'level', n: 20, icon: 'banana' },
      { id: 'speedy4', name: 'All five trees', stat: 'kinds', n: 5, icon: 'grapes' },
      { id: 'speedy5', name: '100 coins in a day', stat: 'bestDay', n: 100, icon: 'star' },
      { id: 'speedy6', name: '300 coins in a day', stat: 'bestDay', n: 300, icon: 'star' },
      { id: 'speedy7', name: '600 coins in a day', stat: 'bestDay', n: 600, icon: 'star' },
      { id: 'speedy8', name: 'Reach Day 50', stat: 'farmDay', n: 50, icon: 'apple' },
      { id: 'speedy9', name: 'Reach Day 150', stat: 'farmDay', n: 150, icon: 'apple' },
      { id: 'speedy10', name: 'Fruit Legend', stat: 'lifetime', n: 100000, icon: 'star' }
    ] },
    { id: 'family', name: 'Family', icon: 'pig', reward: 'crown', stickers: [
      { id: 'family1', name: 'Join a family', stat: 'joined', n: 1, icon: 'pig' },
      { id: 'family2', name: 'Get a save code', stat: 'saved', n: 1, icon: 'bear' },
      { id: 'family3', name: 'First crown', stat: 'crowns', n: 1, icon: 'star' },
      { id: 'family4', name: '3 crowns', stat: 'crowns', n: 3, icon: 'star' },
      { id: 'family5', name: '10 crowns', stat: 'crowns', n: 10, icon: 'star' },
      { id: 'family6', name: 'First ribbon', stat: 'ribbons', n: 1, icon: 'strawberry' },
      { id: 'family7', name: '3 ribbons', stat: 'ribbons', n: 3, icon: 'strawberry' },
      { id: 'family8', name: '5 ribbons', stat: 'ribbons', n: 5, icon: 'strawberry' },
      { id: 'family9', name: '10 ribbons', stat: 'ribbons', n: 10, icon: 'strawberry' },
      { id: 'family10', name: 'Play on 30 days', stat: 'playDays', n: 30, icon: 'bunny' }
    ] },
    { id: 'silly', name: 'Silly', icon: 'frog', reward: 'goofy', stickers: [
      { id: 'silly1', name: 'Wrong fruit!', stat: 'wrong', n: 1, icon: 'frog' },
      { id: 'silly2', name: '10 wrong fruit', stat: 'wrong', n: 10, icon: 'duck' },
      { id: 'silly3', name: '50 wrong fruit', stat: 'wrong', n: 50, icon: 'goat' },
      { id: 'silly4', name: '3 wrong at one animal', stat: 'sameWrong', n: 1, icon: 'pig' },
      { id: 'silly5', name: '10 misses', stat: 'miss', n: 10, icon: 'hedgehog' },
      { id: 'silly6', name: '50 misses', stat: 'miss', n: 50, icon: 'turtle' },
      { id: 'silly7', name: '25 fruit swaps', stat: 'swaps', n: 25, icon: 'cat' },
      { id: 'silly8', name: '100 fruit swaps', stat: 'swaps', n: 100, icon: 'sheep' },
      { id: 'silly9', name: 'Start a second farm', stat: 'farms', n: 2, icon: 'bunny' },
      { id: 'silly10', name: 'Start a fourth farm', stat: 'farms', n: 4, icon: 'fox' }
    ] },
    { id: 'maker', name: 'Maker', icon: 'pancakes', reward: 'chef', stickers: [
      { id: 'maker1', name: 'First building', stat: 'built', n: 1, icon: 'juice' },
      { id: 'maker2', name: '5 buildings', stat: 'built', n: 5, icon: 'smoothie' },
      { id: 'maker3', name: '11 buildings', stat: 'built', n: 11, icon: 'jam' },
      { id: 'maker4', name: 'First crop picked', stat: 'crops', n: 1, icon: 'corn' },
      { id: 'maker5', name: '200 crops picked', stat: 'crops', n: 200, icon: 'hay' },
      { id: 'maker6', name: 'First goods made', stat: 'made', n: 1, icon: 'egg' },
      { id: 'maker7', name: '100 goods made', stat: 'made', n: 100, icon: 'milk' },
      { id: 'maker8', name: 'First pancakes', stat: 'madePancakes', n: 1, icon: 'pancakes' },
      { id: 'maker9', name: 'First order', stat: 'orders', n: 1, icon: 'pie' },
      { id: 'maker10', name: '50 orders', stat: 'orders', n: 50, icon: 'shake' }
    ] }
  ],
  stickerRewards: {
    gold: { name: 'Gold slingshot' },
    fest: { name: 'Fruit Fest scenery', scene: 'fest' },
    party: { name: 'Party village' },
    comet: { name: 'Comet basket', skin: 'comet' },
    crown: { name: 'Crown hats' },
    goofy: { name: 'Goofy basket', skin: 'goofy' },
    chef: { name: 'Chef basket', skin: 'chef' }
  },

  // Fruit sold to reach each heart. A favorite fruit counts this many times.
  friendship: { hearts: [10, 30, 60, 100, 150], favoriteCounts: 2, favoriteAt: 2, homeAt: 3, hatAt: 4 },
  // Cost of each home, in the order you build them.
  homeCosts: [100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800],
  // The village map, in world units 700 tall. Areas run left to right; w is each area's width.
  // homes: x of each friend's lot in the Friends area. square: x of the village square there.
  // soon: wooden signs for buildings that arrive in later steps.
  map: {
    areas: [
      { id: 'groves',   name: 'Groves',   w: 900 },
      { id: 'friends',  name: 'Friends',  w: 1560 },
      { id: 'kitchen',  name: 'Kitchen',  w: 1600 },
      { id: 'barnyard', name: 'Barnyard', w: 1220 },
      { id: 'fields',   name: 'Fields',   w: 1500 }
    ],
    homes: [90, 210, 330, 450, 570, 690, 870, 990, 1110, 1230, 1350, 1470],
    square: 780
  },
  // Village decorations. x and y place them in the Friends area of the map.
  decorations: [
    { id: 'flowers',  name: 'Flowers',  cost: 50,  x: 150, y: 650 },
    { id: 'fence',    name: 'Fence',    cost: 80,  x: 0,   y: 410 },
    { id: 'bench',    name: 'Bench',    cost: 100, x: 650, y: 660 },
    { id: 'lamp',     name: 'Lamps',    cost: 120, x: 690, y: 560 },
    { id: 'well',     name: 'Well',     cost: 150, x: 780, y: 470 },
    { id: 'pond',     name: 'Pond',     cost: 200, x: 960, y: 660 },
    { id: 'windmill', name: 'Windmill', cost: 400, x: 1300, y: 300 },
    { id: 'fountain', name: 'Fountain', cost: 500, x: 780, y: 560 }
  ],

  // The market has two layouts. Rows are listed back to front.
  //   rowBonus: extra coins per fruit on each row (back rows are harder, so they pay more)
  //   maxAsk: most fruit one animal asks for, by row
  //   mixChance: chance a row bonus is nudged up or down by 1, so it's not always the same
  market: {
    friends: { rowBonus: [1, 0], maxAsk: [3, 2], mixChance: 0 },
    wall:    { rowBonus: [2, 1, 0], maxAsk: [4, 3, 2], mixChance: 0.25 },
    newFriendLevel: 10,   // farm level that brings the third animal
    // The Barrel wall appears in the shop from the start. Reach all three goals, then buy it.
    wallUnlock: { level: 15, fruitKinds: 3, filled: 10, cost: 150 },  // goals to unlock the Barrel wall
    anyChance: 0.15,      // chance an animal takes any fruit (1 coin plus the row bonus)
    tipPerFruit: 1,       // bonus when a basket or barrel is filled, per fruit it held
    perfectBonus: 1,      // extra coins for a center shot
    streakEvery: 3,       // every this many hits in a row adds 1 coin per fruit...
    streakBonusMax: 1,    // ...up to this many (keep these small: the sparkle is the reward)
    aim: {
      pull: 0.24, pullMin: 92, pullMax: 170,  // full pull, as a fraction of the screen's short side, in pixels
      edgeRoom: 60,       // pixels left between a full pull and the bottom of the screen
      reachX: 0.62,       // how far sideways a full pull reaches, as a fraction of screen width
      snap: 1.3,          // how close to an opening (in opening sizes) a shot starts to drift in
      assist: 0.4,        // how much of the way it drifts
      perfect: 0.38,      // closer to the center than this is a Perfect
      rim: 0.74           // farther out than this rattles around the rim
    }
  }
};

// Best friends each give a basket color you can't buy.
Object.entries(FF.data.animals).forEach(([kind, a]) => {
  FF.data.skins.push({ id: 'friend-' + kind, name: a.name, cost: 1e9, reward: true, body: a.color, rim: '#2b2350', weave: a.accent });
});
