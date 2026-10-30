/* =====================================================================
   ProMouser — shop + DEMO checkout
   Shop page rendering, [data-buy] buttons anywhere on the site, and a
   fake-but-working checkout (no money moves, no card details are asked
   for). Replace PMPayments.pay() with Razorpay when it is ready.
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

  const CATALOG = [CFG.lite.product, CFG.ultra.product, ...CFG.passes, ...CFG.packs];
  const byId = id => CATALOG.find(p => p.id === id);

  /* ---------------------------------------------------------------
     PAYMENTS — swap this object for Razorpay.
       1. Your server creates an order:  razorpay.orders.create({ amount: total * 100, currency: 'INR', receipt })
       2. The browser opens Razorpay Checkout:
            new Razorpay({ key: 'rzp_live_…', order_id, amount, currency: 'INR', name: 'ProMouser',
                           handler: resp => fetch('/api/verify', { method: 'POST', body: JSON.stringify(resp) }) }).open();
       3. Your server verifies the signature (or a webhook fires) and ONLY THEN grants credits / Lite.
     Never grant credits from the browser in production.
     --------------------------------------------------------------- */
  const PMPayments = window.PMPayments = {
    provider: 'demo',
    async pay(order, { simulateFailure = false } = {}) {
      await delay(reduce ? 400 : 700);   // "contacting gateway"
      await delay(reduce ? 400 : 1300);  // "confirming"
      if (simulateFailure) { const e = new Error('The (simulated) payment was declined. You have not been charged.'); e.code = 'DECLINED'; throw e; }
      return { paymentId: 'demo_pay_' + Math.random().toString(36).slice(2, 10), status: 'paid' };
    }
  };

  const METHODS = [['upi', 'UPI', 'Pay with any UPI app'], ['card', 'Card', 'Credit or debit card'], ['netbanking', 'Netbanking', 'All major banks'], ['wallet', 'Wallet', 'Paytm, PhonePe and more']];

  function openCheckout(items) {
    A.requireAuth(() => start(items));
  }
  function start(items) {
    const lines = items.map(p => ({ ...p, qty: 1 }));
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const body = A.openModal('', { wide: true });
    const summary = () => `
      <div class="auth-head"><span class="section-label">Checkout</span><h2>Review your <em>order</em></h2></div>
      <div class="demo-banner"><strong>Demo checkout.</strong> No payment is taken and nothing is charged. Razorpay will replace this step.</div>
      <ul class="order-lines">${lines.map(l => `<li><div><b>${esc(l.name)}</b><small>${l.type === 'credits' ? 'Never expire · used after your daily credits' : l.type === 'pass' ? (l.perk || 'Unlimited recommendations for 30 days') : l.type === 'ultra' ? 'Purple theme, unlimited recommendations, profiles, watchlist, sens converter, export, assistant memory · 30 days' : 'Blue theme, advanced preferences, unlimited results · 30 days'}</small></div><span>${inr(l.price)}</span></li>`).join('')}</ul>
      <div class="order-total"><span>Total</span><b>${inr(total)}</b></div>
      <fieldset class="pay-methods"><legend>Payment method</legend>${METHODS.map(([v, l, s], i) => `<label class="pay-m"><input type="radio" name="method" value="${v}" ${i === 0 ? 'checked' : ''}><span><b>${l}</b><small>${s}</small></span></label>`).join('')}</fieldset>
      <label class="fail-toggle"><input type="checkbox" id="simFail"> Simulate a failed payment (to test the error path)</label>
      <div class="onb-actions"><button class="btn btn-ghost" type="button" id="coCancel">Cancel</button><button class="btn btn-primary" type="button" id="coPay">Pay ${inr(total)} (demo)</button></div>`;
    body.innerHTML = summary();
    $('#coCancel', body).addEventListener('click', () => A.closeModal());
    $('#coPay', body).addEventListener('click', async () => {
      const method = ($('input[name=method]:checked', body) || {}).value || 'upi', fail = $('#simFail', body).checked;
      const order = { id: B.newOrderId(), createdAt: Date.now(), items: lines.map(l => ({ id: l.id, type: l.type, feature: l.feature, name: l.name, credits: l.credits, price: l.price, qty: l.qty })), total, method: 'demo-' + method, status: 'paid' };
      body.innerHTML = `<div class="pay-processing"><div class="spinner" aria-hidden="true"></div><h3 id="payMsg">Contacting payment gateway…</h3><p>Please don’t close this window.</p></div>`;
      const msg = $('#payMsg', body); setTimeout(() => { if (msg.isConnected) msg.textContent = 'Confirming your payment…'; }, reduce ? 300 : 800);
      try {
        const res = await PMPayments.pay(order, { simulateFailure: fail });
        order.paymentId = res.paymentId;
        await B.applyOrder(order);
        success(body, order);
      } catch (ex) {
        body.innerHTML = `<div class="pay-result fail"><div class="done-badge bad" aria-hidden="true">✕</div><h2>Payment <em>failed</em></h2><p>${esc(ex.message)}</p>
          <div class="onb-actions center"><button class="btn btn-primary" type="button" id="coRetry">Try again</button><button class="btn btn-ghost" type="button" id="coClose">Close</button></div></div>`;
        $('#coRetry', body).addEventListener('click', () => { A.closeModal(true); start(items); });
        $('#coClose', body).addEventListener('click', () => A.closeModal());
      }
    });
  }
  function success(body, order) {
    const plan = (order.items.find(i => i.type === 'lite' || i.type === 'ultra') || {}).type, gotLite = !!plan, u = B.getUser(), bal = B.balance();
    body.innerHTML = `<div class="pay-result"><div class="done-badge" aria-hidden="true">✓</div><h2>Payment <em>successful</em></h2><p class="demo-note" style="margin-top:0">Demo order — no money was taken.</p>
      <div class="receipt"><div><span>Order</span><b>${order.id}</b></div><div><span>Date</span><b>${fmtDate(order.createdAt)}</b></div><div><span>Total</span><b>${inr(order.total)}</b></div></div>
      <ul class="order-lines compact">${order.items.map(i => `<li><div><b>${esc(i.name)}</b><small>${i.type === 'credits' ? `+${i.credits} credits added` : i.type === 'pass' ? `Free recommendations until ${fmtDate(bal.recPassUntil)}` : `${plan === 'ultra' ? 'Ultra' : 'Lite'} active until ${fmtDate(u.plan.renewsAt)}`}</small></div><span>${inr(i.price)}</span></li>`).join('')}</ul>
      ${gotLite ? `<p class="lite-welcome${plan === 'ultra' ? ' ultra' : ''}">Welcome to <strong>ProMouser ${plan === 'ultra' ? 'Ultra' : 'Lite'}</strong>. We’re switching you to the ${plan === 'ultra' ? 'purple' : 'blue'} theme now.</p>` : ''}
      <div class="onb-actions center"><a class="btn btn-primary" href="${root}recommendations.html" id="coGo">Get recommendations</a><button class="btn btn-ghost" type="button" id="coDone">Done</button></div></div>`;
    const done = () => { A.closeModal(true); if (gotLite) location.reload(); };
    $('#coDone', body).addEventListener('click', done);
    $('#coGo', body).addEventListener('click', e => { if (gotLite) { e.preventDefault(); A.closeModal(true); location.href = root + 'recommendations.html'; } });
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
      const u = B.getUser(), t = B.tier(), lite = t === 'lite', ultra = t === 'ultra', bal = B.balance();
      const perCredit = p => (p.price / p.credits).toFixed(2);
      host.innerHTML = `
        <div class="shop-heroes">
          <article class="shop-hero theme-lite reveal visible" id="lite">
            <span class="plan-tag lite">Subscription</span>
            <h3>ProMouser <em>Lite</em></h3>
            <p class="shop-price"><b>${inr(CFG.lite.product.price)}</b> / month</p>
            <ul class="tick-list"><li>Blue &amp; black theme</li><li>Unlimited results (not just the top ${CFG.free.resultsLimit})</li><li>Advanced preferences: hand size or exact hand length, left-handed, Minecraft 1.8 vs 1.9+, budget, buttons, customisation, click style</li><li>${CFG.lite.dailyCredits} free credits a day, with each run using ${CFG.lite.costPerRecommendation}</li></ul>
            ${ultra ? `<p class="panel-note">You’re on Ultra, which already includes everything in Lite.</p>` : lite ? `<p class="panel-note">You’re on Lite until ${fmtDate(u.plan.renewsAt)}.</p><div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.lite.product.id}" type="button">Add another month</button></div>` : `<div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.lite.product.id}" type="button">Get Lite</button><a class="btn btn-ghost" href="${root}lite.html">What’s included</a></div>`}
          </article>
          <article class="shop-hero theme-ultra reveal visible" id="ultra">
            <span class="ultra-badge">Best · Subscription</span>
            <h3>ProMouser <em>Ultra</em></h3>
            <p class="shop-price"><b>${inr(CFG.ultra.product.price)}</b> / month</p>
            <ul class="tick-list"><li>Purple &amp; black theme</li><li>Everything in Lite</li><li><strong>Unlimited recommendations</strong>, no credits used</li><li>Saved profiles, price watchlist, sensitivity converter, shortlist export</li><li>An assistant that remembers you</li></ul>
            ${ultra ? `<p class="panel-note">You’re on Ultra until ${fmtDate(u.plan.renewsAt)}.</p><div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.ultra.product.id}" type="button">Add another month</button></div>`
              : `<div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.ultra.product.id}" type="button">${lite ? 'Upgrade to Ultra' : 'Get Ultra'}</button><a class="btn btn-ghost" href="${root}ultra.html">What’s included</a></div>${lite ? '<p class="field-note">Upgrading starts a fresh Ultra month from today.</p>' : ''}`}
          </article>
          <article class="shop-hero reveal visible">
            <span class="plan-tag">Pass</span>
            <h3>Recommendation <em>Pass</em></h3>
            <p class="shop-price"><b>${inr(CFG.pass.price)}</b> / ${CFG.pass.days} days</p>
            <ul class="tick-list"><li>Unlimited recommendations for a month</li><li>Recommendations stop using credits, so your credits stay free for everything else</li><li>Works on Free and Lite (Ultra already includes it)</li></ul>
            <p class="field-note">Passes cover one feature each. Credits work everywhere.</p>
            ${bal && bal.recPass ? `<p class="panel-note">Active until ${fmtDate(bal.recPassUntil)}.</p>` : ''}
            <div class="hero-cta"><button class="btn btn-primary" data-buy="${CFG.pass.id}" type="button">${bal && bal.recPass ? 'Extend by a month' : 'Get the pass'}</button></div>
          </article>
        </div>
        <div class="section-header" style="margin-top:56px"><span class="section-label">Credit packs</span><h2>Top up when you <em>need</em> it</h2><p>Bought credits never expire and are used after your free daily credits.</p></div>
        <div class="pack-grid">${CFG.packs.map(p => `<article class="pack reveal visible">${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}<b class="pack-n">${p.credits}</b><span>credits</span><p class="pack-price">${inr(p.price)}</p><small>₹${perCredit(p)} per credit</small><button class="btn btn-outline btn-sm" data-buy="${p.id}" type="button">Buy</button></article>`).join('')}</div>
        <div class="panel info-panel reveal visible"><h3>How credits work</h3>
          <ul class="tick-list">
            <li><strong>${CFG.free.dailyCredits} free credits every day</strong> on a free account (${CFG.lite.dailyCredits} on Lite). They reset each day and don’t stack.</li>
            <li>A free recommendation uses <strong>${CFG.free.costPerRecommendation} credit</strong> and shows your top ${CFG.free.resultsLimit} matches. On Lite it uses <strong>${CFG.lite.costPerRecommendation} credits</strong> and shows every match with a full breakdown.</li>
            <li>Daily credits are spent first, then credits you’ve bought.</li>
            <li><strong>Credits work for everything</strong> on ProMouser. <strong>Passes cover one feature</strong>: the Recommendation Pass makes recommendations free for ${CFG.pass.days} days without touching your credits.</li>
          </ul>
          <p class="demo-note"><strong>Demo checkout:</strong> every purchase here is simulated so the full flow can be tested. No payment is taken. Prices are placeholders until Razorpay is connected.</p>
        </div>
        <div class="faq reveal visible"><h3>Questions</h3>
          <details><summary>Does Lite renew automatically?</summary><p>Not in the demo. Lite lasts 30 days from purchase; you can add another month at any time from this page or your account.</p></details>
          <details><summary>What happens to my credits if Lite ends?</summary><p>Your purchased credits stay. Your daily allowance returns to ${CFG.free.dailyCredits}, results go back to the top ${CFG.free.resultsLimit}, and the theme returns to red and black.</p></details>
          <details><summary>Can I get a refund?</summary><p>Refund terms will be set when real payments go live.</p></details>
        </div>`;
    };
    render(); B.on(() => { if (!document.querySelector('.pm-overlay.open')) render(); });
  }
})();
