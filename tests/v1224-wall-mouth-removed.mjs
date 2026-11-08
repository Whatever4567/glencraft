// v1.2.24: the original Highlands ice wall (GLX-C273 wall(), GLX-C282 icy edge tint / edge freeze, GLX-C341 clearWall) and the old
// Agartha tunnel mouth carving (GLX-C294 mouth() / carveMouth()) are gone from the shipped source. Runs the REAL C273, C294 blocks (and
// C341 wallTop line) in a scope over a stand in world: a flat 864 x 864 home world, generate() through the real wrappers, then looks at
// the blocks. Also checks the record-only mouth metadata (save.c294 v3 -> __c294.M) still loads for GLX-V1214 / the Watcher keep out,
// and genAg still builds the current city.
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0, k); return html.slice(i, j); };
const W0 = 864, H0 = 64, SEA0 = 30;
const T = {GRASS: 2, DIRT: 3, STONE: 1, PACKSNOW: 90, SNOW: 91, WATER: 9, SAND: 12, GRAVEL: 13, HEATHER: 40, BEDROCK: 7, HBEDROCK: 8, LOG: 17, LEAVES: 18, MOSS: 50, LAMP: 60};
const G = {Math, Object, JSON, Array, String, Error, Set, Map, Uint8Array, Uint16Array, Float32Array, console, performance, Number, Boolean,
  T, W: W0, H: H0, D: W0, SEA: SEA0, DIM: {cur: null}, current: {id: 'w1', mode: 'survival', g42: 1}, started: true, PLANT: {}, LEAFY: {}, LOGGY: {}, g9cols: new Uint8Array(W0 * W0 * 2),
  g9fbm: () => 0, g9castles: [['black', 640, 120]], gSeed: 5, location: {search: ''}, localStorage: {getItem: () => null, setItem() {}}, intervals: []};
G.window = G; G.setInterval = f => { G.intervals.push(f); return 0; }; G.requestAnimationFrame = () => 0;
G.idx = (x, y, z) => (x * G.H + y) * G.D + z; G.inb = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < G.W && y < G.H && z < G.D;
G.world = new Uint16Array(W0 * H0 * W0);
G.setWorldSize = n => { G.W = G.D = n; G.world = new Uint16Array(G.W * G.H * G.D); };
G.generate = function () { const w = G.world; w.fill(0); for (let x = 0; x < G.W; x++) for (let z = 0; z < G.D; z++) for (let y = 0; y <= SEA0 + 4; y++) w[G.idx(x, y, z)] = y === SEA0 + 4 ? T.GRASS : T.STONE; };
G.enterWorld = function (save) { G.loaded = save || null; }; G.serialize = function () { return {v: 1}; }; G.applySave = function () {};
const noop = () => noop;
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : noop, set: (t, k, v) => { t[k] = v; return true; }});
const run = src => new Function('S', 'with(S){' + src + '\n}').call(G, scope);
run(blk('C273')); run(blk('C294'));
// the current home world is flagged g89 on enterWorld (no save -> not creative)
G.enterWorld(null); ok(G.__g89(), 'stand in world counts as a current home world (g89 on, W 864)');
G.generate();
let snow = 0, high = 0; const C = G.__c273;
for (let x = 0; x < G.W; x += 3) for (let z = 0; z < G.D; z += 3) { const q = C.edgeQ(x, z); if (q < C.RE() - C.WS - 6) continue;
  for (let y = 1; y < G.H - 1; y++) { const b = G.world[G.idx(x, y, z)]; if (b === T.PACKSNOW) snow++; if (b && y > SEA0 + 4) high++; } }
ok(snow === 0 && high === 0, 'generate(): no ice wall snow or raised wall band at the old wall line (snow ' + snow + ', raised ' + high + ')');
ok(typeof C.wallFn === 'undefined' && typeof C.iceMesh === 'undefined', 'C273 has no wall builder or ice cladding left');
ok(typeof C.edgeQ === 'function' && typeof C.RE === 'function' && C.WS === 40 && typeof C.at === 'function', 'shared map shape helpers kept (edgeQ, RE, WS, at)');
let flat = true; for (const [x, z] of [[432, 432], [5, 5], [858, 430], [430, 2]]) if (G.world[G.idx(x, SEA0 + 4, z)] !== T.GRASS || G.world[G.idx(x, SEA0 + 5, z)]) flat = false;
ok(flat, 'land from the base generator untouched at the middle, corners and edges (no mouth cut, no wall)');
ok(G.__c294.M === null && !html.includes('function carveMouth(') && !html.includes('function mouth()'), 'no mouth carved on a new world; mouth() and carveMouth() gone from the source');
G.enterWorld({v: 1, c294: {v: 3, mouth: [600, 7, 32], e: 'N', c: 600, df: 7, d0: 4, f0: 32}});
ok(G.__c294.M && G.__c294.M.x === 600 && G.__c294.M.e === 'N' && G.__c294.U !== 0, 'old save: record only mouth metadata (c294 v3) still loads as __c294.M for the V1214 / Watcher keep out');
const d = G.serialize(); ok(d.c294 && d.c294.v === 3 && d.c294.mouth[0] === 600, 'and is saved back unchanged');
G.DIM.cur = 'agartha'; G.H = 64; G.__c294.genAg(); const A = G.__c294.A; G.DIM.cur = null;
ok(A && A.city && A.city[2] === 112 && A.spires && A.spires.length > 3, 'genAg still builds the current city (' + (A && A.spires && A.spires.length) + ' spires)');
ok(['function clearWall', 'uniform vec4 uIce', 'uIceB', 'freezing! Head back', 'function wall()', 'function iceMesh', 'A.wallTop'].every(k => !html.includes(k)), 'old wall code (wall builder, ice cladding, clear wall, icy edge tint and its clip, edge freeze) gone from the whole page');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
