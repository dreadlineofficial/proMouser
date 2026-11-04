/* =====================================================================
   ProMouser: skill tests, part 2 ([data-test="…"] on their own pages)
     tracking   keep the cursor on a moving target            % on target
     flick      snap from the centre to a target, 20 times    ms per flick + path efficiency
     rush       shrinking targets, faster and faster, 3 lives targets hit
     rhythm     click on the beat                             ms off the beat
     circle     draw a circle in one stroke (+ angle-snapping check)  % round
     dpi        measure your mouse's real DPI with a ruler    DPI
   Each finished run goes to PMStats.record (stats, XP, daily challenge).
   Personal bests are kept in this browser (pm_tests2).
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'pm_tests2';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { /* storage off */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage off */ } };
  const stamp = e => { const p = performance.now(), t = e.timeStamp; return t > 0 && t <= p + 1 && p - t < 1000 ? t : p; };
  const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const record = (t, v, k) => { if (window.PMStats) PMStats.record(t, v, k); };
  // best per test + option key; returns true when it's a new best
  const best = (test, k, v, higher) => { const b = store[test] = store[test] || {}; const pb = b[k] == null || (higher ? v > b[k] : v < b[k]); if (pb) { b[k] = v; save(); } return pb; };
  const getBest = (test, k) => ((store[test] || {})[k]);

  function guard(el) {
    el.addEventListener('contextmenu', e => e.preventDefault());
    ['selectstart', 'dragstart', 'dblclick', 'auxclick'].forEach(t => el.addEventListener(t, e => e.preventDefault()));
  }
  function onPress(el, fn) {
    el.addEventListener('mousedown', e => { e.preventDefault(); fn(stamp(e), e.button, e); });
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; e.preventDefault(); fn(stamp(e), 0, e); });
  }
  const seg = (id, label, opts, cur) => `<div class="seg" id="${id}" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join('')}</div>`;
  const segOn = (host, id, fn) => host.querySelector('#' + id).addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; host.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute('aria-pressed', String(x === b))); fn(b.dataset.v); });
  const side = (big, minis, note) => `<aside class="panel tst-side"><div class="cps3-big"><small>${big[0]}</small><b id="${big[1]}">—</b></div>
    <div class="cps3-mini">${minis.map(([l, id]) => `<div><span>${l}</span><b id="${id}">—</b></div>`).join('')}</div><p class="panel-note" id="${note[0]}">${note[1]}</p></aside>`;
  const T = {};

  /* ---------- tracking: keep the cursor on a moving target ---------- */
  T.tracking = host => {
    const SPEED = { slow: .55, medium: .85, fast: 1.25 };
    let opt = { dur: 30, speed: 'medium', ...(store.trackingOpt || {}) };
    host.innerHTML = `<div class="tst"><div class="panel tst-main"><div class="cps3-opts">${seg('tkD', 'Length', [[15, '15 s'], [30, '30 s'], [60, '60 s']], opt.dur)}${seg('tkS', 'Speed', [['slow', 'Slow'], ['medium', 'Medium'], ['fast', 'Fast']], opt.speed)}</div>
      <div class="tst-stage aim t2-stage" id="tkStage" role="application" aria-label="Tracking test area"><div class="aim-target t2-track" id="tkT"></div><div class="aim-msg" id="tkMsg"><b>Click the target to start</b><small>Then keep your cursor on it until the time runs out</small></div><div class="t2-meter"><i id="tkBar"></i></div></div></div>
      ${side(['On target', 'tkPct'], [['Time left', 'tkLeft'], ['Longest lock', 'tkLock'], ['Your best', 'tkBest']], ['tkNote', 'Smooth arm and wrist movement beats fast flicks here. Most players land between 40% and 70%.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#tkStage'), tg = $('#tkT'), R = 24;
    let run = null, raf = 0, mx = -1e4, my = -1e4, ph = [];
    const showBest = () => { const b = getBest('tracking', opt.dur + opt.speed); $('#tkBest').textContent = b != null ? fmt(b, 1) + '%' : '—'; };
    const pos = t => { const w = st.clientWidth, h = st.clientHeight, ax = w / 2 - R - 10, ay = h / 2 - R - 10, f = SPEED[opt.speed];
      return [w / 2 + ax * (.62 * Math.sin(ph[0] * f * t + ph[1]) + .38 * Math.sin(ph[2] * f * t + ph[3])), h / 2 + ay * (.6 * Math.sin(ph[4] * f * t + ph[5]) + .4 * Math.sin(ph[6] * f * t + ph[7]))]; };
    const place = (x, y) => { Object.assign(tg.style, { width: R * 2 + 'px', height: R * 2 + 'px', left: x - R + 'px', top: y - R + 'px' }); tg.dataset.x = x; tg.dataset.y = y; };
    const newPath = () => { ph = [1.1, rnd(0, 6), 1.9, rnd(0, 6), 1.3, rnd(0, 6), 2.3, rnd(0, 6)]; place(...pos(0)); };
    const reset = () => { cancelAnimationFrame(raf); run = null; newPath(); $('#tkMsg').hidden = false; $('#tkPct').textContent = '—'; $('#tkLeft').textContent = opt.dur + ' s'; $('#tkLock').textContent = '—'; $('#tkBar').style.width = '0'; tg.classList.remove('on'); showBest(); };
    st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    st.addEventListener('pointerleave', () => { mx = my = -1e4; });
    const frame = now => {
      if (!run) return; const dt = Math.min(50, now - run.last); run.last = now;
      const t = (now - run.start) / 1000, [x, y] = pos(t); place(x, y);
      const on = Math.hypot(mx - x, my - y) <= R; tg.classList.toggle('on', on);
      if (on) { run.on += dt; run.lock += dt; run.maxLock = Math.max(run.maxLock, run.lock); } else run.lock = 0;
      run.total += dt;
      const pct = run.on / run.total * 100, left = Math.max(0, opt.dur - t);
      $('#tkPct').textContent = fmt(pct, 1) + '%'; $('#tkLeft').textContent = fmt(left, 1) + ' s'; $('#tkLock').textContent = fmt(run.maxLock / 1000, 1) + ' s'; $('#tkBar').style.width = (t / opt.dur * 100) + '%';
      if (left <= 0) return finish(pct);
      raf = requestAnimationFrame(frame);
    };
    const finish = pct => {
      cancelAnimationFrame(raf); const r = run; run = null; tg.classList.remove('on');
      const pb = best('tracking', opt.dur + opt.speed, +pct.toFixed(1), true); showBest();
      record('tracking', pct, `${opt.dur}s · ${opt.speed}`);
      $('#tkNote').textContent = (pb ? 'New personal best! ' : '') + (pct >= 75 ? 'Locked on. Try a faster speed.' : pct >= 55 ? 'Solid tracking. Keep your movements smooth, not jerky.' : 'Try lowering your sensitivity a little and moving your whole arm.');
      $('#tkMsg').hidden = false; $('#tkMsg').innerHTML = `<b>${fmt(pct, 1)}% on target</b><small>Longest lock ${fmt(r.maxLock / 1000, 1)} s · click the target to go again</small>`;
      newPath();
    };
    guard(st);
    onPress(st, (t, b, e) => {
      if (b !== 0 || run) return; const r = st.getBoundingClientRect();
      if (Math.hypot(e.clientX - r.left - +tg.dataset.x, e.clientY - r.top - +tg.dataset.y) > R + 4) return;
      run = { start: performance.now(), last: performance.now(), on: 0, total: 0, lock: 0, maxLock: 0 }; $('#tkMsg').hidden = true; raf = requestAnimationFrame(frame);
    });
    segOn(host, 'tkD', v => { opt.dur = +v; store.trackingOpt = opt; save(); reset(); });
    segOn(host, 'tkS', v => { opt.speed = v; store.trackingOpt = opt; save(); reset(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && run) reset(); });
    addEventListener('resize', () => { if (!run) reset(); });
    reset();
  };

  /* ---------- flick: centre → target, 20 times ---------- */
  T.flick = host => {
    const SIZES = { large: 60, medium: 42, small: 28 }, N = 20;
    let opt = { size: 'medium', ...(store.flickOpt || {}) };
    host.innerHTML = `<div class="tst"><div class="panel tst-main"><div class="cps3-opts">${seg('fkS', 'Target size', Object.keys(SIZES).map(s => [s, s[0].toUpperCase() + s.slice(1)]), opt.size)}</div>
      <div class="tst-stage aim t2-stage" id="fkStage" role="application" aria-label="Flick test area"><div class="t2-home" id="fkHome"></div><div class="aim-target" id="fkT" hidden></div><div class="aim-msg" id="fkMsg"><b>Click the centre dot</b><small>A target appears somewhere. Flick to it and click. ${N} flicks.</small></div></div></div>
      ${side(['Per flick', 'fkAvg'], [['Flicks', 'fkN'], ['Accuracy', 'fkAcc'], ['Path efficiency', 'fkEff'], ['Your best', 'fkBest']], ['fkNote', 'Time counts from the moment the target appears. Path efficiency shows how direct your flicks are: 100% is a perfectly straight line.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#fkStage'), tg = $('#fkT'), home = $('#fkHome');
    let run = null, cur = null, lx = 0, ly = 0;
    const showBest = () => { const b = getBest('flick', opt.size); $('#fkBest').textContent = b != null ? fmt(b) + ' ms' : '—'; };
    const reset = () => { run = null; cur = null; tg.hidden = true; home.hidden = false; $('#fkMsg').hidden = false; ['fkAvg', 'fkAcc', 'fkEff'].forEach(i => { $('#' + i).textContent = '—'; }); $('#fkN').textContent = `0/${N}`; showBest(); };
    const spawn = t => {
      const w = st.clientWidth, h = st.clientHeight, d = SIZES[opt.size], cx = w / 2, cy = h / 2; let x, y, i = 0;
      do { x = rnd(d, w - d); y = rnd(d, h - d); } while (Math.hypot(x - cx, y - cy) < Math.min(w, h) * .32 && ++i < 50);
      Object.assign(tg.style, { width: d + 'px', height: d + 'px', left: x - d / 2 + 'px', top: y - d / 2 + 'px' }); tg.hidden = false; home.hidden = true;
      cur = { x, y, t0: t, path: 0, sx: lx, sy: ly };
    };
    st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (cur) cur.path += Math.hypot(x - lx, y - ly); lx = x; ly = y; });
    guard(st);
    onPress(st, (t, b, e) => {
      if (b !== 0) return; const r = st.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; lx = x; ly = y;
      if (!cur) {   // waiting on the home dot
        if (Math.hypot(x - st.clientWidth / 2, y - st.clientHeight / 2) > 18) return;
        if (!run) { run = { times: [], effs: [], shots: 0 }; $('#fkMsg').hidden = true; }
        return requestAnimationFrame(now => spawn(Math.max(now, performance.now())));
      }
      run.shots++;
      if (Math.hypot(x - cur.x, y - cur.y) > SIZES[opt.size] / 2 + 2) { $('#fkAcc').textContent = Math.round(run.times.length / run.shots * 100) + '%'; return; }
      const ms = t - cur.t0, direct = Math.hypot(cur.x - cur.sx, cur.y - cur.sy); run.times.push(ms); if (cur.path > 20) run.effs.push(Math.min(1, direct / cur.path));
      tg.classList.remove('pop'); void tg.offsetWidth; tg.classList.add('pop');
      cur = null; tg.hidden = true; home.hidden = false;
      const n = run.times.length, avg = mean(run.times);
      $('#fkN').textContent = `${n}/${N}`; $('#fkAvg').textContent = fmt(avg) + ' ms'; $('#fkAcc').textContent = Math.round(n / run.shots * 100) + '%'; $('#fkEff').textContent = run.effs.length ? Math.round(mean(run.effs) * 100) + '%' : '—';
      if (n >= N) {
        const acc = n / run.shots, eff = mean(run.effs), pb = best('flick', opt.size, Math.round(avg), false); showBest();
        record('flick', avg, `${opt.size} · ${Math.round(acc * 100)}%`);
        $('#fkNote').textContent = (pb ? 'New personal best! ' : '') + (acc < .85 ? 'You’re missing a lot: slow down and land the first click.' : eff < .7 ? 'You’re overshooting or curving. Aim for one clean motion, then a small correction.' : avg < 450 ? 'Fast, clean flicks. Try small targets.' : 'Accurate. Now push the speed a little.');
        $('#fkMsg').hidden = false; $('#fkMsg').innerHTML = `<b>${fmt(avg)} ms per flick</b><small>${Math.round(acc * 100)}% accuracy · ${Math.round(eff * 100)}% path efficiency · click the dot to go again</small>`;
        run = null;
      }
    });
    segOn(host, 'fkS', v => { opt.size = v; store.flickOpt = opt; save(); reset(); });
    reset();
  };

  /* ---------- target rush: shrinking targets, 3 lives ---------- */
  T.rush = host => {
    const D = 76, LIVES = 3;
    host.innerHTML = `<div class="tst"><div class="panel tst-main">
      <div class="tst-stage aim t2-stage" id="ruStage" role="application" aria-label="Target rush area"><div class="aim-target t2-shrink" id="ruT" hidden></div><div class="aim-msg" id="ruMsg"><b>Click to start</b><small>Hit each target before it shrinks away. They get faster. Miss 3 and it’s over.</small></div></div></div>
      ${side(['Targets', 'ruScore'], [['Lives', 'ruLives'], ['Speed', 'ruSpeed'], ['Accuracy', 'ruAcc'], ['Your best', 'ruBest']], ['ruNote', 'Each target lives a little shorter than the last, down to under half a second.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#ruStage'), tg = $('#ruT');
    let run = null, raf = 0;
    const showBest = () => { const b = getBest('rush', 'all'); $('#ruBest').textContent = b != null ? fmt(b) : '—'; };
    const life = n => Math.max(430, 1700 * Math.pow(.965, n));
    const spawn = now => { const w = st.clientWidth, h = st.clientHeight; run.cur = { x: rnd(D / 2, w - D / 2), y: rnd(D / 2, h - D / 2), t0: now, life: life(run.hits) }; tg.hidden = false; $('#ruSpeed').textContent = fmt(run.cur.life / 1000, 2) + ' s'; };
    const paint = () => { $('#ruScore').textContent = run ? run.hits : '—'; $('#ruLives').textContent = run ? '♥'.repeat(run.lives) + '♡'.repeat(LIVES - run.lives) : '♥♥♥'; $('#ruAcc').textContent = run && run.shots ? Math.round(run.hits / run.shots * 100) + '%' : '—'; };
    const frame = now => {
      if (!run) return; const c = run.cur, k = 1 - (now - c.t0) / c.life;
      if (k <= 0) { run.lives--; paint(); st.classList.remove('t2-hurt'); void st.offsetWidth; st.classList.add('t2-hurt'); if (run.lives <= 0) return end(); spawn(now); return (raf = requestAnimationFrame(frame)); }
      const d = D * k; Object.assign(tg.style, { width: d + 'px', height: d + 'px', left: c.x - d / 2 + 'px', top: c.y - d / 2 + 'px' }); c.d = d;
      raf = requestAnimationFrame(frame);
    };
    const end = () => {
      cancelAnimationFrame(raf); tg.hidden = true; const r = run; run = null;
      const pb = best('rush', 'all', r.hits, true); showBest(); record('rush', r.hits, `${Math.round(r.hits / Math.max(1, r.shots) * 100)}% accuracy`);
      $('#ruNote').textContent = (pb ? 'New personal best! ' : '') + (r.hits >= 50 ? 'Outstanding speed and precision.' : r.hits >= 30 ? 'Great run. The last few targets are where wins are made.' : 'Stay calm when they speed up: aim for the centre, not the edge.');
      $('#ruMsg').hidden = false; $('#ruMsg').innerHTML = `<b>${r.hits} targets</b><small>Click to go again</small>`;
    };
    guard(st);
    onPress(st, (t, b, e) => {
      if (b !== 0) return;
      if (!run) { run = { hits: 0, shots: 0, lives: LIVES }; $('#ruMsg').hidden = true; paint(); spawn(performance.now()); raf = requestAnimationFrame(frame); return; }
      const r = st.getBoundingClientRect(), c = run.cur; run.shots++;
      if (Math.hypot(e.clientX - r.left - c.x, e.clientY - r.top - c.y) <= (c.d || D) / 2 + 3) { run.hits++; spawn(performance.now()); }
      paint();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && run) end(); });
    paint(); showBest();
  };

  /* ---------- rhythm: click on the beat ---------- */
  T.rhythm = host => {
    const COUNT_IN = 4, BEATS = 16;
    let opt = { bpm: 120, sound: true, ...(store.rhythmOpt || {}) };
    host.innerHTML = `<div class="tst"><div class="panel tst-main"><div class="cps3-opts">${seg('rhB', 'Tempo', [[90, '90 BPM'], [120, '120 BPM'], [150, '150 BPM'], [180, '180 BPM']], opt.bpm)}${seg('rhS', 'Sound', [['1', 'Sound on'], ['0', 'Visual only']], opt.sound ? '1' : '0')}</div>
      <div class="tst-stage t2-stage t2-rhythm" id="rhStage" role="application" aria-label="Rhythm test area"><div class="t2-pulse" id="rhPulse"></div><b id="rhBig">Click to start</b><small id="rhSmall">${COUNT_IN} count-in beats, then click on each of the next ${BEATS} beats.</small><div class="t2-beats" id="rhDots">${'<i></i>'.repeat(BEATS)}</div></div></div>
      ${side(['Off the beat', 'rhAvg'], [['Hit', 'rhHit'], ['Tendency', 'rhBias'], ['Consistency', 'rhCons'], ['Your best', 'rhBest']], ['rhNote', 'Timing control matters for jitter and butterfly clicking, burst fire and spam abilities. Wireless headphones add delay: use Visual only if you’re on Bluetooth.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#rhStage'), dots = [...host.querySelectorAll('#rhDots i')];
    let run = null, raf = 0, ac = null;
    const showBest = () => { const b = getBest('rhythm', String(opt.bpm)); $('#rhBest').textContent = b != null ? fmt(b) + ' ms' : '—'; };
    const tick = (when, hi) => { if (!opt.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(), at = ac.currentTime + Math.max(0, (when - performance.now()) / 1000);
      o.frequency.value = hi ? 1320 : 880; g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.35, at + .004); g.gain.exponentialRampToValueAtTime(.0001, at + .07); o.connect(g).connect(ac.destination); o.start(at); o.stop(at + .08); } catch (e) { /* no audio */ } };
    const reset = () => { cancelAnimationFrame(raf); run = null; $('#rhBig').textContent = 'Click to start'; $('#rhSmall').textContent = `${COUNT_IN} count-in beats, then click on each of the next ${BEATS} beats.`; dots.forEach(d => { d.className = ''; }); showBest(); };
    const frame = now => {
      if (!run) return;
      while (run.next < run.beats.length && now >= run.beats[run.next]) {
        const i = run.next++, p = $('#rhPulse'); p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
        if (i < COUNT_IN) $('#rhBig').textContent = String(COUNT_IN - i); else { $('#rhBig').textContent = '●'; dots[i - COUNT_IN].classList.add('now'); }
        if (i + 1 < run.beats.length) tick(run.beats[i + 1], (i + 1) % 4 === 0);
      }
      if (now > run.beats[run.beats.length - 1] + run.iv / 2) return finish();
      raf = requestAnimationFrame(frame);
    };
    const finish = () => {
      cancelAnimationFrame(raf); const r = run; run = null;
      const scored = r.beats.slice(COUNT_IN), offs = [], used = new Set();
      scored.forEach((bt, i) => { let bi = -1, bd = Infinity; r.clicks.forEach((c, j) => { const d = c - bt; if (!used.has(j) && Math.abs(d) < r.iv / 2 && Math.abs(d) < Math.abs(bd)) { bd = d; bi = j; } });
        if (bi >= 0) { used.add(bi); offs.push(bd); dots[i].className = Math.abs(bd) < 25 ? 'ok' : Math.abs(bd) < 60 ? 'near' : 'off'; } else dots[i].className = 'miss'; });
      const misses = BEATS - offs.length, abs = offs.map(Math.abs), score = (abs.reduce((a, b) => a + b, 0) + misses * 150) / BEATS, bias = mean(offs), extra = r.clicks.length - offs.length;
      $('#rhAvg').textContent = fmt(score) + ' ms'; $('#rhHit').textContent = `${offs.length}/${BEATS}`; $('#rhBias').textContent = offs.length ? (Math.abs(bias) < 5 ? 'on time' : `${fmt(Math.abs(bias))} ms ${bias < 0 ? 'early' : 'late'}`) : '—'; $('#rhCons').textContent = offs.length > 2 ? '±' + fmt(sd(offs)) + ' ms' : '—';
      const pb = best('rhythm', String(opt.bpm), Math.round(score), false); showBest(); record('rhythm', score, `${opt.bpm} BPM`);
      $('#rhBig').textContent = fmt(score) + ' ms'; $('#rhSmall').textContent = (pb ? 'New personal best! ' : '') + 'Click to go again';
      $('#rhNote').textContent = misses > 3 ? 'You missed a few beats. Try a slower tempo first.' : extra > 2 ? 'Some extra clicks between beats. One click per beat.' : Math.abs(bias) > 25 ? `You tend to click ${bias < 0 ? 'early (rushing)' : 'late (dragging)'}. Try to land right on the sound.` : score < 25 ? 'Metronome-tight. Try a faster tempo.' : 'Good timing. Keep your wrist relaxed.';
    };
    guard(st);
    onPress(st, (t, b) => {
      if (b !== 0) return;
      if (!run) { const iv = 60000 / opt.bpm, t0 = performance.now() + 700; run = { iv, beats: [...Array(COUNT_IN + BEATS)].map((_, i) => t0 + i * iv), next: 0, clicks: [] }; dots.forEach(d => { d.className = ''; });
        $('#rhSmall').textContent = 'Listen to the count-in…'; ['rhAvg', 'rhHit', 'rhBias', 'rhCons'].forEach(i => { $('#' + i).textContent = '—'; }); tick(run.beats[0], true); raf = requestAnimationFrame(frame); return; }
      if (t > run.beats[COUNT_IN] - run.iv / 2) { run.clicks.push(t); $('#rhSmall').textContent = ''; }
    });
    segOn(host, 'rhB', v => { opt.bpm = +v; store.rhythmOpt = opt; save(); reset(); });
    segOn(host, 'rhS', v => { opt.sound = v === '1'; store.rhythmOpt = opt; save(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && run) reset(); });
    reset();
  };

  /* ---------- circle: draw a circle in one stroke (+ angle snapping check) ---------- */
  T.circle = host => {
    let mode = 'circle';
    host.innerHTML = `<div class="tst"><div class="panel tst-main"><div class="cps3-opts">${seg('ciM', 'Mode', [['circle', 'Perfect circle'], ['snap', 'Angle snapping check']], mode)}</div>
      <div class="tst-stage t2-stage t2-draw" id="ciStage" role="application" aria-label="Drawing area"><canvas id="ciCv"></canvas><div class="t2-home" id="ciDot"></div><div class="aim-msg" id="ciMsg"><b>Hold the left button and draw a circle</b><small>Anywhere in the box, in one stroke. Bigger circles are harder.</small></div></div></div>
      ${side(['Roundness', 'ciScore'], [['Size', 'ciSize'], ['Closed', 'ciClose'], ['Your best', 'ciBest']], ['ciNote', 'Drawing a clean circle shows smooth control of your arm and wrist, the same control you need for tracking.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#ciStage'), cv = $('#ciCv'), cx = cv.getContext('2d');
    let pts = null, dpr = 1;
    const showBest = () => { const b = getBest('circle', 'all'); $('#ciBest').textContent = b != null ? fmt(b, 1) + '%' : '—'; };
    const size = () => { dpr = window.devicePixelRatio || 1; cv.width = st.clientWidth * dpr; cv.height = st.clientHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a855f7';
    const draw = (color = accent()) => { if (!pts || pts.length < 2) return; cx.strokeStyle = color; cx.lineWidth = 3; cx.lineCap = cx.lineJoin = 'round'; cx.beginPath(); pts.forEach((p, i) => (i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]))); cx.stroke(); };
    const at = e => { const r = st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    st.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); st.setPointerCapture(e.pointerId); size(); cx.clearRect(0, 0, cv.width, cv.height); pts = [at(e)]; $('#ciMsg').hidden = true; });
    st.addEventListener('pointermove', e => { if (!pts) return; (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(ev => pts.push(at(ev))); cx.clearRect(0, 0, cv.width, cv.height); draw(); });
    const up = () => { if (!pts) return; const p = pts; pts = null; mode === 'circle' ? judgeCircle(p) : judgeLine(p); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    // the circle that fits the stroke best (least squares), so it can be drawn anywhere in the box
    function fitCircle(p) {
      let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0; const n = p.length;
      p.forEach(([x, y]) => { const z = x * x + y * y; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sz += z; sxz += x * z; syz += y * z; });
      // solve [sxx sxy sx; sxy syy sy; sx sy n] [D E F] = -[sxz syz sz]
      const M = [[sxx, sxy, sx, -sxz], [sxy, syy, sy, -syz], [sx, sy, n, -sz]];
      for (let i = 0; i < 3; i++) { let m = i; for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[m][i])) m = r; [M[i], M[m]] = [M[m], M[i]]; if (Math.abs(M[i][i]) < 1e-9) return null;
        for (let r = 0; r < 3; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c]; } }
      const D = M[0][3] / M[0][0], E = M[1][3] / M[1][1], F = M[2][3] / M[2][2], cx0 = -D / 2, cy0 = -E / 2, r2 = cx0 * cx0 + cy0 * cy0 - F;
      return r2 > 0 ? [cx0, cy0, Math.sqrt(r2)] : null;
    }
    function judgeCircle(raw) {
      pts = raw; draw();
      const fail = msg => { $('#ciMsg').hidden = false; $('#ciMsg').innerHTML = `<b>${msg}</b><small>Hold the left button and try again</small>`; $('#ciScore').textContent = '—'; };
      const f = raw.length >= 20 && fitCircle(raw);
      if (!f || f[2] < 45) return fail('Draw a bigger circle');
      if (f[2] > Math.max(st.clientWidth, st.clientHeight)) return fail('That doesn’t look like a circle');
      // how far round the stroke goes (around its own centre); only the first full lap is scored
      let sweep = 0, cut = raw.length;
      for (let i = 1; i < raw.length; i++) {
        let d = Math.atan2(raw[i][1] - f[1], raw[i][0] - f[0]) - Math.atan2(raw[i - 1][1] - f[1], raw[i - 1][0] - f[0]);
        if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; sweep += d;
        if (Math.abs(sweep) >= 2 * Math.PI) { cut = i + 1; break; }
      }
      const deg = Math.abs(sweep) * 180 / Math.PI;
      if (deg < 300) return fail('Go all the way round');
      const p = raw.slice(0, cut), c = fitCircle(p) || f, rs = p.map(q => Math.hypot(q[0] - c[0], q[1] - c[1])), mr = mean(rs);
      const gap = deg >= 359 ? 0 : Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]);
      const score = Math.max(0, Math.min(100, 100 * (1 - 3 * sd(rs) / mr) - Math.max(0, gap / mr - .2) * 25));
      cx.save(); cx.setLineDash([6, 8]); cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(c[0], c[1], mr, 0, Math.PI * 2); cx.stroke(); cx.restore();
      $('#ciScore').textContent = fmt(score, 1) + '%'; $('#ciSize').textContent = fmt(mr) + ' px'; $('#ciClose').textContent = gap < mr * .2 ? 'Yes' : fmt(gap) + ' px gap';
      const pb = best('circle', 'all', +score.toFixed(1), true); showBest(); record('circle', score, mr > 150 ? 'large' : 'small');
      $('#ciNote').textContent = (pb ? 'New personal best! ' : '') + (score >= 92 ? 'Near perfect. Try drawing it bigger.' : score >= 80 ? 'Nice and smooth. Watch for flat spots at the top and bottom.' : 'Go slower and use your arm, not just your fingers.');
      $('#ciMsg').hidden = false; $('#ciMsg').innerHTML = `<b>${fmt(score, 1)}% round</b><small>Draw again to improve it</small>`;
    }
    function judgeLine(p) {
      pts = p; draw();
      const len = p.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
      if (len < 220) { $('#ciMsg').hidden = false; $('#ciMsg').innerHTML = '<b>Draw a longer line</b><small>Slowly, across most of the box</small>'; return; }
      const mx = mean(p.map(q => q[0])), my = mean(p.map(q => q[1])); let sxx = 0, syy = 0, sxy = 0; p.forEach(([x, y]) => { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); });
      const th = .5 * Math.atan2(2 * sxy, sxx - syy), nx = -Math.sin(th), ny = Math.cos(th), res = Math.sqrt(mean(p.map(([x, y]) => ((x - mx) * nx + (y - my) * ny) ** 2)));
      let ang = Math.abs(th * 180 / Math.PI) % 90; ang = Math.min(ang, 90 - ang);
      const snapped = res < .45 && ang < 1.5;
      $('#ciScore').textContent = snapped ? 'Likely ON' : 'Not seen'; $('#ciSize').textContent = fmt(len) + ' px'; $('#ciClose').textContent = `±${fmt(res, 2)} px`;
      $('#ciNote').textContent = snapped ? 'That line is perfectly straight, which hands can’t do. Your mouse is probably straightening it (angle snapping). Turn it off in the mouse’s software for more natural aim.' : ang < 1.5 ? 'Natural wobble found. No sign of angle snapping. Try a few more lines to be sure.' : 'Draw slowly, close to horizontal or vertical: that’s where angle snapping shows up.';
      $('#ciMsg').hidden = false; $('#ciMsg').innerHTML = `<b>${snapped ? 'Angle snapping: likely on' : 'Angle snapping: not seen'}</b><small>Wobble ±${fmt(res, 2)} px at ${fmt(ang, 1)}° off straight</small>`;
    }
    segOn(host, 'ciM', v => { mode = v; cx.clearRect(0, 0, cv.width, cv.height); $('#ciDot').hidden = v !== 'circle'; $('#ciMsg').hidden = false;
      $('#ciMsg').innerHTML = v === 'circle' ? '<b>Hold the left button and draw a circle</b><small>Anywhere in the box, in one stroke. Bigger circles are harder.</small>' : '<b>Hold the left button and draw a slow, straight line</b><small>Close to horizontal, across most of the box</small>';
      host.querySelector('.cps3-big small').textContent = v === 'circle' ? 'Roundness' : 'Angle snapping'; ['ciScore', 'ciSize', 'ciClose'].forEach(i => { $('#' + i).textContent = '—'; });
      host.querySelectorAll('.cps3-mini span')[1].textContent = v === 'circle' ? 'Closed' : 'Wobble'; host.querySelectorAll('.cps3-mini span')[0].textContent = v === 'circle' ? 'Size' : 'Length'; });
    guard(st); addEventListener('resize', size); size(); showBest();
  };

  /* ---------- DPI analyzer ---------- */
  T.dpi = host => {
    const DIST = { '5cm': [5 / 2.54, '5 cm'], '10cm': [10 / 2.54, '10 cm'], '2in': [2, '2 inches'], '4in': [4, '4 inches'] };
    let opt = { dist: '10cm', set: '', ...(store.dpiOpt || {}) }, trials = [], live = null;
    host.innerHTML = `<div class="tst"><div class="panel tst-main"><div class="cps3-opts">${seg('dpD', 'Distance', Object.entries(DIST).map(([k, v]) => [k, v[1]]), opt.dist)}<label class="t2-in">Your DPI setting <input id="dpSet" type="number" min="100" max="40000" step="50" placeholder="e.g. 800" value="${opt.set}"></label></div>
      <div class="tst-stage t2-stage t2-dpi" id="dpStage" role="application" aria-label="DPI measuring area"><b id="dpBig">Click to start measuring</b><small id="dpSmall">Put a ruler next to your mouse and line up its left edge with 0.</small><div class="t2-rule" aria-hidden="true"><i id="dpBar"></i></div></div>
      <ol class="t2-steps"><li>Line the mouse up with the start of a ruler.</li><li>Click the box above. Your cursor is hidden while measuring.</li><li>Move the mouse exactly <b id="dpDl">${DIST[opt.dist][1]}</b> to the right, then click.</li><li>Do it 3 times for an accurate average.</li></ol></div>
      ${side(['Measured DPI', 'dpAvg'], [['Trials', 'dpN'], ['Spread', 'dpSpread'], ['vs setting', 'dpDiff']], ['dpNote', 'Mice are often a few percent off their advertised DPI. Knowing the real number keeps your sensitivity the same when you switch mice.'])}</div>`;
    const $ = s => host.querySelector(s), st = $('#dpStage');
    const paint = () => {
      const a = mean(trials), set = +opt.set;
      $('#dpN').textContent = `${trials.length}/3`; $('#dpAvg').textContent = trials.length ? fmt(a) : '—';
      $('#dpSpread').textContent = trials.length > 1 ? '±' + fmt(sd(trials) / a * 100, 1) + '%' : '—';
      $('#dpDiff').textContent = trials.length && set ? (a >= set ? '+' : '') + fmt((a - set) / set * 100, 1) + '%' : '—';
    };
    const lockOn = () => document.pointerLockElement === st;
    const start = async () => {
      live = { dx: 0, dy: 0 }; $('#dpBig').textContent = '0 counts'; $('#dpSmall').textContent = `Move ${DIST[opt.dist][1]} to the right, then click.`;
      try { await st.requestPointerLock({ unadjustedMovement: true }); live.raw = true; } catch (e) { try { await st.requestPointerLock(); live.raw = false; } catch (x) { live = null; $('#dpSmall').textContent = 'Your browser blocked pointer lock. Click again.'; } }
    };
    document.addEventListener('mousemove', e => { if (!live || !lockOn()) return; live.dx += e.movementX; live.dy += e.movementY; $('#dpBig').textContent = fmt(Math.abs(live.dx)) + ' counts'; $('#dpBar').style.width = Math.min(100, Math.abs(live.dx) / ((+opt.set || 800) * DIST[opt.dist][0]) * 100) + '%'; });
    document.addEventListener('pointerlockchange', () => { if (!lockOn() && live && live.done !== true) { live = null; $('#dpBig').textContent = 'Click to start measuring'; } });
    guard(st);
    st.addEventListener('mousedown', e => {
      e.preventDefault(); if (e.button !== 0) return;
      if (!live || !lockOn()) return start();
      const counts = Math.abs(live.dx), dpi = counts / DIST[opt.dist][0], raw = live.raw; live.done = true; document.exitPointerLock(); live = null;
      if (counts < 50) { $('#dpBig').textContent = 'Too short'; $('#dpSmall').textContent = 'Move the full distance, then click. Click to try again.'; return; }
      trials.push(dpi); if (trials.length > 3) trials.shift(); paint();
      $('#dpBig').textContent = fmt(dpi) + ' DPI'; $('#dpSmall').textContent = trials.length < 3 ? `Trial ${trials.length} of 3 done. Click to measure again.` : 'Done! Click to measure again.';
      if (!raw) $('#dpNote').textContent = 'Your browser can’t read raw mouse input, so Windows pointer speed affects this. For an accurate result, set pointer speed to the default (10 of 20) and turn off “Enhance pointer precision”.';
      if (trials.length === 3) {
        const a = mean(trials), set = +opt.set; record('dpi', a, set ? `set to ${set}` : '');
        if (raw) $('#dpNote').textContent = sd(trials) / a > .05 ? 'Your three tries differ a lot. Measure slowly and stop exactly on the mark.' : set ? `Your mouse measures ${fmt(a)} DPI at a setting of ${fmt(set)}: ${Math.abs(a - set) / set < .03 ? 'spot on' : `${fmt(Math.abs(a - set) / set * 100, 1)}% ${a > set ? 'high' : 'low'}`}.` : `Your mouse measures about ${fmt(Math.round(a / 50) * 50)} DPI.`;
      }
    });
    segOn(host, 'dpD', v => { opt.dist = v; store.dpiOpt = opt; save(); trials = []; paint(); $('#dpDl').textContent = DIST[v][1]; });
    $('#dpSet').addEventListener('input', e => { opt.set = e.target.value; store.dpiOpt = opt; save(); paint(); });
    paint();
  };

  document.querySelectorAll('[data-test]').forEach(el => { const f = T[el.dataset.test]; if (f) f(el); });
  // test hub: "Your best" on the skill-test cards
  const UNIT = { tracking: ['%', 1, true], flick: [' ms', 0, false], rush: [' targets', 0, true], rhythm: [' ms off', 0, false], circle: ['% round', 1, true], dpi: [' DPI', 0, true] };
  document.querySelectorAll('[data-test-hub2] [data-best]').forEach(el => {
    const k = el.dataset.best, u = UNIT[k], vs = k === 'dpi' ? ((window.PMStats ? PMStats.sessions('dpi') : []).slice(0, 1).map(x => x.v)) : Object.values(store[k] || {});
    if (!u || !vs.length) return; const v = u[2] ? Math.max(...vs) : Math.min(...vs);
    el.textContent = (k === 'dpi' ? 'Last measured: ' : 'Your best: ') + fmt(v, u[1]) + u[0]; el.hidden = false;
  });
  window.PMTests2 = { tests: Object.keys(T), best: test => store[test] || {} };
})();
