// v1.2.117: the held map shows the player's hand-drawn UK chart.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const asset = path.join(root, 'assets/ui/uk-hand-map.webp');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok(ver.v === '1.2.117', 'version.json is 1.2.117');
ok(html.includes("const GAME_VERSION = '1.2.117';"), 'GAME_VERSION is 1.2.117');
ok(html.includes('<!-- glencraft-build: b1317-v1.2.117 -->'), 'build marker b1317-v1.2.117');
ok(html.includes('<!-- glencraft-build: b1315-v1.2.115 -->'), '1.2.115 marker stays');
const s0 = html.indexOf('{"v":"v1.2.117"'), s1 = html.indexOf('{"v":"v1.2.115"', s0);
ok(s0 > 0 && s1 > s0 && html.slice(s0, s1).includes('New hand-drawn UK map when you hold the map'), 'patch note present and before 1.2.115');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(s0, s1)), 'no food in the note');
ok(html.includes('GLX-MAP1317') && html.includes('window.__map1317'), 'map1317 patch inlined');
ok(credits.includes('## v1.2.117 New hand-drawn UK map when you hold the map'), 'CREDITS heading');
ok(fs.existsSync(asset), 'uk-hand-map.webp is in assets/ui');
ok(fs.statSync(asset).size < 300 * 1024, 'webp is under 300 KB (' + fs.statSync(asset).size + ')');
ok(html.includes("const GAME_VERSION = '1.2.115';") === false, 'GAME_VERSION const is no longer 1.2.115');
ok(html.includes('/* GLX-FIX1293') && html.includes('window.__pickMap1293'), '1.2.95 map seating stays');
ok(html.includes("version: '1.2.59-frame-torch'") || html.includes('1.2.59-frame-torch'), 'torch/pick jitter fix stays');

const OUT = process.env.MAP1317_OUT || '/workspace/qa/t1334/shots';
fs.mkdirSync(OUT, {recursive: true});
const PORT = Number(process.env.PORT || 8917);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = fs.readFileSync(file);
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e.message || e)); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const browser = await pw.chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
await page.addInitScript(() => { window.__forceSeed = 1; });
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1&qa=t1317map', {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => { try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; } catch (e) { return false; } }, null, {timeout: 180000});
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo', {timeout: 30000});
await page.click('#createGo');
await page.waitForFunction(() => { try { return started && typeof chunkObjs !== 'undefined' && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 240000});
await page.waitForTimeout(2000);

const held = await page.evaluate(() => {
  try {
    paused = false; menuOpen = false;
    try { flying = false; } catch (_) {}
    const id = (typeof IT !== 'undefined' && IT.MAP) || 410;
    inv[id] = Math.max(1, (typeof cnt === 'function' ? cnt(id) : 0) || 0);
    if (!inv[id]) inv[id] = 1;
    selId = id;
    try { if (MODE.hotbar) MODE.hotbar[0] = selId; } catch (_) {}
    try { renderHotbar(); showItemName && showItemName(); } catch (_) {}
    try { camMode = 0; } catch (_) {}
    P.pitch = -0.15;
    P.yaw = 0;
    return {id, inv: inv[id], selId};
  } catch (e) { return {err: String(e)}; }
});
ok(held.id === 410 && held.selId === 410, 'map is selected in the hotbar (' + JSON.stringify(held) + ')');

await page.waitForFunction(() => { try { return window.__map1317 && __map1317.ready && __map1317.painted; } catch (e) { return false; } }, null, {timeout: 30000});
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const U = window.__map1317, C = window.__c112;
  const plane = U.sheet && U.sheet();
  const geom = plane && plane.geometry && plane.geometry.parameters;
  let mark = null, markVis = false;
  try {
    if (plane) for (const c of plane.children || []) {
      if (c === C.inset) continue;
      if (c.isGroup) { mark = [c.position.x, c.position.y, c.position.z]; markVis = !!c.visible; break; }
    }
  } catch (_) {}
  let sample = null;
  try {
    const TX = C.TX, w = TX.width, h = TX.height, g = TX.getContext('2d');
    const px = (x, y) => { const p = g.getImageData(Math.max(0, Math.min(w - 1, x | 0)), Math.max(0, Math.min(h - 1, y | 0)), 1, 1).data; return [p[0], p[1], p[2]]; };
    // compass is ~0.832, 0.218 of the art
    sample = {
      w, h,
      compass: px(w * 0.832, h * 0.218),
      compassMirror: px(w * 0.168, h * 0.218),
      north: px(w * 0.50, h * 0.16),
      south: px(w * 0.50, h * 0.88),
      frameTL: px(w * 0.08, h * 0.03),
      sea: px(w * 0.20, h * 0.12)
    };
  } catch (e) { sample = {err: String(e)}; }
  return {
    err: U.err, ready: U.ready, painted: U.painted, tw: U.tw, th: U.th,
    aspect: U.tw ? U.th / U.tw : 0,
    planeW: geom && geom.width, planeH: geom && geom.height,
    planeAsp: geom && geom.width ? geom.height / geom.width : 0,
    planeVis: !!(plane && plane.visible),
    mark, markVis, markPx: U.markPx, sample,
    inset: !!(C && C.inset && C.inset.visible)
  };
});
ok(info.ready && info.painted && !info.err, 'artwork loaded and painted (err=' + info.err + ')');
ok(info.tw === 746 && info.th === 1024, 'TX is 746x1024 (got ' + info.tw + 'x' + info.th + ')');
ok(Math.abs(info.aspect - 1024 / 746) < 0.01, 'texture aspect is portrait (asp=' + info.aspect + ')');
ok(info.planeVis, 'held map sheet is visible');
ok(Math.abs((info.planeAsp || 0) - 1024 / 746) < 0.04, 'sheet geometry matches portrait art (asp=' + info.planeAsp + ')');
ok(!info.inset, 'old circular inset is hidden');

const S = info.sample || {};
const goldish = (c) => c && c[0] > 140 && c[1] > 90 && c[0] > c[2] + 30;
const navy = (c) => c && c[2] > c[0] + 15 && c[2] > 30 && c[0] < 120;
ok(goldish(S.compass) || goldish(S.frameTL), 'gold frame or compass is present (compass=' + S.compass + ' frameTL=' + S.frameTL + ')');
ok(goldish(S.compass) && !goldish(S.compassMirror), 'compass is on the right, not mirrored (R=' + S.compass + ' L=' + S.compassMirror + ')');
ok(navy(S.sea) || (S.sea && S.sea[2] >= S.sea[0]), 'upper sea is a dark blue (sea=' + S.sea + ')');

// Export the TX canvas and a first-person screenshot.
const txData = await page.evaluate(() => window.__c112.TX.toDataURL('image/png'));
const txBuf = Buffer.from(txData.replace(/^data:image\/png;base64,/, ''), 'base64');
fs.writeFileSync(path.join(OUT, 'held-map-tx.png'), txBuf);
await page.screenshot({path: path.join(OUT, 'fp-held-map.png')});
ok(txBuf.length > 20000, 'TX export saved (' + txBuf.length + ' bytes)');

// Third person: the card uses the same canvas.
await page.evaluate(() => { try { camMode = 1; } catch (_) {} });
await page.waitForTimeout(600);
await page.screenshot({path: path.join(OUT, 'tp-held-map.png')});
await page.evaluate(() => { try { camMode = 0; } catch (_) {} });
await page.waitForTimeout(400);
await page.screenshot({path: path.join(OUT, 'fp-held-map-2.png')});

ok(errors.filter(e => !/AbortError|play\(\)/i.test(e)).length === 0, 'no unexpected page errors (' + errors.length + ')');
console.log('INFO', JSON.stringify(info));
console.log('v1317-hand-map ok', k);
await browser.close();
server.close();
