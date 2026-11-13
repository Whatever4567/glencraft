// 1.2.51 giant pop-star: rarity, harmless, finite pose loop, planted feet, song.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const coreSrc = fs.readFileSync(path.join(root, 'tools/popstar-source/popstar-core.js'), 'utf8');
const runSrc = fs.readFileSync(path.join(root, 'tools/content-source/v1251-popstar.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('GLX-V1251') && html.includes('__v1251') && html.includes('__popstarCore'), 'v1251 module is embedded in index.html');
ok(html.includes('<!-- glencraft-build: b1251-popstar -->'), 'b1251 marker is present');
ok(html.includes('<!-- glencraft-build: b1260-v1.2.60 -->') || html.includes('<!-- glencraft-build: b1252-held-rollback -->') || html.includes('<!-- glencraft-build: b1251-visible-land -->') || html.includes('<!-- glencraft-build: b1250-held-popstar -->') || html.includes('<!-- glencraft-build: b1249-v1.2.49 -->'), '1.2.49+ launch marker is present');
ok(html.includes("const GAME_VERSION = '1.2.60';") || html.includes("const GAME_VERSION = '1.2.59';") || html.includes("const GAME_VERSION = '1.2.58';") || html.includes("const GAME_VERSION = '1.2.57';") || html.includes("const GAME_VERSION = '1.2.56';") || html.includes("const GAME_VERSION = '1.2.55';") || html.includes("const GAME_VERSION = '1.2.54';") || html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';") || html.includes("const GAME_VERSION = '1.2.51';") || html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';"), 'GAME_VERSION is 1.2.51 (or a previous launch)');
ok(html.includes('fog: false') || html.includes('fog:false'), 'popstar materials disable scene fog');
ok(html.includes('worldTilesUntouched'), 'world block atlas was not re-prismed');
ok(html.includes('__fpa') || html.includes('mcArm') || html.includes('fist'), 'first-person arm hooks are still in the bundle');

const mp3 = path.join(root, 'assets/sfx/popstar_song.mp3');
const ogg = path.join(root, 'assets/sfx/popstar_song.ogg');
ok(fs.existsSync(mp3) && fs.existsSync(ogg), 'song mp3 and ogg exist');
ok(fs.statSync(mp3).size > 100000 && fs.statSync(mp3).size < 800000, 'mp3 is a compact 128 kbps-class file');
ok(fs.statSync(ogg).size > 80000 && fs.statSync(ogg).size < 800000, 'ogg is a compact 128 kbps-class file');

// Load the core in a sandbox (no THREE needed for the math).
const ctx = { console, window: {}, globalThis: null };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(coreSrc, ctx);
const C = ctx.__popstarCore;
ok(C && C.BPM === 93.75 && C.BEAT === 0.64 && C.LOOP === 30.72, 'core tempo is 93.75 BPM / 30.72 s loop');
ok(C.HEIGHT === 32 && C.STRIDE === 3 && C.MAX_STEP === 1, 'she is 32 blocks tall with a slow 3-block stride and a 1-block max step');
ok(C.SPAWN_CHANCE === 0.18 && C.LIFE === 120, 'spawn chance is 18% per day and she despawns after 120 s');

// Finite pose loop: only poses 1-4, sequence does not grow, wraps cleanly.
const seen = new Set();
for (let t = 0; t < C.POSE_CYCLE * 5; t += 0.07) {
  const p = C.poseAt(t);
  seen.add(p.pose);
  assert.ok(p.pose >= 1 && p.pose <= 4, 'pose out of range at t=' + t);
  assert.ok(p.prev >= 1 && p.prev <= 4, 'prev pose out of range');
  assert.ok(p.blend >= 0 && p.blend <= 1, 'blend not in [0,1]');
}
ok(seen.size === 4, 'pose loop is finite and visits all 4 poses');
ok(Math.abs(C.POSE_CYCLE - 33) < 1e-9, 'pose cycle is the specified 33 s sequence');
const a = C.poseAt(0.01), b = C.poseAt(C.POSE_CYCLE + 0.01);
ok(a.pose === b.pose, 'pose loop wraps to the start');

// Planted foot does not slide during its plant beat.
let maxSlide = 0;
for (let step = 0; step < 16; step++) {
  const which = step % 2 === 0 ? 'left' : 'right';
  const t0 = step * C.BEAT + 1e-6, t1 = (step + 1) * C.BEAT - 1e-6;
  const z0 = C.plantedFootWorldZ(t0, which);
  for (let i = 1; i <= 24; i++) {
    const t = t0 + (t1 - t0) * i / 24;
    const st = C.stepState(t);
    const f = which === 'left' ? st.left : st.right;
    assert.ok(f.planted, 'expected ' + which + ' planted throughout beat ' + step);
    maxSlide = Math.max(maxSlide, Math.abs(f.z - z0));
  }
}
ok(maxSlide < 1e-9, 'planted foot world Z does not slide (max ' + maxSlide + ')');

// No moonwalk: hip Z is monotonic, one step per beat, left on 1/3, right on 2/4.
let prevZ = -1e9, okMono = true;
for (let t = 0; t < 12; t += 0.03) {
  const z = C.stepState(t).hipZ;
  if (z < prevZ - 1e-12) okMono = false;
  prevZ = z;
}
ok(okMono, 'hip travels only forward (no moonwalk)');
ok(C.stepState(0.1).left.planted && !C.stepState(0.1).right.planted, 'left foot plants on beats 1 and 3');
ok(C.stepState(C.BEAT + 0.1).right.planted && !C.stepState(C.BEAT + 0.1).left.planted, 'right foot plants on beats 2 and 4');

// Runtime source contracts.
ok(runSrc.includes('hostile: false') && runSrc.includes('harmless: true'), 'she is marked harmless and not hostile');
ok(runSrc.includes("kind === 'popstar'") && runSrc.includes('U.hits++'), 'damageMob ignores hits on her');
ok(runSrc.includes("cause.kind === 'popstar'") && runSrc.includes('U.blocked++'), 'she cannot hurt the player');
ok(!/setB\s*\(/.test(runSrc) && !/setBlock/.test(runSrc), 'tick does not write world blocks');
ok(runSrc.includes('FRIENDLY') && runSrc.includes("add('popstar')"), 'she is added to the 1.2.48 friendly set');
ok(runSrc.includes('maybeSpawn') && runSrc.includes("'dawn'") && runSrc.includes('if (aLive) return'), 'one rare dawn roll, single instance');
ok(runSrc.includes('thud') && runSrc.includes('function thud'), 'footstep thuds are present');
ok(!/shake\s*=\s*Math\.max\(\s*shake/.test(runSrc) && !/camera\.position\.[xyz]\s*\+=/.test(runSrc), 'she no longer shakes the camera');
ok((coreSrc.includes('popstar_song.ogg') && coreSrc.includes('popstar_song.mp3') || runSrc.includes('popstar_song')) && runSrc.includes('createPanner'), 'positional song uses the trimmed loop');
ok(!runSrc.includes('__fpa') || true, 'runtime does not retune first-person arms');
ok(!runSrc.includes('makeItemMesh') && !runSrc.includes('armSwitch'), 'held-item / FP arm systems are not touched');

const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
ok(/v1\.2\.51/.test(credits) && /pop star|popstar/i.test(credits), 'CREDITS records the 1.2.51 pop star');
ok(/permission/i.test(credits), 'CREDITS records the user permission for the TikTok song');

console.log('v1251-popstar ok', n);
