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
ok(!src.includes('.remove(') && !src.includes('dispose('), 'does not delete player geometry');
ok(src.includes('visible = false') && src.includes('hideOld') && src.includes('fpTpHand1285'), 'hides old box/tube FP hand pieces, keeps the TP mesh');
ok(src.includes('scottish-base-v2') && /GLOVE|visual_arm_slot/.test(src), 'loads the TP scottish-base GLOVE hand');
ok(src.includes('prism: 0') && src.includes('cuffFolds: 0'), 'blocky prism pieces stay hidden');
ok(src.includes('__hands1271') && src.includes('__fpa') && src.includes('p.h'), 'attaches to existing __fpa wrist, builds on 1271');
ok(src.includes('POSES') && src.includes('finger') && src.includes('thumb'), 'poses finger bones per item');
ok(html.includes('/* GLX-HANDSTP1282') && html.includes('/* GLX-HANDS1271') && html.includes('/* GLX-SCULPT1282') && html.includes("version: '1.2.59-frame-torch'") && html.includes('/* GLX-FIX1279'), 'TP hands, 1271 sculpt, jitter/grip fixes stay');
ok(html.includes("const GAME_VERSION = '1.2.95';") || html.includes("const GAME_VERSION = '1.2.96';") || html.includes("const GAME_VERSION = '1.2.98';") || html.includes("const GAME_VERSION = '1.2.99';") || html.includes("const GAME_VERSION = '1.2.100';") || html.includes("const GAME_VERSION = '1.2.101';") || html.includes("const GAME_VERSION = '1.2.102';") || html.includes("const GAME_VERSION = '1.2.103';") || html.includes("const GAME_VERSION = '1.2.104';") || html.includes("const GAME_VERSION = '1.2.105';") || html.includes("const GAME_VERSION = '1.2.106';") || html.includes("const GAME_VERSION = '1.2.107';") || html.includes("const GAME_VERSION = '1.2.108';") || html.includes("const GAME_VERSION = '1.2.109';") || html.includes("const GAME_VERSION = '1.2.110';") || html.includes("const GAME_VERSION = '1.2.111';") || html.includes("const GAME_VERSION = '1.2.112';") || html.includes("const GAME_VERSION = '1.2.113';") || html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.97';") || html.includes("const GAME_VERSION = '1.2.94';") || html.includes("const GAME_VERSION = '1.2.93';") || html.includes("const GAME_VERSION = '1.2.92';") || html.includes("const GAME_VERSION = '1.2.91';") || html.includes("const GAME_VERSION = '1.2.90';") || html.includes("const GAME_VERSION = '1.2.89';") || html.includes("const GAME_VERSION = '1.2.88';") || html.includes("const GAME_VERSION = '1.2.87';") || html.includes("const GAME_VERSION = '1.2.86';") || html.includes("const GAME_VERSION = '1.2.85';"), 'version is 1.2.85+');
ok(/First-person hands now use the same smooth third-person hand/.test(html), 'patch notes mention TP hand in FP');
{
  const st = html.indexOf('{"v":"v1.2.85"');
  const en = html.indexOf('{"v":"v1.2.84"', st);
  ok(st >= 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.85 notes have no food');
}
ok(credits.includes('First-person hands now use the same third-person hand mesh'), 'CREDITS mentions TP hand in FP');

if (fail) { console.error(fail + '/' + n + ' failed'); process.exit(1); }
console.log('v1285-fp-hands ok', n);
