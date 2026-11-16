# A calmer top bar on every page. Re-runnable.
#   Top level: Mice, Tests, Guides, More, plus Recommend (Recommend mode) or Ask AI (Hub mode).
#   Daily and My stats move into the Tests menu; Shop and ProMouser Online move into More.
import re, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
n = 0
for f in glob.glob('**/*.html', recursive=True):
    if '/vendor/' in f or '/node_modules/' in f: continue
    s = open(f).read(); o = s
    m = re.search(r'<li><a href="([^"]*)shop">Shop</a></li>', s) or re.search(r'<a href="([^"]*)tests" aria-controls="nav-menu-2"', s)
    if not m: continue
    pre = m.group(1)
    # 1. take the plain links out of the top level
    s = re.sub(r'\n\s*<li><a href="[^"]*daily" data-daily-nav>Daily</a></li>', '', s)
    s = re.sub(r'\n\s*<li data-only="hub"><a href="[^"]*my-stats">My stats</a></li>', '', s)
    s = re.sub(r'\n\s*<li><a href="[^"]*shop">Shop</a></li>', '', s)
    s = re.sub(r'\n\s*<li><a class="nav-online" href="[^"]*" target="_blank" rel="noopener">Online <span class="nav-new">New</span></a></li>', '', s)
    # 2. My stats goes into the Tests menu, right after the test hub
    tm = re.search(r'(<ul class="dropdown dd-wide" id="nav-menu-2">)(<li><a href="[^"]*tests"><span class="dd-ico" data-icon="Hub"></span>.*?</li>)', s)
    if tm and f'href="{pre}my-stats"><span class="dd-ico"' not in s[tm.start():tm.start() + 6000]:
        s = s.replace(tm.group(0), tm.group(0) + f'<li><a href="{pre}my-stats"><span class="dd-ico" data-icon="Stats"></span><span class="dd-txt"><b>My stats</b><small>Skill profile, records and trends</small></span></a></li>', 1)
    # the test hub stops spanning both columns now that My stats sits beside it
    # 3. Shop and ProMouser Online go to the top of More
    mm = re.search(r'<ul class="dropdown" id="nav-menu-4">', s)
    if mm and f'<a href="{pre}shop"><span class="dd-ico"' not in s:
        s = s.replace(mm.group(0), mm.group(0) + f'<li><a href="{pre}shop"><span class="dd-ico" data-icon="Value"></span><span class="dd-txt"><b>Shop</b><small>Plans, Mono and credits</small></span></a></li>'
                      '<li><a href="https://dreadlineofficial.github.io/ProMouser-Online/" target="_blank" rel="noopener"><span class="dd-ico" data-icon="Games"></span><span class="dd-txt"><b>ProMouser Online</b><small>Games, friends and duels</small></span></a></li>', 1)
    if s != o: open(f, 'w').write(s); n += 1
print('pages tidied', n)
