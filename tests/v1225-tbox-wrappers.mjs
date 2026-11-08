// v1.2.25: the time box flown fast with the OTHER shipped wrappers that move the player in the chain (user t981u / t982u: flying fast throws
// me out, bigger on the inside cannot handle me flying). Real blocks sliced from index.html through tests/lib/tbox-chain.mjs:
// C283 (never stuck inside a block: moves the player out of solid blocks), C317 (space box: clamps the player 2.5 inside its walls),
// C321 (planet frame: wraps solid and updatePlayer after 3 s), then the TBOX..CAB1222 chain. Stand ins: flat ground, a rock wall, and the
// stand in base step (see the lib). Not covered here: landed on a voxel body (Moon / Mars, C321 with a body set), the UFO, real GPU drawing.
import {make} from './lib/tbox-chain.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const PRE = ['C283', 'C317', 'C321'];
function boot(o = {}, x = 1000.5, y = 400, z = 40.5) { const H = make({passes: 1, pre: PRE, ...o}); for (let i = 0; i < 5; i++) H.frame(1);   // the 3 s setTimeout wrappers install
  const G = H.G, T = H.T(), F = H.F(), P = G.P, CZ = T.HW - T.RR; T.place(x, y, z); T.S.on = true; T.inside = true; P.x = T.S.x; P.y = T.S.y; P.z = T.S.z + CZ + 2; for (let i = 0; i < 20; i++) H.frame();
  G.navigator.getGamepads = () => [G.pad]; return {H, G, T, F, P, CZ}; }
const seatOff = o => Math.hypot(o.P.x - o.T.S.x, o.P.y - o.T.S.y, o.P.z - (o.T.S.z + o.CZ + 2));
function fly(o, axes, btn, secs, dt, keys = []) { o.F.toggle(); o.H.padSet(axes, btn); for (const k of keys) o.H.key(k, 1); let off = 0, out = 0, v = 0;
  for (let i = 0; i < Math.round(secs / dt); i++) { o.H.frame(dt); off = Math.max(off, seatOff(o)); if (!o.T.inside || !o.F.pilot) out++; v = Math.max(v, Math.hypot(...o.F.v)); }
  for (const k of keys) o.H.key(k, 0); o.H.padSet(); return {off, out, v}; }
{ const o = boot(); ok(o.H.errs.length === 0 && o.G.__c283 && o.G.__c317 && o.G.__c321 && o.G.__c317.on(), 'C283, C317 (space box on), C321 and the time box chain load together (' + o.H.errs.join('; ') + ')'); }
// C283 is live in this chain: outside the box, standing inside rock, it lifts you out
{ const o = boot({rock: (x, y, z) => z > 44 && z < 60 && y < 40}, 40.5, 10, 10.5); o.T.inside = false; o.P.x = 40.5; o.P.y = 20; o.P.z = 50.5; const u0 = o.G.__c283.unstuck; o.H.frame();
  ok(o.G.__c283.unstuck > u0, 'C283 live: outside the box, inside rock, it moves you (unstuck ' + u0 + ' -> ' + o.G.__c283.unstuck + ')'); }
// flown into a rock wall at speed: the box stops, the seat ends up inside the rock, C283 must not grab you
{ const o = boot({rock: (x, y, z) => z < 400 && z > 200 && y < 300}, 1000.5, 106, 600.5); const u0 = o.G.__c283.unstuck; const r = fly(o, [0, -1, 0, 0], [10], 10, 1 / 60);
  ok(o.T.S.z > 400 && o.T.S.z < 412 && o.P.z < 400 && r.off < 1e-6 && r.out === 0 && o.G.__c283.unstuck === u0, 'boost into a rock wall (' + r.v.toFixed(0) + ' blocks/s, box z ' + o.T.S.z.toFixed(1) + ', seat z ' + o.P.z.toFixed(1) + ' in the rock): on the seat every frame, C283 untouched (max off ' + r.off.toFixed(3) + ', frames out ' + r.out + ')'); }
// the space box wall: before this fix the clamp pulled the pilot out (1102 of 1200 frames out at 60 fps, 184 of 200 at 10 fps)
for (const [name, dt, keys] of [['60 fps', 1 / 60, []], ['10 fps', 0.1, []]]) {
  const o = boot(); const L = o.G.__c317.L, Z0 = (o.G.D >> 1) - L; o.T.place(1000.5, 400, Z0 + 300); o.P.x = o.T.S.x; o.P.y = o.T.S.y; o.P.z = o.T.S.z + o.CZ + 2; o.H.frame();
  const r = fly(o, [0, -1, 0, 0], [10], 20, dt, keys);
  ok(r.off < 1e-6 && r.out === 0, 'space box -z wall, boost, ' + name + ': on the seat inside the room every frame (max off ' + r.off.toFixed(3) + ', frames out ' + r.out + ', box ' + (o.T.S.z - Z0).toFixed(1) + ' from the wall, ' + r.v.toFixed(0) + ' blocks/s)');
  ok(o.T.S.z - Z0 > 0, 'space box -z wall, ' + name + ': the box itself still stays inside space (' + (o.T.S.z - Z0).toFixed(1) + ')');
  if (!keys.length) { // intended exit still works there: stop flying, walk out of the door; outside, the space wall holds you again
    o.F.toggle(); for (let i = 0; i < 5; i++) o.H.frame(); const pilotOff = !o.F.pilot; o.P.x = o.T.S.x; o.P.z = o.T.S.z + 0.5; o.P.y = o.T.S.y; o.H.frame(); o.P.z = o.T.S.z + o.T.HW + 0.1; o.H.frame(); o.H.frame();
    ok(pilotOff && !o.T.inside, 'space box wall, ' + name + ': stop flying and walk out of the door, you are outside (inside ' + o.T.inside + ')');
    o.P.z = Z0 - 5; o.H.frame(); ok(o.P.z >= Z0 + 2.5 - 1e-9, 'space box wall, ' + name + ': outside the box past the wall you are still clamped back in (z ' + (o.P.z - Z0).toFixed(2) + ' from the wall)'); } }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
