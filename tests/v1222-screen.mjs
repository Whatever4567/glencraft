// v1.2.22: time box screen geometry from the real source numbers (not a render): faces the seat, in the room, clear sight line, draw order
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const s = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const has = t => { assert(s.includes(t), 'source changed: ' + t.slice(0, 60)); };
has('new THREE.PlaneGeometry(1.96, 1.1), sm); scr.position.z = 0.039;'); has('g.rotation.x = -0.12;'); has('g.position.set(0, 1.78, CZ + 0.85);'); has('U.SEAT = [0, 0, CZ + 2.0];'); has('o.renderOrder = 5;');
has("sg.position.set(0, 0.55, CZ + 1.5)"); has('knob.position.y = 0.78;'); has('new THREE.SphereGeometry(0.075, 12, 10)'); has('EYE = 1.6, HEIGHT'); has('const RR = 9.2, RH = 8.8, HW = 0.85');
const RR = 9.2, HW = 0.85, CZ = HW - RR, room = new THREE.Group();
const g = new THREE.Group(), scr = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.1)); scr.position.z = 0.039; g.add(scr); g.rotation.x = -0.12; g.position.set(0, 1.78, CZ + 0.85); room.add(g);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10)); knob.position.set(0, 0.55 + 0.78, CZ + 1.5); room.add(knob);
room.updateMatrixWorld(true); const eye = new THREE.Vector3(0, 1.6, CZ + 2.0);
const c = new THREE.Vector3().setFromMatrixPosition(scr.matrixWorld), n = new THREE.Vector3(0, 0, 1).transformDirection(scr.matrixWorld);
const toEye = eye.clone().sub(c); assert(n.dot(toEye.clone().normalize()) > 0.95, 'front face points at the seated eye'); assert(Math.hypot(c.x, c.z - CZ) < RR - 1, 'inside the round room');
const ray = new THREE.Raycaster(); let blocked = 0, pts = 0;
for (const u of [-0.98, -0.5, 0, 0.5, 0.98]) for (const v of [-0.55, -0.3, 0, 0.3, 0.55]) { const p = new THREE.Vector3(u, v, 0).applyMatrix4(scr.matrixWorld); const d = p.clone().sub(eye); ray.set(eye, d.clone().normalize()); ray.far = d.length() - 1e-3; if (ray.intersectObject(knob).length) blocked++; pts++; }
const ang = THREE.MathUtils.radToDeg(2 * Math.atan(0.55 / toEye.length()));
console.log(JSON.stringify({dist: +toEye.length().toFixed(2), facing: +n.dot(toEye.normalize()).toFixed(3), blockedByKnob: blocked + '/' + pts, vertDeg: +ang.toFixed(1)}));
assert.equal(blocked, 0, 'stick knob does not hide the screen from the seat');
// draw order: room meshes and the screen both draw after the far depth reset (2); the pass repeats every tick
assert(/U\.roC/.test(s), 'render order pass repeats');
console.log('v1222-screen ok');
