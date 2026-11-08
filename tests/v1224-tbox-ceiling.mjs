// v1.2.24: the time box room has a ceiling. Runs the REAL shipped base (step, readPad, updatePlayer with moveY/walk/swim, render,
// placeCamera, keyboard handlers), the real jetpack (C102J + EQ1222 wrappers) and the real TBOX..CAB1222 chain, with a standard
// controller pad (tests/lib/tbox-chain.mjs, opt.real). Stand ins still: flat world solid, menus/sounds/mobs as no ops.
// Bug (user report: bob outside and fall out): walls() kept you inside the round room sideways but had no top, so a jetpack or
// creative flight lifted you 21 blocks up through the 8.8 high room, outside the box, then you fell back.
import {make} from './lib/tbox-chain.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const RH = 8.8, TOP = RH - 1.8;
const boot = (o = {}) => { const H = make({real: 1, ...o}); const G = H.G, T = H.T(), F = H.F(), P = G.P, CZ = T.HW - T.RR; T.place(40.5, 10, 40.5); T.S.on = true; T.inside = true; P.x = T.S.x; P.y = T.S.y; P.z = T.S.z + CZ + 2; H.padSet(); for (let i = 0; i < 30; i++) H.frame(); return {H, G, T, F, P, CZ}; };
const hold = (o, btn, n, axes = [0, 0, 0, 0]) => { let mx = -9; for (let i = 0; i < n; i++) { o.H.padSet(axes, btn); o.H.frame(); mx = Math.max(mx, o.P.y - o.T.S.y); } return mx; };
{ const o = boot(); ok(o.H.errs.length === 0, 'real base + jetpack + time box chain load with no errors'); const mx = hold(o, [0], 90); ok(mx > 1 && mx < 1.6, 'no jetpack: A is a normal jump inside the room (max ' + mx.toFixed(2) + ')'); }
{ const o = boot({armour: [0, 0, 0, 0, 291]}); const mx = hold(o, [0], 180); ok(mx <= TOP + 0.01, 'jetpack: holding A stops at the ceiling (max ' + mx.toFixed(2) + ', top ' + TOP + ')'); ok(o.T.inside, 'still inside'); hold(o, [], 240); ok(Math.abs(o.P.y - o.T.S.y) < 0.05, 'let go: glide back to the floor (dy ' + (o.P.y - o.T.S.y).toFixed(2) + ')'); }
{ const o = boot(); o.G.MODE.fly = true; o.G.flying = true; const mx = hold(o, [0], 180); ok(mx <= TOP + 0.01, 'creative flight: A up stops at the ceiling (max ' + mx.toFixed(2) + ')'); }
{ const o = boot({armour: [0, 0, 0, 0, 291]}); hold(o, [2], 6); ok(o.F.pilot, 'controller X at the console flies'); let off = 0; for (const [b, ax, n] of [[[0], [0, 0, 0, 0], 120], [[7, 10], [0, -1, 0.6, 0], 120], [[1], [0, 0, 0, 0], 200]]) for (let i = 0; i < n; i++) { o.H.padSet(ax, b); o.H.frame(); off = Math.max(off, Math.hypot(o.P.x - o.T.S.x, o.P.y - o.T.S.y, o.P.z - (o.T.S.z + o.CZ + 2))); }
  ok(off < 1e-6, 'controller flight with a jetpack on (A up, RT, L3 boost, right stick turn, B down): on the seat every frame (max off ' + off.toFixed(4) + ')'); hold(o, [2], 6); ok(!o.F.pilot, 'X lets go'); const mx = hold(o, [0], 180); ok(mx <= TOP + 0.01 && o.T.inside, 'A held with a jetpack after letting go: ceiling holds (max ' + mx.toFixed(2) + ')'); }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
