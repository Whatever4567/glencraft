// pig2 hang fix: C302.skeleton.pose() drops the Armature bind so the skinned
// mesh hangs snout-down; C310 then rescales that hanging volume to "correct"
// height, and clearing H.act stops the walk clip. This test checks the hook
// no longer does that, and that the rest pose is a standing quadruped.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ---- hook contracts ----
const c302 = html.indexOf('/* GLX-C302');
const c302End = html.indexOf('/* GLX-C304', c302);
assert(c302 > 0 && c302End > c302, 'C302 block present');
const c302Body = html.slice(c302, c302End);
assert(c302Body.includes("if (c.f === 'pig2')"), 'C302 skips procedural remapping for pig2');
// The pose()/act-clear lives in rig(), which must not be called for pig2.
const pigSkip = c302Body.indexOf("if (c.f === 'pig2')");
const rigCall = c302Body.indexOf('H.r302 = rig(a, H, cf)');
assert(pigSkip > 0 && pigSkip < rigCall, 'pig2 return is before rig() / pose() / act-clear');

const driveStart = html.indexOf('function drivePigClip');
const driveEnd = html.indexOf('function hookPigHdFrame', driveStart);
assert(driveStart > 0 && driveEnd > driveStart, 'drivePigClip present');
const drive = html.slice(driveStart, driveEnd);
const driveCode = drive.replace(/\/\/[^\n]*/g, '');
assert(!/skeleton\.pose\s*\(/.test(driveCode), 'drivePigClip must not call skeleton.pose() on pig2');
assert(drive.includes('act.walk') || drive.includes("H.act.walk"), 'drivePigClip still drives the walk clip');

const c310 = html.indexOf('/* GLX-C310');
const c310End = html.indexOf('/* GLX-C311', c310);
assert(c310 > 0 && c310End > c310, 'C310 block present');
assert(html.slice(c310, c310End).includes("c.f === 'pig2'"), 'C310 does not fit/remap a hanging pig2');

// Live catalogue uses the remade pig3; the pig2 hang-fix hooks above stay in place.
assert(/pig:\s*\{[^}]*f:\s*'pig3'/.test(html), 'live catalogue uses pig3');

// ---- rest pose is upright (CPU-skinned) ----
const THREE_ROOTS = [
  '/workspace/glencraft-anatomy-tools/node_modules/three',
  path.join(ROOT, 'node_modules/three'),
  path.join(here, 'node_modules/three'),
];
let THREE_ROOT = THREE_ROOTS.find(p => fs.existsSync(path.join(p, 'build/three.module.js')));
assert(THREE_ROOT, 'three.js module not found for CPU-skin check');

globalThis.self = globalThis;
const THREE = await import(pathToFileURL(path.join(THREE_ROOT, 'build/three.module.js')).href);
const {GLTFLoader} = await import(pathToFileURL(path.join(THREE_ROOT, 'examples/jsm/loaders/GLTFLoader.js')).href);
const {MeshoptDecoder} = await import(pathToFileURL(path.join(THREE_ROOT, 'examples/jsm/libs/meshopt_decoder.module.js')).href);
await MeshoptDecoder.ready;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const buf = fs.readFileSync(path.join(ROOT, 'assets/models/pig2.glb'));
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));

function skinnedBox(root) {
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.update(); });
  const v = new THREE.Vector3(), t = new THREE.Vector3(), acc = new THREE.Vector3(), w4 = new THREE.Vector3(), M = new THREE.Matrix4();
  const box = new THREE.Box3();
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
    const step = Math.max(1, (p.count / 1200) | 0);
    for (let i = 0; i < p.count; i += step) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      if (o.isSkinnedMesh && si && sw && o.skeleton) {
        t.copy(v).applyMatrix4(o.bindMatrix);
        acc.set(0, 0, 0);
        for (let k = 0; k < 4; k++) {
          const w = sw.getComponent(i, k); if (!w) continue;
          M.multiplyMatrices(o.skeleton.bones[si.getComponent(i, k)].matrixWorld, o.skeleton.boneInverses[si.getComponent(i, k)]);
          acc.addScaledVector(w4.copy(t).applyMatrix4(M), w);
        }
        v.copy(acc).applyMatrix4(o.bindMatrixInverse);
      }
      v.applyMatrix4(o.matrixWorld);
      box.expandByPoint(v);
    }
  });
  const size = box.getSize(new THREE.Vector3());
  return {min: box.min, max: box.max, size};
}

const rest = skinnedBox(gltf.scene);
assert(rest.min.y > -0.2 && rest.min.y < 0.2, 'rest feet near y=0, got minY=' + rest.min.y);
assert(rest.size.y > 0.6 && rest.size.y < 2.0, 'rest height is a standing pig, got ' + rest.size.y);
assert(rest.size.x > rest.size.y, 'rest length (X) longer than height — standing, not hung, size=' + rest.size.toArray());

// Document the footgun: pose() on this asset is not a valid rest.
const posed = gltf.scene.clone(true);
// clone(true) can break skin bindings; pose the original after measuring rest.
gltf.scene.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose(); });
const hung = skinnedBox(gltf.scene);
assert(hung.size.y > 10, 'skeleton.pose() on pig2 is the hang/explode footgun, got h=' + hung.size.y);

console.log(JSON.stringify({
  rest: {minY: +rest.min.y.toFixed(3), size: rest.size.toArray().map(n => +n.toFixed(3))},
  afterPose: {minY: +hung.min.y.toFixed(2), size: hung.size.toArray().map(n => +n.toFixed(2))},
}, null, 2));
console.log('pig2-hang-fix: hook skip + standing rest pose PASS');
