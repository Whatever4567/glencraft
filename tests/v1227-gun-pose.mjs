// v1.2.27: the real gun model is fitted onto the procedural one (C322 swap: size, offset, sight point) the moment it is swapped in.
// That fit measured boxes by pushing each box through the world matrix and back, which grows the box whenever the gun is turned in the
// world, so the fit depended on where you were looking and on the hand pose left by the previous gun. Found in the real page (headless
// Chrome, software rendering): the same pistol settled up to 11 cm away from its usual spot after a rifle to pistol switch.
// Here: the real hand chain (tests/lib/hands-harness.mjs, real THREE, real C322 swap and C350 viewmodel) swaps the same gun under
// different view turns and prior hand poses; the fit and the settled spot must not change.
import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera);
const fr = k => { for (let i = 0; i < k; i++) H.frame(1 / 60, false); };
const settle = () => { const g = H.held.children[0]; G.scene.updateMatrixWorld(true); const p = g.getWorldPosition(new T.Vector3()); G.camera.worldToLocal(p); return p; };
const fit = (id, setup) => { H.setSel(PICK); fr(5); if (setup) setup(); H.set('heldId', -1); H.setSel(id); fr(2); const u = H.held.children[0].userData; const last = Object.assign({}, G.__c322.last);
  G.camera.rotation.set(0, 0, 0); fr(90); const p = new T.Vector3(); for (let i = 0; i < 251; i++) { fr(1); p.add(settle()); }   // averaged over one breathing cycle (4.2 s)
  return {c322: !!u.c322, sight: u.muzzle.position.clone(), last, p: p.divideScalar(251)}; };
for (const [nm, id] of [['pistol', IT.PISTOL], ['rifle', IT.MUSKET]]) {
  const a = fit(id), cases = [['looking right and down', () => G.camera.rotation.set(-0.6, 0.8, 0, 'YXZ')], ['looking up', () => G.camera.rotation.set(1.1, -0.3, 0, 'YXZ')],
    ['after the other gun (its hand pose)', () => { H.setSel(id === IT.PISTOL ? IT.MUSKET : IT.PISTOL); fr(60); H.set('selId', PICK); }]];
  for (const [cn, f] of cases) { const b = fit(id, f), ds = a.sight.distanceTo(b.sight), dp = a.p.distanceTo(b.p);
    ok(a.c322 && b.c322 && ds < 1e-4 && Math.abs(a.last.k - b.last.k) < 1e-3 && dp < 0.001, nm + ' swapped in ' + cn + ': same fit (muzzle point moved ' + (ds * 1000).toFixed(1) + ' mm, size ' + a.last.k + ' vs ' + b.last.k + ') and same settled spot (' + (dp * 1000).toFixed(1) + ' mm)'); } }
ok(!G.__c322.err, 'no swap errors');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
