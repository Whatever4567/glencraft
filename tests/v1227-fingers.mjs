// v1.2.27: first person fingers with three joints (knuckle, middle, end) and a thumb end joint, through the real hand chain
// (tests/lib/hands-harness.mjs, real THREE: setHeld, C350 viewmodel, FPA arms). Grip, trigger and reload poses.
import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera);
const fr = k => { for (let i = 0; i < k; i++) H.frame(1 / 60, false); };
const hands = () => { const R = G.__fpa.rig(); return [R.userData.R.userData.p.h, R.userData.L.userData.p.h]; };
const joints = h => h.userData.f.map(([f, k]) => [f.rotation.x, k.rotation.x, k.userData.d ? k.userData.d.rotation.x : NaN]);
const tipY = h => { G.scene.updateMatrixWorld(true); return h.userData.f.map(([f, k]) => { const d = k.userData.d, t = d.children[d.children.length - 1]; const p = t.getWorldPosition(new T.Vector3()); return h.worldToLocal(p); }); };
H.setSel(IT.PISTOL); fr(5); const [R0] = hands(); ok(R0.userData.f.length === 4 && R0.userData.f.every(([f, k]) => k.userData.d && k.userData.d.parent === k) && R0.userData.th.userData.k.userData.d, 'each finger has knuckle, middle and end joints; the thumb has an end joint');
for (const [nm, id] of [['pistol', IT.PISTOL], ['rifle', IT.MUSKET]]) { H.setSel(id); fr(90); const [r, l] = hands(), J = joints(r);
  ok(J.every(([a, b, c]) => isFinite(a + b + c) && c > 0.05 && c < b && b > 0.1), nm + ' grip: every right finger bends at all three joints, end joint less than middle (' + J.map(j => j.map(v => v.toFixed(2)).join('/')).join(' ') + ')');
  const tips = tipY(r); ok(tips.every(p => p.z > 0.0 || p.y < 0.09), nm + ' grip: fingertips curl in toward the palm (' + tips.map(p => p.toArray().map(v => v.toFixed(3)).join(',')).join(' ') + ')');
  const td = r.userData.th.userData.k.userData.d.rotation.x; ok(td > 0.1, nm + ' grip: thumb end joint bent ' + td.toFixed(2));
  H.startRl(id); G.__rl = G.window.__rl = {t: G.GUN[id].rl, dur: G.GUN[id].rl, id}; fr(40); const JL = joints(l); ok(JL.every(j => j.every(isFinite)), nm + ' reload: support hand joints stay valid (' + JL.map(j => j[2].toFixed(2)).join(' ') + ')'); H.cancelRl(); G.__rl.t = 0; fr(30); }
ok(!G.__fpa.err && !G.__vm.err, 'no errors in the arm chain');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
