// 1.2.143: Quick Resume + official 2x spawn is not x 666 (t1398/t1401).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.145';") || html.includes("const GAME_VERSION = '1.2.146';") || html.includes("const GAME_VERSION = '1.2.147';") || html.includes("const GAME_VERSION = '1.2.148';") || html.includes("const GAME_VERSION = '1.2.149';") || html.includes("const GAME_VERSION = '1.2.150';") || html.includes("const GAME_VERSION = '1.2.144';"), 'GAME_VERSION is 1.2.145');
ok(html.includes('GLX-QR1398') && html.includes('GLX-SPAWN1401'), 'QR1398 / SPAWN1401 patches are present');
ok(html.includes('window.__noQR1398') && html.includes('window.__noSpawn1401'), 'restore flags are present');
ok(html.includes('const __qrBusy = () => !!(__L && (__L.held || (!window.__noQR1398 && __L._softHold)))'),
  'GEN9 yields also honour Quick Resume _softHold, behind the flag');
ok((html.split('if (__L && __L.held && (performance.now() - __tSlice > (__SLB()))) {').length - 1) === 0,
  'column-loop yield in GEN9 uses __qrBusy, old held-only check is gone');
ok(html.includes("if (!window.__noQR1398 && __L && __L._qrEarly && !__L._qrDisc && window.__qr1398 && typeof __qr1398.fillSpawnDisc === 'function')"),
  'GEN9 calls fillSpawnDisc on the early create path and keeps the full column loop');
ok(html.includes('function g9findSpawn()') && html.includes('retargetSpawn'),
  'original spawn finders are still in the file');
ok(html.includes('const EXPECT_MIN = 30000') && html.includes('U.gateHold = 1; U.gateUntil = performance.now() + 3000'),
  'old loader timers are still in the file (flag restores them)');

// Official 2x projection of Loch Ness east shore is x 666; the nudge must skip it.
const m = html.match(/const lat = 57\.31, lon = -4\.36;/);
ok(m, 'official spawn lat/lon is still 57.31, -4.36');
ok(html.includes('if (spOn() && x >= 664 && x <= 668) x = 680') || html.includes('if (x >= 664 && x <= 668) return false'),
  'x 664-668 is rejected or nudged to 680');

// Math check (same formula as the game).
const LAT0 = 57.45, LON0 = -3.75, K = 600, W = 1728, lat = 57.31, lon = -4.36;
const rawX = Math.round((W >> 1) + (lon - LON0) * K * Math.cos(lat * Math.PI / 180));
const rawZ = Math.round((W >> 1) + (LAT0 - lat) * K);
ok(rawX === 666, '2x projection of the official shore is x 666 (got ' + rawX + ')');
ok(rawZ === 948, '2x projection z is 948 (got ' + rawZ + ')');

ok((html.includes("qrIdbPut('meta', 'qr:' + s.id, s)") || html.includes("idbPut('meta', 'qr:' + s.id, s)")) && html.includes('isHot') && html.includes('warmEnter'),
  'IndexedDB last-position snapshot and warm in-memory resume are present');
ok(html.includes('deferBig') && html.includes('GLX-LOAD1285') && html.includes('GLX-V1308'),
  'existing loader and 2x highlands path are still present');
ok(!/pie|cake|bread|snack|jam|honey|dinner|lunch|breakfast/.test(
  (html.match(/GLX-QR1398[\s\S]{0,800}/) || [''])[0].toLowerCase()
), 'QR comment has no food words');

ok(html.includes('_qrAwaitEarly') && html.includes('GLs.sliceMs'),
  'enterWorld asks generate to hand off early; direct awaiters still wait for the full land');
ok(html.includes('GLs._softHold && !GLs.held') && html.includes('return 8') && html.includes('inRangeUnmeshed() > 0') && html.includes('return 2'),
  'background generate uses a short slice once the player is in, and yields further while visible chunks are unmeshed');
ok(html.includes('(!window.__noQR1398 && __Lk._softHold)') && html.includes('(!window.__noQR1398 && L._softHold)'),
  'post-generate keeps and pits also yield under _softHold');


ok(html.includes('afterWorldGrow') && html.includes('chunkColsReady') && html.includes('rebuild.__qr1398'),
  'visible chunks are remeshed after early enter and after the world grows');
ok(html.includes("markDirty(x, z)") && html.includes('__L._qrEarly && !__L.held && typeof markDirty'),
  'official columns markDirty after early enter so air-meshed chunks are rebuilt');

console.log('pass', n);
