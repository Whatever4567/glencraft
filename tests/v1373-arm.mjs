import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/arm-1373.js'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-ARM1373') && src.includes('(function arm1373'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function arm1373').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-arm1373"'), 'script id');
ok(src.includes('window.__noArm1373') && src.includes('U.active = () => !W.__noArm1373'), 'flag restores previous seats');
ok(src.includes('__handsFp1285') && src.includes('__fpa') && src.includes('forearm1280'), 'keeps fpa rig and 1285 cuff');
ok(src.includes('phand') || src.includes('__phand1360') || !src.includes('__noPhand1360'), 'does not disable pistol hand poses');
ok(!src.includes('.remove(') && !src.includes('dispose('), 'does not delete player geometry');
ok(!src.includes('new THREE.GLTFLoader') && !src.includes('.glb'), 'does not swap in a new arms model');
ok(src.includes('empty:') && src.includes('sx: 1') && src.includes('p761'), 'reseats empty/pick holds');
ok(src.includes('updateHand') && src.includes('dressSleeves'), 'hooks the live arm loop and dresses the linen cuff');
ok(['1.2.133','1.2.134','1.2.135','1.2.136','1.2.137','1.2.138', '1.2.139', '1.2.140', '1.2.141', '1.2.142','1.2.143', '1.2.144', '1.2.145', '1.2.146', '1.2.147', '1.2.148', '1.2.149'].includes(ver.v) && (html.includes("const GAME_VERSION = '1.2.133';") || html.includes("const GAME_VERSION = '1.2.134';") || html.includes("const GAME_VERSION = '1.2.135';") || html.includes("const GAME_VERSION = '1.2.136';") || html.includes("const GAME_VERSION = '1.2.137';") || html.includes("const GAME_VERSION = '1.2.138';") || html.includes("const GAME_VERSION = '1.2.139';") || html.includes("const GAME_VERSION = '1.2.140';") || html.includes("const GAME_VERSION = '1.2.141';") || html.includes("const GAME_VERSION = '1.2.142';") || html.includes("const GAME_VERSION = '1.2.143';") || html.includes("const GAME_VERSION = '1.2.144';") || html.includes("const GAME_VERSION = '1.2.145';") || html.includes("const GAME_VERSION = '1.2.146';") || html.includes("const GAME_VERSION = '1.2.147';") || html.includes("const GAME_VERSION = '1.2.148';") || html.includes("const GAME_VERSION = '1.2.149';")), 'version is 1.2.133+');
ok(credits.includes('v1.2.133') && credits.includes('__noArm1373'), 'CREDITS mentions 1.2.133 and the flag');
const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2500})/);
const head = notes ? notes[1].slice(0, 2000).toLowerCase() : '';
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b'+w+'\\b').test(head), 'no food word '+w+' in notes head');
}

console.log(fail ? 'FAILED '+fail+'/'+n : 'all '+n+' passed');
if (fail) process.exit(1);
