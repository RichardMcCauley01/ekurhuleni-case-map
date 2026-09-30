// Renders og-image.png (1200x630): map overview with side panels hidden. Needs the local server on 8766.
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('http://127.0.0.1:8766/?cw=0', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.map-layers,#map-panel,.map-hud,.map-offline,.patterns-btn,.map-banner,.map-modes,.leaflet-control-zoom{display:none!important} #map-wrap{height:630px!important}' });
  await p.evaluate(() => window.dispatchEvent(new Event('resize')));
  await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById('map-overview').click());
  await p.evaluate(() => { const d = document.createElement('div');
    d.style.cssText = 'position:absolute;right:24px;bottom:44px;z-index:2000;background:rgba(14,17,22,.88);border:1px solid #333a45;border-radius:8px;padding:14px 18px;max-width:430px;color:#e6e6e6;font-family:inherit';
    d.innerHTML = '<div style="font-size:12px;letter-spacing:.12em;color:#d9a441;text-transform:uppercase">Case map · City of Ekurhuleni, Gauteng</div><div style="font-family:Georgia,serif;font-size:26px;margin:4px 0 6px">Ekurhuleni killings of women, 2026</div><div style="font-size:14px;color:#c9c9c9">Where bodies were found, July–Sept 2026 (approximate, as reported). Police have <b>not</b> confirmed a serial killer; arrests in three cases. Every item source-cited.</div>';
    document.getElementById('map-wrap').appendChild(d); });
  await p.waitForTimeout(3500);
  const bb = await p.locator('#map-wrap').boundingBox(); console.log(bb);
  await p.evaluate(y => window.scrollTo(0, y), bb.y);
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'og-image.png' });
  await b.close();
})();
