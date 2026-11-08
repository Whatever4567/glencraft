// v1.2.29 candidate: face relief on the third person head (merged, no new draws) and thinner first person hands, against v1.2.28.
import fs from 'node:fs'; import {execFileSync} from 'node:child_process'; import {load, stats} from './lib/tph-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const base = '/tmp/tph-base-3cedcb8.html'; if (!fs.existsSync(base)) fs.writeFileSync(base, execFileSync('git', ['show', '3cedcb8:index.html'], {cwd: new URL('..', import.meta.url), maxBuffer: 1 << 28}));
const A = load(base), B = load(new URL('../index.html', import.meta.url).pathname), T = A.T || A.THREE, a = A.build(false), b = B.build(false), sa = stats(T, a), sb = stats(T, b);
const hp = g => { let k = 0; g.userData.head.traverse(o => { if (o.isMesh) k += o.userData.merged || 1; }); return k; }, box = g => { g.updateMatrixWorld(true); return new T.Box3().setFromObject(g.userData.head); };
const SCU = b.userData.sculpt === 1230;   // later sculpt pass: the relief is part of the head surface, not separate pieces
if (SCU) ok(b.userData.head.children.some(o => o.userData.face) && hp(b) < hp(a), 'face relief is now built into the sculpted head (separate relief pieces ' + hp(a) + ' -> ' + hp(b) + ' parts)'); else ok(hp(b) >= hp(a) + 8, 'face relief pieces on the head: ' + hp(a) + ' -> ' + hp(b));
ok(sb.meshes <= sa.meshes && sb.mats <= sa.mats, 'no new draws or materials: meshes ' + sa.meshes + ' -> ' + sb.meshes + ', materials ' + sa.mats + ' -> ' + sb.mats);
ok((SCU ? sb.tris < 40000 : sb.tris > sa.tris) && sb.trisFar - sa.trisFar < 600, 'triangles near ' + sa.tris + ' -> ' + sb.tris + ', far ' + sa.trisFar + ' -> ' + sb.trisFar);
const ba = box(a), bb = box(b); ok(bb.max.z - ba.max.z < 0.006 && (SCU ? bb.max.y < ba.max.y : Math.abs(bb.max.y - ba.max.y) < 1e-6), (SCU ? 'face no further forward than before, smaller head (front ' : 'relief stays on the face (front grows ') + ((bb.max.z - ba.max.z) * 1000).toFixed(1) + ' mm)');
ok(b.userData.lids.every(l => !l.visible) && b.userData.lids.length === 2, 'eyelids kept, hidden until a blink');
// first person hand sizes, read from the built source
const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'); ok(src.includes('new THREE.BoxGeometry(0.07, 0.095, 0.024, 3, 3, 2), skinM)') && src.includes('const a = limb(0.0074, 0.0066, 0.036, skinM, 10)'), 'first person palm 7 cm wide, 2.4 cm thick (was 7.5 and 3), fingers about 13% slimmer');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
