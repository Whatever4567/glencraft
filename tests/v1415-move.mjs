// t1415 (v1.2.149): you can move as soon as you enter; the background land/cave/post chain yields real frames.
import fs from 'node:fs'; import path from 'node:path'; import assert from 'node:assert'; import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let n = 0; const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };
ok(html.includes('GLX-PY1415') && html.includes('window.__noPY1415'), 'PY1415 patch and its off flag are present');
ok(html.includes('if (!U.live && wantPlayYield1415()) return playYield1415();') && html.includes('if (!U.live) return Promise.resolve();'), 'after the loader stops, background yields wait for a frame (old microtask path kept behind the flag)');
ok(html.includes('U._inPosts1415 = 1;') && html.includes('U._inPosts1415 = 0;'), 'the deferred post chain marks itself running');
ok(html.includes('if (window.__noPY1415 || !GL._inPosts1415) GL._softHold = 0;'), 'Quick Resume does not end the soft phase while the post chain runs');
ok(html.includes('!bgGen1415() && elig()'), 'the Scotland reshape waits until background generation is finished');
ok(html.includes('function* scotG1415()') && html.includes('  function scot() {'), 'sliced reshape added, original scot() kept');
ok(html.includes('function* finishScaledSurfaceG1415()') && html.includes('  function finishScaledSurface() {') && html.includes('const r = yield* mcPaint(G, VK, HI);'), 'sliced surface paint added, original kept');
ok(html.includes("const GAME_VERSION = '1.2.149';") || /GAME_VERSION = '1\.2\.(1[5-9]\d|[2-9]\d\d)'/.test(html), 'GAME_VERSION is 1.2.149 or later');
ok(!/\b(pie|cake|bread|food|eat|meal|snack)\b/i.test(JSON.stringify((html.match(/\{"v":"v1\.2\.149"[^\n]*/) || [''])[0])), 'patch note has no food words');
ok(html.includes('GLX-PY1415b') && html.includes('const sl0 = scanLights;') && html.includes('function scanLights() {'), 'torch light scan is sliced in play, original scanLights kept');
ok(html.includes('U._keptPos1415 = 1;'), 'background land finishing does not teleport you back to spawn');
console.log('PASS ' + n);
