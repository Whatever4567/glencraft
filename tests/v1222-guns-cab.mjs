// v1.2.22: gun anchors, reload phases, card tool socket (real grip module) and the time box cabin module
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const G = {THREE}; G.window = G; new Function('with(this){' + cut('/* GLX-GRIP1222', '/* GLX-AG') + '}').call(G); const S = G.__gs1222; assert(S && S.af && S.rl, 'grip module');
const cam = new THREE.PerspectiveCamera(); cam.position.set(3, 70, 5); cam.rotation.set(0.2, 0.7, 0); cam.updateMatrixWorld(true);
for (const kind of ['pistol', 'rifle']) { const g = new THREE.Group(), rig = new THREE.Group(), slide = new THREE.Group(); g.add(rig); rig.add(slide); g.userData = {rig, slide}; S.addAnch(g, kind); cam.add(g);
  for (const [t, rec] of [[0, 0], [1, 0.08], [2, 0], [3, 0.03]]) { g.position.set(0.2, -0.2, -0.4 + rec); g.rotation.set(rec * 3, Math.PI / 2, t * 0.1); rig.position.z = rec; g.updateMatrixWorld(true);
    for (const n of Object.keys(g.userData.anch)) { const a = S.af(g, cam, n), w = new THREE.Vector3().setFromMatrixPosition(g.userData.anch[n].matrixWorld), want = cam.worldToLocal(w.clone()); assert(a.distanceTo(want) < 1e-9, kind + n); } }
  cam.remove(g); }
assert.equal(S.af(new THREE.Group(), cam, 'grip'), null, 'no anchors: old hand spot');
const P = [0, 0.08, 0.3, 0.5, 0.7, 0.95, 1].map(x => S.rl(true, x)), M = [0, 0.1, 0.2, 0.5, 0.9, 1].map(x => S.rl(false, x));
assert.deepEqual(P.map(p => p.phase), ['release', 'release', 'belt', 'insert', 'insert', 'return', 'return']); assert(P[2].belt > 0.9 && P[4].well > 0.9 && P[0].w === 0 && P[6].w === 0, 'pistol: belt then well, starts and ends on the gun');
assert(M[3].pull > 0.9 && M[3].w > 0.9 && M[0].w === 0 && M[5].w === 0, 'musket bolt pull mid reload, hand back at the end');
assert.equal(S.rl(true, -1).w, 0, 'cancel (no reload state) = hand on the gun');
// flat card tool: handle socket on the card diagonal
const card = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial()), item = new THREE.Group(); item.add(card); item.userData.c122card = 1;
const k = S.sock(item); assert(k && k.card && k.b.x < 0 && k.b.y < 0 && k.h.x > 0 && k.h.y > 0 && k.r >= 0.012 && k.r <= 0.03);
// cabin
let placed = 0, toasts = [], camN = 0, solidHit = false; const Sx = {on: true, x: 100.5, y: 70.4, z: 50.5};
const TB = {S: Sx, inside: true, RR: 3, HW: 3.5, place(x, y, z) { Sx.x = x; Sx.y = y; Sx.z = z; }}, F3 = {pilot: false};
const C = {THREE, __tbox: TB, __tbox3: F3, P: {x: 100.5, y: 70.4, z: 52, vy: -2}, selId: 5, PLACEABLE: new Set([5]), cnt: () => 3, toast: m => toasts.push(m), raycast: () => ({hit: [100, 69, 51], prev: [100, 70, 51]}),
  solid: () => solidHit, performance, updatePlayer: () => {}, placeCamera: () => { camN++; }, useItem: () => { placed++; }, canMine: () => true};
C.window = C; new Function('with(this){' + cut('/* GLX-CAB1222', '/* GLX-C400') + '}').call(C); const B = C.__cab1222; assert.equal(B.err, null, B.err);
C.useItem(); assert.equal(placed, 0, 'no world edit from inside the cabin'); assert.equal(B.blocked, 1); assert.equal(C.canMine(1, 69), false);
TB.inside = false; C.useItem(); assert.equal(placed, 1, 'outside the box placing works'); assert.equal(C.canMine(1, 69), true); TB.inside = true;
F3.pilot = true; for (const dy of [0.3, 0.6, -0.4]) { Sx.y += dy; C.updatePlayer(0.016); } assert.equal(camN, 3, 'camera placed after the box moves, every flying frame');
F3.pilot = false; C.updatePlayer(0.016); assert.equal(Sx.y, Math.round(Sx.y), 'box settles to a whole block when you let go'); assert(Math.abs(C.P.y - Sx.y) < 1e-9 || C.P.y > Sx.y, 'you move with it, standing on the floor'); assert.equal(C.P.vy, 0);
Sx.y = 80.3; solidHit = true; F3.pilot = true; C.updatePlayer(); F3.pilot = false; C.updatePlayer(); assert.equal(Sx.y, 80.3, 'never settles into rock');
console.log('v1222-guns-cab ok', JSON.stringify({settles: B.settles, blocked: B.blocked}));
