# ProMouser redesign — notes (v5)

Drop-in replacement for the original site: same file names and URLs, same tools.
Open `index.html`, or serve the folder (`python3 -m http.server 8000`) and visit
http://localhost:8000. Everything works from either.

## What's new in v5

- **ProMouser Ultra** (`ultra.html`): a third plan with a purple & black theme, at ₹299/month (placeholder, change it in `PM_CONFIG.ultra` in `backend.js` and in `products` in `supabase/schema.sql`). It includes everything in Lite, plus:
  - **Unlimited recommendations.** Runs never use credits.
  - **Saved profiles.** Up to 5 named setups on the Recommendations page; one click loads one.
  - **Price watchlist.** "Watch price" stars on every mouse page and shortlist card. The Elite Dashboard shows each watched mouse's price change since you saved it.
  - **Sensitivity converter** (`sens.html`, under Tests). It converts between CS2/CS:GO, Valorant, Apex, Overwatch 2 and TF2, with eDPI, cm/360, a "same feel in every game" table and a DPI-change helper.
  - **Shortlist export.** Print or save as PDF (with a print-only stylesheet), or copy a readable list.
  - **Assistant memory.** The Recommendation Assistant saves what it learns to your account and greets you with it next time, on any device.
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
- **Recommendation Assistant rewritten** (`assistant.js`). It runs in the browser on the same data and engine. It understands:
  - games, grip, hand size in S/M/L, cm or inches, budgets in ₹ or $, weight, wireless, left-handed, buttons and click style
  - questions about one mouse, comparisons of 2–4 mice, cheaper/lighter/wireless alternatives, lists ("lightest wireless under ₹5,000")
  - concept explanations, and follow-ups ("cheaper", "show more", "compare the first two", "why the first one?")
  - It fixes typos in mouse names, shows what it has learned as removable chips, and keeps the conversation for the tab.
  - It is not an LLM. It can't answer things outside mice, and it says so.
- **Passes are now per-feature.** Credits work for everything. The old "Credit Pass" (unlimited credits) is now the **Recommendation Pass**: unlimited recommendations for 30 days without spending credits. Your credit balance stays visible, with a PASS badge in the header. Old demo accounts are migrated automatically.
- **Dev mode** (`dev.js`). It only exists on your own computer: on localhost, 127.0.0.1 or `file://`, press **Ctrl+Shift+D** or add **`?dev=1`**. On promouser.shop the file is never requested, and you can delete `dev.js` before uploading. Panels:
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
| Lite price, Recommendation Pass price | **₹149 / month, ₹99 / 30 days** |
| Credit packs | **10 = ₹29, 30 = ₹79, 100 = ₹199, 300 = ₹499** |
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
