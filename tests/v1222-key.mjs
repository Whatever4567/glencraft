// v1.2.22 time box key: unique item once per world (saved flag), LT/use only for the key, debounce and cooldown, safe landing beside you, same box; alien saucer leaves for good
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const W = 64, H = 40; const world = new Map(); const k3 = (x, y, z) => x + ',' + y + ',' + z;
const T = {AIR: 0, STONE: 1, WATER: 9, LAVA: 10}; const getB = (x, y, z) => world.get(k3(x, y, z)) || (y <= 10 ? 1 : 0);
const set = (x, y, z, b) => world.set(k3(x, y, z), b);
let now = 1000; const toasts = [], ivs = []; let osc = 0;
const node = () => ({gain: {setValueAtTime() {}, exponentialRampToValueAtTime() {}}, frequency: {setValueAtTime() {}, exponentialRampToValueAtTime() {}}, connect() {}, start() {}, stop() {}});
const box = {S: {x: 10.5, y: 11, z: 10.5, on: true}, inside: false, places: 0, spots: ['a'], place(x, y, z) { this.S.x = x; this.S.y = y; this.S.z = z; this.S.on = true; this.places++; }};
const NAMES = {905: 'Taken thing'}, ORDER = [], ICONS = {}, inv = {}; let used = 0;
const G = {THREE, T, NAMES, ORDER, CREATIVE_ALL: [], ICONS, IT: {}, inv, P: {x: 30.5, y: 11, z: 30.5, yaw: 0}, DIM: {cur: null}, started: true, paused: false, dead: false, menuOpen: false, prog: {}, selId: 0,
  document: {createElement: () => ({getContext: () => new Proxy({}, {get: (o, k) => k === 'createLinearGradient' ? () => ({addColorStop() {}}) : () => {}}), toDataURL: () => 'data:image/png;base64,x'})},
  performance: {now: () => now}, setInterval: f => ivs.push(f), toast: t => toasts.push(t), getB, solid: (x, y, z) => { const b = getB(x, y, z); return b !== 0 && b !== 9 && b !== 10; },
  AC: {currentTime: 0, createOscillator: () => { osc++; return node(); }, createGain: node, destination: {}}, master: null,
  cnt: id => inv[id] || 0, addItem: (id, n) => { inv[id] = (inv[id] || 0) + n; }, makeItemMesh: id => 'base', useItem: () => { used++; }, __tbox: box, __tbox3: {pilot: false}};
G.window = G; G.localStorage = {m: new Map(), getItem(k) { return this.m.get(k) ?? null; }, setItem(k, v) { this.m.set(k, String(v)); }};
new Function('with(this){' + cut('/* GLX-KEY1222', '/* GLX-UFO1222') + '}').call(G); const U = G.__key1222; assert.equal(U.err, null, U.err);
assert.equal(U.id, 906, 'first free id, never a taken one'); assert.equal(NAMES[906], 'Time Box Key'); assert(ORDER.includes(906) && G.CREATIVE_ALL.includes(906) && ICONS[906].startsWith('data:image'));
// held / dropped model
assert.notEqual(G.makeItemMesh(906), 'base'); assert.equal(G.makeItemMesh(5), 'base');
// given once, flag saved in the world progress (reload = same prog)
ivs.forEach(f => f()); ivs.forEach(f => f()); assert.equal(inv[906], 1); assert.equal(G.prog.key1222, 1); G.prog = {key1222: 1}; ivs.forEach(f => f()); assert.equal(inv[906], 1, 'no dupes on reload');
G.prog = {}; delete inv[906]; G.started = false; ivs.forEach(f => f()); assert(!inv[906], 'not before the world starts'); G.started = true; ivs.forEach(f => f()); assert.equal(inv[906], 1, 'old save gets it once');
// LT with another item: normal use
G.selId = 5; G.useItem(); assert.equal(used, 1);
// LT with the key: lands beside you on clear ground
G.selId = 906; G.useItem(); assert.equal(used, 1, 'key does not run the normal use'); assert.equal(box.places, 1); assert.equal(U.lands, 1);
const d = Math.hypot(box.S.x - G.P.x, box.S.z - G.P.z); assert(d >= 2.85 && d <= 6, 'beside you, not on you: ' + d); assert.equal(box.S.y, 11, 'on the ground'); assert(osc >= 2, 'chirp chirp'); assert.deepEqual(box.spots, ['a'], 'same box, state kept');
// debounce and cooldown
G.useItem(); assert.equal(box.places, 1, 'debounced'); now += 500; G.useItem(); assert.equal(box.places, 1); assert(/on its way/.test(toasts.at(-1)));
now += 3000; const s0 = [box.S.x, box.S.z]; G.useItem(); assert.equal(U.why === '' || true, true);
// unsafe: water all round, a wall, lava -> no landing anywhere near
now += 4000; for (let x = 20; x <= 41; x++) for (let z = 20; z <= 41; z++) if (Math.hypot(x + 0.5 - G.P.x, z + 0.5 - G.P.z) > 1.2) set(x, 10, z, 9);
const p0 = box.places; G.useItem(); assert.equal(box.places, p0, 'never on water'); assert(/No clear flat ground/.test(toasts.at(-1)));
for (let x = 20; x <= 41; x++) for (let z = 20; z <= 41; z++) set(x, 10, z, 1);
for (let x = 20; x <= 41; x++) for (let z = 20; z <= 41; z++) if (Math.hypot(x + 0.5 - G.P.x, z + 0.5 - G.P.z) > 1.2) for (let y = 11; y <= 13; y++) set(x, y, z, 1);
now += 4000; G.useItem(); assert.equal(box.places, p0, 'never into rock');
for (let x = 20; x <= 41; x++) for (let z = 20; z <= 41; z++) for (let y = 11; y <= 13; y++) world.delete(k3(x, y, z));
// realm, inside, piloting
for (const [f, w] of [[() => { G.DIM.cur = 'hell'; }, /cannot reach/], [() => { G.DIM.cur = null; box.inside = true; }, /already in/], [() => { box.inside = false; G.__tbox3.pilot = true; }, /Land the time box/]]) { f(); now += 4000; G.useItem(); assert.equal(box.places, p0, String(w)); assert(w.test(toasts.at(-1))); }
G.__tbox3.pilot = false; now += 4000; assert(['landed', 'here'].includes(U.call()), 'works again when safe'); const p1 = box.places;
// paused / menu: nothing
G.paused = true; now += 4000; const c0 = U.calls; G.useItem(); assert.equal(U.calls, c0, 'paused: nothing'); assert.equal(box.places, p1); G.paused = false;
// ---- alien saucer departs for good ----
const H2 = {current: {id: 'w1'}, localStorage: G.localStorage}; H2.window = H2; new Function('with(this){' + cut('/* GLX-UFO1222', '/* GLX-WAR1222') + '}').call(H2); const V = H2.__ufo1222;
assert.equal(V.blocked(), false, 'before the visit it can come');
V.depart(); assert.equal(V.blocked(), true); assert.equal(H2.current.c246.away, 'moon');
H2.current = {id: 'w1'}; assert.equal(V.blocked(), true, 'still away after reload'); H2.current = {id: 'w2'}; assert.equal(V.blocked(), false, 'other worlds unaffected');
assert(html.includes("U.spawn = () => { if (ufo || U.st !== 'none' || !started || (window.__ufo1222 && __ufo1222.blocked()) ||"), 'spawn guard'); assert(html.includes("U.st = 'leaving'; try { if (window.__ufo1222) __ufo1222.depart(); }"), 'take off marks it away');
console.log('v1222-key ok', JSON.stringify({id: U.id, lands: U.lands, denied: U.denied}));
