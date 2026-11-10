// 1.2.57: teleport to the pop star always yields a present, visible actor.
// She is exempt from mob caps, animal despawn, noMobs sweep, and chunk gating
// (retries until land is ready). Repeated teleports must all succeed.
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
const v127 = fs.readFileSync(path.join(root, 'tools/content-source/content-127.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(runSrc.includes('U.forcePresent') && runSrc.includes('U.meshOk') && runSrc.includes('U.protect'),
  'runtime can force-spawn and protect a present actor');
ok(runSrc.includes('pendingTp') && runSrc.includes("R.last = 'pending'"),
  'teleport retries when the chunk is not ready');
ok(runSrc.includes('a.kind === \'popstar\'') && runSrc.includes('U.protected'),
  'removeMob refuses to delete her');
ok(v127.includes("a.kind === 'popstar'") && v127.includes('continue'),
  'noMobs sweep skips the pop star');
ok(!/aLive\.life > C\.LIFE/.test(runSrc) && !/daylight < 0\.35/.test(runSrc),
  'night and life-timer auto-despawn are gone');
ok(html.includes('U.forcePresent') && html.includes('U.protect') && html.includes("R.last = 'pending'"),
  'index.html bake includes the always-present teleport');

function vec(x, y, z) {
  return {x, y, z, set(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; return this; }};
}
const dummyGroup = () => ({
  position: vec(0, 0, 0),
  rotation: Object.assign(vec(0, 0, 0), {y: 0}),
  visible: true,
  frustumCulled: false,
  parent: null,
  traverse() {},
  add() {}
});

function makeWorld(opts) {
  const landReady = opts && 'landReady' in opts ? opts.landReady : true;
  const scene = { add(g) { g.parent = scene; }, remove(g) { if (g.parent === scene) g.parent = null; } };
  const T = {WATER: 8, LAVA: 9, STILL_WATER: 10};
  const getB = (x, y, z) => (landReady && y < 10) ? 1 : 0;
  const solid = (x, y, z) => getB(x, y, z) !== 0;
  const removed = [];
  function removeMob(a) { removed.push(a); const i = ctx.mobs.indexOf(a); if (i >= 0) ctx.mobs.splice(i, 1); if (a.g) scene.remove(a.g); return a; }
  const ctx = {
    console, Math, performance: {now: () => 1000}, Object, Array, Error,
    setInterval() { return 0; }, clearInterval() {}, setTimeout() { return 0; }, clearTimeout() {},
    location: {search: ''},
    THREE: {DoubleSide: 2, Sphere: function () {}, Vector3: function () {}, PointLight: function () {}},
    scene, camera: {position: vec(20, 12, 20), near: 0.05, updateProjectionMatrix() {}},
    P: {x: 20, y: 11, z: 20, yaw: 0, vy: 0},
    AC: null, SET: {sfx: 0, music: 0, noMobs: !!(opts && opts.noMobs)},
    started: true, paused: false, daylight: (opts && opts.daylight) != null ? opts.daylight : 1,
    dayNum: 3, caveK: 0, DIM: {cur: 0}, W: 200, D: 200, H: 90, T,
    getB, solid, mobs: [], LEAFY: {}, PLANT: {},
    updatePlayer() {}, updateMobs() {}, placeCamera() {}, onDawn() {}, initAudio() {}, enterWorld() {}, damageMob(a){return a;}, hurt() {}, collides(){return false;},
    toast() {}, burst() {}, removeMob,
    window: null, globalThis: null, landReady
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.__v127 = {sweep() { let n = 0; for (const a of ctx.mobs.slice()) { if (a && a.kind === 'popstar') continue; try { removeMob(a); n++; } catch (_) {} } return n; }};
  vm.createContext(ctx);
  vm.runInContext(coreSrc, ctx);
  const C = ctx.__popstarCore;
  C.make = function () { return {g: dummyGroup(), mats: [], parts: {}}; };
  C.applyPose = function () {};
  C.dressVisible = function (parts) {
    if (parts && parts.g) { parts.g.visible = true; parts.g.frustumCulled = false; }
    return parts;
  };
  vm.runInContext(runSrc, ctx);
  ctx.__removed = removed;
  return ctx;
}

function present(U, rec) {
  return !!(U && U.present === 1 && U.alive() && rec && rec.g && rec.g.visible !== false && U.meshOk(rec));
}

// Repeated teleports: always a present, visible actor.
const times = 8;
for (let i = 0; i < times; i++) {
  const ctx = makeWorld();
  const U = ctx.__v1251;
  const okTp = U.teleportTo();
  const rec = U.alive();
  ok(okTp === true || okTp === 'pending' || (U.tp && U.tp.last === 'ok'),
    'teleport #' + (i + 1) + ' returns ok/pending');
  ok(present(U, rec), 'teleport #' + (i + 1) + ' leaves a present, visible pop star');
  ok(rec.g.parent === ctx.scene, 'teleport #' + (i + 1) + ' has her in the scene');
}

// noMobs sweep + removeMob must not delete her.
{
  const ctx = makeWorld({noMobs: true});
  const U = ctx.__v1251;
  U.teleportTo();
  const rec = U.alive();
  ctx.removeMob(rec);
  ok(U.alive() === rec && rec.g.parent === ctx.scene && U.protected > 0,
    'removeMob is a no-op and she stays in the scene');
  ctx.mobs.push(rec);
  ctx.__v127.sweep();
  ok(U.alive() === rec && U.meshOk(rec), 'noMobs sweep leaves her present');
}

// Night must not auto-despawn her after teleport.
{
  const ctx = makeWorld({daylight: 0.1});
  const U = ctx.__v1251;
  U.teleportTo();
  U.tick(1);
  U.tick(130);
  ok(U.present === 1 && U.alive(), 'she stays present at night and past the old 120 s life');
}

// Chunk not ready: teleport is pending, then a later flush spawns her.
{
  const ctx = makeWorld({landReady: false});
  const U = ctx.__v1251;
  const r = U.teleportTo();
  ok(r === 'pending' && !U.alive(), 'teleport is pending while the land chunk is unloaded');
  // land becomes ready
  const getB = (x, y, z) => y < 10 ? 1 : 0;
  ctx.getB = getB;
  ctx.solid = (x, y, z) => getB(x, y, z) !== 0;
  U.flushPending();
  ok(present(U, U.alive()), 'once the chunk is ready she is force-spawned and visible');
}

console.log('v1257-popstar-teleport-present ok', n);
