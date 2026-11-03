# Builds the skill-test pages (tests2.js) from aim-trainer.html, refreshes the "More tests" chips on
# every test page, adds the cards to the test hub and updates the test count in the nav. Re-runnable.
import os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PAGES = [
  ('tracking-test', 'tracking', 'Tracking test', 'Tracking test: keep your cursor on a moving target', 'Free tracking test: keep your cursor on a smoothly moving target for 15, 30 or 60 seconds. Measures your % time on target and your longest lock.',
   'Stay <em>locked on</em>', 'Click the target, then keep your cursor on it while it moves. Three speeds and three lengths.', 'Track',
   [('What does the tracking test measure?', 'How much of the time your cursor stays on a moving target. It trains the smooth aim used against strafing players in Apex, Overwatch and Valorant.'),
    ('How do I track better?', 'Lower your sensitivity a little, keep your grip relaxed and move from the elbow. Jerky corrections lose more time than being slightly behind.')]),
  ('flick-test', 'flick', 'Flick test', 'Flick test: how fast and how clean are your flicks?', 'Free flick test: snap from the centre to a target 20 times. Measures time per flick, accuracy and path efficiency (how straight your flicks are).',
   'Snap to <em>the target</em>', 'Click the centre dot, then flick to the target that appears. Twenty flicks, timed from the moment each target appears.', 'Aim',
   [('What is path efficiency?', 'The straight-line distance to the target divided by how far your cursor actually travelled. Overshooting, curving or correcting a lot lowers it.'),
    ('How is this different from the aim trainer?', 'Every flick starts from the same centre point and is a long one, like snapping to an enemy that appears at the edge of your screen.')]),
  ('target-rush', 'rush', 'Target rush', 'Target rush: shrinking targets, faster and faster', 'Free target rush game: hit shrinking targets before they disappear. They get faster every hit. Three lives. How many can you hit?',
   'Faster. <em>And faster.</em>', 'Every target shrinks away. Each one you hit makes the next one quicker. Let three go and the run is over.', 'Speed',
   [('How long do targets last?', 'The first lasts 1.7 seconds. Every hit makes the next one about 3.5% shorter, down to under half a second.'),
    ('Do missed clicks cost a life?', 'No, only targets that shrink away do. Missed clicks lower your accuracy.')]),
  ('rhythm-test', 'rhythm', 'Rhythm test', 'Rhythm test: click on the beat', 'Free rhythm and click timing test: click on 16 beats at 90 to 180 BPM. Measures how many milliseconds off the beat you are, and whether you rush or drag.',
   'Click on <em>the beat</em>', 'After a four-beat count-in, click once on every beat. We measure how far off each click is.', 'Time',
   [('Why does timing matter for a mouse?', 'Steady timing is what makes jitter and butterfly clicking fast, and it helps with burst fire, tap strafing and ability spam.'),
    ('My result looks late. Why?', 'Bluetooth headphones and some speakers add delay to the sound. Use the Visual only option and follow the pulse instead.')]),
  ('circle-test', 'circle', 'Circle test', 'Circle test: draw a perfect circle (and check for angle snapping)', 'Free mouse control test: draw a circle in one stroke and get a roundness score. Also checks whether your mouse has angle snapping turned on.',
   'Draw a <em>perfect circle</em>', 'Hold the left button and draw a circle around the dot in one stroke. Switch modes to check for angle snapping.', 'Rate',
   [('What is angle snapping?', 'A sensor feature that straightens near-horizontal and near-vertical movements. It can feel nice in Windows but fights you when aiming, so most players turn it off.'),
    ('How is roundness scored?', 'We measure how much your distance from the dot varies around the circle. A perfectly even circle scores 100%. Gaps and extra laps don’t count.')]),
  ('dpi-analyzer', 'dpi', 'DPI analyzer', 'DPI analyzer: measure your mouse’s real DPI', 'Free DPI analyzer: move your mouse a measured distance along a ruler and find its real DPI, and how far it is from the advertised setting.',
   'Find your <em>real DPI</em>', 'You need a ruler. Move the mouse exactly the distance you choose, three times, and we work out the true DPI.', 'Stats',
   [('Why is my measured DPI different?', 'Sensors are rarely exact: a few percent off the setting is normal. Mousepad surface and lift-off can also change the reading a little.'),
    ('Does Windows pointer speed matter?', 'In Chrome and Edge we read raw mouse movement, so it doesn’t. In other browsers, use the default pointer speed (10 of 20) with “Enhance pointer precision” off.')]),
]
ALL = [('cps-test', 'CPS test'), ('double-click-test', 'Double click test'), ('reaction-test', 'Reaction time'), ('aim-trainer', 'Aim trainer'), ('tracking-test', 'Tracking test'), ('flick-test', 'Flick test'),
       ('target-rush', 'Target rush'), ('rhythm-test', 'Rhythm test'), ('circle-test', 'Circle test'), ('dpi-analyzer', 'DPI analyzer'), ('polling-rate-test', 'Polling rate test'), ('scroll-test', 'Scroll wheel test'), ('mouse-button-test', 'Mouse button test')]
NTOOLS = len(ALL) + 1   # + sensitivity converter

def chips(here):
    return '<div class="panel reveal" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><b style="margin-right:6px">More tests</b>' + ''.join(f'<a class="chip" href="{h}">{l}</a>' for h, l in ALL if h != here) + '<a class="chip" href="tests">All tests →</a></div>'

tpl = open('aim-trainer.html').read()
for slug, test, name, title, desc, h1, sub, icon, faq in PAGES:
    s = tpl
    s = re.sub(r'<title>.*?</title>', f'<title>{title} — ProMouser</title>', s, count=1)
    for attr in ('name="description"', 'property="og:description"'):
        s = re.sub(rf'<meta {attr} content="[^"]*"', f'<meta {attr} content="{desc}"', s, count=1)
    s = re.sub(r'<meta property="og:title" content="[^"]*"', f'<meta property="og:title" content="{title} — ProMouser"', s, count=1)
    s = s.replace('promouser.website/aim-trainer"', f'promouser.website/{slug}"')
    faqs = ''.join(f'<details class="faq-item"><summary>{q}</summary><p>{a}</p></details>' for q, a in faq)
    main = f'''<main id="main" tabindex="-1">

    <section class="about-section page-hero" id="{test}">
      <div class="container">
        <div class="section-header reveal"><span class="section-label">{name}</span><h1>{h1}</h1><p>{sub}</p></div>
        <div data-test="{test}"></div>
        <noscript><p class="panel-note">This test needs JavaScript.</p></noscript>
      </div>
    </section>
    <section class="about-section"><div class="container"><div class="faq reveal" style="max-width:820px">{faqs}</div></div></section>
    <section class="about-section">
      <div class="container">{chips(slug)}</div>
    </section>
  </main>'''
    s = re.sub(r'<main.*?</main>', main, s, count=1, flags=re.S)
    s = s.replace('<script src="tests.js"></script>', '<script src="tests.js"></script>\n  <script src="tests2.js"></script>', 1)
    open(slug + '.html', 'w').write(s)

# chips on the older test pages
for f in ['aim-trainer.html', 'cps-test.html', 'mouse-button-test.html', 'polling-rate-test.html', 'reaction-test.html', 'scroll-test.html', 'double-click-test.html']:
    s = open(f).read(); here = f[:-5]
    s2 = re.sub(r'<div class="panel reveal" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><b style="margin-right:6px">More tests</b>.*?</div>', chips(here), s, count=1, flags=re.S)
    if s2 != s: open(f, 'w').write(s2)

# test hub: a "Skill tests" block of cards
h = open('tests.html').read()
cards = ''.join(f'<article class="hub-card reveal"><div class="hub-tags"><span class="plan-tag">New</span></div><div class="fc-icon" data-icon="{p[7]}"></div>\n          <h3><a href="{p[0]}">{p[2]}</a></h3><p>{(lambda t: t[0].upper() + t[1:])(p[4].split(": ", 1)[-1])}</p><small class="hub-best" data-best="{p[1]}" hidden></small></article>' for p in PAGES)
block = f'<!-- skill-tests --><div class="section-header reveal" id="skill-tests" style="margin:64px 0 22px"><span class="section-label">New: skill tests</span><h2>Train every part of <em>your aim</em></h2><p>Tracking, flicks, speed, timing and control, plus a DPI analyzer to check your sensor. Every result counts towards your skill profile on My stats.</p></div>\n        <div class="hub-grid" data-test-hub2>{cards}</div><!-- /skill-tests -->'
h = re.sub(r'\n        <!-- skill-tests -->.*?<!-- /skill-tests -->', '', h, flags=re.S)
if 'tests2.js' not in h: h = h.replace('<script src="tests.js"></script>', '<script src="tests.js"></script>\n  <script src="tests2.js"></script>', 1)
h = h.replace('</article></div>\n      </div>\n    </section>', '</article></div>\n        ' + block + '\n      </div>\n    </section>', 1)
h = re.sub(r'\d+ free tools to measure', f'{NTOOLS} free tools to measure', h)
open('tests.html', 'w').write(h)

# nav: "All N mouse tests in one place"
n = 0
for f in glob.glob('**/*.html', recursive=True):
    s = open(f).read(); s2 = re.sub(r'All \d+ mouse tests in one place', f'All {NTOOLS} mouse tests in one place', s)
    if s2 != s: open(f, 'w').write(s2); n += 1
print('pages', len(PAGES), 'nav updated', n)

# ---- discoverability -------------------------------------------------------------------------
# 1. Tests menu (every page): the six skill tests after the aim trainer, as a two-column menu
DDI = {'tracking-test': ('Track', 'Tracking test', 'Stay on a moving target'), 'flick-test': ('Aim', 'Flick test', 'Fast, clean flicks'),
       'target-rush': ('Speed', 'Target rush', 'Shrinking targets, 3 lives'), 'rhythm-test': ('Time', 'Rhythm test', 'Click on the beat'),
       'circle-test': ('Rate', 'Circle test', 'Perfect circle + angle snapping'), 'dpi-analyzer': ('Stats', 'DPI analyzer', 'Your mouse’s real DPI')}
nm = 0
for f in glob.glob('**/*.html', recursive=True):
    s = open(f).read()
    m = re.search(r'<ul class="dropdown" id="nav-menu-2">.*?</ul>', s, re.S)
    if not m or 'tracking-test"><span class="dd-ico"' in m.group(0): continue
    menu = m.group(0)
    a = re.search(r'<li><a href="([^"]*)aim-trainer"><span class="dd-ico".*?</li>', menu)
    if not a: continue
    pre = a.group(1)
    items = ''.join(f'<li><a href="{pre}{slug}"><span class="dd-ico" data-icon="{ic}"></span><span class="dd-txt"><b>{nme} <span class="badge">New</span></b><small>{sub}</small></span></a></li>' for slug, (ic, nme, sub) in DDI.items())
    new = menu.replace(a.group(0), a.group(0) + items, 1).replace('<ul class="dropdown" id="nav-menu-2">', '<ul class="dropdown dd-wide" id="nav-menu-2">', 1)
    open(f, 'w').write(s.replace(menu, new, 1)); nm += 1
# 2. Test hub: the new skill tests first
h = open('tests.html').read().replace('\n        <div class="section-header reveal" style="margin:64px 0 22px"><span class="section-label">Classic tests</span><h2>Clicks, reactions and <em>mouse checks</em></h2></div>', '')
m = re.search(r'\n        <!-- skill-tests -->.*?<!-- /skill-tests -->', h, re.S)
if m:
    h = h.replace(m.group(0), '', 1)
    blk = m.group(0).replace('style="margin:64px 0 22px"', 'style="margin:8px 0 22px"')
    h = h.replace('\n        <div class="hub-grid" data-test-hub>', blk + '\n        <div class="section-header reveal" style="margin:64px 0 22px"><span class="section-label">Classic tests</span><h2>Clicks, reactions and <em>mouse checks</em></h2></div>\n        <div class="hub-grid" data-test-hub>', 1)
    open('tests.html', 'w').write(h)
# 3. Home page: a card for the skill tests, and the right count in hub mode
i = open('index.html').read()
if 'href="tests#skill-tests"' not in i:
    i = re.sub(r'<a href="contact" class="ql-card reveal">.*?</a>', '<a href="tests#skill-tests" class="ql-card reveal">\n            <div class="ql-icon" data-icon="Track"></div>\n            <div class="ql-text"><h3>New skill tests</h3><p>Tracking, flicks, rhythm, circle and more</p></div>\n            <span class="ql-arrow">→</span>\n          </a>', i, count=1, flags=re.S)
i = i.replace('<h2>Seven tests, <em>your</em> numbers</h2>', '<h2>Thirteen tests, <em>your</em> numbers</h2>')
open('index.html', 'w').write(i)
print('menus updated', nm)
