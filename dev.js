/* =====================================================================
   ProMouser: DEV MODE

   Only loads when the site is opened on your own computer (localhost,
   127.0.0.1 or file://). script.js never requests this file on the live
   site, and deleting it before you upload changes nothing else.

   Turn on:  Ctrl+Shift+D, or add ?dev=1 to the URL (it remembers).
   Turn off: the "Exit dev mode" button, or ?dev=0.

   Panels
     Account  switch Normal / Lite / Ultra, set credits, give/remove passes, reset
     Engine   see every mouse's match score and the parts behind it
     Data     check mice-data.js for missing or odd values
     View     theme preview, grid overlay, no-animation mode, viewport size
   ===================================================================== */
(function () {
  'use strict';
  if (window.__pmDev) return; window.__pmDev = true;
  const root = document.documentElement.dataset.root || '';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ } } };
  const B = () => window.PMBackend, A = () => window.PMAccount;

  /* ---------- styles (kept here so the live CSS has no dev code) ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .pmdev-fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid #ffd60a66;background:#121214ee;color:#ffd60a;font:800 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;cursor:pointer;box-shadow:0 10px 40px -10px #000,0 0 0 4px #ffd60a14;backdrop-filter:blur(10px)}
  .pmdev-fab i{width:8px;height:8px;border-radius:50%;background:#ffd60a;box-shadow:0 0 10px #ffd60a}
  .pmdev{position:fixed;right:18px;bottom:72px;z-index:2147483000;width:min(440px,calc(100vw - 36px));max-height:min(78vh,720px);display:flex;flex-direction:column;border-radius:18px;border:1px solid #ffd60a40;background:#0f0f11f5;color:#e9e9ee;font:13px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 30px 80px -20px #000;backdrop-filter:blur(14px);overflow:hidden}
  .pmdev[hidden]{display:none}
  .pmdev header{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #ffffff14}
  .pmdev header b{font:800 11px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#ffd60a}
  .pmdev header span{color:#8b8b95;font-size:12px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pmdev header button{background:none;border:0;color:#8b8b95;font-size:16px;cursor:pointer;padding:2px 6px}
  .pmdev nav{display:flex;gap:4px;padding:8px 10px 0}
  .pmdev nav button{flex:1;padding:8px 6px;border-radius:10px 10px 0 0;border:0;background:none;color:#8b8b95;font-weight:700;cursor:pointer;border-bottom:2px solid transparent}
  .pmdev nav button.on{color:#fff;border-bottom-color:#ffd60a;background:#ffffff08}
  .pmdev .pd-body{padding:12px 14px 16px;overflow:auto}
  .pmdev h4{margin:14px 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8b8b95}
  .pmdev h4:first-child{margin-top:2px}
  .pmdev .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .pmdev button.b{padding:7px 11px;border-radius:9px;border:1px solid #ffffff1f;background:#ffffff0a;color:#e9e9ee;font:600 12px system-ui,sans-serif;cursor:pointer}
  .pmdev button.b:hover{border-color:#ffd60a80}
  .pmdev button.b.on{background:#ffd60a;color:#111;border-color:#ffd60a}
  .pmdev button.b.warn{border-color:#ff4d4d66;color:#ff8a8a}
  .pmdev .seg{display:inline-flex;border:1px solid #ffffff1f;border-radius:10px;overflow:hidden}
  .pmdev .seg button{padding:8px 14px;border:0;background:none;color:#cfcfd6;font-weight:700;cursor:pointer}
  .pmdev .seg button.on{background:#ffd60a;color:#111}
  .pmdev .seg button.lite.on{background:#2f86ff;color:#fff}
  .pmdev .seg button.ultra.on{background:linear-gradient(135deg,#c084fc,#7c3aed);color:#fff}
  .pmdev input,.pmdev select{padding:6px 8px;border-radius:8px;border:1px solid #ffffff24;background:#18181c;color:#e9e9ee;font:inherit;width:84px}
  .pmdev select{width:auto}
  .pmdev .kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;padding:10px 12px;border-radius:12px;background:#ffffff07;border:1px solid #ffffff10}
  .pmdev .kv dt{color:#8b8b95} .pmdev .kv dd{margin:0;font-weight:600;text-align:right}
  .pmdev .msg{margin-top:10px;font-size:12px;color:#8b8b95;min-height:1.2em} .pmdev .msg.err{color:#ff8a8a} .pmdev .msg.ok{color:#7ee2a8}
  .pmdev table{width:100%;border-collapse:collapse;font-size:12px}
  .pmdev th,.pmdev td{padding:5px 6px;border-bottom:1px solid #ffffff0d;text-align:left;vertical-align:top}
  .pmdev th{color:#8b8b95;font-weight:600;position:sticky;top:-12px;background:#0f0f11}
  .pmdev td.n{text-align:right;font-variant-numeric:tabular-nums}
  .pmdev .bar{height:4px;border-radius:4px;background:#ffffff14;margin-top:3px} .pmdev .bar i{display:block;height:100%;border-radius:4px;background:#ffd60a}
  .pmdev details summary{cursor:pointer;color:#cfcfd6}
  .pmdev .chk{display:flex;gap:6px;align-items:center;color:#cfcfd6}
  .pmdev .chk input{width:auto}
  .pmdev a{color:#ffd60a}
  .pmdev-grid{position:fixed;inset:0;z-index:2147482000;pointer-events:none;display:grid;grid-template-columns:repeat(12,1fr);gap:20px;max-width:1240px;margin:0 auto;padding:0 20px}
  .pmdev-grid i{background:#ffd60a12;border-inline:1px solid #ffd60a33}
  .pmdev-size{position:fixed;left:12px;bottom:12px;z-index:2147483000;padding:5px 9px;border-radius:8px;background:#000c;color:#ffd60a;font:700 11px ui-monospace,monospace;pointer-events:none}
  html.pmdev-noanim *,html.pmdev-noanim *::before,html.pmdev-noanim *::after{animation:none!important;transition:none!important}
  html.pmdev-outline *{outline:1px solid #ffd60a26}
  @media (max-width:600px){.pmdev{right:10px;left:10px;width:auto;bottom:66px}.pmdev-fab{right:10px;bottom:10px}}`;
  document.head.appendChild(css);

  /* ---------- shell ---------- */
  const fab = document.createElement('button');
  fab.className = 'pmdev-fab'; fab.type = 'button'; fab.innerHTML = '<i></i>DEV'; fab.title = 'ProMouser dev panel (Ctrl+Shift+D to hide)';
  const panel = document.createElement('section');
  panel.className = 'pmdev'; panel.setAttribute('aria-label', 'Developer panel'); panel.hidden = !store.get('pm_dev_open', true);
  panel.innerHTML = `<header><b>DEV MODE</b><span id="pdWho"></span><button type="button" id="pdMin" title="Minimise">–</button></header>
    <nav>${['Account', 'Engine', 'Data', 'View'].map(t => `<button type="button" data-tab="${t}">${t}</button>`).join('')}</nav>
    <div class="pd-body" id="pdBody"></div>`;
  document.body.append(fab, panel);
  let tab = store.get('pm_dev_tab', 'Account');
  fab.addEventListener('click', () => { panel.hidden = !panel.hidden; store.set('pm_dev_open', !panel.hidden); if (!panel.hidden) render(); });
  $('#pdMin', panel).addEventListener('click', () => { panel.hidden = true; store.set('pm_dev_open', false); });
  $$('nav button', panel).forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; store.set('pm_dev_tab', tab); render(); }));

  const body = () => $('#pdBody', panel);
  const say = (text, kind = '') => { const m = $('.msg', panel); if (m) { m.textContent = text; m.className = 'msg ' + kind; } };
  const run = async (fn, done) => { try { await fn(); say(done || 'Done.', 'ok'); } catch (e) { say(e.message || String(e), 'err'); } render(true); };

  /* the engine and data panels need the mouse data; load it on pages that don't */
  function needPM(cb) {
    if (window.PM) return cb();
    const add = src => new Promise(r => { const s = document.createElement('script'); s.src = root + src; s.onload = r; s.onerror = r; document.body.appendChild(s); });
    body().innerHTML = '<p>Loading mouse data…</p>';
    (window.PM_MICE ? Promise.resolve() : add('mice-data.js')).then(() => add('stats.js')).then(cb);
  }

  /* ---------- Account ---------- */
  function accountTab(el) {
    const b = B(); if (!b) { el.innerHTML = '<p>No backend on this page.</p>'; return; }
    const u = b.getUser(), bal = b.balance && b.balance();
    if (!u) {
      el.innerHTML = `<h4>Not signed in</h4><div class="row"><button class="b" id="pdQuick" type="button">Create a test account</button><button class="b" id="pdSignin" type="button">Sign in…</button></div>
        <p class="msg">Test accounts use a throwaway @promouser.test email.</p>`;
      $('#pdQuick', el).addEventListener('click', () => run(async () => {
        const n = Date.now().toString(36);
        try { sessionStorage.setItem('pm_onb_asked', '1'); } catch (e) { /* noop */ }
        await b.signUp({ name: 'Dev ' + n.slice(-4), email: `dev-${n}@promouser.test`, password: 'devmode-' + n });
        await b.updateProfile({ onboarded: true, prefs: { games: ['fps', 'minecraft'], weight: 'light' } });
      }, 'Test account created and signed in.'));
      $('#pdSignin', el).addEventListener('click', () => A() && A().openAuth && A().openAuth('signin'));
      return;
    }
    const tier = b.tier ? b.tier() : u.plan.tier;
    el.innerHTML = `
      <h4>Plan</h4>
      <div class="row"><div class="seg">${[['free', 'Normal'], ['lite', 'Lite'], ['ultra', 'Ultra']].map(([k, l]) => `<button type="button" data-plan="${k}" class="${k} ${tier === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <h4>Credits</h4>
      <dl class="kv"><dt>Daily</dt><dd>${bal.daily} / ${bal.dailyAllowance}</dd><dt>Bought</dt><dd>${bal.purchased}</dd><dt>Recommendation Pass</dt><dd>${bal.recPass ? 'until ' + new Date(bal.recPassUntil).toLocaleDateString('en-IN') : 'none'}</dd><dt>Mode</dt><dd>${b.mode === 'supabase' ? 'Supabase' : 'Demo (this browser)'}</dd></dl>
      <div class="row" style="margin-top:8px"><button class="b" data-cr="+5">+5 bought</button><button class="b" data-cr="+50">+50 bought</button><button class="b" data-cr="empty">Empty all</button><button class="b" data-cr="next">Next day (refill)</button></div>
      <div class="row" style="margin-top:6px"><label class="chk">Daily <input type="number" id="pdDaily" min="0" value="${bal.daily}"></label><label class="chk">Bought <input type="number" id="pdBought" min="0" value="${bal.purchased}"></label><button class="b" id="pdSet" type="button">Set</button></div>
      <h4>Passes</h4>
      <div class="row"><button class="b ${bal.recPass ? 'on' : ''}" data-pass="30">Recommendation Pass · 30 days</button><button class="b" data-pass="0">Remove</button></div>
      <h4>Reset</h4>
      <div class="row"><button class="b" data-clear="onboarding">Re-run onboarding</button><button class="b" data-clear="history">Clear history</button><button class="b" data-clear="orders">Clear orders</button></div>
      <div class="row" style="margin-top:6px"><button class="b" id="pdOut" type="button">Sign out</button>${b.mode === 'supabase' ? '' : '<button class="b warn" id="pdWipe" type="button">Wipe all demo data</button>'}</div>
      <p class="msg"></p>`;
    const d = b.dev;
    $$('[data-plan]', el).forEach(x => x.addEventListener('click', () => run(() => d.setPlan(x.dataset.plan), ({ free: 'Switched to Normal (Free).', lite: 'Switched to Lite.', ultra: 'Switched to Ultra.' })[x.dataset.plan])));
    $$('[data-cr]', el).forEach(x => x.addEventListener('click', () => run(() => {
      const v = x.dataset.cr; const c = b.balance();
      if (v === 'next') return d.nextDay();
      if (v === 'empty') return d.setCredits({ daily: 0, purchased: 0 });
      return d.setCredits({ purchased: c.purchased + parseInt(v, 10) });
    })));
    $('#pdSet', el).addEventListener('click', () => run(() => d.setCredits({ daily: +$('#pdDaily', el).value, purchased: +$('#pdBought', el).value })));
    $$('[data-pass]', el).forEach(x => x.addEventListener('click', () => run(() => d.setPass('recommendation', +x.dataset.pass))));
    $$('[data-clear]', el).forEach(x => x.addEventListener('click', () => run(async () => {
      await d.clear(x.dataset.clear);
      if (x.dataset.clear === 'onboarding' && A()) { try { sessionStorage.removeItem('pm_onb_asked'); } catch (e) { /* noop */ } A().startOnboarding(b.getUser()); }
    })));
    $('#pdOut', el).addEventListener('click', () => run(() => b.signOut(), 'Signed out.'));
    const wipe = $('#pdWipe', el);
    wipe && wipe.addEventListener('click', () => { if (!confirm('Delete every demo account and setting stored in this browser?')) return; Object.keys(localStorage).filter(k => k.startsWith('pm_')).forEach(k => localStorage.removeItem(k)); location.reload(); });
  }

  /* ---------- Engine ---------- */
  let eng = store.get('pm_dev_engine', { games: ['minecraft'], weight: 'any', grip: 'any', connection: 'any', mcVersion: 'any', handLength: '', lefty: false, budgetMax: '' });
  function engineTab(el) {
    needPM(() => {
      const PM = window.PM, u = B() && B().getUser();
      const p = { ...eng, handLength: eng.handLength ? +eng.handLength : null, budgetMax: eng.budgetMax ? +eng.budgetMax : null };
      const res = PM.recommend(p);
      const sel = (id, opts, v) => `<select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
      el.innerHTML = `
        <h4>Test preferences</h4>
        <div class="row">${['fps', 'minecraft', 'mmo', 'work'].map(g => `<label class="chk"><input type="checkbox" data-g="${g}" ${eng.games.includes(g) ? 'checked' : ''}>${g}</label>`).join('')}</div>
        <div class="row" style="margin-top:6px">${sel('peW', [['any', 'Any weight'], ['light', 'Light'], ['balanced', 'Balanced'], ['heavy', 'Heavy']], eng.weight)}${sel('peG', [['any', 'Any grip'], ['palm', 'Palm'], ['claw', 'Claw'], ['fingertip', 'Fingertip']], eng.grip)}${sel('peC', [['any', 'Any conn.'], ['wired', 'Wired'], ['wireless', 'Wireless']], eng.connection)}${sel('peV', [['any', 'MC any'], ['1.8', 'MC 1.8'], ['1.9+', 'MC 1.9+']], eng.mcVersion)}</div>
        <div class="row" style="margin-top:6px"><label class="chk">Hand cm <input id="peH" type="number" step="0.5" min="14" max="24" value="${eng.handLength}"></label><label class="chk">Budget ₹ <input id="peB" type="number" step="500" value="${eng.budgetMax}"></label><label class="chk"><input type="checkbox" id="peL" ${eng.lefty ? 'checked' : ''}>Lefty</label></div>
        <div class="row" style="margin-top:6px">${u ? '<button class="b" id="peMine" type="button">Use my profile</button>' : ''}<span style="color:#8b8b95">${res.length} mice scored</span></div>
        <h4>Scores</h4>
        <table><thead><tr><th>#</th><th>Mouse</th><th class="n">Score</th><th>Parts</th></tr></thead><tbody>${res.map((r, i) => `<tr><td>${i + 1}</td><td><a href="${root + r.m.page}">${esc(r.m.short)}</a><div class="bar"><i style="width:${r.score}%"></i></div></td><td class="n"><b>${r.score}</b></td>
          <td><details><summary>${r.parts.length} parts</summary>${r.parts.map(x => `${esc(x.label)} ${Math.round(x.value * 100)}% ×${x.weight}`).join('<br>')}${r.cons.length ? `<br><span style="color:#ff8a8a">${r.cons.map(esc).join('<br>')}</span>` : ''}</details></td></tr>`).join('')}</tbody></table>`;
      const save = () => { store.set('pm_dev_engine', eng); engineTab(el); };
      $$('[data-g]', el).forEach(x => x.addEventListener('change', () => { eng.games = $$('[data-g]:checked', el).map(c => c.dataset.g); save(); }));
      [['peW', 'weight'], ['peG', 'grip'], ['peC', 'connection'], ['peV', 'mcVersion'], ['peH', 'handLength'], ['peB', 'budgetMax']].forEach(([id, k]) => $('#' + id, el).addEventListener('change', e => { eng[k] = e.target.value; save(); }));
      $('#peL', el).addEventListener('change', e => { eng.lefty = e.target.checked; save(); });
      const mine = $('#peMine', el); mine && mine.addEventListener('click', () => { const pr = B().getUser().prefs; eng = { ...eng, games: pr.games.map(g => (g === 'office' || g === 'creative' ? 'work' : g)), weight: pr.weight || 'any', grip: pr.grip || 'any', connection: pr.connection || 'any' }; save(); });
    });
  }

  /* ---------- Data ---------- */
  function dataTab(el) {
    needPM(() => {
      const M = window.PM.MICE, issues = [];
      const req = ['weight', 'dpi', 'poll', 'connection', 'buttons', 'sensor', 'switches', 'shape', 'hand', 'price', 'dims'];
      M.forEach(m => {
        const miss = req.filter(k => m[k] == null);
        if (miss.length) issues.push([m, 'missing: ' + miss.join(', ')]);
        if (m.weight < 30 || m.weight > 200) issues.push([m, 'odd weight ' + m.weight]);
        if (m.connection === 'Wireless' && !m.battery) issues.push([m, 'wireless with no battery figure']);
        if (!m.cps || m.cps.level < 1 || m.cps.level > 5) issues.push([m, 'bad CPS level']);
        if (Object.values(m.clicking).every(v => v == null)) issues.push([m, 'no clicking data']);
      });
      const brands = {}; M.forEach(m => (brands[m.brand] = (brands[m.brand] || 0) + 1));
      el.innerHTML = `
        <dl class="kv"><dt>Mice</dt><dd>${M.length}</dd><dt>Brands</dt><dd>${Object.keys(brands).length}</dd><dt>With product photos</dt><dd>${M.filter(m => !m.img.startsWith('art/')).length}</dd><dt>Illustrated</dt><dd>${M.filter(m => m.img.startsWith('art/')).length}</dd><dt>Fields flagged “verify”</dt><dd>${M.reduce((a, m) => a + (m.verify || []).length, 0)}</dd></dl>
        <h4>Checks (${issues.length})</h4>
        ${issues.length ? `<table><tbody>${issues.map(([m, t]) => `<tr><td><a href="${root + m.page}">${esc(m.short)}</a></td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>` : '<p>Everything looks complete.</p>'}
        <h4>By brand</h4><p>${Object.entries(brands).sort((a, b) => b[1] - a[1]).map(([b, n]) => `${esc(b)} ${n}`).join(' · ')}</p>
        <h4>Verify list</h4><details><summary>Show every note</summary>${M.filter(m => m.verify && m.verify.length).map(m => `<p><b>${esc(m.name)}</b><br>${m.verify.map(esc).join('<br>')}</p>`).join('')}</details>`;
    });
  }

  /* ---------- View ---------- */
  let grid = null, size = null;
  function viewTab(el) {
    const html = document.documentElement, on = c => html.classList.contains(c);
    el.innerHTML = `
      <h4>Theme preview</h4><div class="row"><div class="seg">${[['red', 'Red / black', ''], ['lite', 'Lite blue', 'lite'], ['ultra', 'Ultra purple', 'ultra']].map(([k, l, v]) => `<button type="button" data-th="${k}" class="${v} ${(html.dataset.plan || '') === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <p class="msg">Preview only. Use the Account tab to really switch plans.</p>
      <h4>Layout</h4><div class="row"><button class="b ${grid ? 'on' : ''}" id="pvGrid" type="button">12-column grid</button><button class="b ${size ? 'on' : ''}" id="pvSize" type="button">Viewport size</button><button class="b ${on('pmdev-outline') ? 'on' : ''}" id="pvOut" type="button">Outline elements</button></div>
      <h4>Motion</h4><div class="row"><button class="b ${on('pmdev-noanim') ? 'on' : ''}" id="pvAnim" type="button">Turn off animations</button><button class="b" id="pvReveal" type="button">Reveal everything</button></div>
      <h4>Dev mode</h4><div class="row"><button class="b warn" id="pvExit" type="button">Exit dev mode</button></div>`;
    $$('[data-th]', el).forEach(x => x.addEventListener('click', () => { if (x.dataset.th === 'red') delete html.dataset.plan; else html.dataset.plan = x.dataset.th; viewTab(el); }));
    $('#pvGrid', el).addEventListener('click', () => { if (grid) { grid.remove(); grid = null; } else { grid = document.createElement('div'); grid.className = 'pmdev-grid'; grid.innerHTML = '<i></i>'.repeat(12); document.body.appendChild(grid); } viewTab(el); });
    $('#pvSize', el).addEventListener('click', () => { if (size) { size.remove(); size = null; } else { size = document.createElement('div'); size.className = 'pmdev-size'; document.body.appendChild(size); const upd = () => size && (size.textContent = `${innerWidth} × ${innerHeight}`); upd(); addEventListener('resize', upd); } viewTab(el); });
    $('#pvOut', el).addEventListener('click', () => { html.classList.toggle('pmdev-outline'); viewTab(el); });
    $('#pvAnim', el).addEventListener('click', () => { html.classList.toggle('pmdev-noanim'); store.set('pm_dev_noanim', on('pmdev-noanim')); viewTab(el); });
    $('#pvReveal', el).addEventListener('click', () => $$('.reveal').forEach(r => r.classList.add('in', 'visible')));
    $('#pvExit', el).addEventListener('click', () => { store.set('pm_dev', 0); location.reload(); });
  }
  if (store.get('pm_dev_noanim', false)) document.documentElement.classList.add('pmdev-noanim');

  /* ---------- render ---------- */
  function render(keepMsg) {
    if (panel.hidden) return;
    const b = B(), u = b && b.getUser();
    $('#pdWho', panel).textContent = u ? `${u.name} · ${({ free: 'Normal', lite: 'Lite', ultra: 'Ultra' })[u.plan.tier] || 'Normal'}` : 'signed out';
    $$('nav button', panel).forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
    const msg = keepMsg && $('.msg', panel) ? [$('.msg', panel).textContent, $('.msg', panel).className] : null;
    ({ Account: accountTab, Engine: engineTab, Data: dataTab, View: viewTab })[tab](body());
    if (msg && $('.msg', panel)) { $('.msg', panel).textContent = msg[0]; $('.msg', panel).className = msg[1]; }
  }
  const wait = () => (window.PMBackend ? (B().on(() => render(true)), render()) : setTimeout(wait, 50));
  wait();
  window.PMDev = { open: () => { panel.hidden = false; render(); }, close: () => { panel.hidden = true; } };
})();
