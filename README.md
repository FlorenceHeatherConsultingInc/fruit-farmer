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
- **Family:** in the Farm book, start a family or join one with a code to compare scores for today,
  this week, this month and all time. Farm names are made up by the game, and there's no chat.
- **Village:** sell fruit to animals to earn hearts. At 3 hearts, build them a home. Friends stay
  across every farm, and best friends give you a special basket color.
- **Stickers:** 60 stickers in the Farm book. Fill a page to unlock a reward you can't buy.
- **New farms:** starting over earns Golden Seeds. Challenge farms pay double, and seeds buy rare
  animals, scenery and head starts in the shop.
- **Fruit Legend:** reach a Farm Score of 100,000 for a parade of all your friends.
- **Save code:** on the Farms page of the Farm book, get a code to back up your game and move it
  to another device.
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
