/* =====================================================================
   ProMouser: Recommendation Assistant  (mouse-ai.html)

   A conversational helper that runs entirely in the browser on the same
   data as the rest of the site (mice-data.js + the fit engine in stats.js).
   It understands:
     • what you play, grip, hand size (S/M/L or cm/inches), budget in ₹ or $,
       weight, wired/wireless, left-handed, buttons, click style, brand
     • questions about one mouse: "how heavy is the A70?", "is the Viper V3 Pro
       good for Minecraft?", "can the G102 butterfly click?"
     • comparisons: "Model O vs G102", "compare the first two"
     • alternatives: "something cheaper than the Superlight 2", "a wireless G102"
     • lists: "lightest wireless mice under ₹5,000", "which mice can drag click"
     • concepts: DPI, polling rate, debounce, butterfly/jitter/drag, grips…
     • follow-ups: "cheaper", "lighter", "show more", "why that one?"
   It remembers the conversation for this browser tab.
   ===================================================================== */
(() => {
  'use strict';
  const host = document.querySelector('[data-assistant]');
  if (!host || !window.PM) return;
  const PM = window.PM, MICE = PM.MICE, byId = PM.byId, B = window.PMBackend;
  const { esc, inr, num, cap } = PM;
  const root = document.documentElement.dataset.root || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const USD = 88;   // ₹ per $ for "under $50" style budgets (approximate)
  const KEY = 'pm_assistant';

  /* =============================== 1. understanding text =============================== */
  const norm = s => ' ' + String(s).toLowerCase()
    .replace(/[’`]/g, "'").replace(/₹\s*/g, ' ₹').replace(/rs\.?\s*(?=\d)/g, ' ₹').replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/[^a-z0-9₹$.+\-'\s"]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

  // aliases people actually type
  const ALIAS = {
    'razer-deathadder-v3': ['deathadder v3', 'da v3', 'deathadder 3', 'dav3', 'deathadder', 'death adder'],
    'logitech-superlight-pro-x': ['superlight pro x', 'gpx superlight', 'g pro x superlight', 'pro x superlight', 'superlight 1', 'superlight one', 'gpx'],
    'glorious-model-o': ['model o', 'model 0', 'glorious o'],
    'logitech-g502-hero': ['g502 hero', 'g502', 'g 502'],
    'bloody-a70': ['a70', 'a 70'],
    'razer-cobra': ['razer cobra', 'cobra'],
    'logitech-g-pro-x2-superstrike': ['superstrike', 'pro x2', 'x2 superstrike'],
    'logitech-g102-lightsync': ['g102', 'g203', 'g 102', 'g 203'],
    'logitech-g304-lightspeed': ['g304', 'g305', 'g 304', 'g 305'],
    'logitech-g502-x': ['g502 x', 'g502x'],
    'logitech-g502-x-plus': ['g502 x plus', 'g502x plus', 'g502 x+'],
    'logitech-g-pro-x-superlight-2': ['superlight', 'superlite', 'super light', 'g pro x superlight 2', 'gpx superlight 2', 'pro x superlight 2', 'superlight 2', 'superlight2', 'gpx2', 'gpx 2', 'superlight two', 'superlite 2', 'super light 2'],
    'logitech-g-pro-wireless': ['g pro wireless', 'gpw', 'pro wireless'],
    'logitech-g703-lightspeed': ['g703', 'g 703'],
    'razer-viper-v3-pro': ['viper v3 pro', 'viper v3', 'v3 pro', 'viper', 'viper pro'],
    'razer-viper-mini': ['viper mini'],
    'razer-deathadder-essential': ['deathadder essential', 'da essential'],
    'razer-deathadder-v3-pro': ['deathadder v3 pro', 'da v3 pro'],
    'razer-basilisk-v3': ['basilisk v3', 'basilisk'],
    'razer-orochi-v2': ['orochi v2', 'orochi'],
    'razer-naga-v2-hyperspeed': ['naga v2', 'naga'],
    'glorious-model-o-minus': ['model o-', 'model o -', 'model o minus', 'model o mini'],
    'glorious-model-d': ['model d'],
    'glorious-model-o-wireless': ['model o wireless', 'wireless model o'],
    'glorious-model-i': ['model i'],
    'bloody-a90': ['a90', 'a 90'],
    'bloody-w70-max': ['w70 max', 'w70'],
    'steelseries-rival-3': ['rival 3', 'rival3'],
    'steelseries-aerox-3': ['aerox 3', 'aerox'],
    'hyperx-pulsefire-haste': ['pulsefire haste', 'haste'],
    'hyperx-pulsefire-haste-2': ['pulsefire haste 2', 'haste 2'],
    'zowie-ec2-c': ['ec2-c', 'ec2 c', 'ec2c', 'ec2', 'zowie'],
    'cooler-master-mm710': ['mm710', 'mm 710'],
    'endgame-gear-xm1r': ['xm1r', 'xm1'],
    'corsair-harpoon-rgb-pro': ['harpoon'],
    'corsair-m65-rgb-ultra': ['m65'],
    'redragon-m711-cobra': ['m711', 'redragon cobra', 'redragon'],
    'attack-shark-x3': ['attack shark x3', 'attack shark', 'x3']
  };
  const BRAND_WORDS = m => m.brand.toLowerCase().split(' ');
  const ALIASES = [];
  MICE.forEach(m => {
    const set = new Set([m.name, m.short].map(x => norm(x).trim()));
    let bare = norm(m.name).trim(); BRAND_WORDS(m).forEach(w => { bare = bare.replace(new RegExp('^' + w + '\\b\\s*'), ''); });
    if (bare.length > 2) set.add(bare);
    (ALIAS[m.id] || []).forEach(a => set.add(norm(a).trim()));
    set.forEach(a => a && ALIASES.push([a, m.id]));
  });
  ALIASES.sort((a, b) => b[0].length - a[0].length);
  const VOCAB = [...new Set(ALIASES.flatMap(([a]) => a.split(' ')).filter(w => w.length >= 5 && /^[a-z]+$/.test(w)))];
  const BRANDS = [...new Set(MICE.map(m => m.brand))];

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // fix typos in mouse names ("deathader", "superlite") before matching
  const COMMON = new Set(['wireless', 'mouse', 'minecraft', 'gaming', 'better', 'claw', 'light', 'weight', 'butterfly', 'button', 'buttons', 'hands', 'which', 'would', 'should', 'cheap', 'cheaper', 'lighter', 'under', 'about', 'there', 'their', 'small', 'large', 'model', 'compare', 'versus', 'between', 'click', 'clicking', 'sensor', 'great', 'price', 'really', 'something', 'heavy', 'heavier', 'matter', 'faster', 'right', 'tight', 'night', 'fight', 'might', 'sight', 'water', 'later', 'after', 'other', 'order', 'master']);
  function spell(t) {
    return t.replace(/[a-z]{5,}/g, w => {
      if (COMMON.has(w) || VOCAB.includes(w)) return w;
      let best = null, bd = 9; VOCAB.forEach(v => { const d = lev(w, v); if (d < bd) { bd = d; best = v; } });
      return best && bd <= (w.length >= 8 ? 2 : 1) ? best : w;
    });
  }

  function findMice(t) {
    const hits = [], taken = [];
    for (const [a, id] of ALIASES) {
      const re = new RegExp('(?:^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9])', 'g');
      let mm;
      while ((mm = re.exec(t))) {
        const s = mm.index + (mm[0].length - a.length), e = s + a.length;
        if (taken.some(([x, y]) => s < y && e > x)) continue;
        taken.push([s, e]); hits.push([s, id]);
      }
    }
    return [...new Set(hits.sort((x, y) => x[0] - y[0]).map(h => h[1]))].map(id => byId[id]);
  }

  const has = (t, re) => re.test(t);
  const GAME_RE = {
    fps: /\b(fps|shooters?|valorant|valo|cs2|csgo|cs ?go|counter ?strike|apex|fortnite|overwatch|ow2|cod|warzone|call of duty|r6|siege|rainbow six|pubg|bgmi|free ?fire|tarkov|aim|aiming|tf2|halo|the finals|marvel rivals|battlefield)\b/,
    minecraft: /\b(minecraft|mc|bedwars|bed wars|skywars|hypixel|pvp|bridging|bridge|uhc|1\.8|1\.9|lunar|badlion|pika|minemen|clutch)\b/,
    mmo: /\b(mmo|mmos|moba|mobas|wow|warcraft|league of legends|lol|dota|ffxiv|final fantasy|genshin|lost ark|rpg|elden ring|diablo|path of exile|poe|arpg|rts|starcraft)\b/,
    work: /\b(office|for work|at work|work use|work and|and work|wfh|working from home|coding|programming|excel|study|studying|school|college|editing|photoshop|premiere|design work|blender|productivity|browsing|daily use|everyday use)\b/
  };

  function money(t) {
    // returns ₹ or null; "$50", "50 dollars", "₹3000", "3k", "3.5k rupees"
    const re = /(?:(under|below|less than|max(?:imum)?|up ?to|within|budget(?: is| of)?|around|about|approx(?:imately)?|cheaper than|not more than|no more than|<|at most|only have|spend)\s*)(₹|\$)?\s*(\d+(?:\.\d+)?)\s*(k\b|thousand)?\s*(₹|rupees?|rs|inr|\$|dollars?|usd|bucks)?/;
    const m = t.match(re);
    if (!m) { const b = t.match(/(₹)\s*(\d+(?:\.\d+)?)\s*(k\b)?|(\d+(?:\.\d+)?)\s*(k\b)?\s*(rupees|rs|inr)\b/); if (!b) return null; const v = parseFloat(b[2] || b[4]) * ((b[3] || b[5]) ? 1000 : 1); return { max: v, word: 'about' }; }
    let v = parseFloat(m[3]) * (m[4] ? 1000 : 1);
    const usd = m[2] === '$' || /\$|dollar|usd|buck/.test(m[5] || '');
    if (usd || (!m[2] && !m[5] && v < 400)) v = Math.round(v * USD / 100) * 100;
    if (/around|about|approx/.test(m[1])) v = Math.round(v * 1.15 / 100) * 100;
    return { max: v, usd: usd || (!m[2] && !m[5] && parseFloat(m[3]) < 400 && !m[4]), raw: m[0], word: m[1] };
  }

  function extract(raw) {
    const t = spell(norm(raw)), p = {}, said = [];
    const games = Object.keys(GAME_RE).filter(g => has(t, GAME_RE[g]));
    if (games.length) { p.games = games; }
    if (has(t, /\b1\.8\b|old pvp|legacy pvp|hypixel|bedwars|bed wars|skywars|butterfly|jitter|drag click|high cps/)) p.mcVersion = '1.8';
    if (has(t, /\b1\.(9|1\d|2\d)\b|cooldown|new pvp|modern pvp/)) p.mcVersion = '1.9+';
    // Hinglish: "2000 tak", "3k ke andar", "5000 se kam" all mean "under"
    const b = money(t.replace(/(\d+(?:\.\d+)?\s*k?)\s*(?:rs |rupees |₹ )?(?:tak|tk|ke andar|ke niche|ke neeche|se kam|ke under)\b/g, 'under $1'));
    const noBudget = has(t, /\b(no budget|no limit|money is no|any price|premium|flagship|best money can buy|price doesn'?t matter|budget doesn'?t matter|money doesn'?t matter|any budget)\b/);
    if (b && b.max >= 300) { p.budgetMax = b.max; if (b.usd) said.push(`I read that budget as about ${inr(b.max)}.`); }
    else if (!noBudget && has(t, /\b(cheap|cheapest|budget|affordable|low price|inexpensive|broke|sasta|saste|sasti|kam price)\b/) && !has(t, /\bbudget (is|of)\b/)) p.cheap = true;
    if (noBudget) { p.budgetMax = null; p.noBudget = true; }
    if (has(t, /\b(long hours|all day|hours a day|long sessions?|comfortable|comfort|comfy|wrist pain|hand pain|carpal)\b/)) p.comfort = true;
    const wmax = t.match(/(?:under|below|less than|lighter than|max|at most)\s*(\d{2,3})\s*(?:g|gm|gms|grams?)\b/);
    if (wmax) { p.maxWeight = +wmax[1]; p.weight = 'light'; }
    else if (has(t, /\b(ultra ?light|ultralight|super light|lightweight|light weight|light mouse|light one|featherweight|as light as|lightest|light)\b/) && !has(t, /\b(light ?strike|lighting|rgb light)\b/)) p.weight = 'light';
    else if (has(t, /\b(heavy|heavier|weighty|solid feel|planted|hefty)\b/)) p.weight = 'heavy';
    else if (has(t, /\b(balanced|medium weight|middle weight|not too light|not too heavy)\b/)) p.weight = 'balanced';
    if (has(t, /\bfinger ?tip\b/)) p.grip = 'fingertip'; else if (has(t, /\bclaw\b/)) p.grip = 'claw'; else if (has(t, /\bpalm\b/)) p.grip = 'palm';
    const cm = t.match(/(\d{2}(?:\.\d)?)\s*(?:cm|centimet(?:er|re)s?)\b/), inch = t.match(/(\d(?:\.\d{1,2})?)\s*(?:in|inch|inches|")(?=\s|$)/);
    if (cm && has(t, /hand|palm|finger|cm/) && +cm[1] >= 13 && +cm[1] <= 25) p.handLength = +cm[1];
    else if (inch && has(t, /hand/) && +inch[1] >= 5 && +inch[1] <= 10) { p.handLength = Math.round(+inch[1] * 2.54 * 2) / 2; said.push(`That’s about ${p.handLength} cm.`); }
    if (has(t, /\b(small|tiny|little) hands?\b|\bhands? (are|is) (small|tiny)/)) p.handSize = 'small';
    else if (has(t, /\b(big|large|huge|long) hands?\b|\bhands? (are|is) (big|large|huge)/)) p.handSize = 'large';
    else if (has(t, /\b(medium|average|normal) (sized )?hands?\b/)) p.handSize = 'medium';
    if (has(t, /\b(left[ -]?hand(ed)?|lefty|lefthanded|left hand user|i'?m left)\b/)) p.lefty = true;
    if (has(t, /\b(wireless|cordless|no cable|without (a )?cable|bluetooth|no wire)\b/)) p.connection = 'wireless';
    else if (has(t, /\b(wired|cable|corded|with a wire)\b/)) p.connection = 'wired';
    const btn = t.match(/(\d{1,2})\s*\+?\s*(?:programmable )?buttons/);
    if (btn) p.minButtons = +btn[1];
    else if (has(t, /\b(lots of|many|tons of|loads of|extra|more) buttons\b|\bmacros?\b|\bmmo grid\b/)) p.minButtons = 8;
    if (has(t, /\bbutterfly\b/)) p.clickStyle = 'butterfly'; else if (has(t, /\bjitter\b/)) p.clickStyle = 'jitter'; else if (has(t, /\bdrag ?click/)) p.clickStyle = 'drag';
    if ((p.clickStyle || has(t, /\b(high cps|more cps)\b/)) && !p.games) p.games = ['minecraft'];   // click techniques are a Minecraft thing
    if (has(t, /\b(symmetrical|ambidextrous|ambi)\b/)) p.shape = 'symmetrical'; else if (has(t, /\b(ergonomic|ergo|right[ -]handed shape)\b/)) p.shape = 'ergonomic';
    if (has(t, /\b(8k|8000 ?hz|4k polling|high polling|8000)\b/)) p.minPoll = 4000;
    const custom = []; if (has(t, /\brgb\b/)) custom.push('rgb'); if (has(t, /\bdebounce\b/)) custom.push('debounce'); if (has(t, /\b(adjustable|removable) weights?\b/)) custom.push('weights');
    if (custom.length) p.custom = custom;
    const brands = BRANDS.filter(br => t.includes(' ' + br.toLowerCase().replace(' g', '') + ' ') || t.includes(' ' + br.toLowerCase() + ' '));
    if (brands.length && !findMice(t).length) p.brands = brands;
    return { t, p, said };
  }

  const LABEL = {
    games: v => v.map(g => ({ fps: 'FPS', minecraft: 'Minecraft', mmo: 'MMO / MOBA', work: 'Work' })[g] || g).join(' + '),
    mcVersion: v => (v === '1.8' ? '1.8 PvP' : '1.9+ combat'), budgetMax: v => 'Under ' + inr(v), cheap: () => 'Budget (under ₹3,000)', weight: v => cap(v) + ' weight', maxWeight: v => `Under ${v} g`,
    grip: v => cap(v) + ' grip', handLength: v => v + ' cm hand', handSize: v => cap(v) + ' hands', lefty: () => 'Left-handed', connection: v => cap(v),
    minButtons: v => v + '+ buttons', clickStyle: v => cap(v) + ' clicking', shape: v => cap(v), comfort: () => 'Comfort first', minPoll: () => '4K+ polling', custom: v => v.map(c => ({ rgb: 'RGB', debounce: 'Debounce', weights: 'Weights' })[c]).join(', '), brands: v => v.join(' / ')
  };

  /* =============================== 2. memory =============================== */
  let ctx = { prefs: {}, last: [], focus: null, offset: 0, seeded: false, log: [] };
  try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && s.v === 2) ctx = { ...ctx, ...s.ctx }; } catch (e) { /* new tab */ }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ v: 2, ctx: { ...ctx, log: ctx.log.slice(-30) } })); } catch (e) { /* storage off */ } };
  function seedFromAccount() {
    const u = B && B.getUser && B.getUser(); if (!u || ctx.seeded || Object.keys(ctx.prefs).length) return false;
    const pr = u.prefs || {}, g = (pr.games || []).map(x => (x === 'office' || x === 'creative' ? 'work' : x));
    if (g.length) ctx.prefs.games = [...new Set(g)];
    if (pr.weight && pr.weight !== 'any') ctx.prefs.weight = pr.weight;
    if (pr.grip && pr.grip !== 'any') ctx.prefs.grip = pr.grip;
    if (pr.connection && pr.connection !== 'any') ctx.prefs.connection = pr.connection;
    ctx.seeded = true; return Object.keys(ctx.prefs).length > 0;
  }

  /* =============================== 3. engine helpers =============================== */
  const toEngine = p => ({ games: p.games || [], weight: p.weight || 'any', grip: p.grip || 'any', connection: p.connection || 'any', mcVersion: p.mcVersion || 'any',
    handSize: p.handSize || 'any', handLength: p.handLength || null, lefty: !!p.lefty, budgetMax: p.budgetMax || null, minButtons: p.minButtons || 0,
    custom: p.custom || [], clickStyle: p.clickStyle || 'any', shape: p.shape || 'any' });
  function hardFilter(list, p) {
    return list.filter(r => {
      const m = r.m || r;
      if (p.budgetMax && (!m.price || m.price > p.budgetMax)) return false;
      if (p.cheap && (!m.price || m.price > 3000)) return false;
      if (p.maxWeight && m.weight > p.maxWeight) return false;
      if (p.connection && m.connection.toLowerCase() !== p.connection) return false;
      if (p.lefty && !(m.lefty || m.shape === 'Symmetrical')) return false;
      if (p.brands && !p.brands.includes(m.brand)) return false;
      if (p.minPoll && m.poll < p.minPoll) return false;
      if (p.minButtons && (m.buttons || 0) < p.minButtons) return false;
      if (p.shape && m.shape && m.shape.toLowerCase() !== p.shape) return false;
      if (p.custom && p.custom.includes('rgb') && !m.custom.includes('rgb')) return false;
      return true;
    });
  }
  // overall quality from real specs, used when someone asks "best mouse" with nothing to personalise on
  function merit(m) {
    const sensor = m.ips == null ? .55 : m.ips >= 650 ? 1 : m.ips >= 400 ? .88 : m.ips >= 300 ? .75 : .6;
    const weight = m.weight <= 65 ? 1 : m.weight <= 80 ? .85 : m.weight <= 100 ? .65 : .45;
    return .3 * sensor + .2 * weight + .25 * (m.comfort / 5) + .15 * (m.cps.level / 5) + .1 * (m.poll >= 4000 ? 1 : .8);
  }
  // prefs the fit engine can score a mouse on (budget, connection and max weight only filter)
  const SCORED = ['games', 'grip', 'weight', 'handLength', 'handSize', 'lefty', 'minButtons', 'custom', 'clickStyle', 'shape'];
  const scorable = p => SCORED.some(k => p[k] && p[k] !== 'any' && !(Array.isArray(p[k]) && !p[k].length));
  function rank(p) {
    let list = scorable(p) ? PM.recommend(toEngine(p))
      : MICE.map(m => ({ m, score: null, parts: [], pros: [m.bestFor + '.'], cons: [] })).sort((a, b) => merit(b.m) - merit(a.m));
    if (p.comfort) list = list.map(r => ({ ...r, s2: (r.score ?? merit(r.m) * 100) + (r.m.comfort - 3) * 6 })).sort((a, b) => b.s2 - a.s2);
    return list;
  }
  const CLICK = { great: 'great', good: 'good', poor: 'not good' };
  const imgTag = (m, cls = '') => `<img class="${cls}" src="${PM.IMG(m, 480)}" alt="" loading="lazy">`;

  /* =============================== 4. response builders =============================== */
  const R = () => ({ blocks: [], chips: [] });
  const P = (o, html) => o.blocks.push({ t: 'p', html });
  const chips = (o, ...cs) => o.chips.push(...cs.filter(Boolean));

  function card(r, i) {
    const m = r.m || r, score = r.score;
    const pros = (r.pros || []).slice(0, 3), cons = (r.cons || []).slice(0, 1);
    return `<article class="a-card" style="--d:${i * 90}ms">
      <a class="a-img" href="${root + m.page}">${imgTag(m)}</a>
      <div class="a-main">
        <div class="a-top"><div><small>${esc(m.brand)}</small><h4><a href="${root + m.page}">${esc(m.name)}</a></h4></div>${score != null ? `<span class="a-score"><b>${score}%</b><small>fit</small></span>` : ''}</div>
        ${pros.length ? `<ul class="a-why">${pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="a-best">${esc(m.bestFor)}.</p>`}
        ${cons.length ? `<p class="a-con">${esc(cons[0])}</p>` : ''}
        <div class="a-tags"><span>${m.weight} g</span><span>${m.connection}</span><span>${m.price ? inr(m.price) : 'price n/a'}</span><span title="Minecraft CPS potential">CPS ${PM.CPS_DOTS(m.cps.level)}</span></div>
        <div class="a-links"><a href="${root + m.page}">Full specs →</a><button type="button" data-ask="Tell me about the ${esc(m.name)}">Ask about it</button></div>
      </div></article>`;
  }

  function recommend(o, opts = {}) {
    const p = ctx.prefs;
    if (!Object.keys(LABEL).some(k => p[k] && !(Array.isArray(p[k]) && !p[k].length))) return quickPicks(o);
    let all = rank(p), list = hardFilter(all, p), relaxed = false;
    if (!list.length) { list = all; relaxed = true; }
    const start = opts.more ? ctx.offset : 0, pick = list.slice(start, start + 3);
    if (!pick.length) { P(o, 'That’s every mouse that matches. Want me to loosen something? Try “any budget” or “wired is fine”.'); return o; }
    ctx.last = pick.map(r => r.m.id); ctx.focus = null; ctx.offset = start + 3;
    const sum = Object.entries(p).filter(([k, v]) => v && LABEL[k] && !(Array.isArray(v) && !v.length)).map(([k, v]) => LABEL[k](v));
    const lead = opts.more ? `Here are ${pick.length} more` : `Here’s my shortlist`;
    P(o, `${lead}${sum.length ? ' for <b>' + esc(sum.join(' · ')) + '</b>' : ''}:`);
    if (relaxed) P(o, `<span class="a-note">Nothing matched every must-have, so I’ve shown the closest fits. ${p.budgetMax ? `The cheapest mouse here is ${inr(Math.min(...MICE.filter(m => m.price).map(m => m.price)))}.` : ''}</span>`);
    o.blocks.push({ t: 'html', html: `<div class="a-cards">${pick.map(card).join('')}</div>` });
    const top = pick[0].m;
    const gp = pick[0].parts.find(x => x.key === 'game');
    if (gp && gp.value < .5 && !opts.more) P(o, `<span class="a-note">None of the mice that pass your other must-haves is really built for ${esc(LABEL.games(p.games))}${p.lefty ? ': being left-handed rules out the ergonomic, button-heavy shapes' : p.budgetMax ? ': try a higher budget' : ''}. Remove a filter under “What I know about you” to see better matches.</span>`);
    else if (pick[0].score != null && pick[0].score < 62 && !opts.more) P(o, `<span class="a-note">These are the closest fits, but none matches everything well. Try removing a filter under “What I know about you”${p.lefty ? ' (left-handed rules out most ergonomic mice)' : ''}.</span>`);
    if ((p.games || []).includes('minecraft') && p.mcVersion !== '1.9+' && top.cps.level < 4) P(o, `<span class="a-note">Heads-up: for 1.8 PvP, the <a href="${root}mice/glorious-model-o.html">Glorious Model O</a> and <a href="${root}mice/bloody-a70.html">Bloody A70</a> have the most CPS potential, but they didn’t fit your other answers as well.</span>`);
    // ask the single most useful next question
    if (!p.games) { P(o, 'What do you mostly play? That changes the picks the most.'); chips(o, ['FPS', 'I play FPS games'], ['Minecraft PvP', 'I play Minecraft 1.8 PvP'], ['MMO / MOBA', 'I play MMOs'], ['Work', 'Mostly work and browsing']); }
    else if (!p.grip) { P(o, 'How do you hold your mouse? If you’re not sure, ask me “how do I find my grip?”'); chips(o, ['Palm', 'I use palm grip'], ['Claw', 'I use claw grip'], ['Fingertip', 'I use fingertip grip'], ['Not sure', 'How do I find my grip?']); }
    else if (!p.budgetMax && !p.cheap && !p.noBudget) { P(o, 'Got a budget?'); chips(o, ['Under ₹2,000', 'under ₹2000'], ['Under ₹5,000', 'under ₹5000'], ['Under ₹10,000', 'under ₹10000'], ['No limit', 'no budget limit']); }
    else if (!p.handLength && !p.handSize) { P(o, 'One more: how big are your hands? A centimetre measurement is best (wrist crease to middle fingertip).'); chips(o, ['Small', 'I have small hands'], ['Medium', 'medium hands'], ['Large', 'I have large hands'], ['18 cm', 'my hand is 18 cm']); }
    chips(o, ['Why #1?', 'Why the first one?'], pick.length > 1 && ['Compare top 2', 'Compare the first two'], ['Show more', 'Show more'], ['Cheaper', 'Cheaper'], !p.connection && ['Wireless only', 'Wireless only']);
    return o;
  }

  // "what's the best mouse?" — answer straight away, then ask what they play
  function quickPicks(o) {
    const seen = new Set(), top = (p, label) => { const r = hardFilter(rank(p), p).find(x => !seen.has(x.m.id)); if (r) seen.add(r.m.id); return r && { ...r, score: null, pros: [label, r.m.bestFor + '.'] }; };
    const picks = [top({ games: ['fps'] }, 'Best for FPS'), top({ games: ['minecraft'], mcVersion: '1.8' }, 'Best for 1.8 Minecraft PvP'), top({ cheap: true }, 'Best under ₹3,000')].filter(Boolean);
    ctx.last = picks.map(r => r.m.id); ctx.focus = null;
    P(o, 'There’s no single best mouse: it depends on what you play. Here are my quick picks:');
    o.blocks.push({ t: 'html', html: `<div class="a-cards">${picks.map(card).join('')}</div>` });
    P(o, 'Tell me what you play, how you hold your mouse and your budget, and I’ll make you a proper shortlist.');
    chips(o, ['FPS', 'I play FPS games'], ['Minecraft PvP', 'I play Minecraft 1.8 PvP'], ['Minecraft (1.9+)', 'I play Minecraft 1.20'], ['MMO / MOBA', 'I play MMOs'], ['Work', 'Mostly work and browsing']);
    return o;
  }

  // "I have a G102, should I upgrade?"
  function upgrade(o, m, q) {
    const games = (q.games && q.games.length) ? q.games : (ctx.prefs.games && ctx.prefs.games.length) ? ctx.prefs.games : m.games.slice(0, 1);
    const p = { ...ctx.prefs, ...q, games }, mine = PM.fit(m, toEngine(p));
    const gains = x => {
      const g = [];
      if (x.weight <= m.weight - 10) g.push(`${m.weight - x.weight} g lighter`);
      if (x.connection === 'Wireless' && m.connection === 'Wired') g.push('wireless');
      if ((x.ips || 0) >= (m.ips || 0) + 150) g.push('a much better sensor');
      if (games.includes('minecraft') && x.cps.level > m.cps.level) g.push(`more CPS potential (${x.cps.level}/5 vs ${m.cps.level}/5)`);
      if (x.poll > m.poll) g.push(`${num(x.poll)} Hz polling`);
      if (x.comfort > m.comfort) g.push('more comfortable');
      return g;
    };
    const ups = hardFilter(rank(p), p).filter(r => r.m.id !== m.id && r.score >= mine.score && gains(r.m).length >= 2).slice(0, 3);
    ctx.focus = m.id;
    if (!ups.length) { P(o, `<b>Honestly, keep it.</b> The ${esc(m.name)} is already a ${mine.score}% fit for ${esc(LABEL.games(games))}, and nothing in our list is clearly better for you without trade-offs.`); return o; }
    P(o, `The ${esc(m.name)} is a <b>${mine.score}% fit</b> for ${esc(LABEL.games(games))}. ${mine.score >= 85 ? 'It’s still good, so only upgrade if one of these gains matters to you:' : 'An upgrade would make a real difference. These keep what works and fix what doesn’t:'}`);
    ctx.last = ups.map(r => r.m.id);
    o.blocks.push({ t: 'html', html: `<div class="a-cards">${ups.map((r, i) => card({ ...r, pros: gains(r.m).map(g => cap(g)) }, i)).join('')}</div>` });
    chips(o, ['Compare with mine', `Compare the ${m.short} with ${ups[0].m.short}`], ['Cheaper upgrade', `Something cheaper than the ${ups[0].m.short}`]);
    return o;
  }

  // "is the Viper V3 Pro worth it?"
  function worth(o, m) {
    ctx.focus = m.id;
    const g = m.games[0], p = { games: [g] }, mine = PM.fit(m, toEngine(p)).score;
    const cheaper = m.price ? MICE.filter(x => x.id !== m.id && x.price && x.price <= m.price * .65 && Math.abs(x.weight - m.weight) <= 12)
      .map(x => ({ x, s: PM.fit(x, toEngine(p)).score })).filter(r => r.s >= mine - 6).sort((a, b) => a.x.price - b.x.price)[0] : null;
    if (!m.price) P(o, `We don’t have a trusted price for the ${esc(m.name)} yet, so I can’t judge its value. It’s best for: ${esc(m.bestFor.toLowerCase())}.`);
    else if (cheaper) P(o, `<b>It’s a great mouse, but you pay a lot for the last few percent.</b> At ${inr(m.price)}, the ${esc(m.name)} is a ${mine}% fit for ${esc(LABEL.games([g]))}. The <a href="${root + cheaper.x.page}">${esc(cheaper.x.name)}</a> gets ${cheaper.s}% for ${inr(cheaper.x.price)}, which is ${inr(m.price - cheaper.x.price)} less.`);
    else P(o, `<b>Yes, if ${esc(LABEL.games([g]))} is your main thing.</b> At ${inr(m.price)} it’s a ${mine}% fit, and nothing much cheaper in our list matches it on weight and performance.`);
    if (m.cps.level <= 2 && g !== 'minecraft') P(o, `<span class="a-note">Not for 1.8 Minecraft PvP though: ${esc(m.cps.note.split('. ')[0].toLowerCase())}.</span>`);
    if (cheaper) { ctx.last = [cheaper.x.id]; chips(o, ['Compare them', `Compare the ${m.short} with ${cheaper.x.short}`]); }
    return o;
  }

  function overview(o, m) {
    ctx.focus = m.id;
    const r = PM.fit(m, toEngine(ctx.prefs)), personal = (ctx.prefs.games || ctx.prefs.grip);
    o.blocks.push({ t: 'html', html: `<div class="a-hero">${imgTag(m)}<div><small>${esc(m.brand)} · ${esc(m.tags.join(' · '))}</small><h4>${esc(m.name)}</h4><p>${esc(m.bestFor)}.</p>
      <div class="a-specs">${[['Weight', m.weight + ' g'], ['Sensor', m.sensor || '—'], ['Max DPI', num(m.dpi)], ['Polling', num(m.poll) + ' Hz'], ['Connection', m.connection + (m.battery ? ` · ${m.battery} h` : '')], ['Buttons', m.buttons ?? '—'], ['Size', m.dims ? m.dims.join(' × ') + ' mm' : '—'], ['Price', m.price ? '~' + inr(m.price) : '—']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div></div></div>` });
    P(o, `<b>Minecraft:</b> ${esc(m.cps.label)} (${m.cps.level}/5). ${esc(m.cps.note)}`);
    if (personal) P(o, `For you it’s a <b>${r.score}% fit</b>${r.pros.length ? ': ' + esc(r.pros.slice(0, 2).join('; ').toLowerCase()) : ''}.${r.cons.length ? ' Watch out: ' + esc(r.cons[0].toLowerCase()) + '.' : ''}`);
    chips(o, ['Is it good for Minecraft?', `Is the ${m.short} good for Minecraft?`], ['Cheaper alternative', `Something cheaper than the ${m.short}`], ['Compare it', `Compare the ${m.short} with ${similar(m)[0].short}`], ['Full page', `@open:${m.page}`]);
    return o;
  }

  // closest mice to m: same uses and grips, then the same shell size (real dimensions), then similar shape
  function similar(m, filter = () => true) {
    const base = { games: m.games.slice(0, 2), grip: m.grips[0], weight: 'any', connection: 'any' };
    const near = x => {
      let s = PM.fit(x, base).score;
      if (m.dims && x.dims) { const d = Math.abs(x.dims[0] - m.dims[0]) + Math.abs(x.dims[1] - m.dims[1]); s += Math.max(0, 22 - d * 2.2) + (d < 1.5 ? 14 : 0); }   // same shell = sibling model
      if (x.shape && x.shape === m.shape) s += 6;
      if (x.brand === m.brand) s += 3;
      return s;
    };
    return MICE.filter(x => x.id !== m.id && filter(x)).map(x => [x, near(x)]).sort((a, b) => b[1] - a[1]).map(a => a[0]);
  }

  const FACT = [
    [/\b(weigh|weight|heavy|heavier|light|lighter|grams?)\b/, m => `The ${m.name} weighs <b>${m.weight} g</b>, which is ${PM.bandOf('weight', m.weight).name.toLowerCase()}.${m.variantNote && /weight|g\b/.test(m.variantNote) ? ' ' + esc(m.variantNote) : ''}`],
    [/\b(dpi|cpi|sensitivity)\b/, m => `Up to <b>${num(m.dpi)} DPI</b>${m.sensor ? ` from the ${esc(m.sensor)}` : ''}. Most players use 400–1,600, so the max barely matters.`],
    [/\b(sensor|tracking|ips)\b/, m => `It uses the <b>${esc(m.sensor || 'an unpublished sensor')}</b>${m.ips ? `, tracking up to ${m.ips} IPS` : ''}.`],
    [/\b(polling|hz|report rate)\b/, m => `Polling rate is up to <b>${num(m.poll)} Hz</b>. ${PM.bandOf('poll', m.poll).note}`],
    [/\b(battery|charge|charging|last)\b/, m => m.connection === 'Wired' ? `The ${m.name} is wired, so there’s no battery.` : `Battery life is up to about <b>${m.battery || '?'} hours</b>.`],
    [/\b(price|cost|how much|expensive|cheap|rupees|₹)\b/, m => m.price ? `It’s around <b>${inr(m.price)}</b> in India${m.priceNote ? ` (${esc(m.priceNote)})` : ''}. Prices move, so compare sellers.` : `We don’t have a trusted price for the ${m.name} yet.`],
    [/\b(buttons?|macros?|side buttons)\b/, m => m.buttons ? `It has <b>${m.buttons} programmable buttons</b>.` : 'The button count isn’t published.'],
    [/\b(wireless|wired|bluetooth|cable|cordless)\b/, m => { const w = m.connection === 'Wired' ? similar(m, x => x.connection === 'Wireless')[0] : null; return `It’s <b>${m.connection.toLowerCase()}</b>${m.battery ? `, with about ${m.battery} h of battery` : ''}.${w ? ` The closest wireless option is the <a href="${root + w.page}">${esc(w.name)}</a>.` : ''}`; }],
    [/\b(size|dimensions?|length|long|wide|width|tall|height|big|small)\b/, m => m.dims ? `It measures <b>${m.dims[0]} × ${m.dims[1]} × ${m.dims[2]} mm</b> (L × W × H), best for ${m.handSize.join(' / ')} hands.` : `Dimensions aren’t published; we rate it for ${m.handSize.join(' / ')} hands.`],
    [/\b(switch|switches|double ?click)\b/, m => `Switches: <b>${esc(m.switches || 'not published')}</b>. Butterfly: ${CLICK[m.clicking.butterfly] || 'unknown'}, jitter: ${CLICK[m.clicking.jitter] || 'unknown'}, drag: ${CLICK[m.clicking.drag] || 'unknown'}.`],
    [/\b(shape|ergonomic|symmetrical|ambidextrous|left|lefty)\b/, m => `It’s a <b>${(m.shape || 'unlisted').toLowerCase()}</b> shape (${(m.hand || 'hand not listed').toLowerCase()}). ${m.lefty ? 'Side buttons on both sides, so it’s great for lefties.' : m.shape === 'Symmetrical' ? 'Left-handers can use it, but the side buttons are on the left.' : m.shape === 'Ergonomic' ? 'It won’t suit left-handed players.' : ''}`],
    [/\b(grip|palm|claw|fingertip)\b/, m => `It suits <b>${m.grips.join(' and ')}</b> grip.`]
  ];

  function suitability(o, m, q) {
    ctx.focus = m.id;
    const p = { ...ctx.prefs, ...q };
    const r = PM.fit(m, toEngine(p));
    const verdict = r.score >= 82 ? 'Yes, it’s a strong fit' : r.score >= 66 ? 'It works, with a few trade-offs' : 'Not really';
    let html = `<b>${verdict}</b> (${r.score}% fit for ${esc(Object.entries(q).filter(([k]) => LABEL[k]).map(([k, v]) => LABEL[k](v)).join(' · ') || 'you')}).`;
    if ((q.games || []).includes('minecraft') || q.clickStyle) html += ` ${esc(m.cps.note)}`;
    P(o, html);
    if (r.pros.length) P(o, '✓ ' + r.pros.slice(0, 3).map(esc).join('<br>✓ '));
    if (r.cons.length) P(o, '<span class="a-note">⚠ ' + r.cons.slice(0, 2).map(esc).join('<br>⚠ ') + '</span>');
    if (r.score < 70) {
      const alt = hardFilter(rank(p), p).find(x => x.m.id !== m.id);
      if (alt) { P(o, `A better fit for that would be the <b>${esc(alt.m.name)}</b> (${alt.score}%).`); o.blocks.push({ t: 'html', html: `<div class="a-cards">${card(alt, 0)}</div>` }); ctx.last = [alt.m.id]; }
    }
    chips(o, ['Show me alternatives', `Alternatives to the ${m.short}`], ['Compare', `Compare the ${m.short} with ${similar(m)[0].short}`]);
    return o;
  }

  function alternatives(o, m, t) {
    let f = () => true, what = 'similar to';
    if (/\b(cheaper|cheap|less expensive|lower price|budget)\b/.test(t)) { f = x => x.price && m.price && x.price < m.price; what = 'cheaper than'; }
    else if (/\b(lighter|less heavy)\b/.test(t)) { f = x => x.weight < m.weight; what = 'lighter than'; }
    else if (/\bheavier\b/.test(t)) { f = x => x.weight > m.weight; what = 'heavier than'; }
    else if (/\b(wireless|cordless)\b/.test(t)) { f = x => x.connection === 'Wireless'; what = 'like (but wireless)'; }
    else if (/\bwired\b/.test(t)) { f = x => x.connection === 'Wired'; what = 'like (but wired)'; }
    else if (/better (for )?(click|cps|butterfly|minecraft)|more cps/.test(t)) { f = x => x.cps.level > m.cps.level; what = 'that clicks better than'; }
    const list = similar(m, f).slice(0, 3);
    if (!list.length) { P(o, `I couldn’t find anything ${what} the ${esc(m.name)} in our list.`); return o; }
    ctx.last = list.map(x => x.id); ctx.focus = null;
    P(o, `Mice ${what} the <b>${esc(m.name)}</b> (${m.weight} g · ${m.price ? inr(m.price) : 'no price'}), closest in shape and use first:`);
    o.blocks.push({ t: 'html', html: `<div class="a-cards">${list.map((x, i) => card({ m: x, pros: [x.bestFor + '.'] }, i)).join('')}</div>` });
    chips(o, ['Compare with the first', `Compare the ${m.short} with ${list[0].short}`]);
    return o;
  }

  function compare(o, ms, q = {}) {
    ms = ms.slice(0, 4); ctx.last = ms.map(m => m.id); ctx.focus = null;
    const pr = { ...ctx.prefs, ...q }, p = toEngine(pr), personal = scorable(pr) ? ms.map(m => PM.fit(m, p).score) : null;
    if (personal) {
      const i = personal.indexOf(Math.max(...personal)), sorted = [...personal].sort((a, b) => b - a), what = Object.entries(q).filter(([k, v]) => v && LABEL[k]).map(([k, v]) => LABEL[k](v)).join(' · ');
      P(o, sorted[0] - sorted[1] <= 2 ? `<b>Short answer: it’s close${what ? ' for ' + esc(what) : ''}.</b> Both fit within a couple of points, so pick on price, weight or shape below.` : `<b>Short answer: the ${esc(ms[i].name)}${what ? ' for ' + esc(what) : ''}</b> (${personal[i]}% fit vs ${sorted[1]}%).`);
    } else {
      const ws = ms.map(merit), i = ws.indexOf(Math.max(...ws)), priced = ms.filter(m => m.price), cheap = priced.sort((a, b) => a.price - b.price)[0];
      P(o, `<b>Short answer:</b> the ${esc(ms[i].short)} is the stronger all-rounder on paper${cheap && cheap !== ms[i] && ms[i].price && cheap.price < ms[i].price * .7 ? `, but the ${esc(cheap.short)} costs ${inr(ms[i].price - cheap.price)} less and is the better value` : ''}. Tell me what you play for a personal verdict.`);
    }
    const rows = [
      ['Weight', m => m.weight, m => m.weight + ' g', -1], ['Price', m => m.price, m => (m.price ? inr(m.price) : '—'), -1], ['Polling', m => m.poll, m => num(m.poll) + ' Hz', 1],
      ['Max DPI', m => m.dpi, m => num(m.dpi), 0], ['Sensor', null, m => m.sensor || '—'], ['Connection', null, m => m.connection + (m.battery ? ` · ${m.battery} h` : '')],
      ['Buttons', m => m.buttons, m => m.buttons ?? '—', 0], ['Shape', null, m => (m.shape || '—') + (m.lefty ? ' · ambi' : '')], ['Size (mm)', null, m => (m.dims ? m.dims.join(' × ') : '—')],
      ['Grips', null, m => m.grips.map(cap).join(', ')], ['Minecraft CPS', m => m.cps.level, m => `${PM.CPS_DOTS(m.cps.level)}`, 1],
      ['Butterfly / jitter / drag', null, m => ['butterfly', 'jitter', 'drag'].map(k => ({ great: '★', good: '✓', poor: '✗' })[m.clicking[k]] || '?').join(' / ')]
    ];
    if (personal) rows.unshift(['Fit for you', (m, i) => personal[i], (m, i) => personal[i] + '%', 1]);
    const table = `<div class="a-table-wrap"><table class="a-table"><thead><tr><th></th>${ms.map(m => `<th><a href="${root + m.page}">${imgTag(m, 'a-th-img')}<span>${esc(m.short)}</span></a></th>`).join('')}</tr></thead><tbody>${rows.map(([label, val, fmt, dir]) => {
      const vs = val ? ms.map((m, i) => val(m, i)) : null; let best = null;
      if (vs && dir && vs.every(v => v != null) && new Set(vs).size > 1) best = dir > 0 ? Math.max(...vs) : Math.min(...vs);
      return `<tr><th>${label}</th>${ms.map((m, i) => `<td class="${best != null && vs[i] === best ? 'win' : ''}">${esc(String(fmt(m, i)))}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table></div>`;
    o.blocks.push({ t: 'html', html: table });
    const pickIf = m => {
      const others = ms.filter(x => x !== m), out = [];
      if (others.every(x => m.weight < x.weight - 4)) out.push('you want the lightest, fastest-to-flick option');
      if (m.price && others.every(x => !x.price || m.price < x.price * .85)) out.push('price matters');
      if (m.cps.level >= 3 && others.every(x => m.cps.level > x.cps.level)) out.push('you play 1.8 Minecraft PvP and want max CPS');
      if (m.connection === 'Wireless' && others.every(x => x.connection === 'Wired')) out.push('you want to go wireless');
      if ((m.buttons || 0) >= 8 && others.every(x => (x.buttons || 0) < (m.buttons || 0) - 1)) out.push('you need lots of buttons for binds');
      if (others.every(x => m.comfort > x.comfort)) out.push('comfort for long sessions comes first');
      if (m.lefty && others.every(x => !x.lefty)) out.push('you’re left-handed');
      if (others.every(x => m.poll > x.poll)) out.push('you want the highest polling rate');
      return out;
    };
    const lines = ms.map(m => { const w = pickIf(m); return w.length ? `<b>${esc(m.short)}</b> if ${w.slice(0, 3).join(', ')}.` : null; }).filter(Boolean);
    if (lines.length) P(o, 'Pick the ' + lines.join('<br>Pick the '));
    if (!personal) chips(o, ['For FPS?', `${ms[0].short} vs ${ms[1].short} for FPS`], ['For Minecraft?', `${ms[0].short} vs ${ms[1].short} for Minecraft PvP`]);
    chips(o, ['Open in compare lab', `@open:mice/compare.html?m=${ms.map(m => m.id).join(',')}`]);
    return o;
  }

  const SUPER = [
    [/\b(best|top|most accurate|flawless) sensors?\b|\bsensor.*\bbest\b/, 'Top sensors', (a, b) => (b.ips || 0) - (a.ips || 0) || (b.dpi || 0) - (a.dpi || 0), m => (m.sensor || 'sensor n/a') + (m.ips ? ` · ${m.ips} IPS` : '')],
    [/\btop (\d+|three|five|ten)\b|\btop (mice|picks|gaming mice)\b|\b(best rated|top rated|most popular|best overall|overall best)\b/, 'Top all-rounders', (a, b) => merit(b) - merit(a), m => m.bestFor],
    [/\b(lightest|least heavy)\b/, 'Lightest', (a, b) => a.weight - b.weight, m => m.weight + ' g'],
    [/\b(heaviest)\b/, 'Heaviest', (a, b) => b.weight - a.weight, m => m.weight + ' g'],
    [/\b(cheapest|lowest price|least expensive|most affordable)\b/, 'Cheapest', (a, b) => (a.price || 1e9) - (b.price || 1e9), m => inr(m.price)],
    [/\b(most expensive|priciest)\b/, 'Most expensive', (a, b) => (b.price || 0) - (a.price || 0), m => inr(m.price)],
    [/\b(most buttons|most programmable)\b/, 'Most buttons', (a, b) => (b.buttons || 0) - (a.buttons || 0), m => m.buttons + ' buttons'],
    [/\b(best|longest|most) battery\b/, 'Longest battery', (a, b) => (b.battery || 0) - (a.battery || 0), m => m.battery + ' h'],
    [/\b(highest|most|max) dpi\b/, 'Highest DPI', (a, b) => (b.dpi || 0) - (a.dpi || 0), m => num(m.dpi) + ' DPI'],
    [/\b(highest|fastest|best) polling\b/, 'Fastest polling', (a, b) => b.poll - a.poll, m => num(m.poll) + ' Hz'],
    [/\b(best|most|highest) cps\b|\bbest (for )?(butterfly|drag|jitter)\b|\bwhich (mice|mouse|ones?) can (butterfly|drag|jitter)/, 'Most CPS potential', (a, b) => b.cps.level - a.cps.level || a.weight - b.weight, m => m.cps.label],
    [/\b(smallest|shortest)\b/, 'Smallest', (a, b) => ((a.dims || [999])[0]) - ((b.dims || [999])[0]), m => (m.dims ? m.dims[0] + ' mm long' : '')],
    [/\b(biggest|largest|longest)\b/, 'Biggest', (a, b) => ((b.dims || [0])[0]) - ((a.dims || [0])[0]), m => (m.dims ? m.dims[0] + ' mm long' : '')]
  ];
  function listing(o, t, q, sup) {
    let pool = MICE.filter(m => hardFilter([m], q).length && (!q.games || q.games.some(g => m.games.includes(g))));
    const style = (t.match(/\b(butterfly|drag|jitter)\b/) || [])[1];
    if (style) pool = pool.filter(m => ['great', 'good'].includes(m.clicking[style]));
    const [, title, sort, show] = sup || [null, 'Matching mice', (a, b) => merit(b) - merit(a), m => m.weight + ' g'];
    const want = +((t.match(/\btop (\d+)\b/) || [])[1] || { three: 3, five: 5, ten: 10 }[(t.match(/\btop (three|five|ten)\b/) || [])[1]] || 0);
    pool.sort(sort);
    if (!pool.length) { P(o, 'No mice in our list match all of that. Try loosening one filter.'); return o; }
    const n = Math.min(want || (sup ? 6 : 10), pool.length);
    ctx.last = pool.slice(0, n).map(m => m.id); ctx.focus = null;
    const f = Object.entries(q).filter(([k, v]) => v && LABEL[k] && !(sup && /Lightest|Heaviest/.test(title) && k === 'weight')).map(([k, v]) => LABEL[k](v));
    P(o, `<b>${title}${style ? ` for ${style} clicking` : ''}</b>${f.length ? ' · ' + esc(f.join(' · ')) : ''} (${pool.length} match${pool.length > 1 ? 'es' : ''}${pool.length > n ? `, showing ${n}` : ''}):`);
    o.blocks.push({ t: 'html', html: `<ol class="a-list">${pool.slice(0, n).map(m => `<li><a href="${root + m.page}">${imgTag(m)}<span><b>${esc(m.name)}</b><small>${esc(show(m))} · ${m.connection.toLowerCase()} · ${m.price ? inr(m.price) : 'no price'}</small></span></a></li>`).join('')}</ol>` });
    if (pool.length > n) chips(o, ['See them all', `@open:mice.html#catalog`]);
    chips(o, n > 1 && ['Compare top 2', 'Compare the first two']);
    return o;
  }

  const CONCEPTS = [
    [/double ?click(ing|s)?\b.*\b(fix|problem|issue|what (do|should|can) i do|broken|keeps|randomly|by itself|on its own)|\bmy mouse (is |keeps )?(double|clicking twice)|\bfix.*double ?click/, 'Fixing a mouse that double-clicks', 'That’s usually a worn switch “chattering”. In order: 1) Confirm it with the <a href="' + root + 'mouse-button-test.html">mouse button test</a>. 2) Raise the debounce time in your mouse software if it has one. 3) Blow compressed air into the gap under the button. 4) If it’s under warranty (Logitech and Razer give 2 years in India), claim it. 5) Handy with a soldering iron? A new Omron or Kailh switch costs under ₹100. Mice with optical switches can’t develop this fault.'],
    [/\b(more|increase|improve|higher|boost|raise|get better) (my )?cps\b|\bcps (higher|up)\b|\bclick faster\b|\bhow to (get )?(fast|faster) click/, 'How to get more CPS', '1) Pick a technique: jitter (10–14 CPS) is easiest to learn, butterfly (15–25) needs a mouse that registers fast presses, drag (25+) needs a grippy button. 2) Use a mouse that supports it: the Glorious Model O for butterfly, the Bloody A70 for drag. 3) Practise in short bursts on the <a href="' + root + 'cps-test.html">CPS test</a>: five 5-second runs, then rest. 4) Keep your wrist relaxed: if it hurts, stop. Lite shows your double clicks and consistency so you can see what’s improving.', ['glorious-model-o', 'bloody-a70']],
    [/how (do i|to|can i|do you|should i) butterfly/, 'How to butterfly click', 'Rest your index and middle fingers on the left button, then tap them one after the other, fast, like drumming. Each finger adds a click, so you get two clicks per “cycle”. Keep your wrist on the desk and your fingers relaxed. Start slowly for rhythm, then speed up. It needs a mouse with a crisp, low-debounce switch: the Glorious Model O is the classic choice.', ['glorious-model-o']],
    [/how (do i|to|can i|do you|should i) jitter/, 'How to jitter click', 'Hold your hand in a claw over the mouse, tense your forearm and let your index finger vibrate on the left button. Keep the vibration small and keep breathing. Practise in 5-second bursts and stop if your wrist hurts. Light mice with a firm click work best.'],
    [/how (do i|to|can i|do you|should i) drag ?click/, 'How to drag click', 'Put your finger on the top of the left button and drag it down slowly with firm pressure. Friction makes the finger skip, and each skip is a click. Grip tape or a slightly sweaty finger helps. The Bloody A70 and Logitech G102 are known drag clickers.', ['bloody-a70', 'logitech-g102-lightsync']],
    [/\b(8 ?k|8000 ?hz|4 ?k|4000 ?hz|high polling)\b/, 'Is 4K / 8K polling worth it?', 'Only if you have a 240 Hz+ monitor and a fast PC. 8,000 Hz makes motion a touch smoother and cuts latency by under 1 ms, but it uses noticeably more CPU and drains wireless batteries faster. On a 60–144 Hz screen you won’t feel it. 1,000 Hz is still the right default for most players.', ['razer-viper-v3-pro']],
    [/(does|do|will) (the |a |my |your )?mouse (really )?(matter|make a difference|help|improve)|better mouse.*(aim|better player)|mouse.*(improve|help).*aim/, 'Does your mouse matter for aim?', 'A bit, but less than practice. A good mouse removes problems: a flawless sensor, a weight you can control and a shape that fits your grip. Going from a heavy, ill-fitting office mouse to a light gaming mouse is a big jump. Going from a ₹3,000 gaming mouse to a ₹15,000 one is a small one. Fix sensitivity and practise with the <a href="' + root + 'aim-trainer.html">aim trainer</a> first.'],
    [/\b(quiet|quietest|silent|noise|noisy|loud)\b/, 'Quiet mice', 'We don’t measure click noise yet, so I can’t rank our mice by how loud they are. If quiet matters most, look for mice sold as “silent”: they use dampened switches. They’re great for offices and late nights, but a poor match for jitter or butterfly clicking.'],
    [/\b(white|black|pink|blue|red|purple|colou?rs?|colou?rway)\b(?!.*\b(theme|site|website)\b)/, 'Colours', 'We don’t track colours yet. Plenty of the mice here come in white or other colours, including the Logitech G PRO X Superlight 2, the Glorious Model O, the Razer Viper V3 Pro and the Logitech G102. Check the seller’s listing for what’s in stock.'],
    [/\b(pros?|professional|esports?|streamers?|youtubers?|technoblade|tenz|s1mple|dream|shroud|zywoo|players?)\b.*\b(use|using|uses|play with)\b|\bwhat (mouse|mice) (do|does) (pros|professional)/, 'What do pros use?', 'We don’t track individual players’ setups, so I won’t guess anyone’s mouse. As a general picture: in pro FPS, light wireless mice dominate, and the Logitech G PRO X Superlight 2 and Razer Viper V3 Pro are the most common. Zowie’s EC series is a long-time Counter-Strike favourite. In 1.8 Minecraft PvP, the Glorious Model O and Bloody A70 are the community’s go-to CPS mice.', ['logitech-g-pro-x-superlight-2', 'razer-viper-v3-pro', 'glorious-model-o']],
    [/\b(dpi|cpi)\b/, 'DPI (or CPI)', 'How far the cursor moves per inch of mouse movement. It’s sensitivity, not accuracy. Most good players use 400–1,600 DPI and tune in-game sensitivity. A 30,000 DPI sensor isn’t “more accurate” than a 12,000 one at the settings you’ll actually use.'],
    [/\bpolling\b|\bhz\b|\breport rate\b/, 'Polling rate', 'How often the mouse reports to your PC each second. 1,000 Hz (1 ms) is the gaming standard. 4,000–8,000 Hz feels a touch smoother on high-refresh monitors but uses more CPU and battery. It won’t fix aim on its own.'],
    [/\bips\b|tracking speed/, 'IPS (tracking speed)', 'The fastest swipe the sensor can follow without losing track. Anything above ~250 IPS is plenty for almost everyone; low-sensitivity FPS players benefit from 400+.'],
    [/\bdebounce\b/, 'Debounce', 'A short delay a mouse waits before accepting another click, to stop accidental double-clicks. Lower debounce (some mice go to 0 ms) lets fast butterfly and jitter clicks register, which is why the Glorious Model O is a Minecraft favourite.'],
    [/\bbutterfly\b/, 'Butterfly clicking', 'Alternating two fingers on one button so you get two clicks per “cycle”. It needs a mouse that registers rapid presses (low debounce, mechanical switches). Glorious Model O and Bloody A70 are the strongest picks; Razer’s optical-switch mice (DeathAdder V3, Viper V3 Pro) are weak at it.'],
    [/\bjitter\b/, 'Jitter clicking', 'Tensing your arm so one finger vibrates on the button. It works on most mice with a firm, crisp click; lighter mice are easier to keep steady.'],
    [/\bdrag ?click/, 'Drag clicking', 'Dragging a finger across the button so friction makes it bounce and register many clicks. It depends on a grippy button surface and switch: the Bloody A70 is the classic drag clicker; grip tape helps on others.'],
    [/\bcps\b/, 'CPS (clicks per second)', 'How many clicks you register per second. In 1.8 Minecraft PvP it decides trades. Normal clicking is ~6–8 CPS, jitter ~10–14, butterfly 15–25+, drag 25+. Test yours with the <a href="' + root + 'cps-test.html">CPS test</a>.'],
    [/\b1\.8\b.*\b1\.9|\b1\.9\b.*\b1\.8|\bpvp version|combat update/, '1.8 vs 1.9+ PvP', '1.8 combat has no attack cooldown, so faster clicking means more hits: CPS is king. 1.9+ added a cooldown, so timing, aim and comfort matter more than raw CPS. Tell me which you play and I’ll weight picks accordingly.'],
    [/\b(grip|palm|claw|fingertip)\b/, 'Grip styles', '<b>Palm</b>: whole hand rests on the mouse; suits bigger, ergonomic shells. <b>Claw</b>: palm touches the back, fingers arched; suits medium, shorter mice. <b>Fingertip</b>: only fingertips touch; suits small, light mice. Quick test: rest your hand naturally on your mouse and see which parts touch.'],
    [/measure.*hand|hand.*measure|hand size|how big.*hand/, 'Measuring your hand', 'Measure from the crease of your wrist to the tip of your middle finger. Under 17 cm is small, 17–19.5 cm medium, over 19.5 cm large. Tell me the number (like “my hand is 18.5 cm”) and I’ll match it against each mouse’s real length.'],
    [/\boptical switch|mechanical switch|switch type/, 'Optical vs mechanical switches', 'Optical switches use a light beam, so they never wear out into double-clicking and need no debounce, but some (like Razer’s) are poor for butterfly clicking. Mechanical switches have a metal contact: crisp and great for click techniques, but they can develop double-clicks over years.'],
    [/\b(wired vs wireless|wireless lag|wireless latency|is wireless good)\b/, 'Wired vs wireless', 'Modern 2.4 GHz gaming wireless (Lightspeed, HyperSpeed) is as fast as wired. Bluetooth is slower, fine for work. Wireless costs more and needs charging, but removes cable drag.'],
    [/\b(weight|heavy|light)\b.*\bmatter|\bwhy light/, 'Does weight matter?', 'Lighter mice (under ~65 g) are easier to flick and stop, which helps fast FPS aim and long sessions. Heavier mice feel steadier for slow, precise movement. It’s personal: there’s no best weight.']
  ];

  /* =============================== 5. intent routing =============================== */
  function reply(text) {
    const o = R();
    if (text.startsWith('@open:')) { location.href = root + text.slice(6); return o; }
    const { t, p: q, said } = extract(text);
    const mentioned = findMice(t);
    const ord = { first: 0, '1st': 0, second: 1, '2nd': 1, third: 2, '3rd': 2, last: Math.max(0, ctx.last.length - 1) };
    let refs = mentioned;
    if (!refs.length) {
      const pos = t.match(/\b(first|1st|second|2nd|third|3rd|last) (one|mouse|pick)\b/);
      if (/\b(first|top) (two|2)\b/.test(t) && ctx.last.length >= 2) refs = ctx.last.slice(0, 2).map(id => byId[id]);
      else if (/\b(all three|top (three|3)|these)\b/.test(t) && ctx.last.length >= 2) refs = ctx.last.slice(0, 3).map(id => byId[id]);
      else if (pos && ctx.last[ord[pos[1]]]) refs = [byId[ctx.last[ord[pos[1]]]]];
      else if (/\b(it|this|that|this one|that one|this mouse|that mouse|the mouse)\b/.test(t) && ctx.focus && !/\b(recommend|suggest|need|want|looking for|buy|pick|choose|help me|instead|other)\b/.test(t) && t.trim().split(' ').length <= 12) refs = [byId[ctx.focus]];
      else if (/\bwhy\b.*\b(first|#1|number one|top)\b/.test(t) && ctx.last[0]) refs = [byId[ctx.last[0]]];
      else if (ctx.focus && t.trim().split(' ').length <= 7 && !/\b(i have|i play|i use|my hands?|my budget|recommend|suggest|list|show me|mice)\b/.test(t)
        && (FACT.some(([re]) => re.test(t)) || /\b(alternatives?|similar|cheaper|lighter|heavier|worth|good for|any good|upgrade)\b/.test(t))) refs = [byId[ctx.focus]];
    }
    said.forEach(s => P(o, `<span class="a-note">${esc(s)}</span>`));

    // reset / small talk
    if (/^\s*(reset|start over|clear|forget( everything)?|new chat)\s*$/.test(t.trim())) { ctx.prefs = {}; ctx.last = []; ctx.focus = null; ctx.offset = 0; ctx.seeded = true; P(o, 'Done, I’ve forgotten your preferences. What do you play?'); chips(o, ['FPS', 'I play FPS games'], ['Minecraft PvP', 'I play Minecraft 1.8 PvP']); return o; }
    if (/^\s*(hi|hey|hello|yo|sup|hii+|namaste)\b/.test(t) && t.trim().split(' ').length <= 3) { P(o, 'Hey! Tell me what you play, your grip and your budget, or ask about any of the ' + MICE.length + ' mice on ProMouser.'); chips(o, ['Pick a mouse for me', 'Help me choose a mouse'], ['Best for Minecraft', 'Best mouse for Minecraft 1.8 PvP'], ['Lightest wireless', 'Lightest wireless mice']); return o; }
    if (/^\s*(thanks|thank you|thx|ty|ok thanks|cool|nice|great)\b/.test(t) && t.trim().split(' ').length <= 4) { P(o, 'Anytime! Ask me anything else, or open a mouse’s page for the full spec sheet.'); return o; }
    if (/\b(what can you do|help me use|how do you work|who are you|are you (an )?ai)\b/.test(t)) { P(o, `I’m ProMouser’s recommendation assistant. I run in your browser on our spec data for ${MICE.length} mice, so I don’t make things up from the internet. Ask me to pick a mouse, compare mice, check if a mouse suits you, list mice by a spec, or explain terms like DPI or debounce.`); chips(o, ['Pick for me', 'Help me choose a mouse'], ['G102 vs Model O', 'G102 vs Model O'], ['What is debounce?', 'What is debounce?']); return o; }

    // concepts ("what is dpi", "explain butterfly clicking")
    const askConcept = /\b(what('?s| is| are| does)|explain|meaning|mean|how (do|does|to|can|should)|difference between|tell me about|worth it|is it worth|matter|what (do|should|can) i do|fix|tips?|do pros|pros use|(do|does) [a-z0-9]+ use|quiet\w*|silent|colou?r|white)\b/.test(t);
    if (askConcept && refs.length === 0) {
      const c = CONCEPTS.find(([re]) => re.test(t));
      if (c) {
        P(o, `<b>${c[1]}</b>`); P(o, c[2]);
        if (c[3]) { ctx.last = c[3]; o.blocks.push({ t: 'html', html: `<div class="a-cards">${c[3].map(id => card({ m: byId[id], pros: [byId[id].bestFor + '.'] }, 0)).join('')}</div>` }); }
        chips(o, ['Recommend me a mouse', 'Help me choose a mouse']); return o;
      }
    }

    // compare
    if (refs.length >= 2 && (/\b(vs|versus|compare|comparison|or|better|difference|between|against|which)\b/.test(t) || mentioned.length >= 2)) return compare(o, refs, q);

    // one mouse: facts, suitability, alternatives, overview
    if (refs.length === 1) {
      const m = refs[0]; ctx.focus = m.id;
      if (/\b(upgrade|replace|should i (switch|change)|new mouse|better mouse)\b/.test(t) || (/\b(i have|i own|i use|i'?m using|i got|my current)\b/.test(t) && /\b(better|switch|should i)\b/.test(t))) return upgrade(o, m, q);
      if (/\b(worth (it|the money|buying|the price)|value for money|overpriced|over priced)\b/.test(t)) return worth(o, m);
      if (/\b(alternative|alternatives|similar|instead|like the|like it|cheaper|lighter|heavier|wireless version|wired version|other options|something like|but wireless|but wired|an? wireless|an? wired)\b/.test(t) && !/\b(is it|is the|does it|does the)\b/.test(t)) return alternatives(o, m, t);
      if (/\bwhy\b/.test(t)) {
        const pr = { ...ctx.prefs, ...q };
        if (!scorable(pr)) {
          P(o, `Why people pick the <b>${esc(m.name)}</b>: ${esc(m.bestFor.toLowerCase())}.`);
          P(o, `${m.weight} g · ${esc(m.sensor || 'sensor not published')} · ${num(m.poll)} Hz · ${m.connection.toLowerCase()}${m.price ? ' · ' + inr(m.price) : ''}. For Minecraft: ${esc(m.cps.note)}`);
          chips(o, ['Is it good for me?', `Is the ${m.short} good for me?`]); return o;
        }
        const r = PM.fit(m, toEngine(pr));
        P(o, `Why the <b>${esc(m.name)}</b>? It scores <b>${r.score}%</b> for ${esc(Object.entries(pr).filter(([k, v]) => v && LABEL[k]).map(([k, v]) => LABEL[k](v)).join(' · ') || 'you')}:`);
        o.blocks.push({ t: 'html', html: `<div class="a-break">${r.parts.map(x => `<div><span>${esc(x.label)}</span><i><b style="width:${Math.round(x.value * 100)}%"></b></i><em>${Math.round(x.value * 100)}%</em></div>`).join('')}</div>` });
        if (r.pros.length) P(o, '✓ ' + r.pros.map(esc).join('<br>✓ '));
        if (r.cons.length) P(o, '<span class="a-note">⚠ ' + r.cons.map(esc).join('<br>⚠ ') + '</span>');
        return o;
      }
      const suitQ = { ...q }; delete suitQ.budgetMax;
      const asksSuit = (q.clickStyle && /\b(can|does|will|is|good|able)\b/.test(t)) || /\b(good|bad|okay|ok|decent|worth|suitable|suit|fit|work|recommend(ed)?|right|can (it|i|the)|able to|for)\b/.test(t) && (q.games || q.grip || q.handSize || q.handLength || q.lefty || q.clickStyle || q.weight);
      if (asksSuit) {
        if (q.clickStyle && !q.games) suitQ.games = ['minecraft'];
        if (q.clickStyle) {
          const lv = m.clicking[q.clickStyle];
          P(o, `${lv === 'great' ? '<b>Yes, very well.</b>' : lv === 'good' ? '<b>Yes.</b>' : lv === 'poor' ? '<b>Not really.</b>' : '<b>We haven’t confirmed that yet.</b>'} The ${esc(m.name)} is ${CLICK[lv] || 'untested'} for ${q.clickStyle} clicking. ${esc(m.cps.note)}`);
          if (lv === 'poor' || !lv) { const alt = MICE.filter(x => x.clicking[q.clickStyle] === 'great').sort((a, b) => b.cps.level - a.cps.level)[0]; if (alt) { P(o, `For ${q.clickStyle} clicking, try the <a href="${root + alt.page}">${esc(alt.name)}</a>.`); } }
          return o;
        }
        return suitability(o, m, suitQ);
      }
      const facts = FACT.filter(([re]) => re.test(t));
      if (facts.length && !/\btell me about|overview|review|thoughts|opinion\b/.test(t)) { facts.slice(0, 3).forEach(([, f]) => P(o, f(m))); chips(o, ['More about it', `Tell me about the ${m.name}`], ['Is it good for me?', `Is the ${m.short} good for me?`]); return o; }
      if (/\b(good|any good|decent|bad|solid|trash|reliable)\b/.test(t)) {
        const g = m.games[0], sc = PM.fit(m, toEngine({ games: [g] })).score;
        P(o, `<b>${sc >= 85 ? 'Yes' : sc >= 70 ? 'Yes, with trade-offs' : 'It’s okay'}</b>: it’s a ${sc}% fit for ${esc(LABEL.games([g]))}, its main use${m.price ? `, at ${inr(m.price)}` : ''}. Tell me what you play for a personal verdict.`);
      }
      return overview(o, m);
    }

    // follow-ups that change the current search
    const follow = { ...q };
    if (/^\s*(more|show more|next|others|other options|any others|what else)\b/.test(t) && ctx.last.length) return recommend(o, { more: true });
    if (/^\s*(cheaper|less expensive|lower budget)\b/.test(t)) { const cur = ctx.last.map(id => byId[id].price).filter(Boolean); follow.budgetMax = Math.max(1000, Math.round((ctx.prefs.budgetMax || Math.min(...cur, 99999)) * .8 / 100) * 100); }
    if (/^\s*(lighter|even lighter)\b/.test(t)) { const cur = ctx.last.map(id => byId[id].weight); follow.maxWeight = Math.max(45, Math.min(...cur, 200) - 6); follow.weight = 'light'; }
    if (/^\s*(wireless only|only wireless|wireless please)\b/.test(t)) follow.connection = 'wireless';
    if (/\b(any budget|no budget|budget doesn'?t matter|price doesn'?t matter)\b/.test(t)) { delete ctx.prefs.budgetMax; delete ctx.prefs.cheap; follow.noBudget = true; }
    if (/\b(wired is fine|any connection|doesn'?t matter if wired)\b/.test(t)) { delete ctx.prefs.connection; delete follow.connection; }

    // lists and superlatives
    const sup = SUPER.find(([re]) => re.test(t));
    const wantsList = (/\b(list|show( me)? (all|every)|all the|which (mice|mouse|ones)|what (mice|mouse))\b/.test(t) || (q.brands && !/\b(best|recommend|suggest)\b/.test(t))) && !/\b(should|best|good|recommend|suggest|for me|buy)\b/.test(t);
    if (sup || wantsList) return listing(o, t, q, sup);

    // recommendation (anything that told us something about the user)
    const learned = Object.keys(follow).length > 0;
    if (learned || /\b(recommend|suggest|best|which mouse|what mouse|need a|looking for|want a|buy|choose|pick|help me|batao|bata do|chahiye|lena hai|konsa|kaunsa|kon sa|acha|accha|achha|sabse)\b/.test(t)) {
      if (follow.games) ctx.prefs.games = /\b(also|too|as well|plus|on top)\b/.test(t) ? [...new Set([...(ctx.prefs.games || []), ...follow.games])] : follow.games;   // replace unless adding
      if (ctx.prefs.games && !ctx.prefs.games.includes('minecraft') && !follow.mcVersion) delete ctx.prefs.mcVersion;
      Object.entries(follow).forEach(([k, v]) => { if (k !== 'games') ctx.prefs[k] = v; });
      if (follow.budgetMax) delete ctx.prefs.cheap;
      if (follow.handLength) delete ctx.prefs.handSize; if (follow.handSize) delete ctx.prefs.handLength;
      if (!learned && seedFromAccount()) P(o, '<span class="a-note">I’ve started from the preferences saved in your account.</span>');
      ctx.offset = 0;
      return recommend(o);
    }

    // couldn't place it
    if (/\b(mouse|mice|mouses)\b/.test(t)) return quickPicks(o);
    P(o, 'I’m not sure I followed that. I can recommend a mouse, compare mice, answer spec questions or explain terms. For example:');
    chips(o, ['Best mouse for Minecraft under ₹3,000', 'Best mouse for Minecraft under ₹3000'], ['Viper V3 Pro vs Superlight 2', 'Viper V3 Pro vs Superlight 2'], ['Is the G102 good for butterfly?', 'Can the G102 butterfly click?'], ['What is polling rate?', 'What is polling rate?']);
    return o;
  }

  /* =============================== 6. UI =============================== */
  const log = $('#asstLog', host), form = $('#asstForm', host), input = $('#asstInput', host), sugg = $('#asstSugg', host), prof = $('#asstProfile', host);
  let busy = false;
  const scrollDown = () => log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  function bubble(who, html, animate = true) {
    const el = document.createElement('div'); el.className = 'a-msg ' + who + (animate ? ' in' : '');
    el.innerHTML = who === 'bot' ? `<span class="a-ava" aria-hidden="true">${window.PMIcon ? window.PMIcon('chip') : ''}</span><div class="a-bub">${html}</div>` : `<div class="a-bub">${html}</div>`;
    log.appendChild(el); scrollDown(); return el;
  }
  function renderChips(list) {
    sugg.innerHTML = list.slice(0, 6).map(([l, q]) => `<button type="button" class="chip-btn" data-q="${esc(q)}">${esc(l)}</button>`).join('');
  }
  /* Ultra: remember the learned profile in the account, across visits and devices */
  const hasMemory = () => !!(B && B.has && B.has('memory'));
  let memTimer;
  function remember() {
    if (!hasMemory()) return;
    clearTimeout(memTimer);
    memTimer = setTimeout(() => { B.updateExtras({ memory: Object.keys(ctx.prefs).length ? { ...ctx.prefs } : null }).catch(() => { /* offline: try next time */ }); }, 600);
  }
  function renderProfile() {
    const e = Object.entries(ctx.prefs).filter(([k, v]) => LABEL[k] && v && !(Array.isArray(v) && !v.length));
    prof.innerHTML = e.length ? e.map(([k, v]) => `<button type="button" class="pchip" data-rm="${k}" title="Remove">${esc(LABEL[k](v))}<span aria-hidden="true">×</span></button>`).join('') : '<p class="panel-note">Nothing yet. Tell me what you play, your grip, hands and budget.</p>';
  }
  function draw(o, animate) { return bubble('bot', o.blocks.map(b => (b.t === 'p' ? `<p>${b.html}</p>` : b.html)).join(''), animate); }
  async function ask(text, opts = {}) {
    text = String(text || '').trim(); if (!text || busy) return;
    if (text.startsWith('@open:')) { reply(text); return; }
    busy = true;
    bubble('user', esc(text), !opts.quiet);
    let typing;
    if (!opts.quiet) { typing = bubble('bot', '<span class="a-typing"><i></i><i></i><i></i></span>'); await new Promise(r => setTimeout(r, reduce ? 120 : 420 + Math.random() * 380)); }
    const o = reply(text);
    if (typing) typing.remove();
    if (o.blocks.length) draw(o, !opts.quiet);
    renderChips(o.chips.length ? o.chips : DEFAULT_CHIPS); renderProfile();
    if (!opts.quiet) { ctx.log.push(text); save(); remember(); }
    busy = false;
  }
  const DEFAULT_CHIPS = [['Pick a mouse for me', 'Help me choose a mouse'], ['Best for Minecraft 1.8', 'Best mouse for Minecraft 1.8 PvP'], ['FPS under ₹5,000', 'Best FPS mouse under ₹5000'], ['Model O vs G102', 'Model O vs G102'], ['Lightest wireless', 'Lightest wireless mice'], ['What is debounce?', 'What is debounce?']];

  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
  host.addEventListener('click', e => {
    const c = e.target.closest('[data-q]'); if (c) { ask(c.dataset.q); return; }
    const a = e.target.closest('[data-ask]'); if (a) { ask(a.dataset.ask); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) { delete ctx.prefs[rm.dataset.rm]; if (rm.dataset.rm === 'budgetMax') delete ctx.prefs.noBudget; renderProfile(); save(); remember(); return; }
  });
  $('#asstReset', host) && $('#asstReset', host).addEventListener('click', () => { if (hasMemory()) B.updateExtras({ memory: null }).catch(() => {}); ctx = { prefs: {}, last: [], focus: null, offset: 0, seeded: true, log: [] }; save(); log.innerHTML = ''; greet(); renderProfile(); renderChips(DEFAULT_CHIPS); });

  // quick compare
  const qa = $('#qcA', host), qb = $('#qcB', host);
  if (qa && qb) {
    const opts = [...new Set(MICE.map(m => m.brand))].sort().map(b => `<optgroup label="${esc(b)}">${MICE.filter(m => m.brand === b).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</optgroup>`).join('');
    qa.innerHTML = opts; qb.innerHTML = opts; qa.value = 'glorious-model-o'; qb.value = 'logitech-g102-lightsync';
    $('#qcGo', host).addEventListener('click', () => { if (qa.value === qb.value) return; ask(`${byId[qa.value].name} vs ${byId[qb.value].name}`); });
  }

  function greet() {
    const u = B && B.getUser && B.getUser();
    bubble('bot', `<p>Hey${u ? ' ' + esc(u.name.split(' ')[0]) : ''}! I know the specs, shapes and clicking ability of all <b>${MICE.length} mice</b> on ProMouser.</p><p>Tell me what you play, how you hold your mouse and your budget, or ask me anything: “Is the Viper V3 Pro good for Minecraft?”, “G102 vs Model O”, “lightest wireless under ₹5,000”.</p>`, false);
  }

  // restore this tab's conversation, then handle ?q=  (after script.js has defined the icons)
  const boot = () => {
  greet();
  const replay = ctx.log.slice(); ctx.log = [];
  const prefsSaved = { ...ctx.prefs };
  if (replay.length) { ctx.prefs = {}; ctx.last = []; ctx.focus = null; replay.forEach(q => { ask(q, { quiet: true }); ctx.log.push(q); }); ctx.prefs = prefsSaved; }
  const u0 = B && B.getUser && B.getUser(), mem = hasMemory() && u0.extras && u0.extras.memory;
  if (mem && !Object.keys(ctx.prefs).length) {
    ctx.prefs = { ...mem }; ctx.seeded = true;
    const sum = Object.entries(ctx.prefs).filter(([k, v]) => v && LABEL[k] && !(Array.isArray(v) && !v.length)).map(([k, v]) => LABEL[k](v));
    if (sum.length) bubble('bot', `<p><span class="asst-memory">✦ Ultra memory</span></p><p>Welcome back! I remember: <b>${esc(sum.join(' · '))}</b>. Ask away, or say “start over” to reset.</p>`, false);
  }
  const head = $('.asst-profile .panel-head h3', host); if (head && hasMemory() && !$('.asst-memory', head.parentNode)) head.insertAdjacentHTML('afterend', '<span class="asst-memory" title="Saved to your account">✦ Remembered</span>');
  renderProfile(); if (!replay.length) renderChips(DEFAULT_CHIPS);
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) { try { history.replaceState({}, '', location.pathname); } catch (e) { /* file:// */ } ask(q0); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot);
  window.PMAssistant = { ask, reply: t => reply(t), extract, findMice: t => findMice(spell(norm(t))) };
})();
