// Real in-world WebGL captures of the giant pop star in a generated Glencraft
// overworld, from ground level looking up. Headless Chromium + SwiftShader.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire('/home/box/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json');
const {chromium} = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = process.argv[2] || '/workspace/qa/meme-mob/v2/world';
fs.mkdirSync(OUT, {recursive: true});

const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.glb':'model/gltf-binary', '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.ico':'image/x-icon'
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
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-web-security',
  ]
});
const page = await browser.newPage({
  viewport: {width: 412, height: 915},
  deviceScaleFactor: 1,
});
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('console', m => {
  const t = m.text();
  if (/qa-popstar|error|Error|WEBGL|popstar|load:/i.test(t)) console.log('console', t.slice(0, 400));
});
await page.addInitScript(() => {
  window.__loadChunkR = 2;
});

console.log('goto');
await page.goto('http://127.0.0.1:' + port + '/index.html?qa=popstar', {waitUntil: 'domcontentloaded', timeout: 180000});

async function pin() {
  await page.addScriptTag({content: `
    (function(){
      try {
        if (typeof camera === 'undefined' || typeof renderer === 'undefined') throw new Error('not ready');
        window.camera = camera; window.renderer = renderer;
        if (typeof scene !== 'undefined') window.scene = scene;
        if (typeof P !== 'undefined') window.P = P;
        if (typeof SET !== 'undefined') { window.SET = SET; SET.sfx = 0; SET.music = 0; SET.dist = 2; }
        if (typeof placeCamera === 'function') window.placeCamera = placeCamera;
        if (typeof updateSky === 'function') window.updateSky = updateSky;
        if (typeof createWorld === 'function') window.createWorld = createWorld;
        if (typeof showScreen === 'function') window.showScreen = showScreen;
        if (typeof enterWorld === 'function') window.enterWorld = enterWorld;
        if (typeof getB === 'function') window.getB = getB;
        if (typeof solid === 'function') window.solid = solid;
        if (typeof LEAFY !== 'undefined') window.LEAFY = LEAFY;
        window.__qaPinned = 1;
      } catch (e) { window.__qaPinErr = String(e && e.message || e); }
    })();
  `});
}

// Wait until the title Play button exists and textures have likely loaded.
const bootDeadline = Date.now() + 180000;
while (Date.now() < bootDeadline) {
  const st = await page.evaluate(() => {
    const b = document.getElementById('playBtn');
    const t = document.getElementById('scr-title');
    return {
      play: !!(b && t && t.classList.contains('on') && !b.disabled),
      titleOn: !!(t && t.classList.contains('on')),
      boot: !!(document.getElementById('scr-boot') && document.getElementById('scr-boot').classList.contains('on')),
      started: !!(typeof started !== 'undefined' && started),
    };
  });
  console.log('boot', st);
  if (st.play || st.started) break;
  await page.waitForTimeout(1000);
}

try { await pin(); } catch (e) { console.log('pin early', e.message); }

// If we are still on the title, create a new world.
const onTitle = await page.evaluate(() => {
  const t = document.getElementById('scr-title');
  return !!(t && t.classList.contains('on'));
});
if (onTitle) {
  console.log('click play');
  await page.click('#playBtn');
  await page.waitForTimeout(600);
  const createTile = await page.$('[data-testid="world-create-tile"]');
  if (createTile) {
    await createTile.click();
    await page.waitForTimeout(400);
  } else {
    await page.evaluate(() => { try { showScreen('create'); } catch (e) {} });
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => {
    try { const i = document.getElementById('worldName'); if (i) i.value = 'Popstar QA'; } catch (e) {}
  });
  const go = await page.$('#createGo');
  if (go) await go.click();
  else await page.evaluate(() => { try { createWorld(); } catch (e) { console.log('createWorld err', e.message); } });
  console.log('create requested');
}

// Wait until the world is running.
const worldDeadline = Date.now() + 240000;
let worldReady = false;
while (Date.now() < worldDeadline) {
  try { await pin(); } catch (_) {}
  const st = await page.evaluate(() => {
    let startedV = false, screenV = null, step = null, p = null;
    try { startedV = !!(typeof started !== 'undefined' && started); } catch (e) {}
    try { screenV = typeof screen !== 'undefined' ? String(screen) : (document.body.className || ''); } catch (e) {}
    try { step = window.__loadStepName || null; } catch (e) {}
    try { if (typeof P !== 'undefined' && P) p = {x: P.x, y: P.y, z: P.z}; } catch (e) {}
    return { started: startedV, screen: screenV, step, p, pinned: !!window.__qaPinned, err: window.__qaPinErr || null, v1251: !!(window.__v1251) };
  });
  console.log('world', st);
  if (st.started && st.p) { worldReady = true; break; }
  await page.waitForTimeout(1500);
}
if (!worldReady) {
  console.log('FAILED: world did not start');
  await page.screenshot({path: path.join(OUT, 'fail-boot.png')});
  await browser.close(); server.close();
  process.exit(1);
}
// Let nearby chunks stream in after the early enter.
console.log('waiting for chunks to stream');
await page.waitForTimeout(8000);
try {
  await page.evaluate(() => {
    try { if (typeof rebuild === 'function') rebuild(80); } catch (e) {}
    try { if (typeof SET !== 'undefined') SET.dist = 2; } catch (e) {}
  });
} catch (e) {}
await page.waitForTimeout(3000);

// Prepare lighting, HUD, and a spawn in front of the player with trees if we can find them.
const prep = await page.evaluate(() => {
  const out = { err: null };
  try {
    if (typeof paused !== 'undefined') paused = false;
    if (typeof dayClock !== 'undefined' && typeof CYCLE === 'number') dayClock = CYCLE * 0.18;
    if (typeof updateSky === 'function') updateSky(0);
    if (scene && scene.fog) { scene.fog.near = 40; scene.fog.far = 200; }
    ['hud','cross','hurt','vitals','hotbar','toast','goal','clockW','craft','menu'].forEach(id => {
      const e = document.getElementById(id); if (e) e.style.display = 'none';
    });
    function hideViewmodel() {
      try { if (typeof hand !== 'undefined' && hand) hand.visible = false; } catch (e) {}
      try { if (typeof fist !== 'undefined' && fist) fist.visible = false; } catch (e) {}
      try { if (typeof worldModel !== 'undefined' && worldModel) worldModel.visible = false; } catch (e) {}
      try { if (typeof heldMesh !== 'undefined' && heldMesh) heldMesh.visible = false; } catch (e) {}
      try { if (typeof held !== 'undefined' && held && held.visible !== undefined) held.visible = false; } catch (e) {}
      try {
        const fpa = window.__fpa;
        if (fpa) {
          if (fpa.visible !== undefined) fpa.visible = false;
          if (fpa.traverse) fpa.traverse(o => { o.visible = false; });
        }
      } catch (e) {}
      try { camera.children.forEach(c => { c.visible = false; c.traverse(o => { o.visible = false; }); }); } catch (e) {}
    }
    hideViewmodel();
    window.__qaHideVM = hideViewmodel;

    const U = window.__v1251;
    const C = window.__popstarCore;
    if (!U || !C) throw new Error('missing v1251/core');

    // Prefer a patch of ground that has some trees nearby for scale.
    const px = P.x, pz = P.z;
    function ground(x, z) {
      try { return U.footGround(x, z); } catch (e) { return P.y || 0; }
    }
    function treeScore(x, z) {
      let n = 0;
      const Hgt = (typeof H === 'number') ? H : 90;
      for (let dx = -10; dx <= 10; dx += 2) for (let dz = -10; dz <= 10; dz += 2) {
        const bx = Math.floor(x + dx), bz = Math.floor(z + dz);
        for (let y = Hgt - 1; y >= 0; y--) {
          if (typeof getB !== 'function') break;
          const b = getB(bx, y, bz);
          if (!b) continue;
          if (typeof LEAFY !== 'undefined' && LEAFY[b]) { n++; break; }
          if (typeof T !== 'undefined' && (b === T.LOG || b === T.WOOD || b === T.LEAF || b === T.LEAVES)) { n++; break; }
        }
      }
      return n;
    }
    let best = {x: px + 28, z: pz + 8, s: -1, y: ground(px + 28, pz + 8)};
    for (let dx = 18; dx <= 48; dx += 6) {
      for (let dz = -24; dz <= 24; dz += 6) {
        const x = px + dx, z = pz + dz;
        const y = ground(x, z);
        if (y < 2) continue;
        const s = treeScore(x, z);
        if (s > best.s) best = {x, z, y, s};
      }
    }
    // Face her toward the player: yaw so she looks back at px,pz
    const yaw = Math.atan2(px - best.x, pz - best.z);
    const rec = U.spawnAt(best.x, best.y, best.z, yaw);
    out.spawn = {x: best.x, y: best.y, z: best.z, yaw, trees: best.s, ok: !!rec};
    out.player = {x: px, y: P.y, z: pz};
    window.__qaPop = { rec, C, U, yaw, gx: best.x, gy: best.y, gz: best.z };
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
  return out;
});
console.log('prep', JSON.stringify(prep));
if (prep.err || !prep.spawn || !prep.spawn.ok) {
  await page.screenshot({path: path.join(OUT, 'fail-prep.png')});
  await browser.close(); server.close();
  process.exit(1);
}

async function shoot(name, poseId, cam) {
  const meta = await page.evaluate(({poseId, cam}) => {
    const info = { err: null };
    try {
      if (typeof paused !== 'undefined') paused = true;
      const {rec, C, yaw, gx, gy, gz} = window.__qaPop;
      // Same hold time as the studio preview (mid-stride, even beat).
      const seq = C.POSE_SEQ;
      let acc = 0, t = 0.25 * C.BEAT;
      for (const [pid, dur] of seq) {
        if (pid === poseId && dur > 0.6) { t = acc + Math.min(dur * 0.55, dur - 0.05); break; }
        acc += dur;
      }
      const beat = C.BEAT;
      const step = Math.round(t / beat);
      const even = (step % 2 === 0) ? step : step + 1;
      t = (even + 0.22) * beat;
      const st = C.stepState(t);
      C.applyPose(rec.parts, st, { l: 0, r: 0, h: 0 });
      rec.g.position.set(gx, gy, gz);
      rec.g.rotation.set(0, yaw, 0);
      rec.g.updateMatrixWorld(true);

      if (typeof window.__qaHideVM === 'function') window.__qaHideVM();
      if (scene && scene.fog) { scene.fog.near = 40; scene.fog.far = 240; }
      if (typeof daylight !== 'undefined' && daylight < 0.7 && typeof dayClock !== 'undefined') {
        dayClock = CYCLE * 0.18; if (typeof updateSky === 'function') updateSky(0);
      }

      const wide = cam === 'wide';
      const Wpx = wide ? 1280 : 412, Hpx = wide ? 720 : 915;
      try { renderer.setSize(Wpx, Hpx, false); } catch (e) {}

      // Full-body, ground-level, looking up: ~40 blocks back so all 32 blocks of her fit.
      const dist = cam === 'close' ? 22 : cam === 'wide' ? 48 : 42;
      const height = 1.6;
      const lookY = cam === 'close' ? gy + 20 : gy + 14;
      const cx = gx + Math.sin(yaw) * dist;
      const cz = gz + Math.cos(yaw) * dist;
      const sx = cx + Math.cos(yaw) * (dist * 0.16);
      const sz = cz - Math.sin(yaw) * (dist * 0.16);
      camera.position.set(sx, gy + height, sz);
      camera.up.set(0, 1, 0);
      camera.lookAt(gx, lookY, gz);
      camera.fov = wide ? 42 : cam === 'close' ? 38 : 46;
      camera.aspect = Wpx / Hpx;
      camera.near = 0.1; camera.far = 500;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      renderer.render(scene, camera);
      info.t = t; info.pose = st.pose;
      info.data = renderer.domElement.toDataURL('image/png');
    } catch (e) { info.err = String(e && e.stack || e).slice(0, 400); }
    return info;
  }, {poseId, cam});
  if (meta.err) {
    console.log('shoot err', name, meta.err);
    return;
  }
  const buf = Buffer.from(meta.data.split(',')[1], 'base64');
  const fp = path.join(OUT, name);
  fs.writeFileSync(fp, buf);
  console.log('wrote', fp, buf.length, 't=', meta.t, 'pose=', meta.pose);
}

await shoot('world-pose1-up.png', 1, 'up');
await shoot('world-pose2-up.png', 2, 'up');
await shoot('world-pose3-up.png', 3, 'up');
await shoot('world-pose4-up.png', 4, 'up');
await shoot('world-pose2-close.png', 2, 'close');
await shoot('world-pose4-close.png', 4, 'close');
await shoot('world-pose2-wide.png', 2, 'wide');
await shoot('world-pose4-wide.png', 4, 'wide');

await page.evaluate(() => { try { if (typeof paused !== 'undefined') paused = false; } catch (e) {} });
await browser.close();
server.close();
console.log('done');
