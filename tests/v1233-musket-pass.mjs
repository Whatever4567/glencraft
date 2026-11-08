// v1.2.33 local: the musket and pistol through the game's own viewmodel render override (C350 renderer.render wrapper) with a spy renderer:
// per draw call, the gun meshes the real three renderer would draw (traverseVisible, layers, frustum culling with the pass camera's
// bounding sphere test, material visible/opacity/colorWrite) across hip, ADS hold/release, switching to food/pistol and back, and model swap timing.
import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
let calls = [], cur = null; const spy = (sc, cam) => { calls.push([sc, cam, cur ? drawn(sc, cam, cur) : null]); };
const {G, H, IT} = await make({render: (s, c) => spy(s, c)}); const T = G.THREE; G.scene.add(G.camera);
function drawn(sc, cam, g) { sc.updateMatrixWorld(true); if (cam.parent === null) cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  const fr = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); let inSc = false; for (let a = g; a; a = a.parent) if (a === sc) inSc = true; if (!inSc) return {inSc, n: 0, tot: 0};
  let nD = 0, tot = 0; const why = {}; g.traverse(o => { if (o.isMesh) tot++; }); const seen = new Set(); sc.traverseVisible(o => { if (!o.isMesh) return; let under = false; for (let a = o; a; a = a.parent) if (a === g) under = true; if (!under) return; seen.add(o);
    const m = [].concat(o.material)[0]; if (!o.layers.test(cam.layers)) { why.layer = (why.layer || 0) + 1; return; } if (o.frustumCulled && !fr.intersectsObject(o)) { why.cull = (why.cull || 0) + 1; return; } if (!m || m.visible === false || m.opacity <= 0.01 || m.colorWrite === false) { why.mat = (why.mat || 0) + 1; return; } nD++; });
  return {inSc, n: nD, tot, why, hid: tot - seen.size}; }
const log = []; const frame = tag => { H.frame(1 / 60, false); calls = []; const g = H.held.children[0]; cur = g && g.userData.gun ? g : null; G.renderer.render(G.scene, G.camera); if (!cur) return; const rec = {tag, swap: !!g.userData.c322, on: G.__vm.on, calls: calls.length};
  // the second call is the viewmodel pass (vs, vc); the first the world pass
  const vp = calls.find(([s]) => s === G.__vm.vs), wp = calls.find(([s]) => s === G.scene); rec.vm = vp ? vp[2] : null; rec.world = wp ? wp[2] : null; rec.after = H.hand.parent === G.camera; log.push(rec); };
const run = (k, tag) => { for (let i = 0; i < k; i++) frame(tag + i); };
for (const id of [IT.MUSKET, IT.PISTOL]) { H.setSel(id); run(40, 'hip'); G.__c288.aiming = true; run(80, 'ads'); G.__c288.aiming = false; run(20, 'rel'); for (let c = 0; c < 6; c++) { G.__c288.aiming = !G.__c288.aiming; run(7 + c, 'flick'); }
  G.__c288.aiming = true; H.setSel(998); run(6, 'food'); H.setSel(id); run(50, 'back'); H.setSel(id === IT.MUSKET ? IT.PISTOL : IT.MUSKET); run(3, 'oth'); H.setSel(id); run(50, 'back2'); G.__c288.aiming = false; run(10, 'end'); }
const st = log.filter(r => r.swap && r.on); const bad = st.filter(r => !r.vm || !r.vm.inSc || r.vm.n < 1 || r.vm.n < r.vm.tot - r.vm.hid);
ok(st.length > 300, 'frames with the real model and viewmodel on: ' + st.length + ' of ' + log.length);
const wl = st.filter(r => r.world && r.world.inSc); ok(!wl.length, 'gun not also drawn in the world pass (' + wl.length + ')');
ok(!bad.length, 'every such frame the viewmodel pass draws the gun meshes (bad ' + bad.length + (bad.length ? ': ' + JSON.stringify(bad.slice(0, 3)) : '') + ')');
const cut = st.filter(r => r.vm && r.vm.why && (r.vm.why.cull || r.vm.why.mat || r.vm.why.layer)); ok(!cut.length, 'no gun mesh lost to frustum culling, layers or material (' + cut.length + (cut.length ? ' ' + JSON.stringify(cut[0]) : '') + ')');
ok(log.every(r => r.after), 'hand and arms always back on the camera after the pass');
const off = log.filter(r => r.swap && !r.on).map(r => r.tag); ok(off.length <= 12, 'frames with the real model loaded but the viewmodel off: ' + off.length + ' (' + off.slice(0, 12).join(' ') + ')');
ok(!G.__vm.err && !G.__fpa.err && !G.__c322.err, 'no errors ' + (G.__vm.err || G.__fpa.err || G.__c322.err || ''));
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
