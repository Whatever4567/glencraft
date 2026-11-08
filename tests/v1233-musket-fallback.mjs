// v1.2.33 local: the first person musket/pistol while the real GLB is pending, stalled, failed or arrives late, through the real chain
// (C322 swap, C350 viewmodel step and its renderer.render wrapper, FPA) with a spy renderer that checks what each pass would draw
// (scene membership, every ancestor visible, layers, per-mesh frustum with that pass camera, material, near plane).
import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
let cur = null, rec = null;
const {G, H, IT} = await make({render: (sc, cam) => { if (cur) rec.push(drawn(sc, cam, cur)); }}); const T = G.THREE; G.scene.add(G.camera);
function drawn(sc, cam, g) { sc.updateMatrixWorld(true); cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert(); cam.updateProjectionMatrix();
  const fr = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); let inSc = false; for (let a = g; a; a = a.parent) if (a === sc) inSc = true; if (!inSc) return 0;
  let k = 0; sc.traverseVisible(o => { if (!o.isMesh) return; let u = false; for (let a = o; a; a = a.parent) if (a === g) u = true; if (!u) return; const m = [].concat(o.material)[0]; if (!o.layers.test(cam.layers) || (o.frustumCulled && !fr.intersectsObject(o)) || !m || m.visible === false || m.opacity <= 0.01) return;
    const b = new T.Box3().setFromObject(o).applyMatrix4(cam.matrixWorldInverse); if (-b.min.z < cam.near) return; k++; }); return k; }
const step = () => { H.frame(1 / 60, false); const g = H.held.children[0]; cur = g && g.userData.gun ? g : null; rec = []; G.renderer.render(G.scene, G.camera); return {g: cur, drawn: rec.reduce((a, b) => a + b, 0), real: !!(cur && cur.userData.c322), id: cur && cur.userData.gun}; };
const run = k => { const out = []; for (let i = 0; i < k; i++) out.push(step()); return out; };
const MODK = {rifle: G.MOD.rifle, pistol: G.MOD.pistol}; const hide = n => { delete G.MOD[n]; }, give = n => { G.MOD[n] = MODK[n]; };
G.__c288.aiming = true;
// 1. stalled: rifle never arrives, no failure flagged
hide('rifle'); H.setSel(IT.MUSKET); const A = run(300), blank = A.filter(r => !r.drawn).length; ok(blank <= 40, `stalled download, aiming 5 s: frames with no musket drawn ${blank}/300`);
// 2. late arrival: hot swap to the real model, then drawn
give('rifle'); const B = run(60); const sw = B.findIndex(r => r.real); ok(sw >= 0 && B.slice(sw + 2).every(r => r.real && r.drawn > 0), `late arrival: real model in after ${sw + 1} frames, drawn every frame after its warm up (${B.slice(sw).filter(r => !r.drawn).length} blank)`);
ok(H.held.children.length === 1, 'one held object after the swap (no leftover built in gun): ' + H.held.children.length);
// 3. failed download flagged
H.setSel(998); run(5); hide('rifle'); G.__c322.fail = G.window.__c322.fail = {rifle: 1}; H.held.children.length; H.setSel(IT.MUSKET); const C = run(60); ok(C.filter(r => !r.drawn).length <= 40, 'failed download: frames with no musket drawn ' + C.filter(r => !r.drawn).length + '/60'); G.__c322.fail = {}; give('rifle'); run(30);
// 4. switching while pending: musket (pending) -> pistol (loaded) -> food -> musket; the pistol stays real and the late rifle does not land on it
hide('rifle'); H.setSel(IT.MUSKET); run(20); H.setSel(IT.PISTOL); const D = run(40); ok(D.slice(5).every(r => r.id === IT.PISTOL && r.real && r.drawn), 'pistol while the rifle is pending: real pistol drawn (' + D.slice(5).filter(r => !r.drawn).length + ' blank)');
give('rifle'); const D2 = run(20); ok(D2.every(r => r.id === IT.PISTOL && r.real), 'rifle arriving late does not replace or hide the pistol');
H.setSel(998); run(10); H.setSel(IT.MUSKET); const E = run(60); ok(E.slice(5).every(r => r.id === IT.MUSKET && r.real && r.drawn), 'back to the musket: the real rifle, drawn');
// 5. rapid toggles aim / switch with everything loaded
let bl = 0, tot = 0; for (let c = 0; c < 20; c++) { G.__c288.aiming = c % 2 === 0; H.setSel(c % 3 ? IT.MUSKET : IT.PISTOL); const R = run(6); tot += R.length; bl += R.filter(r => !r.drawn).length; } ok(bl <= 40, `rapid aim and weapon toggles: ${bl}/${tot} blank frames (one warm up frame per real model switch, by design)`);
ok(!G.__vm.err && !G.__fpa.err && !G.__c322.err, 'no errors ' + (G.__vm.err || G.__fpa.err || G.__c322.err || ''));
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
