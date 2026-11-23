// t1347: first-person held items rebuilt to the user's reference shots (GLX-FP1347).
// Static: patch inlined, old builders kept. Runtime: every rebuilt item shows its
// new model, the old meshes sit in a hidden holder, everything new is opaque,
// the old rifle meshes are hidden under the flintlock, and the map keeps its
// player arrow with the parchment + compass behind it.
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path';
import {fileURLToPath} from 'node:url'; import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let k = 0; const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };
ok(html.includes('GLX-FP1347') && html.includes('W.__fp1347 = {'), 'fp1347 patch inlined');
ok(html.includes('function makeTorchModel()') && html.includes('function buildBucket(full)') && html.includes('function buildTool(kind, matName, id)'), 'old builders are kept');
ok(html.includes('1.2.59-frame-torch') && html.includes('window.__fpa = {'), 'torch/pick jitter fix and __fpa rig stay');
const PORT = Number(process.env.PORT || 9768);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.glb':'model/gltf-binary','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4','.wasm':'application/wasm'};
const server = http.createServer((req, res) => { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  try { const d = fs.readFileSync(path.join(root, p)); res.writeHead(200, {'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(d); } catch (e) { res.writeHead(404); res.end(); } });
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const {default: pw} = await import('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js');
const browser = await pw.chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 1280, height: 720}}); page.setDefaultTimeout(300000);
const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 300)));
await page.addInitScript(() => { window.__forceSeed = 1; });
await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1347test`, {waitUntil: 'domcontentloaded'});
await page.waitForFunction(() => { try { return texDone >= texTotal && texTotal > 0; } catch (e) { return false; } });
if (await page.locator('#playBtn').isVisible({timeout: 8000}).catch(() => false)) await page.click('#playBtn');
await page.waitForSelector('[data-testid="world-create-tile"], #createGo');
const tile = page.locator('[data-testid="world-create-tile"]'); if (await tile.count() && await tile.first().isVisible().catch(() => false)) await tile.first().click();
await page.waitForSelector('#createGo'); await page.click('#createGo');
await page.waitForFunction(() => { try { return started && chunkObjs.size > 0 && !(window.__glenLoad && __glenLoad.held); } catch (e) { return false; } }, null, {timeout: 300000});
await page.waitForTimeout(3000);
const ITEMS = [['pick', 761], ['sword', 94], ['torch', 67], ['bucket', 39], ['block', 3], ['musket', 213], ['map', 410]];
for (const [name, id] of ITEMS) {
  await page.evaluate(id => { paused = false; menuOpen = false; try { camMode = 0; } catch (_) {} inv[id] = Math.max(inv[id] || 0, 1); selId = id; try { MODE.hotbar[0] = id; renderHotbar(); } catch (_) {} }, id);
  await page.waitForTimeout(3000);
  // wait until the equip settles (the gun root shows once its rig is attached)
  await page.waitForFunction(() => { try { __fp1347.tick(); let v = 0, any = 0; held.traverse(o => { if (o.name === 'fp1347Model') { any = 1; let p = o, ok = true; while (p) { if (!p.visible) { ok = false; break; } p = p.parent; } if (ok) v = 1; } }); return !any || v; } catch (_) { return true; } }, null, {timeout: 60000, polling: 500}).catch(() => {});
  const r = await page.evaluate(name => {
    try { __fp1347.tick(); } catch (_) {}
    const vis = o => { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; };
    const out = {model: 0, modelVis: 0, oldHid: 1, oldVisMeshes: 0, transparent: [], gunVis: 0, sel: selId, kind: __fp1347.kind, err: __fp1347.err, granite: 0, deco: 0, mark: 0};
    held.traverse(o => {
      if (o.name === 'fp1347Model') { out.model++; if (vis(o)) out.modelVis++; }
      if (o.name === 'fp1347Old' && o.visible) out.oldHid = 0;
      if ((o.isMesh || o.isSprite) && vis(o)) {
        let p = o, inOld = false; while (p) { if (p.name === 'fp1347Old') inOld = true; p = p.parent; }
        if (inOld) out.oldVisMeshes++;
        const m = o.material; if (m && o.userData.fp1347 && (m.transparent || m.opacity < 1)) out.transparent.push(o.type);
        if (/bolt_action/.test(o.name) && (o.layers.mask & 1)) out.gunVis++;
        if (m && m.userData && m.userData.fp1347 && o.geometry && o.geometry.type === 'BoxGeometry' && m.map && m.map.image && m.map.image.width === 64) out.granite++;
      }
    });
    if (name === 'map') {
      const pl = __map1317.sheet && __map1317.sheet();
      const d = pl && pl.userData.fp1347Deco;
      out.deco = d && d.parent === pl && vis(d) && !d.material.transparent ? 1 : 0;
      try { for (const c of pl.children) { if (c.isGroup && c.children.length >= 2) { out.mark = !c.userData.fp1347 ? 1 : 0; break; } } } catch (_) {}
    }
    return out;
  }, name);
  console.log(name, JSON.stringify(r));
  ok(!r.err, name + ': no fp1347 error');
  if (name === 'block') ok(r.granite >= 1, 'block: held stone uses the granite material');
  else if (name === 'map') { ok(r.deco === 1, 'map: parchment + compass under the sheet'); ok(r.mark === 1, 'map: player arrow is still the first group on the sheet'); }
  else { ok(r.model >= 1 && r.modelVis >= 1, name + ': new model is shown'); ok(r.oldVisMeshes === 0 && r.oldHid === 1, name + ': old meshes hidden, not deleted'); }
  ok(r.transparent.length === 0, name + ': every new mesh is opaque');
  if (name === 'musket') ok(r.gunVis === 0, 'musket: old rifle meshes hidden');
}
await page.evaluate(() => { selId = 213; try { MODE.hotbar[0] = 213; renderHotbar(); } catch (_) {} window.__c145 = window.__c145 || {}; __c145.force = true; });
await page.waitForFunction(() => { let m = null; held.traverse(o => { if (o.name === 'fp1347Model' && o.userData.fp1347 === 'musket') m = o; }); return m && m.userData.adsK > 0.5; }, null, {timeout: 90000, polling: 500}).catch(() => {});
const ads = await page.evaluate(() => { let m = null; held.traverse(o => { if (o.name === 'fp1347Model' && o.userData.fp1347 === 'musket') m = o; }); return m ? {k: m.userData.adsK, y: m.position.y} : null; });
await page.evaluate(() => { __c145.force = false; });
console.log('ads', JSON.stringify(ads));
ok(ads && ads.k > 0.5 && ads.y > 0.05, 'musket: sights slide up to the crosshair when aiming');
ok(errors.length === 0, 'no page errors (' + errors.slice(0, 3).join(' | ') + ')');
await browser.close(); server.close();
console.log('PASS v1347-fp-items ' + k);
