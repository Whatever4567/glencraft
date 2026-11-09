// 1.2.51: pop-star materials are fully opaque and unfogged; she only spawns
// and wanders on dry land (200 random steps never enter water); teleport
// framing picks dry land at a head-to-feet viewing distance.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const coreSrc = fs.readFileSync(path.join(root, 'tools/popstar-source/popstar-core.js'), 'utf8');
const runSrc = fs.readFileSync(path.join(root, 'tools/content-source/v1251-popstar.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(/fog\s*:\s*false/.test(coreSrc), 'core defaults include fog:false');
ok(/transparent\s*:\s*false/.test(coreSrc), 'core defaults include transparent:false');
ok(/depthWrite\s*:\s*true/.test(coreSrc), 'core defaults include depthWrite:true');
ok(coreSrc.includes('P.dressVisible') && coreSrc.includes('frustumCulled = false'), 'dressVisible disables frustum culling');
ok(coreSrc.includes('PointLight') && /emissiveIntensity = 1\.05/.test(coreSrc), 'she has her own fill light and a vivid dress emissive');
ok(runSrc.includes('U.proposeStep') && runSrc.includes('function landY') && runSrc.includes('isFluid'), 'runtime has dry-land helpers');

const coreCtx = { console, window: {}, globalThis: null, THREE: {
  MeshPhongMaterial: function (o) { Object.assign(this, o); },
  MeshLambertMaterial: function (o) { Object.assign(this, o); },
  Group: function () { this.children = []; this.frustumCulled = true; this.traverse = fn => { fn(this); this.children.forEach(c => fn(c)); }; this.add = o => this.children.push(o); },
  PointLight: function (c, i, d) { this.color = c; this.intensity = i; this.distance = d; this.position = {set() {}}; this.frustumCulled = true; },
  Sphere: function (c, r) { this.center = c; this.radius = r; },
  Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; },
} };
coreCtx.window = coreCtx; coreCtx.globalThis = coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc, coreCtx);
const C = coreCtx.__popstarCore;
ok(C && typeof C.dressVisible === 'function', 'dressVisible is exported on the core');

const mats = [
  {fog: true, transparent: true, opacity: 0.2, depthWrite: false, depthTest: true, alphaTest: 0.4},
  {fog: true, transparent: true, opacity: 0.4, depthWrite: false, depthTest: true},
];
const mesh = {
  material: mats[1],
  frustumCulled: true,
  geometry: {computeBoundingSphere() {}, boundingSphere: {radius: 1}},
};
const g = {
  name: '', frustumCulled: true, visible: true, children: [mesh],
  traverse(fn) { fn(this); fn(mesh); },
  add() { this.hasLight = true; },
};
C.dressVisible({g, mats});
ok(mats.every(m => m.fog === false && m.transparent === false && m.opacity === 1 && m.depthWrite === true),
  'dressVisible forces every material opaque, unfogged, depthWrite on');
ok(g.frustumCulled === false && mesh.frustumCulled === false, 'root and meshes are not frustum-culled');

// Half-and-half world: dry land at z < 80 (surface y=10), water at z >= 80.
// solid() treats water as solid, which is the bug we must not rely on.
const toasts = [];
const ctx = {
  console,
  THREE: coreCtx.THREE,
  scene: {add() {}, remove() {}},
  window: null, globalThis: null,
  started: true, DIM: {cur: null},
  W: 200, D: 200, H: 90, SEA: 10,
  T: {WATER: 8, LAVA: 9},
  P: {x: 50, y: 11, z: 40, yaw: 0, vy: 0, kbx: 0, kbz: 0, onGround: true, fallTop: null},
  getB(x, y, z) {
    if (z >= 80) {
      if (y < 9) return 1;
      if (y === 9) return 8; // water surface
      return 0;
    }
    return y < 10 ? 1 : 0;
  },
  solid(x, y, z) {
    // Water counts as solid — the land check must still reject it.
    if (z >= 80) return y <= 9;
    return y < 10;
  },
  toast(m) { toasts.push(m); },
  setPause() {}, rebuild() {},
  performance: {now: () => 0},
};
ctx.window = ctx; ctx.globalThis = ctx;
ctx.window.__popstarCore = C;
vm.createContext(ctx);
vm.runInContext(runSrc, ctx);
const U = ctx.window.__v1251;
ok(U && typeof U.proposeStep === 'function' && typeof U.landY === 'function', 'land helpers are exported');

// Stub C.make so spawn/teleport can run without a full THREE geometry kit.
C.make = function () {
  const pos = {x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }};
  const rot = {y: 0, set() {}};
  return {g: {position: pos, rotation: rot, traverse() {}, visible: true, frustumCulled: false}, mats: []};
};
ok(U.landY(50, 40) === 10 && U.isDryLand(50, 40), 'landY finds the dry surface at y=10');
ok(U.landY(50, 90) === 0 && !U.isDryLand(50, 90), 'a water column is not dry land (even if solid() says it is)');
ok(U.isFluid(8) && !U.isFluid(1), 'WATER is fluid, dirt is not');

// Spawn on water relocates to dry land.
const rec = U.spawnAt(50, 10, 90, 0);
ok(rec && U.isDryLand(rec.pathX, rec.pathZ) && rec.pathZ < 80,
  'spawnAt on water relocates to dry land (z=' + (rec && rec.pathZ) + ')');
ok(rec.g.position.y === U.landY(rec.pathX, rec.pathZ), 'spawn snaps feet to the dry surface');

// 200 random wander steps never enter water / non-solid / a steep drop.
let x = 50, z = 70; // close enough to the water that some steps will be refused
let refused = 0, accepted = 0;
for (let i = 0; i < 200; i++) {
  const yaw = (Math.sin(i * 12.9898) * 43758.5453 % 1) * Math.PI * 2;
  const stepLen = 0.8 + (i % 5) * 0.5;
  const r = U.proposeStep(x, z, yaw, stepLen);
  if (r.ok) { x = r.x; z = r.z; accepted++; }
  else refused++;
  assert.ok(U.isDryLand(x, z), 'step ' + i + ' left the pop star off dry land at ' + x.toFixed(2) + ',' + z.toFixed(2));
  assert.ok(z < 80, 'step ' + i + ' entered the water half of the map');
}
ok(accepted + refused === 200 && accepted > 20, '200 random steps stayed on land (accepted=' + accepted + ' refused=' + refused + ')');
ok(refused > 0, 'at least one step toward the water was refused (refused=' + refused + ')');

// A step aimed straight into the water is rejected and she would turn back.
const atShore = U.proposeStep(50, 79.2, 0, 4); // headingVec(0) = {x:0,z:1} toward +z water
ok(!atShore.ok && atShore.reason === 'water', 'a step from the shore into water is refused');

// Teleport from a water-side player position still lands both on dry land at a framing distance.
ctx.P.x = 50; ctx.P.y = 10; ctx.P.z = 90;
if (U.alive()) U.despawn();
const go = U.teleportTo();
ok(go === true && U.tp && U.tp.last === 'ok', 'teleport from an all-water area still succeeds by searching outward');
const star = U.alive();
const dist = Math.hypot(ctx.P.x - star.g.position.x, ctx.P.z - star.g.position.z);
ok(U.isDryLand(ctx.P.x, ctx.P.z) && U.isDryLand(star.g.position.x, star.g.position.z),
  'teleport places both the player and the pop star on dry land');
ok(dist >= 20 && dist <= 48, 'teleport framing distance fits her whole body (dist=' + dist.toFixed(2) + ')');
const lookX = -Math.sin(ctx.P.yaw), lookZ = -Math.cos(ctx.P.yaw);
const toX = star.g.position.x - ctx.P.x, toZ = star.g.position.z - ctx.P.z;
const facing = (lookX * toX + lookZ * toZ) / (Math.hypot(toX, toZ) || 1);
ok(facing > 0.95, 'player faces her after a land-search teleport (dot=' + facing.toFixed(3) + ')');

const fd = U.framingDist();
ok(fd > 24 && fd < 36, 'framingDist for a 32-block body at ~70° FOV is about 28–32 (got ' + fd.toFixed(2) + ')');

console.log('v1251-popstar-visible-land ok', n);
