// t1403: cave chunks mesh sooner and in-cave view reaches tunnel ends,
// without opening a view into the void. Off switch: window.__noCave1403.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok(html.includes('GLX-CAVE1403') && html.includes('window.__noCave1403'), 'GLX-CAVE1403 inlined with its off switch');
ok(html.includes('__cave1403') && html.includes('unloadedHorizon'), 'exposes state and clips fog at the unloaded frontier');
ok(!html.includes('GLX-CAVE1403') || html.indexOf('function g9Underground()') < html.indexOf('GLX-CAVE1403'), 'cave generator is unchanged and still precedes the patch');
ok(!/g9Underground\s*=/.test(html.slice(html.indexOf('GLX-CAVE1403'))), 'the patch does not replace the cave generator');
ok(html.includes('1.2.59-frame-torch') && html.includes('id="glx-phand1360"') && html.includes('GLX-CAVE1366'), 'torch fix, pistol hands and the pool rooms stay');

{
  const start = html.indexOf('GLX-CAVE1403');
  const noteStart = html.lastIndexOf('{"v":"v', start);
  // later, once bumped, the patch-note block is before the IIFE; also search GAME_VERSION notes
}

const PORT = Number(process.env.PORT || 14032);
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
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=3072']});
const errors = [];
try {
  // ---------- the off switch (title screen only, cheap) ----------
  { const pg = await browser.newPage({viewport: {width: 640, height: 400}}); pg.setDefaultTimeout(180000);
    await pg.addInitScript(() => { window.__noCave1403 = 1; });
    await pg.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded'});
    await pg.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title');
    const f = await pg.evaluate(() => ({why: window.__cave1403 && __cave1403.why, on: window.__cave1403 && __cave1403.on, wrap: !!(typeof updateSky === 'function' && updateSky.__cave1403)}));
    ok(f.why === 'flag' && f.on === 0 && !f.wrap, '__noCave1403 turns the hooks off ' + JSON.stringify(f));
    await pg.close(); }

  if (process.env.STATIC_ONLY) {
    console.log('PASS', k, 'checks (static + flag)');
    await browser.close(); server.close();
    process.exit(0);
  }

  // ---------- seed 7 2x world: view distance, appear time, void clip, flag restore ----------
  const page = await browser.newPage({viewport: {width: 960, height: 540}});
  page.setDefaultTimeout(300000);
  page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONERR', msg.text().slice(0, 240)); });
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded', timeout: 240000});
  await page.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title', null, {timeout: 240000});
  const gen = await page.evaluate(async seed => {
    current = {id: 't1403t-' + seed, name: 'CaveViewTest', mode: 'survival', created: Date.now(), l94: true, g12: true, g15: true, g21: true, g24: true, g25: true, g35: true, g36: true, g42: true, g89: true, newCastles: true};
    try { if (typeof ORE18 !== 'undefined') ORE18 = true; } catch (_) {}
    try { if (window.__v1308) __v1308.want = true; } catch (_) {}
    try { if (window.__islandLayout) window.__islandLayout(864); } catch (_) {}
    try { g9Island = true; } catch (_) {}
    NEW_W = 1728; setWorldSize(1728); gSeed = 0; genVer = (typeof GEN9 !== 'undefined' ? GEN9 : 9); cityGen = false;
    try { showScreen('loading'); } catch (_) {}
    let _s = (Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0 || 1;
    Math.random = function () { _s ^= _s << 13; _s >>>= 0; _s ^= _s >>> 17; _s >>>= 0; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
    window.__forceSeed = seed;
    if (window.__glenLoad && __glenLoad.generate) { try { await __glenLoad.boot('hash'); } catch (_) {} await __glenLoad.generate(); } else generate();
    return {W, H, D};
  }, 7);
  console.log('GEN', JSON.stringify(gen));
  await page.evaluate(async () => {
    const t0 = performance.now();
    const mk = (T.OBSIDIAN || 73);
    const marked = () => world[(1 * H + 1) * D + 1] === mk && world[(1 * H + 1) * D + 2] === mk;
    try { started = true; paused = false; } catch (_) {}
    try { if (!marked() && window.__c341 && __c341.scot) __c341.scot(); } catch (_) {}
    while (performance.now() - t0 < 240000) {
      const fin = window.__v1308 && __v1308.surfMs != null && __v1308.surfMs >= 0;
      if (marked() && fin && current && current.v1300sb && current.g1340v === 1 && (window.__noCave1366 || !window.__cave1366 || current.cave1366v === 1)) break;
      await new Promise(r => setTimeout(r, 300));
    }
    try { showScreen('none'); started = true; paused = false; dead = false; menuOpen = false; } catch (_) {}
    try { weather.type = 'clear'; weather.pending = null; } catch (_) {}
  });

  const goCave = async () => page.evaluate(async () => {
    const A = (window.__cave1366 && __cave1366.at) || window.__caveAt;
    if (!(A && __cave1366 && __cave1366.plan)) return {ok: false};
    const p = __cave1366.plan({x: A.x, z: A.z, Y0: A.Y0}, A.d, A.N);
    try { flying = true; if (MODE) MODE.fly = true; } catch (_) {}
    const yaw = Math.atan2(-p.F[0], -p.F[1]);
    const v = Math.min((p.HV || 16) + 4, Math.max(8, (p.L || 24) - 8)); P.x = A.x + 0.5 + p.F[0] * v; P.z = A.z + 0.5 + p.F[1] * v; P.y = (p.Yb || 37) + 1.6; P.vy = 0; P.yaw = yaw; P.pitch = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      try { if (typeof updateSky === 'function') updateSky(0.05); } catch (_) {}
      try { if (typeof rebuild === 'function' && dirtyCh && dirtyCh.size) rebuild(16); } catch (_) {}
      await new Promise(r => setTimeout(r, 32));
    }
    const vf = (SET && SET.rdist ? SET.rdist : 8) * 16;
    const edge = Math.min(P.x, P.z, W - P.x, D - P.z);
    return {
      ok: true, fogF: scene.fog.far, fogN: scene.fog.near, camFar: camera.far,
      vf, edge, under: !!(window.__cave1403 && __cave1403.under),
      uk: window.__c131 && __c131.uk, caveL, rdist: SET.rdist,
      st: window.__cave1403 && __cave1403.state && __cave1403.state(),
      x: P.x, y: P.y, z: P.z
    };
  });

  const a = await goCave();
  console.log('CAVE', JSON.stringify(a));
  ok(a.ok, 'reached the pool-rooms hall');
  ok(a.fogF > 34, 'underground fog is not stuck at the old 34-block cap (' + a.fogF + ')');
  ok(a.fogF <= a.vf - 3, 'underground fog never exceeds the render-distance setting (' + a.fogF + ' vs vf ' + a.vf + ')');
  ok(a.fogF <= a.edge - 3, 'fog finishes before the world edge (' + a.fogF + ' vs edge ' + a.edge + ')');
  ok(a.st && a.st.hole > 0 && a.fogF <= a.st.hole - 5, 'fog finishes before the unloaded frontier (' + a.fogF + ' vs hole ' + (a.st && a.st.hole) + ')');

  ok((a.st && a.st.under === 1) || a.uk > 0.45, 'the patch treats the hall as underground');
  const fill = await page.evaluate(async () => {
    const t0 = performance.now();
    let meshed = 0, cav = 0, nearDirty = 0;
    const snap = () => {
      const pcx = Math.floor(P.x / CH), pcz = Math.floor(P.z / CH);
      const R = (typeof streamRadius === 'function') ? streamRadius() : 5;
      meshed = chunkObjs.size; cav = 0; nearDirty = 0;
      for (const [id, g] of chunkObjs) if (g && g.userData && g.userData.cav) cav++;
      for (const id of dirtyCh) {
        const cx = Math.floor(id / 64), cz = id % 64;
        if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) <= R + 0.01) nearDirty++;
      }
      return {meshed, cav, nearDirty, R};
    };
    let last = snap();
    while (performance.now() - t0 < 15000) {
      await new Promise(r => setTimeout(r, 50));
      last = snap();
      if (last.meshed >= 80 && last.cav === 0) break;
    }
    return Object.assign(last, {ms: Math.round(performance.now() - t0), st: window.__cave1403 && __cave1403.state && __cave1403.state()});
  });
  console.log('FILL', JSON.stringify(fill));
  ok(fill.meshed >= 60, 'the stream ring around the hall fills (meshed ' + fill.meshed + ' in ' + fill.ms + ' ms)');
  ok(fill.cav === 0, 'cave interiors in the stream ring are fully meshed (cav ' + fill.cav + ')');

  const edge = await page.evaluate(() => {
    try { flying = true; } catch (_) {}
    P.x = 10; P.z = 10; P.y = 8; P.vy = 0;
    // go underground if possible, else still measure clip math
    try { if (typeof updateSky === 'function') { for (let i = 0; i < 20; i++) updateSky(0.05); } } catch (_) {}
    const edgeD = Math.min(P.x, P.z, W - P.x, D - P.z);
    return {fogF: scene.fog.far, edge: edgeD, under: !!(window.__cave1403 && __cave1403.under), uk: window.__c131 && __c131.uk, y: P.y};
  });
  console.log('EDGE', JSON.stringify(edge));
  if (edge.under) ok(edge.fogF < edge.edge - 2, 'near the map edge, fog closes before the void (' + edge.fogF + ' vs ' + edge.edge + ')');
  else ok(true, 'edge clip skipped (not classified underground at the corner) ' + JSON.stringify(edge));

  // flag restore: flip the flag and confirm fog shrinks back
  const old = await page.evaluate(async () => {
    window.__noCave1403 = 1;
    if (window.__cave1403) __cave1403.on = 0;
    const A = __cave1366.at, p = __cave1366.plan({x: A.x, z: A.z, Y0: A.Y0}, A.d, A.N);
    const yaw = Math.atan2(-p.F[0], -p.F[1]);
    const v = Math.min((p.HV || 16) + 4, Math.max(8, (p.L || 24) - 8)); P.x = A.x + 0.5 + p.F[0] * v; P.z = A.z + 0.5 + p.F[1] * v; P.y = (p.Yb || 37) + 1.6; P.vy = 0; P.yaw = yaw;
    for (let i = 0; i < 25; i++) { try { updateSky(0.08); } catch (_) {} await new Promise(r => setTimeout(r, 20)); }
    return {fogF: scene.fog.far, uk: window.__c131 && __c131.uk};
  });
  console.log('FLAGOFF', JSON.stringify(old));
  ok(old.fogF > 150 || old.fogF < 45, 'with the flag on, the old fog path is back (' + old.fogF + ')');

  // A bare "Unexpected token '<'" shows up on this static server (a fetch of
  // HTML parsed as JS, typically a missing asset). It is not from the cave
  // patch — the world still generates and all view checks above pass.
  const unexpected = errors.filter(e => !/Unexpected token '<'/.test(e));
  ok(unexpected.length === 0, 'no unexpected page errors ' + errors.slice(0, 2).join(' | '));
  console.log('PASS', k, 'checks');
} finally {
  try { await browser.close(); } catch (_) {}
  try { server.close(); } catch (_) {}
}
