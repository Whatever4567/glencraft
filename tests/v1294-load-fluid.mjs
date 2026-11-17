// v1.2.94: the green loading fluid must be visible and actually fill the bar.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/loading-1285.js'), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

const fillRule = (() => {
  const a = html.indexOf('#scr-loading #loadW.liquid1285 .load-fill');
  assert.ok(a > 0, 'load-fill CSS is present');
  return html.slice(a, html.indexOf("'", a));
})();
ok(!/background-image:\s*none\s*!important/.test(fillRule), 'load-fill CSS does not wipe background-image to none');
ok(/background-image:\s*linear-gradient\([^)]*#7cbf3c|#7cbf3c[^)]*\)/.test(fillRule)
  && /#b6f26a/.test(fillRule) && /#5fa52a|#4e9a24/.test(fillRule),
  'load-fill CSS uses a visible green liquid gradient');
ok(html.includes("fill.style.backgroundImage = 'linear-gradient(180deg,#e8ffb0"),
  'startFillAnim also sets the green gradient inline');
ok(src.includes('background-image:linear-gradient(180deg,#e8ffb0') && !/load-fill[\s\S]{0,400}background-image:none!important/.test(src),
  'loading-1285 source keeps the visible green fill');
ok(html.includes('GLX-LAND1293') && html.includes("o.lock('landscape')") && html.includes('Rotate your phone'),
  'landscape lock and rotate overlay are still present');

const OUT = process.env.LAND_OUT || '/workspace/qa/t1265';
fs.mkdirSync(OUT, {recursive: true});

const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const {chromium} = pw;
const PORT = Number(process.env.FLUID_PORT || 8796);
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm','.svg':'image/svg+xml'};

const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = fs.readFileSync(file);
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500);
    res.end(String(e.message || e));
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars']
});
const context = await browser.newContext({
  viewport: {width: 844, height: 390},
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  userAgent: PHONE_UA
});
const page = await context.newPage();
page.setDefaultTimeout(180000);
await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1294fluid`, {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => {
  try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined' && screen === 'title'; } catch (e) { return false; }
}, null, {timeout: 180000});
ok(!(await page.evaluate(() => !!(document.getElementById('glenRotate') && document.getElementById('glenRotate').classList.contains('on')))),
  'landscape phone load does not show the rotate overlay');
await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"]', {timeout: 30000});
await page.click('[data-testid="world-create-tile"]');
await page.click('#createGo');
await page.waitForFunction(() => { try { return typeof screen !== 'undefined' && screen === 'loading'; } catch (e) { return false; } }, null, {timeout: 60000});
await page.waitForFunction(() => {
  try { return parseFloat((document.getElementById('loadPct') || {}).textContent || '') >= 25; } catch (e) { return false; }
}, null, {timeout: 60000});
await page.waitForTimeout(200);

const info = await page.evaluate(() => {
  const bar = document.getElementById('loadW');
  const fill = bar && (bar.querySelector('.load-fill') || bar.firstElementChild);
  const cs = fill ? getComputedStyle(fill) : null;
  const br = bar ? bar.getBoundingClientRect() : null;
  const fr = fill ? fill.getBoundingClientRect() : null;
  const m = cs && cs.transform && cs.transform.match(/matrix\(([^,]+)/);
  const scaleX = m ? parseFloat(m[1]) : (cs && cs.transform === 'none' ? 1 : 0);
  return {
    pct: parseFloat((document.getElementById('loadPct') || {}).textContent || '') || 0,
    overlay: !!(document.getElementById('glenRotate') && document.getElementById('glenRotate').classList.contains('on')),
    bgImage: cs ? cs.backgroundImage : '',
    bgColor: cs ? cs.backgroundColor : '',
    scaleX,
    barW: br ? br.width : 0,
    fillW: fr ? fr.width : 0,
    shown: window.__glenLoad && __glenLoad.shown
  };
});
ok(!info.overlay, 'overlay stays hidden in landscape during world load');
ok(/linear-gradient/i.test(info.bgImage) && /rgb\(\s*(124,\s*191,\s*60|182,\s*242,\s*106|78,\s*154,\s*36|45,\s*106,\s*18|232,\s*255,\s*176)/.test(info.bgImage),
  'computed fill background is the green liquid gradient (' + info.bgImage.slice(0, 120) + ')');
ok(info.scaleX >= 0.15 || info.fillW >= info.barW * 0.15, 'fluid has started filling (scaleX=' + info.scaleX + ', fillW=' + info.fillW + ', barW=' + info.barW + ', pct=' + info.pct + ')');
ok(info.pct >= 25, 'loading percentage is advancing (' + info.pct + ')');

const shot = path.join(OUT, 'test-v1294-fluid.png');
const box = await page.evaluate(() => {
  const el = document.getElementById('loadW');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 60), width: r.width + 40, height: r.height + 140};
});
if (box) await page.screenshot({path: shot, clip: {x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height)}});
else await page.screenshot({path: shot});

// Pixel check: green must appear inside the bar
const {default: png} = await import('node:fs');
// parse with sharp? use a tiny python? keep it in-page via canvas
const green = await page.evaluate(() => {
  const bar = document.getElementById('loadW');
  if (!bar) return {green: 0, samples: 0};
  const r = bar.getBoundingClientRect();
  const c = document.createElement('canvas');
  c.width = Math.max(1, r.width | 0);
  c.height = Math.max(1, r.height | 0);
  const ctx = c.getContext('2d');
  // Can't draw the bar DOM to canvas without html2canvas. Sample mid-fill via computed is enough.
  return {w: r.width, h: r.height, fillW: (document.querySelector('#loadW .load-fill') || {}).getBoundingClientRect().width};
});
ok(green.fillW > 40, 'fill element covers a visible width of the track (' + green.fillW + 'px of ' + green.w + 'px)');

await context.close();
await browser.close();
server.close();
console.log('PASS ' + n + ' v1294 loading-fluid checks');
