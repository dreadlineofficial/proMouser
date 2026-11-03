/* =====================================================================
   ProMouser: skill profile ([data-skills] on My stats, [data-skills-mini] on Daily)

   Eight skills, each scored 0–100 from your recent results on one test
   (median of your last 5 sessions, compared with rough benchmarks for typical
   players from teststats.js):
     Click speed (CPS) · Reaction · Precision (aim trainer) · Tracking ·
     Flicking · Speed aim (target rush) · Timing (rhythm) · Control (circle)
   Plus the coach (what to practise next), personal records and activity.
   Free for everyone; uses every session saved in this browser and, on
   Ultra, the account.
   ===================================================================== */
(() => {
  'use strict';
  const S = window.PMStats; if (!S) return;
  const root = document.documentElement.dataset.root || '';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  const SKILLS = [
    { id: 'speed', name: 'Click speed', test: 'cps', href: 'cps-test', icon: 'Click', tip: 'Do two 5-second runs a day. Try jitter or butterfly clicking only if your mouse can double-click.' },
    { id: 'reaction', name: 'Reaction', test: 'reaction', href: 'reaction-test', icon: 'Speed', tip: 'Sleep, a warm-up and a high refresh rate all help. Watch the centre of the box, not the edges.' },
    { id: 'precision', name: 'Precision', test: 'aim', href: 'aim-trainer', icon: 'Aim', tip: 'Run small targets at a pace where you stay above 90% accuracy, then slowly speed up.' },
    { id: 'tracking', name: 'Tracking', test: 'tracking', href: 'tracking-test', icon: 'Track', tip: 'Start on Slow, move from the elbow and keep your grip loose. Smooth beats fast.' },
    { id: 'flick', name: 'Flicking', test: 'flick', href: 'flick-test', icon: 'Aim', tip: 'One committed motion, then a tiny correction. Watch your path efficiency climb.' },
    { id: 'rush', name: 'Speed aim', test: 'rush', href: 'target-rush', icon: 'Speed', tip: 'Aim for the centre of each target. When they speed up, breathe and keep the same rhythm.' },
    { id: 'timing', name: 'Timing', test: 'rhythm', href: 'rhythm-test', icon: 'Time', tip: 'Start at 90 BPM with sound on. If you rush, relax your wrist and let the click land on the beat.' },
    { id: 'control', name: 'Control', test: 'circle', href: 'circle-test', icon: 'Rate', tip: 'Draw big, slow circles using your arm. Flat spots mean your wrist is doing all the work.' }
  ];
  const fair = (test, s) => test !== 'cps' || /^(5|10|15|30|60)s(?!.*moving)/.test(s.k || '');
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
  const erf = x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const pct = (d, v) => { const z = (v - d.ref[0]) / d.ref[1], p = .5 * (1 + erf(z / Math.SQRT2)); return Math.max(1, Math.min(99, Math.round((d.higher ? p : 1 - p) * 100))); };

  function profile() {
    const skills = SKILLS.map(k => {
      const d = S.DEF[k.test], all = S.sessions(k.test).filter(s => fair(k.test, s)), vs = all.map(s => s.v);
      if (!vs.length) return { ...k, n: 0 };
      const now = median(vs.slice(0, 5)), before = vs.length >= 8 ? median(vs.slice(5, 10)) : NaN, best = d.higher ? Math.max(...vs) : Math.min(...vs);
      const change = Number.isFinite(before) ? (now - before) / (before || 1) * (d.higher ? 1 : -1) : NaN;
      return { ...k, d, n: all.length, now, best, score: pct(d, now), trend: !Number.isFinite(change) ? 0 : change > .03 ? 1 : change < -.03 ? -1 : 0, last: all[0].at };
    });
    const tested = skills.filter(s => s.n), overall = tested.length >= 3 ? Math.round(tested.reduce((a, s) => a + s.score, 0) / tested.length) : null;
    return { skills, tested, overall };
  }
  function coach(p) {
    const untested = p.skills.filter(s => !s.n);
    if (p.tested.length < 4 && untested.length) { const s = untested[0]; return { s, kind: 'new', head: `Try the ${s.d ? s.d.name : S.DEF[s.test].name.toLowerCase()}`, body: `You haven’t scored ${s.name.toLowerCase()} yet. ${untested.length} skill${untested.length === 1 ? '' : 's'} left to complete your profile.` }; }
    const weak = [...p.tested].sort((a, b) => a.score - b.score)[0], stale = p.tested.filter(s => Date.now() - s.last > 10 * 864e5).sort((a, b) => a.last - b.last)[0];
    if (stale && stale.score < 60) return { s: stale, kind: 'stale', head: `Come back to ${stale.name.toLowerCase()}`, body: `You last tested it ${Math.round((Date.now() - stale.last) / 864e5)} days ago. ${stale.tip}` };
    return { s: weak, kind: 'weak', head: `Focus on ${weak.name.toLowerCase()}`, body: `It’s your lowest skill at ${weak.score}/100. ${weak.tip}` };
  }

  function radar(p, size = 320) {
    const n = SKILLS.length, c = size / 2, R = size / 2 - 46, ang = i => -Math.PI / 2 + i * 2 * Math.PI / n, pt = (i, v) => [c + Math.cos(ang(i)) * R * v, c + Math.sin(ang(i)) * R * v];
    const rings = [.25, .5, .75, 1].map(k => `<polygon points="${SKILLS.map((_, i) => pt(i, k).join(',')).join(' ')}" class="sk-ring"/>`).join('');
    const spokes = SKILLS.map((_, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" class="sk-spoke"/>`).join('');
    const shape = p.skills.map((s, i) => pt(i, s.n ? Math.max(.04, s.score / 100) : 0).join(',')).join(' ');
    const labels = p.skills.map((s, i) => { const [x, y] = pt(i, 1.2), a = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end'; return `<text x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="middle" class="sk-lbl${s.n ? '' : ' off'}">${esc(s.name)}${s.n ? ` · ${s.score}` : ''}</text>`; }).join('');
    const dots = p.skills.map((s, i) => (s.n ? `<circle cx="${pt(i, Math.max(.04, s.score / 100))[0]}" cy="${pt(i, Math.max(.04, s.score / 100))[1]}" r="4" class="sk-dot"><title>${esc(s.name)}: ${s.score}/100</title></circle>` : '')).join('');
    return `<svg class="sk-radar" viewBox="${-40} 0 ${size + 80} ${size}" role="img" aria-label="Your skill profile: ${p.skills.map(s => `${s.name} ${s.n ? s.score : 'not tested'}`).join(', ')}">${rings}${spokes}${p.tested.length ? `<polygon points="${shape}" class="sk-shape"/>` : ''}${dots}${labels}</svg>`;
  }
  const fmtV = s => (s.d ? `${fmt(s.now, s.d.dp)} ${s.d.unit}` : '');
  const coachCard = cc => `<div class="sk-coach"><span class="sk-coach-ico" data-icon="${cc.s.icon}"></span><div><span class="section-label">Coach · what to practise next</span><b>${esc(cc.head)}</b><p>${esc(cc.body)}</p><a class="btn btn-primary btn-sm" href="${root}${cc.s.href}">Go to the test →</a></div></div>`;

  /* ---------- My stats: full profile, records and activity ---------- */
  function full(el) {
    const p = profile(), cc = coach(p);
    // personal records for every test
    const rec = Object.entries(S.DEF).map(([t, d]) => { const ss = S.sessions(t).filter(s => fair(t, s)); if (!ss.length) return null; const b = t === 'dpi' ? ss[0] : ss.reduce((a, s) => ((d.higher ? s.v > a.v : s.v < a.v) ? s : a)); return { t, d, b, n: ss.length }; }).filter(Boolean);
    // activity: sessions per day for 12 weeks
    const DAY = 864e5, all = Object.keys(S.DEF).flatMap(t => S.sessions(t).map(s => ({ ...s, t }))), byDay = {};
    all.forEach(s => { const k = new Date(s.at).toDateString(); byDay[k] = (byDay[k] || 0) + 1; });
    const start = new Date(); start.setHours(0, 0, 0, 0); const dow = (start.getDay() + 6) % 7, first = start.getTime() - (77 + dow) * DAY;
    const cells = [...Array(84)].map((_, i) => { const t = first + i * DAY, k = new Date(t).toDateString(), n = byDay[k] || 0, lv = !n ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4; return t > Date.now() ? '<i class="fut"></i>' : `<i class="l${lv}" title="${new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${n} session${n === 1 ? '' : 's'}"></i>`; }).join('');
    const week = all.filter(s => Date.now() - s.at < 7 * DAY).length, days = Object.keys(byDay).length, fav = Object.entries(all.reduce((a, s) => (a[s.t] = (a[s.t] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1])[0];
    el.innerHTML = `<div class="sk-top">
        <section class="panel sk-main"><div class="ts-head"><div><span class="section-label">Your skill profile</span><h3>${p.overall != null ? `Overall <em>${p.overall}</em><small>/100</small>` : 'Build your profile'}</h3></div>${p.overall != null ? `<span class="sk-badge">${p.overall >= 80 ? 'Elite' : p.overall >= 65 ? 'Strong' : p.overall >= 45 ? 'Solid' : 'Developing'}</span>` : ''}</div>
          ${radar(p)}
          <p class="panel-note">Each skill is scored from your last 5 results, against rough benchmarks for typical players: 50 is about average. ${p.tested.length < 3 ? `Score ${3 - p.tested.length} more skill${3 - p.tested.length === 1 ? '' : 's'} to get your overall score.` : ''}</p></section>
        <div class="sk-side">${coachCard(cc)}
          <section class="panel"><span class="section-label">Skills</span><ul class="sk-list">${p.skills.map(s => `<li><a href="${root}${s.href}"><span class="sk-li-name">${esc(s.name)}${s.trend > 0 ? ' <i class="up" title="Improving">▲</i>' : s.trend < 0 ? ' <i class="down" title="Slipping">▼</i>' : ''}</span>
            ${s.n ? `<span class="sk-bar"><i style="width:${s.score}%"></i></span><b>${s.score}</b><small>${esc(fmtV(s))}</small>` : '<span class="sk-bar off"></span><b>—</b><small>Not tested yet</small>'}</a></li>`).join('')}</ul></section></div></div>
      <div class="sk-two">
        <section class="panel"><span class="section-label">Personal records</span>${rec.length ? `<ul class="ts-list sk-recs">${rec.map(r => `<li><span>${esc(r.d.name)}</span><small>${new Date(r.b.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })} · ${r.n}×</small><b>${fmt(r.b.v, r.d.dp)} <em>${esc(r.d.unit)}</em></b></li>`).join('')}</ul>` : '<p class="panel-note">Your best results appear here as you take tests.</p>'}</section>
        <section class="panel"><span class="section-label">Activity · last 12 weeks</span>
          <div class="sk-act">${cells}</div>
          <div class="ts-tiles sk-tiles"><div><span>Sessions</span><b>${fmt(all.length)}</b><small>all time</small></div><div><span>This week</span><b>${week}</b><small>sessions</small></div><div><span>Active days</span><b>${days}</b><small>with a test</small></div><div><span>Favourite</span><b class="sm">${fav ? esc(S.DEF[fav[0]].name) : '—'}</b><small>${fav ? fav[1] + ' sessions' : ''}</small></div></div></section>
      </div>`;
  }

  /* ---------- Daily: compact profile + coach ---------- */
  function mini(el) {
    const p = profile(), cc = coach(p);
    el.innerHTML = `<div class="sk-mini"><div>${radar(p, 260)}</div><div><span class="section-label">Your skills</span><h3>${p.overall != null ? `Overall ${p.overall}<small>/100</small>` : `${p.tested.length} of ${SKILLS.length} skills scored`}</h3>${coachCard(cc)}<a class="dy-link" href="${root}my-stats">Full skill profile and records →</a></div></div>`;
  }
  const render = () => { document.querySelectorAll('[data-skills]').forEach(full); document.querySelectorAll('[data-skills-mini]').forEach(mini); if (window.PMIcons) window.PMIcons(); };
  window.PMSkills = { profile, coach, SKILLS, render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  if (window.PMBackend && PMBackend.on) PMBackend.on(render);
})();
