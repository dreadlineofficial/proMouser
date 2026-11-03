/* =====================================================================
   ProMouser Daily (daily.html): level and streak, today's challenge,
   Mousle (guess the mouse of the day), training plans, the streak
   calendar and achievements, weekly quests, level rewards (colours),
   your skill profile with the coach, and pop-up settings.
   All progress lives in core.js (PMCore).
   ===================================================================== */
(() => {
  'use strict';
  const host = document.querySelector('[data-daily]'), C = window.PMCore, PM = window.PM;
  if (!host || !C || !PM) return;
  const root = document.documentElement.dataset.root || '';
  const { esc, inr, num } = PM, $ = (s, r = host) => r.querySelector(s), $$ = (s, r = host) => [...r.querySelectorAll(s)];
  const icon = n => (window.PMIcon ? window.PMIcon(n) : '');
  const MICE = PM.MICE.slice().sort((a, b) => a.name.localeCompare(b.name));

  /* ---------- layout ---------- */
  host.innerHTML = `
    <section class="dy-hero panel" id="dyHero"></section>
    <div class="dy-grid">
      <section class="panel dy-challenge" id="dyChallenge"></section>
      <section class="panel dy-week" id="dyWeek"></section>
    </div>
    <section class="panel dy-quests" id="dyQuests"></section>
    <section class="panel dy-skills" data-skills-mini></section>
    <section class="panel dy-mousle" id="mousle"></section>
    <div class="section-header reveal visible" style="margin:56px 0 18px"><span class="section-label">Training plans</span><h2>Get better, <em>one session a day</em></h2><p>Each session is a few tests you’d do anyway. They tick themselves off as you finish them.</p></div>
    <div class="dy-plans" id="dyPlans"></div>
    <div class="section-header reveal visible" style="margin:56px 0 18px"><span class="section-label">Your streak</span><h2>The last <em>five weeks</em></h2></div>
    <section class="panel" id="dyCal"></section>
    <div class="section-header reveal visible" style="margin:56px 0 18px"><span class="section-label">Achievements</span><h2>Badges <em>to unlock</em></h2></div>
    <div class="dy-ach" id="dyAch"></div>
    <div class="section-header reveal visible" style="margin:56px 0 18px"><span class="section-label">Level rewards</span><h2>Colours <em>you’ve earned</em></h2><p>Every few levels unlocks a new colour for the whole site. Pick one and it’s used on every page.</p></div>
    <section class="panel" id="dyRewards"></section>
    <div class="section-header reveal visible" id="settings" style="margin:56px 0 18px;scroll-margin-top:calc(var(--nav-h) + 20px)"><span class="section-label">Settings</span><h2>Make it <em>yours</em></h2></div>
    <section class="panel dy-settings" id="dySettings"></section>`;

  /* ---------- hero: level, XP, streak ---------- */
  function hero() {
    const S = C.state, L = C.levelOf(S.xp), lo = C.xpFor(L), hi = C.xpFor(L + 1), pct = (S.xp - lo) / (hi - lo), st = C.streakNow();
    const u = window.PMBackend && PMBackend.getUser ? PMBackend.getUser() : null, unlocked = Object.keys(S.ach).length;
    const R = 54, circ = 2 * Math.PI * R;
    $('#dyHero').innerHTML = `
      <div class="dy-ring"><svg viewBox="0 0 128 128"><circle cx="64" cy="64" r="${R}" class="bg"/><circle cx="64" cy="64" r="${R}" class="fg" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct)}"/></svg><div><small>Level</small><b>${L}</b></div></div>
      <div class="dy-who"><span class="section-label">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <h1>${u ? esc(u.name.split(' ')[0]) + ', ' : ''}<em>${C.titleOf(L)}</em></h1>
        <div class="dy-xpbar"><i style="width:${Math.round(pct * 100)}%"></i></div>
        <p>${num(S.xp - lo)} / ${num(hi - lo)} XP to level ${L + 1} · ${num(S.xp)} XP total</p>
        ${u ? '' : '<p class="dy-guest">Progress is saved in this browser. <button type="button" class="linkish" data-auth="signup">Create a free account</button> to keep it on every device.</p>'}</div>
      <div class="dy-stats"><div><span>Streak</span><b>${st ? '🔥 ' + st : '0'}</b><small>best ${S.streak.best}</small></div><div><span>Achievements</span><b>${unlocked}</b><small>of ${C.ACH.length}</small></div><div><span>Tests</span><b>${num(S.count.testsTotal)}</b><small>all time</small></div><div><span>Mousle</span><b>${S.count.mousleWins}</b><small>solved</small></div></div>`;
  }

  /* ---------- today's challenge ---------- */
  function challenge() {
    const ch = C.challenge(), st = C.streakNow(), d = C.state.days[C.dayKey()] || {};
    const tomorrow = C.challenge(C.keyOf(C.dayNum() + 1));
    $('#dyChallenge').innerHTML = `<div class="dy-ch-top"><span class="section-label">Today’s challenge</span>${ch.done ? '<span class="dy-done">✓ Done</span>' : `<span class="dy-reward">+${60 + Math.min(40, (st + 1) * 5)} XP</span>`}</div>
      <div class="dy-ch-main"><span class="dy-ch-ico">${icon(ch.icon)}</span><h3>${esc(ch.text)}</h3></div>
      ${ch.done ? `<p class="panel-note">Nice. Your streak is <b>${st} day${st === 1 ? '' : 's'}</b>. A new challenge unlocks at midnight.</p>`
        : `<p class="panel-note">Finish it today to ${st ? `keep your <b>🔥 ${st}-day streak</b> going` : 'start a streak'}.</p><a class="btn btn-primary btn-sm" href="${root}${ch.href}">Go →</a>`}
      <p class="dy-tomorrow"><span>Tomorrow</span>${esc(tomorrow.text)}</p>`;
    // this week
    const days = [...Array(7)].map((_, i) => C.state.days[C.keyOf(C.dayNum() - i)] || null);
    const sum = f => days.reduce((a, x) => a + (x ? f(x) : 0), 0);
    $('#dyWeek').innerHTML = `<span class="section-label">This week</span>
      <div class="dy-tiles"><div><span>XP</span><b>${num(sum(x => x.xp || 0))}</b></div><div><span>Challenges</span><b>${sum(x => (x.ch ? 1 : 0))}/7</b></div>
      <div><span>Tests</span><b>${sum(x => Object.values(x.tests || {}).reduce((a, b) => a + b, 0))}</b></div><div><span>Mice viewed</span><b>${sum(x => (x.views || []).length)}</b></div></div>
      <div class="dy-best">${(() => { const have = C.SKILL.filter(k => C.state.best[k] != null), list = (have.length ? have : ['cps', 'reaction', 'aim']).slice(0, 5); return list.map(k => `<div><span>Best ${esc(C.TNAME[k].toLowerCase())}</span><b>${C.state.best[k] != null ? esc(C.TFMT[k](C.state.best[k])) : '—'}</b></div>`).join(''); })()}</div>
      <a class="dy-link" href="${root}my-stats">All your stats →</a>`;
  }

  /* ---------- Mousle ---------- */
  const N0 = C.dayNum('2026-11-01'), puzzle = C.dayNum() - N0 + 1;
  const pickAns = () => { const n = C.dayNum(); let i = C.hash(n * 3 + 11) % MICE.length; return MICE[i]; };
  const ANS = pickAns(), MAX = 6;
  const COLS = [
    ['Brand', null, (g, a) => (g.brand === a.brand ? 'ok' : 'no'), m => m.brand],
    ['Weight', m => m.weight, (g, a) => (g.weight === a.weight ? 'ok' : Math.abs(g.weight - a.weight) <= 8 ? 'near' : 'no'), m => m.weight + ' g'],
    ['Price', m => m.price || 0, (g, a) => (!g.price || !a.price ? 'no' : g.price === a.price ? 'ok' : Math.abs(g.price - a.price) / a.price <= .2 ? 'near' : 'no'), m => (m.price ? inr(m.price) : '—')],
    ['Polling', m => m.poll, (g, a) => (g.poll === a.poll ? 'ok' : 'no'), m => num(m.poll) + ' Hz'],
    ['Connection', null, (g, a) => (g.connection === a.connection ? 'ok' : 'no'), m => m.connection],
    ['Shape', null, (g, a) => ((g.shape || '?') === (a.shape || '?') ? 'ok' : 'no'), m => m.shape || '—'],
    ['Double-clicks', null, (g, a) => (!!g.cps.verified === !!a.cps.verified ? 'ok' : 'no'), m => (m.cps.verified ? 'Yes' : 'No')]
  ];
  const arrow = (col, g, a) => { if (!col[1]) return ''; const x = col[1](g), y = col[1](a); return x === y ? '' : y > x ? ' ↑' : ' ↓'; };
  function mousle() {
    const d = C.today(), guesses = (d.mousleG || []).map(id => PM.byId[id]).filter(Boolean), won = guesses.some(g => g.id === ANS.id), over = won || guesses.length >= MAX;
    const row = g => `<tr>${[`<td class="ml-name"><img src="${PM.IMG(g, 480)}" alt="" width="34" height="34"><span>${esc(g.short || g.name)}</span></td>`, ...COLS.map(c => { const r = c[2](g, ANS); return `<td class="${r}">${esc(c[3](g))}${r === 'ok' ? '' : arrow(c, g, ANS)}</td>`; })].join('')}</tr>`;
    $('#mousle').innerHTML = `<div class="ml-head"><div><span class="section-label">Mousle #${puzzle}</span><h2>Guess today’s <em>mouse</em></h2>
        <p class="panel-note">${MAX} guesses. Green is a match, amber is close (within 8 g or 20% on price), arrows point towards the answer.</p></div>
        <div class="ml-count"><b>${guesses.length}</b><span>/ ${MAX}</span></div></div>
      ${over ? '' : `<form class="ml-form" id="mlForm" autocomplete="off"><input id="mlIn" list="mlList" placeholder="Type a mouse name…" aria-label="Your guess"><datalist id="mlList">${MICE.filter(m => !guesses.includes(m)).map(m => `<option value="${esc(m.name)}">`).join('')}</datalist><button class="btn btn-primary btn-sm" type="submit">Guess</button></form><p class="ml-err" id="mlErr" hidden></p>`}
      <div class="ml-wrap"><table class="ml-table"><thead><tr><th>Mouse</th>${COLS.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${guesses.map(row).join('') || `<tr><td colspan="${COLS.length + 1}" class="ml-empty">Your guesses appear here.</td></tr>`}</tbody></table></div>
      ${over ? `<div class="ml-result ${won ? 'won' : 'lost'}"><img src="${PM.IMG(ANS, 480)}" alt="" width="84" height="84"><div><b>${won ? `Solved in ${guesses.length}!` : 'Out of guesses'}</b><span>Today’s mouse was the <a href="${root}${ANS.page}">${esc(ANS.name)}</a>. A new Mousle unlocks at midnight.</span></div>
        <button class="btn btn-ghost btn-sm" type="button" id="mlShare">Share result</button></div>` : ''}`;
    const f = $('#mlForm');
    f && f.addEventListener('submit', e => {
      e.preventDefault(); const v = $('#mlIn').value.trim().toLowerCase(), err = $('#mlErr');
      const g = MICE.find(m => m.name.toLowerCase() === v) || MICE.find(m => (m.short || '').toLowerCase() === v) || MICE.filter(m => m.name.toLowerCase().includes(v)).sort((a, b) => a.name.length - b.name.length)[0];
      if (!v || !g) { err.textContent = 'Pick a mouse from the list.'; err.hidden = false; return; }
      if ((d.mousleG || []).includes(g.id)) { err.textContent = 'You already guessed that one.'; err.hidden = false; return; }
      d.mousleG = [...(d.mousleG || []), g.id]; C.persist();
      const n = d.mousleG.length; if (g.id === ANS.id) C.event('mousle', { won: true, n }); else if (n >= MAX) C.event('mousle', { won: false, n });
      mousle(); const nf = $('#mlIn'); if (nf) nf.focus();
    });
    const sh = $('#mlShare');
    sh && sh.addEventListener('click', () => {
      const em = { ok: '🟩', near: '🟨', no: '⬛' }, grid = guesses.map(g => COLS.map(c => em[c[2](g, ANS)]).join('')).join('\n');
      const txt = `ProMouser Mousle #${puzzle} ${won ? guesses.length : 'X'}/${MAX}\n${grid}\npromouser.website/daily`;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { sh.textContent = 'Copied!'; }).catch(() => { prompt('Copy your result:', txt); });
    });
  }

  /* ---------- training plans ---------- */
  function plans() {
    $('#dyPlans').innerHTML = Object.entries(C.PLANS).map(([id, P]) => {
      const ps = C.planState(id);
      if (!ps) return `<article class="panel dy-plan"><span class="section-label">${P.days} sessions</span><h3>${esc(P.name)}</h3><p class="panel-note">${esc(P.desc)}</p><button class="btn btn-primary btn-sm" type="button" data-start="${id}">Start the plan</button></article>`;
      return `<article class="panel dy-plan on"><div class="dy-plan-top"><div><span class="section-label">${ps.finished ? 'Complete' : `Session ${ps.session} of ${P.days}`}</span><h3>${esc(P.name)}</h3></div>${ps.doneToday ? '<span class="dy-done">✓ Today done</span>' : '<span class="dy-reward">+30 XP</span>'}</div>
        <div class="dy-xpbar"><i style="width:${Math.round(ps.progress * 100)}%"></i></div>
        ${ps.finished ? '<p class="panel-note">You finished every session. Start again any time to keep your edge.</p>' : `<ul class="dy-tasks">${ps.tasks.map(t => `<li class="${t.ok ? 'ok' : ''}">${t.manual && !ps.doneToday ? `<button type="button" data-tick="${id}:${t.i}" aria-pressed="${t.ok}">${t.ok ? '✓' : ''}</button>` : `<i>${t.ok ? '✓' : ''}</i>`}<span>${esc(t.t)}</span>${!t.manual && !t.ok ? `<a href="${root}${({ cps: 'cps-test', aim: 'aim-trainer', reaction: 'reaction-test', doubleclick: 'double-click-test', tracking: 'tracking-test', flick: 'flick-test', rush: 'target-rush', rhythm: 'rhythm-test', circle: 'circle-test' })[t.test]}">Go →</a>` : ''}</li>`).join('')}</ul>`}
        <button class="linkish dy-stop" type="button" data-stop="${id}">${ps.finished ? 'Start over' : 'Leave plan'}</button></article>`;
    }).join('');
  }
  host.addEventListener('click', e => {
    const s = e.target.closest('[data-start]'); if (s) { C.startPlan(s.dataset.start); render(); return; }
    const t = e.target.closest('[data-tick]'); if (t) { const [id, i] = t.dataset.tick.split(':'); C.event('plan-manual', { id, i: +i }); render(); return; }
    const x = e.target.closest('[data-stop]'); if (x) { const id = x.dataset.stop, ps = C.planState(id); if (ps && ps.finished) C.startPlan(id); else if (confirm('Leave this plan? Your finished sessions will be cleared.')) C.stopPlan(id); render(); }
  });

  /* ---------- calendar ---------- */
  function calendar() {
    const n = C.dayNum(), start = n - 34 - ((new Date().getDay() + 6) % 7 === 6 ? 0 : 0);
    const cells = [...Array(35)].map((_, i) => { const k = C.keyOf(start + i), d = C.state.days[k], xp = d ? d.xp : 0, lv = xp === 0 ? 0 : xp < 50 ? 1 : xp < 120 ? 2 : xp < 250 ? 3 : 4;
      return `<i class="l${lv}${d && d.ch ? ' ch' : ''}${k === C.dayKey() ? ' today' : ''}" title="${k}: ${xp} XP${d && d.ch ? ' · challenge done' : ''}"></i>`; }).join('');
    $('#dyCal').innerHTML = `<div class="dy-cal">${cells}</div><p class="dy-legend"><span>Less</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>More XP</span><i class="l2 ch"></i><span>Challenge done</span></p>`;
  }

  /* ---------- achievements ---------- */
  function achievements() {
    const S = C.state;
    $('#dyAch').innerHTML = C.ACH.map(a => { const on = !!S.ach[a.id]; return `<div class="dy-badge${on ? ' on' : ''}"><span class="dy-badge-ico">${icon(a.icon)}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${on ? `<em>Unlocked ${new Date(S.ach[a.id]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</em>` : a.xp ? `<em>+${a.xp} XP</em>` : ''}</div>`; }).join('');
  }

  /* ---------- weekly quests ---------- */
  function questsPanel() {
    const qs = C.quests(), left = C.dayNum(C.weekEnds()) - C.dayNum() + 1, done = qs.filter(q => q.done).length;
    $('#dyQuests').innerHTML = `<div class="dy-ch-top"><div><span class="section-label">Weekly quests</span><h3 class="dy-q-title">${done}/3 done this week</h3></div><span class="dy-reward">+${C.QUEST_XP} XP each · ${left} day${left === 1 ? '' : 's'} left</span></div>
      <div class="dy-q">${qs.map(q => `<div class="dy-q-item${q.done ? ' ok' : ''}"><b>${esc(q.text)}</b><div class="dy-xpbar"><i style="width:${Math.round(q.have / q.n * 100)}%"></i></div><small>${q.done ? '✓ Done' : `${num(q.have)} / ${num(q.n)}`}</small></div>`).join('')}</div>
      ${done === 3 ? '<p class="panel-note" style="margin:12px 0 0">Clean sweep! New quests arrive on Monday.</p>' : ''}`;
  }

  /* ---------- level rewards: colours ---------- */
  function rewards() {
    const L = C.levelOf(C.state.xp), U = window.PMUI && PMUI.ultra(), cur = (window.PMUI ? PMUI.get().accent : '') || 'default';
    const card = (id, name, c, level) => { const open = U || id === 'default' || L >= level, on = cur === id;
      return `<button type="button" class="dy-rw${open ? '' : ' locked'}${on ? ' on' : ''}" ${open ? `data-ui-set="accent:${id}"` : 'disabled'} aria-pressed="${on}"><i style="background:linear-gradient(135deg, ${c[0]}, ${c[1]})"></i><b>${esc(name)}</b><small>${on ? 'In use' : open ? 'Use' : 'Level ' + level}</small></button>`; };
    const next = C.REWARDS.find(r => r.level > L);
    $('#dyRewards').innerHTML = `${!U && next ? `<p class="panel-note" style="margin-top:0">Next: <b>${esc(next.name)}</b> at level ${next.level} (${num(C.xpFor(next.level) - C.state.xp)} XP to go).</p>` : ''}
      <div class="dy-rws">${card('default', 'Plan colours', ['#a855f7', '#ef4444'], 1)}${C.REWARDS.map(r => card(r.id, r.name, r.c, r.level)).join('')}</div>`;
  }

  /* ---------- settings ---------- */
  function settings() {
    const st = C.settings, seg = (k, opts) => `<div class="ui-seg">${opts.map(([v, l]) => `<button type="button" data-core-set="${k}:${v}" aria-pressed="${String(st[k]) === String(v)}">${l}</button>`).join('')}</div>`;
    $('#dySettings').innerHTML = `<div class="ui-row"><span>Progress pop-ups</span>${seg('toasts', [['all', 'All'], ['big', 'Big moments only'], ['off', 'Off']])}<small class="dy-set-note">${st.toasts === 'all' ? 'XP after every test, plus level-ups, personal bests, streaks and achievements.' : st.toasts === 'big' ? 'Only level-ups, personal bests, streaks, quests and achievements.' : 'No pop-ups. You still earn XP and unlock everything.'}</small></div>
      <div class="ui-row"><span>Streak and reminder dot in the menu</span>${seg('navStreak', [['true', 'Show'], ['false', 'Hide']])}</div>`;
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-core-set]'); if (!b) return; const [k, v] = b.dataset.coreSet.split(':'); C.setSetting(k, v === 'true' ? true : v === 'false' ? false : v); settings(); });
  document.addEventListener('click', e => { if (e.target.closest('[data-ui-set]')) setTimeout(rewards, 0); });

  function render() { hero(); challenge(); questsPanel(); plans(); calendar(); achievements(); rewards(); settings(); if (window.PMSkills) PMSkills.render(); }
  render(); mousle();
  document.addEventListener('DOMContentLoaded', () => { rewards(); if (window.PMSkills) PMSkills.render(); });
  document.addEventListener('pm:core', () => { hero(); challenge(); questsPanel(); plans(); calendar(); achievements(); rewards(); });
  if (location.hash === '#settings') setTimeout(() => $('#settings').scrollIntoView({ block: 'start' }), 200);
  if (location.hash === '#mousle') setTimeout(() => $('#mousle').scrollIntoView({ block: 'start' }), 200);
})();
