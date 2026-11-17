// v1.2.92: on new Highlands worlds, the three keeps and the rocket must not
// appear inside the spawn-island exclusion (I.R + 50). Counts stay 3 + 1.
// Fails on 1.2.91 (yielded generate dropped the castle-island height field,
// so keeps and the rocket fallback landed at spawn). Passes after the fix.
//
// Usage: node tests/v1292-spawn-structures.mjs [indexDir]
// Optional: SEEDS=7,1,2  PORT=8970
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {extname, join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import pkg from '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {chromium} = pkg;

const here = dirname(fileURLToPath(import.meta.url));
const defaultDir = resolve(here, '..');
const indexDir = resolve(process.argv[2] || defaultDir);
const seeds = (process.env.SEEDS || '7,1,2,3,11,13,17,19,23,29,31,42,66,99,123,256,777,888,2026,9999,12345')
  .split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
if (seeds.length < 20 && !process.env.SEEDS) {
  console.error('need 20+ seeds, got', seeds.length);
  process.exit(2);
}

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

const PORT = Number(process.env.PORT || 8970);
const server = await serve(indexDir, PORT);
const url = `http://127.0.0.1:${PORT}/index.html?nosw=1`;
console.log('v1292-spawn-structures', url, 'seeds', seeds.length);

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
  await page.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title', null, {timeout: 180000});
  try {
    await page.evaluate(async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
      } catch (_) {}
    });
  } catch (_) {}
}

await boot();

const failures = [];
let nOk = 0;
for (let i = 0; i < seeds.length; i++) {
  const seed = seeds[i];
  if (i) await boot();
  const r = await page.evaluate(async (seed) => {
    current = {
      id: 't1292-' + seed, name: 'SpawnTest', mode: 'survival', created: Date.now(),
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
    const spawn = (typeof g9findSpawn === 'function' ? g9findSpawn() : null) || (typeof g9spawn !== 'undefined' ? g9spawn : null);
    const isl = (window.__c101 && __c101.isl) ? {cx: __c101.isl.cx, cz: __c101.isl.cz, R: __c101.isl.R} : {cx: W >> 1, cz: D >> 1, R: 40};
    const exclR = (isl.R || 40) + 50;
    const kinds = (g9castles || []).map(c => c[0]);
    const castles = (g9castles || []).map(c => {
      const dIsl = Math.hypot(c[1] - isl.cx, c[2] - isl.cz);
      const dSp = spawn ? Math.hypot(c[1] - spawn[0], c[2] - spawn[2]) : dIsl;
      return {k: c[0], x: c[1], z: c[2], dIsl: +dIsl.toFixed(1), dSpawn: +dSp.toFixed(1), inside: dIsl < exclR || dSp < exclR};
    });
    // Use the game's own finder when the fix exported it; otherwise the
    // 1.2.91 findSpot (farms, else a pad 40 blocks from map centre — on the spawn island).
    let rocket = null;
    if (window.__c299 && typeof __c299.findSpot === 'function') {
      const s = __c299.findSpot();
      if (s) rocket = {x: s.x, z: s.z, y: s.y};
    } else {
      const F = (window.__c113 && __c113.farmsList && __c113.farmsList()) || [];
      const tries = F.length ? F : [{x0: (W >> 1) + 40, z0: (D >> 1) + 40}];
      const topAt = (x, z) => (window.__c299 && __c299.topAt) ? __c299.topAt(x, z) : 0;
      outer: for (const f of tries) {
        const cx = f.x0 + 3, cz = f.z0 + 6;
        for (let rr = 26; rr < 90; rr += 6) for (let a = 0; a < 6.283; a += 0.35) {
          const x = Math.round(cx + Math.cos(a) * rr), z = Math.round(cz + Math.sin(a) * rr);
          if (x < 12 || z < 12 || x > W - 12 || z > D - 12) continue;
          let lo = 1e9, hi = -1e9, ok = true;
          for (let dx = -6; dx <= 6 && ok; dx += 2) for (let dz = -6; dz <= 6; dz += 2) {
            const t = topAt(x + dx, z + dz);
            if (world[idx(x + dx, t - 1, z + dz)] === T.WATER || t <= SEA + 2) { ok = false; break; }
            lo = Math.min(lo, t); hi = Math.max(hi, t);
          }
          if (ok && hi - lo <= 1) { rocket = {x, z, y: hi}; break outer; }
        }
      }
    }
    if (rocket) {
      rocket.dIsl = +Math.hypot(rocket.x - isl.cx, rocket.z - isl.cz).toFixed(1);
      rocket.dSpawn = spawn ? +Math.hypot(rocket.x - spawn[0], rocket.z - spawn[2]).toFixed(1) : rocket.dIsl;
      rocket.inside = rocket.dIsl < exclR || rocket.dSpawn < exclR;
    }
    return {
      seed, exclR, isl, spawn, kinds, castles, nCastles: castles.length,
      rocket, nFarms: (window.__c113 && __c113.farms) || 0,
      version: (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : null)
    };
  }, seed);

  if (r.err) {
    failures.push({seed, why: r.err});
    console.log('FAIL seed', seed, r.err);
    continue;
  }
  const want = ['human', 'mossy', 'black'];
  const got = (r.kinds || []).slice().sort().join(',');
  const expect = want.slice().sort().join(',');
  const badC = (r.castles || []).filter(c => c.inside);
  const issues = [];
  if (r.nCastles !== 3) issues.push('expected 3 castles, got ' + r.nCastles + ' ' + JSON.stringify(r.castles));
  if (got !== expect) issues.push('kinds ' + got + ' != ' + expect);
  if (badC.length) issues.push('castles inside spawn exclusion ' + JSON.stringify(badC));
  if (!r.rocket) issues.push('no rocket placed');
  else if (r.rocket.inside) issues.push('rocket inside spawn exclusion ' + JSON.stringify(r.rocket));
  if (issues.length) {
    failures.push({seed, why: issues.join('; '), r});
    console.log('FAIL seed', seed, issues.join('; '));
  } else {
    nOk++;
    console.log('ok seed', seed, 'castles', r.castles.map(c => c.k + '@' + c.x + ',' + c.z + ' d=' + c.dSpawn).join(' '),
      'rocket', r.rocket.x + ',' + r.rocket.z, 'd=' + r.rocket.dSpawn, 'farms', r.nFarms);
  }
}

await browser.close();
server.close();

if (failures.length || nOk !== seeds.length) {
  console.log('FAIL v1292-spawn-structures', nOk + '/' + seeds.length, 'failures', failures.length);
  process.exit(1);
}
console.log('PASS v1292-spawn-structures', nOk + '/' + seeds.length, 'seeds, 3 keeps + rocket outside spawn exclusion');
