// v1.2.26: weapon switching in first person through the real hand chain (tests/lib/hands-harness.mjs: setHeld, C43, C71, C145, C322 swap,
// GRIP1222, FPA, C350 viewmodel). After every switch sequence the new gun must be attached under the camera, visible, all its parts
// visible, at the same spot and scale as when it is held calmly. The reload clear on switch (GLX-RL: a reload stops when the gun changes)
// is applied here the same way the game does it, since that block is not in the harness. Also the C322 download retry (sliced on its own).
import fs from 'node:fs'; import {make} from './lib/hands-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const {G, H, IT, PICK} = await make(); const T = G.THREE; G.scene.add(G.camera);
const st = () => { const g = H.held.children[0]; if (!g) return {vis: false, att: false, meshVis: 0, s: 0}; let o = g, vis = true, att = false; while (o) { if (!o.visible) vis = false; if (o === G.camera) { att = true; break; } o = o.parent; }
  G.scene.updateMatrixWorld(true); const p = g.getWorldPosition(new T.Vector3()); G.camera.worldToLocal(p); let meshVis = 0; g.traverse(m => { if (m.isMesh && m.visible) meshVis++; }); return {vis, att, meshVis, p, s: g.getWorldScale(new T.Vector3()).x}; };
const fr = (k, f) => { for (let i = 0; i < k; i++) { if (f) f(i); const sel = H.get('selId'); if (G.__rl && G.__rl.t > 0 && G.__rl.id !== sel) { G.__rl.t = 0; H.cancelRl(); } else if (G.__rl && G.__rl.t > 0) G.__rl.t = Math.max(0, G.__rl.t - 1 / 60);
  G.__c340.k = G.__vm && G.__vm.k != null ? +G.__vm.k : 0; H.frame(1 / 60, false); } };
const ref = {}; for (const id of [IT.PISTOL, IT.MUSKET]) { H.setSel(id); fr(90); ref[id] = st(); }
const RL = id => { G.__rl = G.window.__rl = {t: G.GUN[id].rl, dur: G.GUN[id].rl, id}; H.startRl(id); };
const seqs = [
  ['pistol to rifle', () => { H.setSel(IT.PISTOL); fr(30); H.setSel(IT.MUSKET); return IT.MUSKET; }], ['rifle to pistol', () => { H.setSel(IT.MUSKET); fr(30); H.setSel(IT.PISTOL); return IT.PISTOL; }],
  ['10 switches, one a frame', () => { for (let i = 0; i < 10; i++) { H.setSel(i % 2 ? IT.PISTOL : IT.MUSKET); fr(1); } return IT.PISTOL; }], ['10 switches, every 3 frames', () => { for (let i = 0; i < 10; i++) { H.setSel(i % 2 ? IT.MUSKET : IT.PISTOL); fr(3); } return IT.MUSKET; }],
  ['mid reload pistol to rifle', () => { H.setSel(IT.PISTOL); fr(20); RL(IT.PISTOL); fr(30); H.setSel(IT.MUSKET); return IT.MUSKET; }], ['mid reload rifle to pistol', () => { H.setSel(IT.MUSKET); fr(20); RL(IT.MUSKET); fr(60); H.setSel(IT.PISTOL); return IT.PISTOL; }],
  ['reload, pick, pistol', () => { H.setSel(IT.PISTOL); RL(IT.PISTOL); fr(20); H.setSel(PICK); fr(20); H.setSel(IT.PISTOL); return IT.PISTOL; }],
  ['aiming rifle to pistol', () => { H.setSel(IT.MUSKET); fr(10); G.rmb = true; fr(30); H.setSel(IT.PISTOL); fr(5); G.rmb = false; return IT.PISTOL; }], ['aiming pistol to rifle', () => { H.setSel(IT.PISTOL); G.__c288.aiming = true; fr(30); H.setSel(IT.MUSKET); fr(5); G.__c288.aiming = false; return IT.MUSKET; }],
  ['fire then switch', () => { H.setSel(IT.MUSKET); fr(5); G.__c340.shots++; H.kick(); fr(2); H.setSel(IT.PISTOL); return IT.PISTOL; }], ['swinging pick to rifle', () => { H.setSel(PICK); fr(5); H.swing('chop'); fr(4); H.setSel(IT.MUSKET); return IT.MUSKET; }],
  ['empty hand to pistol', () => { H.setSel(0); fr(10); H.setSel(IT.PISTOL); return IT.PISTOL; }], ['gun, empty, rifle quickly', () => { H.setSel(IT.PISTOL); fr(3); H.setSel(0); fr(2); H.setSel(IT.MUSKET); return IT.MUSKET; }],
  ['4 switches with the inventory open', () => { H.setSel(IT.PISTOL); fr(10); G.menuOpen = true; for (let i = 0; i < 4; i++) { H.setSel(i % 2 ? IT.PISTOL : IT.MUSKET); fr(5); } G.menuOpen = false; return IT.PISTOL; }],
  ['switch while the hand is hidden', () => { H.setSel(IT.PISTOL); fr(10); H.hand.visible = false; H.setSel(IT.MUSKET); fr(10); H.hand.visible = true; return IT.MUSKET; }],
  ['held item rebuilt for the same gun (respawn timers)', () => { H.setSel(IT.MUSKET); fr(20); H.set('heldId', -1); H.setSel(IT.MUSKET); return IT.MUSKET; }],
  ['rifle model arrives 1 s late', () => { H.setSel(IT.PISTOL); fr(10); const m = G.MOD.rifle; delete G.MOD.rifle; H.setSel(IT.MUSKET); fr(60); G.MOD.rifle = m; return IT.MUSKET; }]];
for (const [name, f] of seqs) { const id = f(); fr(45); const s = st(), d = s.p ? s.p.distanceTo(ref[id].p) : 9;
  ok(s.vis && s.att && s.meshVis >= ref[id].meshVis && d < 0.01 && Math.abs(s.s - ref[id].s) < 1e-3, name + ': gun shown, in place (' + (d * 1000).toFixed(1) + ' mm off, scale ' + s.s.toFixed(3) + ', ' + s.meshVis + ' parts)'); }
ok(!G.__c322.err && !G.__fpa.err, 'no errors in the hand chain');
// download failed: before v1.2.26 the gun stayed hidden for good; now the built in gun shows while the download is retried
{ H.setSel(IT.PISTOL); fr(10); const m = G.MOD.rifle; delete G.MOD.rifle; G.__c322.fail = {rifle: 1}; let asked = 0; G.__c322.load = () => { asked++; }; H.setSel(IT.MUSKET); fr(120); const s = st();
  ok(s.vis && s.att && s.meshVis > 0 && asked > 0, 'rifle download failed: its built in gun is shown (' + s.meshVis + ' parts) and the download is asked for again'); G.MOD.rifle = m; G.__c322.fail = {}; fr(30); const s2 = st();
  ok(s2.vis && H.held.children[0].userData.c322, 'when the real rifle arrives it replaces the built in one'); }
// the C322 loader on its own: a failed download is retried after a wait, not given up
{ const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'); const i = html.indexOf('  function load(n) { if (want[n]'), j = html.indexOf('  U.load = load;', i);
  let now = 0, tries = 0, okOn = 2; const U = {fail: {}, next: {}, ok: {}}, MOD = {}, want = {}; const errs = [];
  const lib = () => { tries++; return tries >= okOn ? Promise.resolve() : Promise.reject(new Error('net')); };
  const THREE = {GLTFLoader: class { setMeshoptDecoder() {} load(u, res) { res({scene: {traverse() {}}}); } }};
  const load = new Function('U', 'MOD', 'want', 'lib', 'THREE', 'MeshoptDecoder', 'performance', 'ERR', 'BASE', 'RES', 'VER', html.slice(i, j) + '; return load;')(U, MOD, want, lib, THREE, {}, {now: () => now}, (w, e) => errs.push(w), '', '2k', '');
  load('rifle'); await new Promise(r => setTimeout(r, 5)); const f1 = U.fail.rifle, w1 = U.next.rifle; load('rifle'); const t2 = tries; now = 2500; load('rifle'); await new Promise(r => setTimeout(r, 5));
  ok(f1 === 1 && w1 === 2000 && t2 === 1 && tries === 2 && MOD.rifle && U.fail.rifle === 0, 'C322 loader: a failed download waits 2 s, then is tried again and succeeds (tries ' + tries + ')'); }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
