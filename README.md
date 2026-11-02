# Fruit Farmer

Catch fruit in the orchard, sell it at the market, and grow your fruit farm.

**To play:** double-click `index.html`. It opens in your web browser. Progress is saved in that
browser on that computer.

## How to play

- **Orchard:** tap an arrow to scoot, or hold it to zip. You can also drag your basket.
  You start with just your hands, which hold 2 fruit. When you're full, head to the market.
- **Market:** press on the fruit, drag down to pull back the slingshot, and let go. The dotted arc
  shows where your fruit will land. On a keyboard, use the arrow keys to aim and Space to throw.
  Give each animal the fruit it asks for. The tag shows what the whole basket still pays, and
  animals farther back pay more per fruit. Missed fruit comes back to your tray.
- **Slingshot:** start your drag on the fruit. Tap a fruit in the tray to swap it in.
- **Farm book:** see your Farm Score, your totals for today, this week and this month, a diary of
  every day, and your farms. You can start a new farm and keep your colors and scenery.
- **Shop:** buy bigger baskets, new fruit trees, upgrades, basket colors and scenery. Reach the
  goals on the Barrel wall card to unlock a bigger market with 12 barrels.

## Changing the game

Every change is saved in Git. To see the game as it was before the new market:

```bash
git checkout before-new-market
```

Run `git checkout main` to come back.

Most numbers and content live in `js/data.js`. `CLAUDE.md` explains how the rest of the files
fit together. Claude Code reads it automatically when you open this folder.
