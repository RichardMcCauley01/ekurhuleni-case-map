/* Case files: summary table, one card per woman, precinct crime table, source conflicts. */
(function(){
'use strict';
const C = window.CASE, DATA = C.DATA, esc = C.esc, CR = C.CRIME;
const cases = DATA.cases.slice().sort((a, b) => a.found.date.localeCompare(b.found.date));
let done = false;
function render(){
  if (done) return; done = true;
  const t = document.getElementById('sum-table');
  t.innerHTML = '<tr><th>#</th><th>Name (as released)</th><th>Age</th><th>Last seen</th><th>Body found (approx. area)</th><th>Status</th><th>Precinct (SAPS)</th></tr>' + cases.map(c => {
    const p = C.precinctFor(c.id);
    return '<tr><td>' + (c.num || '–') + '</td><td><a data-case="' + c.id + '">' + esc(c.name) + '</a></td><td>' + esc(c.age || 'not reported') + '</td><td>' + (c.lastSeen ? esc(C.fmtPoint(c.lastSeen)) : '<span class="small">not reported</span>') + '</td><td>' + esc(C.fmtPoint(c.found)) + '<br><span class="small">' + esc(c.found.place) + '</span></td><td>' + C.caseBadge(c) + '</td><td class="small">' + (p ? esc(p.station) + (p.murder_rate_per100k_fy2025_26 != null ? '<br>' + p.murder_fy2025_26 + ' murders FY25/26 (≈' + p.murder_rate_per100k_fy2025_26 + '/100k)' : '') : '–') + '</td></tr>';
  }).join('');
  document.getElementById('case-cards').innerHTML = cases.map(c => {
    let h = '<article class="ccard g-' + c.group + '" id="card-' + c.id + '"><h3><span class="num g-' + c.group + '">' + (c.num || 'S') + '</span>' + esc(c.name) + '</h3>';
    h += '<div>' + C.caseBadge(c) + '</div>';
    h += '<dl><dt>Age</dt><dd>' + esc(c.age || 'not reported') + '</dd>';
    h += '<dt>Last seen</dt><dd>' + (c.lastSeen ? esc(C.fmtPoint(c.lastSeen)) + '<br><span class="small">' + esc(c.lastSeen.place) + '</span>' : 'not reported') + '</dd>';
    h += '<dt>Body found</dt><dd>' + esc(C.fmtPoint(c.found)) + '<br><span class="small">' + esc(c.found.place) + '</span></dd>';
    if (c.lastSeenToFound) h += '<dt>Interval</dt><dd class="small">last seen → found: ' + esc(C.fmtGap(c.lastSeenToFound)) + '</dd>';
    h += '<dt>Reported</dt><dd>' + esc(c.circumstances) + '</dd>';
    h += '<dt>Status</dt><dd>' + esc(c.legal) + (c.court.length ? '<br>' + c.court.map(x => '<span class="small">' + esc(C.fmtDate(x.date)) + ': ' + esc(x.text) + (x.scheduled ? ' (scheduled)' : '') + '</span>').join('<br>') : '') + '</dd>';
    h += '<dt>Task team</dt><dd>' + esc(c.linkStatus) + '</dd></dl>';
    if (c.conflicts.length) h += c.conflicts.map(x => '<div class="conf">' + esc(x) + '</div>').join('');
    h += '<div class="small"><strong>Sources:</strong></div>' + C.sourcesHTML(c.sources);
    h += '<div class="acts"><button class="btn" data-case="' + c.id + '">Details</button><a class="btn" href="#map?case=' + c.id + '">Map</a><a class="btn" href="#timeline?case=' + c.id + '">Timeline</a></div></article>';
    return h;
  }).join('');
  if (CR){
    const E = C.ekuRate();
    document.getElementById('crime-table-intro').innerHTML = esc(CR.meta.scopeNote) + ' ' + esc(CR.meta.fyMethod) + ' ' + esc(CR.meta.populationNote) + (E ? ' Ekurhuleni District overall: ' + E.murders + ' murders in FY 2025/26 (≈' + E.rate + ' per 100,000).' : '') + ' Sources: ' + CR.meta.sources.map(s => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.outlet) + '</a>').join(', ') + '.';
    const byPrec = {};
    cases.forEach(c => { const p = C.precinctFor(c.id); if (p) (byPrec[p.station] = byPrec[p.station] || { p, cs: [] }).cs.push(c); });
    document.getElementById('crime-table').innerHTML = '<tr><th>Precinct</th><th>Cases whose pin falls here</th><th>Murders FY 2025/26<br><span class="small">Q1 / Q2 / Q3 / Q4</span></th><th>Murders Apr–Jun 2026</th><th>Population (2022)</th><th>≈ per 100k</th><th>Sexual offences FY 2025/26</th></tr>' +
      Object.values(byPrec).map(({ p, cs }) => '<tr><td>' + esc(p.station) + (p.near && p.near.length ? '<br><span class="small">near border: ' + esc(p.near.join(', ')) + '</span>' : '') + '</td><td>' + cs.map(c => '<a data-case="' + c.id + '">' + esc(c.name) + '</a>').join('<br>') + '</td><td><strong>' + p.murder_fy2025_26 + '</strong><br><span class="small">' + p.murder_quarters_fy2025_26.join(' / ') + '</span></td><td>' + p.murder_q1_2026_27 + ' <span class="small">(Apr–Jun 2025: ' + p.murder_q1_2025_26_in_latest_release + ')</span></td><td>' + (p.population2022 ? Number(p.population2022).toLocaleString('en-ZA') : '–') + '</td><td>' + (p.murder_rate_per100k_fy2025_26 != null ? p.murder_rate_per100k_fy2025_26.toFixed(1) : '–') + '</td><td>' + p.sexual_offences_fy2025_26 + '</td></tr>').join('');
  }
  document.getElementById('conflicts').innerHTML = DATA.conflicts.map(x => '<li><strong>' + esc(x.topic) + '</strong> ' + esc(x.text) + ' <span class="small">[' + x.sources.map(s => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.outlet) + '</a>').join(', ') + ']</span></li>').join('');
}
C.on('view', ({ view, params }) => { if (view !== 'cases') return; render(); const id = params.get('case'); if (id){ const el = document.getElementById('card-' + id); if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50); } });
C.on('params', ({ view, params }) => { if (view === 'cases'){ const el = document.getElementById('card-' + params.get('case')); if (el) el.scrollIntoView({ block: 'center' }); } });
})();
