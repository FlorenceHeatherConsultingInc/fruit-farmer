# Progression redesign (draft for approval)

Status: **step 1 built** (trees, basket, level curve, prices, quests, old saves). Steps 2–4 are not built yet. Numbers are first guesses to be checked by playing.

## The problem today

- Groves grow with farm level (`10 + level × 2`). At level 22 that is 54 apples, 54 oranges and 43 bananas.
- The basket also grows with level. Level comes from catching and selling, so more fruit means more
  levels, which means even more fruit. Nobody chooses it; it just piles up.
- At level 22 a full day is about 150 fruit: 6–7 harvest trips and about 150 slingshot throws, at 1–3 coins each.
- The barn (100, then 200) fills in one day, so the barn feels like a wall.
- The middle of the game (kitchen, fields, animals) moves only one day at a time, and every day
  carries that 150-fruit chore. Corn is short by design: the field grows 3 a day and two hens eat 4.
- The building card has four places for things (barn → feed box → slots → pallet → barn) and grown-up words.

## The idea

**Your farm only gets bigger when you choose to make it bigger.**

- Trees and the basket stay the same size until you buy an upgrade.
- Two upgrades pull against each other:
  - **Bigger tree:** more fruit, so more coins each day.
  - **Bigger basket:** fewer trips for the same fruit, so less work.
- Farm level is the "how far along is my farm" score. It decides when new things open, and nothing else.
- The beginning keeps its rhythm: a few trips, sell, go to bed, unlock one thing.

## 1. Trees

- Every tree starts holding **6** and refills over its `refill` days as now. Level no longer changes it.
- The grove card gets a second button: **Grow the tree · holds 8 · 🪙10**.
- Each grow multiplies what the tree holds by **1.3** (rounded, at least +1), so it starts slow and
  snowballs: +2, +2, +3, +4, +5, +7, +9, +11, +15 …
- Each grow costs **1.4×** the last. There is no top.
- The tree picture on the map gets a little fuller with each grow (crown size, or more fruit drawn).

| Grow | Holds | Adds | Apple | Orange | Banana | Strawberry | Grapes |
|---|---|---|---|---|---|---|---|
| 1 | 8 | +2 | 10 | 25 | 50 | 100 | 200 |
| 2 | 10 | +2 | 14 | 35 | 70 | 140 | 280 |
| 3 | 13 | +3 | 20 | 49 | 98 | 196 | 392 |
| 4 | 17 | +4 | 27 | 69 | 137 | 274 | 549 |
| 5 | 22 | +5 | 38 | 96 | 192 | 384 | 768 |
| 6 | 29 | +7 | 54 | 134 | 269 | 538 | 1076 |
| 7 | 38 | +9 | 75 | 188 | 376 | 753 | 1506 |
| 8 | 49 | +11 | 105 | 264 | 527 | 1054 | 2108 |
| 10 | 83 | +19 | 207 | 517 | 1033 | 2066 | 4132 |
| 12 | 140 | +32 | 405 | 1012 | 2025 | 4050 | 8099 |

**Why 1.3 for size and 1.4 for cost.** If size and cost grew by the same amount, every grow would pay
for itself just as fast as the last, and income would run away forever. With cost growing a bit
faster, it still snowballs, but each grow takes a little longer to earn back. For an apple tree that's
about 2.5 days for the first grow, 4 days by grow 7, and 6 days by grow 12. That's a soft brake, not
a wall. Both numbers are in `data.js` to tune.

New data: on each `trees` row, `holds: 6` and `growCost`, plus shared `growBy: 1.3` and
`growCostBy: 1.4`. `perLevel` goes away.

## 2. Basket

- You start with **hands that hold 2**. Level no longer changes it.
- Buy upgrades in the **Tool shed**, next to Zippy wheels and Lucky stars.
- Each upgrade multiplies what it holds by **1.25 (at least +1)**, so it snowballs too. That's
  slightly slower than trees, so a well-grown tree is still a few trips. Price is **4 × the new size**.
  There is no top.

| Holds | 2→3 | →4 | →5 | →6 | →8 | →10 | →13 | →16 | →20 | →25 | →31 | →39 | →49 | →61 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Price | 12 | 16 | 20 | 24 | 32 | 40 | 52 | 64 | 80 | 100 | 124 | 156 | 196 | 244 |

- The look changes at set sizes, with confetti in the shed ("Your hands became a basket!"):

| Look | From |
|---|---|
| Hands | 2 |
| Little basket | 6 |
| Big basket | 17 |
| Wheelbarrow | 34 |
| Fruit cart | 66 |
| Wagon | 118 |

- The Shop's "pick how your basket looks" still lets you choose any look you have reached.

## 3. Farm level

- Points still come from catching, selling, making things and bringing in crops.
- **Quest rewards give coins only, not points.** Today they give both, and later quests (90–300) push
  the level far ahead of the story.
- New level curve: level *L* to *L*+1 costs **20 × L** points. The old one was tied to basket size.

| Level | Total points | Opens | Rough day |
|---|---|---|---|
| 3 | 60 | Orange tree | 2 |
| 6 | 300 | Banana tree | 5–6 |
| 10 | 900 | Strawberry patch, third animal | ~12 |
| 15 | 2100 | Grape vine, Barrel wall goal | ~20 |

- The level-up card no longer promises a bigger basket. It says what just opened, or how close the next opening is.
- Holding the level during a harvest (`FF.holdLevel()`) can stay. It just no longer changes the basket.

## 4. Prices

There's much less fruit, so each fruit is worth more. Goods are set above what goes into them.

| | Now | New | Made from (new value) |
|---|---|---|---|
| Apple | 1 | 2 | |
| Orange | 2 | 3 | |
| Banana | 3 | 5 | |
| Strawberry | 4 | 7 | |
| Grapes | 5 | 9 | |
| Gold star | 10 | 15 | |
| Orange juice | 10 | 14 | 3 oranges (9) |
| Smoothie | 16 | 24 | 2 bananas + 1 strawberry (17) |
| Jam | 18 | 28 | 3 strawberries (21) |
| Popcorn | 10 | 10 | 3 corn (6) |
| Fruit salad | 26 | 40 | one of each fruit (26) |
| Apple pie | 36 | 40 | 3 apples + egg + milk (26) |
| Milkshake | 40 | 50 | milk + smoothie (36) |
| Pancakes | 55 | 70 | egg + milk + jam (48) |

| Costs | Now | New |
|---|---|---|
| Orange tree | 60 | 40 |
| Banana / strawberry / grapes trees | 150 / 350 / 800 | same |
| Juice press | 150 | 100 |
| Smoothie stand | 250 | 180 |
| Jam kitchen | 300 | 200 |
| Popcorn cart | 350 | 250 |
| Salad bar | 500 | 350 |
| Bakery | 900 | 600 |
| Diner | 1500 | 1000 |
| Chicken coop | 400 | 250 |
| Cow barn | 600 | 400 |

Keep Perfect and streak coins as they are (small).

## 5. Fields, animals and the barn

- Corn field grows **5** a day at level 1 (was 3).
- Hens eat **1 corn** per egg (was 2). Two hens then need 2 corn a day, which leaves corn for popcorn.
- **Hay and corn don't count toward the barn.** They sit in a separate silo, shown on the barn card.
- Barn sizes stay 100 / 200 / 400 / 800 / no limit. With fewer fruit, 100 lasts about 2 days early on.

## 6. Building card (simpler words, fewer places)

- **No feed box.** Each night a building takes what it needs straight from the barn.
  - Morning note: "Your hens ate 2 corn from the barn."
  - Each building has an **On / Off** switch, so a child can save fruit to sell instead.
- **The pallet becomes a "Ready!" pile.** Tap it on the map to collect into the barn.
  - Its upgrade is "Bigger pile" (or "Bigger nest" for hens, "Bigger crate" for presses).
- The card shows:
  - one picture: 🌽 → 🥚
  - "2 hens · 2 eggs tomorrow" (or "Needs 2 corn" when the barn is short)
  - a big **Collect** button
  - **More hens** and **Bigger nest** buttons
- The "Get a bigger pallet" quest becomes "Get a bigger nest".

## 7. Helpers (future, needs more thought)

- **Who:** a friend who has moved into the village offers to help at one tree. It's free and comes from the friends story.
- **What they pick:** only fruit you **left on the tree** when you went to bed. Catching yourself stays the main game.
- **The bucket:** sits next to the tree. Tap it to collect into the barn.
  - It starts holding 6. "Bigger bucket" is a coin upgrade with no top.
- **When:** around your third tree, from a quest ("Ask a friend to help at the apple tree").
- It looks and works like a building's Ready pile, so it's one idea, not two.

Open questions:
- Can one friend help at several trees?
- Do helpers need hearts first?
- Does the bucket refill before or after the tree regrows?

## 8. Quests

Changes to the early chapters:
- **Chapter 1:** after "Go to bed", add **Grow your apple tree** (shows the grove card's grow button).
- **Chapter 2:** add **Get a bigger basket**, which reveals the Tool shed earlier. "Buy Zippy wheels"
  stays and now just points at the shed.
- "Pick a whole tree in one visit" stays. With a tree of 6 or 9 it's a good early goal.
- "Get a bigger pallet" becomes "Get a bigger nest" (see section 6).

## 9. Early days with these numbers (estimate)

| Day | What happens | What you can buy |
|---|---|---|
| 1 | Catch 6 apples in 3 trips, look in the barn, sell, sleep. About 35 coins with quest rewards. | Grow apple tree to 8 (10), or a bigger basket (12) |
| 2 | 8 apples (or 6 in 2 trips). Reach level 3. | Orange tree (40) |
| 3 | 8 apples + 6 oranges. Pick a whole tree. | Zippy wheels, or grow a tree again (14 / 25) |
| 4–5 | Meet 3 animals, deliver an order | First friend's home (100) |
| 6–7 | Juice press (100), feed it, collect | Banana tree at level 6 |
| 8+ | Fields open with the third tree | Hay, then corn |

Target: about one new thing every day, with each day taking 3–6 trips.

## 10. Challenges and seed shop

- **Tiny Hands:** basket upgrades stop at 5.
- **Apples Only:** unchanged. The apple tree can still grow.
- **Head start: basket:** new farms start with hands that hold 6 (the Little basket). It no longer gives points.
- **Head start: tree:** unchanged.

## 11. Existing saves

- **Basket:** keeps what it holds today (from the old level formula). For example, level 22 keeps 24.
- **Trees:** get free grows until each holds at least what the basket holds. At 24 that's 6 grows,
  which holds 29. Fruit on the tree is cut down to the new size.
- **Level:** recalculated from the points already earned on the new curve. It may go down.
  The tree-opening checks only look forward, so nothing already planted is taken away.
- **Feed boxes:** any fruit in a feed box goes back to the barn (it can go over the barn size once).

## Code that changes

| File | Change |
|---|---|
| `js/data.js` | trees, basket ladder, levels, prices, building costs, corn, coop recipe, quests |
| `js/core.js` | `FF.cap()` reads the saved basket size; new level curve; looks come from size; save migration |
| `js/groves.js` | `holds()` from grows; grow button and cost on the grove card |
| `js/shop.js` | basket upgrade in the Tool shed |
| `js/main.js` | level-up and harvest cards stop talking about basket growth |
| `js/buildings.js` | auto-feed from barn, On/Off, Ready pile, new card (section 6) |
| `js/fields.js`, `js/core.js` | silo for crops |
| `js/map.js`, `js/scenery.js` | fuller trees per grow; tap-to-collect pile on buildings |
| `js/book.js` | Head start: basket |
| `js/quests.js` | new quest needs: tree grown, basket size |

## Suggested order to build

1. Trees, basket, level curve, prices, and migrating old saves (sections 1–4, 10, 11, and the quest changes)
2. Corn, hens and the silo (section 5)
3. The building card (section 6)
4. Helpers, after section 7's open questions are answered
