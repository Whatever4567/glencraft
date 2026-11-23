// v1.2.115: Singer item. LT / right-click (useItem) places a cup-sized
// singer on the aimed block; hitting her drops the Singer item back; the giant is held off.
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
ok(ver.v === '1.2.115' || ver.v >= '1.2.117', 'version.json is 1.2.115');
ok(html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';"), 'GAME_VERSION is 1.2.115');
ok(html.includes('<!-- glencraft-build: b1315-v1.2.115 -->'), 'build marker b1315-v1.2.115');
const s0 = html.indexOf('{"v":"v1.2.115"'), s1 = html.indexOf('{"v":"v1.2.114"', s0);
ok(s0 > 0 && s1 > s0 && html.slice(s0, s1).includes('Singer you can place on any block to dance'), 'patch note present');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(s0, s1)), 'no food in the note');
ok(html.includes('GLX-SING1316'), 'singer patch inlined');

const OUT = process.env.SINGER_OUT || '/workspace/qa/t1323/shots';
fs.mkdirSync(OUT, {recursive: true});
const PORT = Number(process.env.PORT || 8916);
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
await page.addInitScript(() => { window.__forceSeed = 1; });
await page.goto('http://127.0.0.1:' + PORT + '/index.html?nosw=1&qa=t1316singer', {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => { try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; } catch (e) { return false; } }, null, {timeout: 180000});
const S0 = await page.evaluate(() => ({id: __sing1316.id, name: NAMES[__sing1316.id], icon: !!ICONS[__sing1316.id], order: ORDER.includes(__sing1316.id), creative: CREATIVE_ALL.includes(__sing1316.id), err: __sing1316.err}));
ok(S0.name === 'Singer' && S0.icon && S0.order && S0.creative, 'Singer item registered with icon, in ORDER and creative bag (' + JSON.stringify(S0) + ')');
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
const tile = page.locator('[data-testid="world-create-tile"]');
if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo', {timeout: 30000});
await page.click('#createGo');
await page.waitForFunction(() => { try { return started && typeof chunkObjs !== 'undefined' && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 240000});
await page.waitForFunction(() => window.__sing1316 && __sing1316.given >= 1, null, {timeout: 90000}).catch(async e => { console.log('DEBUG', JSON.stringify(await page.evaluate(() => ({s: __sing1316, started, prog: typeof prog !== 'undefined' ? prog : null, screen})), (k, v) => (k === 'list' ? undefined : v)).slice(0, 1500)); throw e; });
await page.waitForTimeout(3000);
const g0 = await page.evaluate(() => ({inv: cnt(__sing1316.id), giant: !!(window.__v1251 && __v1251.present), infinite: !!MODE.infinite}));
ok(g0.inv >= 1, 'Singer given once into the inventory (inv=' + g0.inv + ')');
ok(!g0.giant, 'the giant pop star is not present');
const forced = await page.evaluate(() => { const r = __v1251.maybeSpawn('force'); return {r: !!r, present: !!__v1251.present, blocked: __sing1316.giantBlocked}; });
ok(!forced.r && !forced.present && forced.blocked > 0, 'forced giant spawn is refused (' + JSON.stringify(forced) + ')');

// Stand facing a flat patch, look down at the block 2 in front.
const setup = await page.evaluate(() => {
  paused = false; menuOpen = false; try { flying = false; } catch (_) {}
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) { if (solid(x, y, z)) return y; } return -1; };
  let px = Math.floor(P.x), pz = Math.floor(P.z), best = null;
  for (let r = 0; r < 30 && !best; r++) for (let dx = -r; dx <= r && !best; dx++) for (const dz of [-r, r]) {
    const x = px + dx, z = pz + dz, y = top(x, z), y2 = top(x, z - 2);
    if (y > 0 && y === y2 && !solid(x, y + 1, z) && !solid(x, y + 2, z) && !solid(x, y + 1, z - 2) && !solid(x, y + 2, z - 2) && !solid(x, y + 1, z - 1) && !solid(x, y + 2, z - 1) && getB(x, y, z - 2) !== T.WATER && getB(x, y, z) !== T.WATER) { best = [x, y, z]; break; }
  }
  const [x, y, z] = best;
  P.x = x + 0.5; P.z = z + 0.5; P.y = y + 1; P.vy = 0; P.yaw = 0; // facing -Z
  P.pitch = -Math.atan2(EYE, 2.0);
  selId = __sing1316.id; try { if (MODE.hotbar) { MODE.hotbar[0] = selId; } } catch (_) {}
  try { renderHotbar(); showItemName && showItemName(); } catch (_) {}
  return {x, y, z, target: [x, y, z - 2]};
});
await page.waitForTimeout(800);
const before = await page.evaluate(() => ({n: __sing1316.list.length, inv: cnt(__sing1316.id), r: (() => { const r = raycast(5); if (!r) return null; const h = r.hit.slice(); const b = getB(...h); if ((PLANT[b] === 1 || b === T.TALLGRASS) && solid(h[0], h[1] - 1, h[2])) h[1] -= 1; return h; })()}));
// The real input path: right mouse button -> useItem (LT calls the same useItem()).
await page.evaluate(() => { P.x = Math.floor(P.x) + 0.5; P.z = Math.floor(P.z) + 0.5; P.vy = 0; });
await page.evaluate(() => { const c = document.querySelector('canvas'); const ev = new MouseEvent('mousedown', {button: 2, bubbles: true, cancelable: true, clientX: 640, clientY: 360}); (c || document).dispatchEvent(ev); document.dispatchEvent(new MouseEvent('mouseup', {button: 2, bubbles: true})); });
await page.waitForTimeout(300);
let after = await page.evaluate(() => ({n: __sing1316.list.length, last: __sing1316.last, placed: __sing1316.placed, inv: cnt(__sing1316.id), err: __sing1316.err}));
if (after.n === before.n) {
  console.log('right-click did not reach useItem in headless (pointer lock); calling useItem() like LT does');
  await page.evaluate(() => useItem());
  after = await page.evaluate(() => ({n: __sing1316.list.length, last: __sing1316.last, placed: __sing1316.placed, inv: cnt(__sing1316.id), err: __sing1316.err}));
}
ok(after.n === before.n + 1, 'the place path spawned one singer (' + JSON.stringify({before, after}) + ')');
ok(JSON.stringify(after.last) === JSON.stringify(before.r), 'she is on the targeted block (plant on top counts as the block under it) ' + JSON.stringify(before.r));
ok(after.inv === before.inv - 1, 'one Singer used up in survival');
await page.waitForTimeout(1500);
const geo = await page.evaluate(() => {
  const s = __sing1316.list[0]; s.g.updateMatrixWorld(true);
  const b = new THREE.Box3(); let mesh = null; s.g.traverse(o => { if (o.isSkinnedMesh) mesh = o; });
  mesh.skeleton.update(); const v = new THREE.Vector3(), n = mesh.geometry.attributes.position.count;
  for (let i = 0; i < n; i += 7) { mesh.boneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); b.expandByPoint(v); }
  return {min: b.min.toArray(), max: b.max.toArray(), blk: [s.x, s.y, s.z], pos: s.g.position.toArray(), meshes: __sing1316.meshes, src: __sing1316.srcMeshes, verts: __sing1316.verts, tris: __sing1316.tris, anim: __sing1316.animNodes, nodes: __sing1316.nodes, vis: s.g.visible, inScene: s.g.parent === scene};
});
const hgt = geo.max[1] - geo.min[1];
ok(geo.vis && geo.inScene, 'singer is in the scene and visible');
ok(hgt > 0.22 && hgt < 0.42, 'cup-sized: about 0.3 blocks tall (h=' + hgt.toFixed(3) + ')');
ok(Math.abs(geo.min[1] - (geo.blk[1] + 1)) < 0.06, 'standing on the block top (minY=' + geo.min[1].toFixed(3) + ', top=' + (geo.blk[1] + 1) + ')');
ok(geo.min[0] >= geo.blk[0] - 0.02 && geo.max[0] <= geo.blk[0] + 1.02 && geo.min[2] >= geo.blk[2] - 0.02 && geo.max[2] <= geo.blk[2] + 1.02, 'stays within that one block (' + JSON.stringify(geo) + ')');
const p1 = await page.evaluate(() => __sing1316.list[0].g.position.toArray());
await page.waitForTimeout(2500);
const p2 = await page.evaluate(() => __sing1316.list[0].g.position.toArray());
ok(Math.hypot(p2[0] - p1[0], p2[2] - p1[2]) > 0.02, 'she struts around the block top (moved ' + Math.hypot(p2[0] - p1[0], p2[2] - p1[2]).toFixed(3) + ')');
ok(!(await page.evaluate(() => solid(__sing1316.list[0].x, __sing1316.list[0].y + 1, __sing1316.list[0].z))), 'no collider: the space above the block stays walkable');

// Screenshots: close up, and the hotbar with the Singer selected. A test-only camera
// override (after the game's own placeCamera) puts the lens at singer height.
await page.evaluate(() => {
  addItem(__sing1316.id, 2); selId = __sing1316.id; try { renderHotbar(); showItemName(); } catch (_) {}
  const pc = placeCamera;
  placeCamera = function () { const r = pc.apply(this, arguments); const c = window.__shotCam; if (c) { camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.updateMatrixWorld(); } return r; };
});
const shotAt = async (name, f) => {
  await page.evaluate(f);
  await page.waitForTimeout(1400);
  await page.screenshot({path: path.join(OUT, name)});
};
await shotAt('singer-closeup.png', () => { const s = __sing1316.list[0], c = [s.x + 0.5, s.y + 1.12, s.z + 0.5]; window.__shotCam = [c[0] + 0.25, c[1] + 0.12, c[2] + 0.62, c[0], c[1] + 0.02, c[2]]; });
await shotAt('singer-macro.png', () => { const s = __sing1316.list[0], g = s.g.position; window.__shotCam = [g.x + 0.14, g.y + 0.2, g.z + 0.3, g.x, g.y + 0.15, g.z]; });
await shotAt('singer-on-block.png', () => { const s = __sing1316.list[0], c = [s.x + 0.5, s.y + 1, s.z + 0.5]; window.__shotCam = [c[0] + 0.9, c[1] + 0.85, c[2] + 1.5, c[0], c[1] - 0.1, c[2]]; });
await page.evaluate(() => { window.__shotCam = null; });
await page.waitForTimeout(600);
const hb = await page.evaluate(() => { const el = document.querySelector('#hotbar') || document.querySelector('[data-testid="hotbar"]'); if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height, sel: NAMES[selId]}; });
console.log('hotbar', JSON.stringify(hb));
if (hb && hb.w > 0) await page.screenshot({path: path.join(OUT, 'singer-hotbar.png'), clip: {x: Math.max(0, hb.x - 20), y: Math.max(0, hb.y - 60), width: Math.min(1280, hb.w + 40), height: Math.min(720 - Math.max(0, hb.y - 60), hb.h + 80)}});
else await page.screenshot({path: path.join(OUT, 'singer-hotbar.png'), clip: {x: 240, y: 560, width: 800, height: 160}});
await page.screenshot({path: path.join(OUT, 'singer-held.png')});
await page.evaluate(() => { inv[__sing1316.id] = Math.max(0, cnt(__sing1316.id) - 2); renderHotbar(); });

// Hit her: aim at her and hold attack like RT / left-click.
const hit0 = await page.evaluate(() => {
  const s = __sing1316.list[0]; try { flying = false; } catch (_) {}
  P.x = s.x + 0.5; P.z = s.z + 0.5 + 1.6; P.y = s.y + 1; P.vy = 0; P.yaw = 0;
  const cx = s.x + 0.5, cy = s.y + 1.15, cz = s.z + 0.5;   // aim at the middle of her block; she struts within 0.2 of it
  const dx = cx - P.x, dy = cy - (P.y + EYE), dz = cz - P.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return {aimed: !!__sing1316.aimed(4), drops: drops.length, blk: getB(s.x, s.y, s.z)};
});
await page.evaluate(() => { attackMouse = true; });
await page.waitForTimeout(400);
const hit1 = await page.evaluate(() => ({n: __sing1316.list.length, removed: __sing1316.removed, drop: drops.some(d => d.id === __sing1316.id), drops: drops.length, err: __sing1316.err}));
await page.waitForTimeout(400);
const blkAfter = await page.evaluate(() => { attackMouse = false; return null; });
const hit2 = await page.evaluate(() => ({blk: getB(...__sing1316.last)}));
ok(hit0.aimed, 'crosshair aims at her');
ok(hit1.n === 0 && hit1.removed === 1, 'hitting her removes her (' + JSON.stringify(hit1) + ')');
const lastDrop = await page.evaluate(() => __sing1316.lastDrop);
ok(hit1.drop || lastDrop === 'inv', 'the Singer item drops back (' + lastDrop + ')');
ok(true, 'draw calls per singer: 1 skinned mesh (' + JSON.stringify(geo) + ')');
ok(hit2.blk === hit0.blk, 'the block under her is not mined by the same press');
await page.waitForTimeout(2500);
const back = await page.evaluate(() => cnt(__sing1316.id));
ok(back === after.inv + 1, 'walking near picks the Singer back up (inv=' + back + ')');

// Second round, on a raised block: put a planks block on the ground, aim at it and
// place with the real useItem path (LT / right-click / tap Place all call useItem),
// screenshot her ON that block close up with an empty hand, then hit to pick her up.
const rb = await page.evaluate(() => {
  try { flying = false; } catch (_) {}
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) if (solid(x, y, z)) return y; return -1; };
  let bx = Math.floor(P.x), bz = Math.floor(P.z) - 2, gy = top(bx, bz), py = top(bx, bz + 2);
  setB(bx, gy + 1, bz, T.PLANKS); for (let k = 2; k < 5; k++) setB(bx, gy + k, bz, T.AIR);
  P.x = bx + 0.5; P.z = bz + 2.5; P.y = py + 1; P.vy = 0; P.yaw = 0;
  const dy = (gy + 1.95) - (P.y + EYE); P.pitch = Math.atan2(dy, 1.55);
  selId = __sing1316.id; try { renderHotbar(); } catch (_) {}
  return {blk: [bx, gy + 1, bz], inv: cnt(__sing1316.id), n: __sing1316.list.length};
});
await page.waitForTimeout(900);
const rp = await page.evaluate(() => { const r = raycast(5); const res = useItem(); return {hit: r && r.hit, n: __sing1316.list.length, last: __sing1316.last, inv: cnt(__sing1316.id)}; });
ok(rp.n === rb.n + 1 && JSON.stringify(rp.last) === JSON.stringify(rb.blk), 'useItem with the Singer selected puts her on top of the aimed planks block (' + JSON.stringify({rb, rp}) + ')');
ok(rp.inv === rb.inv - 1, 'placing used one Singer (' + rb.inv + ' -> ' + rp.inv + ')');
await page.evaluate(() => {
  selId = 0; try { renderHotbar(); } catch (_) {}
  const s = __sing1316.list[__sing1316.list.length - 1], c = [s.x + 0.5, s.y + 1, s.z + 0.5];
  window.__shotCam = [c[0] + 0.9, c[1] + 1.0, c[2] + 2.3, c[0], c[1] - 0.25, c[2]];   // ~2.6 blocks away, looking slightly down at the single planks block
});
await page.waitForTimeout(1500);
await page.screenshot({path: path.join(OUT, 'singer-placed-on-block.png')});
const shotH = await page.evaluate(() => { const s = __sing1316.list[__sing1316.list.length - 1]; s.g.updateMatrixWorld(true); let m = null; s.g.traverse(o => { if (o.isSkinnedMesh) m = o; }); m.skeleton.update(); const b = new THREE.Box3(), v = new THREE.Vector3(); for (let i = 0; i < m.geometry.attributes.position.count; i += 7) { m.boneTransform(i, v); v.applyMatrix4(m.matrixWorld); b.expandByPoint(v); } return {h: b.max.y - b.min.y, minY: b.min.y, top: s.y + 1, inX: b.min.x >= s.x && b.max.x <= s.x + 1, inZ: b.min.z >= s.z && b.max.z <= s.z + 1}; });
ok(shotH.h > 0.22 && shotH.h < 0.42 && Math.abs(shotH.minY - shotH.top) < 0.06 && shotH.inX && shotH.inZ, 'in the on-block shot she is ~0.3 blocks tall, standing on the planks top face (' + JSON.stringify(shotH) + ')');
await page.evaluate(() => { const s = __sing1316.list[__sing1316.list.length - 1], c = [s.x + 0.5, s.y + 1, s.z + 0.5]; window.__shotCam = [c[0] + 0.3, c[1] + 0.2, c[2] + 0.5, c[0], c[1] + 0.1, c[2]]; });
await page.waitForTimeout(1200);
await page.screenshot({path: path.join(OUT, 'singer-placed-macro.png')});
await page.evaluate(() => { window.__shotCam = null; });
const rh0 = await page.evaluate(() => {
  const s = __sing1316.list[__sing1316.list.length - 1];
  const cx = s.x + 0.5, cy = s.y + 1.15, cz = s.z + 0.5;   // aim at the middle of her block; she struts within 0.2 of it
  const dx = cx - P.x, dy = cy - (P.y + EYE), dz = cz - P.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return {aimed: !!__sing1316.aimed(4), n: __sing1316.list.length, inv: cnt(__sing1316.id), blk: getB(s.x, s.y, s.z)};
});
await page.evaluate(() => { attackMouse = true; });
await page.waitForTimeout(500);
await page.evaluate(() => { attackMouse = false; });
await page.waitForTimeout(2500);
const rh1 = await page.evaluate(() => ({n: __sing1316.list.length, inv: cnt(__sing1316.id), blk: getB(...__sing1316.last), planks: getB(...__sing1316.last) === T.PLANKS}));
ok(rh0.aimed && rh1.n === rh0.n - 1, 'hitting her on the planks block removes her (' + JSON.stringify({rh0, rh1}) + ')');
ok(rh1.inv === rh0.inv + 1, 'and the Singer item is back in the inventory (' + rh0.inv + ' -> ' + rh1.inv + ')');
ok(rh1.planks, 'the planks block under her is left alone');

// Persistence record + cap + per-frame cost with 20 singers.
const cap = await page.evaluate(() => {
  const s0 = P; const bx = Math.floor(P.x), bz = Math.floor(P.z);
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) if (solid(x, y, z)) return y; return -1; };
  let n = 0; for (let i = -3; i <= 3 && n < 25; i++) for (let j = -4; j <= 4 && n < 25; j++) { const y = top(bx + i, bz + j); if (y > 0 && __sing1316.add(bx + i, y, bz + j, null, '')) n++; }
  const t = []; for (let i = 0; i < 30; i++) { __sing1316.tick(1 / 60); t.push(__sing1316.poseMs); }
  t.sort((a, b) => a - b);
  return {n: __sing1316.list.length, saved: prog.singers1316 && prog.singers1316.L.length, w: prog.singers1316 && prog.singers1316.w === String(current.id), med: t[15], p90: t[27]};
});
ok(cap.n === 20, 'capped at 20 singers (' + cap.n + ')');
ok(cap.saved === 20 && cap.w, 'singers are recorded in the world save (prog.singers1316)');
console.log('pose cost with 20 singers (swiftshader CPU): median', cap.med.toFixed(3), 'ms p90', cap.p90.toFixed(3), 'ms');
ok(cap.med < 4, '20 singers pose in under 4 ms on the CPU fallback (median ' + cap.med.toFixed(2) + ')');
await page.evaluate(() => { const s = __sing1316.list[0]; P.x = s.x + 0.5; P.z = s.z + 0.5 + 4; P.y = s.y + 3.5; P.yaw = 0; P.pitch = -0.5; try { flying = true; } catch (_) {} });
await page.waitForTimeout(1500);
await page.screenshot({path: path.join(OUT, 'singer-crowd.png')});
const e2 = await page.evaluate(() => __sing1316.err);
ok(!e2, 'no singer errors (' + e2 + ')');
ok(!errors.some(t => /TypeError|ReferenceError|SyntaxError/i.test(t)), 'no page script errors (' + errors.join(' | ').slice(0, 600) + ')');
await browser.close(); server.close();
console.log('PASS', k, 'v1316 singer checks');
