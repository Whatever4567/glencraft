// t1414 (v1.2.151): frame-rate work for 90/120 Hz screens. Static checks.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/fps-1414.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
const vOk = v => { const m = /^1\.2\.(\d+)$/.exec(v); return !!m && +m[1] >= 151; };
ok(vOk(ver), 'version.json is 1.2.151+');
ok(new RegExp("const GAME_VERSION = '" + ver.replace(/\./g, '\\.') + "';").test(html), 'GAME_VERSION matches version.json');
ok(html.includes(src.trim()), 'fps1414 source inlined');
ok((html.split('(function fps1414').length - 1) === 1, 'exactly one fps1414 IIFE');
ok(html.indexOf('id="glx-fps1414"') > html.indexOf('(function yp1410'), 'fps1414 runs after the 1.2.148 patch');
ok(html.indexOf('id="glx-fps1414"') < html.lastIndexOf('</body>'), 'before body close');
// Performance mode cap: old code kept behind the flag
ok(html.includes("if (PERF && (window.__noFps1414 || window.__noUncap1414) && now - last < 1000 / 30 - 4)"), 'perf-mode 30 fps cap only with the off flag');
ok(!/if \(PERF && now - last < 1000 \/ 30 - 4\)/.test(html), 'no unconditional 30 fps cap left');
ok(html.includes("U.budget = 1000 / (perfMode && (WIN.__noFps1414 || WIN.__noUncap1414) ? Math.min(h, 30) : h)"), 'governor budget follows the screen in perf mode');
// budget scaling
ok(src.includes('budget * 60 / hz') && src.includes('hz >= 90') && src.includes('budget <= 16'), 'meshing budget scaled only on 90 Hz+ for small per-frame budgets');
ok(src.includes('arguments.length === 1') && src.includes('rb.apply(this, arguments)'), 'other rebuild calls pass through unchanged');
// rifle1392 / tbox1264 edits keep their source copies in sync
const rifle = fs.readFileSync(path.join(root, 'tools/content-source/rifle-1392.js'), 'utf8');
const tbox = fs.readFileSync(path.join(root, 'tools/content-source/tbox-1264.js'), 'utf8');
ok(html.includes(rifle.trim()) && rifle.includes('isScopeScreen0') && rifle.includes('__scs1414') && rifle.includes('hideScreens(camera)'), 'scope sweep: memo + per-call held/body/camera, scene pass throttled');
ok(rifle.includes('lockHide') && rifle.includes('window.__noRifle1392'), 'scope hiding itself unchanged');
ok(html.includes(tbox.trim()) && tbox.includes('t1414: nothing to patch on this mesh'), 'time-box material pass skips already patched meshes');
// rules
ok(!/GLTFLoader|\.glb/.test(src), 'no model swaps');
ok(!/world\[|setB\(|generate\s*=/.test(src), 'does not touch terrain blocks or world generation');
ok(html.includes('__fpa'), 'keeps the __fpa rig');
const notes = html.match(/window\.PATCH_NOTES = \[\n(\{[^\n]*\})/);
const top = notes ? notes[1] : '';
ok(top.includes('"v' + ver + '"'), 'patch notes lead with the current version');
ok(html.includes('"v1.2.151"') && /120/.test(html) && /Performance mode/.test(html) && html.includes('__noFps1414'), '1.2.151 notes kept: 120 fps, Performance mode, flag');
ok(!/\b(food|eat|bread|cake|pie|apple|cheese|meat|soup|cookie|snack|tasty|delicious|recipe)\b/i.test(top), 'no food words in the notes');
console.log(fail ? `FAILED ${fail}/${n}` : `PASS ${n}/${n}`);
process.exit(fail ? 1 : 0);
