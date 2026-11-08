// Agarthans vs the GLX-C79c draw-time cull (real C79c + AG1220 + AG1222 source, real three.js). The seven live in one group left at the
// world origin; C79c hid any small-radius scene child whose ORIGIN is past fog far, so in the city (~780 blocks from 0,0) the group was
// switched off for every draw even though the tick said 'shown'.
import assert from 'node:assert';
import fs from 'node:fs'; import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a) => { const i = html.indexOf(a), j = html.indexOf('/* ', html.indexOf('})();', i)); assert(i > 0, a); return html.slice(i, j); };
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); return html.slice(i, j); };
const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const el = () => ({style: {}, dataset: {}, classList: {add() {}, remove() {}, contains: () => false}, appendChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getContext: () => noop});
const raf = []; const FLY = -45;
const drawn = []; const scene = new THREE0.Scene(); scene.fog = new THREE0.Fog(0, 24, 150);
const G = {THREE: THREE0, Math, JSON, Object, Array, Map, Set, Number, String, Error, console, performance, Uint16Array, Float32Array, Audio: function () { return {play: () => Promise.resolve()}; },
  document: {createElement: el, body: el(), head: el(), getElementById: () => null}, matchMedia: () => ({matches: false}), setInterval: f => raf.push(f), setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: f => raf.push(f),
  scene, touchMode: false, HIGH: true, blockGroup: {}, rebuild() {},
  renderer: {render(s, c) { const g = G.__ag1220.folk()[0]; drawn.push(!!(g && g.g.parent.visible)); }, capabilities: {maxTextureSize: 2048, getMaxAnisotropy: () => 4}},
  P: {x: 540.5, y: FLY, z: 500}, started: true, dead: false, DIM: {cur: null}, SET: {noMobs: true, sfx: 0.5}, SEA: 8, H: 256,
  T: {GRASS: 1, STONE: 3}, NAMES: {}, LEAFY: {}, PLANT: {}, world: new Uint16Array(1), idx: () => 0, updateWeather() {}, flashA: 0, mobs: [], reachMob() {}, hitMob() {}, damageMob() {}};
G.window = G; G.__agw = {L: {v: 2, city: [540, 560, 112], FL: FLY, TOP: -10, under: 1}}; G.__c320 = {earth: (x, y, z) => y < FLY ? 3 : 0};
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : typeof k === 'symbol' ? undefined : noop, set: (t, k, v) => { t[k] = v; return true; }});
const run = src => new Function('S', 'with(S){' + src + '\n}').call(G, scope);
run(cut('/* ---- GLX-C79c')); run(blk('AG1220')); run(blk('AG1222'));
const cam = new THREE0.PerspectiveCamera(); cam.position.set(G.P.x, FLY + 1.6, G.P.z);
for (let i = 0; i < 5; i++) G.__ag1220.tick(1 / 60);
G.renderer.render(scene, cam);
const f = G.__ag1220.folk(), near = Math.min(...f.map(q => Math.hypot(q.g.position.x - cam.position.x, q.g.position.z - cam.position.z)));
console.log('why', G.__ag1220.why, 'n', f.length, 'nearest', near.toFixed(1), 'visible at draw', drawn.at(-1), 'culled', G.__dcN);
assert.equal(G.__ag1220.why, 'shown'); assert.ok(near < 150, 'a resident is inside fog range');
assert.equal(drawn.at(-1), true, 'Agarthans drawn (not culled by C79c)');
assert.equal(f[0].g.parent.visible, true, 'restored after draw');
console.log('all ok');
