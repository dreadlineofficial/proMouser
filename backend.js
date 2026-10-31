/* =====================================================================
   ProMouser — accounts, credits and plans  (DEMO BACKEND)

   Everything here runs in the visitor's browser and is stored in
   localStorage, so it is NOT secure and NOT shared between devices:
   anyone can edit their own credits in dev-tools. It exists so the whole
   product flow (sign-up, onboarding, credits, Lite, checkout) can be built
   and tested before a real server is connected.

   When supabase-config.js has your project URL and key, backend-supabase.js
   replaces window.PMBackend with a Supabase version (same methods, enforced
   on the server). See SUPABASE-SETUP.md.

   Storage keys (listed in privacy.html):
     pm_users    demo accounts      pm_session  signed-in user id
     pm_plan     'free' | 'basic' | 'lite' | 'ultra' (so the plan's theme can apply before the page paints)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- plans, credits and prices (edit freely; ₹ placeholders) ---------- */
  const DAY = 86400000;
  const CONFIG = window.PM_CONFIG = {
    free: { dailyCredits: 5, resultsLimit: 3, costPerRecommendation: 1, historyLimit: 12 },
    // Basic, Lite and Ultra are one-time payments: pay once, keep the plan for life.
    // Basic: 2 more credits a day, top 5 matches, the match breakdown and "check any mouse".
    basic: { dailyCredits: 7, resultsLimit: 5, costPerRecommendation: 1, historyLimit: 30,
      product: { id: 'basic-lifetime', type: 'basic', name: 'ProMouser Basic (lifetime)', price: 599 } },
    // Lite: everything in Basic, every match, advanced preferences, blue theme, advanced CPS stats, test history.
    lite: { dailyCredits: 20, resultsLimit: Infinity, costPerRecommendation: 2, historyLimit: 50,
      product: { id: 'lite-lifetime', type: 'lite', name: 'ProMouser Lite (lifetime)', price: 2499 } },
    // Ultra: everything in Lite, purple theme, recommendations never cost credits, statistics for every test,
    // a year of ProMouser Turbo, plus the Ultra-only features below.
    ultra: { dailyCredits: 30, resultsLimit: Infinity, costPerRecommendation: 0, historyLimit: 100, maxProfiles: 10, maxWatch: 50, turboDays: 365,
      product: { id: 'ultra-lifetime', type: 'ultra', name: 'ProMouser Ultra (lifetime)', price: 3199 } },
    // ProMouser Turbo: the monthly plan for ProMouser Online (gradient names, profile themes, battle pass, a Turbo mouse).
    // Same account on both sites. Buying Ultra adds a year (365 days) of Turbo.
    turbo: { onlineUrl: 'https://dreadlineofficial.github.io/ProMouser-Online/',
      product: { id: 'turbo-1m', type: 'turbo', name: 'ProMouser Turbo (1 month)', price: 199, days: 30 } },
    // Credits work for everything. A pass covers ONE feature: right now that's recommendations.
    passes: [
      { id: 'rec-pass-1m', type: 'pass', feature: 'recommendation', name: 'Recommendation Pass (1 month)', short: 'Recommendation Pass', price: 199, days: 30,
        perk: 'Unlimited recommendations for 30 days, without spending credits' }
    ],
    packs: [
      { id: 'credits-10', type: 'credits', credits: 10, name: '10 credits', price: 39 },
      { id: 'credits-30', type: 'credits', credits: 30, name: '30 credits', price: 99, tag: 'Popular' },
      { id: 'credits-100', type: 'credits', credits: 100, name: '100 credits', price: 249, tag: 'Best value' },
      { id: 'credits-300', type: 'credits', credits: 300, name: '300 credits', price: 649 }
    ]
  };

  CONFIG.pass = CONFIG.passes[0];   // the pass the shop features

  /* ---------- plan tiers: free < lite < ultra, and which features each unlocks ---------- */
  const RANK = { free: 0, basic: 1, lite: 2, ultra: 3 };
  const FEATURES = {
    breakdown: 'basic', checkAny: 'basic',                                                       // Basic and up
    advanced: 'lite', allResults: 'lite', testHistory: 'lite',                                  // Lite and up
    freeRecs: 'ultra', profiles: 'ultra', watchlist: 'ultra', sens: 'ultra', export: 'ultra', memory: 'ultra', testStats: 'ultra', testLog: 'ultra'   // Ultra only
  };
  const PLAN = window.PM_PLAN = {
    RANK, FEATURES,
    tierOf: u => (u && u.plan && RANK[u.plan.tier] != null ? u.plan.tier : 'free'),
    has: (u, f) => RANK[PLAN.tierOf(u)] >= RANK[FEATURES[f] || 'free'],
    cfg: u => CONFIG[PLAN.tierOf(u)] || CONFIG.free,
    label: t => ({ free: 'Free', basic: 'ProMouser Basic', lite: 'ProMouser Lite', ultra: 'ProMouser Ultra' })[t] || 'Free',
    short: t => ({ free: 'Free', basic: 'Basic', lite: 'Lite', ultra: 'Ultra' })[t] || 'Free',
    paid: t => t === 'basic' || t === 'lite' || t === 'ultra',
    themed: t => t === 'lite' || t === 'ultra',   // Basic keeps the default red theme
    applyTheme(t) { if (PLAN.themed(t)) document.documentElement.dataset.plan = t; else delete document.documentElement.dataset.plan; }
  };
  const trimLog = log => Object.fromEntries(Object.entries(log || {}).slice(0, 12).map(([k, v]) => [String(k).slice(0, 20), (Array.isArray(v) ? v : []).slice(0, 60).map(s => ({ at: +s.at || 0, v: +s.v || 0, ...(s.k ? { k: String(s.k).slice(0, 24) } : {}) }))]));
  const passFor = feature => CONFIG.passes.find(p => p.feature === feature);
  const KEY_USERS = 'pm_users', KEY_SESSION = 'pm_session', KEY_PLAN = 'pm_plan';
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const uid = p => p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { /* listener error */ } });

  async function hash(pw, salt) {
    try {
      if (window.crypto && crypto.subtle) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 60000, hash: 'SHA-256' }, key, 256);
        return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* fall through */ }
    let h = 5381; const s = salt + pw; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;   // weak fallback (demo only)
    return 'weak' + (h >>> 0).toString(16);
  }

  const allUsers = () => read(KEY_USERS, {});
  const saveUser = u => { const all = allUsers(); all[u.id] = u; write(KEY_USERS, all); try { localStorage.setItem(KEY_PLAN, u.plan.tier); } catch (e) { /* storage unavailable */ } applyTheme(u.plan.tier); };
  const applyTheme = PLAN.applyTheme;
  const allowance = u => PLAN.cfg(u).dailyCredits;

  /* refill daily credits, expire plans / passes. Returns true if the record changed. */
  function normalize(u) {
    let changed = false; const now = Date.now();
    if (PLAN.paid(u.plan.tier) && u.plan.renewsAt && now > u.plan.renewsAt) { u.plan = { tier: 'free', lapsedAt: now }; changed = true; }
    if (!u.extras) { u.extras = { watchlist: [], profiles: [], memory: null }; changed = true; }
    if (u.pass !== undefined) { u.passes = u.passes || {}; if (u.pass && u.pass.until) u.passes.recommendation = u.pass.until; delete u.pass; changed = true; }   // older demo accounts had one "Credit Pass"
    if (!u.passes) { u.passes = {}; changed = true; }
    Object.keys(u.passes).forEach(f => { if (now > u.passes[f]) { delete u.passes[f]; changed = true; } });
    if (u.credits.date !== today()) { u.credits.date = today(); u.credits.daily = allowance(u); changed = true; }
    return changed;
  }
  const clean = u => { if (!u) return null; const { pwHash, salt, ...rest } = u; return JSON.parse(JSON.stringify(rest)); };
  function current() {
    const id = read(KEY_SESSION, null); if (!id) return null;
    const u = allUsers()[id]; if (!u) return null;
    if (normalize(u)) saveUser(u);
    return u;
  }
  const passActive = (u, feature) => !!(u.passes && u.passes[feature] && Date.now() < u.passes[feature]);

  const PMBackend = window.PMBackend = {
    CONFIG,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signUp({ name, email, password }) {
      await delay(450);
      email = String(email || '').trim().toLowerCase(); name = String(name || '').trim();
      if (!name) throw new Error('Please enter your name.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Please enter a valid email address.');
      if (String(password || '').length < 8) throw new Error('Use a password with at least 8 characters.');
      const all = allUsers();
      if (Object.values(all).some(u => u.email === email)) throw new Error('An account with that email already exists. Try signing in.');
      const salt = uid('s');
      const u = { id: uid('u'), name, email, salt, pwHash: await hash(password, salt), createdAt: Date.now(), onboarded: false,
        prefs: { games: [], weight: 'any', grip: 'any', connection: 'any' },
        plan: { tier: 'free' }, credits: { date: today(), daily: CONFIG.free.dailyCredits, purchased: 0 }, passes: {}, orders: [], history: [],
        extras: { watchlist: [], profiles: [], memory: null } };
      saveUser(u); write(KEY_SESSION, u.id); emit();
      return clean(u);
    },
    async signIn({ email, password }) {
      await delay(400);
      email = String(email || '').trim().toLowerCase();
      const u = Object.values(allUsers()).find(x => x.email === email);
      if (!u || (await hash(password || '', u.salt)) !== u.pwHash) throw new Error('Email or password is incorrect.');
      write(KEY_SESSION, u.id); normalize(u); saveUser(u); emit();
      return clean(u);
    },
    async signOut() { try { localStorage.removeItem(KEY_SESSION); localStorage.removeItem(KEY_PLAN); } catch (e) { /* noop */ } applyTheme('free'); emit(); },
    async deleteAccount() { const u = current(); if (!u) return; const all = allUsers(); delete all[u.id]; write(KEY_USERS, all); await PMBackend.signOut(); },

    getUser() { return clean(current()); },
    tier() { return PLAN.tierOf(current()); },
    has(feature) { return PLAN.has(current(), feature); },
    turbo() { const u = current(); return { active: !!(u && u.turboUntil > Date.now()), until: (u && u.turboUntil) || null }; },
    /* Ultra extras: watchlist [{id, price, at}], saved profiles [{name, prefs}], assistant memory (prefs object) */
    async updateExtras(patch) {
      const u = current(); if (!u) throw new Error('Please sign in first.');
      const need = { watchlist: 'watchlist', profiles: 'profiles', memory: 'memory', testLog: 'testLog' };
      Object.keys(patch).forEach(k => { if (need[k] && !PLAN.has(u, need[k])) { const e = new Error('That’s a ProMouser Ultra feature.'); e.code = 'NEEDS_ULTRA'; throw e; } });
      const C = CONFIG.ultra;
      if (patch.watchlist) u.extras.watchlist = patch.watchlist.slice(0, C.maxWatch);
      if (patch.profiles) u.extras.profiles = patch.profiles.slice(0, C.maxProfiles);
      if ('memory' in patch) u.extras.memory = patch.memory;
      if (patch.testLog) u.extras.testLog = trimLog(patch.testLog);
      saveUser(u); emit(); return clean(u);
    },
    async updateProfile(patch) {
      const u = current(); if (!u) throw new Error('Not signed in.');
      if (patch.name != null) u.name = String(patch.name).trim() || u.name;
      if (patch.prefs) u.prefs = { ...u.prefs, ...patch.prefs };
      if (patch.onboarded != null) u.onboarded = !!patch.onboarded;
      saveUser(u); emit(); return clean(u);
    },

    /* credits ---------------------------------------------------------- */
    costPerRecommendation() { return PLAN.cfg(current()).costPerRecommendation; },
    resultsLimit() { return PLAN.cfg(current()).resultsLimit; },
    balance() {
      const u = current(); if (!u) return null;
      const recPass = passActive(u, 'recommendation');
      return { daily: u.credits.daily, purchased: u.credits.purchased, total: u.credits.daily + u.credits.purchased,
        passes: { ...u.passes }, recPass, recPassUntil: recPass ? u.passes.recommendation : null,
        dailyAllowance: allowance(u), resetsAt: (() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); })() };
    },
    /* Server-side in production: atomically check and deduct.
       reason = the feature being paid for; a pass for that feature makes it free. */
    async spend(cost, reason) {
      await delay(80);
      const u = current(); if (!u) throw new Error('Please sign in first.');
      if (passActive(u, reason)) return { charged: 0, pass: reason };
      if (reason === 'recommendation' && PLAN.has(u, 'freeRecs')) return { charged: 0, plan: 'ultra' };
      if (u.credits.daily + u.credits.purchased < cost) { const e = new Error('Not enough credits.'); e.code = 'NO_CREDITS'; throw e; }
      let left = cost; const fromDaily = Math.min(u.credits.daily, left); u.credits.daily -= fromDaily; left -= fromDaily; u.credits.purchased -= left;
      saveUser(u); emit(); return { charged: cost, reason };
    },
    async refund(cost) { const u = current(); if (!u || !cost) return; u.credits.purchased += cost; saveUser(u); emit(); },

    /* orders: called by the checkout once a payment has succeeded */
    async applyOrder(order) {
      const u = current(); if (!u) throw new Error('Please sign in first.');
      const now = Date.now();
      order.items.forEach(it => {
        const qty = it.qty || 1;
        if (it.type === 'credits') u.credits.purchased += it.credits * qty;
        if (it.type === 'pass') { const P = passFor(it.feature || 'recommendation'); const base = passActive(u, P.feature) ? u.passes[P.feature] : now; u.passes[P.feature] = base + P.days * DAY * qty; }
        if (it.type === 'basic' || it.type === 'lite' || it.type === 'ultra') {   // one-time: the plan is yours for life, and never downgrades
          if (PLAN.RANK[it.type] > PLAN.RANK[u.plan.tier] || (u.plan.tier === it.type && u.plan.renewsAt)) u.plan = { tier: it.type, since: u.plan.tier === it.type ? (u.plan.since || now) : now };
          u.credits.daily = Math.max(u.credits.daily, CONFIG[it.type].dailyCredits);
          if (it.type === 'ultra') u.turboUntil = Math.max(u.turboUntil || 0, now) + CONFIG.ultra.turboDays * DAY;
        }
        if (it.type === 'turbo') u.turboUntil = Math.max(u.turboUntil || 0, now) + CONFIG.turbo.product.days * DAY * qty;
      });
      u.orders.unshift(order); saveUser(u); emit(); return clean(u);
    },
    async cancelLite() { const u = current(); if (u && PLAN.paid(u.plan.tier)) { u.plan.cancelled = true; saveUser(u); emit(); } return clean(u); },   // cancels Lite or Ultra renewal
    async resumeLite() { const u = current(); if (u && PLAN.paid(u.plan.tier)) { delete u.plan.cancelled; saveUser(u); emit(); } return clean(u); },

    /* recommendation history */
    async saveCpsBest(seconds, cps) {   // shown on ProMouser Online profiles
      const u = current(); if (!u || !(cps > 0 && cps <= 40)) return;
      u.cpsBest = u.cpsBest || {};
      if (!(u.cpsBest[seconds] >= cps)) { u.cpsBest[seconds] = Math.round(cps * 100) / 100; saveUser(u); }
    },
    async addHistory(entry) { const u = current(); if (!u) return; u.history.unshift({ id: uid('r'), at: Date.now(), ...entry }); u.history = u.history.slice(0, PLAN.cfg(u).historyLimit || 12); saveUser(u); emit(); },
    newOrderId() { return uid('PM'); },

    /* developer tools (dev.js only loads on localhost). Same calls exist in Supabase mode, limited to developer accounts. */
    dev: {
      async setPlan(tier) {
        const u = current(); if (!u) throw new Error('Sign in first.');
        const now = Date.now();
        if (PLAN.paid(tier)) { u.plan = { tier, since: now }; u.credits.daily = Math.max(Math.min(u.credits.daily, CONFIG[tier].dailyCredits), CONFIG[tier].dailyCredits); }
        else { u.plan = { tier: 'free' }; u.credits.daily = Math.min(u.credits.daily, CONFIG.free.dailyCredits); }
        saveUser(u); emit(); return clean(u);
      },
      async setCredits({ daily, purchased }) {
        const u = current(); if (!u) throw new Error('Sign in first.');
        if (daily != null) u.credits.daily = Math.max(0, Math.round(daily));
        if (purchased != null) u.credits.purchased = Math.max(0, Math.round(purchased));
        saveUser(u); emit(); return clean(u);
      },
      async setPass(feature, days) {
        const u = current(); if (!u) throw new Error('Sign in first.');
        if (days > 0) u.passes[feature] = Date.now() + days * DAY; else delete u.passes[feature];
        saveUser(u); emit(); return clean(u);
      },
      async setTurbo(days) { const u = current(); if (!u) throw new Error('Sign in first.'); u.turboUntil = days > 0 ? Date.now() + days * DAY : null; saveUser(u); emit(); return clean(u); },
      async nextDay() { const u = current(); if (!u) return; u.credits.date = '2000-01-01'; normalize(u); saveUser(u); emit(); return clean(u); },
      async clear(what) { const u = current(); if (!u) return; if (what === 'history') u.history = []; if (what === 'orders') u.orders = []; if (what === 'onboarding') u.onboarded = false; saveUser(u); emit(); return clean(u); }
    }
  };

  // apply stored theme right away (the inline <head> script already did the first paint)
  const u0 = current(); applyTheme(u0 ? u0.plan.tier : 'free');
  addEventListener('storage', e => { if ([KEY_USERS, KEY_SESSION, KEY_PLAN].includes(e.key)) { const u = current(); applyTheme(u ? u.plan.tier : 'free'); emit(); } });
})();
