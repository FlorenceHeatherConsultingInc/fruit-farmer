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

  // Gold star chance for each fruit: base + perLevel × Lucky stars level.
  stars: { base: 0.04, perLevel: 0.05 },

  // What you carry fruit in, bought in this order. cap = how many fruit it holds.
  // width: fraction of screen width, kept between min and max pixels. look: how it's drawn (farm.js).
  carriers: [
    { id: 'hands',  look: 'hands',  name: 'Your hands',    full: 'Hands full!',       cap: 2,  width: 0.20, min: 84,  max: 130, cost: 0 },
    { id: 'small',  look: 'basket', name: 'Little basket', full: 'Basket full!',      cap: 5,  width: 0.25, min: 108, max: 165, cost: 5 },
    { id: 'big',    look: 'handle', name: 'Big basket',    full: 'Basket full!',      cap: 10, width: 0.30, min: 128, max: 205, cost: 30 },
    { id: 'barrow', look: 'barrow', name: 'Wheelbarrow',   full: 'Wheelbarrow full!', cap: 20, width: 0.34, min: 148, max: 235, cost: 100 },
    { id: 'cart',   look: 'cart',   name: 'Fruit cart',    full: 'Cart full!',        cap: 40, width: 0.39, min: 165, max: 275, cost: 250 }
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
    { id: 'speed',  icon: 'speed',  name: 'Zippy wheels', desc: 'Zip across the orchard faster and smoother.', costs: [20, 60, 140] },
    { id: 'magnet', icon: 'magnet', name: 'Fruit magnet', desc: 'Pulls nearby fruit into what you carry.',    costs: [60, 180] },
    { id: 'luck',   icon: 'luck',   name: 'Lucky stars',  desc: 'More gold stars fall. Stars sell for 10!',   costs: [40, 120] }
  ],

  // Basket colors. body = main color, rim = top band, weave = the woven lines.
  skins: [
    { id: 'wicker',  name: 'Wicker',  cost: 0,   body: '#cf8f4e', rim: '#a8692c', weave: '#a8692c' },
    { id: 'berry',   name: 'Berry',   cost: 20,  body: '#ff7a9c', rim: '#d6456b', weave: '#e0577c' },
    { id: 'ocean',   name: 'Ocean',   cost: 20,  body: '#5bb4f0', rim: '#2f86c6', weave: '#3a93d2' },
    { id: 'mint',    name: 'Mint',    cost: 30,  body: '#6fd39b', rim: '#3fa56c', weave: '#4cb67b' },
    { id: 'gold',    name: 'Gold',    cost: 120, body: '#ffd23f', rim: '#d9a400', weave: '#e8b800' },
    { id: 'rainbow', name: 'Rainbow', cost: 250, body: '#ff9a1f', rim: '#8a4bd6', weave: 'rgba(255,255,255,0.5)', rainbow: true }
  ],
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

  // The silly animals who shop at the market. New kinds also need drawing in animals.js.
  animals: {
    bunny: { color: '#f6f0e6', accent: '#ffb3c7' },
    pig:   { color: '#ffb0c0', accent: '#ff8fa8' },
    bear:  { color: '#b9804a', accent: '#e8c79a' },
    frog:  { color: '#7ed35f', accent: '#5cb044' },
    cat:   { color: '#ffb65c', accent: '#ffe0b0' },
    duck:  { color: '#ffe066', accent: '#ff9a1f' }
  },

  // The market has two layouts. Rows are listed back to front.
  //   rowBonus: extra coins per fruit on each row (back rows are harder, so they pay more)
  //   maxAsk: most fruit one animal asks for, by row
  //   mixChance: chance a row bonus is nudged up or down by 1, so it's not always the same
  market: {
    friends: { rowBonus: [2, 0], maxAsk: [3, 2], mixChance: 0.25 },
    wall:    { rowBonus: [2, 1, 0], maxAsk: [4, 3, 2], mixChance: 0.25 },
    newFriendTier: 2,     // carrier number that brings the third animal (2 = Big basket)
    anyChance: 0.15,      // chance an animal takes any fruit (1 coin plus the row bonus)
    tipPerFruit: 1,       // bonus when a basket or barrel is filled, per fruit it held
    perfectBonus: 2,      // extra coins for a center shot
    streakEvery: 3,       // every this many hits in a row adds 1 coin per fruit...
    streakBonusMax: 3,    // ...up to this many
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
