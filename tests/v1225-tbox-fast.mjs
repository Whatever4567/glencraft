// v1.2.25: time box flown fast (user t981u: flying fast throws me out, the stick and arms are not connected like the first time).
// Real TBOX..CAB1222 chain (+ real base step and jetpack with REAL=1) through tests/lib/tbox-chain.mjs with draw passes: scene.onBeforeRender,
// world matrices, scene.onAfterRender (draws the room scene TS). Measures, in the room pass the player actually sees, where both hands
// are against the T bar on the stick (real THREE matrices), and whether you stay on the seat inside the room every frame.
import {make} from './lib/tbox-chain.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const real = !!process.env.REAL;
function boot(o = {}) { const H = make({passes: 1, real: real ? 1 : 0, ...o}); const G = H.G, T = H.T(), F = H.F(), P = G.P, CZ = T.HW - T.RR; T.place(40.5, 10, 40.5); T.S.on = true; T.inside = true;
  P.x = T.S.x; P.y = T.S.y; P.z = T.S.z + CZ + 2; if (real) H.padSet(); for (let i = 0; i < 20; i++) H.frame(); return {H, G, T, F, P, CZ}; }
const THREE = await import('/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js');
function measure(o) { const C = o.G.__cab1221, TS = o.T.parts.TS, v = new THREE.Vector3(); let gap = 0, n = 0;
  o.G.onPass = (s) => { if (s !== TS || !C || !C.piloting()) return; const p = o.G.__v130.parts(); const bar = p.stick.children.find(c => c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.34); if (!bar) return;
    const hands = TS.children.filter(c => c.isGroup && c.visible && c !== o.T.parts.room && c.children.length === 7); for (const h of hands) { let best = 9; for (const sd of [-1, 1]) { v.set(0, sd * 0.12, 0).applyMatrix4(bar.matrixWorld); best = Math.min(best, v.distanceTo(h.position)); } gap = Math.max(gap, best); n++; } };
  return () => ({gap, n}); }
const fly = (o, keys, frames, dt) => { for (const k of keys) o.H.key(k, 1); let off = 0, out = 0; for (let i = 0; i < frames; i++) { o.H.frame(dt); const s = [o.T.S.x, o.T.S.y, o.T.S.z + o.CZ + 2]; off = Math.max(off, Math.hypot(o.P.x - s[0], o.P.y - s[1], o.P.z - s[2])); if (!o.T.inside) out++; } for (const k of keys) o.H.key(k, 0); return {off, out}; };
const o = boot(); ok(o.H.errs.length === 0, 'chain loads with draw passes (' + o.H.errs.join('; ') + ')');
o.F.toggle(); ok(o.F.pilot, 'flying');
const m = measure(o);
fly(o, [], 30, 1 / 60); const still = m(); ok(still.n > 0 && still.gap < 0.01, 'hovering: both hands on the T bar ends (worst ' + still.gap.toFixed(3) + ' m over ' + still.n + ' hand draws)');
for (const [name, keys, frames, dt] of [['forward', ['KeyW'], 180, 1 / 60], ['climb high and fast', ['KeyW', 'Space'], 400, 1 / 60], ['fast, low fps (10)', ['KeyW'], 60, 0.1]]) {
  const m2 = measure(o); const r = fly(o, keys, frames, dt); const g = m2(); const v = Math.hypot(...o.F.v);
  ok(g.gap < 0.01, name + ': hands stay on the T bar in the drawn room (worst gap ' + g.gap.toFixed(3) + ' m, speed now ' + v.toFixed(0) + ' blocks/s)');
  ok(r.off < 1e-6 && r.out === 0, name + ': on the seat inside the room every frame (max off ' + r.off.toFixed(4) + ', frames outside ' + r.out + ')'); }
// full stick deflection both ways (A / D turn, arrow up / down pitch): stick leans, hands stay on the bar, each forearm ends at its wrist
{ const m3 = measure(o); let arm = 0; const TS = o.T.parts.TS, v = new THREE.Vector3();
  const prev = o.G.onPass; o.G.onPass = (s, c) => { prev(s, c); if (s !== TS || !o.G.__cab1221.piloting()) return; const arms = TS.children.filter(a => a.isGroup && a.visible && a.children.length === 2); const hands = TS.children.filter(a => a.isGroup && a.visible && a !== o.T.parts.room && a.children.length === 7);
    for (const a of arms) { const L = a.children[0].scale.y; v.set(0, L, 0).applyQuaternion(a.quaternion).add(a.position); let best = 9; for (const h of hands) { const w = h.position.clone().add(new THREE.Vector3(0, -0.01, 0.12).applyQuaternion(o.G.camera.quaternion)); best = Math.min(best, v.distanceTo(w)); } arm = Math.max(arm, best); } };
  let lean = 0; for (const keys of [['KeyA', 'ArrowUp'], ['KeyD', 'ArrowDown'], ['KeyA', 'ArrowDown', 'KeyW'], ['KeyD', 'ArrowUp', 'KeyW']]) { for (const k of keys) o.H.key(k, 1); for (let i = 0; i < 40; i++) { o.H.frame(1 / 60); const st = o.G.__v130.parts().stick; lean = Math.max(lean, Math.abs(st.rotation.x), Math.abs(st.rotation.z)); } for (const k of keys) o.H.key(k, 0); }
  const g = m3(); ok(lean > 0.4 && g.gap < 0.01, 'full stick deflection (lean up to ' + lean.toFixed(2) + ' rad): hands stay on the T bar (worst ' + g.gap.toFixed(3) + ' m)');
  ok(arm < 0.005, 'each forearm ends at its wrist on the hand (worst ' + arm.toFixed(4) + ' m)'); o.G.onPass = prev; }
// cruise speed high up (boost on the pad): hands still on the bar
{ const q = boot(); q.G.navigator.getGamepads = () => [q.G.pad]; q.T.place(40.5, 1700, 40.5); q.P.x = q.T.S.x; q.P.y = q.T.S.y; q.P.z = q.T.S.z + q.CZ + 2; q.F.toggle(); const mq = measure(q); q.H.padSet([0, -1, 0, 0], [10]);
  let off = 0; for (let i = 0; i < 240; i++) { q.H.frame(1 / 60); off = Math.max(off, Math.hypot(q.P.x - q.T.S.x, q.P.z - (q.T.S.z + q.CZ + 2))); } const g = mq();
  ok(Math.hypot(...q.F.v) > 600 && g.gap < 0.01 && off < 1e-6, 'cruise high up with boost (' + Math.hypot(...q.F.v).toFixed(0) + ' blocks/s): hands on the bar (worst ' + g.gap.toFixed(3) + ' m), on the seat'); }
// flying into the UK barrier (real GLX-UKB block in the chain): the seat is 6.35 blocks north of the box
for (const [name, axes, btn, y, dt] of [['north edge, boost', [0, -1, 0, 0], [10], 100, 1 / 60], ['north edge, low fps', [0, -1, 0, 0], [10], 100, 0.1], ['north edge, slow', [0, -1, 0, 0], [], 30, 1 / 60]]) {
  const q = boot({ukb: 1}); q.G.navigator.getGamepads = () => [q.G.pad]; const U = q.G.__ukb; U.X0 = -5000; U.X1 = 5000; U.Z0 = name.endsWith('slow') ? -20 : -2000; U.Z1 = 5000;
  q.T.place(40.5, y, 40.5); q.P.x = q.T.S.x; q.P.y = q.T.S.y; q.P.z = q.T.S.z + q.CZ + 2; q.F.toggle(); q.H.padSet(axes, btn);
  let off = 0, out = 0; for (let i = 0; i < 2500; i++) { q.H.frame(dt); off = Math.max(off, Math.hypot(q.P.x - q.T.S.x, q.P.z - (q.T.S.z + q.CZ + 2))); if (!q.T.inside || !q.F.pilot) out++; }
  ok(q.T.S.z >= U.Z0 && q.T.S.z < U.Z0 + 3, name + ': the box stops at the barrier (box z ' + (q.T.S.z - U.Z0).toFixed(2) + ' past the line)');
  ok(off < 1e-6 && out === 0, name + ': you stay on the seat in the room (max off ' + off.toFixed(2) + ' blocks, frames out ' + out + ')'); }
// walking out of a parked box at the edge: the barrier still holds you once you are outside
{ const q = boot({ukb: 1}); const U = q.G.__ukb; U.X0 = -5000; U.X1 = 5000; U.Z0 = 30; U.Z1 = 5000; q.T.inside = false; q.P.x = 40.5; q.P.z = 20; q.P.y = 10; q.H.frame(); ok(q.P.z >= U.Z0 + 1.5 - 1e-9, 'outside the box past the line: still pushed back in (z ' + q.P.z.toFixed(2) + ')'); }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
