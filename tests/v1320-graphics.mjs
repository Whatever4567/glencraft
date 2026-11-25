// v1.2.120 graphics edition: clear-day lighting (key sun / sky fill / blue aerial haze / saturation after ACES),
// painted-map-guided terrain with sloping banks (no water walls), farmer hamlets on new twice-scale worlds.
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
ok(['1.2.120', '1.2.121', '1.2.122', '1.2.123', '1.2.124', '1.2.125', '1.2.126', '1.2.127', '1.2.128', '1.2.129'].includes(ver.v), 'version.json is 1.2.120+');
ok(html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';") || html.includes("const GAME_VERSION = '1.2.122';") || html.includes("const GAME_VERSION = '1.2.123';") || html.includes("const GAME_VERSION = '1.2.124';") || html.includes("const GAME_VERSION = '1.2.125';") || html.includes("const GAME_VERSION = '1.2.126';") || html.includes("const GAME_VERSION = '1.2.127';") || html.includes("const GAME_VERSION = '1.2.128';") || html.includes("const GAME_VERSION = '1.2.129';"), 'GAME_VERSION is 1.2.120+');
ok(html.includes('<!-- glencraft-build: b1320-v1.2.120 -->'), 'build marker b1320-v1.2.120');
const s0 = html.indexOf('{"v":"v1.2.120"'), s1 = html.indexOf('{"v":"v1.2.119"', s0);
ok(s0 > 0 && s1 > s0 && html.slice(s0, s1).includes('Graphics edition') && html.slice(s0, s1).includes('hamlets'), 'patch note present, newest first');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew|eat/i.test(html.slice(s0, s1)), 'no food in the note');
ok(html.includes('GLX-G1340 ') && html.includes('GLX-G1340H') && html.includes('GLX-G1340M') && html.includes('GLX-MC1327'), 'graphics, hamlet and map-guide modules inlined');
ok(html.includes('__fpa'), 'first-person rig kept');
const OUT = process.env.LOOK_OUT || '/tmp/t1340-look';
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
const T0 = await page.evaluate(() => ({g: window.__g1340 && {on: __g1340.on, sat: __g1340.sat, err: __g1340.err}, gfx: typeof GFX !== 'undefined' ? GFX : null, chunk: THREE.ShaderChunk.tonemapping_pars_fragment.includes('ACESFilmicToneMapping0')}));
ok(T0.g && T0.g.on === 1 && T0.g.sat === 1 && !T0.g.err && T0.chunk, 'default graphics (' + T0.gfx + ') get the clear-day lighting and colour step (' + JSON.stringify(T0) + ')');
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo', {timeout: 30000});
await page.click('#createGo');
await page.waitForFunction(() => { try { return started && typeof chunkObjs !== 'undefined' && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 400000});
await page.waitForFunction(() => window.__v1308 && __v1308.surfMs != null && __v1308.surfMs >= 0, null, {timeout: 240000}).catch(() => {});
await page.waitForFunction(() => current && current.g1340v === 1 && window.__g1340h && __g1340h.ms >= 0 && (__g1340h.built > 0 || __g1340h.err), null, {timeout: 120000}).catch(() => {});
const R = await page.evaluate(() => {
  const V = window.__v1308, M = V && V.mc, out = {scaled: !!(V && V.isScaled && V.isScaled()), mc: !!(M && M.elig()), g: !!(M && M.g1340), vd: !!(M && M.grid && M.grid.Vd), vdErr: M && M.vdErr || null, h: window.__g1340h, farms: (__c113.farmsList() || []).length};
  out.mapNW = M.mapAt(57.6, -5.2); out.mapCairn = M.mapAt(57.1, -3.6); out.mapSea = M.mapAt(58.0, -8.5);
  const topY = (x, z) => { for (let y = H - 2; y > 0; y--) { const v = world[(x * H + y) * D + z]; if (v && !(LEAFY[v] || LOGGY[v] || PLANT[v] === 1)) return v === T.WATER ? -1 : y - SEA + 1; } return -1; };
  let n = 0, walls = 0, mx = 0; for (let x = 8; x < W - 8; x += 6) for (let z = 8; z < D - 8; z += 6) { const g = topY(x, z); if (g <= 0) continue; n++; mx = Math.max(mx, g); const a = topY(x + 1, z), b = topY(x, z + 1); if ((a > -1 && Math.abs(a - g) >= 6) || (b > -1 && Math.abs(b - g) >= 6)) walls++; }
  out.n = n; out.wallPct = 100 * walls / Math.max(1, n); out.maxG = mx;
  const f = (__c113.farmsList() || [])[0]; if (f) { let cab = 0; for (let x = f.x0 - 1; x <= f.x0 + 8; x++) for (let z = f.z0 - 1; z <= f.z0 + 7; z++) for (let y = f.gy; y < f.gy + 9; y++) { const b = world[(x * H + y) * D + z]; if (b === 234 || b === 254) cab++; } out.cabinBlocks = cab; }
  dayClock = 60; weather.type = 'clear'; return out; });
console.log('world', JSON.stringify(R));
ok(R.scaled && R.mc && R.g && R.vd && !R.vdErr, 'new twice-scale world uses the MC terrain with the water-distance field');
ok(R.mapNW[0] > 0.3 && R.mapSea[0] === 0 && R.mapSea[1] === 0, 'painted map guide: NW Highlands read as mountains, open sea reads as nothing (' + JSON.stringify([R.mapNW, R.mapSea]) + ')');
ok(R.wallPct < 1.0, 'few cliff walls (>=6-block steps between neighbours; random seed, 1.2.119 seed 7 was 0.75% on the HIST probe, 1.2.120 0.37%) ' + R.wallPct.toFixed(2) + '%');
ok(R.maxG >= 40, 'tall peaks still reach near the ceiling (max ' + R.maxG + ')');
ok(R.farms >= 1 && R.h && R.h.built >= 1 && R.h.cabins >= 1 && !R.h.err && R.cabinBlocks > 20, 'farmer hamlets built (' + JSON.stringify({f: R.farms, h: R.h, cab: R.cabinBlocks}) + ')');
await page.waitForTimeout(3000);
const L = await page.evaluate(() => ({k: __g1340.k, frames: __g1340.frames, sun: sunL.intensity, hemi: hemi.intensity, fog: scene.fog.color.getHexString()}));
console.log('light', JSON.stringify(L));
ok(L.frames > 0 && L.k > 0.5 && L.sun > 0.5, 'clear-day lighting active in play (' + JSON.stringify(L) + ')');
const fogC = parseInt(L.fog, 16), fr = fogC >> 16, fb = fogC & 255; ok(fb > fr, 'distance haze is blue, not grey (' + L.fog + ')');
await page.screenshot({path: path.join(OUT, 'look-day.png')});
ok(!errors.some(t => /TypeError|ReferenceError|SyntaxError/i.test(t)), 'no page script errors (' + errors.join(' | ').slice(0, 600) + ')');
await browser.close(); server.close();
console.log('PASS', k, 'v1320 graphics edition checks');
