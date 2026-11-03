/* ===================== GLX-C106 (v0.9.87): mobs can't walk into you, Treeman face-to-face death stare + huge throw ===================== */
(function c106() {
  const U = window.__c106 = {pushes: 0, throws: 0, capped: 0};
  // ---------- personal space: mobs stop at arm's length and are pushed out if they overlap you ----------
  const SKIP = new Set(['bee', 'dragon', 'duck', 'puffer']);
  const minD = a => a.kind === 'zombie' ? 1.1 : a.kind === 'treeman' ? 1.15 : a.kind === 'giant' || a.giant || a.big ? 1.6 : 0.3 + Math.min(0.75, (a.hitR || 0.4) * 0.9);
  function personal() {
    if (!started || dead) return;
    for (const a of mobs) {
      if (!a || !a.g || heldBy === a || SKIP.has(a.kind) || a.tamed || a.mounted || (typeof riding !== 'undefined' && riding && (riding === a || riding.mob === a))) continue;
      const p = a.g.position, dx = p.x - P.x, dz = p.z - P.z; if (Math.abs(dx) > 3 || Math.abs(dz) > 3) continue;
      const top = p.y + (a.tall || 2); if (top < P.y + 0.2 || p.y > P.y + HEIGHT - 0.2) continue;
      const d = Math.hypot(dx, dz), m = minD(a); if (d >= m) continue;
      const ux = d > 1e-3 ? dx / d : Math.sin(a.ang || 0), uz = d > 1e-3 ? dz / d : Math.cos(a.ang || 0), nx = P.x + ux * m, nz = P.z + uz * m;
      if (!solid(Math.floor(nx), Math.floor(p.y + 0.2), Math.floor(nz)) && !solid(Math.floor(nx), Math.floor(p.y + 1.1), Math.floor(nz))) { p.x = nx; p.z = nz; }
      else { const k = (m - d); P.x -= ux * k * 0.5; P.z -= uz * k * 0.5; }   // pinned against a wall: nudge you instead
      if (a.kbx !== undefined && (a.kbx * -ux + a.kbz * -uz) > 0) { a.kbx = 0; a.kbz = 0; }
      U.pushes++;
    }
  }
  const um = updateMobs; updateMobs = function () { const r = um.apply(this, arguments); try { personal(); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } return r; };
  U.personal = personal;

  // ---------- Treeman grab: hold you up in front of his face, look you in the eye, death stare, then hurl you ----------
  const T0 = 6.4, LIFT = 0.7, STARE = 2.6, SPIN = 2.4, THROW = LIFT + STARE + 0.25 + SPIN;   // v1.0.0: longer hold, then a slow spin before the throw
  let glowTex = null;
  function glowSprite() {
    if (!glowTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.25, 'rgba(255,90,40,.9)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); }
    return new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0}));
  }
  function face(a) {
    if (a.c106f) return a.c106f;
    const h = a.head, eyes = [], f = {eyes, mouth: null, brows: [], glow: []};
    for (const c of h.children) { if (c.material === a.eyeM) eyes.push(c); else if (c.material && c.material !== a.eyeM && Math.abs(c.position.y - 0.14) < 0.01 && Math.abs(c.position.z - 0.285) < 0.01) f.mouth = c; }
    const browM = new THREE.MeshBasicMaterial({color: 0x1a0c04});
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.03), browM); b.position.set(sx * 0.15, 0.47, 0.3); b.rotation.z = sx * 0.45; b.visible = false; h.add(b); f.brows.push(b); }
    for (const e of eyes) { const s = glowSprite(); s.position.set(e.position.x, e.position.y, e.position.z + 0.04); s.scale.set(0.42, 0.42, 1); s.visible = false; h.add(s); f.glow.push(s); }
    f.eyeCol = a.eyeM.color.getHex();
    return a.c106f = f;
  }
  function setAngry(a, k) {
    const f = face(a);
    for (const b of f.brows) b.visible = k > 0.05;
    for (const s of f.glow) { s.visible = k > 0.02; s.material.opacity = k * (0.85 + Math.random() * 0.15); }
    for (const e of f.eyes) e.scale.set(1 + k * 0.35, 1 + k * 0.6, 1);
    if (f.mouth) { f.mouth.scale.set(1 + k * 0.25, 1 + k * 1.9, 1); f.mouth.position.y = 0.14 - k * 0.04; }
    a.eyeM.color.setHex(k > 0.05 ? 0xffe0c0 : f.eyeCol);
  }
  U.setAngry = setAngry;
  treemanGrab = function (a, dt) {
    const nowG = performance.now(); if (!a.gLast || nowG - a.gLast > 400) { a.grabT = T0; a.spinA = 0; } a.gLast = nowG;
    a.grabT -= dt;
    const t = T0 - a.grabT, pos = a.g.position, sc = a.g.scale ? a.g.scale.y || 1 : 1;
    const t0 = T0 - a.grabT, spinS = LIFT + STARE + 0.25;
    if (t0 > spinS && t0 < THROW) { const u = (t0 - spinS) / SPIN, w = 1.6 + u * u * 9; a.spinA = (a.spinA || 0) + w * dt; a.yawVis = (a.yawVis !== undefined ? a.yawVis : a.ang) + w * dt; a.ang = a.yawVis; a.g.rotation.y = a.yawVis; a.spinW = w; }
    const yw = a.yawVis !== undefined ? a.yawVis : a.ang, fx = Math.sin(yw), fz = Math.cos(yw);
    const eyeY = pos.y + (2.2 + 0.38) * sc, hold = 1.85 * sc;            // his eyes; you are held at arm's length in front of them
    const lift = Math.min(1, t / LIFT), e = lift * lift * (3 - 2 * lift);
    const wantY = eyeY - 0.08 - EYE;   // a touch below his eyes, so you look up into his face                                      // your eyes just above his, so he looks up into them
    const k = Math.min(1, dt * (a.spinW ? 30 : 12));
    P.x += (pos.x + fx * hold - P.x) * k; P.z += (pos.z + fz * hold - P.z) * k;
    P.y += ((pos.y + 0.4) + (wantY - pos.y - 0.4) * e - P.y) * Math.min(1, dt * 10); P.vy = 0; P.fallTop = null; P.kbx = P.kbz = 0;
    // you face him, eye to eye
    const ex = pos.x - P.x, ez = pos.z - P.z, hd = Math.hypot(ex, ez) || 1;
    P.yaw = Math.atan2(-ex, -ez); const wp = Math.atan2(eyeY - (P.y + EYE), hd); P.pitch += (wp - P.pitch) * Math.min(1, dt * 8);
    // his head tilts up to stare straight into your eyes
    if (a.head) { a.head.rotation.order = 'YXZ'; const up = Math.atan2((P.y + EYE) - (eyeY - 0.08), hd); a.head.rotation.x += (-up - a.head.rotation.x) * Math.min(1, dt * 10); a.head.rotation.y *= Math.max(0, 1 - dt * 10); a.head.rotation.z = 0; a.head.position.x = 0; }
    // arms straight out, gripping you at the sides
    const sh = Math.sin(t * 22) * (t > LIFT && t < LIFT + STARE ? 0.02 : 0);
    a.arms[0].rotation.x = a.arms[1].rotation.x = -Math.PI / 2 + 0.12 + sh; a.arms[0].rotation.z = 0.22; a.arms[1].rotation.z = -0.22;
    const st = t >= LIFT && t < THROW;
    setAngry(a, st ? Math.min(1, (t - LIFT) / 0.18) : Math.max(0, 1 - (t - THROW) * 5));
    if (st && !a.roared) { a.roared = true; try { sfx3d('roar', pos, 40); } catch (_) {} try { shake(1.2, 0.035); } catch (_) {} }
    if (t >= THROW) {
      heldBy = null; a.grabT = 0; a.gLast = 0; a.spinW = 0;
      const side = 1, tx = fx * 0.75 + fz * side * 0.65, tz = fz * 0.75 - fx * side * 0.65, l = Math.hypot(tx, tz);   // flung off the spin
      a.arms[0].rotation.x = a.arms[1].rotation.x = -2.6; a.arms[0].rotation.z = -0.12; a.arms[1].rotation.z = 0.12;
      knockPlayer(tx / l, tz / l, 46, 20); invuln = 0; hurt(4, 'Hurled across the glen by a Treeman.');
      U.throws++; U.thrownAt = performance.now(); U.thrownY = P.y;
      try { sfx('thud'); } catch (_) {} a.state = 'stare'; a.cool = 12; a.gaze = 0; a.twist = 0.4;
      setTimeout(() => { try { setAngry(a, 0); } catch (_) {} }, 400);
    }
  };
  // the landing after a Treeman throw hurts, but never more than 8 and never from full health to dead
  const hu = hurt; hurt = function (n, cause) {
    if (U.thrownAt && performance.now() - U.thrownAt < 9000 && /fall/i.test(String(cause || ''))) { const c = Math.min(n, 8, Math.max(1, hp - 1)); if (c < n) U.capped++; n = c; U.thrownAt = 0; }
    return hu.apply(this, [n, cause].concat([].slice.call(arguments, 2)));
  };
})();
