// v1.2.86-perf (t1226/t1227/t1228): FP sculpt wrapper chain, craft-grid churn, bone upload dedupe, quality governor.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const src = n => fs.readFileSync(new URL('tools/content-source/' + n, root), 'utf8');
let k = 0; const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok((html.includes("const GAME_VERSION = '1.2.95';") || html.includes("const GAME_VERSION = '1.2.96';") || html.includes("const GAME_VERSION = '1.2.98';") || html.includes("const GAME_VERSION = '1.2.99';") || html.includes("const GAME_VERSION = '1.2.100';") || html.includes("const GAME_VERSION = '1.2.97';") || html.includes("const GAME_VERSION = '1.2.94';") || html.includes("const GAME_VERSION = '1.2.93';") || html.includes("const GAME_VERSION = '1.2.92';") || html.includes("const GAME_VERSION = '1.2.91';") || html.includes("const GAME_VERSION = '1.2.90';") || html.includes("const GAME_VERSION = '1.2.89';") || html.includes("const GAME_VERSION = '1.2.88';") || html.includes("const GAME_VERSION = '1.2.87';") || html.includes("const GAME_VERSION = '1.2.86';")) && !html.includes("const GAME_VERSION = '1.2.85';"), 'GAME_VERSION is 1.2.86+');
ok(html.includes('<!-- glencraft-build: b1286-v1.2.86 -->'), '1.2.86 build marker');
ok(html.includes('<!-- glencraft-build: perf1286 -->') && (html.split('(function perf1286(WIN)').length - 1) === 1, 'one perf1286 module');
ok(!/if \(!R\.updateMatrixWorld\.__sculpt128[0-2]\)/.test(html), 'no outermost-function wrap flags left');
for (const n of [1280, 1281, 1282]) ok((html.split('if (!WRAPPED' + n + '.has(R))').length - 1) === 1, 'sculpt' + n + ' wraps once per rig');
ok(html.includes("const n0 = RECIPES.length; recipes(); if (RECIPES.length !== n0)"), 'craft grid rebuilt only on a real recipe change');
ok(html.includes("version: '1.2.59-frame-torch'") && html.includes('/* GLX-FIX1279 (v1.2.79):'), 'torch/pick jitter fixes stay');
ok(html.includes('/* GLX-HANDSFP1285') && html.includes('V1SIDES: 1') && html.includes('/* GLX-LOAD1285'), '1.2.85 hands, chest sides and loading stay');

// The sculpt modules, run for real with a stub rig: 60 install ticks must leave exactly one wrapper each.
function runSculpt(files) {
  const timers = []; const R = { userData: {}, base: 0, updateMatrixWorld() { this.base++; } };
  const ctx = { console, Math, Object, Array, JSON, String, Number, Error, WeakSet, Set, Map, performance,
    setInterval: f => { timers.push(f); return timers.length; }, setTimeout: () => 0, clearInterval() {}, THREE: { stub: 1 } };
  ctx.window = ctx; ctx.__fpa = { rig: () => R };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(f, ctx);
  for (let i = 0; i < 60; i++) for (const t of timers) t();
  return { R, ctx, timers };
}
{
  const { R, ctx } = runSculpt([src('sculpt-1280.js'), src('sculpt-1281.js'), src('sculpt-1282.js')]);
  ok(ctx.__sculpt1280.hook === 1 && ctx.__sculpt1281.hook === 1 && ctx.__sculpt1282.hook === 1, 'after 60s of install ticks: one wrapper each (hooks ' + [ctx.__sculpt1280.hook, ctx.__sculpt1281.hook, ctx.__sculpt1282.hook] + ')');
  R.base = 0; R.updateMatrixWorld(); ok(R.base === 1, 'one updateMatrixWorld call reaches the base once');
  // a new rig (respawn / rebuild) is wrapped once too
  const R2 = { userData: {}, base: 0, updateMatrixWorld() { this.base++; } }; ctx.__fpa.rig = () => R2;
}
{
  // the 1.2.85 guard for comparison: proves the bug the fix removes
  const old = s => s.replace(/if \(!WRAPPED(\d+)\.has\(R\)\) \{\n\s*WRAPPED\d+\.add\(R\);/g, (m, n) => 'if (!R.updateMatrixWorld.__sculpt' + n + ') {');
  const { ctx } = runSculpt([old(src('sculpt-1280.js')), old(src('sculpt-1281.js')), old(src('sculpt-1282.js'))]);
  ok(ctx.__sculpt1280.hook > 50 && ctx.__sculpt1281.hook > 50 && ctx.__sculpt1282.hook > 50, '1.2.85 guard re-wraps every tick (hooks ' + [ctx.__sculpt1280.hook, ctx.__sculpt1281.hook, ctx.__sculpt1282.hook] + ')');
}

// perf-1286 in a sandbox: bone dedupe + governor decisions.
const P = src('perf-1286.js');
ok(!/setPixelRatio\(1\)\s*;?\s*\/\/\s*cap/.test(P) && !/1000 \/ 60\s*-/.test(P), 'no fixed frame-rate cap');
{
  let rafQ = [], pr = 1.6, resized = 0;
  class M4 { constructor() { this.elements = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; } multiplyMatrices(a, b) { const ae = a.elements, be = b.elements, te = this.elements;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let q = 0; q < 4; q++) s += ae[q * 4 + i] * be[j * 4 + q]; te[j * 4 + i] = s; } return this; } }
  function Skeleton(bones) { this.bones = bones; this.boneInverses = bones.map(() => new M4()); this.boneMatrices = new Float32Array(bones.length * 16); this.boneTexture = null; }
  let origCalls = 0; Skeleton.prototype.update = function () { origCalls++; };
  const ctx = { console, Math, Object, Array, JSON, String, Number, Error, WeakSet, Set, Map, Float32Array,
    performance: { now: () => 0 }, navigator: { userAgent: 'Android' }, document: { visibilityState: 'visible' }, devicePixelRatio: 3,
    THREE: { Skeleton, Matrix4: M4 }, touchMode: true, started: true, paused: false, screen: 'game', PERF: false,
    renderer: { getPixelRatio: () => pr, setPixelRatio: v => { pr = v; } }, resize: () => { resized++; },
    requestAnimationFrame: f => { rafQ.push(f); return rafQ.length; } };
  ctx.window = ctx;
  ctx.streamRadius = function () { return 4.5; };
  ctx.frame = function () {};
  vm.createContext(ctx); vm.runInContext(P, ctx);
  const U = ctx.__perf1286;
  ok(U.err === null, 'perf1286 boots: ' + U.err);
  ok(Math.abs(pr - 1.5) < 1e-9, 'phone pixel ratio capped at 1.5 (was 1.6, DPR 3)');
  // bones: the same pose twice uploads once
  const bone = { matrixWorld: new M4() }; const sk = new Skeleton([bone, bone]); sk.boneTexture = { v: 0, set needsUpdate(x) { if (x) this.v++; } };
  sk.update(); sk.update(); sk.update();
  ok(sk.boneTexture.v === 1 && U.skel.skip === 2, 'unchanged bones: one upload, two skipped');
  bone.matrixWorld.elements[12] = 0.25; sk.update();
  ok(sk.boneTexture.v === 2 && Math.abs(sk.boneMatrices[12] - 0.25) < 1e-7 && Math.abs(sk.boneMatrices[28] - 0.25) < 1e-7, 'moved bone uploads and writes the new matrices');
  sk.boneTexture = null; sk.update(); ok(origCalls === 1, 'no bone texture yet: original update runs');
  // governor: drive rAF with a fake clock
  let ts = 0; const runFrames = (n, dt, js) => { for (let i = 0; i < n; i++) { ts += dt; ctx.__perf1286.js = js; const q = rafQ; rafQ = []; for (const f of q) f(ts); } };
  ctx.started = false; runFrames(120, 1000 / 120, 1); // menu at 120Hz
  ok(U.hz === 120 && Math.abs(U.budget - 1000 / 120) < 1e-9, 'refresh measured at 120Hz, budget 8.33ms');
  ctx.started = true;
  runFrames(400, 1000 / 60, 3); // GPU-bound: 60fps with little JS
  ok(pr < 1.5 && U.rdDrop === 0, 'GPU-bound misses lower pixel ratio first (pr ' + pr.toFixed(2) + ')');
  ok(ctx.__noDynRes === 1, 'old c79 dynres stands down');
  const prLow = pr;
  runFrames(1500, 1000 / 60, 3);
  ok(pr >= U.prMin - 1e-9 && pr <= prLow + 1e-9, 'never below the floor (' + U.prMin + ')');
  ok(Math.abs(pr - U.prMin) < 0.02 && U.rdDrop > 0 && ctx.streamRadius() < 4.5, 'still GPU-bound at the pixel floor: then the stream radius is trimmed (drop ' + U.rdDrop + ')');
  const prFloor = pr;
  runFrames(4000, 1000 / 120, 2); // headroom
  ok(U.rdDrop === 0 && pr > prFloor, 'headroom gives quality back (pr ' + pr.toFixed(2) + ', drop ' + U.rdDrop + ')');
  ok(ctx.streamRadius() === 4.5, 'stream radius restored');
  runFrames(130, 1000 / 60, 14); const before = pr; runFrames(400, 1000 / 60, 14); // CPU-bound: JS ~ the frame (first 2 windows straddle the switch)
  ok(Math.abs(pr - before) < 1e-9, 'CPU-bound misses do not blur the screen');
  ok(U.rdDrop > 0, 'CPU-bound misses trim the chunk radius instead');
  ctx.__noGov1286 = 1; const s0 = U.steps.length; runFrames(300, 1000 / 20, 40); ok(U.steps.length === s0, '__noGov1286 disables the governor');
}
console.log('v1286-perf ok', k);
