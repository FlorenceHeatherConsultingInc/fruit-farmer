# Fruit Farmer

A browser game for a 7-year-old. You harvest fruit in an orchard, sell it at a skee-ball style
market by slingshotting it into barrels, and spend coins to grow your farm.

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
| `js/farm.js` | Harvest mode: carrier movement, fruit spawning, catching, carrier drawing. |
| `js/market.js` | Market mode: barrel wall, tap-tap aiming, pull-back and flick throwing, selling. |
| `js/shop.js` | Shop overlay, built from the tables in `data.js`. |
| `js/main.js` | Screen flow, input routing, resize, and the game loop. |

## How the code fits together

- Plain classic `<script>` files that share one global object, `window.FF`. No modules, so it
  runs from `file://` by double-clicking. Keep it that way unless we add a dev server.
- Load order matters and is set in `index.html`: data → core → draw → scenery → ui → farm →
  market → shop → main.
- Everything draws to one `<canvas>` through `FF.G.ctx`. Sizes come from `FF.G.W` and `FF.G.H`
  (CSS pixels). Each mode has `layout()`, `start()`, `update(dt)`, `draw()` and pointer handlers.
- Progress saves to `localStorage` under `fruitfarmer.save`. `loadSave()` in `core.js` cleans
  old or partial saves; when adding new saved fields, give them a default there.

## Common changes

- **Prices, costs, speeds, how the basket feels:** edit `js/data.js` only.
- **New basket color or scene:** add a row to `skins` or `scenes` in `data.js`. A scene needs
  every field the others have. New `ground.bits` or `ambient` kinds also need a drawer in
  `scenery.js` (`BITS` or `WEATHER`).
- **New fruit:** add it to `fruits` and `trees` in `data.js`, then add its art to `FRUIT_ART`
  in `draw.js`.
- **New carrier:** add a row to `carriers`. A new `look` needs drawing code in `drawCarrier()`
  in `farm.js`.

## Art rules

- Cartoon sticker style: flat fills, a thick ink outline (`#2b2350`), soft highlights.
- Shapes made of several circles (tree crowns, bushes, clouds) must use `Draw.blob()` or
  `Draw.circlesPath()`. Filling several `arc()`s in one path without `moveTo` cuts
  see-through triangles into the shape.
- Every scene must restyle the foreground too (ground, foliage, trunks, market), not just the sky.

## Design rules for this player (age 7)

- No game over and no losing fruit. Misses roll back or fade away.
- Every falling fruit must be reachable (see `reach()` and `spawnFruit()` in `farm.js`).
- Big touch targets, short words, lots of sound and sparkle feedback.
- Short taps should feel precise; holding should build up to a fast, smooth zip.
- In the market, back rows usually pay more, with some variety.

## Checking changes

1. Open `index.html` and play one full loop: harvest until full, sell everything, buy something, harvest again.
2. Try a phone-sized window (about 390×780) as well as desktop.
3. Switch scenes in the shop and check that the farm and market both change.
4. Watch the browser console for errors.

To reset progress, run `localStorage.removeItem('fruitfarmer.save')` in the browser console.
