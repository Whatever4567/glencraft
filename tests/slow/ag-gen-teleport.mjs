// SLOW (~3 min): real C294 genAg + C295 + AGU stamp build + AG1220 post/tick + AG1222, then the unified Teleport 'Agartha (crystal city)' route (__agw.toCity). Stand in: __c320 flat earth host only. Result 2026-11-08: 7 shown after teleport (no repro).
import fs from 'node:fs'; import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); if (i < 0) throw k; return html.slice(i, j); };
const missing = new Set(); const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const el = () => ({style: {}, dataset: {}, classList: {add() {}, remove() {}, contains: () => false}, appendChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getContext: () => new Proxy({}, {get: (t, k) => k === 'createLinearGradient' ? () => ({addColorStop() {}}) : () => {}})});
const iv = [], raf = [];
const T = {AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WATER: 4, SAND: 5, LOG: 8, LEAVES: 9, BEDROCK: 7, HBEDROCK: 7, LAMP: 50, MOSS: 60, FERN: 61, TALLGRASS: 62, GLOWGRASS: 63, GLOWPLANT: 64, CRYCYAN: 65, CRYWHITE: 66, CRYVIOLET: 67, PACKSNOW: 68, DEEPSLATE: 69, GLOWCAP: 100};
const G = {THREE: THREE0, Math, JSON, Object, Array, Map, Set, Number, String, Error, console, performance, Uint16Array, Float32Array, Audio: function () { return {play: () => Promise.resolve()}; },
  document: {createElement: el, body: el(), head: el(), getElementById: () => null}, matchMedia: () => ({matches: false}), setInterval: f => iv.push(f), setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: f => raf.push(f),
  scene: new THREE0.Scene(), renderer: {render() {}, capabilities: {maxTextureSize: 2048, getMaxAnisotropy: () => 4}}, P: {x: 0, y: 0, z: 0}, started: true, dead: false, paused: false, DIM: {cur: null}, SET: {noMobs: false, sfx: 0.5}, SEA: 8, H: 128, W: 56, D: 56,
  T, NAMES: {8: 'Oak log', 9: 'Leaves'}, LEAFY: {9: 1}, LOGGY: {8: 1}, PLANT: {61: 1, 62: 1, 64: 1}, gSeed: 1234, updateWeather() {}, flashA: 0, mobs: [], applySave: () => {}, serialize: () => ({}), enterWorld() {}};
G.window = G; G.world = new Uint16Array(G.W * G.H * G.D);
G.idx = (x, y, z) => (x * G.H + y) * G.D + z; G.setWorldSize = n => { if (n === G.W && G.world.length === G.W * G.H * G.D) return; G.W = n; G.D = n; G.world = new Uint16Array(G.W * G.H * G.D); };
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; missing.add(k); return noop; }, set: (t, k, v) => { t[k] = v; return true; }});
// real modules in page order; flat-earth host (__c320) is the only stand in: its earth() = AGU-hooked fearth over a flat ground
G.__c320 = {flat: 1, fearth: Object.assign((x, y, z) => y < 20 ? 3 : 0, {dw: 1}), dirty: 0}; G.__c320.earth = (x, y, z) => G.__c320.fearth(x, y, z);
const order = ['C294', 'C295', 'AGU', 'AG1220', 'AG1222'];
for (const k of order) { try { new Function('S', 'with(S){' + blk(k) + '\n}').call(G, scope); } catch (e) { console.log('LOAD', k, String(e).slice(0, 200)); } }
console.log('order lines', order.map(k => html.slice(0, html.indexOf('/* GLX-' + k + ' ')).split('\n').length).join(' '));
const t0 = Date.now(); for (const f of iv) { try { f(); } catch (e) { console.log('iv err', String(e).slice(0, 160)); } }
const agw = G.__agw, a20 = G.__ag1220, a22 = G.__ag1222;
console.log('AGU ok', agw.ok, 'err', agw.err, 'ms', Date.now() - t0, 'c294 err', G.__c294.err, 'L', JSON.stringify(agw.L && {city: agw.L.city, FL: agw.L.FL, TOP: agw.L.TOP}));
console.log('post ring', JSON.stringify(a20.ring), 'trees', a20.trees, 'floor', a20.floor, 'path', a20.path, 'W D H restored', G.W, G.D, G.H, 'DIM', G.DIM.cur);
const r = a22.ring(); if (r) { const fy = a22.floorAt(r.X + r.R, r.Z, r.Y); console.log('floorAt ring edge', fy, 'earth at Y-1/Y/Y+1', G.__c320.earth(Math.floor(r.X + r.R), r.Y - 1, Math.floor(r.Z)), G.__c320.earth(Math.floor(r.X + r.R), r.Y, Math.floor(r.Z)));
  G.P = {x: r.X + r.R, y: r.Y, z: r.Z}; a20.tick(1 / 60); const f = a20.folk(); console.log('tick at ring: why', a20.why, 'n', f.length, f.slice(0, 3).map(q => q.g.position.toArray().map(v => v.toFixed(1)).join(',')).join(' | ')); }
console.log('missing', [...missing].join(' '));
// teleport route: unified list -> __tpm.toTube -> __agw.toCity
if (G.__agw.toCity) { G.toast = m => console.log('toast', m); G.getB = (x, y, z) => G.__c320.earth(x, y, z); const ok = G.__agw.toCity(); console.log('toCity', ok, 'P', [G.P.x, G.P.y, G.P.z].map(v => v.toFixed(1)).join(','));
  for (let i = 0; i < 3; i++) G.__ag1220.tick(1 / 60); console.log('after teleport: why', G.__ag1220.why, 'n', G.__ag1220.folk().length, 'ring', JSON.stringify(G.__ag1222.ring())); }
