// t1366: the pool rooms under spawn (from the player's video). A wide pearl-tiled arched tunnel goes down from beside the
// spawn point into a tiled pool hall with ring fountains. New worlds get it once the land is final; a saved world from before
// gets it only if the whole space is untouched natural ground with nothing of yours there. Off switch: window.__noCave1366.
// Also walks it with the real controls: down the steps into the hall and back up again.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
ok(html.includes('<script id="glx-cave1366">') && html.includes('window.__noCave1366'), 'GLX-CAVE1366 inlined with its off switch');
ok(html.includes('1.2.59-frame-torch') && html.includes('id="glx-phand1360"') && html.includes('GLX-G1365 (t1365)'), 'torch fix, pistol hands and the UK relief stay');
{ const n0 = html.indexOf('{"v":"v1.2.127"'), n1 = html.indexOf('{"v":"v1.2.126"', n0); const note = n0 > 0 && n1 > n0 ? html.slice(n0, n1) : '';
  if (n0 > 0) { ok(/pool/i.test(note) && /spawn/i.test(note), '1.2.127 patch note covers the pool rooms by spawn'); ok(!/haggis|food|sausage|pie\b|bread|meat|stew|cake|snack/i.test(note), 'no food in the 1.2.127 note'); } }

const PORT = Number(process.env.PORT || 8966);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm'};
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
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage']});
const errors = [];
try {
  // ---------- the off switch (title screen only, cheap) ----------
  { const pg = await browser.newPage({viewport: {width: 640, height: 400}}); pg.setDefaultTimeout(180000);
    await pg.addInitScript(() => { window.__noCave1366 = 1; });
    await pg.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded'});
    await pg.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title');
    const f = await pg.evaluate(() => ({why: window.__cave1366 && __cave1366.why, name: NAMES[861] || null, run: !!(window.__cave1366 && __cave1366.run)}));
    ok(f.why === 'flag' && !f.name && !f.run, '__noCave1366 turns it all off (no blocks, no build) ' + JSON.stringify(f));
    await pg.close(); }
  // ---------- a new world (seed 7, the real create flow) ----------
  const page = await browser.newPage({viewport: {width: 960, height: 540}});
  page.setDefaultTimeout(240000);
  page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
  await page.addInitScript(() => { window.__forceSeed = 7; });
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1366cave`, {waitUntil: 'domcontentloaded', timeout: 180000});
  await page.waitForFunction(() => { try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined'; } catch (e) { return false; } }, null, {timeout: 180000});
  if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
  await page.waitForSelector('[data-testid="world-create-tile"], #createGo', {timeout: 30000});
  const tile = page.locator('[data-testid="world-create-tile"]');
  if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
  await page.waitForSelector('#createGo', {timeout: 30000});
  await page.click('#createGo');
  await page.waitForFunction(() => { try { return started && current && current.cave1366v === 1 && (window.__cave1366.at || window.__cave1366.why); } catch (e) { return false; } }, null, {timeout: 300000});
  await page.evaluate(() => { paused = false; menuOpen = false; });
  const s = await page.evaluate(() => { const U = __cave1366, A = U.at, sp = (window.__v1308 && __v1308.spawn) || g9spawn; if (!A) return {why: U.why, err: U.err};
    const p = U.plan({x: A.x, z: A.z, Y0: A.Y0}, A.d, A.N), b = U.box, c = {};
    for (let x = b.x0; x <= b.x1; x++) for (let z = b.z0; z <= b.z1; z++) for (let y = b.y0; y <= b.y1; y++) { const v = world[idx(x, y, z)]; if ((v >= 861 && v <= 868) || v === T.WATER) c[v] = (c[v] || 0) + 1; }
    let faces = 0; for (let v = 1; v < p.L; v += 2) { const [x, z] = p.W2(0, v); const m = entMeta.get(keyOf(x, p.Y0 - (v + 1) / 2, z)); if (m && m.face === entMeta.get(keyOf(...p.W2(0, 1).slice(0, 1), p.Y0 - 1, p.W2(0, 1)[1])).face) faces++; }
    const [hx, hz] = p.W2(0, p.HV + 15);
    return {err: U.err, why: U.why, cost: U.cost, tries: U.tries, ms: U.ms, W, H, D, len: world.length, sp, at: A, dist: Math.hypot(A.x - sp[0], A.z - sp[2]), Y0: p.Y0, Yb: p.Yb, L: p.L, c, faces, steps: p.L / 2,
      hallAir: world[idx(hx, p.Yb + 5, hz)], hallRoof: world[idx(hx, p.Yb + 10, hz)], decor: U.hasDecor(), ids: [861, 862, 863, 864, 865, 866, 867, 868].map(i => !!NAMES[i] && !!BLOCK_MATS[i]), lit: [__LSRC[865], __LSRC[866]], stair: IS_STAIR[868] === 1}; });
  console.log('CAVE', JSON.stringify(s));
  ok(!s.err && s.at, 'built on the new world, no error (' + (s.why || '') + ')');
  ok(s.dist <= 24, 'entrance is right beside the spawn point (' + s.dist.toFixed(1) + ' blocks)');
  ok(s.ids.every(Boolean) && s.lit[0] === 15 && s.lit[1] === 15 && s.stair, 'eight new blocks registered; globe lamps and ceiling lights give full light; mosaic stairs are stairs');
  ok(s.c[861] > 500 && s.c[863] > 1500 && s.c[864] > 800 && s.c[865] >= 25 && s.c[866] >= 40 && s.c[867] > 100, 'pearl mosaic tunnel, cream hall, pool tiles, lamps, ceiling lights and rose portholes are all there');
  ok(s.c[868] === s.steps * 5, 'a full staircase, 5 wide (' + s.c[868] + ' stairs)');
  ok(s.faces === s.steps, 'every step faces the same way, up towards the entrance');
  ok(s.c[5] > 1200, 'the pool is full of water (' + s.c[5] + ' cells)');
  ok(s.hallAir === 0 && s.hallRoof === 863, 'the hall is open and roofed in cream tile');
  ok(s.decor, 'fountains, water sheets and foam are up');
  // ---------- walk it with the real controls ----------
  const loc = () => page.evaluate(() => { const A = __cave1366.at, p = __cave1366.plan({x: A.x, z: A.z, Y0: A.Y0}, A.d, A.N); const lx = P.x - A.x - 0.5, lz = P.z - A.z - 0.5; return {u: lx * p.R[0] + lz * p.R[1], v: lx * p.F[0] + lz * p.F[1], y: P.y, Yb: p.Yb, Y0: p.Y0, L: p.L, HV: p.HV}; });
  // the software renderer runs the game slowly (about half a block a second), so the walk is done in four real-key legs:
  // in at the top, the last stretch to the bottom, up from the bottom, and up out of the top
  const place = (v, up) => page.evaluate(([v, up]) => { const A = __cave1366.at, p = __cave1366.plan({x: A.x, z: A.z, Y0: A.Y0}, A.d, A.N); try { flying = false; if (MODE) MODE.fly = false; } catch (_) {}
    const y = v <= 0 ? p.Y0 : v >= p.L ? p.Yb : p.Y0 - Math.ceil(v / 2); P.x = A.x + 0.5 + p.F[0] * v; P.z = A.z + 0.5 + p.F[1] * v; P.y = y + 0.02; P.vy = 0;
    P.yaw = up ? Math.atan2(p.F[0], p.F[1]) : Math.atan2(-p.F[0], -p.F[1]); P.pitch = -0.2; paused = false; menuOpen = false; }, [v, up]);
  const leg = async (v0, up, done, ms) => { await place(v0, up); await page.waitForTimeout(2000); await page.keyboard.down('KeyW'); let q = null; const t0 = Date.now(), tr = [];
    while (Date.now() - t0 < ms) { await page.waitForTimeout(250); q = await loc(); if (tr.length < 60) tr.push([+q.v.toFixed(1), +q.y.toFixed(2)]); if (done(q)) break; }
    await page.keyboard.up('KeyW'); q.trail = tr.filter((_, i) => i % 6 === 0); return q; };
  const L0 = s.L;
  const d1 = await leg(-5, false, q => q.v > 12, 60000); console.log('DOWN1', JSON.stringify(d1));
  ok(d1.v > 12 && d1.y < d1.Y0 - 5 && Math.abs(d1.u) < 2.6, 'walked in at the top and down the first steps (v ' + d1.v.toFixed(1) + ', y ' + d1.y.toFixed(2) + ')');
  const d2 = await leg(L0 - 10, false, q => q.v > q.L + 1.5, 60000); console.log('DOWN2', JSON.stringify(d2));
  ok(d2.v > d2.L + 1 && d2.y < d2.Yb + 0.6 && Math.abs(d2.u) < 2.6, 'walked down the last steps to the bottom (v ' + d2.v.toFixed(1) + ', y ' + d2.y.toFixed(2) + ')');
  const u1 = await leg(L0 + 1, true, q => q.v < q.L - 10, 60000); console.log('UP1', JSON.stringify(u1));
  ok(u1.v < u1.L - 9 && u1.y > u1.Yb + 4, 'walked back up from the bottom without jumping (v ' + u1.v.toFixed(1) + ', y ' + u1.y.toFixed(2) + ')');
  const u2 = await leg(10, true, q => q.v < -1, 60000); console.log('UP2', JSON.stringify(u2));
  ok(u2.v < 0 && u2.y >= u2.Y0 - 0.1, 'walked up the top steps and out (v ' + u2.v.toFixed(1) + ', y ' + u2.y.toFixed(2) + ')');
  // ---------- saves ----------
  const sv = await page.evaluate(() => { const U = __cave1366, at0 = JSON.parse(JSON.stringify(U.at)), box0 = JSON.parse(JSON.stringify(U.box)); const d = U.onSave({}); const out = {saved: !!(d.cave1366 && d.cave1366.v === 1 && d.cave1366.at && d.cave1366.at.x === at0.x)};
    U.onLoad({}); out.oldPending = current.cave1366v === 2 && !U.at && !U.hasDecor();
    U.onLoad({cave1366: {v: 1, at: at0, box: box0}}); out.restored = current.cave1366v === 1 && U.at && U.at.x === at0.x && U.hasDecor();
    out.ownClean = U.clean(box0, true);   // the built cave itself is not natural ground: a second build never lands on it
    return out; });
  console.log('SAVE', JSON.stringify(sv));
  ok(sv.saved, 'the save remembers where the cave is');
  ok(sv.oldPending, 'a save from before 1.2.127 is marked for the once-only check');
  ok(sv.restored, 'loading a save with the cave brings back its fountains and water sheets');
  ok(/^block \d+/.test(sv.ownClean), 'its own space never reads as untouched ground (' + sv.ownClean + ')');
  // old saves: the space must be untouched natural ground with nothing of yours, else it is left alone
  const old = await page.evaluate(() => { const U = __cave1366, at0 = U.at, box0 = U.box, sp0 = __v1308.spawn, spA = sp0 || g9spawn, r = {};
    const top = (x, z) => { for (let y = H - 2; y > 1; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !PLANT[b] && !LEAFY[b] && !LOGGY[b]) return y; } return 0; };
    const spots = []; for (let rr = 140; rr <= 360 && spots.length < 3; rr += 20) for (let a = 0; a < 16 && spots.length < 3; a++) { const x = Math.round(spA[0] + Math.cos(a / 16 * 6.283) * rr), z = Math.round(spA[2] + Math.sin(a / 16 * 6.283) * rr); const t = top(x, z); if (t <= SEA + 2) continue;
      const c = U.choose([x, t, z]); if (!c || c.sc > 60) continue; const dry = U.build(c.p, true); if (U.clean(dry.box, false)) continue; if (spots.some(s => Math.abs(s.box.x0 - dry.box.x0) < 60 && Math.abs(s.box.z0 - dry.box.z0) < 90)) continue; spots.push({sp: [x, t, z], box: dry.box, p: c.p}); }
    r.spots = spots.length; if (spots.length < 3) return r;
    const P0 = {x: P.x, y: P.y, z: P.z};
    // 1) untouched: built
    __v1308.spawn = spots[0].sp; U.at = null; U.box = null; r.clean = U.run(true); r.cleanWhy = U.why; r.cleanTile = r.clean ? world[idx(...U.plan({x: U.at.x, z: U.at.z, Y0: U.at.Y0}, U.at.d, U.at.N).W2(0, 1).slice(0, 1), U.at.Y0 - 1, U.plan({x: U.at.x, z: U.at.z, Y0: U.at.Y0}, U.at.d, U.at.N).W2(0, 1)[1])] : 0;
    // 2) a block of yours inside: left alone
    { const b = spots[1].box, x = (b.x0 + b.x1) >> 1, z = (b.z0 + b.z1) >> 1, y = (b.y0 + b.y1) >> 1; world[idx(x, y, z)] = T.PLANKS; __v1308.spawn = spots[1].sp; U.at = null; U.box = null; const n0 = U.built; r.block = U.run(true); r.blockWhy = U.why; r.blockBuilt = U.built - n0; r.blockStill = world[idx(x, y, z)] === T.PLANKS; }
    // 3) you standing in it: left alone
    { const b = spots[2].box; P.x = (b.x0 + b.x1) / 2; P.z = (b.z0 + b.z1) / 2; P.y = (b.y0 + b.y1) / 2; __v1308.spawn = spots[2].sp; U.at = null; U.box = null; r.player = U.run(true); r.playerWhy = U.why; }
    __v1308.spawn = sp0; P.x = P0.x; P.y = P0.y; P.z = P0.z; U.onLoad({cave1366: {v: 1, at: at0, box: box0}}); return r; });
  console.log('OLD', JSON.stringify(old));
  ok(old.spots === 3, 'found three test sites on untouched ground');
  ok(old.clean === true && old.cleanTile === 868, 'old save, untouched ground: the cave is built');
  ok(old.block === false && /^kept: block 10\b/.test(old.blockWhy) && old.blockBuilt === 0 && old.blockStill, 'old save, a block of yours in the space: left alone (' + old.blockWhy + ')');
  ok(old.player === false && old.playerWhy === 'kept: player', 'old save, you standing in the space: left alone');
  await page.screenshot({path: '/tmp/v1366-last.png'});
  ok(errors.filter(e => !/AbortError|play\(\)/i.test(e)).length === 0, 'no page errors (' + errors.join(' | ').slice(0, 300) + ')');
  await page.close();
} finally { await browser.close(); server.close(); }
console.log('PASS v1366-pool-cave ' + k);
