/* =====================================================================
   ProMouser: Sensitivity converter (ProMouser Ultra)  — sens.html

   Converts in-game sensitivity between games so a new game feels the same,
   using each game's "yaw" (degrees turned per mouse count at sensitivity 1):
     cm/360 = 360 / (yaw × sens × DPI) × 2.54
   Also shows eDPI and keeps your feel when you change DPI.
   Non-Ultra visitors see a blurred preview and an upgrade card.
   ===================================================================== */
(() => {
  'use strict';
  const host = document.querySelector('[data-sens]');
  if (!host) return;
  const B = window.PMBackend, A = window.PMAccount;
  const root = document.documentElement.dataset.root || '';
  const $ = (s, r = host) => r.querySelector(s);

  const GAMES = [
    { id: 'cs2', name: 'Counter-Strike 2 / CS:GO', yaw: 0.022, typical: [600, 1200] },
    { id: 'valorant', name: 'Valorant', yaw: 0.07, typical: [200, 400] },
    { id: 'apex', name: 'Apex Legends', yaw: 0.022, typical: [800, 1600] },
    { id: 'ow2', name: 'Overwatch 2', yaw: 0.0066, typical: [3000, 6000] },
    { id: 'tf2', name: 'Team Fortress 2 / Source games', yaw: 0.022, typical: [800, 1600] }
  ];
  const byId = Object.fromEntries(GAMES.map(g => [g.id, g]));
  const KEY = 'pm_sens';
  let st = { from: 'cs2', to: 'valorant', sens: 1.2, dpi: 800, newDpi: '' };
  try { st = { ...st, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* storage off */ }

  const cm360 = (g, sens, dpi) => (360 / (g.yaw * sens * dpi)) * 2.54;
  const fmt = (n, d = 3) => (Number.isFinite(n) ? (+n.toFixed(d)).toString() : '—');
  const feel = cm => cm < 20 ? ['Very fast', 'Twitchy: great for tracking up close, harder for precise flicks.'] : cm < 32 ? ['Fast', 'Quick turns with your wrist. Common in Apex and Overwatch.'] : cm < 50 ? ['Medium', 'A balanced feel many tactical-shooter players use.'] : ['Slow', 'Arm aiming for precise flicks. Popular in CS2 and Valorant.'];
  const opts = sel => GAMES.map(g => `<option value="${g.id}" ${g.id === sel ? 'selected' : ''}>${g.name}</option>`).join('');

  function shell(locked) {
    host.innerHTML = `<div class="${locked ? 'sens-locked' : ''}">
      <div class="sens-grid">
        <form class="panel sens-form" id="sensForm" autocomplete="off">
          <div class="panel-head"><h3>Your current setup</h3><span class="plan-tag ultra">Ultra</span></div>
          <div class="row2"><label>From game<select id="sFrom">${opts(st.from)}</select></label><label>To game<select id="sTo">${opts(st.to)}</select></label></div>
          <div class="row2"><label>Sensitivity in that game<input id="sSens" type="number" min="0.001" step="0.001" value="${st.sens}" inputmode="decimal"></label><label>Mouse DPI<input id="sDpi" type="number" min="50" step="50" value="${st.dpi}" inputmode="numeric"></label></div>
          <label>Changing DPI? New DPI (optional)<input id="sNewDpi" type="number" min="50" step="50" value="${st.newDpi}" placeholder="Leave empty to keep ${st.dpi}" inputmode="numeric"></label>
          <p class="field-note">Converts using each game’s mouse “yaw”, so a 360° turn takes the same hand movement. Scoped / ADS multipliers aren’t included.</p>
        </form>
        <div class="sens-out" id="sensOut" aria-live="polite"></div>
      </div>
      ${locked ? `<div class="ultra-lock"><span class="ultra-badge">Ultra</span><h4>Keep your aim when you switch games</h4><p>The sensitivity converter is part of ProMouser Ultra, with unlimited recommendations, a price watchlist and more.</p>
        <div class="hero-cta" style="justify-content:center">${B && B.getUser && B.getUser() ? '' : '<button class="btn btn-ghost btn-sm" type="button" data-auth="signin">Sign in</button>'}<a class="btn btn-primary btn-sm" href="${root}ultra">See Ultra</a></div></div>` : ''}
    </div>`;
  }

  function calc() {
    const f = byId[$('#sFrom').value], t = byId[$('#sTo').value], sens = +$('#sSens').value, dpi = +$('#sDpi').value, nd = +$('#sNewDpi').value || 0;
    st = { from: f.id, to: t.id, sens, dpi, newDpi: nd || '' };
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage off */ }
    const out = $('#sensOut');
    if (!(sens > 0 && dpi > 0)) { out.innerHTML = '<div class="panel"><p class="panel-note">Enter your sensitivity and DPI.</p></div>'; return; }
    const dpi2 = nd > 0 ? nd : dpi, cm = cm360(f, sens, dpi);
    const toSens = sens * f.yaw / t.yaw * dpi / dpi2;
    const [band, note] = feel(cm), edpiT = toSens * dpi2, [lo, hi] = t.typical;
    out.innerHTML = `
      <div class="sens-big"><small>${t.name} sensitivity${nd ? ` at ${dpi2} DPI` : ''}</small><b>${fmt(toSens, 3)}</b>
        <p class="panel-note" style="margin:.3rem 0 0">Feels the same as ${fmt(sens, 3)} in ${f.name.split(' /')[0]} at ${dpi} DPI.</p></div>
      <div class="sens-stats">
        <div><span>cm / 360°</span><b>${fmt(cm, 1)} cm</b></div>
        <div><span>in / 360°</span><b>${fmt(cm / 2.54, 1)} in</b></div>
        <div><span>eDPI (${t.name.split(' ')[0]})</span><b>${Math.round(edpiT)}</b></div>
      </div>
      <div class="panel"><div class="panel-head"><h3>${band}</h3><span class="chip">${fmt(cm, 1)} cm/360</span></div><p class="panel-note">${note} ${edpiT < lo ? `Lower than most ${t.name.split(' /')[0]} players (eDPI ${lo}–${hi}).` : edpiT > hi ? `Higher than most ${t.name.split(' /')[0]} players (eDPI ${lo}–${hi}).` : `Right in the usual range for ${t.name.split(' /')[0]} (eDPI ${lo}–${hi}).`}</p></div>
      <div class="panel"><h3>Same feel in every game</h3><table class="sens-table"><tbody>${GAMES.map(g => `<tr><td>${g.name}</td><td>${fmt(sens * f.yaw / g.yaw * dpi / dpi2, 3)}</td></tr>`).join('')}</tbody></table>
        <p class="panel-note" style="margin-top:.6rem">At ${dpi2} DPI. Games that aren’t listed use different, non-linear sensitivity curves.</p></div>`;
  }

  function render() {
    const locked = !(B && B.has && B.has('sens'));
    shell(locked);
    if (!locked) { $('#sensForm').addEventListener('input', calc); $('#sensForm').addEventListener('submit', e => e.preventDefault()); }
    calc();
  }
  render();
  if (B && B.on) B.on(() => { const locked = !B.has('sens'); if (locked !== !!$('.sens-locked')) render(); });
  window.PMSens = { cm360: (game, sens, dpi) => cm360(byId[game], sens, dpi), convert: (from, to, sens) => sens * byId[from].yaw / byId[to].yaw };
})();
