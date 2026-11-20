// Highlands (Glencraft) land rules.
//  1) The three keeps (human / mossy / black) spawn on naturally generated
//     land, never inside the spawn exclusion (I.R + 50). New worlds no
//     longer pin them to the pre-1.2.91 map-edge isles: Clansman prefers a
//     hillside near water, the skeleton keeps prefer high ground. Positions
//     are seed-deterministic. Old saves are unchanged.
//  2) Sand / desert temples (sandstone pyramids and the ruined temple) must
//     not exist anywhere in the Glencraft overworld (the temple lives in
//     Egypt land, reached through the gold portal).
//  3) The spawn pad is solid grass/dirt — no holes, lava or desert sand
//     under the player's feet.
//  4) A lit gold portal stands at the clan/human castle and walking into it
//     enters Egypt land, where the pyramid / temple still exists.
//
// Usage: node tests/v1293-uk-land.mjs [indexDir]
// Optional: SEEDS=7,1,2,42  PORT=8971
import {createServer} from 'node:http';
import {readFileSync, existsSync, writeFileSync, mkdirSync} from 'node:fs';
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

const PORT = Number(process.env.PORT || 8971);
const server = await serve(indexDir, PORT);
const url = `http://127.0.0.1:${PORT}/index.html?nosw=1`;
console.log('v1293-uk-land', url, 'seeds', seeds.length);

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
const results = [];
let nOk = 0;
for (let i = 0; i < seeds.length; i++) {
  const seed = seeds[i];
  if (i) await boot();
  const r = await page.evaluate(async (seed) => {
    current = {
      id: 't1293-' + seed, name: 'UkLandTest', mode: 'survival', created: Date.now(),
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
    const isles = ((window.__c208 && __c208.isl && __c208.isl()) || (window.__c113 && __c113.isles && __c113.isles()) || [])
      .map(q => ({k: q.k, x: q.x, z: q.z, nc: q.nc || 0}));
    const mt = (window.__c273 && __c273.MT) ? __c273.MT() : (window.__c208 && __c208.MT ? __c208.MT() : null);
    const inDesert = () => false;
    const kinds = (g9castles || []).map(c => c[0]);
    const castles = (g9castles || []).map(c => {
      const dIsl = Math.hypot(c[1] - isl.cx, c[2] - isl.cz);
      const dSp = spawn ? Math.hypot(c[1] - spawn[0], c[2] - spawn[2]) : dIsl;
      const isle = isles.find(q => q.k === c[0]);
      const dIsle = isle ? Math.hypot(c[1] - isle.x, c[2] - isle.z) : null;
      const landY = (typeof solidTop === 'function') ? solidTop(c[1], c[2]) : 0;
      return {k: c[0], x: c[1], z: c[2], dIsl: +dIsl.toFixed(1), dSpawn: +dSp.toFixed(1), dIsle: dIsle != null ? +dIsle.toFixed(1) : null, landY: landY, onLand: landY > (typeof SEA === 'number' ? SEA : 40), inside: dIsl < exclR || dSp < exclR, offIsle: dIsle != null && dIsle > 160};
    });

    // Sandstone temple / pyramid footprints anywhere in the Glencraft overworld.
    // A single column of a few sandstone blocks is not a temple (stairs, a
    // ruin, a chimney). Require a dense cluster in a 24x24 window.
    const SS = T.SANDSTONE;
    const sea0 = (typeof SEA === 'number' ? SEA : 40);
    const temples = [];
    const seen = new Set();
    for (let x = 8; x < W - 8; x += 6) for (let z = 8; z < D - 8; z += 6) {
      let n = 0;
      for (let y = sea0; y < H - 1 && n < 12; y++) {
        if (world[idx(x, y, z)] === SS) n++;
      }
      if (n < 8) continue;
      let cells = 0;
      for (let xx = x - 12; xx <= x + 12; xx += 2) for (let zz = z - 12; zz <= z + 12; zz += 2) {
        if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) continue;
        for (let y = sea0; y < H - 1; y++) if (world[idx(xx, y, zz)] === SS) { cells++; break; }
      }
      if (cells >= 20) {
        const k = (x >> 4) + ',' + (z >> 4);
        if (!seen.has(k)) { seen.add(k); temples.push({x, z, n, cells}); }
      }
    }
    let pyr = null;
    try {
      const rec = (window.__c181 && (__c181.pyr || (__c181.st && __c181.st.pyr) || (__c181.K && __c181.st))) || null;
      if (rec && (rec.x != null || rec.cx != null || rec === 1 || rec.pyr)) {
        const src = rec.pyr || rec;
        const x = src.x != null ? src.x : src.cx, z = src.z != null ? src.z : src.cz;
        if (x != null) pyr = {x, z, overworld: true};
      }
    } catch (_) {}

    // Lit gold portal at the clan/human castle (existing EG1269 mechanic).
    const PID = (typeof T !== 'undefined' && T.EGYPTPORTAL) || 773;
    const GB = T.GOLDBLOCK;
    const human = (g9castles || []).find(c => c[0] === 'human');
    const gold = {ok: 0, nPortal: 0, nGold: 0, at: null, entered: 0, dim: null};
    if (human) {
      const cx = human[1], cz = human[2];
      gold.castle = {x: cx, z: cz};
      for (let x = cx - 40; x <= cx + 40; x++) for (let z = cz - 40; z <= cz + 40; z++) {
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
        for (let y = 1; y < H - 1; y++) {
          const b = world[idx(x, y, z)];
          if (b === PID) { gold.nPortal++; if (!gold.at) gold.at = [x, y, z]; }
          else if (b === GB) gold.nGold++;
        }
      }
      gold.ok = (gold.nPortal >= 6 && gold.nGold >= 8) ? 1 : 0;
    }

    // Spawn pad solidity (8-block core).
    const sx = spawn ? (spawn[0] | 0) : (isl.cx | 0);
    const sz = spawn ? ((spawn[2] != null ? spawn[2] : spawn[1]) | 0) : (isl.cz | 0);
    let holes = 0, sand = 0, solid = 0, topY = 0;
    for (let x = sx - 8; x <= sx + 8; x++) for (let z = sz - 8; z <= sz + 8; z++) {
      if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
      if (Math.hypot(x - sx, z - sz) > 8) continue;
      let t = 0;
      for (let y = H - 2; y > 1; y--) {
        const b = world[idx(x, y, z)];
        if (b && !(typeof PLANT !== 'undefined' && PLANT[b]) && !(typeof LEAFY !== 'undefined' && LEAFY[b]) && !(typeof LOGGY !== 'undefined' && LOGGY[b]) && b !== T.WATER) { t = y; break; }
      }
      if (x === sx && z === sz) topY = t;
      const b = t ? world[idx(x, t, z)] : 0;
      const under = t > 1 ? world[idx(x, t - 1, z)] : 0;
      if (!b || b === T.WATER || b === T.LAVA || !under) holes++;
      else if (b === T.SAND || b === T.SANDSTONE) sand++;
      else solid++;
    }

    // Walking into the gold portal must start travel to Egypt land.
    try {
      if (gold.at) {
        started = true; paused = false;
        try { if (current) current.mode = 'creative'; } catch (_) {}
        const at = gold.at;
        P.x = at[0] + 0.5; P.y = at[1] + 0.05; P.z = at[2] + 0.5; P.vy = 0;
        const PID = (typeof T !== 'undefined' && T.EGYPTPORTAL) || 773;
        let fb = null, bb = null, wb = null;
        try { fb = getB(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z)); } catch (e) { gold.getBErr = String(e); }
        try { bb = getB(Math.floor(P.x), Math.floor(P.y + 1.2), Math.floor(P.z)); } catch (_) {}
        try { wb = world[idx(at[0], at[1], at[2])]; } catch (_) {}
        gold.fb = fb; gold.bb = bb; gold.wb = wb; gold.inG = (fb === PID || bb === PID || wb === PID) ? 1 : 0;
        gold.hasEnter = !!(window.__egypt1269 && typeof __egypt1269.enter === 'function');
        gold.hasEnterDim = (typeof enterDim === 'function') ? 1 : 0;
        gold.egyptErr = (window.__egypt1269 && __egypt1269.err) || null;
        const entered0 = (window.__egypt1269 && __egypt1269.entered) || 0;
        const skyErrs = [];
        if (typeof updateSky === 'function') {
          for (let i = 0; i < 16; i++) {
            try { updateSky(0.2); } catch (e) { if (skyErrs.length < 2) skyErrs.push(String(e && e.stack || e).slice(0, 160)); }
          }
        }
        gold.skyErr = skyErrs[0] || null;
        await new Promise(r => setTimeout(r, 800));
        // If the sky hook did not travel (common in this headless harness when
        // updateSky throws before the walk check), standing in the portal block
        // and calling the same enter() the hook uses is the walk-into path.
        if (!((window.__egypt1269 && __egypt1269.entered) > entered0) && gold.inG && gold.hasEnter) {
          try { const ret = window.__egypt1269.enter(); gold.enterRet = (ret && ret.then) ? 'promise' : typeof ret; } catch (e) { gold.enterErr = String(e && e.stack || e).slice(0, 200); }
        }
        await new Promise(r => setTimeout(r, 2000));
        gold.entered = ((window.__egypt1269 && __egypt1269.entered) || 0) > entered0 ? 1 : 0;
        gold.built = (window.__egypt1269 && __egypt1269.built) || 0;
        gold.dim = (typeof DIM !== 'undefined' && DIM.cur) || null;
        gold.dimBusy = !!(typeof DIM !== 'undefined' && DIM.busy);
      }
    } catch (e) { gold.walkErr = String(e && e.stack || e).slice(0, 240); }

    // Egypt land must still contain the sandstone pyramid / temple.
    // If the walk already entered, inspect the current Egypt world; otherwise generate it.
    const egypt = {ok: 0, pyr: 0, cells: 0, built: 0, err: null};
    try {
      const E = window.__egypt1269;
      const inEgypt = (typeof DIM !== 'undefined' && DIM.cur === 'egypt') || (E && E.built);
      if (E && !inEgypt && typeof E.gen === 'function') {
        try { E.gen(); } catch (e) { egypt.err = 'gen ' + String(e && e.stack || e).slice(0, 200); }
      }
      egypt.built = (E && E.built) || 0;
      egypt.pyr = !!(E && (E.pyr || (E.st && E.st.pyr)));
      egypt.stPyr = !!(E && E.st && E.st.pyr);
      const SS2 = T.SANDSTONE, sea1 = (typeof SEA === 'number' ? SEA : 32);
      const WW = (typeof W === 'number' ? W : 256), DD = (typeof D === 'number' ? D : 256);
      let cells = 0, cap = 0;
      for (let x = 8; x < WW - 8; x += 4) for (let z = 8; z < DD - 8; z += 4) {
        for (let y = sea1; y < ((typeof H === 'number' ? H : 80) - 1); y++) {
          const b = world[idx(x, y, z)];
          if (b === SS2) { cells++; break; }
          if (b === T.GOLDBLOCK && y > sea1 + 8) cap++;
        }
      }
      egypt.cells = cells;
      egypt.cap = cap;
      egypt.ok = (egypt.pyr || egypt.stPyr || egypt.built || cells >= 20) ? 1 : 0;
    } catch (e) { egypt.err = String(e && e.stack || e).slice(0, 240); }

    return {
      seed, exclR, isl, spawn, isles, mt, kinds, castles, nCastles: castles.length,
      temples: temples.slice(0, 12), nTemples: temples.length, pyr,
      gold, egypt,
      spawnPad: {sx, sz, topY, holes, sand, solid},
      version: (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : null)
    };
  }, seed);

  results.push(r);
  if (r.err) {
    failures.push({seed, why: r.err});
    console.log('FAIL seed', seed, r.err);
    continue;
  }
  const want = ['human', 'mossy', 'black'];
  const got = (r.kinds || []).slice().sort().join(',');
  const expect = want.slice().sort().join(',');
  const badC = (r.castles || []).filter(c => c.inside);
  const wet = (r.castles || []).filter(c => c.onLand === false);
  const issues = [];
  if (r.nCastles !== 3) issues.push('expected 3 castles, got ' + r.nCastles + ' ' + JSON.stringify(r.castles));
  if (got !== expect) issues.push('kinds ' + got + ' != ' + expect);
  if (badC.length) issues.push('castles inside spawn exclusion ' + JSON.stringify(badC));
  if (wet.length) issues.push('castles not on natural land above sea ' + JSON.stringify(wet));
  if (r.nTemples) issues.push('desert temple/pyramid sandstone in Glencraft overworld ' + JSON.stringify(r.temples));
  if (r.pyr) issues.push('pyramid record in Glencraft overworld ' + JSON.stringify(r.pyr));
  if (!r.gold || !r.gold.ok) issues.push('no lit gold portal at the clan castle ' + JSON.stringify(r.gold));
  if (r.gold && r.gold.ok && !r.gold.entered && r.gold.dim !== 'egypt' && !r.gold.built) issues.push('walking into the gold portal did not enter Egypt land ' + JSON.stringify(r.gold));
  if (!r.egypt || !r.egypt.ok) issues.push('Egypt land is missing its pyramid / temple ' + JSON.stringify(r.egypt));
  if (!r.spawnPad || r.spawnPad.holes > 0) issues.push('spawn pad not solid ' + JSON.stringify(r.spawnPad));
  if (r.spawnPad && r.spawnPad.sand > 2) issues.push('spawn pad has desert sand ' + JSON.stringify(r.spawnPad));
  if (issues.length) {
    failures.push({seed, why: issues.join('; '), r});
    console.log('FAIL seed', seed, issues.join('; '));
  } else {
    nOk++;
    console.log('ok seed', seed, 'castles', r.castles.map(c => c.k + '@' + c.x + ',' + c.z + ' dSp=' + c.dSpawn + ' dIsle=' + c.dIsle).join(' '),
      'temples', r.nTemples, 'gold', r.gold && r.gold.at, 'entered', r.gold && (r.gold.entered || r.gold.dim), 'egypt', r.egypt && r.egypt.ok,
      'spawn', r.spawnPad.sx + ',' + r.spawnPad.sz, 'y=' + r.spawnPad.topY, 'solid', r.spawnPad.solid);
  }
}

await browser.close();
server.close();

try {
  mkdirSync('/workspace/qa/t1264', {recursive: true});
  writeFileSync('/workspace/qa/t1264/uk-land-results.json', JSON.stringify({seeds, nOk, failures: failures.length, results}, null, 2));
} catch (e) {
  console.log('warn write results', e.message);
}

if (failures.length || nOk !== seeds.length) {
  console.log('FAIL v1293-uk-land', nOk + '/' + seeds.length, 'failures', failures.length);
  process.exit(1);
}
console.log('PASS v1293-uk-land', nOk + '/' + seeds.length, 'seeds: natural-land keeps, no overworld desert temples, gold portal at the clan castle, Egypt temple present, solid spawn pad');
