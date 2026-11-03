/* GLX-C321 (v1.1.29): DOWN IS THE PLANET. On the Moon, on Mars and out on the round Earth, "down" points to the middle of the planet, so you can
   walk all the way round: whichever block face is nearest under your feet becomes the floor. The planet is cut into six sides (like a dice);
   on each side the game runs exactly as normal, just turned 90 or 180 degrees, so every block still lines up and mining, building and
   jumping work the same. Crossing to the next side turns the world smoothly under you. Low gravity on the Moon and Mars is kept.
   On the Earth map itself nothing changes (that whole side is the normal way up). Vehicles always fly in the normal frame. */
(function c321() {
  const U = window.__c321 = {err: null, ax: 2, body: null, piv: [0, 0, 0], sw: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  // columns: where local x, y, z go in the world, for up = +X, -X, +Y, -Y, +Z, -Z
  const MS = [[[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 0, 0], [0, -1, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, 1, 0]]];
  const QS = MS.map(m => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...m[0]), new THREE.Vector3(...m[1]), new THREE.Vector3(...m[2]))));
  const toW = (a, v) => { const m = MS[a]; return [m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2], m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2], m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]]; };
  const toL = (a, v) => { const m = MS[a]; return [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]]; };
  U.toW = toW; U.toL = toL;
  const act = () => U.ax !== 2 && !window.__c317mesh;
  const pW = (x, y, z) => { if (U.ax === 2) return [x, y, z]; const c = U.piv, w = toW(U.ax, [x - c[0], y - c[1], z - c[2]]); return [w[0] + c[0], w[1] + c[1], w[2] + c[2]]; };
  const pL = (x, y, z) => { if (U.ax === 2) return [x, y, z]; const c = U.piv, l = toL(U.ax, [x - c[0], y - c[1], z - c[2]]); return [l[0] + c[0], l[1] + c[1], l[2] + c[2]]; };
  const cW = (x, y, z) => { const c = U.piv, w = toW(U.ax, [Math.floor(x) + 0.5 - c[0], Math.floor(y) + 0.5 - c[1], Math.floor(z) + 0.5 - c[2]]); return [Math.round(w[0] + c[0] - 0.5), Math.round(w[1] + c[1] - 0.5), Math.round(w[2] + c[2] - 0.5)]; };
  U.pW = pW; U.pL = pL; U.cW = cW;
  U.pw = () => { const p = pW(P.x, P.y, P.z); return {x: p[0], y: p[1], z: p[2]}; };
  try { const g0 = getB; getB = function (x, y, z) { if (!act()) return g0(x, y, z); const c = cW(x, y, z); return g0(c[0], c[1], c[2]); }; } catch (e) { ERR('getB', e); }
  try { const s0 = setB; setB = function (x, y, z, v) { if (!act()) return s0(x, y, z, v); const c = cW(x, y, z); return s0(c[0], c[1], c[2], v); }; } catch (e) { ERR('setB', e); }
  try { const so = solid; solid = function (x, y, z) { if (!act()) return so(x, y, z); const c = cW(x, y, z); return so(c[0], c[1], c[2]); }; } catch (e) { ERR('solid', e); }
  // ---------- which planet and which side ----------
  const veh = () => (window.__c309 && __c309.on) || (window.__c299 && __c299.on);
  function pick(w) { try { const p8 = window.__c318; if (p8) for (const b of p8.bodies) { if (b.d.cell) continue; const c = b.c(); if (Math.hypot(w[0] - c[0], w[1] - c[1], w[2] - c[2]) < b.R + 90) return [b.id, c]; }
      const e = window.__c320; if (e && !e.flat && e.alt(w[0], w[1], w[2]) < 90) return ['earth', e.E()]; } catch (_) {} return null; }
  function axisOf(d, cur) { const a = [Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])]; let k = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2; const ax = 2 * k + (d[k] < 0 ? 1 : 0);
    if (cur !== null && cur !== ax) { const ck = cur >> 1; if (ck !== k && a[k] < a[ck] * 1.03) return cur; } return ax; }
  const Qoff = new THREE.Quaternion(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), eu = new THREE.Euler();
  // v1.1.31: out on the round Earth the camera leans to the true round surface, so the sea looks level at every latitude (the blocks keep their sides)
  const TQ = new THREE.Quaternion(), tv = new THREE.Vector3(), tu = new THREE.Vector3(), I0 = new THREE.Quaternion();
  function tiltAt(w, ax, body, out) { out.identity(); const e = window.__c320, p8 = window.__c318; if (!body || !U.tiltOn) return out; const c = body === 'earth' ? e && e.E() : p8 && p8.by[body] && p8.by[body].c(); if (!c) return out;
    tv.set(w[0] - c[0], w[1] - c[1], w[2] - c[2]); const r = tv.length(); if (r < 1) return out; tv.divideScalar(r); if (body === 'earth' && window.__c332 && __c332.inner(r)) tv.negate(); const f = toW(ax, [0, 1, 0]); tu.set(f[0], f[1], f[2]);   /* v1.1.37: inside the hollow Earth up points to the inner sun */
    let k = 1; if (ax === 2 && body === 'earth') { const d = Math.hypot(w[0] - c[0], w[2] - c[2]); k = Math.max(0, Math.min(1, (d - e.CAP + 100) / 300)); }
    if (body === 'earth' && e.tOn && U.upright) { const al = r - e.R; k *= Math.max(0, Math.min(1, (al - 45) / 90)); }   /* v1.1.39: on the terraces the camera stands upright, it leans to the round planet only high up */
    if (k <= 0) return out; out.setFromUnitVectors(tu, tv); if (k < 1) out.slerp(I0, 1 - k); return out; }
  U.tiltOn = true; U.TQ = TQ; U.tiltAt = tiltAt;
  const T0q = new THREE.Quaternion(), T1q = new THREE.Quaternion(), vv = new THREE.Vector3();
  function setFrame(body, c, ax) { if (body === U.body && ax === U.ax) return; const a0 = U.ax, mid = pW(P.x, P.y + 0.9, P.z);
    const cp = Math.cos(P.pitch), dl = [-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp], dw = toW(a0, dl);
    const earthT = !!(body || U.body); tiltAt(mid, a0, U.body, T0q);
    qa.copy(QS[a0]).multiply(qb.setFromEuler(eu.set(P.pitch, P.yaw, 0)));
    U.body = body; U.ax = ax; U.piv = c ? c.map(Math.round) : [0, 0, 0];
    const u0 = toW(a0, [0, 1, 0]), u1 = toW(ax, [0, 1, 0]), dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2], a1 = dot(dw, u0), b1 = dot(dw, u1);
    let dr = dw; if (Math.abs(dot(u0, u1)) < 0.5) dr = [0, 1, 2].map(i => dw[i] - a1 * u0[i] - b1 * u1[i] + a1 * u1[i] - b1 * u0[i]);   // over an edge: the view tips with the ground
    const l = pL(mid[0], mid[1], mid[2]), d2 = toL(ax, dr); P.x = l[0]; P.y = l[1] - 0.9; P.z = l[2]; P.pitch = Math.asin(Math.max(-1, Math.min(1, d2[1]))); P.yaw = Math.atan2(-d2[0], -d2[2]);
    P.vy = 0; P.fallTop = null; try { if (window.__c317) __c317.soft = true; } catch (_) {}
    qb.copy(QS[ax]).multiply(qb.clone().setFromEuler(eu.set(P.pitch, P.yaw, 0))); Qoff.copy(qa).multiply(qb.invert()); if (earthT) { tiltAt(mid, ax, body, T1q); vv.set(dw[0], dw[1], dw[2]).applyQuaternion(T0q).applyQuaternion(T1q.invert()); const d3 = toL(ax, [vv.x, vv.y, vv.z]); P.pitch = Math.asin(Math.max(-1, Math.min(1, d3[1]))); P.yaw = Math.atan2(-d3[0], -d3[2]); Qoff.identity(); } U.sw++; try { unstick(); } catch (_) {} U.last = [body, ax]; }
  // v1.1.32: after the world turns under you, step up out of any block you would be standing inside (no wall clipping on the turn)
  function unstick() { const hit = () => { for (const dy of [0.1, 1, 1.7]) for (const ox of [-0.29, 0, 0.29]) for (const oz of [-0.29, 0, 0.29]) if (solid(Math.floor(P.x + ox), Math.floor(P.y + dy), Math.floor(P.z + oz))) return true; return false; };
    if (!hit()) return; const y0 = P.y; for (let i = 1; i <= 12; i++) { P.y = Math.floor(y0) + i * 0.5 + 0.001; if (!hit()) { U.unstuck = (U.unstuck || 0) + 1; return; } } P.y = y0; }
  U.unstick = unstick;
  U.setFrame = setFrame;
  try { const ld = lookDir; lookDir = function () { const r = ld.apply(this, arguments); if (!r || Math.abs(TQ.w) >= 0.99999) return r; const w = toW(U.ax, r); vv.set(w[0], w[1], w[2]).applyQuaternion(TQ); const l = toL(U.ax, [vv.x, vv.y, vv.z]); r[0] = l[0]; r[1] = l[1]; r[2] = l[2]; return r; }; } catch (e) { ERR('ld', e); }
  U.leave = () => { try { if (U.ax !== 2 || U.body) setFrame(null, null, 2); } catch (e) { ERR('leave', e); } };
  function tick() { try { if (U.body && !flying) unstick(); } catch (_) {} if (typeof started === 'undefined' || !started || DIM.cur || !window.__c317 || !__c317.on()) { if (U.ax !== 2) U.leave(); return; }
    if (veh()) { U.leave(); return; } const w = pW(P.x, P.y + 0.9, P.z), b = pick(w);
    if (!b) { if (U.ax !== 2) setFrame(null, null, 2); else U.body = null; return; }
    const c = b[1], dd = [w[0] - c[0], w[1] - c[1], w[2] - c[2]], inn = b[0] === 'earth' && window.__c332 && __c332.inner(Math.hypot(dd[0], dd[1], dd[2]));
    let ax = axisOf(dd, U.body === b[0] ? (inn ? U.ax ^ 1 : U.ax) : 2); if (inn) ax ^= 1;   // v1.1.37: inside the hollow Earth down points out onto the shell
    if (ax === 2 && U.ax === 2) { U.body = b[0]; return; } setFrame(b[0], c, ax); }
  U.tick = tick;
  function step(mx, mz) { if (!U.body || !P.onGround || flying || (!mx && !mz)) return; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    let dx = rx * mx + fx * mz, dz = rz * mx + fz * mz; const l = Math.hypot(dx, dz); if (l < 0.1) return; dx /= l; dz /= l;
    const y = Math.floor(P.y + 0.05), X0 = Math.floor(P.x), Z0 = Math.floor(P.z);
    // v1.1.32: the corners of your body count too. v1.1.36: on a round planet a two block lip (where the ground curves most) is stepped too
    for (let h = 1; h <= 2; h++) { if (solid(X0, y + h + 1, Z0)) return;
      for (const o of [0, 0.29, -0.29]) { const x = Math.floor(P.x + dx * 0.55 - dz * o), z = Math.floor(P.z + dz * 0.55 + dx * o);
        if (solid(x, y + h - 1, z) && !solid(x, y + h, z) && !solid(x, y + h + 1, z)) { const dy = y + h + 0.001 - P.y; P.y += dy; P.vy = 0; U.cy = Math.max(-2.5, (U.cy || 0) - dy); U.steps = (U.steps || 0) + 1; return; } } } }
  setTimeout(() => { try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) { try { tick(); step(mx, mz); } catch (e) { ERR('tick', e); } return up.apply(this, arguments); }; } catch (e) { ERR('up0', e); } }, 3000);
  // ---------- vehicles and saves see the true spot ----------
  const withW = f => function () { if (U.ax === 2) return f.apply(this, arguments); const s = [P.x, P.y, P.z, P.yaw, P.pitch], b = U.body, c = U.piv.slice(), a = U.ax; U.leave(); return f.apply(this, arguments); };
  const keepW = f => function () { if (U.ax === 2) return f.apply(this, arguments); const s = [P.x, P.y, P.z], w = pW(P.x, P.y, P.z); P.x = w[0]; P.y = w[1]; P.z = w[2]; try { return f.apply(this, arguments); } finally { P.x = s[0]; P.y = s[1]; P.z = s[2]; } };
  setTimeout(() => { try { const u = window.__c309; if (u) { if (u.board) u.board = withW(u.board); if (u.yBtn) u.yBtn = keepW(u.yBtn); if (u.nearB) u.nearB = keepW(u.nearB); }
      const r = window.__c299; if (r) for (const k of ['board', 'enter', 'launch']) if (typeof r[k] === 'function') r[k] = withW(r[k]); } catch (e) { ERR('veh', e); } }, 3100);
  try { const sp = spawnPlayer; spawnPlayer = function () { if (!(window.__c317 && __c317.skipSpawn)) U.leave(); return sp.apply(this, arguments); }; } catch (e) { ERR('sp', e); }
  try { const ew = enterWorld; enterWorld = function () { U.ax = 2; U.body = null; Qoff.identity(); return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
  try { const se = serialize; serialize = keepW(se); } catch (e) { ERR('ser', e); }
  // ---------- drawing: turn the camera (and the few things placed from your spot) into the planet frame ----------
  const MOVE = () => { const a = []; try { a.push(skyDome, stars, sunDisc, moonDisc, crackMesh, rainLines); for (const q of drops) a.push(q.m); for (const q of parts) a.push(q.m); for (const q of arrows) a.push(q.m); } catch (_) {} return a; };
  const sv = [], cq = new THREE.Quaternion(), cpos = new THREE.Vector3(), I = new THREE.Quaternion();
  try { const rd = renderer.render; renderer.render = function (s, c) { const ease = Math.abs(Qoff.w) < 0.99999; if (c === camera) { const p0 = pW(c.position.x, c.position.y, c.position.z); tiltAt(p0, U.ax, U.body, TQ); } const tl = Math.abs(TQ.w) < 0.99999;
      if (s !== scene || !c || c !== camera || (U.ax === 2 && !ease && !tl)) return rd.apply(this, arguments);
      cpos.copy(c.position); cq.copy(c.quaternion); sv.length = 0;
      try { const p = pW(c.position.x, c.position.y, c.position.z); c.position.set(p[0], p[1], p[2]); qa.copy(QS[U.ax]).multiply(c.quaternion); Qoff.slerp(I, 0.12); c.quaternion.copy(Qoff).multiply(qa); if (tl) c.quaternion.premultiply(TQ); c.updateMatrixWorld(true);
        const MV = MOVE(); for (let i = 0; i < MV.length; i++) { const o = MV[i]; if (!o || !o.position) continue; sv.push([o, o.position.clone(), o.quaternion.clone()]); const q = pW(o.position.x, o.position.y, o.position.z); o.position.set(q[0], q[1], q[2]); o.quaternion.premultiply(QS[U.ax]); if (tl && i < 4) { o.position.sub(c.position).applyQuaternion(TQ).add(c.position); o.quaternion.premultiply(TQ); } o.updateMatrixWorld(true); } } catch (e) { ERR('rd', e); }
      try { return rd.apply(this, arguments); } finally { c.position.copy(cpos); c.quaternion.copy(cq); c.updateMatrixWorld(true); for (const [o, p, q] of sv) { o.position.copy(p); o.quaternion.copy(q); } } }; } catch (e) { ERR('rd0', e); }
  U.upright = true; U.cy = 0; let lcy = 0;
  // v1.1.39: a step up glides the view up over a few frames instead of jumping
  try { const r0 = renderer.render; renderer.render = function (s, c) { if (c !== camera || s !== scene || Math.abs(U.cy) < 0.01 || U.body !== 'earth' || !window.__c320 || __c320.flat) { U.cy = 0; return r0.apply(this, arguments); } const t = performance.now(), dt = Math.min(0.1, (t - (lcy || t)) / 1000); lcy = t; U.cy *= Math.exp(-dt * 14);
      const y0 = c.position.y; c.position.y += U.cy; c.updateMatrixWorld(true); try { return r0.apply(this, arguments); } finally { c.position.y = y0; c.updateMatrixWorld(true); } }; } catch (e) { ERR('cy', e); }
})();
