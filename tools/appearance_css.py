# Generates the Ultra appearance palettes (html[data-accent="…"]) and appends them to style.css once.
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = {  # name: (bg, bg2, bg3, surface, surface2, accent, accent2, deep, gradA, gradB, text2, text3, chart series)
 'classic': ('#050506','#0b0809','#130d0f','#170f12','#20151a','#ff1f3d','#d1002a','#5c000f','#ff2a47','#c4001f','#a8a3a6','#726b6f',['#ff2a47','#f4f4f6','#ff8a96','#9d979a','#d4142a','#ffc2c8','#cfcfd4']),
 'lite':    ('#03050a','#070b14','#0c1320','#0e1627','#15203a','#2f86ff','#1457d8','#07245c','#4aa3ff','#1f5fe6','#9fa8bb','#66708a',['#4aa3ff','#f2f6ff','#8fc3ff','#8d99b3','#1f6fe0','#bcd9ff','#c9d2e6']),
 'navy':    ('#020309','#050816','#090e22','#0b1129','#111a3a','#2c52d6','#1a3596','#0a1650','#3b63e3','#142a80','#9ca3ba','#636b87',['#3b63e3','#eef1ff','#7f97ef','#8a93b0','#1a3596','#b4c3f7','#c6cce2']),
 'emerald': ('#020806','#05100c','#091812','#0b1d16','#11291f','#10b981','#059669','#053d2c','#34d399','#047857','#9db8ad','#61806f',['#34d399','#effdf6','#86efac','#8fa89c','#059669','#a7f3d0','#c8dcd2']),
 'amber':   ('#080603','#110c06','#1a1209','#1f160b','#2a1e10','#f59e0b','#d97706','#4a2a02','#fbbf24','#ea580c','#bcae98','#857660',['#fbbf24','#fff8eb','#fcd34d','#a89c88','#ea580c','#fde68a','#ddd3c2']),
 'sakura':  ('#09040a','#120811','#1b0c19','#200e1d','#2c1428','#ec4899','#db2777','#4d0a2a','#f472b6','#be185d','#bfa4b5','#86697c',['#f472b6','#fff0f7','#f9a8d4','#a8909f','#db2777','#fbcfe8','#e3cbd8']),
 'cyan':    ('#02080a','#051114','#08191e','#0a1e24','#0f2a33','#06b6d4','#0891b2','#053845','#22d3ee','#0e7490','#9db5bb','#617c83',['#22d3ee','#effcff','#67e8f9','#8ea5ab','#0891b2','#a5f3fc','#c6dbe0']),
 'mono':    ('#060606','#0c0c0d','#141415','#18181a','#222225','#a1a1aa','#71717a','#27272a','#e4e4e7','#71717a','#a7a7ae','#6e6e76',['#e4e4e7','#fafafa','#d4d4d8','#a1a1aa','#71717a','#f4f4f5','#d4d4d8']),
}
import colorsys
def hx(r, g, b): return '#%02x%02x%02x' % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))
def derive(ac, ac2, ga, gb):
    """Dark backgrounds, surfaces, text and chart colours tinted with the accent's hue."""
    r, g, b = (int(ac[i:i + 2], 16) / 255 for i in (1, 3, 5)); h, l, sat = colorsys.rgb_to_hls(r, g, b); ts = min(sat, .55)
    tone = lambda L, S=ts: hx(*colorsys.hls_to_rgb(h, L, S))
    return (tone(.022), tone(.045), tone(.07), tone(.085), tone(.12), ac, ac2, tone(.17, sat), ga, gb, tone(.7, .12), tone(.47, .1),
            [ga, '#f4f4f6', tone(.72, sat), tone(.6, .1), ac2, tone(.85, sat), tone(.8, .08)])
MORE = {  # name: (accent, accent-2, gradient from, gradient to)
 'lime': ('#84cc16', '#65a30d', '#a3e635', '#4d7c0f'), 'ocean': ('#0ea5e9', '#0369a1', '#38bdf8', '#1e3a8a'), 'sunset': ('#f97316', '#e11d48', '#fb923c', '#be123c'),
 'violet': ('#8b5cf6', '#6d28d9', '#a78bfa', '#5b21b6'), 'gold': ('#eab308', '#ca8a04', '#fde047', '#a16207'), 'ice': ('#7dd3fc', '#38bdf8', '#e0f2fe', '#0ea5e9'),
 'coral': ('#fb7185', '#f43f5e', '#fda4af', '#e11d48'), 'teal': ('#14b8a6', '#0f766e', '#2dd4bf', '#115e59'), 'crimson': ('#dc2626', '#991b1b', '#ef4444', '#7f1d1d'),
 'lavender': ('#c4b5fd', '#a78bfa', '#ede9fe', '#8b5cf6'), 'toxic': ('#a3ff12', '#22c55e', '#d9f99d', '#16a34a'),
 'rose': ('#f43f5e', '#be123c', '#fb7185', '#9f1239'), 'forest': ('#22c55e', '#15803d', '#4ade80', '#14532d'), 'mint': ('#6ee7b7', '#10b981', '#d1fae5', '#059669'),
 'sky': ('#60a5fa', '#2563eb', '#bfdbfe', '#1d4ed8'), 'indigo': ('#6366f1', '#4338ca', '#818cf8', '#312e81'), 'plum': ('#c026d3', '#86198f', '#e879f9', '#701a75'),
 'peach': ('#fdba74', '#fb923c', '#ffedd5', '#ea580c'), 'copper': ('#d97706', '#b45309', '#f59e0b', '#78350f'), 'magenta': ('#ec4899', '#a21caf', '#f472b6', '#86198f'),
 'aqua': ('#2dd4bf', '#06b6d4', '#99f6e4', '#0e7490'), 'slate': ('#94a3b8', '#64748b', '#cbd5e1', '#334155'), 'blood': ('#b91c1c', '#7f1d1d', '#dc2626', '#450a0a'),
}
for k, v in MORE.items(): P[k] = derive(*v)
def rgb(h): return ', '.join(str(int(h[i:i + 2], 16)) for i in (1, 3, 5))
MARK = '/* ===== Appearance (Ultra accounts) ===== */'
out = [MARK, '/* html[data-accent], data-bg, data-glow, data-density: set in account settings, applied before first paint by the <head> script. */']
for k, (bg, b2, b3, s1, s2, ac, ac2, deep, ga, gb, t2, t3, ser) in P.items():
    out.append(f'html[data-accent="{k}"] {{ --bg: {bg}; --bg-2: {b2}; --bg-3: {b3}; --surface: {s1}; --surface-2: {s2}; --bg-rgb: {rgb(bg)}; --bg2-rgb: {rgb(b2)}; --bg3-rgb: {rgb(b3)}; '
               f'--accent: {ac}; --accent-2: {ac2}; --accent-deep: {deep}; --accent-rgb: {rgb(ac)}; --accent2-rgb: {rgb(ac2)}; --accent-dim: rgba({rgb(ac)}, .14); --accent-glow: rgba({rgb(ac)}, .42); '
               f'--grad: linear-gradient(120deg, {ga} 0%, {gb} 100%); --text-2: {t2}; --text-3: {t3}; ' + ' '.join(f'--s{i + 1}: {c};' for i, c in enumerate(ser)) + ' }')
out.append('''html[data-accent="mono"] .btn-primary, html[data-accent="ice"] .btn-primary, html[data-accent="lavender"] .btn-primary, html[data-accent="toxic"] .btn-primary, html[data-accent="gold"] .btn-primary, html[data-accent="lime"] .btn-primary, html[data-accent="mint"] .btn-primary, html[data-accent="peach"] .btn-primary, html[data-accent="aqua"] .btn-primary { color: #0a0a0b; }
html[data-bg="plain"] .hero-bg-grid, html[data-bg="plain"] .ambient .grain { display: none; }
html[data-bg="aurora"] .ambient::before { opacity: .85; width: 80vmax; height: 80vmax; } html[data-bg="aurora"] .ambient::after { opacity: .8; background: radial-gradient(circle, rgba(var(--accent-rgb), .3), transparent 65%); }
html[data-glow="off"] { --accent-glow: transparent; --shadow-accent: none; } html[data-glow="off"] .ambient { display: none; }
html[data-glow="off"] *, html[data-glow="off"] *::before, html[data-glow="off"] *::after { text-shadow: none !important; }
html[data-density="compact"] { --section-y: clamp(40px, 6vw, 76px); font-size: 15px; }
.ui-panel .ui-row { display: grid; gap: 8px; margin-top: 14px; } .ui-panel .ui-row > span { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }
.ui-swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.ui-sw { width: 44px; height: 44px; border-radius: 14px; border: 2px solid transparent; cursor: pointer; position: relative; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .12); }
.ui-sw[aria-pressed="true"] { border-color: #fff; } .ui-sw[aria-pressed="true"]::after { content: '✓'; position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-weight: 800; text-shadow: 0 1px 4px rgba(0, 0, 0, .6); }
.ui-seg { display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, .05); border: 1px solid var(--border); justify-self: start; }
.ui-seg button { padding: .4rem .9rem; border: 0; border-radius: 999px; background: none; color: var(--text-3); font: 600 .84rem var(--font-body); cursor: pointer; } .ui-seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }''')
END = '/* ===== /Appearance ===== */'
css = open(os.path.join(ROOT, 'style.css')).read()
block = '\n'.join(out) + '\n' + END
if MARK in css:   # replace only our own block, keep everything around it
    a = css.index(MARK)
    if END in css: b = css.index(END) + len(END)
    else:          # first run with an end marker: the old block ended with the .ui-seg button rule
        i = css.index('.ui-seg button {', a); b = css.index('\n', i)
    css = css[:a] + block + css[b:]
else:
    css = css.rstrip() + '\n\n' + block + '\n'
open(os.path.join(ROOT, 'style.css'), 'w').write(css)
print('palettes:', ', '.join(P))
