/* =====================================================================
   ProMouser: CPS test v3 — cps-test.html

   Clicks are read from mousedown / pointerdown (not "click", which only
   fires on release and drops presses that end off the button), stamped with
   the event's own high-resolution time, and only counted inside the run's
   window. The run ends on a timer even if the tab stops drawing frames.
   The right-click menu, text selection, drag, middle-click autoscroll and
   back/forward buttons are all blocked inside the test.

   Everyone gets CPS, clicks, a rank, personal bests and history.
   Lite and Ultra (PMBackend.has('advanced')) also get: double-click count,
   stray right/left clicks with timestamps, peak CPS, consistency, click style,
   stamina and a CPS-over-time graph. Ultra adds a progress chart and CSV export.
   ===================================================================== */
(() => {
  'use strict';
  const host = document.querySelector('[data-cps]');
  if (!host) return;
  const B = window.PMBackend;
  const root = document.documentElement.dataset.root || '';
  const $ = (s, r = host) => r.querySelector(s);
  const DURS = [1, 2, 3, 5, 10, 15, 30, 60];
  const DOUBLE_MS = 30;     // two registered clicks closer than this = a double click
  const KEY = 'pm_cps';
  const RANKS = [
    [0, 'Warming up', 'Relax your grip and try a longer run.'],
    [5, 'Steady', 'A normal, comfortable clicking pace.'],
    [7, 'Quick', 'Faster than most people clicking normally.'],
    [9, 'Fast', 'Enough for most 1.8 PvP fights.'],
    [11, 'Jitter-tier', 'Proper PvP speed. Keep it consistent.'],
    [14, 'Butterfly-tier', 'Very fast. Your mouse needs to keep up.'],
    [20, 'Drag-click territory', 'Only a few mice and players get here.']
  ];

  let store = { opts: { dur: 5, btn: 0, moving: false }, best: {}, runs: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); store = { ...store, ...s, opts: { ...store.opts, ...(s.opts || {}) } }; } catch (e) { /* storage off */ }
  if (!DURS.includes(store.opts.dur)) store.opts.dur = 5;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage off */ } };
  const adv = () => !!(B && B.has && B.has('advanced'));
  const ultra = () => !!(B && B.has && B.has('export'));
  const dur = () => store.opts.dur * 1000;
  const bestKey = () => store.opts.dur + (store.opts.btn ? 'R' : '') + (store.opts.moving ? 'M' : '');
  const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '—');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rankOf = cps => RANKS.reduce((r, x) => (cps >= x[0] ? x : r), RANKS[0]);
  const btnName = b => (b === 2 ? 'right' : 'left');

  /* ---------- the numbers (pure, so tests can call it) ---------- */
  function analyze(clicks, wrong, misses, ms) {
    const n = clicks.length, sec = ms / 1000, cps = n / sec;
    const iv = clicks.slice(1).map((t, i) => t - clicks[i]);
    const mean = iv.length ? iv.reduce((a, b) => a + b, 0) / iv.length : 0;
    const sd = iv.length > 1 ? Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length) : 0;
    const sorted = [...iv].sort((a, b) => a - b), median = sorted.length ? sorted[sorted.length >> 1] : 0;
    let peak = n;                               // most clicks inside any 1-second window
    if (ms > 1000) { peak = 0; for (let i = 0, j = 0; i < n; i++) { while (clicks[i] - clicks[j] >= 1000) j++; peak = Math.max(peak, i - j + 1); } }
    const doubleAt = clicks.filter((t, i) => i > 0 && t - clicks[i - 1] < DOUBLE_MS);
    const first = clicks.filter(t => t < ms / 2).length, second = n - first;
    const short = iv.length ? iv.filter(x => x < 45).length / iv.length : 0;
    const style = n < 6 ? 'Too few clicks to tell' : cps >= 18 && median < 45 ? 'Drag clicking' : short > 0.3 && cps >= 9 ? 'Butterfly clicking' : cps >= 9.5 ? 'Jitter clicking' : 'Normal clicking';
    // rolling CPS for the graph
    const win = Math.min(1000, Math.max(250, ms / 4)), step = Math.max(50, ms / 40), line = [];
    for (let t = win; t <= ms + 0.1; t += step) line.push([t, clicks.filter(c => c > t - win && c <= t).length / (win / 1000)]);
    return {
      n, cps, peak: ms > 1000 ? peak : cps, mean, sd, median, fastest: sorted[0] || 0,
      consistency: mean ? Math.max(0, Math.min(100, Math.round(100 - (sd / mean) * 100))) : 0,
      doubles: doubleAt.length, doubleAt, wrong: wrong.length, wrongAt: wrong.slice(), misses,
      fade: first && ms >= 3000 ? ((second - first) / first) * 100 : null, style, line
    };
  }

  /* ---------- layout ---------- */
  host.innerHTML = `
    <div class="cps3">
      <div class="cps3-main panel">
        <div class="cps3-opts">
          <div class="seg" id="cDur" role="group" aria-label="Test length">${DURS.map(d => `<button type="button" data-d="${d}">${d}s</button>`).join('')}</div>
          <div class="seg" id="cBtn" role="group" aria-label="Button to test"><button type="button" data-b="0">Left click</button><button type="button" data-b="2">Right click</button></div>
          <button type="button" class="seg-toggle" id="cMove" aria-pressed="false">Moving target</button>
        </div>
        <div class="cps3-stage" id="cStage" data-phase="idle" role="button" aria-label="CPS test click area">
          <div class="cps3-target" id="cTarget"><b id="cBig">Click to start</b><small id="cSmall"></small></div>
          <div class="cps3-flash" id="cFlash" aria-live="polite"></div>
          <div class="cps3-progress"><i id="cProg"></i></div>
        </div>
        <div class="cps3-foot"><button class="btn btn-ghost btn-sm" id="cRestart" type="button">Restart <kbd>R</kbd></button>
          <span>The right-click menu is off inside the test, so a stray right click won’t open “Inspect” or a search menu.</span></div>
      </div>
      <aside class="cps3-side">
        <div class="panel cps3-live">
          <div class="cps3-big"><small>Clicks per second</small><b id="cCps">0.0</b></div>
          <div class="cps3-mini">
            <div><span>Clicks</span><b id="cClicks">0</b></div>
            <div><span>Time left</span><b id="cTime">0.00</b></div>
            <div><span id="cBestL">Best</span><b id="cBest">—</b></div>
          </div>
          <div class="cps3-mini" id="cLiveAdv"></div>
        </div>
        <div class="panel cps3-tips"><h3>Get a clean score</h3>
          <ul class="tick-list"><li>The timer starts on your first click, and that click counts.</li><li>Rest your wrist and click from the finger or forearm, not the shoulder.</li><li>Warm up with a 5 s run, then try 10 s for consistency.</li></ul></div>
      </aside>
    </div>
    <div class="cps3-result" id="cResult" aria-live="polite" hidden></div>
    <div class="panel cps3-history" id="cHist"></div>`;

  const stage = $('#cStage'), target = $('#cTarget');
  let S = { phase: 'idle' }, last = null, flashT = 0, moveT0 = 0;

  /* ---------- options ---------- */
  function syncOpts() {
    host.querySelectorAll('#cDur button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.d === store.opts.dur)));
    host.querySelectorAll('#cBtn button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.b === store.opts.btn)));
    $('#cMove').setAttribute('aria-pressed', String(store.opts.moving));
    stage.classList.toggle('moving', store.opts.moving);
  }
  $('#cDur').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) { store.opts.dur = +b.dataset.d; save(); reset(); } });
  $('#cBtn').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) { store.opts.btn = +b.dataset.b; save(); reset(); } });
  $('#cMove').addEventListener('click', () => { store.opts.moving = !store.opts.moving; save(); reset(); });
  $('#cRestart').addEventListener('click', reset);

  /* ---------- run ---------- */
  function reset() {
    clearTimeout(S.timer); cancelAnimationFrame(S.raf); clearTimeout(S.cool);
    S = { phase: 'idle' };
    stage.dataset.phase = 'idle';
    target.style.transform = '';
    $('#cBig').textContent = 'Click to start';
    $('#cSmall').textContent = `${store.opts.dur} second test · ${btnName(store.opts.btn)} click${store.opts.moving ? ' · moving target' : ''}`;
    $('#cProg').style.width = '0%';
    $('#cCps').textContent = '0.0'; $('#cClicks').textContent = '0'; $('#cTime').textContent = fmt(store.opts.dur, 2);
    syncOpts(); sidebar();
  }

  function begin(t) {
    S = { phase: 'running', start: t, clicks: [0], wrong: [], misses: 0 };
    stage.dataset.phase = 'running';
    $('#cResult').hidden = true;
    $('#cSmall').textContent = 'clicks';
    S.timer = setTimeout(finish, Math.max(0, t + dur() - performance.now()));
    moveT0 = t;
    S.raf = requestAnimationFrame(frame);
    counted();
  }

  function counted() {
    $('#cBig').textContent = S.clicks.length;
    $('#cClicks').textContent = S.clicks.length;
  }

  function frame() {
    if (S.phase !== 'running') return;
    const el = performance.now() - S.start;
    if (el >= dur()) return finish();
    const recent = S.clicks.filter(c => c > el - 1000).length;
    $('#cCps').textContent = fmt(recent / (Math.max(250, Math.min(el, 1000)) / 1000));
    $('#cTime').textContent = fmt(Math.max(0, (dur() - el) / 1000), 2);
    $('#cProg').style.width = (el / dur()) * 100 + '%';
    if (store.opts.moving) move(el);
    S.raf = requestAnimationFrame(frame);
  }

  function move(el) {   // smooth wandering path inside the stage
    const w = stage.clientWidth - target.offsetWidth, h = stage.clientHeight - target.offsetHeight;
    const x = (Math.sin(el / 900) * 0.6 + Math.sin(el / 370 + 1) * 0.4) * w / 2, y = (Math.cos(el / 700) * 0.6 + Math.sin(el / 450 + 2) * 0.4) * h / 2;
    target.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function finish() {
    if (S.phase !== 'running') return;
    clearTimeout(S.timer); cancelAnimationFrame(S.raf);
    S.phase = 'cooldown'; stage.dataset.phase = 'cooldown';
    const r = analyze(S.clicks, S.wrong, S.misses, dur());
    const key = bestKey(), prev = store.best[key];
    const run = { at: Date.now(), d: store.opts.dur, btn: store.opts.btn, moving: store.opts.moving, cps: +r.cps.toFixed(2), n: r.n, peak: +r.peak.toFixed(1), doubles: r.doubles, wrong: r.wrong };
    run.pb = !prev || run.cps > prev.cps;
    if (run.pb) store.best[key] = { cps: run.cps, at: run.at };
    store.runs = [run, ...store.runs].slice(0, 50);
    save();
    last = { r, run, clicks: S.clicks.slice() };
    $('#cBig').textContent = fmt(r.cps, 2) + ' CPS';
    $('#cSmall').textContent = run.pb ? 'New personal best!' : rankOf(r.cps)[1];
    $('#cCps').textContent = fmt(r.cps); $('#cTime').textContent = '0.00'; $('#cProg').style.width = '100%';
    target.style.transform = '';
    // a short lock so the clicks you were still making don't start a new run
    S.cool = setTimeout(() => { if (S.phase === 'cooldown') { S.phase = 'done'; stage.dataset.phase = 'done'; $('#cSmall').textContent = 'Click to go again'; } }, 900);
    sidebar(); renderResult(); renderHistory();
  }

  function stray(t, button) {
    if (S.phase !== 'running') return;
    const rel = t - S.start;
    if (rel > dur()) return;
    S.wrong.push(rel);
    if (adv()) { flash(`${button === 2 ? 'Right' : 'Left'} click at ${fmt(rel / 1000, 2)} s, not counted`); sidebar(); }
  }

  function flash(msg) {
    const f = $('#cFlash'); f.textContent = msg; f.classList.add('on');
    clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 1400);
  }

  const inTarget = (x, y) => { const b = target.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; };

  function press(t, button, x, y) {
    if (S.phase === 'cooldown') return;
    if (button !== store.opts.btn) { if (button === 0 || button === 2) stray(t, button); return; }
    if (store.opts.moving && !inTarget(x, y)) { if (S.phase === 'running') S.misses++; return; }
    if (S.phase !== 'running') return begin(t);
    const rel = t - S.start;
    if (rel > dur()) return finish();
    S.clicks.push(rel);
    counted();
    if (adv() && rel - S.clicks[S.clicks.length - 2] < DOUBLE_MS) sidebar();
  }

  // the event's own timestamp is closest to the real press; fall back if a browser reports something odd
  const stamp = e => { const p = performance.now(), t = e.timeStamp; return t > 0 && t <= p + 1 && p - t < 1000 ? t : p; };
  stage.addEventListener('mousedown', e => {
    e.preventDefault();               // no text selection, no focus jump, no middle-click autoscroll
    press(stamp(e), e.button, e.clientX, e.clientY);
  });
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;   // mice are handled by mousedown, which also sees chorded buttons
    e.preventDefault();                      // stops the copy of this tap arriving again as a mouse event
    press(stamp(e), store.opts.btn, e.clientX, e.clientY);
  });
  stage.addEventListener('mouseup', e => { if (e.button > 2) e.preventDefault(); });   // side buttons: don't go back/forward
  ['selectstart', 'dragstart', 'dblclick', 'auxclick'].forEach(t => stage.addEventListener(t, e => e.preventDefault()));
  host.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('contextmenu', e => { if (S.phase === 'running' || S.phase === 'cooldown') e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test((e.target.tagName || ''))) return;
    if (e.key === 'r' || e.key === 'R' || (e.key === 'Escape' && S.phase === 'running')) { e.preventDefault(); reset(); }
  });
  // a hidden tab stops drawing and throttles timers, which ruins a run: start over instead
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.phase === 'running') reset(); });

  /* ---------- sidebar ---------- */
  function sidebar() {
    const b = store.best[bestKey()];
    $('#cBestL').textContent = `Best (${store.opts.dur}s)`;
    $('#cBest').textContent = b ? fmt(b.cps, 2) : '—';
    const box = $('#cLiveAdv');
    if (!adv()) { box.innerHTML = `<p class="cps3-tease"><span class="plan-tag lite">Lite</span> Counts double clicks and stray right clicks while you play. <a href="${root}lite.html">See Lite</a></p>`; return; }
    const running = S.phase === 'running' || S.phase === 'cooldown';
    const clicks = running ? S.clicks : [], d = clicks.filter((t, i) => i > 0 && t - clicks[i - 1] < DOUBLE_MS).length;
    box.innerHTML = `<div><span>Double clicks</span><b>${running ? d : '—'}</b></div><div><span>Stray ${store.opts.btn ? 'left' : 'right'} clicks</span><b class="${running && S.wrong.length ? 'warn' : ''}">${running ? S.wrong.length : '—'}</b></div>${store.opts.moving ? `<div><span>Misses</span><b>${running ? S.misses : '—'}</b></div>` : ''}`;
  }

  /* ---------- results ---------- */
  function chart(r, ms) {
    const W = 640, H = 200, L = 34, R = 10, T = 12, Bm = 26;
    const top = Math.max(10, Math.ceil(Math.max(r.peak, ...r.line.map(p => p[1])) / 5) * 5);
    const X = t => L + (t / ms) * (W - L - R), Y = v => T + (1 - v / top) * (H - T - Bm);
    const grid = []; for (let v = 0; v <= top; v += 5) grid.push(`<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`);
    const pts = r.line.map(([t, v]) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const area = r.line.length ? `M${X(r.line[0][0])},${Y(0)} L${pts.replace(/ /g, ' L')} L${X(r.line[r.line.length - 1][0])},${Y(0)} Z` : '';
    const dbl = r.doubleAt.map(t => `<circle class="m-dbl" cx="${X(t).toFixed(1)}" cy="${H - Bm - 4}" r="4"><title>Double click at ${fmt(t / 1000, 2)} s</title></circle>`).join('');
    const wr = r.wrongAt.map(t => `<path class="m-wrong" d="M${X(t).toFixed(1)} ${T + 2} l5 9 h-10 z"><title>Stray click at ${fmt(t / 1000, 2)} s</title></path><line class="m-wrong-line" x1="${X(t).toFixed(1)}" x2="${X(t).toFixed(1)}" y1="${T + 11}" y2="${H - Bm}"/>`).join('');
    return `<svg class="cps3-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Clicks per second over the run">
      <g class="grid">${grid.join('')}</g>
      <path class="area" d="${area}"/><polyline class="line" points="${pts}"/>${wr}${dbl}
      <text class="ax" x="${L}" y="${H - 6}">0 s</text><text class="ax" x="${W - R}" y="${H - 6}" text-anchor="end">${ms / 1000} s</text></svg>
      <div class="cps3-legend"><span><i class="lg-line"></i>CPS</span><span><i class="lg-dbl"></i>Double click</span><span><i class="lg-wrong"></i>Stray ${store.opts.btn ? 'left' : 'right'} click</span></div>`;
  }

  const tile = (label, value, note, cls = '') => `<div class="cps3-tile ${cls}"><span>${label}</span><b>${value}</b>${note ? `<small>${note}</small>` : ''}</div>`;

  function advanced(r, run) {
    const wrongTimes = r.wrongAt.length ? r.wrongAt.slice(0, 6).map(t => fmt(t / 1000, 2) + ' s').join(', ') + (r.wrongAt.length > 6 ? '…' : '') : 'None. Clean run.';
    const other = run.btn ? 'left' : 'right';
    return `<div class="cps3-adv">
      <div class="cps3-tiles">
        ${tile('Peak CPS', fmt(r.peak, 1), run.d > 1 ? 'Best single second' : 'Over the whole run')}
        ${tile('Double clicks', r.doubles, r.n ? `${fmt((r.doubles / r.n) * 100, 0)}% of clicks · two clicks under ${DOUBLE_MS} ms apart` : '', r.doubles ? 'hot' : '')}
        ${tile(`Stray ${other} clicks`, r.wrong, wrongTimes, r.wrong ? 'warn' : 'good')}
        ${tile('Click style', r.style, r.style === 'Butterfly clicking' ? 'Lots of very close pairs: two fingers' : r.style === 'Jitter clicking' ? 'Fast and even, from one finger' : r.style === 'Drag clicking' ? 'Rapid bursts from finger friction' : '')}
        ${tile('Consistency', r.n > 2 ? r.consistency + '%' : '—', r.n > 2 ? 'How even the gaps between clicks were' : '')}
        ${tile('Average gap', r.n > 1 ? Math.round(r.mean) + ' ms' : '—', r.n > 1 ? `Fastest ${Math.round(r.fastest)} ms` : '')}
        ${r.fade !== null ? tile('Stamina', (r.fade >= 0 ? '+' : '') + fmt(r.fade, 0) + '%', r.fade < -10 ? 'You slowed down in the second half' : r.fade > 10 ? 'You sped up in the second half' : 'Even pace start to finish') : ''}
        ${run.moving ? tile('Misses', r.misses, 'Clicks that landed outside the target') : ''}
      </div>
      <div class="panel cps3-graph"><div class="panel-head"><h3>Your run, second by second</h3><span class="plan-tag ${ultra() ? 'ultra' : 'lite'}">${ultra() ? 'Ultra' : 'Lite'}</span></div>${chart(r, run.d * 1000)}
        <p class="panel-note">${r.doubles ? `A double click is two clicks registered less than ${DOUBLE_MS} ms apart. That’s faster than one finger can click, so it’s either butterfly fingers landing together or your mouse switch registering one press twice.` : 'No double clicks this run.'}</p></div>
      ${ultra() ? ultraBlock(run) : `<p class="cps3-tease">Ultra adds a progress chart across your runs and CSV export. <a href="${root}ultra.html">See Ultra</a></p>`}
    </div>`;
  }

  function ultraBlock(run) {
    const same = store.runs.filter(x => x.d === run.d && x.btn === run.btn && !!x.moving === !!run.moving).slice(0, 20).reverse();
    let spark = '<p class="panel-note">Do a few more runs at this length to see your progress.</p>';
    if (same.length > 1) {
      const W = 640, H = 120, max = Math.max(...same.map(x => x.cps)) * 1.1, min = Math.min(...same.map(x => x.cps)) * 0.9;
      const X = i => 14 + (i / (same.length - 1)) * (W - 28), Y = v => 10 + (1 - (v - min) / (max - min || 1)) * (H - 20);
      const half = Math.ceil(same.length / 2), avg = a => a.reduce((s, x) => s + x.cps, 0) / a.length;
      const trend = avg(same.slice(-half)) - avg(same.slice(0, half));
      spark = `<svg class="cps3-chart spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="CPS across your last runs"><polyline class="line" points="${same.map((x, i) => `${X(i).toFixed(1)},${Y(x.cps).toFixed(1)}`).join(' ')}"/>${same.map((x, i) => `<circle class="dot" cx="${X(i).toFixed(1)}" cy="${Y(x.cps).toFixed(1)}" r="3.5"><title>${x.cps} CPS</title></circle>`).join('')}</svg>
        <p class="panel-note">${trend >= 0 ? 'Up' : 'Down'} ${fmt(Math.abs(trend), 2)} CPS comparing your recent ${run.d} s runs with earlier ones.</p>`;
    }
    return `<div class="panel cps3-graph"><div class="panel-head"><h3>${same.length > 1 ? `Progress over your last ${same.length} runs` : 'Your progress'}</h3><span class="plan-tag ultra">Ultra</span></div>${spark}
      <div class="hero-cta"><button class="btn btn-ghost btn-sm" type="button" data-cps-export="history">Download history (CSV)</button><button class="btn btn-ghost btn-sm" type="button" data-cps-export="clicks">Download this run’s clicks (CSV)</button></div></div>`;
  }

  function locked() {
    const price = (window.PM_CONFIG && PM_CONFIG.lite.product.price) || '';
    const signedIn = B && B.getUser && B.getUser();
    return `<div class="cps3-adv cps3-locked">
      <div class="cps3-tiles" aria-hidden="true">${tile('Peak CPS', '12.4')}${tile('Double clicks', '7')}${tile('Stray right clicks', '2')}${tile('Click style', 'Jitter')}${tile('Consistency', '81%')}${tile('Average gap', '84 ms')}</div>
      <div class="cps3-lock"><span class="plan-tag lite">Lite</span><h4>See what really happened in that run</h4>
        <p>Lite counts your double clicks, catches stray right clicks mid-run, and shows peak CPS, consistency, click style and a second-by-second graph.</p>
        <div class="hero-cta" style="justify-content:center">${signedIn ? '' : '<button class="btn btn-ghost btn-sm" type="button" data-auth="signin">Sign in</button>'}<a class="btn btn-primary btn-sm" href="${root}lite.html">Get Lite${price ? ' · ₹' + price + '/month' : ''}</a></div></div>
    </div>`;
  }

  function renderResult() {
    if (!last) return;
    const { r, run } = last, rank = rankOf(r.cps), el = $('#cResult');
    el.hidden = false;
    el.innerHTML = `
      <div class="panel cps3-summary">
        <div class="cps3-score"><small>${run.d} s · ${btnName(run.btn)} click${run.moving ? ' · moving' : ''}</small><b>${fmt(r.cps, 2)}</b><span>CPS</span></div>
        <div class="cps3-verdict"><h3>${rank[1]} ${run.pb ? '<span class="chip">New personal best</span>' : ''}</h3><p>${rank[2]} ${r.n} clicks in ${run.d} s.</p>
          <div class="hero-cta"><button class="btn btn-primary btn-sm" type="button" data-cps-again>Go again</button><a class="btn btn-ghost btn-sm" href="${root}tests.html">More tests</a></div></div>
      </div>
      ${adv() ? advanced(r, run) : locked()}`;
  }

  function renderHistory() {
    const a = adv(), runs = store.runs.slice(0, 10), h = $('#cHist');
    const bests = DURS.map(d => store.best[d]).map((b, i) => b ? `<span class="chip">${DURS[i]}s · <b>${fmt(b.cps, 2)}</b></span>` : '').join('');
    h.innerHTML = `<div class="panel-head"><h3>Your recent runs</h3>${runs.length ? '<button class="btn btn-ghost btn-sm" type="button" data-cps-clear>Clear</button>' : ''}</div>
      ${bests ? `<div class="cps3-bests"><small>Best left-click scores</small>${bests}</div>` : ''}
      ${runs.length ? `<div class="table-wrap"><table class="cps3-table"><thead><tr><th>When</th><th>Test</th><th>CPS</th><th>Clicks</th>${a ? '<th>Peak</th><th>Double</th><th>Stray</th>' : ''}</tr></thead><tbody>
        ${runs.map(x => `<tr><td>${new Date(x.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>${x.d}s ${btnName(x.btn)}${x.moving ? ' · moving' : ''}</td><td><b>${fmt(x.cps, 2)}</b>${x.pb ? ' ★' : ''}</td><td>${x.n}</td>${a ? `<td>${fmt(x.peak, 1)}</td><td>${x.doubles}</td><td>${x.wrong}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
        : '<p class="panel-note">No runs yet. Your scores are saved in this browser.</p>'}`;
  }

  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  host.addEventListener('click', e => {
    if (e.target.closest('[data-cps-again]')) { reset(); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (e.target.closest('[data-cps-clear]')) { store.runs = []; store.best = {}; save(); renderHistory(); sidebar(); }
    const x = e.target.closest('[data-cps-export]');
    if (x && ultra()) {
      if (x.dataset.cpsExport === 'history') download('promouser-cps-history.csv', 'date,seconds,button,moving,cps,clicks,peak_cps,double_clicks,stray_clicks\n' + store.runs.map(r => [new Date(r.at).toISOString(), r.d, btnName(r.btn), !!r.moving, r.cps, r.n, r.peak, r.doubles, r.wrong].join(',')).join('\n'));
      else if (last) download('promouser-cps-run.csv', 'click,ms_from_start,gap_ms\n' + last.clicks.map((t, i) => [i + 1, t.toFixed(1), i ? (t - last.clicks[i - 1]).toFixed(1) : ''].join(',')).join('\n'));
    }
  });

  reset(); renderHistory();
  if (B && B.on) B.on(() => { sidebar(); renderResult(); renderHistory(); });
  window.PMCps = { analyze, rankOf, DOUBLE_MS, state: () => S.phase };
})();
