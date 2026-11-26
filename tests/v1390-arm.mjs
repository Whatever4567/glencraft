import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/arm-1390.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-ARM1390') && src.includes('(function arm1390'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function arm1390').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-arm1390"'), 'script id');
ok(html.includes('id="glx-arm1389"') && html.includes('id="glx-arm1380"') && html.includes('id="glx-arm1373"'), 'earlier arm IIFEs stay');
ok(html.indexOf('id="glx-arm1389"') < html.indexOf('id="glx-arm1390"'), '1390 is after 1389');
ok(['1.2.138','1.2.139','1.2.140', '1.2.141', '1.2.142','1.2.143', '1.2.144'].includes(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v) && (html.includes("const GAME_VERSION = '1.2.138';") || html.includes("const GAME_VERSION = '1.2.139';") || html.includes("const GAME_VERSION = '1.2.140';") || html.includes("const GAME_VERSION = '1.2.141';") || html.includes("const GAME_VERSION = '1.2.142';") || html.includes("const GAME_VERSION = '1.2.143';") || html.includes("const GAME_VERSION = '1.2.144';")), 'version is 1.2.138+');
ok(src.includes('window.__noArm1390') && src.includes('U.active = function () { return !W.__noArm1390; }'), 'flag restores 1.2.137 geometry');
ok(src.includes('__handsFp1285') && src.includes('__fpa'), 'keeps existing rig');
ok(!src.includes('.remove(') && !src.includes('dispose('), 'does not delete player geometry');
ok(!src.includes('new THREE.GLTFLoader') && !/\.glb/.test(src), 'does not swap in a new arms model');
ok(src.includes('skin-R-pos.bin') && src.includes('skin-L-pos.bin') && src.includes('SKIN_N = 2220'), 'applies sidecar HeadSkin positions');
ok(src.includes('userData._pos137'), 'keeps original positions to restore');
ok(!src.includes('fireGun') && !src.includes('GUN['), 'does not touch the gun systems');

const r = fs.readFileSync(path.join(root, 'assets/models/fp-hands-1390/skin-R-pos.bin'));
const l = fs.readFileSync(path.join(root, 'assets/models/fp-hands-1390/skin-L-pos.bin'));
ok(r.length === 2220 * 3 * 4 && l.length === 2220 * 3 * 4, 'skin bins are 2220 vec3 float32');
ok(fs.existsSync(path.join(root, 'assets/models/scottish-base-v2/scottish-base.glb')), 'original character glb is still present');

const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2500})/);
const head = notes ? notes[1].slice(0, 2000).toLowerCase() : '';
ok(head.includes('1.2.138') && head.includes('__noarm1390'), 'patch notes mention 1.2.138 and the flag');
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b'+w+'\\b').test(head), 'no food word '+w+' in notes head');
}
console.log(fail ? 'FAILED '+fail+'/'+n : 'all '+n+' passed');
if (fail) process.exit(1);
