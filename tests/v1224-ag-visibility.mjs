// v1.2.24 diagnosis (2026-11-08): the real AG1220 + AG1222 Agarthan blocks over a stand in city (__agw.L, flat floor). Proves the show/hide
// logic works (7 made once, shown in the city, hidden by Disable mobs / far / old realm, back on return, no duplicate groups). Does NOT
// prove the user's world builds __agw.L (the Scotland stamp) - that is the unverified part of the missing Agarthans report.
import assert from 'node:assert';
import fs from 'node:fs'; import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); return html.slice(i, j); };
const missing = new Set(); const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const el = () => ({style: {}, dataset: {}, classList: {add() {}, remove() {}, contains: () => false}, appendChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getContext: () => new Proxy({}, {get: (t, k) => k === 'createLinearGradient' ? () => ({addColorStop() {}}) : () => {}})});
const raf = []; const FLY = 30;
const G = {THREE: THREE0, Math, JSON, Object, Array, Map, Set, Number, String, Error, console, performance, Uint16Array, Float32Array, Audio: function () { return {play: () => Promise.resolve()}; },
  document: {createElement: el, body: el(), head: el(), getElementById: () => null}, matchMedia: () => ({matches: false}), setInterval: (f) => raf.push(f), setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: f => raf.push(f),
  scene: new THREE0.Scene(), renderer: {render() {}, capabilities: {maxTextureSize: 2048, getMaxAnisotropy: () => 4}}, P: {x: 0, y: 0, z: 0}, started: true, dead: false, DIM: {cur: null}, SET: {noMobs: false, sfx: 0.5}, SEA: 8, H: 256,
  T: {GRASS: 1, STONE: 3}, NAMES: {}, LEAFY: {}, PLANT: {}, world: new Uint16Array(1), idx: () => 0, updateWeather() {}, flashA: 0, mobs: []};
G.window = G;
G.__agw = {L: {v: 2, city: [480, 300, 40], FL: FLY, under: 1}};
G.__c320 = {earth: (x, y, z) => y < FLY ? 3 : 0};
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; missing.add(k); return noop; }, set: (t, k, v) => { t[k] = v; return true; }});
for (const k of ['AG1220', 'AG1222']) new Function('S', 'with(S){' + blk(k) + '\n}').call(G, scope);
const A = G.__ag1220, B = G.__ag1222; console.log('err', A.err, B.err);
const tick = n => { for (let i = 0; i < n; i++) A.tick(1 / 60); };
const W = []; const rep = tag => { W.push([tag, A.why, A.folk().length, !!(A.folk()[0] && A.folk()[0].g.parent.visible), G.scene.children.length]); const f = A.folk(); const vis = f.length && f[0].g.parent && f[0].g.parent.visible; const inScene = G.scene.children.filter(c => c.children.some(x => f.some(q => q.g === x))).length;
  console.log(tag.padEnd(34), 'why', A.why, 'n', f.length, 'groupVisible', !!vis, 'groupsInScene', inScene, 'sceneKids', G.scene.children.length, f[0] ? 'y ' + f[0].g.position.y.toFixed(1) + ' ringY ' + B.ring().Y : ''); };
G.P = {x: 480, y: FLY, z: 300}; tick(5); rep('new world: in city');
G.SET.noMobs = true; tick(5); rep('Disable mobs ON');
G.SET.noMobs = false; tick(5); rep('Disable mobs OFF again');
G.P.x = 5000; tick(5); rep('far away'); G.P.x = 480; tick(5); rep('back in city');
G.DIM.cur = 'agartha'; tick(5); rep('in DIM agartha (old tunnel realm)');
G.DIM.cur = null; tick(5); rep('exit realm, back');
G.P.y = FLY + 60; tick(5); rep('60 above floor');
console.log('missing', [...missing].join(' '));
const want = {'new world: in city': 1, 'Disable mobs ON': 0, 'Disable mobs OFF again': 1, 'far away': 0, 'back in city': 1, 'in DIM agartha (old tunnel realm)': 0, 'exit realm, back': 1, '60 above floor': 0};
for (const [t, why, n, vis, kids] of W) { assert.equal(n, 7, t + ' seven'); assert.equal(kids, 1, t + ' one group, no duplicates'); assert.equal(+vis, want[t], t + ' visible ' + why); }
console.log('all ok');
