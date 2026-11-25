// t1367: the land matches the painted map (re-fitted map warp + land conformed to the painted coast) and each UK region
// has its own woods and ground (jittered-grid tree scatter). Old worlds with your things out past the square keep their ground.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
ok(html.includes('GLX-G1367 (t1367') && html.includes('window.__noG1367'), 'G1367 module inlined with its off switch');
ok(html.includes('if (U.ov) { const r = U.ov(x, a, z, c);') && html.includes('U.colm = colm;') && html.includes('if (U.ovc) c = U.ovc(x, z, c) || c;'), 'C347 streamed columns hand their woods and top blocks to G1367');
ok(html.includes('MC.hmAt = (px, py) =>'), 'painted masks can be read at an art pixel');
ok(html.includes('GLX-CAVE1366') && html.includes('window.__noCave1366'), 'pool rooms under spawn still shipped');
const PORT = Number(process.env.PORT || 8967);
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
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 800, height: 600}});
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => errors.push(String(e && e.message || e).slice(0, 300)));
try {
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`);
  await page.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const G = window.__g1367, MW = window.__mapWarp, xz = (la, lo) => [Math.round(864 + (lo + 3.75) * 600 * Math.cos(la * Math.PI / 180)), Math.round(864 + (57.45 - la) * 600)];
    const out = {has: !!G, err: G && G.err, off: G && G.off, hooks: G && G.hooks, px0: !!(MW && MW.px0)};
    const d = (la, lo) => { const a = MW.px(la, lo), b = MW.px0(la, lo); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    out.shift = {ireW: d(53.5, -10.0), sCoast: d(50.6, -2.0), scot: d(57.0, -4.0)};
    out.inb = [[53.4, -2.24], [51.5, -0.12], [52.48, -1.9], [53.35, -6.26], [55.95, -3.19], [52.95, -9.4], [50.1, -5.6]].every(([a, b]) => { const q = MW.px(a, b); return q[0] > 60 && q[0] < 690 && q[1] > 50 && q[1] < 980; });
    out.landIn = [[53.4, -2.24], [51.5, -0.5], [52.48, -1.9], [53.5, -7.5], [52.2, -3.6], [54.5, -3.0], [57.2, -4.3]].map(([a, b]) => G.art(a, b));
    out.seaIn = [[54.6, 0.2], [53.5, -5.3], [51.0, -7.5], [54.0, -5.0]].map(([a, b]) => G.art(a, b));
    const c1 = xz(52.48, -1.9); out.keep = G.conform(c1[0], c1[1], 52.48, -1.9, 17, false);
    let rs = null, dr = null; for (let la = 50.5; la < 54; la += 0.05) for (let lo = -11; lo < 2.5; lo += 0.02) { const s = G.art(la, lo); if (s === null) continue; const q = xz(la, lo);
      if (!rs && s > 4 && s < 12) rs = G.conform(q[0], q[1], la, lo, -4, true); if (!dr && s < -6 && s > -14) dr = G.conform(q[0], q[1], la, lo, 9, false); }
    out.raise = rs; out.drown = dr;
    const bi = (la, lo, g) => { const q = xz(la, lo); return G.biome(la, lo, q[0], q[1], g); };
    out.bio = {ire: bi(53.3, -7.8, 8), wales: bi(52.5, -3.8, 10), fen: bi(52.55, 0.1, 2), lake: bi(54.45, -3.05, 10), isle: bi(57.6, -7.2, 5), moor: bi(54.4, -2.1, 20), scrub: bi(50.5, -4.3, 8), yew: bi(51.1, -1.0, 8), oak: bi(53.0, -1.5, 8), supl: bi(55.4, -3.2, 10), high: bi(57.2, -4.5, 10)};
    out.B = G.B;
    const P0 = xz(53.0, -1.5);
    out.mine = {clean: G.mine({W: 1728, P: {x: 600, z: 900}, c320: {e: [['10,40,10', 3]]}}), edits: G.mine({W: 1728, P: {x: 600, z: 900}, c320: {e: [[P0[0] + ',45,' + P0[1], 3]]}}), player: G.mine({W: 1728, P: {x: P0[0], z: P0[1]}})};
    out.on = G.on(); out.onW = G.onW();
    return out; });
  console.log(JSON.stringify(r));
  ok(r.has && !r.err && !r.off && r.px0 && r.hooks.warp, 'module loaded, map warp re-fitted, no error');
  ok(r.shift.ireW > 3 && r.shift.sCoast > 3 && r.shift.scot < 12, 'warp moved where the old fit was off (Ireland west ' + r.shift.ireW.toFixed(1) + ' px, south coast ' + r.shift.sCoast.toFixed(1) + ' px) and little in the Highlands (' + r.shift.scot.toFixed(1) + ')');
  ok(r.inb, 'towns land inside the painted chart');
  ok(r.landIn.every(v => v > 2), 'inland places are on painted land (' + r.landIn.map(v => v.toFixed(0)).join(',') + ')');
  ok(r.seaIn.every(v => v < -2), 'open sea is painted sea (' + r.seaIn.map(v => v.toFixed(0)).join(',') + ')');
  ok(r.raise > 0 && r.drown < 0 && r.keep === 17, 'land follows the painting: raised where painted land, drowned where painted sea, untouched inland');
  const B = r.B, b = r.bio;
  ok(b.ire === B.IRE && b.wales === B.WALES && b.fen === B.FEN && b.lake === B.LAKE && b.isle === B.ISLE && b.moor === B.MOOR && b.scrub === B.SCRUB && b.yew === B.YEW && b.oak === B.OAKN && b.supl === B.SUPL && b.high === B.HIGH, 'every region has its own biome ' + JSON.stringify(b));
  ok(r.mine.clean === '' && r.mine.edits === 'edits' && r.mine.player === 'player', 'old worlds with your things out past the square keep their ground');
  ok(r.on === false && r.onW === false, 'off on the title screen (no world)');
  ok(errors.length === 0, 'no page errors ' + errors.join(' | '));
  /* the off switch restores the old warp */
  const p2 = await browser.newPage({viewport: {width: 800, height: 600}});
  await p2.addInitScript(() => { window.__noG1367 = 1; });
  await p2.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1`);
  await p2.waitForFunction(() => typeof screen !== 'undefined' && screen === 'title');
  const r2 = await p2.evaluate(() => ({off: window.__g1367 && __g1367.off, px0: !!(window.__mapWarp && __mapWarp.px0), ov: !!(window.__c347 && __c347.ov)}));
  ok(r2.off === 1 && !r2.px0 && !r2.ov, 'window.__noG1367 turns it all off');
  await p2.close();
} finally { await browser.close(); server.close(); }
console.log('PASS v1367-map-match ' + k);
