// 1.2.50: Teleport to Pop Star button exists, and using it places the player
// within ~12 blocks of a popstar entity on solid ground (spawning her first
// if she is not already in the world).
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
ok(html.includes("const GAME_VERSION = '1.2.50';"), 'GAME_VERSION is 1.2.50');
ok(html.includes('<!-- glencraft-build: b1250-held-popstar -->'), '1.2.50 ship marker is present');

// Sandbox: flat solid world, stub popstar mesh, real teleportTo.
const toasts = [];
const added = [];
const core = {
  HEIGHT: 32, STRIDE: 11, LOOP: 30.72, BPM: 93.75, BEAT: 0.64, SONG_OGG: '', SONG_MP3: '',
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
ok(dist > 0.5 && dist <= 12, 'player is within 12 blocks of the popstar (dist=' + dist.toFixed(2) + ')');
ok(U.standOk(ctx.P.x, ctx.P.y, ctx.P.z), 'player is on solid ground with two clear blocks to stand in');
ok(ctx.P.y === 10, 'player feet sit on the solid surface (y=10)');
// Facing her: the look vector should point toward her.
const lookX = -Math.sin(ctx.P.yaw), lookZ = -Math.cos(ctx.P.yaw);
const toX = pos.x - ctx.P.x, toZ = pos.z - ctx.P.z;
const toLen = Math.hypot(toX, toZ) || 1;
const facing = (lookX * toX + lookZ * toZ) / toLen;
ok(facing > 0.95, 'player is facing the pop star (dot=' + facing.toFixed(3) + ')');
ok(toasts.some(t => /Teleported to the pop star/i.test(t)), 'toast confirms the teleport');
ok(Math.hypot(ctx.P.x - before.x, ctx.P.z - before.z) > 5, 'player actually moved from the start position');

// Second press: she already exists, do not spawn another, still land within 12.
const spawned = U.spawned;
const ok2 = U.teleportTo();
ok(ok2 === true && U.spawned === spawned, 'a second teleport does not spawn a second pop star');
const dist2 = Math.hypot(ctx.P.x - U.alive().g.position.x, ctx.P.z - U.alive().g.position.z);
ok(dist2 <= 12 && U.standOk(ctx.P.x, ctx.P.y, ctx.P.z), 'second teleport still lands within 12 blocks on solid ground');

// Other realm: refuse.
ctx.DIM.cur = 'hell';
const ok3 = U.teleportTo();
ok(ok3 === false && U.tp.last === 'dim', 'teleport is refused in another realm');
ctx.DIM.cur = null;

console.log('v1251-popstar-teleport ok', n);
