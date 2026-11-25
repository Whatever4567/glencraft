// GLX-ERUPT1379 / t1388: overflow is a thick terrain-hugging advancing flow.
// Also keeps the t1379 fountain checks. Flag window.__noErupt1379 brings the old jet back.
// Usage: node tests/v1388-overflow.mjs [indexDir]
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {extname, join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import pkg from '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {chromium} = pkg;
const here = dirname(fileURLToPath(import.meta.url));
const indexDir = resolve(process.argv[2] || (existsSync(join(here, '../index.html')) ? join(here, '..') : '/workspace/gc-erupt-1379'));
if (!existsSync(join(indexDir, 'index.html'))) { console.error('no index.html in', indexDir); process.exit(2); }
const html = readFileSync(join(indexDir, 'index.html'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('ok  ', m); } else { fail++; console.log('FAIL', m); } };

ok(html.includes('GLX-ERUPT1379'), 'GLX-ERUPT1379 module present');
ok(html.includes('__noErupt1379'), 'flag __noErupt1379 present');
ok(html.includes('<script id="glx-erupt1379">'), 'late IIFE is its own script (V1300 script left in place)');
ok(html.includes('GLX-V1300: EVERY VOLCANO ERUPTS'), 'V1300 eruption machine kept');
ok(html.includes('W === 864 || W === 1728'), 'Ben Glencraft still builds on 2x worlds');
const v = html.slice(html.indexOf('GLX-V1300: EVERY VOLCANO'));
const vend = v.indexOf('</script>');
ok(!/IcosahedronGeometry|flash\.material/.test(v.slice(0, vend)), 'no bomb meshes or flash sprite added inside the V1300 script');
ok(!html.includes('__noErupt1379 = 1') || html.includes('window.__noErupt1379 = 1 brings back') || html.includes('__noErupt1379 = 1 brings'), 'flag is off by default (documented restore)');

const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.bin': 'application/octet-stream'};
const PORT = Number(process.env.PORT || 13892);
const server = await new Promise(r => { const s = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = join(indexDir, p); if (!f.startsWith(indexDir)) { res.writeHead(403); res.end(); return; }
  const d = readFileSync(f); res.writeHead(200, {'Content-Type': MIME[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(PORT, '127.0.0.1', () => r(s)); });
const browser = await chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--no-sandbox', '--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 1280, height: 720}}); page.setDefaultTimeout(900000);
const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 240)));

function measure() {
  return page.evaluate(() => {
    const V = window.__v1300, E = window.__erupt1379, g = typeof scene !== 'undefined' && scene && scene.getObjectByName('v1300Volcano');
    let jet = null, disc = null, extra = 0, inst = 0, throat = 0, visJet = null;
    if (g) g.children.forEach(o => {
      if (o.userData && o.userData.__e1379x) {
        extra++;
        if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry' && o.visible) throat = Math.max(throat, o.scale.x, o.scale.z);
        if (o.isInstancedMesh && o.visible) inst = Math.max(inst, o.count || 0);
      } else if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry') { jet = o; visJet = !!o.visible; }
      else if (o.isMesh && o.geometry && o.geometry.type === 'CircleGeometry') disc = o;
    });
    const st = V && V.state && V.state();
    const s = st && V.list ? V.list()[st.si] : null;
    return {
      ph: V && V.ph, st, err: V && V.err, eerr: E && E.err, on: !!(E && E.on), hook: !!(E && E.hook),
      bombs: E && E.bombs, jh: E && E.jh, cr: E && E.cr, flag: !!window.__noErupt1379,
      visJet, jetY: jet ? +jet.scale.y.toFixed(3) : null, jetR: jet ? +jet.scale.x.toFixed(3) : null,
      discR: disc ? +disc.scale.x.toFixed(3) : null, extra, inst, throat: +throat.toFixed(3),
      rc: s && s.rc, lavaShader: !!(disc && disc.material && disc.material.userData && disc.material.userData.__e1379)
    };
  });
}

try {
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`, {waitUntil: 'domcontentloaded', timeout: 180000});
  await page.waitForFunction(() => typeof createWorld === 'function' && typeof screen !== 'undefined' && screen === 'title', null, {timeout: 180000});
  await page.evaluate(() => { let s = 0x7a11; Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; document.getElementById('worldName').value = 'Overflow1388'; createWorld(); });
  await page.waitForFunction(() => typeof started !== 'undefined' && started && screen !== 'loading', null, {timeout: 600000});
  await page.waitForFunction(() => window.__v1300 && __v1300.built > 0, null, {timeout: 60000}).catch(() => {});
  await page.waitForTimeout(2000);
  await page.waitForFunction(() => window.__v1300 && __v1300.list && __v1300.list().length > 0, null, {timeout: 30000});
  ok(await page.evaluate(() => !!(window.__erupt1379 && __erupt1379.hook)), 'enhance hooked updateSky');

  const boot = await page.evaluate(() => {
    const V = __v1300, L = V.list(), s = L.find(q => q.k === 'S') || L[0], a = V.anchor(s.i, true);
    P.x = a.x + 28; P.z = a.z + 30; P.y = a.rim + 8; P.vy = 0;
    P.yaw = Math.atan2(-(a.x - P.x), -(a.z - P.z)); P.pitch = -0.1;
    try { flying = true; if (MODE) MODE.fly = true; started = true; paused = false; } catch (_) {}
    try { V.speed = 16; } catch (_) {}
    const ok0 = V.erupt('spawn');
    try { updateSky(0.05); } catch (_) {}
    return {ok0, i: s.i, rc: s.rc, r: s.r, ph: V.ph, err: V.err};
  });
  console.log('BOOT', JSON.stringify(boot));
  ok(boot.ok0, 'Ben Glencraft / a site starts an eruption');

  async function toPh(name, ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const ph = await page.evaluate(() => { try { updateSky(0.05); } catch (_) {} return __v1300.ph; });
      if (ph === name) return true;
      if (ph === 'idle') return false;
      await page.waitForTimeout(30);
    }
    return false;
  }
  const gotGush = await toPh('gush', 20000);
  ok(gotGush, 'reaches gush through the existing phase machine');
  await page.evaluate(() => { try { __v1300.speed = 1; } catch (_) {} });
  // let a few real frames land
  for (let i = 0; i < 12; i++) { await page.evaluate(() => { try { updateSky(0.03); } catch (_) {} }); await page.waitForTimeout(16); }
  const G = await measure();
  console.log('GUSH', JSON.stringify(G));
  ok(G.on, 'enhance is on during the eruption');
  ok(!G.eerr, 'no enhance errors (' + G.eerr + ')');
  ok(!G.visJet, 'original thin central jet is hidden');
  ok(G.throat >= (G.rc || 6) * 0.7, 'throat fills the crater mouth (scale ' + G.throat + ' vs rc ' + G.rc + ')');
  ok(G.inst >= 5, 'several jets across the crater (' + G.inst + ')');
  ok(G.jh > 12, 'fountain is tall at the gush peak (' + G.jh + ')');
  ok(G.lavaShader, 'crater surface uses the molten shader');
  ok(G.bombs > 0, 'lava bombs are thrown (' + G.bombs + ')');
  const heights = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(80);
    await page.evaluate(() => { try { updateSky(0.08); } catch (_) {} });
    heights.push((await measure()).jh);
  }
  const minH = Math.min(...heights), maxH = Math.max(...heights), mid = (minH + maxH) / 2;
  const span = mid > 0 ? (maxH - minH) / mid : 99;
  console.log('BOB', JSON.stringify({heights, span}));
  ok(span < 0.35, 'fountain height is not a whole-column bob (span ' + span.toFixed(3) + ')');

  await page.evaluate(() => { try { __v1300.speed = 12; } catch (_) {} });
  const gotPour = await toPh('pour', 40000);
  ok(gotPour, 'reaches pour so overflow can start');
  await page.evaluate(() => { try { __v1300.speed = 1; } catch (_) {} });
  for (let i = 0; i < 10; i++) { await page.evaluate(() => { try { updateSky(0.05); } catch (_) {} }); await page.waitForTimeout(20); }
  const fl = await page.evaluate(() => {
    const V = window.__v1300, E = window.__erupt1379, g = scene.getObjectByName('v1300Volcano');
    const a = V && V.anchor && V.state ? V.anchor(V.state().si) : null;
    const st = V && V.state && V.state();
    const flows = [];
    if (g) g.children.forEach(o => {
      if (!(o.userData && o.userData.__e1379x && o.visible && o.geometry && o.geometry.getAttribute)) return;
      const pos = o.geometry.getAttribute('position');
      if (!pos || pos.count < 6) return;
      const n = pos.count, col = (n % 5 === 0) ? 5 : (n % 2 === 0 ? 2 : 0);
      if (!col) return;
      const stations = n / col;
      const w = [], off = [], dy = [];
      o.updateWorldMatrix(true, false);
      const first = new THREE.Vector3(pos.getX(0), pos.getY(0), pos.getZ(0)).applyMatrix4(o.matrixWorld);
      const midI = Math.floor(stations / 2) * col + (col === 5 ? 2 : 0);
      const mid = new THREE.Vector3(pos.getX(midI), pos.getY(midI), pos.getZ(midI)).applyMatrix4(o.matrixWorld);
      for (let i = 0; i < stations; i++) {
        const iL = i * col, iR = i * col + (col - 1), iC = i * col + (col === 5 ? 2 : 0);
        const L = new THREE.Vector3(pos.getX(iL), pos.getY(iL), pos.getZ(iL)).applyMatrix4(o.matrixWorld);
        const R = new THREE.Vector3(pos.getX(iR), pos.getY(iR), pos.getZ(iR)).applyMatrix4(o.matrixWorld);
        const C = new THREE.Vector3(pos.getX(iC), pos.getY(iC), pos.getZ(iC)).applyMatrix4(o.matrixWorld);
        w.push(Math.hypot(L.x - R.x, L.z - R.z));
        dy.push(Math.abs(L.y - R.y));
        let gY = C.y;
        try { if (V.surf) gY = V.surf(Math.round(C.x), Math.round(C.z), C.y); } catch (_) {}
        off.push(C.y - gY);
      }
      const dist0 = a ? Math.hypot(first.x - a.x, first.z - a.z) : 0;
      flows.push({n: stations, col, wMin: Math.min(...w), wMax: Math.max(...w), dyMax: Math.max(...dy), offMin: Math.min(...off), offMax: Math.max(...off), dist0: +dist0.toFixed(2), midW: +w[Math.floor(w.length / 2)].toFixed(2)});
    });
    return {ph: V && V.ph, pt: st && st.pt, ver: E && E.ver, flows, lava: st && st.lava};
  });
  const rc = await page.evaluate(() => { const V = __v1300, st = V.state(), s = V.list()[st.si]; return s && s.rc; });
  const flows = (fl.flows || []).filter(f => f.col >= 5 && f.n >= 6 && f.dist0 > (rc || 6) * 0.7 && f.dist0 < (rc || 6) * 4 && f.wMax < 16 && f.wMax > 1.5);
  fl.picked = flows[0] || null;
  console.log('FLOW', JSON.stringify({ph: fl.ph, pt: fl.pt, ver: fl.ver, lava: fl.lava, n: (fl.flows||[]).length, picked: fl.picked, all: fl.flows}));
  ok(flows.length >= 1, 'overflow flows are visible in pour (' + flows.length + ' picked of ' + (fl.flows||[]).length + ')');
  if (flows.length) {
    const f0 = flows[0];
    ok(f0.col >= 5, 'flow has a thick cross-section (cols ' + f0.col + ')');
    ok(f0.wMax > f0.wMin + 0.4, 'flow width varies along its length (' + f0.wMin.toFixed(2) + '..' + f0.wMax.toFixed(2) + ')');
    ok(f0.offMin > 0.05 && f0.offMin < 2.2, 'flow sits slightly above the ground (offMin ' + f0.offMin.toFixed(2) + ', offMax ' + f0.offMax.toFixed(2) + ')');
    ok(f0.dist0 > (rc || 6) * 0.7 && f0.dist0 < (rc || 6) * 3.5, 'flow starts at the rim, not inside the vent (dist ' + f0.dist0 + ' rc ' + rc + ')');
  }
  ok((fl.ver || 0) >= 2, 'overflow module is the t1388 revision (ver ' + fl.ver + ')');

  // flag restores the old jet
  const flagged = await page.evaluate(() => {
    window.__noErupt1379 = 1;
    try { updateSky(0.05); } catch (_) {}
    const g = scene.getObjectByName('v1300Volcano');
    let vis = null, extraVis = 0;
    if (g) g.children.forEach(o => {
      if (o.userData && o.userData.__e1379x && o.visible) extraVis++;
      if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry' && !(o.userData && o.userData.__e1379x)) vis = !!o.visible;
    });
    return {on: __erupt1379.on, vis, extraVis, why: __erupt1379.why};
  });
  console.log('FLAG', JSON.stringify(flagged));
  ok(!flagged.on && flagged.why === 'flag', 'flag turns the upgrade off');
  ok(flagged.vis, 'old jet is visible again with the flag on');
  ok(flagged.extraVis === 0, 'upgrade meshes hide with the flag on');

  ok(!perr.some(e => /1379|erupt/i.test(e)), 'no page errors from ERUPT1379 (' + perr.filter(e => /1379|erupt/i.test(e)).join('; ') + ')');
} catch (e) { fail++; console.log('FAIL exception', String(e.stack || e).slice(0, 500)); }
await browser.close(); server.close();
console.log(`v1388-overflow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
