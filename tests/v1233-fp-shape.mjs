// v1.2.33 local: the first person hand and forearm are lofted anatomical surfaces (no box palm, no plain tubes) through the real hand
// chain; same joint graph, grips and poses; bounded triangles and no extra materials.
import {make} from './lib/hands-harness.mjs'; import {load} from './lib/tph-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const B = load(new URL('../index.html', import.meta.url).pathname); const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera); G.__tph = G.window.__tph = B.U;
const vis = o => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
const fr = k => { for (let i = 0; i < k; i++) H.frame(1 / 60, false); };
H.setSel(999); fr(20); const R = G.__fpa.rig(), A = R.userData.R, h = A.userData.p.h, palm = h.children[0];
let box = 0, tris = 0, meshes = 0, mats = new Set(); R.traverse(o => { if (!o.isMesh) return; meshes++; mats.add(o.material); if (o.geometry.type === 'BoxGeometry') box++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
ok(box === 0, 'no box geometry left in the arm rig (' + box + ')');
// palm sections at several heights: width grows wrist -> knuckles, the thickness is largest at the heel and thenar
const sect = (g, y0, y1) => { const p = g.attributes.position, xs = [], zs = []; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y >= y0 && y < y1) { xs.push(p.getX(i)); zs.push(p.getZ(i)); } } return {w: Math.max(...xs) - Math.min(...xs), d: Math.max(...zs) - Math.min(...zs), n: xs.length}; };
const pg = palm.geometry, s0 = sect(pg, -0.045, -0.035), s1 = sect(pg, -0.005, 0.005), s2 = sect(pg, 0.03, 0.04);
ok(palm.userData.fpLoft && s2.w > s0.w + 0.01 && s0.d > s2.d + 0.002, `palm tapers: width ${(s0.w * 1000).toFixed(1)} -> ${(s1.w * 1000).toFixed(1)} -> ${(s2.w * 1000).toFixed(1)} mm, thickness ${(s0.d * 1000).toFixed(1)} -> ${(s2.d * 1000).toFixed(1)} mm`);
{ const p = pg.attributes.position; let th = 0, hy = 0, nt = 0, nh = 0; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), z = p.getZ(i); if (y > -0.03 && y < 0.0) { const ax = Math.abs(x); if (z > 0 && ax > 0.02 && ax < 0.034) { if (x > 0) { th += z; nt++; } else { hy += z; nh++; } } } } th /= nt || 1; hy /= nh || 1; ok(th > hy + 0.001, `thenar mound on the thumb side stands out, mean palm side height near the edges (${(th * 1000).toFixed(1)} vs ${(hy * 1000).toFixed(1)} mm)`); }
{ const p = pg.attributes.position; let cn = 9, ed = -9; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), z = p.getZ(i); if (y > 0 && y < 0.015 && z > 0) { if (Math.abs(x) < 0.004) cn = Math.min(cn, z); if (Math.abs(x) > 0.02 && Math.abs(x) < 0.028) ed = Math.max(ed, z); } } ok(ed > cn, `palm is cupped (centre ${(cn * 1000).toFixed(1)} under edges ${(ed * 1000).toFixed(1)} mm)`); }
// curvature: a section is not a rectangle - many distinct radii around it
{ const p = pg.attributes.position, r = new Set(); for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < 0.003) r.add(Math.round(Math.hypot(p.getX(i), p.getZ(i)) * 2000)); ok(r.size > 12, 'palm section has ' + r.size + ' distinct radii (curved contour, not a box)'); }
// fingers: each bone tapers and has a knuckle swell; length differs per finger
{ const f = h.userData.f, bones = f.map(([g, k]) => [g.children[0].geometry, k.children[0].geometry, k.userData.d.children.find(o => o.userData.fpLoft).geometry]);
  const wAt = (g, t) => { g.computeBoundingBox(); const L = g.boundingBox.max.y, s = sect(g, L * t - L * 0.06, L * t + L * 0.06); return s.w; };
  ok(bones.every(b => b.every(g => g.userData.fpLoft)), 'all 12 finger bones lofted');
  ok(bones.every(b => wAt(b[0], 0.12) > wAt(b[0], 0.55) && wAt(b[2], 0.9) < wAt(b[2], 0.3)), 'knuckle swell at each base bone, tips taper: ' + bones.map(b => (wAt(b[0], 0.12) * 1000).toFixed(1) + '/' + (wAt(b[0], 0.55) * 1000).toFixed(1) + '/' + (wAt(b[2], 0.9) * 1000).toFixed(1)).join(' '));
  const Gs = bones.map(b => wAt(b[0], 0.55)); ok(new Set(Gs.map(x => (x * 1e4).toFixed(0))).size >= 3, 'fingers differ in girth (' + Gs.map(x => (x * 1000).toFixed(1)).join(', ') + ' mm; joint lengths kept so the fitted grips stay valid)'); }
{ const g = A.userData.p.fo.geometry, L = 0.36, a = sect(g, L * 0.18, L * 0.26), b = sect(g, L * 0.9, L * 0.97); ok(Math.abs(a.w / b.w - 1.33) < 0.15 && Math.abs(b.w / b.d - 1.28) < 0.15, `forearm (CC0 reference teen-character.obj: belly/wrist 1.33, wrist 1.28x wider than deep): belly ${(a.w * 1000).toFixed(0)} mm to wrist ${(b.w * 1000).toFixed(0)} mm, wrist ${(b.w / b.d).toFixed(2)}x wider than deep`); }
ok(meshes === 78 && tris < 24000 && mats.size === 2, `budget: ${meshes} meshes (78 on main: same node graph and draws), ${tris} triangles for both arms (about 12900 on main), ${mats.size} materials`);
// grips and extreme poses stay valid
for (const [nm, id] of [['pistol', IT.PISTOL], ['rifle', IT.MUSKET], ['pick', PICK], ['empty', 999], ['rifle again', IT.MUSKET]]) { H.setSel(id); fr(45); let bad = 0; R.updateMatrixWorld(true); R.traverse(o => { if (o.isMesh) { const e = o.matrixWorld.elements; if (!e.every(isFinite)) bad++; } }); const J = h.userData.f.map(([f, k]) => k.rotation.x); ok(!bad && J.every(v => isFinite(v) && v > 0.1), nm + ': finite pose, fingers curled ' + J.map(v => v.toFixed(2)).join(' ')); }
// forearm roll follows the palm in every pose
{ const T3 = T.Vector3; let worst = 1, cnt = 0; for (const id of [IT.PISTOL, IT.MUSKET, PICK, 999, 998]) { H.setSel(id); for (let i = 0; i < 40; i++) { fr(1); for (const Ar of [R.userData.R, R.userData.L]) { if (!Ar.visible || !vis(Ar)) continue; const p = Ar.userData.p, y = new T3(0, 1, 0).applyQuaternion(p.fo.quaternion), hx = new T3(1, 0, 0).applyQuaternion(p.h.quaternion); hx.addScaledVector(y, -hx.dot(y)); if (hx.lengthSq() < 0.04) continue; hx.normalize(); const fx = new T3(1, 0, 0).applyQuaternion(p.fo.quaternion); worst = Math.min(worst, Math.abs(fx.dot(hx))); cnt++; } } }
  ok(cnt > 100 && worst > 0.99, 'wrist roll: forearm flat side lines up with the palm in ' + cnt + ' arm frames (worst |cos| ' + worst.toFixed(3) + ')'); }
H.setSel(IT.PISTOL); H.startRl(IT.PISTOL); G.__rl = G.window.__rl = {t: 1.6, dur: 1.6, id: IT.PISTOL}; let bad = 0; for (let i = 0; i < 100; i++) { fr(1); R.traverse(o => { if (o.isMesh && !o.matrixWorld.elements.every(isFinite)) bad++; }); } ok(!bad, 'pistol reload: every frame finite');
ok(!G.__fpa.err && !G.__vm.err, 'no errors');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
