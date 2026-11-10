// In-world WebGL capture of pig3 on real terrain. Runtime catalogue override only
// (does not hook index.html). Headless Chromium + SwiftShader.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire('/home/box/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json');
const {chromium} = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = process.argv[2] || '/workspace/qa/phase3/pig/after';
fs.mkdirSync(OUT, {recursive: true});

const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.glb':'model/gltf-binary', '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.ico':'image/x-icon', '.webp':'image/webp'
};
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const fp = path.normalize(path.join(ROOT, u));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {'content-type': MIME[path.extname(fp)] || 'application/octet-stream', 'cache-control':'no-store'});
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log('serving', ROOT, 'on', port);

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
    '--disable-web-security',
  ]
});
const page = await browser.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('console', m => {
  const t = m.text();
  if (/qa-pig|error|Error|WEBGL|pig3|load:/i.test(t)) console.log('console', t.slice(0, 400));
});
await page.addInitScript(() => { window.__loadChunkR = 2; });

console.log('goto');
await page.goto('http://127.0.0.1:' + port + '/index.html?qa=pig3', {waitUntil: 'domcontentloaded', timeout: 180000});

async function pin() {
  await page.addScriptTag({content: `
    (function(){
      try {
        if (typeof camera === 'undefined' || typeof renderer === 'undefined') throw new Error('not ready');
        window.camera = camera; window.renderer = renderer;
        if (typeof scene !== 'undefined') window.scene = scene;
        if (typeof P !== 'undefined') window.P = P;
        if (typeof SET !== 'undefined') { window.SET = SET; SET.sfx = 0; SET.music = 0; SET.dist = 2; }
        if (typeof showScreen === 'function') window.showScreen = showScreen;
        if (typeof createWorld === 'function') window.createWorld = createWorld;
        if (typeof spawnMob === 'function') window.spawnMob = spawnMob;
        if (typeof getB === 'function') window.getB = getB;
        window.__qaPinned = 1;
      } catch (e) { window.__qaPinErr = String(e && e.message || e); }
    })();
  `});
}

const bootDeadline = Date.now() + 180000;
while (Date.now() < bootDeadline) {
  const st = await page.evaluate(() => {
    const b = document.getElementById('playBtn');
    const t = document.getElementById('scr-title');
    return {
      play: !!(b && t && t.classList.contains('on') && !b.disabled),
      started: !!(typeof started !== 'undefined' && started),
    };
  });
  console.log('boot', st);
  if (st.play || st.started) break;
  await page.waitForTimeout(1000);
}
try { await pin(); } catch (e) { console.log('pin early', e.message); }

const onTitle = await page.evaluate(() => {
  const t = document.getElementById('scr-title');
  return !!(t && t.classList.contains('on'));
});
if (onTitle) {
  console.log('click play');
  await page.click('#playBtn');
  await page.waitForTimeout(600);
  const createTile = await page.$('[data-testid="world-create-tile"]');
  if (createTile) { await createTile.click(); await page.waitForTimeout(400); }
  else { await page.evaluate(() => { try { showScreen('create'); } catch (e) {} }); await page.waitForTimeout(400); }
  await page.evaluate(() => { try { const i = document.getElementById('worldName'); if (i) i.value = 'Pig QA'; } catch (e) {} });
  const go = await page.$('#createGo');
  if (go) await go.click();
  else await page.evaluate(() => { try { createWorld(); } catch (e) { console.log('createWorld err', e.message); } });
  console.log('create requested');
}

const worldDeadline = Date.now() + 240000;
let worldReady = false;
while (Date.now() < worldDeadline) {
  try { await pin(); } catch (_) {}
  const st = await page.evaluate(() => {
    let startedV = false, p = null;
    try { startedV = !!(typeof started !== 'undefined' && started); } catch (e) {}
    try { if (typeof P !== 'undefined' && P) p = {x: P.x, y: P.y, z: P.z}; } catch (e) {}
    return { started: startedV, p, err: window.__qaPinErr || null };
  });
  console.log('world', st);
  if (st.started && st.p) { worldReady = true; break; }
  await page.waitForTimeout(1500);
}
if (!worldReady) {
  console.log('FAILED: world did not start');
  await page.screenshot({path: path.join(OUT, 'world-fail-boot.png')});
  await browser.close(); server.close();
  process.exit(1);
}
console.log('waiting for chunks');
await page.waitForTimeout(8000);
try {
  await page.evaluate(() => {
    try { if (typeof rebuild === 'function') rebuild(80); } catch (e) {}
    try { if (typeof SET !== 'undefined') SET.dist = 2; } catch (e) {}
  });
} catch (e) {}
await page.waitForTimeout(3000);

const prep = await page.evaluate(() => {
  const out = { err: null, cats: [] };
  try {
    if (typeof paused !== 'undefined') paused = false;
    if (typeof dayClock !== 'undefined' && typeof CYCLE === 'number') dayClock = CYCLE * 0.18;
    if (typeof updateSky === 'function') updateSky(0);
    if (scene && scene.fog) { scene.fog.near = 40; scene.fog.far = 200; }
    ['hud','cross','hurt','vitals','hotbar','toast','goal','clockW','craft','menu'].forEach(id => {
      const e = document.getElementById(id); if (e) e.style.display = 'none';
    });
    try { if (typeof hand !== 'undefined' && hand) hand.visible = false; } catch (e) {}
    try { if (typeof fist !== 'undefined' && fist) fist.visible = false; } catch (e) {}
    try { camera.children.forEach(c => { c.visible = false; c.traverse(o => { o.visible = false; }); }); } catch (e) {}

    // Runtime-only catalogue override: do not write this into index.html.
    const cats = [window.__c135, window.__c136, window.__hd, window.__c257];
    for (const k of Object.keys(window)) {
      const o = window[k];
      if (o && o.cat && o.cat.pig) cats.push(o);
    }
    for (const C of cats) {
      if (!C || !C.cat || !C.cat.pig) continue;
      C.cat.pig.f = 'pig3';
      C.cat.pig.k = 1.4;
      C.cat.pig.noclip = 1;
      out.cats.push({f: C.cat.pig.f, k: C.cat.pig.k});
    }

    const px = P.x, pz = P.z, py = P.y;
    function ground(x, z) {
      try {
        if (typeof footGround === 'function') return footGround(x, z);
      } catch (e) {}
      for (let y = 90; y >= 1; y--) {
        try { if (typeof solid === 'function' && solid(x, y, z) && !solid(x, y+1, z)) return y + 1; } catch (e) {}
      }
      return py;
    }
    const gx = px + 8, gz = pz + 5;
    const gy = ground(gx, gz);
    window.__eggSpot = [gx, gy, gz];
    let rec = null;
    try { rec = spawnMob('pig'); } catch (e) { out.spawnErr = String(e && e.message || e); }
    window.__eggSpot = null;
    out.spawn = {x: gx, y: gy, z: gz, ok: !!rec, kind: rec && rec.kind};
    out.player = {x: px, y: py, z: pz};
    window.__qaPig = { rec, gx, gy, gz };
    if (typeof paused !== 'undefined') paused = true;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 500); }
  return out;
});
console.log('prep', JSON.stringify(prep));
if (prep.err || !prep.spawn || !prep.spawn.ok) {
  await page.screenshot({path: path.join(OUT, 'world-fail-prep.png')});
  await browser.close(); server.close();
  process.exit(1);
}

// Give the HD overlay a moment to load pig3.glb
await page.waitForTimeout(5000);

async function shoot(name, cam) {
  // Stand on real terrain, aim with P.yaw / P.pitch, and let the game's own
  // placeCamera + compositor draw the frame. __qaAfterCamera then pins the
  // camera to the requested close view (without no-op'ing placeCamera).
  const data = await page.evaluate((cam) => {
    const info = { err: null };
    try {
      if (typeof paused !== 'undefined') paused = true;
      const {rec, gx, gy, gz} = window.__qaPig;
      try { rec.ang = 0; rec.g.rotation.set(0, 0, 0); } catch (e) {}

      // Stay on the ground. Never subtract eye-height into the earth (that
      // made P and the camera NaN last time).
      P.x = cam.px;
      P.y = cam.py;
      P.z = cam.pz;
      const dx = cam.lx - cam.px, dy = cam.ly - (cam.py + 1.6), dz = cam.lz - cam.pz;
      const horiz = Math.hypot(dx, dz) || 1e-6;
      P.yaw = Math.atan2(-dx, -dz);
      P.pitch = Math.atan2(dy, horiz);
      try { if (typeof vel !== 'undefined' && vel) { vel.x = vel.y = vel.z = 0; } } catch (e) {}
      try { bobAmp = 0; bobMv = 0; landDip = 0; shake = 0; } catch (e) {}
      try { if (typeof flying !== 'undefined') flying = false; } catch (e) {}

      window.__qaShotCam = cam;
      window.__qaAfterCamera = function () {
        const c = window.__qaShotCam;
        if (!c) return;
        try {
          camera.position.set(c.x, c.y, c.z);
          const target = new THREE.Vector3(c.lx, c.ly, c.lz);
          camera.lookAt(target);
          camera.updateMatrixWorld(true);
        } catch (e) {
          try {
            const target = new camera.position.constructor(c.lx, c.ly, c.lz);
            camera.position.set(c.x, c.y, c.z);
            camera.lookAt(target);
            camera.updateMatrixWorld(true);
          } catch (e2) { window.__qaCamErr = String(e2); }
        }
      };

      info.aim = {px:P.x, py:P.y, pz:P.z, yaw:P.yaw, pitch:P.pitch, in:cam};
      info.pig = rec && rec.g ? {x: rec.g.position.x, y: rec.g.position.y, z: rec.g.position.z} : null;
    } catch (e) { info.err = String(e && e.stack || e).slice(0, 500); }
    return info;
  }, cam);
  console.log('shot-aim', name, JSON.stringify(data));

  await page.evaluate(() => { if (typeof paused !== 'undefined') paused = false; });
  await page.waitForTimeout(350);
  const post = await page.evaluate(() => ({
    cam: camera && camera.position ? [camera.position.x, camera.position.y, camera.position.z] : null,
    p: P ? [P.x, P.y, P.z, P.yaw, P.pitch] : null,
    err: window.__qaCamErr || null
  }));
  console.log('shot-post', name, post);
  const pageBuf = await page.screenshot({type: 'png'});
  await page.evaluate(() => { if (typeof paused !== 'undefined') paused = true; });
  const fp = path.join(OUT, name);
  fs.writeFileSync(fp, pageBuf);
  console.log('wrote', fp, pageBuf.length);
}

const {x: gx, y: gy, z: gz} = prep.spawn;
// Stand on the terrain a couple of metres from the pig, look at its body;
// __qaAfterCamera then eases in to a close snout-height framing.
await shoot('world.png', {
  px: gx + 0.15, py: gy, pz: gz + 2.1,
  x: gx + 0.15, y: gy + 0.70, z: gz + 1.85,
  lx: gx, ly: gy + 0.50, lz: gz + 0.2
});
await shoot('world-threeq.png', {
  px: gx + 1.8, py: gy, pz: gz + 1.7,
  x: gx + 1.55, y: gy + 0.90, z: gz + 1.55,
  lx: gx, ly: gy + 0.42, lz: gz
});

await browser.close();
server.close();
console.log('world capture done');
