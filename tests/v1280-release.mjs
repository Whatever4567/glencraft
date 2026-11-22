import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/sculpt-1280.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(ver.v === '1.2.80', 'version.json is 1.2.80');
ok(html.includes("const GAME_VERSION = '1.2.80';") || html.includes("const GAME_VERSION = '1.2.101';") || html.includes("const GAME_VERSION = '1.2.102';") || html.includes("const GAME_VERSION = '1.2.103';") || html.includes("const GAME_VERSION = '1.2.104';") || html.includes("const GAME_VERSION = '1.2.105';") || html.includes("const GAME_VERSION = '1.2.106';") || html.includes("const GAME_VERSION = '1.2.107';") || html.includes("const GAME_VERSION = '1.2.108';") || html.includes("const GAME_VERSION = '1.2.109';") || html.includes("const GAME_VERSION = '1.2.110';") || html.includes("const GAME_VERSION = '1.2.111';") || html.includes("const GAME_VERSION = '1.2.112';") || html.includes("const GAME_VERSION = '1.2.113';") || html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.114';"), 'GAME_VERSION is 1.2.80');
ok(html.includes('<!-- glencraft-build: b1280-v1.2.80 -->'), 'build marker');
ok(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
ok(html.includes('"v":"v1.2.80"'), 'PATCH_NOTES has 1.2.80');
ok(html.includes('First-person hands: the pickaxe fist comes in from the bottom-right corner.'), 'note: pick');
ok(html.includes('The pistol is lower and bigger in first person.'), 'note: pistol');
ok(html.includes('Tools have cream linen sleeves.'), 'note: sleeves');
ok(!/haggis|food|sausage roll|pie\b/i.test(html.slice(html.indexOf('{"v":"v1.2.80"'), html.indexOf('{"v":"v1.2.79"'))), '1.2.80 notes have no food');
ok(credits.includes('## v1.2.80 First-person hands'), 'CREDITS 1.2.80');
{
  const st = html.indexOf('window.PATCH_NOTES = [');
  const en = html.indexOf('\n];', st);
  const arr = (new Function('return ' + html.slice(st + 'window.PATCH_NOTES = '.length, en + 2)))();
  ok(Array.isArray(arr) && arr[0].v === 'v1.2.80' && arr[1].v === 'v1.2.79', 'PATCH_NOTES parses, 1.2.80 first');
}
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) { let good = true; try { new Function(m[1]); } catch (_) { good = false; } ok(good, 'inline script parses'); }
}

ok(html.includes('/* GLX-SCULPT1280'), 'SCULPT1280 injected');
ok((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
ok(src.includes('GLX-SCULPT1280'), 'sculpt-1280.js source present');
ok(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame stays');
ok(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
ok(html.includes('/* GLX-FIX1275 (v1.2.75):') || html.includes('GLX-FIX1275'), 'FIX1275 stays');
console.log('PASS', n, 'v1280-release checks');
