/* =====================================================================
   ProMouser: Test hub tests — reaction-test, aim-trainer, polling-rate-test,
   scroll-test, mouse-button-test pages ([data-test="…"]) and the hub's
   "your best" badges on tests ([data-test-hub]).

   Every test reads presses from mousedown / pointerdown with the event's own
   timestamp, and blocks the right-click menu, middle-click autoscroll and the
   back/forward side buttons inside its test area. Bests stay in this browser.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'pm_tests';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { /* storage off */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage off */ } };
  const stamp = e => { const p = performance.now(), t = e.timeStamp; return t > 0 && t <= p + 1 && p - t < 1000 ? t : p; };
  const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
  const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '—');

  // shared: a test area that never opens menus, selects text or navigates
  function guard(el) {
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('mouseup', e => { if (e.button > 2) e.preventDefault(); });
    ['selectstart', 'dragstart', 'dblclick', 'auxclick'].forEach(t => el.addEventListener(t, e => e.preventDefault()));
  }
  // calls fn(time, button, event) once per press, for mouse, touch and pen
  function onPress(el, fn) {
    el.addEventListener('mousedown', e => { e.preventDefault(); fn(stamp(e), e.button, e); });
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; e.preventDefault(); fn(stamp(e), 0, e); });
  }

  const TESTS = {};

  /* ---------- reaction time ---------- */
  TESTS.reaction = host => {
    const ROUNDS = 5;
    host.innerHTML = `<div class="tst">
      <div class="tst-stage react" id="rStage" data-state="idle" role="button" aria-label="Reaction test area"><b id="rBig">Click to start</b><small id="rSmall">${ROUNDS} rounds. When the box turns green, click as fast as you can.</small></div>
      <aside class="panel tst-side"><div class="cps3-big"><small>Average</small><b id="rAvg">—</b></div>
        <div class="cps3-mini"><div><span>Round</span><b id="rRound">0/${ROUNDS}</b></div><div><span>Last</span><b id="rLast">—</b></div><div><span>Your best avg</span><b id="rBest">${store.reaction ? store.reaction.best + ' ms' : '—'}</b></div></div>
        <ol class="tst-rounds" id="rList"></ol><p class="panel-note" id="rNote">Most people land between 200 and 300 ms. Pro players are often under 180 ms.</p></aside></div>`;
    const st = host.querySelector('#rStage'), $ = s => host.querySelector(s);
    let state = 'idle', times = [], goT = 0, timer = 0;
    const set = (s, big, small) => { state = s; st.dataset.state = s; $('#rBig').textContent = big; $('#rSmall').textContent = small; };
    const list = () => { $('#rList').innerHTML = times.map((t, i) => `<li><span>Round ${i + 1}</span><b>${Math.round(t)} ms</b></li>`).join(''); $('#rRound').textContent = `${times.length}/${ROUNDS}`; };
    const wait = () => { set('wait', 'Wait for green…', 'Don’t click yet'); clearTimeout(timer); timer = setTimeout(go, 1400 + Math.random() * 2600); };
    const go = () => { set('go', 'CLICK!', ''); goT = performance.now(); requestAnimationFrame(t => { if (state === 'go') goT = Math.max(goT, t); }); };
    guard(st);
    onPress(st, (t, b) => {
      if (b !== 0) return;
      if (state === 'idle' || state === 'done') { times = []; list(); $('#rAvg').textContent = '—'; return wait(); }
      if (state === 'wait') { clearTimeout(timer); return set('early', 'Too soon!', 'Click to retry this round'); }
      if (state === 'early' || state === 'shown') return wait();
      if (state === 'go') {
        const ms = Math.max(0, t - goT); times.push(ms); list();
        $('#rLast').textContent = Math.round(ms) + ' ms';
        $('#rAvg').textContent = Math.round(times.reduce((a, x) => a + x, 0) / times.length) + ' ms';
        if (times.length < ROUNDS) return set('shown', Math.round(ms) + ' ms', 'Click to keep going');
        const avg = Math.round(times.reduce((a, x) => a + x, 0) / times.length);
        const pb = !store.reaction || avg < store.reaction.best;
        if (pb) { store.reaction = { best: avg, at: Date.now() }; save(); $('#rBest').textContent = avg + ' ms'; }
        window.PMStats && PMStats.record('reaction', avg, ROUNDS + ' rounds');
        $('#rNote').textContent = avg < 180 ? 'Elite reactions. Esports-level.' : avg < 230 ? 'Fast. Better than most players.' : avg < 300 ? 'Normal human range. Warm up and try again.' : 'Slower than usual. Make sure you’re rested and focused.';
        set('done', avg + ' ms average', pb ? 'New personal best! Click to go again' : 'Click to go again');
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && (state === 'wait' || state === 'go')) { clearTimeout(timer); set('idle', 'Click to start', 'Paused because you switched tabs.'); } });
  };

  /* ---------- aim trainer ---------- */
  TESTS.aim = host => {
    const SIZES = { large: 64, medium: 46, small: 30 };
    let opt = { n: 30, size: 'medium', ...(store.aimOpt || {}) };
    host.innerHTML = `<div class="tst">
      <div class="panel tst-main"><div class="cps3-opts">
          <div class="seg" id="aN" role="group" aria-label="Targets">${[20, 30, 50].map(n => `<button type="button" data-n="${n}">${n} targets</button>`).join('')}</div>
          <div class="seg" id="aS" role="group" aria-label="Target size">${Object.keys(SIZES).map(s => `<button type="button" data-s="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div></div>
        <div class="tst-stage aim" id="aStage" role="application" aria-label="Aim trainer area"><div class="aim-target" id="aTarget"></div><div class="aim-msg" id="aMsg"><b>Click the target to start</b><small>Hit each target as fast as you can</small></div></div></div>
      <aside class="panel tst-side"><div class="cps3-big"><small>Time</small><b id="aTime">0.00 s</b></div>
        <div class="cps3-mini"><div><span>Hits</span><b id="aHits">0</b></div><div><span>Accuracy</span><b id="aAcc">—</b></div><div><span>Per target</span><b id="aPer">—</b></div><div><span>Best</span><b id="aBest">—</b></div></div>
        <p class="panel-note" id="aNote">Accuracy counts every click that missed. Speed means nothing if you miss.</p></aside></div>`;
    const $ = s => host.querySelector(s), stage = $('#aStage'), tgt = $('#aTarget');
    let run = null, raf = 0;
    const cfgKey = () => opt.n + opt.size;
    const sync = () => {
      host.querySelectorAll('#aN button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.n === opt.n)));
      host.querySelectorAll('#aS button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === opt.size)));
      const b = (store.aim || {})[cfgKey()]; $('#aBest').textContent = b ? fmt(b / 1000, 2) + ' s' : '—';
    };
    const place = (center) => {
      const d = SIZES[opt.size], w = stage.clientWidth, h = stage.clientHeight;
      const x = center ? w / 2 : d / 2 + Math.random() * (w - d), y = center ? h / 2 : d / 2 + Math.random() * (h - d);
      Object.assign(tgt.style, { width: d + 'px', height: d + 'px', left: x - d / 2 + 'px', top: y - d / 2 + 'px' });
      tgt.dataset.x = x; tgt.dataset.y = y;
    };
    const reset = () => { cancelAnimationFrame(raf); run = null; $('#aMsg').hidden = false; $('#aTime').textContent = '0.00 s'; $('#aHits').textContent = '0'; $('#aAcc').textContent = '—'; $('#aPer').textContent = '—'; sync(); place(true); };
    const tick = () => { if (!run) return; $('#aTime').textContent = fmt((performance.now() - run.start) / 1000, 2) + ' s'; raf = requestAnimationFrame(tick); };
    $('#aN').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { opt.n = +b.dataset.n; store.aimOpt = opt; save(); reset(); } });
    $('#aS').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { opt.size = b.dataset.s; store.aimOpt = opt; save(); reset(); } });
    guard(stage);
    onPress(stage, (t, b, e) => {
      if (b !== 0) return;
      const r = stage.getBoundingClientRect(), dx = e.clientX - r.left - +tgt.dataset.x, dy = e.clientY - r.top - +tgt.dataset.y;
      const hit = Math.hypot(dx, dy) <= SIZES[opt.size] / 2 + 2;
      if (!run) { if (!hit) return; run = { start: t, hits: 0, shots: 0, last: t }; $('#aMsg').hidden = true; raf = requestAnimationFrame(tick); }
      if (run.done) return;
      run.shots++;
      if (hit) {
        run.hits++; run.last = t;
        tgt.classList.remove('pop'); void tgt.offsetWidth; tgt.classList.add('pop');
      }
      // the first hit only starts the clock, so it isn't one of the n targets
      const scored = run.hits - 1, shots = run.shots - 1;
      $('#aHits').textContent = `${Math.max(0, scored)}/${opt.n}`;
      if (shots > 0) $('#aAcc').textContent = Math.round((scored / shots) * 100) + '%';
      if (scored > 0) $('#aPer').textContent = Math.round((t - run.start) / scored) + ' ms';
      if (scored >= opt.n) {
        run.done = true; cancelAnimationFrame(raf);
        const ms = t - run.start, acc = scored / shots;
        $('#aTime').textContent = fmt(ms / 1000, 2) + ' s';
        store.aim = store.aim || {};
        const pb = !store.aim[cfgKey()] || ms < store.aim[cfgKey()];
        if (pb) { store.aim[cfgKey()] = Math.round(ms); save(); }
        window.PMStats && PMStats.record('aim', ms / opt.n, `${opt.n} targets · ${opt.size}`);
        sync();
        $('#aNote').textContent = (pb ? 'New personal best! ' : '') + (acc < 0.8 ? 'Slow down a little: accuracy under 80% loses fights.' : ms / opt.n < 450 ? 'Fast and accurate. Try smaller targets.' : 'Clean. Now try to keep that accuracy while going faster.');
        $('#aMsg').hidden = false; $('#aMsg').innerHTML = `<b>${fmt(ms / 1000, 2)} s · ${Math.round(acc * 100)}%</b><small>Click the target to go again</small>`;
        run = null; place(true); return;
      }
      if (hit) place(false);
    });
    window.addEventListener('resize', () => { if (!run) place(true); });
    reset();
  };

  /* ---------- polling rate ---------- */
  TESTS.polling = host => {
    const RATES = [125, 250, 500, 1000, 2000, 4000, 8000];
    const hasCo = 'getCoalescedEvents' in PointerEvent.prototype;
    host.innerHTML = `<div class="tst">
      <div class="tst-stage poll" id="pStage" aria-label="Polling rate test area"><b id="pMsg">Move your mouse in fast circles here</b><small>Keep moving for a few seconds</small><div class="poll-bars" id="pBars" aria-hidden="true"></div></div>
      <aside class="panel tst-side"><div class="cps3-big"><small>Polling rate</small><b id="pRate">—</b></div>
        <div class="cps3-mini"><div><span>Right now</span><b id="pNow">—</b></div><div><span>Peak</span><b id="pPeak">—</b></div><div><span>Samples</span><b id="pN">0</b></div></div>
        <button class="btn btn-ghost btn-sm" id="pReset" type="button">Reset</button>
        <p class="panel-note">${hasCo ? 'Measured from every movement report your mouse sends. 4,000 and 8,000 Hz mice read best in Chrome or Edge, and need a fast PC.' : 'Your browser only reports movement once per screen frame, so results stop at your refresh rate. Try Chrome, Edge or Firefox.'}</p></aside></div>`;
    const $ = s => host.querySelector(s), stage = $('#pStage');
    let last = 0, iv = [], peak = 0, bars = [], drawn = 0;
    const nearest = hz => RATES.reduce((a, r) => (Math.abs(Math.log(r / hz)) < Math.abs(Math.log(a / hz)) ? r : a), RATES[0]);
    guard(stage);
    stage.addEventListener('pointermove', e => {
      const evs = hasCo ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const t = ev.timeStamp;
        if (last && t > last) { const d = t - last; if (d < 25) iv.push(d); }   // gaps over 25 ms are pauses, not reports
        last = t;
      }
      if (iv.length > 6000) iv = iv.slice(-3000);
      const now = performance.now();
      if (now - drawn < 100 || iv.length < 40) return;
      drawn = now;
      const cur = 1000 / median(iv.slice(-150)), all = 1000 / median(iv);
      if (iv.length >= 150) peak = Math.max(peak, cur);
      const est = nearest(all);
      $('#pRate').textContent = est.toLocaleString('en-IN') + ' Hz';
      $('#pNow').textContent = Math.round(cur).toLocaleString('en-IN') + ' Hz';
      $('#pPeak').textContent = peak ? Math.round(peak).toLocaleString('en-IN') + ' Hz' : '—';
      $('#pN').textContent = iv.length.toLocaleString('en-IN');
      $('#pMsg').textContent = `About ${est.toLocaleString('en-IN')} Hz`;
      bars = [...bars, cur].slice(-48);
      const top = Math.max(1000, ...bars);
      $('#pBars').innerHTML = bars.map(v => `<i style="height:${Math.max(4, (v / top) * 100).toFixed(0)}%"></i>`).join('');
      if (!store.polling || est > store.polling.hz) { store.polling = { hz: est, at: Date.now() }; save(); }
    });
    const logP = () => { if (iv.length > 500) window.PMStats && PMStats.record('polling', nearest(1000 / median(iv))); };
    addEventListener('pagehide', logP);
    $('#pReset').addEventListener('click', () => { logP(); last = 0; iv = []; peak = 0; bars = []; ['#pRate', '#pNow', '#pPeak'].forEach(s => { $(s).textContent = '—'; }); $('#pN').textContent = '0'; $('#pBars').innerHTML = ''; $('#pMsg').textContent = 'Move your mouse in fast circles here'; });
  };

  /* ---------- scroll wheel ---------- */
  TESTS.scroll = host => {
    host.innerHTML = `<div class="tst">
      <div class="tst-stage scroll" id="sStage" tabindex="0" aria-label="Scroll test area"><div class="scroll-tape" id="sTape" aria-hidden="true"></div><b id="sMsg">Scroll here, one notch at a time</b><small id="sSmall">Scroll down 20 notches, then up 20</small></div>
      <aside class="panel tst-side"><div class="cps3-big"><small>Reverse jumps</small><b id="sJumps">0</b></div>
        <div class="cps3-mini"><div><span>Down</span><b id="sDown">0</b></div><div><span>Up</span><b id="sUp">0</b></div><div><span>Wheel clicks</span><b id="sMid">0</b></div></div>
        <button class="btn btn-ghost btn-sm" id="sReset" type="button">Reset</button>
        <p class="panel-note" id="sNote">A reverse jump is a single step the wrong way in the middle of a scroll. A few in a row means a worn or dirty scroll wheel encoder.</p></aside></div>`;
    const $ = s => host.querySelector(s), stage = $('#sStage');
    let ev = [], down = 0, up = 0, jumps = 0, mid = 0, pos = 0, smooth = 0;
    const show = () => { $('#sDown').textContent = down; $('#sUp').textContent = up; $('#sJumps').textContent = jumps; $('#sMid').textContent = mid; $('#sJumps').className = jumps ? 'warn' : ''; };
    guard(stage);
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      if (!e.deltaY) return;
      const t = e.timeStamp, d = Math.sign(e.deltaY);
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 20) smooth++;
      d > 0 ? down++ : up++;
      ev.push([t, d]); if (ev.length > 3) ev.shift();
      // a step the wrong way, sandwiched between steps the right way inside one quick scroll
      if (ev.length === 3 && ev[1][1] !== d && ev[0][1] === d && t - ev[0][0] < 400) {
        jumps++; stage.classList.remove('jump'); void stage.offsetWidth; stage.classList.add('jump');
        $('#sSmall').textContent = `Reverse jump spotted while scrolling ${d > 0 ? 'down' : 'up'}`;
      }
      pos += Math.max(-60, Math.min(60, e.deltaY * (e.deltaMode === 1 ? 33 : 1)));
      $('#sTape').style.backgroundPositionY = -pos * 0.6 + 'px';
      $('#sMsg').textContent = d > 0 ? '↓ Down' : '↑ Up';
      if (smooth > 25) $('#sNote').textContent = 'This looks like smooth scrolling or a touchpad, which sends lots of tiny steps. For a fair test use a mouse wheel, and turn off smooth scrolling if your mouse software has it.';
      show();
    }, { passive: false });
    stage.addEventListener('mousedown', e => { if (e.button === 1) { e.preventDefault(); mid++; show(); } });
    const logS = () => { if (down + up >= 20) window.PMStats && PMStats.record('scroll', jumps / (down + up) * 100); };
    addEventListener('pagehide', logS);
    $('#sReset').addEventListener('click', () => { logS(); ev = []; down = up = jumps = mid = smooth = 0; show(); $('#sMsg').textContent = 'Scroll here, one notch at a time'; $('#sSmall').textContent = 'Scroll down 20 notches, then up 20'; });
    show();
  };

  /* ---------- mouse buttons ---------- */
  TESTS.buttons = host => {
    const CHATTER_MS = 60;
    const BTN = [[0, 'Left'], [2, 'Right'], [1, 'Middle'], [3, 'Back'], [4, 'Forward']];
    host.innerHTML = `<div class="tst">
      <div class="tst-stage buttons" id="bStage" role="application" aria-label="Mouse button test area">
        <div class="mouse-diagram" aria-hidden="true"><i class="mb mb-0"></i><i class="mb mb-2"></i><i class="mb mb-1"></i><i class="mb mb-3"></i><i class="mb mb-4"></i><span class="mb-wheel" id="bWheel"></span></div>
        <small>Press every button on your mouse while the pointer is in this box</small></div>
      <aside class="panel tst-side"><table class="btn-table"><thead><tr><th>Button</th><th>Presses</th><th>Held</th><th>Chatter</th></tr></thead>
        <tbody>${BTN.map(([b, n]) => `<tr data-b="${b}"><td>${n}</td><td class="c">0</td><td class="h">—</td><td class="x">0</td></tr>`).join('')}</tbody></table>
        <button class="btn btn-ghost btn-sm" id="bReset" type="button">Reset</button>
        <p class="panel-note">Click each button normally (not butterfly clicking). A second press within ${CHATTER_MS} ms of the last one counts as <b>chatter</b>: one press registering twice, the usual sign of a worn switch.</p></aside></div>`;
    const $ = s => host.querySelector(s), stage = $('#bStage');
    let data = {};
    const row = b => host.querySelector(`tr[data-b="${b}"]`);
    const reset = () => { data = {}; BTN.forEach(([b]) => { const r = row(b); r.querySelector('.c').textContent = '0'; r.querySelector('.h').textContent = '—'; r.querySelector('.x').textContent = '0'; r.className = ''; }); };
    guard(stage);
    stage.addEventListener('mousedown', e => {
      e.preventDefault();
      const b = e.button, t = stamp(e), d = data[b] = data[b] || { n: 0, chatter: 0 };
      if (d.lastDown && t - d.lastDown < CHATTER_MS) d.chatter++;
      d.n++; d.lastDown = t; d.down = t;
      const r = row(b); if (!r) return;
      r.querySelector('.c').textContent = d.n; r.querySelector('.x').textContent = d.chatter; r.className = 'on' + (d.chatter ? ' bad' : '');
      stage.querySelector('.mb-' + b)?.classList.add('on');
    });
    const up = e => {
      const d = data[e.button]; if (!d || !d.down) return;
      const r = row(e.button); if (r) { r.querySelector('.h').textContent = Math.round(stamp(e) - d.down) + ' ms'; r.classList.remove('on'); }
      d.down = 0; stage.querySelector('.mb-' + e.button)?.classList.remove('on');
    };
    stage.addEventListener('mouseup', up);
    stage.addEventListener('mouseleave', () => stage.querySelectorAll('.mb.on').forEach(x => x.classList.remove('on')));
    stage.addEventListener('wheel', e => { e.preventDefault(); const w = $('#bWheel'); w.dataset.dir = e.deltaY > 0 ? 'down' : 'up'; w.classList.remove('spin'); void w.offsetWidth; w.classList.add('spin'); }, { passive: false });
    const logB = () => { const v = Object.values(data), n = v.reduce((a, d) => a + d.n, 0); if (n >= 10) window.PMStats && PMStats.record('buttons', v.reduce((a, d) => a + d.chatter, 0), n + ' presses'); };
    addEventListener('pagehide', logB);
    $('#bReset').addEventListener('click', () => { logB(); reset(); });
  };

  document.querySelectorAll('[data-test]').forEach(el => { const f = TESTS[el.dataset.test]; if (f) f(el); });

  /* ---------- hub: personal bests on the cards ---------- */
  const hub = document.querySelector('[data-test-hub]');
  if (hub) {
    let cps = {};
    try { cps = JSON.parse(localStorage.getItem('pm_cps') || '{}').best || {}; } catch (e) { /* storage off */ }
    const bestCps = Object.entries(cps).filter(([k]) => /^\d+$/.test(k)).sort((a, b) => b[1].cps - a[1].cps)[0];
    const aim = Object.entries(store.aim || {}).sort((a, b) => a[1] - b[1])[0];
    const best = {
      cps: bestCps && `${bestCps[1].cps.toFixed(2)} CPS (${bestCps[0]}s)`,
      reaction: store.reaction && `${store.reaction.best} ms`,
      aim: aim && `${(aim[1] / 1000).toFixed(2)} s (${aim[0].replace(/(\d+)/, '$1 ')})`,
      polling: store.polling && `${store.polling.hz.toLocaleString('en-IN')} Hz`
    };
    hub.querySelectorAll('[data-best]').forEach(el => { const v = best[el.dataset.best]; if (v) { el.textContent = 'Your best: ' + v; el.hidden = false; } });
  }
  window.PMTests = { median };
})();
