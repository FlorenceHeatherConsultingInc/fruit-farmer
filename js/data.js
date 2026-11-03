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
    star:       { name: 'Gold stars',   price: 10, colors: ['#ffd23f', '#ffffff'] }
  },

  // Harvest speed picked on the title screen.
  // fall: screen-heights per second. gap: seconds between fruit (before a little randomness).
  speeds: {
    slow:   { fall: 0.16, gap: 1.2 },
    medium: { fall: 0.23, gap: 0.95 },
    fast:   { fall: 0.31, gap: 0.72 }
  },

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

  // Bigger carriers make fruit fall faster, so a full load takes about this many seconds at most.
  harvest: { tripSeconds: 22 },

  // Each game day one fruit pays this many times its price.
  specialPay: 2,

  // Gold star chance for each fruit: base + perLevel × Lucky stars level.
  stars: { base: 0.04, perLevel: 0.05 },

  // What you carry fruit in, bought in this order. cap = how many fruit it holds.
  // width: fraction of screen width, kept between min and max pixels. look: how it's drawn (farm.js).
  carriers: [
    { id: 'hands',  look: 'hands',  name: 'Your hands',    full: 'Hands full!',       cap: 2,  width: 0.20, min: 84,  max: 130, cost: 0 },
    { id: 'small',  look: 'basket', name: 'Little basket', full: 'Basket full!',      cap: 5,  width: 0.25, min: 108, max: 165, cost: 5 },
    { id: 'big',    look: 'handle', name: 'Big basket',    full: 'Basket full!',      cap: 10, width: 0.30, min: 128, max: 205, cost: 30 },
    { id: 'barrow', look: 'barrow', name: 'Wheelbarrow',   full: 'Wheelbarrow full!', cap: 20, width: 0.34, min: 148, max: 235, cost: 100 },
    { id: 'cart',   look: 'cart',   name: 'Fruit cart',    full: 'Cart full!',        cap: 40, width: 0.39, min: 165, max: 275, cost: 330 }
  ],

  // Orchard trees. The apple tree is free. spot = where it stands (0 = left edge, 1 = right edge).
  // shape picks the drawing in scenery.js: round, palm, bush or vine.
  trees: [
    { type: 'apple',      name: 'Apple tree',       cost: 0,   spot: 0.30, shape: 'round' },
    { type: 'orange',     name: 'Orange tree',      cost: 15,  spot: 0.70, shape: 'round' },
    { type: 'banana',     name: 'Banana tree',      cost: 35,  spot: 0.10, shape: 'palm' },
    { type: 'strawberry', name: 'Strawberry patch', cost: 70,  spot: 0.50, shape: 'bush' },
    { type: 'grapes',     name: 'Grape vine',       cost: 140, spot: 0.90, shape: 'vine' }
  ],

  // Upgrades with one price per level. The ids are used by the game: speed, magnet, luck.
  upgrades: [
    { id: 'speed',  icon: 'speed',  name: 'Zippy wheels', desc: 'Zip across the orchard faster and smoother.', costs: [20, 60, 190] },
    { id: 'magnet', icon: 'magnet', name: 'Fruit magnet', desc: 'Pulls nearby fruit into what you carry.',    costs: [60, 240] },
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
    { id: 'rainbow', name: 'Rainbow', cost: 330, body: '#ff9a1f', rim: '#8a4bd6', weave: 'rgba(255,255,255,0.5)', rainbow: true }
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
      ambient: 'fireflies' }
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
    { id: 'nomagnet', name: 'No Magnet',   desc: 'Catch everything yourself' },
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
      { id: 'boss7', name: '25 special fruit sold', stat: 'soldSpecial', n: 25, icon: 'star' },
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
      { id: 'speedy3', name: 'Own the cart', stat: 'tier', n: 4, icon: 'banana' },
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
    ] }
  ],
  stickerRewards: {
    gold: { name: 'Gold slingshot' },
    fest: { name: 'Fruit Fest scenery', scene: 'fest' },
    party: { name: 'Party village' },
    comet: { name: 'Comet basket', skin: 'comet' },
    crown: { name: 'Crown hats' },
    goofy: { name: 'Goofy basket', skin: 'goofy' }
  },

  // Fruit sold to reach each heart. A favorite fruit counts this many times.
  friendship: { hearts: [10, 30, 60, 100, 150], favoriteCounts: 2, favoriteAt: 2, homeAt: 3, hatAt: 4 },
  // Cost of each home, in the order you build them.
  homeCosts: [100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800],
  // Village decorations. x and y are their spots in the village picture (360 by 300).
  decorations: [
    { id: 'flowers',  name: 'Flowers',  cost: 50,  x: 180, y: 293 },
    { id: 'fence',    name: 'Fence',    cost: 80,  x: 0,   y: 118 },
    { id: 'bench',    name: 'Bench',    cost: 100, x: 154, y: 246 },
    { id: 'lamp',     name: 'Lamps',    cost: 120, x: 128, y: 185 },
    { id: 'well',     name: 'Well',     cost: 150, x: 180, y: 162 },
    { id: 'pond',     name: 'Pond',     cost: 200, x: 300, y: 104 },
    { id: 'windmill', name: 'Windmill', cost: 400, x: 90,  y: 80 },
    { id: 'fountain', name: 'Fountain', cost: 500, x: 180, y: 203 }
  ],

  // The market has two layouts. Rows are listed back to front.
  //   rowBonus: extra coins per fruit on each row (back rows are harder, so they pay more)
  //   maxAsk: most fruit one animal asks for, by row
  //   mixChance: chance a row bonus is nudged up or down by 1, so it's not always the same
  market: {
    friends: { rowBonus: [1, 0], maxAsk: [3, 2], mixChance: 0 },
    wall:    { rowBonus: [2, 1, 0], maxAsk: [4, 3, 2], mixChance: 0.25 },
    newFriendTier: 2,     // carrier number that brings the third animal (2 = Big basket)
    // The Barrel wall appears in the shop from the start. Reach all three goals, then buy it.
    wallUnlock: { tier: 3, fruitKinds: 3, filled: 10, cost: 150 },  // tier 3 = Wheelbarrow
    anyChance: 0.15,      // chance an animal takes any fruit (1 coin plus the row bonus)
    tipPerFruit: 1,       // bonus when a basket or barrel is filled, per fruit it held
    perfectBonus: 1,      // extra coins for a center shot
    streakEvery: 3,       // every this many hits in a row adds 1 coin per fruit...
    streakBonusMax: 1,    // ...up to this many (keep these small: the sparkle is the reward)
    aim: {
      pull: 0.24, pullMin: 92, pullMax: 170,  // full pull, as a fraction of the screen's short side, in pixels
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
