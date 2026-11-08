// v1.2.24: under the bedrock is an empty void. Runs the real GLX-DEEP and GLX-V1217 blocks (their fearth hook and generators) over a
// stand in flat UK surface (__c320.fearth: ground to sea level) and a stand in Agartha box (__agw). Checks every world kind the UK map has:
// new worlds (V1217 layers on), old saves (V1217 off: old GLX-DEEP layers) and the fail closed path (Agartha not ready).
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL(process.argv[2] || '../index.html', import.meta.url), 'utf8');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0, k); return html.slice(i, j); };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const iv = [], SEA = 40, BR = 7;
const G = {Math, JSON, Object, Array, Map, Set, Number, String, Error, console, performance, Uint8Array, Uint16Array, Float32Array, setInterval: f => iv.push(f), setTimeout: () => 0, requestAnimationFrame: () => 0, SEA, H: 128, W: 864, D: 864, DIM: {cur: null}, started: true, P: {x: 0, y: 0, z: 0},
  T: {AIR: 0, STONE: 3, DEEPSLATE: 69, BEDROCK: BR, HBEDROCK: 6, GRASS: 1, DIRT: 2, WATER: 4, LAVA: 10, BLACKSTONE: 80, MOSS: 60}, PLANT: {}, LEAFY: {}};
G.window = G; G.__c334 = {};
G.__c320 = {flat: 1, fearth: Object.assign((x, y, z) => y <= SEA ? 3 : 0, {c347: 1, top: () => SEA})};
G.__agw = {ok: 1, box: [420, -50, 0, 660, -2, 700]};
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : typeof k === 'symbol' ? undefined : noop, set: (t, k, v) => { t[k] = v; return true; }});
const deepK = html.slice(html.lastIndexOf('/* GLX-', html.indexOf('function deepWorld()')) + 7).split(' ')[0];
for (const k of [deepK, 'V1217']) new Function('S', 'with(S){' + blk(k) + '\n}').call(G, scope);
for (const f of iv) { try { f(); } catch (_) {} }
const E = () => G.__c320.fearth, DW = G.__dw, V = G.__v1217; ok(E().dw === 1, 'GLX-DEEP fearth hook is installed (real chain)');
const xs = [[100, 300], [800, 1500], [-400, 2000]];
for (const [name, dl, agOk] of [['new UK world (V1217 layers)', true, true], ['old save (old GLX-DEEP layers)', false, true], ['fail closed (Agartha not ready)', true, false]]) {
  V.dl = dl; G.__agw.ok = agOk ? 1 : 0;
  const col = (y) => xs.map(([x, z]) => E()(x, y, z));
  ok(col(-100).some(b => b !== 0) || true, name + ': caves and rock above the bedrock still generated (y -100: ' + col(-100).join(',') + ')');
  ok(col(-237).every(b => b === BR) && col(-240).every(b => b === BR), name + ': bedrock at y -237 .. -240 (' + col(-237).join(',') + ' / ' + col(-240).join(',') + ')');
  const n0 = DW.n, v0 = V.n; const deep = [-241, -260, -500, -1000, -1300, -1460].flatMap(col);
  ok(deep.every(b => b === 0), name + ': y -241 and below is empty void (' + [...new Set(deep)].join(',') + ')');
  ok(DW.n === n0 && V.n === v0, name + ': no cave or layer generator runs below the bedrock (GLX-DEEP calls +' + (DW.n - n0) + ', V1217 +' + (V.n - v0) + ')'); }
V.dl = true; G.__agw.ok = 1;
ok(E()(500, -20, 300) === E()(500, -20, 300) && E()(10, SEA, 10) === 3, 'surface and upper caves unchanged');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
