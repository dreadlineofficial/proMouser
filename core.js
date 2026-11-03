/* =====================================================================
   ProMouser Core: the reasons to come back.
   XP and levels, a daily challenge, streaks, achievements, Mousle (the
   daily guess-the-mouse game) and training plans. Every page reports
   activity with PMCore.event(type, data):
     test {test, v, k}   from teststats.js (every finished test)
     rec                 a recommendation run
     ai                  a ProMouser AI question
     view {id}           a mouse review page (detected automatically)
     compare             the compare lab
     mousle {won, n}     today's Mousle finished
     plan {id}           a training-plan session finished
     setup               "My setup" saved
   Progress is stored in this browser (pm_core:<user or guest>) and, when
   signed in, in the account (profiles.progress), so it follows you.
   ===================================================================== */
(() => {
  'use strict';
  const B = () => window.PMBackend;
  const root = document.documentElement.dataset.root || '';
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayNum = (k = dayKey()) => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const keyOf = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const hash = n => { let h = n * 2654435761 % 4294967296; h ^= h >>> 13; return Math.abs(h); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- levels ---------- */
  const xpFor = L => 50 * L * (L - 1);                       // L1 0 · L2 100 · L5 1,000 · L10 4,500 · L20 19,000
  const levelOf = xp => { let L = 1; while (xpFor(L + 1) <= xp) L++; return L; };
  const TITLES = [[1, 'Rookie'], [5, 'Clicker'], [10, 'Grinder'], [15, 'Pro'], [20, 'Elite'], [30, 'Legend']];
  const titleOf = L => TITLES.filter(t => L >= t[0]).pop()[1];

  /* ---------- state ---------- */
  const blank = () => ({ v: 1, xp: 0, updated: 0, days: {}, streak: { cur: 0, best: 0, last: null }, ach: {}, plans: {},
    count: { tests: {}, testsTotal: 0, views: 0, viewed: [], ai: 0, recs: 0, compares: 0, mousleWins: 0, mousleFast: 0, planSessions: 0, plansDone: 0 }, best: {}, setup: false });
  const user = () => { try { return B() && B().getUser ? B().getUser() : null; } catch (e) { return null; } };
  const storeKey = () => 'pm_core:' + ((user() || {}).id || 'guest');
  const readLocal = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  let S = load();
  function load() {
    const u = user(), local = readLocal(storeKey()), acct = u && u.progress && u.progress.v ? u.progress : null;
    let s = acct && (!local || (acct.updated || 0) >= (local.updated || 0)) ? acct : local;
    if (!s && u) { const g = readLocal('pm_core:guest'); if (g && g.xp) s = g; }   // first sign-in: bring guest progress along
    return Object.assign(blank(), s || {}, { count: Object.assign(blank().count, (s || {}).count || {}) });
  }
  let pushT = 0;
  function save() {
    S.updated = Date.now();
    const keep = new Set([...Array(70)].map((_, i) => keyOf(dayNum() - i)));   // keep ~10 weeks of days
    Object.keys(S.days).forEach(k => { if (!keep.has(k)) delete S.days[k]; });
    try { localStorage.setItem(storeKey(), JSON.stringify(S)); } catch (e) { /* storage off */ }
    clearTimeout(pushT);
    pushT = setTimeout(() => { const b = B(); if (user() && b && b.updateProgress) b.updateProgress(JSON.parse(JSON.stringify(S))).catch(() => {}); }, 1200);
    paint();
  }
  const today = () => (S.days[dayKey()] = S.days[dayKey()] || { xp: 0, ch: false, tests: {}, testXp: 0, views: [], ai: 0, rec: 0, cmp: 0, plan: [], best: {} });

  /* ---------- daily challenge (same for everyone each day) ---------- */
  const CH = [
    { id: 'cps', icon: 'Click', href: 'cps-test.html', t: n => `Score ${n}+ CPS on the CPS test (5 s or longer)`, n: [7, 8, 9, 10], ok: (d, n) => (d.best.cps || 0) >= n },
    { id: 'react', icon: 'Speed', href: 'reaction-test.html', t: n => `Average under ${n} ms on the reaction test`, n: [300, 280, 265, 250], ok: (d, n) => d.best.reaction && d.best.reaction <= n },
    { id: 'aim', icon: 'Aim', href: 'aim-trainer.html', t: n => `Aim trainer: under ${n} ms per target`, n: [800, 700, 650, 600], ok: (d, n) => d.best.aim && d.best.aim <= n },
    { id: 'variety', icon: 'Test', href: 'tests.html', t: n => `Take ${n} different tests today`, n: [2, 3, 3, 4], ok: (d, n) => Object.keys(d.tests).length >= n },
    { id: 'mousle', icon: 'Hub', href: 'daily.html#mousle', t: () => 'Solve today’s Mousle', n: [0], ok: d => !!(d.mousle && d.mousle.won) },
    { id: 'explore', icon: 'Mouse', href: 'mice.html#catalog', t: n => `Open ${n} mouse pages`, n: [3, 4, 5], ok: (d, n) => d.views.length >= n },
    { id: 'compare', icon: 'Versus', href: 'mice/compare.html', t: () => 'Compare two mice in the compare lab', n: [0], ok: d => d.cmp >= 1 },
    { id: 'dclick', icon: 'Click', href: 'double-click-test.html', t: () => 'Check your switches on the double click test', n: [0], ok: d => (d.tests.doubleclick || 0) >= 1 }
  ];
  function challenge(k = dayKey()) {
    const n = dayNum(k), c = CH[hash(n) % CH.length], v = c.n[hash(n + 7) % c.n.length];
    return { ...c, n: v, text: c.t(v), done: !!(S.days[k] && S.days[k].ch) };
  }

  /* ---------- achievements ---------- */
  const A = [
    ['first-test', 'First click', 'Finish any test', 'Click', 25, s => s.count.testsTotal >= 1],
    ['all-tests', 'Full check-up', 'Try all 7 tests', 'Test', 100, s => Object.keys(s.count.tests).length >= 7],
    ['lab-rat', 'Lab rat', 'Finish 50 test sessions', 'Stats', 150, s => s.count.testsTotal >= 50],
    ['cps-10', 'Double digits', 'Hit 10+ CPS', 'Click', 50, s => (s.best.cps || 0) >= 10],
    ['cps-15', 'Butterfly effect', 'Hit 15+ CPS', 'Click', 100, s => (s.best.cps || 0) >= 15],
    ['cps-20', 'Drag racer', 'Hit 20+ CPS', 'Speed', 200, s => (s.best.cps || 0) >= 20],
    ['react-250', 'Quick draw', 'Average under 250 ms on the reaction test', 'Speed', 50, s => s.best.reaction && s.best.reaction < 250],
    ['react-200', 'Lightning', 'Average under 200 ms on the reaction test', 'Speed', 150, s => s.best.reaction && s.best.reaction < 200],
    ['aim-550', 'Sharpshooter', 'Under 550 ms per target in the aim trainer', 'Aim', 50, s => s.best.aim && s.best.aim < 550],
    ['aim-420', 'Deadeye', 'Under 420 ms per target in the aim trainer', 'Aim', 150, s => s.best.aim && s.best.aim < 420],
    ['streak-3', 'On a roll', 'A 3-day streak', 'Time', 50, s => s.streak.best >= 3],
    ['streak-7', 'Week warrior', 'A 7-day streak', 'Time', 150, s => s.streak.best >= 7],
    ['streak-30', 'Unstoppable', 'A 30-day streak', 'Elite', 500, s => s.streak.best >= 30],
    ['mousle-1', 'Mouse detective', 'Solve a Mousle', 'Hub', 50, s => s.count.mousleWins >= 1],
    ['mousle-fast', 'Sherlock', 'Solve a Mousle in 2 guesses or fewer', 'Insight', 150, s => s.count.mousleFast >= 1],
    ['mousle-10', 'Mousle master', 'Solve 10 Mousles', 'Elite', 200, s => s.count.mousleWins >= 10],
    ['views-10', 'Window shopper', 'Open 10 different mouse pages', 'Mouse', 50, s => s.count.viewed.length >= 10],
    ['views-30', 'Encyclopedia', 'Open 30 different mouse pages', 'Guide', 150, s => s.count.viewed.length >= 30],
    ['rec-1', 'Matchmaker', 'Get your first recommendations', 'AI', 50, s => s.count.recs >= 1],
    ['ai-10', 'Curious mind', 'Ask ProMouser AI 10 questions', 'Help', 75, s => s.count.ai >= 10],
    ['compare-1', 'Head to head', 'Compare two mice', 'Versus', 25, s => s.count.compares >= 1],
    ['plan-7', 'Committed', 'Finish 7 training sessions', 'Setup', 150, s => s.count.planSessions >= 7],
    ['plan-done', 'Graduate', 'Finish a whole training plan', 'Pro', 400, s => s.count.plansDone >= 1],
    ['setup', 'Dialled in', 'Save your setup', 'Tools', 25, s => !!s.setup],
    ['night-owl', 'Night owl', 'Finish a test between midnight and 4 am', 'Time', 25, s => !!s.nightOwl],
    ['level-5', 'Getting serious', 'Reach level 5', 'Rate', 0, s => levelOf(s.xp) >= 5],
    ['level-10', 'Grinder', 'Reach level 10', 'Rate', 0, s => levelOf(s.xp) >= 10],
    ['level-20', 'Elite', 'Reach level 20', 'Elite', 0, s => levelOf(s.xp) >= 20]
  ].map(([id, name, desc, icon, xp, ok]) => ({ id, name, desc, icon, xp, ok }));

  /* ---------- training plans ---------- */
  const PLANS = {
    cps: { name: '28-day CPS plan', short: 'CPS plan', days: 28, desc: 'Build faster, steadier clicking in four weeks.',
      tasks: i => { const w = Math.floor(i / 7); return [{ t: '2-minute hand warm-up', manual: true },
        { t: `${[2, 3, 4, 3][w]} CPS tests (5 or 10 s)`, test: 'cps', n: [2, 3, 4, 3][w] },
        [null, { t: '1 aim trainer run', test: 'aim', n: 1 }, { t: '1 double click test', test: 'doubleclick', n: 1 }, { t: '1 reaction test', test: 'reaction', n: 1 }][w]].filter(Boolean); } },
    aim: { name: '30-day aim plan', short: 'Aim plan', days: 30, desc: 'Flicks, precision and reaction, 15 minutes a day.',
      tasks: i => (i === 0 || i === 14 || i === 29) ? [{ t: 'Benchmark: reaction test', test: 'reaction', n: 1 }, { t: 'Benchmark: aim trainer', test: 'aim', n: 1 }, { t: 'Benchmark: CPS test', test: 'cps', n: 1 }]
        : [{ t: '3-minute warm-up', manual: true }, { t: `${i < 14 ? 2 : 3} aim trainer runs`, test: 'aim', n: i < 14 ? 2 : 3 }, { t: '1 reaction test', test: 'reaction', n: 1 }] }
  };
  function planState(id) {
    const p = S.plans[id]; if (!p) return null;
    const P = PLANS[id], doneToday = p.done.includes(dayKey()), idx = Math.min(P.days - 1, p.done.length - (doneToday ? 1 : 0));
    const d = S.days[dayKey()] || { tests: {} }, man = (p.manual || {})[dayKey()] || [];
    const tasks = P.tasks(idx).map((t, i) => ({ ...t, i, ok: doneToday || (t.manual ? man.includes(i) : (d.tests[t.test] || 0) >= t.n) }));
    return { id, ...P, session: idx + 1, doneToday, finished: p.done.length >= P.days, tasks, progress: p.done.length / P.days };
  }
  function planTick(id) {   // finish today's session when every task is done
    const ps = planState(id); if (!ps || ps.doneToday || ps.finished || !ps.tasks.every(t => t.ok)) return;
    S.plans[id].done.push(dayKey()); S.count.planSessions++; gain(30, `${ps.short}: session ${ps.session} done`);
    if (S.plans[id].done.length >= PLANS[id].days) { S.count.plansDone++; toast(`<b>${esc(PLANS[id].name)} complete!</b><span>You finished every session.</span>`, 'big'); }
  }

  /* ---------- events ---------- */
  const queue = [];
  function gain(xp, why) { if (!xp) return; const before = levelOf(S.xp); S.xp += xp; today().xp += xp; queue.push([xp, why]); const after = levelOf(S.xp); if (after > before) queue.push(['level', after]); }
  function event(type, data = {}) {
    const d = today(), c = S.count;
    if (type === 'test') {
      const t = data.test; d.tests[t] = (d.tests[t] || 0) + 1; c.tests[t] = (c.tests[t] || 0) + 1; c.testsTotal++;
      const v = +data.v, low = ['reaction', 'aim', 'scroll', 'buttons', 'doubleclick'].includes(t);
      const fair = t !== 'cps' || /^(5|10|15|30|60)s(?!.*moving)/.test(data.k || '');   // challenge-grade CPS: 5 s+ standard runs
      if (Number.isFinite(v) && fair) { const better = (a, b) => a == null || (low ? b < a : b > a); if (better(d.best[t], v)) d.best[t] = v; if (better(S.best[t], v)) S.best[t] = v; }
      const h = new Date().getHours(); if (h < 4) S.nightOwl = true;
      if (d.testXp < 150) { const x = Math.min(150 - d.testXp, d.tests[t] === 1 ? 25 : 10); d.testXp += x; gain(x, `${({ cps: 'CPS test', reaction: 'Reaction test', aim: 'Aim trainer', polling: 'Polling test', scroll: 'Scroll test', buttons: 'Button test', doubleclick: 'Double click test' })[t] || 'Test'} finished`); }
      Object.keys(S.plans).forEach(planTick);
    }
    if (type === 'rec') { c.recs++; d.rec++; if (d.rec <= 3) gain(15, 'Recommendations'); }
    if (type === 'ai') { c.ai++; d.ai++; if (d.ai <= 10) gain(3, 'Question for ProMouser AI'); }
    if (type === 'view' && data.id && !d.views.includes(data.id)) { d.views.push(data.id); c.views++; if (!c.viewed.includes(data.id)) c.viewed = [...c.viewed, data.id].slice(-80); if (d.views.length <= 10) gain(3, 'Mouse page'); }
    if (type === 'compare') { c.compares++; d.cmp++; if (d.cmp <= 2) gain(10, 'Compared mice'); }
    if (type === 'mousle') { d.mousle = { won: !!data.won, n: data.n }; if (data.won) { c.mousleWins++; if (data.n <= 2) c.mousleFast++; gain(30 + (6 - data.n) * 10, `Mousle solved in ${data.n}`); } }
    if (type === 'setup' && !S.setup) { S.setup = true; gain(20, 'Setup saved'); }
    if (type === 'plan-manual') { const p = S.plans[data.id]; if (p) { p.manual = p.manual || {}; const m = p.manual[dayKey()] = p.manual[dayKey()] || []; const i = m.indexOf(data.i); i < 0 ? m.push(data.i) : m.splice(i, 1); Object.keys(p.manual).forEach(k => { if (k !== dayKey()) delete p.manual[k]; }); planTick(data.id); } }
    // daily challenge + streak
    const ch = challenge();
    if (!d.ch && ch.ok(d, ch.n)) {
      d.ch = true; const y = keyOf(dayNum() - 1);
      S.streak.cur = S.streak.last === y ? S.streak.cur + 1 : S.streak.last === dayKey() ? S.streak.cur : 1;
      S.streak.last = dayKey(); S.streak.best = Math.max(S.streak.best, S.streak.cur);
      gain(60 + Math.min(40, S.streak.cur * 5), 'Daily challenge complete');
      queue.push(['streak', S.streak.cur]);
    }
    // achievements (checked after XP so level badges unlock in the same moment)
    for (let pass = 0; pass < 2; pass++) A.forEach(a => { if (!S.ach[a.id] && a.ok(S)) { S.ach[a.id] = Date.now(); queue.push(['ach', a]); gain(a.xp, ''); } });
    save(); flush();
  }
  const streakNow = () => (S.streak.last === dayKey() || S.streak.last === keyOf(dayNum() - 1) ? S.streak.cur : 0);

  /* ---------- toasts: XP, level up, streak, achievement ---------- */
  let tq = [], showing = false;
  function flush() {
    const xp = queue.filter(q => typeof q[0] === 'number'), rest = queue.filter(q => typeof q[0] !== 'number'); queue.length = 0;
    const total = xp.reduce((a, q) => a + q[0], 0), why = xp.map(q => q[1]).filter(Boolean)[0];
    if (total) tq.push([`<b>+${total} XP</b><span>${esc(why || 'Progress')}</span>`, 'xp']);
    rest.forEach(([k, v]) => {
      if (k === 'level') tq.push([`<i class="ct-lvl">${v}</i><b>Level up!</b><span>You’re now level ${v} · ${titleOf(v)}</span>`, 'big']);
      if (k === 'streak') tq.push([`<i class="ct-fire">🔥</i><b>${v}-day streak</b><span>Daily challenge done. Come back tomorrow!</span>`, 'big']);
      if (k === 'ach') tq.push([`<i class="ct-ach" data-icon="${v.icon}"></i><b>Achievement: ${esc(v.name)}</b><span>${esc(v.desc)}${v.xp ? ` · +${v.xp} XP` : ''}</span>`, 'big']);
    });
    next();
  }
  function toast(html, kind) { tq.push([html, kind]); next(); }
  function next() {
    if (showing || !tq.length) return; showing = true;
    const [html, kind] = tq.shift(); let el = document.querySelector('.core-toast');
    if (!el) { el = document.createElement('div'); el.className = 'core-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    const L = levelOf(S.xp), lo = xpFor(L), hi = xpFor(L + 1);
    el.className = 'core-toast ' + kind; el.innerHTML = `<div class="ct-body">${html}</div>${kind === 'xp' ? `<div class="ct-bar"><i style="width:${Math.round((S.xp - lo) / (hi - lo) * 100)}%"></i></div><small>Level ${L} · ${S.xp - lo} / ${hi - lo} XP</small>` : ''}`;
    window.PMIcons && window.PMIcons(el);
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => { showing = false; next(); }, 350); }, kind === 'big' ? 3600 : 2200);
  }

  /* ---------- nav: "Daily" with the streak and a dot until today's challenge is done ---------- */
  function paint() {
    const done = challenge().done, st = streakNow();
    document.querySelectorAll('[data-daily-nav]').forEach(a => { a.innerHTML = `Daily${st ? ` <span class="dn-fire">🔥${st}</span>` : ''}${done ? '' : '<i class="dn-dot" aria-label="Today’s challenge is waiting"></i>'}`; });
    document.querySelectorAll('[data-core-level]').forEach(el => { el.textContent = 'Lv ' + levelOf(S.xp); });
    document.dispatchEvent(new CustomEvent('pm:core'));
  }

  /* ---------- automatic events: mouse pages and the compare lab ---------- */
  function auto() {
    const prof = document.querySelector('[data-mouse-profile]'); if (prof) event('view', { id: prof.dataset.mouseProfile });
    const lab = document.querySelector('[data-compare-lab]');
    if (lab) { let sent = false; const check = () => { if (sent) return; const ids = (new URLSearchParams(location.search).get('m') || '').split(',').filter(Boolean); const picked = lab.querySelectorAll('select').length ? [...lab.querySelectorAll('select')].filter(s => s.value).length : ids.length; if (picked >= 2 || ids.length >= 2) { sent = true; event('compare'); } };
      lab.addEventListener('change', () => setTimeout(check, 50)); setTimeout(check, 1500); }
  }
  // account changes (sign in / out, progress loaded from the server)
  let lastUser = (user() || {}).id;
  if (B() && B().on) B().on(() => { const u = user(), id = (u || {}).id; if (id !== lastUser) { lastUser = id; S = load(); if (u && S.xp && !(u.progress && u.progress.v)) save(); paint(); } else if (u && u.progress && (u.progress.updated || 0) > (S.updated || 0)) { S = load(); paint(); } });

  window.PMCore = {
    event, challenge, planState, PLANS, ACH: A, levelOf, xpFor, titleOf, dayKey, dayNum, keyOf, hash, streakNow, toast,
    get state() { return S; },
    today, persist: save,
    startPlan(id) { if (!PLANS[id]) return; S.plans[id] = { start: dayKey(), done: [], manual: {} }; save(); },
    stopPlan(id) { delete S.plans[id]; save(); },
    reset() { S = blank(); save(); }
  };
  const go = () => { paint(); auto(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
