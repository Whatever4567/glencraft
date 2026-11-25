// v1371: sunset plate is depth-tested and written at the far plane; flag restores the old plate.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root = process.env.GC_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const src = html.slice(html.indexOf('<script id="glx-sky1371">'), html.indexOf('</script>', html.indexOf('<script id="glx-sky1371">')) + 9);
let n = 0, fail = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
ok(html.includes('<script id="glx-sky1371">') && html.includes('GLX-SKY1371'), 'SKY1371 IIFE is in the page');
ok(src.includes('window.__noSky1371') || src.includes('WIN.__noSky1371'), 'flag __noSky1371 restores the old plate');
ok(src.includes('gl_Position = p1371.xyww') || src.includes('.xyww'), 'plate vertices are written at the far plane');
ok(src.includes('mat.depthTest = true') || src.includes('depthTest = true'), 'depth test is turned on');
ok(src.includes('depthWrite = false'), 'plate still does not write depth');
ok(src.includes('plateMesh') && src.includes('__sky1312'), 'hooks the existing sunset plate, does not replace it');
ok(!src.includes('scene.remove') && !/plateMesh\s*=\s*null/.test(src), 'does not remove the plate');
ok(html.includes("SKY_URL = 'assets/sky/overworld-sunset.webp'"), 'sunset plate asset stays');
ok(html.includes('sky1312-sunset-plate'), 'original plate mesh is still created');
ok(html.includes("depthTest: false") && html.includes('sky1312-sunset-plate'), 'original plate source is kept; the flag can restore it');
ok(html.includes('__fpa') && html.includes('__noPhand1360') && html.includes('__noCave1366') && html.includes('__noG1367') && html.includes('__noMap1367'), 'keeps existing feature flags');
ok(!/food|hunger|drumstick|eat/i.test(src), 'patch has no food words');
if (fail) { console.log('v1371-skybox FAIL', fail + '/' + n); process.exit(1); }
console.log('v1371-skybox ok', n);
