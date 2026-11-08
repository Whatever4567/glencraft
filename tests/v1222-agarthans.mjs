// Runs the real built GLX-AG1220 and GLX-AG1222 modules (taken from index.html) with the real Agartha layout numbers from GLX-AGU/C294
// (AX 420, AY -50, ZS 1560, YN 48, city floor y 5) on a stamp with a gloam floor, then ticks them and records actor count, position and why.
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import fs from 'fs'; import assert from 'assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a); return html.slice(i, html.indexOf(b, i)); };
const ag20 = cut('(function ag1220()', '\n/* GLX-CAB1221'), ag22 = cut('(function ag1222()', '\n/* GLX-PERF1222');
const AX = 420, AY = -50, ZS = 1560, YN = 48, SW = 200, SD = 200, FL = 5, city = [100, ZS + 100, 60];
const st = new Uint16Array(SW * SD * YN), ix = (x, z, y) => (x * SD + z) * YN + y; for (let x = 0; x < SW; x++) for (let z = 0; z < SD; z++) for (let y = 0; y < FL; y++) st[ix(x, z, y)] = y === FL - 1 ? 2 : 1;
const T = {GRASS: 2, STONE: 1, DIRT: 3, WATER: 9, LAVA: 10, GLOWCAP: 100}, scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
const earth = (x, y, z) => { const i = x - AX, j = y - AY; if (i < 0 || i >= SW || j < 0 || j >= YN || z < 0 || z >= SD) return 1; return st[ix(i, z, j)]; };
let raf = null;
const G = {THREE, T, __c320: {earth}, scene, camera, NAMES: {1: 'Stone', 2: 'Grass'}, LEAFY: new Uint8Array(1024), PLANT: {}, DIM: {cur: null}, P: {x: 0, y: 0, z: 0}, SET: {noMobs: false, sfx: 0.5}, started: true, dead: false,
  mobs: [], reachMob: () => null, hitMob: () => 0, damageMob: () => 0, sfx: () => 0, SEA: 64, H: 160, world: [], idx: () => 0, crossGeo: null, updateWeather: () => 0, flashA: 0,
  renderer: {render() {}, capabilities: {maxTextureSize: 4096, getMaxAnisotropy: () => 4}}, document: {getElementById: () => null, createElement: () => ({width: 0, height: 0, getContext: () => new Proxy({}, {get: () => () => ({addColorStop() {}})}), style: {}}), body: {appendChild() {}}},
  setInterval: () => 0, matchMedia: () => ({matches: false}), requestAnimationFrame: f => { raf = f; }, performance, Audio: function () { return {play: () => Promise.resolve()}; }};
G.window = G; const window = G; const names = Object.keys(G).filter(k => k !== 'window'); const run = src => new Function(...names, 'with (this) {' + src + '}').call(G, ...names.map(k => G[k]));
run(ag20); run(ag22); const A = window.__ag1220, B = window.__ag1222; assert(!A.err && !B.err, A.err || B.err);
A.post(st, {city: [city[0], city[1], city[2]], FL, spires: []}, SW, SD, YN, ZS, AX, AY);
window.__agw = {L: {city: [city[0] + AX, city[1] - ZS, city[2]], FL: FL + AY, TOP: 40 + AY, under: 1}};
const out = []; for (const pos of [[AX + 100, AY + FL + 1, 100], [AX + 100, AY + FL + 1, 100]]) { G.P.x = pos[0]; G.P.y = pos[1]; G.P.z = pos[2]; for (let k = 0; k < 30; k++) A.tick(0.033); }
const f = A.folk(); const grp = f[0] && f[0].g.parent; out.push({n: f.length, visible: !!(grp && grp.visible && grp.parent === scene), why: A.why, ring: A.ring, p0: f[0] && f[0].g.position.toArray().map(v => +v.toFixed(2))});
assert.equal(f.length, 7); assert(grp.visible); assert.equal(A.why, 'shown'); for (const q of f) assert.equal(q.g.position.y, FL + AY, 'stands on floor');
G.SET.noMobs = true; A.tick(0.03); assert(grp.visible && A.why === 'shown', 'v1.2.26: Agarthans stay with Disable mobs'); G.SET.noMobs = false;
G.DIM.cur = 'agartha'; A.tick(0.03); out.push({dim: 'agartha', visible: grp.visible, why: A.why}); G.DIM.cur = null;
console.log(JSON.stringify(out));
