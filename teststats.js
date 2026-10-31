/* =====================================================================
   ProMouser: statistics for every test.

   Each test calls PMStats.record(test, value, label) when a session ends.
   Sessions are kept in this browser (pm_test_log). ProMouser Ultra also
   saves them to the account (extras.testLog), so they follow you to other
   devices, and unlocks the full statistics panel under every test:
   trend chart, average, median, consistency, improvement, percentile vs
   typical players, per-mode bests and CSV export.
   Lite shows your recent sessions and personal bests. Free and Basic see
   a preview.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'pm_test_log', KEEP_LOCAL = 200, KEEP_CLOUD = 60;
  const B = () => window.PMBackend, A = () => window.PMAccount || {};
  // what each test measures. ref = rough mean / spread for typical players (for the percentile)
  const DEF = {
    cps: { name: 'CPS test', unit: 'CPS', dp: 2, higher: true, ref: [7, 2.2] },
    reaction: { name: 'Reaction time', unit: 'ms', dp: 0, higher: false, ref: [275, 55] },
    aim: { name: 'Aim trainer', unit: 'ms / target', dp: 0, higher: false, ref: [640, 160] },
    polling: { name: 'Polling rate', unit: 'Hz', dp: 0, higher: true },
    scroll: { name: 'Scroll wheel', unit: 'reverse jumps / 100 notches', dp: 1, higher: false },
    buttons: { name: 'Mouse buttons', unit: 'chatter presses', dp: 0, higher: false },
    doubleclick: { name: 'Double click', unit: 'ms between clicks', dp: 0, higher: false }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (v, d) => (Number.isFinite(v) ? v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const writeLocal = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { /* storage off */ } };
  const user = () => (B() && B().getUser ? B().getUser() : null);
  const has = f => !!(B() && B().has && B().has(f));

  /* all sessions for one test, newest first: this browser + (Ultra) the account */
  function sessions(test) {
    const local = readLocal()[test] || [], cloud = (((user() || {}).extras || {}).testLog || {})[test] || [];
    const seen = new Set(), out = [];
    [...local, ...cloud].sort((a, b) => b.at - a.at).forEach(s => { if (!seen.has(s.at)) { seen.add(s.at); out.push(s); } });
    return out;
  }

  let pushT = 0;
  function record(test, v, label = '') {
    if (!DEF[test] || !Number.isFinite(v)) return;
    const s = { at: Date.now(), v: +(+v).toFixed(DEF[test].dp + 1) }; if (label) s.k = String(label).slice(0, 24);
    const l = readLocal(); l[test] = [s, ...(l[test] || [])].slice(0, KEEP_LOCAL); writeLocal(l);
    if (has('testStats')) {   // Ultra: save to the account too (batched)
      clearTimeout(pushT); pushT = setTimeout(() => {
        const u = user(); if (!u) return;
        const log = { ...((u.extras || {}).testLog || {}) }; log[test] = sessions(test).slice(0, KEEP_CLOUD);
        B().updateExtras({ testLog: log }).catch(() => {});
      }, 800);
    }
    document.querySelectorAll(`[data-tstats="${test}"]`).forEach(render);
  }

  /* ---------- maths ---------- */
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const erf = x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const percentile = (d, v) => { if (!d.ref) return null; const z = (v - d.ref[0]) / d.ref[1], p = .5 * (1 + erf(z / Math.SQRT2)); return Math.round((d.higher ? p : 1 - p) * 100); };

  function chart(list, d) {
    const pts = list.slice(0, 50).reverse(), W = 900, H = 220, P = 28;
    if (pts.length < 2) return '<p class="panel-note">Finish two sessions to see your trend.</p>';
    const vs = pts.map(s => s.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
    const x = i => P + i * (W - P * 2) / (pts.length - 1), y = v => { const k = (v - lo) / span; return H - P - (d.higher ? k : 1 - k) * (H - P * 2); };   // better is always up
    const line = pts.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.v).toFixed(1)}`).join(' ');
    const roll = pts.map((_, i) => mean(vs.slice(Math.max(0, i - 4), i + 1)));   // 5-session rolling average
    const rline = roll.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const best = d.higher ? hi : lo;
    return `<svg class="ts-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.name)} results over your last ${pts.length} sessions">
      <line x1="${P}" x2="${W - P}" y1="${y(best)}" y2="${y(best)}" class="ts-best"/><text x="${P}" y="${y(best) - 6}" class="ts-lbl">best ${fmt(best, d.dp)} ${esc(d.unit)}</text>
      <path d="${line} L${x(pts.length - 1)},${H - P} L${x(0)},${H - P} Z" class="ts-area"/><path d="${line}" class="ts-line"/><path d="${rline}" class="ts-roll"/>
      ${pts.map((s, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(s.v).toFixed(1)}" r="3"><title>${fmt(s.v, d.dp)} ${esc(d.unit)}${s.k ? ' · ' + esc(s.k) : ''} · ${new Date(s.at).toLocaleString('en-IN')}</title></circle>`).join('')}
      <text x="${P}" y="${H - 6}" class="ts-lbl">oldest</text><text x="${W - P}" y="${H - 6}" text-anchor="end" class="ts-lbl">latest · ${d.higher ? 'higher' : 'lower'} is better, shown going up</text></svg>`;
  }

  function full(el, test, d, list) {
    const vs = list.map(s => s.v), last10 = vs.slice(0, 10), prev10 = vs.slice(10, 20);
    const best = d.higher ? Math.max(...vs) : Math.min(...vs), avg = mean(last10), cv = last10.length > 2 ? sd(last10) / (mean(last10) || 1) * 100 : NaN;
    const change = prev10.length >= 3 ? (mean(last10) - mean(prev10)) / (mean(prev10) || 1) * 100 * (d.higher ? 1 : -1) : NaN;
    const pct = percentile(d, avg);
    const modes = {}; list.forEach(s => { if (!s.k) return; const m = modes[s.k] = modes[s.k] || { n: 0, best: s.v }; m.n++; m.best = d.higher ? Math.max(m.best, s.v) : Math.min(m.best, s.v); });
    const tiles = [['Sessions', list.length.toLocaleString('en-IN'), 'all time'], ['Best', fmt(best, d.dp), d.unit], ['Average', fmt(avg, d.dp), 'last ' + last10.length], ['Median', fmt(median(last10), d.dp), 'last ' + last10.length],
      ['Consistency', Number.isFinite(cv) ? fmt(Math.max(0, 100 - cv), 0) + '%' : '—', 'steadier is higher'], ['Improvement', Number.isFinite(change) ? (change >= 0 ? '+' : '') + fmt(change, 1) + '%' : '—', 'last 10 vs the 10 before'],
      ...(pct != null ? [['Percentile', 'Top ' + Math.max(1, 100 - pct) + '%', 'vs typical players']] : [])];
    el.innerHTML = `<div class="ts-head"><div><span class="section-label">Your statistics</span><h3>${esc(d.name)}</h3></div><span class="ultra-chip">Ultra</span></div>
      <div class="ts-tiles">${tiles.map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><small>${esc(c)}</small></div>`).join('')}</div>
      ${chart(list, d)}<p class="ts-legend"><i class="l"></i> each session <i class="r"></i> 5-session average <i class="b"></i> your best</p>
      <div class="ts-cols">
        ${Object.keys(modes).length > 1 ? `<div><h4>Best by mode</h4><ul class="ts-list">${Object.entries(modes).map(([k, m]) => `<li><span>${esc(k)}</span><small>${m.n}×</small><b>${fmt(m.best, d.dp)}</b></li>`).join('')}</ul></div>` : ''}
        <div><h4>Recent sessions</h4><ul class="ts-list">${list.slice(0, 8).map(s => `<li><span>${new Date(s.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${new Date(s.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><small>${esc(s.k || '')}</small><b>${fmt(s.v, d.dp)}</b></li>`).join('')}</ul></div>
      </div>
      <div class="ts-actions"><button class="btn btn-ghost btn-sm" type="button" data-ts-csv>Export CSV</button><button class="btn btn-ghost btn-sm" type="button" data-ts-clear>Clear this device’s history</button><span class="panel-note" style="margin:0">Saved to your account, so it follows you to every device.</span></div>`;
    el.querySelector('[data-ts-csv]').addEventListener('click', () => {
      const csv = 'date,' + d.unit.replace(/,/g, '') + ',mode\n' + list.map(s => `${new Date(s.at).toISOString()},${s.v},${(s.k || '').replace(/,/g, ' ')}`).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `promouser-${test}-stats.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    el.querySelector('[data-ts-clear]').addEventListener('click', () => { const l = readLocal(); delete l[test]; writeLocal(l); render(el); });
  }

  function render(el) {
    const test = el.dataset.tstats, d = DEF[test]; if (!d) return;
    const list = sessions(test);
    el.className = 'panel tstats reveal visible';
    if (has('testStats')) {
      if (!list.length) { el.innerHTML = `<div class="ts-head"><div><span class="section-label">Your statistics</span><h3>${esc(d.name)}</h3></div><span class="ultra-chip">Ultra</span></div><p class="panel-note">Finish a session and your full statistics appear here: trend chart, averages, consistency, improvement${d.ref ? ', percentile' : ''} and CSV export.</p>`; return; }
      return full(el, test, d, list);
    }
    const lite = has('advanced'), best = list.length ? (d.higher ? Math.max(...list.map(s => s.v)) : Math.min(...list.map(s => s.v))) : NaN;
    el.innerHTML = `<div class="ts-head"><div><span class="section-label">Your statistics</span><h3>${esc(d.name)}</h3></div><span class="ultra-chip">Ultra</span></div>
      ${lite && list.length ? `<div class="ts-tiles"><div><span>Sessions</span><b>${list.length}</b><small>on this device</small></div><div><span>Best</span><b>${fmt(best, d.dp)}</b><small>${esc(d.unit)}</small></div></div>
        <h4>Recent sessions</h4><ul class="ts-list">${list.slice(0, 5).map(s => `<li><span>${new Date(s.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><small>${esc(s.k || '')}</small><b>${fmt(s.v, d.dp)}</b></li>`).join('')}</ul>` : ''}
      <div class="ts-lock"><div class="ts-blur" aria-hidden="true"><svg viewBox="0 0 640 120"><path d="M20,90 L80,70 L140,80 L200,50 L260,62 L320,40 L380,48 L440,30 L500,36 L560,22 L620,18" class="ts-line"/></svg>
        <div class="ts-tiles"><div><span>Average</span><b>000</b></div><div><span>Consistency</span><b>00%</b></div><div><span>Improvement</span><b>+0.0%</b></div><div><span>Percentile</span><b>Top 00%</b></div></div></div>
        <div class="ts-lock-body"><b>Statistics for every test</b><p>Trend charts, averages, consistency, improvement and percentile for all ${Object.keys(DEF).length} tests, saved to your account. Part of ProMouser Ultra.</p><a class="btn btn-primary btn-sm" href="ultra.html">See Ultra</a></div></div>`;
  }

  /* add a panel under each test that doesn't have one yet */
  function mount() {
    const spots = [['[data-cps=""]', 'cps'], ['[data-test="reaction"]', 'reaction'], ['[data-test="aim"]', 'aim'], ['[data-test="polling"]', 'polling'], ['[data-test="scroll"]', 'scroll'], ['[data-test="buttons"]', 'buttons'], ['.double-click-test-layout', 'doubleclick']];
    spots.forEach(([sel, test]) => { const host = document.querySelector(sel); if (host && !document.querySelector(`[data-tstats="${test}"]`)) { const el = document.createElement('section'); el.dataset.tstats = test; host.after(el); } });
    document.querySelectorAll('[data-tstats]').forEach(render);
  }
  window.PMStats = { record, sessions, DEF, render, mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  if (B() && B().on) B().on(() => document.querySelectorAll('[data-tstats]').forEach(render));
})();
