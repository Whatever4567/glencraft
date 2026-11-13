import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let n = 0;
function ok(cond, msg) {
  n++;
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

ok(ver.v === '1.2.74', 'version.json is 1.2.74');
ok(html.includes("const GAME_VERSION = '1.2.74';"), 'GAME_VERSION is 1.2.74');
ok(html.includes('<!-- glencraft-build: b1274-v1.2.74 -->'), 'build marker is present');
ok(html.includes('"v":"v1.2.74"'), 'PATCH_NOTES has 1.2.74');
ok(html.includes('no longer swing on their own'), 'patch notes mention tools sitting still');
ok(html.includes('working map again'), 'patch notes mention the working map');
ok(html.includes('tilted up and close'), 'patch notes mention the readable tilt');
ok(credits.includes('## v1.2.74'), 'CREDITS has 1.2.74');
ok(credits.includes('working map again'), 'CREDITS mentions the live map');

ok(html.includes('/* GLX-FIX1274'), 'FIX1274 IIFE is injected');
ok(html.includes('/* GLX-FIX1273'), 'FIX1273 stays');
ok(html.includes('/* GLX-FIX1272'), 'FIX1272 stays');

// seating freeze
ok(html.includes('errMax: 1.20, stable: 1},\n    pick:'), 'p761 is stable');
ok(html.includes('align: 0, errMax: 1.20, stable: 1},\n    p760:'), 'pick is stable');
ok(html.includes('p760:') && html.includes('errMax: 1.20, stable: 1}'), 'p760 is stable');
ok(html.includes('hang: 1, errMax: 1.20, stable: 1}'), 'bucket is stable');
ok(html.includes('torch:') && html.includes('stable: 1'), 'torch stays stable');

// blade lock
ok(html.includes('_bladeLock1274'), 'pick head lock is present');
ok(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook honours the lock');
ok(html.includes('function lockPickBlade'), 'lockPickBlade is in the IIFE');

// live map
ok(html.includes('function seatLiveMap'), 'seatLiveMap is present');
ok(html.includes('function poseSheet'), 'the sheet is posed toward the camera');
ok(html.includes('__c112'), 'C112 live chart is reused');
ok(html.includes('C.frame'), 'C112.frame is still ticked for live updates');
ok(html.includes('P.yaw'), 'player heading updates the marker');
ok(html.includes('getLiveSheet') || html.includes('_sheet1274'), 'the live plane is taken from C112');
ok(html.includes('towardCam'), 'the sheet is tilted toward the camera');
ok(html.includes('addScaledVector(camUp, 0.22)'), 'the sheet has a readable upward tilt');
ok(html.includes('addWorld(plane, parent, towardCam, 0.085)'), 'the sheet is brought closer');

// hands / D-pad / no popups
ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden by a forEach over dU/dL/dR');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');
{
  const i = html.indexOf('GLX-FIX1274');
  const j = html.indexOf('</script>', i);
  const body = html.slice(i, j);
  ok(!body.includes('alert('), '1274 does not alert');
  ok(!body.includes('__fpa =') && !body.includes('__fpa='), '1274 does not replace __fpa');
  ok(body.includes('gold D-pad is left alone'), '1274 records that the D-pad is left alone');
  ok(/First-person hands stay hidden in\s+third person/.test(body), '1274 records TP hands stay hidden');
}

console.log('PASS ' + n + ' v1274-release checks');
