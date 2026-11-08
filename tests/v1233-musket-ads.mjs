// v1.2.33 local: musket (and pistol) stay drawn and in view while aiming, through switches, through the real hand chain (C322 GLB swap,
// C350 viewmodel, FPA). Per frame: every ancestor visible, real model meshes visible, camera space bounds in front of the viewmodel near plane
// (0.01) and overlapping the view frustum.
import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera);
const vis = o => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
function check() { const g = H.held.children[0]; if (!g || !g.userData.gun) return null; G.scene.updateMatrixWorld(true); const inv = G.camera.matrixWorldInverse.copy(G.camera.matrixWorld).invert();
  let mv = 0, mt = 0; const bb = new T.Box3(); g.traverse(o => { if (!o.isMesh) return; mt++; if (!vis(o)) return; mv++; const b = new T.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld)); bb.union(b); });
  const zN = -bb.max.z, zF = -bb.min.z, t = Math.tan(G.camera.fov * Math.PI / 360), inView = mv && zF > 0.01 && bb.min.x < zF * t * G.camera.aspect && bb.max.x > -zF * t * G.camera.aspect && bb.min.y < zF * t && bb.max.y > -zF * t;
  return {swap: !!g.userData.c322, anc: vis(g), mv, mt, zN, zF, inView, sc: g.getWorldScale(new T.Vector3()).x}; }
const fr = (k, tag, log) => { for (let i = 0; i < k; i++) { H.frame(1 / 60, false); const c = check(); if (c && log) log.push(Object.assign({tag, i}, c)); } };
for (const [nm, id] of [['musket', IT.MUSKET], ['pistol', IT.PISTOL]]) {
  const L = []; H.setSel(id); fr(40, 'hip', L); G.__c288.aiming = true; fr(60, 'ads', L); G.__c288.aiming = false; fr(30, 'rel', L); G.__c288.aiming = true; fr(30, 'ads2', L);
  H.setSel(998); fr(10, 'food', L); H.setSel(id); fr(60, 'back-ads', L); H.setSel(id === IT.MUSKET ? IT.PISTOL : IT.MUSKET); fr(8, 'other', L); H.setSel(id); fr(60, 'back2-ads', L); G.__c288.aiming = false; fr(20, 'end', L);
  const steady = L.filter(r => r.swap && r.i > 12), bad = steady.filter(r => !r.anc || r.mv === 0 || !r.inView || r.zN < 0.01 || !(r.sc > 0.05));
  const ads = steady.filter(r => /ads/.test(r.tag)); const zs = ads.map(r => r.zN);
  ok(steady.length > 100 && !bad.length, `${nm}: drawn and in view every settled frame (${steady.length} frames; bad ${bad.length}${bad.length ? ' e.g. ' + JSON.stringify(bad[0]) : ''}); ADS nearest point ${Math.min(...zs).toFixed(3)} m, farthest ${Math.max(...ads.map(r => r.zF)).toFixed(3)} m`);
  const hid = L.filter(r => r.swap && !(r.anc && r.mv)); ok(hid.length <= 4, `${nm}: hidden frames with the real model present ${hid.length} (tags ${[...new Set(hid.map(r => r.tag + r.i))].slice(0, 12).join(' ')})`);
  G.__c288.aiming = false; }
ok(!G.__vm.err && !G.__fpa.err && !G.__c322.err, 'no errors ' + (G.__vm.err || G.__fpa.err || G.__c322.err || ''));
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
