/* =====================================================================
   ProMouser — Recommendations (credits-based)
   Free: basic preferences, 1 credit per run, top 3 results.
   Lite: advanced preferences, all results, costs more credits per run.
   Ultra: everything in Lite, free runs, saved profiles, export, watchlist stars.
   Credits are spent through PMBackend.spend() — enforce on the server in production.
   ===================================================================== */
(function () {
  'use strict';
  const host = document.querySelector('[data-recs]');
  const B = window.PMBackend, A = window.PMAccount, PM = window.PM, O = window.PM_OPTIONS;
  if (!host || !B || !A || !PM) return;
  const CFG = B.CONFIG, root = document.documentElement.dataset.root || '';
  const { esc, inr, num, cap } = PM;
  const $ = (s, r = host) => r.querySelector(s);
  const $$ = (s, r = host) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.16,1,.3,1)';

  const CUSTOM = [['software', 'Companion software'], ['macros', 'Macros / button binding'], ['weights', 'Adjustable weights'], ['debounce', 'Debounce setting'], ['rgb', 'RGB lighting'], ['haptics', 'Haptic / tunable clicks']];
  let prefs = null, running = false, lastResults = null;

  const defaults = u => ({ games: [...(u.prefs.games || [])], weight: u.prefs.weight || 'any', grip: u.prefs.grip || 'any', connection: u.prefs.connection || 'any',
    handSize: 'any', mcVersion: 'any', budgetMax: null, minButtons: 0, custom: [], clickStyle: 'any', shape: 'any' });

  const chip = (name, val, label, checked, type = 'radio', disabled = false) => `<label class="pick"><input type="${type}" name="${name}" value="${val}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span>${label}</span></label>`;

  function render() {
    const u = B.getUser();
    if (!u) {
      host.innerHTML = `<div class="gate panel"><span class="section-label">Recommendations</span><h2>Sign in to get your <em>personal shortlist</em></h2>
        <p>Free accounts get <strong>${CFG.free.dailyCredits} recommendations a day</strong> (top ${CFG.free.resultsLimit} matches each). Lite unlocks every match and advanced preferences.</p>
        <div class="hero-cta"><button class="btn btn-primary" data-auth="signup" type="button">Create free account</button><button class="btn btn-ghost" data-auth="signin" type="button">Sign in</button></div></div>`;
      return;
    }
    if (!u.onboarded) { host.innerHTML = '<div class="gate panel"><h2>One quick thing first</h2><p>Tell us what you play and how heavy you like your mouse.</p><div class="hero-cta"><button class="btn btn-primary" id="goOnb" type="button">Set my preferences</button></div></div>'; $('#goOnb').addEventListener('click', () => A.startOnboarding(u, render)); return; }
    const lite = B.has('advanced');
    if (!prefs) prefs = defaults(u);
    const p = prefs, mc = p.games.includes('minecraft');
    host.innerHTML = `
      <div class="recs-status" id="recsStatus"></div>
      <div id="profBar"></div>
      <div class="recs-layout">
        <form class="panel recs-form" id="recsForm" novalidate>
          <div class="panel-head"><h3>Your preferences</h3><span class="plan-tag ${B.tier()}">${window.PM_PLAN.short(B.tier())}</span></div>
          <fieldset><legend>What do you play?</legend><div class="chip-set">${O.GAMES.map(g => chip('games', g.id, g.label, p.games.includes(g.id), 'checkbox')).join('')}</div></fieldset>
          <fieldset><legend>Weight</legend><div class="chip-set">${O.WEIGHTS.map(w => chip('weight', w.id, `${w.label} <small>${w.sub}</small>`, p.weight === w.id)).join('')}</div></fieldset>
          <fieldset><legend>Grip</legend><div class="chip-set">${O.GRIPS.map(g => chip('grip', g.id, g.label, p.grip === g.id)).join('')}</div></fieldset>
          <fieldset><legend>Connection</legend><div class="chip-set">${O.CONNS.map(g => chip('connection', g.id, g.label, p.connection === g.id)).join('')}</div></fieldset>

          <div class="adv${lite ? '' : ' locked'}" id="adv">
            <div class="adv-head"><h4>Advanced preferences</h4><span class="plan-tag lite">Lite</span></div>
            ${lite ? '' : `<div class="adv-lock"><div><b>Unlock with ProMouser Lite</b><p>Hand size, Minecraft version, budget, buttons, customisation and more.</p><a class="btn btn-primary btn-sm" href="${root}lite.html">See Lite</a></div></div>`}
            <fieldset class="adv-fields" ${lite ? '' : 'disabled aria-hidden="true"'}>
              <fieldset><legend>Hand size</legend><div class="chip-set">${[['any', 'Any'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([v, l]) => chip('handSize', v, l, p.handSize === v, 'radio', !lite)).join('')}</div>
                <label class="pick inline"><input type="checkbox" id="useLen" ${p.handLength ? 'checked' : ''} ${lite ? '' : 'disabled'}><span>I know my hand length</span></label>
                <div class="len-row" ${p.handLength ? '' : 'hidden'}><input type="range" id="handLen" min="15" max="23" step="0.5" value="${p.handLength || 18.5}" ${lite ? '' : 'disabled'} aria-label="Hand length in centimetres"><output id="lenOut">${p.handLength || 18.5} cm</output></div>
                <p class="field-note">Measure from the crease of your wrist to the tip of your middle finger. We match it against each mouse’s real length.</p></fieldset>
              <fieldset><legend>Hand</legend><div class="chip-set">${chip('lefty', '1', 'I’m left-handed', !!p.lefty, 'checkbox', !lite)}</div></fieldset>
              <fieldset class="mc-only" ${mc ? '' : 'hidden'}><legend>Minecraft version</legend><div class="chip-set">${[['any', 'Any'], ['1.8', '1.8 PvP'], ['1.9+', '1.9 and newer']].map(([v, l]) => chip('mcVersion', v, l, p.mcVersion === v, 'radio', !lite)).join('')}</div>
                <p class="field-note">1.8 combat rewards raw click speed (CPS); 1.9+ rewards comfort, control and timing.</p></fieldset>
              <fieldset><legend>Budget <output id="budgetOut">${p.budgetMax ? 'up to ' + inr(p.budgetMax) : 'no limit'}</output></legend>
                <input type="range" id="budget" min="1000" max="16000" step="500" value="${p.budgetMax || 16000}" ${lite ? '' : 'disabled'}>
                <label class="pick inline"><input type="checkbox" id="noBudget" ${p.budgetMax ? '' : 'checked'} ${lite ? '' : 'disabled'}><span>No limit</span></label></fieldset>
              <fieldset><legend>Number of buttons</legend><div class="chip-set">${[[0, 'Any'], [5, '5+'], [6, '6+'], [8, '8+'], [11, '11+'], [13, '13+ (MMO)']].map(([v, l]) => chip('minButtons', v, l, p.minButtons === v, 'radio', !lite)).join('')}</div></fieldset>
              <fieldset><legend>Customisation</legend><div class="chip-set">${CUSTOM.map(([v, l]) => chip('custom', v, l, p.custom.includes(v), 'checkbox', !lite)).join('')}</div></fieldset>
              <fieldset><legend>Click style</legend><div class="chip-set">${[['any', 'Any'], ['butterfly', 'Butterfly'], ['jitter', 'Jitter'], ['drag', 'Drag']].map(([v, l]) => chip('clickStyle', v, l, p.clickStyle === v, 'radio', !lite)).join('')}</div></fieldset>
              <fieldset><legend>Shape</legend><div class="chip-set">${[['any', 'Any'], ['symmetrical', 'Symmetrical'], ['ergonomic', 'Ergonomic']].map(([v, l]) => chip('shape', v, l, p.shape === v, 'radio', !lite)).join('')}</div></fieldset>
            </fieldset>
          </div>

          <p class="auth-error" id="recsError" role="alert" hidden></p>
          <button class="btn btn-primary btn-block" type="submit" id="genBtn"><span id="genLabel">Generate recommendations</span></button>
          <p class="cost-line" id="costLine"></p>
        </form>
        <div class="recs-out" id="recsOut" aria-live="polite" tabindex="-1">${lastResults ? '' : placeholder()}</div>
      </div>
      <div id="recsHistory"></div>`;
    bind(); updateStatus(); renderHistory(); renderProfiles(); if (lastResults) showResults(lastResults.panels, lastResults.p, false);
  }

  const placeholder = () => `<div class="panel out-empty"><div class="out-ico" aria-hidden="true">${window.PMIcon ? window.PMIcon('chip') : ''}</div><h3>Your shortlist appears here</h3><p>Choose what you play and how you like your mouse, then generate. We match your answers against every mouse on ProMouser.</p></div>`;

  function readForm() {
    const f = new FormData($('#recsForm')), lite = B.has('advanced');
    const p = { games: f.getAll('games'), weight: f.get('weight') || 'any', grip: f.get('grip') || 'any', connection: f.get('connection') || 'any' };
    if (lite) Object.assign(p, { handSize: f.get('handSize') || 'any', handLength: $('#useLen').checked ? +$('#handLen').value : null, lefty: f.has('lefty'), mcVersion: p.games.includes('minecraft') ? (f.get('mcVersion') || 'any') : 'any', budgetMax: $('#noBudget').checked ? null : +$('#budget').value,
      minButtons: +(f.get('minButtons') || 0), custom: f.getAll('custom'), clickStyle: f.get('clickStyle') || 'any', shape: f.get('shape') || 'any' });
    else Object.assign(p, { handSize: 'any', handLength: null, lefty: false, mcVersion: 'any', budgetMax: null, minButtons: 0, custom: [], clickStyle: 'any', shape: 'any' });
    return p;
  }

  function bind() {
    const form = $('#recsForm');
    form.addEventListener('change', e => {
      if (e.target.name === 'games') { const mc = $$('[name=games]:checked').some(x => x.value === 'minecraft'); const el = $('.mc-only'); if (el) el.hidden = !mc; }
      if (e.target.id === 'useLen') $('.len-row').hidden = !e.target.checked;
      if (e.target.id === 'handLen') $('#lenOut').textContent = e.target.value + ' cm';
      if (e.target.id === 'noBudget' || e.target.id === 'budget') { if (e.target.id === 'budget') $('#noBudget').checked = false; $('#budgetOut').textContent = $('#noBudget').checked ? 'no limit' : 'up to ' + inr($('#budget').value); }
      prefs = readForm(); $('#recsError').hidden = true;
    });
    form.addEventListener('submit', e => { e.preventDefault(); generate(); });
  }

  function updateStatus() {
    const u = B.getUser(), el = $('#recsStatus'); if (!u || !el) return;
    const bal = B.balance(), cost = B.costPerRecommendation(), lite = B.has('advanced'), limit = B.resultsLimit(), ultra = B.has('freeRecs'), free = bal.recPass || ultra;
    const hrs = Math.max(1, Math.round((bal.resetsAt - Date.now()) / 3600000));
    el.innerHTML = `
      <div class="rs-item"><span>Credits</span><b>${bal.total}</b><small>${bal.daily} daily · ${bal.purchased} bought</small></div>
      <div class="rs-item"><span>This run costs</span><b>${free ? '0' : cost}</b><small>${ultra ? 'unlimited on Ultra' : bal.recPass ? 'free with your Recommendation Pass' : lite ? 'credits (Lite)' : cost === 1 ? 'credit' : 'credits'}</small></div>
      <div class="rs-item"><span>You’ll see</span><b>${limit === Infinity ? 'All' : 'Top ' + limit}</b><small>${limit === Infinity ? 'matches, with breakdown' : 'matches · Lite shows all'}</small></div>
      <div class="rs-item rs-cta"><small>${bal.recPass ? `Pass active until ${A.fmtDate(bal.recPassUntil)}` : `Daily credits reset in ~${hrs} h`}</small><a class="btn btn-outline btn-sm" href="${root}shop.html">Get more credits</a></div>`;
    const line = $('#costLine'), btn = $('#genBtn'); if (!line) return;
    const short = !free && bal.total < cost;
    line.innerHTML = short ? `You’re out of credits. <a href="${root}shop.html">Get credits or a Recommendation Pass</a> — or come back after your daily reset.` : ultra ? 'Unlimited on Ultra — your credits stay untouched.' : bal.recPass ? 'Free with your Recommendation Pass — your credits stay untouched.' : `Uses ${cost} credit${cost > 1 ? 's' : ''} · ${bal.total - cost} left after`;
    line.classList.toggle('warn', short); btn.disabled = running || short;
  }
  B.on(() => { if (host.isConnected) updateStatus(); });

  /* ---------- generating screen ---------- */
  const stepsFor = (p, lite) => [
    ['Reading your preferences', 1],
    [`Checking ${PM.MICE.length} mice against your ${p.grip !== 'any' ? p.grip + ' grip' : 'grip'}${p.handSize !== 'any' ? ' and ' + p.handSize + ' hands' : ''}`, 1],
    ['Weighing weight, sensor and polling rate', 1],
    p.games.includes('minecraft') ? [p.mcVersion === '1.8' ? 'Scoring click-speed (CPS) potential for 1.8 PvP' : 'Scoring Minecraft control and CPS potential', 1] : null,
    lite && (p.budgetMax || p.minButtons || p.custom.length || p.clickStyle !== 'any' || p.shape !== 'any') ? ['Applying your budget and feature requirements', 1] : null,
    ['Building your shortlist', 1]
  ].filter(Boolean);

  function showGenerating(p, lite) {
    const out = $('#recsOut'), steps = stepsFor(p, lite);
    { const top = out.getBoundingClientRect().top; if (top < 70 || top > innerHeight * .6) out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    out.innerHTML = `<div class="panel gen-screen"><div class="gen-orb" aria-hidden="true"><i></i><i></i><i></i></div><h3>Generating your recommendations…</h3>
      <div class="gen-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></div>
      <ul class="gen-steps">${steps.map(s => `<li><span class="gs-ico"></span>${esc(s[0])}</li>`).join('')}</ul></div>`;
    const total = reduce ? 900 : lite ? 4200 : 3000, per = total / steps.length, lis = $$('.gen-steps li', out), bar = $('.gen-bar span', out);
    return new Promise(res => {
      lis[0] && lis[0].classList.add('active');
      let i = 0; bar.style.transition = `width ${total}ms linear`; requestAnimationFrame(() => { bar.style.width = '96%'; });
      const tick = () => { lis[i].classList.remove('active'); lis[i].classList.add('done'); i++; if (i < lis.length) { lis[i].classList.add('active'); setTimeout(tick, per * (.8 + Math.random() * .4)); } else { bar.style.transition = 'width .3s'; bar.style.width = '100%'; setTimeout(res, 350); } };
      setTimeout(tick, per);
    });
  }

  async function generate() {
    if (running) return;
    const err = $('#recsError'), u = B.getUser(); if (!u) return render();
    const p = prefs = readForm(); err.hidden = true;
    if (!p.games.length) { err.textContent = 'Pick at least one game or use so we know what to optimise for.'; err.hidden = false; return; }
    const lite = B.has('advanced'), cost = B.costPerRecommendation();
    running = true; updateStatus(); $('#genLabel').textContent = 'Generating…';
    let charged = 0;
    try {
      const r = await B.spend(cost, 'recommendation'); charged = r.charged;
    } catch (ex) {
      running = false; $('#genLabel').textContent = 'Generate recommendations'; updateStatus();
      err.textContent = ex.code === 'NO_CREDITS' ? 'You don’t have enough credits for this run.' : ex.message; err.hidden = false; return;
    }
    try {
      await showGenerating(p, lite);
      const panels = buildPanels(p);
      lastResults = { panels, p };
      showResults(panels, p, true);
      const keep = B.resultsLimit() === Infinity ? 3 : B.resultsLimit();
      B.addHistory({ top: (panels.length > 1 ? PM.recommend(p) : panels[0].res)[0].m.name, topIds: panels[0].res.slice(0, keep).map(r => r.m.id), panels: panels.map(x => ({ game: x.game, topIds: x.res.slice(0, keep).map(r => r.m.id) })),
        prefs: p, cost: charged, summary: summarise(p).slice(0, 4).join(' · ') });
      renderHistory();
    } catch (ex) {
      await B.refund(charged); $('#recsOut').innerHTML = `<div class="panel out-empty"><h3>Something went wrong</h3><p>We refunded your credits. Please try again.</p></div>`;
    } finally { running = false; $('#genLabel').textContent = 'Generate recommendations'; updateStatus(); }
  }

  const summarise = p => [
    p.games.map(g => PM.GAME_NAME[g] ? cap(PM.GAME_NAME[g]) : g).join(' + ') + (p.mcVersion && p.mcVersion !== 'any' ? ` (${p.mcVersion})` : ''),
    p.weight !== 'any' ? cap(p.weight) + ' weight' : null, p.grip !== 'any' ? cap(p.grip) + ' grip' : null, p.connection !== 'any' ? cap(p.connection) : null,
    p.handLength ? p.handLength + ' cm hand' : p.handSize !== 'any' ? cap(p.handSize) + ' hands' : null, p.lefty ? 'Left-handed' : null, p.budgetMax ? 'up to ' + inr(p.budgetMax) : null, p.minButtons ? p.minButtons + '+ buttons' : null,
    p.clickStyle !== 'any' ? cap(p.clickStyle) + ' clicking' : null, p.shape !== 'any' ? cap(p.shape) : null, p.custom.length ? p.custom.length + ' features' : null
  ].filter(Boolean);

  /* ---------- results: one panel per selected game ---------- */
  const GAME = id => O.GAMES.find(g => g.id === id) || { id, label: cap(id), icon: 'spark' };
  const buildPanels = p => p.games.map(g => ({ game: g, res: PM.recommend({ ...p, games: [g] }) }));
  const panelNote = (g, p) => g === 'minecraft' ? (p.mcVersion === '1.9+' ? 'Weighted for comfort and control (1.9+ combat)' : 'Weighted for CPS: mice that can double-click come first')
    : g === 'fps' ? 'Weighted for low weight, fast polling and aim control' : g === 'mmo' ? 'Weighted for programmable buttons and comfort' : 'Weighted for comfort and handy extra buttons';

  const FOLD = 6;   // Lite lists every mouse; fold the long tail behind a button
  function showResults(panels, p, animate) {
    const u = B.getUser(), lite = B.has('advanced'), limit = B.resultsLimit(), multi = panels.length > 1;
    const out = $('#recsOut');
    let hidden = 0;
    const both = multi ? PM.recommend(p)[0] : null;
    const panelHtml = panels.map(({ game, res }) => {
      const G = GAME(game), shown = res.slice(0, limit === Infinity ? res.length : limit); hidden += res.length - shown.length;
      return `<section class="game-panel">
        <header class="gp-head"><span class="gp-ico" aria-hidden="true">${window.PMIcon ? window.PMIcon(G.icon) : ''}</span><div><span class="gp-kicker">Best for</span><h4>${esc(G.label)}</h4><small>${panelNote(game, p)}</small></div></header>
        <div class="result-list">${shown.map((r, i) => resultCard(r, i, lite, game, multi)).join('')}</div>
        ${shown.length > FOLD ? `<button class="btn btn-ghost btn-sm show-all" type="button" data-more>Show all ${shown.length} matches</button>` : ''}</section>`;
    }).join('');
    out.innerHTML = `
      <div class="results-head"><div><span class="section-label">Your shortlist</span><h3>${multi ? `Best mice for your ${panels.length} games` : `Best for ${esc(GAME(panels[0].game).label)}`}</h3>${exportRow()}</div>
        <div class="chips">${summarise(p).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>
      ${both ? `<a class="both-banner" href="${root}${both.m.page}"><img src="${PM.IMG(both.m, 480)}" alt="" width="54" height="54"><span><small>One mouse for ${panels.map(x => esc(GAME(x.game).label)).join(' and ')}</small><b>${esc(both.m.name)}</b></span><em>${both.score}% fit</em></a>` : ''}
      <div class="game-panels${multi ? ' multi' : ''}${panels.length > 2 ? ' many' : ''}">${panelHtml}</div>
      ${hidden > 0 ? `<div class="upsell-card slim"><div class="upsell-body static"><span class="plan-tag lite">Lite</span><h4>${hidden} more match${hidden > 1 ? 'es' : ''} hidden</h4><p>Lite shows every mouse in every panel with a full breakdown, and adds hand size, Minecraft version, budget, buttons and customisation preferences.</p>
        <a class="btn btn-primary btn-sm" href="${root}lite.html">Unlock with Lite</a></div></div>` : ''}
      ${checkAnyHtml()}
      <p class="fine">Matches come from published specs and editorial fit estimates for your answers. They aren’t a ranking of overall quality — read the reviews and try before you buy if you can.</p>`;
    $$('.game-panel', out).forEach(gp => {
      const cards = $$('.result-card', gp), btn = $('[data-more]', gp); if (!btn) return;
      cards.slice(FOLD).forEach(c => (c.hidden = true));
      btn.addEventListener('click', () => { cards.forEach(c => (c.hidden = false)); btn.remove(); });
    });
    bindCheckAny(p);
    A.syncWatch && A.syncWatch();
    $$('.result-card', out).forEach((c, i) => { if (animate && !reduce) c.animate([{ opacity: 0, transform: 'translateY(26px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 120 + i * 90, easing: EASE, fill: 'backwards' }); });
    $$('.score-meter i', out).forEach((el, i) => { el.style.width = '0%'; requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transitionDelay = (animate ? 250 + i * 90 : 0) + 'ms'; el.style.width = el.dataset.w + '%'; })); });
    $$('[data-count-to]', out).forEach(el => { const to = +el.dataset.countTo; PM.tween(animate ? 1100 : 1, t => { el.textContent = Math.round(to * t) + '%'; }); });
    if (animate) { out.focus({ preventScroll: true }); out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  }

  /* ---------- Basic and up: check any mouse against these answers ---------- */
  function checkAnyHtml() {
    const open = B.has('checkAny');
    return `<section class="panel check-any"><div class="ca-head"><div><span class="plan-tag basic">Basic</span><h4>Check any mouse</h4>
      <p class="panel-note">Already have a mouse in mind? See how it scores for these answers, where it would rank, and what holds it back.</p></div>
      ${open ? `<select id="caPick" aria-label="Pick a mouse"><option value="">Pick a mouse…</option>${PM.MICE.slice().sort((a, b) => a.name.localeCompare(b.name)).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>`
        : `<a class="btn btn-primary btn-sm" href="${root}basic.html">Unlock with Basic</a>`}</div><div id="caOut"></div></section>`;
  }
  function bindCheckAny(p) {
    const sel = $('#caPick'); if (!sel) return;
    sel.addEventListener('change', () => {
      const all = PM.recommend(p), i = all.findIndex(r => r.m.id === sel.value), r = all[i], top = all[0], box = $('#caOut');
      if (!r) { box.innerHTML = ''; return; }
      const gaps = r.parts.map((x, k) => ({ label: x.label, d: ((top.parts[k] || {}).value || 0) - x.value })).filter(x => x.d > .08).sort((a, b) => b.d - a.d).slice(0, 3);
      box.innerHTML = `<div class="ca-res"><img src="${PM.IMG(r.m, 480)}" alt="" width="84" height="84"><div><b>${esc(r.m.name)}</b><span>${r.score}% match · would rank <b>#${i + 1}</b> of ${all.length}</span>
        ${i === 0 ? '<p>This is your top match. Good choice.</p>' : `<p>${top.score - r.score} points behind your top pick, the <a href="${root}${top.m.page}">${esc(top.m.name)}</a>.${gaps.length ? ' It loses most on ' + gaps.map(g => g.label.toLowerCase()).join(', ') + '.' : ''}</p>`}
        ${r.cons.length ? `<ul class="heads-up">${r.cons.slice(0, 3).map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div></div>
        <div class="bk">${r.parts.map(x => `<div><span>${esc(x.label)}</span><div class="bk-bar"><i style="width:${Math.round(x.value * 100)}%"></i></div><b>${Math.round(x.value * 100)}%</b></div>`).join('')}</div>`;
    });
  }

  function resultCard(r, i, lite, game, compact) {
    const m = r.m, mc = game === 'minecraft';
    const pros = compact ? r.pros.slice(0, 2) : r.pros, cons = compact ? r.cons.slice(0, 2) : r.cons;
    return `<article class="result-card${compact ? ' compact' : ''}${i === 0 ? ' first' : ''}" style="--c:${m.cv}">
      <div class="rc-rank">${i + 1}</div>
      <div class="rc-img"><img src="${PM.IMG(m, 480)}" alt="${esc(m.name)}" loading="lazy"></div>
      <div class="rc-main">
        <div class="rc-top"><div><span class="mc-brand">${esc(m.brand)}</span><h4>${esc(m.name)}</h4></div><div class="rc-score"><b data-count-to="${r.score}">0%</b><small>match</small></div></div>
        <div class="score-meter"><i data-w="${r.score}"></i></div>
        ${pros.length ? `<ul class="why">${pros.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${cons.length ? `<ul class="heads-up">${cons.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <div class="chips"><span class="chip">${m.weight} g</span><span class="chip">${num(m.poll)} Hz</span><span class="chip">${m.price ? inr(m.price) : 'Price n/a'}</span>${mc ? `<span class="chip accent">CPS: ${esc(m.cps.label)}</span>` : ''}</div>
        ${B.has('breakdown') ? `<details class="breakdown"><summary>Match breakdown</summary><div class="bk">${r.parts.map(x => `<div><span>${esc(x.label)}</span><div class="bk-bar"><i style="width:${Math.round(x.value * 100)}%"></i></div><b>${Math.round(x.value * 100)}%</b></div>`).join('')}</div></details>` : ''}
        <div class="rc-actions"><a class="rc-link" href="${root}${m.page}">Read the review →</a><button class="watch-btn mini" type="button" data-watch="${m.id}" data-price="${m.price || ''}" aria-pressed="false">${STAR}<span class="wl">Watch price</span></button></div>
      </div></article>`;
  }

  /* ---------- Ultra: export, saved profiles ---------- */
  const STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';
  const exportRow = () => `<div class="export-row"><button class="btn btn-ghost btn-sm" type="button" data-export="print">Print / save PDF</button><button class="btn btn-ghost btn-sm" type="button" data-export="copy">Copy shortlist</button>${B.has('export') ? '' : '<span class="ultra-chip">Ultra</span>'}</div>`;
  function shortlistText() {
    if (!lastResults) return '';
    const { panels, p } = lastResults, lim = B.resultsLimit();
    return `My ProMouser shortlist (${summarise(p).join(' · ')})\n` + panels.map(({ game, res }) => `\n${GAME(game).label}:\n` + res.slice(0, lim === Infinity ? 5 : lim).map((r, i) => `${i + 1}. ${r.m.name} — ${r.score}% fit · ${r.m.weight} g · ${r.m.price ? inr(r.m.price) : 'no price'}`).join('\n')).join('\n') + `\n\n${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  }
  host.addEventListener('click', async e => {
    const x = e.target.closest('[data-export]'); if (!x) return;
    if (!B.has('export')) { A.ultraGate('Shortlist export'); return; }
    if (x.dataset.export === 'print') window.print();
    else { try { await navigator.clipboard.writeText(shortlistText()); A.toast('Shortlist copied. Paste it anywhere.'); } catch (er) { A.toast('Couldn’t copy here. Use Print / save PDF instead.', 'err'); } }
  });

  function renderProfiles() {
    const el = $('#profBar'); if (!el) return;
    const u = B.getUser(); if (!u) { el.innerHTML = ''; return; }
    if (!B.has('profiles')) { el.innerHTML = `<div class="profiles-bar"><b>Saved profiles</b><span class="panel-note" style="margin:0">Keep up to ${CFG.ultra.maxProfiles} setups like “Main PC” or “Minecraft PvP” and switch in one click.</span><button class="btn btn-ghost btn-sm" type="button" data-prof-gate>Unlock with Ultra</button></div>`; return; }
    const list = u.extras.profiles || [];
    el.innerHTML = `<div class="profiles-bar"><b>Profiles</b>${list.map((pr, i) => `<span class="prof-chip" data-prof="${i}" role="button" tabindex="0">${esc(pr.name)}<button class="x" type="button" data-prof-del="${i}" aria-label="Delete ${esc(pr.name)}">×</button></span>`).join('') || '<span class="panel-note" style="margin:0">No saved profiles yet.</span>'}
      ${list.length < CFG.ultra.maxProfiles ? `<input class="prof-name" id="profName" maxlength="24" placeholder="Name this setup" aria-label="Profile name"><button class="btn btn-outline btn-sm" type="button" id="profSave">Save current</button>` : ''}</div>`;
  }
  host.addEventListener('click', async e => {
    if (e.target.closest('[data-prof-gate]')) { A.ultraGate('Saved profiles'); return; }
    const u = B.getUser(); if (!u || !B.has('profiles')) return;
    const list = (u.extras.profiles || []).slice();
    const del = e.target.closest('[data-prof-del]');
    if (del) { e.stopPropagation(); list.splice(+del.dataset.profDel, 1); await B.updateExtras({ profiles: list }); renderProfiles(); return; }
    const chip = e.target.closest('[data-prof]');
    if (chip) { prefs = { ...defaults(u), ...list[+chip.dataset.prof].prefs }; lastResults = null; render(); A.toast(`Loaded “${list[+chip.dataset.prof].name}”.`); return; }
    if (e.target.closest('#profSave')) {
      const name = ($('#profName').value || '').trim() || `Profile ${list.length + 1}`;
      list.push({ name: name.slice(0, 24), prefs: readForm(), at: Date.now() });
      try { await B.updateExtras({ profiles: list }); A.toast(`Saved “${name}”.`); } catch (er) { A.toast(er.message, 'err'); }
      renderProfiles();
    }
  });

  /* ---------- history ---------- */
  function renderHistory() {
    const u = B.getUser(), el = $('#recsHistory'); if (!u || !el) return;
    if (!u.history.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<section class="panel recs-hist"><h3>Recent runs</h3><ul class="hist">${u.history.slice(0, 5).map(h => `<li><div><b>${esc(h.top)}</b><small>${A.fmtDate(h.at)} · ${esc(h.summary || '')}</small></div><button class="btn btn-ghost btn-sm" type="button" data-reuse="${h.id}">Use these settings</button></li>`).join('')}</ul></section>`;
    $$('[data-reuse]', el).forEach(b => b.addEventListener('click', () => { const h = u.history.find(x => x.id === b.dataset.reuse); if (!h) return; prefs = { ...defaults(u), ...h.prefs }; lastResults = null; render(); window.scrollTo({ top: host.offsetTop - 90, behavior: reduce ? 'auto' : 'smooth' }); }));
  }

  render();
  B.on(() => { /* sign in/out or plan change from another tab */ const u = B.getUser(); const key = u ? u.id + u.plan.tier + u.onboarded : 'out'; if (host.dataset.key !== key) { host.dataset.key = key; if (!running) { prefs = null; lastResults = null; render(); } } });
  host.dataset.key = (() => { const u = B.getUser(); return u ? u.id + u.plan.tier + u.onboarded : 'out'; })();
})();
