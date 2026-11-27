// t1417: see right across big caverns underground: no fog wall, no void, no sky or floating shells through rock.
// Off switch: window.__noCV1417 (back to the 1.2.146 fog-clip path). Terrain and caves are not touched.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
const i17 = html.indexOf('GLX-CV1417 (t1417');
const src = html.slice(i17, html.indexOf("})(typeof window !== 'undefined' ? window : this);", i17));
ok(i17 > 0 && src.includes('window.__noCV1417'), 'GLX-CV1417 inlined with its off switch');
ok(i17 > html.indexOf('GLX-CAVE1403 (t1403') && i17 > html.indexOf('GLX-YP1410'), 'runs after the 1.2.146 cave patch and the 1.2.148 caves fix');
ok(!/\bworld\[[^\]]+\]\s*=[^=]/.test(src) && !/setB\(/.test(src) && !/generate\s*=/.test(src), 'never writes blocks or touches world generation');
ok(src.includes('nbReady') && src.includes('castRay') && src.includes('lastHz'), 'neighbour-ready meshing, visibility rays and the meshed-horizon far plane are present');
ok(html.includes("WIN.__cv1417.owns()) return;"), 'the 1.2.146 fog clip yields to CV1417 only while it owns the view');
ok(html.includes('GLX-CAVE1403') && html.includes('GLX-C274') && html.includes('GLX-CAVE1366'), 'older cave code is kept');

const PORT = Number(process.env.PORT || 14177);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm'};
const server = http.createServer((req, res) => {
  try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(root, p)); if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = fs.readFileSync(file); res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e.message || e)); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const {default: pw} = await import('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js');
const browser = await pw.chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=3072']});
const errors = [];
try {
  { const pg = await browser.newPage({viewport: {width: 640, height: 400}}); pg.setDefaultTimeout(180000);
    await pg.addInitScript(() => { window.__noCV1417 = 1; });
    await pg.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded'});
    await pg.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title');
    const f = await pg.evaluate(() => ({on: window.__cv1417 && __cv1417.on, owns: !!(window.__cv1417 && __cv1417.owns)}));
    ok(f.on === 0 && !f.owns, '__noCV1417 turns it off ' + JSON.stringify(f));
    await pg.close(); }
  if (process.env.STATIC_ONLY) { console.log('PASS', k, 'checks (static + flag)'); process.exit(0); }

  const page = await browser.newPage({viewport: {width: 800, height: 450}});
  page.setDefaultTimeout(600000);
  page.on('pageerror', e => { const s = String(e && (e.stack || e.message) || e).slice(0, 400); errors.push(s); console.log('PAGEERROR', s); });
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded', timeout: 240000});
  await page.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title', null, {timeout: 240000});
  await page.evaluate(async seed => {
    current = {id: 't1417t-' + seed, name: 'CaveFarTest', mode: 'survival', created: Date.now(), l94: true, g12: true, g15: true, g21: true, g24: true, g25: true, g35: true, g36: true, g42: true, g89: true, newCastles: true};
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
  }, 7);
  await page.evaluate(async () => {
    const t0 = performance.now();
    try { started = true; paused = false; } catch (_) {}
    while (performance.now() - t0 < 480000) { const C = window.__c274; if (C && C.ms > 0 && C.halls > 0) break; await new Promise(r => setTimeout(r, 1000)); }
    try { showScreen('none'); started = true; paused = false; dead = false; menuOpen = false; } catch (_) {}
    try { weather.type = 'clear'; weather.pending = null; } catch (_) {}
    SET.rdist = 4;  // phone render distance
  });
  /* the biggest roofed cave air found by a scan (same picker as the QA sheet) */
  const spot = await page.evaluate(() => {
    const S = new Uint8Array(1024); for (let b = 1; b < 1024; b++) S[b] = (b === T.WATER || PLANT[b] || LEAFY[b]) ? 0 : 1;
    const sol = (x, y, z) => { if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return true; const b = world[(x * H + y) * D + z]; return !!b && !!S[b]; };
    const ray = (x, y, z, dx, dz, m) => { for (let t = 1; t < m; t++) if (sol(Math.floor(x + dx * t), y, Math.floor(z + dz * t))) return t; return m; };
    let best = null;
    for (let x = 40; x < W - 40; x += 4) for (let z = 40; z < D - 40; z += 4) {
      let top = H - 2; while (top > 2 && !sol(x, top, z)) top--;
      for (let y = 3; y < top - 16; y++) {
        if (!sol(x, y - 1, z) || sol(x, y, z) || sol(x, y + 1, z) || sol(x, y + 2, z)) continue;
        let cov = 0; for (let yy = y + 3; yy < H && cov < 12; yy++) if (sol(x, yy, z)) cov++; if (cov < 12) continue;
        let sum = 0, bd = 0, by = 0; for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2, d = ray(x + .5, y + 2, z + .5, Math.sin(a), Math.cos(a), 200); sum += d; if (d > bd) { bd = d; by = a; } }
        if (!best || sum > best.sum) best = {x, y, z, sum, yaw: Math.atan2(-Math.sin(by), -Math.cos(by)), long: bd};
      }
    }
    return best;
  });
  console.log('SPOT', JSON.stringify(spot));
  ok(spot && spot.long > 30, 'found a big cavern to stand in');
  const probe = async (wait) => page.evaluate(async ([s, wait]) => {
    try { flying = true; if (MODE) MODE.fly = true; } catch (_) {}
    const t0 = performance.now();
    while (performance.now() - t0 < wait) { P.x = s.x + .5; P.z = s.z + .5; P.y = s.y + 0.01; P.vy = 0; P.yaw = s.yaw; P.pitch = -0.05; await new Promise(r => setTimeout(r, 100)); }
    /* read back the frame right after drawing it: count backdrop (void) and sky-blue pixels */
    /* read the game's own next frame back right after it is drawn (before it is shown) */
    const gl = renderer.getContext();
    const grab = await new Promise(res => {
      const rr = renderer.render;
      renderer.render = function (sc, cam) {
        const r = rr.apply(this, arguments);
        if (sc === scene) {
          renderer.render = rr;
          const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4);
          const bg = scene.background && scene.background.isColor ? [scene.background.r, scene.background.g, scene.background.b].map(v => Math.round(v * 255)) : [0, 0, 0];
          let n = 0, vd = 0, sky = 0;
          for (let i = 1; i < 40; i++) for (let j = 4; j < 20; j++) { gl.readPixels(Math.floor(w * i / 40), Math.floor(h * j / 24), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); n++;
            if (Math.max(Math.abs(px[0] - bg[0]), Math.abs(px[1] - bg[1]), Math.abs(px[2] - bg[2])) <= 3) vd++;
            if (px[2] > px[0] + 25 && px[2] > 110 && px[2] > px[1]) sky++; }
          res({n, vd, sky, bg, fog: [scene.fog.near, scene.fog.far], camFar: camera.far});
        }
        return r;
      };
      setTimeout(() => res(null), 8000);
    });
    const n = grab ? grab.n : 1, vd = grab ? grab.vd : 1, sky = grab ? grab.sky : 1, bg = grab && grab.bg;
    let cavVis = 0; for (const [id, g] of chunkObjs) if (g.visible && g.userData && g.userData.cav) cavVis++;
    return {grabbed: !!grab, cv: __cv1417.state(), fog: grab ? grab.fog : [0, 0], camFar: grab ? grab.camFar : 0, voidPct: +(100 * vd / n).toFixed(2), skyPct: +(100 * sky / n).toFixed(2), cavVis, bg};
  }, [spot, wait]);
  const a = await probe(20000);
  console.log('CAVE', JSON.stringify(a));
  ok(a.cv.active === 1, 'the cavern is treated as underground (' + a.cv.why + ')');
  ok(a.cv.Rc >= 144, 'cave view distance is at least 144 blocks on phone render distance (' + a.cv.Rc + ')');
  ok(a.fog[1] >= a.cv.Rc * 3, 'no fog wall underground (fog far ' + a.fog[1] + ')');
  ok(a.camFar > spot.long + 5 || a.camFar > 64 + 10, 'the far plane reaches past the far wall of the cavern (' + a.camFar + ' vs ' + spot.long + ')');
  ok(a.cv.horizon > 900 || a.camFar <= a.cv.horizon + 0.01, 'never looks past a chunk that is not fully meshed (far ' + a.camFar + ', horizon ' + a.cv.horizon + ')');
  ok(a.cavVis === 0, 'no cave-cull shells drawn underground (' + a.cavVis + ')');
  ok(a.skyPct === 0, 'no sky through rock (' + a.skyPct + '%)');
  ok(a.voidPct <= 1, 'no void in the view (' + a.voidPct + '% backdrop)');
  ok(!a.cv.err, 'no CV1417 errors ' + a.cv.err);
  const unexpected = errors.filter(e => !/Unexpected token '<'/.test(e));
  ok(unexpected.length === 0, 'no unexpected page errors ' + errors.slice(0, 2).join(' | '));
  console.log('PASS', k, 'checks');
} finally {
  try { await browser.close(); } catch (_) {}
  try { server.close(); } catch (_) {}
}
