// v1.2.24: height / space checks after the round Earth alt branch went, and the live flat flag. Runs the real GLX-C320 and GLX-C339 blocks
// and the real __vac line (space audio) for the released page (f776a5f, via git or REL=path) and this page, side by side.
import fs from 'node:fs'; import assert from 'node:assert'; import cp from 'node:child_process';
const cur = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const rel = process.env.REL ? fs.readFileSync(process.env.REL, 'utf8') : cp.execSync('git show f776a5f:index.html', {maxBuffer: 1 << 27, encoding: 'utf8'});
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const blk = (h, k) => { const i = h.indexOf('/* GLX-' + k + ' '), j = h.indexOf('/* GLX-', i + 8); assert(i > 0, k); return h.slice(i, j); };
const lineOf = (h, a) => { const i = h.indexOf(a); assert(i >= 0, a); return h.slice(h.lastIndexOf('\n', i) + 1, h.indexOf('\n', i)); };
const noop = function () { return noop; };
function load(h, withC339) {
  const G = {Math, Object, JSON, Array, String, Map, Set, Number, Error, console, W: 864, H: 128, D: 864, SEA: 64, DIM: {cur: null}, T: {STONE: 1, WATER: 9}, PLANT: {}, world: new Uint16Array(1),
    started: true, navigator: {userAgent: ''}, P: {x: 400, y: 80, z: 400}, ivs: []};
  G.window = G; G.setInterval = f => { G.ivs.push(f); return 0; }; G.setTimeout = () => 0; G.getB = () => 0; G.solid = () => false; G.setB = () => 0; G.serialize = () => ({}); G.enterWorld = () => {};
  G.__c317 = {on: () => !G.__c317mesh && !G.DIM.cur && G.W >= 600, wall: () => false, FAR: {getObjectByName: () => null}}; G.__c317mesh = 0;
  G.THREE = new Proxy({}, {get: () => function () { return new Proxy({}, {get: () => noop}); }});
  const sc = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : noop, set: (t, k, v) => { t[k] = v; return true; }});
  const run = src => new Function('S', 'with(S){' + src + '\n}')(sc);
  const hm = h.indexOf('window.__ukHome = function'); if (hm > 0) run(lineOf(h, 'window.__ukHome = function'));
  run(blk(h, 'C320')); if (withC339) { G.__c339 = {fll: () => [56, -4]}; run(blk(h, 'C339')); }
  run(lineOf(h, 'window.__vac = () =>').replace(/^\s*/, '').replace(/^/, 'const U = {flips: 0}; '));
  return G; }
const O = load(rel), N = load(cur);
const both = (setup, f) => { setup(O); setup(N); return [f(O), f(N)]; };
const SEA = 64, H = 128;
for (const [name, set] of [['home', G => { G.W = G.D = 864; G.DIM.cur = null; G.__c317mesh = 0; G.__c320.flat !== undefined || 0; if (!Object.getOwnPropertyDescriptor(G.__c320, 'flat')?.get) G.__c320.flat = true; }],
  ['small world 256', G => { G.W = G.D = 256; G.DIM.cur = null; if (!Object.getOwnPropertyDescriptor(G.__c320, 'flat')?.get) G.__c320.flat = false; }],
  ['mid mesh build', G => { G.W = G.D = 864; G.__c317mesh = 1; if (!Object.getOwnPropertyDescriptor(G.__c320, 'flat')?.get) G.__c320.flat = true; /* released: the 250 ms timer never sees the synchronous mesh build */ }]]) {
  let diff = 0, n = 0; const Wn = name.startsWith('small') ? 256 : 864, M = 300;
  for (let x = -M; x <= Wn + M; x += 20) for (let z = -M; z <= Wn + M; z += 20) for (let y = -40; y <= H + 300; y += 6) { n++; const [a, b] = both(set, G => G.__c320.space(x, y, z)); if (a !== b) { diff++; if (diff < 3) console.log('  differs at', name, x, y, z, a, b); } }
  ok(diff === 0, name + ': space() same as released at all ' + n + ' sampled spots round the map');
  both(set, G => 0); N.__c317mesh = O.__c317mesh = 0; }
{ let near = 1e9; both(G => { G.W = G.D = 256; G.DIM.cur = null; G.__c320.flat = false; }, G => 0);
  for (let x = -1500; x <= 1756; x += 16) for (let z = -1500; z <= 1756; z += 16) for (let y = -40; y <= H + 300; y += 8) if (O.__c320.space(x, y, z) !== N.__c320.space(x, y, z)) near = Math.min(near, Math.hypot(Math.max(0, -x, x - 256), Math.max(0, -z, z - 256)));
  ok(near >= 600, 'small world: the only change is far out where the old round sea was, nearest ' + Math.round(near) + ' blocks off the map'); }
both(G => { G.W = G.D = 864; G.DIM.cur = null; G.__c320.flat = true; }, G => 0);
ok(N.__c320.space(400, SEA + 5, 400) === false && N.__c320.space(400, H + 60, 400) === true, 'home: ground is not space, above the space line is');
ok(N.__c320.alt(400, 90, 400) === 90 - SEA, 'home: alt is the height above the sea');
for (const [b, p] of [['Moon', [3032, 2400 + 64 - 120 + 3, -1968]], ['Mars', [-6068, 3000 + 64 - 280 + 3, 5032]]]) {
  const [a, c] = both(G => { G.P = {x: p[0], y: p[1], z: p[2]}; }, G => G.__vac()); ok(a === true && c === true, b + ' surface: space audio stays off (vacuum) as released'); }
for (const d of ['hell', 'agartha']) { const [a, c] = both(G => { G.DIM.cur = d; G.P = {x: 100, y: 400, z: 100}; }, G => G.__vac()); ok(a === false && c === false, d + ': no vacuum (realm)'); }
both(G => { G.DIM.cur = null; G.P = {x: 400, y: 90, z: 400}; }, G => 0); ok(N.__vac() === false && O.__vac() === false, 'home ground: normal sound');
// live flat flag (GLX-C339 loaded, intervals never run)
const L = load(cur, true), e = L.__c320;
ok(typeof e.fearth === 'function', 'flat lookup attached at load, before any timer tick');
L.W = L.D = 864; L.DIM.cur = null; ok(e.flat === true, 'flat flag true on the home world with no timer tick');
L.DIM.cur = 'hell'; ok(e.flat === false, 'Hell: flat flag false at once'); L.DIM.cur = null; L.W = L.D = 256; ok(e.flat === false, 'small world: false at once');
L.W = L.D = 864; ok(e.flat === true, 'home again: true'); L.__c317mesh = 1; L.W = L.D = 64; ok(e.flat === true, 'during a planet mesh build (W swapped): holds the home value, no switch work, like the old timer'); L.__c317mesh = 0; L.W = L.D = 864; ok(e.flat === true && L.__c339.flips === 3, 'back home: true, switch work ran on each change (' + L.__c339.flips + ')');
const fl = L.__c339.flips; for (let i = 0; i < 1000; i++) void e.flat; ok(L.__c339.flips === fl, 'reading the flag without a change does no switch work');
ok(!/earth326|'sea320'|seaBall320|inn \? U\.ax|U\.body !== 'earth' \|\|/.test(cur) && cur.includes("new Set(['dome309'])"), 'dead earth326 / round sea names / hollow Earth flip / Earth camera bob gone; dome309 kept');
ok(!cur.includes('Math.hypot(x - c[0], y - c[1], z - c[2]) - R)'), 'round Earth alt branch gone');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
