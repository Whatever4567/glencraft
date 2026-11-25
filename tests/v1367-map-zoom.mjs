// t1367: the full-screen map zooms and pans smoothly (GPU-composited layer, input resolved once per frame,
// 3D world paused behind it) and shows engraved castle drawings at every castle's real position.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

const asset = path.join(root, 'assets/ui/uk-hand-map-hd.webp');

ok(html.includes('GLX-MAP1367') && html.includes('__noMap1367'), 'GLX-MAP1367 fast view is inlined behind the __noMap1367 flag');
ok(html.includes('function draw(') && html.includes('marksImg'), 'the 1.2.123 canvas view and castle sprites are kept for the flag');
ok(html.includes("data-testid': 'full-map-castle'") && html.includes('Black Castle'), 'castle drawings are named on the map');
const OUT = process.env.MAP1367_OUT || '/workspace/qa/t1367/test-shots';
fs.mkdirSync(OUT, {recursive: true});
const PORT = Number(process.env.PORT || 8967);
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
const ctx = await browser.newContext({viewport: {width: 915, height: 412}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
const page = await ctx.newPage();
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
await page.addInitScript(() => { window.__forceSeed = 1; });
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1&qa=t1367map', {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => { try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; } catch (e) { return false; } }, null, {timeout: 180000});
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo', {timeout: 30000});
await page.click('#createGo');
await page.waitForFunction(() => { try { return started && typeof chunkObjs !== 'undefined' && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 240000});
await page.waitForTimeout(2000);


await page.evaluate(() => { paused = false; menuOpen = false; try { flying = false; } catch (_) {} const id = (typeof IT !== 'undefined' && IT.MAP) || 410;
  inv[id] = Math.max(1, inv[id] || 0); selId = id; try { MODE.hotbar[0] = id; renderHotbar(); } catch (_) {} try { camMode = 0; } catch (_) {} P.pitch = -0.15; });
await page.waitForFunction(() => { try { return __map1317.ready && __map1357.hdReady && __map1357.debug().owns; } catch (e) { return false; } }, null, {timeout: 30000});
await page.waitForTimeout(1500);
const held = await page.evaluate(() => ({c: __map1357.castles, g: __gb6.castles()}));
ok(held.c && held.g && held.c.length === held.g.length && held.c.length >= 4, 'held sheet carries one castle drawing per game castle (' + (held.c && held.c.length) + ' of ' + (held.g && held.g.length) + ')');
ok(held.c.some(p => p[0] === 'black'), 'the Black Castle is on the map');
await page.screenshot({path: path.join(OUT, 'held.png')});

await page.evaluate(() => __map1357.openMap()); await page.waitForTimeout(900);
const s0 = await page.evaluate(() => { const L = document.querySelector('[data-testid=full-map-layer]'), r = L && L.getBoundingClientRect();
  const marks = [...document.querySelectorAll('[data-testid=full-map-castle]')].map(e => { const m = /translate3d\(([-\d.]+)px, ?([-\d.]+)px/.exec(e.style.transform); return [e.dataset.kind, +m[1], +m[2]]; });
  const want = __gb6.castles().map(([k, x, z]) => { const q = __map1317.worldToCanvas(x, z); return [k, r.left + q[0] / 746 * r.width, r.top + q[1] / 746 * r.width]; });
  return {L: !!L, tf: L && L.style.transform, wc: L && getComputedStyle(L).willChange, marks, want, sk: __map1357.fast.skipped, opaque: getComputedStyle(document.getElementById('map1357')).backgroundImage}; });
ok(s0.L && /translate3d\(.*scale\(/.test(s0.tf) && s0.wc === 'transform', 'map is one GPU layer moved by a CSS transform (' + s0.tf + ')');
{ let worst = 0; for (const [k, x, y] of s0.want) { const m = s0.marks.find(q => q[0] === k); worst = Math.max(worst, m ? Math.hypot(m[1] - x, m[2] - y) : 999); }
  ok(s0.marks.length === s0.want.length && worst < 1.5, 'every castle drawing sits on its game position (' + s0.marks.length + ' drawings, worst ' + worst.toFixed(2) + ' px)'); }
const sk1 = await page.evaluate(async () => { const a = __map1357.fast.skipped; await new Promise(r => setTimeout(r, 1000)); return __map1357.fast.skipped - a; });
ok(sk1 >= 20, 'the 3D world is not drawn under the open map (' + sk1 + ' renders skipped in 1 s)');
await page.screenshot({path: path.join(OUT, 'full.png')});

// buttons glide: an in-between zoom one frame later, the target shortly after
const g = await page.evaluate(async () => { document.querySelector('[data-testid=full-map-zoom-in]').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); document.querySelector('[data-testid=full-map-zoom-in]').click();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const mid = __map1357.zoom; await new Promise(r => setTimeout(r, 600)); return {mid, end: __map1357.zoom, tgt: __map1357.fast.tgt.z}; });
ok(g.end > 1.4 && g.mid < g.end && Math.abs(g.end - g.tgt) < 0.02, 'zoom button glides to its target (' + JSON.stringify(g) + ')');

// pinch with real touch events: zooms about the fingers, frames stay smooth
const cdp = await ctx.newCDPSession(page);
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: pts.map((p, i) => ({x: p[0], y: p[1], id: i + 1}))});
await page.evaluate(() => { window.__f67 = []; let l = performance.now(); (function f(t) { window.__f67.push(t - l); l = t; if (window.__f67.length < 400) requestAnimationFrame(f); })(l); });
const z0 = await page.evaluate(() => __map1357.zoom);
await touch('touchStart', [[420, 200], [500, 210]]);
for (let i = 1; i <= 30; i++) { await touch('touchMove', [[420 - i * 5, 200 - i], [500 + i * 5, 210 + i]]); await page.waitForTimeout(16); }
await touch('touchEnd', []); await page.waitForTimeout(300);
const p1 = await page.evaluate(() => { const d = window.__f67.slice(2).sort((a, b) => a - b); return {z: __map1357.zoom, n: d.length, p95: d[Math.floor(d.length * 0.95)]}; });
ok(p1.z > z0 * 1.8, 'two-finger pinch zooms in (' + z0 + ' -> ' + p1.z + ')');
ok(p1.p95 < 50, 'frames stay smooth while pinching (p95 ' + (p1.p95 || 0).toFixed(1) + ' ms)');
// drag pans 1:1
const d0 = await page.evaluate(() => ({...__map1357.fast.cur}));
await touch('touchStart', [[450, 200]]); for (let i = 1; i <= 10; i++) { await touch('touchMove', [[450 - i * 10, 200]]); await page.waitForTimeout(16); } await touch('touchEnd', []); await page.waitForTimeout(200);
const d1 = await page.evaluate(() => ({...__map1357.fast.cur}));
ok(d1.cx > d0.cx, 'one-finger drag pans the map (' + d0.cx.toFixed(3) + ' -> ' + d1.cx.toFixed(3) + ')');
// controller stick pans
const pad = await page.evaluate(async () => { const F = __map1357.fast, a = F.cur.cy; F.ax = 0; F.ay = 1; F.kick(); await new Promise(r => setTimeout(r, 400)); F.ay = 0; return [a, F.cur.cy]; });
ok(pad[1] > pad[0], 'controller stick pans the map (' + pad.map(v => v.toFixed(3)).join(' -> ') + ')');
await page.screenshot({path: path.join(OUT, 'zoomed.png')});
// close: the world draws again
await page.evaluate(() => __map1357.closeMap()); await page.waitForTimeout(300);
const sk2 = await page.evaluate(async () => { const a = __map1357.fast.skipped; await new Promise(r => setTimeout(r, 600)); return {d: __map1357.fast.skipped - a, open: __map1357.open, menuOpen}; });
ok(sk2.d === 0 && sk2.open === 0 && sk2.menuOpen === false, 'closing the map brings the world back (' + JSON.stringify(sk2) + ')');
// flag: the 1.2.123 canvas view comes back
const fb = await page.evaluate(async () => { window.__noMap1367 = 1; const d0 = __map1357.drawn; __map1357.openMap(); await new Promise(r => setTimeout(r, 500)); const L = document.querySelector('[data-testid=full-map-layer]');
  const r = {drew: __map1357.drawn - d0, layer: L ? getComputedStyle(L).display : 'none', sk: __map1357.fast.skipped}; await new Promise(r2 => setTimeout(r2, 300)); r.sk2 = __map1357.fast.skipped; __map1357.closeMap(); window.__noMap1367 = 0; return r; });
ok(fb.drew > 0 && fb.layer === 'none' && fb.sk === fb.sk2, '__noMap1367 restores the 1.2.123 view (' + JSON.stringify(fb) + ')');
ok(errors.filter(e => !/AbortError|play\(\)/i.test(e)).length === 0, 'no unexpected page errors (' + errors.length + ')');
console.log('v1367-map-zoom ok', k);
await browser.close();
server.close();
