# One-off edits across every ProMouser page for the Recommend / Hub modes:
#  * the inline <head> script also applies the saved mode before paint
#  * the Recommend menu becomes recommend-only, gains ProMouser Basic
#  * hub-only nav items: Ask (the mouse assistant) and My stats
import re, glob, os, sys
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = [f for f in glob.glob(ROOT + '/**/*.html', recursive=True) if '/vendor/' not in f and '/.git/' not in f]
HEAD_OLD = "try{var pl=localStorage.getItem('pm_plan');if(pl==='lite'||pl==='ultra')document.documentElement.dataset.plan=pl;}catch(e){}"
HEAD_NEW = "try{var pl=localStorage.getItem('pm_plan');if(pl==='lite'||pl==='ultra')document.documentElement.dataset.plan=pl;}catch(e){}try{document.documentElement.dataset.mode=localStorage.getItem('pm_mode')==='hub'?'hub':'recommend';}catch(e){document.documentElement.dataset.mode='recommend';}"
n = {'head': 0, 'rec': 0, 'hub': 0, 'basic': 0}
for f in files:
    s = open(f).read(); o = s
    if HEAD_OLD in s and 'pm_mode' not in s: s = s.replace(HEAD_OLD, HEAD_NEW); n['head'] += 1
    m = re.search(r'<li><a href="([^"]*)shop\.html">Shop</a></li>', s)
    pre = m.group(1) if m else None
    # recommend-only dropdown
    s2 = re.sub(r'<li class="has-dropdown">(\s*<a href="[^"]*recommendations\.html" aria-controls="nav-menu-5")', r'<li class="has-dropdown nav-rec" data-only="recommend">\1', s)
    if s2 != s: n['rec'] += 1; s = s2
    # Basic in the Recommend menu, before Lite
    if pre is not None and 'basic.html"><span class="dd-ico"' not in s:
        s2 = re.sub(r'(<li><a href="' + re.escape(pre) + r'lite\.html"><span class="dd-ico")', '<li><a href="' + pre + 'basic.html"><span class="dd-ico" data-icon="Value"></span><span class="dd-txt"><b>ProMouser Basic <span class="badge">New</span></b><small>More credits, top 5, check any mouse</small></span></a></li>' + r'\1', s, count=1)
        if s2 != s: n['basic'] += 1; s = s2
    # hub-only items after the Tests dropdown
    if pre is not None and 'data-only="hub"' not in s:
        s2 = re.sub(r'(<li class="has-dropdown">\s*<a href="[^"]*tests\.html" aria-controls="nav-menu-2".*?</ul>\s*</li>)',
                    lambda mm: mm.group(1) + f'\n        <li data-only="hub"><a href="{pre}mouse-ai.html">Ask</a></li>\n        <li data-only="hub"><a href="{pre}my-stats.html">My stats</a></li>', s, count=1, flags=re.S)
        if s2 != s: n['hub'] += 1; s = s2
    if s != o: open(f, 'w').write(s)
print(len(files), n)
