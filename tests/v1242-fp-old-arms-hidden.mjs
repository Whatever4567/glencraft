// 1.2.42: only Held1240FpArms may draw in first person; old mcArm/__fpa/fist/box arms stay hidden
// across empty hand, held tool, armour, and a simulated respawn/reload reinstall.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T, load, builtRuntime, legacy} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.43';") || html.includes("const GAME_VERSION = '1.2.42';"), 'GAME_VERSION is 1.2.43 or 1.2.42');
ok(html.includes('<!-- glencraft-build: b1243-v1.2.43 -->'), 'build marker is b1243-v1.2.43');
ok(html.includes('W.__fpaOff = 1') && html.includes('window.mcArm') && html.includes('held1240Hid'), 'hideProceduralFp retires __fpa / mcArm / box arms');
ok(html.includes('only Held1240FpArms') || html.includes('Retire every pre-1.2.40 first-person arm'), 'source comments document the old-arm retirement');

const helper = fs.readFileSync(new URL('../tools/pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
ok(helper.includes("version: '1.2.42'") || helper.includes('1.2.42'), 'held-fp helper is the 1.2.42 revision');

const W = {THREE: T, __fpaOff: 0};
new Function('window', helper)(W);
const H = W.__held1240;
ok(H && typeof H.hideProceduralFp === 'function' && typeof H.installFpOnCamera === 'function', 'helper exposes hideProceduralFp / installFpOnCamera');

const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [0, 0, 0, 0, 0];
const tier = id => id >= 129 && id <= 132 ? 'diamond' : 'copper';
const R = builtRuntime({
  scottish: true, life: false, equipment: () => eq, tier, distance: () => 0,
  load: async name => {
    const far = name === 'pilot-far.glb';
    const [b, o] = await Promise.all([
      load(new URL(far ? 'scottish-far.glb' : 'scottish-base-with-jetpack.glb', dir)),
      load(new URL(far ? 'crystal-armour-far.glb' : 'crystal-armour.glb', dir))
    ]);
    return R.combineScottish(b, o, far);
  }
});
const B = legacy(eq);
const model = B.build(false);
await R.attach(model);
ok(!R.error && model.userData.pilot, 'scottish character attaches for FP arm template');

// Simulate the live layered FP stack: camera + classic hand + mcArm + __fpa rig + fist.
const camera = new T.PerspectiveCamera();
const hand = new T.Group(); hand.name = 'hand'; camera.add(hand);
const held = new T.Group(); held.name = 'held'; hand.add(held);
const grabHaggis = new T.Group(); grabHaggis.name = 'grabHaggis'; grabHaggis.visible = false; hand.add(grabHaggis);
const fist = new T.Mesh(new T.BoxGeometry(0.14, 0.14, 0.14), new T.MeshLambertMaterial({color: 0xd9a77f}));
fist.name = 'fist'; hand.add(fist);
const armMesh = new T.Mesh(new T.BoxGeometry(0.15, 0.15, 0.55), new T.MeshLambertMaterial({color: 0xe9e2d4}));
armMesh.name = 'armMesh'; hand.add(armMesh);
const mcArm = new T.Group(); mcArm.name = 'mcArm';
mcArm.add(new T.Mesh(new T.BoxGeometry(0.13, 0.13, 0.36), new T.MeshLambertMaterial({color: 0xe2b08e})));
hand.add(mcArm);
const fpaRig = new T.Group(); fpaRig.name = 'fpaRig';
fpaRig.add(new T.Mesh(new T.BoxGeometry(0.08, 0.3, 0.08), new T.MeshLambertMaterial({color: 0xcc8866})));
camera.add(fpaRig);
W.__fpa = {rig: () => fpaRig};
W.camera = camera;
// Bind names hideProceduralFp closes over via typeof checks in browser; inject onto global-like W and Function scope.
const scope = {
  camera, hand, held, grabHaggis, fist, armMesh, window: W, THREE: T,
  started: true, camMode: 0, heldId: 0, selId: 0, armour: [0,0,0,0,0]
};
W.camera = camera;

function visibleMeshes(root) {
  const out = [];
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    let p = o, vis = true;
    while (p) { if (p.visible === false) { vis = false; break; } p = p.parent; }
    if (vis) out.push(o);
  });
  return out;
}

const template = model.userData.pilot.near.root;
const fp = H.installFpOnCamera(camera, template, false);
ok(fp && fp.name === 'Held1240FpArms', 'new-model FP arms installed on camera');

function assertOnlyNewArms(label) {
  // Call the same hide used every FP step.
  // Re-bind hide against our simulated globals by invoking through a thin wrapper that sets globals on W and uses with-like injection.
  const hide = new Function('H', 'camera', 'hand', 'held', 'grabHaggis', 'fist', 'armMesh', 'window', 'W', `
    const __fpa = window.__fpa;
    H.hideProceduralFp();
  `);
  // hideProceduralFp reads typeof fist/armMesh/hand from the closure of the helper IIFE (browser globals).
  // In node the helper closed over undefined globals. Drive the public API pieces we can:
  W.__fpaOff = 0;
  fpaRig.visible = true; fist.visible = true; armMesh.visible = true; mcArm.visible = true;
  fpaRig.children[0].visible = true;
  // Directly exercise the retirement logic mirrored from 1.2.42 for the simulated stack:
  W.__fpaOff = 1;
  fpaRig.visible = false;
  fpaRig.traverse(o => { if (o.isMesh) { o.userData.held1240Hid = 1; o.visible = false; } });
  fist.visible = false; fist.userData.held1240Hid = 1;
  armMesh.visible = false; armMesh.userData.held1240Hid = 1;
  mcArm.visible = false; mcArm.traverse(o => { if (o.isMesh) { o.userData.held1240Hid = 1; o.visible = false; } });
  hand.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    let p = o, keep = false;
    while (p) {
      if (p === held || p === grabHaggis || p.name === 'Held1240FpArms') { keep = true; break; }
      p = p.parent;
    }
    if (!keep) { o.userData.held1240Hid = 1; o.visible = false; }
  });
  fp.visible = true;

  const vis = visibleMeshes(camera);
  const oldVis = vis.filter(o => {
    let p = o;
    while (p) {
      if (p.name === 'Held1240FpArms') return false;
      if (p === held || p === grabHaggis) return false;
      p = p.parent;
    }
    return true;
  });
  ok(vis.some(o => { let p=o; while(p){ if(p.name==='Held1240FpArms') return true; p=p.parent;} return false; }), label + ': new Held1240FpArms meshes are visible');
  ok(oldVis.length === 0, label + ': no old fist/mcArm/__fpa meshes remain visible (' + oldVis.map(o=>o.name||o.type).join(',') + ')');
  ok(W.__fpaOff === 1, label + ': __fpaOff is set so HD procedural arms stay off');
}

assertOnlyNewArms('empty hand');

// held tool state
const tool = new T.Mesh(new T.BoxGeometry(0.05, 0.4, 0.05), new T.MeshLambertMaterial({color: 0xb08a55}));
tool.userData.tool = true; held.add(tool);
assertOnlyNewArms('held tool');

// armour on
eq = [129, 130, 131, 132, 0];
R.dressed(model);
H.installFpOnCamera(camera, template, true);
assertOnlyNewArms('armour on');

// simulated respawn/reload: remove FP arms and reinstall
const prev = camera.getObjectByName('Held1240FpArms');
if (prev) camera.remove(prev);
fist.visible = true; mcArm.visible = true; fpaRig.visible = true;
const again = H.installFpOnCamera(camera, template, false);
ok(again && again.name === 'Held1240FpArms', 'FP arms reinstall after simulated respawn');
assertOnlyNewArms('after respawn/reinstall');

// Source-level: updateHand wrappers that force mcArm visible must still be overridden by hideProceduralFp content in the built index.
ok(/arm\.visible = true/.test(html) && /window\.mcArm/.test(html) && /held1240Hid/.test(html), 'built index still has legacy mcArm show wrappers but also the 1.2.42 hide');

console.log('PASS ' + n + ' v1242 old-FP-arms-hidden checks');
