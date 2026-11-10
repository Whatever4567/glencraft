// In-world WebGL capture of hooked sheep3 on real terrain.
// Headless Chromium + SwiftShader, 412x915 (Android portrait).
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire('/home/box/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json');
const {chromium} = require('playwright');

const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.argv[3] || '/workspace/qa/phase3/sheep/world';
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
  if (!fp.startsWith(path.resolve(ROOT))) { res.writeHead(403); res.end(); return; }
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
const page = await browser.newPage({viewport: {width: 412, height: 915}, deviceScaleFactor: 1});
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('console', m => {
  const t = m.text();
  if (/qa-sheep|error|Error|WEBGL|Texture marked|sheep3|load:/i.test(t)) console.log('console', t.slice(0, 400));
});
await page.addInitScript(() => { window.__loadChunkR = 2; });

console.log('goto');
await page.goto('http://127.0.0.1:' + port + '/index.html?qa=sheep3', {waitUntil: 'domcontentloaded', timeout: 180000});

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
  await page.evaluate(() => { try { const i = document.getElementById('worldName'); if (i) i.value = 'Live 1253 QA'; } catch (e) {} });
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
  const out = { err: null, cats: [], spawns: [] };
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

    // Report live catalogue only — do not override pig3/sheep3.
    const seen = [];
    for (const C of [window.__c135, window.__c136, window.__hd, window.__c257]) {
      if (C && C.cat && C.cat.pig) seen.push({pig: C.cat.pig, sheep: C.cat.sheep});
    }
    out.cats = seen;

    const px = P.x, pz = P.z, py = P.y;
    function ground(x, z) {
      try { if (typeof footGround === 'function') return footGround(x, z); } catch (e) {}
      for (let y = 90; y >= 1; y--) {
        try { if (typeof solid === 'function' && solid(x, y, z) && !solid(x, y+1, z)) return y + 1; } catch (e) {}
      }
      return py;
    }
    function spawn(kind, dx, dz) {
      const gx = px + dx, gz = pz + dz, gy = ground(gx, gz);
      window.__eggSpot = [gx, gy, gz];
      let rec = null, err = null;
      try { rec = spawnMob(kind); } catch (e) { err = String(e && e.message || e); }
      window.__eggSpot = null;
      return {kind, x: gx, y: gy, z: gz, ok: !!rec, rec, err};
    }
    const sheep = spawn('sheep', 8, 5);
    out.spawns = [
      {kind: 'sheep', x: sheep.x, y: sheep.y, z: sheep.z, ok: sheep.ok, err: sheep.err}
    ];
    out.player = {x: px, y: py, z: pz};
    window.__qaLive = { sheep: sheep.rec, sheepSpot: sheep };
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 600); }
  return out;
});
console.log('prep', JSON.stringify(prep));
if (prep.err || !prep.spawns || !prep.spawns.every(s => s.ok)) {
  await page.screenshot({path: path.join(OUT, 'world-fail-prep.png')});
  await browser.close(); server.close();
  process.exit(1);
}

// Let HD overlays (pig2 / sheep2 glb + webp) attach
await page.waitForTimeout(6000);

const hd = await page.evaluate(() => {
  function inspect(rec, kind) {
    const o = {kind, has: !!rec, hd: !!(rec && rec.__hd), err: null};
    try {
      if (!rec) return o;
      o.pos = rec.g ? {x: rec.g.position.x, y: rec.g.position.y, z: rec.g.position.z} : null;
      o.ang = rec.ang;
      o.scale = rec.g ? rec.g.scale.toArray() : null;
      const H = rec.__hd;
      if (!H) return o;
      o.hdOn = H.on;
      o.clips = H.act ? Object.keys(H.act) : [];
      o.v = H.v;
      const maps = [];
      let undefinedImg = 0, withImg = 0, noMap = 0, skinned = 0, meshes = 0, tris = 0;
      const box = {min:[1e9,1e9,1e9], max:[-1e9,-1e9,-1e9]};
      (H.hd || rec.g).updateMatrixWorld(true);
      (H.hd || rec.g).traverse(obj => {
        if (!obj.isMesh) return;
        meshes++;
        if (obj.isSkinnedMesh) skinned++;
        const g = obj.geometry;
        if (g && g.index) tris += g.index.count / 3;
        else if (g && g.attributes.position) tris += g.attributes.position.count / 3;
        const mats = [].concat(obj.material || []);
        for (const m of mats) {
          if (!m) continue;
          if (!m.map) { noMap++; continue; }
          const img = m.map.image;
          if (!img) undefinedImg++;
          else withImg++;
          maps.push({name: m.name || obj.name, map: !!(img && (img.width || img.src)), w: img && img.width, wrap: m.map.wrapS, type: m.type});
        }
        if (g && g.boundingBox) {
          // skip
        }
        if (obj.geometry) {
          const b = new THREE.Box3().setFromObject(obj);
          for (let i = 0; i < 3; i++) {
            const k = ['x','y','z'][i];
            box.min[i] = Math.min(box.min[i], b.min[k]);
            box.max[i] = Math.max(box.max[i], b.max[k]);
          }
        }
      });
      o.maps = maps.slice(0, 6);
      o.undefinedImg = undefinedImg;
      o.withImg = withImg;
      o.noMap = noMap;
      o.skinned = skinned;
      o.meshes = meshes;
      o.tris = tris;
      o.worldBox = box;
      o.boxH = box.max[1] - box.min[1];
      o.feetY = box.min[1];
      // CPU-skinned world bbox (setFromObject is unskinned / misleading)
      try {
        const sb = new THREE.Box3();
        const v = new THREE.Vector3(), tmp = new THREE.Vector3(), acc = new THREE.Vector3(), w4 = new THREE.Vector3(), M = new THREE.Matrix4();
        (H.m || H.hd).updateMatrixWorld(true);
        (H.m || H.hd).traverse(obj => {
          if (!obj.isSkinnedMesh || !obj.skeleton || !obj.geometry) return;
          obj.skeleton.update();
          const p = obj.geometry.attributes.position, si = obj.geometry.attributes.skinIndex, sw = obj.geometry.attributes.skinWeight;
          const step = Math.max(1, (p.count / 800) | 0);
          for (let i = 0; i < p.count; i += step) {
            v.set(p.getX(i), p.getY(i), p.getZ(i));
            if (si && sw) {
              tmp.copy(v).applyMatrix4(obj.bindMatrix);
              acc.set(0, 0, 0);
              for (let k = 0; k < 4; k++) {
                const w = sw.getComponent(i, k); if (!w) continue;
                M.multiplyMatrices(obj.skeleton.bones[si.getComponent(i, k)].matrixWorld, obj.skeleton.boneInverses[si.getComponent(i, k)]);
                acc.addScaledVector(w4.copy(tmp).applyMatrix4(M), w);
              }
              v.copy(acc).applyMatrix4(obj.bindMatrixInverse);
            }
            v.applyMatrix4(obj.matrixWorld);
            sb.expandByPoint(v);
          }
        });
        o.skinBox = {min: sb.min.toArray(), max: sb.max.toArray(), size: sb.getSize(new THREE.Vector3()).toArray()};
        o.skinH = o.skinBox.size[1];
        o.skinFeet = o.skinBox.min[1];
        o.standing = o.skinH < 2.4 && o.skinH > 0.5 && (Math.max(o.skinBox.size[0], o.skinBox.size[2]) > o.skinH * 0.85);
      } catch (e) { o.skinErr = String(e && e.message || e); }
      o.yawFlag = H._yaw1248 || 0;
      o.r302 = !!H.r302;
      o.act = H.act ? Object.keys(H.act) : [];
      o.hdRot = H.hd ? {x:H.hd.rotation.x,y:H.hd.rotation.y,z:H.hd.rotation.z} : null;
      o.mRot = H.m ? {x:H.m.rotation.x,y:H.m.rotation.y,z:H.m.rotation.z} : null;
    } catch (e) { o.err = String(e && e.stack || e).slice(0, 400); }
    return o;
  }
  const L = window.__qaLive;
  return {sheep: inspect(L.sheep, 'sheep')};
});
console.log('hd', JSON.stringify(hd, null, 0));
fs.writeFileSync(path.join(OUT, 'inspect.json'), JSON.stringify({prep, hd}, null, 2));

async function poseWalk(kind, time) {
  return page.evaluate(({kind, time}) => {
    const rec = window.__qaLive[kind];
    const out = {ok: false};
    try {
      rec.moving = true;
      rec.flee = 0;
      rec.speed = 1.4;
      rec.grazeT = 1e9;
      if (rec.p8) { rec.p8.st = 'roam'; rec.p8.mud = 0; rec.p8.sink = 0; }
      const H = rec.__hd;
      if (H) {
        H.v = 1.4;
        const walk = H.act && (H.act.walk || H.act.Walk);
        if (walk && H.mix) {
          try { H.mix.stopAllAction(); } catch (_) {}
          walk.reset().play();
          walk.setLoop(THREE.LoopRepeat, Infinity);
          walk.setEffectiveWeight(1);
          walk.timeScale = 1;
          walk.time = time;
          walk.paused = true;
          H.mix.update(0);
          out.clip = walk.time;
          out.dur = walk.getClip ? walk.getClip().duration : (walk._clip && walk._clip.duration);
        }
        // keep them upright off mud
        try { if (rec.rig) { rec.rig.rotation.z = 0; rec.rig.position.x = 0; } } catch (_) {}
        try { H.hd.rotation.z = 0; } catch (_) {}
      }
      out.ok = true;
      out.hasHd = !!H;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    return out;
  }, {kind, time});
}

async function shoot(name, kind, camKind, extra) {
  const data = await page.evaluate(({kind, camKind, extra}) => {
    const info = {err: null};
    try {
      if (typeof paused !== 'undefined') paused = true;
      const rec = window.__qaLive[kind];
      rec.g.updateMatrixWorld(true);
      if (rec.__hd && rec.__hd.m) rec.__hd.m.updateMatrixWorld(true);
      const p = rec.g.position;
      const groundY = p.y;
      // Facing: pig3's mesh is authored along +Z (studio front confirms the face).
      // The Snout bone exported 180° from the mesh, so do not use Snout-Tail here.
      let fx = 0, fz = 1;
      try {
        const H = rec.__hd;
        if (H && H.m) {
          H.m.updateMatrixWorld(true);
          const v = new THREE.Vector3(0, 0, 1).applyQuaternion(H.m.getWorldQuaternion(new THREE.Quaternion()));
          const L = Math.hypot(v.x, v.z) || 1;
          fx = v.x / L; fz = v.z / L;
        }
      } catch (e) {}
      const rx = fz, rz = -fx;
      const ang = Math.atan2(fx, fz);
      const midY = groundY + (extra && extra.midY || 0.55);
      const dist = (extra && extra.dist) || 2.0;
      let cam;
      if (camKind === 'front') cam = {x: p.x + fx * dist, y: midY + 0.15, z: p.z + fz * dist, lx: p.x, ly: midY, lz: p.z};
      else if (camKind === 'threeq') cam = {x: p.x + fx * dist * 0.75 + rx * dist * 0.7, y: midY + 0.35, z: p.z + fz * dist * 0.75 + rz * dist * 0.7, lx: p.x, ly: midY - 0.05, lz: p.z};
      else if (camKind === 'side') cam = {x: p.x + rx * dist, y: midY + 0.2, z: p.z + rz * dist, lx: p.x, ly: midY, lz: p.z};
      else if (camKind === 'rear') cam = {x: p.x - fx * dist, y: midY + 0.25, z: p.z - fz * dist, lx: p.x, ly: midY, lz: p.z};
      else cam = {x: p.x + fx * 1.4 + rx * 1.1, y: midY + 0.55, z: p.z + fz * 1.4 + rz * 1.1, lx: p.x, ly: midY, lz: p.z};

      // Stand the player on the ground near the camera, look at the animal.
      P.x = cam.x;
      P.y = groundY;
      P.z = cam.z;
      const dx = cam.lx - cam.x, dy = cam.ly - (groundY + 1.6), dz = cam.lz - cam.z;
      const horiz = Math.hypot(dx, dz) || 1e-6;
      P.yaw = Math.atan2(-dx, -dz);
      P.pitch = Math.atan2(dy, horiz);
      try { if (typeof vel !== 'undefined' && vel) { vel.x = vel.y = vel.z = 0; } } catch (e) {}
      try { bobAmp = 0; bobMv = 0; landDip = 0; shake = 0; } catch (e) {}

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
      info.aim = {kind, camKind, ang, p: {x:p.x,y:p.y,z:p.z}, cam};
    } catch (e) { info.err = String(e && e.stack || e).slice(0, 500); }
    return info;
  }, {kind, camKind, extra: extra || {}});
  console.log('shot-aim', name, data.err || (data.aim && data.aim.p));

  await page.evaluate(() => { if (typeof paused !== 'undefined') paused = false; });
  await page.waitForTimeout(280);
  const post = await page.evaluate(() => ({
    cam: camera && camera.position ? [camera.position.x, camera.position.y, camera.position.z] : null,
    finite: camera && camera.position && Number.isFinite(camera.position.x),
    err: window.__qaCamErr || null
  }));
  console.log('shot-post', name, post);
  const pageBuf = await page.screenshot({type: 'png'});
  await page.evaluate(() => { if (typeof paused !== 'undefined') paused = true; });
  const fp = path.join(OUT, name);
  fs.writeFileSync(fp, pageBuf);
  console.log('wrote', fp, pageBuf.length);
}

// --- Idle / standing shots first (bind-pose risk) ---
for (const kind of ['sheep']) {
  const midY = 0.58;
  const dist = 2.3;
  await shoot(`${kind}-idle-front.png`, kind, 'front', {midY, dist});
  await shoot(`${kind}-idle-threeq.png`, kind, 'threeq', {midY, dist});
  await shoot(`${kind}-idle-side.png`, kind, 'side', {midY, dist: dist + 0.2});
}

// --- Mid-walk shots: pose the walk clip at two times, several angles ---
for (const kind of ['sheep']) {
  const midY = 0.58;
  const dist = 2.3;
  const posed = await poseWalk(kind, 0.35);
  console.log('poseWalk', kind, 't0.35', posed);
  await shoot(`${kind}-walk-front.png`, kind, 'front', {midY, dist});
  await shoot(`${kind}-walk-threeq.png`, kind, 'threeq', {midY, dist});
  await shoot(`${kind}-walk-side.png`, kind, 'side', {midY, dist: dist + 0.2});
  const posed2 = await poseWalk(kind, 0.70);
  console.log('poseWalk', kind, 't0.70', posed2);
  await shoot(`${kind}-walk-b-threeq.png`, kind, 'threeq', {midY, dist});
  await shoot(`${kind}-walk-b-rear.png`, kind, 'rear', {midY, dist});
}

await browser.close();
server.close();
console.log('live capture done');
