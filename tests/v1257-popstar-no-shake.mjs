// 1.2.57: the giant singer must not shake the camera or the ground
// while she walks or sings near the player. Footstep thuds may still play.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const coreSrc = fs.readFileSync(path.join(root, 'tools/popstar-source/popstar-core.js'), 'utf8');
const runSrc = fs.readFileSync(path.join(root, 'tools/content-source/v1251-popstar.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(runSrc.includes('function thud') && runSrc.includes('U.thuds++'),
  'footstep thud audio is still present');
ok(runSrc.includes('// 1.2.57: the giant singer must not shake the camera or the ground'),
  'applyShake is explicitly disabled for 1.2.57');
ok(!/shake\s*=\s*Math\.max\(\s*shake/.test(runSrc),
  'runtime never arms a shake amount from her footsteps');
ok(!/camera\.position\.[xyz]\s*\+=/.test(runSrc),
  'runtime never jitters camera.position from her shake');
ok(!/U\.shakes\+\+/.test(runSrc),
  'runtime does not count a camera shake from her');
ok(html.includes('// 1.2.57: the giant singer must not shake the camera or the ground')
  && !/shake\s*=\s*Math\.max\(\s*shake/.test(html.slice(html.indexOf('/* GLX-V1251-START */'), html.indexOf('/* GLX-V1251-END */') + 1)),
  'index.html bake has the no-shake pop-star runtime');
ok(runSrc.includes('U.MAX_STEP') && runSrc.includes('isRoofOrStructure') && runSrc.includes('U.pushPlayerOut')
  && coreSrc.includes('P.STRIDE = 3') && coreSrc.includes('P.MAX_STEP = 1'),
  'earlier pathing fixes stay: 1-block step, slow 3-block stride, roofs skipped, visible keep-out');

// ---- sandbox: she walks and sings right next to the player ----
function vec(x, y, z) {
  return {
    x, y, z,
    set(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; return this; }
  };
}
const dummyGroup = () => ({
  position: vec(0, 0, 0),
  rotation: Object.assign(vec(0, 0, 0), { y: 0 }),
  visible: true,
  frustumCulled: false,
  parent: null,
  traverse() {}
});

let acTime = 10;
const acParam = (v = 0) => ({
  value: v,
  setValueAtTime() {},
  setTargetAtTime() {},
  exponentialRampToValueAtTime() {}
});
const AC = {
  get currentTime() { return acTime; },
  destination: {},
  createGain() { return { gain: acParam(0.0001), connect() {}, disconnect() {} }; },
  createOscillator() { return { type: 'sine', frequency: acParam(48), connect() {}, start() {}, stop() {} }; },
  createBiquadFilter() { return { type: 'lowpass', frequency: acParam(180), connect() {} }; },
  createPanner() {
    return {
      panningModel: 'equalpower', distanceModel: 'inverse',
      refDistance: 16, maxDistance: 160, rolloffFactor: 0.9,
      positionX: acParam(0), positionY: acParam(0), positionZ: acParam(0),
      connect() {}
    };
  },
  createBufferSource() {
    return { buffer: null, loop: false, loopStart: 0, loopEnd: 0, connect() {}, start() {}, stop() {} };
  },
  listener: { positionX: acParam(0), positionY: acParam(0), positionZ: acParam(0) }
};

const camera = { position: vec(20, 12.6, 22) };
const cam0 = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
const scene = { add() {}, remove() {} };
const P = { x: 20, y: 11.6, z: 22, yaw: 0, vy: 0 };
const T = { WATER: 8, LAVA: 9, STILL_WATER: 10 };
function getB(x, y, z) { return y < 10 ? 1 : 0; }
function solid(x, y, z) { return getB(x, y, z) !== 0; }

const ctx = {
  console, Math, performance, Object, Array, Set, Map, Number, String, Boolean,
  JSON, Error, TypeError, parseInt, parseFloat, isNaN, isFinite, undefined,
  setInterval() { return 0; }, clearInterval() {},
  setTimeout() { return 0; }, clearTimeout() {},
  location: { search: '' },
  THREE: {}, scene, camera, P, AC, SET: { sfx: 0.8, music: 0.8 },
  master: AC.destination, started: true, paused: false, daylight: 1,
  dayNum: 3, caveK: 0, DIM: { cur: 0 }, W: 200, D: 200, H: 90, T,
  getB, solid, mobs: [], LEAFY: {}, PLANT: {},
  updatePlayer() {}, updateMobs() {}, placeCamera() {}, onDawn() {}, initAudio() {}, enterWorld() {}, damageMob(a){return a;}, hurt() {}, removeMob() {}, collides(){return false;},
  toast() {}, burst() {},
  window: null, globalThis: null
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(coreSrc, ctx);
const C = ctx.__popstarCore;
C.make = function () { return { g: dummyGroup(), mats: [], parts: {} }; };
C.applyPose = function () {};
C.dressVisible = function () {};
vm.runInContext(runSrc, ctx);

const U = ctx.__v1251;
ok(U && typeof U.spawnAt === 'function' && typeof U.tick === 'function',
  'runtime exports spawnAt and tick');

// Song already buffered so spawn starts her singing immediately.
U.songBuf = { duration: C.LOOP };
const rec = U.spawnAt(24, 10, 26, 0);
ok(rec && U.present === 1 && U.alive(), 'she spawned on dry land next to the player');
ok(U.songOn === 1 && U.alive().tSong != null, 'her song is on when she spawns with a buffer');

const dist = Math.hypot(rec.pathX - P.x, rec.pathZ - P.z);
ok(dist < 16, 'player is nearby (dist ' + dist.toFixed(2) + ')');

// Walk + sing for well over a pose cycle / several strides, calling the
// placeCamera hook that used to apply shake after every frame.
const dt = 1 / 30;
let steps = 0;
const lastStep0 = rec.lastStep;
for (let i = 0; i < 30 * 40; i++) { // 40 seconds
  acTime += dt;
  U.tick(dt);
  ctx.placeCamera();
  if (U.alive() && U.alive().lastStep !== lastStep0) steps = (U.alive().lastStep + 1);
}
ok(U.present === 1 && U.alive(), 'she is still present after walking and singing nearby');
ok(U.songOn === 1, 'she is still singing');
ok((U.alive().lastStep | 0) >= 8, 'several footsteps planted (lastStep=' + U.alive().lastStep + ')');
ok(U.shakes === 0, 'shake counter stays at 0 (got ' + U.shakes + ')');
ok(camera.position.x === cam0.x && camera.position.y === cam0.y && camera.position.z === cam0.z,
  'camera is unmoved after walk+sing+placeCamera (now '
  + camera.position.x + ',' + camera.position.y + ',' + camera.position.z + ')');
ok(!U.err, 'runtime recorded no error (' + U.err + ')');

console.log('v1257-popstar-no-shake ok', n);
