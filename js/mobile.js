/* Responsive helpers shared by both case sites (phones / touch). Desktop behaviour is unchanged.
   - neutral bar: "More / Less" toggle (the text is clamped to two lines on phones)
   - tab bar: keeps the active tab scrolled into view
   - bottom sheets (.sheet): drag handle + tap to expand/collapse
   - HUD height -> CSS var --hud-h so sheets sit above the step controls
   - fit [data-fit] scenes to the visible viewport on phones
   - timeline: "Filters" toggle
   - map (Ekurhuleni): Layers toggle, Patterns shortcut, play button in the HUD */
(function(){
  'use strict';
  const mq = window.matchMedia('(max-width: 760px)');
  const isPhone = () => mq.matches;
  window.MOBILE = { isPhone };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  function mk(tag, attrs, text){ const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (text != null) e.textContent = text; return e; }

  // neutral bar
  const nb = $('.neutral-bar');
  if (nb){
    const b = mk('button', { type: 'button', class: 'nb-toggle', 'aria-expanded': 'false', 'aria-label': 'Show the full note' }, 'More');
    b.addEventListener('click', () => { const o = nb.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Less' : 'More'; });
    nb.appendChild(b);
  }

  // active tab into view
  const tabIntoView = () => { if (!isPhone()) return; const a = $('.tabs a.active'); const bar = $('.tabs'); if (a && bar) bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' }); };
  window.addEventListener('hashchange', () => setTimeout(tabIntoView, 60));
  setTimeout(tabIntoView, 400);

  // bottom sheets
  $$('.sheet').forEach(sh => {
    const panel = sh.querySelector('aside');
    const h = mk('button', { type: 'button', class: 'sheet-handle', 'aria-expanded': 'false', 'aria-controls': panel ? panel.id : '' });
    const lab = mk('span', {}, 'Show details'); h.appendChild(lab);
    sh.insertBefore(h, sh.firstChild);
    const set = open => { sh.classList.toggle('expanded', open); h.setAttribute('aria-expanded', String(open)); lab.textContent = open ? 'Hide details' : 'Show details'; if (!open && panel) panel.scrollTop = 0; };
    h.addEventListener('click', () => set(!sh.classList.contains('expanded')));
    // swipe on the handle: up = expand, down = collapse
    let y0 = null;
    h.addEventListener('pointerdown', ev => { y0 = ev.clientY; });
    h.addEventListener('pointerup', ev => { if (y0 == null) return; const dy = ev.clientY - y0; y0 = null; if (Math.abs(dy) > 24){ set(dy < 0); ev.preventDefault(); h.dataset.swiped = '1'; setTimeout(() => delete h.dataset.swiped, 50); } });
    h.addEventListener('click', ev => { if (h.dataset.swiped){ ev.stopImmediatePropagation(); } }, true);
    // tap on the collapsed panel expands it (links and buttons still work)
    if (panel) panel.addEventListener('click', ev => { if (isPhone() && !sh.classList.contains('expanded') && !ev.target.closest('a,button,input,select,label')) set(true); });
    sh._setSheet = set;
  });

  // HUD height -> --hud-h on its wrapper
  $$('.scene-hud,.map-hud').forEach(hud => {
    const upd = () => { const wrap = hud.parentElement; if (wrap) wrap.style.setProperty('--hud-h', (hud.offsetHeight || 84) + 'px'); };
    if (window.ResizeObserver) new ResizeObserver(upd).observe(hud); upd();
  });

  // fit [data-fit] (Clancy scene) to the visible viewport on phones and tablets
  const mqFit = window.matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');   // phones + tablets
  const fit = () => $$('[data-fit]').forEach(el => {
    if (!mqFit.matches){ el.style.height = ''; return; }
    if (!el.offsetParent) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    el.style.height = Math.max(isPhone() ? 440 : 520, Math.round(vh - top)) + 'px';
  });
  window.addEventListener('resize', fit); window.addEventListener('hashchange', () => setTimeout(fit, 30));
  [mq, mqFit].forEach(m => m.addEventListener ? m.addEventListener('change', fit) : m.addListener(fit));
  setTimeout(fit, 0); setTimeout(fit, 400); window.addEventListener('load', () => setTimeout(fit, 50));
  // re-fit when the header or neutral bar changes height (e.g. "More" toggle, font load) and when a view is shown
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => fit()); [$('.site-header'), $('.neutral-bar')].forEach(el => el && ro.observe(el)); }
  $$('.view').forEach(v => new MutationObserver(() => { if (v.classList.contains('active')) setTimeout(fit, 0); }).observe(v, { attributes: true, attributeFilter: ['class'] }));
  window.MOBILE.fit = fit;

  // timeline filters toggle
  const filt = $('.tl-filters'), tb = $('.tl-toolbar .grp:last-child');
  if (filt && tb){
    const b = mk('button', { type: 'button', class: 'btn filters-toggle', 'aria-expanded': 'false', 'aria-controls': 'tl-filters' }, 'Filters');
    if (!filt.id) filt.id = 'tl-filters';
    b.addEventListener('click', () => { const o = filt.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); b.classList.toggle('active', o); });
    tb.appendChild(b);
  }

  // Ekurhuleni map: layers toggle, patterns shortcut, play in HUD
  const mw = $('#map-wrap'), layers = $('.map-layers');
  if (mw && layers){
    const lt = mk('button', { type: 'button', class: 'btn layers-toggle', 'aria-expanded': 'false', 'aria-label': 'Map layers and options' }, 'Layers');
    const setL = o => { mw.classList.toggle('layers-open', o); lt.setAttribute('aria-expanded', String(o)); lt.textContent = o ? 'Close' : 'Layers'; };
    lt.addEventListener('click', () => setL(!mw.classList.contains('layers-open')));
    mw.appendChild(lt);
    // close the layers sheet after choosing a whole-map action
    const narrow = window.matchMedia('(max-width: 900px)');
    ['map-overview', 'map-play'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', () => { if (narrow.matches) setL(false); }); });
    const pb = document.getElementById('patterns-btn');
    if (pb){ const b2 = mk('button', { type: 'button', class: 'btn m-only' }, 'Patterns & differences'); b2.addEventListener('click', () => { setL(false); pb.click(); }); layers.appendChild(b2); }
    const play = document.getElementById('map-play'), next = document.getElementById('mp-next');
    if (play && next){
      const p2 = mk('button', { type: 'button', class: 'btn m-only', id: 'mp-play', 'aria-label': 'Play through cases' }, '▶▶');
      p2.addEventListener('click', () => play.click());
      const sync = () => { const playing = /stop|pause|■|❚/i.test(play.textContent); p2.textContent = playing ? '❚❚' : '▶▶'; p2.setAttribute('aria-label', playing ? 'Stop playing' : 'Play through cases'); };
      new MutationObserver(sync).observe(play, { childList: true, characterData: true, subtree: true });
      next.parentElement.insertBefore(p2, next); sync();
    }
  }
})();
