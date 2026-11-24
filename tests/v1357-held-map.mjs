// t1357: the held map is big, flat and sharp, and opens a full-screen map view.
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
ok(html.includes('id="glx-map1357"') && html.includes('window.__map1357'), 'GLX-MAP1357 patch inlined');
ok(html.includes('GLX-MAP1317') && html.includes('/* GLX-FIX1293'), 'older map patches are kept (hidden behind the flag, not deleted)');
ok(html.includes("O.lookAt(0, 0, 0);") && html.includes("O.rotateX(tilt);"), 'old seat code stays behind __noMap1357');
ok(fs.existsSync(asset) && fs.statSync(asset).size < 350 * 1024, 'sharp chart asset present and under 350 KB');
ok(html.includes('1.2.59-frame-torch'), 'torch/pick jitter fix stays');
{ const n0 = html.indexOf('{"v":"v1.2.123"'), n1 = html.indexOf('{"v":"v1.2.122"', n0); const note = n0 > 0 && n1 > n0 ? html.slice(n0, n1) : '';
  ok(note.includes('Full-screen map') && note.includes('held map'), '1.2.123 patch note covers the held map and the full-screen map');
  ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(note), 'no food in the 1.2.123 note'); }

const OUT = process.env.MAP1357_OUT || '/workspace/qa/t1357/test-shots';
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
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1&qa=t1357map', {waitUntil: 'domcontentloaded', timeout: 180000});
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
  inv[id] = Math.max(1, inv[id] || 0); selId = id; try { MODE.hotbar[0] = id; renderHotbar(); } catch (_) {} try { camMode = 0; } catch (_) {} P.pitch = -0.15; P.yaw = 0; });
await page.waitForFunction(() => { try { return __map1317.ready && __map1357.hdReady && __map1357.debug().owns; } catch (e) { return false; } }, null, {timeout: 30000});
await page.waitForTimeout(1200);
const st = await page.evaluate(() => {
  const plane = __map1317.sheet(), m = __pickMap1293.measure(), d = __map1357.debug(), tex = plane.material.map;
  // projected sheet rectangle on screen (fraction of the viewport)
  let vc = camera; try { const R = __fpa.rig(); if (R && R.parent && R.parent.isCamera) vc = R.parent; } catch (_) {}   // the hands' camera draws the sheet
  plane.updateWorldMatrix(true, false);
  const p = plane.geometry.parameters, c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const v = new THREE.Vector3(a * p.width / 2, b * p.height / 2, 0).applyMatrix4(plane.matrixWorld).project(vc); return [v.x, v.y]; });
  const xs = c.map(q => q[0]), ys = c.map(q => q[1]);
  return {m, d, texW: tex && tex.image && tex.image.width, mip: !!(tex && tex.generateMipmaps), aniso: tex && tex.anisotropy, gl2: renderer.capabilities.isWebGL2,
    h: (Math.max(...ys) - Math.min(...ys)) / 2, w: (Math.max(...xs) - Math.min(...xs)) / 2, top: Math.max(...ys), bot: Math.min(...ys), skew: Math.abs((c[1][0] - c[0][0]) - (c[2][0] - c[3][0])), txW: __c112.TX.width};
});
console.log('STATE', JSON.stringify(st));
ok(!st.d.err && !st.m.err, 'no patch errors (' + st.d.err + ' / ' + st.m.err + ')');
ok(st.h >= 0.62, 'held sheet fills at least 62% of the screen height (1.2.122: about 40%) (' + st.h.toFixed(3) + ')');
ok(st.top <= 0.98 && st.bot >= -0.98, 'whole sheet stays on screen (top ' + st.top.toFixed(3) + ', bottom ' + st.bot.toFixed(3) + ')');
ok(st.m.faceDot > 0.99, 'sheet faces the camera square-on (faceDot ' + st.m.faceDot + ')');
ok(st.skew < 0.02, 'no perspective skew (' + st.skew.toFixed(4) + ')');
ok(st.texW >= 1200, 'sheet wears the sharp 1200 px chart (' + st.texW + ')');
ok(!st.gl2 || (st.mip && st.aniso >= 1), 'mipmaps + anisotropy on WebGL2 (mip ' + st.mip + ', aniso ' + st.aniso + ')');
ok(st.txW === 746, 'third-person TX canvas still 746 wide (' + st.txW + ')');
const up0 = st.d.uploads; await page.waitForTimeout(1500);
const up1 = await page.evaluate(() => __map1357.uploads);
ok(up1 - up0 <= 1, 'sheet texture is not re-uploaded every frame (' + up0 + ' -> ' + up1 + ')');
await page.screenshot({path: path.join(OUT, 'held.png')});

// open: LT / USE with the map
const o1 = await page.evaluate(() => { P.pitch = 1.2; useItem(); return {open: __map1357.open, menuOpen, vis: getComputedStyle(document.getElementById('map1357')).display}; });
ok(o1.open === 1 && o1.menuOpen === true && o1.vis !== 'none', 'USE with the map opens the full-screen map (' + JSON.stringify(o1) + ')');
await page.waitForTimeout(700);
const o2 = await page.evaluate(() => ({drawn: __map1357.drawn, me: __map1357.mePx, cw: document.querySelector('#map1357 canvas').width, paused, menuOpen}));
ok(o2.drawn > 0 && o2.me && o2.cw > 0, 'full map drawn with the player arrow (' + JSON.stringify(o2) + ')');
await page.screenshot({path: path.join(OUT, 'full.png')});
await page.click('[data-testid="full-map-zoom-in"]');
await page.waitForTimeout(300);
const z = await page.evaluate(() => __map1357.zoom);
ok(z > 1.4, 'zoom-in button zooms (' + z + ')');
// keyboard: movement keys do not walk while the map is open; Esc closes without pausing
const px0 = await page.evaluate(() => P.x);
await page.keyboard.down('KeyW'); await page.waitForTimeout(500); await page.keyboard.up('KeyW');
const px1 = await page.evaluate(() => ({x: P.x, w: !!keys.KeyW}));
ok(!px1.w, 'W is not passed to the game while the map is open');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const c1 = await page.evaluate(() => ({open: __map1357.open, menuOpen, paused}));
ok(c1.open === 0 && c1.menuOpen === false && !c1.paused, 'Esc closes the map and returns to play (' + JSON.stringify(c1) + ')');
// M toggles
await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
const m1 = await page.evaluate(() => __map1357.open);
await page.click('[data-testid="full-map-close"]'); await page.waitForTimeout(200);
const m2 = await page.evaluate(() => ({open: __map1357.open, menuOpen}));
ok(m1 === 1 && m2.open === 0 && m2.menuOpen === false, 'M opens and the close button closes (' + m1 + ' ' + JSON.stringify(m2) + ')');
// other items: USE is untouched
const u = await page.evaluate(() => { selId = 3; inv[3] = Math.max(1, inv[3] || 0); useItem(); return __map1357.open; });
ok(u === 0, 'USE with a block does not open the map');
// kill switch restores the 1.2.122 seat
const k0 = await page.evaluate(async () => { selId = (typeof IT !== 'undefined' && IT.MAP) || 410; P.pitch = -0.15; window.__noMap1357 = 1; await new Promise(r => setTimeout(r, 1500)); const m = __pickMap1293.measure(); const r = {s: m.sheetScale, face: m.faceDot}; window.__noMap1357 = 0; return r; });
ok(k0.s <= 0.951 && k0.face < 0.99, '__noMap1357 brings back the old seat (' + JSON.stringify(k0) + ')');
ok(errors.filter(e => !/AbortError|play\(\)/i.test(e)).length === 0, 'no unexpected page errors (' + errors.length + ')');
console.log('v1357-held-map ok', k);
await browser.close();
server.close();
