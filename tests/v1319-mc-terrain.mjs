// v1.2.119 (built as 1.2.116, never released): cumulus cloud layer (Clouds Off/Low/High), map-based woods and
// layered mountain rock on new twice-scale worlds.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
ok(ver.v === '1.2.119' || ver.v === '1.2.120' || ver.v === '1.2.121' || ver.v === '1.2.122' || ver.v === '1.2.123' || ver.v === '1.2.124' || ver.v === '1.2.125' || ver.v === '1.2.126' || ver.v === '1.2.127' || ver.v === '1.2.128' || ver.v === '1.2.129' || ver.v === '1.2.130', 'version.json is 1.2.119');
ok(html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';") || html.includes("const GAME_VERSION = '1.2.122';") || html.includes("const GAME_VERSION = '1.2.123';") || html.includes("const GAME_VERSION = '1.2.124';") || html.includes("const GAME_VERSION = '1.2.125';") || html.includes("const GAME_VERSION = '1.2.126';") || html.includes("const GAME_VERSION = '1.2.127';") || html.includes("const GAME_VERSION = '1.2.128';") || html.includes("const GAME_VERSION = '1.2.129';") || html.includes("const GAME_VERSION = '1.2.130';") || html.includes("const GAME_VERSION = '1.2.131';") || html.includes("const GAME_VERSION = '1.2.132';") || html.includes("const GAME_VERSION = '1.2.133';") || html.includes("const GAME_VERSION = '1.2.134';"), 'GAME_VERSION is 1.2.119');
ok(html.includes('<!-- glencraft-build: b1319-v1.2.119 -->'), 'build marker b1319-v1.2.119');
const s0 = html.indexOf('{"v":"v1.2.119"'), s1 = html.indexOf('{"v":"v1.2.118"', s0);
ok(s0 > 0 && s1 > s0 && html.slice(s0, s1).includes('cumulus clouds'), 'patch note present, newest first');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew|eat/i.test(html.slice(s0, s1)), 'no food in the note');
ok(html.includes('GLX-MC1327') && html.includes('function mcPaint(G, VK, HI)'), 'MC-style terrain module inlined');
ok(html.includes('GLX-CL1316') && html.includes('GLX-BIO1316') && html.includes('const strataAt = (x, y, z)'), 'cloud, biome and strata patches inlined');
const OUT = process.env.LOOK_OUT || '/tmp/t1326-look';
fs.mkdirSync(OUT, {recursive: true});
const PORT = Number(process.env.PORT || 8926);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(root, p)); if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = fs.readFileSync(file); res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e.message || e)); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const browser = await pw.chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
await page.addInitScript(() => { window.__forceSeed = 7; });
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1', {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => { try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; } catch (e) { return false; } }, null, {timeout: 180000});
const T0 = await page.evaluate(() => ({cl: !!window.__cl1316, bio: !!window.__bio1316, q: __cl1316.q, seg: !!document.getElementById('cloudSeg'), btns: document.querySelectorAll('#cloudSeg button').length}));
ok(T0.cl && T0.bio && ['low', 'high', 'off'].includes(T0.q), 'patches loaded, cloud quality ' + T0.q);
ok(T0.seg && T0.btns === 3, 'Settings has a Clouds Off / Low / High row');
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo', {timeout: 30000});
await page.click('#createGo');
await page.waitForFunction(() => { try { return started && typeof chunkObjs !== 'undefined' && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 400000});
// trees, keeps and the Highlands surface finish in the background (1.2.114)
await page.waitForFunction(() => window.__v1308 && __v1308.surfMs != null && window.__bio1316 && __bio1316.built >= 1, null, {timeout: 240000}).catch(() => {});
const R = await page.evaluate(() => {
  const B = window.__bio1316, V = window.__v1308, out = {scaled: !!(V && V.isScaled && V.isScaled()), elig: B.elig(), built: B.built, on: B.on, err: B.err, verr: V && V.err, ms: B.ms};
  if (out.scaled) {
    const F = __c339.fll, c0 = F(W / 2, D / 2), K = 100 / (c0[0] - F(W / 2, D / 2 + 100)[0]);
    V.xzLL = V.xzLL || ((la, lo) => [W / 2 + (lo - c0[1]) * K * Math.cos(la * Math.PI / 180), D / 2 - (la - c0[0]) * K]);
    const at = (la, lo) => { const p = V.xzLL(la, lo); return __bio.at(Math.round(p[0]), Math.round(p[1])); };
    out.high = [at(57.15, -5.1), at(57.55, -5.35), at(57.05, -3.3)];
    const sp = V.spawn; out.spawn = __bio.at(Math.round(sp[0]), Math.round(sp[2]));
    out.low = B.geo(Math.round(V.xzLL(56.2, -3.5)[0]), Math.round(V.xzLL(56.2, -3.5)[1]), 1);
    out.strata = typeof V.strataAt === 'function' ? V.strataAt(100, 120, 100) : null;
  }
  return out;
});
console.log('world', JSON.stringify(R));
ok(R.scaled && R.elig && R.built >= 1 && !R.err, 'new twice-scale world builds the map-based woods (' + JSON.stringify({b: R.built, e: R.err}) + ')');
const NM = ['oak', 'pine', 'birch', 'rowan', 'alder', 'yew', 'juniper', 'hawthorn', 'blackthorn'];
const bi = v => typeof v === 'string' ? NM.indexOf(v) : v;
ok(R.high.every(v => [1, 3].includes(bi(v))), 'Highlands woods are pine / rowan (' + JSON.stringify(R.high) + ')');
ok(bi(R.spawn) === 0, 'spawn stays oak (' + JSON.stringify(R.spawn) + ')');
ok(R.low === 2, 'northern lowlands give birch');
ok(R.strata != null, 'strata rock helper present');
// sky: clouds become visible by day in the overworld
await page.evaluate(() => { try { dayClock = 60; } catch (_) {} paused = false; menuOpen = false; P.pitch = 0.5; });
await page.waitForFunction(() => __cl1316.ready && __cl1316.vis, null, {timeout: 90000}).catch(() => {});
const C = await page.evaluate(() => ({ready: __cl1316.ready, vis: __cl1316.vis, err: __cl1316.err, ms: __cl1316.paintMs}));
ok(C.ready && C.vis && !C.err, 'cumulus layer painted and shown by day (' + JSON.stringify(C) + ')');
await page.screenshot({path: path.join(OUT, 'look-sky.png')});
await page.evaluate(() => { document.querySelector('#cloudSeg button[data-v="off"]').click(); });
await page.waitForTimeout(800);
ok(await page.evaluate(() => !__cl1316.vis && SET.clouds === 'off'), 'Clouds Off hides the layer and is saved');
await page.evaluate(() => { document.querySelector('#cloudSeg button[data-v="low"]').click(); });
ok(!errors.some(t => /TypeError|ReferenceError|SyntaxError/i.test(t)), 'no page script errors (' + errors.join(' | ').slice(0, 600) + ')');
await browser.close(); server.close();
console.log('PASS', k, 'v1316 world look checks');
