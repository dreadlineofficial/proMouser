# Adds ProMouser Core to every page: core.js (before account.js), the "Daily" nav item, the
# "My setup" and "Daily challenge & Mousle" items in the Tests menu, and the <head> snippet that
# applies an Ultra account's appearance settings (pm_ui) before the first paint. Re-runnable.
# Links use the site's clean URLs (daily, setup) like the rest of the nav.
import re, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = [f for f in glob.glob(ROOT + '/**/*.html', recursive=True) if '/vendor/' not in f and '/node_modules/' not in f]
UI = "try{if(localStorage.getItem('pm_plan')==='ultra'){var ui=JSON.parse(localStorage.getItem('pm_ui')||'{}'),h=document.documentElement;if(ui.accent)h.dataset.accent=ui.accent;if(ui.bg)h.dataset.bg=ui.bg;if(ui.glow==='off')h.dataset.glow='off';if(ui.density==='compact')h.dataset.density='compact';}}catch(e){}"
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
    if "pm_ui" not in s and "dataset.mode=" in s:
        s = s.replace("document.documentElement.dataset.mode='recommend';}", "document.documentElement.dataset.mode='recommend';}" + UI, 1); n['ui'] += 1
    if s != o: open(f, 'w').write(s)
print(len(files), n)
