// GLX-V1300 volcano overhaul: boots a real new world (createWorld) in headless Chromium and checks
//  - no floating volcano: every eruptable site is anchored to its real crater (vent on the terrain within 2 blocks)
//  - 38+ eruptable sites (all C342 lava craters) + Ben Glencraft, bigger than the rest and >= 120 from spawn
//  - the old C229 stamp is kept only as c229legacy, current.c229 points at a real crater
//  - eruption phases in order: sink, surge, gush, pour, flood, cool; no bombs, old explosive C242/C279 stay off
//  - lava reaches > 60 blocks from the crater and never enters the spawn pad / village disc
//  - shake stays under the subtle cap, block/FX work stays well under +2 ms per frame, saves carry the state,
//    and the Element 115 blue eruption still runs through the same machine.
// Usage: node tests/v1300-volcano.mjs [indexDir]
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {extname, join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import pkg from '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {chromium} = pkg;
const here = dirname(fileURLToPath(import.meta.url));
const indexDir = resolve(process.argv[2] || resolve(here, '..'));
if (!existsSync(join(indexDir, 'index.html'))) { console.error('no index.html in', indexDir); process.exit(2); }
const html = readFileSync(join(indexDir, 'index.html'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('ok  ', m); } else { fail++; console.log('FAIL', m); } };
ok(html.includes('GLX-V1300:'), 'GLX-V1300 module present');
ok(html.includes('if (window.__v1300 && __v1300.active) return __v1300.erupt(null, blue);'), 'C242 erupt hands over to V1300');
ok(html.includes('__v1300.idleAt) { at = __v1300.idleAt(); }'), 'C229 idle smoke follows the nearest real crater');
const v = html.slice(html.indexOf('GLX-V1300:'));
ok(!/IcosahedronGeometry|flash\.material/.test(v.slice(0, v.indexOf('</script>'))), 'no bomb meshes or flash sprite in V1300');
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.bin': 'application/octet-stream'};
const PORT = Number(process.env.PORT || 8973);
const server = await new Promise(r => { const s = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = join(indexDir, p); if (!f.startsWith(indexDir)) { res.writeHead(403); res.end(); return; }
  const d = readFileSync(f); res.writeHead(200, {'Content-Type': MIME[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(PORT, '127.0.0.1', () => r(s)); });
const browser = await chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--no-sandbox', '--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 1280, height: 720}}); page.setDefaultTimeout(900000);
const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
try {
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded', timeout: 180000});
  await page.waitForFunction(() => typeof createWorld === 'function' && typeof screen !== 'undefined' && screen === 'title', null, {timeout: 180000});
  await page.evaluate(() => { let s = 0x7a11; Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; document.getElementById('worldName').value = 'VolcTest'; createWorld(); });
  await page.waitForFunction(() => typeof started !== 'undefined' && started && screen !== 'loading', null, {timeout: 600000});
  await page.waitForFunction(() => window.__v1300 && __v1300.built > 0, null, {timeout: 60000}).catch(() => {});
  await page.waitForTimeout(2500);
  const A = await page.evaluate(() => { const U = __v1300, L = U.list(), sp = U.spawnXZ(); const out = [];
    for (const s of L) { const a = U.anchor(s.i, true), t = U.surf(s.x, s.z), below = getB(s.x, a.vent - 1, s.z);
      out.push({i: s.i, k: s.k, x: s.x, z: s.z, h: s.h, vent: a.vent, surf: t, below, rim: a.rim, rimMax: a.rimMax, base: a.base, dSp: Math.hypot(s.x - sp[0], s.z - sp[1])}); }
    const c = current.c229; return {err: U.err, on: U.on, built: U.built, sites: L.length, out, c229: c ? Array.from(c) : null, tag: c ? c.__v1300 : undefined, leg: current.c229legacy || null, sp}; });
  ok(!A.err, 'no V1300 errors (' + A.err + ')'); ok(A.on === 1, 'V1300 active on the UK map'); ok(A.built > 1000, 'Ben Glencraft built (' + A.built + ' columns)');
  const cr = A.out.filter(o => o.k === 'v'), sv = A.out.find(o => o.k === 'S');
  ok(cr.length >= 38, '38+ eruptable lava craters (' + cr.length + ')');
  const bad = A.out.filter(o => Math.abs(o.surf - o.vent) > 2 || !o.below || o.rim <= o.vent);
  ok(bad.length === 0, 'every volcano sits on its terrain: vent within 2 blocks of the ground, solid under it, rim above (' + bad.map(b => b.i).join(',') + ')');
  ok(A.out.every(o => o.rimMax - o.base >= 3), 'every site is a raised cone (rim above its foot)');
  ok(A.tag !== undefined && A.c229 && A.out.some(o => Math.hypot(o.x + .5 - A.c229[0], o.z + .5 - A.c229[2]) < 1), 'current.c229 is a real crater anchor');
  ok(!A.out.some(o => Math.hypot(o.x - 605, o.z - 259) < 30), 'nothing erupts from the old floating stamp spot (605,259)');
  ok(!A.leg || Math.hypot(A.leg[0] - A.c229[0], A.leg[2] - A.c229[2]) > 3, 'old stamp kept only as c229legacy (' + JSON.stringify(A.leg) + ')');
  ok(sv && sv.dSp >= 120, 'Ben Glencraft is >= 120 from spawn (' + (sv && sv.dSp.toFixed(1)) + ')');
  ok(sv && cr.every(o => sv.h > o.h && sv.rimMax > o.rimMax), 'Ben Glencraft is taller than every other volcano (h ' + (sv && sv.h) + ', top y ' + (sv && sv.rimMax) + ')');
  { const L = await page.evaluate(() => __v1300.list()); const S = L.find(q => q.k === 'S'); ok(L.every(q => q.k === 'S' || S.r > q.r), 'Ben Glencraft is wider than every other volcano (r ' + S.r + ')'); }
  const R = await page.evaluate(() => { const U = __v1300, sp = U.spawnXZ(), PR = U.PROT_R; const lavaNear = () => { let n = 0; for (let x = Math.floor(sp[0] - PR + 8); x <= sp[0] + PR - 8; x++) for (let z = Math.floor(sp[1] - PR + 8); z <= sp[1] + PR - 8; z++) { if (Math.hypot(x - sp[0], z - sp[1]) > PR - 8) continue; for (let y = SEA - 3; y < H - 1; y++) if (world[idx(x, y, z)] === T.LAVA) n++; } return n; };
    const l0 = lavaNear(); U.speed = 0; const ok0 = U.erupt('spawn'); let n = 0, sum = 0, mx = 0, shk = 0; const ts = [];
    while (U.state() && n < 30000) { const a = performance.now(); U.tick(0.05); const d = performance.now() - a; sum += d; ts.push(d); if (d > mx) mx = d; n++; if (shakeAmp > shk) shk = shakeAmp; }
    ts.sort((p, q) => p - q); const l1 = lavaNear(); let pad = 0; for (let x = Math.floor(sp[0]) - 12; x <= sp[0] + 12; x++) for (let z = Math.floor(sp[1]) - 12; z <= sp[1] + 12; z++) for (let y = SEA - 3; y < H - 1; y++) if (world[idx(x, y, z)] === T.LAVA) pad++;
    const phases = U.phases.slice(), reach = U.maxReach, lava = U.lava; const r = __c242.erupt(true), blue0 = {r, st: U.state()}; const ser = serialize();
    return {ok0, n, avg: sum / n, p95: ts[Math.floor(ts.length * 0.95)], mx, phases, reach, lava, cooled: U.cooled, l0, l1, pad, shk, shakeMax: U.shakeMax, cap: U.SHAKE_CAP, bombs: __c242.bombs, c242: current.c242, c279: window.__c279 ? __c279.on : 0, err: U.err, blue0, ser: !!(ser && ser.v1300)}; });
  console.log(JSON.stringify(Object.assign({}, R, {phases: R.phases.join(',')})));
  ok(R.ok0, 'Ben Glencraft erupts');
  const want = ['sink', 'surge', 'gush', 'pour', 'flood', 'cool']; let k = -1; ok(want.every(w => { const j = R.phases.indexOf(w); const g = j > k; k = j; return g; }), 'phases in order sink > surge > gush > pour > flood > cool (' + R.phases.join(',') + ')');
  ok(R.reach > 60, 'lava floods more than 60 blocks from the crater (' + R.reach + ')');
  ok(R.l1 <= R.l0 && R.pad === 0, 'no lava inside the spawn pad / village disc (' + R.l0 + ' -> ' + R.l1 + ', pad ' + R.pad + ')');
  ok(R.cooled > 100, 'lava cools to magma / basalt / obsidian (' + R.cooled + ')');
  ok(R.bombs === 0 && !R.c242 && !R.c279, 'no lava bombs, old explosive eruption and Pompeii flash stay off');
  ok(R.shk <= R.cap + 1e-9 && R.shakeMax <= R.cap, 'shake stays subtle (max ' + R.shk.toFixed(4) + ' <= ' + R.cap + ')');
  ok(R.avg < 2 && R.p95 < 2, 'per-frame volcano cost well under +2 ms (avg ' + R.avg.toFixed(3) + ', p95 ' + R.p95.toFixed(3) + ' ms)');
  ok(R.blue0.r && R.blue0.st && R.blue0.st.blue, 'Element 115 blue eruption still starts through C242 -> V1300');
  ok(R.ser, 'save carries the volcano state');
  ok(!R.err, 'no V1300 errors after the eruption');
  ok(!perr.some(e => /v1300/i.test(e)), 'no page errors from V1300');
} catch (e) { fail++; console.log('FAIL exception', String(e.stack || e).slice(0, 400)); }
await browser.close(); server.close();
console.log(`v1300-volcano: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
