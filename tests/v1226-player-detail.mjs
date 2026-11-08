// v1.2.26: the detailed third person player against the released v1.2.25 one (git 5646ee7), both run through tests/lib/tph-harness.mjs
// (the game's own GLX-TP-HD block, real THREE geometry). Proves: more real geometry, slimmer body, same height, same rig and contact points.
import fs from 'node:fs'; import {execFileSync} from 'node:child_process'; import {load, stats} from './lib/tph-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const base = '/tmp/tph-base-5646ee7.html'; if (!fs.existsSync(base)) fs.writeFileSync(base, execFileSync('git', ['show', '5646ee7:index.html'], {cwd: new URL('..', import.meta.url).pathname, maxBuffer: 1 << 28}));
const A = load(base), B = load(new URL('../index.html', import.meta.url).pathname), T = B.T;
const a = A.build(false), b = B.build(false), sa = stats(T, a), sb = stats(T, b);
console.log('before', JSON.stringify(sa)); console.log('after ', JSON.stringify(sb));
ok(b.userData.detail === 1226, 'the detailed builder is the one in the page');
const pieces = g => { let k = 0; g.traverse(o => { if (o.isMesh) k += o.userData.merged || 1; }); return k; }, pa = pieces(a), pb = pieces(b);
ok(sb.tris > sa.tris * 1.5 && pb > pa * 1.6, 'more real geometry: ' + sa.tris + ' -> ' + sb.tris + ' triangles near, ' + pa + ' -> ' + pb + ' source pieces');
ok(sb.meshes <= sa.meshes * 1.15 && sb.trisFar < sa.trisFar && pb > sb.meshes * 1.5, 'fewer draws: ' + sa.meshes + ' -> ' + sb.meshes + ' meshes for ' + pb + ' pieces, far triangles ' + sa.trisFar + ' -> ' + sb.trisFar);
ok(sb.trisFar < 14000 && sb.tris < 45000 && sb.mats <= 12 && sb.texs <= 8, 'budget: ' + sb.trisFar + ' triangles at distance (low detail swap), ' + sb.tris + ' near, ' + sb.mats + ' materials, ' + sb.texs + ' textures');
ok(B.canvases.length <= 6 && Math.max(...B.canvases.map(c => c.width)) <= 512, 'textures made once, at most 512 px (' + B.canvases.map(c => c.width).join(', ') + ')');
{ const b2 = B.build(true); ok(B.canvases.length <= 6, 'a second model (inventory preview) makes no new textures'); ok(stats(T, b2).tris === sb.tris && stats(T, b2).meshes === sb.meshes, 'preview model is the same detailed body as the world model'); }
// size: same height and feet, slimmer
const box = g => { g.updateMatrixWorld(true); const bx = new T.Box3(); g.traverse(o => { if (o.isMesh && o.visible) bx.expandByObject(o, true); }); return bx; };
const part = (g, f) => { const bx = new T.Box3(); f(g).traverse(o => { if (o.isMesh) bx.expandByObject(o, true); }); return bx.getSize(new T.Vector3()); };
{ const ba = box(a), bb = box(b); ok(Math.abs(bb.max.y - ba.max.y) < 0.02 && Math.abs(bb.min.y - ba.min.y) < 0.02, 'same height: head top ' + ba.max.y.toFixed(3) + ' -> ' + bb.max.y.toFixed(3) + ', feet ' + ba.min.y.toFixed(3) + ' -> ' + bb.min.y.toFixed(3)); }
const meas = g => { const u = g.userData, ch = new T.Box3(); u.torso.children.filter(o => o.isMesh && o.position.y === 0 || (o.isMesh && Math.abs(o.position.y - 1.17) < 0.01)).forEach(o => ch.expandByObject(o, true));
  const tall = par => { let best = null, h = 0; par.children.forEach(o => { if (!o.isMesh || o.userData.hand) return; const bx = new T.Box3().setFromObject(o, true), sz = bx.getSize(new T.Vector3()); if (sz.y > h) { h = sz.y; best = bx; } }); return best; }, fa = tall(u.fore[1]), sh = tall(u.shin[1]);   // forearm and sock: the longest part below the elbow / knee
  return {chest: ch.getSize(new T.Vector3()).x, fore: fa.getSize(new T.Vector3()).x, shin: sh.getSize(new T.Vector3()).x}; };
{ const ma = meas(a), mb = meas(b); ok(mb.chest < ma.chest - 0.04 && mb.fore < ma.fore - 0.02 && mb.shin < ma.shin - 0.03, 'slimmer: chest width ' + ma.chest.toFixed(3) + ' -> ' + mb.chest.toFixed(3) + ', forearm ' + ma.fore.toFixed(3) + ' -> ' + mb.fore.toFixed(3) + ', calf ' + ma.shin.toFixed(3) + ' -> ' + mb.shin.toFixed(3)); }
// same rig: pivots, joints, grips, eyelids, fingers; same contact points through poses
const P = g => { const u = g.userData; return [u.head, ...u.arms, ...u.legs, ...u.fore, ...u.shin, ...u.arms.map(x => x.userData.grip), ...u.lids].map(o => o.getWorldPosition(new T.Vector3())); };
const same = (pa, pb) => Math.max(...pa.map((p, i) => p.distanceTo(pb[i])));
ok(same(P(a), P(b)) < 1e-9, 'same pivots, elbows, knees, hand grips and eyelids (max move ' + same(P(a), P(b)).toExponential(1) + ')');
{ let w = 0; for (const f of [g => { g.userData.arms[1].rotation.set(-1.4, 0.2, 0.3); g.userData.fore[1].rotation.x = -0.9; }, g => { g.userData.legs[0].rotation.x = 0.7; g.userData.shin[0].rotation.x = 0.8; g.userData.head.rotation.set(-0.4, 0.5, 0); }, g => { g.userData.arms[0].rotation.set(-2.6, 0, -0.9); g.userData.torso.rotation.y = 0.3; }]) { f(a); f(b); a.updateMatrixWorld(true); b.updateMatrixWorld(true); w = Math.max(w, same(P(a), P(b))); }
  ok(w < 1e-9, 'aim, walk, look, swing poses: grips and joints land on the same spots (max ' + w.toExponential(1) + ')'); }
{ const hs = g => g.userData.fore.map(el => el.children.find(c => c.userData.hand)); ok(hs(b).every(h => h && h.userData.fg && h.userData.fg.length === 4), 'each hand keeps four fingers the move code turns (userData.fg) and a thumb');
  // hand meets the grip: the grip point sits inside or on the hand
  const hb = new T.Box3().setFromObject(hs(b)[1], true), gp = b.userData.arms[1].userData.grip.getWorldPosition(new T.Vector3()); ok(hb.distanceToPoint(gp) < 0.02, 'the held item grip point is at the hand (' + hb.distanceToPoint(gp).toFixed(3) + ' m)'); }
{ const cnt = g => { let k = 0; g.userData.head.traverse(o => { if (o.isMesh && o.visible) k += o.userData.merged || 1; }); return k; }, n0 = cnt(a), n2 = cnt(b), hd = b.userData.head; ok(n2 >= n0 + 10 && b.userData.lids.every(l => !l.visible && l.parent === hd), 'head has its face block, ears, brows, nose and hair locks (' + n0 + ' -> ' + n2 + ' visible parts), eyelids hidden until a blink'); }
{ const fpCalls = []; ok(b.userData.kilts.length >= 4, 'kilt pieces still listed so leggings hide them (' + b.userData.kilts.length + ')'); }
// shoes sit on the ground with the knee at rest
{ const b3 = B.build(false); b3.updateMatrixWorld(true); const kn = b3.userData.shin[0]; const sb2 = new T.Box3(); kn.children.forEach(o => { if (o.isMesh) sb2.expandByObject(o, true); }); ok(Math.abs(sb2.min.y) < 0.02, 'soles on the ground (lowest point ' + sb2.min.y.toFixed(3) + ')'); }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
