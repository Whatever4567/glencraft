import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/arm-1380.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-ARM1380') && src.includes('(function arm1380'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function arm1380').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-arm1380"'), 'script id');
ok(['1.2.136','1.2.137','1.2.138','1.2.139','1.2.140', '1.2.141', '1.2.142','1.2.143', '1.2.144', '1.2.145', '1.2.146'].includes(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v) && (html.includes("const GAME_VERSION = '1.2.136';") || html.includes("const GAME_VERSION = '1.2.137';") || html.includes("const GAME_VERSION = '1.2.138';") || html.includes("const GAME_VERSION = '1.2.139';") || html.includes("const GAME_VERSION = '1.2.140';") || html.includes("const GAME_VERSION = '1.2.141';") || html.includes("const GAME_VERSION = '1.2.142';") || html.includes("const GAME_VERSION = '1.2.143';") || html.includes("const GAME_VERSION = '1.2.144';") || html.includes("const GAME_VERSION = '1.2.145';") || html.includes("const GAME_VERSION = '1.2.146';")), 'version is 1.2.136+');
ok(html.includes('id="glx-arm1373"'), '1.2.133 arm IIFE stays');
ok(src.includes('window.__noArm1380') && src.includes('U.active = () => !W.__noArm1380'), 'flag restores 1.2.133 seats');
ok(src.includes('__fp1347') && src.includes('__handsFp1285') && src.includes('__fpa'), 'keeps existing rig');
ok(!src.includes('.remove(') && !src.includes('dispose('), 'does not delete player geometry');
ok(!src.includes('new THREE.GLTFLoader') && !src.includes('.glb'), 'does not swap in a new arms model');
ok(src.includes('lG: [0, 0, 0]') && src.includes('lGA: [0, 0, 0]') && src.includes('applyTrim') && src.includes('scale: 1.42') && src.includes('bucket'), 'reseats musket / pick / bucket and trims leftover glove arm');
ok(src.includes('updateHand'), 'hooks the live arm loop');
const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2500})/);
const head = notes ? notes[1].slice(0, 2000).toLowerCase() : '';
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b'+w+'\\b').test(head), 'no food word '+w+' in notes head');
}
console.log(fail ? 'FAILED '+fail+'/'+n : 'all '+n+' passed');
if (fail) process.exit(1);
