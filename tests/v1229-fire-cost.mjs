// v1.2.29: what one gun shot allocates in the shot effects, through the game's own source (sliced from index.html, real THREE):
// the impact sparks and dust (spray), the bullet hole (decal), the tracer line, and their per frame clean up. Counts materials made and
// disposed, meshes and geometries made, per shot, over 40 shots. A material disposed while it is the only one using its shader makes the
// renderer delete that shader, and the next shot compiles it again on the main thread: a hitch on every shot.
// Not measured here: frame time on a real GPU (no WebGL in node).
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const file = process.argv[2] || new URL('../index.html', import.meta.url); const html = fs.readFileSync(file, 'utf8');
const cut = (a, b, from) => { const i = html.indexOf(a, from || 0), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, 'cut ' + a.slice(0, 40)); return html.slice(i, j); };
const C = {mat: 0, disp: 0, mesh: 0, geo: 0, line: 0}; const T = Object.assign({}, THREE0);
for (const k of Object.keys(THREE0)) { const K = THREE0[k]; if (typeof K !== 'function' || !K.prototype) continue;
  if (K.prototype instanceof THREE0.Material) T[k] = class extends K { constructor(...a) { super(...a); C.mat++; } clone() { C.mat++; return super.clone(); } dispose() { C.disp++; return super.dispose(); } };
  if (k === 'Mesh') T[k] = class extends K { constructor(...a) { super(...a); C.mesh++; } };
  if (k === 'Line') T[k] = class extends K { constructor(...a) { super(...a); C.line++; } };
  if (K === THREE0.BufferGeometry || K.prototype instanceof THREE0.BufferGeometry) T[k] = class extends K { constructor(...a) { super(...a); C.geo++; } }; }
const dead = html.indexOf('function spray(p, n, col'); const kill0 = cut('  function kill(o) {', '\n', dead - 3000);
const src = cut('  const CAP = () =>', '\n', dead - 4000) + cut('  function dmat(tex, col, op)', '  const sol = (x, y, z) =>', dead - 3000) + (html.includes('  const SPM = new Map(), SPOOL') ? cut('  const SPM = new Map(), SPOOL', '  // ---- hit tracking', dead - 3000) : cut('  function spray(p, n, col', '  // ---- hit tracking', dead - 10)) +
  'function stepFx(dt) {\n' + cut('    for (let i = fx.length - 1; i >= 0; i--)', '    for (let i = corpses.length - 1', dead) + '}';
const tr0 = html.indexOf("const L = new THREE.Line("), trA = html.lastIndexOf('const a = mz ||', tr0), trSrc = html.slice(trA, html.indexOf('} catch (e2)', tr0));
const lmSrc = cut('  const LM = new THREE.LineBasicMaterial(', '\n', trA - 6000); const clean = cut('setInterval(() => { for (let i = lines.length - 1', '}, 30);', trA).replace('setInterval(() => {', 'function cleanLines() {') + '}';
const G = {THREE: T, scene: new T.Scene(), Math, PERF: false, fx: [], decals: [], corpses: [], U: {}, BG: new THREE0.BoxGeometry(1, 1, 1), PG: new THREE0.PlaneGeometry(1, 1), TH: new THREE0.Texture(), sol: () => false};
const run = new Function('with(this){ let fx = this.fx, decals = this.decals; ' + src + '\n' + lmSrc + '\n' + clean + '\n' +
  'this.shot = (k) => { const o = V(0, 1.6, 0), d = V(Math.sin(k), 0, -Math.cos(k)), t = 20, mz = null; { ' + trSrc + ' } const p = V(d.x * 20, 1.6, d.z * 20), n = V(-d.x, 0, -d.z); spray(p, 7, 0xffd27a, 5.5, n, 0.22, 0.025, true, true); spray(p, 3, 0x9a968c, 1.2, n, 0.6, 0.05, false); decal(p.x, p.y, p.z, n, 0.16, TH, 0xffffff, 0.95, 90); };\n' +
  'this.frame = dt => { stepFx(dt); }; this.clean = cleanLines; this.lines = lines; }');
run.call(G);
const WARM = 80, SH = 40; for (let s = 0; s < WARM; s++) { G.shot(s); for (let f = 0; f < 30; f++) { G.frame(1 / 60); if (f % 2) G.clean(); } }   // past the 70 bullet hole cap
const c0 = Object.assign({}, C); for (let s = 0; s < SH; s++) { G.shot(s * 0.37); for (let f = 0; f < 30; f++) { G.frame(1 / 60); if (f % 2) G.clean(); } }
const per = k => ((C[k] - c0[k]) / SH).toFixed(2);
console.log(JSON.stringify({file: String(file).split('/').pop(), shots: SH, perShot: {materialsMade: +per('mat'), materialsDisposed: +per('disp'), meshes: +per('mesh'), geometries: +per('geo'), lines: +per('line')}, liveFx: G.fx.length, liveDecals: G.decals.length}));
if (process.env.EXPECT === 'fixed') { const ok = (C.mat - c0.mat) / SH < 0.2 && (C.disp - c0.disp) / SH < 0.2 && (C.geo - c0.geo) / SH < 0.2; console.log(ok ? 'ok   shot effects reuse their materials and geometry' : 'FAIL shot effects still make and dispose materials every shot'); if (!ok) process.exit(1); }
