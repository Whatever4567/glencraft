// 1.2.89: smoother deterministic loading on the 1.2.88 compositor meter.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/loading-1285.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.98';") || html.includes("const GAME_VERSION = '1.2.99';") || html.includes("const GAME_VERSION = '1.2.100';"), 'GAME_VERSION is 1.2.98');
ok(!html.includes("const GAME_VERSION = '1.2.97';"), 'GAME_VERSION is no longer 1.2.97');
ok(!html.includes("const GAME_VERSION = '1.2.96';"), 'GAME_VERSION is no longer 1.2.96');
ok(!html.includes("const GAME_VERSION = '1.2.95';"), 'GAME_VERSION is no longer 1.2.95');
ok(!html.includes("const GAME_VERSION = '1.2.93';"), 'GAME_VERSION is no longer 1.2.93');
ok(!html.includes("const GAME_VERSION = '1.2.92';"), 'GAME_VERSION is no longer 1.2.92');
ok(!html.includes("const GAME_VERSION = '1.2.91';"), 'GAME_VERSION is no longer 1.2.91');
ok(!html.includes("const GAME_VERSION = '1.2.90';"), 'GAME_VERSION is no longer 1.2.90');
ok(/"v"\s*:\s*"v1\.2\.98"/.test(html), '1.2.98 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.97"/.test(html), '1.2.97 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.96"/.test(html), '1.2.96 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.95"/.test(html), '1.2.95 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.94"/.test(html), '1.2.94 patch notes still present');
ok(/"v"\s*:\s*"v1\.2\.93"/.test(html), '1.2.93 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.92"/.test(html), '1.2.92 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.91"/.test(html), '1.2.91 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.90"/.test(html), '1.2.90 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.89"/.test(html), '1.2.89 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.88"/.test(html), '1.2.88 patch notes present');
ok(/"v"\s*:\s*"v1\.2\.87"/.test(html), '1.2.87 patch notes present');
ok(/loading bar now fills smoothly the whole time/i.test(html), '1.2.87 notes mention the loading bar filling smoothly the whole time');
ok(/never looks frozen/i.test(html), '1.2.88 notes mention the loading bar that never looks frozen');
ok(/First-person hands are clearer now/i.test(html), '1.2.88 notes mention improved first-person hands');
ok(/green loading fluid/i.test(html), '1.2.94 notes mention the green loading fluid');
ok(/first-person pickaxe stays in your fist/i.test(html), '1.2.95 notes mention the pickaxe');
ok(/fingers and the pickaxe grip are back/i.test(html), '1.2.98 notes mention the 1.2.94 finger revert');
ok(/held map still shows/i.test(html), '1.2.98 notes mention the held map');
ok(/official map-edge isles/i.test(html), '1.2.97 notes mention the edge-isle castles');
ok(/gold portal at the clan castle/i.test(html), '1.2.97 notes mention the clan-castle gold portal');
ok(/temple is no longer generated in the Glencraft overworld/i.test(html), '1.2.97 notes mention no overworld temple');
ok(/ground at spawn is solid/i.test(html), '1.2.97 notes mention the solid spawn ground');
ok(/UFO paintings hang in the Egypt land pyramid/i.test(html), '1.2.96 notes mention the UFO paintings');
ok(/flies to the sand realm at night/i.test(html), '1.2.96 notes mention the saucer night route');
ok(/Egyptians only live at the temple/i.test(html), '1.2.96 notes mention Egyptians only in the sand realm');
ok(/own desert sky/i.test(html), '1.2.96 notes mention the desert sky');
ok(/plays in landscape on phones/i.test(html), '1.2.93 notes mention landscape on phones');
ok(/controller inventory freeze/i.test(html), '1.2.92 notes mention the controller inventory freeze');
ok(/connect into one network/i.test(html), '1.2.91 notes mention interconnecting caves');
ok(/Ravines and sinkholes open from the surface across the UK map/i.test(html), '1.2.91 notes mention ravines and sinkholes');
ok(/caves under the water/i.test(html), '1.2.91 notes mention underwater caves');
ok(/Rare ores like diamond, gold and silver are more common the deeper you go/i.test(html), '1.2.91 notes mention depth-scaled rare ores');
ok(/stay on the pistol and musket during reloads/i.test(html), '1.2.90 notes mention hands staying on the guns during reloads');
ok(/never jumps backwards/i.test(html), '1.2.89 notes mention the percentage never jumps backwards');
ok(/same seed always makes the same world/i.test(html), '1.2.89 notes mention deterministic worlds');
{
  const st = html.indexOf('{"v":"v1.2.100"'), en = html.indexOf('{"v":"v1.2.99"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.100 notes first, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.99"'), en = html.indexOf('{"v":"v1.2.98"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.99 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.98"'), en = html.indexOf('{"v":"v1.2.97"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.98 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.93"'), en = html.indexOf('{"v":"v1.2.92"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.93 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.92"'), en = html.indexOf('{"v":"v1.2.91"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.92 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.91"'), en = html.indexOf('{"v":"v1.2.90"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.91 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.90"'), en = html.indexOf('{"v":"v1.2.89"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.90 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.89"'), en = html.indexOf('{"v":"v1.2.88"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.89 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.88"'), en = html.indexOf('{"v":"v1.2.87"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.88 notes still present, no food');
}
{
  const st = html.indexOf('{"v":"v1.2.87"'), en = html.indexOf('{"v":"v1.2.86"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.87 notes remain, no food');
}
ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.100', 'version.json is 1.2.100');
ok(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->') && html.includes('<!-- glencraft-build: b1285-v1.2.85 -->') && html.includes('<!-- glencraft-build: b1286-v1.2.86 -->') && html.includes('<!-- glencraft-build: b1287-v1.2.87 -->') && html.includes('<!-- glencraft-build: b1288-v1.2.88 -->') && html.includes('<!-- glencraft-build: b1289-v1.2.89 -->') && html.includes('<!-- glencraft-build: b1290-v1.2.90 -->') && html.includes('<!-- glencraft-build: b1291-v1.2.91 -->') && html.includes('<!-- glencraft-build: b1292-v1.2.92 -->') && html.includes('<!-- glencraft-build: b1293-v1.2.93 -->') && html.includes('<!-- glencraft-build: b1294-v1.2.94 -->') && html.includes('<!-- glencraft-build: b1295-v1.2.95 -->') && html.includes('<!-- glencraft-build: b1296-v1.2.96 -->') && html.includes('<!-- glencraft-build: b1297-v1.2.97 -->') && html.includes('<!-- glencraft-build: b1298-v1.2.98 -->') && html.includes('<!-- glencraft-build: b1299-v1.2.99 -->'), '1.2.84–1.2.99 build markers stay');
ok(html.includes('<!-- glencraft-build: load1285 -->'), 'load1285 build marker');
ok(html.includes('/* GLX-LOAD1285'), 'GLX-LOAD1285 runtime');
ok((html.split('/* GLX-LOAD1285').length - 1) === 1, 'exactly one LOAD1285 runtime');
ok(html.includes('id="loadW"') && html.includes('liquid1285'), 'liquid load bar markup');
ok(html.includes('load-fill') && html.includes('load-wave'), 'fill + wave elements');
ok(src.includes('setReal') && src.includes('yieldPaint') && src.includes('__glenLoad'), 'source has meter API');
ok(src.includes('MessageChannel') && !/setTimeout\(res, 0\)/.test(src), 'yields use MessageChannel + rAF, not setTimeout(0)');
ok(html.includes('performance.now() - __tSlice > (__SLB())'), 'column loop yields on the adaptive 300-400ms slice budget');
ok(!html.includes('performance.now() - __tSlice > 40') && !html.includes('performance.now() - __tSlice > 8'), 'old 8ms/40ms yield cadence is gone');
ok(src.includes('quiet3d') && src.includes('U.uiScreen === \'loading\'') && src.includes("getElementById('scr-loading')") && src.includes('if (U.held) return true'), '3D render/step stay muted on the loading screen until enter (not window.screen)');
ok(src.includes('if (U.held) return') && src.includes('budget == null) budget = 150'), 'generate does not mesh; unbounded rebuild is 150ms, rebuild(150) is unchanged');
ok(src.includes("Building terrain meshes") && html.includes("Building terrain meshes"), 'spawn-ring meshing reports as Building terrain meshes with chunk counts');
ok(html.includes("full rebuild'); try { rebuild(150); }") && !html.includes('dirtyAll = true; rebuild(150)'), '20s land retry keeps already-meshed chunks (no dirtyAll wipe)');
ok(html.includes('const meshR = Math.max(lr, 2)') && html.includes('const LOAD_R = (window.__loadChunkR != null ? window.__loadChunkR : 1)'), 'load meshes R=2 but still enters after 9 spawn chunks');
ok(html.includes("phase: 'lat'") && html.includes("phase: 'ores'") && html.includes("phase: 'feat'"), 'GEN9 generate is phased: lattice, columns, ores, features');
ok(src.includes('U.coop') && src.includes('U.maybeYield') && src.includes('U.genDone'), 'wrapper post-stages are cached and yield on the adaptive slice');
ok(src.includes('U._gen9') && src.includes('!U.genDone && U._gen9'), 'column/lattice resumes skip the wrapper chain');
ok(html.includes('__L._gen9 = __glenGen9 || generate') && html.includes('var __glenGen9 = generate;'), 'innermost GEN9 is captured before wrappers overwrite generate');
ok(html.includes('__glenLoad.isYield && __glenLoad.isYield(e)) throw e') && html.includes("console.warn('c104', e)"), 'wrapper catch blocks rethrow cooperative yields');
ok(src.includes('8 * (dt / 1000)') && src.includes('TIMED_CAP'), 'displayed catch-up is capped at 8%/s and follows the time curve');
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
ok(/await yieldPaint\(\);[\s\S]{0,800}U\._tSlice = performance\.now\(\);/.test(src), 'fresh work budget after each yield');
ok(src.includes('const due = performance.now() - (U._tSlice || 0) > U.sliceMs()') && src.includes('if (due && label'), 'pulse paints only when a yield is due');
ok(html.includes('__Lpools.pulse') && html.includes('__glenLoad._pools'), 'placePools yields every 200ms and resumes');
ok(html.includes('_deferPools') && html.includes('runDeferredPools'), 'mud pools are deferred until after enter');
ok(html.includes('__st1248') && html.includes('__glenLoad.live) { __glenLoad._deferPools = 1; }'), 'placePools1248 is deferred during load and yields');
ok(html.includes('__glenLoad.shown > 99.5'), 'ready waits for the 400ms finish glide before entering');
ok(html.includes("ready = true; loadStep('entering the world');") && html.includes('__glenLoad.finish()'), 'ready starts the 400ms finish glide immediately');
ok(!/ready = true;[\s\S]{0,240}renderer\.render\(scene, camera\)/.test(html), 'first present is not synchronous before the finish glide');
ok(/started = true[\s\S]{0,900}requestAnimationFrame\(function \(\) \{ requestAnimationFrame\(function \(\) \{ setTimeout\(function \(\) \{[\s\S]{0,200}renderer\.render\(scene, camera\)/.test(html), 'first present runs after enter, after two rAFs so the 100% glide can paint');
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
  // % text: blend real progress with an ETA, decimals past 90%, never back.
  ok(src.includes('function displayAim') && src.includes("d.toFixed(1) + '%'") && src.includes('function etaMs') && !src.includes('TICK_MS = 2000'), '% text uses an ETA blend and decimals past 90%, not a fixed 2s tick');
  function simPct(duration, realAt) {
    const st = {shown: 0, _pctShown: 0, _pctShownAt: 0, t0: 0, _rate: [], _eta: 0, real: 0, finishing: 0, done: 0};
    const NEAR_REAL = 99, NEAR_ETA = 2500, labels = [];
    const note = (now) => {
      const r = st.real;
      const last = st._rate[st._rate.length - 1];
      if (!last || now - last.t > 250 || Math.abs(r - last.r) > 0.3) {
        st._rate.push({t: now, r: r});
        if (st._rate.length > 12) st._rate.shift();
      }
    };
    const etaOf = (now) => {
      const elapsed = Math.max(1, now);
      let rate = st.real / elapsed;
      if (st._rate.length >= 2) {
        const a = st._rate[0], b = st._rate[st._rate.length - 1];
        if (b.t > a.t + 400 && b.r > a.r + 0.5) rate = 0.6 * ((b.r - a.r) / (b.t - a.t)) + 0.4 * rate;
      }
      let eta = rate < 1e-6 ? Math.max(elapsed * 3, 20000) : elapsed + Math.max(0, (100 - Math.min(st.real, 100)) / rate) + 400;
      const minRemain = (100 - st.real) / 100 * 60000 * 0.5;
      eta = Math.max(eta, elapsed + minRemain);
      if (st._eta) eta = eta < st._eta ? st._eta * 0.85 + eta * 0.15 : st._eta * 0.7 + eta * 0.3;
      st._eta = eta;
      return eta;
    };
    let back = 0, maxGap = 0, lastT = 0, lastV = 0, t99 = null, hasDec = false;
    for (let now = 0; now <= duration; now += 200) {
      st.real = realAt(now, duration);
      note(now);
      const elapsed = now, eta = etaOf(now);
      const fromReal = Math.min(98.5, st.real * 0.985);
      const fromEta = eta > 0 ? Math.min(98.9, 98.9 * Math.min(1, elapsed / eta)) : 0;
      let aim = Math.max(fromReal, fromEta, st.shown);
      if (now - (st._pctShownAt || 0) >= 2000 && (st._pctShown || 0) < 98.9) {
        const last = st._pctShown || 0;
        aim = Math.max(aim, last < 90 ? last + 1 : Math.round((last + 0.1) * 10) / 10);
      }
      const nearly = st.real >= NEAR_REAL || (st.real >= 96 && (eta - elapsed) <= NEAR_ETA);
      if (nearly) aim = Math.max(aim, 99);
      if (aim >= 99 && !nearly) aim = 98.9;
      aim = Math.min(nearly ? 99 : 98.9, aim);
      if (aim < st.shown) aim = st.shown;
      st.shown = aim;
      let v = Math.min(99, Math.max(st._pctShown, aim));
      let text;
      if (v < 90) { v = Math.min(89, Math.floor(v + 1e-9)); text = v + '%'; }
      else { v = Math.floor(v * 10 + 1e-9) / 10; text = v.toFixed(1) + '%'; hasDec = hasDec || v >= 90; }
      if (v < st._pctShown) { v = st._pctShown; back++; }
      if (v !== st._pctShown) {
        if (labels.length) maxGap = Math.max(maxGap, now - lastT);
        st._pctShown = v; st._pctShownAt = now; lastT = now; lastV = v;
        labels.push({t: now, v: v, text: text});
        if (v >= 99 && t99 == null) t99 = now;
      }
    }
    return {labels, maxGap, back, t99, lastV, shown: st.shown, hasDec};
  }
  const genLike = (t, T) => t < T * 0.88 ? 90 * t / (T * 0.88) : 90 + 10 * (t - T * 0.88) / (T * 0.12);
  const paced = simPct(60000, genLike);
  ok(paced.back === 0, 'ETA-blend % never goes backwards (60s load)');
  ok(paced.maxGap <= 2500, 'visible % gap is at most 2.5s on a 60s load (max ' + paced.maxGap + ')');
  ok(paced.t99 == null || paced.t99 >= 50000, '99 is reserved until late in a 60s load (t99=' + paced.t99 + ')');
  ok(paced.hasDec && paced.labels.some((e) => e.text.includes('.')), 'past 90% the label shows one decimal on a 60s load');
  const long = simPct(400000, genLike);
  ok(long.back === 0, 'ETA-blend % never goes backwards (400s load)');
  const late = long.labels.filter((e) => e.v >= 90 && e.v < 98.9);
  const lateGap = late.reduce((m, e, i, a) => i ? Math.max(m, e.t - a[i - 1].t) : 0, 0);
  ok(lateGap <= 2500, 'past 90% and before 98.9 the visible % gap is at most 2.5s on a 400s load (max ' + lateGap + ')');
  ok(long.t99 == null || long.t99 >= 350000, '99 is not reached until near the end of a 400s load (t99=' + long.t99 + ')');
  const parked98 = long.labels.filter((e, i, a) => Math.floor(e.v) === 98 && a[i + 1] && a[i + 1].t - e.t > 60000);
  ok(parked98.length === 0, 'does not park at 98 for a minute on a long load');
  ok(long.lastV >= 98, 'a long load still advances through the 98.x decimals');
  const drop = simPct(20000, (t) => t < 10000 ? 40 : 10);
  ok(drop.back === 0 && drop.lastV >= 1, 'displayed % never drops if real progress falls back');
  const burst = simPct(60000, (t, T) => t < 5000 ? 64 * t / 5000 : 64 + 36 * (t - 5000) / (T - 5000));
  ok(burst.back === 0, 'front-loaded real % never goes backwards');
  ok(!burst.labels.some((e) => e.v >= 99 && e.t < 50000), 'a fast early stage does not snap the label to 99 (first 99 at t=' + burst.t99 + ')');
  ok(burst.maxGap <= 2500, 'visible % gap stays at most 2.5s on a front-loaded 60s load (max ' + burst.maxGap + ')');
  const parked88 = burst.labels.filter((e, i, a) => Math.floor(e.v) === 88 && a[i + 1] && a[i + 1].t - e.t > 5000);
  ok(parked88.length === 0, 'does not park at 88% for 5s+ on a front-loaded load');
  // 400ms ease-out glide
  const finishFrom = 90, GLIDE = 400;
  const glide = (u) => {
    const e = 1 - (1 - Math.min(1, u)) * (1 - Math.min(1, u));
    return finishFrom + (100 - finishFrom) * e;
  };
  ok(Math.abs(glide(0) - 90) < 1e-9 && Math.abs(glide(1) - 100) < 1e-9, 'finish glide starts at current shown and ends at 100');
  ok(glide(0.25) > 90 && glide(0.25) < 98 && glide(1.2) === 100, '400ms glide is quick but not a snap');
}

// 1.2.88 compositor-only meter: fill and shimmer keep moving during long tasks.
ok(src.includes("version: 'load-1288'"), 'source version is load-1288');
ok(html.includes("version: 'load-1288'") && html.includes('/* GLX-LOAD1285'), 'load-1288 runtime is in the build');
ok(src.includes('will-change:transform') && src.includes('transform-origin:left center') && src.includes('transform:scaleX(0)'), 'fill uses compositor scaleX with will-change');
ok(src.includes('function startFillAnim') && src.includes('fill.animate(baked.frames') && src.includes('keyframesForCurve'), 'fill is a WAAPI transform animation baked from the time curve');
ok(src.includes('anim.currentTime') && src.includes('if (elapsed > cur + 50)') && src.includes('if (jump > cur)'), 'resync only moves the fill animation forward');
ok(src.includes('function glideTo100') && src.includes("transform: 'scaleX(1)'"), 'ready glides the fill to 100 and is still transform-only');
ok(src.includes('stopFillAnim') && src.includes("fill.style.willChange = 'auto'") && src.includes("fill.style.transform = 'scaleX(1)'"), 'stop cancels the fill animation and freezes at 100');
ok(src.includes('load1288shine') && src.includes('translateX(-120%)') && src.includes('translateX(280%)') && src.includes('will-change:transform'), 'shimmer/wave is a compositor translateX loop');
ok(!src.includes('background-position') && !src.includes('load1285shine') && !src.includes('load1285wave'), 'old main-thread background-position shine is gone');
ok(!src.includes("shown.toFixed(2) + '%'"), 'paint no longer drives the fill with style.width');
ok(src.includes("d.toFixed(1) + '%'") && src.includes('pct.textContent = text') && src.includes('if (v < prev) { v = prev') && !src.includes('TICK_MS = 2000'), '% text is monotonic, with one decimal past 90%, paced from the ETA');
ok(src.includes('U._pctInt = 0') && src.includes('startFillAnim'), 'a new load resets the label and starts the fill animation');
{
  const T = 60000, tail = 120000;
  const mid = (function timeCurve(elapsed, T, TIMED_AT_T = 97, TIMED_CAP = 99) {
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
  });
  // keyframes end at 97% at t=T and stay under 99 after
  ok(Math.abs(mid(T, T) - 97) < 0.01, 'baked curve still hits 97% at the expected duration');
}


ok(src.includes('Keep a one-decimal 99.x until the glide reaches 100') && html.includes('Keep a one-decimal 99.x until the glide reaches 100') && !src.includes("return Math.min(100, Math.round(x)) + '%'"), 'paint no longer rounds the finishing label to an integer below 100');
{
  function finishLabel(prev, shown) {
    let v = Math.min(100, Math.max(prev, shown || 0));
    let text;
    function labelFor(x) {
      if (x >= 99.95) return '100%';
      if (x < 90) return Math.floor(x + 1e-9) + '%';
      return (Math.floor(x * 10 + 1e-9) / 10).toFixed(1) + '%';
    }
    if (v >= 99.95) { v = 100; text = '100%'; }
    else { const d = Math.floor(v * 10 + 1e-9) / 10; v = d; text = d.toFixed(1) + '%'; }
    if (v < prev) { v = prev; text = labelFor(v); }
    return {v, text};
  }
  const snap = finishLabel(99.2, 99.27);
  ok(snap.text === '99.2%' && snap.v === 99.2, 'finishing from 99.2% does not paint 99%');
  ok(finishLabel(99.2, 99.64).text === '99.6%', 'finish glide keeps one decimal while climbing');
  ok(finishLabel(99.8, 100).text === '100%', 'finish glide still reaches 100%');
}

console.log('PASS ' + n + ' v1285 loading checks');
