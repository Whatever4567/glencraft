// CPU previews of the actual first person rig (real hand chain) in several poses: whole view and a close up on the right hand.
import {make} from './lib/hands-harness.mjs'; import {load} from './lib/tph-harness.mjs'; import {render} from './lib/cpu-render.mjs';
const out = process.argv[2] || '/tmp/fpprev'; import fs from 'node:fs'; fs.mkdirSync(out, {recursive: true});
const B = load(new URL('../index.html', import.meta.url).pathname); const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera); G.__tph = G.window.__tph = B.U;
const fr = k => { for (let i = 0; i < k; i++) H.frame(1 / 60, false); }; const res = {};
const poses = [['empty', () => { H.setSel(999); }], ['food', () => { H.setSel(998); const t = new T.Mesh(new T.SphereGeometry(0.06, 16, 12), new T.MeshStandardMaterial({color: 0xc8a040})); H.held.add(t); }], ['pick', () => H.setSel(PICK)], ['pistol', () => H.setSel(IT.PISTOL)], ['musket', () => H.setSel(IT.MUSKET)]];
for (const [nm, f] of poses) { f(); fr(60); const R = G.__fpa.rig(); G.scene.updateMatrixWorld(true);
  res[nm] = render(T, G.camera, [G.camera], 480, 300, `${out}/${nm}-view.ppm`);
  const h = R.userData.R.userData.p.h, c = h.getWorldPosition(new T.Vector3()), cc = new T.PerspectiveCamera(30, 1.2, 0.01, 10); cc.position.copy(c).add(new T.Vector3(0.1, 0.12, 0.28)); cc.lookAt(c.clone().add(new T.Vector3(0, 0.04, 0))); G.scene.add(cc);
  res[nm].close = render(T, cc, [R], 480, 400, `${out}/${nm}-hand.ppm`); G.scene.remove(cc); }
console.log(JSON.stringify(res));
