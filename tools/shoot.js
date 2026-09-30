const { chromium } = require('playwright-core');
const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8766/index.html';
const OUT = path.join(__dirname, '..', 'screenshots');
const ONLY = process.env.ONLY || '';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  const shots = [];
  async function shot(name, full){ const p = path.join(OUT, name); await page.screenshot({ path: p, fullPage: !!full }); shots.push(p); }
  const idle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms || 800);
    // wait until all visible basemap tiles have finished loading (lower-zoom placeholders get pruned), then let the fade finish
    await page.waitForFunction(() => !window.MAP_STATE || !window.MAP_STATE.mapFlying && document.querySelectorAll('.leaflet-tile-container img:not(.leaflet-tile-loaded)').length === 0, null, { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(500); };
  await page.goto(BASE + '#map', { waitUntil: 'load' }); await idle(1500);
  await shot('00-content-warning.png');
  await page.click('#cw-ok');
  // overview
  await page.click('#map-overview'); await page.waitForTimeout(2200); await idle(800);
  await shot('01-map-overview.png');
  // step to a case, then mid-fly
  await page.goto(BASE + '#map?case=nkomo'); await page.waitForTimeout(3500); await idle(600);
  await shot('02-map-case-step.png');
  await page.evaluate(() => { window.MAP_STATE.qt = window.MAP_STATE.qt + 3; window.MAP_STATE.flying = true; });
  await page.waitForFunction(() => window.MAP_STATE.mapFlying === true, null, { timeout: 5000 });
  await page.waitForTimeout(900);
  const mid = await page.evaluate(() => ({ q: window.MAP_STATE.q, qt: window.MAP_STATE.qt, mapFlying: window.MAP_STATE.mapFlying }));
  await shot('03-map-mid-fly.png');
  await page.waitForTimeout(3500); await idle(500);
  const after = await page.evaluate(() => ({ q: window.MAP_STATE.q, active: window.MAP_STATE.active, title: document.querySelector('#map-panel h3') && document.querySelector('#map-panel h3').textContent }));
  // wheel on HUD
  await page.mouse.move(800, 960); for (let i = 0; i < 4; i++){ await page.mouse.wheel(0, 120); await page.waitForTimeout(100); }
  await page.waitForTimeout(2500);
  const wheel = await page.evaluate(() => ({ q: window.MAP_STATE.q, active: window.MAP_STATE.active }));
  // precincts layer
  await page.check('input[data-layer="precincts"]'); await page.click('#map-overview'); await page.waitForTimeout(2200); await idle(600);
  await shot('04-map-precinct-murder-rates.png');
  await page.uncheck('input[data-layer="precincts"]');
  // patterns
  await page.click('#patterns-btn'); await page.waitForTimeout(400); await shot('05-map-patterns-panel.png'); await page.click('#patterns-close');
  // scenarios
  await page.click('.map-modes .btn[data-mode="single"]'); await page.waitForTimeout(2200); await idle(700);
  await shot('06-scenario-single-offender.png');
  await page.click('.map-modes .btn[data-mode="multi"]'); await page.waitForTimeout(2200); await idle(700);
  await shot('07-scenario-multi-groups.png');
  await page.evaluate(() => { const p = document.getElementById('scen-panel'); p.scrollTop = p.scrollHeight; }); await page.waitForTimeout(300);
  await shot('08-scenario-multi-timing-check.png');
  await page.click('.map-modes .btn[data-mode="cases"]'); await page.waitForTimeout(500);
  // marker click -> drawer
  await page.goto(BASE + '#map?case=moselakgomo'); await page.waitForTimeout(3000);
  await page.evaluate(() => window.CASE.openCase('moselakgomo')); await page.waitForTimeout(600); await idle(300);
  await shot('09-case-drawer.png');
  await page.keyboard.press('Escape');
  // timeline
  await page.goto(BASE + '#timeline'); await page.waitForTimeout(1500); await shot('10-timeline.png');
  await page.click('.zbtn[data-zoom="sept"]'); await page.waitForTimeout(1200); await shot('11-timeline-september.png');
  await page.evaluate(() => window.CASE.openEvent('inv-address')); await page.waitForTimeout(500); await shot('12-timeline-drawer.png'); await page.keyboard.press('Escape');
  await page.evaluate(() => document.getElementById('interval-chart').scrollIntoView()); await page.waitForTimeout(300); await shot('13-interval-chart.png');
  // cases
  await page.goto(BASE + '#cases'); await page.waitForTimeout(800); await shot('14-case-files.png');
  await page.evaluate(() => document.getElementById('case-cards').scrollIntoView()); await page.waitForTimeout(300); await shot('15-case-cards.png');
  await page.evaluate(() => document.getElementById('crime-table').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300); await shot('16-precinct-crime-table.png');
  await page.goto(BASE + '#media'); await page.waitForTimeout(600); await shot('17-media.png');
  await page.goto(BASE + '#sources'); await page.waitForTimeout(600); await shot('18-sources.png');
  await page.goto(BASE + '#about'); await page.waitForTimeout(600); await shot('19-about.png');
  await page.goto(BASE + '#text'); await page.waitForTimeout(600); await shot('20-text-version.png');
  const counts = await page.evaluate(() => ({ events: window.CASE.DATA.events.length, cases: window.CASE.DATA.cases.length, sources: window.CASE.allSources().length }));
  console.log(JSON.stringify({ shots, errors, mid, after, wheel, counts }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
