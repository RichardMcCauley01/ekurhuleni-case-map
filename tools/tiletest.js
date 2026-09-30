// Basemap test: loads the map over file:// and http://127.0.0.1:8766 for each background style, counts tile responses
// per host, and screenshots. Also tests automatic fallback by blocking tile hosts.
// Usage: node tools/tiletest.js   (local server must be running for the http cases)
const { chromium } = require('playwright-core');
const path = require('path');
const OUT = path.join(__dirname, '..', 'screenshots');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const HTTP = 'http://127.0.0.1:8766/index.html';
const cases = [
  ['file', 'dark'], ['file', 'street'], ['file', 'satellite'], ['http', 'dark'], ['http', 'street'], ['http', 'satellite'],
  ['file', 'dark', ['server.arcgisonline.com']],                          // fallback -> mirror host
  ['http', 'dark', ['server.arcgisonline.com', 'services.arcgisonline.com']], // fallback -> OSM (http only)
  ['file', 'dark', ['server.arcgisonline.com', 'services.arcgisonline.com']], // no provider left on file:// -> blank + note
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const results = [];
  for (const [origin, style, block] of cases) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    const hosts = {}, errors = [], referers = new Set();
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    if (block) await page.route(u => block.some(h => u.hostname === h), r => r.abort('blockedbyclient'));
    page.on('requestfinished', async req => {
      const u = new URL(req.url()); if (!/tile/.test(u.pathname + u.hostname)) return;
      const res = await req.response(); const k = u.hostname + ' ' + (res ? res.status() : '?');
      hosts[k] = (hosts[k] || 0) + 1; referers.add(req.headers()['referer'] || '(none)');
    });
    const url = (origin === 'file' ? FILE : HTTP) + '?cw=0&base=' + style + '#map';
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(block ? 9000 : 6000);
    const st = await page.evaluate(() => ({ basemap: window.MAP_STATE && window.MAP_STATE.basemap, status: (document.getElementById('base-status') || {}).textContent,
      imgs: [...document.querySelectorAll('.leaflet-tile-pane img.leaflet-tile-loaded')].length,
      attribution: (document.querySelector('.leaflet-control-attribution') || {}).textContent }));
    const name = 'basemap-' + origin + '-' + style + (block ? '-fallback-' + block.length : '') + '.png';
    await page.screenshot({ path: path.join(OUT, name) });
    results.push({ origin, style, block: block || null, ...st, hosts, referers: [...referers], errors: errors.filter(e => !/ERR_BLOCKED_BY_CLIENT|Failed to load resource/.test(e)), shot: 'screenshots/' + name });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})();
