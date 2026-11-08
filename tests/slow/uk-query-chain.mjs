// SLOW (~70 s): real base getB/solid + GLX-C307 + C317 + C320 + UKB (+ LEG1224) in page order. Stand ins: UK land fearth (ground to SEA+1) and the old
// extension zone contents (packed ice to SEA+14). Before the fix 3 of 3 cells north of the old edge are ghost solids where the UK land is air.
import fs from 'node:fs'; import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(process.argv[2] || new URL('../../index.html', import.meta.url), 'utf8'), Ls = html.split('\n');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); return html.slice(i, j); };
const fnAt = re => { const a = Ls.findIndex(l => re.test(l)); let b = a + 1; while (!/^}/.test(Ls[b])) b++; return Ls.slice(a, b + 1).join('\n').replace(/^function (\w+)\(/, '$1 = function $1('); };
const missing = new Set(); const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const el = () => ({style: {}, dataset: {}, classList: {add() {}, remove() {}, contains: () => false}, appendChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getContext: () => noop});
const iv = [];
const W = 864, H = 128, D = 864, SEA = 40;
const G = {THREE, Math, JSON, Object, Array, Map, Set, Number, String, Error, console, performance, Uint16Array, Uint8Array, Float32Array, Int32Array, Promise, document: {createElement: el, body: el(), head: el(), getElementById: () => null}, localStorage: {getItem: () => null, setItem() {}},
  setInterval: f => iv.push(f), setTimeout: () => 0, requestAnimationFrame: () => 0, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {render() {}, capabilities: {}},
  W, H, D, SEA, CH: 26, DIM: {cur: null}, started: true, P: {x: 100, y: SEA + 5, z: -50}, T: {AIR: 0, STONE: 3, WATER: 4, SAND: 5, PACKSNOW: 68, ICE: 70, DEEPSLATE: 69, TORCH: 30, LAVA: 10, DOOR: 90, DOORTOP: 91, BEDROCK: 7}, PLANT: {}, LEAFY: {}, LOGGY: {},
  __XG: null, __XS: null, __XN: null, __XZ: 0, doorOpenAt: () => false, current: {id: 'w'}, location: {search: ''}};
G.window = G; G.world = new Uint16Array(W * H * D); G.idx = (x, y, z) => (x * H + y) * D + z;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < SEA + 2; y++) G.world[G.idx(x, y, z)] = 3;   // the map: ground to SEA+1
G.setB = (x, y, z, v) => { if (x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H) G.world[G.idx(x, y, z)] = v; };
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; missing.add(k); return noop; }, set: (t, k, v) => { t[k] = v; return true; }});
const run = (src, tag) => { try { new Function('S', 'with(S){' + src + '\n}').call(G, scope); } catch (e) { console.log('LOAD ' + tag, String(e).slice(0, 200)); } };
run(fnAt(/^function getB\(/) + '\n' + fnAt(/^function solid\(/), 'base');
const HAS = html.includes('/* GLX-LEG1224 '); for (const k of ['C307', 'C317', 'C320', 'UKB'].concat(HAS ? ['LEG1224'] : []).concat(['DEEP', 'V1217'])) run(blk(k), k);
// the current UK land (C341/C347 fearth) stand in: UK ground to SEA+1 everywhere inside the UK box, air above
const e = G.__c320; e.flat = 1; e.fearth = Object.assign((x, y, z) => y <= SEA + 1 ? 3 : 0, {c347: 1, top: () => SEA + 1}); G.__agw = {ok: 1, box: [420, -50, 0, 660, -2, 700]};
for (const f of iv) { try { f(); } catch (_) {} }
// the legacy north extension, switched on as in an old save: its real hook, with a zone that answers the old flat ice / glacier tongue
const ext = (x, y, z) => y <= SEA + 14 ? 68 : 0;   // old packed ice tongue to SEA+14 (genExt: glacier over the first stretch)
const X = G.__c307; console.log('C317 on', G.__c317 && G.__c317.on(), 'C320 flat', e.flat, 'ukb on', G.__ukb.on, 'X.hook', typeof X.hook);
const probe = tag => { const pts = [[100, SEA + 3, -5], [100, SEA + 10, -40], [400, SEA + 8, -200], [100, SEA + 3, 5], [100, SEA + 0, -5], [-100, SEA + 3, 100]];
  console.log(tag.padEnd(26), pts.map(p => p.join(',') + ' solid=' + (G.solid(...p) ? 1 : 0) + ' getB=' + G.getB(...p) + ' uk=' + e.fearth(...p)).join(' | ')); };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const PTS = [[100, SEA + 3, -5], [100, SEA + 10, -40], [400, SEA + 8, -200]];
ok(PTS.every(p => !G.solid(...p)), 'extension off: north of the old edge above UK ground is air (UK route, no invisible wall)');
G.__XG = ext; G.__XS = () => {}; G.__XZ = -X.EXT;
console.log('old save before the check: ' + PTS.filter(p => G.solid(...p)).length + ' of 3 ghost solids where the UK land is air');
if (G.__leg1224) G.__leg1224.check();
ok(PTS.every(p => !G.solid(...p) && G.getB(...p) === 0), 'old save in the UK world: the ghost ice is air');
ok(G.solid(100, SEA, -5) && G.getB(100, SEA, -5) === 3, 'UK ground under it still solid (from the UK land)');
ok(!G.solid(100, SEA + 3, 5) && G.solid(100, SEA, 5), 'inside the map unchanged');
X.hook(true); ok(!G.__XG, 'the extension cannot switch itself back on in the UK world');
e.flat = 0; X.hook(true); ok(!!G.__XG, 'outside the flat UK world the old hook still works'); X.hook(false); e.flat = 1;
// below the bedrock through the real getB / solid chain (C320 -> GLX-DEEP -> V1217), with a player edit kept
if (G.__v1217) G.__v1217.dl = true; const VOID = html.includes('void under the bedrock');
ok(e.fearth.dw === 1, 'GLX-DEEP hook on the UK land');
ok(G.solid(300, -238, 300) && G.getB(300, -238, 300) === 7, 'bedrock at y -238 solid through getB / solid');
ok(!VOID || (!G.solid(300, -250, 300) && G.getB(300, -250, 300) === 0), 'y -250 is void through getB / solid (no ghost floor)');
G.__c320.edits.set('301,-250,300', 3); ok(G.getB(301, -250, 300) === 3 && G.solid(301, -250, 300), 'a block stored as an edit down there is kept');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
