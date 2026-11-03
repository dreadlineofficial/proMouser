/* =====================================================================
   ProMouser — Elite Dashboard (elite)
   A personal overview for signed-in users: credits, activity, latest
   shortlist per game, most-recommended mice, setup and orders.
   Reads only from PMBackend (account data) and PM (mouse data).
   ===================================================================== */
(function () {
  'use strict';
  const host = document.querySelector('[data-elite-dashboard]');
  const B = window.PMBackend, A = window.PMAccount, PM = window.PM, O = window.PM_OPTIONS;
  if (!host || !B || !A || !PM) return;
  const intro = document.querySelector('[data-elite-intro]');
  const root = document.documentElement.dataset.root || '';
  const { esc, inr, cap } = PM;
  const $ = (s, r = host) => r.querySelector(s);
  const $$ = (s, r = host) => Array.from(r.querySelectorAll(s));
  const DAY = 86400000;
  const icon = n => (window.PMIcon ? window.PMIcon(n) : '');
  const GAME = id => (O && O.GAMES.find(g => g.id === id)) || { id, label: cap(id), icon: 'spark' };
  const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

  function gate() {
    host.innerHTML = `<div class="gate panel elite-gate"><span class="section-label">Elite Dashboard</span><h2>Your mouse <em>command centre</em></h2>
      <p>Sign in to see your credits, recommendation activity, latest shortlists and the mice that keep coming up for you, all in one place.</p>
      <div class="hero-cta"><button class="btn btn-primary" data-auth="signup" type="button">Create free account</button><button class="btn btn-ghost" data-auth="signin" type="button">Sign in</button></div></div>`;
    if (intro) intro.hidden = false;
  }

  function render() {
    const u = B.getUser();
    if (!u) return gate();
    const bal = B.balance(), t = B.tier(), lite = B.has('advanced'), ultra = t === 'ultra', now = Date.now(), hist = Array.isArray(u.history) ? u.history.filter(Boolean) : [];
    const PLANS = window.PM_PLAN;
    const activeTheme = PLANS.themes.some(theme => theme.id === (u.prefs && u.prefs.theme)) ? u.prefs.theme : 'plan';
    const week = hist.filter(h => now - h.at < 7 * DAY).length;
    const used = Math.max(0, bal.dailyAllowance - bal.daily);
    const planLine = t !== 'free' ? `${PLANS.short(t)} · ${u.plan.renewsAt ? Math.max(1, Math.ceil((u.plan.renewsAt - now) / DAY)) + ' days left' : 'lifetime'}` : 'Free plan';
    const passLine = bal.recPass ? `Recommendation Pass · ${Math.max(1, Math.ceil((bal.recPassUntil - now) / DAY))} days left` : null;
    const first = esc(u.name.split(' ')[0]);
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    /* activity: runs per day, last 7 days */
    const days = [...Array(7)].map((_, i) => { const t = now - (6 - i) * DAY; return { key: dayKey(t), label: new Date(t).toLocaleDateString('en-IN', { weekday: 'short' }), n: 0, cr: 0 }; });
    hist.forEach(h => { const d = days.find(x => x.key === dayKey(h.at)); if (d) { d.n++; d.cr += h.cost || 0; } });
    const maxN = Math.max(1, ...days.map(d => d.n));

    /* latest shortlist per game */
    const last = hist[0];
    const lastPanels = last
      ? (Array.isArray(last.panels) && last.panels.length ? last.panels : [{ game: (last.prefs && last.prefs.games && last.prefs.games[0]) || 'fps', topIds: last.topIds || [] }])
        .filter(Boolean).map(pn => ({ ...pn, topIds: Array.isArray(pn.topIds) ? pn.topIds : [] }))
      : [];

    /* most recommended: how often each mouse appeared in your shortlists */
    const counts = {};
    hist.forEach(h => (Array.isArray(h.panels) && h.panels.length ? h.panels.filter(Boolean) : [{ topIds: h.topIds || [] }]).forEach(pn => {
      (Array.isArray(pn.topIds) ? pn.topIds : []).forEach((id, i) => { counts[id] = (counts[id] || 0) + (3 - Math.min(i, 2)); });
    }));
    const fav = Object.entries(counts).filter(([id]) => PM.byId[id]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const favMax = fav.length ? fav[0][1] : 1;

    const p = u.prefs || {}, lp = last && last.prefs ? last.prefs : {};
    const setup = [
      ...(Array.isArray(p.games) ? p.games : []).map(g => GAME(g).label), p.weight && p.weight !== 'any' ? cap(p.weight) + ' weight' : null,
      p.grip && p.grip !== 'any' ? cap(p.grip) + ' grip' : null, p.connection && p.connection !== 'any' ? cap(p.connection) : null
    ].filter(Boolean);
    const adv = [
      lp.handSize && lp.handSize !== 'any' ? cap(lp.handSize) + ' hands' : null, lp.mcVersion && lp.mcVersion !== 'any' ? 'Minecraft ' + lp.mcVersion : null,
      lp.budgetMax ? 'Up to ' + inr(lp.budgetMax) : null, lp.minButtons ? lp.minButtons + '+ buttons' : null, lp.clickStyle && lp.clickStyle !== 'any' ? cap(lp.clickStyle) + ' clicking' : null
    ].filter(Boolean);
    const inBudget = lp.budgetMax ? PM.MICE.filter(m => m.price && m.price <= lp.budgetMax) : [];

    host.innerHTML = `
      <div class="elite-hero glow-border">
        <div><span class="section-label">Elite Dashboard</span><h1>Welcome back, <em>${first}</em></h1><p>${date} · <span class="plan-tag ${t}">${t === 'free' ? 'Free plan' : PLANS.label(t)}</span>${passLine ? ` <span class="plan-tag">${passLine}</span>` : ''}</p></div>
        <div class="hero-cta"><a class="btn btn-primary" href="${root}recommendations">New recommendation</a><a class="btn btn-ghost" href="${root}shop">Get credits</a><a class="btn btn-ghost" href="${root}mice/compare">Compare mice</a></div>
      </div>

      ${lite ? `<article class="panel dash-theme-settings">
        <div class="panel-head"><div><span class="section-label">Make it yours</span><h3>Site theme</h3></div><span class="plan-tag ${t}">${PLANS.short(t)}</span></div>
        <p class="panel-note">Choose the colors you want across ProMouser. This preference follows your account.</p>
        <form id="dashboardThemeForm">
          <fieldset class="theme-options">
            <legend class="sr-only">Choose a site theme</legend>
            ${PLANS.themes.map(theme => `<label class="theme-option">
              <input type="radio" name="theme" value="${theme.id}" ${activeTheme === theme.id ? 'checked' : ''}>
              <span class="theme-option-preview ${theme.id} ${theme.id === 'plan' ? t : ''}" aria-hidden="true"></span>
              <span class="theme-option-copy"><b>${theme.label}</b><small>${theme.description}</small></span>
            </label>`).join('')}
          </fieldset>
          <button class="btn btn-primary btn-sm" type="submit">Save theme</button>
        </form>
      </article>` : ''}

      <div class="dash-kpis">
        <div class="dk"><span class="dk-ico">${icon('Value')}</span><small>Credits available</small><b data-to="${bal.total}">0</b><em>${bal.daily} daily + ${bal.purchased} bought${bal.recPass ? ' · pass active' : ''}</em></div>
        <div class="dk"><span class="dk-ico">${icon('AI')}</span><small>Recommendations run</small><b data-to="${hist.length}">0</b><em>last ${Math.min(hist.length, 12)} kept</em></div>
        <div class="dk"><span class="dk-ico">${icon('Time')}</span><small>This week</small><b data-to="${week}">0</b><em>runs in the last 7 days</em></div>
        <div class="dk"><span class="dk-ico">${icon('Elite')}</span><small>Plan</small><b class="dk-text">${PLANS.short(t)}</b><em>${planLine}</em></div>
      </div>

      <div class="dash-grid">
        <article class="panel dash-credits"><h3>Credits today</h3>
          <div class="dc-wrap"><div class="ring" style="--size:150px" id="dashRing"></div>
            <ul class="dc-list"><li><span>Daily left</span><b>${bal.daily} / ${bal.dailyAllowance}</b></li><li><span>Bought</span><b>${bal.purchased}</b></li><li><span>Per run</span><b>${ultra ? '0 (Ultra)' : bal.recPass ? '0 (pass)' : B.costPerRecommendation()}</b></li><li><span>Resets in</span><b>~${Math.max(1, Math.round((bal.resetsAt - now) / 3600000))} h</b></li></ul></div>
        </article>
        <article class="panel dash-activity"><div class="panel-head"><h3>Activity</h3><span class="chip">${week} this week</span></div>
          <div class="bars7">${days.map(d => `<div class="b7" title="${d.n} run${d.n === 1 ? '' : 's'}${d.cr ? ', ' + d.cr + ' credits' : ''}"><b>${d.n || ''}</b><i data-h="${(d.n / maxN) * 100}"></i><span>${d.label}</span></div>`).join('')}</div>
          ${hist.length ? '' : '<p class="panel-note">No runs yet. Your activity will show up here.</p>'}
        </article>

        <article class="panel dash-latest"><div class="panel-head"><h3>Latest shortlist</h3>${last ? `<small class="muted-note">${A.fmtDate(last.at)}</small>` : ''}</div>
          ${lastPanels.length ? `<div class="dl-panels">${lastPanels.map(pn => `<div class="dl-panel"><div class="dl-head"><span class="gp-ico">${icon(GAME(pn.game).icon)}</span><b>${esc(GAME(pn.game).label)}</b></div>
            <ol>${pn.topIds.filter(id => PM.byId[id]).map((id, i) => { const m = PM.byId[id]; return `<li><a href="${root}${m.page}"><span class="dl-n">${i + 1}</span><img src="${PM.IMG(m, 480)}" alt="" width="40" height="48" loading="lazy"><span><b>${esc(m.short)}</b><small>${m.weight} g · ${m.price ? inr(m.price) : 'price n/a'}</small></span></a></li>`; }).join('')}</ol></div>`).join('')}</div>`
            : `<div class="dash-empty"><p>Run your first recommendation to see your shortlist here.</p><a class="btn btn-primary btn-sm" href="${root}recommendations">Get recommendations</a></div>`}
        </article>
        <article class="panel dash-fav"><h3>Keeps coming up for you</h3><p class="panel-note">Mice that appear most often in your shortlists.</p>
          ${fav.length ? `<ul class="fav-list">${fav.map(([id, c]) => { const m = PM.byId[id]; return `<li><a href="${root}${m.page}"><img src="${PM.IMG(m, 480)}" alt="" width="44" height="52" loading="lazy"><span><b>${esc(m.name)}</b><span class="fav-bar"><i data-w="${(c / favMax) * 100}"></i></span></span></a></li>`; }).join('')}</ul>` : '<p class="panel-note">Nothing yet.</p>'}
        </article>

        <article class="panel dash-setup"><div class="panel-head"><h3>Your setup</h3><a class="btn btn-ghost btn-sm" href="${root}account">Edit</a></div>
          <div class="chips">${setup.length ? setup.map(s => `<span class="fit-chip on">${esc(s)}</span>`).join('') : '<span class="muted-note">No preferences saved yet.</span>'}</div>
          <div class="adv-box${lite ? '' : ' locked'}"><div class="adv-head"><h4>Advanced profile</h4><span class="plan-tag ${ultra ? 'ultra' : 'lite'}">${ultra ? 'Ultra' : 'Lite'}</span></div>
            ${lite ? (adv.length ? `<div class="chips">${adv.map(s => `<span class="fit-chip on">${esc(s)}</span>`).join('')}</div>` : '<p class="panel-note">Set hand size, Minecraft version, budget and more on your next recommendation run.</p>')
              : `<p class="panel-note">Hand size, Minecraft version, budget, buttons and click style. <a href="${root}lite">Unlock with Lite</a></p>`}
          </div>
        </article>
        <article class="panel dash-budget"><h3>Budget check</h3>
          ${lite && lp.budgetMax ? `<p class="panel-note">${inBudget.length} of ${PM.MICE.length} mice are within your ${inr(lp.budgetMax)} budget.</p><ul class="mini-list">${inBudget.sort((a, b) => a.price - b.price).slice(0, 4).map(m => `<li><a href="${root}${m.page}">${esc(m.short)}</a><b>${inr(m.price)}</b></li>`).join('')}</ul>`
            : `<p class="panel-note">${lite ? 'Set a budget on your next recommendation run to see which mice fit it.' : 'Lite members set a budget and see which mice fit it here.'}</p>${lite ? '' : `<a class="btn btn-outline btn-sm" href="${root}lite">See Lite</a>`}`}
        </article>
        <article class="panel dash-watch"><div class="panel-head"><h3>Price watchlist</h3><span class="plan-tag ultra">Ultra</span></div>
          ${ultra ? (() => {
            const w = (Array.isArray(u.extras && u.extras.watchlist) ? u.extras.watchlist : []).filter(x => x && PM.byId[x.id]);
            if (!w.length) return `<p class="panel-note">Tap <b>Watch price</b> on any mouse page or shortlist to track it here.</p><a class="btn btn-outline btn-sm" href="${root}mice#catalog">Browse mice</a>`;
            return `<ul class="watch-list">${w.map(x => { const m = PM.byId[x.id], d = m.price && x.price ? m.price - x.price : null;
              const cls = d == null || d === 0 ? 'same' : d < 0 ? 'down' : 'up', txt = d == null ? 'no price' : d === 0 ? 'no change' : (d < 0 ? '▼ ' : '▲ ') + inr(Math.abs(d));
              return `<li><a href="${root}${m.page}"><img src="${PM.IMG(m, 480)}" alt="" loading="lazy"><span><b>${esc(m.name)}</b><small>${m.price ? inr(m.price) : 'price n/a'} · saved ${A.fmtDate(x.at)}</small></span><em class="price-delta ${cls}">${txt}</em></a></li>`; }).join('')}</ul>
              <p class="panel-note" style="margin-top:.6rem">Changes compare today’s listed price with the price when you saved it.</p>`;
          })() : `<div class="ultra-lock"><span class="ultra-badge">Ultra</span><h4>Track mouse prices</h4><p>Star mice you’re eyeing and see if they get cheaper, right here.</p><a class="btn btn-primary btn-sm" href="${root}ultra">See Ultra</a></div>`}
        </article>
        <article class="panel dash-orders"><div class="panel-head"><h3>Recent orders</h3><a class="btn btn-ghost btn-sm" href="${root}account">All</a></div>
          ${Array.isArray(u.orders) && u.orders.length ? `<ul class="mini-list">${u.orders.slice(0, 3).map(o => `<li><span>${esc((Array.isArray(o.items) ? o.items : []).map(i => i.name).join(', '))}<small>${A.fmtDate(o.createdAt)}</small></span><b>${inr(o.total)}</b></li>`).join('')}</ul>` : '<p class="panel-note">No orders yet.</p>'}
        </article>
      </div>`;
    if (intro) intro.hidden = true;
    const themeForm = $('#dashboardThemeForm');
    if (themeForm) themeForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('button[type="submit"]', themeForm);
      button.disabled = true;
      try {
        const selected = new FormData(themeForm).get('theme');
        await B.updateProfile({ prefs: { theme: selected } });
        if (window.PMUI) PMUI.set('accent', 'default');   // a saved site theme replaces any custom colour from the account page
        A.toast('Theme saved. Your choice will be used across the site.');
      } catch (error) {
        A.toast(error.message, 'err');
        button.disabled = false;
      }
    });
    animate(bal, used);
  }

  function renderSafely() {
    try {
      render();
    } catch (error) {
      console.error('Elite Dashboard failed to render:', error);
      if (intro) intro.hidden = false;
      const panel = document.createElement('div');
      panel.className = 'gate panel elite-gate';
      const title = document.createElement('h2');
      title.textContent = 'Your dashboard could not load';
      const message = document.createElement('p');
      message.textContent = error && error.message ? `Details: ${error.message}` : 'Refresh the page to try again.';
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.type = 'button';
      button.textContent = 'Refresh dashboard';
      button.addEventListener('click', () => location.reload());
      panel.append(title, message, button);
      host.replaceChildren(panel);
    }
  }

  function animate(bal, used) {
    $$('[data-to]').forEach(el => { const to = +el.dataset.to; if (to < 0) return; PM.tween(1200, t => { el.textContent = Math.round(to * t); }); });
    // credits ring: share of today's allowance still available
    const ring = $('#dashRing'), C = 2 * Math.PI * 52, pct = bal.dailyAllowance ? bal.daily / bal.dailyAllowance : 0;
    ring.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="dashGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient></defs><circle class="rg-bg" cx="60" cy="60" r="52"/><circle class="rg-fg" cx="60" cy="60" r="52" stroke="url(#dashGrad)" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div class="rg-num"><b>${bal.daily}</b><small>left today</small></div>`;
    ring.setAttribute('role', 'img'); ring.setAttribute('aria-label', `${bal.daily} of ${bal.dailyAllowance} daily credits left, ${used} used`);
    const fg = ring.querySelector('.rg-fg'); PM.tween(1300, t => fg.setAttribute('stroke-dashoffset', C * (1 - pct * t)));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.b7 i').forEach((i, k) => { i.style.transitionDelay = k * 60 + 'ms'; i.style.height = Math.max(+i.dataset.h, 3) + '%'; });
      $$('.fav-bar i').forEach(i => { i.style.width = i.dataset.w + '%'; });
    }));
  }

  // wait until every script (including the icon helper in script.js) has run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderSafely); else setTimeout(renderSafely);
  B.on(() => { if (!document.querySelector('.pm-overlay.open')) renderSafely(); });
})();
