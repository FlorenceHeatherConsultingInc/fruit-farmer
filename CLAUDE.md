# Fruit Farmer

A browser game for a 7-year-old. You harvest fruit in an orchard, sell it to silly animals by
slingshotting it into their baskets, and spend coins to grow your farm. Later you unlock a wall
of barrels.

## Run it

Double-click `index.html`. There is no build step, no server, and no packages to install.
It works offline except for the Google Font, which falls back to a system font.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page markup: HUD, arrow pads, overlay cards (title, pause, full, sold, shop). Loads the scripts in order. |
| `css/styles.css` | All interface styling (cards, buttons, HUD). |
| `js/data.js` | **All game content and tuning.** Fruit prices, harvest speeds, movement feel, carriers, trees, upgrades, basket colors, scenes, market rules. Start here for most changes. |
| `js/core.js` | Helpers (`FF.util`), shared state (`FF.G`), saved progress (`FF.save`, `FF.persist`), sound effects (`FF.sfx`). |
| `js/draw.js` | Drawing toolkit (`FF.draw`): outlines, `blob()`, fruit art, small icon canvases. Particle effects (`FF.fx`). |
| `js/scenery.js` | Sky, hills, trees (round, palm, bush, vine), ground details, weather, market stalls and plaza, shop previews. |
| `js/ui.js` | SVG icons (`FF.icons`), overlay helpers (`FF.ui`), HUD updates (`FF.hud`). |
| `js/farm.js` | Harvest mode: carrier movement, the fruit stream and shakes, catching, filters, carrier drawing. |
| `js/buildings.js` | Production buildings (`FF.buildings`): building, making, collecting, upgrading, and the building card. Rows in `buildings` in `data.js`. |
| `js/orders.js` | The order board (`FF.orders`): making orders, delivering, pinning, the harvest counter. Numbers in `orders` in `data.js`. |
| `js/groves.js` | Groves (`FF.groves`): how much each holds, refilling over days, the grove card, and filters. |
| `js/animals.js` | Animal head drawing (`FF.animals`). |
| `js/market-layouts.js` | The two market layouts (`FF.marketLayouts`): animal friends and the barrel wall, including the covered wall and its reveal. Tags and request bubbles. |
| `js/market.js` | Market mode: pull-back aiming, throwing, Perfect and rim shots, requests, selling. |
| `js/shop.js` | Shop overlay, built from the tables in `data.js`. |
| `js/book.js` | The Farm Book (`FF.book`): days, diary, Farm Score, totals by date, new farms. |
| `js/board.js` | Family leaderboards (`FF.board`), the Family tab. Off until `board` in `data.js` has a url and key. |
| `supabase/schema.sql` | The online side of the leaderboards. Its name word lists must match `boardWords` in `data.js`. |
| `js/friends.js` | Hearts and friendship (`FF.friends`). Kept across farms. |
| `js/stickers.js` | The Sticker Book (`FF.stickers`). Stickers and rewards are listed in `data.js`; new counters go through `add()`, `best()` or `first()`. |
| `js/map.js` | The village map (`FF.map`): five areas you drag through, drawn in world units 700 tall. Tap targets are collected while drawing. |
| `js/village.js` | The friends panel the map opens: the full list with decorations, or one friend's card. |
| `js/parade.js` | The Fruit Legend parade, shown once and replayable from the Farm book. |
| `js/main.js` | Screen flow, input routing, resize, and the game loop. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Add to Home Screen and offline play on the hosted site. A new game file must also go in `FILES` in `sw.js`. |

## How the code fits together

- Plain classic `<script>` files that share one global object, `window.FF`. No modules, so it
  runs from `file://` by double-clicking. Keep it that way unless we add a dev server.
- Load order matters and is set in `index.html`: data → core → draw → scenery → ui → farm → groves → orders → buildings →
  animals → friends → stickers → market-layouts → market → shop → board → book → village → parade → map → main.
- Everything draws to one `<canvas>` through `FF.G.ctx`. Sizes come from `FF.G.W` and `FF.G.H`
  (CSS pixels). Each mode has `layout()`, `start()`, `update(dt)`, `draw()` and pointer handlers.
- Progress saves to `localStorage` under `fruitfarmer.save`. `loadSave()` in `core.js` cleans
  old or partial saves; when adding new saved fields, give them a default there.

## Common changes

- **Prices, costs, speeds, how the basket feels:** edit `js/data.js` only.
- **New basket color or scene:** add a row to `skins` or `scenes` in `data.js`. A scene needs
  every field the others have. New `ground.bits` or `ambient` kinds also need a drawer in
  `scenery.js` (`BITS` or `WEATHER`).
- **New good or building:** add the good to `fruits` with `kind: 'good'` and its art to `GOODS` in `draw.js`, then a row to
  `buildings`. Kitchen buildings appear on the map in list order.
- **New fruit:** add it to `fruits` and `trees` in `data.js`, then add its art to `FRUIT_ART`
  in `draw.js`.
- **Basket growth and level pace:** `basketLooks` and `levels` in `data.js`. A new `look` needs drawing code in
  `drawCarrier()` in `farm.js`. Every look catches the same width.
- **Barn size:** `barn` in `data.js`. Fruit caught goes to the barn when a harvest ends (`FF.unloadBasket()`), and only
  sales take it out (`market.js`).
- **Market pay and aim feel:** edit `market` in `data.js`. Each layout has its own `rowBonus`,
  `maxAsk` and `mixChance`. `aim` holds the pull and assist numbers. `wallUnlock` holds the goals
  and price.
- **Seeds and challenges:** `seeds`, `challenges` and `seedShop` in `data.js`. A new challenge also needs its rule added where it applies (see `save.challenge`).
- **The village map:** `map` in `data.js` lists the areas, home lots and coming-soon signs. Decoration spots are in
  `decorations`. A new area needs a drawing function in `map.js`.
- **New animal:** add it to `animals` in `data.js` with a name and favorite, then add its ears and snout in `animals.js`. New animals arrive in list order.
- **How fast new friends arrive:** `newFriends` in `data.js` (`firstAt` and `every`, in total hearts).

## Art rules

- Cartoon sticker style: flat fills, a thick ink outline (`#2b2350`), soft highlights.
- Shapes made of several circles (tree crowns, bushes, clouds) must use `Draw.blob()` or
  `Draw.circlesPath()`. Filling several `arc()`s in one path without `moveTo` cuts
  see-through triangles into the shape.
- Every scene must restyle the foreground too (ground, foliage, trunks, market), not just the sky.

## Design rules for this player (age 7)

- No game over and no losing fruit. Misses roll back or fade away.
- Stream fruit must be reachable (see `reach()` and `spawnFruit()` in `farm.js`). Shakes drop fruit across the whole
  width on purpose, so you can always catch some fruit but not every fruit. Missed fruit stays on the tree.
- In the market, the player must never hold a fruit nobody wants (see `askForLoaded()`), and
  every opening must be reachable by a pull (see `aimRange()`).
- Big touch targets, short words, lots of sound and sparkle feedback.
- Short taps should feel precise; holding should build up to a fast, smooth zip.
- In the market, back rows usually pay more, with some variety.
- Keep Perfect and streak coins small. The sparkle and sound are the reward, not the money.
- No timers, daily rewards that can be lost, limited-time offers, pay-to-skip or random prize boxes.

## Version control

The project uses Git, on this computer only for now. Commit each finished piece of work. The tag
`before-new-market` marks the game before the slingshot rebuild.

## Checking changes

1. Open `index.html` and play one full loop: harvest until full, sell everything, buy something, harvest again. Do this on both market layouts.
2. Try a phone-sized window (about 390×780) as well as desktop.
3. Switch scenes in the shop and check that the farm, both market layouts and the covered wall all change.
4. Watch the browser console for errors.

To reset progress, run `localStorage.removeItem('fruitfarmer.save')` in the browser console.
