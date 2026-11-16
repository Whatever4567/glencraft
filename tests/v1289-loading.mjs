// 1.2.89: slice remaining multi-second generate post-stages so the loading
// percentage can keep ticking. Version stays 1.2.88 (no release yet).
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/loading-1285.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.88';"), 'GAME_VERSION stays 1.2.88');
ok(!html.includes("const GAME_VERSION = '1.2.89';"), 'no 1.2.89 version bump');
ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.88', 'version.json stays 1.2.88');
ok(html.includes('<!-- glencraft-build: load1285 -->') && html.includes('<!-- glencraft-build: load1289 -->'), 'load1285 and load1289 markers');
ok(html.includes('/* GLX-LOAD1289 */'), 'LOAD1289 slice markers');
ok(html.includes('__Ld._loop.diamonds') && html.includes('throw __Ld.YIELD') && html.includes('__tD > (__SLB())'), 'diamondBoost yields on the adaptive slice and resumes with PRNG state');
ok(html.includes('__Lt._loop.torches') && html.includes('throw __Lt.YIELD') && html.includes('__tT > (__SLB())'), 'fixTorches yields on the adaptive slice and resumes by x');
ok(html.includes('__parkSettle') && html.includes("__prev.phase === 'att'"), 'c39Settle is resumable across structure and attachable phases');
ok(html.includes('__Lo._loop.c77') && html.includes("phase: 'strip'") && html.includes('__st.sd == null'), 'c77 orePass strip and veins are sliced; veins persist sd');
ok(html.includes('__Lo._loop.c104') && html.includes('__st.sd == null') && html.includes("phase: 'veins'"), 'c104 orePass veins are sliced and persist sd');
ok(html.includes('__Lc._loop.c104cave') && html.includes('throw __Lc.YIELD'), 'cavePass yields on the adaptive slice and resumes with sd');
ok(html.includes('held && window.__c77)) window.__c77 = null') && html.includes('try { window.__c77 = null; } catch (_) {}'), 'c104 keeps __c77 on a held resume; generate clears it once at start');
ok(html.includes('coop("c104caves"') || html.includes("coop('c104caves'"), 'cavePass is coop-wrapped');
ok((html.split('/* GLX-LOAD1285').length - 1) === 1, 'still one LOAD1285 runtime');
ok(src.includes('MessageChannel') && html.includes('performance.now() - __tSlice > (__SLB())'), 'existing MessageChannel yields use the adaptive slice budget');
ok(html.includes('_loop.c104') && html.includes("phase: 'strip'"), 'existing c104 strip slice stays');

// The original unsliced loop heads must not remain for these culprits.
ok(!/function diamondBoost\(seed\) \{\n  let h = seed \| 1;/.test(html), 'unsliced diamondBoost loop is gone');
ok(!/function fixTorches\(\) \{\n  let fixed = 0, removed = 0; const HD = H \* D;\n  for \(let x = 0; x < W; x\+\+\) for \(let y = 1/.test(html), 'unsliced fixTorches loop is gone');
ok(!/function cavePass\(p\) \{ const t0 = performance.now\(\); sd = \(gSeed \^ 0xca7e5\)/.test(html), 'unsliced cavePass loop is gone');
ok(!/function orePass\(\) \{\n    const t0 = performance.now\(\); sd = \(gSeed \^ 0x77a11e\)/.test(html), 'unsliced c77 orePass is gone');

ok(html.includes('veinJobs') && html.includes('__parkOres'), 'GEN9 ores and lochs are sliced');
ok(html.includes('__Lv._loop.silver') && html.includes('__Lh._loop.hives'), 'placeOreVeins and placeHives are sliced');
ok(html.includes("__Lk._loop.keeps") && html.includes('__L4._loop.c41') && html.includes('__Lf._loop.finishC'), 'castle placement, c41 and finishCastles are sliced');
ok(html.includes('__Cv._loop.carve'), 'carveCaves is sliced and persists sd');
ok(html.includes('Date.now() - __wT') && !html.includes('++__nT >= 4'), 'sliced column loops cap on wall-clock time, not a 4-column forced yield');
ok(!html.includes('++__nD >= 4') && !html.includes('++__nO >= 4') && !html.includes('++__nC >= 4') && !html.includes('__nS < 4'), 'no leftover 4-iteration forced yields');
ok(html.includes("_origRandom") && html.includes('_randGap = 1'), 'Math.random is isolated during generate yield gaps');
ok(html.includes("__parkSettle('struct', x, y + 1)") && html.includes("__parkSettle('att', x + 1, y)"), 'c39Settle can yield mid-column and mid-layer');
ok(html.includes('GLX-LOAD1289 timer gate') && html.includes('tick.__tgFree = 1') && html.includes('__tgate.flush()'), 'timer gate holds game timers during sliced generate');
ok(html.includes('const resume9 = function') && html.includes('__glenLoad._g12 = on'), 'GEN9 resume re-holds c37busy/__g12 wrapper flags');
ok(html.includes('U.gateHold = 1') && html.includes('L.gateHold && performance.now() < (L.gateUntil || 0)'), 'timer gate also holds for up to 3s before generate starts');
ok(src.includes('U.gateHold = 1') && src.includes('U.gateHold = 0') && src.includes('U.gateUntil = performance.now() + 3000'), 'loading source sets and clears the pre-generate gate');
ok(html.includes('U._postResume') && html.includes('if (!U._postResume) return outer.apply') && src.includes('U._postResume'), 'post-stages resume directly after a yield instead of re-entering generate wrappers');
ok(html.includes('new MessageChannel()') && src.includes('_mc.port2.postMessage'), 'yields use MessageChannel so the event loop gets a turn');
ok(html.includes('U.sliceMs') && html.includes('Math.min(400, b + 50)') && html.includes('Math.max(300, b - 25)') && html.includes('WIN.__SLB'), 'slice budget adapts between 300 and 400ms');

ok(html.includes('__Lb._loop.bcas') && html.includes('__resuming') && html.includes('__skip()'), 'buildCastle yields mid-flatten/box/fill and resumes by op and cursor');
ok(html.includes("if (window.__glenLoad && window.__glenLoad.isYield && window.__glenLoad.isYield(e)) throw e; console.warn('castle'"), 'buildCastle callers rethrow cooperative yields');
ok(html.includes('__Lp._loop.plant') && html.includes("phase === 'built'") && html.includes("phase === 'heather'") && html.includes('rs: rs, built: built, occ: occ'), 'plant() is sliced across built, trees, ground and heather and persists rs');
ok(html.includes("phase: 'scan'") && html.includes('__Lf._loop.finishC = {ci: ci, out: out, x: x + 1, removed: removed'), 'finishCastles yields mid-castle and resumes the column scan');

console.log('v1289-loading: ' + n + ' ok');
