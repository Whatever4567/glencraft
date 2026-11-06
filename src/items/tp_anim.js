/* GLX-TP-ANIM (v1.1.99 grips) GLX-TPA (v1.1.54): THIRD PERSON MOVES. The legs follow the stick: how far you push sets slow walk, walk or run, and the direction sets
   forward, strafe or backpedal, all blended smoothly with knees bending. Jumps have a takeoff crouch, tucked legs in the air and a soft
   landing dip. Arms swing against the legs, or hold the gun: rifles with both hands on the gun along the view, pistols one handed at the
   hip and two handed when aiming. Tools and blocks are held upright the same way they look in first person. */
(function tpa() {
  const U = window.__tpa = {err: null, on: 0, sp: 0, st: 0, air: 0, land: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const V = () => new THREE.Vector3(), DN = new THREE.Vector3(0, -1, 0), q = new THREE.Quaternion(), qi = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ');
  let lx = null, lz = 0, vx = 0, vz = 0, ph = 0, amp = 0, fw = 0, st = 0, air = 0, land = 0, wasG = true, last = performance.now(), sprintK = 0;
  const GQ = window.__tpGQ = new THREE.Quaternion();
  // the 3P gun was a flat icon; swap in a copy of the real first person gun model so the barrel points along the view
  function realGun(hm, id) { if (hm.userData.g3 === id) return; const src = held && held.children[0]; if (!src) return; hm.userData.g3 = id; for (const c of [...hm.children]) hm.remove(c); if (hm.material) hm.material = new THREE.MeshBasicMaterial({visible: false}); const c = src.clone(true); c.position.set(0, 0, 0); c.scale.setScalar(1); { // v1.1.58: level the gun from its own shape (muzzle forward, top up) and put its grip on the hand, not the pose it had in first person
      try { src.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(src.matrixWorld).invert(), mm = new THREE.Matrix4(), lb = new THREE.Box3(); src.traverse(m => { if (m.isMesh && m.geometry) { m.geometry.computeBoundingBox(); mm.multiplyMatrices(inv, m.matrixWorld); lb.union(m.geometry.boundingBox.clone().applyMatrix4(mm)); } });
        const ctr = lb.getCenter(V()), mzW = src.userData.muzzle ? src.userData.muzzle.getWorldPosition(V()) : null, fwd = mzW ? mzW.applyMatrix4(inv).sub(ctr) : V().set(0, 0, -1); fwd.normalize();
        const z = fwd.clone().negate(), y = V().set(0, 1, 0).addScaledVector(z, -z.y).normalize(), x = V().crossVectors(y, z), B = new THREE.Matrix4().makeBasis(x, y, z).transpose(); c.quaternion.setFromRotationMatrix(B);
        const back = Math.abs(fwd.z) > 0.5 ? (fwd.z < 0 ? lb.max.z : lb.min.z) : ctr.z, dz = (lb.max.z - lb.min.z) * (fwd.z < 0 ? -1 : 1), G = V().set(ctr.x, lb.min.y + (lb.max.y - lb.min.y) * 0.3, back + dz * (id === IT.PISTOL ? 0.25 : 0.3));
        c.position.copy(G.applyQuaternion(c.quaternion)).negate(); hm.userData.gfix = 1; } catch (_) { let r = new THREE.Quaternion(), o = src; while (o && o !== camera) { r.premultiply(o.quaternion); o = o.parent; } c.quaternion.copy(r); } } c.traverse(o => { o.layers && o.layers.set(0); o.castShadow = true; }); hm.add(c); hm.scale.setScalar(0.9); }
  const ease = (a, b, k) => a + (b - a) * k;
  function pointDown(o, worldT) { o.parent.updateMatrixWorld(true); const s = V(); o.getWorldPosition(s); const d = worldT.clone().sub(s); if (d.lengthSq() < 1e-8) return; o.parent.getWorldQuaternion(qi).invert(); d.applyQuaternion(qi).normalize(); o.quaternion.setFromUnitVectors(DN, d); }
  function ik(arm, T, side, len1, len2, fwd) { const S = V(); arm.updateMatrixWorld(true); arm.getWorldPosition(S); const d = T.clone().sub(S); let L = d.length(); const mx = len1 + len2 - 0.005; if (L > mx) { d.setLength(mx); L = mx; } const dir = d.clone().normalize();
    const ca = Math.max(-1, Math.min(1, (len1 * len1 + L * L - len2 * len2) / (2 * len1 * L))), sa = Math.sqrt(1 - ca * ca);
    const pole = new THREE.Vector3(0, -1, 0).addScaledVector(side, 0.8).addScaledVector(fwd, -0.3); const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const El = S.clone().addScaledVector(dir, len1 * ca).addScaledVector(perp, len1 * sa); pointDown(arm, El); const el = arm.userData.el; if (el) { el.rotation.set(0, 0, 0); pointDown(el, S.clone().add(d)); } }
  function setWorld(o, pos, quat) { o.parent.updateMatrixWorld(true); const pi = o.parent.matrixWorld.clone().invert(); o.position.copy(pos).applyMatrix4(pi); o.parent.getWorldQuaternion(qi).invert(); o.quaternion.copy(qi.multiply(quat)); }
  const aiming = () => { try { return !!((window.__c340 && __c340.k > 0.3) || (window.__c288 && __c288.aiming) || (window.__c145 && __c145.hold)); } catch (_) { return false; } };
  try { const ob = scene.onBeforeRender; scene.onBeforeRender = function () { try { if (ob) ob.apply(this, arguments); } catch (_) {} try { anim(); if (U.on && worldModel) { worldModel.traverse(o => { o.updateMatrix(); }); worldModel.updateMatrixWorld(true); } } catch (e) { ERR('anim', e); } }; } catch (e) { ERR('ob', e); }  // runs inside the frame after every other pose code, so nothing resets the gun after it
  function anim() { const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000) || 0.016; last = now;
    if (lx === null) { lx = P.x; lz = P.z; } const ivx = (P.x - lx) / dt, ivz = (P.z - lz) / dt; lx = P.x; lz = P.z; const kk = 1 - Math.exp(-dt * 10); vx = ease(vx, Math.abs(ivx) < 40 ? ivx : 0, kk); vz = ease(vz, Math.abs(ivz) < 40 ? ivz : 0, kk);
    if (!worldModel || !camMode || !worldModel.userData.hd || !worldModel.visible) { U.on = 0; return; } U.on = 1; const u = worldModel.userData; if (u.mau !== worldModel) { u.mau = worldModel; worldModel.traverse(o => { o.matrixAutoUpdate = true; }); }  // a speed pass froze the model matrices, so poses never showed
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = -fz, rz = fx; const f = vx * fx + vz * fz, s = vx * rx + vz * rz, sp = Math.hypot(vx, vz), onG = P.onGround;
    sprintK = ease(sprintK, typeof sprinting !== 'undefined' && sprinting ? 1 : 0, Math.min(1, dt * 4));
    const ta = Math.min(1, sp / 4.3); amp = ease(amp, onG ? ta : 0, Math.min(1, dt * 8)); fw = ease(fw, sp > 0.3 ? f / sp : 1, Math.min(1, dt * 8)); st = ease(st, sp > 0.3 ? s / sp : 0, Math.min(1, dt * 8));
    ph += dt * (2.2 + sp * 1.55) * (fw < -0.3 ? -1 : 1) * (onG ? 1 : 0.2); U.sp = +sp.toFixed(2); U.st = +st.toFixed(2);
    if (!onG) air = Math.min(1, air + dt * 5); else air = Math.max(0, air - dt * 8); if (onG && !wasG) land = 1; wasG = onG; land = Math.max(0, land - dt * 4); U.air = +air.toFixed(2); U.land = +land.toFixed(2);
    const run = Math.min(1, sp / 6) * 0.6 + sprintK * 0.4, sw = Math.sin(ph) * amp * (0.45 + 0.45 * run), kneeA = (0.25 + 0.75 * run) * amp, fwd = Math.abs(fw), str = st;
    for (let i = 0; i < 2; i++) { const L = u.legs[i], sgn = i ? -1 : 1, phase = ph + (i ? Math.PI : 0), swing = sgn * sw;
      const up = air * (0.55 - 0.25 * Math.sign(P.vy || 0)) + land * 0.45; L.rotation.set(-(swing * fwd) - up * 0.9, 0, -str * Math.sin(phase) * amp * 0.35 + (i ? 1 : -1) * 0.03);
      const kb = Math.max(0, -Math.cos(phase)) * kneeA * 1.3 + 0.08 * amp + air * 1.1 + land * 0.8; if (L.userData.kn) L.userData.kn.rotation.set(kb, 0, 0); }
    u.torso.rotation.set(0.12 * run * amp + land * 0.15 - air * 0.05, Math.sin(ph) * 0.06 * amp, 0);
    worldModel.position.y = P.y + Math.abs(Math.sin(ph)) * 0.04 * amp * (1 + run) - land * 0.12 + air * 0.03;
    // arms and the held item
    const hm = typeof heldMesh3p !== 'undefined' ? heldMesh3p : null, hid = parseInt(heldId) || 0, gunId = hm && GUN && GUN[hid] ? hid : 0, isP = gunId && gunId === IT.PISTOL, aim = aiming(); U.g = gunId; U.n = (U.n || 0) + 1;
    worldModel.updateMatrixWorld(true); let grip = null; const base = V().set(P.x, worldModel.position.y, P.z), F = V().set(fx, 0, fz), R = V().set(-rx, 0, -rz);  // model faces +Z after the yaw + PI, so its right is -rx
    E.set(-P.pitch * 0.9, P.yaw, 0); const qv = new THREE.Quaternion().setFromEuler(E), look = new THREE.Vector3(0, 0, -1).applyQuaternion(qv);
    const k = swingT > 0 ? Math.sin((1 - Math.max(0, swingT) / 0.3) * Math.PI) : 0;
    if (gunId && hm) { realGun(hm, gunId); const two = !isP || aim; grip = base.clone().add(V().set(0, isP && !aim ? 1.08 : 1.30, 0)).addScaledVector(R, isP && !aim ? 0.20 : 0.12).addScaledVector(F, isP && !aim ? 0.25 : 0.30).addScaledVector(look, isP && aim ? 0.28 : 0.05);
      setWorld(hm, grip, (isP && !aim ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, P.yaw, 0, 'YXZ')) : qv.clone()).multiply(GQ));
      ik(u.arms[1], grip.clone().add(V().set(0, -0.052, 0)).addScaledVector(look, -0.035), R, 0.32, 0.30, F);
      if (two) { const fg = isP ? grip.clone().addScaledVector(R, -0.05).add(V().set(0, -0.03, 0)) : grip.clone().addScaledVector(look, 0.42).add(V().set(0, -0.055, 0)).addScaledVector(R, -0.02); { const Ls=V();u.arms[0].getWorldPosition(Ls);if(Ls.distanceTo(fg)>0.60){u.arms[0].position.copy(fg).addScaledVector(R,-0.18).add(V().set(0,0.05,0)).addScaledVector(F,-0.30).sub(worldModel.position).applyQuaternion(worldModel.getWorldQuaternion(new THREE.Quaternion()).invert());}ik(u.arms[0], fg, R.clone().negate(), 0.32, 0.30, F); } }
      else { u.arms[0].rotation.set(-sw * 0.9 * fwd - air * 0.5, 0, -0.06); if (u.arms[0].userData.el) u.arms[0].userData.el.rotation.set(-0.25 - run * 0.5, 0, 0); } }
    else { for (let i = 0; i < 2; i++) { const a = u.arms[i], sgn = i ? 1 : -1; a.quaternion.identity(); a.rotation.set(sgn * sw * 0.9 * fwd - air * 0.8 - land * 0.2, 0, (i ? 1 : -1) * (0.06 + air * 0.25)); if (a.userData.el) a.userData.el.rotation.set(-0.2 - run * 0.7 - air * 0.4, 0, 0); }
      if (hm) { const a = u.arms[1]; a.rotation.x = -0.55 - k * 1.6; if (a.userData.el) a.userData.el.rotation.x = -0.55 + k * 0.3; a.updateMatrixWorld(true);
        const gp = V(); a.userData.grip.getWorldPosition(gp); const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler((hm.userData.tool ? 0.5 : -0.15) - k * 1.1, P.yaw, 0, 'YXZ'));
        const c = held && held.children[0]; if (c && hm.userData.tool) tq.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(c.rotation.x, c.rotation.y, c.rotation.z))); if (hm.userData.block) { hm.scale.setScalar(0.6); } setWorld(hm, gp.add(V().set(0, hm.userData.block ? 0.02 : 0, 0)), tq); } }
    // Third-person wrist targets, elbow poles and item anchors belong to this one final pose pass.
    try { const hasGun = !!(gunId && hm), two = hasGun && (!isP || aim);
      for (let i = 0; i < 2; i++) { const el = u.fore[i], hn = el && el.children.find(c => c.userData.hdHand); if (!hn) continue; const h = hn.userData.hdHand, trigger = i === 1;
        const curls = hasGun ? (trigger ? [1.0, 1.03, 0.94, 0.46] : two ? [0.72, 0.78, 0.78, 0.66] : [0.34, 0.39, 0.43, 0.30]) : hm && trigger ? [0.88, 0.91, 0.94, 0.83] : [0.25, 0.31, 0.34, 0.25];
        h.userData.pose(curls, hasGun ? (trigger ? 0.84 : 0.52) : 0.42, hasGun ? 0 : 0.08);
        // Rotate wrist along the grip without a second accumulated Euler or a size change.
        if (hasGun) { const gripDir = F.clone().multiplyScalar(0.94).add(V().set(0, -0.35, 0)).normalize(); const worldQ = new THREE.Quaternion().setFromUnitVectors(V().set(0, 0.82, -0.57).normalize(), trigger ? gripDir : F.clone().add(V().set(0, -0.48, 0)).normalize());
          // Local wrist bone aims down the hand. The same basis is used every frame, never relative to the last pose.
          const target = trigger ? grip.clone().addScaledVector(F, -0.025).add(V().set(0, -0.055, 0)) : grip.clone().addScaledVector(look, 0.42).add(V().set(0, -0.055, 0)); setWorld(hn, target, worldQ.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI)))); }
      } } catch (e) { ERR('hands', e); }
    u.head.rotation.set(-P.pitch * 0.6, 0, 0); }
})();
