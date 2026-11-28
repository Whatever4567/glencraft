import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const ver = JSON.parse(readFileSync(resolve(root, 'version.json'), 'utf8')).v;
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }
ok(ver === '1.2.153' || /^1\.2\.(15[3-9]|1[6-9]\d|[2-9]\d\d)(-[a-z]+)?$/.test(ver), 'version is 1.2.153+');
ok(html.includes("const GAME_VERSION = '" + ver + "';"), 'GAME_VERSION matches version.json');
ok(html.includes('GLX-MAP1430') && html.includes('window.__noMap1430'), 'GLX-MAP1430 inlined with off switch');
ok(html.includes('A.hT0') && html.includes('hookHeight') && html.includes('g9height.__map1430'), 'GEN9/spawn columns use t1290 hT0 heights');
ok(html.includes('M.elig.__map1430') && html.includes('return false'), 'MC1327 elig stays off unless the flag is set');
ok(html.includes('armDeep') && html.includes('V.dl = true') && html.includes('GLX-V1217'), 'deep layers are armed early; V1217 kept');
ok(html.includes('v: C.ms > 0 ? 1 : 0'), 'saves are not marked fully caved from a local-only carve');
ok(html.includes('GLX-CAVE1427') && html.includes('carveLocal()') && html.includes('__qr1398.inDisc(x, z)'), '1.2.152 caves and spawn-disc skip are kept');
ok(html.includes('GLX-C345') && html.includes('ukRows') && html.includes('ukReady'), 'C345 held-map UK chart is kept');
const top = html.slice(html.indexOf('PATCH_NOTES ='), html.indexOf('PATCH_NOTES =') + 900);
ok(top.includes('"v' + (ver.startsWith('v') ? ver : 'v' + ver) + '"') || top.includes('"v":"v' + ver + '"'), 'patch notes lead with the current version');
ok(/UK map|deep cave/i.test(top) && /woods|music/i.test(top) && /grass/i.test(top), 'notes mention the UK map, woods, music, grass and deep caves');
ok(html.includes('GLX-GRASS1434') && html.includes('window.__noGrass1434') && html.includes('greenBand'), 'grass top is derived from the side turf, with an off switch');
ok(html.includes('hookC347') && html.includes('detectContext') && html.includes("bio === 'moor'"), 'regional woods (G1367/C347) and area music triggers are kept');

ok(!/\b(food|eat|bread|cake|pie|apple|cheese|meat|soup|cookie|snack|tasty|delicious|recipe)\b/i.test(top), 'no food words in the notes');
if (fail) { console.error('FAIL', fail + '/' + n); process.exit(1); }
console.log('PASS', n + '/' + n);
