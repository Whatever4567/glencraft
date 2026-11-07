/* GLX-CAB1221 (v1.2.21): time box cabin while flying. The pilot camera no longer bobs or dips with the box speed, both hands hold a T grip
   on the stick and move with it, the normal hand, tools and HUD are hidden while you fly, and a watchdog puts you back in the cabin (or on the
   floor by the door) if anything ever leaves you outside the room or stuck in rock. */
(function cab1221() {
  const T = window.__tbox, F = () => window.__tbox3, V = () => window.__v130; if (!T) return;
  const U = window.__cab1221 = {err: null, rescues: 0, lifts: 0, hud: 0, arms: 0, last: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const piloting = () => { const f = F(); return !!(f && f.pilot && T.inside); };
  U.piloting = piloting;
  // 1) no walking bob, step dip or landing dip on the pilot camera (the box moving made the body look like it was running)
  try { const pc = placeCamera; placeCamera = function (bx, by, rx, rz) { if (piloting()) { try { bobAmp = 0; bobMv = 0; landDip = 0; stepT = 1; stepOff = 0; } catch (_) {} return pc.call(this, 0, 0, rx, rz); } return pc.apply(this, arguments); }; } catch (e) { ERR('pc', e); }
  // 2) HUD off while flying (pause, the Fly / Let go button and the touch flight pad stay)
  const css = document.createElement('style'); css.textContent = 'body.cab1221 #hud,body.cab1221 #padHints,body.cab1221 #itemName{visibility:hidden!important}'; document.head.appendChild(css);
  // 3) two hands on a T grip
  let built = false, bar = null, H = [], A = []; const Y = new THREE.Vector3(0, 1, 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q = new THREE.Quaternion();
  function mkHand(side) { const SM = T.SM || (m => m), skin = SM(new THREE.MeshLambertMaterial({color: 0xe0b08a})), knuck = SM(new THREE.MeshLambertMaterial({color: 0xd29f7a})), sl = SM(new THREE.MeshLambertMaterial({color: 0x2a3a6a})), cuff = SM(new THREE.MeshLambertMaterial({color: 0x1c2848}));
    const g = new THREE.Group(); const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.035), skin); palm.position.set(0, 0, 0.045); g.add(palm);
    // four fingers, two segments each, wrapped round the grip (grip axis = local x)
    for (let i = 0; i < 4; i++) { const x = -0.03 + i * 0.02, f1 = new THREE.Group(); f1.position.set(x, 0.05, 0.045); f1.rotation.x = -1.2; g.add(f1);
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0105, 0.045, 6), skin); s1.position.y = 0.0225; f1.add(s1);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), knuck); k.position.y = 0.045; f1.add(k);
      const f2 = new THREE.Group(); f2.position.y = 0.045; f2.rotation.x = -1.3; f1.add(f2); const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0095, 0.04, 6), skin); s2.position.y = 0.02; f2.add(s2);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), skin); tip.position.y = 0.04; f2.add(tip); }
    const th = new THREE.Group(); th.position.set(side * 0.045, -0.02, 0.03); th.rotation.set(-0.6, 0, side * 0.9); g.add(th); const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.05, 6), skin); t1.position.y = 0.025; th.add(t1);
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.035, 6), skin); t2.position.y = 0.065; t2.rotation.x = -0.5; th.add(t2);
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.06, 10), skin); wr.rotation.x = Math.PI / 2; wr.position.set(0, -0.01, 0.09); g.add(wr);   // wrist joins palm and sleeve with no gap
    const arm = new THREE.Group(); const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 1, 10), sl); fore.geometry.translate(0, 0.5, 0); arm.add(fore);
    const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.05, 10), cuff); cf.position.y = 0.025; arm.add(cf);
    for (const o of [g, arm]) { o.traverse(m => { m.frustumCulled = false; if (m.material) { m.material.stencilFunc = THREE.AlwaysStencilFunc; m.material.needsUpdate = true; } }); o.visible = false; scene.add(o); }
    return [g, arm, fore]; }
  function build() { const v = V(); if (!v || !v.parts) return; const p = v.parts(); if (!p || !p.stick || !p.knob) return;
    const SM = T.SM || (m => m), chrome = SM(new THREE.MeshPhongMaterial({color: 0xd8dde8, emissive: 0x202436, specular: 0xffffff, shininess: 140}));
    bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 10), chrome); bar.rotation.z = Math.PI / 2; bar.position.copy(p.knob.position); p.stick.add(bar);
    for (const sd of [-1, 1]) { const [g, arm, fore] = mkHand(sd); H.push(g); A.push([arm, fore, sd]); } built = true; }
  const SH = [[-0.27, -0.42, -0.02], [0.27, -0.42, -0.02]];
  function place(on) { if (!built) build(); if (!built) return; for (let i = 0; i < 2; i++) { H[i].visible = A[i][0].visible = on; } if (!on) return;
    bar.updateMatrixWorld(true); camera.updateMatrixWorld(true); bar.getWorldQuaternion(q);
    for (let i = 0; i < 2; i++) { const sd = A[i][2]; v1.set(0, sd * 0.12, 0).applyMatrix4(bar.matrixWorld);   // bar local y runs along the bar (it is rotated 90 degrees)
      const g = H[i]; g.position.copy(v1); g.quaternion.copy(camera.quaternion);
      v2.set(SH[i][0], SH[i][1], SH[i][2]).applyMatrix4(camera.matrixWorld); const wrist = v1.clone().add(new THREE.Vector3(0, -0.01, 0.12).applyQuaternion(camera.quaternion)); const d = wrist.clone().sub(v2), L = d.length() || 1;
      const arm = A[i][0]; arm.position.copy(v2); arm.quaternion.setFromUnitVectors(Y, d.divideScalar(L)); A[i][1].scale.set(1, L, 1); A[i][0].children[1].position.y = L - 0.025; } U.arms++; }
  U.place = place;
  // hide the normal first person hand / arms rig (and so any tool in it) for frames drawn while flying; restored right after
  try { const rr = renderer.render; renderer.render = function (sc, cam) { let hide = null; try { if (sc === scene && cam !== camera && built && piloting()) { hide = []; for (const o of H.concat(A.map(a => a[0]))) if (o.visible) { o.visible = false; hide.push(o); } } if (sc === scene && cam === camera) { const on = piloting(); place(on); if (on) { hide = []; const R = window.__fpa && __fpa.rig ? __fpa.rig() : null; for (const o of [typeof hand !== 'undefined' ? hand : null, R]) if (o && o.visible) { o.visible = false; hide.push(o); } } } } catch (e) { ERR('r', e); }
      try { return rr.apply(this, arguments); } finally { if (hide) for (const o of hide) o.visible = true; } }; } catch (e) { ERR('rr', e); }
  // 4) watchdog: HUD class, third person off while flying, recovery
  let cm = null, wasP = false;
  setInterval(() => { try { const on = piloting(); document.body.classList.toggle('cab1221', on); if (on !== wasP) { U.hud++; if (on) { try { cm = camMode; camMode = 0; } catch (_) {} } else if (cm != null) { try { camMode = cm; } catch (_) {} cm = null; } wasP = on; }
      if (!T.S || !T.S.on || typeof started === 'undefined' || !started || DIM.cur) return; const S = T.S, f = F();
      const bad = v => !isFinite(v); if (bad(S.x) || bad(S.y) || bad(S.z)) { if (U.last) { T.place(U.last[0], U.last[1], U.last[2]); U.rescues++; } return; }
      if (bad(P.x) || bad(P.y) || bad(P.z)) { P.x = S.x; P.y = S.y; P.z = S.z + T.HW + 1.2; P.vy = 0; U.rescues++; return; }
      if (f && f.pilot) { const CZ = T.HW - T.RR, dx = P.x - S.x, dz = P.z - (S.z + CZ); if (!T.inside || Math.hypot(dx, dz) > T.RR + 1 || Math.abs(P.y - S.y) > 3) { T.inside = true; P.x = S.x; P.y = S.y; P.z = S.z + CZ + 2.0; P.vy = 0; U.rescues++; } }
      // stuck in rock after a fast flight: lift the box until its shell is clear (at most 64 blocks)
      if (T.inside && f && !f.pilot) { let k = 0; const hit = (x, y, z) => { T.__raw = 1; try { for (const [ox, oz] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85], [0, 0]]) for (const oy of [0.1, 1.3, 2.5]) if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; } finally { T.__raw = 0; } return false; };
        if (hit(S.x, S.y, S.z)) { const rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z; let y = S.y; while (k < 64 && hit(S.x, y, S.z)) { y += 1; k++; } if (k < 64) { T.place(S.x, y, S.z); P.x = S.x + rx; P.y = S.y + ry; P.z = S.z + rz; P.vy = 0; U.lifts++; } } }
      U.last = [S.x, S.y, S.z]; } catch (e) { ERR('wd', e); } }, 250);
})();
