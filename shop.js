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

  const CATALOG = [CFG.basic.product, CFG.lite.product, CFG.ultra.product, CFG.turbo.product, ...CFG.passes, ...CFG.packs];
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
      <ul class="order-lines">${lines.map(l => `<li><div><b>${esc(l.name)}</b><small>${l.type === 'credits' ? 'Never expire · used after your daily credits' : l.type === 'pass' ? (l.perk || 'Unlimited recommendations for 30 days') : l.type === 'ultra' ? 'Purple theme, unlimited recommendations, profiles, watchlist, sens converter, export, assistant memory · 30 days' : 'Blue theme, advanced preferences, unlimited results · 30 days'}</small></div><span>${inr(l.price)}</span></li>`).join('')}</ul>
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
    const PL = { basic: 'Basic', lite: 'Lite', ultra: 'Ultra' }, plan = (order.items.find(i => PL[i.type]) || {}).type, gotLite = !!plan, u = B.getUser(), bal = B.balance();
    body.innerHTML = `<div class="pay-result"><div class="done-badge" aria-hidden="true">✓</div><h2>Unlocked <em>with your code</em></h2>
      <div class="receipt"><div><span>Order</span><b>${order.id}</b></div><div><span>Date</span><b>${fmtDate(order.createdAt)}</b></div><div><span>Total</span><b>${inr(order.total)}</b></div></div>
      <ul class="order-lines compact">${order.items.map(i => `<li><div><b>${esc(i.name)}</b><small>${i.type === 'credits' ? `+${i.credits} credits added` : i.type === 'pass' ? `Free recommendations until ${fmtDate(bal.recPassUntil)}` : i.type === 'turbo' ? `Turbo active on ProMouser Online until ${fmtDate(B.turbo().until)}` : `${PL[i.type]} unlocked for life${i.type === 'ultra' ? ` · plus Turbo until ${fmtDate(B.turbo().until)}` : ''}`}</small></div><span>${inr(i.price)}</span></li>`).join('')}</ul>
      ${gotLite ? `<p class="lite-welcome${plan === 'ultra' ? ' ultra' : ''}">Welcome to <strong>ProMouser ${PL[plan]}</strong>. We’re switching you to the ${({ basic: 'dark blue', lite: 'blue', ultra: 'purple' })[plan]} theme now.</p>` : ''}
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

  /* ---------- UI revamps (bought with credits) ---------- */
  function revampCards() {
    const RV = window.PMRevamp, list = CFG.revamps || [], mine = B.revampsOwned ? B.revampsOwned() : [], cur = RV ? RV.current() : (document.documentElement.dataset.revamp || ''), bal = B.balance();
    if (RV) list.forEach(r => RV.fonts(r.id));
    const prev = (id, h) => `<div class="rv-prev ${id}" aria-hidden="true"><b class="rp-h">${h}</b><span class="rp-p">Look up any mouse, test your aim, track your progress.</span><span class="rp-row"><span class="rp-b">Start</span><span class="rp-b">Compare</span></span></div>`;
    const card = r => { const own = mine.includes(r.id), on = cur === r.id;
      return `<article class="rv-card${on ? ' on' : ''}">${prev(r.id, r.id === 'brutal' ? 'Every <span>test</span>' : 'Every mouse test')}<h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p>
        <div class="rv-foot">${own ? `<span class="rv-owned">✓ Owned</span>${on ? '<span class="rv-cost"></span><button class="btn btn-ghost btn-sm" type="button" disabled>In use</button>' : `<span class="rv-cost"></span><button class="btn btn-primary btn-sm" type="button" data-rv-use="${r.id}">Use</button>`}`
          : `<span class="rv-cost">${r.credits} <small>credits</small></span><button class="btn btn-ghost btn-sm" type="button" data-rv-preview="${r.id}">${on ? 'Previewing' : 'Preview'}</button><button class="btn btn-primary btn-sm" type="button" data-rv-buy="${r.id}">Buy</button>`}</div></article>`; };
    const classic = `<article class="rv-card${!cur ? ' on' : ''}">${prev('default', 'Every mouse test')}<h3>Classic</h3><p>ProMouser’s normal look, with your plan’s colours and any colour you’ve picked.</p>
      <div class="rv-foot"><span class="rv-owned">✓ Free</span><span class="rv-cost"></span>${!cur ? '<button class="btn btn-ghost btn-sm" type="button" disabled>In use</button>' : '<button class="btn btn-primary btn-sm" type="button" data-rv-use="default">Use</button>'}</div></article>`;
    return `${bal ? `<p class="panel-note" style="margin:-8px 0 18px">You have <b>${bal.total}</b> credits.</p>` : ''}<div class="rv-grid">${classic}${list.map(card).join('')}</div>`;
  }

  /* ---------- shop page ---------- */
  const host = $('[data-shop]');
  if (host) {
    const render = () => {
      const u = B.getUser(), t = B.tier(), R = window.PM_PLAN.RANK, bal = B.balance(), worth = CFG.lite.product.price + CFG.turbo.product.price * 12;
      const perCredit = p => (p.price / p.credits).toFixed(2);
      host.innerHTML = `
        <div class="shop-heroes">
          <article class="shop-hero shop-basic theme-basic reveal visible" id="basic">
            <span class="plan-tag basic">One-time · yours forever</span>
            <h3>ProMouser <em>Basic</em></h3>
            <p class="shop-price"><b>${inr(CFG.basic.product.price)}</b> once</p>
            <ul class="tick-list"><li><strong>${CFG.basic.dailyCredits} credits a day</strong> instead of ${CFG.free.dailyCredits}</li><li>Your top ${CFG.basic.resultsLimit} matches instead of ${CFG.free.resultsLimit}</li><li>A match breakdown on every pick</li><li>Check any mouse against your answers</li><li>History of your last ${CFG.basic.historyLimit} runs</li><li>Dark blue &amp; black theme</li></ul>
            ${R[t] >= 1 ? `<p class="panel-note">${t === 'basic' ? 'You own Basic for life. ✓' : 'Your plan already includes everything in Basic.'}</p>` : `<div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.basic.product.id}" type="button">Get Basic</button><a class="btn btn-ghost" href="${root}basic">What’s included</a></div>`}
          </article>
          <article class="shop-hero theme-lite reveal visible" id="lite">
            <span class="plan-tag lite">One-time · yours forever</span>
            <h3>ProMouser <em>Lite</em></h3>
            <p class="shop-price"><b>${inr(CFG.lite.product.price)}</b> once</p>
            <ul class="tick-list"><li>Everything in Basic</li><li><strong>${CFG.lite.dailyCredits} credits a day</strong>, ${CFG.lite.costPerRecommendation} per run</li><li>Every match, not just the top few</li><li>Advanced preferences: hand length, left-handed, Minecraft 1.8 vs 1.9+, budget, buttons, click style</li><li>Advanced CPS stats and personal bests on every test</li><li>Blue &amp; black theme</li></ul>
            ${R[t] >= 2 ? `<p class="panel-note">${t === 'lite' ? 'You own Lite for life. ✓' : 'You’re on Ultra, which already includes everything in Lite.'}</p>` : `<div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.lite.product.id}" type="button">${t === 'basic' ? 'Upgrade to Lite' : 'Get Lite'}</button><a class="btn btn-ghost" href="${root}lite">What’s included</a></div>`}
          </article>
          <article class="shop-hero theme-ultra shop-best reveal visible" id="ultra">
            <span class="ultra-badge">Best value · One-time</span>
            <h3>ProMouser <em>Ultra</em></h3>
            <p class="shop-price"><b>${inr(CFG.ultra.product.price)}</b> once <small class="was">${inr(worth)} value</small></p>
            <ul class="tick-list"><li>Everything in Lite</li><li><strong>Unlimited recommendations</strong>, never uses credits</li><li><strong>Statistics for every test</strong>: trend charts, consistency, percentile, CSV export</li><li><strong>1 year of ProMouser Turbo</strong> (${inr(CFG.turbo.product.price * 12)} on its own)</li><li>Saved profiles, price watchlist, sensitivity converter, shortlist export, assistant memory</li><li>${CFG.ultra.dailyCredits} credits a day · purple &amp; black theme</li></ul>
            ${t === 'ultra' ? `<p class="panel-note">You own Ultra for life. ✓</p>`
              : `<div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.ultra.product.id}" type="button">${R[t] ? 'Upgrade to Ultra' : 'Get Ultra'}</button><a class="btn btn-ghost" href="${root}ultra">What’s included</a></div>`}
          </article>
          <article class="shop-hero theme-turbo reveal visible" id="turbo">
            <span class="plan-tag turbo">Monthly · ProMouser Online</span>
            <h3>ProMouser <em>Turbo</em></h3>
            <p class="shop-price"><b>${inr(CFG.turbo.product.price)}</b> / month</p>
            <ul class="tick-list"><li>A gradient username on ProMouser Online</li><li>Custom gradients on your profile page</li><li>The Turbo battle pass track</li><li>An exclusive 3D digital mouse</li></ul>
            ${B.turbo().active ? `<p class="panel-note">Turbo is active until ${fmtDate(B.turbo().until)}.</p>` : ''}
            <div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.turbo.product.id}" type="button">${B.turbo().active ? 'Add a month' : 'Get Turbo'}</button><a class="btn btn-ghost" href="${CFG.turbo.onlineUrl}" target="_blank" rel="noopener">Open ProMouser Online</a></div>
          </article>
          <article class="shop-hero reveal visible">
            <span class="plan-tag">Pass</span>
            <h3>Recommendation <em>Pass</em></h3>
            <p class="shop-price"><b>${inr(CFG.pass.price)}</b> / ${CFG.pass.days} days</p>
            <ul class="tick-list"><li>Unlimited recommendations for a month</li><li>Recommendations stop using credits, so your credits stay free for everything else</li><li>Works on Free, Basic and Lite (Ultra already includes it)</li></ul>
            <p class="field-note">Passes cover one feature each. Credits work everywhere.</p>
            ${bal && bal.recPass ? `<p class="panel-note">Active until ${fmtDate(bal.recPassUntil)}.</p>` : ''}
            <div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.pass.id}" type="button">${bal && bal.recPass ? 'Extend by a month' : 'Get the pass'}</button></div>
          </article>
        </div>
        <div class="section-header" id="revamps" style="margin-top:64px"><span class="section-label">UI revamps</span><h2>Change <em>everything</em></h2><p>A whole new look for ProMouser: fonts, layout, shapes, colours and effects, on every page. Bought with credits, yours for good, switch any time. Cosmetic only: nothing else changes.</p></div>
        ${revampCards()}
        <div class="section-header" style="margin-top:56px"><span class="section-label">Credit packs</span><h2>Top up when you <em>need</em> it</h2><p>Bought credits never expire and are used after your free daily credits.</p></div>
        <div class="pack-grid">${CFG.packs.map(p => `<article class="pack reveal visible">${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}<b class="pack-n">${p.credits}</b><span>credits</span><p class="pack-price">${inr(p.price)}</p><small>₹${perCredit(p)} per credit</small><button class="btn btn-outline btn-sm" data-buy="${p.id}" type="button">Buy</button></article>`).join('')}</div>
        <div class="panel info-panel reveal visible"><h3>How credits work</h3>
          <ul class="tick-list">
            <li><strong>${CFG.free.dailyCredits} free credits every day</strong> on a free account (${CFG.basic.dailyCredits} on Basic, ${CFG.lite.dailyCredits} on Lite, ${CFG.ultra.dailyCredits} on Ultra). They reset each day and don’t stack.</li>
            <li>A free recommendation uses <strong>${CFG.free.costPerRecommendation} credit</strong> and shows your top ${CFG.free.resultsLimit} matches (top ${CFG.basic.resultsLimit} on Basic). On Lite it uses <strong>${CFG.lite.costPerRecommendation} credits</strong> and shows every match. On Ultra recommendations are free.</li>
            <li>Daily credits are spent first, then credits you’ve bought.</li>
            <li><strong>Credits work for everything</strong> on ProMouser. <strong>Passes cover one feature</strong>: the Recommendation Pass makes recommendations free for ${CFG.pass.days} days without touching your credits.</li>
          </ul>
          <p class="demo-note"><strong>Unlock codes only:</strong> ProMouser isn’t taking payments yet. Everything in the shop unlocks with a valid code at checkout. Prices show what each item will cost.</p>
        </div>
        <div class="faq reveal visible"><h3>Questions</h3>
          <details><summary>Are Basic, Lite and Ultra subscriptions?</summary><p>No. Basic (${inr(CFG.basic.product.price)}), Lite (${inr(CFG.lite.product.price)}) and Ultra (${inr(CFG.ultra.product.price)}) are one-time payments: pay once and keep them forever. Turbo (${inr(CFG.turbo.product.price)} a month) is the only monthly plan.</p></details>
          <details><summary>Why is Ultra the best deal?</summary><p>Ultra is everything in Lite plus a full year of Turbo, which alone costs ${inr(CFG.turbo.product.price * 12)}. That’s ${inr(CFG.lite.product.price + CFG.turbo.product.price * 12)} of value for ${inr(CFG.ultra.product.price)}, and it adds unlimited recommendations and statistics for every test on top.</p></details>
          <details><summary>I already have a plan. Can I upgrade?</summary><p>Yes. Buying a higher plan switches you to it for life. Buying a lower plan never downgrades you.</p></details>
          <details><summary>What is ProMouser Turbo?</summary><p>Turbo is for <a href="${CFG.turbo.onlineUrl}" target="_blank" rel="noopener">ProMouser Online</a>, our social site with games, friends and lobbies. It uses the same account. Ultra includes a whole year.</p></details>
          <details><summary>How do I buy something?</summary><p>Right now, only with an unlock code: press the button on what you want and enter your code at checkout. Payments will come later.</p></details>
        </div>`;
    };
    // while the checkout is open, wait for it to close, then show the new state (credits, plans, revamps)
    let waiting = 0; const later = () => { if (document.querySelector('.pm-overlay.open')) { clearTimeout(waiting); waiting = setTimeout(later, 300); } else { const y = scrollY; render(); scrollTo(0, y); } };
    render(); B.on(later);
    document.addEventListener('pm:revamp', () => { const y = scrollY; render(); scrollTo(0, y); });
    document.addEventListener('DOMContentLoaded', render);
  }
})();
