/* =====================================================================
   ProMouser — site script
   Navigation, search, icons, scroll + pointer effects, page transitions.
   Stats / charts live in stats.js; tool logic lives inline on its page.
   Browser storage used (see privacy.html): sessionStorage "pm_banner_closed".
   ===================================================================== */
'use strict';

(function () {
  const doc = document.documentElement;
  const root = doc.dataset.root || '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  doc.classList.remove('no-js');

  /* ── ICONS (data-icon="Name" → inline SVG) ── */
  const P = {
    mouse: '<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M12 2.5v7"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
    chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5v-15M8 7h8"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    shield: '<path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    star: '<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
    hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 11a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7-3 0-5-1.5-6.5-4L3 13.5a1.5 1.5 0 0 1 2.5-1.5L7 14"/>',
    pad: '<path d="M7 7h10a5 5 0 0 1 4.8 6.4l-.8 3A3 3 0 0 1 15.2 17L14 15h-4l-1.2 2A3 3 0 0 1 3 16.4l-.8-3A5 5 0 0 1 7 7z"/><path d="M8 10v3M6.5 11.5h3M15.5 10.5h.01M17.5 12.5h.01"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    cursor: '<path d="m5 3 6.5 17 2.2-6.8L20.5 11z"/>',
    feather: '<path d="M20.2 3.8a6 6 0 0 0-8.5 0L5 10.5V19h8.5l6.7-6.7a6 6 0 0 0 0-8.5z"/><path d="M16 8 3 21M17.5 15H9"/>',
    pulse: '<path d="M3 12h3l3-8 4 16 3-8h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    play: '<path d="M7 4.5v15l13-7.5z"/>',
    versus: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    check: '<path d="m4 12.5 5 5 11-11"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    news: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    ruler: '<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    bars: '<path d="M5 21V11M12 21V4M19 21v-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    flag: '<path d="M5 22V3M5 4h13l-2.5 4.5L18 13H5"/>',
    heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
    wheel: '<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M12 6.5v4M9.5 15l2.5 2.5 2.5-2.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const MAP = {
    Mouse: 'mouse', Speed: 'bolt', Fast: 'bolt', Focus: 'target', Aim: 'target', FPS: 'target', PVP: 'target', AI: 'chip', Guide: 'book', News: 'news',
    Media: 'play', Play: 'play', Start: 'play', Games: 'pad', MC: 'box', Build: 'box', Value: 'tag', Pro: 'shield', Protect: 'shield', Elite: 'star', Rate: 'star', Skill: 'star',
    Verdict: 'flag', Click: 'cursor', CPS: 'cursor', Light: 'feather', Weight: 'feather', Track: 'pulse', Poll: 'pulse', Time: 'clock', Versus: 'versus', Yes: 'check',
    Fix: 'sliders', Setup: 'sliders', Tools: 'sliders', Tips: 'spark', Tip: 'spark', Insight: 'spark', Style: 'spark', Clean: 'spark', Note: 'info', Help: 'info', Legacy: 'info',
    No: 'alert', Warn: 'alert', Care: 'heart', Hands: 'hand', Palm: 'hand', Claw: 'hand', Grip: 'hand', Ergo: 'hand', Hub: 'grid', More: 'grid', Office: 'grid',
    Test: 'bars', Stats: 'bars', Scroll: 'wheel', Size: 'ruler', Fit: 'ruler', Owner: 'user', Image: 'image', Home: 'home', Arrow: 'arrow'
  };
  const svg = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[MAP[key] || key] || P.spark}</svg>`;
  window.PMIcon = svg;
  $$('[data-icon]').forEach(el => { if (!el.firstElementChild) el.innerHTML = svg(el.dataset.icon); });

  /* ── SCROLL PROGRESS + HEADER STATE ── */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const header = $('#siteHeader');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = doc.scrollHeight - innerHeight;
      bar.style.width = max > 0 ? Math.min(100, (scrollY / max) * 100) + '%' : '0%';
      header && header.classList.toggle('scrolled', scrollY > 8);
      trackPills();
      window.pmRevealPast && window.pmRevealPast();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* section pills on review pages */
  const pills = $$('.pill-nav a');
  const pillTargets = pills.map(a => $(a.getAttribute('href')));
  function trackPills() {
    if (!pills.length) return;
    let cur = 0;
    pillTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    pills.forEach((a, i) => a.classList.toggle('on', i === cur));
    const on = pills[cur]; if (on && on.parentElement.scrollWidth > on.parentElement.clientWidth) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ── ANNOUNCEMENT BANNER ── */
  (function () {
    const banner = $('#announcementBar'), close = $('#closeBanner');
    if (!banner || !close) return;
    const setH = () => doc.style.setProperty('--announce-h', banner.classList.contains('hidden') ? '0px' : banner.offsetHeight + 'px');
    try { if (sessionStorage.getItem('pm_banner_closed')) banner.classList.add('hidden'); } catch (e) { /* storage unavailable */ }
    setH();
    close.addEventListener('click', () => {
      banner.style.transition = 'opacity .3s, max-height .4s, padding .4s';
      banner.style.maxHeight = banner.offsetHeight + 'px';
      requestAnimationFrame(() => { banner.style.opacity = '0'; banner.style.maxHeight = '0'; banner.style.paddingBlock = '0'; });
      setTimeout(() => { banner.classList.add('hidden'); setH(); }, 400);
      try { sessionStorage.setItem('pm_banner_closed', '1'); } catch (e) { /* storage unavailable */ }
    });
    addEventListener('resize', setH);
  })();

  /* ── MOBILE MENU + DROPDOWN ARIA ── */
  (function () {
    const burger = $('#hamburger'), links = $('#navLinks');
    if (!burger || !links) return;
    const mobile = () => window.matchMedia('(max-width: 1060px)').matches;
    const triggers = $$('a[aria-controls]', links);
    const sync = () => triggers.forEach(t => {
      const li = t.parentElement;
      t.setAttribute('aria-expanded', String(mobile() ? links.classList.contains('open') : li.matches(':hover') || li.contains(document.activeElement)));
    });
    triggers.forEach(t => ['pointerenter', 'pointerleave', 'focusin'].forEach(ev => t.parentElement.addEventListener(ev, sync)));
    triggers.forEach(t => t.parentElement.addEventListener('focusout', () => requestAnimationFrame(sync)));
    const setOpen = open => {
      links.classList.toggle('open', open); burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; sync();
    };
    burger.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.addEventListener('click', e => { if (e.target.closest('a[href]')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); burger.focus(); } });
    addEventListener('resize', () => { if (!mobile() && links.classList.contains('open')) setOpen(false); sync(); });
    sync();
  })();

  /* ── ACTIVE NAV LINK ── */
  (function () {
    const path = location.pathname.replace(/index\.html$/, '');
    $$('.nav-links a[href]').forEach(a => {
      const url = new URL(a.getAttribute('href'), location.href);
      const here = url.pathname.replace(/index\.html$/, '') === path;
      if (here) { a.classList.add('active'); const top = a.closest('.nav-links > li'); top && top.classList.add('active'); }
    });
    // group highlight: an item inside a dropdown lights its parent
    $$('.nav-links > li').forEach(li => { if ($('.dropdown a.active', li)) li.classList.add('active'); });
  })();

  /* ── SEARCH (curated page index) ── */
  (function () {
    const open = $('#navSearchBtn'), overlay = $('#searchOverlay'), close = $('#closeSearch'), input = $('#searchInput');
    if (!open || !overlay || !input) return;
    const PAGES = [
      ['Home', 'index.html', 'ProMouser home — mouse guides, recommendations and tools'],
      ['Recommendations', 'recommendations.html', 'Credits-based personal mouse shortlist from your games, weight and grip'],
      ['Shop', 'shop.html', 'Credits, the Recommendation Pass and ProMouser Lite'],
      ['ProMouser Lite', 'lite.html', 'Blue theme, every match and advanced preferences'],
      ['ProMouser Ultra', 'ultra.html', 'Purple theme, unlimited recommendations, watchlist, profiles, sensitivity converter'],
      ['Sensitivity converter', 'sens.html', 'Convert sensitivity between CS2, Valorant, Apex, Overwatch 2 and TF2 (Ultra)'],
      ['My account', 'account.html', 'Preferences, credits, plan and orders'],
      ['Browse mice', 'mice.html', 'Every mouse with spec sheets, filters and a spec map'],
      ['Compare mice', 'mice/compare.html', 'Up to four mice side by side'],
      ['FPS mice', 'mice/first-person-shooters.html', 'Best mice for fast aim: Valorant, CS2, Fortnite, TF2'],
      ['Minecraft mice', 'mice/minecraft.html', 'Highest-CPS mice first: Glorious Model O and Bloody A70'],
      ['Extra picks', 'mice/extra.html', 'Budget and legacy mouse pages'],
      /*mice:start*/
      ["Razer DeathAdder V3", "mice/razer-deathadder-v3.html", "59 g · wired · Fast, precise FPS aim"],
      ["Logitech Superlight Pro X", "mice/logitech-superlight-pro-x.html", "63 g · wireless · Low-friction aim and long competitive sessions"],
      ["Glorious Model O", "mice/glorious-model-o.html", "67 g · wired · Butterfly and jitter clicking, precise aim, a lighter feel"],
      ["Logitech G502 HERO", "mice/logitech-g502-hero.html", "121 g · wired · Custom buttons, strong sensor, jitter clicking"],
      ["Bloody A70", "mice/bloody-a70.html", "150 g · wired · Drag clicking and bridging practice"],
      ["Razer Cobra", "mice/razer-cobra.html", "58 g · wired · Value-focused FPS and everyday play"],
      ["Logitech G PRO X2 SUPERSTRIKE", "mice/logitech-g-pro-x2-superstrike.html", "61 g · wireless · Players who want to tune their own click feel"],
      ["Logitech G102 Lightsync", "mice/logitech-g102-lightsync.html", "85 g · wired · A cheap, reliable all-rounder that drag clicks well"],
      ["Logitech G304 Lightspeed", "mice/logitech-g304-lightspeed.html", "99 g · wireless · Affordable wireless with a huge battery life"],
      ["Logitech G502 X", "mice/logitech-g502-x.html", "89 g · wired · Lots of buttons in a much lighter G502 body"],
      ["Logitech G502 X Plus", "mice/logitech-g502-x-plus.html", "106 g · wireless · The flagship wireless G502, with RGB"],
      ["Logitech G PRO X Superlight 2", "mice/logitech-g-pro-x-superlight-2.html", "60 g · wireless · Pro-level wireless FPS that weighs almost nothing"],
      ["Logitech G Pro Wireless", "mice/logitech-g-pro-wireless.html", "80 g · wireless · A truly ambidextrous wireless mouse for lefties and righties"],
      ["Logitech G703 Lightspeed", "mice/logitech-g703-lightspeed.html", "95 g · wireless · A comfortable wireless palm-grip shape"],
      ["Razer Viper V3 Pro", "mice/razer-viper-v3-pro.html", "54 g · wireless · Esports-grade wireless aim at 54 g"],
      ["Razer Viper Mini", "mice/razer-viper-mini.html", "61 g · wired · Small, light and cheap"],
      ["Razer DeathAdder Essential", "mice/razer-deathadder-essential.html", "96 g · wired · The classic DeathAdder shape at a budget price"],
      ["Razer DeathAdder V3 Pro", "mice/razer-deathadder-v3-pro.html", "63 g · wireless · The DeathAdder V3 shape without the cable"],
      ["Razer Basilisk V3", "mice/razer-basilisk-v3.html", "101 g · wired · 11 buttons and a free-spinning scroll wheel"],
      ["Razer Orochi V2", "mice/razer-orochi-v2.html", "60 g · wireless · A tiny travel mouse with months of battery"],
      ["Razer Naga V2 HyperSpeed", "mice/razer-naga-v2-hyperspeed.html", "95 g · wireless · A 12-button thumb grid for MMOs and macros"],
      ["Glorious Model O-", "mice/glorious-model-o-minus.html", "58 g · wired · The Model O’s clicking in a smaller shell"],
      ["Glorious Model D", "mice/glorious-model-d.html", "68 g · wired · An ergonomic honeycomb shape that still clicks fast"],
      ["Glorious Model O Wireless", "mice/glorious-model-o-wireless.html", "69 g · wireless · A wireless Model O for clicking without a cable"],
      ["Glorious Model I", "mice/glorious-model-i.html", "69 g · wired · Swappable side buttons for MMO and work binds"],
      ["Bloody A90", "mice/bloody-a90.html", "106 g · wired · Drag clicking on a budget"],
      ["Bloody W70 Max", "mice/bloody-w70-max.html", "108 g · wired · Bloody’s 10K-CPI RGB model"],
      ["SteelSeries Rival 3", "mice/steelseries-rival-3.html", "77 g · wired · A budget all-rounder with solid clicks"],
      ["SteelSeries Aerox 3", "mice/steelseries-aerox-3.html", "57 g · wired · A water-resistant honeycomb ultralight"],
      ["HyperX Pulsefire Haste", "mice/hyperx-pulsefire-haste.html", "59 g · wired · A light honeycomb shell that butterfly clicks well"],
      ["HyperX Pulsefire Haste 2", "mice/hyperx-pulsefire-haste-2.html", "53 g · wired · A solid-shell ultralight with 8K polling"],
      ["Zowie EC2-C", "mice/zowie-ec2-c.html", "73 g · wired · No-software esports ergonomics"],
      ["Cooler Master MM710", "mice/cooler-master-mm710.html", "53 g · wired · A 53 g honeycomb clicker on a budget"],
      ["Endgame Gear XM1r", "mice/endgame-gear-xm1r.html", "63 g · wired · Crisp, low-latency clicks for jitter and butterfly"],
      ["Corsair Harpoon RGB Pro", "mice/corsair-harpoon-rgb-pro.html", "85 g · wired · A small, grippy budget mouse"],
      ["Corsair M65 RGB Ultra", "mice/corsair-m65-rgb-ultra.html", "97 g · wired · Tunable weight and a sniper button"],
      ["Redragon M711 Cobra", "mice/redragon-m711-cobra.html", "100 g · wired · The classic cheap RGB gaming mouse"],
      ["Attack Shark X3", "mice/attack-shark-x3.html", "49 g · wireless · A flagship sensor at 49 g for very little money"],
      /*mice:end*/
      ['Recommendation Assistant', 'mouse-ai.html', 'Ask questions and compare mice, grounded in ProMouser pages'],
      ['Hand grip guide', 'hand-grip.html', 'Palm, claw and fingertip grips explained'],
      ['Mouse tips', 'mouse-tips.html', 'DPI, polling rate, surface and lift-off settings'],
      ['Minecraft tips', 'minecraft-tips.html', 'Setups for builders and PvP players'],
      ['Test hub', 'tests.html', 'CPS, reaction, aim, polling rate, scroll and button tests'],
      ['CPS test', 'cps-test.html', 'Clicks per second, double clicks and stray right clicks'],
      ['Reaction time test', 'reaction-test.html', 'Wait for green, then click as fast as you can'],
      ['Aim trainer', 'aim-trainer.html', 'Hit targets fast: time, accuracy and bests'],
      ['Polling rate test', 'polling-rate-test.html', 'Check how many Hz your mouse reports at'],
      ['Scroll wheel test', 'scroll-test.html', 'Find a scroll wheel that jumps the wrong way'],
      ['Mouse button test', 'mouse-button-test.html', 'Test every button and catch double-clicking switches'],
      ['Double click test', 'double-click-test.html', 'Check timing and consistency of double clicks'],
      ['Blog', 'blog/', 'Practical mouse guides'],
      ['How to choose a gaming mouse', 'blog/choosing-a-gaming-mouse.html', 'Grip, weight, wireless, DPI and budget explained'],
      ['About us', 'about.html', 'Who we are and what ProMouser stands for'],
      ['Elite Dashboard', 'elite.html', 'Your credits, recommendation activity and latest shortlists'],
      ['Image generation', 'image-gen.html', 'Visual ideas for setups and content'],
      ['Contact', 'contact.html', 'Feedback, corrections and questions'],
      ['Privacy policy', 'privacy.html', 'What the site stores in your browser'],
      ['Terms of use', 'terms.html', 'Terms for using ProMouser']
    ].map(([t, u, d]) => ({ t, u: root + u, d, k: (t + ' ' + d).toLowerCase() }));

    let host = $('#searchResults');
    if (!host) { host = document.createElement('div'); host.id = 'searchResults'; host.className = 'search-results'; overlay.appendChild(host); }
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Search ProMouser');
    let active = -1, lastFocus = null;
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const norm = s => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]+/gu, ' ').trim();
    function render(list, empty) {
      host.innerHTML = list.length ? list.map(p => `<button class="search-result-item" type="button" data-href="${esc(p.u)}"><span><strong>${esc(p.t)}</strong><span class="search-result-meta">${esc(p.d)}</span></span><span aria-hidden="true">→</span></button>`).join('') : `<div class="search-empty">${empty}</div>`;
      active = -1;
    }
    function run(q) {
      const terms = norm(q).split(/\s+/).filter(Boolean);
      if (!terms.length) return render(PAGES.slice(0, 7), '');
      const res = PAGES.map(p => ({ p, s: terms.reduce((sum, t) => sum + (p.t.toLowerCase().includes(t) ? 10 : 0) + (p.k.includes(t) ? 3 : 0), 0) + (terms.every(t => p.k.includes(t)) ? 5 : 0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8).map(x => x.p);
      render(res, 'No results. Try “grip”, “CPS” or a mouse name.');
    }
    const show = () => { lastFocus = document.activeElement; overlay.classList.add('open'); document.body.style.overflow = 'hidden'; run(''); setTimeout(() => input.focus(), 60); };
    const hide = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; input.value = ''; lastFocus && lastFocus.focus && lastFocus.focus(); };
    open.addEventListener('click', show);
    close && close.addEventListener('click', hide);
    overlay.addEventListener('click', e => { if (e.target === overlay) hide(); });
    host.addEventListener('click', e => { const b = e.target.closest('[data-href]'); if (b) location.href = b.dataset.href; });
    input.addEventListener('input', () => run(input.value));
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.classList.contains('open') ? hide() : show(); return; }
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !overlay.classList.contains('open')) { e.preventDefault(); show(); return; }
      if (!overlay.classList.contains('open')) return;
      const items = $$('.search-result-item', host);
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        active = e.key === 'ArrowDown' ? Math.min(active + 1, items.length - 1) : Math.max(active - 1, 0);
        items.forEach((it, i) => it.classList.toggle('active', i === active)); items[active].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); items[active].click(); }
      if (e.key === 'Enter' && active < 0 && items[0] && document.activeElement === input) { e.preventDefault(); items[0].click(); }
    });
  })();

  /* ── SCROLL REVEAL (staggered per parent) ── */
  (function () {
    const targets = $$('.reveal');
    if (!targets.length) return;
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('visible')); return; }
    const io = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach(e => {
        const sibs = $$('.reveal:not(.visible)', e.target.parentElement);
        const delay = Math.min(Math.max(sibs.indexOf(e.target), 0), 8) * 70;
        e.target.style.transitionDelay = delay + 'ms';
        e.target.classList.add('visible');
        setTimeout(() => (e.target.style.transitionDelay = ''), delay + 900);
        io.unobserve(e.target);
      });
    }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => io.observe(t));
    // anything scrolled fully past (e.g. via End key or an anchor jump) must not stay hidden
    window.pmRevealPast = () => targets.forEach(t => { if (!t.classList.contains('visible') && t.getBoundingClientRect().bottom < 0) { t.classList.add('visible'); io.unobserve(t); } });
  })();

  /* ── COUNTERS: <b data-count="64" data-suffix="g"> ── */
  (function () {
    const els = $$('[data-count]');
    if (!els.length) return;
    const run = el => {
      const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = to.toLocaleString('en-US') + suffix; return; }
      const t0 = performance.now();
      (function f(now) {
        const t = Math.min((now - t0) / 1500, 1), v = to * (1 - Math.pow(1 - t, 4));
        el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
        if (t < 1) requestAnimationFrame(f);
      })(t0);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .4 });
    els.forEach(el => io.observe(el));
  })();

  /* ── POINTER EFFECTS: card spotlight, ambient glow, hero parallax, magnetic buttons ── */
  if (finePointer && !reduce) {
    let raf = 0, px = 0, py = 0, target = null;
    document.addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY; target = e.target;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        doc.style.setProperty('--cx', px + 'px'); doc.style.setProperty('--cy', py + 'px');
        const card = target && target.closest && target.closest('.feature-card, .ql-card, .mouse-card, .store-card, .panel');
        if (card) { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', px - r.left + 'px'); card.style.setProperty('--my', py - r.top + 'px'); }
        // hero parallax
        const stage = $('.hero-visual, .review-stage');
        if (stage) {
          const r = stage.getBoundingClientRect();
          if (r.bottom > 0 && r.top < innerHeight) {
            const x = (px - (r.left + r.width / 2)) / r.width, y = (py - (r.top + r.height / 2)) / r.height;
            const prod = $('.hero-product, .review-stage picture', stage);
            if (prod) prod.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg) translateZ(20px)`;
            $$('.floating-tag', stage).forEach((t, i) => (t.style.translate = `${-x * (14 + i * 8)}px ${-y * (14 + i * 8)}px`));
          }
        }
      });
    }, { passive: true });
    document.addEventListener('pointerleave', () => { const p = $('.hero-product, .review-stage picture'); p && (p.style.transform = ''); }, true);
    $$('.btn-primary, .btn-ghost').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .16}px, ${(e.clientY - r.top - r.height / 2) * .22 - 2}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ── PAGE TRANSITIONS + PREFETCH ── */
  (function () {
    const internal = a => {
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
      try {
        const u = new URL(a.href, location.href);
        if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return false;
        if (u.pathname === location.pathname && u.search === location.search) return false;
        return /(\.html?|\/)$/.test(u.pathname);
      } catch (e) { return false; }
    };
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !internal(a) || reduce) return;
      e.preventDefault();
      document.body.classList.add('page-transitioning');
      setTimeout(() => { location.href = a.href; }, 240);
    });
    addEventListener('pageshow', () => document.body.classList.remove('page-transitioning'));
    const done = new Set();
    document.addEventListener('pointerover', e => {
      const a = e.target.closest && e.target.closest('a');
      if (!internal(a) || done.has(a.href)) return;
      done.add(a.href);
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l);
    }, { passive: true });
  })();

  /* ── SKIP LINK FOCUS ── */
  $$('a.skip-link').forEach(a => a.addEventListener('click', e => {
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault(); t.focus({ preventScroll: true }); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ── DEV MODE LOADER ── only on your own computer (localhost / file://). On the live site dev.js is never requested.
     Turn on with Ctrl+Shift+D or ?dev=1; turn off from the panel or with ?dev=0. */
  (() => {
    const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);
    if (!local) return;
    let on = false;
    try { const q = new URLSearchParams(location.search).get('dev'); if (q != null) localStorage.setItem('pm_dev', q === '0' ? '0' : '1'); on = localStorage.getItem('pm_dev') === '1'; } catch (e) { /* storage off */ }
    const load = () => { if (window.__pmDev) return window.PMDev && window.PMDev.open(); const s = document.createElement('script'); s.src = root + 'dev.js'; document.body.appendChild(s); };
    if (on) load();
    addEventListener('keydown', e => {
      if (!(e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))) return;
      e.preventDefault();
      try { localStorage.setItem('pm_dev', '1'); localStorage.setItem('pm_dev_open', 'true'); } catch (er) { /* noop */ }
      load();
    });
  })();

  onScroll();
})();
