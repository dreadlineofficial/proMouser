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
  const avatarCrop = u => {
    const crop = u && u.prefs && u.prefs.avatarCrop || {};
    const bounded = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(+value) ? +value : fallback));
    return { x: bounded(crop.x, 50, 0, 100), y: bounded(crop.y, 50, 0, 100), zoom: bounded(crop.zoom, 100, 100, 200) / 100 };
  };
  const avatarStyle = u => {
    const crop = avatarCrop(u);
    return `--avatar-x:${crop.x}%;--avatar-y:${crop.y}%;--avatar-zoom:${crop.zoom}`;
  };
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
        ${B.mode === 'supabase' ? `<div class="auth-provider-options"><span>Or continue with</span><button class="btn btn-ghost btn-block auth-provider-btn" type="button" data-auth-provider="google"><span class="provider-mark google" aria-hidden="true">G</span>Google</button><button class="btn btn-ghost btn-block auth-provider-btn" type="button" data-auth-provider="discord"><span class="provider-mark discord" aria-hidden="true">D</span>Discord</button></div>` : ''}
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
      $$('[data-auth-provider]', body).forEach(providerButton => providerButton.addEventListener('click', async () => {
        providerButton.disabled = true;
        try { await B.signInWithProvider(providerButton.dataset.authProvider); }
        catch (error) { err.textContent = error.message; err.hidden = false; providerButton.disabled = false; }
      }));
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
          <div class="onb-actions center"><a class="btn btn-primary" href="${root}recommendations" id="onbGo">Get my recommendations</a><button class="btn btn-ghost" type="button" id="onbClose">Explore the site</button></div>`;
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
    const avatar = u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="">` : init;
    slot.innerHTML = `
      <a class="credit-pill${bal.recPass ? ' has-pass' : ''}" href="${root}shop" title="Credits: ${bal.daily} daily + ${bal.purchased} purchased${bal.recPass ? ' · Recommendation Pass active' : ''}">${COIN}<b>${bal.total}</b><small>credits</small>${bal.recPass ? '<span class="pass-dot" aria-label="Recommendation Pass active">PASS</span>' : ''}</a>
      <div class="user-menu">
        <button class="avatar ${t}" style="${avatarStyle(u)}" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">${avatar}</button>
        <div class="user-dd" role="menu">
          <div class="user-dd-head"><b>${esc(u.name)}</b><small>${esc(u.email)}</small><span class="plan-tag ${t}">${t === 'free' ? 'Free plan' : PLAN.label(t)}</span></div>
          <a role="menuitem" href="${root}elite">Elite Dashboard</a>
          <a role="menuitem" href="${root}account">My account</a>
          <a role="menuitem" href="${root}recommendations">Recommendations</a>
          <a role="menuitem" href="${root}daily">Daily &amp; Mousle</a>
          <a role="menuitem" href="${root}setup">My setup</a>
          <a role="menuitem" href="${root}shop">Shop &amp; credits</a>
          ${t === 'ultra' ? `<a role="menuitem" href="${root}sens">Sensitivity converter</a>` : `<a role="menuitem" href="${root}ultra" class="upsell">Go Ultra</a>`}${t === 'free' || t === 'basic' ? `<a role="menuitem" href="${root}lite" class="upsell">Upgrade to Lite</a>` : ''}
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
      <div class="onb-actions"><button class="btn btn-ghost" type="button" data-close>Not now</button><a class="btn btn-primary" href="${root}ultra">See Ultra · ${inr(CFG.ultra.product.price)} once</a></div>`);
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
      ${B.tier() === 'ultra' ? '' : `<div class="ui-row"><span>Colour · unlock more by levelling up</span><div class="ui-swatches">${swatch(BASE_ACCENTS[0])}${C.REWARDS.map(r => swatch([r.id, r.name, r.c[0], r.c[1]], L >= r.level ? 0 : r.level)).join('')}</div></div>`}
      <div class="hero-cta" style="margin-top:1rem"><a class="btn btn-primary btn-sm" href="${root}daily">Open Daily</a><a class="btn btn-ghost btn-sm" href="${root}setup">My setup</a><a class="btn btn-ghost btn-sm" href="${root}my-stats">My stats</a><a class="btn btn-ghost btn-sm" href="${root}daily#settings">Pop-up settings</a></div></article>`;
  }
  const BASE_ACCENTS = [['default', 'Default', '#a855f7', '#7c3aed'], ['classic', 'Red', '#ff2a47', '#c4001f'], ['lite', 'Blue', '#4aa3ff', '#1f5fe6'], ['navy', 'Navy', '#3b63e3', '#142a80']];
  const ACCENTS = () => [...BASE_ACCENTS, ...((window.PMCore && PMCore.REWARDS) || []).map(r => [r.id, r.name, r.c[0], r.c[1]])];
  const swatch = ([v, l, a2, b2], locked) => `<button type="button" class="ui-sw" ${locked ? `disabled title="${l}: level ${locked}"` : `data-ui-set="accent:${v}" title="${l}"`} aria-label="${l}${locked ? ', locked' : ''}" style="background:linear-gradient(135deg, ${a2}, ${b2})"></button>`;
  function appearancePanel() {
    const seg = (k, opts) => `<div class="ui-seg">${opts.map(([v, l]) => `<button type="button" data-ui-set="${k}:${v}">${l}</button>`).join('')}</div>`;
    return `<article class="panel ui-panel"><h3>Appearance</h3><p class="panel-note">Make ProMouser yours. Changes apply straight away and follow your account.</p>
      <div class="ui-row"><span>Colour</span><div class="ui-swatches">${ACCENTS().map(x => swatch(x)).join('')}<label class="ui-sw ui-custom" title="Custom colour"><input type="color" data-ui-custom value="#a855f7" aria-label="Custom colour"><span aria-hidden="true">+</span></label></div></div>
      <div class="ui-row"><span>Background</span>${seg('bg', [['default', 'Grid'], ['plain', 'Plain'], ['aurora', 'Aurora']])}</div>
      <div class="ui-row"><span>Glow effects</span>${seg('glow', [['default', 'On'], ['off', 'Off']])}</div>
      <div class="ui-row"><span>Density</span>${seg('density', [['default', 'Comfortable'], ['compact', 'Compact']])}</div></article>`;
  }

  /* ---------- account page ---------- */
  function compressAvatar(file) {
    if (!file) return Promise.reject(new Error('Choose a profile photo.'));
    if (file.type === 'image/gif') {
      if (!B.has('animatedAvatar')) return Promise.reject(new Error('Animated profile GIFs are available with ProMouser Ultra.'));
      if (file.size > 1024 * 1024) return Promise.reject(new Error('Animated profile GIFs must be 1 MB or smaller.'));
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file), image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(url);
          if (image.naturalWidth * image.naturalHeight > 20000000) reject(new Error('This image is too large to process. Please choose a smaller GIF.'));
          else resolve(file);
        };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
        image.src = url;
      });
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return Promise.reject(new Error('Choose a JPG, PNG, WebP, or GIF image.'));
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('Profile photos must be 8 MB or smaller.'));
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), image = new Image();
      image.onload = async () => {
        try {
          if (image.naturalWidth * image.naturalHeight > 20000000) throw new Error('This image is too large to process. Please choose a smaller photo.');
          const toJpeg = (width, height, quality) => new Promise((res, rej) => {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) { rej(new Error('Could not process this image.')); return; }
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob(blob => blob ? res(blob) : rej(new Error('Could not process this image.')), 'image/jpeg', quality);
          });
          const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
          let width = Math.round(image.naturalWidth * scale), height = Math.round(image.naturalHeight * scale);
          let blob = await toJpeg(width, height, .82);
          if (blob.size > 500 * 1024) {
            const fallbackScale = Math.min(1, 384 / Math.max(image.naturalWidth, image.naturalHeight));
            width = Math.max(1, Math.round(image.naturalWidth * fallbackScale));
            height = Math.max(1, Math.round(image.naturalHeight * fallbackScale));
            blob = await toJpeg(width, height, .68);
          }
          if (blob.size > 500 * 1024) throw new Error('This image is too detailed to optimize. Please choose another photo.');
          resolve(blob);
        } catch (error) { reject(error); }
        finally { URL.revokeObjectURL(url); }
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
      image.src = url;
    });
  }

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
    const avatarMarkup = u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="">` : esc(u.name.trim().charAt(0).toUpperCase() || '?');
    const crop = avatarCrop(u);
    const identities = u.identities || [];
    const providers = [
      { id: 'google', name: 'Google', mark: 'G' },
      { id: 'discord', name: 'Discord', mark: 'D' }
    ];
    const providerCards = providers.map(provider => {
      const identity = identities.find(i => i.provider === provider.id);
      return `<div class="connected-account">
        <span class="provider-mark ${provider.id}" aria-hidden="true">${provider.mark}</span>
        <div class="connected-account-info"><strong>${provider.name}</strong><small>${identity ? esc(identity.label || 'Connected') : 'Not connected'}</small></div>
        ${identity
          ? `<button class="btn btn-outline btn-sm" type="button" data-disconnect="${provider.id}" aria-label="Disconnect ${provider.name}">Disconnect</button>`
          : `<button class="btn btn-ghost btn-sm" type="button" data-connect="${provider.id}" aria-label="Connect ${provider.name}" ${B.mode !== 'supabase' ? 'disabled' : ''}>Connect</button>`}
      </div>`;
    }).join('');
    host.innerHTML = `
      <article class="panel acct-profile">
        <div class="acct-profile-heading">
          <div class="avatar big acct-avatar ${t}" style="${avatarStyle(u)}">${avatarMarkup}</div>
          <div><span class="section-label">My account</span><h1>${esc(u.name)}</h1><p class="acct-handle">@${esc(u.username || 'player')} · member since ${fmtDate(u.createdAt)}</p><p>${esc(u.email)}</p></div>
        </div>
        <div class="acct-profile-editor">
          <div class="avatar-controls">
            <label class="btn btn-ghost btn-sm avatar-upload" for="profileAvatar">Change photo<input id="profileAvatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
            ${u.avatarUrl ? '<button class="btn btn-outline btn-sm" type="button" id="removeAvatar">Remove photo</button>' : ''}
            <small>JPG, PNG, or WebP · up to 8 MB. Animated GIFs are Ultra-only · up to 1 MB.</small>
            ${u.avatarUrl ? `<div class="avatar-crop-controls" id="avatarCropControls">
              <label>Horizontal framing<input type="range" name="x" min="0" max="100" value="${crop.x}"></label>
              <label>Vertical framing<input type="range" name="y" min="0" max="100" value="${crop.y}"></label>
              <label>Zoom<input type="range" name="zoom" min="100" max="200" value="${Math.round(crop.zoom * 100)}"></label>
              <div><button class="btn btn-ghost btn-sm" type="button" id="resetAvatarCrop">Center crop</button><button class="btn btn-outline btn-sm" type="button" id="saveAvatarCrop">Save framing</button></div>
            </div>` : ''}
            <small>Photos are publicly viewable when Supabase is enabled.</small>
          </div>
          <form id="profileForm" class="profile-form">
            <label>Display name<input name="name" autocomplete="name" maxlength="60" required value="${esc(u.name)}"></label>
            <label>Username<input name="username" autocomplete="username" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" required value="${esc(u.username || '')}" aria-describedby="usernameHint"><small id="usernameHint">3–20 letters, numbers, or underscores</small></label>
            <label class="profile-bio">About you<textarea name="bio" maxlength="240" rows="3" placeholder="Tell people a little about yourself">${esc(u.bio || '')}</textarea><small>Up to 240 characters</small></label>
            <label>Location<input name="location" autocomplete="address-level2" maxlength="80" value="${esc(u.location || '')}" placeholder="City, country"></label>
            <label>Website<input name="website" type="url" autocomplete="url" maxlength="300" value="${esc(u.website || '')}" placeholder="https://example.com"></label>
            <button class="btn btn-primary btn-sm" type="submit">Save profile</button>
          </form>
        </div>
      </article>
      <div class="acct-grid">
        <article class="panel connected-panel"><h3>Connected accounts</h3><p class="panel-note">Link a provider to sign in with it. Your ProMouser profile stays the same.</p>
          <div class="connected-list">
            <div class="connected-account"><span class="provider-mark email" aria-hidden="true">@</span><div class="connected-account-info"><strong>Email &amp; password</strong><small>${esc(u.email)} · primary sign-in</small></div><span class="connected-status">Active</span></div>
            ${providerCards}
          </div>
          <p class="panel-note">${B.mode === 'supabase' ? 'Google and Discord must be enabled in the site’s Supabase Authentication settings.' : 'Social sign-in connections are unavailable in demo mode. Profile changes are saved in this browser.'}</p>
        </article>
        <article class="panel"><div class="panel-head"><h3>Plan &amp; credits</h3><span class="plan-tag ${t}">${t === 'free' ? 'Free' : PLAN.label(t)}</span></div>
          <p class="panel-note">${planLine}</p>
          <div class="credit-stats">
            <div><span>Daily credits</span><b>${bal.daily}<small> / ${bal.dailyAllowance}</small></b><em>resets in ~${hrs} h</em></div>
            <div><span>Purchased credits</span><b>${bal.purchased}</b><em>never expire</em></div>
            <div><span>Recommendation Pass</span><b>${bal.recPass ? 'Active' : '—'}</b><em>${bal.recPass ? 'free recommendations until ' + fmtDate(bal.recPassUntil) : 'unlimited recommendations for 1 month'}</em></div>
          </div>
          <p class="panel-note">${t === 'ultra' ? '<strong>Recommendations are unlimited on Ultra</strong> and never use credits.' : `Each recommendation uses <strong>${B.costPerRecommendation()} credit${B.costPerRecommendation() > 1 ? 's' : ''}</strong>${t === 'lite' ? ' on Lite' : t === 'basic' ? ' on Basic' : ''} and shows ${B.resultsLimit() === Infinity ? 'every match' : 'your top ' + B.resultsLimit()}.`}</p>
          <div class="hero-cta" style="margin-top:1rem"><a class="btn btn-primary btn-sm" href="${root}shop">Get credits</a>${paid ? (t === 'basic' ? `<a class="btn btn-outline btn-sm" href="${root}lite">Upgrade to Lite</a>` : '') : `<a class="btn btn-outline btn-sm" href="${root}basic">Get Basic · ${inr(CFG.basic.product.price)}</a>`}<a class="btn btn-ghost btn-sm" href="${CFG.turbo.onlineUrl}" target="_blank" rel="noopener">ProMouser Online ↗</a>${t !== 'ultra' ? `<a class="btn btn-ghost btn-sm" href="${root}ultra">See Ultra</a>` : ''}</div>
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
        <article class="panel"><h3>Recent recommendations</h3>${u.history.length ? `<ul class="hist">${u.history.slice(0, 6).map(h => `<li><b>${esc(h.top || '—')}</b><small>${fmtDate(h.at)} · ${esc(h.summary || '')}</small></li>`).join('')}</ul>` : '<p class="panel-note">Nothing yet. <a href="' + root + 'recommendations" style="color:var(--accent)">Generate your first shortlist</a>.</p>'}</article>
        <article class="panel"><h3>Orders</h3>${u.orders.length ? `<ul class="hist">${u.orders.slice(0, 8).map(o => `<li><b>${esc(o.items.map(i => i.name).join(', '))}</b><small>${o.id} · ${fmtDate(o.createdAt)} · ${inr(o.total)} · demo payment</small></li>`).join('')}</ul>` : '<p class="panel-note">No orders yet.</p>'}</article>
      </div>
      <div class="acct-foot"><button class="btn btn-ghost btn-sm" type="button" data-auth="signout">Sign out</button><button class="btn btn-outline btn-sm danger" type="button" id="delAcct">Delete account</button></div>`;
    $('#profileForm', host).addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.currentTarget, data = new FormData(form), button = $('button[type=submit]', form);
      button.disabled = true;
      try {
        await B.updateProfile({
          name: data.get('name'), username: data.get('username'), bio: data.get('bio'),
          location: data.get('location'), website: data.get('website')
        });
        toast('Profile saved.');
      } catch (error) { toast(error.message, 'err'); button.disabled = false; }
    });
    $('#profileAvatar', host).addEventListener('change', async e => {
      const input = e.currentTarget, file = input.files && input.files[0];
      if (!file) return;
      try {
        const blob = await compressAvatar(file);
        if (B.mode === 'supabase') await B.uploadAvatar(blob);
        else {
          const avatarUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Could not read this image.'));
            reader.readAsDataURL(blob);
          });
          await B.updateProfile({ avatarUrl });
        }
        toast('Profile photo updated.');
      } catch (error) { toast(error.message, 'err'); }
      finally { input.value = ''; }
    });
    const cropControls = $('#avatarCropControls', host);
    if (cropControls) {
      const currentCrop = () => ({
        x: +$('input[name=x]', cropControls).value,
        y: +$('input[name=y]', cropControls).value,
        zoom: +$('input[name=zoom]', cropControls).value
      });
      const applyCrop = () => {
        const crop = currentCrop();
        $$('.avatar', document).forEach(avatar => {
          avatar.style.setProperty('--avatar-x', crop.x + '%');
          avatar.style.setProperty('--avatar-y', crop.y + '%');
          avatar.style.setProperty('--avatar-zoom', crop.zoom / 100);
        });
      };
      cropControls.addEventListener('input', applyCrop);
      $('#resetAvatarCrop', cropControls).addEventListener('click', () => {
        $('input[name=x]', cropControls).value = '50';
        $('input[name=y]', cropControls).value = '50';
        $('input[name=zoom]', cropControls).value = '100';
        applyCrop();
      });
      $('#saveAvatarCrop', cropControls).addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await B.updateProfile({ prefs: { avatarCrop: currentCrop() } });
          toast('Profile photo framing saved.');
        } catch (error) {
          toast(error.message, 'err');
          button.disabled = false;
        }
      });
    }
    const removeAvatar = $('#removeAvatar', host);
    if (removeAvatar) removeAvatar.addEventListener('click', async () => {
      removeAvatar.disabled = true;
      try {
        if (B.mode === 'supabase') await B.removeAvatar();
        else await B.updateProfile({ avatarUrl: null });
        toast('Profile photo removed.');
      } catch (error) { toast(error.message, 'err'); removeAvatar.disabled = false; }
    });
    $$('[data-connect]', host).forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await B.linkIdentity(button.dataset.connect); }
      catch (error) { toast(error.message, 'err'); button.disabled = false; }
    }));
    $$('[data-disconnect]', host).forEach(button => button.addEventListener('click', async () => {
      const provider = button.dataset.disconnect;
      if (!confirm(`Disconnect your ${provider === 'google' ? 'Google' : 'Discord'} account?`)) return;
      button.disabled = true;
      try { await B.unlinkIdentity(provider); toast('Account disconnected.'); }
      catch (error) { toast(error.message, 'err'); button.disabled = false; }
    }));
    $('#prefsForm', host).addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target);
      await B.updateProfile({ prefs: { games: f.getAll('games'), weight: f.get('weight') || 'any', grip: f.get('grip') || 'any', connection: f.get('connection') || 'any' } });
      toast('Preferences saved.');
    });
    if (window.PMUI) PMUI.paint();
    $('#delAcct', host).addEventListener('click', async () => {
      if (!confirm(B.mode === 'supabase' ? 'Delete your account and all its data? This cannot be undone.' : 'Delete your account and all its data from this browser? This cannot be undone.')) return;
      try { await B.deleteAccount(); toast('Account deleted.'); renderAccountPage(host); renderSlot(); }
      catch (error) { toast(error.message, 'err'); }
    });
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
