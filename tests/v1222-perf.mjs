// v1.2.22: railing merge, shared boxes, purple pickaxe break times and chime limits (runs the real perf-1222 module)
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const a = html.indexOf('/* GLX-PERF1222'), b = html.indexOf('/* GLX-C400', a); const src = html.slice(a, b); assert(a > 0 && b > a);
let held = 0, osc = 0; const HARD = {1: 1.5, 2: 50, 3: 0.5, 4: -1}, MC_HARD = {};
const AC = {currentTime: 0, destination: {}, createGain: () => ({gain: {value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}}, connect() {}}),
  createOscillator: () => { osc++; return {type: '', frequency: {setValueAtTime() {}, exponentialRampToValueAtTime() {}}, connect() {}, start() {}, stop() {}}; }};
const G = {THREE, window: {}, MODE: {instantBreak: false}, HARD, MC_HARD, heldToolId: () => held, AC, master: null, performance,
  mcBreakSeconds: b => 99, sfx: () => 'orig', headMatFor: () => 'base', makeItemMesh: () => new THREE.Group(), matchMedia: () => ({matches: false}), document: {}, renderer: {capabilities: {getMaxAnisotropy: () => 8}}, setTimeout};
G.window = G; new Function('with(this){' + src + '}').call(G);
const U = G.__perf1222; assert.equal(U.err, null, U.err);
// merge: 3 boxes in 2 materials -> 2 meshes, same world bounds, cached by shape
const mA = new THREE.MeshBasicMaterial(), mB = new THREE.MeshBasicMaterial(), bg = new THREE.BoxGeometry(0.1, 1, 0.1); bg.userData.shared = 1;
const mk = () => { const g = new THREE.Group(); g.position.set(10, 5, -3); for (const [x, m] of [[0, mA], [0.4, mA], [0.2, mB]]) { const o = new THREE.Mesh(bg, m); o.position.set(x, 0.5, 0); o.rotation.y = x; g.add(o); } return g; };
const g1 = mk(), before = new THREE.Box3().setFromObject(g1); assert(G.__mergeG(g1, 'r:5:0')); assert.equal(g1.children.length, 2);
const after = new THREE.Box3().setFromObject(g1); assert(before.min.distanceTo(after.min) < 1e-6 && before.max.distanceTo(after.max) < 1e-6, 'bounds kept');
const g2 = mk(); G.__mergeG(g2, 'r:5:0'); assert.equal(g2.children[0].geometry, g1.children[0].geometry); assert.equal(U.mergeHit, 1); assert(g1.children[0].geometry.userData.shared);
const g3 = mk(); g3.add(new THREE.PointLight()); assert.equal(G.__mergeG(g3, 'r:5:0'), false); assert.equal(g3.children.length, 4, 'groups with lights untouched');
assert.equal(G.__bg1222(1, 1, 0.125), G.__bg1222(1, 1, 0.125));
// purple pickaxe: fast on every mineable block, others unchanged
held = 760; assert.equal(G.mcBreakSeconds(1), 99); held = 761;
assert.equal(G.mcBreakSeconds(1), 0.05); assert(G.mcBreakSeconds(2) <= 0.5); assert.equal(G.mcBreakSeconds(4), 99, 'unbreakable hardness passes through');
G.MODE.instantBreak = true; assert.equal(G.mcBreakSeconds(1), 99); G.MODE.instantBreak = false;
// chime: layered (5 oscillators), at most one per 100 ms
assert.equal(G.sfx('dig'), undefined); assert.equal(osc, 5); for (let i = 0; i < 20; i++) G.sfx('dig'); assert.equal(osc, 5); assert(U.chimeSkip >= 20);
held = 1; assert.equal(G.sfx('dig'), 'orig');
held = 761; const it = G.makeItemMesh(761); assert(it.userData.p761 && it.scale.z < 0.7 && it.scale.y > 1.1);
console.log('v1222-perf ok', JSON.stringify({merged: U.merged, hits: U.mergeHit, parts: U.parts}));
