/* =====================================================================
   ProMouser Hub (./ in Hub mode): mouse search, mouse of the day,
   your test bests and the spec record holders. Runs on mice-data.js +
   stats.js (window.PM). Reads test results stored by tests.js, cps.js and
   teststats.js in this browser.
   ===================================================================== */
(() => {
  'use strict';
  const PM = window.PM; if (!PM) return;
  const { MICE, esc, inr, num } = PM, root = document.documentElement.dataset.root || '';
  const $ = (s, r = document) => r.querySelector(s);
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const specs = m => [m.weight != null && m.weight + ' g', m.poll && num(m.poll) + ' Hz', m.connection, m.price ? inr(m.price) : null].filter(Boolean);

  /* ---------- search: words match name/brand/sensor; "under 60 g", "under ₹3000", "8k" also work ---------- */
  const form = $('[data-hub-search]');
  if (form) {
    const input = $('input', form), out = $('.hub-results', form);
    const hay = m => `${m.name} ${m.short || ''} ${m.brand} ${m.sensor || ''} ${m.connection} ${(m.games || []).join(' ')}`.toLowerCase();
    function find(q) {
      let t = q.toLowerCase().replace(/,/g, '');
      const f = [];
      t = t.replace(/(under|below|less than|<)\s*(\d+)\s*(g|grams?)\b/, (_, a, n) => { f.push(m => m.weight != null && m.weight <= +n); return ' '; });
      t = t.replace(/(under|below|less than|<)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/, (_, a, n, k) => { const v = +n * (k ? 1000 : 1); f.push(m => m.price && m.price <= v); return ' '; });
      t = t.replace(/\b(8k|8000|4k|4000)\s*(hz)?\b/, (_, n) => { const v = /8/.test(n) ? 8000 : 4000; f.push(m => m.poll >= v); return ' '; });
      if (/\bwireless\b/.test(t)) { f.push(m => /wireless/i.test(m.connection)); t = t.replace(/\bwireless\b/, ' '); }
      if (/\bwired\b/.test(t)) { f.push(m => !/wireless/i.test(m.connection)); t = t.replace(/\bwired\b/, ' '); }
      const words = t.split(/\s+/).filter(w => w.length > 1 && !['mice', 'mouse', 'the', 'a', 'with', 'and'].includes(w));
      return MICE.filter(m => f.every(fn => fn(m)) && words.every(w => hay(m).includes(w))).sort((a, b) => (a.weight || 999) - (b.weight || 999));
    }
    const show = () => {
      const q = input.value.trim(); if (!q) { out.hidden = true; return; }
      const r = find(q);
      out.innerHTML = r.length ? r.slice(0, 6).map(m => `<a href="${root}${m.page}"><img src="${PM.IMG(m, 480)}" alt="" width="46" height="46" loading="lazy"><span><b>${esc(m.name)}</b><small>${esc(specs(m).join(' · '))}</small></span></a>`).join('') + (r.length > 6 ? `<a class="more" href="${root}mice#catalog">${r.length - 6} more in the catalogue →</a>` : '')
        : `<p>No mice match “${esc(q)}”. <a href="${root}mouse-ai?q=${encodeURIComponent(q)}">Ask ProMouser AI instead →</a></p>`;
      out.hidden = false;
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', show);
    form.addEventListener('submit', e => { e.preventDefault(); const r = find(input.value.trim()); if (r[0]) location.href = root + r[0].page; });
    document.addEventListener('click', e => { if (!form.contains(e.target)) out.hidden = true; });
  }

  /* ---------- mouse of the day: same pick for everyone, changes at midnight ---------- */
  const motd = $('[data-hub-motd]');
  if (motd) {
    const d = new Date(), day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5), m = MICE[(day * 7 + 3) % MICE.length];
    const other = MICE.filter(x => x.id !== m.id).sort((a, b) => Math.abs((a.weight || 0) - (m.weight || 0)) - Math.abs((b.weight || 0) - (m.weight || 0)))[0];
    motd.innerHTML = `<span class="section-label">Mouse of the day</span>
      <a class="motd-img" href="${root}${m.page}"><img src="${PM.IMG(m, 720)}" alt="${esc(m.name)}" loading="lazy"></a>
      <span class="mc-brand">${esc(m.brand)}</span><h3>${esc(m.name)}</h3>
      <div class="motd-specs">${[['Weight', m.weight != null ? m.weight + ' g' : '—'], ['Sensor', m.dpi ? num(m.dpi) + ' DPI' : '—'], ['Polling', m.poll ? num(m.poll) + ' Hz' : '—'], ['Price', m.price ? inr(m.price) : '—']].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
      <div class="hero-cta"><a class="btn btn-primary btn-sm" href="${root}${m.page}">Full specs</a><a class="btn btn-ghost btn-sm" href="${root}mice/compare?m=${m.id},${other.id}">Compare</a><a class="btn btn-ghost btn-sm" href="${root}mouse-ai?q=${encodeURIComponent('Tell me about the ' + (m.short || m.name))}">Ask about it</a></div>`;
  }

  /* ---------- your test bests ---------- */
  const tests = $('[data-hub-tests]');
  if (tests) {
    const t = read('pm_tests') || {}, cps = (read('pm_cps') || {}).best || {}, log = read('pm_test_log') || {};
    const bestCps = Object.entries(cps).filter(([k]) => /^\d+$/.test(k)).sort((a, b) => b[1].cps - a[1].cps)[0];
    const aim = Object.entries(t.aim || {}).sort((a, b) => a[1] - b[1])[0];
    const low = k => (log[k] || []).reduce((a, s) => Math.min(a, s.v), Infinity), n = k => (log[k] || []).length;
    const T = [
      ['cps-test', 'Click', 'CPS test', 'How many clicks a second?', bestCps && `${bestCps[1].cps.toFixed(2)} CPS`],
      ['reaction-test', 'Speed', 'Reaction time', 'Click the moment it turns green', t.reaction && `${t.reaction.best} ms`],
      ['aim-trainer', 'Aim', 'Aim trainer', 'Speed and accuracy on targets', aim && `${(aim[1] / 1000).toFixed(2)} s`],
      ['double-click-test', 'Click', 'Double click', 'Is your switch double clicking?', n('doubleclick') && `${n('doubleclick')} checks`],
      ['polling-rate-test', 'Poll', 'Polling rate', 'How many Hz your mouse reports', t.polling && `${num(t.polling.hz)} Hz`],
      ['scroll-test', 'Scroll', 'Scroll wheel', 'Catch reverse jumps', n('scroll') && `${low('scroll').toFixed(1)} jumps / 100`],
      ['mouse-button-test', 'Test', 'Mouse buttons', 'Every button, chatter check', n('buttons') && `${n('buttons')} sessions`]
    ];
    tests.innerHTML = T.map(([href, ic, name, sub, best]) => `<a class="hub-test reveal visible" href="${root}${href}"><span class="ht-ico" data-icon="${ic}"></span><b>${name}</b><small>${sub}</small><em class="${best ? '' : 'none'}">${best ? 'Best: ' + esc(best) : 'Not taken yet'}</em></a>`).join('')
      + `<a class="hub-test stats reveal visible" href="${root}my-stats"><span class="ht-ico" data-icon="Stats"></span><b>My stats</b><small>All your results in one place</small><em>Open →</em></a>`;
    window.PMIcons && window.PMIcons(tests);
  }

  /* ---------- spec record holders ---------- */
  const lead = $('[data-hub-leaders]');
  if (lead) {
    const by = (f, dir = 1, ok = () => true) => MICE.filter(m => f(m) != null && ok(m)).sort((a, b) => dir * (f(a) - f(b)) || (a.weight || 0) - (b.weight || 0))[0];
    const L = [
      ['Lightest', by(m => m.weight), m => m.weight + ' g'],
      ['Lightest wireless', by(m => m.weight, 1, m => /wireless/i.test(m.connection)), m => m.weight + ' g'],
      ['Highest polling', by(m => m.poll, -1), m => num(m.poll) + ' Hz'],
      ['Highest DPI', by(m => m.dpi, -1), m => num(m.dpi) + ' DPI'],
      ['Longest battery', by(m => m.battery, -1), m => num(m.battery) + ' h'],
      ['Most buttons', by(m => m.buttons, -1), m => m.buttons + ' buttons'],
      ['Best for CPS', by(m => m.cps && m.cps.level, -1), m => m.cps.label],
      ['Cheapest', by(m => m.price, 1, m => m.price > 0), m => inr(m.price)]
    ].filter(x => x[1]);
    lead.innerHTML = L.map(([t, m, v]) => `<a class="hub-lead reveal visible" href="${root}${m.page}"><img src="${PM.IMG(m, 480)}" alt="" loading="lazy" width="72" height="72"><span><small>${t}</small><b>${esc(m.name)}</b><em>${esc(v(m))}</em></span></a>`).join('');
  }
})();
