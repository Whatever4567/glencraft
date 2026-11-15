import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/hands-fp-1285.js'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-HANDSFP1285') && src.includes('(function handsFp1285'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function handsFp1285').length - 1) === 1, 'exactly one IIFE');
ok(src.includes('aCrease1282') && src.includes('aNail1282') && src.includes('aKnk1282'), '1.2.83 crease/nail/knuckle attrs');
ok(src.includes('lights_physical_fragment') && src.includes('vCrease1282') && src.includes('nailC'), 'same 1.2.83 skin shader');
ok(!src.includes('worldModel') && !src.includes('charModel'), 'does not patch TP world/char models');
ok(!/fpa\.step\s*=/.test(src) && !src.includes('__heldFrame1251') && !src.includes('renderer.render') && !/updateHand\s*=/.test(src), 'does not wrap step/held-frame/render/updateHand');
ok(!src.includes('.remove(') && !src.includes('dispose(') && !src.includes('visible = false'), 'does not delete or hide geometry');
ok(src.includes('upgradeHand') && src.includes('palmGeo') && src.includes('phalanxGeo') && src.includes('sculptKeep'), 'rounds existing __fpa hand meshes');
ok(src.includes('__hands1271') && src.includes('__fpa'), 'builds on 1271 / __fpa, does not rebuild arms');
ok(html.includes('/* GLX-HANDSTP1282') && html.includes('/* GLX-HANDS1271') && html.includes('/* GLX-SCULPT1282') && html.includes("version: '1.2.59-frame-torch'") && html.includes('/* GLX-FIX1279'), 'TP hands, 1271 sculpt, jitter/grip fixes stay');
ok(html.includes("const GAME_VERSION = '1.2.85';"), 'version stays 1.2.85');
ok(/First-person hands now match the rounded third-person look/.test(html), 'patch notes mention FP hands');
{
  const st = html.indexOf('{"v":"v1.2.85"');
  const en = html.indexOf('{"v":"v1.2.84"', st);
  ok(st >= 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.85 notes have no food');
}
ok(credits.includes('First-person hands are upgraded on the existing __fpa rig'), 'CREDITS mentions FP hands');

if (fail) { console.error(fail + '/' + n + ' failed'); process.exit(1); }
console.log('v1285-fp-hands ok', n);
