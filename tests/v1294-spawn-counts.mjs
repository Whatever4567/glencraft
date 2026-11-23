// Garrison / NPC spawn counts vs the pre-1.2.91 (1.2.68 / 1.2.90) baseline.
// Git history: GLX-CASTLE1268 introduced MAX {black:100, mossy:50, human:25},
// LIVE 28 concurrent garrison skeletons, HUMAN_LIVE 25. Those constants did
// not change in 1.2.91 — the 1.2.91 regression moved the keeps inland, so the
// full garrisons appeared next to spawn. This test locks the published caps
// and asserts that, with keeps back on the map-edge isles, almost none of
// those units materialize next to spawn.
//
// Usage: node tests/v1294-spawn-counts.mjs [indexDir]
// Optional: SEEDS=7,29,42  PORT=8974
import {createServer} from 'node:http';
import {readFileSync, existsSync, writeFileSync, mkdirSync} from 'node:fs';
import {extname, join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import pkg from '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {chromium} = pkg;

const here = dirname(fileURLToPath(import.meta.url));
const defaultDir = resolve(here, '..');
const indexDir = resolve(process.argv[2] || defaultDir);
const seeds = (process.env.SEEDS || '7,29,42,1,13')
  .split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);

// Pre-regression baseline, taken from 1.2.68 / 1.2.90 (unchanged through 1.2.93).
const BASELINE = {black: 100, mossy: 50, human: 25, live: 28, humanLive: 25};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.bin': 'application/octet-stream',
  '.gz': 'application/gzip',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

function serve(root, port) {
  const server = createServer((req, res) => {
    try {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = join(root, p);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      const data = readFileSync(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    } catch (e) {
      res.writeHead(e.code === 'ENOENT' ? 404 : 500);
      res.end(String(e.message || e));
    }
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(server)));
}

if (!existsSync(join(indexDir, 'index.html'))) {
  console.error('no index.html in', indexDir);
  process.exit(2);
}

const PORT = Number(process.env.PORT || 8974);
const server = await serve(indexDir, PORT);
const url = `http://127.0.0.1:${PORT}/index.html?nosw=1`;
console.log('v1294-spawn-counts', url, 'seeds', seeds.length, 'baseline', BASELINE);

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
const page = await context.newPage();
page.setDefaultTimeout(600000);
page.on('pageerror', e => console.log('PAGEERROR', String(e.stack || e).slice(0, 300)));

async function boot() {
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 180000});
  await page.evaluate(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    } catch (_) {}
  });
  await page.waitForFunction(() => typeof generate === 'function' && typeof T !== 'undefined', {timeout: 180000});
}

let nOk = 0;
const failures = [];
const results = [];
await boot();

for (let i = 0; i < seeds.length; i++) {
  const seed = seeds[i];
  if (i) await boot();
  const r = await page.evaluate(async (seed) => {
    current = {
      id: 't1294-' + seed, name: 'SpawnCountTest', mode: 'survival', created: Date.now(),
      l94: true, g12: true, g15: true, g21: true, g24: true, g25: true,
      g35: true, g36: true, g42: true, g89: true, newCastles: true
    };
    try { if (typeof ORE18 !== 'undefined') ORE18 = true; } catch (_) {}
    try { if (window.__islandLayout) window.__islandLayout(864); } catch (e) { return {err: 'layout ' + e}; }
    try { g9Island = true; } catch (_) {}
    const nw = (typeof ISL_W !== 'undefined' ? ISL_W : 864);
    try { NEW_W = nw; setWorldSize(nw); } catch (e) { return {err: 'size ' + e}; }
    gSeed = 0;
    genVer = (typeof GEN9 !== 'undefined' ? GEN9 : 9);
    cityGen = false;
    try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {}
    try {
      let _s = (Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0 || 1;
      Math.random = function () {
        _s ^= _s << 13; _s >>>= 0;
        _s ^= _s >>> 17;
        _s ^= _s << 5; _s >>>= 0;
        return _s / 4294967296;
      };
      window.__forceSeed = seed;
      if (window.__glenLoad && __glenLoad.generate) {
        try { await __glenLoad.boot('hash'); } catch (_) {}
        await __glenLoad.generate();
      } else generate();
    } catch (e) {
      return {err: 'generate ' + String(e && e.stack || e).slice(0, 500)};
    }
    const C = window.__castle1268 || {};
    const caps = {
      black: C.MAX && C.MAX.black, mossy: C.MAX && C.MAX.mossy, human: C.MAX && C.MAX.human,
      live: C.LIVE, humanLive: C.HUMAN_LIVE
    };
    const spawn = (typeof g9findSpawn === 'function' ? g9findSpawn() : null) || (typeof g9spawn !== 'undefined' ? g9spawn : null);
    const sx = spawn ? spawn[0] : (W >> 1), sz = spawn ? (spawn[2] != null ? spawn[2] : spawn[1]) : (D >> 1);
    const exclR = 90;
    /* GB6 (t1342): castles stand at their spots on the player's map; the black castle is in the English Midlands and on
       1x worlds it is built off the base grid by the GB6 builder (listed by __gb6.castles(), not g9castles) */
    const G6 = (window.__gb6 && __gb6.on && __gb6.on()) ? __gb6 : null;
    const CS = G6 ? G6.castles() : ((typeof g9castles !== 'undefined' && g9castles) || []);
    const keeps = CS.filter(c => c[0] === 'human' || c[0] === 'mossy' || c[0] === 'black').map(c => ({k: c[0], x: c[1], z: c[2], dSp: Math.hypot(c[1] - sx, c[2] - sz), off: c[1] < 0 || c[2] < 0 || c[1] >= W || c[2] >= D}));

    started = true; paused = false;
    P.x = sx + 0.5; P.z = sz + 0.5; P.y = 60; P.vy = 0;
    try { if (C.materialize) C.materialize(2.5); } catch (e) { /* */ }
    try { if (C.ensureHumans) C.ensureHumans(); } catch (e) { /* */ }
    const nearSpawn = {skeleton: 0, blackskel: 0, clansman: 0, other: 0};
    try {
      for (const a of (mobs || [])) {
        if (!a || !a.g) continue;
        const d = Math.hypot(a.g.position.x - sx, a.g.position.z - sz);
        if (d > exclR) continue;
        if (a.kind === 'skeleton' || a.kind === 'blackskel' || a.kind === 'clansman') nearSpawn[a.kind]++;
        else nearSpawn.other++;
      }
    } catch (_) {}

    const atCastle = {};
    for (const k of ['black', 'mossy', 'human']) {
      const c = keeps.find(q => q.k === k);
      if (!c) { atCastle[k] = {missing: 1}; continue; }
      P.x = c.x + 0.5; P.z = c.z + 0.5; P.y = 60;
      try { if (C.materialize) C.materialize(2.5); } catch (_) {}
      try { if (C.ensureHumans) C.ensureHumans(); } catch (_) {}
      const kind = k === 'black' ? 'blackskel' : k === 'mossy' ? 'skeleton' : 'clansman';
      let n = 0, nGarr = 0;
      try {
        for (const a of (mobs || [])) {
          if (!a || !a.g || a.kind !== kind) continue;
          if (Math.hypot(a.g.position.x - c.x, a.g.position.z - c.z) < 56) {
            n++;
            if (a.__1268 || a.garrison || a.home) nGarr++;
          }
        }
      } catch (_) {}
      atCastle[k] = {x: c.x, z: c.z, dSp: +c.dSp.toFixed(1), live: n, garr: nGarr};
    }

    return {
      seed, caps, nearSpawn, atCastle, keeps,
      nMobs: (typeof mobs !== 'undefined' && mobs) ? mobs.length : 0,
      version: (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : null)
    };
  }, seed);

  results.push(r);
  /* an off-grid keep must really be built and garrisoned: walk there, let the GB6 builder and garrison timers run */
  const offK = (r.keeps || []).filter(q => q.off);
  for (const q of offK) {
    await page.evaluate(([k, x, z]) => { paused = false; if (!(window.__gb6 && __gb6.go && __gb6.go(k))) { P.x = x + 0.5; P.z = z + 30.5; P.y = 80; P.vy = 0; } }, [q.k, q.x, q.z]);
    await page.waitForTimeout(12000);
    q.check = await page.evaluate(([k, x, z]) => { const C = window.__castle1268; try { if (C && C.materialize) C.materialize(2.5); } catch (_) {} const R = C && C.ROSTER && C.ROSTER[k]; const slots = R && R.c && Math.hypot(R.c.x - x, R.c.z - z) < 60 ? R.slots.filter(s => s.alive).length : 0; const b = window.__gb6 && __gb6.built && __gb6.built[k]; const kind = k === 'black' ? 'blackskel' : k === 'mossy' ? 'skeleton' : 'clansman'; let n = 0;
      for (const a of (mobs || [])) if (a && a.g && a.kind === kind && Math.hypot(a.g.position.x - x, a.g.position.z - z) < 90) n++;
      return {blocks: b ? b.blocks : 0, at: b ? [b.X, b.Z, b.gy] : null, live: n, slots, garrison: Math.max(n, slots), topUp: window.__gb6 && __gb6.topUp && __gb6.topUp[k] || null}; }, [q.k, q.x, q.z]);
    console.log('off-grid keep', q.k, JSON.stringify(q.check));
  }
  if (r.err) {
    failures.push({seed, why: r.err});
    console.log('FAIL seed', seed, r.err);
    continue;
  }
  const issues = [];
  const c = r.caps || {};
  if (c.black !== BASELINE.black || c.mossy !== BASELINE.mossy || c.human !== BASELINE.human)
    issues.push('garrison MAX drifted from 1.2.68/1.2.90 baseline ' + JSON.stringify(c) + ' vs ' + JSON.stringify(BASELINE));
  if (c.live !== BASELINE.live)
    issues.push('LIVE drifted from baseline ' + c.live + ' vs ' + BASELINE.live);
  if (c.humanLive != null && c.humanLive !== BASELINE.humanLive)
    issues.push('HUMAN_LIVE drifted from baseline ' + c.humanLive + ' vs ' + BASELINE.humanLive);
  const ns = r.nearSpawn || {};
  const nearN = (ns.skeleton || 0) + (ns.blackskel || 0) + (ns.clansman || 0);
  if (nearN > 4)
    issues.push('too many garrison NPCs near spawn: ' + JSON.stringify(ns));
  const ac = r.atCastle || {};
  if (ac.black && ac.black.live > BASELINE.live)
    issues.push('black garrison live count exceeds LIVE cap ' + JSON.stringify(ac.black));
  if (ac.mossy && ac.mossy.live > BASELINE.live)
    issues.push('mossy garrison live count exceeds LIVE cap ' + JSON.stringify(ac.mossy));
  if (ac.human && ac.human.live > BASELINE.human)
    issues.push('human folk live count exceeds MAX.human ' + JSON.stringify(ac.human));
  if ((r.keeps || []).length !== 3) issues.push('expected 3 keeps ' + JSON.stringify(r.keeps));
  for (const q of (r.keeps || []).filter(q => q.off)) if (!q.check || !(q.check.blocks > 500) || !(q.check.garrison > 0)) issues.push('off-grid ' + q.k + ' castle not built or not garrisoned ' + JSON.stringify(q.check));
  if (issues.length) {
    failures.push({seed, why: issues.join('; '), r});
    console.log('FAIL seed', seed, issues.join('; '));
  } else {
    nOk++;
    console.log('ok seed', seed, 'caps', c, 'nearSpawn', ns, 'atCastle', ac);
  }
}

await browser.close();
server.close();
try {
  mkdirSync('/workspace/qa/t1267', {recursive: true});
  writeFileSync('/workspace/qa/t1267/spawn-counts.json', JSON.stringify({BASELINE, seeds, nOk, failures: failures.length, results}, null, 2));
} catch (e) {
  console.log('warn write', e.message);
}

if (failures.length || nOk !== seeds.length) {
  console.log('FAIL v1294-spawn-counts', nOk + '/' + seeds.length);
  process.exit(1);
}
console.log('PASS v1294-spawn-counts', nOk + '/' + seeds.length, 'caps match 1.2.68/1.2.90 baseline, garrisons not clustered at spawn');
