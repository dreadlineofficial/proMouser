/*
 * ProMouser — mouse statistics (single source of truth)
 *
 * Every spec chart, leaderboard, comparison table and recommendation on the
 * site is generated from this list. Edit a number here and it updates
 * everywhere (the static spec tables on each review page are generated from
 * the same data at build time — change those pages too if you edit a spec).
 *
 * Units:  weight = grams · dpi = max DPI/CPI · ips = max tracking speed
 *         (inches per second) · accel = max acceleration (G) · poll = max
 *         polling rate (Hz) · battery = hours (null for wired) · price = INR
 *
 * series = default chart colour (--s1…--s7); dims = [length, width, height] mm;
 * img 'art/…' = illustrated render (no product photo yet); art = how the render is drawn;
 * lefty = usable by left-handed players (side buttons on both sides); cps.verified = ProMouser has checked that it
 * double-clicks (only these can reach high CPS; every other mouse is rated "Capped CPS"); cps.level 1-5 is how much click-speed
 * (CPS) potential it has for Minecraft; handSize / comfort / custom are editorial estimates.
 *
 * Any field set to null is "not published" and is shown as "—".
 *
 * `verify` lists fields that were corrected or added during the redesign and
 * should be double-checked against the manufacturer page.
 */
window.PM_MICE = [
  {
    "id": "razer-deathadder-v3",
    "name": "Razer DeathAdder V3",
    "short": "DeathAdder V3",
    "brand": "Razer",
    "page": "mice/razer-deathadder-v3.html",
    "img": "razer-deathadder-v3",
    "weight": 59,
    "dpi": 30000,
    "ips": 750,
    "accel": 70,
    "poll": 8000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "Razer Focus Pro 30K optical",
    "switches": "Razer optical (Gen-3)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps",
      "work",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "poor",
      "drag": "poor"
    },
    "price": 3800,
    "priceNote": "Amazon.in",
    "rating": 9,
    "tags": [
      "FPS"
    ],
    "bestFor": "Fast, precise FPS aim",
    "verify": [
      "dpi (site previously said 6,400; Razer lists 30,000)",
      "weight (compare table previously said 82 g; review page said 59 g)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates",
      "CPS: owner confirmed it cannot double-click, so rated as not a CPS mouse (page copy previously said it suits butterfly/jitter/drag)"
    ],
    "series": 1,
    "comfort": 5,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "dims": [
      128,
      68,
      44
    ],
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "logitech-superlight-pro-x",
    "name": "Logitech Superlight Pro X",
    "short": "Superlight Pro X",
    "brand": "Logitech G",
    "page": "mice/logitech-superlight-pro-x.html",
    "img": "logitech-superlight-pro-x",
    "weight": 63,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 70,
    "buttons": 5,
    "sensor": "Logitech HERO 25K",
    "switches": null,
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "work",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 7995,
    "priceNote": "Amazon.in",
    "rating": null,
    "tags": [
      "FPS",
      "Minecraft"
    ],
    "bestFor": "Low-friction aim and long competitive sessions",
    "verify": [
      "battery (70 h — added)",
      "accel (added)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates",
      "CPS level lowered to 3 while only the Model O and A70 are treated as top-CPS; confirm"
    ],
    "series": 2,
    "comfort": 4,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "dims": [
      125,
      63.5,
      40
    ],
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "glorious-model-o",
    "name": "Glorious Model O",
    "short": "Model O",
    "brand": "Glorious",
    "page": "mice/glorious-model-o.html",
    "img": "glorious-model-o",
    "weight": 67,
    "dpi": 12000,
    "ips": 250,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PMW3360",
    "switches": null,
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "poor"
    },
    "price": 6001,
    "priceNote": "Desertcart.in",
    "rating": 9.5,
    "tags": [
      "Minecraft"
    ],
    "bestFor": "Butterfly and jitter clicking, precise aim, a lighter feel",
    "variantNote": "Wired figures shown. The wireless Model O tracks up to 400+ IPS and 19,000 DPI.",
    "verify": [
      "weight (page said 68 g, compare table 67 g, retailer listing 67 g — 67 used)",
      "sensor (compare table said PixArt 3370; wired Model O uses PMW3360)",
      "accel (added)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates"
    ],
    "series": 3,
    "comfort": 3,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "debounce",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 5,
      "label": "Top CPS",
      "note": "Debounce can be lowered to 0 ms, so one finger movement can register as two clicks. That is what makes butterfly and jitter clicking so fast. Not the best for drag clicking.",
      "verified": true
    },
    "dims": [
      128,
      66,
      37.5
    ],
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff3cac",
      "holes": true,
      "sides": "left"
    }
  },
  {
    "id": "logitech-g502-hero",
    "name": "Logitech G502 HERO",
    "short": "G502 HERO",
    "brand": "Logitech G",
    "page": "mice/logitech-g502-hero.html",
    "img": "logitech-g502-hero",
    "weight": 121,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 11,
    "sensor": "Logitech HERO 25K",
    "switches": null,
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft",
      "work",
      "fps",
      "mmo"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 3190,
    "priceNote": "Modxcomputers.in (lowest trusted seller)",
    "rating": null,
    "tags": [
      "Minecraft",
      "MMO"
    ],
    "bestFor": "Custom buttons, strong sensor, jitter clicking",
    "variantNote": "Default weight 121 g; five 3.6 g weights can be added.",
    "verify": [
      "accel (added)",
      "price (the ₹2,299 seller flagged unsafe on the review page is excluded)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates"
    ],
    "series": 4,
    "comfort": 5,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "weights",
      "rgb"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "dims": [
      132,
      75,
      40
    ],
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": "#16b8ff",
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "bloody-a70",
    "name": "Bloody A70",
    "short": "Bloody A70",
    "brand": "Bloody",
    "page": "mice/bloody-a70.html",
    "img": "bloody-a70",
    "weight": 150,
    "dpi": 4000,
    "ips": null,
    "accel": null,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": null,
    "sensor": null,
    "switches": "Light Strike",
    "shape": null,
    "hand": null,
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "great"
    },
    "price": 8929,
    "priceNote": "Desertcart India",
    "rating": null,
    "tags": [
      "Minecraft"
    ],
    "bestFor": "Drag clicking and bridging practice",
    "variantNote": "Weight is quoted with the cable.",
    "verify": [
      "grips (editorial estimate)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates"
    ],
    "series": 5,
    "comfort": 2,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 5,
      "label": "Top CPS",
      "note": "Light Strike switches and a grippy button surface support extremely high drag-click scores, which makes it a favourite for bridging.",
      "verified": true
    },
    "dims": null,
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ff1f1f",
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "razer-cobra",
    "name": "Razer Cobra",
    "short": "Cobra",
    "brand": "Razer",
    "page": "mice/razer-cobra.html",
    "img": "razer-cobra",
    "weight": 58,
    "dpi": 8500,
    "ips": 300,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "Razer optical (8.5K)",
    "switches": null,
    "shape": null,
    "hand": null,
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": null,
      "drag": "poor"
    },
    "price": 2695,
    "priceNote": "From (see Minecraft picks)",
    "rating": null,
    "tags": [
      "FPS",
      "Minecraft"
    ],
    "bestFor": "Value-focused FPS and everyday play",
    "verify": [
      "weight, dpi, ips, accel, poll, buttons, sensor (all added — the review page had no spec numbers)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates"
    ],
    "series": 6,
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "dims": [
      119.6,
      62.5,
      38.1
    ],
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#44d62c",
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "logitech-g-pro-x2-superstrike",
    "name": "Logitech G PRO X2 SUPERSTRIKE",
    "short": "PRO X2 SUPERSTRIKE",
    "brand": "Logitech G",
    "page": "mice/logitech-g-pro-x2-superstrike.html",
    "img": "logitech-g-pro-x2-superstrike",
    "weight": 61,
    "dpi": 44000,
    "ips": null,
    "accel": null,
    "poll": 8000,
    "connection": "Wireless",
    "battery": null,
    "buttons": null,
    "sensor": "Logitech HERO 2",
    "switches": "HITS (Haptic Inductive Trigger System)",
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "poor",
      "drag": "poor"
    },
    "price": null,
    "priceNote": null,
    "rating": null,
    "tags": [
      "Minecraft"
    ],
    "bestFor": "Players who want to tune their own click feel",
    "verify": [
      "weight, dpi, poll, sensor (all added — the review page had no spec numbers)",
      "grips (editorial estimate)",
      "hand size fit, comfort, customisation tags and CPS level are editorial estimates",
      "CPS: owner confirmed it cannot double-click"
    ],
    "series": 7,
    "comfort": 4,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "haptics"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "dims": [
      125,
      63.5,
      40
    ],
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "logitech-g102-lightsync",
    "name": "Logitech G102 Lightsync",
    "short": "G102",
    "brand": "Logitech G",
    "page": "mice/logitech-g102-lightsync.html",
    "img": "art/logitech-g102-lightsync",
    "weight": 85,
    "dpi": 8000,
    "ips": 200,
    "accel": 30,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "Logitech Mercury 8K optical",
    "switches": "Mechanical",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      116.6,
      62.2,
      38.2
    ],
    "grips": [
      "claw",
      "fingertip",
      "palm"
    ],
    "games": [
      "minecraft",
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 1395,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Minecraft"
    ],
    "bestFor": "A cheap, reliable all-rounder",
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "Tested by ProMouser: it can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false,
      "tested": true
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#7b5cff",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Sold as the G203 outside India.",
    "series": 1
  },
  {
    "id": "logitech-g304-lightspeed",
    "name": "Logitech G304 Lightspeed",
    "short": "G304",
    "brand": "Logitech G",
    "page": "mice/logitech-g304-lightspeed.html",
    "img": "logitech-g304-lightspeed",
    "weight": 99,
    "dpi": 12000,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 250,
    "buttons": 6,
    "sensor": "Logitech HERO 12K",
    "switches": "Mechanical",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      116.6,
      62.2,
      38.2
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "work",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 2495,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Wireless"
    ],
    "bestFor": "Affordable wireless with a huge battery life",
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "macros"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "white",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Weight includes one AA battery. Sold as the G305 outside India.",
    "series": 2
  },
  {
    "id": "logitech-g502-x",
    "name": "Logitech G502 X",
    "short": "G502 X",
    "brand": "Logitech G",
    "page": "mice/logitech-g502-x.html",
    "img": "logitech-g502-x",
    "weight": 89,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 13,
    "sensor": "Logitech HERO 25K",
    "switches": "LIGHTFORCE hybrid optical-mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      131.4,
      79.2,
      41.1
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "mmo",
      "work",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 6495,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "MMO",
      "Productivity"
    ],
    "bestFor": "Lots of buttons in a much lighter G502 body",
    "comfort": 5,
    "handSize": [
      "large"
    ],
    "custom": [
      "software",
      "macros"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 3
  },
  {
    "id": "logitech-g502-x-plus",
    "name": "Logitech G502 X Plus",
    "short": "G502 X Plus",
    "brand": "Logitech G",
    "page": "mice/logitech-g502-x-plus.html",
    "img": "logitech-g502-x-plus",
    "weight": 106,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 130,
    "buttons": 13,
    "sensor": "Logitech HERO 25K",
    "switches": "LIGHTFORCE hybrid optical-mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      131.4,
      79.2,
      41.1
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "mmo",
      "work",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 13995,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "MMO",
      "Wireless"
    ],
    "bestFor": "The flagship wireless G502, with RGB",
    "comfort": 5,
    "handSize": [
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": "#16b8ff",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Battery life is up to 130 h with lighting off.",
    "series": 4
  },
  {
    "id": "logitech-g-pro-x-superlight-2",
    "name": "Logitech G PRO X Superlight 2",
    "short": "Superlight 2",
    "brand": "Logitech G",
    "page": "mice/logitech-g-pro-x-superlight-2.html",
    "img": "logitech-g-pro-x-superlight-2",
    "weight": 60,
    "dpi": 32000,
    "ips": 500,
    "accel": 40,
    "poll": 2000,
    "connection": "Wireless",
    "battery": 95,
    "buttons": 5,
    "sensor": "Logitech HERO 2",
    "switches": "LIGHTFORCE hybrid optical-mechanical",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      125,
      63.5,
      40
    ],
    "grips": [
      "claw",
      "fingertip",
      "palm"
    ],
    "games": [
      "fps",
      "work",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 13995,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Wireless"
    ],
    "bestFor": "Pro-level wireless FPS that weighs almost nothing",
    "comfort": 4,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "white",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "DPI/polling: firmware updates changed the published limits"
    ],
    "variantNote": "Launch figures shown. Logitech has since raised DPI and polling limits through firmware, so check G HUB for current numbers.",
    "series": 5
  },
  {
    "id": "logitech-g-pro-wireless",
    "name": "Logitech G Pro Wireless",
    "short": "G Pro Wireless",
    "brand": "Logitech G",
    "page": "mice/logitech-g-pro-wireless.html",
    "img": "logitech-g-pro-wireless",
    "weight": 80,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 60,
    "buttons": 8,
    "sensor": "Logitech HERO 25K",
    "switches": "Mechanical",
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "dims": [
      125,
      63.5,
      40
    ],
    "grips": [
      "claw",
      "palm",
      "fingertip"
    ],
    "games": [
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 8995,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Left-handed"
    ],
    "bestFor": "A truly ambidextrous wireless mouse for lefties and righties",
    "comfort": 4,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": true,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#16b8ff",
      "holes": false,
      "sides": "both"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Side buttons are removable and can go on either side (4 to 8 buttons).",
    "series": 6
  },
  {
    "id": "logitech-g703-lightspeed",
    "name": "Logitech G703 Lightspeed",
    "short": "G703",
    "brand": "Logitech G",
    "page": "mice/logitech-g703-lightspeed.html",
    "img": "logitech-g703-lightspeed",
    "weight": 95,
    "dpi": 25600,
    "ips": 400,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 60,
    "buttons": 6,
    "sensor": "Logitech HERO 25K",
    "switches": "Mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      124,
      68,
      43
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 7495,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Comfort",
      "Wireless"
    ],
    "bestFor": "A comfortable wireless palm-grip shape",
    "comfort": 5,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "weights",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#16b8ff",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Includes an optional 10 g weight.",
    "series": 7
  },
  {
    "id": "razer-viper-v3-pro",
    "name": "Razer Viper V3 Pro",
    "short": "Viper V3 Pro",
    "brand": "Razer",
    "page": "mice/razer-viper-v3-pro.html",
    "img": "razer-viper-v3-pro",
    "weight": 54,
    "dpi": 35000,
    "ips": 750,
    "accel": 70,
    "poll": 8000,
    "connection": "Wireless",
    "battery": 95,
    "buttons": 6,
    "sensor": "Razer Focus Pro 35K (Gen-2)",
    "switches": "Razer optical (Gen-3)",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      127.1,
      63.9,
      39.9
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "poor",
      "drag": "poor"
    },
    "price": 15999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Wireless"
    ],
    "bestFor": "Esports-grade wireless aim at 54 g",
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "8,000 Hz wireless needs the included HyperPolling dongle.",
    "series": 1
  },
  {
    "id": "razer-viper-mini",
    "name": "Razer Viper Mini",
    "short": "Viper Mini",
    "brand": "Razer",
    "page": "mice/razer-viper-mini.html",
    "img": "razer-viper-mini",
    "weight": 61,
    "dpi": 8500,
    "ips": 300,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "Razer optical 8.5K",
    "switches": "Razer optical (Gen-1)",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      118.3,
      53.5,
      38.3
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 2299,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Small hands"
    ],
    "bestFor": "Small, light and cheap",
    "comfort": 3,
    "handSize": [
      "small"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 1,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#44d62c",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 2
  },
  {
    "id": "razer-deathadder-essential",
    "name": "Razer DeathAdder Essential",
    "short": "DeathAdder Essential",
    "brand": "Razer",
    "page": "mice/razer-deathadder-essential.html",
    "img": "razer-deathadder-essential",
    "weight": 96,
    "dpi": 6400,
    "ips": 220,
    "accel": 30,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 5,
    "sensor": "Optical 6.4K",
    "switches": "Razer mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      127,
      73,
      43
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "work",
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 1299,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Comfort"
    ],
    "bestFor": "The classic DeathAdder shape at a budget price",
    "comfort": 5,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#44d62c",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 3
  },
  {
    "id": "razer-deathadder-v3-pro",
    "name": "Razer DeathAdder V3 Pro",
    "short": "DeathAdder V3 Pro",
    "brand": "Razer",
    "page": "mice/razer-deathadder-v3-pro.html",
    "img": "razer-deathadder-v3-pro",
    "weight": 63,
    "dpi": 30000,
    "ips": 750,
    "accel": 70,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 90,
    "buttons": 5,
    "sensor": "Razer Focus Pro 30K",
    "switches": "Razer optical (Gen-3)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      128,
      68,
      44
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "poor",
      "drag": "poor"
    },
    "price": 13999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Wireless"
    ],
    "bestFor": "The DeathAdder V3 shape without the cable",
    "comfort": 5,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "white",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Polling goes up to 4,000–8,000 Hz with Razer’s HyperPolling dongle.",
    "series": 4
  },
  {
    "id": "razer-basilisk-v3",
    "name": "Razer Basilisk V3",
    "short": "Basilisk V3",
    "brand": "Razer",
    "page": "mice/razer-basilisk-v3.html",
    "img": "razer-basilisk-v3",
    "weight": 101,
    "dpi": 26000,
    "ips": 650,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 11,
    "sensor": "Razer Focus+ 26K",
    "switches": "Razer optical (Gen-2)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      130,
      75.4,
      42.5
    ],
    "grips": [
      "palm"
    ],
    "games": [
      "mmo",
      "work",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 4999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "MMO",
      "Productivity"
    ],
    "bestFor": "11 buttons and a free-spinning scroll wheel",
    "comfort": 5,
    "handSize": [
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": "#44d62c",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 5
  },
  {
    "id": "razer-orochi-v2",
    "name": "Razer Orochi V2",
    "short": "Orochi V2",
    "brand": "Razer",
    "page": "mice/razer-orochi-v2.html",
    "img": "razer-orochi-v2",
    "weight": 60,
    "dpi": 18000,
    "ips": 450,
    "accel": 40,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 425,
    "buttons": 6,
    "sensor": "Razer 5G Advanced 18K",
    "switches": "Razer mechanical (Gen-2)",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      108,
      60,
      38
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "work",
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 5499,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Travel",
      "Wireless"
    ],
    "bestFor": "A tiny travel mouse with months of battery",
    "comfort": 3,
    "handSize": [
      "small"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "60 g without a battery; an AA adds about 11 g. Up to 950 h over Bluetooth.",
    "series": 6
  },
  {
    "id": "razer-naga-v2-hyperspeed",
    "name": "Razer Naga V2 HyperSpeed",
    "short": "Naga V2 HyperSpeed",
    "brand": "Razer",
    "page": "mice/razer-naga-v2-hyperspeed.html",
    "img": "razer-naga-v2-hyperspeed",
    "weight": 95,
    "dpi": 30000,
    "ips": 750,
    "accel": 70,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 400,
    "buttons": 19,
    "sensor": "Razer Focus Pro 30K",
    "switches": "Razer mechanical (Gen-2)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      119,
      75,
      43
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "mmo",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 8999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "MMO"
    ],
    "bestFor": "A 12-button thumb grid for MMOs and macros",
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "mmo",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 7
  },
  {
    "id": "glorious-model-o-minus",
    "name": "Glorious Model O-",
    "short": "Model O-",
    "brand": "Glorious",
    "page": "mice/glorious-model-o-minus.html",
    "img": "art/glorious-model-o-minus",
    "weight": 58,
    "dpi": 12000,
    "ips": 250,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PMW3360",
    "switches": "Omron mechanical",
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "dims": [
      122,
      63,
      36
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "minecraft",
      "fps"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "poor"
    },
    "price": 4999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Minecraft",
      "Small hands"
    ],
    "bestFor": "The Model O’s clicking in a smaller shell",
    "comfort": 3,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "debounce",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 4,
      "label": "Double clicks",
      "note": "The same switches and adjustable debounce as the Model O in a smaller, lighter shell, so it butterfly and jitter clicks very well. The full-size Model O stays our top pick.",
      "verified": true
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff3cac",
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 1
  },
  {
    "id": "glorious-model-d",
    "name": "Glorious Model D",
    "short": "Model D",
    "brand": "Glorious",
    "page": "mice/glorious-model-d.html",
    "img": "glorious-model-d",
    "weight": 68,
    "dpi": 12000,
    "ips": 250,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PMW3360",
    "switches": "Omron mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      128,
      67,
      42
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps",
      "minecraft",
      "work"
    ],
    "clicking": {
      "butterfly": "good",
      "jitter": "great",
      "drag": "poor"
    },
    "price": 5499,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Comfort",
      "Minecraft"
    ],
    "bestFor": "An ergonomic honeycomb shape that still clicks fast",
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "debounce",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 4,
      "label": "Double clicks",
      "note": "Glorious’ adjustable debounce in an ergonomic body: strong for jitter and butterfly if you prefer a palm-friendly shape.",
      "verified": true
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ff3cac",
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 2
  },
  {
    "id": "glorious-model-o-wireless",
    "name": "Glorious Model O Wireless",
    "short": "Model O Wireless",
    "brand": "Glorious",
    "page": "mice/glorious-model-o-wireless.html",
    "img": "glorious-model-o-wireless",
    "weight": 69,
    "dpi": 19000,
    "ips": 400,
    "accel": 50,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 71,
    "buttons": 6,
    "sensor": "Glorious BAMF 19K",
    "switches": "Omron mechanical",
    "shape": "Symmetrical",
    "hand": "Ambidextrous",
    "dims": [
      128,
      66,
      37.5
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 7999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Wireless",
      "Minecraft"
    ],
    "bestFor": "The Model O shape without a cable",
    "comfort": 3,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "debounce",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. It has an adjustable debounce setting, but ProMouser hasn’t verified that it actually double-clicks, so we rate it as capped until we have.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "white",
      "glow": "#ff3cac",
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 3
  },
  {
    "id": "glorious-model-i",
    "name": "Glorious Model I",
    "short": "Model I",
    "brand": "Glorious",
    "page": "mice/glorious-model-i.html",
    "img": "glorious-model-i",
    "weight": 69,
    "dpi": 19000,
    "ips": 400,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 9,
    "sensor": "Glorious BAMF 19K",
    "switches": "Mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      128,
      68,
      42
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "mmo",
      "work",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 5999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Productivity",
      "MMO"
    ],
    "bestFor": "Swappable side buttons for MMO and work binds",
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "debounce",
      "rgb"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. It has an adjustable debounce setting, but ProMouser hasn’t verified that it actually double-clicks, so we rate it as capped until we have.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": "#ff3cac",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 4
  },
  {
    "id": "bloody-a90",
    "name": "Bloody A90",
    "short": "Bloody A90",
    "brand": "Bloody",
    "page": "mice/bloody-a90.html",
    "img": "bloody-a90",
    "weight": 106,
    "dpi": 6200,
    "ips": null,
    "accel": 20,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 8,
    "sensor": "Optical 6.2K",
    "switches": "Light Strike (optical)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      126,
      68,
      44
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 2999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Minecraft",
      "Budget"
    ],
    "bestFor": "A budget Bloody for everyday play and 1.9+",
    "comfort": 3,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Its optical switches don’t bounce, so every press is exactly one click and butterfly or drag clicking can’t add extra ones.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ff1f1f",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "CPI: some listings say 4,000 (older version), most say 6,200"
    ],
    "variantNote": "106 g without the cable (about 143 g with it). Some click features need Bloody’s paid software activation.",
    "series": 5
  },
  {
    "id": "bloody-w70-max",
    "name": "Bloody W70 Max",
    "short": "W70 Max",
    "brand": "Bloody",
    "page": "mice/bloody-w70-max.html",
    "img": "bloody-w70-max",
    "weight": 108,
    "dpi": 10000,
    "ips": 250,
    "accel": 35,
    "poll": 2000,
    "connection": "Wired",
    "battery": null,
    "buttons": null,
    "sensor": "Bloody BC3332-A",
    "switches": "Mechanical (50M)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      126,
      74,
      43
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft",
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": null,
      "drag": "poor"
    },
    "price": 3499,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "RGB"
    ],
    "bestFor": "Bloody’s 10K-CPI RGB model",
    "comfort": 3,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "#e9c21a",
      "glow": "#ff1f1f",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "button count not published",
      "clicking ability unconfirmed"
    ],
    "variantNote": "108 g without the cable (about 145 g with it).",
    "series": 6
  },
  {
    "id": "steelseries-rival-3",
    "name": "SteelSeries Rival 3",
    "short": "Rival 3",
    "brand": "SteelSeries",
    "page": "mice/steelseries-rival-3.html",
    "img": "steelseries-rival-3",
    "weight": 77,
    "dpi": 8500,
    "ips": 300,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "SteelSeries TrueMove Core",
    "switches": "SteelSeries mechanical (60M)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      120.6,
      67,
      37.9
    ],
    "grips": [
      "claw",
      "palm",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 2299,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Minecraft"
    ],
    "bestFor": "A budget all-rounder with solid clicks",
    "comfort": 4,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff5a1f",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 7
  },
  {
    "id": "steelseries-aerox-3",
    "name": "SteelSeries Aerox 3",
    "short": "Aerox 3",
    "brand": "SteelSeries",
    "page": "mice/steelseries-aerox-3.html",
    "img": "steelseries-aerox-3",
    "weight": 57,
    "dpi": 8500,
    "ips": 300,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "SteelSeries TrueMove Core",
    "switches": "SteelSeries Golden Micro IP54",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      120.6,
      67,
      38
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 3499,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Ultralight"
    ],
    "bestFor": "A water-resistant honeycomb ultralight",
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff5a1f",
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 1
  },
  {
    "id": "hyperx-pulsefire-haste",
    "name": "HyperX Pulsefire Haste",
    "short": "Pulsefire Haste",
    "brand": "HyperX",
    "page": "mice/hyperx-pulsefire-haste.html",
    "img": "hyperx-pulsefire-haste",
    "weight": 59,
    "dpi": 16000,
    "ips": 450,
    "accel": 40,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PAW3335",
    "switches": "TTC Golden micro (dustproof)",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      124.2,
      66.8,
      38.2
    ],
    "grips": [
      "claw",
      "fingertip",
      "palm"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 3299,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Minecraft",
      "Ultralight"
    ],
    "bestFor": "A light honeycomb shell for FPS and 1.9+ PvP",
    "comfort": 4,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff2340",
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 2
  },
  {
    "id": "hyperx-pulsefire-haste-2",
    "name": "HyperX Pulsefire Haste 2",
    "short": "Pulsefire Haste 2",
    "brand": "HyperX",
    "page": "mice/hyperx-pulsefire-haste-2.html",
    "img": "hyperx-pulsefire-haste-2",
    "weight": 53,
    "dpi": 26000,
    "ips": 650,
    "accel": 50,
    "poll": 8000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "HyperX 26K",
    "switches": "HyperX switches",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      124.3,
      66.8,
      38.2
    ],
    "grips": [
      "claw",
      "fingertip",
      "palm"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "good"
    },
    "price": 4499,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Ultralight"
    ],
    "bestFor": "A solid-shell ultralight with 8K polling",
    "comfort": 4,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 4,
      "label": "Double clicks",
      "note": "Verified by ProMouser to double-click: light, quick and crisp, so butterfly and jitter clicks register extra clicks. A great all-rounder for both 1.8 and 1.9+ PvP.",
      "verified": true
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": "#ff2340",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 3
  },
  {
    "id": "zowie-ec2-c",
    "name": "Zowie EC2-C",
    "short": "EC2-C",
    "brand": "Zowie",
    "page": "mice/zowie-ec2-c.html",
    "img": "zowie-ec2-c",
    "weight": 73,
    "dpi": 3200,
    "ips": null,
    "accel": null,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 5,
    "sensor": "PixArt 3360",
    "switches": "Huano",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      120,
      64,
      42
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 6490,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Plug and play"
    ],
    "bestFor": "No-software esports ergonomics",
    "comfort": 5,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [],
    "customLevel": 0,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Zowie only publishes DPI steps (400 / 800 / 1600 / 3200).",
    "series": 4
  },
  {
    "id": "cooler-master-mm710",
    "name": "Cooler Master MM710",
    "short": "MM710",
    "brand": "Cooler Master",
    "page": "mice/cooler-master-mm710.html",
    "img": "cooler-master-mm710",
    "weight": 53,
    "dpi": 16000,
    "ips": 400,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PMW3389",
    "switches": "Omron",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      116.6,
      62.6,
      38.3
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 2999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Ultralight",
      "Minecraft"
    ],
    "bestFor": "A 53 g honeycomb mouse on a budget",
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "black",
      "glow": null,
      "holes": true,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 5
  },
  {
    "id": "endgame-gear-xm1r",
    "name": "Endgame Gear XM1r",
    "short": "XM1r",
    "brand": "Endgame Gear",
    "page": "mice/endgame-gear-xm1r.html",
    "img": "endgame-gear-xm1r",
    "weight": 63,
    "dpi": 19000,
    "ips": 400,
    "accel": 50,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 5,
    "sensor": "PixArt PAW3370",
    "switches": "Kailh GM 8.0",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      122,
      66,
      38
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 5999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Minecraft",
      "Clicking"
    ],
    "bestFor": "Crisp, low-latency clicks for FPS and jitter clicking",
    "comfort": 3,
    "handSize": [
      "medium"
    ],
    "custom": [
      "software",
      "debounce"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. It has an adjustable debounce setting, but ProMouser hasn’t verified that it actually double-clicks, so we rate it as capped until we have.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "white",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "weight: some listings say 70 g (original XM1)"
    ],
    "series": 6
  },
  {
    "id": "corsair-harpoon-rgb-pro",
    "name": "Corsair Harpoon RGB Pro",
    "short": "Harpoon RGB Pro",
    "brand": "Corsair",
    "page": "mice/corsair-harpoon-rgb-pro.html",
    "img": "corsair-harpoon-rgb-pro",
    "weight": 85,
    "dpi": 12000,
    "ips": 300,
    "accel": 35,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 6,
    "sensor": "PixArt PMW3327",
    "switches": "Mechanical",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      111,
      69,
      40
    ],
    "grips": [
      "claw",
      "palm"
    ],
    "games": [
      "work",
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 1999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Small hands"
    ],
    "bestFor": "A small, grippy budget mouse",
    "comfort": 4,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ffd200",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "series": 7
  },
  {
    "id": "corsair-m65-rgb-ultra",
    "name": "Corsair M65 RGB Ultra",
    "short": "M65 RGB Ultra",
    "brand": "Corsair",
    "page": "mice/corsair-m65-rgb-ultra.html",
    "img": "corsair-m65-rgb-ultra",
    "weight": 97,
    "dpi": 26000,
    "ips": 650,
    "accel": 50,
    "poll": 8000,
    "connection": "Wired",
    "battery": null,
    "buttons": 8,
    "sensor": "Corsair Marksman 26K",
    "switches": "Corsair Quickstrike (Omron)",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      116.5,
      76.9,
      39
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "fps",
      "work"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 6999,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "FPS",
      "Adjustable weight"
    ],
    "bestFor": "Tunable weight and a sniper button",
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "weights",
      "rgb"
    ],
    "customLevel": 3,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "note": "It can’t double-click. Like most mice, its firmware ignores a second press that comes too soon after the first (debounce), so butterfly and drag clicks get merged into single clicks.",
      "verified": false
    },
    "lefty": false,
    "art": {
      "shape": "wing",
      "body": "black",
      "glow": "#ffd200",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms"
    ],
    "variantNote": "Removable weights let you tune it from about 97 g to 115 g.",
    "series": 1
  },
  {
    "id": "redragon-m711-cobra",
    "name": "Redragon M711 Cobra",
    "short": "M711 Cobra",
    "brand": "Redragon",
    "page": "mice/redragon-m711-cobra.html",
    "img": "redragon-m711-cobra",
    "weight": 100,
    "dpi": 10000,
    "ips": null,
    "accel": null,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 7,
    "sensor": "PixArt PMW3325",
    "switches": "Huano",
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "dims": [
      127,
      66,
      40
    ],
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft",
      "work",
      "fps"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "great"
    },
    "price": 1299,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "RGB"
    ],
    "bestFor": "The classic cheap RGB mouse, and it drag clicks",
    "comfort": 3,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 3,
      "label": "Drag clicks",
      "verified": false,
      "drag": true,
      "tested": true,
      "note": "Verified by ProMouser to drag click well, so it’s a cheap pick for bridging. Butterfly clicking doesn’t add much on it, though."
    },
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ff2a2a",
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "DPI and weight vary by listing (100 g without cable)"
    ],
    "variantNote": "The sensor’s native limit is about 5,000 DPI; 10,000 is the software-scaled figure.",
    "series": 2
  },
  {
    "id": "attack-shark-x3",
    "name": "Attack Shark X3",
    "short": "Attack Shark X3",
    "brand": "Attack Shark",
    "page": "mice/attack-shark-x3.html",
    "img": "attack-shark-x3",
    "weight": 49,
    "dpi": 26000,
    "ips": 650,
    "accel": 50,
    "poll": 1000,
    "connection": "Wireless",
    "battery": 200,
    "buttons": 6,
    "sensor": "PixArt PAW3395",
    "switches": "Kailh GM 8.0",
    "shape": "Symmetrical",
    "hand": "Right-handed",
    "dims": [
      118.5,
      61,
      39.7
    ],
    "grips": [
      "claw",
      "fingertip"
    ],
    "games": [
      "fps",
      "minecraft"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "good"
    },
    "price": 2799,
    "priceNote": "Approx. India street price, Oct 2026",
    "rating": null,
    "tags": [
      "Budget",
      "Wireless",
      "Ultralight"
    ],
    "bestFor": "A flagship sensor at 49 g for very little money",
    "comfort": 3,
    "handSize": [
      "small",
      "medium"
    ],
    "custom": [
      "software"
    ],
    "customLevel": 1,
    "cps": {
      "level": 4,
      "label": "Double clicks",
      "verified": true,
      "note": "Verified by ProMouser to double-click, so butterfly and jitter clicks register extra clicks, in a 49 g wireless shell for under ₹3,000."
    },
    "lefty": false,
    "art": {
      "shape": "sym",
      "body": "#d9d9e0",
      "glow": null,
      "holes": false,
      "sides": "left"
    },
    "verify": [
      "added in the catalogue expansion: specs from manufacturer/retailer listings, price is an approximate street price",
      "grip, hand-size, comfort and CPS/clicking ratings are editorial estimates; CPS for new mice is capped at 4 until the owner confirms",
      "battery: 200 h is the maker’s claim; reviewers report less",
      "weight is ±3 g by colour"
    ],
    "series": 3
  },
  {
    "id": "ant-esports-gm320",
    "name": "Ant Esports GM320",
    "short": "GM320",
    "brand": "Ant Esports",
    "page": "mice/ant-esports-gm320.html",
    "img": "ant-esports-gm320",
    "weight": 120,
    "dpi": 12800,
    "ips": null,
    "accel": null,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 8,
    "sensor": null,
    "switches": null,
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "minecraft",
      "fps",
      "mmo"
    ],
    "clicking": {
      "butterfly": "great",
      "jitter": "great",
      "drag": "good"
    },
    "price": 498,
    "priceNote": "Amazon.in",
    "buy": "https://www.amazon.in/s?k=Ant+Esports+GM320+RGB+Gaming+Mouse",
    "rating": null,
    "tags": [
      "Budget",
      "Minecraft"
    ],
    "bestFor": "Double-clicking on a tight budget",
    "variantNote": "Ant Esports doesn’t publish the weight; 120 g is our estimate (retail listings say 185 g, which includes the box). Listings quote 7,200 to 12,800 DPI depending on the batch.",
    "caveat": "Build quality and the stock skates are a step below the other double-clicking mice: it glides less smoothly and feels less solid.",
    "verify": [
      "weight (estimate; not published by Ant Esports)",
      "dpi (listings say 7,200 or 12,800)",
      "sensor and switch models not published",
      "CPS: verified by ProMouser to double-click"
    ],
    "series": 3,
    "comfort": 3,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 4,
      "label": "Double clicks",
      "note": "Verified by ProMouser to double-click, so butterfly and jitter clicking register extra clicks, at under ₹500. Its build quality and skates are a step below the Model O, A70 and Haste 2, which is why it isn’t a 5.",
      "verified": true
    },
    "dims": null,
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#ff2bd6",
      "holes": false,
      "sides": "left"
    }
  },
  {
    "id": "kreo-hawk",
    "name": "Kreo Hawk",
    "short": "Hawk",
    "brand": "Kreo",
    "page": "mice/kreo-hawk.html",
    "img": "kreo-hawk",
    "weight": 110,
    "dpi": 12400,
    "ips": null,
    "accel": 30,
    "poll": 1000,
    "connection": "Wired",
    "battery": null,
    "buttons": 8,
    "sensor": "PixArt PAW3327",
    "switches": null,
    "shape": "Ergonomic",
    "hand": "Right-handed",
    "grips": [
      "palm",
      "claw"
    ],
    "games": [
      "work",
      "fps",
      "mmo"
    ],
    "clicking": {
      "butterfly": "poor",
      "jitter": "good",
      "drag": "poor"
    },
    "price": 1199,
    "priceNote": "Flipkart",
    "buy": "https://www.flipkart.com/search?q=kreo+hawk+gaming+mouse",
    "rating": null,
    "tags": [
      "Budget",
      "Comfort"
    ],
    "bestFor": "A comfy budget ergonomic mouse with RGB",
    "variantNote": "Kreo lists about 110 g and 125 × 80 × 46 mm. Prices vary between ₹1,149 and ₹1,433 by seller.",
    "verify": [
      "weight and dimensions from Kreo's product page",
      "CPS: tested by ProMouser, it can't double-click"
    ],
    "series": 6,
    "comfort": 4,
    "handSize": [
      "medium",
      "large"
    ],
    "custom": [
      "software",
      "macros",
      "rgb"
    ],
    "customLevel": 2,
    "cps": {
      "level": 1,
      "label": "Can’t double-click",
      "verified": false,
      "tested": true,
      "note": "Tested by ProMouser: it can’t double-click, so butterfly and drag clicks merge into single clicks. A comfortable everyday and FPS mouse rather than a 1.8 PvP clicker."
    },
    "dims": [
      125,
      80,
      46
    ],
    "lefty": false,
    "art": {
      "shape": "ergo",
      "body": "black",
      "glow": "#8b5cf6",
      "holes": false,
      "sides": "left"
    }
  }
];

/* Non-spec items kept so the old "extra picks" pages stay linked */
window.PM_EXTRA = [
  { "id": "office-mouse", "name": "Office mouse", "page": "mice/extra/office-mouse.html", "img": "office-mouse", "price": 35.12, "note": "Generic wired optical office mouse (no spec sheet published)" },
  { "id": "wired-optical-mouse", "name": "Wired Optical Mouse", "page": "mice/extra/wired-optical-mouse.html", "img": "wired-optical-mouse", "price": null, "note": "Legacy page — out of stock" }
];
