/* GLX-C309 (v1.1.19): THE PLAYERS OWN UFO + the flat Earth seen from space. Every world has your own silver saucer parked next to where you
   start (old worlds get one beside you when they load); it is saved where you leave it. Fly UFO next to it. No gravity while you pilot:
   move stick / WASD to fly where you look, JUMP up, SHIFT down, BOOST (button or Ctrl) for speed, and it gently levels itself to the local
   gravity (flat on the map, round the Moon). Let go near the ground and it settles down on its own. Third person camera. Separate from the
   wild Agartha saucer. From space and the Moon the flat Earth hangs there: the map, the ice wall rim, the far ice and the firmament dome. */
(function c309() {
  const U = window.__c309 = {err: null, on: false, set: false, pos: new THREE.Vector3(), yaw: 0, boostHeld: false, landed: true, maxSp: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const M8 = () => window.__c308, PD = () => window.__c306, R9 = () => window.__c299, say = t => { try { toast(t); } catch (_) {} };
  const Y = new THREE.Vector3(0, 1, 0), F = new THREE.Quaternion(), vel = new THREE.Vector3(), up = new THREE.Vector3(), fw = new THREE.Vector3(), rt = new THREE.Vector3(), uv = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), eY = new THREE.Euler(0, 0, 0, 'YXZ');
  // ---------- the saucer ----------
  const G = new THREE.Group(); G.userData.sys = 1; G.visible = false; scene.add(G);
  { const hull = new THREE.Mesh(new THREE.SphereGeometry(3.2, 28, 12), new THREE.MeshLambertMaterial({color: 0xc9d2dc, emissive: 0x2a3038})); hull.scale.y = 0.26; G.add(hull);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.35, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({color: 0x8fd8ff, emissive: 0x1c4a6e, transparent: true, opacity: 0.35, depthWrite: false})); dome.position.y = 0.45; G.add(dome);
    const lm = new THREE.MeshBasicMaterial({color: 0x66ffcc}); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), lm); l.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 3); G.add(l); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 20), new THREE.MeshBasicMaterial({color: 0x3a8cff})); ring.rotation.x = Math.PI / 2; ring.position.y = -0.7; G.add(ring); G.traverse(o => { o.userData.sys = 1; }); }
  const onMap = p => p.x >= 0 && p.x < W && p.z >= ((typeof __XG !== 'undefined' && __XG) ? __XZ : 0) && p.z < D && p.y >= 0 && p.y < H;
  const moonNear = p => M8() && M8().near(p);
  const vS = new THREE.Vector3(), sol = (x, y, z) => { if (M8() && M8().solid(x, y, z)) return true; vS.set(x, y, z); return onMap(vS) && solid(Math.floor(x), Math.floor(y), Math.floor(z)); };
  const gup = (p, o) => moonNear(p) ? M8().up(p, o) : o.copy(Y);
  function hitAt(p) { if (sol(p.x - up.x * 0.85, p.y - up.y * 0.85, p.z - up.z * 0.85) || sol(p.x + up.x * 0.9, p.y + up.y * 0.9, p.z + up.z * 0.9)) return true;
    // rim probes use a fixed frame around up (not the look direction), so turning on the spot never pushes the hull into a block
    e1.set(1, 0, 0); if (Math.abs(up.x) > 0.9) e1.set(0, 0, 1); e1.addScaledVector(up, -e1.dot(up)).normalize(); e2.crossVectors(up, e1);
    for (const [a, b] of [[2.8, 0], [-2.8, 0], [0, 2.8], [0, -2.8], [2, 2], [-2, 2], [2, -2], [-2, -2]]) if (sol(p.x + e1.x * a + e2.x * b - up.x * 0.3, p.y + e1.y * a + e2.y * b - up.y * 0.3, p.z + e1.z * a + e2.z * b - up.z * 0.3)) return true; return false; }
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  // pushed out along up to the first free spot (or the surface) when ever found inside blocks
  function unstick(v) { for (let i = 0; i < 240 && hitAt(v); i++) v.addScaledVector(up, 0.5); if (hitAt(v)) { if (moonNear(v)) v.addScaledVector(up, 40); else v.y = Math.max(v.y, topAt(v.x, v.z) + 2); } U.unstuck = (U.unstuck || 0) + 1; }
  U.unstick = unstick; U.hitAt = p => hitAt(p);
  const groundGap = p => { for (let d = 0; d <= 6; d += 0.25) if (sol(p.x - up.x * (0.95 + d), p.y - up.y * (0.95 + d), p.z - up.z * (0.95 + d))) return d; return 99; };
  const topAt = (x, z) => (R9() && R9().topAt) ? R9().topAt(x, z) : groundTop(Math.floor(x), Math.floor(z)) + 1;
  function spawnNear() { let x = P.x + 4.5, z = P.z + 0.5; if (x > W - 6) x = P.x - 4.5; U.pos.set(x, Math.max(topAt(x, z), Math.floor(P.y)) + 1.0, z); U.yaw = P.yaw; F.identity(); U.set = true; U.landed = true; }
  U.spawnNear = spawnNear;
  function frame(yaw, pitch, o) { eY.set(pitch || 0, yaw, 0); return o.copy(F).multiply(q1.setFromEuler(eY)); }
  // ---------- flight ----------
  function fly(dt, mx, mz) { const p = U.pos; gup(p, uv); v1.set(0, 1, 0).applyQuaternion(F); q1.setFromUnitVectors(v1, uv); q2.copy(q1).multiply(F); F.slerp(q2, 1 - Math.exp(-dt * 2.5)).normalize();
    frame(P.yaw, 0, q2); up.set(0, 1, 0).applyQuaternion(F); fw.set(0, 0, -1).applyQuaternion(q2); rt.set(1, 0, 0).applyQuaternion(q2); U.yaw = P.yaw;
    const uIn = (keys.Space || jumpHeld || (jumpHeldPad && !U.padOn) || U.upHeld ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || sneakHeld || U.dnHeld ? 1 : 0); jumpReq = false; jumpBuf = 0;
    v1.set(0, 0, 0).addScaledVector(fw, mz).addScaledVector(rt, mx).addScaledVector(up, uIn); const any = v1.lengthSq() > 0.01; if (v1.lengthSq() > 1) v1.normalize();
    const boost = !!(keys.ControlLeft || keys.ControlRight || U.boostHeld), mn = moonNear(p), space = !mn && (p.y > 1000 || !(p.x > -300 && p.x < W + 300 && p.z > -1800 && p.z < D + 300)), alt = mn ? M8().alt(p) : p.y - topAt(p.x, p.z);
    const busy = typeof dirtyCh !== 'undefined' && dirtyCh.size > 4; let sp = boost ? (space ? 520 : alt < 40 ? 40 : 160) : (space ? 70 : 16); if (alt < 80 && busy) sp = Math.min(sp, 16); else if (alt < 80) sp = Math.min(sp, 40); U.busy = busy; vel.lerp(v1.multiplyScalar(sp), 1 - Math.exp(-dt * 3));
    // v1.1.22: swept collision - the move is cut into steps of at most 0.4 blocks, each step slides along the surface instead of entering it
    v2.copy(p); if (hitAt(v2)) unstick(v2); { v3.copy(vel).multiplyScalar(dt); const n = Math.min(400, Math.max(1, Math.ceil(v3.length() / 0.4))); v3.multiplyScalar(1 / n);
      for (let k = 0; k < n; k++) { v4.copy(v2).add(v3); if (!hitAt(v4)) { v2.copy(v4); continue; } const vn = v3.dot(up); v3.addScaledVector(up, -vn); v4.copy(v2).add(v3);
        const vu = vel.dot(up); if (vu < 0) vel.addScaledVector(up, -vu); vel.multiplyScalar(0.8); U.hits = (U.hits || 0) + 1; if (v3.lengthSq() > 1e-8 && !hitAt(v4)) v2.copy(v4); else break; } }
    U.landed = false; if (!any || (uIn < 0 && Math.abs(mx) + Math.abs(mz) < 0.05)) { let gg = groundGap(v2); if (gg < 6) { v4.copy(v2).addScaledVector(up, -Math.min(gg, dt * (1 + gg))); if (!hitAt(v4)) v2.copy(v4); else gg = 0; if (gg < 0.08) { U.landed = true; vel.set(0, 0, 0); } } }
    const L = Math.max(60000, (window.__c305 && __c305.BOUND) || 12000); if ((window.__c317 && __c317.on())) { __c317.clampBox(v2, 6); } else { v2.x = Math.max(432 - L, Math.min(432 + L, v2.x)); v2.z = Math.max(432 - L, Math.min(432 + L, v2.z)); v2.y = Math.max(-200, Math.min(60000, v2.y)); }
    p.copy(v2); U.maxSp = Math.max(U.maxSp, vel.length()); sync(); }
  const low = () => !moonNear(U.pos) && U.pos.y < H + 40 && U.pos.x > 1 && U.pos.x < W - 2 && U.pos.z > ((typeof __XG !== 'undefined' && __XG) ? __XZ + 2 : 2) && U.pos.z < D - 2;
  /* v1.1.28: controller Y enters and exits the UFO (Y still opens the inventory everywhere else) */
  U.yBtn = () => { if (menuOpen) return false; if (U.on) { U.exit(); return true; } if (U.nearB) { U.board(); return true; } return false; };
  const cam = new THREE.Vector3(), cq = new THREE.Quaternion(), M9 = new THREE.Matrix4(), T9 = new THREE.Vector3(), B9 = new THREE.Vector3(); U.cam = cam; U.cq = cq;
  function sync() { U.cock = !window.thirdPerson; if (U.cock) { frame(P.yaw, Math.max(-1.5, Math.min(1.5, P.pitch)), cq); cam.copy(U.pos).addScaledVector(up, 1.05); } else { /* v1.1.28: third person orbits behind and above the saucer, never inside it */ const e = Math.max(0.18, Math.min(1.3, 0.42 - P.pitch)), d = 15; frame(P.yaw, 0, cq); B9.set(0, 0, 1).applyQuaternion(cq);
      cam.copy(U.pos).addScaledVector(B9, Math.cos(e) * d).addScaledVector(up, Math.sin(e) * d + 1.2); M9.lookAt(cam, T9.copy(U.pos).addScaledVector(up, 1.2), up); cq.setFromRotationMatrix(M9); }
    if ((window.__c317 && __c317.on()) || low()) { if (PD()) PD().eva = false; P.x = U.pos.x; P.z = U.pos.z; P.y = U.pos.y; } else { if (PD()) { PD().eva = true; const E = PD().E; E.x = cam.x; E.y = cam.y - 1.6; E.z = cam.z; E.vx = E.vy = E.vz = 0; }
      P.x = Math.max(2, Math.min(W - 3, U.pos.x)); P.z = Math.max(2, Math.min(D - 3, U.pos.z)); P.y = H + 60; }
    P.vy = 0; P.onGround = true; P.fallTop = null; const mn = moonNear(U.pos), sp = Math.round(vel.length());
    window.__spaceHud = 'UFO   ' + (mn ? M8().body(U.pos).name + ' height ' + Math.round(M8().alt(U.pos)) : 'altitude ' + Math.round(U.pos.y)) + '   speed ' + sp + (U.landed ? '   landed' : ''); }
  U.board = () => { if (U.on) return; U.free = false; try { if (M8() && M8().mode === 'moon') M8().stop(); if (R9() && R9().on) return; } catch (_) {} U.from = [P.x, P.y, P.z]; U.on = true; window.__thirdPerson = window.thirdPerson = false; vel.set(0, 0, 0); P.yaw = U.yaw;
    say('Your UFO: move to fly where you look, JUMP up, SHIFT down, BOOST for speed. Let go near the ground to land. EXIT once landed'); };
  U.exit = () => { if (!U.on) return; const p = U.pos, mn = moonNear(p), B7 = window.__c317 && __c317.on();
    if (B7 && groundGap(p) > 3) { U.on = false; window.__spaceHud = null; if (PD()) PD().eva = false; P.x = p.x + rt.x * 3.2; P.z = p.z + rt.z * 3.2; P.y = p.y; P.vy = 0; P.fallTop = null; U.hold = 0; U.free = true; vel.set(0, 0, 0);
      try { camera.up.set(0, 1, 0); camera.rotation.set(P.pitch || 0, P.yaw || 0, 0, 'YXZ'); } catch (_) {} say('You stepped out into space. Your UFO follows you down - BOARD UFO to get back in'); return; }
    if (groundGap(p) > 3) { say('Land first (let go near the ground), then EXIT'); return; } U.on = false; window.__spaceHud = null;
    if (mn) { v1.copy(rt).multiplyScalar(4.5).add(p); M8().land(v1); } else { if (PD()) PD().eva = false; const s = safeSpot(p); P.x = s[0]; P.z = s[2]; P.y = s[1]; P.vy = 0; P.fallTop = null; U.hold = 2.5; try { camera.up.set(0, 1, 0); camera.rotation.set(P.pitch || 0, P.yaw || 0, 0, 'YXZ'); } catch (_) {} } };
  // a free 2-high spot with solid ground under it, beside the saucer first, then rings further out, else the surface
  const okAt = (x, y, z) => !solid(Math.floor(x), Math.floor(y), Math.floor(z)) && !solid(Math.floor(x), Math.floor(y) + 1, Math.floor(z)) && solid(Math.floor(x), Math.floor(y) - 1, Math.floor(z));
  function safeSpot(p) { const c = [[rt.x * 4.5, rt.z * 4.5], [-rt.x * 4.5, -rt.z * 4.5], [-fw.x * 4.5, -fw.z * 4.5], [fw.x * 4.5, fw.z * 4.5]];
    for (let r = 3; r <= 9; r += 2) for (let a = 0; a < 12; a++) c.push([Math.cos(a / 12 * 6.283) * r, Math.sin(a / 12 * 6.283) * r]);
    for (const [dx, dz] of c) { const x = Math.floor(p.x + dx) + 0.5, z = Math.floor(p.z + dz) + 0.5; if (!(window.__c317 && __c317.on()) && (x < 2 || x > W - 3 || z > D - 3)) continue;
      for (let y = Math.floor(p.y) + 2; y >= Math.floor(p.y) - 4; y--) if ((y > 0 || (window.__c317 && __c317.on())) && okAt(x, y, z)) return [x, y + 0.02, z]; }
    const x = Math.floor(p.x + rt.x * 4.5) + 0.5, z = Math.floor(p.z + rt.z * 4.5) + 0.5; if ((window.__c317 && __c317.on()) && !__c317.foot(x, z)) return [p.x, p.y + 1.2, p.z]; return [x, topAt(x, z) + 0.05, z]; }
  U.safeSpot = safeSpot;
  // ---------- buttons ----------
  const bt = (t, css, on, off) => { const b = document.createElement('div'); b.textContent = t; b.style.cssText = 'position:fixed;z-index:45;padding:10px 14px;border-radius:14px;font:bold 14px sans-serif;color:#fff;background:rgba(40,90,120,.82);border:2px solid #9ff;user-select:none;touch-action:none;display:none;' + css;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); on(); }); if (off) for (const k of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(k, off); document.body.appendChild(b); return b; };
  const B = {fly: bt('Fly UFO', 'left:50%;bottom:170px;transform:translateX(-50%);', () => U.board()), exit: bt('EXIT UFO', 'right:22%;bottom:300px;', () => U.exit()),
    boost: bt('BOOST', 'right:22%;bottom:150px;padding:16px 20px;background:rgba(170,60,160,.85);', () => { U.boostHeld = true; }, () => { U.boostHeld = false; }),
    up: bt('UP', 'right:8%;bottom:230px;', () => { U.upHeld = true; }, () => { U.upHeld = false; }), dn: bt('DOWN', 'right:8%;bottom:160px;', () => { U.dnHeld = true; }, () => { U.dnHeld = false; })};
  for (const k in B) B[k].dataset.testid = 'ufo-' + k;
  // ---------- the flat Earth from space: ice rim, far ice and the firmament dome ----------
  const FE = new THREE.Group(); FE.userData.sys = 1; FE.visible = false; scene.add(FE);
  { const rim = new THREE.Mesh(new THREE.CylinderGeometry(560, 560, 70, 72, 1, true), new THREE.MeshBasicMaterial({color: 0xe8f2ff, side: THREE.DoubleSide, fog: false})); rim.position.set(432, SEA + 35, 432); /* v1.1.40 no ice rim */
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(864, 1500), new THREE.MeshBasicMaterial({color: 0xdfeaf2, fog: false})); ice.rotation.x = -Math.PI / 2; ice.position.set(432, SEA + 1.5, -750); /* v1.1.40 no far ice */
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1150, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x9fd8ff, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, fog: false})); dome.position.set(432, 0, -100); dome.name = "dome309"; FE.add(dome);
    FE.traverse(o => { o.userData.sys = 1; o.frustumCulled = false; }); }
  // ---------- hooks ----------
  try { const upd = updatePlayer; updatePlayer = function (dt, mx, mz) { try { if (U.on) { if (DIM.cur) U.on = false; else { fly(Math.min(dt, 0.05), mx || 0, mz || 0); return 0; } } } catch (e) { ERR('upd', e); } if (U.hold > 0) { U.hold -= dt; const k = typeof dirtyCh === 'undefined' || dirtyCh.size === 0; if (!k && U.hold > 0) { P.vy = 0; return 0; } U.hold = 0; } guard(dt); return upd.apply(this, arguments); }; } catch (e) { ERR('upd0', e); }
  // safety net on flat Earth: inside blocks (not just touching) for a moment, or below the world bottom, goes up to the first free spot
  function guard(dt) { if (DIM.cur || (PD() && PD().eva) || (M8() && M8().mode === 'moon') || (R9() && R9().on) || !isFinite(P.y)) { U.sk = 0; return; }
    if (P.y < SEA - 1500 && !(window.__c317 && __c317.on())) { P.y = topAt(P.x, P.z) + 0.05; P.vy = 0; P.fallTop = null; U.saved = (U.saved || 0) + 1; return; }
    const x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y + 0.1); if (solid(x, y, z) && solid(x, y + 1, z)) U.sk = (U.sk || 0) + dt; else U.sk = 0;
    if (U.sk > 0.4) { let yy = y; while (yy < y + 6 && yy < H - 2 && (solid(x, yy, z) || solid(x, yy + 1, z))) yy++; if (yy >= y + 6) { U.sk = 0; return; } P.y = yy + 0.02; P.vy = 0; P.fallTop = null; U.sk = 0; U.saved = (U.saved || 0) + 1; } }
  try { const rr = renderer.render; renderer.render = function (s, c) { const hid = []; try { if (s === scene && started) { FE.visible = !window.__c314 && !DIM.cur && c.position.y > H + 150 && !(R9() && R9().frame !== 'earth');
          if (U.on) { G.position.copy(U.pos); frame(U.yaw, 0, G.quaternion); c.position.copy(cam); c.quaternion.copy(cq); for (const m of c.children) if (m.visible) { m.visible = false; hid.push(m); } if (U.cock && G.visible) { G.visible = false; hid.push(G); } }
          else if (U.free && G) { G.position.copy(U.pos); } } } catch (e) { ERR('rw', e); }
    try { return rr.apply(this, arguments); } finally { for (const m of hid) m.visible = true; } }; } catch (e) { ERR('rw0', e); }
  (function loop() { requestAnimationFrame(loop); try { if (!started || DIM.cur) { G.visible = false; for (const k in B) B[k].style.display = 'none'; return; }
      if (!U.set && P && isFinite(P.x) && performance.now() > (U.t0 || 0)) spawnNear();
      if (U.chk && !U.on) { U.chk = 0; up.set(0, 1, 0).applyQuaternion(F); fw.set(0, 0, -1).applyQuaternion(F); rt.set(1, 0, 0).applyQuaternion(F); if (hitAt(U.pos)) unstick(U.pos); }
      G.visible = true; G.position.copy(U.pos); frame(U.yaw, 0, G.quaternion); const t = performance.now() / 1000; G.children[0].rotation.y = t * 0.6;
      if (U.free && !U.on) { if (P.onGround) U.free = false; else { U.pos.x += (P.x + 2.6 - U.pos.x) * 0.25; U.pos.y += (P.y + 0.3 - U.pos.y) * 0.25; U.pos.z += (P.z - U.pos.z) * 0.25; } }
      const m8 = M8(), me = m8 && m8.mode === 'moon' ? m8.Q : P, near = !U.on && !(R9() && R9().on) && Math.hypot(me.x - U.pos.x, me.y - U.pos.y, me.z - U.pos.z) < 7; U.nearB = near;
      const show = (b, v) => { b.style.display = v && !menuOpen ? 'block' : 'none'; }; show(B.fly, near && !U.on && !(window.__c340 && __c340.k > 0.3)); show(B.exit, U.on); show(B.boost, U.on); show(B.up, U.on); show(B.dn, U.on); } catch (e) { ERR('loop', e); } })();
  // ---------- save ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && U.set) { o.c309 = {v: 1, p: [U.pos.x, U.pos.y, U.pos.z], yaw: U.yaw, q: [F.x, F.y, F.z, F.w]};
        if (U.on && o.P) { if (low()) { const s = safeSpot(U.pos); o.P.x = s[0]; o.P.y = s[1]; o.P.z = s[2]; } else if (U.from) { o.P.x = U.from[0]; o.P.y = U.from[1]; o.P.z = U.from[2]; } } } } catch (e) { ERR('ser', e); } return o; }; } catch (e) { ERR('ser0', e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { U.on = false; window.__spaceHud = null; const s = save && save.c309; if (s && s.p) { U.pos.set(s.p[0], s.p[1], s.p[2]); U.yaw = s.yaw || 0; F.set(s.q[0], s.q[1], s.q[2], s.q[3]).normalize(); U.set = true; U.chk = 1; } else { U.set = false; U.t0 = performance.now() + 2500; } } catch (e) { ERR('ew', e); } return ew.apply(this, arguments); }; } catch (e) { ERR('ew0', e); }
})();
