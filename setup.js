/* =====================================================================
   ProMouser: My setup (setup.html)
   Your mouse, DPI, game sensitivity, mousepad, monitor, grip and hand.
   Shows eDPI and cm/360, whether your pad fits your sensitivity, how
   well your mouse fits your hand and grip, and practical tips.
   Saved to the account (prefs.setup) or this browser (pm_setup).
   ===================================================================== */
(() => {
  'use strict';
  const host = document.querySelector('[data-setup]'), PM = window.PM, B = window.PMBackend;
  if (!host || !PM) return;
  const root = document.documentElement.dataset.root || '';
  const { esc, inr, num } = PM, $ = (s, r = host) => r.querySelector(s);
  // degrees turned per count at sensitivity 1 (the game's "yaw")
  const GAMES = { cs2: ['CS2', .022], valorant: ['Valorant', .07], apex: ['Apex Legends', .022], ow2: ['Overwatch 2', .0066], tf2: ['TF2', .022], minecraft: ['Minecraft', null], other: ['Other', null] };
  const KEY = 'pm_setup', MICE = PM.MICE.slice().sort((a, b) => a.name.localeCompare(b.name));
  const read = () => { const u = B && B.getUser ? B.getUser() : null; if (u && u.prefs && u.prefs.setup) return u.prefs.setup; try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const S = Object.assign({ mouse: '', dpi: 800, game: 'valorant', sens: .35, pad: 45, hz: 144, grip: 'any', hand: '' }, read() || {});
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`;

  host.innerHTML = `<div class="su-grid">
    <form class="panel su-form" id="suForm"><h3>Your gear</h3>
      <label><span>Mouse</span><select name="mouse">${opt('', 'Not listed / other', S.mouse)}${MICE.map(m => opt(m.id, m.name, S.mouse)).join('')}</select></label>
      <div class="su-row"><label><span>DPI</span><input name="dpi" type="number" min="100" max="40000" step="50" value="${S.dpi}"></label>
        <label><span>Main game</span><select name="game">${Object.entries(GAMES).map(([k, g]) => opt(k, g[0], S.game)).join('')}</select></label>
        <label><span>In-game sensitivity</span><input name="sens" type="number" min="0.001" max="100" step="0.001" value="${S.sens}"></label></div>
      <div class="su-row"><label><span>Mousepad width</span><select name="pad">${[[25, 'Small (~25 cm)'], [36, 'Medium (~36 cm)'], [45, 'Large (~45 cm)'], [90, 'Desk mat (~90 cm)']].map(([v, l]) => opt(v, l, S.pad)).join('')}</select></label>
        <label><span>Monitor</span><select name="hz">${[60, 75, 144, 165, 240, 360, 500].map(v => opt(v, v + ' Hz', S.hz)).join('')}</select></label></div>
      <div class="su-row"><label><span>Grip</span><select name="grip">${[['any', 'Not sure'], ['palm', 'Palm'], ['claw', 'Claw'], ['fingertip', 'Fingertip']].map(([v, l]) => opt(v, l, S.grip)).join('')}</select></label>
        <label><span>Hand length (cm)</span><input name="hand" type="number" min="12" max="26" step="0.1" value="${S.hand}" placeholder="e.g. 18.5"></label></div>
      <div class="su-actions"><button class="btn btn-primary btn-sm" type="submit">Save my setup</button><button class="btn btn-ghost btn-sm" type="button" id="suCopy">Copy as text</button><span class="su-saved" id="suSaved" hidden>Saved ✓</span></div>
    </form>
    <div class="su-out" id="suOut"></div></div>`;

  const val = () => { const f = new FormData($('#suForm')); return { mouse: f.get('mouse'), dpi: +f.get('dpi') || 800, game: f.get('game'), sens: +f.get('sens') || 0, pad: +f.get('pad'), hz: +f.get('hz'), grip: f.get('grip'), hand: f.get('hand') ? +f.get('hand') : '' }; };
  function calc(s) {
    const g = GAMES[s.game] || GAMES.other, edpi = Math.round(s.dpi * s.sens * 100) / 100;
    const cm = g[1] && s.sens > 0 ? 360 / (s.sens * g[1] * s.dpi) * 2.54 : null;
    return { g, edpi, cm };
  }
  function render() {
    const s = val(), { g, edpi, cm } = calc(s), m = s.mouse && PM.byId[s.mouse], tips = [];
    const band = cm == null ? null : cm < 20 ? ['Very high', 'Fast turns, but hard to hold steady on small targets.'] : cm < 32 ? ['High', 'Quick and agile; great for tracking-heavy games.'] : cm < 50 ? ['Medium', 'A balanced setting that suits most players.'] : cm < 75 ? ['Low', 'Steady and precise; you aim with your arm.'] : ['Very low', 'Very precise, but needs a big pad and lots of arm movement.'];
    if (cm != null) {
      const need = cm / 2, usable = s.pad * .85;
      tips.push(need <= usable ? ['ok', `Your pad fits a 180° turn (${need.toFixed(0)} cm of the ~${usable.toFixed(0)} cm you can use).`] : ['warn', `A 180° turn needs ${need.toFixed(0)} cm, more than your pad’s ~${usable.toFixed(0)} cm usable width. Get a bigger pad or raise your sensitivity a little.`]);
    }
    if (s.dpi > 3200) tips.push(['info', 'Very high DPI with low in-game sensitivity is fine, but most players settle between 400 and 1,600 DPI.']);
    if (s.game === 'minecraft') tips.push(['info', 'Minecraft’s sensitivity slider isn’t linear, so cm/360 can’t be calculated from it. Most PvP players sit around 15–35 cm/360: measure it by turning once around with your mouse on a ruler.']);
    if (m) {
      if (m.poll < 1000) tips.push(['warn', `Your ${m.short} polls at ${num(m.poll)} Hz. Set it to its maximum in its software.`]);
      if (s.hz >= 240 && m.poll >= 4000) tips.push(['ok', `Your ${num(s.hz)} Hz monitor can make use of the ${m.short}’s ${num(m.poll)} Hz polling.`]);
      else if (s.hz <= 75 && m.poll >= 4000) tips.push(['info', `On a ${s.hz} Hz monitor, 1,000 Hz polling is plenty and saves CPU${m.connection === 'Wireless' ? ' and battery' : ''}.`]);
      if (s.game === 'minecraft') tips.push(m.cps.verified ? ['ok', `The ${m.short} is verified to double-click, so butterfly clicking adds real CPS.`] : ['warn', `The ${m.short} can’t double-click${m.cps.drag ? ', though it drag clicks well' : ''}. For 1.8 PvP, see the mice that can.`]);
    }
    if (s.hz <= 75) tips.push(['info', 'Check Windows display settings: many 144 Hz monitors are left running at 60 Hz by mistake.']);
    let fit = '';
    if (m && (s.grip !== 'any' || s.hand)) {
      const p = { games: [{ cs2: 'fps', valorant: 'fps', apex: 'fps', ow2: 'fps', tf2: 'fps', minecraft: 'minecraft' }[s.game] || 'fps'], weight: 'any', grip: s.grip, connection: 'any', handLength: s.hand || null, mcVersion: 'any' };
      const r = PM.fit(m, p), w = r.score >= 85 ? 'Great' : r.score >= 70 ? 'Good' : r.score >= 55 ? 'Okay' : 'Weak';
      fit = `<div class="su-fit"><span class="section-label">How your mouse fits you</span><b>${w} fit<span class="pct-only"> · ${r.score}%</span></b>${r.pros.length ? `<p>✓ ${r.pros.slice(0, 2).map(esc).join('<br>✓ ')}</p>` : ''}${r.cons.length ? `<p class="su-con">⚠ ${r.cons.slice(0, 2).map(esc).join('<br>⚠ ')}</p>` : ''}
        ${r.score < 70 ? `<a class="btn btn-ghost btn-sm" href="${root}recommendations">Find a better fit</a>` : ''}</div>`;
    }
    $('#suOut').innerHTML = `<div class="panel su-card"><span class="section-label">Your sensitivity</span>
      <div class="su-nums"><div><span>eDPI</span><b>${num(edpi)}</b><small>${esc(g[0])}</small></div><div><span>cm / 360°</span><b>${cm == null ? '—' : cm.toFixed(1)}</b><small>${band ? band[0] : 'not available'}</small></div><div><span>in / 360°</span><b>${cm == null ? '—' : (cm / 2.54).toFixed(1)}</b><small>inches</small></div></div>
      ${band ? `<p class="su-band">${esc(band[1])}</p>` : ''}
      <p class="small su-conv"><a href="${root}sens">Convert this to another game →</a></p></div>
      ${m ? `<a class="panel su-mouse" href="${root}${m.page}"><img src="${PM.IMG(m, 480)}" alt="" width="90" height="90"><div><span class="section-label">Your mouse</span><b>${esc(m.name)}</b><small>${m.weight} g · ${num(m.dpi)} DPI · ${num(m.poll)} Hz · ${m.connection}${m.price ? ' · ' + inr(m.price) : ''}</small><em class="${m.cps.verified ? 'ok' : m.cps.drag ? 'mid' : 'no'}">${esc(m.cps.label)}</em></div></a>${fit}` : ''}
      ${tips.length ? `<div class="panel su-tips"><span class="section-label">Tips for your setup</span><ul>${tips.map(([k, t]) => `<li class="${k}">${esc(t)}</li>`).join('')}</ul></div>` : ''}`;
  }
  const text = () => { const s = val(), { g, edpi, cm } = calc(s), m = s.mouse && PM.byId[s.mouse];
    return `My setup (ProMouser)\nMouse: ${m ? m.name : 'other'}\nDPI: ${s.dpi} · ${g[0]} sens ${s.sens} · eDPI ${edpi}${cm ? ` · ${cm.toFixed(1)} cm/360` : ''}\nMonitor: ${s.hz} Hz · Pad: ~${s.pad} cm\npromouser.website/setup`; };
  $('#suForm').addEventListener('input', render); $('#suForm').addEventListener('change', render);
  $('#suForm').addEventListener('submit', async e => {
    e.preventDefault(); const s = val();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (x) { /* storage off */ }
    try { if (B && B.getUser && B.getUser()) await B.updateProfile({ prefs: { setup: s } }); } catch (x) { /* keep local */ }
    if (window.PMCore) PMCore.event('setup');
    const t = $('#suSaved'); t.hidden = false; setTimeout(() => { t.hidden = true; }, 2200);
  });
  $('#suCopy').addEventListener('click', () => { const t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $('#suCopy').textContent = 'Copied!'; }).catch(() => prompt('Copy your setup:', t)); });
  render();
})();
