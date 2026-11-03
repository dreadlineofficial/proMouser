// End-to-end checks for ProMouser plans (Basic/Lite/Ultra), test statistics and Recommend/Hub modes (demo backend).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8777/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(p.url() + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(p.url() + ' ' + m.text()); });
  // 1. first visit: chooser, pick Hub
  await p.goto(BASE + './'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1300);
  ok(await p.isVisible('.mode-chooser'), 'mode chooser on first visit');
  await p.click('.mc-opt.hub'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.documentElement.dataset.mode) === 'hub', 'hub mode set');
  ok(await p.isVisible('#hub') && !(await p.isVisible('#hero')), 'hub hero shown, recommend hero hidden');
  ok(await p.isVisible('.nav-links a[href="my-stats"]') && !(await p.isVisible('.nav-rec')), 'hub nav (My stats shown, Recommend hidden)');
  ok(await p.$$eval('.hub-test', a => a.length) === 8 && await p.$$eval('.hub-lead', a => a.length) >= 6 && await p.isVisible('.motd-specs'), 'hub tests, leaders, mouse of the day');
  await p.fill('[data-hub-search] input', 'wireless under 60 g'); await p.waitForTimeout(200);
  const res = await p.$$eval('.hub-results a', a => a.map(x => x.textContent));
  ok(res.length > 0, 'hub search finds light wireless mice: ' + res.slice(0, 2).join(' | '));
  await p.reload(); await p.waitForTimeout(1200);
  ok(!(await p.$('.mode-chooser')) && await p.evaluate(() => document.documentElement.dataset.mode) === 'hub', 'mode persists, no chooser after');
  await p.click('.mode-toggle'); await p.waitForTimeout(300);
  ok(await p.isVisible('#hero') && !(await p.isVisible('#hub')), 'switch back to Recommend from the top bar');
  // 2. hub assistant copy + ?q
  await p.evaluate(() => localStorage.setItem('pm_mode', 'hub'));
  await p.goto(BASE + 'mouse-ai?q=How%20heavy%20is%20the%20Viper%20V3%20Pro%3F'); await p.waitForTimeout(1800);
  ok((await p.textContent('#assistant .section-label')) === 'ProMouser AI', 'assistant is called ProMouser AI');
  ok(/\d+\s*g/.test(await p.textContent('#asstLog')), 'assistant answered the ?q question');
  // 2b. CPS truth + GM320
  await p.goto(BASE + 'mice'); await p.waitForTimeout(600);
  ok(await p.$$eval('[data-catalog] .mouse-card', a => a.length) === 40 && !!(await p.$('[data-catalog] [data-id="kreo-hawk"]')), 'catalogue has 40 mice including the GM320 and Kreo Hawk');
  ok(!(await p.$('[data-catalog] .cps3, [data-catalog] .mouse-card [data-cps=""]')), 'the CPS test no longer takes over a mouse card');
  const dc = await p.evaluate(() => PM.MICE.filter(m => m.cps.verified).map(m => m.id).sort().join(','));
  ok(dc === 'ant-esports-gm320,attack-shark-x3,bloody-a70,glorious-model-d,glorious-model-o,glorious-model-o-minus,hyperx-pulsefire-haste-2', 'exactly the 7 verified double-clickers: ' + dc);
  const mc = await p.evaluate(() => PM.recommend({ games: ['minecraft'], mcVersion: '1.8', weight: 'any', grip: 'any', connection: 'any' }).slice(0, 6).map(r => r.m.cps.verified));
  ok(mc.every(Boolean), 'top 6 recommendations for 1.8 PvP are all double-clickers');
  await p.goto(BASE + 'mice/logitech-g102-lightsync'); await p.waitForTimeout(500);
  ok(/Can’t double-click/.test(await p.textContent('#cps')) && !/Not verified by ProMouser/.test(await p.content()), 'G102 page says it can’t double-click');
  await p.goto(BASE + 'mice/ant-esports-gm320'); await p.waitForTimeout(500);
  ok(/498/.test(await p.textContent('.hero-quick')) && /amazon\.in/.test(await p.getAttribute('#buy a.btn', 'href')), 'GM320 page with ₹498 and an Amazon link');
  await p.goto(BASE + 'mice/minecraft'); await p.waitForTimeout(500);
  ok(await p.$$eval('#verified .mouse-card', a => a.length) === 5 && !!(await p.$('#capped')), 'Minecraft page: verified list + capped explainer');
  // 2c. ProMouser AI credits: guests 3 a day, 1 credit = 5 questions, Ultra unlimited
  await p.goto(BASE + 'mouse-ai'); await p.evaluate(() => { localStorage.removeItem('pm_ai_meter'); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(800);
  for (let i = 0; i < 4; i++) { await p.fill('#asstInput', 'how heavy is the G102'); await p.press('#asstInput', 'Enter'); await p.waitForTimeout(1000); }
  ok(/free questions/.test(await p.textContent('#asstLog')), 'guest is asked to sign in after 3 questions');
  // 3. Basic
  await p.goto(BASE + './?nochooser'); await p.waitForTimeout(600);
  await p.evaluate(() => PMBackend.signUp({ name: 'Tester', email: 't' + Date.now() + '@x.com', password: 'longenough' }));
  await p.evaluate(() => PMBackend.updateProfile({ onboarded: true }));
  await p.evaluate(() => PMBackend.applyOrder({ id: 'T1', createdAt: Date.now(), total: 599, items: [{ ...PM_CONFIG.basic.product }] }));
  const s1 = await p.evaluate(() => ({ t: PMBackend.tier(), d: PMBackend.balance().daily, lim: PMBackend.resultsLimit(), bd: PMBackend.has('breakdown'), adv: PMBackend.has('advanced'), theme: document.documentElement.dataset.plan || '' }));
  ok(s1.t === 'basic' && s1.d === 7 && s1.lim === 5 && s1.bd && !s1.adv && s1.theme === 'basic', 'Basic: 7 credits, top 5, breakdown, no advanced, navy theme ' + JSON.stringify(s1));
  await p.goto(BASE + 'recommendations'); await p.waitForTimeout(1000);
  await p.evaluate(() => { const c = document.querySelector('#recsForm input[name="games"][value="fps"]'); if (c && !c.checked) c.click(); });
  await p.click('#genBtn'); await p.waitForSelector('.result-card', { timeout: 15000 }); await p.waitForTimeout(800);
  const nCards = await p.$$eval('.result-card', a => a.length), nBk = await p.$$eval('.result-card details.breakdown', a => a.length);
  ok(nCards === 5 && nBk === 5, `Basic run shows 5 matches with breakdowns (${nCards}/${nBk})`);
  ok(!!(await p.$('#caPick')), 'check-any-mouse picker available on Basic');
  await p.selectOption('#caPick', { index: 3 }); await p.waitForTimeout(200);
  ok(/would rank/.test(await p.textContent('#caOut')), 'check-any-mouse shows a rank: ' + (await p.textContent('#caOut .ca-res span')).trim());
  ok(await p.evaluate(() => PMBackend.balance().daily) === 6, 'a Basic run costs 1 credit');
  await p.goto(BASE + 'mouse-ai'); await p.waitForTimeout(800);
  const c0 = await p.evaluate(() => PMBackend.balance().total);
  for (let i = 0; i < 6; i++) { await p.fill('#asstInput', 'what is the polling rate of the Model O'); await p.press('#asstInput', 'Enter'); await p.waitForTimeout(950); }
  const c1 = await p.evaluate(() => PMBackend.balance().total);
  ok(c0 - c1 === 2, `6 AI questions used 2 credits (${c0} → ${c1})`);
  ok(/question/.test(await p.textContent('#aiMeter')), 'AI credit meter shown: ' + (await p.textContent('#aiMeter')).trim());
  // 4. Lite sees bests, Ultra gets stats
  await p.evaluate(() => PMBackend.applyOrder({ id: 'T2', createdAt: Date.now(), total: 2499, items: [{ ...PM_CONFIG.lite.product }] }));
  await p.goto(BASE + 'reaction-test'); await p.waitForTimeout(800);
  await p.evaluate(() => { [260, 241, 233].forEach((v, i) => setTimeout(() => PMStats.record('reaction', v, '5 rounds'), i * 5)); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.dataset.plan) === 'lite' && await p.isVisible('[data-tstats="reaction"] .ts-lock') && /233/.test(await p.textContent('[data-tstats="reaction"]')), 'Lite: personal best + Ultra lock on test stats');
  await p.evaluate(() => PMBackend.applyOrder({ id: 'T3', createdAt: Date.now(), total: 3199, items: [{ ...PM_CONFIG.ultra.product }] }));
  const s3 = await p.evaluate(() => ({ t: PMBackend.tier(), d: PMBackend.balance().daily, turbo: Math.round((PMBackend.turbo().until - Date.now()) / 864e5), cost: PMBackend.costPerRecommendation() }));
  await p.goto(BASE + 'mouse-ai'); await p.waitForTimeout(800);
  const u0 = await p.evaluate(() => PMBackend.balance().total);
  for (let i = 0; i < 6; i++) { await p.fill('#asstInput', 'lightest wireless mice'); await p.press('#asstInput', 'Enter'); await p.waitForTimeout(950); }
  ok(await p.evaluate(() => PMBackend.balance().total) === u0 && /Unlimited/.test(await p.textContent('#aiMeter')), 'Ultra: ProMouser AI is unlimited');
  await p.goto(BASE + 'reaction-test'); await p.waitForTimeout(600);
  ok(s3.t === 'ultra' && s3.d === 30 && s3.turbo === 365 && s3.cost === 0, 'Ultra: 30 credits, 365 days of Turbo, free recs ' + JSON.stringify(s3));
  await p.evaluate(() => PMStats.record('reaction', 228, '5 rounds')); await p.waitForTimeout(1300);
  ok(await p.isVisible('[data-tstats="reaction"] .ts-chart') && await p.$$eval('[data-tstats="reaction"] .ts-tiles > div', a => a.length) >= 6, 'Ultra: full statistics panel with chart and tiles');
  ok((await p.evaluate(() => (PMBackend.getUser().extras.testLog.reaction || []).length)) >= 4, 'Ultra: sessions saved to the account');
  await p.evaluate(() => PMBackend.applyOrder({ id: 'T4', createdAt: Date.now(), total: 2499, items: [{ ...PM_CONFIG.lite.product }] }));
  ok(await p.evaluate(() => PMBackend.tier()) === 'ultra', 'buying Lite never downgrades Ultra');
  // 5. pages render without errors
  for (const pg of ['shop', 'basic', 'lite', 'ultra', 'my-stats', 'tests', 'cps-test', 'aim-trainer', 'double-click-test', 'scroll-test', 'mouse-button-test', 'polling-rate-test', 'account', 'elite', 'mice', 'mice/compare', 'blog/']) { await p.goto(BASE + pg); await p.waitForTimeout(500); }
  await p.goto(BASE + 'shop'); await p.waitForTimeout(600);
  ok(await p.$$eval('.shop-hero', a => a.length) === 5, 'shop shows Basic, Lite, Ultra, Turbo, Pass');
  await p.goto(BASE + 'my-stats'); await p.waitForTimeout(600);
  ok(await p.$$eval('[data-tstats] .ts-head', a => a.length) === 7, 'My stats shows all 7 tests');
  ok(errs.length === 0, 'no console errors' + (errs.length ? ':\n  ' + errs.slice(0, 8).join('\n  ') : ''));
  await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
