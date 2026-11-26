import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/tex-1403.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-TEX1403') && src.includes('(function tex1403'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function tex1403').length - 1) === 1, 'exactly one 1403 IIFE');
ok(html.includes('id="glx-tex1403"'), 'script id');
ok(html.includes('id="glx-tex1393"'), 'does not remove the 1.2.139 grass/dirt IIFE');
ok(html.indexOf('id="glx-tex1393"') < html.indexOf('id="glx-tex1403"'), 'tex1403 is after tex1393');
ok(src.includes('WIN.__noTex1403'), 'flag restores 1.2.139 textures');
ok(src.includes('__noTex1393') === false, 'does not take over the 1393 flag');
ok(!src.includes('grass_top') && !src.includes('dirt-1393') && !src.includes("dirt:"), 'does not redo grass or dirt');
const KEYS = ['stone','sand','sandstone','peat','cobblestone','stone_bricks','gold_ore','deepslate'];
for (const k of KEYS) ok(src.includes(k + ": 'assets/tex/" + k + "-1403.webp'"), 'maps ' + k);
ok(src.includes('OLD') && src.includes('restore'), 'keeps a copy of the 1.2.139 maps to restore');
ok(html.includes('const TEX = {') && html.includes('"stone"') && html.includes('"deepslate"'), 'original TEX keys stay');
ok(!src.includes('delete TEX') && !src.includes('delete texCache'), 'does not delete the old textures');
ok(src.includes('__c107') && src.includes('gold_ore'), 'pins gold so C107 does not overwrite it');
ok(src.includes('__c190'), 'keeps C190 from overwriting sandstone');
ok(!src.includes('fireGun') && !src.includes('GUN['), 'does not touch the gun systems');
ok(!src.includes('__noArm1390') && !src.includes('arm1390') && !src.includes('t1392'), 'does not touch arm or rifle work');
ok(fs.existsSync(path.join(root, 'assets/tex/grass_top-1393.webp')) && fs.existsSync(path.join(root, 'assets/tex/dirt-1393.webp')), '1.2.139 grass/dirt assets stay');

for (const k of KEYS) {
  const p = path.join(root, 'assets/tex', k + '-1403.webp');
  ok(fs.existsSync(p) && fs.statSync(p).size > 8000, k + '-1403.webp present');
}
ok(fs.existsSync(path.join(root, 'assets/tex/sheep2_2k.webp')), 'existing animal textures stay');

const py = spawnSync('python3', [path.join(root, 'tests/_v1403_inspect.py'), root], {encoding: 'utf8'});
ok(py.status === 0, 'pillow inspect ok: ' + String(py.stderr || py.stdout || '').slice(0, 240));
let info = {};
try { info = JSON.parse(py.stdout); } catch (e) { ok(false, 'inspect json ' + e + ' out=' + String(py.stdout).slice(0, 200)); }

for (const k of KEYS) {
  const rec = info[k] || {};
  ok(rec.w === 1024 && rec.h === 1024, k + ' is 1024');
  ok(rec.ymin >= 16, k + ' is not a black map (ymin=' + rec.ymin + ')');
  ok(rec.seams && rec.seams[0] < 40 && rec.seams[1] < 40, k + ' seams are tight: ' + JSON.stringify(rec.seams));
}
ok(info.stone && info.stone.stdev[0] >= 16, 'stone has more contrast than the live wash (~15)');
ok(info.sand && info.sand.unique128 >= 400, 'sand has much more grain than the live flat map (~90)');
ok(info.sandstone && info.sandstone.mean[0] > 200 && info.sandstone.mean[2] < info.sandstone.mean[1], 'sandstone stays warm pale sand');
ok(info.peat && info.peat.mean[0] > 20 && info.peat.mean[0] < 80 && info.peat.ymin >= 16, 'peat stays dark brown, not black');
ok(info.cobblestone && info.cobblestone.unique128 >= 800, 'cobblestone has distinct structure');
ok(info.stone_bricks && Math.abs(info.stone_bricks.mean[0] - 124) < 20, 'stone_bricks keep the live grey brick palette');
ok(info.gold_ore && info.gold_frac >= 0.01 && info.gold_frac <= 0.25, 'gold_ore has a modest gold fraction, not a gold block (' + info.gold_frac + ')');
ok(info.deepslate && info.deepslate.mean[0] < 80 && info.deepslate.mean[2] >= info.deepslate.mean[0], 'deepslate is a unique darker cool slate, not a copy of stone');
ok(info.stone && info.deep_vs_stone > 40, 'deepslate is clearly darker than the new stone (delta=' + info.deep_vs_stone + ')');
ok(info.not_byte_copy, 'deepslate is not a byte-identical copy of stone');

const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
ok(/^\d+\.\d+\.\d+$/.test(ver), 'version.json is a version');
const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2000})/);
const head = notes ? notes[1].slice(0, 1800).toLowerCase() : '';
ok(head.includes('__notex1403'), 'patch notes mention the flag');
ok(html.includes("const GAME_VERSION = '" + ver + "';"), 'GAME_VERSION matches version.json');
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b' + w + '\\b').test(head), 'no food word ' + w + ' in notes head');
}

console.log(fail ? 'FAILED ' + fail + '/' + n : 'all ' + n + ' passed');
if (fail) process.exit(1);
