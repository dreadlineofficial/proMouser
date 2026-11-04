# Adds ProMouser Core to every page: core.js (before account.js), the "Daily" nav item, the
# "My setup" and "Daily challenge & Mousle" items in the Tests menu, and the <head> snippet that
# applies an Ultra account's appearance settings (pm_ui) before the first paint. Re-runnable.
# Links use the site's clean URLs (daily, setup) like the rest of the nav.
import re, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = [f for f in glob.glob(ROOT + '/**/*.html', recursive=True) if '/vendor/' not in f and '/node_modules/' not in f]
UI = "try{var ui=JSON.parse(localStorage.getItem('pm_ui')||'{}'),h=document.documentElement,u=localStorage.getItem('pm_plan')==='ultra';if(ui.accent&&(u||ui.free)){h.dataset.accent=ui.accent;if(u&&ui.css)h.style.cssText+=ui.css;}if(u){if(ui.bg)h.dataset.bg=ui.bg;if(ui.glow==='off')h.dataset.glow='off';if(ui.density==='compact')h.dataset.density='compact';}}catch(e){}"
OLD_UI = ["try{if(localStorage.getItem('pm_plan')==='ultra'){var ui=JSON.parse(localStorage.getItem('pm_ui')||'{}'),h=document.documentElement;if(ui.accent)h.dataset.accent=ui.accent;if(ui.bg)h.dataset.bg=ui.bg;if(ui.glow==='off')h.dataset.glow='off';if(ui.density==='compact')h.dataset.density='compact';}}catch(e){}"]   # earlier versions, swapped for UI
RV = "try{var rv=localStorage.getItem('pm_revamp'),F={terminal:'JetBrains+Mono:wght@400;600;800',paper:'Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;1,9..144,600&family=Newsreader:opsz,wght@6..72,400;6..72,600',arcade:'Press+Start+2P&family=VT323',glass:'Manrope:wght@400;600;700;800&family=Sora:wght@600;800',brutal:'Archivo+Black&family=Space+Grotesk:wght@400;500;700',synthwave:'Orbitron:wght@600;800;900&family=Rajdhani:wght@500;600;700'};if(rv&&F[rv]){document.documentElement.dataset.revamp=rv;var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+F[rv]+'&display=swap';document.head.appendChild(l);}}catch(e){}"   # UI revamps (revamps.css): the saved one, before first paint
DD = ('<li><a href="{p}setup"><span class="dd-ico" data-icon="Setup"></span><span class="dd-txt"><b>My setup <span class="badge">New</span></b><small>eDPI, cm/360, pad and fit check</small></span></a></li>'
      '<li><a href="{p}daily"><span class="dd-ico" data-icon="Time"></span><span class="dd-txt"><b>Daily challenge &amp; Mousle <span class="badge">New</span></b><small>Streaks, levels and achievements</small></span></a></li>')
n = {'core': 0, 'nav': 0, 'menu': 0, 'ui': 0}
for f in files:
    s = open(f).read(); o = s
    m = re.search(r'<script src="([^"]*)(account|script)\.js"></script>', s)
    if m and 'core.js' not in s:
        s = s.replace(m.group(0), f'<script src="{m.group(1)}core.js"></script>\n  ' + m.group(0), 1); n['core'] += 1
    sh = re.search(r'<li><a href="([^"]*)shop(?:\.html)?">Shop</a></li>', s)
    if sh and 'data-daily-nav' not in s:
        pre = sh.group(1)
        s2 = re.sub(r'(\n        <li data-only="hub"><a href="[^"]*mouse-ai(?:\.html)?">)', f'\n        <li><a href="{pre}daily" data-daily-nav>Daily</a></li>' + r'\1', s, count=1)
        if s2 != s: s = s2; n['nav'] += 1
    se = re.search(r'(<li><a href="([^"]*)sens(?:\.html)?"><span class="dd-ico" data-icon="Aim"></span>.*?</a></li>)', s)
    if se and 'data-icon="Setup"' not in s:
        s = s.replace(se.group(1), se.group(1) + DD.format(p=se.group(2)), 1); n['menu'] += 1
    for old in OLD_UI:
        if old in s: s = s.replace(old, UI); n['ui'] += 1
    if "pm_ui" not in s and "dataset.mode=" in s:
        s = s.replace("document.documentElement.dataset.mode='recommend';}", "document.documentElement.dataset.mode='recommend';}" + UI, 1); n['ui'] += 1
    if 'pm_revamp' not in s and UI in s:
        s = s.replace(UI, UI + RV, 1); n['rv'] = n.get('rv', 0) + 1
    st = re.search(r'<link rel="stylesheet" href="([^"]*)style\.css" />', s)
    if st and 'revamps.css' not in s:
        s = s.replace(st.group(0), st.group(0) + f'\n  <link rel="stylesheet" href="{st.group(1)}revamps.css" />', 1); n['rvcss'] = n.get('rvcss', 0) + 1
    if s != o: open(f, 'w').write(s)
print(len(files), n)
