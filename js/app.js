/* Shared helpers, routing, content warning, drawer (events + cases), media and sources pages. */
(function(){
'use strict';
const DATA = window.CASE_DATA, MEDIA = window.MEDIA_DATA, CRIME = window.CRIME_DATA || null, ROUTES = window.ROUTE_DATA || null;
const byId = {}; DATA.events.forEach(e => byId[e.id] = e);
const caseById = {}; DATA.cases.forEach(c => caseById[c.id] = c);
const mediaById = {}; MEDIA.media.forEach(m => mediaById[m.id] = m);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Parse the SAST wall-clock part of an ISO string as if it were UTC, so display never depends on the viewer's timezone.
   Date-only values are placed at midday. */
function parseLocal(dt){
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/.exec(dt);
  return new Date(Date.UTC(+m[1], m[2] ? +m[2]-1 : 0, m[3] ? +m[3] : 1, m[4] ? +m[4] : 12, m[5] ? +m[5] : 0));
}
function fmtDate(iso){ const d = parseLocal(iso); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
function fmtWhen(e, opts){
  opts = opts || {};
  const d = parseLocal(e.datetime);
  let s = fmtDate(e.datetime);
  if (/T\d{2}:\d{2}/.test(e.datetime)){
    const t = String(d.getUTCHours()).padStart(2,'0') + ':' + String(d.getUTCMinutes()).padStart(2,'0');
    s += (e.precision === 'approximate' ? ', ≈ ' : ', ') + t + ' SAST';
  } else if (e.partOfDay) s += ', ' + e.partOfDay;
  if (e.precision === 'approximate' && !/T/.test(e.datetime)) s += opts.short ? ' (approx.)' : ' (approximate date)';
  return s;
}
function fmtPoint(p){ // lastSeen / found objects
  if (!p || !p.date) return 'not reported';
  let s = fmtDate(p.date) + (p.time ? ', ' + p.time + (/\d/.test(p.time) ? ' SAST' : '') : '');
  if (p.precision === 'approximate' && !p.time) s += ' (approximate)';
  return s;
}
const STATUS_CLS = {'police statement':'s-police','official statement':'s-official','court / charges':'s-court','media report':'s-media','expert opinion':'s-expert','scheduled':'s-sched'};
const STATUS_GRP = {'police statement':'police','official statement':'official','court / charges':'court','media report':'media','expert opinion':'expert','scheduled':'sched'};
function statusClass(s){ return STATUS_CLS[s] || 's-media'; }
function statusGroup(s){ return STATUS_GRP[s] || 'media'; }
function badge(s){ return '<span class="badge ' + statusClass(s) + '">' + esc(s) + '</span>'; }
function caseBadge(c){ return '<span class="badge g-' + c.group + '">' + esc(c.statusShort) + '</span>'; }
const GROUP_LABEL = {taskteam:'Task team case, no arrest', arrest:'Arrest made', other:'Other (not task team / outside Ekurhuleni)'};
const CAT_LABEL = {'last-seen':'Last seen / missing','found':'Body found','identified':'Identification','arrest-court':'Arrest & court','official':'Police & officials','expert':'Expert / analysis','community':'Community & family'};
function srcLink(s){ return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a> <span class="small">(' + esc(s.outlet) + (s.date ? ', ' + esc(s.date) : '') + (s.access === 'snippet' ? ', snippet' : '') + ')</span>'; }
function sourcesHTML(list){ return '<ul class="srcs">' + list.map(s => '<li>' + srcLink(s) + '</li>').join('') + '</ul>'; }
function caseLabel(c){ return (c.num ? '#' + c.num + ' ' : '') + c.name; }
function fmtGap(g){ if (!g) return ''; let s = g.days + ' day' + (g.days === 1 ? '' : 's'); if (g.hours != null) s += ' (≈ ' + g.hours + ' h)'; return s; }
function fmtMin(m){ if (m == null) return '–'; if (m < 60) return Math.round(m) + ' min'; const h = Math.floor(m / 60), r = Math.round(m - h * 60); return h + ' h ' + (r ? r + ' min' : ''); }

/* crime context for a case */
function precinctFor(caseId){
  if (!CRIME) return null;
  const cp = CRIME.casePrecincts[caseId]; if (!cp || !cp.precinct) return null;
  const st = CRIME.stations.find(s => s.station === cp.precinct);
  return st ? Object.assign({ near: cp.nearBorderWith }, st) : { station: cp.precinct, near: cp.nearBorderWith, missing: true };
}
function ekuRate(){
  if (!CRIME) return null;
  const eku = CRIME.stations.filter(s => s.district === 'Ekurhuleni District' && s.population2022);
  const m = eku.reduce((a, s) => a + s.murder_fy2025_26, 0), p = eku.reduce((a, s) => a + s.population2022, 0);
  return { murders: m, pop: p, rate: Math.round(m / p * 1e6) / 10 };
}
function precinctHTML(caseId){
  const p = precinctFor(caseId); if (!p) return '<p class="small">Precinct statistics not available for this location.</p>';
  if (p.missing) return '<p class="small">The pin falls in the ' + esc(p.station) + ' precinct; no SAPS station-level murder figures were found for it.</p>';
  const E = ekuRate();
  const rel = p.murder_rate_per100k_fy2025_26 != null && E ? (p.murder_rate_per100k_fy2025_26 > E.rate ? 'above' : 'below') + ' the Ekurhuleni-wide rate of ≈' + E.rate + ' per 100k' : '';
  return '<p class="small"><strong>' + esc(p.station) + '</strong> police precinct (contains the approximate pin' + (p.near && p.near.length ? '; near the border with ' + esc(p.near.join(', ')) : '') + '):<br>' +
    'Murders reported, FY 2025/26: <strong>' + p.murder_fy2025_26 + '</strong> (quarters: ' + p.murder_quarters_fy2025_26.join(' / ') + ') · Apr–Jun 2026: <strong>' + p.murder_q1_2026_27 + '</strong>' +
    (p.murder_rate_per100k_fy2025_26 != null ? '<br>≈ <strong>' + p.murder_rate_per100k_fy2025_26.toFixed(1) + '</strong> per 100,000 residents (Census 2022 population ' + Number(p.population2022).toLocaleString('en-ZA') + ')' + (rel ? ', ' + rel : '') : '') +
    '<br>Sexual offences, FY 2025/26: ' + p.sexual_offences_fy2025_26 + '.<br><em>These are precinct-wide SAPS counts, not statistics for the exact place. They are not a risk score.</em></p>';
}

/* ---------- Routing ---------- */
const listeners = {};
function on(name, fn){ (listeners[name] = listeners[name] || []).push(fn); }
function emit(name, arg){ (listeners[name] || []).forEach(f => { try { f(arg); } catch (err) { console.error(err); } }); }
const VIEWS = ['map','timeline','cases','media','sources','about','text'];
function parseHash(){
  const h = location.hash.replace(/^#/, ''); const [view, q] = h.split('?');
  const params = new URLSearchParams(q || location.search.replace(/^\?/, ''));
  return { view: VIEWS.includes(view) ? view : 'map', params };
}
let currentView = null;
function route(){
  const { view, params } = parseHash();
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  document.querySelectorAll('.tabs a').forEach(a => { const on = a.dataset.view === view; a.classList.toggle('active', on); a.setAttribute('aria-selected', on); });
  if (currentView !== view){ currentView = view; window.scrollTo(0, 0); emit('view', { view, params }); }
  else emit('params', { view, params });
}
window.addEventListener('hashchange', route);

/* ---------- Content warning ---------- */
function initCW(){
  const cw = document.getElementById('cw');
  let seen = false; try { seen = localStorage.getItem('eku-cw') === '1'; } catch (e) {}
  if (new URLSearchParams(location.search).get('cw') === '0') seen = true;
  if (!seen){ cw.hidden = false; document.getElementById('cw-ok').focus(); }
  document.getElementById('cw-ok').addEventListener('click', () => { cw.hidden = true; try { localStorage.setItem('eku-cw','1'); } catch (e) {} emit('cwclosed'); });
}

/* ---------- Drawer ---------- */
const drawer = document.getElementById('drawer'), dbody = document.getElementById('drawer-body');
const HELP = '<div class="helpbox small"><strong>Information?</strong> Crime Stop <a href="tel:0860010111">08600 10111</a> / MySAPS app · <strong>Support:</strong> GBV Command Centre <a href="tel:0800428428">0800 428 428</a> · Lifeline <a href="tel:0861322322">0861 322 322</a></div>';
function show(h, sel){ dbody.innerHTML = h; drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); drawer.scrollTop = 0; emit('select', sel); }
function openEvent(id){
  const e = byId[id]; if (!e) return;
  const c = e.caseId ? caseById[e.caseId] : null;
  let h = '<div class="meta"><span class="pill">' + esc(CAT_LABEL[e.category] || e.category) + '</span><span class="pill">' + (c ? esc(caseLabel(c)) : 'Investigation &amp; officials') + '</span></div>';
  h += '<h2>' + esc(e.title) + '</h2>';
  h += '<div class="meta"><span class="when">' + esc(fmtWhen(e)) + '</span></div>';
  h += '<div class="meta">' + badge(e.status) + ' &nbsp;📍 ' + esc(e.location) + '</div>';
  h += '<p class="desc">' + esc(e.description) + '</p>';
  if (e.note) h += '<div class="note">' + esc(e.note) + '</div>';
  h += '<h4>Sources</h4>' + sourcesHTML(e.sources);
  if (c) h += '<h4>Case</h4><p><a class="rel-link" data-case="' + c.id + '">Open case file: ' + esc(caseLabel(c)) + '</a> ' + caseBadge(c) + '</p>';
  if (e.media && e.media.length) h += '<h4>Linked media &amp; documents</h4><ul>' + e.media.map(m => { const x = mediaById[m]; return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a> <span class="small">(' + esc(x.outlet) + ', ' + esc(x.type) + ')</span></li>'; }).join('') + '</ul>';
  h += HELP;
  show(h, { type: 'event', id });
}
function openCase(id){
  const c = caseById[id]; if (!c) return;
  let h = '<div class="meta"><span class="pill"><span class="dot g-' + c.group + '"></span>' + esc(GROUP_LABEL[c.group]) + '</span>' + (c.num ? '<span class="pill">Case #' + c.num + ' in order found</span>' : '<span class="pill">Outside Ekurhuleni</span>') + '</div>';
  h += '<h2>' + esc(c.name) + (c.age ? ' <span class="small">(' + esc(c.age) + ')</span>' : '') + '</h2>';
  h += '<div class="meta">' + caseBadge(c) + '</div>';
  h += '<p class="desc"><strong>Link status:</strong> ' + esc(c.linkStatus) + '</p>';
  h += '<h4>Last seen</h4><p class="small">' + (c.lastSeen ? esc(fmtPoint(c.lastSeen)) + ': ' + esc(c.lastSeen.place) : 'Not reported.') + '</p>';
  h += '<h4>Body found</h4><p class="small">' + esc(fmtPoint(c.found)) + ': ' + esc(c.found.place) + '<br><em>Map pin: approximate location of where body was found as reported (' + esc(c.found.pinPrecision) + ').</em>' + (c.found.placeNote ? ' ' + esc(c.found.placeNote) : '') + '</p>';
  if (c.lastSeenToFound) h += '<p class="small">Time from last seen to found: ' + esc(fmtGap(c.lastSeenToFound)) + (c.lastSeenToFound.hours == null ? ' (calendar days; times not both reported)' : ' (both times approximate)') + '</p>';
  h += '<h4>What was reported</h4><p class="small">' + esc(c.circumstances) + '</p>';
  h += '<h4>Investigation / court</h4><p class="small">' + esc(c.legal) + '</p>';
  if (c.court && c.court.length) h += '<ul>' + c.court.map(x => '<li>' + esc(fmtDate(x.date)) + ': ' + esc(x.text) + (x.scheduled ? ' <span class="badge s-sched">scheduled</span>' : '') + '</li>').join('') + '</ul>';
  if (c.conflicts && c.conflicts.length) h += '<h4>Where sources differ</h4>' + c.conflicts.map(x => '<div class="note">' + esc(x) + '</div>').join('');
  h += '<h4>Precinct crime context (SAPS)</h4>' + precinctHTML(c.id);
  h += '<h4>Timeline events</h4><ul>' + c.events.map(i => '<li><a class="rel-link" data-ev="' + i + '">' + esc(fmtWhen(byId[i], { short: true })) + ': ' + esc(byId[i].title) + '</a></li>').join('') + '</ul>';
  h += '<p class="small"><a href="#map?case=' + c.id + '">Show on map</a> · <a href="#timeline?case=' + c.id + '">Show on timeline</a> · <a href="#cases?case=' + c.id + '">Case file card</a></p>';
  h += '<h4>Sources</h4>' + sourcesHTML(c.sources) + HELP;
  show(h, { type: 'case', id });
}
function closeDrawer(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); emit('select', null); }
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeDrawer(); });
document.addEventListener('click', ev => {
  const a = ev.target.closest('[data-ev],[data-case]'); if (!a || a.closest('.leaflet-container')) return;
  ev.preventDefault(); if (a.dataset.ev) openEvent(a.dataset.ev); else openCase(a.dataset.case);
});
drawer.addEventListener('click', ev => { const a = ev.target.closest('a[href^="#"]'); if (a) closeDrawer(); });

/* ---------- Media ---------- */
function mediaCard(m){
  const evs = m.events.filter(i => byId[i]).map(i => '<a data-ev="' + i + '">' + esc(byId[i].title) + '</a>').join(' · ');
  return '<div class="mcard"><div class="type">' + esc(m.type) + '</div>' +
    '<a class="title" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">' + esc(m.title) + ' ↗</a>' +
    '<div class="src">' + esc(m.outlet) + ' · ' + esc(m.date) + '</div>' +
    '<div class="d">' + esc(m.description) + '</div>' + (evs ? '<div class="evs">Events: ' + evs + '</div>' : '') + '</div>';
}
function renderMedia(){
  const grid = document.getElementById('media-grid'), filt = document.getElementById('media-filter');
  const groups = {'All':null,'Official documents':/official|parliament/,'Court':/court/,'Explainers & analysis':/explainer|analysis|expert/,'Video & broadcast':/video|broadcast/,'Tributes & profiles':/tribute/,'International':/international/,'Data':/dataset/};
  let cur = 'All';
  function draw(){ const re = groups[cur]; grid.innerHTML = MEDIA.media.filter(m => !re || re.test(m.type)).map(mediaCard).join(''); filt.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.g === cur)); }
  filt.innerHTML = Object.keys(groups).map(g => '<button class="chip" data-g="' + esc(g) + '">' + esc(g) + '</button>').join('');
  filt.addEventListener('click', ev => { const c = ev.target.closest('.chip'); if (c){ cur = c.dataset.g; draw(); } });
  draw();
  document.getElementById('not-public').innerHTML = MEDIA.notPublic.map(t => '<li>' + esc(t) + '</li>').join('');
  document.getElementById('tl-media').innerHTML = MEDIA.media.map(mediaCard).join('');
}

/* ---------- Sources ---------- */
function allSources(){
  const map = new Map();
  const add = (s, kind, id) => { if (!map.has(s.url)) map.set(s.url, Object.assign({ events: [], cases: [], other: new Set() }, s)); const x = map.get(s.url); if (kind === 'e') x.events.push(id); else if (kind === 'c') x.cases.push(id); else x.other.add(id); };
  DATA.events.forEach(e => e.sources.forEach(s => add(s, 'e', e.id)));
  DATA.cases.forEach(c => c.sources.forEach(s => add(s, 'c', c.id)));
  ['said','similar','different'].forEach(k => DATA.patterns[k].forEach(p => p.sources.forEach(s => add(s, 'o', 'Patterns & differences panel'))));
  DATA.conflicts.forEach(p => p.sources.forEach(s => add(s, 'o', 'Where sources disagree')));
  MEDIA.media.forEach(m => add({ title: m.title, url: m.url, outlet: m.outlet, date: m.date }, 'o', 'Media & Documents'));
  if (CRIME) CRIME.meta.sources.forEach(s => add(s, 'o', 'Precinct crime context'));
  if (ROUTES) add(ROUTES.meta.source, 'o', 'Scenario routes');
  add({ title: 'Esri ArcGIS Online basemaps: World Dark Gray Canvas, World Street Map, World Imagery (public tile services)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services', outlet: 'Esri', date: 'accessed 2026-09-30' }, 'o', 'Background map tiles');
  return [...map.values()].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.outlet.localeCompare(b.outlet));
}
function renderSources(){
  const list = allSources(), box = document.getElementById('sources-list'), inp = document.getElementById('src-search');
  function draw(){
    const q = inp.value.trim().toLowerCase();
    const rows = list.filter(s => !q || (s.title + ' ' + s.outlet + ' ' + s.url).toLowerCase().includes(q));
    box.innerHTML = '<p class="small">' + rows.length + ' of ' + list.length + ' unique sources.</p>' + rows.map((s, i) =>
      '<div class="src-item"><div class="t">' + (i + 1) + '. <a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a>' + (s.access === 'snippet' ? ' <span class="pill">snippet</span>' : '') + '</div>' +
      '<div class="m">' + esc(s.outlet) + ' · ' + esc(s.date) + ' · <span style="word-break:break-all">' + esc(s.url) + '</span></div>' +
      (s.cases.length ? '<div class="cites">Case files: ' + s.cases.map(id => '<a data-case="' + id + '">' + esc(caseById[id].name) + '</a>').join(' · ') + '</div>' : '') +
      (s.events.length ? '<div class="cites">Cited by ' + s.events.length + ' event' + (s.events.length > 1 ? 's' : '') + ': ' + s.events.map(id => '<a data-ev="' + id + '">' + esc(byId[id].title) + '</a>').join(' · ') + '</div>' : '') +
      (s.other.size ? '<div class="cites">Also used in: ' + esc([...s.other].join(' · ')) + '</div>' : '') + '</div>').join('');
  }
  inp.addEventListener('input', draw); draw();
  document.getElementById('about-counts').textContent = DATA.cases.length + ' cases (12 in Ekurhuleni + 1 outside) · ' + DATA.events.length + ' events · ' + list.length + ' unique sources · ' + MEDIA.media.length + ' media/document links.';
}
function renderAbout(){
  const D = DATA.meta.distance;
  document.getElementById('about-dist').textContent = 'Approximate distances: of ' + D.total + ' Ekurhuleni pins, ' + D.within10 + ' are within about 10 km (straight line) of ' + D.center + ' and ' + D.within20 + ' within 20 km. The farthest (' + D.farthest.name + ') is about ' + D.farthest.km + ' km away. ' + D.note;
  if (ROUTES) document.getElementById('about-routes').textContent = ROUTES.meta.method + ' ' + ROUTES.meta.caveats.join(' ');
  if (CRIME){ const E = ekuRate(); document.getElementById('about-crime').innerHTML = ['Source: SAPS station-level crime statistics. Financial year ' + CRIME.meta.fy + '. ' + CRIME.meta.fyMethod, 'Latest quarter: ' + CRIME.meta.latestQuarter + '.', CRIME.meta.populationNote, CRIME.meta.scopeNote, E ? 'Ekurhuleni District overall (SAPS stations in the district with a Stats SA population): ' + E.murders + ' murders in FY 2025/26, ≈' + E.rate + ' per 100,000.' : ''].filter(Boolean).map(t => '<li>' + esc(t) + '</li>').join(''); }
}

window.CASE = { DATA, MEDIA, CRIME, ROUTES, byId, caseById, mediaById, esc, parseLocal, fmtDate, fmtWhen, fmtPoint, fmtGap, fmtMin, statusClass, statusGroup, badge, caseBadge, caseLabel, GROUP_LABEL, CAT_LABEL, sourcesHTML, srcLink, openEvent, openCase, closeDrawer, on, emit, parseHash, allSources, precinctFor, precinctHTML, ekuRate };

document.addEventListener('DOMContentLoaded', () => {
  initCW(); renderMedia(); renderSources(); renderAbout();
  setTimeout(route, 0);
});
})();
