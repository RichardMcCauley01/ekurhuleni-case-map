#!/usr/bin/env python3
"""Generate SEO head tags, a static crawlable text version, robots.txt and sitemap.xml from data/*.json + site.json.
Usage:  python3 tools/build_static.py [--url https://owner.github.io/repo/]
With no URL (default), canonical/og:url/sitemap are omitted, so no placeholders are published."""
import json, os, re, sys, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg_path = os.path.join(ROOT, 'site.json'); cfg = json.load(open(cfg_path))
if '--url' in sys.argv:
    u = sys.argv[sys.argv.index('--url') + 1].strip()
    if u and not u.endswith('/'): u += '/'
    cfg['url'] = u
    json.dump(cfg, open(cfg_path, 'w'), indent=2); open(cfg_path, 'a').write('\n')
URL = cfg.get('url', '')
cs = json.load(open(os.path.join(ROOT, 'data', 'cases.json')))
ev = json.load(open(os.path.join(ROOT, 'data', 'events.json')))
md = json.load(open(os.path.join(ROOT, 'data', 'media.json')))
crime = json.load(open(os.path.join(ROOT, 'data', 'crime.json'))) if os.path.exists(os.path.join(ROOT, 'data', 'crime.json')) else None
E = html.escape
MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
def dfmt(iso):
    y, m, d = iso[:10].split('-'); return f'{int(d)} {MON[int(m)-1]} {y}'
def when(e):
    s = dfmt(e['datetime'])
    m = re.search(r'T(\d\d:\d\d)', e['datetime'])
    if m: s += (', ≈ ' if e['precision'] == 'approximate' else ', ') + m.group(1) + ' SAST'
    elif e.get('partOfDay'): s += ', ' + e['partOfDay']
    if e['precision'] == 'approximate' and not m: s += ' (approximate date)'
    return s
def pt(p):
    if not p: return 'not reported'
    return dfmt(p['date']) + (', ' + p['time'] + (' SAST' if re.search(r'\d', p['time']) else '') if p.get('time') else '') + ': ' + p['place']
SC = {'police statement':'s-police','official statement':'s-official','court / charges':'s-court','media report':'s-media','expert opinion':'s-expert','scheduled':'s-sched'}
by_case = {c['id']: c for c in cs['cases']}
srcs = lambda L: '; '.join(f'<a href="{E(s["url"])}" rel="noopener">{E(s["title"])}</a> ({E(s["outlet"])}, {E(s["date"])})' for s in L)
out = ['<h2>Text version: case summary, case files and full timeline</h2>',
 '<p class="cw-static"><strong>Content warning:</strong> killings of women and gender-based violence. Descriptions are factual and non-graphic. <strong>Help:</strong> GBV Command Centre <a href="tel:0800428428">0800 428 428</a> · Lifeline <a href="tel:0861322322">0861 322 322</a>. <strong>Information:</strong> SAPS Crime Stop <a href="tel:0860010111">08600 10111</a> or the MySAPS app.</p>',
 '<h3>Summary (as of 30 September 2026)</h3>',
 '<p>From July 2026, the bodies of a series of women were found in the City of Ekurhuleni, Gauteng, South Africa, mostly in and around Kempton Park, the R21 corridor, Olifantsfontein/Clayville and Tembisa, with others in KwaThema, Springs and Dawn Park (Boksburg). SAPS set up a dedicated multidisciplinary task team on 14 September 2026. On 29 September President Cyril Ramaphosa said 11 women\'s bodies had been found in Ekurhuleni since July and that the investigation had been raised to national level. <strong>Police have not confirmed a serial killer.</strong> The President said: "At present, the police have not found evidence establishing that these killings were committed by a single perpetrator. All possibilities remain under investigation." Arrests have been made in three cases. Police cite relationship motives in two of them and have not linked those to the others. In a third, a man has been charged with murder; police said it was too early to say whether it is linked. A twelfth death, a shooting in Tembisa on 28 September, is not part of the task team cases. A woman found in Soweto (outside Ekurhuleni) on 20 September has been mentioned by police, but no link has been confirmed. People charged are presumed innocent and are not named here, and persons of interest are not named.</p>',
 f'<h3>Case files ({len(cs["cases"])})</h3><ol class="static-events">']
for c in sorted(cs['cases'], key=lambda c: c['found']['date']):
    out.append(f'<li id="case-{E(c["id"])}"><article><h4>{E(c["name"])}{" (" + E(c["age"]) + ")" if c.get("age") else ""}</h4>'
               f'<p class="meta">Status: {E(c["statusShort"])}</p>'
               f'<p><strong>Last seen:</strong> {E(pt(c.get("lastSeen")))}<br><strong>Body found:</strong> {E(pt(c["found"]))} <em>(approximate location as reported; map pin at {E(c["found"]["pinPrecision"])} level)</em></p>'
               f'<p>{E(c["circumstances"])}</p><p><strong>Investigation / court:</strong> {E(c["legal"])}</p><p><strong>Link status:</strong> {E(c["linkStatus"])}</p>'
               + ''.join(f'<p class="small"><em>Sources differ:</em> {E(x)}</p>' for x in c['conflicts']) +
               f'<p class="small">Sources: {srcs(c["sources"])}</p></article></li>')
out.append('</ol>')
iv = cs['meta']['intervals']
out.append('<h3>Time between discoveries</h3><ul>' + ''.join(f'<li>{E(by_case[x["fromId"]]["name"])} → {E(by_case[x["toId"]]["name"])}: {x["days"]} days' + (f' (≈{x["hours"]} h)' if 'hours' in x else '') + '</li>' for x in iv) + '</ul>')
P = ev['patterns']
out.append('<h3>Patterns &amp; differences (as stated by officials and experts; no conclusion drawn)</h3><ul>' +
           ''.join(f'<li><strong>{E(x["who"])}:</strong> {E(x["text"])}</li>' for x in P['said']) +
           ''.join(f'<li>Similarity reported: {E(x["text"])}</li>' for x in P['similar']) +
           ''.join(f'<li>Difference reported: {E(x["text"])}</li>' for x in P['different']) + '</ul>')
out.append('<h3>Where sources disagree</h3><ul>' + ''.join(f'<li><strong>{E(x["topic"])}</strong> {E(x["text"])}</li>' for x in ev['conflicts']) + '</ul>')
if crime:
    out.append('<h3>Precinct crime context (SAPS)</h3><p class="small">' + E(crime['meta']['scopeNote'] + ' ' + crime['meta']['fyMethod'] + ' ' + crime['meta']['populationNote']) + '</p><ul>')
    seen = set()
    for c in sorted(cs['cases'], key=lambda c: c['found']['date']):
        pr = crime['casePrecincts'].get(c['id'], {}).get('precinct')
        st = next((s for s in crime['stations'] if s['station'] == pr), None)
        if st and pr not in seen:
            seen.add(pr)
            out.append(f'<li>{E(pr)}: {st["murder_fy2025_26"]} murders in FY 2025/26, {st["murder_q1_2026_27"]} in Apr–Jun 2026' + (f', ≈{st["murder_rate_per100k_fy2025_26"]} per 100,000 (Census 2022 population {st["population2022"]:,.0f})' if st.get('murder_rate_per100k_fy2025_26') is not None else '') + '.</li>')
    out.append('</ul>')
out.append('<h3>Scenario views (HYPOTHETICAL)</h3><p>The interactive map includes two <strong>hypothetical</strong> geometry views, "single offender" and "more than one offender". Police have NOT established either. They show approximate distances, OSRM driving and walking times, and time gaps between the approximate pins, and they draw no conclusions.</p>')
out.append(f'<h3>Full timeline ({len(ev["events"])} events, SAST)</h3><ol class="static-events">')
for e in ev['events']:
    lane = by_case[e['lane']]['name'] if e['lane'] in by_case else 'Investigation & officials'
    extra = f'<p class="small">{E(e["note"])}</p>' if e.get('note') else ''
    out.append(f'<li id="ev-{E(e["id"])}"><article><h4>{E(e["title"])}</h4><p class="meta"><time datetime="{E(e["datetime"])}">{E(when(e))}</time> · <span class="badge {SC.get(e["status"], "s-media")}">{E(e["status"])}</span> · {E(e["location"])} · {E(lane)}</p><p>{E(e["description"])}</p>{extra}<p class="small">Sources: {srcs(e["sources"])}</p></article></li>')
out.append('</ol><h3>Media &amp; documents (outbound links)</h3><ul>')
for m in md['media']:
    out.append(f'<li><a href="{E(m["url"])}" rel="noopener">{E(m["title"])}</a> ({E(m["outlet"])}, {E(m["date"])}, {E(m["type"])}): {E(m["description"])}</li>')
out.append('</ul><h3>Not publicly available</h3><ul>' + ''.join(f'<li>{E(t)}</li>' for t in md['notPublic']) + '</ul>')
out.append(f'<p class="small">Last updated {E(cfg.get("lastUpdated",""))}. Generated from data/cases.json, data/events.json and data/media.json.</p>')
static = '\n'.join(out)
title, desc = cfg['title'], cfg['description']
img = (URL + cfg['ogImage']) if URL else cfg['ogImage']
alt = 'Dark map of Ekurhuleni with numbered markers at approximate locations (non-graphic)'
head = [f'<title>{E(title)}</title>', f'<meta name="description" content="{E(desc)}">', '<meta name="robots" content="index,follow,max-image-preview:large">',
        '<meta name="author" content="Neutral case map compiled from public sources">', '<meta name="theme-color" content="#0d1014">']
if URL: head += [f'<link rel="canonical" href="{E(URL)}">', f'<meta property="og:url" content="{E(URL)}">']
head += ['<meta property="og:type" content="website">', f'<meta property="og:title" content="{E(title)}">', f'<meta property="og:description" content="{E(desc)}">',
         '<meta property="og:locale" content="en_ZA">', f'<meta property="og:image" content="{E(img)}">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
         f'<meta property="og:image:alt" content="{E(alt)}">', '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{E(title)}">',
         f'<meta name="twitter:description" content="{E(desc)}">', f'<meta name="twitter:image" content="{E(img)}">', f'<meta name="twitter:image:alt" content="{E(alt)}">']
head.append(f'<meta name="google-site-verification" content="{E(cfg["googleSiteVerification"])}">' if cfg.get('googleSiteVerification') else '<!-- Google Search Console: set "googleSiteVerification" in site.json (or upload the googleXXXX.html file to the site root) -->')
ld = {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "inLanguage": "en-ZA", "dateModified": cfg.get('lastUpdated'), "isAccessibleForFree": True,
      "about": {"@type": "Thing", "name": "Killings of women in Ekurhuleni, Gauteng, South Africa (2026)"}, "spatialCoverage": {"@type": "Place", "name": "City of Ekurhuleni, Gauteng, South Africa"}}
if URL: ld["url"] = URL; ld["image"] = img
head.append('<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>')
p = os.path.join(ROOT, 'index.html'); s = open(p, encoding='utf-8').read()
s = re.sub(r'(<!-- SEO:BEGIN[^>]*-->\n).*?(<!-- SEO:END -->)', lambda m: m.group(1) + '\n'.join(head) + '\n' + m.group(2), s, flags=re.S)
s = re.sub(r'(<!-- STATIC:BEGIN[^>]*-->\n).*?(<!-- STATIC:END -->)', lambda m: m.group(1) + static + '\n' + m.group(2), s, flags=re.S)
open(p, 'w', encoding='utf-8').write(s)
robots = 'User-agent: *\nAllow: /\n' + (f'\nSitemap: {URL}sitemap.xml\n' if URL else '')
open(os.path.join(ROOT, 'robots.txt'), 'w').write(robots)
sm = os.path.join(ROOT, 'sitemap.xml')
if URL: open(sm, 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>{E(URL)}</loc><lastmod>{cfg.get("lastUpdated")}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n</urlset>\n')
elif os.path.exists(sm): os.remove(sm)
print('url:', URL or '(not set)', '| cases:', len(cs['cases']), '| events:', len(ev['events']), '| index.html', len(s), 'bytes')
