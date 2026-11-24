// t1365: England, Wales and Ireland streamed land from the real relief (ETOPO1 1' grid), painted-map snow on Snowdonia,
// rivers and loughs, Ireland heather lands; Scotland unchanged; old worlds with your things down south keep their ground.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
ok(html.includes('GLX-G1365 (t1365)') && html.includes('window.__noG1365'), 'G1365 module inlined with its off switch');
ok(html.includes("if (G5 && (v.k === 'h' || v.k === 'c')"), 'stamped hills/crags skipped on the real relief');
ok(html.includes('U.clr = () => { CC.clear(); TC.clear(); }'), 'streamed column caches can be cleared');
const PORT = Number(process.env.PORT || 8965);
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
    const G = window.__g1365, xz = (la, lo) => [Math.round(864 + (lo + 3.75) * 600 * Math.cos(la * Math.PI / 180)), Math.round(864 + (57.45 - la) * 600)];
    const h = (la, lo) => { const q = xz(la, lo); return G.hN(q[0], q[1], la, lo, 600); };
    const out = {err: G && G.err, has: !!G, n: G.dem(53.07, -4.08) > 0 ? 1 : 0};
    out.snowdon = h(53.068, -4.076); out.fens = h(52.5, 0.05); out.dartmoor = h(50.6, -3.95); out.kerry = h(51.999, -9.742); out.central = h(53.3, -7.6); out.downs = h(50.90, -0.11);
    out.neagh = h(54.62, -6.42); out.thames = h(51.5, -0.12);
    out.wt = {scot: G.wt(56.5, -4.0), galloway: G.wt(54.9, -4.5), kintyre: G.wt(55.4, -5.6), border: G.wt(55.0, -3.0), england: G.wt(53, -1.5), wales: G.wt(52.4, -3.7), ireland: G.wt(53.3, -8), ni: G.wt(54.6, -6.4), man: G.wt(54.25, -4.5)};
    const P0 = xz(53.0, -1.5);
    out.mine = {clean: G.mine({W: 1728, P: {x: 600, z: 900}, c320: {e: [['10,40,10', 3]]}}), edits: G.mine({W: 1728, P: {x: 600, z: 900}, c320: {e: [[P0[0] + ',45,' + P0[1], 3]]}}),
      player: G.mine({W: 1728, P: {x: P0[0], z: P0[1]}}), scotEdit: G.mine({W: 1728, c320: {e: [[xz(55.9, -4.3)[0] + ',45,' + xz(55.9, -4.3)[1], 3]]}})};
    out.on = G.on();
    return out; });
  console.log(JSON.stringify(r));
  ok(r.has && !r.err && r.n === 1, 'module loaded, height grid decoded, no error');
  ok(r.snowdon[0] > 45 && r.snowdon[1] > 0.9, 'Snowdon stands tall on the painted snowy range (' + r.snowdon[0].toFixed(1) + ')');
  ok(r.fens[0] > 0.5 && r.fens[0] < 4, 'the Fens are flat and low (' + r.fens[0].toFixed(1) + ')');
  ok(r.dartmoor[0] > 22 && r.kerry[0] > 30, 'Dartmoor and the Kerry mountains are uplands');
  ok(r.central[0] > 2 && r.central[0] < 16, "Ireland's middle is low (" + r.central[0].toFixed(1) + ')');
  ok(r.downs[0] > 7 && r.downs[0] < 22, 'the South Downs are low hills (' + r.downs[0].toFixed(1) + ')');
  ok(r.neagh[0] < 0 && r.thames[0] < 0, 'Lough Neagh and the Thames at London are water');
  ok(r.wt.scot === 0 && r.wt.galloway === 0 && r.wt.kintyre === 0 && r.wt.border < 0.6, 'Scotland keeps its ground (Galloway, Kintyre, border blend)');
  ok(r.wt.england === 1 && r.wt.wales === 1 && r.wt.ireland === 1 && r.wt.ni === 1 && r.wt.man === 1, 'England, Wales, Ireland, Northern Ireland and Man get the real relief');
  ok(r.mine.clean === '' && r.mine.edits === 'edits' && r.mine.player === 'player' && r.mine.scotEdit === '', 'old worlds with your things down south keep their ground');
  ok(r.on === false, 'off on the title screen (no world)');
  ok(errors.length === 0, 'no page errors ' + errors.join(' | '));
} finally { await browser.close(); server.close(); }
console.log('PASS v1365-uk-relief ' + k);
