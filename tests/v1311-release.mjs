import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(ver.v === '1.2.111' || ver.v === '1.2.113' || ver.v === '1.2.114' || ver.v === '1.2.115', 'version.json is 1.2.111, 1.2.113, 1.2.114 or 1.2.115');
ok(html.includes("const GAME_VERSION = '1.2.111';") || html.includes("const GAME_VERSION = '1.2.113';") || html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';"), 'GAME_VERSION is 1.2.111, 1.2.113, 1.2.114 or 1.2.115');
ok(html.includes('<!-- glencraft-build: b1311-v1.2.111 -->'), '1.2.111 build marker stays');
ok(html.includes('<!-- glencraft-build: b1310-v1.2.110 -->'), '1.2.110 marker stays');
const st111 = html.indexOf('{"v":"v1.2.111"'), en = html.indexOf('{"v":"v1.2.110"', st111);
ok(st111 > 0 && en > st111, 'PATCH_NOTES still has 1.2.111 before 1.2.110');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st111, en)), '1.2.111 notes have no food');
ok(credits.includes('## v1.2.111 New-world load and title wallpapers') || credits.includes('## v1.2.111 Clansman, Skeleton and Black Skeleton keeps'), 'CREDITS 1.2.111 stays');
ok(html.includes('/* GLX-HANDSFP1285') || html.includes('__fpa'), '__fpa rig stays');
ok(html.includes('/* GLX-FIX1279 (v1.2.79):') || html.includes("version: '1.2.59-frame-torch'"), 'torch/pick jitter fixes stay');
console.log('PASS v1311-release', n);
