/* =====================================================================
   ProMouser — shop + checkout
   Shop page rendering and [data-buy] buttons anywhere on the site.
   ProMouser doesn't take payments yet: a purchase only goes through with
   an unlock code, which the server checks (redeem_order in schema.sql).
   ===================================================================== */
(function () {
  'use strict';
  const B = window.PMBackend, A = window.PMAccount;
  if (!B || !A) return;
  const CFG = B.CONFIG, root = document.documentElement.dataset.root || '';
  const { esc, inr, fmtDate } = A;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = ms => new Promise(r => setTimeout(r, ms));

  const CATALOG = [CFG.basic.product, CFG.lite.product, CFG.ultra.product, CFG.mono.product, CFG.turbo.product, ...CFG.passes, ...CFG.packs];
  const byId = id => CATALOG.find(p => p.id === id);


  function openCheckout(items) {
    A.requireAuth(() => start(items));
  }
  function start(items) {
    const lines = items.map(p => ({ ...p, qty: 1 }));
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const body = A.openModal('', { wide: true });
    const summary = () => `
      <div class="auth-head"><span class="section-label">Checkout</span><h2>Review your <em>order</em></h2></div>
      <ul class="order-lines">${lines.map(l => `<li><div><b>${esc(l.name)}</b><small>${l.type === 'credits' ? 'Never expire · used after your daily credits' : l.type === 'pass' ? (l.perk || 'Unlimited recommendations for 30 days') : l.type === 'mono' ? 'Everything unlimited, Mono theme, skill trends, skill report, Turbo included · 1 year' : l.type === 'ultra' ? 'Purple theme, unlimited recommendations, profiles, watchlist, sens converter, export, assistant memory · 30 days' : 'Blue theme, advanced preferences, unlimited results · 30 days'}</small></div><span>${inr(l.price)}</span></li>`).join('')}</ul>
      <div class="order-total"><span>Total</span><b>${inr(total)}</b></div>
      <form class="code-box" id="coForm" autocomplete="off"><label for="coCode"><b>Unlock code</b><small>ProMouser isn’t taking payments yet. Purchases unlock with a valid code.</small></label>
        <input id="coCode" name="code" type="text" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="Enter your code" maxlength="40" required>
        <p class="code-err" id="coErr" role="alert" hidden></p>
        <div class="onb-actions"><button class="btn btn-ghost" type="button" id="coCancel">Cancel</button><button class="btn btn-primary" type="submit" id="coPay">Unlock</button></div></form>`;
    body.innerHTML = summary();
    $('#coCancel', body).addEventListener('click', () => A.closeModal());
    $('#coCode', body).focus();
    $('#coForm', body).addEventListener('submit', async e => {
      e.preventDefault();
      const code = $('#coCode', body).value.trim(), err = $('#coErr', body), btn = $('#coPay', body);
      if (!code) return;
      const order = { id: B.newOrderId(), createdAt: Date.now(), items: lines.map(l => ({ id: l.id, type: l.type, feature: l.feature, name: l.name, credits: l.credits, price: l.price, qty: l.qty })), total, method: 'code', status: 'paid', code };
      btn.disabled = true; btn.textContent = 'Checking…'; err.hidden = true;
      try {
        await B.applyOrder(order);
        success(body, order);
      } catch (ex) {
        btn.disabled = false; btn.textContent = 'Unlock';
        err.textContent = ex.message || 'Something went wrong. Try again.'; err.hidden = false;
        $('#coCode', body).select();
      }
    });
  }
  function success(body, order) {
    const PL = { basic: 'Basic', lite: 'Lite', ultra: 'Ultra', mono: 'Mono' }, plan = (order.items.find(i => PL[i.type]) || {}).type, gotLite = !!plan, u = B.getUser(), bal = B.balance();
    body.innerHTML = `<div class="pay-result"><div class="done-badge" aria-hidden="true">✓</div><h2>Unlocked <em>with your code</em></h2>
      <div class="receipt"><div><span>Order</span><b>${order.id}</b></div><div><span>Date</span><b>${fmtDate(order.createdAt)}</b></div><div><span>Total</span><b>${inr(order.total)}</b></div></div>
      <ul class="order-lines compact">${order.items.map(i => `<li><div><b>${esc(i.name)}</b><small>${i.type === 'credits' ? `+${i.credits} credits added` : i.type === 'pass' ? `Free recommendations until ${fmtDate(bal.recPassUntil)}` : i.type === 'turbo' ? `Turbo active on ProMouser Online until ${fmtDate(B.turbo().until)}` : i.type === 'mono' ? `Mono active until ${fmtDate((u.plan || {}).renewsAt)} · Turbo included` : `${PL[i.type]} unlocked for life${i.type === 'ultra' ? ` · plus Turbo until ${fmtDate(B.turbo().until)}` : ''}`}</small></div><span>${inr(i.price)}</span></li>`).join('')}</ul>
      ${gotLite ? `<p class="lite-welcome${plan === 'ultra' || plan === 'mono' ? ' ' + plan : ''}">Welcome to <strong>ProMouser ${PL[plan]}</strong>. We’re switching you to the ${({ basic: 'dark blue', lite: 'blue', ultra: 'purple', mono: 'black and white' })[plan]} theme now.</p>` : ''}
      <div class="onb-actions center"><a class="btn btn-primary" href="${root}recommendations" id="coGo">Get recommendations</a><button class="btn btn-ghost" type="button" id="coDone">Done</button></div></div>`;
    const done = () => { A.closeModal(true); if (gotLite) location.reload(); };
    $('#coDone', body).addEventListener('click', done);
    $('#coGo', body).addEventListener('click', e => { if (gotLite) { e.preventDefault(); A.closeModal(true); location.href = root + 'recommendations'; } });
    if (gotLite && !reduce) setTimeout(() => { if ($('.lite-welcome')) $('.lite-welcome').classList.add('pop'); }, 100);
  }
  window.PMCheckout = { open: openCheckout };

  /* any element with data-buy="product-id" starts checkout */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    e.preventDefault();
    const p = byId(b.dataset.buy); if (p) openCheckout([p]);
  });

  /* ---------- shop page ---------- */
  const host = $('[data-shop]');
  if (host) {
    const render = () => {
      const u = B.getUser(), t = B.tier(), R = window.PM_PLAN.RANK, bal = B.balance(), worth = CFG.lite.product.price + CFG.turbo.product.price * 12;
      const perCredit = p => (p.price / p.credits).toFixed(2);
      const mono = t === 'mono', monoUntil = mono && u && u.plan ? u.plan.renewsAt : null, lifeOwned = mono ? (u.plan.base || 'free') : t;
      const owns = need => R[lifeOwned] >= R[need];
      const plan = (id, name, theme, price, items, cta) => `<article class="shop-plan theme-${theme} reveal visible" id="${id}"><h3>ProMouser <em>${name}</em></h3><p class="shop-price"><b>${inr(price)}</b> once</p>
          <ul class="tick-list">${items.map(x => `<li>${x}</li>`).join('')}</ul>${cta}</article>`;
      const lifeCta = (id, name, need) => owns(need) ? `<p class="panel-note">${lifeOwned === need ? `You own ${name} for life. ✓` : `Your plan includes everything in ${name}.`}</p>`
        : `<div class="hero-cta"><button class="btn btn-primary btn-sm" data-buy="${CFG[need].product.id}" type="button">${R[lifeOwned] ? `Upgrade to ${name}` : `Get ${name}`}</button><a class="btn btn-ghost btn-sm" href="${root}${need}">Details</a></div>`;
      host.innerHTML = `
        <article class="shop-hero shop-mono theme-mono reveal visible" id="mono">
          <div class="sm-left"><span class="mono-badge">New · Yearly</span>
            <h3>ProMouser <em>Mono</em></h3>
            <p class="shop-price"><b>${inr(CFG.mono.product.price)}</b> / year</p>
            <p class="sm-pitch">Everything, unlimited. The top plan for people who use ProMouser every day.</p>
            ${mono ? `<p class="panel-note">Mono is active until <b>${fmtDate(monoUntil)}</b>. Adding a year extends it.</p>` : ''}
            <div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.mono.product.id}" type="button">${mono ? 'Add a year' : 'Get Mono'}</button></div></div>
          <ul class="tick-list sm-list"><li><strong>Unlimited everything</strong>: recommendations, ProMouser AI, and nothing ever costs credits</li><li>Everything in Ultra: statistics for every test, profiles, watchlist, sensitivity converter, every colour</li>
            <li><strong>ProMouser Turbo included</strong> for as long as Mono lasts</li><li><strong>Skill trends</strong>: your skill score week by week</li><li><strong>Skill report</strong>: a one-page PDF of your skills, records and setup</li><li>The black-and-white <strong>Mono theme</strong> and a Mono badge</li>
            <li>Keeps any lifetime plan you own: when a year ends you’re back on it</li></ul>
        </article>
        <div class="section-header" style="margin-top:56px"><span class="section-label">Lifetime plans</span><h2>Pay once, <em>keep it</em></h2></div>
        <div class="shop-plans">
          ${plan('basic', 'Basic', 'basic', CFG.basic.product.price, [`<strong>${CFG.basic.dailyCredits} credits a day</strong>`, `Your top ${CFG.basic.resultsLimit} matches`, 'Match breakdown and “check any mouse”', 'Dark blue theme'], lifeCta('basic', 'Basic', 'basic'))}
          ${plan('lite', 'Lite', 'lite', CFG.lite.product.price, ['Everything in Basic', `<strong>${CFG.lite.dailyCredits} credits a day</strong> and every match`, 'Advanced preferences and CPS stats', 'Blue theme'], lifeCta('lite', 'Lite', 'lite'))}
          ${plan('ultra', 'Ultra', 'ultra', CFG.ultra.product.price, ['Everything in Lite', '<strong>Unlimited recommendations</strong>', '<strong>Statistics for every test</strong>', `<strong>1 year of Turbo</strong> (${inr(CFG.turbo.product.price * 12)} value)`, 'Profiles, watchlist, sensitivity converter, purple theme'], lifeCta('ultra', 'Ultra', 'ultra'))}
        </div>
        <div class="section-header" style="margin-top:56px"><span class="section-label">Extras</span><h2>Top up <em>anything</em></h2><p>Bought credits never expire and are used after your free daily credits.</p></div>
        <div class="pack-grid">${CFG.packs.map(p => `<article class="pack reveal visible">${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}<b class="pack-n">${p.credits}</b><span>credits</span><p class="pack-price">${inr(p.price)}</p><small>₹${perCredit(p)} per credit</small><button class="btn btn-outline btn-sm" data-buy="${p.id}" type="button">Buy</button></article>`).join('')}</div>
        <div class="shop-extras">
          <article class="shop-extra theme-turbo reveal visible" id="turbo"><div><span class="plan-tag turbo">ProMouser Online</span><h3>Turbo <small>${inr(CFG.turbo.product.price)} / month</small></h3><p>Gradient username, profile gradients, the Turbo pass track and an exclusive 3D mouse.${B.turbo().active ? ` Active until ${fmtDate(B.turbo().until)}.` : ''}</p></div>
            <button class="btn btn-ghost btn-sm" data-buy="${CFG.turbo.product.id}" type="button">${B.turbo().active ? 'Add a month' : 'Get Turbo'}</button></article>
          <article class="shop-extra reveal visible" id="pass"><div><span class="plan-tag">Pass</span><h3>Recommendation Pass <small>${inr(CFG.pass.price)} / ${CFG.pass.days} days</small></h3><p>Unlimited recommendations for a month without spending credits.${bal && bal.recPass ? ` Active until ${fmtDate(bal.recPassUntil)}.` : ''}</p></div>
            <button class="btn btn-ghost btn-sm" data-buy="${CFG.pass.id}" type="button">${bal && bal.recPass ? 'Extend' : 'Get the pass'}</button></article>
        </div>
        <p class="demo-note shop-codes"><strong>Unlock codes only:</strong> ProMouser isn’t taking payments yet. Everything here unlocks with a valid code at checkout.</p>
        <div class="faq reveal visible"><h3>Questions</h3>
          <details><summary>What’s the difference between Mono and Ultra?</summary><p>Ultra (${inr(CFG.ultra.product.price)}, once) is yours for life. Mono (${inr(CFG.mono.product.price)} a year) has everything in Ultra, makes everything unlimited so nothing ever costs credits, includes Turbo while it lasts, and adds skill trends, the skill report and the Mono theme. If you own a lifetime plan, you go back to it when a Mono year ends.</p></details>
          <details><summary>How do credits work?</summary><p>You get ${CFG.free.dailyCredits} free credits a day (${CFG.basic.dailyCredits} on Basic, ${CFG.lite.dailyCredits} on Lite, ${CFG.ultra.dailyCredits} on Ultra). They reset daily. A recommendation costs ${CFG.free.costPerRecommendation} credit (${CFG.lite.costPerRecommendation} on Lite, free on Ultra and Mono). Daily credits are used first, then bought ones, which never expire. On Mono nothing costs credits.</p></details>
          <details><summary>I already have a plan. Can I upgrade?</summary><p>Yes. A higher lifetime plan replaces yours for life, and a lower one never downgrades you. Mono sits on top of any lifetime plan.</p></details>
          <details><summary>What is ProMouser Turbo?</summary><p>Turbo is for <a href="${CFG.turbo.onlineUrl}" target="_blank" rel="noopener">ProMouser Online</a>, our social site with games, friends and lobbies, on the same account. Ultra includes a year of it and Mono includes it for as long as Mono lasts.</p></details>
          <details><summary>How do I buy something?</summary><p>Right now, only with an unlock code: press the button on what you want and enter your code at checkout. Payments will come later.</p></details>
        </div>`;
    };
    // while the checkout is open, wait for it to close, then show the new state (credits and plans)
    let waiting = 0; const later = () => { if (document.querySelector('.pm-overlay.open')) { clearTimeout(waiting); waiting = setTimeout(later, 300); } else { const y = scrollY; render(); scrollTo(0, y); } };
    render(); B.on(later);
    document.addEventListener('DOMContentLoaded', render);
  }
})();
