// 1.2.57: the player can walk up to the pop star's feet, stops on her
// legs/feet collider, and her meshes stay visible and in-frustum when
// looking up from there.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const coreSrc = fs.readFileSync(path.join(root, 'tools/popstar-source/popstar-core.js'), 'utf8');
const runSrc = fs.readFileSync(path.join(root, 'tools/content-source/v1251-popstar.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(runSrc.includes('U.COLLIDE_R') && runSrc.includes('U.solidAt') && runSrc.includes('window.collides'),
  'runtime has a solid feet/legs cylinder hooked into collides');
ok(runSrc.includes('frustumCulled = false') && coreSrc.includes('boundingSphere') && coreSrc.includes('DoubleSide'),
  'meshes stay unculled, with generous bounds and DoubleSide materials');
ok(html.includes('U.COLLIDE_R') && html.includes('U.solidAt') && html.includes('window.collides'),
  'index.html bake includes the feet/legs collider');

function vec(x, y, z) {
  return {x, y, z, set(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; return this; }};
}

const mats = [{fog: true, transparent: true, opacity: 0.2, side: 0}];
const mesh = {
  isMesh: true,
  visible: true,
  frustumCulled: true,
  material: mats[0],
  geometry: {boundingSphere: {radius: 1}, computeBoundingSphere() { this.boundingSphere = this.boundingSphere || {radius: 1}; }}
};
const group = {
  position: vec(40, 10, 40),
  rotation: Object.assign(vec(0, 0, 0), {y: 0}),
  visible: true,
  frustumCulled: false,
  parent: null,
  children: [mesh],
  traverse(fn) { fn(this); fn(mesh); },
  add() {}
};

const hits = [];
function collides(x, y, z) {
  // world floor only
  return y < 10;
}
const scene = {add(g) { g.parent = scene; }, remove(g) { g.parent = null; }};
const camera = {position: vec(40, 11.6, 42.7), near: 0.5, fov: 70, updateProjectionMatrix() { this.updated = true; }};
const P = {x: 20, y: 11, z: 20, yaw: 0, vy: 0, kbx: 0, kbz: 0};
const T = {WATER: 8, LAVA: 9, STILL_WATER: 10};
function getB(x, y, z) { return y < 10 ? 1 : 0; }
const ctx = {
  console, Math, performance: {now: () => 0}, Object, Array, Error,
  setInterval() { return 0; }, clearInterval() {}, setTimeout() { return 0; }, clearTimeout() {},
  location: {search: ''},
  THREE: {DoubleSide: 2, Sphere: function (c, r) { this.center = c; this.radius = r; }, Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; }, PointLight: function () { this.position = vec(0, 0, 0); }},
  scene, camera, P, AC: null, SET: {sfx: 0, music: 0},
  started: true, paused: false, daylight: 1, dayNum: 1, caveK: 0, DIM: {cur: 0},
  W: 200, D: 200, H: 90, T, getB, solid: (x, y, z) => getB(x, y, z) !== 0,
  mobs: [], LEAFY: {}, PLANT: {},
  updatePlayer() {}, updateMobs() {}, placeCamera() {}, onDawn() {}, initAudio() {}, enterWorld() {}, damageMob(a){return a;}, hurt() {}, removeMob() {},
  toast() {}, burst() {}, collides,
  window: null, globalThis: null
};
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(coreSrc, ctx);
const C = ctx.__popstarCore;
C.make = function () { return {g: group, mats, parts: {g: group, mats}}; };
C.applyPose = function () {};
vm.runInContext(runSrc, ctx);
const U = ctx.__v1251;
ok(U && U.COLLIDE_R >= 2.2 && U.COLLIDE_R <= 3.2, 'collider radius is a feet/legs cylinder');

const rec = U.spawnAt(40, 10, 40, 0);
ok(rec && rec.g.position.x === 40, 'she spawned at the origin of the test yard');

// Push the player from far away toward her center, simulating many moveAxis steps.
P.x = rec.g.position.x + 12;
P.y = rec.g.position.y + 1.0;
P.z = rec.g.position.z;
const r = U.COLLIDE_R;
const step = 0.2;
for (let i = 0; i < 80; i++) {
  const nx = P.x - step;
  if (!ctx.collides(nx, P.y, P.z)) P.x = nx;
  else break;
}
const dist = Math.hypot(P.x - rec.g.position.x, P.z - rec.g.position.z);
ok(dist >= r - 1e-6, 'walking in, collides stops the player outside the cylinder (dist=' + dist.toFixed(3) + ', r=' + r + ')');
ok(dist < r + step + 0.05, 'the player can reach her feet (stopped just outside, dist=' + dist.toFixed(3) + ')');
ok(!U.solidAt(rec.g.position.x + r + 0.05, P.y, rec.g.position.z), 'just outside the radius is walkable');
ok(U.solidAt(rec.g.position.x + r - 0.05, P.y, rec.g.position.z), 'just inside the radius is solid');

// Looking up from her feet: meshes visible, not frustum-culled, generous bounds.
P.x = rec.g.position.x + r + 0.05;
P.z = rec.g.position.z;
camera.position.set(P.x, P.y + 1.6, P.z);
// Look up at her torso / head
const eyeY = camera.position.y;
const mid = rec.g.position.y + 16;
const hd = Math.max(0.2, Math.hypot(rec.g.position.x - P.x, rec.g.position.z - P.z));
P.pitch = -Math.atan2(mid - eyeY, hd);
ctx.placeCamera();
ok(rec.g.visible === true && rec.g.frustumCulled === false, 'root stays visible and unculled from her feet');
ok(mesh.frustumCulled === false && mesh.visible !== false, 'child meshes stay unculled and visible looking up');
ok(mesh.geometry.boundingSphere.radius >= 48, 'generous bounding sphere so close-up frustum tests keep her');
ok(mats[0].side === 2, 'DoubleSide so looking up at a close boot/skirt is not backface-culled');
ok(typeof camera.near === 'number' && camera.near <= 0.08, 'near plane tightened so close geometry is not clipped (near=' + camera.near + ')');

console.log('v1257-popstar-feet ok', n);
