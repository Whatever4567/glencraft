// Animal ragdoll physics invariants on the real GLX-RAG1222 source (real three.js), before/after the gravity fixes.
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
let solid = (x, y, z) => y < 10;                     // world: flat ground top at y=10
const G = {THREE, P: {x: 500, y: 10, z: 500}, __gore: {sol: (x, y, z) => solid(x, y, z), splat: () => 0}}; G.window = G;
new Function('with(this){' + cut('/* GLX-RAG1222', '/* GLX-') + '}').call(G);
const U = G.__rag1222;
const body = (o = {}) => { const g = new THREE.Group(); g.position.set(o.x || 0, o.y != null ? o.y : 10.25, 0); if (o.size) { const m = new THREE.Mesh(new THREE.BoxGeometry(...o.size)); m.position.y = o.size[1] / 2; g.add(m); }
  return {blood: false, q0: g.quaternion.clone(), ang: 0, settle: 0, kind: 'body', g, dir: new THREE.Vector3(1, 0, 0), w: o.gun === false ? 1.2 : 2.5, slide: 1, gy: o.gy != null ? o.gy : 10, axis: new THREE.Vector3(0, 0, 1), t: 0, limbs: [], settle: o.settle != null ? o.settle : 1}; };
// what the game does when step() returns false: the old tip-over code pulls the body to its death ground and sets the tipped pose
const legacy = (c, dt) => { if (c.settle < 1) { c.w += 7 * dt; c.ang = Math.min(Math.PI / 2, c.ang + c.w * dt); c.g.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(c.axis, c.ang).multiply(c.q0)); c.g.position.y += (c.gy + 0.02 - c.g.position.y) * Math.min(1, dt * 18); if (c.ang >= Math.PI / 2) c.settle = 1; } };
const run = (L, n, dt) => { for (let k = 0; k < n; k++) { U.frame(dt); for (const c of L) { c.t += dt; if (!U.step(c, dt)) legacy(c, dt); } } };
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log((ok ? 'PASS ' : 'FAIL ') + msg); };
// 1. thrown off a 20 block cliff: must fall to the real ground below, not hover at the death height
{ solid = (x, y, z) => x < 1 ? y < 30 : y < 10; const c = body({y: 30.25, gy: 30}); run([c], 200, 1 / 60); check(Math.abs(c.g.position.y - 10.25) < 0.05, 'cliff fall lands on the real ground (y ' + c.g.position.y.toFixed(2) + ')'); solid = (x, y, z) => y < 10; }
// 2. a resting body bumped off a ledge falls (rest height must not pin it in the air)
{ solid = (x, y, z) => x < 2 ? y < 14 : y < 10; const c = body({x: 1.6, y: 14.25, gy: 14}); c.__r = {vx: 0, vz: 0, vy: 0, spin: 0, air: 0, sleep: 1, rest: 14.25, cd: 0};
  G.P.x = 1.0; G.P.y = 14; G.P.z = 0; U.frame(1 / 60); G.P.x = 1.1; run([c], 1, 1 / 60); G.P.x = 500; run([c], 240, 1 / 60); check(c.g.position.x > 2 && Math.abs(c.g.position.y - 10.25) < 0.05, 'bumped off a 4 block ledge falls to the floor below (x ' + c.g.position.x.toFixed(2) + ' y ' + c.g.position.y.toFixed(2) + ')'); solid = (x, y, z) => y < 10; }
// 3. more than 4 bodies in the air: none may freeze mid air or snap rotation
{ const L = Array.from({length: 7}, (_, i) => body({x: i * 3})); run(L, 6, 1 / 60); const ys = L.map(c => c.g.position.y); const snap = L.map(c => c.g.quaternion.clone());
  run(L, 1, 1 / 60); const jump = Math.max(...L.map((c, i) => c.g.quaternion.angleTo(snap[i]))); check(jump < 0.35, 'no rotation snap with 7 bodies flying (max ' + jump.toFixed(2) + ' rad per frame)');
  let hang = 0; for (let k = 0; k < 120; k++) { run(L, 1, 1 / 60); for (const c of L) if (c.g.position.y > 10.3 && c.__r && !c.__r.air) hang++; } run(L, 400, 1 / 60); check(L.every(c => Math.abs(c.g.position.y - 10.25) < 0.06), 'all 7 bodies come down to the ground');
  check(L.every(c => c.__r && c.__r.sleep), 'all 7 settle asleep'); }
// 4. frame rate independence: apex and landing distance at 30 / 60 / 120 fps
{ const res = [30, 60, 120].map(f => { const c = body(); let top = 0, land = null; for (let k = 0; k < f * 4; k++) { run([c], 1, 1 / f); top = Math.max(top, c.g.position.y); } land = c.g.position.x; return {f, top, land}; });
  console.log(JSON.stringify(res)); const ap = res.map(r => r.top), ld = res.map(r => r.land);
  check(Math.max(...ap) - Math.min(...ap) < 0.08, 'apex height within 0.08 across 30/60/120 fps'); check(Math.max(...ld) - Math.min(...ld) < 0.25, 'resting distance within 0.25 across 30/60/120 fps');
  const g = 16, vy = 4.2, apex = 10.25 + vy * vy / (2 * g); check(Math.abs(res[2].top - apex) < 0.06, 'parabolic apex matches v^2/2g (' + res[2].top.toFixed(3) + ' vs ' + apex.toFixed(3) + ')'); }
// 5. heavier animal is thrown less far than a light one by the same shot
{ const light = body({size: [0.4, 0.4, 0.6]}), heavy = body({size: [1.0, 1.4, 1.8]}); run([light, heavy], 300, 1 / 60); check(light.g.position.x > heavy.g.position.x * 1.3, 'mass: light ' + light.g.position.x.toFixed(2) + ' vs heavy ' + heavy.g.position.x.toFixed(2)); }
// 6. energy: never bounces higher than it fell from
{ const c = body({y: 16.25}); c.__r = {vx: 0, vz: 0, vy: 0, spin: 0, air: 1, sleep: 0, rest: null, cd: 0}; let peak = 0, hit = false; for (let k = 0; k < 600; k++) { run([c], 1, 1 / 60); if (c.g.position.y <= 10.26) hit = true; else if (hit) peak = Math.max(peak, c.g.position.y); } check(peak < 16.25 - 1, 'bounce loses energy (rebound peak ' + peak.toFixed(2) + ')'); }
// 8. 120 block drop into a deep cave lands on the real cave floor, far below any death relative plane
{ solid = (x, y, z) => x < 1 ? y < 30 : y < -90; const c = body({y: 30.25, gy: 30}); run([c], 60 * 8, 1 / 60); check(Math.abs(c.g.position.y + 89.75) < 0.05, '120 block drop lands on the cave floor (y ' + c.g.position.y.toFixed(2) + ')'); solid = (x, y, z) => y < 10; }
// 9. gap in the world (nothing below at all): keeps falling, then is retired by the normal fade below the bedrock void line, never hovers
{ solid = () => false; const c = body({y: 10.25}); let prev = c.g.position.y, stuck = 0; for (let k = 0; k < 60 * 12 && !c.fade; k++) { run([c], 1, 1 / 60); if (c.__r.vy < -1 && c.g.position.y >= prev - 1e-9) stuck++; prev = c.g.position.y; }
  check(!!c.fade && c.g.position.y < -300, 'void fall keeps falling and is faded out below y -301 (y ' + c.g.position.y.toFixed(1) + ', fade ' + c.fade + ')'); check(stuck === 0, 'never stops in mid air while falling (' + stuck + ' still frames)'); solid = (x, y, z) => y < 10; }
// 10. worst case cost: 12 bodies in free fall over a void (all uncapped), lookups bounded per step
{ solid = () => false; const L = Array.from({length: 12}, (_, i) => body({x: i * 3, y: 200})); const g0 = U.gLook || 0, t0 = performance.now(); run(L, 120, 1 / 60); const ms = (performance.now() - t0) / 120, looks = ((U.gLook || 0) - g0) / 120 / 12;
  console.log('free fall 12 bodies: ms per frame', ms.toFixed(4), 'ground lookups per body per frame', looks.toFixed(1)); check(ms < 1, '12 falling bodies under 1 ms per frame'); check(looks <= 2 * 4 + 0.01, 'lookups bounded (at most 2 steps x 4 sub steps per frame at 60 fps)'); solid = (x, y, z) => y < 10; }
// 7. step cost: 200 frames x 4 moving bodies
{ const L = Array.from({length: 4}, (_, i) => body({x: i * 3})); const t0 = performance.now(); run(L, 200, 1 / 60); const ms = (performance.now() - t0) / 200; console.log('step cost per frame (4 bodies) ms', ms.toFixed(4)); check(ms < 0.5, 'step cost under 0.5 ms per frame'); }
check(U.err === null, 'no ragdoll error ' + U.err);
if (fails.length) { console.log('FAILED', fails.length); process.exit(1); } console.log('all ok');
