/* Map tab: Leaflet map with approximate pins, last-seen links, boundary, precinct choropleth, and a smooth
   chronological fly-through (damped progress + eased fly arc, like the Clancy scene camera). */
(function(){
'use strict';
const C = window.CASE, esc = C.esc, DATA = C.DATA;
const steps = DATA.cases.slice().sort((a, b) => (a.found.date + (a.found.time || '')).localeCompare(b.found.date + (b.found.time || '')));
const N = steps.length;
const GROUP_COLOR = { taskteam: '#e2c46a', arrest: '#6fb4e6', other: '#9aa4b1' };
let map, inited = false, markers = {}, lsLayer, bLayer, pLayer, labelsOn = false, mode = 'cases';
const layerOn = { taskteam: true, arrest: true, other: true, lastseen: true, boundary: true, precincts: false };
const S = { q: 0, qt: 0, active: -1, playing: false, lastT: 0, dragging: false };
window.MAP_STATE = S;

function markerIcon(c, cur){
  const lbl = c.num ? c.num : 'S';
  return L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    html: '<div class="mk g-' + c.group + (c.num ? '' : ' outside') + (cur ? ' cur' : '') + '" title="' + esc(c.name) + '">' + lbl + '</div>' });
}
function precColor(r, max){
  if (r == null) return '#1a1f27';
  const t = Math.min(1, r / max);
  return d3.interpolateRgb('#231f2b', '#c2457a')(Math.pow(t, 0.85));
}
/* ---------- Basemap: keyless providers that work from file:// (no Referer) and https ----------
   Tested 30 Sept 2026: tile.openstreetmap.org answers requests without a Referer (file:// pages) with an
   "Access blocked" image, and CARTO's public basemaps return "API key required". Esri's public ArcGIS Online
   basemap tiles load with or without a Referer, so they are the primary provider. On repeated tile errors the map
   switches to the next provider in the chain. OSM is used only as a last resort, and only on http(s) pages. */
const ESRI_ATTR = {
  dark: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
  street: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>. Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; OpenStreetMap contributors, and the GIS user community',
  imagery: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>. Source: Esri, Vantor, Earthstar Geographics, and the GIS user community'
};
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
const esri = (host, svc) => 'https://' + host + '.arcgisonline.com/ArcGIS/rest/services/' + svc + '/MapServer/tile/{z}/{y}/{x}';
const IS_HTTP = /^https?:$/.test(location.protocol);
const BASEMAPS = {
  dark: { label: 'Dark', chain: ['server', 'services'].map(h => ({
      name: 'Esri World Dark Gray Canvas' + (h === 'services' ? ' (mirror host)' : ''),
      layers: [{ url: esri(h, 'Canvas/World_Dark_Gray_Base'), maxNativeZoom: 16, className: 'tiles-esri-dark', attribution: ESRI_ATTR.dark },
               { url: esri(h, 'Canvas/World_Dark_Gray_Reference'), maxNativeZoom: 16, className: 'tiles-esri-ref', labels: true }] }))
    .concat([{ name: 'Esri World Street Map (darkened)', layers: [{ url: esri('server', 'World_Street_Map'), maxNativeZoom: 19, className: 'tiles-dark', attribution: ESRI_ATTR.street }] },
             { name: 'OpenStreetMap (darkened)', httpOnly: true, layers: [{ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxNativeZoom: 19, className: 'tiles-dark', attribution: OSM_ATTR }] }]) },
  street: { label: 'Street', chain: [
      { name: 'Esri World Street Map', layers: [{ url: esri('server', 'World_Street_Map'), maxNativeZoom: 19, attribution: ESRI_ATTR.street }] },
      { name: 'Esri World Street Map (mirror host)', layers: [{ url: esri('services', 'World_Street_Map'), maxNativeZoom: 19, attribution: ESRI_ATTR.street }] },
      { name: 'OpenStreetMap', httpOnly: true, layers: [{ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxNativeZoom: 19, attribution: OSM_ATTR }] }] },
  satellite: { label: 'Satellite', chain: ['server', 'services'].map(h => ({
      name: 'Esri World Imagery' + (h === 'services' ? ' (mirror host)' : ''),
      layers: [{ url: esri(h, 'World_Imagery'), maxNativeZoom: 19, attribution: ESRI_ATTR.imagery },
               { url: esri(h, 'Reference/World_Boundaries_and_Places'), maxNativeZoom: 19, labels: true }] })) }
};
const BASE = { style: 'dark', idx: 0, layers: [], errors: 0, loads: 0, failed: false };
function baseStatus(msg){ const el = document.getElementById('base-status'); if (el) el.textContent = msg; }
// Only remove our own handlers: a bare off() would also drop Leaflet's own 'remove' listener, which unbinds the layer's map events.
function clearBase(){ BASE.layers.forEach(l => { l.off('tileload tileerror'); map.removeLayer(l); }); BASE.layers = []; }
function loadBase(style, idx){
  const chain = BASEMAPS[style].chain.filter(p => !p.httpOnly || IS_HTTP);
  clearBase();
  BASE.style = style; BASE.idx = idx; BASE.errors = 0; BASE.loads = 0; BASE.failed = false;
  if (idx >= chain.length) {
    BASE.failed = true;
    if (window.MAP_STATE) window.MAP_STATE.basemap = 'none';
    baseStatus('Background map unavailable (offline or blocked).');
    document.getElementById('map-wrap').classList.add('no-tiles');
    return;
  }
  document.getElementById('map-wrap').classList.remove('no-tiles');
  const prov = chain[idx];
  prov.layers.forEach((o, i) => {
    const l = L.tileLayer(o.url, { maxZoom: 19, maxNativeZoom: o.maxNativeZoom, className: o.className || '', attribution: o.attribution || '',
      pane: o.labels ? 'baselabels' : 'tilePane', updateWhenZooming: false, updateInterval: 250, keepBuffer: 3, crossOrigin: false });
    if (!o.labels) {   // only the base layer drives fallback (label tiles may legitimately be empty)
      l.on('tileload', () => { BASE.loads++; });
      l.on('tileerror', () => {
        BASE.errors++;
        if (BASE.idx !== idx || BASE.style !== style) return;
        // switch when several tiles failed and (almost) nothing loaded from this provider
        if ((BASE.errors >= 4 && BASE.loads === 0) || (BASE.errors >= 12 && BASE.errors > BASE.loads * 2)) {
          console.warn('[basemap] ' + prov.name + ' failing (' + BASE.errors + ' errors, ' + BASE.loads + ' loads), trying next provider');
          BASE.idx = -1;   // mark as switching so later errors from this burst don't schedule again
          setTimeout(() => loadBase(style, idx + 1), 0);
        }
      });
    }
    l.addTo(map); BASE.layers.push(l);
  });
  baseStatus('Background: ' + prov.name + (idx > 0 ? ' (fallback)' : ''));
  document.querySelectorAll('.base-pick button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.base === style)));
  if (window.MAP_STATE) window.MAP_STATE.basemap = prov.name;
}
function setupBasemap(){
  map.createPane('baselabels'); map.getPane('baselabels').style.zIndex = 390; map.getPane('baselabels').style.pointerEvents = 'none';
  let saved = null; try { saved = localStorage.getItem('eku-base'); } catch (e) {}
  const q = new URLSearchParams(location.search).get('base');
  const style = BASEMAPS[q] ? q : (BASEMAPS[saved] ? saved : 'dark');
  document.querySelectorAll('.base-pick button').forEach(b => b.addEventListener('click', () => {
    try { localStorage.setItem('eku-base', b.dataset.base); } catch (e) {}
    loadBase(b.dataset.base, 0);
  }));
  // if the browser comes back online after all providers failed, retry from the top
  window.addEventListener('online', () => { if (BASE.failed) loadBase(BASE.style, 0); });
  loadBase(style, 0);
}
function init(){
  if (inited) return; inited = true;
  const fit = () => { const w = document.getElementById('map-wrap'); const top = w.getBoundingClientRect().top + window.scrollY; const phone = window.matchMedia('(max-width: 760px)').matches; const vh = phone && window.visualViewport ? window.visualViewport.height : window.innerHeight; w.style.height = Math.max(phone ? 440 : 600, Math.round(vh - top)) + 'px'; if (map) map.invalidateSize(); };
  window.addEventListener('resize', fit); fit();
  map = L.map('leaflet-map', { zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, zoomControl: true, attributionControl: true, preferCanvas: false }).setView([-26.12, 28.28], 10.4);
  map.zoomControl.setPosition('topleft');
  // Basemap with automatic fallback + picker (dark / street / satellite). See setupBasemap() below.
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  map.attributionControl.addAttribution('boundary: geoBoundaries · precincts: Stats SA / SAPS · routes: OSRM (FOSSGIS)');
  setupBasemap();
  // panes: precincts under boundary under routes under markers
  map.createPane('prec'); map.getPane('prec').style.zIndex = 350;
  map.createPane('bound'); map.getPane('bound').style.zIndex = 380;
  map.createPane('routes'); map.getPane('routes').style.zIndex = 420;
  if (window.EKU_BOUNDARY) bLayer = L.geoJSON(window.EKU_BOUNDARY, { pane: 'bound', interactive: false, style: { color: '#8fb3d9', weight: 1.6, dashArray: '6 5', fill: true, fillColor: '#8fb3d9', fillOpacity: 0.03 } }).addTo(map);
  if (C.CRIME){
    const rates = {}; C.CRIME.stations.forEach(s => rates[s.station] = s);
    const max = Math.max(...C.CRIME.stations.map(s => s.murder_rate_per100k_fy2025_26 || 0));
    pLayer = L.geoJSON(C.CRIME.geo, { pane: 'prec', style: f => { const s = rates[f.properties.station]; return { color: '#5a4a63', weight: 0.8, fillColor: precColor(s && s.murder_rate_per100k_fy2025_26, max), fillOpacity: 0.62 }; },
      onEachFeature: (f, lyr) => { const s = rates[f.properties.station]; if (!s) return;
        lyr.bindTooltip('<strong>' + esc(s.station) + ' precinct</strong><br>Murders FY 2025/26: ' + s.murder_fy2025_26 + (s.murder_rate_per100k_fy2025_26 != null ? ' (≈' + s.murder_rate_per100k_fy2025_26 + ' per 100k, Census 2022 pop.)' : '') + '<br>Apr–Jun 2026: ' + s.murder_q1_2026_27 + '<br><em>SAPS, precinct-wide, not site-specific</em>', { className: 'map-tip', sticky: true }); } });
    const E = C.ekuRate();
    const leg = document.getElementById('prec-legend');
    const stops = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * max));
    leg.innerHTML = '<strong>Murders per 100,000 residents, FY 2025/26</strong><div class="prec-scale">' + stops.map(v => '<span style="background:' + precColor(v, max) + '">' + v + '</span>').join('') + '</div>' +
      '<div class="small">SAPS precinct counts (Apr 2025–Mar 2026, sum of quarterly releases) ÷ Stats SA Census 2022 population. Precinct-wide, not for the exact site. Ekurhuleni overall ≈' + (E ? E.rate : '–') + '.</div>';
  }
  lsLayer = L.layerGroup().addTo(map);
  steps.forEach((c, i) => {
    const m = L.marker([c.found.lat, c.found.lng], { icon: markerIcon(c, false), keyboard: true, title: c.name, riseOnHover: true, zIndexOffset: 1000 });
    m.bindTooltip('<strong>' + esc(C.caseLabel(c)) + '</strong><br>Found ' + esc(C.fmtPoint(c.found)) + '<br>' + esc(c.statusShort) + '<br><em>Approximate location of where body was found as reported</em>', { className: 'map-tip', direction: 'top', offset: [0, -14] });
    m.on('click', () => { goTo(i, true); C.openCase(c.id); });
    markers[c.id] = m;
    if (c.lastSeen && c.lastSeen.lat != null){
      const ls = L.marker([c.lastSeen.lat, c.lastSeen.lng], { icon: L.divIcon({ className: '', iconSize: [14, 14], iconAnchor: [7, 7], html: '<div class="mk-ls"></div>' }), title: 'Last contact: ' + c.name });
      ls.bindTooltip('<strong>' + esc(c.name) + '</strong>: ' + esc(c.lastSeen.kind === 'stated destination' ? 'stated destination (not a confirmed sighting)' : 'last seen') + '<br>' + esc(C.fmtPoint(c.lastSeen)) + '<br>' + esc(c.lastSeen.place), { className: 'map-tip' });
      const line = L.polyline([[c.lastSeen.lat, c.lastSeen.lng], [c.found.lat, c.found.lng]], { color: GROUP_COLOR[c.group], weight: 2, dashArray: '4 7', opacity: 0.8 });
      line.bindTooltip('Dashed line: ' + esc(c.name) + ', from ' + (c.lastSeen.kind === 'stated destination' ? 'stated destination' : 'last-seen place') + ' to where she was found. It is not a known route.', { className: 'map-tip', sticky: true });
      ls.caseGroup = line.caseGroup = c.group;
      lsLayer.addLayer(ls); lsLayer.addLayer(line);
    }
  });
  applyLayers();
  // counts in layer panel
  ['taskteam', 'arrest', 'other'].forEach(g => document.getElementById('lc-' + g).textContent = '(' + DATA.cases.filter(c => c.group === g).length + ')');
  document.querySelectorAll('.map-layers input[data-layer]').forEach(inp => inp.addEventListener('change', () => {
    const k = inp.dataset.layer;
    if (k === 'labels'){ labelsOn = inp.checked; setLabels(); return; }
    layerOn[k] = inp.checked; applyLayers();
  }));
  document.getElementById('map-overview').addEventListener('click', overview);
  document.getElementById('map-play').addEventListener('click', togglePlay);
  buildHUD(); buildPatterns();
  map.on('moveend', () => { S.mapFlying = false; });
  requestAnimationFrame(tick);
}
function setLabels(){
  steps.forEach(c => { const m = markers[c.id]; m.unbindTooltip();
    if (labelsOn) m.bindTooltip(esc(c.num ? c.num + '. ' + c.name : c.name), { permanent: true, className: 'map-tip', direction: 'right', offset: [14, 0] });
    else m.bindTooltip('<strong>' + esc(C.caseLabel(c)) + '</strong><br>Found ' + esc(C.fmtPoint(c.found)) + '<br>' + esc(c.statusShort) + '<br><em>Approximate location of where body was found as reported</em>', { className: 'map-tip', direction: 'top', offset: [0, -14] }); });
}
function visibleCase(c){ return layerOn[c.group]; }
function applyLayers(){
  steps.forEach(c => { const m = markers[c.id]; const vis = visibleCase(c) && (mode === 'cases' || !window.SCEN || window.SCEN.showsCase(c.id));
    if (vis && !map.hasLayer(m)) m.addTo(map); if (!vis && map.hasLayer(m)) map.removeLayer(m); });
  lsLayer.eachLayer(l => { const vis = layerOn.lastseen && layerOn[l.caseGroup] && mode === 'cases'; l.setStyle ? (l.setStyle({ opacity: vis ? 0.8 : 0 })) : l.setOpacity(vis ? 1 : 0); });
  if (bLayer){ if (layerOn.boundary) bLayer.addTo(map); else map.removeLayer(bLayer); }
  if (pLayer){ if (layerOn.precincts) pLayer.addTo(map); else map.removeLayer(pLayer); document.getElementById('prec-legend').hidden = !layerOn.precincts; }
}
function overview(){
  stopPlay();
  const pts = steps.filter(visibleCase).map(c => [c.found.lat, c.found.lng]);
  if (pts.length) map.flyToBounds(L.latLngBounds(pts).pad(0.12), Object.assign({ duration: 1.2 }, window.matchMedia('(max-width: 760px)').matches ? { paddingTopLeft: [16, 110], paddingBottomRight: [16, 290] } : { paddingTopLeft: [300, 60], paddingBottomRight: [440, 110] }));
}

/* ---------- fly-through ---------- */
function zoomFor(c){ return c.found.pinPrecision === 'town-level only' ? 13 : 14; }
function panelOffset(){ // keep the pin clear of the right-hand panel
  const w = map.getSize().x; return window.innerWidth > 900 ? Math.min(210, w * 0.14) : 0;
}
let lastView = '';
/* Map motion: the HUD progress q follows its target qt with exponential damping (as in the Clancy scene);
   once the target settles on a case, the map flies there with Leaflet's smooth flyTo (zoom-out/zoom-in arc).
   Tiles load only when each flight ends (updateWhenZooming: false), which keeps tile-server load low. */
function flyToStep(i){
  const c = steps[i]; if (!c) return;
  const z = zoomFor(c), off = panelOffset();
  const offY = window.matchMedia('(max-width: 760px)').matches ? 80 : 0;   // phones: keep the marker between the top banner and the bottom sheet
  const center = map.unproject(map.project([c.found.lat, c.found.lng], z).add([off, offY]), z);
  const d = map.distance(map.getCenter(), center) / 1000;
  S.mapFlying = true;
  map.flyTo(center, z, { duration: Math.min(3.2, 1.1 + d / 14), easeLinearity: 0.18 });
}
function tick(t){
  const dt = Math.min(0.05, (t - (S.lastT || t)) / 1000); S.lastT = t;
  if (mode === 'cases' && inited && document.getElementById('view-map').classList.contains('active') && S.flying){
    const k = 3.2;
    S.q += (S.qt - S.q) * (1 - Math.exp(-dt * k));
    if (Math.abs(S.qt - S.q) < 0.0015){ S.q = S.qt; S.flying = false; }
    const target = Math.round(S.qt);
    if (!S.dragging && target !== S.flownTo && Math.abs(S.qt - target) < 0.02){ S.flownTo = target; flyToStep(target); }
    const idx = Math.round(S.q);
    if (idx !== S.active) setActive(idx);
    updateHUD();
  }
  requestAnimationFrame(tick);
}
function goTo(i, fromClick){ S.qt = Math.max(0, Math.min(N - 1, i)); S.flying = true; if (!fromClick) {} }
function nudge(delta){ S.qt = Math.max(0, Math.min(N - 1, S.qt + delta)); S.flying = true; }
function settleTarget(){ S.qt = Math.round(S.qt); S.flying = true; }
let settleTimer = null;

function setActive(idx){
  S.active = idx;
  steps.forEach((c, i) => markers[c.id].setIcon(markerIcon(c, i === idx)));
  const c = steps[idx], panel = document.getElementById('map-panel');
  panel.classList.add('fading');
  setTimeout(() => { panel.innerHTML = panelHTML(c, idx); panel.classList.remove('fading'); }, 140);
  const ticks = document.querySelectorAll('#mp-ticks span');
  ticks.forEach((s, i) => { s.classList.toggle('on', i <= idx); s.classList.toggle('cur', i === idx); });
  document.getElementById('mp-time').textContent = C.fmtDate(c.found.date) + ' · ' + (c.num ? 'Case ' + c.num + ' of 12 in Ekurhuleni' : 'Outside Ekurhuleni') + ' · ' + c.name;
}
function panelHTML(c, idx){
  const iv = DATA.meta.intervals.find(x => x.toId === c.id);
  const found = c.events.map(id => C.byId[id]).find(e => e.category === 'found');
  let h = '<div class="step">Step ' + (idx + 1) + ' of ' + N + ' · in order found</div>';
  h += '<h3>' + esc(c.name) + (c.age ? ' <span class="small">(' + esc(c.age) + ')</span>' : '') + '</h3>';
  h += '<div class="when">Body found: ' + esc(C.fmtPoint(c.found)) + '</div>';
  h += '<div class="where">📍 ' + esc(c.found.place) + '<br><em>Approximate location of where body was found as reported (' + esc(c.found.pinPrecision) + ')</em></div>';
  if (c.lastSeen) h += '<p><strong>Last seen:</strong> ' + esc(C.fmtPoint(c.lastSeen)) + ': ' + esc(c.lastSeen.place) + '</p>';
  h += '<p>' + esc(c.circumstances) + '</p>';
  h += '<p>' + C.caseBadge(c) + '</p><p class="small">' + esc(c.linkStatus) + '</p>';
  if (iv) h += '<div class="note">Time since the previous discovery (' + esc(C.caseById[iv.fromId].name) + '): ' + esc(C.fmtGap(iv)) + '. This shows timing only, not a link.</div>';
  if (!c.num) h += '<div class="note">Outside Ekurhuleni (Soweto, City of Johannesburg). Shown for context because police mentioned it; no link has been confirmed.</div>';
  h += '<div class="small"><strong>Sources:</strong></div>' + C.sourcesHTML(c.sources.slice(0, 4));
  h += '<div class="open"><button class="btn" data-case="' + c.id + '">Open case file</button> ' + (found ? '<button class="btn" data-ev="' + found.id + '">Discovery event</button>' : '') + '</div>';
  return h;
}
function buildHUD(){
  const ticks = document.getElementById('mp-ticks');
  ticks.innerHTML = steps.map((c, i) => '<span class="g-' + c.group + '" style="left:' + (i / (N - 1) * 100) + '%" title="' + esc((c.num ? c.num + '. ' : '') + c.name + ' · ' + C.fmtDate(c.found.date)) + '" data-i="' + i + '"></span>').join('');
  ticks.addEventListener('click', ev => { const s = ev.target.closest('span'); if (s){ stopPlay(); goTo(+s.dataset.i); } });
  const prog = document.getElementById('mp-progress');
  const fromX = x => { const r = prog.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)) * (N - 1); };
  prog.addEventListener('pointerdown', ev => { if (ev.target.closest('span')) return; S.dragging = true; stopPlay(); prog.setPointerCapture(ev.pointerId); S.qt = fromX(ev.clientX); S.flying = true; });
  prog.addEventListener('pointermove', ev => { if (S.dragging){ S.qt = fromX(ev.clientX); S.flying = true; } });
  prog.addEventListener('pointerup', () => { if (S.dragging){ S.dragging = false; settleTarget(); } });
  document.getElementById('mp-prev').addEventListener('click', () => { stopPlay(); goTo(Math.round(S.qt) - 1); });
  document.getElementById('mp-next').addEventListener('click', () => { stopPlay(); goTo(Math.round(S.qt) + 1); });
  const wheel = ev => { if (mode !== 'cases') return; const panel = document.getElementById('map-panel');
    if (ev.currentTarget === panel && panel.scrollHeight > panel.clientHeight + 4){ const atTop = panel.scrollTop <= 0, atBot = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2; if ((ev.deltaY < 0 && !atTop) || (ev.deltaY > 0 && !atBot)) return; }
    ev.preventDefault(); stopPlay(); nudge(Math.sign(ev.deltaY) * Math.min(0.5, Math.abs(ev.deltaY) / 240)); clearTimeout(settleTimer); settleTimer = setTimeout(settleTarget, 260); };
  document.getElementById('map-hud').addEventListener('wheel', wheel, { passive: false });
  document.getElementById('map-panel').addEventListener('wheel', wheel, { passive: false });
  document.addEventListener('keydown', ev => { if (mode !== 'cases' || !document.getElementById('view-map').classList.contains('active') || /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
    if (ev.key === 'ArrowRight'){ stopPlay(); goTo(Math.round(S.qt) + 1); } if (ev.key === 'ArrowLeft'){ stopPlay(); goTo(Math.round(S.qt) - 1); } });
}
function updateHUD(){ document.getElementById('mp-prog').style.width = (S.q / (N - 1) * 100) + '%'; }
let playTimer = null;
function togglePlay(){ if (S.playing) stopPlay(); else { S.playing = true; document.getElementById('map-play').textContent = '❚❚ Pause'; if (Math.round(S.qt) >= N - 1) goTo(0); playTimer = setInterval(() => { if (Math.round(S.qt) >= N - 1) return stopPlay(); goTo(Math.round(S.qt) + 1); }, 4800); } }
function stopPlay(){ S.playing = false; clearInterval(playTimer); const b = document.getElementById('map-play'); if (b) b.textContent = '▶ Play through cases'; }

/* ---------- patterns & differences ---------- */
function buildPatterns(){
  const P = DATA.patterns, box = document.getElementById('patterns'), D = DATA.meta.distance;
  const li = x => '<li>' + (x.who ? '<span class="who">' + esc(x.who) + ':</span> ' : '') + esc(x.text) + ' <span class="srcs">[' + x.sources.map(s => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.outlet) + '</a>').join(', ') + ']</span></li>';
  box.innerHTML = '<button class="btn" id="patterns-close" style="float:right">✕</button><h3>Patterns &amp; differences</h3>' +
    '<p class="small">What police, officials and experts have said publicly about similarities and differences between the cases. This site does not draw a conclusion. Police have <strong>not</strong> established a single perpetrator.</p>' +
    '<h4>What officials and experts said</h4><ul>' + P.said.map(li).join('') + '</ul>' +
    '<h4>Similarities reported</h4><ul>' + P.similar.map(li).join('') + '</ul>' +
    '<h4>Differences reported</h4><ul>' + P.different.map(li).join('') + '</ul>' +
    '<h4>Approximate distances (computed here)</h4><ul><li>Of ' + D.total + ' Ekurhuleni pins, ' + D.within10 + ' are within about 10 km of central Kempton Park (straight line) and ' + D.within20 + ' within about 20 km. The farthest is about ' + D.farthest.km + ' km (' + esc(D.farthest.name) + '). ' + esc(D.note) + '</li></ul>';
  document.getElementById('patterns-btn').addEventListener('click', () => { box.hidden = !box.hidden; });
  box.addEventListener('click', ev => { if (ev.target.id === 'patterns-close') box.hidden = true; });
}

/* ---------- API for scenario.js ---------- */
window.MAPAPI = {
  get map(){ return map; }, steps, markers, GROUP_COLOR, markerIcon,
  setMode(m){ mode = m; stopPlay(); applyLayers(); document.getElementById('map-wrap').classList.toggle('scen', m !== 'cases'); document.getElementById('patterns').hidden = true;
    document.getElementById('map-panel').hidden = m !== 'cases'; document.getElementById('map-hud').hidden = m !== 'cases';
    document.getElementById('map-banner').hidden = m !== 'cases';
    if (m === 'cases'){ steps.forEach((c, i) => markers[c.id].setIcon(markerIcon(c, i === S.active))); S.flying = true; S.flownTo = -1; }
  },
  applyLayers, get mode(){ return mode; }, goTo, overview,
};
C.on('view', ({ view, params }) => {
  if (view !== 'map') return;
  init();
  setTimeout(() => { map.invalidateSize(); const id = params.get('case'); const i = id ? steps.findIndex(c => c.id === id) : 0; S.q = S.qt = Math.max(0, i); S.flying = true; S.flownTo = -1; if (params.get('mode') && window.SCEN) window.SCEN.set(params.get('mode')); }, 30);
});
C.on('params', ({ view, params }) => { if (view === 'map' && inited){ const id = params.get('case'); if (id){ const i = steps.findIndex(c => c.id === id); if (i >= 0) goTo(i); } if (params.get('mode') && window.SCEN) window.SCEN.set(params.get('mode')); } });
})();
