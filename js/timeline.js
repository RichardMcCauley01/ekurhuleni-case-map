/* Timeline: d3 swimlanes (one per woman + Investigation & officials), gaps band, zoom presets, filters, search, list, drawer. */
(function(){
'use strict';
const C = window.CASE, DATA = C.DATA, esc = C.esc;
const GC = { taskteam: '#e2c46a', arrest: '#6fb4e6', other: '#9aa4b1' };
const cases = DATA.cases.slice().sort((a, b) => a.found.date.localeCompare(b.found.date));
const LANES = cases.map(c => ({ key: c.id, name: (c.num ? c.num + '. ' : '') + c.name, sub: c.statusShort, color: GC[c.group], group: c.group }))
  .concat([{ key: 'investigation', name: 'Investigation & officials', sub: 'SAPS, task team, Parliament, President, experts', color: '#5fc2b5', group: 'investigation' }]);
const STATUS = [
  { key: 'police', name: 'Police statement', color: '#6fbf8e' }, { key: 'official', name: 'Official statement', color: '#5fc2b5' },
  { key: 'court', name: 'Court / charges', color: '#e58a6f' }, { key: 'media', name: 'Media report', color: '#8fb3d9' },
  { key: 'expert', name: 'Expert opinion', color: '#c89adf' }, { key: 'sched', name: 'Scheduled', color: '#9aa4b1' },
];
const STATUS_COLOR = {}; STATUS.forEach(s => STATUS_COLOR[s.key] = s.color);
const CATS = Object.keys(C.CAT_LABEL);
const GROUPS = [{ key: 'taskteam', name: 'Task team, no arrest', color: GC.taskteam }, { key: 'arrest', name: 'Arrest made', color: GC.arrest }, { key: 'other', name: 'Other', color: GC.other }, { key: 'investigation', name: 'Investigation & officials', color: '#5fc2b5' }];
const U = (y, m, d, h) => new Date(Date.UTC(y, m - 1, d || 1, h || 0));
const PRESETS = { all: [U(2026, 7, 1), U(2026, 10, 9)], sept: [U(2026, 9, 1), U(2026, 10, 2)], last10: [U(2026, 9, 19), U(2026, 10, 7)], wide: [U(2026, 3, 1), U(2026, 10, 9)] };
const F = { cats: new Set(CATS), status: new Set(STATUS.map(s => s.key)), groups: new Set(GROUPS.map(g => g.key)), q: '' };
let svg, gPlot, gAxis, gGrid, gLanes, gGaps, gToday, x0, zx, zoom, W = 1000, selected = null, inited = false, tip, focusCase = null;
const M = { left: 230, right: 18, top: 62, bottom: 22 };
const items = DATA.events.map(e => ({ e, lane: e.lane, t: C.parseLocal(e.datetime), sg: C.statusGroup(e.status), key: e.id }));
const laneGroup = {}; LANES.forEach(l => laneGroup[l.key] = l.group);
function matches(e){
  if (!F.cats.has(e.category) || !F.status.has(C.statusGroup(e.status)) || !F.groups.has(laneGroup[e.lane])) return false;
  if (!F.q) return true;
  const hay = (e.title + ' ' + e.description + ' ' + e.location + ' ' + e.status + ' ' + (e.note || '') + ' ' + e.sources.map(s => s.outlet + ' ' + s.title).join(' ')).toLowerCase();
  return F.q.split(/\s+/).every(w => hay.includes(w));
}
function buildFilters(){
  const chip = (grp, key, label, dot) => '<button class="chip on" data-grp="' + grp + '" data-key="' + key + '">' + (dot ? '<span class="dot" style="background:' + dot + '"></span>' : '') + esc(label) + '</button>';
  document.getElementById('f-cat').insertAdjacentHTML('beforeend', CATS.map(c => chip('cats', c, C.CAT_LABEL[c])).join(''));
  document.getElementById('f-status').insertAdjacentHTML('beforeend', STATUS.map(s => chip('status', s.key, s.name, s.color)).join(''));
  document.getElementById('f-group').insertAdjacentHTML('beforeend', GROUPS.map(g => chip('groups', g.key, g.name, g.color)).join(''));
  document.querySelector('.tl-filters').addEventListener('click', ev => {
    const c = ev.target.closest('.chip'); if (!c) return;
    const set = F[c.dataset.grp];
    if (ev.altKey || ev.shiftKey){ set.clear(); set.add(c.dataset.key); document.querySelectorAll('.chip[data-grp="' + c.dataset.grp + '"]').forEach(x => x.classList.toggle('on', x === c)); }
    else { if (set.has(c.dataset.key)) set.delete(c.dataset.key); else set.add(c.dataset.key); c.classList.toggle('on'); }
    draw(); drawList();
  });
  document.getElementById('tl-search').addEventListener('input', ev => { F.q = ev.target.value.trim().toLowerCase(); draw(); drawList(); });
  document.getElementById('tl-listtoggle').addEventListener('click', ev => { const l = document.getElementById('tl-list'); l.hidden = !l.hidden; ev.target.classList.toggle('active', !l.hidden); ev.target.textContent = l.hidden ? 'List view' : 'Hide list'; drawList(); });
  document.querySelectorAll('.zbtn').forEach(b => b.addEventListener('click', () => zoomTo(b.dataset.zoom, true)));
}
function init(){
  if (inited) return; inited = true;
  buildFilters(); intervalChart();
  const host = d3.select('#tl-chart');
  tip = host.append('div').attr('class', 'tl-tip').style('display', 'none');
  svg = host.append('svg');
  svg.append('defs').append('clipPath').attr('id', 'tlclip').append('rect');
  gLanes = svg.append('g');
  gGrid = svg.append('g').attr('class', 'grid').attr('clip-path', 'url(#tlclip)');
  gToday = svg.append('g').attr('clip-path', 'url(#tlclip)');
  gGaps = svg.append('g').attr('class', 'gaps').attr('clip-path', 'url(#tlclip)');
  gAxis = svg.append('g').attr('class', 'axis');
  gPlot = svg.append('g').attr('clip-path', 'url(#tlclip)');
  x0 = d3.scaleUtc().domain(PRESETS.all); zx = x0.copy();
  zoom = d3.zoom().scaleExtent([0.2, 400]).on('zoom', ev => { zx = ev.transform.rescaleX(x0); draw(); });
  svg.call(zoom).on('dblclick.zoom', null);
  const resize = () => {
    W = document.getElementById('tl-chart').clientWidth || 1000;
    const t = d3.zoomTransform(svg.node());
    x0.range([M.left, W - M.right]); zx = t.rescaleX(x0);
    zoom.extent([[M.left, 0], [W - M.right, 10]]).translateExtent([[x0(U(2026, 2, 1)), 0], [x0(U(2026, 11, 15)), 10]]);
    draw();
  };
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.getElementById('tl-chart')); else window.addEventListener('resize', resize);
  resize();
  C.on('select', s => { selected = s && s.type === 'event' ? s.id : null; gPlot.selectAll('.ev').classed('sel', d => d.e.id === selected); });
  drawList();
}
function zoomTo(name, animate){
  const [a, b] = PRESETS[name] || PRESETS.all;
  const k = (W - M.left - M.right) / (x0(b) - x0(a));
  const t = d3.zoomIdentity.translate(M.left - x0(a) * k, 0).scale(k);
  (animate ? svg.transition().duration(750) : svg).call(zoom.transform, t);
  document.querySelectorAll('.zbtn').forEach(x => x.classList.toggle('active', x.dataset.zoom === name));
}
function layout(vis){
  const rowsByLane = {}, laneRows = {};
  LANES.forEach(l => { rowsByLane[l.key] = []; laneRows[l.key] = 1; });
  const [d0, d1] = zx.domain();
  vis.sort((a, b) => a.t - b.t);
  vis.forEach(d => {
    d.x = zx(d.t);
    const inView = d.t >= d0 && d.t <= d1, rows = rowsByLane[d.lane], maxRows = 6;
    const lw = Math.min(d.e.title.length, 30) * 6 + 14;
    let r = rows.findIndex(end => end < d.x - 6);
    if (r === -1 && rows.length < maxRows){ r = rows.length; rows.push(-Infinity); }
    if (r !== -1){ d.row = r; d.label = inView; rows[r] = d.x + (inView ? lw : 12); } else { d.row = maxRows; d.label = false; }
    laneRows[d.lane] = Math.max(laneRows[d.lane], d.row + 1);
  });
  let y = M.top; const laneY = {};
  LANES.filter(l => F.groups.has(l.group)).forEach(l => { const h = Math.max(44, laneRows[l.key] * 20 + 14); laneY[l.key] = { y, h }; y += h; });
  return { laneY, height: y + M.bottom };
}
function draw(){
  if (!svg) return;
  const vis = items.filter(d => laneGroup[d.lane] && matches(d.e));
  const { laneY, height } = layout(vis);
  svg.attr('width', W).attr('height', height);
  svg.select('#tlclip rect').attr('x', M.left).attr('y', 0).attr('width', W - M.left - M.right).attr('height', height);
  const lanes = LANES.filter(l => F.groups.has(l.group));
  const lg = gLanes.selectAll('g.lane').data(lanes, d => d.key).join(enter => { const g = enter.append('g').attr('class', 'lane'); g.append('rect').attr('class', 'lane-bg'); g.append('rect').attr('class', 'lane-color'); g.append('text').attr('class', 'lane-label'); g.append('text').attr('class', 'lane-sub'); return g; });
  lg.select('.lane-bg').attr('x', 0).attr('width', W).attr('y', d => laneY[d.key].y).attr('height', d => laneY[d.key].h).attr('class', (d, i) => 'lane-bg' + (i % 2 ? ' alt' : '') + (focusCase === d.key ? ' focus' : ''));
  lg.select('.lane-color').attr('x', 0).attr('width', 4).attr('y', d => laneY[d.key].y).attr('height', d => laneY[d.key].h).attr('fill', d => d.color);
  lg.select('.lane-label').attr('x', 12).attr('y', d => laneY[d.key].y + 18).text(d => d.name.length > 32 ? d.name.slice(0, 31) + '…' : d.name).attr('fill', d => d.color).style('cursor', d => d.key === 'investigation' ? 'default' : 'pointer')
    .on('click', (ev, d) => { if (d.key !== 'investigation') C.openCase(d.key); });
  lg.select('.lane-sub').attr('x', 12).attr('y', d => laneY[d.key].y + 32).text(d => d.sub.length > 38 ? d.sub.slice(0, 37) + '…' : d.sub);
  const ticks = Math.max(4, Math.floor((W - M.left) / 110));
  gAxis.attr('transform', 'translate(0,' + (M.top - 30) + ')').call(d3.axisTop(zx).ticks(ticks).tickSizeOuter(0));
  gGrid.attr('transform', 'translate(0,' + M.top + ')').call(d3.axisBottom(zx).ticks(ticks).tickSize(height - M.top).tickFormat('')).call(g => g.select('.domain').remove());
  // "as of" line
  const asOf = U(2026, 9, 30, 12);
  gToday.selectAll('line').data([asOf]).join('line').attr('x1', d => zx(d)).attr('x2', d => zx(d)).attr('y1', M.top - 26).attr('y2', height - M.bottom).attr('stroke', '#d9b36c').attr('stroke-dasharray', '3 4').attr('opacity', 0.6);
  gToday.selectAll('text').data([asOf]).join('text').attr('x', d => zx(d) + 4).attr('y', height - 8).text('as of 30 Sept').attr('fill', '#a38a55').style('font-size', '10px');
  // gaps band: days between consecutive discoveries
  const iv = DATA.meta.intervals.map(x => ({ x, a: C.parseLocal(x.fromDate), b: C.parseLocal(x.toDate) }));
  const gy = M.top - 18;
  const gg = gGaps.selectAll('g.gap').data(iv).join(enter => { const g = enter.append('g').attr('class', 'gap'); g.append('path'); g.append('text'); return g; });
  gg.select('path').attr('d', d => { const xa = zx(d.a), xb = zx(d.b); return 'M' + xa + ',' + (gy + 8) + 'V' + gy + 'H' + xb + 'V' + (gy + 8); }).attr('stroke', '#7f8a98').attr('fill', 'none');
  gg.select('text').attr('x', d => (zx(d.a) + zx(d.b)) / 2).attr('y', gy - 3).attr('text-anchor', 'middle').text(d => { const w = zx(d.b) - zx(d.a); return w > 26 ? d.x.days + 'd' + (d.x.hours != null && w > 60 ? ' (≈' + d.x.hours + 'h)' : '') : ''; }).attr('fill', '#b4bcc7').style('font-size', '10px');
  gg.on('mouseenter', (ev, d) => { tip.style('display', 'block').html('<strong>' + esc(C.caseById[d.x.fromId].name) + ' → ' + esc(C.caseById[d.x.toId].name) + '</strong><br>' + esc(C.fmtGap(d.x)) + ' between discoveries (timing only, not a link)'); })
    .on('mousemove', ev => { const r = document.getElementById('tl-chart').getBoundingClientRect(); tip.style('left', (ev.clientX - r.left + 12) + 'px').style('top', (ev.clientY - r.top + 12) + 'px'); })
    .on('mouseleave', () => tip.style('display', 'none'));
  const evs = gPlot.selectAll('g.ev').data(vis, d => d.key).join(enter => {
    const g = enter.append('g').attr('class', 'ev').attr('tabindex', 0).attr('role', 'button');
    g.append('circle').attr('r', 6); g.append('text').attr('x', 10).attr('dy', '0.35em'); return g;
  });
  evs.attr('transform', d => 'translate(' + d.x + ',' + (laneY[d.lane].y + 14 + d.row * 20) + ')').classed('sel', d => d.e.id === selected).attr('aria-label', d => d.e.title + ', ' + C.fmtWhen(d.e));
  evs.select('circle').attr('fill', d => (d.e.precision === 'approximate' || d.sg === 'sched') ? '#12161c' : STATUS_COLOR[d.sg]).attr('stroke', d => STATUS_COLOR[d.sg]).attr('stroke-dasharray', d => d.sg === 'sched' ? '2 2' : null);
  evs.select('text').text(d => d.label ? (d.e.title.length > 30 ? d.e.title.slice(0, 29) + '…' : d.e.title) : '');
  evs.on('click', (ev, d) => C.openEvent(d.e.id))
    .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); C.openEvent(d.e.id); } })
    .on('mouseenter', (ev, d) => { tip.style('display', 'block').html('<div class="small" style="color:#d9b36c">' + esc(C.fmtWhen(d.e, { short: true })) + '</div><strong>' + esc(d.e.title) + '</strong><br>' + C.badge(d.e.status)); })
    .on('mousemove', ev => { const r = document.getElementById('tl-chart').getBoundingClientRect(); let x = ev.clientX - r.left + 14; if (x > r.width - 330) x -= 350; tip.style('left', x + 'px').style('top', (ev.clientY - r.top + 12) + 'px'); })
    .on('mouseleave', () => tip.style('display', 'none'));
  document.getElementById('tl-count').textContent = 'Showing ' + vis.length + ' of ' + DATA.events.length + ' events.';
}
function drawList(){
  const box = document.getElementById('tl-list'); if (box.hidden) return;
  const evs = DATA.events.filter(e => matches(e));
  box.innerHTML = evs.map(e => '<div class="row" data-ev="' + e.id + '"><div class="t">' + esc(C.fmtWhen(e, { short: true })) + '</div><div><strong>' + esc(e.title) + '</strong><div class="small">' + esc(e.description.length > 220 ? e.description.slice(0, 217) + '…' : e.description) + '</div></div><div>' + C.badge(e.status) + '</div></div>').join('') || '<p class="small">No events match the current filters.</p>';
}
function intervalChart(){
  const iv = DATA.meta.intervals, max = Math.max(...iv.map(x => x.days));
  const box = document.getElementById('interval-chart');
  box.innerHTML = '<div class="ivchart wide">' + iv.map(x => { const a = C.caseById[x.fromId], b = C.caseById[x.toId];
    return '<div class="ivrow"><span class="ivl"><a data-case="' + a.id + '">' + a.num + '. ' + esc(a.name) + '</a> → <a data-case="' + b.id + '">' + b.num + '. ' + esc(b.name) + '</a><br><span class="small">' + esc(C.fmtDate(x.fromDate)) + ' → ' + esc(C.fmtDate(x.toDate)) + '</span></span><span class="ivbar' + (a.group !== 'taskteam' || b.group !== 'taskteam' ? ' grey' : '') + '" style="width:' + Math.max(1.5, x.days / max * 60) + '%"></span><span class="ivv">' + esc(C.fmtGap(x)) + '</span></div>'; }).join('') +
    '</div><p class="small">Grey bars involve a case with an arrest or one outside the task team cases. Last-seen → found, where reported: ' + DATA.cases.filter(c => c.lastSeenToFound).map(c => esc(c.name) + ' ' + esc(C.fmtGap(c.lastSeenToFound))).join(' · ') + '. The Soweto case (20 Sept, outside Ekurhuleni) is not in this sequence.</p>';
}
let pendingZoom = null;
C.on('view', ({ view, params }) => {
  if (view !== 'timeline') return;
  init();
  requestAnimationFrame(() => { W = document.getElementById('tl-chart').clientWidth || W; x0.range([M.left, W - M.right]); focusCase = params.get('case'); zoomTo(params.get('zoom') || pendingZoom || 'all', false); pendingZoom = null; if (params.get('event')) C.openEvent(params.get('event')); });
});
C.on('params', ({ view, params }) => { if (view === 'timeline' && inited){ focusCase = params.get('case'); if (params.get('zoom')) zoomTo(params.get('zoom'), true); else draw(); if (params.get('event')) C.openEvent(params.get('event')); } });
})();
