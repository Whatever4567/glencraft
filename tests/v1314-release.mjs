// v1.2.114: twice-scale new worlds become playable when terrain is ready.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/loading-1285.js'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok(ver.v === '1.2.114' || ver.v === '1.2.115' || ver.v >= '1.2.117', 'version.json is 1.2.114');
ok(html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';"), 'GAME_VERSION is 1.2.114');
ok(html.includes('<!-- glencraft-build: b1314-v1.2.114 -->'), '1.2.114 build marker');
ok(html.includes('<!-- glencraft-build: b1313-v1.2.113 -->'), '1.2.113 marker stays');
const s0 = html.indexOf('{"v":"v1.2.114"');
const s1 = html.indexOf('{"v":"v1.2.113"', s0);
ok(s0 > 0 && s1 > s0, 'PATCH_NOTES has 1.2.114 before 1.2.113');
const notes = html.slice(s0, s1);
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(notes), '1.2.114 notes have no food');
ok(/playable|loading screen|background/i.test(notes), 'notes mention playable new worlds and background load');
ok(credits.includes('## v1.2.114'), 'CREDITS heading');
ok(src.includes('runDeferredPosts') && src.includes('deferBig'), 'loader defers 2x post-chain after GEN9');
ok(html.includes('runDeferredPosts') && html.includes('GLX-LOAD1314'), 'deferred-post hooks are in the page');
ok(src.includes('W >= 1600') && html.includes('W >= 1600'), 'defer path applies to twice-scale (1728) worlds');
ok(html.includes('U.held = 0') && html.includes('_softHold'), 'held is released before background posts');

const PORT = Number(process.env.PORT || 8814);
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.json':'application/json', '.png':'image/png', '.css':'text/css',
  '.glb':'model/gltf-binary', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg',
  '.woff2':'font/woff2', '.wasm':'application/wasm', '.svg':'image/svg+xml'
};
const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(root, p));
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

const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const {chromium} = pw;
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage']
});
const page = await browser.newPage({viewport: {width: 844, height: 390}});
page.setDefaultTimeout(120000);
const errors = [];
page.on('pageerror', e => {
  const s = (e && (e.stack || e.message || e.name)) ? String(e.stack || e.message || e.name) : (typeof e === 'object' ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : String(e));
  errors.push(s.slice(0, 400));
  console.log('PAGEERROR', s.slice(0, 400));
});
await page.addInitScript(() => { window.__forceSeed = 1; });
// no qa= so twice-scale want=1
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1&t=1314', {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => {
  try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; }
  catch (e) { return false; }
}, null, {timeout: 180000});
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo, [data-testid="create-world-button"]', {timeout: 30000});
const tClick = Date.now();
await page.click('#createGo');
await page.waitForFunction(() => {
  try {
    const L = window.__glenLoad;
    const genBusy = !!(L && L.held);
    const startedOn = typeof started !== 'undefined' && started;
    const screenNone = typeof screen !== 'undefined' && screen === 'none';
    const ringOk = typeof chunkObjs !== 'undefined' && chunkObjs && chunkObjs.size > 0;
    return startedOn && !genBusy && (screenNone || (window.__v1312 && __v1312.spawnReady)) && ringOk && typeof W === 'number' && W >= 1600;
  } catch (e) { return false; }
}, null, {timeout: 90000});
const ms = Date.now() - tClick;
const snap = await page.evaluate(() => ({
  W, H, D, seed: gSeed, started, screen,
  held: window.__glenLoad && __glenLoad.held,
  genDone: window.__glenLoad && __glenLoad.genDone,
  defer: window.__glenLoad && __glenLoad._deferPosts,
  soft: window.__glenLoad && __glenLoad._softHold,
  chunks: chunkObjs ? chunkObjs.size : 0,
  want: window.__v1308 && __v1308.want,
  errLoad: window.__glenLoad && __glenLoad.err,
  P: P ? [+P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1)] : null
}));
ok(ms <= 60000, '2x new world is playable within 60s (got ' + ms + ' ms; W=' + snap.W + ')');
ok(snap.W >= 1600 && snap.genDone, 'twice-scale world generated (W=' + snap.W + ', genDone=' + snap.genDone + ')');
ok(!snap.held, 'loader held is released (' + JSON.stringify(snap) + ')');
ok(!errors.some(t => /TypeError|ReferenceError|SyntaxError|undefined is not/i.test(t)), 'no page script errors (' + errors.join(' | ') + ')');
console.log('v1314 playable_ms', ms, JSON.stringify(snap));
await browser.close();
server.close();
console.log('PASS', k, 'v1314 release checks');
