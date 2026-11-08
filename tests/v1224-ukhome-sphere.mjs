// v1.2.24: __ukHome() (GLX-HOME1224) has the same truth table as the old GLX-C317 on(); the real GLX-C320 block outside the map answers
// only from the flat UK lookup (no round ball branch, no ball meshes or rebuild loop), does nothing extra in small worlds or realms, and
// keeps edits. Compares against the released v1.2.24 page (f776a5f build) where it helps. Set REL=path to override.
import fs from 'node:fs'; import assert from 'node:assert'; import cp from 'node:child_process';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const relP = process.env.REL || '/tmp/rel.html', rel = fs.existsSync(relP) ? fs.readFileSync(relP, 'utf8') : (() => { try { return cp.execSync('git show f776a5f:index.html', {maxBuffer: 1 << 27, encoding: 'utf8'}); } catch (_) { return null; } })();
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const blk = (h, k) => { const i = h.indexOf('/* GLX-' + k + ' '), j = h.indexOf('/* GLX-', i + 8); assert(i > 0, k); return h.slice(i, j); };
const lineOf = (h, a) => { const i = h.indexOf(a); assert(i >= 0, a); return h.slice(i, h.indexOf('\n', i)); };
// ---- 1. truth table ----
const mk = () => { const G = {DIM: {cur: null}, W: 864}; G.window = G; return G; };
const runIn = (G, src) => new Function('S', 'with(S){' + src + '\n}')(new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => t[k], set: (t, k, v) => { t[k] = v; return true; }}));
const Gn = mk(); runIn(Gn, lineOf(html, 'window.__ukHome = function'));
const oldSrc = 'window.__old = () => !window.__c317mesh && !DIM.cur && W >= 600;';   // the GLX-C317 on() line in the released page:
ok(!rel || rel.includes('const on = U.on = () => !window.__c317mesh && !DIM.cur && W >= 600;'), 'old GLX-C317 on() is exactly the rule compared against');
const Go = mk(); runIn(Go, oldSrc);
let same = 0, n = 0;
for (const mesh of [0, 1]) for (const dim of [null, 'hell', 'agartha', 'moon']) for (const W of [64, 256, 599, 600, 864, 4096]) {
  for (const G of [Gn, Go]) { G.__c317mesh = mesh; G.DIM.cur = dim; G.W = W; } n++; if (Gn.__ukHome() === Go.__old()) same++; }
ok(same === n, 'truth table identical over ' + n + ' cases (mid mesh build, home / hell / agartha / moon, W 64 .. 4096)');
Gn.__c317mesh = 0; Gn.DIM.cur = null; Gn.W = 864; ok(Gn.__ukHome() === true, 'normal UK home world: true'); Gn.W = 256; ok(Gn.__ukHome() === false, 'small world: false');
ok(!/__c317\.on\(\)|S7\(\)\.on\(\)/.test(html), 'no caller still asks the space box flag (__c317.on) whether this is the home world');
// ---- 2. the real GLX-C320 block ----
function c320(h) {
  const G = {Math, Object, JSON, Array, String, Map, Set, Number, console, W: 864, H: 128, D: 864, SEA: 64, DIM: {cur: null}, T: {STONE: 1, WATER: 9, SAND: 12, GRASS: 2, DIRT: 3, DEEPSLATE: 5, LAVA: 10, TORCH: 50},
    PLANT: {}, world: new Uint16Array(1), iv: 0, started: true, navigator: {userAgent: ''}};
  G.window = G; G.__ukHome = () => !G.DIM.cur && G.W >= 600; G.setInterval = () => { G.iv++; return 0; };
  G.getB = (x, y, z) => x >= 0 && x < G.W && z >= 0 && z < G.D ? 'base' : 0;   /* the base world: 0 outside the map */ G.solid = () => false; G.setB = (x, y, z, v) => 'set'; G.serialize = () => ({}); G.enterWorld = () => {};
  G.__c317 = {on: G.__ukHome, wall: () => false}; G.__c317mesh = 0; G.THREE = new Proxy({}, {get: () => function () { return new Proxy({}, {get: () => () => ({})}); }});
  runIn(G, blk(h, 'C320')); const E = G.__c320; E.fearth = (x, y, z) => y < 64 ? 77 : 0; return {G, E}; }
const N = c320(html); const out = [432, 40, -900];   // well north of the map edge (z < 0), below sea level
N.E.flat = false;   // the first second after entering the home world, before GLX-C339 sets the flat flag
ok(N.E.earth(...out) === 77 && N.G.getB(...out) === 77, 'outside the map, flat flag not caught up yet: answer is the flat UK lookup (77), not the round ball');
if (rel) { const R0 = c320(rel); R0.E.flat = false; const b = R0.E.earth(...out); ok(b !== 77, 'released page in the same moment answered from the round ball (' + b + ') - the removed branch'); }
N.E.flat = true; ok(N.G.getB(...out) === 77 && N.G.getB(432, 70, -900) === 0, 'flat UK outside the map: same values as the flat lookup (rock / air)');
ok(N.G.getB(432, 40, 400) === 'base', 'inside the map: the base world answers');
N.G.W = 256; ok(N.G.getB(...out) === 0, 'small world: nothing from the planet code, base lookup only'); N.G.W = 864;
N.G.DIM.cur = 'hell'; ok(N.G.getB(...out) === 0 && N.G.setB(...out, 5) === 'set', 'Hell realm: base lookup and base setB only'); N.G.DIM.cur = null;
N.G.setB(432, 70, -900, 4); ok(N.G.getB(432, 70, -900) === 4 && N.E.edits.size === 1, 'a block placed outside the map is kept as an edit');
ok(N.G.iv === 0 && N.E.built === undefined, 'no ball mesh rebuild loop in GLX-C320 any more');
if (rel) { const R1 = c320(rel); ok(R1.G.iv === 1, 'the released page had that 500 ms loop (now removed)'); }
ok(!html.includes('/* GLX-C331 ') && !html.includes('function ballGeo') && !html.includes('e.terr(wx'), 'round Earth sheets, their hole cutter (GLX-C331) and the C324 ball slab branch are gone');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
