const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const errors = []; let tiles = 0, tileBytes = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', async r => { if (/arcgisonline\.com\/.*\/tile\/|tile\.openstreetmap/.test(r.url())){ tiles++; if (tileBytes.length < 5) tileBytes.push(r.status() + ':' + ((await r.body().catch(() => Buffer.alloc(0))).length)); } });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?cw=0#' + (process.argv[2] || 'map');
  await page.goto(url); await page.waitForTimeout(4000);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'zz-file-' + (process.argv[2] || 'map').replace(/\W/g, '_') + '.png') });
  for (const v of ['timeline', 'cases', 'media', 'sources', 'about', 'text']){ await page.evaluate(v => location.hash = v, v); await page.waitForTimeout(500); }
  await page.evaluate(() => location.hash = 'map?mode=single'); await page.waitForTimeout(1500);
  await page.evaluate(() => window.SCEN.set('multi')); await page.waitForTimeout(1500);
  console.log(JSON.stringify({ errors, tiles, tileBytes }));
  await browser.close();
})();
