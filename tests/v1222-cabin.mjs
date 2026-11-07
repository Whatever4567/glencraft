// v1.2.22 time box cabin: the real player physics (collides, moveAxis, moveY, updatePlayer, the TBOX2 room walls) plus the cabin module.
// Fractional hover floor, jump, carry through box moves, one camera update, pilot transition, door exit, cabin blocks (place, collide,
// stand, follow, save and load, mine, refusals), and no outside world edits.
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const phys = cut('function collides(x, y, z) {', '\nfunction updateCamFx');
const coll2 = cut('collides = function (x, y, z) {', '// ---------- stair meshes');
const walls = cut('  // ---------- threshold and walls ----------', '  // ---------- sound: made in code ----------');
const cab = cut('/* GLX-CAB1222', '/* GLX-INV1222');
const store = {}; const ls = {getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }};
let worldEdits = 0, used = 0, added = [], camPlaced = 0, rendered = 0;
const S = {x: 100.5, y: 70.37, z: 50.5, on: true}; const room = new THREE.Group();
const TB = {S, inside: true, RR: 9.2, HW: 0.85, DW: 0.5, camIn: true, door: 1, parts: {room}, SM: m => m, save() { ls.setItem('glx_tbox_w1', JSON.stringify({x: S.x, y: S.y, z: S.z})); }, place(x, y, z) { S.x = x; S.y = y; S.z = z; room.position.set(x, y, z); TB.save(); }};
const F3 = {pilot: false};
const inv = {5: 3, 54: 2};
const G = {THREE, Math, JSON, Number, Array, Map, Set, String, Object, isFinite, performance, localStorage: ls, current: {id: 'w1'}, started: true, DIM: {cur: null}, __tbox: TB, __tbox3: F3,
  P: {x: 103.5, y: S.y, z: 46.15, vy: 0, yaw: 0, pitch: 0, onGround: true, kbx: 0, kbz: 0, fallTop: null}, R: 0.3, HEIGHT: 1.8, EYE: 1.62, W: 0, D: 0, H: 256, world: [], idx: () => 0, IS_STAIR: {}, shapeHit: () => false,
  T: {LAVA: 10, WATER: 9, COBWEB: 30, DOOR: 64, DOORTOP: 65}, getB: () => 0, solid: (x, y, z) => y < 40, heldBy: null, sprintShift: 0, sprintDbl: 0, sprintTouch: 0, sprintPad: 0, food: 20, GATE: {x: 1e9, z: 1e9, g: 0},
  toast() {}, MODE: {}, jumpReq: false, keys: {}, exh: 0, sfx() {}, matOf: () => 0, hurt() {}, stepFrom: 0, stepT: 1, flying: false,
  camera: new THREE.PerspectiveCamera(), scene: new THREE.Scene(), renderer: {render() { rendered++; }}, placeCamera() { camPlaced++; G.camera.position.set(G.P.x, G.P.y + 1.62, G.P.z); },
  useItem() { worldEdits++; }, updateInteraction() {}, canMine: () => true, raycast: () => null, look: {x: 0, y: -0.6, z: -0.8}, PLACEABLE: new Set([5, 54]), BLOCK_MATS: {5: new THREE.MeshLambertMaterial({color: 0x996633}), 54: new THREE.MeshLambertMaterial()},
  NAMES: {5: 'Oak planks', 54: 'Chest'}, isPlant: () => false, selId: 5, cnt: id => inv[id] || 0, useUp: (id, n) => { inv[id] -= (n || 1); used++; }, addItem: (id, n) => { inv[id] = (inv[id] || 0) + n; added.push(id); },
  mcMineRate: () => 2, HARD: {5: 1}, attackMouse: false, attackPad: false, attackTouch: false, swing() {}, renderHotbar() {}, menuOpen: false, paused: false};
G.lookDir = () => { const v = new THREE.Vector3(G.look.x, G.look.y, G.look.z).normalize(); return v; };
G.window = G;
const body = phys + '\n' + coll2 + '\n{ const T = __tbox, S = T.S, RR = T.RR, HW = T.HW, DW = T.DW, CZ = HW - RR, R = 0.32; const ERR = (w, e) => { throw e; };\n' + walls + '\n}\n' + cab +
  '\nthis.__f = {updatePlayer: (...a) => updatePlayer(...a), useItem: () => useItem(), updateInteraction: d => updateInteraction(d), collides: (x, y, z) => collides(x, y, z), render: () => renderer.render(scene, camera), gT: () => groundT, setJump: () => { jumpReq = true; }};';
new Function('with(this){' + body + '}').call(G); const f = G.__f, U = G.__cab1222; assert.equal(U.err, null, U.err);
const P = G.P, step = (n, mx, mz) => { for (let i = 0; i < n; i++) { f.updatePlayer(1 / 60, mx || 0, mz || 0); G.placeCamera(); } };
// 1. hovering at a fraction of a block: stand still, no sinking, real ground
step(120); assert.equal(P.y, S.y, 'stands exactly on the hovering floor'); assert(P.onGround && f.gT() > 0, 'real ground (jump allowed)');
// 2. jump twice and land on the fractional floor each time
for (let n = 0; n < 2; n++) { f.setJump(); step(1); assert(P.vy > 0 || P.y > S.y, 'jumped ' + n); let top = 0; for (let i = 0; i < 90; i++) { step(1); top = Math.max(top, P.y - S.y); } assert(top > 1.2, 'jump height ' + top); assert.equal(P.y, S.y, 'lands on the floor'); }
// 3. walk around while it hovers
const z0 = P.z; step(30, 0, 1); assert(P.z < z0 - 1.5 && P.y === S.y, 'walks on the floor');
// 4. the box ascends and descends while you walk (moved by another route): you are carried once, the offset is kept
const off = () => [P.x - S.x, P.y - S.y, P.z - S.z];
let o0 = off(); for (const dy of [0.05, 0.11, 0.37, -0.2, -0.41]) { TB.place(S.x, S.y + dy, S.z); step(1); } let o1 = off(); assert(o1.every((v, i) => Math.abs(v - o0[i]) < 1e-9), 'local offset unchanged after ascent and descent ' + o1);
const c0 = U.carried; TB.place(S.x + 0.3, S.y + 0.2, S.z); P.x += 0.3; P.y += 0.2; step(1); assert.equal(U.carried, c0, 'a mover that already carried you is not doubled'); assert(off().every((v, i) => Math.abs(v - o0[i]) < 1e-9));
// 5. the box moves between the step and the drawing: P and camera follow once, and the next step does not move you again
G.placeCamera(); const cy = G.camera.position.y; TB.place(S.x, S.y + 0.5, S.z); f.render(); assert.equal(U.camFix, 1); assert(Math.abs(G.camera.position.y - cy - 0.5) < 1e-9, 'camera moved once with the box');
const c1 = U.carried; f.updatePlayer(1 / 60, 0, 0); assert.equal(U.carried, c1, 'no second carry'); assert(Math.abs(P.y - S.y) < 1e-9);
// 6. pilot: camera placed once after the box moves; letting go keeps the box where it is (no whole block settle)
F3.pilot = true; const cp = camPlaced; f.updatePlayer(1 / 60, 0, 0); assert.equal(camPlaced - cp, 1, 'one extra camera placement per pilot frame'); F3.pilot = false;
const ySet = S.y; step(10); assert.equal(S.y, ySet, 'no settle on let go'); assert.equal(P.y, S.y);
// 7. cabin blocks: place on the floor in front
P.x = 103.5; P.z = 46.15; P.y = S.y; step(2); G.look = {x: 0, y: -0.6, z: -0.8};
f.useItem(); assert.equal(U.placed, 1, U.last); assert.equal(inv[5], 2, 'one block used'); assert.equal(worldEdits, 0, 'never the outside world'); const [key] = [...U.B.keys()]; const [bi, bj, bk] = key.split(',').map(Number); assert.equal(bj, 0);
assert(room.children.some(g => g.name === 'cab1222' && g.children.length === 1), 'drawn inside the room');
// collide with it: walking into it stops you
const bx = S.x + bi + 0.5, bz = S.z + bk + 0.5; P.x = bx; P.z = bz + 1.6; P.y = S.y; P.yaw = 0; step(60, 0, 1); assert(P.z > bz + 0.5 + 0.29, 'blocked by the cabin block ' + (P.z - bz));
// stand on it
P.x = bx; P.z = bz; P.y = S.y + 2.5; P.vy = 0; step(60); assert(Math.abs(P.y - (S.y + 1)) < 1e-9, 'stands on the block top ' + (P.y - S.y));
// follows the box: move the box, the block stays at the same cabin cell and still holds you up
TB.place(S.x + 2, S.y + 1.3, S.z - 1); P.x += 2; P.y += 1.3; P.z -= 1; step(30); assert(Math.abs(P.y - (S.y + 1)) < 1e-9, 'still on it after the box moved'); assert(f.collides(S.x + bi + 0.5, S.y + 0.2, S.z + bk + 0.5));
// save and load (and an old save without the field)
const rec = JSON.parse(store.glx_tbox_w1); assert.deepEqual(rec.cab1222, [[bi, bj, bk, 5]]); assert(rec.x === S.x && rec.y === S.y);
U.B.clear(); U.load(); assert.equal(U.B.get(key), 5, 'loaded back'); store.glx_tbox_w2 = JSON.stringify({x: 1, y: 2, z: 3}); G.current = {id: 'w2'}; step(1); assert.equal(U.B.size, 0, 'old save: no cabin blocks, nothing broken'); G.current = {id: 'w1'}; step(1); assert.equal(U.B.size, 1);
// refusals: chest, inside you, doorway, console
P.x = 103.5; P.z = 46.15; P.y = S.y; step(1); G.selId = 54; f.useItem(); assert.equal(U.B.size, 1); assert.equal(inv[54], 2, 'chest refused, not used');
G.selId = 5; G.look = {x: 0, y: -1, z: 0.0001}; f.useItem(); assert.equal(U.last, 'you'); assert.equal(inv[5], 2);
assert.equal(U.canPut(0, 0, -1), 'doorway'); assert.equal(U.canPut(0, 0, 0), 'doorway'); assert.equal(U.canPut(8, 0, -8), 'wall'); assert.equal(U.canPut(0, 0, Math.floor(-8.35)), 'console'); assert.equal(U.canPut(0, 0, -7), 'pilot spot');
// mine it back: one block back, removed, saved
const bx2 = S.x + bi + 0.5, bz2 = S.z + bk + 0.5; P.x = bx2; P.z = bz2 + 1.4; P.y = S.y; step(1); G.look = {x: 0, y: -0.75, z: -0.66}; G.attackMouse = true; for (let i = 0; i < 40 && U.B.size; i++) f.updateInteraction(1 / 60); G.attackMouse = false;
assert.equal(U.B.size, 0, 'mined'); assert.deepEqual(added, [5], 'the block comes back once'); assert.equal(inv[5], 3, 'counts back to the start'); assert.deepEqual(JSON.parse(store.glx_tbox_w1).cab1222 || [], []); assert.equal(worldEdits, 0);
// 8. door exit: through the doorway you are outside and the cabin floor no longer applies
P.x = S.x; P.z = S.z + 0.5; P.y = S.y; step(1); P.z = S.z + TB.HW + 0.1; step(1); assert.equal(TB.inside, false, 'outside after the door'); assert.equal(f.collides(S.x, S.y - 0.5, S.z - 3), false, 'no cabin floor outside');
console.log('v1222-cabin ok', JSON.stringify({snaps: U.snaps, carried: U.carried, camFix: U.camFix, placed: U.placed, mined: U.mined, refused: U.refused}));
