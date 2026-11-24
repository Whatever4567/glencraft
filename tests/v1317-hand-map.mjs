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

ok(ver.v >= '1.2.117', 'version.json is 1.2.117');
ok(html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';") || html.includes("const GAME_VERSION = '1.2.122';") || html.includes("const GAME_VERSION = '1.2.123';") || html.includes("const GAME_VERSION = '1.2.124';") || html.includes("const GAME_VERSION = '1.2.125';") || html.includes("const GAME_VERSION = '1.2.126';") || html.includes("const GAME_VERSION = '1.2.127';") || html.includes("const GAME_VERSION = '1.2.128';"), 'GAME_VERSION is 1.2.117');
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
// t1352: the held map projects through a coastline-fitted thin-plate spline (GLX-MAPWARP), for the arrow and castle marks alike
const warp = await page.evaluate(() => {
  const U = window.__map1317, MW = window.__mapWarp, c = window.__c339;
  if (!MW || !c || typeof U.worldToCanvas !== 'function') return {missing: !MW ? 'warp' : !c ? 'c339' : 'w2c'};
  const sx = (U.tw || 746) / 746;
  const at = (lat, lon) => { const x = (W >> 1) + (lon - c.LON0) * c.K * Math.cos(lat * Math.PI / 180), z = (D >> 1) + (c.LAT0 - lat) * c.K; const q = U.worldToCanvas(x, z); return q && [q[0] / sx, q[1] / sx]; };
  const pts = {Duncansby: [58.645, -3.025, 398, 180], Kintyre: [55.31, -5.803, 220, 462], Malin: [55.381, -7.373, 145, 462], Dublin: [53.35, -6.2, 226, 620],
    Carmel: [53.405, -4.565, 258, 623], LandsEnd: [50.066, -5.716, 155, 942], Lowestoft: [52.481, 1.758, 677, 720], Flamborough: [54.116, -0.08, 588, 610]};
  const res = {}; for (const k in pts) { const q = at(pts[k][0], pts[k][1]); res[k] = q ? +Math.hypot(q[0] - pts[k][2], q[1] - pts[k][3]).toFixed(1) : -1; }
  const ireland = at(53.42, -7.94), wales = at(52.4, -3.6), midlands = at(52.95, -1.15);
  let marks = null; try { const G = window.__gb6; if (G && G.markNow) marks = G.markNow(); } catch (_) {}
  return {on: !!MW.on, res, ireland, wales, midlands, marks};
});
ok(warp.on && !warp.missing, 'held-map warp is on (' + (warp.missing || 'GLX-MAPWARP') + ')');
ok(Object.values(warp.res).every(r => r >= 0 && r <= 8), 'coast control points land on the painted coast within 8 px (' + JSON.stringify(warp.res) + ')');
ok(warp.ireland && warp.wales && warp.ireland[0] < warp.wales[0] - 90, 'Ireland is drawn well west of Wales (IE=' + JSON.stringify(warp.ireland) + ' WA=' + JSON.stringify(warp.wales) + ')');
ok(warp.midlands && warp.midlands[0] > warp.wales[0] + 40 && warp.midlands[0] < 640, 'Midlands sit between Wales and the east coast (' + JSON.stringify(warp.midlands) + ')');
if (warp.marks && warp.marks.length) {
  const sx = (info.tw || 746) / 746, m = Object.fromEntries(warp.marks.map(p => [p[0], [p[1] / sx, p[2] / sx]]));
  if (m.clanIre) ok(m.clanIre[0] < 215, 'Ireland clan keep mark is in Ireland, not Wales (' + JSON.stringify(m.clanIre) + ')');
  if (m.black) ok(m.black[0] > 330 && m.black[1] > 600 && m.black[1] < 760, 'black castle mark is in the Midlands (' + JSON.stringify(m.black) + ')');
  if (m.mossy) ok(m.mossy[1] < 300, 'skeleton castle mark is in the Highlands (' + JSON.stringify(m.mossy) + ')');
}

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
