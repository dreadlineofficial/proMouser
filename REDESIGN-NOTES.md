# ProMouser redesign — notes (v12)

Drop-in replacement for the original site: same file names and URLs, same tools.
Open `index.html`, or serve the folder (`python3 -m http.server 8000`) and visit
http://localhost:8000. Everything works from either.

## What's new in v12: unlock codes, UI revamps, more colours

- **No more demo purchases.** Everything in the shop (plans, passes, credits, Turbo, ProMouser Online items) only unlocks with a valid **unlock code** at checkout. The fake payment methods and "simulate a failure" are gone. Codes are stored as SHA-256 hashes, never in plain text, and checked case-insensitively. 8 wrong codes in 10 minutes locks the checkout for a while.
  - With Supabase connected, `redeem_order()` in `schema.sql` checks the code on the server, and the old `test_grant_order` function is dropped. Add or switch off codes in `public.unlock_codes` (see the comments in `schema.sql`).
  - Without Supabase (demo mode, which is what the live site uses right now), the browser checks the code hash.
- **UI revamps** (`revamps.css`): six whole new looks for every page, bought with credits in the shop (Shop → UI revamps) and switched on the account page. Cosmetic only. Any revamp can be previewed before buying.
  - Terminal (40 credits), Paper (40, a light theme), Arcade (60), Glass (30), Brutal (50) and Synthwave (60).
  - Each changes the fonts (loaded on demand), colours, shapes, shadows, background, nav, buttons, cards, headings and page width.
  - Online, `buy_revamp()` charges the credits and records ownership in `profiles.cosmetics`, which the browser can't write.
- **More colours**: 31 palettes. The 12 new ones (Sky, Mint, Rose, Indigo, Peach, Forest, Aqua, Plum, Slate, Copper, Magenta and Blood) join the level rewards between levels 11 and 35. Ultra has them all.
- **Circle test fixed**: the circle is now fitted wherever you draw it, not measured from the centre dot. It used to fail off-centre circles, or score them around 10%. Going a little past one lap no longer costs points.
- **Shop refresh fix**: after a purchase the shop page updates as soon as the checkout closes, instead of showing old credits and plans until you reload.

**Supabase:** re-run `supabase/schema.sql`. `supabase/test-payments.sql` is gone; don't run old copies of it.

## v11: more tests, a skill profile, and Daily that pays off

- **Six new tests** (`tests2.js`, one page each): **Tracking** (stay on a moving target, % on target), **Flick** (20 flicks from the centre: time, accuracy and path efficiency), **Target rush** (shrinking targets that speed up, 3 lives), **Rhythm** (click on the beat at 90–180 BPM: ms off the beat, early/late tendency), **Circle** (draw a perfect circle; also an angle-snapping check) and the **DPI analyzer** (move a measured distance with a ruler and get your real DPI; raw input in Chrome/Edge). 13 tests in all, with stats, personal bests, hub cards and XP.
- **Skill profile** (`skills.js`, on My stats and Daily, free for everyone): eight skills scored 0–100 from your last 5 results against rough benchmarks, an overall score, trends, a **coach** that picks what to practise next, **personal records** for every test and a 12-week **activity** heatmap.
- **Daily that pays off**: **weekly quests** (3 a week, +150 XP each), **personal-best alerts**, new daily challenges and 10 new achievements for the new tests, a **14-day all-rounder** training plan, and **level rewards**: 16 colours that unlock as you level up (Emerald at level 2 … Toxic at level 30) and apply across the whole site.
- **Pop-ups are optional**: every pop-up has a close button and a "Fewer pop-ups" / "Turn off pop-ups" button. Daily → Settings (also linked from the account page) has All / Big moments only / Off, and a switch to hide the streak and dot in the menu. Settings follow the account.
- **More colours**: 19 palettes in all (new: Lime, Ocean, Sunset, Violet, Gold, Ice, Coral, Teal, Crimson, Lavender, Toxic). Ultra accounts can use every colour straight away, plus a **custom colour** picker that builds a full palette from any colour.
- Fixes: a leftover merge line in `style.css` stopped the Glorious Model O loading screen from being styled; `tools/appearance_css.py` now only replaces its own block.

## v10: reasons to come back

- **Progress (core.js).** Everything you do earns XP: tests, recommendations, ProMouser AI, viewing mice, comparing, Mousle, saving your setup, and training plans. XP has daily caps so it can't be farmed. Levels go from Rookie to Legend, and there are 28 achievements. Progress is stored in this browser for guests and in `profiles.progress` for accounts (synced, so it follows you between devices).
- **Daily page (daily.html).** A new challenge every day (the same for everyone), a streak with a 🔥 counter in the nav, a 35-day calendar, this week's bests and the achievements grid.
- **Mousle.** A daily guess-the-mouse game: 6 guesses, with hints on brand, weight, price, polling, connection, shape and double-clicking. The result can be shared as an emoji grid.
- **Training plans.** *28-day CPS* and *30-day Aim* plans with a session each day and benchmark days.
- **My setup (setup.html).** Enter your mouse, DPI, game and sensitivity to get eDPI, cm/360, whether your mousepad is big enough, how well your mouse fits your grip and hand, and tips. It is saved to your account.
- **Account page.** A new progress panel for everyone. Ultra accounts also get an **Appearance** panel: 9 colours (Purple, Red, Blue, Navy, Emerald, Amber, Sakura, Cyan, Mono), Grid/Plain/Aurora background, glow on or off, and comfortable or compact density. It is saved in `extras.ui` and applied before the first paint. It is deliberately not advertised anywhere.
- Merged with the clean-URL, personalisation, profile and accessibility updates. The Ultra appearance colours sit on top of the Lite/Ultra site theme; saving a site theme on the dashboard clears the custom colour. Fixed three words the `index.html` → `./` replace broke: `tabindex` (the mice catalogue map crashed), `noindex` (404 and account pages) and "index finger" in ProMouser AI's clicking tips.
- Nav: a new **Daily** link. The Tests menu and account menu link to Daily and My setup.

**Supabase:** re-run `supabase/schema.sql`, which adds the `progress` column (64 KB cap) and includes it in `get_my_state`.

## v9

- **Only verified mice double-click.** ProMouser has verified six: Glorious Model O, Model O-,
  Model D, Bloody A70, HyperX Pulsefire Haste 2 and Ant Esports GM320 (`cps.verified` in
  `mice-data.js`). Every other mouse is now **Capped CPS** (level 1, butterfly and drag "not good"),
  in the data, the recommendation engine, every mouse card and every review page.
  `tools/cps_truth.py` re-applies the list to the static pages if it changes.
- **Why most mice are capped:** a new explainer on the Minecraft page (`#capped`): debounce,
  why brands keep it high, optical switches, what "double-clicks" means. The CPS test page and
  every capped review page link to it.
- **Ant Esports GM320** added (₹498 on Amazon.in, verified double-clicker; build quality and skates
  a step below the others). The Amazon button is a search link for now — swap in the exact product
  link in `mice-data.js` (`buy`) and `mice/ant-esports-gm320.html`. Its weight (~120 g) is an
  estimate; Ant Esports doesn't publish it.
- **ProMouser AI** (renamed from the Recommendation Assistant everywhere):
  - Uses credits: **1 credit covers 5 questions**, **unlimited on Ultra**, 3 free questions a day
    when signed out. `PM_CONFIG.ai` in `backend.js`; `spend_credits('assistant')` in `schema.sql`.
  - New answers: "how/why is it better (than X)?", "what makes it good?", "downsides?",
    "which mice can double-click?", "why is my CPS capped?", "is the G102 capped?", cheaper
    alternatives that keep double-clicking, and an honest note when the other mouse fits you better.
  - "Why it beats a normal AI" (human-reviewed data, not random sources) on the AI page, the home
    page and the recommendations page.
- **Supabase:** re-run `schema.sql` (spend_credits accepts `'assistant'`).

## v8

- **Two ways to use ProMouser.** A **Recommend / Hub** toggle sits in the top bar (and the
  mobile menu). First-time visitors to the home page are asked which they want.
  - **Recommend** is the site as before: recommendations, ProMouser AI, plans.
  - **Hub** is for people who are here for the mice: the home page becomes a mouse hub
    (search with filters like “wireless under 60 g”, mouse of the day, your test bests,
    spec record holders), the nav gains **Ask** and **My stats**, and the assistant
    introduces itself as a **Mouse Assistant** for questions about any mouse.
  - The choice is saved in `localStorage` (`pm_mode`) and in the account's `prefs.mode`.
    Pages mark mode-specific parts with `data-only="recommend"` or `data-only="hub"`.
- **New plans** (all one-time, never downgrade):

  | | Basic ₹599 | Lite ₹2,499 | Ultra ₹3,199 |
  |---|---|---|---|
  | Daily credits | 7 | 20 | 30 |
  | Credits per recommendation | 1 | 2 | 0 (unlimited) |
  | Results | Top 5 | Every match | Every match |
  | Extras | Match breakdown, check any mouse, 30-run history, deep navy theme (darker than Lite’s blue) | + advanced preferences, advanced CPS stats, bests on every test, blue theme | + statistics for every test, **1 year of Turbo**, profiles (10), watchlist (50), sensitivity converter, export, assistant memory, purple theme |

  New page `basic.html`; `lite.html`, `ultra.html` and the shop were rewritten around one
  comparison table (`tools/plans.py` regenerates the plan pages; `tools/test-plans-modes.js` is a Playwright check of plans, stats and modes).
- **Statistics for every test** (`teststats.js`): every test records its sessions. Ultra gets
  a full panel under each test (trend chart, average, median, consistency, improvement,
  percentile, best by mode, CSV export), saved to the account in `extras.testLog`.
  Lite sees personal bests and recent sessions. New page `my-stats.html` shows all seven.
- **Fix:** Ultra accounts now get the advanced recommendation preferences (the form only
  checked for Lite before).
- **Supabase:** re-run `schema.sql` (adds the `basic` plan, new prices, credits, `pm_rank`,
  365 days of Turbo with Ultra) and `dev-tools.sql`.

## v7

- **Domain:** canonical links, the sitemap, robots.txt and the docs now use **promouser.website**.
- **New prices:**
  - (superseded in v8) **Lite** was a one-time **₹699** and **Ultra** a one-time **₹1,119**. Both are yours for life,
    with nothing to cancel.
  - Buying Lite on an Ultra account never downgrades it.
  - Ultra now includes **1 month of ProMouser Turbo**.
  - **Turbo** is ₹199/month, sold in the shop as the only subscription.
  - The old monthly products stay in the database for order history, but can no longer be bought.
- **ProMouser Online** is advertised across the site:
  - a "New" Online link in the nav and the footer
  - a section on the home page
  - the announcement bar
  - a Turbo card in the shop
  - a duel callout on the Test Hub
  - an entry in search

  The URL lives in `ONLINE_URL` in `build.py` and `PM_CONFIG.turbo.onlineUrl` in `backend.js`.
- **CPS test personal bests** are saved to your account (`save_cps_best`) and appear on your
  ProMouser Online profile.
- **Supabase:**
  - `schema.sql` adds `turbo_until`, `cps_best`, the `turbo` and `item` product types and
    the lifetime plan logic.
  - `online.sql` (copied here) adds everything for ProMouser Online.
  - Run them again after updating; both are safe to re-run.

## What's new in v6

- **CPS test v3** (`cps-test.html`, `cps.js`): rewritten from scratch.
  - **Why the old one was glitchy:** it counted the browser's `click` event, which fires on release and gets dropped when a press ends off the button. The whole panel also lifted on hover, there was no right-click guard, text got selected on fast clicks, and leftover clicks after the timer started a new run.
  - **How it counts now:** every press is counted from `mousedown`/`pointerdown` using the event's own timestamp, and only inside the run window. The run ends on a timer even if the tab stops drawing frames, and switching tabs mid-run restarts it instead of giving a wrong score.
  - **Blocked inside the test:** the right-click menu ("Inspect", "Search"), text selection, drag, middle-click autoscroll and the back/forward side buttons. The right-click menu is also blocked page-wide during a run.
  - **Options:** 1–60 s timers, left- or right-click mode, a moving-target mode, a short cooldown so trailing clicks don't start a new run, and <kbd>R</kbd> to restart.
  - **Saved results:** personal bests per length, a rank, and run history, all in the browser.
  - **Lite and Ultra:**
    - a double-click count (two clicks registered < 30 ms apart)
    - stray right/left clicks with timestamps, flagged live during the run
    - peak CPS (best 1 s window), consistency, average/fastest gap, click-style guess, stamina
    - a second-by-second CPS graph with markers
  - **Ultra adds:** a progress chart across runs, plus CSV export of your history and of each run's clicks.
  - **Free users** see a blurred preview with a Lite upsell.
- **Test Hub** (`tests.html`) with 8 tests, plus 5 new pages driven by `tests.js`:
  - reaction time (`reaction-test.html`), 5 rounds, catches early clicks
  - aim trainer (`aim-trainer.html`): 20/30/50 targets, 3 sizes, time + accuracy
  - polling rate (`polling-rate-test.html`): uses coalesced pointer events and snaps to 125…8000 Hz
  - scroll wheel (`scroll-test.html`): flags reverse jumps from a worn encoder
  - mouse buttons (`mouse-button-test.html`): all 5 buttons, hold time, chatter detection

  The hub shows your personal bests. The nav "Tests" menu, footer, search and sitemap include the new pages.
- **New prices** (placeholders): Lite **₹349/month**, Ultra **₹799/month**, Recommendation Pass **₹199**, credits 10 = ₹39 · 30 = ₹99 · 100 = ₹249 · 300 = ₹649. They're in `backend.js` and `supabase/schema.sql`. **If you already ran `schema.sql` on Supabase, run it again**: it updates the prices in place and keeps your users and data.
- **ProMouser AI, round 3.** I tested it with 50 real-style questions (slang, typos, Hinglish, follow-ups) and fixed what it got wrong:
  - **Mouse names:** bare names like "deathadder", "viper" and "superlight" now resolve. "g pro x superlight 2" no longer gets mistaken for the original Superlight.
  - **Vague questions:** "best mouse", "which mouse should I buy" and "top 5 mice" get real picks straight away (best for FPS / 1.8 PvP / under ₹3,000) instead of only a question back.
  - **New answer types:**
    - "I have a G102, should I upgrade?": upgrades with what you'd gain
    - "Is the Viper V3 Pro worth it?": value check against cheaper near-equals
    - "is X good?": a verdict first
    - "X vs Y which for valo": a direct "short answer" for that game
  - **Follow-ups** like "and price?", "is it wireless?" and "alternatives" remember which mouse you're talking about.
  - **New how-to answers:** more CPS; how to butterfly, jitter or drag click; fixing a double-clicking mouse; is 8K polling worth it; does the mouse matter for aim; what pros use; colours; quiet mice.
  - **Bugs fixed:**
    - "no budget" was read as "cheap".
    - Brand-only or budget-only questions showed fake 0% scores.
    - "best X" dumped an alphabetical list.
    - The typo-fixer turned "matter"/"faster"/"right" into mouse words.
  - **Also new:** Hinglish budgets ("2000 tak", "3k ke andar") and words (batao, chahiye, sasta) work, comfort and long-hours requests are understood, RGB filtering works, and so does "best sensor".

## What's new in v5

- **ProMouser Ultra** (`ultra.html`): a third plan with a purple & black theme, at ₹799/month (placeholder, change it in `PM_CONFIG.ultra` in `backend.js` and in `products` in `supabase/schema.sql`). It includes everything in Lite, plus:
  - **Unlimited recommendations.** Runs never use credits.
  - **Saved profiles.** Up to 5 named setups on the Recommendations page; one click loads one.
  - **Price watchlist.** "Watch price" stars on every mouse page and shortlist card. The Elite Dashboard shows each watched mouse's price change since you saved it.
  - **Sensitivity converter** (`sens.html`, under Tests). It converts between CS2/CS:GO, Valorant, Apex, Overwatch 2 and TF2, with eDPI, cm/360, a "same feel in every game" table and a DPI-change helper.
  - **Shortlist export.** Print or save as PDF (with a print-only stylesheet), or copy a readable list.
  - **Assistant memory.** ProMouser AI saves what it learns to your account and greets you with it next time, on any device.
  - Free and Lite users see friendly Ultra previews or upsells instead of these features. Leaving Ultra keeps your saved data, but it's locked until you return.
  - The shop has three cards (Lite, Ultra, Recommendation Pass). The dev panel switches **Normal / Lite / Ultra** and previews all three themes.
  - Supabase: plans are now `free | lite | ultra`, and profiles have an `extras` column (watchlist, profiles, memory) that only Ultra accounts can change, enforced by a database trigger. Re-running `schema.sql` upgrades an older install.
- **Real product photos** for 29 of the 31 new mice, from the images you sent. The backgrounds were removed, they were cropped to match the original photos, and small ones were upscaled with EDSR. The **G102 Lightsync** and **Glorious Model O-** still use illustrations; send photos of those two whenever you like. The Zowie photo is the EC1-DW, which looks the same as the EC2-C from above.

## What's new in v4

- **38 mice instead of 7.** 31 new mice from Logitech, Razer, Glorious, Bloody, SteelSeries, HyperX, Zowie, Cooler Master, Endgame Gear, Corsair, Redragon and Attack Shark.
  - Each has full specs in `mice-data.js`: weight, sensor, DPI, IPS, polling, battery, buttons, switches, shape, real dimensions, grips, hand sizes, butterfly/jitter/drag ability, Minecraft CPS rating and an approximate India price.
  - Each has its own page in `mice/` with plain-English specs, strengths and trade-offs, where to buy, and similar mice.
  - The new mice show **illustrated renders** (`assets/images/mice/art/`), drawn to scale from each mouse's real dimensions, because product photos couldn't be downloaded here. Each page labels the image as an illustration. To use a real photo, drop `<id>-480/-720/-960.png` (+ `.webp`) into `assets/images/mice/` and change that mouse's `img` from `art/<id>` to `<id>`.
  - **Please check:** new-mouse specs come from manufacturer and retailer listings, and prices are approximate street prices. Each mouse's `verify` list in `mice-data.js` says what to double-check. New mice are capped at **4/5 CPS**, so the Glorious Model O and Bloody A70 stay the only 5/5 picks. Tell me which ones deserve more.
- **Mice page catalogue.** Browse all 38 as cards with search, brand, filter chips (FPS, Minecraft, MMO, wireless, under ₹3,000, under 60 g, strong CPS) and sorting. The FPS and Minecraft pages gained a "more picks" section. Grip lists, search and the sitemap include every mouse.
- **Smarter matching.**
  - New **MMO & MOBA** game type.
  - Lite gets **hand length in cm**, matched against each mouse's real length for your grip, plus a **left-handed** option and a wider budget range.
  - FPS scores are finer-grained so 38 mice don't tie at 100%.
  - Minecraft weighs CPS more, so the Model O and A70 still lead for 1.8.
  - Lite results fold after 6 with a "Show all" button.
- **ProMouser AI rewritten** (`assistant.js`). It runs in the browser on the same data and engine. It understands:
  - games, grip, hand size in S/M/L, cm or inches, budgets in ₹ or $, weight, wireless, left-handed, buttons and click style
  - questions about one mouse, comparisons of 2–4 mice, cheaper/lighter/wireless alternatives, lists ("lightest wireless under ₹5,000")
  - concept explanations, and follow-ups ("cheaper", "show more", "compare the first two", "why the first one?")
  - It fixes typos in mouse names, shows what it has learned as removable chips, and keeps the conversation for the tab.
  - It is not an LLM. It can't answer things outside mice, and it says so.
- **Passes are now per-feature.** Credits work for everything. The old "Credit Pass" (unlimited credits) is now the **Recommendation Pass**: unlimited recommendations for 30 days without spending credits. Your credit balance stays visible, with a PASS badge in the header. Old demo accounts are migrated automatically.
- **Dev mode** (`dev.js`). It only exists on your own computer: on localhost, 127.0.0.1 or `file://`, press **Ctrl+Shift+D** or add **`?dev=1`**. On promouser.website the file is never requested, and you can delete `dev.js` before uploading. Panels:
  - **Account:** switch **Normal ↔ Lite**, add or set credits, give or remove the pass, jump to the next day, re-run onboarding, clear history or orders, one-click test account
  - **Engine:** every mouse's score and the parts behind it, for any preferences
  - **Data:** checks `mice-data.js` for gaps
  - **View:** theme preview, grid overlay, animations off
  - In Supabase mode it works for accounts listed in `public.developers` (`supabase/dev-tools.sql`).
- **Fixed:** review pages for the Model O, A70 and G502 were titled "Offer price" or "Listed price" because of a build bug. Product photos in review headers were zoomed and cropped; they now fit the frame.

## What's new in v3

- **One panel per game.** On Recommendations, choosing two or more games now shows a separate shortlist for each game, such as "Best for FPS & shooters" and "Best for Minecraft". When you pick more than one game, a banner at the top names the mouse that suits all of them best. A run still costs the same number of credits.
- **Glorious Model O is now ₹6,001.** The new price is set in `mice-data.js` and on the review page (the Desertcart listing). The "From" price in the Minecraft top-CPS section uses it too.
- **Removed the match-finder ranking list** on `compare.html` (the dropdowns plus the ranked top-5 list). A link to Recommendations replaces it.
- **Elite Dashboard** (`elite.html`) for every signed-in user:
  - welcome header and stat tiles
  - today's credits ring
  - 7-day activity chart
  - latest shortlist (split by game)
  - "Keeps coming up for you" (the mice that appear in your runs most often)
  - your setup and recent orders
  - Lite members also get their advanced profile and a budget check.
  - Logged-out visitors see the original Elite page text and a sign-in prompt.
  - The dashboard is linked from the Recommend menu, the More menu, the account menu, the footer and search.
- **UI polish:** animated glowing borders on the cards that matter most, plus tighter section spacing, button shine, custom scrollbars, an outlined footer wordmark and responsive fixes.

## What's in v2
- **Red + black theme** (deeper black, one signal red). **ProMouser Lite** swaps the
  whole site to **blue + black** (`[data-plan="lite"]` in `style.css`).
- **No rankings.** The leaderboard, "performance index", "#1 of 7" chips and the radar
  are gone. Review pages now show each spec on a plain-English scale (Ultralight /
  Light / Medium / Heavy, Standard / High / Very high…) and a "Who it fits" panel.
- **Minecraft = CPS.** The Glorious Model O and Bloody A70 lead the Minecraft page with
  a "Highest CPS potential" banner and explanation; every mouse shows a CPS level.
  The DeathAdder V3 and G PRO X2 SUPERSTRIKE are rated **not CPS mice** (they can't
  double-click) and the page copy that said otherwise was corrected.
- **Accounts + onboarding**: sign up, then two questions (games, weight preference).
- **Recommendations** (`recommendations.html`): credits-based generator with a
  "generating" screen. Free = 5 credits/day, 1 credit per run, top 3 results, basic
  preferences. Lite = every result with a score breakdown, advanced preferences
  (hand size, Minecraft 1.8 vs 1.9+, budget, buttons, customisation, click style,
  shape), 3 credits per run.
- **Shop** (`shop.html`): Lite subscription, 1-month Recommendation Pass (was: Credit Pass),
  credit packs. **Demo checkout** — no card details asked for, nothing charged; has a
  "simulate failed payment" option. **Lite page** (`lite.html`), **account page**.
- Mouse photos re-processed (tight crops, cleaner edges, AI super-resolution on the
  three low-res sources, sharpening, WebP versions).

## Assumptions I made — change in `backend.js` (`PM_CONFIG`)
| | Value |
|---|---|
| Free daily credits / cost per run / results | 5 / 1 / top 3 |
| **Lite** daily credits / cost per run / results | **15** / 3 / all |
| Lite price, Recommendation Pass price | **₹349 / month, ₹199 / 30 days** (Ultra ₹799 / month) |
| Credit packs | **10 = ₹39, 30 = ₹99, 100 = ₹249, 300 = ₹649** |
| Lite duration | 30 days, then it lapses (no auto-renew in the demo) |

You asked for the free amount, 3 results, "drains faster", and pass = unlimited for a
month. The Lite daily allowance and every price are my placeholders.

## This is a DEMO backend — read before going live
Accounts, credits, plans and "payments" live in the visitor's **localStorage**
(`backend.js`). Anyone can edit their own credits in dev-tools, nothing syncs between
devices, and no money moves. To launch:
1. **Supabase**: done. Follow `SUPABASE-SETUP.md` (run `supabase/schema.sql`, paste your
   URL and key into `supabase-config.js`). The schema was tested on Postgres 16.
2. **Razorpay**: replace `PMPayments.pay()` in `shop.js` (instructions in the comment).
   Create orders on your server and grant credits/Lite only from a verified webhook
   (`grant_order` in `supabase/schema.sql`) — never from the browser.
3. **Legal pages**: `privacy.html` is updated for the demo storage. `terms.html` still
   says ProMouser "does not sell products or process purchases" — that stops being true
   once payments are real. It also needs refund/subscription terms. Have it reviewed.

## Editing mouse stats
Edit `mice-data.js`; spec scales, filters, compare tool and recommendations all update.
Each review page also has a static spec table (for SEO/no-JS) generated at build time —
update it by hand when you change a number.

## Please verify before publishing
| Item | Before | Now |
|---|---|---|
| DeathAdder V3 / SUPERSTRIKE CPS | page copy: suits butterfly/jitter/drag | **not CPS mice** (your call) |
| Superlight Pro X CPS | "great for all clicking styles" | lowered to level 3 — **tell me if it should be lower** |
| G502 HERO, Cobra CPS levels | — | 3 and 2 (editorial) |
| DeathAdder V3 max DPI / weight | page 6,400 / compare table 82 g | **30,000 / 59 g** |
| Glorious Model O weight, sensor | 68 g / "PixArt 3370" | 67 g (wired) / PMW3360 |
| G502 "From" price on Minecraft page | ₹2,299 (the seller your review warns against) | ₹3,190 |
| Home "50+ Mice Reviewed" | claim | real count (7 with spec sheets) |
| Cobra and SUPERSTRIKE specs, Superlight battery, accel (G) | missing | added from my own knowledge |
| Hand-size fit, comfort, customisation tags | missing | editorial estimates |

Fields I wasn't sure about stay blank ("—"). `mice-data.js` lists each change in `verify`.

## Other changes
- Navigation: Mice · Tests · Guides · Recommend · Shop · More (+ search, credits, account).
- One `<h1>` per page; canonical + Open Graph tags; fake splash screen and 420 ms
  click delay removed; assistant page loads the 720 px images.
- Browser storage (listed in `privacy.html`): `pm_banner_closed` (session),
  `pm_onb_asked` (session), `pm_compare_state`, `pm_users`, `pm_session`, `pm_plan`.
