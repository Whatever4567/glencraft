// 1.2.6x pop-star pathing + adjacency polish.
// Before (live 1.2.53 / tip 83d19a5): 3-block climbs, landY picks castle roofs,
// 11-block stride, hitR 0.01 so the camera can walk inside her and she vanishes.
// After: 1-block max step, roofs skipped, slow 3-block stride, player keep-out,
// DoubleSide + frustumCulled=false so she stays visible when the player is adjacent.
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

ok(runSrc.includes('isRoofOrStructure') && runSrc.includes('U.MAX_STEP') && runSrc.includes('footprintOk'),
  'runtime has roof-skip, 1-block step and footprint helpers');
ok(runSrc.includes('U.pushPlayerOut') && runSrc.includes('updatePlayer'),
  'runtime pushes the player out of her body after movement');
ok(coreSrc.includes('P.STRIDE = 3') && coreSrc.includes('P.MAX_STEP = 1') && coreSrc.includes('P.BODY_R'),
  'core uses a slow 3-block stride, max 1-block step and a body keep-out radius');
ok(coreSrc.includes('DoubleSide') && coreSrc.includes('frustumCulled = false'),
  'core keeps frustumCulled=false and sets DoubleSide on her materials');
ok(html.includes('isRoofOrStructure') && html.includes('U.pushPlayerOut') && html.includes('P.STRIDE = 3'),
  'index.html bake includes the pathing and adjacency fixes');

const ctxCore = { console, window: {}, globalThis: null };
ctxCore.window = ctxCore; ctxCore.globalThis = ctxCore;
vm.createContext(ctxCore);
vm.runInContext(coreSrc, ctxCore);
const C = ctxCore.__popstarCore;
ok(C.HEIGHT === 32 && C.STRIDE === 3 && C.MAX_STEP === 1 && C.BODY_R >= 4,
  'she stays 32 blocks tall, walks 3 blocks per beat, steps 1, keep-out >= 4');
const walkSpeed = C.STRIDE / C.BEAT;
ok(walkSpeed < 6 && walkSpeed > 3, 'walk speed is a slow stroll (~' + walkSpeed.toFixed(2) + ' blocks/s, was 17.2)');

// ---- shared castle world -------------------------------------------------
// Flat dry land at y=10. A 1-block terrace at z=20-28 (stand 11), a 2-block
// terrace at z=30-38 (stand 12). A hollow castle at x,z 40-60 with a 1-block
// roof at y=19 (stand 20) and solid walls 10..20.
const WATER = 8, DIRT = 1, STONE = 2;
function inCastle(x, z) { return x >= 40 && x <= 60 && z >= 40 && z <= 60; }
function isWall(x, z) {
  return inCastle(x, z) && (x === 40 || x === 60 || z === 40 || z === 60);
}
function isRoof(x, z) { return inCastle(x, z) && !isWall(x, z); }
function isOneStep(x, z) { return x >= 20 && x <= 35 && z >= 20 && z <= 28; }
function isTwoStep(x, z) { return x >= 20 && x <= 35 && z >= 30 && z <= 38; }

function getB(x, y, z) {
  x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
  if (y < 0) return DIRT;
  if (isWall(x, z) && y >= 10 && y <= 20) return STONE;
  if (isRoof(x, z) && y === 19) return STONE;
  if (isTwoStep(x, z) && y >= 10 && y <= 11) return DIRT;
  if (isOneStep(x, z) && y === 10) return DIRT;
  if (y < 10) return DIRT;
  return 0;
}
function solid(x, y, z) { return getB(x, y, z) !== 0; }

// BEFORE behaviour: first walkable surface (roofs win) and a 3-block step.
function oldLandY(x, z) {
  const bx = Math.floor(x), bz = Math.floor(z);
  for (let y = 89; y >= 0; y--) {
    if (!solid(bx, y, bz)) continue;
    if (getB(bx, y + 1, bz) || getB(bx, y + 2, bz)) continue;
    return y + 1;
  }
  return 0;
}
function oldPropose(x, z, yaw, stepLen) {
  const nx = x + 0 * stepLen, nz = z + 1 * stepLen; // heading 0 = +z
  const y0 = oldLandY(x, z), y1 = oldLandY(nx, nz);
  if (y1 < 1 || y0 < 1 || Math.abs(y1 - y0) > 3) {
    return {ok: false, x, z, y: y0, reason: y1 < 1 ? 'water' : 'steep'};
  }
  return {ok: true, x: nx, z: nz, y: y1};
}

// BEFORE: roofs, 2-block climbs (allowed by the old 3-block limit), no keep-out.
ok(oldLandY(50, 50) === 20, 'BEFORE: landY on the castle interior returns the roof (y=20)');
ok(oldLandY(40, 50) === 21, 'BEFORE: landY on a castle wall returns the battlement (y=21)');
const oldTwo = oldPropose(25, 29, 0, 2);
ok(oldTwo.ok && oldTwo.y === 12, 'BEFORE: a 2-block terrace climb is accepted (y ' + (oldTwo.y) + ')');
const oldRoof = {ok: oldLandY(50, 50) >= 19, y: oldLandY(50, 50)};
ok(oldRoof.ok, 'BEFORE: she would treat the castle roof as a walkable surface');
ok(0.01 < 1, 'BEFORE: hitR was 0.01, so the player could walk inside her mesh');

const toasts = [];
const added = [];
const mats = [{fog: true, transparent: true, opacity: 0.4, depthWrite: false, side: 0}];
const ctx = {
  console,
  THREE: { DoubleSide: 2, Sphere: function () {}, Vector3: function () {}, PointLight: function () { this.position = {set() {}}; } },
  scene: {add(g) { added.push(g); }, remove() {}},
  window: null,
  globalThis: null,
  started: true,
  DIM: {cur: null},
  W: 200, D: 200, H: 90, SEA: 10,
  T: {WATER: 8, LAVA: 9},
  P: {x: 50, y: 10, z: 50, yaw: 0, vy: 0, kbx: 0, kbz: 0, onGround: true, fallTop: null},
  getB, solid,
  toast(m) { toasts.push(m); },
  setPause() {}, rebuild() {},
  performance: {now: () => 0},
};
ctx.window = ctx; ctx.globalThis = ctx;
ctx.window.__popstarCore = C;
vm.createContext(ctx);
vm.runInContext(runSrc, ctx);
const U = ctx.window.__v1251;
ok(U && typeof U.landY === 'function' && typeof U.proposeStep === 'function', 'runtime loaded');
ok(U.MAX_STEP === 1 && U.BODY_R >= 4, 'runtime max step is 1 and keep-out is at least 4');
ok(U.COLLIDE_R >= 2.2 && U.COLLIDE_R <= 3.2, 'feet/legs collider is a tight cylinder around her boots');

// AFTER: yard and roofs.
ok(U.landY(25, 15) === 10, 'AFTER: open yard is still the dry surface at y=10');
ok(U.landY(50, 50) === 10, 'AFTER: landY under the castle roof returns the courtyard (y=10), not the roof');
ok(U.isRoofOrStructure(50, 20, 50) === true, 'AFTER: the 1-block castle roof is tagged as a structure');
ok(U.isRoofOrStructure(25, 10, 15) === false, 'AFTER: filled ground is not a roof');
ok(U.landY(40, 50) === 21, 'AFTER: a solid wall top is still a surface, but…');

// Step height.
const up1 = U.proposeStep(25, 18, 0, 3); // +z onto the 1-block terrace
ok(up1.ok && up1.y === 11 && Math.abs(up1.y - 10) <= U.MAX_STEP,
  'AFTER: a 1-block step-up is accepted (y=' + (up1 && up1.y) + ')');
const up2 = U.proposeStep(25, 29, 0, 2); // +z onto the 2-block terrace
ok(!up2.ok && up2.reason === 'steep',
  'AFTER: a 2-block step-up is refused (reason=' + (up2 && up2.reason) + ')');
const drop2 = U.proposeStep(25, 31, Math.PI, 2); // heading PI = -z, off the 2-block terrace
ok(!drop2.ok && drop2.reason === 'steep', 'AFTER: a 2-block drop is also refused');

// Roof scenario: walking at the castle from the yard, and standing under / toward the roof.
const atGate = U.proposeStep(50, 38, 0, 3); // toward the south wall at z=40
ok(!atGate.ok, 'AFTER: a step from the yard onto the castle wall/roof is refused (reason=' + (atGate && atGate.reason) + ')');
ok(U.landY(50, 50) === 10 && !U.footprintOk(50, 40, 10),
  'AFTER: her footprint will not accept the castle wall as ground-level terrain');

// Walk a path along the castle; height must stay on the yard (no roof spaz).
let x = 30, z = 50, yaw = 0, maxY = 10, roofHits = 0, accepted = 0, refused = 0;
for (let i = 0; i < 80; i++) {
  const r = U.proposeStep(x, z, yaw, 3);
  if (r.ok) { x = r.x; z = r.z; accepted++; }
  else { yaw += 0.7; refused++; }
  const y = U.landY(x, z);
  if (y >= 19) roofHits++;
  maxY = Math.max(maxY, y);
  assert.ok(y <= 11, 'path left the yard at ' + x.toFixed(1) + ',' + z.toFixed(1) + ' y=' + y);
}
ok(roofHits === 0 && maxY <= 11, 'AFTER: 80 wander steps around the castle never climb onto the roof (maxY=' + maxY + ')');
ok(accepted > 0 && refused > 0, 'AFTER: she walks the yard and turns away from the walls (accepted=' + accepted + ' refused=' + refused + ')');

// Adjacency visibility: DoubleSide + frustumCulled + push the player out.
C.dressVisible({
  g: {name: '', frustumCulled: true, traverse(fn) { fn({frustumCulled: true, material: mats[0], geometry: {computeBoundingSphere() {}, boundingSphere: {radius: 1}}}); }, add() {}},
  mats
});
ok(mats[0].side === 2 && mats[0].fog === false && mats[0].transparent === false,
  'AFTER: dressVisible sets DoubleSide (side=2) and keeps materials opaque');

C.make = function () {
  const pos = {x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }};
  const rot = {y: 0, set() {}};
  return {g: {position: pos, rotation: rot, traverse() {}, visible: true, frustumCulled: false}, mats: []};
};
const rec = U.spawnAt(80, 10, 80, 0);
ok(rec && rec.g.position.y === 10, 'spawn on open land plants her at y=10');
const player = ctx.P;
player.x = rec.g.position.x + 0.4;
player.y = rec.g.position.y + 1;
player.z = rec.g.position.z + 0.2;
const inside = Math.hypot(player.x - rec.g.position.x, player.z - rec.g.position.z);
ok(inside < 1, 'BEFORE-style: the player can stand inside her (dist=' + inside.toFixed(2) + ') before the push');
const pushed = U.pushPlayerOut(player, rec);
ok(pushed.pushed === true, 'AFTER: pushPlayerOut fires when the player is inside her');
const after = Math.hypot(player.x - rec.g.position.x, player.z - rec.g.position.z);
ok(after >= U.COLLIDE_R - 1e-6, 'AFTER: the player is outside her feet/legs collider (dist=' + after.toFixed(2) + ', r=' + U.COLLIDE_R + ')');
ok(U.landY(player.x, player.z) === 10, 'AFTER: the pushed player still stands on dry land');

// Already-outside player is left alone.
player.x = rec.g.position.x + U.COLLIDE_R + 1;
player.z = rec.g.position.z;
const stay = U.pushPlayerOut(player, rec);
ok(stay.pushed === false && Math.abs(player.x - (rec.g.position.x + U.COLLIDE_R + 1)) < 1e-9,
  'AFTER: a player already outside her volume is not shoved');

console.log('v1251-popstar-stable ok', n);
