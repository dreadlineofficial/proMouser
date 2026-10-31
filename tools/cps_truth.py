# Applies ProMouser's verified double-click list to the static pages.
# Only mice with cps.verified = true in mice-data.js double-click; every other mouse "can’t double-click"
# (cps.drag = drag clicks but doesn't butterfly well; cps.tested = ProMouser tested it itself).
# Re-runnable: updates mouse cards everywhere, each review page's CPS spots, the Minecraft guide,
# and (re)generates the Ant Esports GM320 page. Usage: python3 tools/cps_truth.py
import json, re, glob, os, subprocess, html as H
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def load(src):
    i = src.index('window.PM_MICE = ') + 17; j = src.index('];', i) + 1
    return json.loads(src[i:j])
MICE = load(open('mice-data.js').read()); BY = {m['id']: m for m in MICE}
try: OLD = {m['id']: m for m in load(subprocess.run(['git', 'show', 'fd7726b:mice-data.js'], capture_output=True, text=True, check=True).stdout)}
except Exception: OLD = {}
VER = [m for m in MICE if m['cps'].get('verified')]
VER_NAMES = ', '.join(m['name'] for m in VER[:-1]) + ' and ' + VER[-1]['name']
e = lambda s: H.escape(str(s), quote=False)
def dots(n): return '●' * n + '○' * (5 - n)
def inr(v): return '₹' + f'{v:,}' if v is not None else '—'
def num(v): return f'{v:,}'

# ---------------------------------------------------------------- shared pieces
def cps_section(m, pre):
    c = m['cps']
    if c.get('verified'):
        h2 = 'Built for <em>maximum CPS</em>' if c['level'] >= 5 else 'A verified <em>double-clicker</em>'
        small = f'Verified by ProMouser to double-click. Only {len(VER)} mice on ProMouser are: {e(VER_NAMES)}.'
        meter = f'<span class="cps-dots">{dots(c["level"])}</span><b>{e(c["label"])}</b><small>{small}</small><a class="btn btn-outline btn-sm" href="{pre}mice/minecraft.html#verified">See the verified double-clickers</a>'
    else:
        h2 = 'Drag clicks, <em>not</em> butterfly' if c.get('drag') else 'Can’t <em>double-click</em>'
        meter = f'<span class="cps-dots">{dots(c["level"])}</span><b>{e(c["label"])}</b><small>{"Great for bridging. " if c.get("drag") else ""}For butterfly clicking in 1.8 PvP, pick one that double-clicks: {e(VER_NAMES)}.</small><a class="btn btn-outline btn-sm" href="{pre}mice/minecraft.html#capped">Why most mice are capped</a>'
    return (f'<section class="about-section" id="cps"><div class="container"><div class="cps-callout reveal{" capped" if not c.get("verified") else ""}"><div><span class="section-label">Minecraft CPS</span>'
            f'<h2>{h2}</h2><p>{e(c["note"])}</p></div><div class="cps-callout-meter">{meter}</div></div></div></section>')

def picture(m, pre, sizes, eager=False):
    b = f'{pre}assets/images/mice/{m["img"]}'
    if m['img'].startswith('art/'): return f'<img src="{b}.svg" alt="{e(m["name"])}" loading="lazy" decoding="async">'
    return (f'<picture><source type="image/webp" srcset="{b}-480.webp 480w, {b}-720.webp 720w, {b}-960.webp 960w" sizes="{sizes}"><source type="image/png" srcset="{b}-480.png 480w, {b}-720.png 720w, {b}-960.png 960w" sizes="{sizes}">'
            f'<img src="{b}-720.png" alt="{e(m["name"])}" loading="{"eager" if eager else "lazy"}" decoding="async"{" fetchpriority=\"high\"" if eager else ""}></picture>')

def card(m, pre):
    c = m['cps']; g = ' '.join(m['games']); tags = ' · '.join(m['tags'])
    return (f'<article class="mouse-card reveal" data-id="{m["id"]}" data-name="{e((m["name"] + " " + m["brand"] + " " + " ".join(m["tags"])).lower())}" data-brand="{e(m["brand"])}" data-games="{g}" data-conn="{m["connection"].lower()}" data-weight="{m["weight"]}" data-price="{m["price"] or 0}" data-cps="{c["level"]}" style="--c:var(--s{m["series"]})">\n'
            f'          <div class="mc-top"><span class="chip accent">{e(tags)}</span><span class="mc-cps" title="Minecraft CPS potential: {e(c["label"])}"><span class="cps-dots sm">{dots(c["level"])}</span><small>CPS</small></span></div>\n'
            f'          <div class="mc-art">{picture(m, pre, "(max-width: 600px) 80vw, 280px")}</div>\n'
            f'          <div class="mc-body">\n            <div><span class="mc-brand">{e(m["brand"])}</span><h3>{e(m["name"])}</h3></div>\n            <p>{e(m["bestFor"])}.</p>\n'
            f'            <div class="mc-specs"><div><span>Weight</span><b>{m["weight"]} g</b></div><div><span>Max DPI</span><b>{num(m["dpi"])}</b></div><div><span>Polling</span><b>{num(m["poll"])} Hz</b></div></div>\n'
            f'            <div class="mc-foot"><span class="mc-price">{inr(m["price"]) if m["price"] else "Check listing"}</span><span class="mc-card-link-label">Read review →</span></div>\n          </div>\n'
            f'          <a class="mc-link" href="{pre}{m["page"]}" aria-label="{e(m["name"])} review"></a>\n        </article>')

# ---------------------------------------------------------------- 1. mouse cards on every page
def patch_cards(t):
    def one(mm):
        a = mm.group(0); h = re.search(r'href="(?:\.\./)?mice/([a-z0-9-]+)\.html"[^>]*class="mc-link"|class="mc-link"[^>]*href="(?:\.\./)?mice/([a-z0-9-]+)\.html"', a)
        if not h: return a
        m = BY.get(h.group(1) or h.group(2)); o = OLD.get(m['id']) if m else None
        if not m: return a
        c = m['cps']
        a = re.sub(r'data-cps="\d"', f'data-cps="{c["level"]}"', a)
        a = re.sub(r'title="Minecraft CPS potential: [^"]*"><span class="cps-dots sm">[●○]+</span>', f'title="Minecraft CPS potential: {e(c["label"])}"><span class="cps-dots sm">{dots(c["level"])}</span>', a)
        a = re.sub(r'<div class="cps-note"><span class="cps-dots">[●○]+</span><p>[^<]*</p></div>', f'<div class="cps-note"><span class="cps-dots">{dots(c["level"])}</span><p>{e(c["note"])}</p></div>', a)
        a = a.replace(' · Drag clicking</span>', '</span>').replace(' drag clicking"', '"')
        if o and o['bestFor'] != m['bestFor']: a = a.replace(f'<p>{e(o["bestFor"])}.</p>', f'<p>{e(m["bestFor"])}.</p>')
        return a
    return re.sub(r'<article class="mouse-card[^"]*"[^>]*>.*?</article>', one, t, flags=re.S)

# ---------------------------------------------------------------- 2. review pages
CAPPED_CON = '<li class="con"><b>Can’t double-click</b><span>Butterfly and drag clicks won’t add extra clicks, so for 1.8 PvP pick a mouse that double-clicks.</span></li>'
DRAG_CON = '<li class="con"><b>Weak for butterfly clicking</b><span>It drag clicks well, but butterfly clicking doesn’t add much on it.</span></li>'
CON_RE = r'<li class="con"><b>(?:Weak for butterfly clicking|Not built for double-clicking|Capped CPS|Can’t double-click)</b><span>[^<]*</span></li>'
VER_PRO = '<li class="pro"><b>Verified double-clicker</b><span>ProMouser has confirmed it double-clicks, so butterfly and jitter clicks register extra clicks.</span></li>'
def patch_page(path, m):
    t = open(path).read(); c = m['cps']; o = OLD.get(m['id'])
    t = re.sub(r'(<span>Minecraft CPS</span><b>)[^<]*(<small>)', rf'\g<1>{e(c["label"])}\2', t)
    t = re.sub(r'(<dt>Minecraft CPS potential</dt><dd class="">)[^<]*(</dd>)', rf'\g<1>{e(c["label"])} ({c["level"]}/5)\2', t)
    t = re.sub(r'<section class="about-section" id="cps">.*?</section>', '', t, flags=re.S)
    t = t.replace('<section class="stats-section" id="stats">', cps_section(m, '../') + '\n    <section class="stats-section" id="stats">', 1) if 'id="cps"' not in t else t
    if c.get('verified'):
        t = re.sub(r'<li class="pro"><b>Strong clicker</b><span>[^<]*</span></li>', '', t)
        if 'Verified double-clicker' not in t: t = t.replace('<h3>Why you’d pick it</h3><ul>', '<h3>Why you’d pick it</h3><ul>' + VER_PRO, 1)
        t = re.sub(CON_RE, '', t)
    else:
        t = re.sub(r'<li class="pro"><b>Strong clicker</b><span>[^<]*</span></li>', '', t)
        for old in ('<span>Lower debounce lets fast butterfly and jitter clicks register.</span>', '<span>You can tune the click delay in software, though ProMouser hasn’t verified it double-clicks.</span>'):
            t = t.replace(old, '<span>You can tune the click delay in software, though it still can’t double-click.</span>')
        t = re.sub(CON_RE, '', t)
        t = t.replace('<h3>Think twice if…</h3><ul>', '<h3>Think twice if…</h3><ul>' + (DRAG_CON if c.get('drag') else CAPPED_CON), 1)
        t = t.replace('<p>It performs well across butterfly, jitter, and drag clicking, especially when paired with the right settings.</p>', '<p>Its clicks are crisp, but like most mice it can’t double-click, so butterfly and drag clicking top out early. Great for jitter clicking and 1.9+ combat.</p>')
        t = t.replace('Built to support butterfly, jitter, and drag clicking without feeling heavy or sluggish', 'Light enough for fast jitter clicking without feeling sluggish')
        t = t.replace(' · Drag clicking</span>', '</span>')
    if o and o['bestFor'] != m['bestFor']: t = t.replace(e(o['bestFor']), e(m['bestFor'])).replace(o['bestFor'], m['bestFor'])
    if m.get('caveat') and m['caveat'] not in t: t = t.replace('<h3>Think twice if…</h3><ul>', f'<h3>Think twice if…</h3><ul><li class="con"><b>Build and skates</b><span>{e(m["caveat"])}</span></li>', 1)
    open(path, 'w').write(t)

# ---------------------------------------------------------------- 3. the GM320 review page (from the A70 template)
def gm320_page():
    m = BY['ant-esports-gm320']; src = open('mice/bloody-a70.html').read()
    head = src[:src.index('<main')]
    head = head.replace('Bloody A70 — ProMouser', 'Ant Esports GM320 — ProMouser').replace('bloody-a70', 'ant-esports-gm320')
    desc = 'Ant Esports GM320: a ₹498 wired gaming mouse that ProMouser has verified can double-click. 8 buttons, 1,000 Hz, RGB. Specs, CPS rating and where to buy.'
    head = re.sub(r'(<meta (?:name|property)="(?:og:)?description" content=")[^"]*', lambda x: x.group(1) + desc, head)
    spec = [('Weight', f'~{m["weight"]} g (estimate)', ''), ('Max DPI', '12,800', ''), ('Tracking speed', 'Not published', 'na'), ('Max acceleration', 'Not published', 'na'), ('Polling rate', '1,000 Hz', ''), ('Connection', 'Wired (braided cable)', ''),
            ('Battery life', 'None (wired)', ''), ('Programmable buttons', '8', ''), ('Sensor', 'Not published', 'na'), ('Switches', 'Not published', 'na'), ('Shape', 'Ergonomic · Right-handed', ''), ('Best grips', 'Palm / Claw', ''),
            ('Hand sizes', 'Medium / Large', ''), ('Minecraft CPS potential', f'{m["cps"]["label"]} ({m["cps"]["level"]}/5)', ''), ('Lowest trusted price', '₹498 · Amazon.in', ''), ('ProMouser rating', 'Not published', 'na')]
    rel = [BY[i] for i in ('glorious-model-o', 'bloody-a70', 'hyperx-pulsefire-haste-2', 'glorious-model-o-minus', 'redragon-m711-cobra', 'logitech-g102-lightsync')]
    relh = ''.join(f'<a href="../{r["page"]}" class="reveal"><img src="../assets/images/mice/{r["img"]}{".svg" if r["img"].startswith("art/") else "-480.webp"}" alt="" width="52" height="64" loading="lazy"><span><b>{e(r["short"])}</b><small>{r["weight"]} g · {num(r["poll"])} Hz</small></span></a>' for r in rel)
    fc = lambda ic, h4, p: f'<div class="feature-card"><div class="fc-icon" data-icon="{ic}"></div><h4>{h4}</h4><p>{p}</p></div>'
    main = f'''<main id="main" tabindex="-1">

    <section class="review-hero" id="overview">
      <div class="container review-grid" style="--c:var(--s3)">
        <div class="review-copy">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="../mice.html">Mice</a><span>/</span><span>Ant Esports</span></nav>
          <span class="section-label">Ant Esports · Budget · Minecraft</span>
          <h1 class="review-title">Ant Esports GM320</h1>
          <p class="review-tagline">The cheapest mouse we’ve verified can <em>double-click</em>.</p>
          <p class="review-intro">At around ₹498, the GM320 is the budget way into high-CPS Minecraft PvP: ProMouser has verified that it double-clicks, so butterfly and jitter clicking register extra clicks the way they do on a Glorious Model O. The trade-off is build: the shell feels less solid and the stock skates glide less smoothly than the pricier double-clickers.</p>
          <div class="hero-quick"><div><span>Weight</span><b>~{m["weight"]}<small> g</small></b></div><div><span>Max DPI</span><b>12,800<small></small></b></div><div><span>Polling</span><b>1,000<small> Hz</small></b></div><div><span>Minecraft CPS</span><b>{e(m["cps"]["label"])}<small></small></b></div><div><span>Price</span><b>₹498<small></small></b></div></div>
          <div class="hero-cta">
<a class="btn btn-primary" href="{m["buy"]}" target="_blank" rel="noopener noreferrer">Find it on Amazon · ₹498</a>
<a class="btn btn-ghost" href="minecraft.html">Back to Minecraft Mice</a>
</div>
          <div class="hero-cta" style="margin-top:.6rem"><button class="watch-btn" type="button" data-watch="ant-esports-gm320" data-price="498" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg><span class="wl">Watch price</span></button></div>
        </div>
        <div class="review-stage" style="--c:var(--s3)">
          <div class="stage-badge"><i></i>Ant Esports GM320</div>
          {picture(m, "../", "(max-width: 960px) 90vw, 520px", eager=True)}
        </div>
      </div>
    </section>
    <div class="container"><nav class="pill-nav" aria-label="On this page"><div class="inner"><a href="#overview">Overview</a><a href="#stats">Stats</a><a href="#details">Details</a><a href="#verdict">Our take</a><a href="#buy">Where to buy</a></div></nav></div>
    {cps_section(m, "../")}
    <section class="stats-section" id="stats">
      <div class="container" style="--c:var(--s3)">
        <div class="section-header reveal">
          <span class="section-label">Spec sheet</span>
          <h2>The <em>numbers</em>, explained</h2>
          <p>What each spec means in plain English, and who the GM320 suits. We don’t rank mice against each other — the right one depends on your hands, games and budget.</p>
        </div>
        <div class="statboard" data-mouse-profile="ant-esports-gm320"></div>
        <div style="margin-top:20px" class="reveal"><dl class="spec-table">{"".join(f'<div><dt>{a}</dt><dd class="{c}">{b}</dd></div>' for a, b, c in spec)}</dl><p class="stat-disclaimer">{e(m["variantNote"])} </p><p class="stat-disclaimer">Specs are retailer-listed headline figures and may differ by batch or region. Confirm current details with the seller before buying.</p></div>
      </div>
    </section>
    <section class="about-section" id="details"><div class="container">
      <div class="section-header reveal"><span class="section-label">Why it stands out</span><h2>Double clicks for <em>under ₹500</em></h2><p>What you get, and what you give up compared with the pricier double-clickers.</p></div>
      <div class="pc-grid reveal"><div class="panel pc pros"><h3>Why you’d pick it</h3><ul>{VER_PRO}<li class="pro"><b>Absurd value</b><span>Around ₹498, roughly a twelfth of a Glorious Model O.</span></li><li class="pro"><b>8 programmable buttons</b><span>Side buttons and software for binds and macros.</span></li><li class="pro"><b>RGB and a braided cable</b><span>Looks the part, and the cable doesn’t snag as much as rubber ones.</span></li></ul></div>
      <div class="panel pc cons"><h3>Think twice if…</h3><ul><li class="con"><b>Build and skates</b><span>{e(m["caveat"])}</span></li><li class="con"><b>Heavier than PvP favourites</b><span>It’s a full-size wired mouse, so it isn’t as quick to flick as a 60 g ultralight.</span></li><li class="con"><b>Unpublished specs</b><span>Ant Esports doesn’t publish the sensor, switches or weight.</span></li></ul></div></div>
    </div></section>
    <section class="quick-links" id="verdict"><div class="container">
      <div class="section-header reveal"><span class="section-label">ProMouser take</span><h2>Who it fits best</h2></div>
      <div class="about-cards reveal">{fc("Pro", "Good fit if", "You want to butterfly or jitter click in 1.8 PvP and your budget is tight. It does the one thing most mice can’t: double-click.")}{fc("Warn", "Consider alternatives if", "You care about a premium feel, smooth glide or a light shell. The Glorious Model O, Model O- and HyperX Pulsefire Haste 2 double-click too and are better built.")}{fc("Verdict", "Verdict", "The best value double-clicker on ProMouser. Slightly behind the rest on build quality and skates, far ahead on price.")}</div>
    </div></section>
    <section class="about-section" id="buy"><div class="container">
      <div class="section-header reveal"><span class="section-label">Where to buy</span><h2>Trusted buying and product links</h2><p>Prices and availability can change quickly, so check the listing details and seller before placing an order.</p></div>
      <div class="about-cards reveal"><div class="store-card"><div class="fc-icon" data-icon="Yes"></div><h4>Amazon India</h4><p class="price-line"><span class="price-label">Listed price</span> <span class="price-tag">₹498</span></p><a class="btn btn-outline" href="{m["buy"]}" rel="noopener noreferrer" target="_blank">Buy on Amazon</a></div>
      <div class="store-card"><div class="fc-icon" data-icon="Setup"></div><h4>Check the model</h4><p>Pick the wired <strong>GM320 RGB</strong>, not the wireless GM320 Pro: we’ve only verified the wired one.</p></div></div>
    </div></section>
    <section class="about-section"><div class="container">
      <div class="section-header reveal"><span class="section-label">Keep looking</span><h2>More mice to <em>compare</em></h2></div>
      <div class="related">{relh}</div>
      <div class="hero-cta"><a href="../mice/compare.html?m=ant-esports-gm320,glorious-model-o" class="btn btn-primary">Compare with the Model O</a><a href="../mice.html#explorer" class="btn btn-ghost">Open the stats lab</a></div>
    </div></section>
  </main>'''
    tail = src[src.index('</main>') + len('</main>'):]
    open('mice/ant-esports-gm320.html', 'w').write(head + main + tail)

def kreo_page():
    m = BY['kreo-hawk']; src = open('mice/bloody-a70.html').read()
    head = src[:src.index('<main')].replace('Bloody A70 — ProMouser', 'Kreo Hawk — ProMouser').replace('bloody-a70', 'kreo-hawk')
    desc = 'Kreo Hawk: a comfortable ₹1,199 ergonomic gaming mouse with a PixArt 3327 sensor, 8 buttons and RGB. ProMouser tested it: it can’t double-click. Specs and where to buy.'
    head = re.sub(r'(<meta (?:name|property)="(?:og:)?description" content=")[^"]*', lambda x: x.group(1) + desc, head)
    spec = [('Weight', '110 g', ''), ('Max DPI', '12,400', ''), ('Tracking speed', 'Not published', 'na'), ('Max acceleration', '30 G', ''), ('Polling rate', '1,000 Hz', ''), ('Connection', 'Wired', ''),
            ('Battery life', 'None (wired)', ''), ('Programmable buttons', '8', ''), ('Sensor', 'PixArt PAW3327', ''), ('Switches', 'Not published', 'na'), ('Shape', 'Ergonomic · Right-handed', ''), ('Size', '125 × 80 × 46 mm', ''),
            ('Best grips', 'Palm / Claw', ''), ('Minecraft CPS potential', f'{m["cps"]["label"]} (1/5)', ''), ('Lowest trusted price', '~₹1,199 · Flipkart', ''), ('ProMouser rating', 'Not published', 'na')]
    rel = [BY[i] for i in ('logitech-g102-lightsync', 'razer-deathadder-essential', 'ant-esports-gm320', 'redragon-m711-cobra', 'glorious-model-d', 'razer-deathadder-v3')]
    relh = ''.join(f'<a href="../{r["page"]}" class="reveal"><img src="../assets/images/mice/{r["img"]}{".svg" if r["img"].startswith("art/") else "-480.webp"}" alt="" width="52" height="64" loading="lazy"><span><b>{e(r["short"])}</b><small>{r["weight"]} g · {num(r["poll"])} Hz</small></span></a>' for r in rel)
    fc = lambda ic, h4, p: f'<div class="feature-card"><div class="fc-icon" data-icon="{ic}"></div><h4>{h4}</h4><p>{p}</p></div>'
    main = f'''<main id="main" tabindex="-1">

    <section class="review-hero" id="overview">
      <div class="container review-grid" style="--c:var(--s6)">
        <div class="review-copy">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="../mice.html">Mice</a><span>/</span><span>Kreo</span></nav>
          <span class="section-label">Kreo · Budget · Comfort</span>
          <h1 class="review-title">Kreo Hawk</h1>
          <p class="review-tagline">A comfy, budget <em>ergonomic</em> mouse with a proper sensor.</p>
          <p class="review-intro">The Kreo Hawk is an Indian-brand wired mouse with a sculpted right-hand shape, a thumb rest, 8 programmable buttons and a PixArt 3327 sensor for around ₹1,199. It’s comfortable for long sessions and fine for FPS. ProMouser tested it for Minecraft clicking: it can’t double-click, so it isn’t a 1.8 PvP pick.</p>
          <div class="hero-quick"><div><span>Weight</span><b>110<small> g</small></b></div><div><span>Max DPI</span><b>12,400<small></small></b></div><div><span>Polling</span><b>1,000<small> Hz</small></b></div><div><span>Minecraft CPS</span><b>{e(m["cps"]["label"])}<small></small></b></div><div><span>Price</span><b>~₹1,199<small></small></b></div></div>
          <div class="hero-cta">
<a class="btn btn-primary" href="{m["buy"]}" target="_blank" rel="noopener noreferrer">Find it on Flipkart</a>
<a class="btn btn-ghost" href="../mice.html">Browse all mice</a>
</div>
          <div class="hero-cta" style="margin-top:.6rem"><button class="watch-btn" type="button" data-watch="kreo-hawk" data-price="1199" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg><span class="wl">Watch price</span></button></div>
        </div>
        <div class="review-stage" style="--c:var(--s6)">
          <div class="stage-badge"><i></i>Kreo Hawk</div>
          {picture(m, "../", "(max-width: 960px) 90vw, 520px", eager=True)}
        </div>
      </div>
    </section>
    <div class="container"><nav class="pill-nav" aria-label="On this page"><div class="inner"><a href="#overview">Overview</a><a href="#stats">Stats</a><a href="#details">Details</a><a href="#verdict">Our take</a><a href="#buy">Where to buy</a></div></nav></div>
    {cps_section(m, "../")}
    <section class="stats-section" id="stats">
      <div class="container" style="--c:var(--s6)">
        <div class="section-header reveal"><span class="section-label">Spec sheet</span><h2>The <em>numbers</em>, explained</h2>
          <p>What each spec means in plain English, and who the Hawk suits. We don’t rank mice against each other — the right one depends on your hands, games and budget.</p></div>
        <div class="statboard" data-mouse-profile="kreo-hawk"></div>
        <div style="margin-top:20px" class="reveal"><dl class="spec-table">{"".join(f'<div><dt>{a}</dt><dd class="{c}">{b}</dd></div>' for a, b, c in spec)}</dl><p class="stat-disclaimer">{e(m["variantNote"])} </p><p class="stat-disclaimer">Specs are manufacturer-published headline figures and may differ by variant or region. Confirm current details with the seller before buying.</p></div>
      </div>
    </section>
    <section class="about-section" id="details"><div class="container">
      <div class="section-header reveal"><span class="section-label">Why it stands out</span><h2>Comfort on a <em>budget</em></h2><p>What you get for around ₹1,200, and what you don’t.</p></div>
      <div class="pc-grid reveal"><div class="panel pc pros"><h3>Why you’d pick it</h3><ul><li class="pro"><b>Comfortable shape</b><span>A sculpted right-hand shell with a thumb rest, easy to hold for hours.</span></li><li class="pro"><b>A real sensor</b><span>The PixArt 3327 tracks cleanly for everyday play and FPS.</span></li><li class="pro"><b>8 programmable buttons</b><span>Side buttons and software for binds and macros.</span></li></ul></div>
      <div class="panel pc cons"><h3>Think twice if…</h3><ul>{CAPPED_CON}<li class="con"><b>Not light</b><span>At about 110 g it’s steadier than it is quick to flick.</span></li><li class="con"><b>Right-handed only</b><span>The ergonomic shape won’t work for left-handed players.</span></li></ul></div></div>
    </div></section>
    <section class="quick-links" id="verdict"><div class="container">
      <div class="section-header reveal"><span class="section-label">ProMouser take</span><h2>Who it fits best</h2></div>
      <div class="about-cards reveal">{fc("Pro", "Good fit if", "You want a comfortable palm-grip mouse for work, casual FPS or 1.9+ Minecraft on a small budget.")}{fc("Warn", "Consider alternatives if", "You play 1.8 PvP: it can’t double-click. The Ant Esports GM320 does for ₹498, and the Glorious Model D gives you a similar ergonomic shape that double-clicks.")}{fc("Verdict", "Verdict", "A solid, comfy budget mouse. Just don’t buy it for CPS.")}</div>
    </div></section>
    <section class="about-section" id="buy"><div class="container">
      <div class="section-header reveal"><span class="section-label">Where to buy</span><h2>Trusted buying and product links</h2><p>Prices and availability can change quickly, so check the listing details and seller before placing an order.</p></div>
      <div class="about-cards reveal"><div class="store-card"><div class="fc-icon" data-icon="Yes"></div><h4>Flipkart</h4><p class="price-line"><span class="price-label">Listed price</span> <span class="price-tag">~₹1,199</span></p><a class="btn btn-outline" href="{m["buy"]}" rel="noopener noreferrer" target="_blank">Search on Flipkart</a></div>
      <div class="store-card"><div class="fc-icon" data-icon="Guide"></div><h4>Official page</h4><p>Specs and software from Kreo.</p><a class="btn btn-outline" href="https://kreo-tech.com/products/hawk-gaming-mouse" rel="noopener noreferrer" target="_blank">View on kreo-tech.com</a></div></div>
    </div></section>
    <section class="about-section"><div class="container">
      <div class="section-header reveal"><span class="section-label">Keep looking</span><h2>More mice to <em>compare</em></h2></div>
      <div class="related">{relh}</div>
      <div class="hero-cta"><a href="../mice/compare.html?m=kreo-hawk,logitech-g102-lightsync" class="btn btn-primary">Compare with the G102</a><a href="../mice.html#explorer" class="btn btn-ghost">Open the stats lab</a></div>
    </div></section>
  </main>'''
    open('mice/kreo-hawk.html', 'w').write(head + main + src[src.index('</main>') + len('</main>'):])

# ---------------------------------------------------------------- 4. Minecraft guide: verified list + why the rest are capped
EXPLAIN = '''<section class="about-section" id="capped"><div class="container">
<div class="section-header reveal"><span class="section-label">Why most mice are capped</span><h2>How brands <em>limit</em> your CPS</h2>
<p>Butterfly, jitter and drag clicking all hit one button many times, very fast. Whether those presses count depends on the mouse, not just your fingers.</p></div>
<div class="about-cards reveal">
<div class="feature-card"><div class="fc-icon" data-icon="Time"></div><h4>Debounce: the built-in delay</h4><p>A mechanical switch “bounces” for a few milliseconds when pressed: its metal contacts touch and separate several times. So the mouse’s firmware waits a set time after each click (the debounce) and ignores anything inside it. A drag or butterfly click puts presses only a few milliseconds apart, so they land inside that window and get merged into one click. That window is the cap.</p></div>
<div class="feature-card"><div class="fc-icon" data-icon="Protect"></div><h4>Why brands set it high</h4><p>As switches wear, they start double-clicking by themselves, which is the most common reason mice get returned. A longer debounce hides that, so most brands ship a fixed, safe delay and don’t let you change it. Great for reliability, bad for CPS.</p></div>
<div class="feature-card"><div class="fc-icon" data-icon="Light"></div><h4>Optical switches never bounce</h4><p>Optical and hybrid switches (most Razer mice, Logitech’s LIGHTFORCE) read the press with a beam of light, so there’s no bounce at all: one press is always exactly one click. Brilliant for FPS, but a butterfly or drag click can never sneak in an extra one.</p></div>
<div class="feature-card"><div class="fc-icon" data-icon="Click"></div><h4>What “double-clicks” means</h4><p>A mouse that double-clicks has a short enough debounce (Glorious lets you set it near 0 ms) that one quick finger movement can register as two clicks. That is how butterfly clicking reaches 20+ CPS. Some servers limit CPS or ban double-click mice and macros, so check the rules where you play.</p></div>
</div>
<div class="panel reveal" style="margin-top:18px"><h3 style="margin-bottom:.4rem">Why we only list verified mice</h3><p class="panel-note" style="margin:0">Plenty of forum posts claim a mouse “can drag click”. ProMouser only marks a mouse as double-clicking once it has been checked by a person. Every other mouse is listed as <b>can’t double-click</b> until it is, even if it has an adjustable debounce on paper. Right now that verified list is the {names}.</p></div>
</div></section>'''
def minecraft_page():
    p = 'mice/minecraft.html'; t = open(p).read()
    t = t.replace('<p class="cps-hint"><strong>Chasing CPS?</strong> The Glorious Model O and Bloody A70 offer the most click-speed potential. <a href="#top-cps">See them first →</a></p>',
                  f'<p class="cps-hint"><strong>Chasing CPS?</strong> Only {len(VER)} mice on ProMouser are verified to double-click. <a href="#top-cps">See them first →</a></p>')
    t = re.sub(r'<p class="cps-hint"><strong>Chasing CPS\?</strong> Only \d+ mice', f'<p class="cps-hint"><strong>Chasing CPS?</strong> Only {len(VER)} mice', t)
    if 'id="verified"' in t:   # regenerate the verified list + explainer
        start = t.index('<section class="about-section" id="verified">'); end = t.index('</section>', t.index('<section class="about-section" id="capped">')) + len('</section>')
    else: start = t.index('<section class="about-section" id="more-picks">'); end = t.index('</section>', start) + len('</section>')
    rest = [m for m in VER if m['cps']['level'] < 5]
    more = ('<section class="about-section" id="verified"><div class="container">\n<div class="section-header reveal"><span class="section-label">Verified double-clickers</span><h2>The other mice that <em>double-click</em></h2>'
            '<p>Together with the Model O and Bloody A70 above, these are the only mice ProMouser has verified can double-click. Every other mouse can’t (the Redragon M711 Cobra drag clicks, but doesn’t butterfly well).</p></div>\n<div class="mouse-grid">'
            + ''.join(card(m, '../') for m in sorted(rest, key=lambda x: x['price'] or 0)) + '</div></div></section>\n' + EXPLAIN.format(names=e(VER_NAMES)))
    t = t[:start] + more + t[end:]
    if t.count('id="capped"') > 1: raise SystemExit('duplicate explainer')
    open(p, 'w').write(t)

# ---------------------------------------------------------------- 5. catalogue: add the GM320 card
def catalogue():
    p = 'mice.html'; t = open(p).read()
    if 'data-id="ant-esports-gm320"' not in t:
        t = t.replace('<div class="mouse-grid catalog-grid" data-catalog>', '<div class="mouse-grid catalog-grid" data-catalog>' + card(BY['ant-esports-gm320'], ''), 1)
    if 'data-id="kreo-hawk"' not in t:   # alphabetical: before the first card whose name sorts after it
        ids = re.findall(r'<article class="mouse-card reveal" data-id="([a-z0-9-]+)"', t[t.index('data-catalog'):])
        nxt = next(i for i in ids if BY.get(i) and BY[i]['name'].lower() > 'kreo hawk')
        t = t.replace(f'<article class="mouse-card reveal" data-id="{nxt}"', card(BY['kreo-hawk'], '') + f'<article class="mouse-card reveal" data-id="{nxt}"', 1)
    open(p, 'w').write(t)

if __name__ == '__main__':
    gm320_page(); catalogue()
    minecraft_page(); kreo_page()
    for f in glob.glob('*.html') + glob.glob('mice/*.html') + glob.glob('blog/*.html'):
        t = open(f).read(); n = patch_cards(t)
        if n != t: open(f, 'w').write(n)
    for m in MICE:
        f = m['page']
        if os.path.exists(f) and m['id'] not in ('ant-esports-gm320', 'kreo-hawk'): patch_page(f, m)
    print('verified:', VER_NAMES)
