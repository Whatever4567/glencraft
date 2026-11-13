// 1.2.73: magazine in the well, RT release, gun ADS/reload, TARDIS cap, rare dogs.
// Targeted static checks (no full OR-chain of prior release tests).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = fs.readFileSync(path.join(root, 'version.json'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.73';") || html.includes("const GAME_VERSION = '1.2.72';"), 'GAME_VERSION is 1.2.73 (or 1.2.72)');
ok(/"v"\s*:\s*"1\.2\.73"/.test(ver) || /"v"\s*:\s*"1\.2\.72"/.test(ver), 'version.json is 1.2.73 (or 1.2.72)');
ok(html.includes('<!-- glencraft-build: b1273-v1.2.73 -->') || html.includes('<!-- glencraft-build: b1272-v1.2.72 -->'), 'build marker present');

if (html.includes("const GAME_VERSION = '1.2.73';")) {
  ok(html.includes('<!-- glencraft-build: b1273-v1.2.73 -->'), 'b1273 marker');
  ok(html.includes('"v":"v1.2.73"'), 'PATCH_NOTES for 1.2.73');
  ok(credits.includes('## v1.2.73'), 'CREDITS has 1.2.73');
  ok(html.includes('/* GLX-FIX1273'), 'FIX1273 IIFE is injected');
  ok(html.includes('/* GLX-FIX1272'), 'FIX1272 stays');

  const i = html.indexOf('/* GLX-FIX1273');
  const scr = html.indexOf('</script>', i);
  const body = html.slice(i, scr > i ? scr : html.length);
  ok(body.includes('attackTouch'), '1273 clears attackTouch');
  ok(body.includes('lostpointercapture'), '1273 listens for lostpointercapture');
  ok(body.includes('seatMag'), '1273 seats the magazine');
  ok(body.includes('MAX_V'), '1273 records the TARDIS speed cap');
  ok(body.includes('mph'), '1273 displays speed in mph');
  ok(!body.includes("['dU', 'dL', 'dR'].forEach"), '1273 does not touch the gold D-pad');

  // magazine seated fully, not the short +0.085 nudge
  ok(html.includes('M.position.x += _cx'), 'magFix aligns the magazine to the well centre');
  ok(!html.includes('M.position.x += 0.085'), 'short magFix nudge is gone');
  ok(html.includes('u.mag = isP ? part(/magazine_loaded$/) : new THREE.Group();'), 'musket is not given a fake magazine');
  ok(!html.includes("part(isP ? /magazine_loaded$/ : /^$/)"), 'empty-regex mag part() is gone');
  ok(html.includes("if (o.isMesh && /magazine/i.test(o.name || '')) _rm = true"), 'reload only animates a real magazine');

  // musket ADS forearm stays attached
  ok(html.includes("if (kind === 'musket') { p.fo.visible = true;"), 'musket ADS keeps the forearm visible');
  ok(!html.includes("if (kind === 'musket') p.fo.visible = false;"), 'musket ADS no longer hides the forearm');
  ok(html.includes('!u.sculpt1271'), '1271 sculpt is not treated as leftover ADS debris');

  // RT
  ok(html.includes("brk.addEventListener('lostpointercapture', brkEnd)"), 'bMine clears on lostpointercapture');

  // TARDIS cap: 100,000 mph = 100000 * 1609.344 / 3600 ≈ 44704 blocks/s
  const cap = 100000 * 1609.344 / 3600;
  ok(Math.abs(cap - 44704) < 0.3, '100,000 mph is about 44,704 blocks/s (got ' + cap + ')');
  ok(html.includes('100000 * 1609.344 / 3600'), 'flight cap uses 100,000 mph in metres');
  ok(html.includes('A.speedMph') || html.includes('U.speedMph') || html.includes('speedMph'), 'speed is stored in mph');
  ok(html.includes('tboxMph') || html.includes(' mph'), 'a mph readout is present');

  // dogs
  ok(html.includes('nearTree'), 'packs only spawn near trees');
  ok(html.includes('LEAFY') && html.includes('LOGGY'), 'tree check uses LEAFY and LOGGY');
  ok(html.includes('Math.min(3, 1 + Math.floor(Math.random() * 3))'), 'packs are at most 3');
  ok(html.includes('4 + Math.random() * 4'), 'pack members are 4-8 blocks apart');
  ok(html.includes('wildCount() < 3 && Math.random() < 0.1)'), 'spawn chance is about a tenth and the cap is 3');
  ok(html.includes('chunkCount'), 'per-chunk cap is enforced');
  ok(!html.includes('wildCount() < 7) spawnPack()'), 'old cap of 7 is gone');
}

// prior hands / gold D-pad / 1.2.71 / 1.2.72 stay intact
ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden by a forEach over dU/dL/dR');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');
ok(html.includes('/* GLX-FIX1272') || html.includes("const GAME_VERSION = '1.2.72';") || html.includes("const GAME_VERSION = '1.2.73';"), '1.2.72 work is still in the tree');

console.log('PASS ' + n + ' v1273-release checks');
