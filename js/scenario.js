/* HYPOTHETICAL scenario views on the map. Police have NOT established either scenario.
   Single offender: body-found sites connected in the order found, with route distances and times.
   More than one offender: transparent single-linkage grouping (distance D km AND found within T days);
   arrest cases form their own groups, as police treat them. All numbers come from approximate pins. */
(function(){
'use strict';
const C = window.CASE, esc = C.esc, DATA = C.DATA, R = window.ROUTE_DATA;
if (!R) return;
const idx = {}; R.ids.forEach((id, i) => idx[id] = i);
const PAL = ['#f08c5a', '#58c4a7', '#b88cf0', '#f0c75a', '#5aa8f0', '#f05a8c', '#9bd35a'];
let layer = null, cur = 'cases';
const opt = { includeArrests: true, includeNhlanzi: false, D: 12, T: 30 };
const HYPO = 'HYPOTHETICAL: police have NOT established this.';

function leg(a, b){
  const i = idx[a], j = idx[b];
  const key = i < j ? a + '|' + b : b + '|' + a;
  return { straight: R.straightKm[i][j], driveKm: R.matrix.driving.distanceKm[i][j], driveMin: R.matrix.driving.durationMin[i][j],
           walkKm: R.matrix.foot.distanceKm[i][j], walkMin: R.matrix.foot.durationMin[i][j], geomDrive: R.geoms[key + '|driving'], geomWalk: R.geoms[key + '|foot'] };
}
function gap(a, b){ // found(a) -> found(b)
  const iv = DATA.meta.intervals.find(x => x.fromId === a.id && x.toId === b.id);
  if (iv) return iv;
  const d = Math.round((Date.parse(b.found.date) - Date.parse(a.found.date)) / 864e5); return { days: d };
}
function clear(){ if (layer){ C_MAP().removeLayer(layer); layer = null; } }
const C_MAP = () => window.MAPAPI.map;
function label(latlng, html, color){
  return L.marker(latlng, { interactive: false, icon: L.divIcon({ className: '', iconSize: null, html: '<div class="leg-label" style="border-color:' + color + '">' + html + '</div>' }) });
}
function midOf(pts){ return pts[Math.floor(pts.length / 2)]; }
function fmtKm(k){ return k == null ? '–' : (k < 10 ? k.toFixed(1) : Math.round(k)) + ' km'; }

/* ---------- Scenario A: single offender ---------- */
function singleCases(){
  return window.MAPAPI.steps.filter(c => c.num && (c.group !== 'arrest' || opt.includeArrests) && (c.id !== 'nhlanzi' || opt.includeNhlanzi));
}
function drawSingle(){
  clear(); layer = L.layerGroup().addTo(C_MAP());
  const cs = singleCases(), legs = [];
  for (let k = 0; k + 1 < cs.length; k++){
    const a = cs[k], b = cs[k + 1], l = leg(a.id, b.id), g = gap(a, b);
    legs.push({ a, b, l, g });
    const color = (a.group === 'arrest' || b.group === 'arrest') ? '#6f7c8c' : '#f08c5a';
    L.polyline([[a.found.lat, a.found.lng], [b.found.lat, b.found.lng]], { pane: 'routes', color: '#ffffff', weight: 1, opacity: 0.35, dashArray: '2 6', interactive: false }).addTo(layer);
    const pl = L.polyline(l.geomDrive, { pane: 'routes', color, weight: 3.2, opacity: 0.85 }).addTo(layer);
    pl.bindTooltip('<strong>Leg ' + (k + 1) + ' (HYPOTHETICAL)</strong>: ' + esc(a.name) + ' → ' + esc(b.name) + '<br>Time between discoveries: ' + esc(C.fmtGap(g)) + '<br>Straight line ' + fmtKm(l.straight) + ' · drive ' + fmtKm(l.driveKm) + ' / ' + C.fmtMin(l.driveMin) + ' · walk ' + fmtKm(l.walkKm) + ' / ' + C.fmtMin(l.walkMin), { className: 'map-tip', sticky: true });
    label(midOf(l.geomDrive), (k + 1) + ' · ' + g.days + ' d · ' + fmtKm(l.driveKm), color).addTo(layer);
  }
  window.MAPAPI.applyLayers();
  const pts = cs.map(c => [c.found.lat, c.found.lng]);
  C_MAP().flyToBounds(L.latLngBounds(pts).pad(0.1), { duration: 1.1, paddingTopLeft: [280, 90], paddingBottomRight: [500, 40] });
  const tot = legs.reduce((s, x) => ({ st: s.st + x.l.straight, dk: s.dk + x.l.driveKm, dm: s.dm + x.l.driveMin }), { st: 0, dk: 0, dm: 0 });
  const span = cs.length > 1 ? Math.round((Date.parse(cs[cs.length - 1].found.date) - Date.parse(cs[0].found.date)) / 864e5) : 0;
  let h = '<div class="hypo-head">' + HYPO + '</div><h3>Scenario: single offender</h3>';
  h += '<p class="small">This connects the body-found sites in the order the bodies were found, as if one person were responsible. <strong>Police have not established this.</strong> Arrests in three cases point to other people (police cite relationship motives in two). The President said on 29 Sept that police had found no evidence of a single perpetrator.</p>';
  h += '<div class="scen-opts"><label><input type="checkbox" id="sc-arr"' + (opt.includeArrests ? ' checked' : '') + '> Include the 3 cases with an arrest (grey legs)</label><label><input type="checkbox" id="sc-nhl"' + (opt.includeNhlanzi ? ' checked' : '') + '> Include Nhlanzi (police: not linked, not task team)</label></div>';
  h += '<p class="small">' + cs.length + ' sites · ' + legs.length + ' legs over ' + span + ' days · total ≈ ' + fmtKm(tot.st) + ' straight line, ≈ ' + fmtKm(tot.dk) + ' / ' + C.fmtMin(tot.dm) + ' by road (free-flow).</p>';
  h += '<div class="tablewrap"><table class="sum legs"><tr><th>#</th><th>From → to (order found)</th><th>Time between discoveries</th><th>Straight</th><th>Drive</th><th>Walk</th></tr>' + legs.map((x, k) =>
    '<tr><td>' + (k + 1) + '</td><td><a data-case="' + x.a.id + '">' + esc(x.a.num + '. ' + x.a.name) + '</a> → <a data-case="' + x.b.id + '">' + esc(x.b.num + '. ' + x.b.name) + '</a><br><span class="small">' + esc(C.fmtDate(x.a.found.date)) + ' → ' + esc(C.fmtDate(x.b.found.date)) + '</span></td><td>' + esc(C.fmtGap(x.g)) + '</td><td>' + fmtKm(x.l.straight) + '</td><td>' + fmtKm(x.l.driveKm) + '<br><span class="small">' + C.fmtMin(x.l.driveMin) + '</span></td><td>' + fmtKm(x.l.walkKm) + '<br><span class="small">' + C.fmtMin(x.l.walkMin) + '</span></td></tr>').join('') + '</table></div>';
  h += intervalBars(legs.map(x => ({ label: x.a.num + '→' + x.b.num, days: x.g.days, hours: x.g.hours, grey: x.a.group === 'arrest' || x.b.group === 'arrest' })));
  h += caveats();
  setPanel(h);
  document.getElementById('sc-arr').addEventListener('change', e => { opt.includeArrests = e.target.checked; drawSingle(); });
  document.getElementById('sc-nhl').addEventListener('change', e => { opt.includeNhlanzi = e.target.checked; drawSingle(); });
}
function intervalBars(items){
  const max = Math.max(1, ...items.map(i => i.days));
  return '<div class="ivchart"><div class="small"><strong>Days between consecutive discoveries</strong> (hours only where both times were reported)</div>' + items.map(i =>
    '<div class="ivrow"><span class="ivl">' + esc(i.label) + '</span><span class="ivbar' + (i.grey ? ' grey' : '') + '" style="width:' + Math.max(2, i.days / max * 100) + '%"></span><span class="ivv">' + i.days + ' d' + (i.hours != null ? ' (≈' + i.hours + ' h)' : '') + '</span></div>').join('') + '</div>';
}
function caveats(){ return '<div class="note">' + R.meta.caveats.map(esc).join(' ') + ' Routing: <a href="' + esc(R.meta.source.url) + '" target="_blank" rel="noopener">' + esc(R.meta.source.outlet) + '</a>.</div>'; }

/* ---------- Scenario B: more than one offender / group ---------- */
function clusters(){
  const all = window.MAPAPI.steps.filter(c => c.num);
  const arrests = all.filter(c => c.group === 'arrest');
  const cand = all.filter(c => c.group === 'taskteam');
  const excluded = window.MAPAPI.steps.filter(c => c.id === 'nhlanzi' || c.id === 'soweto');
  const parent = {}; cand.forEach(c => parent[c.id] = c.id);
  const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const edges = [];
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++){
    const a = cand[i], b = cand[j], l = leg(a.id, b.id);
    const dd = Math.abs(Date.parse(b.found.date) - Date.parse(a.found.date)) / 864e5;
    if (l.straight <= opt.D && dd <= opt.T) edges.push({ a, b, l, dd });
  }
  edges.sort((x, y) => x.l.straight - y.l.straight);
  const mst = [];
  edges.forEach(e => { const ra = find(e.a.id), rb = find(e.b.id); if (ra !== rb){ parent[ra] = rb; mst.push(e); } });
  const groups = {};
  cand.forEach(c => { const r = find(c.id); (groups[r] = groups[r] || []).push(c); });
  const list = Object.values(groups).sort((x, y) => y.length - x.length || x[0].found.date.localeCompare(y[0].found.date))
    .map((g, k) => ({ name: 'Group ' + String.fromCharCode(65 + k), kind: 'computed', cases: g.sort((a, b) => a.found.date.localeCompare(b.found.date)), color: PAL[k % PAL.length], edges: mst.filter(e => g.includes(e.a)) }));
  arrests.forEach(c => list.push({ name: 'Separate: ' + c.name, kind: 'arrest', cases: [c], color: '#6fb4e6', edges: [] }));
  return { list, excluded, candCount: cand.length };
}
function drawMulti(){
  clear(); layer = L.layerGroup().addTo(C_MAP());
  const { list, excluded, candCount } = clusters();
  list.forEach(g => {
    g.cases.forEach(c => L.circleMarker([c.found.lat, c.found.lng], { pane: 'routes', radius: 21, color: g.color, weight: 2.5, fill: true, fillOpacity: 0.12, dashArray: g.kind === 'arrest' ? '3 4' : null, interactive: false }).addTo(layer));
    g.edges.forEach(e => {
      const pl = L.polyline(e.l.geomDrive, { pane: 'routes', color: g.color, weight: 3, opacity: 0.85 }).addTo(layer);
      pl.bindTooltip('<strong>' + esc(g.name) + ' (HYPOTHETICAL)</strong>: ' + esc(e.a.name) + ' ↔ ' + esc(e.b.name) + '<br>Found ' + Math.round(e.dd) + ' days apart · straight ' + fmtKm(e.l.straight) + '<br>Drive ' + fmtKm(e.l.driveKm) + ' / ' + C.fmtMin(e.l.driveMin) + ' · walk ' + fmtKm(e.l.walkKm) + ' / ' + C.fmtMin(e.l.walkMin), { className: 'map-tip', sticky: true });
      label(midOf(e.l.geomDrive), C.fmtMin(e.l.driveMin) + ' drive · ' + C.fmtMin(e.l.walkMin) + ' walk', g.color).addTo(layer);
    });
    if (g.cases.length){ const c0 = g.cases[0]; label([c0.found.lat + 0.02, c0.found.lng - 0.03], esc(g.name), g.color).addTo(layer); }
  });
  window.MAPAPI.applyLayers();
  const pts = list.flatMap(g => g.cases.map(c => [c.found.lat, c.found.lng]));
  C_MAP().flyToBounds(L.latLngBounds(pts).pad(0.1), { duration: 1.1, paddingTopLeft: [280, 90], paddingBottomRight: [500, 40] });
  let h = '<div class="hypo-head">' + HYPO + '</div><h3>Scenario: more than one offender / group</h3>';
  h += '<p class="small">This shows how the sites would group if different people were responsible for different cases. <strong>Police have not established this.</strong> The groups come from a simple geometric rule and say nothing about who is responsible.</p>';
  h += '<div class="scen-opts">Join two task-team sites into one group if they are within <select id="sc-D">' + [5, 8, 12, 20, 30].map(v => '<option' + (v === opt.D ? ' selected' : '') + '>' + v + '</option>').join('') + '</select> km (straight line) <em>and</em> were found within <select id="sc-T">' + [7, 14, 30, 60].map(v => '<option' + (v === opt.T ? ' selected' : '') + '>' + v + '</option>').join('') + '</select> days of each other (single linkage).</div>';
  h += '<p class="small">Input: ' + candCount + ' task-team cases without an arrest. The 3 cases with arrests are shown as their own groups (dashed circles), as police treat them. Left out: ' + excluded.map(c => esc(c.name)).join('; ') + ' (not part of the task team cases / outside Ekurhuleni).</p>';
  list.forEach(g => {
    h += '<div class="grp-box" style="border-left-color:' + g.color + '"><strong>' + esc(g.name) + '</strong> · ' + g.cases.length + ' site' + (g.cases.length > 1 ? 's' : '') + (g.kind === 'arrest' ? ' · arrest made; police treat separately' : '') + '<br><span class="small">' + g.cases.map(c => '<a data-case="' + c.id + '">' + esc(c.num + '. ' + c.name) + '</a> (' + esc(C.fmtDate(c.found.date)) + ')').join(' · ') + '</span>';
    if (g.cases.length > 1) h += matrixTable(g.cases);
    h += '</div>';
  });
  h += timingTable();
  h += caveats();
  setPanel(h);
  document.getElementById('sc-D').addEventListener('change', e => { opt.D = +e.target.value; drawMulti(); });
  document.getElementById('sc-T').addEventListener('change', e => { opt.T = +e.target.value; drawMulti(); });
}
function matrixTable(cs){
  let h = '<div class="tablewrap"><table class="sum mtx"><tr><th></th>' + cs.map(c => '<th>' + c.num + '</th>').join('') + '</tr>';
  cs.forEach(a => { h += '<tr><th>' + a.num + '. ' + esc(a.name.split(' ')[0]) + '</th>' + cs.map(b => { if (a === b) return '<td>–</td>'; const l = leg(a.id, b.id); return '<td>' + fmtKm(l.straight) + '<br><span class="small">🚗 ' + C.fmtMin(l.driveMin) + ' · 🚶 ' + C.fmtMin(l.walkMin) + '</span></td>'; }).join('') + '</tr>'; });
  return h + '</table></div><div class="small">Nearest-neighbour legs (drawn): ' + (function(){ const out = []; cs.forEach(a => { let best = null; cs.forEach(b => { if (a !== b){ const l = leg(a.id, b.id); if (!best || l.straight < best.l.straight) best = { b, l }; } }); out.push(a.num + '→' + best.b.num + ' ' + fmtKm(best.l.straight)); }); return out.join(' · '); })() + '</div>';
}
/* reported windows: [last seen, found]; only cases where a last-seen date is reported */
function win(c){
  if (!c.lastSeen || !c.lastSeen.date) return null;
  const tm = s => { const m = /(\d{2}):(\d{2})/.exec(s || ''); return m ? m[1] + ':' + m[2] : null; };
  const st = tm(c.lastSeen.time), en = tm(c.found.time);
  return { a: Date.parse(c.lastSeen.date + 'T' + (st || '00:00') + ':00Z'), b: Date.parse(c.found.date + 'T' + (en || '23:59') + ':00Z'), exact: !!(st && en), c };
}
function timingTable(){
  const ws = window.MAPAPI.steps.filter(c => c.num).map(win).filter(Boolean);
  let rows = '';
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++){
    const x = ws[i], y = ws[j], l = leg(x.c.id, y.c.id);
    const overlap = x.a <= y.b && y.a <= x.b;
    const gapH = overlap ? 0 : (Math.max(x.a, y.a) - Math.min(x.b, y.b)) / 36e5;
    const verdict = overlap ? 'Windows overlap. The drive takes ≈' + C.fmtMin(l.driveMin) + ', so reported times neither support nor rule out one person.' : 'No overlap. The gap of ≈' + (gapH >= 48 ? Math.round(gapH / 24) + ' days' : Math.round(gapH) + ' h') + ' is far longer than the ≈' + C.fmtMin(l.driveMin) + ' drive, so timing does not rule it out.';
    rows += '<tr><td>' + x.c.num + '. ' + esc(x.c.name) + (x.c.group === 'arrest' ? ' <span class="small">(arrest)</span>' : '') + '<br>' + y.c.num + '. ' + esc(y.c.name) + (y.c.group === 'arrest' ? ' <span class="small">(arrest)</span>' : '') + '</td><td>' + (overlap ? 'overlap' : 'separate') + '</td><td class="small">' + verdict + '</td></tr>';
  }
  return '<h4 class="scen-h4">Timing check (only where last-seen and found dates are reported)</h4><p class="small">Window = from last seen to body found, for the ' + ws.length + ' cases with a reported last-seen date: ' + ws.map(w => esc(w.c.name) + ' (' + esc(C.fmtPoint(w.c.lastSeen)) + ' → ' + esc(C.fmtPoint(w.c.found)) + ')').join('; ') + '. Where no clock time was reported, the whole day is used. <strong>Result: the reported times rule no pair in or out.</strong> The windows are days long, and every drive between sites is under about an hour.</p><div class="tablewrap"><table class="sum"><tr><th>Pair</th><th>Windows</th><th>What the reported times allow</th></tr>' + rows + '</table></div>';
}

/* ---------- mode switching ---------- */
function setPanel(h){ const p = document.getElementById('scen-panel'); p.innerHTML = h; p.hidden = false; p.scrollTop = 0; }
function set(m){
  if (!['cases', 'single', 'multi'].includes(m)) m = 'cases';
  cur = m;
  document.querySelectorAll('.map-modes .btn').forEach(b => { b.classList.toggle('active', b.dataset.mode === m); b.setAttribute('aria-checked', b.dataset.mode === m); });
  window.MAPAPI.setMode(m);
  const hb = document.getElementById('hypo-banner');
  if (m === 'cases'){ clear(); document.getElementById('scen-panel').hidden = true; hb.hidden = true; return; }
  hb.hidden = false;
  document.getElementById('hypo-text').textContent = m === 'single' ? 'Lines connect sites in the order bodies were found, as if one person were responsible. Arrests in three cases, and the President\'s 29 Sept statement, point the other way.' : 'Groups are computed from distance and date thresholds only. They say nothing about who is responsible.';
  if (m === 'single') drawSingle(); else drawMulti();
}
window.SCEN = { set, showsCase(id){ if (cur === 'single') return singleCases().some(c => c.id === id); if (cur === 'multi') return id !== 'nhlanzi' && id !== 'soweto'; return true; }, get mode(){ return cur; }, opt };
document.addEventListener('click', ev => { const b = ev.target.closest('.map-modes .btn'); if (b){ set(b.dataset.mode); } });
})();
