// t1359: the pistol reload has a real magazine (GLX-PMAG1359). Runs the built patch against a stand-in pistol:
// the spent magazine drops free, a fresh one comes from the belt and is seated along the grip, the off hand target rides
// the fresh magazine, the slide is locked back and released on an empty reload, stays shut on a tactical one, and the
// flag puts the old reload back.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };
const a = html.indexOf('<script id="glx-pmag1359">'); ok(a > 0, 'GLX-PMAG1359 is in the build');
const src = html.slice(html.indexOf('>', a) + 1, html.indexOf('</script>', a));
ok(html.lastIndexOf('<script id="glx-pmag1359">') > html.indexOf('<script id="glx-fp1347"'), 'it loads after GB-7 (glx-fp1347)');
ok(/_pm1359 = rlId === IT\.PISTOL/.test(html) && html.includes('if (!_pm1359) { if (f0 < 0.25'), 'old C43 synth clicks are kept behind the flag');
ok(html.includes('U.rl2 = (isP, x) =>') && html.includes("phase: x < 0.1 ? 'release' : x < 0.25 ? 'mag out'"), 'old GS1222 pistol phases are kept (hidden, not deleted)');

// stand-in scene: camera > hand > held > gun g > rig > hold > {mag holder w > h > mesh, slide}
const IT = {PISTOL: 212, MUSKET: 213};
const camera = new T.PerspectiveCamera(70, 16 / 9, 0.01, 50); camera.position.set(0, 1.6, 0); camera.updateMatrixWorld(true);
const hand = new T.Group(); hand.position.set(0.15, -0.17, 0.03); camera.add(hand);
const held = new T.Group(); held.position.set(0, 0.04, -0.24); hand.add(held);
const g = new T.Group(); held.add(g); const rig = new T.Group(); g.add(rig); const hold = new T.Group(); rig.add(hold);
const frame = new T.Mesh(new T.BoxGeometry(0.03, 0.04, 0.19), new T.MeshBasicMaterial()); frame.name = 'service_pistol_pistol_a'; hold.add(frame);
const slideW = new T.Group(); hold.add(slideW); const slide = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.18), new T.MeshBasicMaterial()); slide.position.set(0, 0.03, -0.01); slideW.add(slide);
const w = new T.Group(); hold.add(w); const h = new T.Group(); w.add(h);
const mag = new T.Mesh(new T.BoxGeometry(0.022, 0.11, 0.03), new T.MeshBasicMaterial()); mag.name = 'service_pistol_magazine_loaded'; mag.position.set(0, -0.06, 0.06); mag.rotation.x = -0.25; h.add(mag);
const well0 = new T.Object3D(); well0.name = 'anch_well'; w.add(well0); const grip = new T.Object3D(); grip.name = 'anch_grip'; grip.position.set(0, -0.06, 0.06); rig.add(grip);
g.userData = {gun: IT.PISTOL, c322: 1, rig, slide: slideW, mag: w, anch: {grip, well: well0}};
const G = {held, selId: IT.PISTOL, IT, GUN: {212: {rl: 1.6}}, camera, hand, gunMag: {212: 0}, SET: {sfx: 1}, AC: null, scene: new T.Scene(), renderer: {render() {}}, updateHand(dt) { return 'inner'; }};
const W = {THREE: T, __gs1222: {rl2: (isP, x) => ({phase: 'old', w: 0.5})}, __fpa: {step() {}, fromVm: 0}, __vm: {on: 1}, __c43rf: 0, gunMag: G.gunMag, GUN: G.GUN};
const names = Object.keys(G);
const runner = new Function(...names, 'window', 'setInterval', 'setTimeout', src.replace("(typeof window !== 'undefined' ? window : this)", '(window)') + '\nreturn {uh: () => updateHand, rnd: () => renderer.render};');
const R = runner(...names.map(k => G[k]), W, () => 0, () => 0);
const U = W.__pmag1359;
ok(U && typeof U.tick === 'function' && R.uh().__pm1359 === 1, 'updateHand is wrapped once and the patch is live');
ok(W.__gs1222.rl2.__pm1359 === 1 && W.__fpa.step.__pm1359 === 1, 'GS1222 hand phases and the arm step are wrapped');
const camLocal = o => { camera.updateMatrixWorld(true); o.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o); return camera.worldToLocal(b.getCenter(new T.Vector3())); };
const at = rf => { U.freeze = rf; if (rf == null) W.__c43rf = 0; U.tick(0.016); hold.updateMatrixWorld(true); return {ph: U.ph, w: U.w, drop: U.drop, fresh: U.fresh, seated: w.visible, slideZ: slideW.position.z, ph2: W.__gs1222.rl2(true, rf)}; };

// idle
U.qaEmpty = 1; const i0 = at(null); ok(i0.seated && !U.fresh, 'idle: the magazine sits in the grip, no spare showing');
ok(U.geo && U.geo.L > 0.09 && U.geo.L < 0.13 && U.geo.ax[1] > 0.9, 'magazine axis measured up the grip (L=' + (U.geo && U.geo.L) + ')');
// empty reload
const s1 = at(0.02); ok(s1.seated && s1.slideZ > 0.03, 'empty: before the release the magazine is in and the slide is locked back');
const s2 = at(0.12);
const dropObj = (() => { let o = null; hand.traverse(x => { if (x.name === 'pmag1359' && x.parent === hand) o = x; }); return o; })();
ok(dropObj && dropObj.visible && !s2.seated, 'the spent magazine is out of the grip and falling on its own (child of the hand pass)');
const y12 = camLocal(dropObj).y; at(0.2); const y20 = camLocal(dropObj).y; at(0.3); const y30 = dropObj.visible ? camLocal(dropObj).y : -9;
ok(y20 < y12 - 0.01 && y30 < y20, 'it falls faster and faster (y ' + [y12, y20, y30].map(v => v.toFixed(3)).join(' > ') + ')');
const s3 = at(0.2); ok(s3.ph2.phase === 'belt' || s3.ph2.phase === 'mag out', 'GS1222 phases come from the new timeline (' + s3.ph2.phase + ')');
const s4 = at(0.35); ok(s4.fresh && s4.w === 1, 'a fresh magazine is in the off hand on its way up from the belt');
const fresh = hold.children.find(o => o.name === 'pmag1359');
const gap = rf => { at(rf); fresh.updateMatrixWorld(true); const b = new T.Box3().setFromObject(fresh); const ta = new T.Vector3(); W.__gs1222 && g.userData.anch.well.getWorldPosition(ta); const d = Math.max(0, b.distanceToPoint(ta)); return d; };
let worst = 0; for (const rf of [0.3, 0.4, 0.5, 0.55, 0.6]) worst = Math.max(worst, gap(rf));
ok(g.userData.anch.well.name === 'anch_pmag1359' && worst < 0.012, 'the off hand target is on the fresh magazine all the way in (worst gap ' + (worst * 1000).toFixed(1) + ' mm, hold units)');
// insertion follows the grip axis
const p50 = (at(0.5), fresh.position.clone()), p58 = (at(0.58), fresh.position.clone()), ax = new T.Vector3().fromArray(U.geo.ax);
ok(p58.clone().sub(p50).normalize().dot(ax) > 0.9, 'it slides up the grip along the magazine axis');
const s6 = at(0.63); ok(s6.seated && !s6.fresh, 'seated: the fresh magazine is home in the grip');
const s7 = at(0.76); ok(s7.ph === 'cycle' && s7.slideZ > 0.04, 'empty: the off hand racks the slide past the lock');
const s8 = at(0.86); ok(s8.slideZ < 0.005, 'slide released: it slams home');
ok(at(0.75).ph === 'cycle' && U.rkGain === 0, 'empty: rack phase runs (palm-down overhand grip off by default, rkGain 0)');
const s9 = at(0.99); ok(s9.w < 0.1, 'hand back on the grip at the end');
at(null); ok(w.visible && !fresh.visible && !dropObj.visible && g.userData.anch.well === well0, 'after the reload: copies hidden, old anchor back');
// tactical
U.qaEmpty = 0; G.gunMag[212] = 5; const t1 = at(0.02); ok(t1.slideZ === 0, 'tactical: slide stays forward');
let maxZ = 0; for (let rf = 0.02; rf < 1; rf += 0.04) maxZ = Math.max(maxZ, at(rf).slideZ); ok(maxZ === 0, 'tactical: no slide work at all');
ok(at(0.5).fresh && at(0.8).seated, 'tactical: still a full magazine swap');
// beats
U.freeze = null; ok(U.TE.rel < U.TE.drop && U.TE.drop < U.TE.belt && U.TE.belt < U.TE.up && U.TE.up < U.TE.ins && U.TE.ins < U.TE.seat && U.TE.seat < U.TE.rk1 && U.TE.rk1 < U.TE.rk2 && U.TE.rk2 < U.TE.home, 'empty timeline is in order');
ok(U.TT.seat < U.TT.home && U.TT.rk1 > 1, 'tactical timeline skips the rack');
// flag off
at(0.4); W.__noPmag1359 = 1; U.freeze = null; U.tick(0.016); ok(w.visible && !fresh.visible && W.__gs1222.rl2(true, 0.4).phase === 'old', 'window.__noPmag1359 puts the old reload back');
console.log('PASS v1359-pistol-mag ' + n + ' checks');
