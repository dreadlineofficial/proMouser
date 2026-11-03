/* =====================================================================
   ProMouser — account UI
   Header sign-in / credits pill, auth modal, first-time onboarding
   (games + weight preference), toasts, and the account page.
   Talks only to window.PMBackend (see backend.js).
   ===================================================================== */
(function () {
  'use strict';
  const B = window.PMBackend; if (!B) return;
  const PLAN = window.PM_PLAN;
  const CFG = B.CONFIG;
  const root = document.documentElement.dataset.root || '';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtDate = t => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GAMES = [
    { id: 'fps', label: 'FPS & shooters', sub: 'Valorant, CS2, Fortnite…', icon: 'target' },
    { id: 'minecraft', label: 'Minecraft', sub: 'Building, PvP, bridging', icon: 'box' },
    { id: 'office', label: 'Office & productivity', sub: 'Work, study, browsing', icon: 'grid' },
    { id: 'creative', label: 'Creative work', sub: 'Editing, design, 3D', icon: 'image' },
    { id: 'mmo', label: 'MMO & MOBA', sub: 'WoW, LoL, Dota, Genshin…', icon: 'pad' }
  ];
  const WEIGHTS = [
    { id: 'light', label: 'Light', sub: 'Under about 70 g', hint: 'Fast and flickable' },
    { id: 'balanced', label: 'Balanced', sub: 'About 70–110 g', hint: 'A bit of everything' },
    { id: 'heavy', label: 'Heavy', sub: '110 g and up', hint: 'Planted and steady' },
    { id: 'any', label: 'No preference', sub: 'Show me everything', hint: '' }
  ];
  const GRIPS = [{ id: 'any', label: 'Not sure' }, { id: 'palm', label: 'Palm' }, { id: 'claw', label: 'Claw' }, { id: 'fingertip', label: 'Fingertip' }];
  const CONNS = [{ id: 'any', label: 'Either' }, { id: 'wired', label: 'Wired' }, { id: 'wireless', label: 'Wireless' }];
  window.PM_OPTIONS = { GAMES, WEIGHTS, GRIPS, CONNS };

  const ICON = n => (window.PMIcon ? window.PMIcon(n) : '');
  const COIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 8h7M8.5 11h7M8.5 8h1.5a2.500 2.500 0 0 1 0 5H8.500l5.500 4"/></svg>';

  /* ---------- toast ---------- */
  let toastEl, toastTimer;
  function toast(msg, kind) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.className = 'toast' + (kind ? ' ' + kind : ''); toastEl.textContent = msg; void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  /* ---------- generic modal shell ---------- */
  let overlay, lastFocus, onClose;
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div'); overlay.className = 'pm-overlay'; overlay.id = 'pmOverlay';
    overlay.innerHTML = '<div class="pm-modal" role="dialog" aria-modal="true" tabindex="-1"><button class="pm-close" type="button" aria-label="Close">✕</button><div class="pm-modal-body"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('.pm-close')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
    return overlay;
  }
  function openModal(html, { wide = false, close = null } = {}) {
    ensureOverlay(); lastFocus = document.activeElement; onClose = close;
    const m = $('.pm-modal', overlay); m.classList.toggle('wide', wide);
    $('.pm-modal-body', overlay).innerHTML = html;
    overlay.classList.add('open'); document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('input:not([type=hidden]), button:not(.pm-close)', m) || m; f.focus({ preventScroll: true }); }, 60);
    return $('.pm-modal-body', overlay);
  }
  function closeModal(silent) {
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open'); document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    const cb = onClose; onClose = null; if (cb && !silent) cb();
  }

  /* ---------- auth modal ---------- */
  function openAuth(mode = 'signin', opts = {}) {
    const body = openModal('', { close: opts.onCancel });
    const render = (md) => {
      const up = md === 'signup';
      body.innerHTML = `
        <div class="auth-head"><span class="section-label">${up ? 'Create your account' : 'Welcome back'}</span><h2 id="authTitle">${up ? 'Join <em>ProMouser</em>' : 'Sign <em>in</em>'}</h2>
        <p>${up ? 'Free accounts get <strong>' + CFG.free.dailyCredits + ' recommendations every day</strong>. It takes under a minute.' : 'Sign in to use your credits and saved preferences.'}</p></div>
        <div class="seg auth-tabs" role="tablist"><button type="button" role="tab" data-m="signin" class="${up ? '' : 'on'}">Sign in</button><button type="button" role="tab" data-m="signup" class="${up ? 'on' : ''}">Create account</button></div>
        <form class="auth-form" novalidate>
          ${up ? '<label>Your name<input name="name" autocomplete="name" required maxlength="40" placeholder="e.g. Aarav"></label>' : ''}
          <label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@email.com"></label>
          <label>Password<input name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" required minlength="8" placeholder="${up ? 'At least 8 characters' : 'Your password'}"></label>
          <p class="auth-error" role="alert" hidden></p>
          <button class="btn btn-primary btn-block" type="submit"><span>${up ? 'Create account' : 'Sign in'}</span></button>
        </form>
        ${B.mode === 'supabase' ? '' : '<p class="demo-note"><strong>Demo mode:</strong> accounts are stored only in this browser until the real sign-in service is connected. Don’t reuse an important password.</p>'}`;
      $$('.auth-tabs button', body).forEach(b => b.addEventListener('click', () => render(b.dataset.m)));
      const form = $('form', body), err = $('.auth-error', body), btn = $('button[type=submit]', body);
      form.addEventListener('submit', async e => {
        e.preventDefault(); err.hidden = true; btn.disabled = true; btn.classList.add('loading');
        const d = Object.fromEntries(new FormData(form));
        try {
          const u = up ? await B.signUp(d) : await B.signIn(d);
          closeModal(true); try { sessionStorage.setItem('pm_onb_asked', '1'); } catch (e2) { /* noop */ }
          if (!u.onboarded) startOnboarding(u, opts.after); else { toast(`Welcome back, ${u.name.split(' ')[0]}!`); opts.after && opts.after(u); }
        } catch (ex) { err.textContent = ex.message; err.hidden = false; err.classList.toggle('is-info', ex.code === 'CONFIRM_EMAIL'); btn.disabled = false; btn.classList.remove('loading'); form.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 260 }); }
      });
      $('input', form).focus();
    };
    render(mode);
  }

  /* ---------- onboarding: games, then weight preference ---------- */
  function startOnboarding(user, after) {
    const sel = { games: new Set(user.prefs.games || []), weight: user.prefs.weight && user.prefs.weight !== 'any' ? user.prefs.weight : null };
    let step = 0;
    const body = openModal('', { wide: true, close: () => { /* skipping keeps defaults; ask again next sign-in */ } });
    const dots = () => `<div class="steps-dots" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('')}</div>`;
    function render() {
      if (step === 0) {
        body.innerHTML = `${dots()}<div class="auth-head"><span class="section-label">Step 1 of 2</span><h2>What do you <em>play</em>?</h2><p>Pick everything that applies. We use this to tailor your recommendations.</p></div>
          <div class="choice-grid">${GAMES.map(g => `<button type="button" class="choice${sel.games.has(g.id) ? ' on' : ''}" data-id="${g.id}" aria-pressed="${sel.games.has(g.id)}"><span class="choice-ico">${ICON(g.icon)}</span><b>${g.label}</b><small>${g.sub}</small><i class="tick" aria-hidden="true">✓</i></button>`).join('')}</div>
          <div class="onb-actions"><span class="muted-note" id="onbNote"></span><button class="btn btn-primary" type="button" id="onbNext">Next</button></div>`;
        $$('.choice', body).forEach(c => c.addEventListener('click', () => { const id = c.dataset.id; sel.games.has(id) ? sel.games.delete(id) : sel.games.add(id); c.classList.toggle('on', sel.games.has(id)); c.setAttribute('aria-pressed', sel.games.has(id)); $('#onbNote', body).textContent = ''; }));
        $('#onbNext', body).addEventListener('click', () => { if (!sel.games.size) { $('#onbNote', body).textContent = 'Pick at least one so we know where to start.'; return; } step = 1; render(); });
      } else if (step === 1) {
        body.innerHTML = `${dots()}<div class="auth-head"><span class="section-label">Step 2 of 2</span><h2>How heavy do you like <em>your mouse</em>?</h2><p>Lighter mice are quicker to flick; heavier ones feel steadier. There’s no wrong answer.</p></div>
          <div class="choice-grid four">${WEIGHTS.map(w => `<button type="button" class="choice${sel.weight === w.id ? ' on' : ''}" data-id="${w.id}" aria-pressed="${sel.weight === w.id}"><b>${w.label}</b><small>${w.sub}</small><em class="hint">${w.hint}</em><i class="tick" aria-hidden="true">✓</i></button>`).join('')}</div>
          <div class="onb-actions"><button class="btn btn-ghost" type="button" id="onbBack">Back</button><span class="muted-note" id="onbNote"></span><button class="btn btn-primary" type="button" id="onbNext">Finish</button></div>`;
        $$('.choice', body).forEach(c => c.addEventListener('click', () => { sel.weight = c.dataset.id; $$('.choice', body).forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); $('#onbNote', body).textContent = ''; }));
        $('#onbBack', body).addEventListener('click', () => { step = 0; render(); });
        $('#onbNext', body).addEventListener('click', async () => {
          if (!sel.weight) { $('#onbNote', body).textContent = 'Choose one (or “No preference”).'; return; }
          const btn = $('#onbNext', body); btn.disabled = true;
          await B.updateProfile({ prefs: { games: [...sel.games], weight: sel.weight }, onboarded: true });
          step = 2; render();
        });
      } else {
        body.innerHTML = `${dots()}<div class="auth-head center"><div class="done-badge" aria-hidden="true">✓</div><h2>You’re <em>all set</em></h2><p>Your preferences are saved. You get <strong>${CFG.free.dailyCredits} free credits every day</strong>, and each recommendation uses ${CFG.free.costPerRecommendation} credit.</p></div>
          <div class="onb-actions center"><a class="btn btn-primary" href="${root}recommendations.html" id="onbGo">Get my recommendations</a><button class="btn btn-ghost" type="button" id="onbClose">Explore the site</button></div>`;
        $('#onbClose', body).addEventListener('click', () => { closeModal(true); after && after(B.getUser()); });
        $('#onbGo', body).addEventListener('click', () => closeModal(true));
      }
      const f = $('.choice, .btn', body); if (f) f.focus({ preventScroll: true });
    }
    render();
  }

  /* ---------- header slot ---------- */
  function renderSlot() {
    const slot = $('#accountSlot'); if (!slot) return;
    const u = B.getUser();
    if (!u) { slot.innerHTML = '<button class="btn btn-ghost btn-sm" type="button" data-auth="signin">Sign in</button>'; return; }
    const bal = B.balance(), t = B.tier(), init = esc(u.name.trim().charAt(0).toUpperCase() || '?');
    slot.innerHTML = `
      <a class="credit-pill${bal.recPass ? ' has-pass' : ''}" href="${root}shop.html" title="Credits: ${bal.daily} daily + ${bal.purchased} purchased${bal.recPass ? ' · Recommendation Pass active' : ''}">${COIN}<b>${bal.total}</b><small>credits</small>${bal.recPass ? '<span class="pass-dot" aria-label="Recommendation Pass active">PASS</span>' : ''}</a>
      <div class="user-menu">
        <button class="avatar ${t}" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">${init}</button>
        <div class="user-dd" role="menu">
          <div class="user-dd-head"><b>${esc(u.name)}</b><small>${esc(u.email)}</small><span class="plan-tag ${t}">${t === 'free' ? 'Free plan' : PLAN.label(t)}</span></div>
          <a role="menuitem" href="${root}elite.html">Elite Dashboard</a>
          <a role="menuitem" href="${root}account.html">My account</a>
          <a role="menuitem" href="${root}recommendations.html">Recommendations</a>
          <a role="menuitem" href="${root}daily.html">Daily &amp; Mousle</a>
          <a role="menuitem" href="${root}setup.html">My setup</a>
          <a role="menuitem" href="${root}shop.html">Shop &amp; credits</a>
          ${t === 'ultra' ? `<a role="menuitem" href="${root}sens.html">Sensitivity converter</a>` : `<a role="menuitem" href="${root}ultra.html" class="upsell">Go Ultra</a>`}${t === 'free' || t === 'basic' ? `<a role="menuitem" href="${root}lite.html" class="upsell">Upgrade to Lite</a>` : ''}
          <button role="menuitem" type="button" data-auth="signout">Sign out</button>
        </div>
      </div>`;
    const btn = $('.avatar', slot), menu = $('.user-menu', slot);
    btn.addEventListener('click', e => { e.stopPropagation(); const o = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
  }
  document.addEventListener('click', e => {
    const m = $('.user-menu.open'); if (m && !m.contains(e.target)) { m.classList.remove('open'); $('.avatar', m).setAttribute('aria-expanded', 'false'); }
    const a = e.target.closest('[data-auth]'); if (!a) return;
    const act = a.dataset.auth;
    if (act === 'signin' || act === 'signup') { e.preventDefault(); openAuth(act); }
    if (act === 'signout') { B.signOut().then(() => { toast('Signed out.'); if (/account|recommendations/.test(location.pathname)) location.reload(); }); }
  });

  /* public helpers used by other scripts */
  /* ---------- Ultra gate: friendly upsell when a non-Ultra user tries an Ultra feature ---------- */
  function ultraGate(what) {
    openModal(`<div class="auth-head"><span class="ultra-badge">Ultra</span><h2>${esc(what)} is part of <em>ProMouser Ultra</em></h2></div>
      <p class="panel-note">Ultra adds unlimited recommendations, statistics for every test, a year of ProMouser Turbo, saved profiles, a price watchlist, the sensitivity converter, shortlist export and an assistant that remembers you — plus everything in Lite and Basic.</p>
      <div class="onb-actions"><button class="btn btn-ghost" type="button" data-close>Not now</button><a class="btn btn-primary" href="${root}ultra.html">See Ultra · ${inr(CFG.ultra.product.price)} once</a></div>`);
    const c = $('#pmOverlay [data-close]'); c && c.addEventListener('click', () => closeModal());
  }

  /* ---------- watchlist stars ([data-watch="mouse-id"] data-price="…") ---------- */
  function syncWatch() {
    const u = B.getUser(), ids = new Set(((u && u.extras && u.extras.watchlist) || []).map(w => w.id));
    $$('[data-watch]').forEach(b => { const on = ids.has(b.dataset.watch); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const l = $('.wl', b); if (l) l.textContent = on ? 'Watching price' : 'Watch price'; });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-watch]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const u = B.getUser();
    if (!u) { openAuth('signup'); return; }
    if (!B.has('watchlist')) { ultraGate('The price watchlist'); return; }
    const list = (u.extras.watchlist || []).slice(), i = list.findIndex(w => w.id === b.dataset.watch);
    if (i >= 0) list.splice(i, 1); else list.unshift({ id: b.dataset.watch, price: b.dataset.price ? +b.dataset.price : null, at: Date.now() });
    try { await B.updateExtras({ watchlist: list }); toast(i >= 0 ? 'Removed from your watchlist.' : 'Added to your watchlist. Track it on your Elite Dashboard.'); } catch (er) { toast(er.message, 'err'); }
    syncWatch();
  });
  B.on(syncWatch); syncWatch();

  window.PMAccount = {
    toast, openModal, closeModal, openAuth, startOnboarding, inr, fmtDate, esc, COIN, ultraGate, syncWatch,
    requireAuth(cb, opts) { const u = B.getUser(); if (u) { if (!u.onboarded) { startOnboarding(u, cb); return false; } cb && cb(u); return true; } openAuth('signup', { after: cb, ...opts }); return false; }
  };

  /* ---------- account page: progress (everyone) and appearance (Ultra accounts only) ---------- */
  function progressPanel() {
    const C = window.PMCore; if (!C) return '';
    const S = C.state, L = C.levelOf(S.xp), lo = C.xpFor(L), hi = C.xpFor(L + 1), st = C.streakNow(), ch = C.challenge();
    return `<article class="panel acct-prog"><div class="panel-head"><h3>Your progress</h3><span class="plan-tag">Level ${L} · ${C.titleOf(L)}</span></div>
      <div class="ap-bar"><i style="width:${Math.round((S.xp - lo) / (hi - lo) * 100)}%"></i></div><p class="panel-note">${S.xp - lo} / ${hi - lo} XP to level ${L + 1}</p>
      <div class="credit-stats"><div><span>Streak</span><b>${st ? '🔥 ' + st : '0'}</b><em>best ${S.streak.best}</em></div><div><span>Achievements</span><b>${Object.keys(S.ach).length}<small> / ${C.ACH.length}</small></b><em>unlocked</em></div><div><span>Today</span><b>${ch.done ? '✓' : '—'}</b><em>${ch.done ? 'challenge done' : esc(ch.text)}</em></div></div>
      <div class="hero-cta" style="margin-top:1rem"><a class="btn btn-primary btn-sm" href="${root}daily.html">Open Daily</a><a class="btn btn-ghost btn-sm" href="${root}setup.html">My setup</a><a class="btn btn-ghost btn-sm" href="${root}my-stats.html">My stats</a></div></article>`;
  }
  const ACCENTS = [['default', 'Purple', '#a855f7', '#7c3aed'], ['classic', 'Red', '#ff2a47', '#c4001f'], ['lite', 'Blue', '#4aa3ff', '#1f5fe6'], ['navy', 'Navy', '#3b63e3', '#142a80'], ['emerald', 'Emerald', '#34d399', '#047857'], ['amber', 'Amber', '#fbbf24', '#ea580c'], ['sakura', 'Sakura', '#f472b6', '#be185d'], ['cyan', 'Cyan', '#22d3ee', '#0e7490'], ['mono', 'Mono', '#e4e4e7', '#71717a']];
  function appearancePanel() {
    const seg = (k, opts) => `<div class="ui-seg">${opts.map(([v, l]) => `<button type="button" data-ui-set="${k}:${v}">${l}</button>`).join('')}</div>`;
    return `<article class="panel ui-panel"><h3>Appearance</h3><p class="panel-note">Make ProMouser yours. Changes apply straight away and follow your account.</p>
      <div class="ui-row"><span>Colour</span><div class="ui-swatches">${ACCENTS.map(([v, l, a, b]) => `<button type="button" class="ui-sw" data-ui-set="accent:${v}" title="${l}" aria-label="${l}" style="background:linear-gradient(135deg, ${a}, ${b})"></button>`).join('')}</div></div>
      <div class="ui-row"><span>Background</span>${seg('bg', [['default', 'Grid'], ['plain', 'Plain'], ['aurora', 'Aurora']])}</div>
      <div class="ui-row"><span>Glow effects</span>${seg('glow', [['default', 'On'], ['off', 'Off']])}</div>
      <div class="ui-row"><span>Density</span>${seg('density', [['default', 'Comfortable'], ['compact', 'Compact']])}</div></article>`;
  }

  /* ---------- account page ---------- */
  function renderAccountPage(host) {
    const u = B.getUser();
    if (!u) {
      host.innerHTML = `<div class="gate panel"><span class="section-label">My account</span><h1>Sign in to see <em>your account</em></h1><p>Your preferences, credits and order history live here.</p><div class="hero-cta"><button class="btn btn-primary" data-auth="signup" type="button">Create free account</button><button class="btn btn-ghost" data-auth="signin" type="button">Sign in</button></div></div>`;
      return;
    }
    const bal = B.balance(), t = B.tier(), paid = t !== 'free', p = u.prefs, name = PLAN.short(t);
    const hrs = Math.max(0, Math.round((bal.resetsAt - Date.now()) / 3600000));
    const tb = B.turbo ? B.turbo() : { active: false };
    const planLine = (paid ? (u.plan.renewsAt ? `${name} until ${fmtDate(u.plan.renewsAt)}` : `${name} · yours for life`) : (u.plan.lapsedAt ? 'Your paid plan has ended' : 'Free plan')) + (tb.active ? ` · <span class="turbo-text">Turbo</span> until ${fmtDate(tb.until)}` : '');
    host.innerHTML = `
      <div class="acct-head"><div class="avatar big ${t}">${esc(u.name.charAt(0).toUpperCase())}</div><div><span class="section-label">My account</span><h1>${esc(u.name)}</h1><p>${esc(u.email)} · member since ${fmtDate(u.createdAt)}</p></div></div>
      <div class="acct-grid">
        <article class="panel"><div class="panel-head"><h3>Plan &amp; credits</h3><span class="plan-tag ${t}">${t === 'free' ? 'Free' : PLAN.label(t)}</span></div>
          <p class="panel-note">${planLine}</p>
          <div class="credit-stats">
            <div><span>Daily credits</span><b>${bal.daily}<small> / ${bal.dailyAllowance}</small></b><em>resets in ~${hrs} h</em></div>
            <div><span>Purchased credits</span><b>${bal.purchased}</b><em>never expire</em></div>
            <div><span>Recommendation Pass</span><b>${bal.recPass ? 'Active' : '—'}</b><em>${bal.recPass ? 'free recommendations until ' + fmtDate(bal.recPassUntil) : 'unlimited recommendations for 1 month'}</em></div>
          </div>
          <p class="panel-note">${t === 'ultra' ? '<strong>Recommendations are unlimited on Ultra</strong> and never use credits.' : `Each recommendation uses <strong>${B.costPerRecommendation()} credit${B.costPerRecommendation() > 1 ? 's' : ''}</strong>${t === 'lite' ? ' on Lite' : t === 'basic' ? ' on Basic' : ''} and shows ${B.resultsLimit() === Infinity ? 'every match' : 'your top ' + B.resultsLimit()}.`}</p>
          <div class="hero-cta" style="margin-top:1rem"><a class="btn btn-primary btn-sm" href="${root}shop.html">Get credits</a>${paid ? (t === 'basic' ? `<a class="btn btn-outline btn-sm" href="${root}lite.html">Upgrade to Lite</a>` : '') : `<a class="btn btn-outline btn-sm" href="${root}basic.html">Get Basic · ${inr(CFG.basic.product.price)}</a>`}<a class="btn btn-ghost btn-sm" href="${CFG.turbo.onlineUrl}" target="_blank" rel="noopener">ProMouser Online ↗</a>${t !== 'ultra' ? `<a class="btn btn-ghost btn-sm" href="${root}ultra.html">See Ultra</a>` : ''}</div>
        </article>
        ${progressPanel()}${t === 'ultra' ? appearancePanel() : ''}
        <article class="panel"><h3>Your preferences</h3><p class="panel-note">Used as the starting point for recommendations.</p>
          <form id="prefsForm" class="pref-form">
            <fieldset><legend>Games</legend><div class="chip-set">${GAMES.map(g => `<label class="pick"><input type="checkbox" name="games" value="${g.id}" ${p.games.includes(g.id) ? 'checked' : ''}><span>${g.label}</span></label>`).join('')}</div></fieldset>
            <fieldset><legend>Weight</legend><div class="chip-set">${WEIGHTS.map(w => `<label class="pick"><input type="radio" name="weight" value="${w.id}" ${p.weight === w.id ? 'checked' : ''}><span>${w.label}</span></label>`).join('')}</div></fieldset>
            <fieldset><legend>Grip</legend><div class="chip-set">${GRIPS.map(g => `<label class="pick"><input type="radio" name="grip" value="${g.id}" ${(p.grip || 'any') === g.id ? 'checked' : ''}><span>${g.label}</span></label>`).join('')}</div></fieldset>
            <fieldset><legend>Connection</legend><div class="chip-set">${CONNS.map(g => `<label class="pick"><input type="radio" name="connection" value="${g.id}" ${(p.connection || 'any') === g.id ? 'checked' : ''}><span>${g.label}</span></label>`).join('')}</div></fieldset>
            <button class="btn btn-primary btn-sm" type="submit">Save preferences</button>
          </form></article>
        <article class="panel"><h3>Recent recommendations</h3>${u.history.length ? `<ul class="hist">${u.history.slice(0, 6).map(h => `<li><b>${esc(h.top || '—')}</b><small>${fmtDate(h.at)} · ${esc(h.summary || '')}</small></li>`).join('')}</ul>` : '<p class="panel-note">Nothing yet. <a href="' + root + 'recommendations.html" style="color:var(--accent)">Generate your first shortlist</a>.</p>'}</article>
        <article class="panel"><h3>Orders</h3>${u.orders.length ? `<ul class="hist">${u.orders.slice(0, 8).map(o => `<li><b>${esc(o.items.map(i => i.name).join(', '))}</b><small>${o.id} · ${fmtDate(o.createdAt)} · ${inr(o.total)} · demo payment</small></li>`).join('')}</ul>` : '<p class="panel-note">No orders yet.</p>'}</article>
      </div>
      <div class="acct-foot"><button class="btn btn-ghost btn-sm" type="button" data-auth="signout">Sign out</button><button class="btn btn-outline btn-sm danger" type="button" id="delAcct">Delete account</button></div>`;
    $('#prefsForm', host).addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target);
      await B.updateProfile({ prefs: { games: f.getAll('games'), weight: f.get('weight') || 'any', grip: f.get('grip') || 'any', connection: f.get('connection') || 'any' } });
      toast('Preferences saved.');
    });
    if (window.PMUI) PMUI.paint();
    $('#delAcct', host).addEventListener('click', async () => { if (confirm(B.mode === 'supabase' ? 'Delete your account and all its data? This cannot be undone.' : 'Delete your account and all its data from this browser? This cannot be undone.')) { await B.deleteAccount(); toast('Account deleted.'); renderAccountPage(host); renderSlot(); } });
  }

  /* ---------- boot ---------- */
  renderSlot();
  B.on(() => { renderSlot(); });
  const page = $('[data-account-page]'); if (page) { renderAccountPage(page); B.on(() => { if (!document.querySelector('.pm-overlay.open')) renderAccountPage(page); }); }
  // brand-new visitors who signed up but skipped onboarding are asked again once
  // first visit after sign-up (also after the email-confirmation link, when the user arrives a moment after page load)
  function maybeOnboard() {
    const u0 = B.getUser(); let asked = false; try { asked = !!sessionStorage.getItem('pm_onb_asked'); } catch (e) { /* noop */ }
    if (!u0 || u0.onboarded || asked || document.querySelector('.pm-overlay.open')) return;
    try { sessionStorage.setItem('pm_onb_asked', '1'); } catch (e) { /* noop */ } setTimeout(() => { const cur = B.getUser(); if (cur && !cur.onboarded && !document.querySelector('.pm-overlay.open')) startOnboarding(cur); }, 900);
  }
  maybeOnboard(); B.on(maybeOnboard);
})();
