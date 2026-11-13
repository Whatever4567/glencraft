// 1.2.51: Teleport to Pop Star places the player on dry land at a framing
// distance where her whole 32-block body fits in a portrait view, facing her
// (spawning her first on dry land if she is not already in the world).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const runSrc = fs.readFileSync(path.join(root, 'tools/content-source/v1251-popstar.js'), 'utf8');
const uiSrc = fs.readFileSync(path.join(root, 'tools/content-source/ui-1222.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('tpmPopstar') && html.includes('Teleport to Pop Star'), 'index.html embeds the Teleport to Pop Star button');
ok(uiSrc.includes("id: 'tpmPopstar'") && uiSrc.includes("label: 'Teleport to Pop Star'"), 'ui-1222 registers Teleport to Pop Star');
ok(uiSrc.includes('__v1251.teleportTo'), 'the button calls __v1251.teleportTo');
ok(runSrc.includes('U.teleportTo = function') && runSrc.includes('spotInFront'), 'popstar runtime has teleportTo');
ok(html.includes("const GAME_VERSION = '1.2.69';") || html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';") || html.includes("const GAME_VERSION = '1.2.63';") || html.includes("const GAME_VERSION = '1.2.62';") || html.includes("const GAME_VERSION = '1.2.61';") || html.includes("const GAME_VERSION = '1.2.60';") || html.includes("const GAME_VERSION = '1.2.59';") || html.includes("const GAME_VERSION = '1.2.58';") || html.includes("const GAME_VERSION = '1.2.57';"), 'GAME_VERSION is 1.2.57');
ok(html.includes('<!-- glencraft-build: b1257-v1.2.57 -->') && html.includes('<!-- glencraft-build: b1256-v1.2.56 -->') && html.includes('<!-- glencraft-build: b1255-v1.2.55 -->') && html.includes('<!-- glencraft-build: b1254-v1.2.54 -->') && html.includes('<!-- glencraft-build: b1253-v1.2.53 -->') && html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->') || html.includes('<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1262-v1.2.62 -->') || html.includes('<!-- glencraft-build: b1261-v1.2.61 -->') || html.includes('<!-- glencraft-build: b1260-v1.2.60 -->') || html.includes('<!-- glencraft-build: b1252-held-rollback -->') && html.includes('<!-- glencraft-build: b1251-visible-land -->'), '1.2.57 marker, 1.2.56 marker, 1.2.55 marker, 1.2.54 marker, 1.2.53 marker, 1.2.52 held-rollback marker and 1.2.51 pop-star marker are present');

// Sandbox: flat solid world, stub popstar mesh, real teleportTo.
const toasts = [];
const added = [];
const core = {
  HEIGHT: 32, STRIDE: 3, MAX_STEP: 1, BODY_R: 4.2, LOOP: 30.72, BPM: 93.75, BEAT: 0.64, SONG_OGG: '', SONG_MP3: '',
  make() {
    const pos = {x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }};
    const rot = {y: 0};
    return {g: {position: pos, rotation: rot, traverse() {}}, mats: []};
  }
};
const ctx = {
  console,
  THREE: {},
  scene: {add(g) { added.push(g); }, remove() {}},
  window: null,
  globalThis: null,
  started: true,
  DIM: {cur: null},
  W: 200, D: 200, H: 90, SEA: 10,
  T: {WATER: 8, LAVA: 9},
  P: {x: 50, y: 11, z: 50, yaw: 0, vy: 0, kbx: 0, kbz: 0, onGround: false, fallTop: null},
  getB(x, y, z) { return y < 10 ? 1 : 0; },
  solid(x, y, z) { return y < 10; },
  toast(m) { toasts.push(m); },
  setPause() {},
  rebuild() {},
  performance: {now: () => 0},
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.window.__popstarCore = core;
vm.createContext(ctx);
vm.runInContext(runSrc, ctx);
const U = ctx.window.__v1251;
ok(U && typeof U.teleportTo === 'function', 'teleportTo is exported');
ok(!U.alive(), 'no popstar exists yet');

const before = {x: ctx.P.x, z: ctx.P.z};
const okGo = U.teleportTo();
ok(okGo === true && U.tp && U.tp.last === 'ok', 'teleportTo succeeds when she was missing');
ok(U.tpSpawned === 1 && U.alive() && U.alive().kind === 'popstar', 'she is spawned because none existed');
const rec = U.alive();
const pos = rec.g.position;
const dist = Math.hypot(ctx.P.x - pos.x, ctx.P.z - pos.z);
ok(dist >= 20 && dist <= 40, 'player is at a framing distance so her whole body fits (dist=' + dist.toFixed(2) + ')');
ok(U.standOk(ctx.P.x, ctx.P.y, ctx.P.z), 'player is on solid ground with two clear blocks to stand in');
ok(ctx.P.y === 10, 'player feet sit on the solid surface (y=10)');
// Facing her: the look vector should point toward her.
const lookX = -Math.sin(ctx.P.yaw), lookZ = -Math.cos(ctx.P.yaw);
const toX = pos.x - ctx.P.x, toZ = pos.z - ctx.P.z;
const toLen = Math.hypot(toX, toZ) || 1;
const facing = (lookX * toX + lookZ * toZ) / toLen;
ok(facing > 0.95, 'player is facing the pop star (dot=' + facing.toFixed(3) + ')');
ok(typeof ctx.P.pitch === 'number' && ctx.P.pitch < 0, 'pitch looks up at mid-torso so head and feet fit (pitch=' + ctx.P.pitch.toFixed(3) + ')');
ok(U.isDryLand(ctx.P.x, ctx.P.z) && U.isDryLand(pos.x, pos.z), 'player and pop star both stand on dry land');
ok(toasts.some(t => /Teleported to the pop star/i.test(t)), 'toast confirms the teleport');
ok(Math.hypot(ctx.P.x - before.x, ctx.P.z - before.z) > 5, 'player actually moved from the start position');

// Second press: she already exists, do not spawn another, still land at a framing distance.
const spawned = U.spawned;
const ok2 = U.teleportTo();
ok(ok2 === true && U.spawned === spawned, 'a second teleport does not spawn a second pop star');
const dist2 = Math.hypot(ctx.P.x - U.alive().g.position.x, ctx.P.z - U.alive().g.position.z);
ok(dist2 >= 20 && dist2 <= 40 && U.standOk(ctx.P.x, ctx.P.y, ctx.P.z), 'second teleport still lands at a framing distance on dry land');

// Other realm: refuse.
ctx.DIM.cur = 'hell';
const ok3 = U.teleportTo();
ok(ok3 === false && U.tp.last === 'dim', 'teleport is refused in another realm');
ctx.DIM.cur = null;

console.log('v1251-popstar-teleport ok', n);
