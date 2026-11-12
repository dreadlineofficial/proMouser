/* =====================================================================
   ProMouser — stats + recommendation engine
   Turns mice-data.js into plain-language spec scales, filters, comparisons
   and personalised fit scores. There is deliberately NO global ranking:
   every score is "how well does this mouse fit YOU", never "best overall".

     [data-mouse-profile="id"]  review-page spec scales + "who it fits"
     [data-explorer]            filter-first table + spec map
     [data-catalog]             mice card catalogue (search, chips, sort)
     [data-compare-lab]         pick up to 4 mice and compare them
     [data-hero-rotator]        rotating hero product with live stat chips
     #generatorRunBtn           "pro generator" on the mice page
   Exposes window.PM (used by recs.js and the account pages).
   ===================================================================== */
(() => {
  'use strict';
  if (!window.PM_MICE || !window.PM_MICE.length) return;

  /* ---------- helpers ---------- */
  const root = document.documentElement.dataset.root || '';
  const performanceMode = (() => {
    try { return JSON.parse(localStorage.getItem('pm_accessibility') || '{}').performance === true; }
    catch { return false; }
  })();
  const reduce = performanceMode || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = n => (n == null ? '—' : Math.round(n).toLocaleString('en-US'));
  const inr = n => (n == null ? '—' : '₹' + Math.round(n).toLocaleString('en-IN'));
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const cssVar = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();

  function tween(ms, fn, done) {
    if (reduce) { fn(1); done && done(); return; }
    const t0 = performance.now();
    (function frame(now) {
      const t = clamp((now - t0) / ms, 0, 1);
      fn(easeOut(t));
      if (t < 1) requestAnimationFrame(frame); else done && done();
    })(t0);
  }
  function onVisible(el, fn, threshold = .25) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold }).observe(el);
  }

  /* ---------- data ---------- */
  const MICE = window.PM_MICE.map(m => ({ ...m, cv: `var(--s${m.series})`, color: cssVar('--s' + m.series) || '#ff2a47', batteryLabel: m.battery != null ? `${m.battery} h` : null }));
  const byId = Object.fromEntries(MICE.map(m => [m.id, m]));
  const IMG = (m, w = 480) => m.img.startsWith('art/') ? `${root}assets/images/mice/${m.img}.svg` : `${root}assets/images/mice/${m.img}-${w}.webp`;   // art/… = illustrated render; photos load as WebP (PNG is the <picture> fallback)
  const CPS_DOTS = n => '●'.repeat(n) + '○'.repeat(5 - n);

  /* ---------- plain-language bands (no ranking) ---------- */
  const BANDS = {
    weight: { label: 'Weight', unit: 'g', get: m => m.weight, segs: [['Ultralight', 0, 60], ['Light', 60, 80], ['Medium', 80, 110], ['Heavy', 110, 160]],
      note: { Ultralight: 'Barely there. Easy to flick and reposition, which is why fast-aim players like it.', Light: 'Quick and agile without feeling hollow.', Medium: 'A planted, steady feel with more control at slower speeds.', Heavy: 'Solid and stable but slower to flick. Often adds extra buttons or weights.' } },
    dpi: { label: 'Max DPI', unit: 'DPI', get: m => m.dpi, segs: [['Standard', 0, 10000], ['High', 10000, 20000], ['Very high', 20000, 50000]],
      note: { Standard: 'Plenty for any game. Most players run between 400 and 1600 DPI anyway.', High: 'Lots of headroom. Higher DPI is sensitivity range, not accuracy.', 'Very high': 'Far more than most people use. It does not make the mouse more accurate by itself.' } },
    ips: { label: 'Tracking speed', unit: 'IPS', get: m => m.ips, segs: [['Standard', 0, 300], ['Fast', 300, 500], ['Very fast', 500, 1000]],
      note: { Standard: 'Fine for normal swipes.', Fast: 'Keeps up with quick flicks without losing track.', 'Very fast': 'Tracks even the fastest arm swipes without skipping.' } },
    poll: { label: 'Polling rate', unit: 'Hz', get: m => m.poll, segs: [['Office', 0, 1000], ['Gaming', 1000, 2000], ['High', 2000, 4000], ['Ultra', 4000, 8001]],
      note: { Office: 'Fine for everyday work.', Gaming: 'The normal gaming standard: 1,000 updates a second.', High: 'Smoother, slightly lower-latency motion if your PC can keep up.', Ultra: '8,000 updates a second for the lowest input delay. Needs a capable PC.' } },
    battery: { label: 'Battery life', unit: 'h', get: m => (m.connection === 'Wired' ? null : m.battery), segs: [['Short', 0, 50], ['Good', 50, 100], ['Long', 100, 300], ['Very long', 300, 1000]],
      note: { Short: 'Charge it often.', Good: 'Several days of heavy use between charges.', Long: 'Weeks of normal use.', 'Very long': 'Rarely needs charging.' } },
    buttons: { label: 'Buttons', unit: '', get: m => m.buttons, segs: [['Simple', 0, 6], ['Standard', 6, 9], ['Many', 9, 20]],
      note: { Simple: 'Clean and uncluttered: left, right, scroll and a couple of extras.', Standard: 'Room for a couple of shortcuts like sprint or a weapon swap.', Many: 'Lots to bind. Great for macros, MMOs and productivity.' } },
    price: { label: 'Price', unit: '', get: m => m.price, segs: [['Budget', 0, 3000], ['Mid-range', 3000, 6000], ['Premium', 6000, 12000]],
      note: { Budget: 'Easy on the wallet.', 'Mid-range': 'A balanced spend.', Premium: 'A flagship-level price.' } }
  };
  function bandOf(k, v) {
    const B = BANDS[k], n = B.segs.length;
    let i = B.segs.findIndex(s => v >= s[1] && v < s[2]); if (i < 0) i = n - 1;
    const [name, lo, hi] = B.segs[i];
    return { i, n, name, pos: (i + clamp((v - lo) / (hi - lo), 0, 1)) / n, note: B.note[name] };
  }
  const fmtVal = (k, v) => k === 'price' ? inr(v) : num(v) + (BANDS[k].unit ? ' ' + BANDS[k].unit : '');

  /* ---------- 1. review-page profile ---------- */
  function buildProfile(host) {
    const m = byId[host.dataset.mouseProfile]; if (!m) return;
    const keys = ['weight', 'dpi', 'ips', 'poll', 'battery', 'buttons', 'price'].filter(k => !(k === 'battery' && m.connection === 'Wired'));
    const rows = keys.map((k, i) => {
      const B = BANDS[k], v = B.get(m);
      if (v == null) return `<li class="band na"><div class="band-top"><span class="band-name">${B.label}</span><span class="band-val">Not published</span></div></li>`;
      const b = bandOf(k, v);
      return `<li class="band" style="--bd:${i * .06}s">
        <div class="band-top"><span class="band-name">${B.label}</span><span class="band-val"><b>${k === 'price' ? inr(v) : num(v)}</b>${B.unit ? `<small>${B.unit}</small>` : ''}<em>${b.name}</em></span></div>
        <div class="band-track" role="img" aria-label="${B.label}: ${fmtVal(k, v)}, ${b.name}">${B.segs.map((s, j) => `<i class="seg${j === b.i ? ' on' : ''}"></i>`).join('')}<span class="marker" data-pos="${(b.pos * 100).toFixed(1)}"></span></div>
        <div class="band-labels">${B.segs.map((s, j) => `<span class="${j === b.i ? 'on' : ''}">${s[0]}</span>`).join('')}</div>
        <p class="band-note">${b.note}</p></li>`;
    }).join('');
    const chips = (all, mine, label) => all.map(x => `<span class="fit-chip${mine.includes(x) ? ' on' : ''}" title="${mine.includes(x) ? 'Suits' : 'Not ideal for'} ${label}">${cap(x)}</span>`).join('');
    const click = ['butterfly', 'jitter', 'drag'].map(s => {
      const v = m.clicking[s]; const t = { great: 'Great', good: 'Good', poor: 'Not ideal' }[v] || 'Unknown';
      return `<span class="fit-chip${v === 'great' || v === 'good' ? ' on' : ''}${v === 'poor' ? ' off' : ''}">${cap(s)} · ${t}</span>`;
    }).join('');
    const gameLabels = { fps: 'FPS', minecraft: 'Minecraft', work: 'Work & creative', mmo: 'MMO & MOBA' };
    host.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h3>Specs in plain English</h3></div>
        <p class="panel-note">Where each number sits on a simple scale. No scores or rankings, because what matters depends on you.</p>
        <ul class="bands">${rows}</ul>
      </div>
      <div class="panel fit-panel">
        <div class="panel-head"><h3>Who it fits</h3></div>
        <p class="panel-note">Highlighted options are a good match. Fit is partly editorial; comfort is personal, so try before you buy if you can.</p>
        <div class="cps-block">
          <div class="cps-top"><span class="cps-dots" aria-label="CPS potential ${m.cps.level} out of 5">${CPS_DOTS(m.cps.level)}</span><b>${esc(m.cps.label)}</b><small>CPS potential for Minecraft</small></div>
          <p>${esc(m.cps.note)}</p>
        </div>
        <dl class="fit-rows">
          <div><dt>Grip</dt><dd>${chips(['palm', 'claw', 'fingertip'], m.grips, 'this grip')}</dd></div>
          <div><dt>Hand size</dt><dd>${chips(['small', 'medium', 'large'], m.handSize, 'this hand size')}</dd></div>
          <div><dt>Games</dt><dd>${['fps', 'minecraft', 'mmo', 'work'].map(g => `<span class="fit-chip${m.games.includes(g) ? ' on' : ''}">${gameLabels[g]}</span>`).join('')}</dd></div>
          <div><dt>Click style</dt><dd>${click}</dd></div>
          ${m.dims ? `<div><dt>Size</dt><dd><span class="fit-chip on">${m.dims[0]} × ${m.dims[1]} × ${m.dims[2]} mm</span>${m.lefty ? '<span class="fit-chip on">Left-hand friendly</span>' : m.shape === 'Ergonomic' ? '<span class="fit-chip off">Right hand only</span>' : ''}</dd></div>` : ''}
          <div><dt>Connection</dt><dd><span class="fit-chip on">${m.connection}</span>${m.battery ? `<span class="fit-chip on">${m.battery} h battery</span>` : ''}</dd></div>
          ${m.custom.length ? `<div><dt>Customising</dt><dd>${m.custom.map(c => `<span class="fit-chip on">${{ software: 'Software', macros: 'Macros', weights: 'Adjustable weights', debounce: 'Debounce setting', rgb: 'RGB', haptics: 'Haptic clicks' }[c] || c}</span>`).join('')}</dd></div>` : ''}
        </dl>
      </div>`;
    onVisible($('.bands', host), () => $$('.band', host).forEach(li => {
      const mk = $('.marker', li); if (!mk) return;
      requestAnimationFrame(() => { mk.style.left = mk.dataset.pos + '%'; li.classList.add('lit'); });
    }), .2);
  }

  /* ---------- 2. fit engine ---------- */
  const lightFit = w => clamp(1 - (w - 60) / 70, 0, 1);
  const pollFit = p => clamp(Math.log2(p / 125) / 6, 0, 1);
  function weightFit(w, pref) {
    if (pref === 'light') return clamp(1 - (w - 65) / 65, 0, 1);
    if (pref === 'balanced') return clamp(1 - Math.abs(w - 90) / 60, 0, 1);
    if (pref === 'heavy') return clamp((w - 80) / 45, 0, 1);
    return null;
  }
  function gameFit(m, g, p) {
    const key = ['creative', 'office', 'productivity', 'work'].includes(g) ? 'work' : g;
    const idx = m.games.indexOf(key), listFit = idx === 0 ? 1 : idx === 1 ? .8 : idx === 2 ? .6 : .3;
    const comfort = m.comfort / 5, cps = m.cps.level / 5;
    if (key === 'fps') return .42 * listFit + .3 * clamp(1 - (m.weight - 45) / 85, 0, 1) + .14 * pollFit(m.poll) + .14 * (m.ips ? clamp(m.ips / 650, 0, 1) : .4);   // fine-grained so 38 mice don't all tie
    if (key === 'minecraft') {
      if (p.mcVersion === '1.8') return .8 * cps + .1 * listFit + .1 * lightFit(m.weight);                       // 1.8 PvP: click speed decides
      if (p.mcVersion === '1.9+') return .3 * cps + .3 * comfort + .2 * lightFit(m.weight) + .2 * listFit;     // 1.9+: cooldown combat, control matters more
      return .7 * cps + .05 * comfort + .05 * lightFit(m.weight) + .2 * listFit;                               // default: Minecraft is a CPS game
    }
    if (key === 'mmo') return .35 * listFit + .45 * (m.buttons == null ? .3 : clamp((m.buttons - 5) / 14, 0, 1)) + .2 * comfort;   // MMO / MOBA: binds matter most
    return .35 * listFit + .35 * comfort + .3 * (m.buttons == null ? .5 : clamp(m.buttons / 8, 0, 1));
  }
  /* hand length (cm) → how well the mouse length suits it, by grip (palm wants the longest shell) */
  const IDEAL_RATIO = { palm: .67, claw: .645, fingertip: .62 };
  function handLengthFit(m, cm, grip) {
    if (!m.dims) return m.handSize.includes(cm < 17 ? 'small' : cm <= 19.5 ? 'medium' : 'large') ? .9 : .35;
    const ideal = cm * 10 * (IDEAL_RATIO[grip] || .645);
    return clamp(1 - Math.abs(m.dims[0] - ideal) / 22, 0, 1);
  }
  const GAME_NAME = { fps: 'FPS', minecraft: 'Minecraft', mmo: 'MMOs and MOBAs', work: 'work', office: 'office work', productivity: 'productivity', creative: 'creative work' };
  const CUSTOM_NAME = { software: 'software', macros: 'macros', weights: 'adjustable weights', debounce: 'a debounce setting', rgb: 'RGB', haptics: 'haptic clicks' };

  /* prefs: games[], weight, grip, connection  (+ Lite: handSize, mcVersion, budgetMax, minButtons, custom[], clickStyle, shape) */
  function fit(m, p) {
    const parts = [];
    const add = (key, label, weight, value, pro, con) => { if (value != null) parts.push({ key, label, weight, value, pro, con }); };
    const games = (p.games && p.games.length) ? p.games : [];
    if (games.length) {
      const vs = games.map(g => gameFit(m, g, p)); const v = .4 * Math.max(...vs) + .3 * (vs.reduce((a, b) => a + b, 0) / vs.length) + .3 * Math.min(...vs);   // a mouse must serve every selected game
      const g0 = games[vs.indexOf(Math.max(...vs))];
      const mc = games.includes('minecraft');
      add('game', 'Games', .38, v,
        mc && m.cps.level >= 4 && (p.mcVersion !== '1.9+') ? `${m.cps.label}: ${m.cps.note.split('. ')[0].replace(/\.$/, '')}` : `Suits ${GAME_NAME[g0] || g0}${m.games[0] === ({ creative: 'work', office: 'work', productivity: 'work' }[g0] || g0) ? ' — one of its main uses' : ''}`,
        `Not really built for ${games.map(g => GAME_NAME[g] || g).join(' / ')}`);
    }
    if (p.grip && p.grip !== 'any') add('grip', 'Grip', .22, m.grips.includes(p.grip) ? 1 : .35, `Suits a ${p.grip} grip`, `Better for ${m.grips.join(' / ')} grip than ${p.grip}`);
    const wf = weightFit(m.weight, p.weight);
    add('weight', 'Weight', .18, wf, `${m.weight} g matches your ${p.weight} preference`, `${m.weight} g is ${m.weight > 90 ? 'heavier' : 'lighter'} than you wanted`);
    if (p.connection && p.connection !== 'any') add('connection', 'Connection', .10, m.connection.toLowerCase() === p.connection ? 1 : .2, `${m.connection} as you wanted`, `${m.connection} only — you wanted ${p.connection}`);
    if (p.handLength) { const v = handLengthFit(m, p.handLength, p.grip); add('hand', 'Hand size', .12, v, `${m.dims ? m.dims[0] + ' mm long, ' : ''}a good size for a ${p.handLength} cm hand`, m.dims ? `${m.dims[0]} mm long — ${m.dims[0] > p.handLength * 10 * (IDEAL_RATIO[p.grip] || .645) ? 'big' : 'small'} for a ${p.handLength} cm hand` : 'Size not published'); }
    else if (p.handSize && p.handSize !== 'any') add('hand', 'Hand size', .10, m.handSize.includes(p.handSize) ? 1 : .3, `Comfortable for ${p.handSize} hands`, `Better for ${m.handSize.join(' / ')} hands`);
    if (p.lefty) add('lefty', 'Left hand', .35, m.lefty ? 1 : m.shape === 'Symmetrical' ? .7 : m.shape == null ? .5 : .05, m.lefty ? 'Side buttons on both sides for lefties' : 'Symmetrical, so it works in the left hand', 'Right-handed shape — not for lefties');
    if (p.budgetMax) {
      const v = m.price == null ? .5 : m.price <= p.budgetMax ? 1 : clamp(1 - (m.price - p.budgetMax) / p.budgetMax, 0, 1);
      add('budget', 'Budget', .12, v, `${inr(m.price)} is within your ${inr(p.budgetMax)} budget`, m.price == null ? 'No price listed yet' : `${inr(m.price - p.budgetMax)} over your budget`);
    }
    if (p.minButtons) add('buttons', 'Buttons', .06, m.buttons == null ? .5 : m.buttons >= p.minButtons ? 1 : clamp(m.buttons / p.minButtons, 0, 1), `${m.buttons} buttons (you wanted ${p.minButtons}+)`, m.buttons == null ? 'Button count not published' : `Only ${m.buttons} buttons`);
    if (p.custom && p.custom.length) { const got = p.custom.filter(c => m.custom.includes(c)); add('custom', 'Customising', .06, got.length / p.custom.length, `Offers ${got.map(c => CUSTOM_NAME[c]).join(', ')}`, `Missing ${p.custom.filter(c => !m.custom.includes(c)).map(c => CUSTOM_NAME[c]).join(', ')}`); }
    if (p.clickStyle && p.clickStyle !== 'any') { const l = m.clicking[p.clickStyle]; add('click', 'Click style', .08, { great: 1, good: .8, poor: .1 }[l] ?? .4, `${l === 'great' ? 'Great' : 'Good'} for ${p.clickStyle} clicking`, l === 'poor' ? `Not ideal for ${p.clickStyle} clicking` : `${cap(p.clickStyle)} clicking not confirmed`); }
    if (p.shape && p.shape !== 'any') add('shape', 'Shape', .04, m.shape == null ? .6 : m.shape.toLowerCase() === p.shape ? 1 : .35, `${cap(m.shape || p.shape)} shape as you wanted`, `${m.shape} shape instead of ${p.shape}`);
    const noClick = (p.games || []).includes('minecraft') && p.mcVersion !== '1.9+' && m.cps.level <= 1;
    const wsum = parts.reduce((a, x) => a + x.weight, 0) || 1;
    const score = Math.round(parts.reduce((a, x) => a + x.weight * x.value, 0) / wsum * 100);
    const pros = [...parts].filter(x => x.value >= .75).sort((a, b) => b.weight * b.value - a.weight * a.value).slice(0, 4).map(x => x.pro);
    const cons = [...parts].filter(x => x.value <= .45).sort((a, b) => b.weight * (1 - b.value) - a.weight * (1 - a.value)).slice(0, 3).map(x => x.con);
    if (noClick) cons.unshift('Can’t double-click, so it’s a weak pick for Minecraft CPS');
    return { m, score, parts, pros, cons };
  }
  const recommend = p => MICE.map(m => fit(m, p)).sort((a, b) => b.score - a.score || a.m.weight - b.m.weight);

  /* ---------- 3. explorer (mice): filter-first, no ranking ---------- */
  function buildExplorer(host) {
    const vals = k => MICE.map(BANDS[k].get).filter(v => v != null);
    const mn = k => Math.min(...vals(k)), mx = k => Math.max(...vals(k));
    host.innerHTML = `
      <div class="kpis">
        <div class="stat-tile"><span>Mice in catalogue</span><b>${MICE.length}</b><small>${new Set(MICE.map(m => m.brand)).size} brands</small></div>
        <div class="stat-tile"><span>Weights</span><b>${mn('weight')}–${mx('weight')} g</b><small>from ultralight to heavy</small></div>
        <div class="stat-tile"><span>Polling rates</span><b>${num(mn('poll'))}–${num(mx('poll'))} Hz</b><small>standard to ultra</small></div>
        <div class="stat-tile"><span>Prices</span><b>${inr(mn('price'))}–${inr(mx('price'))}</b><small>lowest trusted listings</small></div>
        <div class="stat-tile"><span>Wireless</span><b>${MICE.filter(m => m.connection === 'Wireless').length} of ${MICE.length}</b><small>the rest are wired</small></div>
      </div>
      <article class="panel" style="margin-top:20px">
        <div class="panel-head"><h3>Find mice by what you need</h3><button class="btn btn-outline btn-sm" id="xReset" type="button">Reset filters</button></div>
        <p class="panel-note">There’s no single best mouse. Narrow the list to what fits you, then click a name for the full review.</p>
        <div class="filters">
          <label>Game<select class="select" id="fGame"><option value="all">Any</option><option value="fps">FPS</option><option value="minecraft">Minecraft</option><option value="mmo">MMO &amp; MOBA</option><option value="work">Work &amp; creative</option></select></label>
          <label>Brand<select class="select" id="fBrand"><option value="all">Any</option>${[...new Set(MICE.map(m => m.brand))].sort().map(b => `<option>${esc(b)}</option>`).join('')}</select></label>
          <label>Grip<select class="select" id="fGrip"><option value="all">Any</option><option value="palm">Palm</option><option value="claw">Claw</option><option value="fingertip">Fingertip</option></select></label>
          <label>Hand size<select class="select" id="fHand"><option value="all">Any</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
          <label>Connection<select class="select" id="fConn"><option value="all">Any</option><option value="Wired">Wired</option><option value="Wireless">Wireless</option></select></label>
          <label>Weight<select class="select" id="fWeight"><option value="all">Any</option><option value="0-60">Ultralight (under 60 g)</option><option value="60-80">Light (60–79 g)</option><option value="80-110">Medium (80–109 g)</option><option value="110-999">Heavy (110 g +)</option></select></label>
          <label>Budget<select class="select" id="fBudget"><option value="all">Any</option><option value="0-3000">Under ₹3,000</option><option value="3000-6000">₹3,000–₹6,000</option><option value="6000-99999">₹6,000 +</option></select></label>
          <label>Minecraft CPS<select class="select" id="fCps"><option value="0">Any</option><option value="4">Strong or better</option><option value="5">Top CPS only</option></select></label>
        </div>
        <p class="result-line" id="xCount" aria-live="polite"></p>
        <div class="table-wrap"><table class="spec-grid"><thead><tr id="tHead"></tr></thead><tbody id="tBody"></tbody></table></div>
        <p class="stat-disclaimer">Specs are published headline figures where available; some values and fit guidance are estimates. Prices may be approximate or change by seller. “—” means the figure isn’t published.</p>
      </article>
      <article class="panel" style="margin-top:20px"><div class="panel-head"><h3>Spec map</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="select" id="scY" aria-label="Y axis"></select><select class="select" id="scX" aria-label="X axis"></select></div></div>
        <p class="panel-note">Plot any two specs against each other to see where the trade-offs are. Hover a dot for details, click it to read the review.</p>
        <div class="scatter-wrap"><svg class="scatter" id="scatter" viewBox="0 0 640 440" role="img" aria-label="Scatter plot of mouse specifications"></svg><div class="tip" id="scTip" hidden></div></div></article>`;

    const COLS = [
      { k: 'name', label: 'Mouse' }, { k: 'weight', label: 'Weight' }, { k: 'dpi', label: 'Max DPI' }, { k: 'ips', label: 'IPS' }, { k: 'poll', label: 'Polling' },
      { k: 'connection', label: 'Connection' }, { k: 'battery', label: 'Battery' }, { k: 'buttons', label: 'Buttons' }, { k: 'cps', label: 'Minecraft CPS' }, { k: 'price', label: 'Price' }
    ];
    const cellVal = (m, k) => k === 'name' ? m.name : k === 'connection' ? m.connection : k === 'battery' ? (m.connection === 'Wired' ? null : m.battery) : k === 'cps' ? m.cps.level : m[k];
    const f = { game: 'all', brand: 'all', grip: 'all', hand: 'all', conn: 'all', weight: 'all', budget: 'all', cps: 0 };
    let visible = new Set(MICE.map(m => m.id));
    let sortK = 'name', sortDir = 1;
    const tHead = $('#tHead', host), tBody = $('#tBody', host);
    tHead.innerHTML = COLS.map(c => `<th scope="col" data-k="${c.k}" aria-sort="none"><button type="button">${c.label}</button></th>`).join('');
    const rng = v => v.split('-').map(Number);
    function render() {
      const list = MICE.filter(m =>
        (f.game === 'all' || m.games.includes(f.game)) && (f.brand === 'all' || m.brand === f.brand) && (f.grip === 'all' || m.grips.includes(f.grip)) && (f.hand === 'all' || m.handSize.includes(f.hand)) &&
        (f.conn === 'all' || m.connection === f.conn) &&
        (f.weight === 'all' || (m.weight >= rng(f.weight)[0] && m.weight < rng(f.weight)[1])) &&
        (f.budget === 'all' || (m.price != null && m.price >= rng(f.budget)[0] && m.price < rng(f.budget)[1])) &&
        m.cps.level >= f.cps);
      list.sort((a, b) => {
        const va = cellVal(a, sortK), vb = cellVal(b, sortK);
        if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1;
        return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * sortDir;
      });
      $$('th', tHead).forEach(th => th.setAttribute('aria-sort', th.dataset.k === sortK ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'));
      $('#xCount', host).textContent = `Showing ${list.length} of ${MICE.length} mice`;
      visible = new Set(list.map(m => m.id)); if (svg.dataset.drawn) renderScatter();
      tBody.innerHTML = list.length ? list.map((m, i) => {
        const td = (v, txt) => `<td class="${v == null ? 'na' : ''}">${v == null ? '—' : txt}</td>`;
        return `<tr style="animation:msgIn .5s ${EASE} ${i * .04}s backwards"><td><span class="cell-mouse"><img src="${IMG(m)}" alt="" width="38" height="38" loading="lazy"><a href="${root + m.page}">${esc(m.name)}</a></span></td>
          ${td(m.weight, m.weight + ' g')}${td(m.dpi, num(m.dpi))}${td(m.ips, num(m.ips))}${td(m.poll, num(m.poll) + ' Hz')}<td>${m.connection}</td>${td(cellVal(m, 'battery'), m.battery + ' h')}${td(m.buttons, m.buttons)}
          <td><span class="cps-dots sm" title="${esc(m.cps.label)}">${CPS_DOTS(m.cps.level)}</span></td>${td(m.price, inr(m.price))}</tr>`;
      }).join('') : `<tr><td colspan="${COLS.length}" class="na" style="text-align:center;padding:2rem">No mice match those filters. Try widening them.</td></tr>`;
    }
    tHead.addEventListener('click', e => { const th = e.target.closest('th'); if (!th) return; if (sortK === th.dataset.k) sortDir *= -1; else { sortK = th.dataset.k; sortDir = th.dataset.k === 'cps' ? -1 : 1; } render(); });
    const bind = (id, key, parse = v => v) => $('#' + id, host).addEventListener('change', e => { f[key] = parse(e.target.value); render(); });
    bind('fGame', 'game'); bind('fBrand', 'brand'); bind('fGrip', 'grip'); bind('fHand', 'hand'); bind('fConn', 'conn'); bind('fWeight', 'weight'); bind('fBudget', 'budget'); bind('fCps', 'cps', Number);
    $('#xReset', host).addEventListener('click', () => { $$('.filters select', host).forEach(s => (s.selectedIndex = 0)); Object.assign(f, { game: 'all', brand: 'all', grip: 'all', hand: 'all', conn: 'all', weight: 'all', budget: 'all', cps: 0 }); render(); });

    /* spec map */
    const SC = {
      price: { label: 'Price (₹)', get: m => m.price, fmt: v => '₹' + Math.round(v / 100) / 10 + 'k' },
      weight: { label: 'Weight (g)', get: m => m.weight, fmt: v => Math.round(v) + ' g' },
      dpi: { label: 'Max DPI', get: m => m.dpi, fmt: v => Math.round(v / 1000) + 'k' },
      poll: { label: 'Polling rate (Hz)', get: m => m.poll, fmt: v => num(v), log: true },
      buttons: { label: 'Buttons', get: m => m.buttons, fmt: v => Math.round(v) },
      cps: { label: 'Minecraft CPS level (1–5)', get: m => m.cps.level, fmt: v => Math.round(v) }
    };
    const W = 640, H = 440, Mg = { l: 76, r: 30, t: 22, b: 58 };
    const svg = $('#scatter', host), tip = $('#scTip', host), xSel = $('#scX', host), ySel = $('#scY', host);
    [xSel, ySel].forEach(s => { s.innerHTML = Object.entries(SC).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join(''); });
    xSel.value = 'price'; ySel.value = 'weight';
    svg.innerHTML = '<g class="grid"></g><g class="axes"></g><g class="pts"></g>';
    const pts = {};
    MICE.forEach(m => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pt'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'link'); g.setAttribute('aria-label', m.name); g.style.setProperty('--c', m.cv);
      g.innerHTML = `<circle class="halo" r="14"/><circle class="core" r="6.5"/><text x="12" y="4">${esc(m.short)}</text>`;
      g.style.transform = `translate(${W / 2}px,${H / 2}px)`;
      const go = () => { location.href = root + m.page; };
      g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      const show = () => {
        const bb = g.getBoundingClientRect(), wb = svg.parentElement.getBoundingClientRect(), X = SC[xSel.value], Y = SC[ySel.value];
        tip.innerHTML = `<b>${esc(m.name)}</b>${X.label}: <b style="display:inline">${X.get(m) == null ? '—' : X.fmt(X.get(m))}</b><br>${Y.label}: <b style="display:inline">${Y.get(m) == null ? '—' : Y.fmt(Y.get(m))}</b>`;
        tip.style.left = clamp(bb.left - wb.left + bb.width / 2, 95, wb.width - 95) + 'px'; tip.style.top = bb.top - wb.top + 'px'; tip.hidden = false;
      };
      g.addEventListener('pointerenter', show); g.addEventListener('focus', show);
      g.addEventListener('pointerleave', () => (tip.hidden = true)); g.addEventListener('blur', () => (tip.hidden = true));
      pts[m.id] = g; $('.pts', svg).appendChild(g);
    });
    function scale(key, a, b) {
      const s = SC[key], vs = MICE.map(s.get).filter(v => v != null);
      let lo = Math.min(...vs), hi = Math.max(...vs);
      if (s.log) { lo = Math.log(lo); hi = Math.log(hi); }
      const pad = (hi - lo || 1) * .1; lo -= pad; hi += pad;
      return v => a + (((s.log ? Math.log(v) : v) - lo) / (hi - lo)) * (b - a);
    }
    function ticks(key) {
      const s = SC[key], vs = MICE.map(s.get).filter(v => v != null), lo = Math.min(...vs), hi = Math.max(...vs);
      if (s.log) return [125, 250, 500, 1000, 2000, 4000, 8000];
      if (key === 'cps') return [1, 2, 3, 4, 5];
      const step = (hi - lo) / 4 || 1, mag = Math.pow(10, Math.floor(Math.log10(step))), nice = ([1, 2, 2.5, 5, 10].find(n => n * mag >= step) || 10) * mag, out = [];
      for (let v = Math.ceil(lo / nice) * nice; v <= hi + 1e-6; v += nice) out.push(v); return out;
    }
    function renderScatter() {
      const xk = xSel.value, yk = ySel.value, sx = scale(xk, Mg.l, W - Mg.r), sy = scale(yk, H - Mg.b, Mg.t);
      let grid = '', axes = '';
      ticks(yk).forEach(v => { const y = sy(v); if (y < Mg.t - 4 || y > H - Mg.b + 4) return; grid += `<line x1="${Mg.l}" x2="${W - Mg.r}" y1="${y}" y2="${y}"/>`; axes += `<text x="${Mg.l - 12}" y="${y}" text-anchor="end" dominant-baseline="middle">${SC[yk].fmt(v)}</text>`; });
      ticks(xk).forEach(v => { const x = sx(v); if (x < Mg.l - 4 || x > W - Mg.r + 4) return; grid += `<line y1="${Mg.t}" y2="${H - Mg.b}" x1="${x}" x2="${x}"/>`; axes += `<text x="${x}" y="${H - Mg.b + 22}" text-anchor="middle">${SC[xk].fmt(v)}</text>`; });
      axes += `<text class="axis-title" x="${(Mg.l + W - Mg.r) / 2}" y="${H - 10}" text-anchor="middle">${SC[xk].label}</text><text class="axis-title" transform="translate(14 ${(Mg.t + H - Mg.b) / 2}) rotate(-90)" text-anchor="middle">${SC[yk].label}</text>`;
      $('.grid', svg).innerHTML = grid; $('.axes', svg).innerHTML = axes;
      MICE.forEach(m => {
        const vx = SC[xk].get(m), vy = SC[yk].get(m), g = pts[m.id];
        if (vx == null || vy == null) { g.style.opacity = 0; g.style.pointerEvents = 'none'; return; }
        const on = visible.has(m.id);
        g.style.opacity = on ? 1 : .12; g.style.pointerEvents = on ? '' : 'none'; g.classList.toggle('lbl', visible.size <= 12); g.style.transform = `translate(${sx(vx)}px,${sy(vy)}px)`;
      });
      svg.dataset.drawn = 1;
    }
    xSel.addEventListener('change', renderScatter); ySel.addEventListener('change', renderScatter);
    render();
    onVisible(svg, renderScatter, .2);
  }

  /* ---------- 4. finder (compare page) + generator (mice page) ---------- */
  const SCORE_RING = (host) => {
    const C = 2 * Math.PI * 52;
    host.classList.add('ring');
    host.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rg-bg" cx="60" cy="60" r="52"/><circle class="rg-fg" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div class="rg-num"><b>0</b><small>Match</small></div>`;
    const fg = $('.rg-fg', host), b = $('b', host);
    return v => { const prev = +host.dataset.v || 0; tween(900, t => { const x = prev + (v - prev) * t; fg.setAttribute('stroke-dashoffset', C * (1 - x / 100)); b.textContent = Math.round(x); }); host.dataset.v = v; };
  };

  function initGenerator() {
    const el = { focus: $('#generatorFocusSelect'), grip: $('#generatorGripSelect'), weight: $('#generatorWeightSelect'), connection: $('#generatorConnectionSelect'), run: $('#generatorRunBtn'),
      title: $('#generatorResultTitle'), copy: $('#generatorResultCopy'), score: $('#generatorScore'), grip2: $('#generatorGripScore'), weight2: $('#generatorWeightScore'), conn2: $('#generatorWirelessScore') };
    if (!el.focus) return;
    const stats = [el.score, el.grip2, el.weight2, el.conn2], cur = [0, 0, 0, 0];
    function run() {
      const top = recommend({ games: [el.focus.value], grip: el.grip.value, weight: el.weight.value, connection: el.connection.value })[0];
      el.title.textContent = `${top.m.name} fits you best`;
      el.copy.innerHTML = `${esc(top.pros.slice(0, 2).join(' · ') || top.m.bestFor)}. <a href="${root + top.m.page}" style="color:var(--accent);text-decoration:underline;text-underline-offset:3px">Read the review →</a>`;
      const pct = k => { const p = top.parts.find(x => x.key === k); return p ? Math.round(p.value * 100) : 0; };
      const to = [top.score, pct('grip'), pct('weight'), pct('connection')], from = [...cur];
      tween(800, t => to.forEach((v, i) => { cur[i] = from[i] + (v - from[i]) * t; stats[i].textContent = Math.round(cur[i]) + '%'; }));
      if (!reduce) el.title.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE });
    }
    el.run.addEventListener('click', run);
    ['focus', 'grip', 'weight', 'connection'].forEach(k => el[k].addEventListener('change', run));
    run();
  }

  /* ---------- 5. compare lab (no scores, just the facts side by side) ---------- */
  function initCompareLab(host) {
    const KEY = 'pm_compare_state';
    let sel = [];
    const qs = new URLSearchParams(location.search).get('m');
    if (qs) sel = qs.split(',').filter(id => byId[id]);
    if (!sel.length) sel = (store.get(KEY, {}).mice || []).filter(id => byId[id]);
    if (sel.length < 2) sel = ['razer-deathadder-v3', 'logitech-superlight-pro-x', 'glorious-model-o'];
    sel = sel.slice(0, 4);
    host.innerHTML = `<div class="picker" id="labPicker"></div>
      <article class="panel"><h3>Head to head</h3><p class="panel-note">Bars are scaled against the largest value among your picks. Bigger is not automatically better — it depends what you want.</p><div class="diff-bars" id="labDiff"></div></article>
      <article class="panel" style="margin-top:20px"><h3>Side by side</h3><p class="panel-note" id="labVerdict"></p><div class="table-wrap"><table class="compare-table"><thead id="labHead"></thead><tbody id="labBody"></tbody></table></div></article>`;
    const picker = $('#labPicker', host);
    function save() { store.set(KEY, { ...store.get(KEY, {}), mice: sel }); try { const p = new URLSearchParams(location.search); p.set('m', sel.join(',')); history.replaceState({}, '', `${location.pathname}?${p}`); } catch { /* file:// */ } }
    function render() {
      const picks = sel.map(id => byId[id]), free = MICE.filter(m => !sel.includes(m.id));
      picker.innerHTML = picks.map((m, i) => `<div class="pick-slot filled" style="--c:var(--s${i + 1})"><button class="rm" data-rm="${m.id}" aria-label="Remove ${esc(m.name)}">✕</button><img src="${IMG(m)}" alt="${esc(m.name)}"><div><small>${esc(m.brand)}</small><b>${esc(m.name)}</b></div></div>`).join('')
        + (sel.length < 4 ? `<div class="pick-slot"><div><b>Add a mouse</b><small>${4 - sel.length} slot${sel.length === 3 ? '' : 's'} left</small></div><select class="select" id="labAdd" aria-label="Add a mouse to compare"><option value="">Choose…</option>${[...new Set(free.map(m => m.brand))].sort().map(b => `<optgroup label="${esc(b)}">${free.filter(m => m.brand === b).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>` : '');
      const keys = [['weight', 'Weight', 'g'], ['dpi', 'Max DPI', 'DPI'], ['ips', 'Tracking speed', 'IPS'], ['poll', 'Polling rate', 'Hz'], ['buttons', 'Buttons', ''], ['price', 'Price', '']];
      $('#labDiff', host).innerHTML = keys.map(([k, label, unit]) => {
        const vs = picks.map(m => BANDS[k].get(m)).filter(v => v != null), ref = vs.length ? Math.max(...vs) : 1;
        return `<div class="diff-row"><span>${label}</span><div class="diff-bar-set">${picks.map((m, i) => {
          const v = BANDS[k].get(m), w = v == null ? 0 : clamp(v / ref, .05, 1) * 100;
          return `<div class="diff-bar" style="--c:var(--s${i + 1})"><i data-w="${w}"></i><em>${v == null ? '—' : (k === 'price' ? inr(v) : num(v) + (unit ? ' ' + unit : ''))}</em></div>`;
        }).join('')}</div></div>`;
      }).join('');
      const setBarWidths = () => $$('.diff-bar i', host).forEach(i => (i.style.width = i.dataset.w + '%'));
      if (reduce) setBarWidths();
      else requestAnimationFrame(() => requestAnimationFrame(setBarWidths));
      const rowsDef = [
        ['Weight', m => m.weight, m => m.weight + ' g'], ['Max DPI', m => m.dpi, m => num(m.dpi)], ['Tracking speed', m => m.ips, m => (m.ips ? m.ips + ' IPS' : null)],
        ['Polling rate', m => m.poll, m => num(m.poll) + ' Hz'], ['Buttons', m => m.buttons, m => m.buttons], ['Connection', null, m => m.connection],
        ['Battery', m => (m.connection === 'Wired' ? null : m.battery), m => (m.battery ? m.battery + ' h' : null)], ['Minecraft CPS', m => m.cps.level, m => `${m.cps.label} (${m.cps.level}/5)`],
        ['Sensor', null, m => m.sensor], ['Switches', null, m => m.switches], ['Shape', null, m => (m.shape ? m.shape + (m.hand ? ' · ' + m.hand : '') : null)],
        ['Best grips', null, m => m.grips.map(cap).join(' / ')], ['Hand sizes', null, m => m.handSize.map(cap).join(' / ')], ['Price', m => m.price, m => inr(m.price)]
      ];
      $('#labHead', host).innerHTML = `<tr><th>Spec</th>${picks.map(m => `<th><a href="${root + m.page}">${esc(m.short)}</a></th>`).join('')}</tr>`;
      $('#labBody', host).innerHTML = rowsDef.map(([label, val, fmt]) => {
        let lo = null, hi = null;
        if (val) { const vs = picks.map(val).filter(v => v != null); if (new Set(vs).size > 1) { lo = Math.min(...vs); hi = Math.max(...vs); } }
        return `<tr><td>${label}</td>${picks.map(m => { const t = fmt(m), v = val ? val(m) : null; const ext = lo !== null && v === lo ? 'lowest' : lo !== null && v === hi ? 'highest' : ''; return `<td class="${t == null ? 'na' : ext ? 'ext' : ''}">${t == null ? '—' : esc(String(t))}${ext ? `<small>${ext}</small>` : ''}</td>`; }).join('')}</tr>`;
      }).join('');
      const pick = (k, dir) => picks.filter(m => BANDS[k].get(m) != null).sort((a, b) => dir * (BANDS[k].get(a) - BANDS[k].get(b)))[0];
      const bits = [['Lightest', pick('weight', 1)], ['Most buttons', pick('buttons', -1)], ['Lowest price', pick('price', 1)], ['Fastest polling', pick('poll', -1)], ['Highest CPS potential', picks.slice().sort((a, b) => b.cps.level - a.cps.level)[0]]].filter(x => x[1]);
      $('#labVerdict', host).innerHTML = bits.map(([l, m]) => `${l}: <strong>${esc(m.short)}</strong>`).join(' · ');
      save();
    }
    host.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b && sel.length > 2) { sel = sel.filter(id => id !== b.dataset.rm); render(); } else if (b) { b.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 250 }); } });
    host.addEventListener('change', e => { if (e.target.id === 'labAdd' && e.target.value) { sel.push(e.target.value); render(); } });
    render();
  }

  /* ---------- 6. catalog (mice): search, chips, brand, sort ---------- */
  function initCatalog(grid) {
    const cards = $$('.mouse-card', grid), q = $('#catQ'), brand = $('#catBrand'), sort = $('#catSort'), count = $('#catCount'), empty = $('#catEmpty');
    let chip = 'all';
    const test = { all: () => true, wireless: c => c.dataset.conn === 'wireless', budget: c => +c.dataset.price > 0 && +c.dataset.price < 3000, ultralight: c => +c.dataset.weight < 60, cps: c => +c.dataset.cps >= 4 };
    function apply() {
      const words = (q.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
      const key = sort.value.replace('-', ''), dir = sort.value.startsWith('-') ? -1 : 1;
      const shown = cards.filter(c => (test[chip] ? test[chip](c) : c.dataset.games.split(' ').includes(chip)) && (brand.value === 'all' || c.dataset.brand === brand.value) && words.every(w => c.dataset.name.includes(w)));
      cards.forEach(c => { c.hidden = !shown.includes(c); });
      const val = c => key === 'name' ? c.dataset.name : +c.dataset[key] || (key === 'price' ? 1e9 : 0);
      shown.sort((a, b) => (key === 'name' ? val(a).localeCompare(val(b)) : val(a) - val(b)) * dir).forEach(c => { grid.appendChild(c); c.classList.add('in'); });
      count.textContent = `Showing ${shown.length} of ${cards.length} mice`; empty.hidden = shown.length > 0;
    }
    $$('.cat-chips .chip-btn').forEach(b => b.addEventListener('click', () => { chip = b.dataset.f; $$('.cat-chips .chip-btn').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); apply(); }));
    [q, brand, sort].forEach(el => el && el.addEventListener('input', apply));
    const pre = new URLSearchParams(location.search).get('brand'); if (pre && [...brand.options].some(o => o.value === pre)) { brand.value = pre; apply(); }
  }

  /* ---------- 7. hero rotator (home) ---------- */
  function initRotator(host) {
    const ids = (host.dataset.ids || '').split(',').filter(id => byId[id]);
    if (!ids.length) return;
    const stack = $('.rot-stack', host), lead = $('.rot-first img', stack), picts = ids.map((id, i) => {
      if (i === 0 && lead) { lead.className = 'rot-img'; lead.style.transition = 'opacity .9s ' + EASE + ', transform 1.1s ' + EASE; return lead; }
      const m = byId[id], im = document.createElement('img');
      im.src = IMG(m, 720); im.alt = ''; im.decoding = 'async'; im.className = 'rot-img'; im.style.opacity = 0; im.style.transform = 'translateY(24px) scale(.94) rotate(4deg)';
      im.style.transition = 'opacity .9s ' + EASE + ', transform 1.1s ' + EASE; stack.appendChild(im); return im;
    });
    const chips = { name: $('[data-rot-name]', host), w: $('[data-rot-w]', host), d: $('[data-rot-d]', host), p: $('[data-rot-p]', host) };
    let i = 0, timer;
    const setChips = m => { chips.name && (chips.name.textContent = m.name); chips.w && (chips.w.textContent = m.weight + ' g'); chips.d && (chips.d.textContent = num(m.dpi) + ' DPI'); chips.p && (chips.p.textContent = num(m.poll) + ' Hz'); };
    setChips(byId[ids[0]]);
    function go(n) {
      const old = picts[i]; i = (n + ids.length) % ids.length; const nu = picts[i], m = byId[ids[i]];
      old.style.opacity = 0; old.style.transform = 'translateY(-24px) scale(.94) rotate(-4deg)';
      nu.style.transform = 'none'; nu.style.opacity = 1;
      [chips.name, chips.w, chips.d, chips.p].forEach(c => c && c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1 }], { duration: 600, easing: 'ease' }));
      setTimeout(() => setChips(m), 300);
    }
    if (!reduce) { const start = () => { timer = setInterval(() => go(i + 1), 4200); }; start(); host.addEventListener('pointerenter', () => clearInterval(timer)); host.addEventListener('pointerleave', () => { clearInterval(timer); start(); }); }
  }

  /* ---------- boot ---------- */
  $$('[data-mouse-profile]').forEach(buildProfile);
  $$('[data-explorer]').forEach(buildExplorer);
  $$('[data-compare-lab]').forEach(initCompareLab);
  $$('[data-hero-rotator]').forEach(initRotator);
  $$('[data-catalog]').forEach(initCatalog);
  initGenerator();
  window.PM = { MICE, byId, BANDS, bandOf, recommend, fit, handLengthFit, IMG, inr, num, esc, cap, tween, store, CPS_DOTS, GAME_NAME, CUSTOM_NAME, SCORE_RING };
})();
