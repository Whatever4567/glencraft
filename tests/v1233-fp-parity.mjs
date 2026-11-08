// v1.2.33 local: the first person HD arms (FPA, through the real hand chain) wear the same skin and linen shirt as the released third
// person player (TP-HD builder), with grips, fingers, weapon switch and armour sleeves unchanged.
import {make} from './lib/hands-harness.mjs'; import {load} from './lib/tph-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const file = new URL('../index.html', import.meta.url).pathname, B = load(file), tp = B.build(false);
const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera); G.__tph = G.window.__tph = B.U;
const fr = k => { for (let i = 0; i < k; i++) H.frame(1 / 60, false); };
H.setSel(PICK); fr(10); const R = G.__fpa.rig(); ok(!!R, 'first person HD arms built');
let tpSkin = null, tpShirt = null; tp.userData.fore[1].traverse(o => { if (o.isMesh && !tpSkin && o.material.roughness === 0.48 && !o.material.map) tpSkin = o.material; }); tp.userData.arms[1].traverse(o => { if (o.isMesh && !tpShirt && o.material.roughness === 0.88) tpShirt = o.material; });
const A = R.userData.R.userData.p, fs0 = A.h.children[0].material, sl = A.up.material;
const hex = m => m.color.getHexString();
ok(tpSkin && hex(fs0) === hex(tpSkin) && fs0.roughness === tpSkin.roughness && fs0.metalness === tpSkin.metalness, `hand and forearm skin match third person: FP ${hex(fs0)} r${fs0.roughness} m${fs0.metalness} vs TP ${tpSkin && hex(tpSkin)} r${tpSkin && tpSkin.roughness}`);
ok(A.fo.material === fs0, 'forearm, palm and fingers share one skin material');
ok(tpShirt && !!sl.map && !!sl.bumpMap && sl.roughness === tpShirt.roughness && sl.bumpScale === tpShirt.bumpScale, `sleeve is the third person linen: map ${!!sl.map} bump ${!!sl.bumpMap} r${sl.roughness} vs TP r${tpShirt && tpShirt.roughness}`);
ok(sl.map === tpShirt.map, 'sleeve shares the third person linen texture (no second copy)');
let mats = new Set(); R.traverse(o => { if (o.isMesh) mats.add(o.material); }); ok(mats.size === 2, 'arm rig uses exactly 2 materials (skin, sleeve): ' + mats.size);
// grips, fingers and weapon switching still work
for (const [nm, id] of [['pistol', IT.PISTOL], ['rifle', IT.MUSKET], ['pick', PICK]]) { H.setSel(id); fr(60); const h = R.userData.R.userData.p.h, J = h.userData.f.map(([f, k]) => [f.rotation.x, k.rotation.x]); ok(J.every(([a, b]) => isFinite(a + b) && b > 0.1) && isFinite(h.position.x + h.position.y + h.position.z), nm + ' grip valid after switch (' + J.map(j => j.map(v => v.toFixed(2)).join('/')).join(' ') + ')'); }
ok(G.__fpa.rig() === R && G.camera.children.filter(c => c === R).length === 1, 'one arm rig after switches, no duplicate');
G.camMode = 1; fr(5); ok(!R.visible || !G.hand.visible, 'third person hides the first person arms'); G.camMode = 0; H.setSel(IT.PISTOL); fr(20); ok(R.visible, 'back in first person the arms show again');
ok(!G.__fpa.err && !G.__vm.err && !B.U.err, 'no errors (' + (G.__fpa.err || G.__vm.err || B.U.err || '') + ')');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
