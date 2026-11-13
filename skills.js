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

  function profile(asOf = Infinity) {
    const skills = SKILLS.map(k => {
      const d = S.DEF[k.test], all = S.sessions(k.test).filter(s => fair(k.test, s) && s.at <= asOf), vs = all.map(s => s.v);
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
    return `<svg class="sk-radar" viewBox="${-64} 0 ${size + 128} ${size}" role="img" aria-label="Your skill profile: ${p.skills.map(s => `${s.name} ${s.n ? s.score : 'not tested'}`).join(', ')}">${rings}${spokes}${p.tested.length ? `<polygon points="${shape}" class="sk-shape"/>` : ''}${dots}${labels}</svg>`;
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
      ${monoPanel()}
      <div class="sk-two">
        <section class="panel"><span class="section-label">Personal records</span>${rec.length ? `<ul class="ts-list sk-recs">${rec.map(r => `<li><span>${esc(r.d.name)}</span><small>${new Date(r.b.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })} · ${r.n}×</small><b>${fmt(r.b.v, r.d.dp)} <em>${esc(r.d.unit)}</em></b></li>`).join('')}</ul>` : '<p class="panel-note">Your best results appear here as you take tests.</p>'}</section>
        <section class="panel"><span class="section-label">Activity · last 12 weeks</span>
          <div class="sk-act">${cells}</div>
          <div class="ts-tiles sk-tiles"><div><span>Sessions</span><b>${fmt(all.length)}</b><small>all time</small></div><div><span>This week</span><b>${week}</b><small>sessions</small></div><div><span>Active days</span><b>${days}</b><small>with a test</small></div><div><span>Favourite</span><b class="sm">${fav ? esc(S.DEF[fav[0]].name) : '—'}</b><small>${fav ? fav[1] + ' sessions' : ''}</small></div></div></section>
      </div>`;
  }

  /* ---------- Mono: skill trends (overall score at the end of each of the last 12 weeks) ---------- */
  const has = f => !!(window.PMBackend && PMBackend.has && PMBackend.has(f));
  function trends() {
    const DAY = 864e5, now = Date.now(), end = new Date(); end.setHours(23, 59, 59, 999);
    const pts = [...Array(12)].map((_, i) => { const at = end.getTime() - (11 - i) * 7 * DAY, p = profile(at); return { at, v: p.tested.length ? Math.round(p.tested.reduce((a, s) => a + s.score, 0) / p.tested.length) : null, n: p.tested.length }; });
    const have = pts.filter(x => x.v != null);
    if (have.length < 2) return '<p class="panel-note">Take tests over a couple of weeks and your trend appears here.</p>';
    const W = 1000, H = 220, P = 34, x = i => P + i * (W - 2 * P) / 11, y = v => H - P - v / 100 * (H - 2 * P);
    let d = ''; pts.forEach((q, i) => { if (q.v == null) return; d += (d && pts[i - 1] && pts[i - 1].v != null ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(q.v).toFixed(1); });
    const first = have[0].v, last = have[have.length - 1].v, ch = last - first;
    return `<div class="sk-trend-top"><b>${last}</b><span class="${ch > 0 ? 'up' : ch < 0 ? 'down' : ''}">${ch > 0 ? '▲ +' : ch < 0 ? '▼ ' : ''}${ch || 'No change'}${ch ? ' since ' + new Date(have[0].at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span></div>
      <svg class="sk-trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Overall skill score over the last 12 weeks, from ${first} to ${last}">
        ${[25, 50, 75].map(v => `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" class="sk-grid"/><text x="${P - 6}" y="${y(v) + 4}" text-anchor="end" class="sk-ax">${v}</text>`).join('')}
        <path d="${d}" class="sk-tline"/>${pts.map((q, i) => (q.v == null ? '' : `<circle cx="${x(i)}" cy="${y(q.v)}" r="4" class="sk-tdot"><title>Week of ${new Date(q.at - 6 * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${q.v}/100 (${q.n} skills)</title></circle>`)).join('')}
        <text x="${P}" y="${H - 6}" class="sk-ax">12 weeks ago</text><text x="${W - P}" y="${H - 6}" text-anchor="end" class="sk-ax">this week</text></svg>`;
  }

  /* ---------- Mono: the skill report (a printable page; "Save as PDF" in the print dialog) ---------- */
  function report() {
    const p = profile(), u = window.PMBackend && PMBackend.getUser ? PMBackend.getUser() : null;
    let setup = null; try { setup = (u && u.prefs && u.prefs.setup) || JSON.parse(localStorage.getItem('pm_setup') || 'null'); } catch (e) { /* no setup */ }
    const mouse = setup && setup.mouse ? (window.PM && PM.byId ? PM.byId[setup.mouse] : (window.PM_MICE || []).find(m => m.id === setup.mouse)) : null;
    const rec = Object.entries(S.DEF).map(([t, d]) => { const ss = S.sessions(t).filter(s => fair(t, s)); if (!ss.length) return null; const b = t === 'dpi' ? ss[0] : ss.reduce((a, s) => ((d.higher ? s.v > a.v : s.v < a.v) ? s : a)); return [d.name, `${fmt(b.v, d.dp)} ${d.unit}`, new Date(b.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), ss.length]; }).filter(Boolean);
    const svg = radar(p, 300).replace('class="sk-radar"', 'class="sk-radar" style="width:300px;max-width:100%"');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ProMouser skill report${u ? ' · ' + esc(u.name) : ''}</title>
<style>body{font:14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#111;margin:32px auto;max-width:760px;padding:0 20px}h1{font-size:28px;margin:0}h2{font-size:15px;text-transform:uppercase;letter-spacing:.12em;color:#555;margin:28px 0 10px;border-bottom:1px solid #ddd;padding-bottom:6px}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;border-bottom:3px solid #111;padding-bottom:14px}.score{font-size:44px;font-weight:800;line-height:1}.score small{font-size:16px;color:#777}
.grid{display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:center}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #eee;font-size:13px}th{color:#777;font-weight:600}
.bar{height:8px;background:#eee;border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;background:#111}.muted{color:#777}.foot{margin-top:30px;font-size:11px;color:#888}
.sk-ring{fill:none;stroke:#ddd}.sk-spoke{stroke:#eee}.sk-shape{fill:rgba(0,0,0,.12);stroke:#111;stroke-width:2}.sk-dot{fill:#fff;stroke:#111;stroke-width:2}.sk-lbl{fill:#333;font:600 11px system-ui}.sk-lbl.off{fill:#aaa}
@media print{body{margin:0}.noprint{display:none}}</style></head><body>
<p class="noprint" style="background:#f4f4f4;padding:10px 14px;border-radius:8px">Use your browser’s print dialog and choose <b>Save as PDF</b> to keep this report.</p>
<div class="top"><div><div class="muted">ProMouser skill report</div><h1>${u ? esc(u.name) : 'Your skills'}</h1><div class="muted">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
<div style="text-align:right"><div class="muted">Overall</div><div class="score">${p.overall != null ? p.overall : '—'}<small>/100</small></div></div></div>
<h2>Skill profile</h2><div class="grid"><div>${svg}</div><table><tr><th>Skill</th><th>Score</th><th>Now</th><th style="width:30%"></th></tr>${p.skills.map(k => `<tr><td>${esc(k.name)}</td><td><b>${k.n ? k.score : '—'}</b></td><td class="muted">${k.n ? esc(fmtV(k)) : 'not tested'}</td><td>${k.n ? `<div class="bar"><i style="width:${k.score}%"></i></div>` : ''}</td></tr>`).join('')}</table></div>
<h2>Personal records</h2>${rec.length ? `<table><tr><th>Test</th><th>Best</th><th>Date</th><th>Sessions</th></tr>${rec.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td class="muted">${r[2]}</td><td class="muted">${r[3]}</td></tr>`).join('')}</table>` : '<p class="muted">No tests yet.</p>'}
${setup ? `<h2>Setup</h2><table><tr><td>Mouse</td><td><b>${mouse ? esc(mouse.name) : 'Not listed'}</b></td></tr><tr><td>DPI · sensitivity</td><td>${esc(setup.dpi)} DPI · ${esc(setup.sens)} (${esc(setup.game)})</td></tr><tr><td>Monitor · mousepad</td><td>${esc(setup.hz)} Hz · ~${esc(setup.pad)} cm</td></tr>${setup.grip && setup.grip !== 'any' ? `<tr><td>Grip</td><td>${esc(setup.grip)}</td></tr>` : ''}</table>` : ''}
<p class="foot">Scores compare your median of the last 5 results with rough benchmarks for typical players (50 is about average). promouser.website</p>
<script>setTimeout(function(){window.print()},400)<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for ProMouser to open your report.'); return null; }
    w.document.open(); w.document.write(html); w.document.close(); return w;
  }
  const monoPanel = () => has('skillTrends')
    ? `<section class="panel sk-mono"><div class="ts-head"><div><span class="section-label">Skill trends</span><h3>Your progress, <em>week by week</em></h3></div><span class="plan-tag mono">Mono</span></div>${trends()}
        <div class="hero-cta" style="margin-top:14px"><button class="btn btn-primary btn-sm" type="button" data-sk-report>Download skill report (PDF)</button></div></section>`
    : `<a class="sk-mono-tease" href="${root}shop#mono"><span class="plan-tag mono">Mono</span><span>See your skill score week by week and download a one-page skill report with ProMouser Mono.</span><b>→</b></a>`;
  document.addEventListener('click', e => { if (e.target.closest('[data-sk-report]')) { e.preventDefault(); report(); } });

  /* ---------- Daily: compact profile + coach ---------- */
  function mini(el) {
    const p = profile(), cc = coach(p);
    el.innerHTML = `<div class="sk-mini"><div>${radar(p, 260)}</div><div><span class="section-label">Your skills</span><h3>${p.overall != null ? `Overall ${p.overall}<small>/100</small>` : `${p.tested.length} of ${SKILLS.length} skills scored`}</h3>${coachCard(cc)}<a class="dy-link" href="${root}my-stats">Full skill profile and records →</a></div></div>`;
  }
  const render = () => { document.querySelectorAll('[data-skills]').forEach(full); document.querySelectorAll('[data-skills-mini]').forEach(mini); if (window.PMIcons) window.PMIcons(); };
  window.PMSkills = { profile, coach, SKILLS, render, trends, report };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  if (window.PMBackend && PMBackend.on) PMBackend.on(render);
})();
