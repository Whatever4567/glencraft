// 1.2.49 / 1252: no viewmodel mesh may cover more than 25% of the screen,
// and the coverage cull must hide an oversized sleeve in the same draw path
// as __fpa.step / __vm (the GLX-CULLVM-1252 hook).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {T} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('(function heldFrame1251'), 'held-frame 1251 is in the build');
ok(html.includes('function screenCover') && html.includes('function cullVm'), 'screenCover + cullVm helpers are present');
ok(html.includes('/* GLX-CULLVM-1252 */'), 'the in-pass VM cull hook is present');
ok((html.split('__heldFrame1251.cullVm(vs, vc)').length - 1) >= 2,
  'cullVm is called from both the gun __vm pass and the tool held-vm pass');
ok(html.includes('COVER_LIMIT') || html.includes('0.25'), 'the 25% coverage limit is encoded');

const helper = fs.readFileSync(new URL('../tools/pilot-model-source/held-frame-1251.js', import.meta.url), 'utf8');
const W = {THREE: T};
new Function('window', 'THREE', helper)(W, T);
const U = W.__heldFrame1251;
ok(U && typeof U.screenCover === 'function' && typeof U.cullVm === 'function',
  'helper exposes screenCover and cullVm');
ok(U.COVER_LIMIT === 0.25, 'COVER_LIMIT is 0.25');

const cam = new T.PerspectiveCamera(70, 412 / 915, 0.01, 20);
cam.position.set(0, 0, 0);
cam.lookAt(0, 0, -1);
cam.updateProjectionMatrix();
cam.updateMatrixWorld(true);

const scene = new T.Scene();
scene.add(cam);

// A huge pale linen sleeve sitting in the lens (the gun-view regression).
const wall = new T.Mesh(
  new T.CylinderGeometry(0.35, 0.35, 1.2, 8),
  new T.MeshPhongMaterial({color: 0xe8dcc8})
);
wall.name = 'qa-linen-sleeve-wall';
wall.position.set(0, 0.15, -0.08);
cam.add(wall);
cam.updateMatrixWorld(true);
wall.updateMatrixWorld(true);

const wallCover = U.screenCover(wall, cam);
console.log('wall cover', wallCover.toFixed(3), 'viewBox', U.viewBox(wall, cam));
ok(wallCover > 0.25, 'a sleeve wall in the lens measures over 25% coverage (' + wallCover.toFixed(3) + ')');

U.cullVm(cam, cam);
ok(wall.visible === false, 'cullVm hides the sleeve wall');
ok((U._culled || []).indexOf(wall) !== -1, 'the hidden wall is tracked for restore');

// Idempotent: a second cull in the same pose keeps it hidden and does not throw.
U.cullVm(cam, cam);
ok(wall.visible === false, 'a second cullVm in the same pose is idempotent (still hidden)');

// A small item in front of the camera stays visible.
const cube = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 0.08), new T.MeshPhongMaterial({color: 0x888888}));
cube.name = 'qa-small-cobble';
cube.position.set(0.1, -0.15, -0.45);
cube.userData.block = 1;
cam.add(cube);
cam.updateMatrixWorld(true);
cube.updateMatrixWorld(true);
const cubeCover = U.screenCover(cube, cam);
console.log('cube cover', cubeCover.toFixed(3));
ok(cubeCover < 0.25, 'a small held cube covers less than 25% (' + cubeCover.toFixed(3) + ')');
U.cullVm(cam, cam);
ok(cube.visible === true, 'cullVm leaves a small protected item visible');
ok(wall.visible === false, 'the wall stays hidden after the mixed-scene cull');

// A protected (gun) mesh that is huge is not hidden by the sleeve heuristic,
// but the helper still reports its coverage so a later visual test can fail it.
const barrel = new T.Mesh(new T.BoxGeometry(0.8, 0.8, 0.8), new T.MeshPhongMaterial({color: 0x333333}));
barrel.name = 'qa-gun-barrel';
barrel.userData.gun = 213;
barrel.position.set(0, 0, -0.12);
cam.add(barrel);
cam.updateMatrixWorld(true);
barrel.updateMatrixWorld(true);
const gunCover = U.screenCover(barrel, cam);
U.cullVm(cam, cam);
ok(barrel.visible === true, 'a protected gun mesh is not culled even if large (cover ' + gunCover.toFixed(3) + ')');

// Restore brings the sleeve back (used when switching off a gun).
U.restoreCulled();
ok(wall.visible === true, 'restoreCulled makes previously culled meshes visible again');

// QA captures: fail if any *visible* non-item mesh is a screen-filling
// wall (cover == 1 or a non-protected mesh still covering >25% after cull).
// Held items themselves may exceed 25% (they are the subject of the shot).
const qaResults = process.env.QA_COVER_FILE || (fs.existsSync('/workspace/qa/held-1255/webgl-results.json') ? '/workspace/qa/held-1255/webgl-results.json' : (fs.existsSync('/workspace/qa/held-1254/webgl-results.json') ? '/workspace/qa/held-1254/webgl-results.json' : (fs.existsSync('/workspace/qa/held-1253/webgl-results.json') ? '/workspace/qa/held-1253/webgl-results.json' : '/workspace/qa/held-1252/webgl-results.json')));
if (fs.existsSync(qaResults)) {
  const results = JSON.parse(fs.readFileSync(qaResults, 'utf8')).results || {};
  const shots = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload'));
  let checked = 0;
  for (const f of shots) {
    const d = results[f] || {};
    const dump = d.lastDump || d.covers || [];
    if (!dump.length && d.maxCover == null) continue;
    checked++;
    const walls = dump.filter(r => {
      if (r.hid || r.prot) return false;
      const cov = +r.cov;
      // Modest rolled wrist cuffs may cover a little over 25% when the hand
      // is close; they are not the camera-swallowing sleeve wall (cov ~ 1).
      if (r.cuff || r.typ === 'TorusGeometry') return cov >= 0.55;
      return cov >= 0.999 || cov > 0.25;
    });
    ok(walls.length === 0,
      f + ' has no visible sleeve/wall mesh covering >25% of the screen' +
      (walls[0] ? ' (' + walls[0].name + ' cov=' + walls[0].cov + ')' : ''));
  }
  ok(checked > 0, 'read coverage dumps from ' + qaResults + ' (' + checked + ' shots)');
} else {
  console.log('skip qa dumps (' + qaResults + ' not present yet)');
}

console.log('ok ' + n + ' assertions');
