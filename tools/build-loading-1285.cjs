#!/usr/bin/env node
'use strict';
/* Fold-in later: do NOT bump GAME_VERSION, version.json, PATCH_NOTES, or CREDITS. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
must(html.includes("const GAME_VERSION = '1.2.84';"), 'must stay on 1.2.84 (no version bump)');
must(!html.includes("const GAME_VERSION = '1.2.85';"), 'must not bump to 1.2.85');

const src = fs.readFileSync(path.join(root, 'tools/content-source/loading-1285.js'), 'utf8');
must(src.includes('GLX-LOAD1285'), 'source marker');
must(src.includes('__glenLoad'), 'source API');

/* 1) Cooperative resume + yield in the GEN9 column loop (innermost generate). */
const genHead = `function generate() {
  if (!gSeed) gSeed = window.__forceSeed || (Math.random() * 2 ** 31) | 0;
  G9P = g9perm(gSeed); genVer = GEN9; NSEED = gSeed;
  const rnd = g9rng(gSeed ^ 0x9e3779b9), hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  world.fill(T.AIR);
  g9cols = new Int16Array(W * D * 2);`;

const genHeadNew = `function generate() {
  const __L = window.__glenLoad, __resume = !!(__L && __L.held && __L._g9);
  let rnd, hash, cav, tun, tri;
  if (__resume) {
    rnd = __L._g9.rnd; hash = __L._g9.hash; cav = __L._g9.cav; tun = __L._g9.tun; tri = __L._g9.tri;
  } else {
  if (!gSeed) gSeed = window.__forceSeed || (Math.random() * 2 ** 31) | 0;
  G9P = g9perm(gSeed); genVer = GEN9; NSEED = gSeed;
  rnd = g9rng(gSeed ^ 0x9e3779b9); hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  world.fill(T.AIR);
  g9cols = new Int16Array(W * D * 2);`;

html = replaceOnce(html, genHead, genHeadNew, 'gen head');

const afterTri = `    return L(L(L(at(0, 0, 0), at(1, 0, 0), u), L(at(0, 1, 0), at(1, 1, 0), u), v), L(L(at(0, 0, 1), at(1, 0, 1), u), L(at(0, 1, 1), at(1, 1, 1), u), v), w);
  };
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const c = g9height(x, z), h = c.h;`;

const afterTriNew = `    return L(L(L(at(0, 0, 0), at(1, 0, 0), u), L(at(0, 1, 0), at(1, 1, 0), u), v), L(L(at(0, 0, 1), at(1, 0, 1), u), L(at(0, 1, 1), at(1, 1, 1), u), v), w);
  };
  if (__L && __L.held) {
    __L._g9 = {rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};
    try { __L.touch(6, 'Raising the mountains… 0/' + W, 70); } catch (_) {}
    throw __L.YIELD;
  }
  }
  const __x0 = (__L && __L.held && __L.genX) || 0;
  let __tSlice = performance.now();
  for (let x = __x0; x < W; x++) {
    for (let z = 0; z < D; z++) {
    const c = g9height(x, z), h = c.h;`;

html = replaceOnce(html, afterTri, afterTriNew, 'gen loop start');

/* Assign cav/tun/tri to function-scoped lets so the boot (non-coop) path can use them after the else. */
const latticeOld = `  const SX = Math.ceil(W / 4) + 1, SY = Math.ceil(H / 4) + 1, SZ = Math.ceil(D / 4) + 1, cav = new Float32Array(SX * SY * SZ), tun = new Float32Array(SX * SY * SZ);
  for (let i = 0; i < SX; i++) for (let j = 0; j < SY; j++) for (let k = 0; k < SZ; k++) {
    const x = i * 4, y = j * 4, z = k * 4, o = (i * SY + j) * SZ + k;
    cav[o] = g9n3(x / 38, y / 16, z / 38) + 0.5 * g9n3(x / 17, y / 9, z / 17);
    tun[o] = Math.abs(g9n3(x / 26 + 100, y / 15, z / 26 - 50));
  }
  const tri = (A, x, y, z) => {`;
const latticeNew = `  const SX = Math.ceil(W / 4) + 1, SY = Math.ceil(H / 4) + 1, SZ = Math.ceil(D / 4) + 1;
  cav = new Float32Array(SX * SY * SZ); tun = new Float32Array(SX * SY * SZ);
  for (let i = 0; i < SX; i++) for (let j = 0; j < SY; j++) for (let k = 0; k < SZ; k++) {
    const x = i * 4, y = j * 4, z = k * 4, o = (i * SY + j) * SZ + k;
    cav[o] = g9n3(x / 38, y / 16, z / 38) + 0.5 * g9n3(x / 17, y / 9, z / 17);
    tun[o] = Math.abs(g9n3(x / 26 + 100, y / 15, z / 26 - 50));
  }
  tri = (A, x, y, z) => {`;
html = replaceOnce(html, latticeOld, latticeNew, 'lattice assign');


/* Close the extra z-loop / x-loop and throw between columns.
   The unique end of this column loop (cavern fill, then ores comment). */
const loopEnd = `      if (!window.__g12 && (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8))) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;
    }
  }
  // ores: veins by depth (rarity per 1000 columns)`;

const loopEndNew = `      if (!window.__g12 && (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8))) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;
    }
    }
    if (__L && __L.held && (performance.now() - __tSlice > 200)) {
      __L.genX = x + 1;
      try { __L.touch(6 + 58 * (x + 1) / Math.max(1, W), 'Raising the mountains… ' + (x + 1) + '/' + W, 70); } catch (_) {}
      throw __L.YIELD;
    }
  }
  if (__L && __L.held) { __L.genX = 0; __L._g9 = null; try { __L.touch(66, 'Carving the glens…', 90); } catch (_) {} }
  // ores: veins by depth (rarity per 1000 columns)`;

html = replaceOnce(html, loopEnd, loopEndNew, 'gen loop end');

/* 2) New survival worlds: don't call generate() before the loading screen can paint.
      Await the sliced generate instead. Make this wrapper async. */
const ewOld = `  enterWorld = function (save) {
    const needs = !c1Want && ((!save && current.mode === 'creative') || (save && save.gen === GEN10 && !isGold(current)));
    if (!save && current.mode !== 'creative') { const nw = g9Island ? ISL_W : 320; NEW_W = nw; setWorldSize(nw); gSeed = 0; generate(); dirtyAll = true; g9spawn = null; }`;

const ewNew = `  enterWorld = async function (save) {
    const needs = !c1Want && ((!save && current.mode === 'creative') || (save && save.gen === GEN10 && !isGold(current)));
    if (!save && current.mode !== 'creative') { const nw = g9Island ? ISL_W : 320; NEW_W = nw; setWorldSize(nw); gSeed = 0; if (window.__glenLoad && __glenLoad.generate) { try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {} await __glenLoad.boot('Raising the mountains…'); await __glenLoad.generate(); } else generate(); dirtyAll = true; g9spawn = null; }`;

html = replaceOnce(html, ewOld, ewNew, 'enterWorld generate defer');

/* 3) flGen finally must not wipe flow maps mid-yield. */
const flOld = `generate = function () { flGen = true; try { return ge.apply(this, arguments); } finally { flGen = false; FLV.clear(); FLQ.clear(); } };`;
const flNew = `generate = function () { flGen = true; try { return ge.apply(this, arguments); } finally { if (!(window.__glenLoad && __glenLoad.held)) { flGen = false; FLV.clear(); FLQ.clear(); } } };`;
html = replaceOnce(html, flOld, flNew, 'flGen finally');

/* 4) Original loading lerp feeds the shared meter and does not reset a bar that is already filling. */
const shownOld = `  let i = 0, shown = 0, target = 0, t0 = performance.now(), ready = false;`;
const shownNew = `  let i = 0, shown = (window.__glenLoad && __glenLoad.shown) || 0, target = Math.max(shown, (window.__glenLoad && __glenLoad.real) || 0), t0 = performance.now(), ready = false;`;
html = replaceOnce(html, shownOld, shownNew, 'shown init');

const animOld = `  const anim = () => { shown += (target - shown) * 0.12; bar.style.width = shown.toFixed(1) + '%'; if (pct) pct.textContent = Math.round(shown) + '%'; if (screen === 'loading') requestAnimationFrame(anim); };
  requestAnimationFrame(anim);`;
const animNew = `  const anim = () => {
    if (window.__glenLoad && __glenLoad.live) {
      try { __glenLoad.setReal(Math.max(target, __glenLoad.real || 0), tip && tip.textContent, ready ? 100 : 99); if (ready) __glenLoad.finish(); } catch (_) {}
      if (screen === 'loading') requestAnimationFrame(anim);
      return;
    }
    shown += (target - shown) * 0.12; if (shown > target) shown = target; bar.style.width = shown.toFixed(1) + '%'; if (pct) pct.textContent = Math.round(shown) + '%'; if (screen === 'loading') requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);`;
html = replaceOnce(html, animOld, animNew, 'anim hook');

const readyOld = "    if (ready && shown > 98.5) {";
const readyNew = "    if (ready && (shown > 98.5 || (window.__glenLoad && (__glenLoad.shown > 98.5 || __glenLoad.done)))) {";
html = replaceOnce(html, readyOld, readyNew, 'ready uses shared meter');


/* 4b) The 20s "full rebuild" used rebuild() with no budget and stalled the meter.
      Also: do not dirtyAll (that disposes already-meshed spawn chunks). */
const rbOld = "console.error('load: land still not built after 20 s - full rebuild'); try { dirtyAll = true; rebuild(); }";
const rbNew = "console.error('load: land still not built after 20 s - full rebuild'); try { rebuild(150); }";
html = replaceOnce(html, rbOld, rbNew, 'bounded 20s rebuild');

/* 4c) While loading, mesh R=2 so the floor(P/CH)±1 ring chunksReady tests is
      fully covered. Stream rebuild uses P/CH-0.5, so R=1 misses the far side
      and the loader sits at 4/9 until the 45s give-up. LOAD_R stays 1 (9 chunks). */
const srOld = "try { if (!started || (typeof screen !== 'undefined' && screen === 'loading')) { const lr = (window.__loadChunkR != null ? window.__loadChunkR : 1); if (_sr > lr) _sr = lr; } } catch (_) {}";
const srNew = "try { if (!started || (typeof screen !== 'undefined' && screen === 'loading')) { const lr = (window.__loadChunkR != null ? window.__loadChunkR : 1); const meshR = Math.max(lr, 2); if (_sr > meshR) _sr = meshR; } } catch (_) {}";
html = replaceOnce(html, srOld, srNew, 'load mesh ring R=2');

/* 5) Liquid markup (firstChild stays the fill so existing width writes still work). */
html = replaceOnce(
  html,
  '    <div class="bootbar" id="loadW"><i></i></div>',
  '    <div class="bootbar liquid1285" id="loadW"><i class="load-fill"><b class="load-wave" aria-hidden="true"></b></i></div>',
  'loadW markup'
);

/* 6) Append the runtime once, before the closing script. */
if (!html.includes('/* GLX-LOAD1285')) {
  const needle = '\n</script>\n</body>\n</html>';
  must(html.endsWith(needle) || html.slice(-needle.length) === needle || html.includes(needle), 'closing script found');
  const idx = html.lastIndexOf('\n</script>\n</body>\n</html>');
  must(idx > 0, 'closing script index');
  html = html.slice(0, idx) + '\n' + src + '\n' + html.slice(idx);
}

if (!html.includes('<!-- glencraft-build: load1285 -->')) {
  must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), 'b1284 marker missing');
  html = replaceOnce(
    html,
    '<!-- glencraft-build: b1284-v1.2.84 -->',
    '<!-- glencraft-build: b1284-v1.2.84 -->\n<!-- glencraft-build: load1285 -->',
    'load1285 marker'
  );
}

/* Safety: no version bump, no 1.2.85 patch notes. */
must(html.includes("const GAME_VERSION = '1.2.84';"), 'version still 1.2.84');
must(!html.includes('"v":"v1.2.85"'), 'no 1.2.85 patch notes');
must(html.includes('/* GLX-LOAD1285'), 'runtime present');
must(html.includes('__glenLoad.generate'), 'deferred generate present');
must(html.includes('throw __L.YIELD'), 'column yield present');
must(html.includes('liquid1285'), 'liquid markup present');
must((html.split('/* GLX-LOAD1285').length - 1) === 1, 'one LOAD1285 block');

const vj = fs.readFileSync(path.join(root, 'version.json'), 'utf8');
must(JSON.parse(vj).v === '1.2.84', 'version.json stays 1.2.84');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('build load1285 ok, index bytes', html.length, 'version stays 1.2.84');
