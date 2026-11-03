/* =====================================================================
   ProMouser: Supabase backend

   Switches on only when supabase-config.js has a url and key. It replaces
   the demo window.PMBackend with the same methods, so the rest of the site
   doesn't change. The database side is supabase/schema.sql.

   How it works
   - The Supabase library (vendor/supabase-2.117.3.js) loads only in this mode.
   - Some UI calls are synchronous (getUser, balance…). Those read a cached
     copy of the signed-in user (localStorage pm_sb_user). The cache refreshes
     from the server on page load, on sign-in, and after each change, and
     listeners (PMBackend.on) fire when it does.
   - Credits are spent by the spend_credits() database function. The cache is
     only for display; the server is always the source of truth.
   ===================================================================== */
(function () {
  'use strict';
  const SB = window.PM_SUPABASE || {};
  if (!SB.url || !SB.anonKey || !window.PMBackend) return;   // not configured → keep the demo backend

  const demo = window.PMBackend, CONFIG = demo.CONFIG;
  const LIB = 'vendor/supabase-2.117.3.js';
  const KEY_CACHE = 'pm_sb_user', KEY_PLAN = 'pm_plan', KEY_THEME = 'pm_theme';
  const IST = 330 * 60000;   // daily credits reset at midnight India time (matches pm_today() in schema.sql)

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
  const ms = t => (t ? Date.parse(t) : null);
  const todayIST = () => new Date(Date.now() + IST).toISOString().slice(0, 10);
  const nextMidnightIST = () => { const d = new Date(Date.now() + IST); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - IST; };
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { /* listener error */ } });
  const fail = (msg, code) => { const e = new Error(msg); if (code) e.code = code; return e; };

  const PLAN = window.PM_PLAN, applyTheme = PLAN.applyTheme;
  const OAUTH_PROVIDERS = ['google', 'discord'];

  let user = read(KEY_CACHE, null);
  function setUser(u) {
    const before = JSON.stringify(user);
    user = u;
    write(KEY_CACHE, u); write(KEY_PLAN, u ? u.plan.tier : null);
    write(KEY_THEME, u && u.prefs && u.prefs.theme || 'plan');
    applyTheme(u ? u.plan.tier : 'free', u && u.prefs && u.prefs.theme);
    if (JSON.stringify(u) !== before) emit();
  }
  applyTheme(user ? user.plan.tier : 'free', user && user.prefs && user.prefs.theme);

  /* ---------- load the library and create the client ---------- */
  const ready = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = (document.documentElement.dataset.root || '') + LIB;
    s.onload = () => resolve(window.supabase.createClient(SB.url, SB.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }));
    s.onerror = () => reject(fail('Could not load the sign-in service. Check your connection and refresh.'));
    document.head.appendChild(s);
  });
  ready.then(c => {
    // never await Supabase calls inside this callback (it can deadlock), so refresh on the next tick
    c.auth.onAuthStateChange((event, session) => {
      if (!session) { if (user) setUser(null); return; }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') setTimeout(() => refresh().catch(() => { /* keep cache */ }));
    });
  }).catch(() => { /* reported when a method is used */ });

  function toUser(s, orders, runs, authUser) {
    const paid = PLAN.paid(s.plan), passes = {}, ex = s.extras || {};
    Object.entries(s.passes || {}).forEach(([f, t]) => { if (ms(t) > Date.now()) passes[f] = ms(t); });
    return {
      id: s.id, name: s.name, username: s.username, bio: s.bio || '', location: s.location || '',
      website: s.website || '', avatarUrl: s.avatar_url || null,
      identities: (authUser && authUser.identities || []).map(i => ({
        provider: i.provider,
        label: i.identity_data && (i.identity_data.preferred_username || i.identity_data.user_name || i.identity_data.full_name || i.identity_data.name) || ''
      })),
      email: s.email, createdAt: ms(s.created_at), onboarded: !!s.onboarded,
      prefs: Object.assign({ games: [], weight: 'any', grip: 'any', connection: 'any' }, s.prefs || {}),
      plan: paid ? Object.assign({ tier: s.plan, since: ms(s.plan_since), renewsAt: ms(s.plan_renews_at) }, s.plan_cancelled ? { cancelled: true } : {}) : { tier: 'free' },
      extras: { watchlist: ex.watchlist || [], profiles: ex.profiles || [], memory: ex.memory || null, testLog: ex.testLog || {}, ui: ex.ui || null },
      turboUntil: ms(s.turbo_until), cpsBest: s.cps_best || {}, progress: s.progress || {},
      credits: { date: s.credits.date, daily: s.credits.daily, purchased: s.credits.purchased },
      passes,
      orders: orders.map(o => ({ id: o.id, createdAt: ms(o.created_at), items: o.items, total: o.total_inr, method: o.provider, status: o.status, paymentId: o.provider_payment_id })),
      history: runs.map(r => Object.assign({}, r.data, { id: r.id, at: ms(r.created_at) }))
    };
  }

  async function refresh() {
    const c = await ready;
    const { data: { session } } = await c.auth.getSession();
    if (!session) { setUser(null); return null; }
    const [auth, st, ord, runs] = await Promise.all([
      c.auth.getUser(),
      c.rpc('get_my_state'),
      c.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
      c.from('recommendation_runs').select('id, data, created_at').order('created_at', { ascending: false }).limit(100)
    ]);
    if (auth.error) throw fail(friendly(auth.error));
    if (st.error) throw fail(friendly(st.error));
    setUser(toUser(st.data, ord.data || [], runs.data || [], auth.data.user));
    return user;
  }

  function friendly(error) {
    const m = String((error && error.message) || error || '');
    if (/Invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email first. The link is in your inbox.';
    if (/already registered|already exists/i.test(m)) return 'An account with that email already exists. Try signing in.';
    if (/Password should be/i.test(m)) return m;
    if (/profiles_username_lower_(?:key|idx)/i.test(m)) return 'That username is already taken.';
    if (/profiles_(bio|location|website|avatar_url|username)_check/i.test(m)) return 'One of your profile fields is invalid. Check the limits and try again.';
    if (/provider.*not enabled|unsupported provider/i.test(m)) return 'Enable this sign-in provider in your Supabase Authentication settings first.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a minute and try again.';
    if (/NOT_SIGNED_IN|JWT/i.test(m)) return 'Please sign in again.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Can’t reach the server. Check your connection.';
    return 'Something went wrong. Please try again.';
  }
  const clone = u => (u ? JSON.parse(JSON.stringify(u)) : null);
  const need = () => { if (!user) throw fail('Please sign in first.'); return user; };

  const passActive = feature => !!(user && user.passes && user.passes[feature] && Date.now() < user.passes[feature]);
  const allowance = () => PLAN.cfg(user).dailyCredits;

  const PMBackend = window.PMBackend = {
    CONFIG, mode: 'supabase', ready, refresh,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signUp({ name, email, password }) {
      email = String(email || '').trim().toLowerCase(); name = String(name || '').trim().slice(0, 60);
      if (!name) throw fail('Please enter your name.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw fail('Please enter a valid email address.');
      if (String(password || '').length < 8) throw fail('Use a password with at least 8 characters.');
      const c = await ready;
      const redirect = new URL((document.documentElement.dataset.root || '') + 'account', location.href).href;
      const { data, error } = await c.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirect } });
      if (error) throw fail(friendly(error));
      // email confirmation is on: no session until they click the link
      if (!data.session) throw fail(`Almost done! We sent a confirmation link to ${email}. Open it, then sign in.`, 'CONFIRM_EMAIL');
      return clone(await refresh());
    },
    async signIn({ email, password }) {
      const c = await ready;
      const { error } = await c.auth.signInWithPassword({ email: String(email || '').trim().toLowerCase(), password: String(password || '') });
      if (error) throw fail(friendly(error));
      return clone(await refresh());
    },
    async signInWithProvider(provider) {
      if (!OAUTH_PROVIDERS.includes(provider)) throw fail('That sign-in provider is not supported.');
      const c = await ready;
      const redirectTo = new URL((document.documentElement.dataset.root || '') + 'account', location.href).href;
      const { error } = await c.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) throw fail(friendly(error));
    },
    async signOut() { const c = await ready; await c.auth.signOut({ scope: 'local' }); setUser(null); },
    async deleteAccount() {
      const u = need(), c = await ready;
      if (u.avatarUrl) {
        const { error: avatarError } = await c.storage.from('avatars').remove([`${u.id}/profile.jpg`]);
        if (avatarError) throw fail(friendly(avatarError));
      }
      const { error } = await c.rpc('delete_my_account');
      if (error) throw fail(friendly(error));
      await c.auth.signOut({ scope: 'local' }); setUser(null);
    },

    getUser() { return clone(user); },
    tier() { return PLAN.tierOf(user); },
    has(feature) { return PLAN.has(user, feature); },
    turbo() { return { active: !!(user && user.turboUntil > Date.now()), until: (user && user.turboUntil) || null }; },
    async updateExtras(patch) {
      const u = need();
      for (const k of Object.keys(patch)) if (!PLAN.has(u, k)) throw fail('That’s a ProMouser Ultra feature.', 'NEEDS_ULTRA');
      const C = CONFIG.ultra, ex = Object.assign({}, u.extras);
      if (patch.watchlist) ex.watchlist = patch.watchlist.slice(0, C.maxWatch);
      if (patch.profiles) ex.profiles = patch.profiles.slice(0, C.maxProfiles);
      if ('memory' in patch) ex.memory = patch.memory;
      if (patch.ui) ex.ui = Object.fromEntries(Object.entries(patch.ui).filter(([k, v]) => v != null && ['accent', 'bg', 'glow', 'density', 'custom'].includes(k)).map(([k, v]) => [k, String(v).slice(0, 16)]));
      if (patch.testLog) ex.testLog = Object.fromEntries(Object.entries(patch.testLog).slice(0, 12).map(([k, v]) => [k, (v || []).slice(0, 60)]));
      setUser(Object.assign(clone(u), { extras: ex }));   // show it straight away
      const { error } = await (await ready).from('profiles').update({ extras: ex }).eq('id', u.id);
      if (error) { await refresh().catch(() => {}); throw fail(/NEEDS_ULTRA/.test(error.message) ? 'That’s a ProMouser Ultra feature.' : friendly(error), 'NEEDS_ULTRA'); }
      return clone(user);
    },
    async updateProgress(p) {
      const u = need(); const prog = JSON.parse(JSON.stringify(p || {}));
      user = Object.assign(clone(u), { progress: prog }); write(KEY_CACHE, user);
      const { error } = await (await ready).from('profiles').update({ progress: prog }).eq('id', u.id);
      if (error) throw fail(friendly(error));
      return clone(user);
    },
    async updateProfile(patch) {
      const u = need(), row = {};
      if (patch.name != null) {
        row.name = String(patch.name).trim();
        if (!row.name || row.name.length > 60) throw fail('Your name must be between 1 and 60 characters.');
      }
      if (patch.username != null) {
        row.username = String(patch.username).trim().replace(/^@/, '').toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(row.username)) throw fail('Your username must be 3–20 letters, numbers, or underscores.');
      }
      if (patch.bio != null) {
        row.bio = String(patch.bio).trim();
        if (row.bio.length > 240) throw fail('Your bio must be 240 characters or fewer.');
      }
      if (patch.location != null) {
        row.location = String(patch.location).trim();
        if (row.location.length > 80) throw fail('Your location must be 80 characters or fewer.');
      }
      if (patch.website != null) {
        row.website = String(patch.website).trim();
        if (row.website.length > 300) throw fail('Your website URL is too long.');
        if (row.website) {
          try { if (!['http:', 'https:'].includes(new URL(row.website).protocol)) throw new Error(); }
          catch (e) { throw fail('Enter a valid website URL beginning with http:// or https://.'); }
        }
      }
      if (patch.avatarUrl !== undefined) {
        const avatarUrl = patch.avatarUrl || null;
        const isGif = typeof avatarUrl === 'string' && (/^data:image\/gif;base64,/i.test(avatarUrl) || /\/profile\.gif(?:[?#]|$)/i.test(avatarUrl));
        if (isGif && !PLAN.has(u, 'animatedAvatar')) throw fail('Animated profile GIFs are available with ProMouser Ultra.', 'NEEDS_ULTRA');
        row.avatar_url = avatarUrl;
      }
      if (patch.prefs) {
        if (patch.prefs.theme != null) {
          if (!PLAN.has(u, 'advanced')) throw fail('Custom themes are available with ProMouser Lite and Ultra.', 'NEEDS_LITE');
          if (!PLAN.themes.some(theme => theme.id === patch.prefs.theme)) throw fail('Choose a supported theme.');
        }
        row.prefs = Object.assign({}, u.prefs, patch.prefs);
      }
      if (patch.onboarded != null) row.onboarded = !!patch.onboarded;
      setUser(Object.assign(clone(u), row));   // show the change straight away
      const { error } = await (await ready).from('profiles').update(row).eq('id', u.id);
      if (error) { await refresh().catch(() => {}); throw fail(friendly(error)); }
      return clone(await refresh());
    },
    async uploadAvatar(file) {
      const u = need();
      const isGif = file && file.type === 'image/gif';
      if (!isGif && (!file || file.type !== 'image/jpeg')) throw fail('Choose a JPEG or GIF profile photo.');
      if (isGif && !PLAN.has(u, 'animatedAvatar')) throw fail('Animated profile GIFs are available with ProMouser Ultra.', 'NEEDS_ULTRA');
      if (file.size > (isGif ? 1024 * 1024 : 500 * 1024)) throw fail(isGif ? 'Animated profile GIFs must be 1 MB or smaller.' : 'Choose a smaller JPEG profile photo.');
      const c = await ready;
      const path = `${u.id}/profile.${isGif ? 'gif' : 'jpg'}`;
      const { error } = await c.storage.from('avatars').upload(path, file, {
        upsert: true, contentType: isGif ? 'image/gif' : 'image/jpeg', cacheControl: '3600'
      });
      if (error) throw fail(friendly(error));
      const { data } = c.storage.from('avatars').getPublicUrl(path);
      const result = await PMBackend.updateProfile({ avatarUrl: `${data.publicUrl}?v=${Date.now()}` });
      const { error: cleanupError } = await c.storage.from('avatars').remove([`${u.id}/profile.${isGif ? 'jpg' : 'gif'}`]);
      if (cleanupError) throw fail(`Profile photo updated, but the previous photo could not be removed: ${friendly(cleanupError)}`);
      return result;
    },
    async removeAvatar() {
      const u = need();
      const c = await ready;
      await PMBackend.updateProfile({ avatarUrl: null });
      const { error } = await c.storage.from('avatars').remove([`${u.id}/profile.jpg`, `${u.id}/profile.gif`]);
      if (error) throw fail(friendly(error));
      return clone(user);
    },
    async linkIdentity(provider) {
      need();
      if (!OAUTH_PROVIDERS.includes(provider)) throw fail('That sign-in provider is not supported.');
      const c = await ready;
      const redirectTo = new URL((document.documentElement.dataset.root || '') + 'account', location.href).href;
      const { error } = await c.auth.linkIdentity({ provider, options: { redirectTo } });
      if (error) throw fail(friendly(error));
    },
    async unlinkIdentity(provider) {
      need();
      const c = await ready;
      const { data, error: userError } = await c.auth.getUser();
      if (userError) throw fail(friendly(userError));
      const identities = data.user.identities || [];
      const identity = identities.find(i => i.provider === provider);
      if (!identity) throw fail('That account is not connected.');
      if (identities.length <= 1) throw fail('Connect another sign-in method before disconnecting this account.');
      const { error } = await c.auth.unlinkIdentity(identity);
      if (error) throw fail(friendly(error));
      return clone(await refresh());
    },

    /* credits ---------------------------------------------------------- */
    costPerRecommendation() { return PLAN.cfg(user).costPerRecommendation; },
    resultsLimit() { return PLAN.cfg(user).resultsLimit; },
    balance() {
      if (!user) return null;
      // the server refills on its next call; show the refilled number already
      const daily = user.credits.date === todayIST() ? user.credits.daily : Math.max(user.credits.daily, allowance());
      const recPass = passActive('recommendation');
      return { daily, purchased: user.credits.purchased, total: daily + user.credits.purchased, passes: { ...user.passes }, recPass,
        recPassUntil: recPass ? user.passes.recommendation : null, dailyAllowance: allowance(), resetsAt: nextMidnightIST() };
    },
    async spend(cost, reason) {
      need();
      const { data, error } = await (await ready).rpc('spend_credits', { p_feature: reason || 'recommendation' });
      if (error) {
        if (/NO_CREDITS/.test(error.message)) { refresh().catch(() => {}); throw fail('Not enough credits.', 'NO_CREDITS'); }
        throw fail(friendly(error));
      }
      await refresh();
      return { charged: data.charged, pass: data.pass, reason };
    },
    // Spends are final on the server (a browser can't be trusted to refund itself).
    async refund() { /* no-op in Supabase mode */ },

    /* orders: called by the checkout once a payment has succeeded */
    async applyOrder(order) {
      need();
      const c = await ready;
      const ids = [];
      order.items.forEach(it => { for (let i = 0; i < (it.qty || 1); i++) ids.push(it.id); });
      if (SB.testPayments) {
        const { error } = await c.rpc('test_grant_order', { p_order: order.id, p_products: ids });
        if (error) throw fail(/Could not find the function|does not exist/i.test(error.message) ? 'Test payments are off: run supabase/test-payments.sql or set testPayments to false.' : friendly(error));
        return clone(await refresh());
      }
      // Real payments: the Razorpay webhook grants the order on the server. Wait for it to show up.
      for (let i = 0; i < 15; i++) {
        await refresh();
        if (user.orders.some(o => o.id === order.id)) return clone(user);
        await new Promise(r => setTimeout(r, 2000));
      }
      throw fail('Payment received, but your order is still processing. It will appear in your account shortly.');
    },
    async cancelLite() { return setCancelled(true); },
    async resumeLite() { return setCancelled(false); },

    /* recommendation history */
    async saveCpsBest(seconds, cps) {   // shown on ProMouser Online profiles
      if (!user) return;
      const { data, error } = await (await ready).rpc('save_cps_best', { p_seconds: seconds, p_cps: cps });
      if (!error && data) user.cpsBest = data;
    },
    async addHistory(entry) {
      need();
      const { error } = await (await ready).from('recommendation_runs').insert({ data: entry });
      if (error) return;   // history is nice-to-have; don't break the results
      await refresh().catch(() => {});
    },
    newOrderId() { return demo.newOrderId(); },

    /* developer tools: need supabase/dev-tools.sql and your account in public.developers */
    dev: {
      setPlan: tier => devCall('dev_set_plan', { p_tier: tier }),
      setTurbo: days => devCall('dev_set_turbo', { p_days: days }),
      setCredits: ({ daily = null, purchased = null }) => devCall('dev_set_credits', { p_daily: daily, p_purchased: purchased }),
      setPass: (feature, days) => devCall('dev_set_pass', { p_feature: feature, p_days: days }),
      nextDay: () => devCall('dev_next_day', {}),
      clear: what => devCall('dev_clear', { p_what: what })
    }
  };
  async function devCall(fn, args) {
    need();
    const { error } = await (await ready).rpc(fn, args);
    if (error) throw fail(/NOT_A_DEVELOPER/.test(error.message) ? 'This account isn’t a developer. Add it to public.developers (see supabase/dev-tools.sql).'
      : /Could not find the function|does not exist/i.test(error.message) ? 'Run supabase/dev-tools.sql to enable dev tools in Supabase mode.' : friendly(error));
    return clone(await refresh());
  }

  async function setCancelled(v) {
    const u = need();
    if (!PLAN.paid(u.plan.tier)) return clone(u);
    const { error } = await (await ready).from('profiles').update({ plan_cancelled: v }).eq('id', u.id);
    if (error) throw fail(friendly(error));
    return clone(await refresh());
  }

  // other tabs: follow sign-in / sign-out and plan changes
  addEventListener('storage', e => { if ([KEY_CACHE, KEY_THEME].includes(e.key)) { user = read(KEY_CACHE, null); applyTheme(user ? user.plan.tier : 'free', user && user.prefs && user.prefs.theme); emit(); } });
})();
