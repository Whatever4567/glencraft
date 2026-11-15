// 1.2.85-loading (unpublished): liquid meter + cooperative world generate.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/loading-1285.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.84';"), 'GAME_VERSION stays 1.2.84');
ok(!html.includes("const GAME_VERSION = '1.2.85';"), 'no 1.2.85 version bump');
ok(!/"v"\s*:\s*"v1\.2\.85"/.test(html), 'no 1.2.85 patch notes');
ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.84', 'version.json stays 1.2.84');
ok(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), '1.2.84 build marker stays');
ok(html.includes('<!-- glencraft-build: load1285 -->'), 'load1285 build marker');
ok(html.includes('/* GLX-LOAD1285'), 'GLX-LOAD1285 runtime');
ok((html.split('/* GLX-LOAD1285').length - 1) === 1, 'exactly one LOAD1285 runtime');
ok(html.includes('id="loadW"') && html.includes('liquid1285'), 'liquid load bar markup');
ok(html.includes('load-fill') && html.includes('load-wave'), 'fill + wave elements');
ok(src.includes('setReal') && src.includes('yieldPaint') && src.includes('__glenLoad'), 'source has meter API');
ok(html.includes('await __glenLoad.generate()'), 'new survival generate is awaited');
ok(html.includes("enterWorld = async function (save)"), 'survival map wrapper is async');
ok(html.includes('throw __L.YIELD'), 'column loop yields to the browser');
ok(html.includes('__L.touch(6 + 58 * (x + 1)'), 'column loop reports real progress');
ok(html.includes('if (!(window.__glenLoad && __glenLoad.held)) { flGen = false; FLV.clear()'), 'flGen finally is yield-safe');
ok(html.includes('__glenLoad.setReal(Math.max(target, __glenLoad.real || 0)'), 'original loader feeds the shared meter');
ok(html.includes('shown = (window.__glenLoad && __glenLoad.shown) || 0'), 'original loader does not reset a filling bar');
ok(html.includes('__glenLoad.shown > 98.5 || __glenLoad.done'), 'ready check uses the shared meter so the world can start');
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

console.log('PASS ' + n + ' v1285 loading checks');
