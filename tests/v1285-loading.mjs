// 1.2.86-loading (unpublished, version stays 1.2.86): liquid meter + time-driven display.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/loading-1285.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.86';"), 'GAME_VERSION stays 1.2.86');
ok(!html.includes("const GAME_VERSION = '1.2.87';"), 'no 1.2.87 version bump');
ok(!/"v"\s*:\s*"v1\.2\.87"/.test(html), 'no 1.2.87 patch notes');
ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.86', 'version.json stays 1.2.86');
ok(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->') && html.includes('<!-- glencraft-build: b1285-v1.2.85 -->') && html.includes('<!-- glencraft-build: b1286-v1.2.86 -->'), '1.2.84–1.2.86 build markers stay');
ok(html.includes('<!-- glencraft-build: load1285 -->'), 'load1285 build marker');
ok(html.includes('/* GLX-LOAD1285'), 'GLX-LOAD1285 runtime');
ok((html.split('/* GLX-LOAD1285').length - 1) === 1, 'exactly one LOAD1285 runtime');
ok(html.includes('id="loadW"') && html.includes('liquid1285'), 'liquid load bar markup');
ok(html.includes('load-fill') && html.includes('load-wave'), 'fill + wave elements');
ok(src.includes('setReal') && src.includes('yieldPaint') && src.includes('__glenLoad'), 'source has meter API');
ok(src.includes('MessageChannel') && !/setTimeout\(res, 0\)/.test(src), 'yields use MessageChannel + rAF, not setTimeout(0)');
ok(html.includes('performance.now() - __tSlice > 200'), 'column loop yields about every 200ms of work');
ok(!html.includes('performance.now() - __tSlice > 40') && !html.includes('performance.now() - __tSlice > 8'), 'old 8ms/40ms yield cadence is gone');
ok(src.includes('quiet3d') && src.includes('return !!U.held'), '3D render/step are skipped only while generate is running');
ok(src.includes('if (U.held) return') && src.includes('budget == null) budget = 150'), 'generate does not mesh; unbounded rebuild is 150ms, rebuild(150) is unchanged');
ok(html.includes("full rebuild'); try { rebuild(150); }") && !html.includes('dirtyAll = true; rebuild(150)'), '20s land retry keeps already-meshed chunks (no dirtyAll wipe)');
ok(html.includes('const meshR = Math.max(lr, 2)') && html.includes('const LOAD_R = (window.__loadChunkR != null ? window.__loadChunkR : 1)'), 'load meshes R=2 but still enters after 9 spawn chunks');
ok(html.includes("phase: 'lat'") && html.includes("phase: 'ores'") && html.includes("phase: 'feat'"), 'GEN9 generate is phased: lattice, columns, ores, features');
ok(src.includes('U.coop') && src.includes('U.maybeYield') && src.includes('U.genDone'), 'wrapper post-stages are cached and yield every 200ms');
ok(src.includes('U._gen9') && src.includes('!U.genDone && U._gen9'), 'column/lattice resumes skip the wrapper chain');
ok(html.includes('__L._gen9 = __glenGen9 || generate') && html.includes('var __glenGen9 = generate;'), 'innermost GEN9 is captured before wrappers overwrite generate');
ok(html.includes('__glenLoad.isYield && __glenLoad.isYield(e)) throw e') && html.includes("console.warn('c104', e)"), 'wrapper catch blocks rethrow cooperative yields');
ok(src.includes('U.shown + 8') && src.includes('TIMED_CAP'), 'displayed catch-up is capped at 8% and follows the time curve');
ok(html.includes('_loop.c104') && html.includes("phase: 'strip'"), 'c104 ore strip is sliced and resumable');
ok(src.includes('U.skipPost') && src.includes('U.markPost') && html.includes('__glenLoad.skipPost'), 'already-finished wrapper posts are skipped on resume');
ok(/U\._passed\['w:' \+ id\] = 1;[\s\S]{0,400}U\.maybeYield\(\);/.test(src), 'markPost yields only after the wrapper is marked');
ok(html.includes('__Lf._featX') && html.includes('__glenLoad.coop'), 'features and wrapper posts report progress');

ok(html.includes('await __glenLoad.generate()'), 'new survival generate is awaited');
ok(html.includes("enterWorld = async function (save)"), 'survival map wrapper is async');
ok(html.includes('throw __L.YIELD'), 'column loop yields to the browser');
ok(html.includes('__L.touch(6 + 58 * (x + 1)'), 'column loop reports real progress');
ok(html.includes('if (!(window.__glenLoad && __glenLoad.held)) { flGen = false; FLV.clear()'), 'flGen finally is yield-safe');
ok(html.includes('__glenLoad.setReal(Math.max(target, __glenLoad.real || 0)'), 'original loader feeds the shared meter');
ok(html.includes('shown = (window.__glenLoad && __glenLoad.shown) || 0'), 'original loader does not reset a filling bar');
ok(/await yieldPaint\(\);[\s\S]{0,240}U\._tSlice = performance\.now\(\);/.test(src), 'fresh 200ms work budget after each yield');
ok(src.includes('const due = performance.now() - (U._tSlice || 0) > 200') && src.includes('if (due && label'), 'pulse paints only when a yield is due');
ok(html.includes('__Lpools.pulse') && html.includes('__glenLoad._pools'), 'placePools yields every 200ms and resumes');
ok(html.includes('_deferPools') && html.includes('runDeferredPools'), 'mud pools are deferred until after enter');
ok(html.includes('__st1248') && html.includes('__glenLoad.live) { __glenLoad._deferPools = 1; }'), 'placePools1248 is deferred during load and yields');
ok(html.includes('__glenLoad.shown > 99.5'), 'ready waits for the 400ms finish glide before entering');
ok(html.includes("ready = true; loadStep('entering the world');") && html.includes('__glenLoad.finish()'), 'ready starts the 400ms finish glide immediately');
ok(!/ready = true;[\s\S]{0,240}renderer\.render\(scene, camera\)/.test(html), 'first present is not synchronous before the finish glide');
ok(/started = true[\s\S]{0,500}setTimeout\(function \(\) \{[\s\S]{0,200}renderer\.render\(scene, camera\)/.test(html), 'first present runs after enter, on a later turn');
ok(/const LOAD_R = \(window\.__loadChunkR != null \? window\.__loadChunkR : 1\)/.test(html), 'load chunk ring still defaults to R=1');
ok(html.includes('enterWorld._fauna'), 'deferred fauna stays');
ok(html.includes("if (!started || (typeof screen !== 'undefined' && screen === 'loading'))"), 'stream radius still capped during load');
ok(!/haggis|sausage|pie\b|bread|stew/.test(src), 'loading source has no food copy');

// Pure lerp/creep contract (mirrors the runtime, no DOM).
function stepMeter(U, opts) {
  if (!U.done && U.real < U.cap) {
    const idle = opts.idle || 0;
    if (idle > 180) {
      const room = U.cap - U.real;
      const s = Math.min(room * 0.018, Math.max(0.07, room * 0.004));
      U.real = Math.min(U.cap - 0.15, U.real + s);
    }
  }
  const target = U.done ? 100 : U.real;
  let shown = U.shown;
  if (target > shown) {
    shown += (target - shown) * (U.done ? 0.22 : 0.16);
    if (target - shown < 0.04) shown = target;
  }
  if (shown > target) shown = target;
  if (U.done && shown > 99.4) shown = 100;
  if (!U.done && shown > 99.2) shown = 99.2;
  U.shown = shown;
  return U;
}
{
  const U = {real: 10, shown: 10, cap: 70, done: 0};
  const a = stepMeter({...U}, {idle: 0});
  ok(a.shown === 10 && a.real === 10, 'no creep and no lerp when already caught up and not idle');
  const b = stepMeter({real: 40, shown: 10, cap: 70, done: 0}, {idle: 0});
  ok(b.shown > 10 && b.shown < 40, 'shown eases toward real');
  const c = stepMeter({real: 40, shown: 39.9, cap: 70, done: 0}, {idle: 0});
  const d = stepMeter({real: 20, shown: 40, cap: 70, done: 0}, {idle: 0});
  ok(d.shown === 20 || d.shown <= 20, 'shown never exceeds real (no backwards fill past real)');
  // never goes backwards: feeding a lower real is clamped by setReal in runtime;
  // here shown is pulled down only if it was already above real — runtime setReal uses Math.max.
  let u = {real: 50, shown: 40, cap: 92, done: 0};
  for (let i = 0; i < 8; i++) {
    const prev = u.shown;
    u = stepMeter({...u, real: Math.max(u.real, 50 + i)}, {idle: 0});
    ok(u.shown >= prev - 1e-9, 'shown is monotonic when real only rises (' + i + ')');
  }
  let v = {real: 80, shown: 80, cap: 92, done: 0};
  const before = v.real;
  v = stepMeter(v, {idle: 500});
  ok(v.real > before && v.real < v.cap, 'creeps during a long idle stage, stays under cap');
  let w = {real: 98, shown: 97, cap: 99, done: 0};
  w = stepMeter(w, {idle: 0});
  ok(w.shown <= 99.2, 'shown cannot read 100 before done');
  let z = {real: 100, shown: 99.5, cap: 100, done: 1};
  z = stepMeter(z, {idle: 0});
  ok(z.shown === 100, 'shown reaches 100 only when done');
}


// Time-driven displayed progress (mirrors the runtime, no DOM).
function timeCurve(elapsed, T, TIMED_AT_T = 97, TIMED_CAP = 99) {
  T = Math.max(1, T || 60000);
  const t = Math.max(0, elapsed);
  if (t <= T) {
    const u = t / T;
    const e = 0.8 * u + 0.2 * (u * u * (3 - 2 * u));
    return TIMED_AT_T * e;
  }
  const over = t - T;
  const tau = 45000;
  return Math.min(TIMED_CAP - 0.05, TIMED_AT_T + (TIMED_CAP - TIMED_AT_T) * (1 - 1 / (1 + over / tau)));
}
{
  ok(src.includes('function timeCurve') && src.includes('glenLoadTimes') && src.includes('GLIDE_MS = 400'), 'time-driven meter, localStorage expect, 400ms finish glide');
  ok(src.includes('cancelAnimationFrame(_raf)') && src.includes('_mcLive = 0') && src.includes("_mc.port1.onmessage = null"), 'stop cancels the rAF tick and detaches the MessageChannel');
  ok(src.includes('TIMED_AT_T = 97') && src.includes('TIMED_CAP = 99'), 'time curve eases to 97 then creeps toward 99');
  ok(src.includes('U.finishing && (U.shown >= 99.95') && src.includes('stop();'), 'tick stops rAF when the finish glide reaches 100');
  ok(src.includes('load1285done') && src.includes('animation:none!important') && src.includes('#scr-loading:not(.on)'), 'wave/shine animations stop when entered or the loading screen is hidden');
  ok(src.includes('EXPECT_DEFAULT = 60000') && src.includes('times.slice(-5)'), 'expected load starts at 60s and adapts from the last 5 times');
  const T = 60000;
  ok(timeCurve(0, T) === 0, 'time curve starts at 0');
  const mid = timeCurve(T, T);
  ok(Math.abs(mid - 97) < 0.01, 'time curve is ~97% at the expected duration');
  ok(timeCurve(T * 2, T) > mid && timeCurve(T * 2, T) < 99, 'after the expected duration the curve creeps toward 99 and stays under it');
  ok(timeCurve(T * 8, T) < 99 && timeCurve(T * 8, T) > timeCurve(T * 2, T), 'asymptotic creep never reaches 99 / never goes backwards');
  let prev = -1, minWindow = 999, frozen = 0, backwards = 0;
  for (let t = 0; t <= T * 2; t += 250) {
    const v = timeCurve(t, T);
    if (v < prev - 1e-9) backwards++;
    prev = v;
  }
  ok(backwards === 0, 'time curve is monotonic over 0..2T');
  // The expected-duration stretch must keep moving; the post-T tail is
  // allowed to be flatter because applyDisplay adds a floor creep.
  for (let t = 0; t + 3000 <= T; t += 250) {
    const a = timeCurve(t, T), b = timeCurve(t + 3000, T);
    const d = b - a;
    if (d < 0.15) frozen++;
    if (d < minWindow) minWindow = d;
  }
  ok(frozen === 0, 'no 3s window under 0.15% movement on the time curve during 0..T (min ' + minWindow.toFixed(3) + ')');
  // displayed = max(real, timed), never back, jump cap 8
  let shown = 30;
  const apply = (timed, real, dt = 0) => {
    const cap = 98.95;
    const floor = 0.08 * (dt / 1000);
    let aim = Math.max(shown, timed, Math.min(real, 99));
    aim = Math.min(99, aim);
    if (shown < cap) {
      const stepped = Math.min(cap, shown + floor);
      if (aim > shown) shown = Math.min(cap, Math.max(stepped, Math.min(aim, shown + 8)));
      else shown = stepped;
    }
    return shown;
  };
  const a = apply(40, 10);          // follows time 40, +8 cap from 30
  const b = apply(44, 70);          // real jumps 60, but cap +8
  ok(Math.abs(a - 38) < 1e-9 && Math.abs(b - 46) < 1e-9, 'displayed follows the time curve and never jumps more than 8%');
  shown = 50;
  const c = apply(20, 10, 0);
  ok(c === 50, 'displayed never goes backwards if real/time drop');
  shown = 93.64;
  const floored = apply(93.76, 88, 3500);
  ok(floored - 93.64 >= 0.15, 'floor creep still moves at least 0.15% over 3s even when the time curve is flatter');
  shown = 97;
  const tail = apply(timeCurve(T + 30000, T), 80, 3000);
  ok(tail - 97 >= 0.15 && tail < 99, 'after T, floor creep still moves the bar toward 99 over 3s');
  // 400ms ease-out glide
  const finishFrom = 90, GLIDE = 400;
  const glide = (u) => {
    const e = 1 - (1 - Math.min(1, u)) * (1 - Math.min(1, u));
    return finishFrom + (100 - finishFrom) * e;
  };
  ok(Math.abs(glide(0) - 90) < 1e-9 && Math.abs(glide(1) - 100) < 1e-9, 'finish glide starts at current shown and ends at 100');
  ok(glide(0.25) > 90 && glide(0.25) < 98 && glide(1.2) === 100, '400ms glide is quick but not a snap');
}

console.log('PASS ' + n + ' v1285 loading checks');
