import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import fs from 'fs'; import assert from 'assert';
const s = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const k of ["U.wrist = Math.min", "isP ? 0.044 : 0.032", "c.y -= 0.006", "[1.0, 1.08, 1.12, 1.18], 0.026", "limb(0.054, 0.036, LF", "limb(0.034, 0.031, 0.045", "__hg1221(held"]) assert.equal(s.split(k).length, 2, k);
assert(!s.includes("setFromQuaternion(p.h.quaternion, 'YXZ')"), 'old euler clamp gone');
// wrist swing limit: random hand vs forearm orientations always end within 0.9 rad, finite, and stable (no flip) on repeat
const V3 = (x, y, z) => new THREE.Vector3(x, y, z); let rnd = 7; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
function lim(fo, hq) { if (!isFinite(hq.x + hq.y + hq.z + hq.w)) hq.copy(fo); const fdw = V3(0,1,0).applyQuaternion(fo), hy = V3(0,1,0).applyQuaternion(hq), ang = Math.acos(Math.max(-1, Math.min(1, fdw.dot(hy)))), MX = 0.9; if (ang > MX) { const r = new THREE.Quaternion().setFromUnitVectors(hy, fdw); hq.premultiply(new THREE.Quaternion().slerp(r, (ang - MX) / ang)); } return hq; }
for (let i = 0; i < 5000; i++) { const fo = new THREE.Quaternion().setFromEuler(new THREE.Euler(R()*6, R()*6, R()*6)), hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(R()*6, R()*6, R()*6));
  lim(fo, hq); const a = V3(0,1,0).applyQuaternion(fo).angleTo(V3(0,1,0).applyQuaternion(hq)); assert(a <= 0.9 + 1e-3 && isFinite(a), 'limit ' + a); const h2 = lim(fo, hq.clone()); assert(h2.angleTo(hq) < 1e-4, 'stable'); }
const nanq = lim(new THREE.Quaternion(), new THREE.Quaternion(NaN, 0, 0, 1)); assert(isFinite(nanq.x + nanq.w));
// tool grip point: axe-like item whose origin is the handle top -> grip goes low on the handle
const src = fs.readFileSync(new URL('../tools/content-source/cabin-1221.js', import.meta.url), 'utf8'); const f = src.slice(src.indexOf('window.__hg1221 ='), src.indexOf('};', src.indexOf('window.__hg1221 =')) + 2);
const window = {}; new Function('THREE', 'window', f)(THREE, window);
const cam = new THREE.PerspectiveCamera(), held = new THREE.Group(), it = new THREE.Group(); held.add(it); const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04)); m.position.y = -0.3; it.add(m); held.position.set(0.3, -0.2, -0.5);
const g = window.__hg1221(held, it, cam); assert(g && Math.abs(g.y - (-0.2 - 0.48)) < 1e-6, 'grip ' + JSON.stringify(g));
console.log('v1221 hands ok');
