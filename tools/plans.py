# Rewrites the plan pages (basic/lite/ultra) of the ProMouser site from one feature matrix.
import re, sys, os
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda f: os.path.join(ROOT, f)

ROWS = [  # feature, free, basic, lite, ultra
  ('Price', 'Free', '₹599 once', '₹2,499 once', '₹3,199 once'),
  ('Daily credits', '5', '7', '20', '30'),
  ('Credits per recommendation', '1', '1', '2', '0 · unlimited'),
  ('Results per run', 'Top 3', 'Top 5', 'Every match', 'Every match'),
  ('Match breakdown on every pick', '—', '✓', '✓', '✓'),
  ('Check any mouse against your answers', '—', '✓', '✓', '✓'),
  ('Recommendation history', '12 runs', '30 runs', '50 runs', '100 runs'),
  ('Advanced preferences (hand length, left-handed, MC version, budget, buttons, click style, shape)', '—', '—', '✓', '✓'),
  ('Advanced CPS stats (double clicks, stray clicks, per-second graph)', '—', '—', '✓', '✓'),
  ('Personal bests and recent sessions on every test', '—', '—', '✓', '✓'),
  ('Statistics for every test (trend charts, consistency, improvement, percentile, CSV export, synced to your account)', '—', '—', '—', '✓'),
  ('Saved preference profiles', '—', '—', '—', 'Up to 10'),
  ('Price watchlist', '—', '—', '—', 'Up to 50 mice'),
  ('Sensitivity converter', '—', '—', '—', '✓'),
  ('Shortlist export (PDF / copy)', '—', '—', '—', '✓'),
  ('Assistant memory', '—', '—', '—', '✓'),
  ('ProMouser Turbo on ProMouser Online', '—', '—', '—', '1 year included (₹2,388 value)'),
  ('Theme', 'Red &amp; black', 'Dark blue &amp; black', 'Blue &amp; black', 'Purple &amp; black'),
]
def table(hl):
    cls = {'basic': 'basic-col', 'lite': 'lite-col', 'ultra': 'ultra-col'}
    head = '<tr><th>Feature</th><th>Free</th>' + ''.join(f'<th class="{cls[k]}{" hl" if k == hl else ""}">{k.title()}</th>' for k in ('basic', 'lite', 'ultra')) + '</tr>'
    body = ''.join('<tr><td>' + r[0] + '</td><td>' + r[1] + '</td>' + ''.join(f'<td class="{cls[k]}{" hl" if k == hl else ""}">{v}</td>' for k, v in zip(('basic', 'lite', 'ultra'), r[2:])) + '</tr>' for r in ROWS)
    return f'<div class="table-wrap reveal"><table class="plan-table four"><thead>{head}</thead><tbody>{body}</tbody></table></div>'

def card(icon, h, p): return f'<div class="feature-card reveal"><div class="fc-icon" data-icon="{icon}"></div><h4>{h}</h4><p>{p}</p></div>'
def ucard(icon, h, p): return f'<div class="u-feat reveal"><div class="fc-icon" data-icon="{icon}"></div><h4>{h}</h4><p>{p}</p></div>'
FINE = '<p class="fine" style="text-align:center;margin-top:1rem">Demo checkout: nothing is charged. Prices are placeholders until real payments are connected. Plans are one-time payments: buying a higher plan upgrades you for life, and a lower one never downgrades you.</p>'

BASIC = f'''
    <section class="theme-basic basic-wrap">
    <section class="about-section page-hero" id="hero">
      <div class="container about-grid">
        <div class="about-text reveal">
          <span class="section-label">ProMouser Basic</span>
          <h1>A little more, <em>for less</em></h1>
          <p>Two extra credits every day, your top 5 matches instead of 3, a breakdown of why each mouse was picked, a way to check any mouse against your answers, and a deep navy look.</p>
          <p class="shop-price"><b>₹599</b> once <small>· yours for life</small></p>
          <div class="hero-cta"><button class="btn btn-primary" data-buy="basic-lifetime" type="button">Get Basic</button><a class="btn btn-ghost" href="#compare">Compare plans</a></div>
        </div>
        <div class="lite-preview basic-preview reveal" aria-hidden="true">
          <div class="lp-top"><span class="plan-tag basic">Basic</span><b>Your shortlist</b><span class="chip">Top 5</span></div>
          <div class="lp-row"><i style="--w:94%"></i><span>Glorious Model O</span><b>94%</b></div>
          <div class="lp-row"><i style="--w:89%"></i><span>Bloody A70</span><b>89%</b></div>
          <div class="lp-row"><i style="--w:81%"></i><span>Razer Viper V3 Pro</span><b>81%</b></div>
          <div class="lp-row"><i style="--w:76%"></i><span>Logitech G Pro X Superlight 2</span><b>76%</b></div>
          <div class="lp-row dim"><i style="--w:66%"></i><span>Check any mouse: G502 X → #11</span><b>66%</b></div>
        </div>
      </div>
    </section>
    <section class="about-section" id="features"><div class="container">
      <div class="section-header reveal"><span class="section-label">What you get</span><h2>Everything in Free, <em>plus</em></h2></div>
      <div class="about-cards">
        {card('Time', '7 credits a day', 'Two more free credits every day than a free account. That’s two more recommendations, every day, for life.')}
        {card('Pro', 'Top 5 matches', 'See your five best mice for every game instead of three.')}
        {card('Stats', 'Match breakdown', 'Every pick shows how it scored on weight, shape, grip, sensor, connection and more, so you know why it’s there.')}
        {card('Versus', 'Check any mouse', 'Already eyeing a mouse? Pick it from the full list and see its score, where it would rank and what holds it back.')}
        {card('Note', 'Longer history', 'Your last 30 recommendation runs, instead of 12, on your Elite Dashboard.')}
        {card('Style', 'Dark blue &amp; black theme', 'The whole site switches to a deep navy-and-black look, a shade darker than Lite’s blue.')}
      </div></div></section>
    <section class="about-section" id="compare"><div class="container">
      <div class="section-header reveal"><span class="section-label">Compare plans</span><h2>Free vs <em>Basic</em> vs Lite vs Ultra</h2></div>
      {table('basic')}
      <p class="panel-note reveal" style="text-align:center">Want every match and advanced preferences? <a href="lite.html" style="color:var(--accent)">See Lite →</a> · Want it all, plus a year of Turbo? <a href="ultra.html" style="color:var(--accent)">See Ultra →</a></p>
      <div class="hero-cta reveal" style="justify-content:center"><button class="btn btn-primary" data-buy="basic-lifetime" type="button">Get Basic for ₹599</button><a class="btn btn-ghost" href="shop.html">See the shop</a></div>
      {FINE}
    </div></section>
    </section>
'''

LITE = f'''
    <section class="theme-lite lite-wrap">
    <section class="about-section page-hero" id="hero">
      <div class="container about-grid">
        <div class="about-text reveal">
          <span class="section-label">ProMouser Lite</span>
          <h1>More ways to find <em>your</em> mouse</h1>
          <p>Every match instead of the top few, far more precise preferences, 20 credits a day, advanced CPS stats and personal bests on every test, all in a blue-and-black look.</p>
          <p class="shop-price"><b>₹2,499</b> once <small>· yours for life</small></p>
          <div class="hero-cta"><button class="btn btn-primary" data-buy="lite-lifetime" type="button">Get Lite</button><a class="btn btn-ghost" href="#compare">Compare plans</a></div>
        </div>
        <div class="lite-preview reveal" aria-hidden="true">
          <div class="lp-top"><span class="plan-tag lite">Lite</span><b>Your shortlist</b><span class="chip">All 41 matches</span></div>
          <div class="lp-row"><i style="--w:96%"></i><span>Glorious Model O</span><b>96%</b></div>
          <div class="lp-row"><i style="--w:91%"></i><span>Bloody A70</span><b>91%</b></div>
          <div class="lp-row"><i style="--w:78%"></i><span>Razer DeathAdder V3</span><b>78%</b></div>
          <div class="lp-row"><i style="--w:70%"></i><span>Logitech Superlight Pro X</span><b>70%</b></div>
          <div class="lp-row dim"><i style="--w:55%"></i><span>+ every other mouse, with breakdowns</span><b>…</b></div>
        </div>
      </div>
    </section>
    <section class="about-section" id="features"><div class="container">
      <div class="section-header reveal"><span class="section-label">What you get</span><h2>Everything in Basic, <em>and then some</em></h2></div>
      <div class="about-cards">
        {card('Pro', 'Every match', 'See every mouse in every game panel, each with a breakdown of why it scored the way it did.')}
        {card('Hands', 'Hand size &amp; length', 'Small, medium or large, or your exact hand length in cm, plus a left-handed fit.')}
        {card('MC', 'Minecraft versions', '1.8 PvP rewards raw CPS; 1.9+ rewards comfort and control. Tell us which you play.')}
        {card('Value', 'Budget', 'Set a maximum in rupees and see how every mouse measures up against it.')}
        {card('Tools', 'Buttons &amp; customisation', 'Minimum button count, macros, adjustable weights, debounce settings, RGB and haptic clicks.')}
        {card('Click', 'Advanced CPS stats', 'Double clicks, stray right clicks and a second-by-second graph of every CPS run.')}
        {card('Stats', 'Bests on every test', 'Your personal bests and recent sessions under every test: reaction, aim, polling, scroll, buttons and more.')}
        {card('Time', '20 credits a day', 'Four times a free account. Lite runs use 2 credits each, so that’s 10 full recommendations a day.')}
        {card('Style', 'Blue &amp; black theme', 'The whole site switches to a cool blue-and-black look.')}
      </div></div></section>
    <section class="about-section" id="compare"><div class="container">
      <div class="section-header reveal"><span class="section-label">Compare plans</span><h2>Free vs Basic vs <em>Lite</em> vs Ultra</h2></div>
      {table('lite')}
      <div class="value-strip reveal"><div><span class="plan-tag ultra">Ultra</span><b>Only ₹700 more gets you Ultra</b><p>Unlimited recommendations, statistics for every test and a full year of ProMouser Turbo (₹2,388 on its own).</p></div><a class="btn btn-primary btn-sm" href="ultra.html">See Ultra</a></div>
      <div class="hero-cta reveal" style="justify-content:center"><button class="btn btn-primary" data-buy="lite-lifetime" type="button">Get Lite for ₹2,499</button><a class="btn btn-ghost" href="shop.html">See the shop</a></div>
      {FINE}
    </div></section>
    </section>
'''

ULTRA = f'''
    <section class="theme-ultra ultra-wrap">
    <section class="about-section page-hero" id="hero">
      <div class="container about-grid">
        <div class="about-text reveal">
          <span class="ultra-badge">The ultimate deal · ProMouser Ultra</span>
          <h1 style="margin-top:1rem">Everything, <em>unlocked</em></h1>
          <p>ProMouser at full power: unlimited recommendations, statistics for every test, a full year of ProMouser Turbo, saved profiles, a price watchlist, a sensitivity converter and an assistant that remembers you.</p>
          <p class="shop-price"><b>₹3,199</b> once <small class="was">₹4,887 value</small> <small>· yours for life</small></p>
          <div class="hero-cta"><button class="btn btn-primary" data-buy="ultra-lifetime" type="button">Get Ultra</button><a class="btn btn-ghost" href="#compare">Compare plans</a></div>
        </div>
        <div class="lite-preview ultra-preview reveal" aria-hidden="true">
          <div class="lp-top"><span class="plan-tag ultra">Ultra</span><b>Reaction time · stats</b><span class="chip">Top 8%</span></div>
          <svg class="up-chart" viewBox="0 0 300 90"><path d="M10,70 L40,62 L70,66 L100,50 L130,54 L160,40 L190,44 L220,30 L250,34 L290,20"/></svg>
          <div class="lp-row"><i style="--w:92%"></i><span>Consistency</span><b>92%</b></div>
          <div class="lp-row"><i style="--w:74%"></i><span>Improvement · last 10</span><b>+9%</b></div>
          <div class="lp-row dim"><i style="--w:100%"></i><span>Turbo on ProMouser Online · 365 days</span><b>✦</b></div>
        </div>
      </div>
    </section>
    <section class="about-section"><div class="container">
      <div class="value-math reveal">
        <div><span>ProMouser Lite</span><b>₹2,499</b></div><i>+</i>
        <div><span>12 months of Turbo</span><b>₹2,388</b></div><i>+</i>
        <div><span>Unlimited recs, test statistics &amp; more</span><b>Ultra only</b></div><i>=</i>
        <div class="total"><span>Ultra, once</span><b>₹3,199</b><small>save ₹1,688+</small></div>
      </div>
    </div></section>
    <section class="about-section" id="features">
      <div class="container">
        <div class="section-header reveal"><span class="section-label">What you get</span><h2>Twelve reasons to go <em>Ultra</em></h2></div>
        <div class="u-feats">
          {ucard('AI', 'Unlimited recommendations', 'Generate as many shortlists as you like. Ultra runs never use credits, and show every match with a full breakdown.')}
          {ucard('Stats', 'Statistics for every test', 'Trend charts, averages, median, consistency, improvement, your percentile vs typical players and CSV export, for all 7 tests, saved to your account.')}
          {ucard('Games', 'A year of ProMouser Turbo', 'Gradient username, profile gradients, the Turbo battle pass track and an exclusive 3D mouse on ProMouser Online, for 365 days.')}
          {ucard('Setup', 'Saved profiles', 'Keep up to 10 setups like “Main PC” or “Minecraft PvP” and switch between them in one click.')}
          {ucard('Value', 'Price watchlist', 'Star up to 50 mice and see on your Elite Dashboard whether they got cheaper since you saved them.')}
          {ucard('Aim', 'Sensitivity converter', 'Move between CS2, Valorant, Apex, Overwatch 2 and TF2 without losing your aim. eDPI and cm/360 included.')}
          {ucard('Note', 'Shortlist export', 'Print or save your shortlist as a PDF, or copy it to share with a friend or a shop.')}
          {ucard('Help', 'Assistant memory', 'The assistant remembers your games, grip, hands and budget between visits.')}
          {ucard('Time', '30 credits a day', 'Credits for everything else on ProMouser, refilled every day.')}
          {ucard('Note', '100-run history', 'Your last 100 recommendation runs on your Elite Dashboard.')}
          {ucard('Fit', 'Everything in Lite and Basic', 'Every match, advanced preferences, advanced CPS stats, check any mouse, personal bests on every test.')}
          {ucard('Elite', 'Purple &amp; black theme', 'The whole site switches to Ultra’s purple-and-black look, with a glowing Ultra badge.')}
        </div>
      </div>
    </section>
    <section class="about-section" id="compare"><div class="container">
      <div class="section-header reveal"><span class="section-label">Plans</span><h2>Free vs Basic vs Lite vs <em>Ultra</em></h2></div>
      {table('ultra')}
      <div class="hero-cta reveal" style="justify-content:center;margin-top:24px"><button class="btn btn-primary" data-buy="ultra-lifetime" type="button">Get Ultra for ₹3,199</button><a class="btn btn-ghost" href="lite.html">Just want Lite?</a></div>
      {FINE}
    </div></section>
    </section>
'''

def put_main(path, inner, title=None, desc=None, src=None):
    s = open(src or path).read()
    s = re.sub(r'(<main id="main" tabindex="-1">)(.*?)(\n  </main>)', lambda m: m.group(1) + '\n' + inner + m.group(3), s, flags=re.S)
    if title:
        s = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', s)
        s = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + title, s)
    if desc:
        s = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + desc, s)
        s = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + desc, s)
    if src:
        s = s.replace('https://promouser.website/lite.html', 'https://promouser.website/' + os.path.basename(path))
    open(path, 'w').write(s)

put_main(P('basic.html'), BASIC, 'ProMouser Basic — ProMouser', 'ProMouser Basic: 7 daily credits, your top 5 matches, a match breakdown and check-any-mouse, for ₹599 once.', src=P('lite.html'))
put_main(P('lite.html'), LITE, None, 'ProMouser Lite: every match, advanced preferences, 20 daily credits, advanced CPS stats and bests on every test, for ₹2,499 once.')
put_main(P('ultra.html'), ULTRA, None, 'ProMouser Ultra: unlimited recommendations, statistics for every test, a year of ProMouser Turbo and every feature, for ₹3,199 once.')
print('ok')
