/* v1.2.49 fp-vm-1259: a dedicated first-person viewmodel, posed in camera
 * space like an FPS arms rig. The item is parented to a grip socket on the
 * hand; the arm is posed, the hand never follows the item. 279fd13 remains
 * the fallback when this rig is disabled or fails to boot. */
(function fpVm1259(W) {
  const U = W.__fpVm1259 = {
    on: 0, active: 0, disabled: 0, err: null, version: '1.2.49',
    kind: '', ads: 0, fov: 70
  };
  const T = W.THREE;
  if (!T) return;
  const ERR = function (w, e) {
    if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 280);
  };

  const FP_FOV = 70;
  const FP_NEAR = 0.04;
  const FP_FAR = 8;
  const REF_ASPECT = 412 / 915;
  const MIN_FORE = 0.30;
  const SLEEVE_R = 0.036;
  const CUFF_R = 0.043;
  const CUFF_H = 0.026;
  const Y = new T.Vector3(0, 1, 0);

  // Per-item pose table in portrait NDC + camera Z (z < 0).
  // Shoulder anchors sit just off the bottom-right (and bottom-left for
  // two-handed poses) of a 412x915 frame. wr is the wrist. handRot is
  // extra Euler on top of "hand follows the forearm." item is local to
  // the grip socket. Shape and placement first; materials are linen/skin
  // already, with tartan only on the musket-aim support sleeve.
  //
  // sh/wr: [ndcX, ndcY, zCam]
  const POSES = {
    empty: {
      two: 0, hs: 0.88,
      // 1265: small relaxed hand low in the bottom-right corner, fingers
      // loosely curled (not a huge splayed claw). Sleeve radius follows.
      R: { sh: [0.70, -1.36, -0.62], wr: [0.42, -0.78, -0.58], rot: [0, 0, 0], haft: [0.40, -0.35, 0.15], curl: 1, rs: 0.72 }
    },
    block: {
      two: 0, hs: 1.22,
      // 1266: forearm angled in from the bottom-right, cube still cupped mid-low.
      R: { sh: [1.18, -1.34, -0.52], wr: [0.42, -0.48, -0.52], rot: [0, 0, 0], haft: [-0.72, 0.18, 0.08], face: 'palmUp', curl: 1 },
      item: { p: [0.00, 0.06, -0.012], r: [0.10, 0.18, 0.08], s: 0.55 }
    },
    p761: {
      two: 0, hs: 1.20,
      // 1269: socket near frame centre (image x ~0.45-0.50, y ~0.18),
      // fist bottom-right but left of 1265 (image x ~0.6, y ~0.7),
      // haft nearly vertical (slight lean) so a ~30% head fits with sky margin.
      R: { sh: [1.12, -1.32, -0.50], wr: [0.40, -0.64, -0.56], rot: [0, 0, 0], haft: [-0.05, 0.999, 0], curl: 1 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.44 }
    },
    pick: null,
    p760: null,
    sword: {
      two: 0, hs: 1.18,
      R: { sh: [1.24, -1.08, -0.50], wr: [0.42, -0.50, -0.55], rot: [0, 0, 0], haft: [-0.16, 0.99, 0], curl: 1 },
      item: { p: [-0.06, 0.00, 0.00], r: [1.57, 0.00, -1.57], s: 1.10 }
    },
    torch: {
      two: 0, hs: 1.18,
      R: { sh: [1.20, -1.14, -0.52], wr: [0.32, -0.56, -0.54], rot: [0, 0, 0], haft: [-0.34, 0.94, 0], curl: 1 },
      item: { p: [-0.04, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.38, flameS: 0.90, shaftS: 0.55 }
    },
    map: {
      two: 0, hs: 1.16,
      R: { sh: [0.70, -1.16, -0.50], wr: [0.10, -0.18, -0.50], rot: [0.10, 0.05, 0.00], haft: [0.70, 0.35, 0], curl: 1 },
      item: { p: [0.00, 0.00, 0.00], r: [1.57, 0.12, 0.06], s: 1.05 }
    },
    bucket: {
      two: 0, hs: 1.16,
      // 1265: fist holds the bail, bucket centred (~x 0.5-0.6) and held up in
      // front; arm rises from the bottom-right so the opening (and water) is
      // not covered. A slight tip toward the camera shows the water surface.
      R: { sh: [1.28, -1.30, -0.54], wr: [0.36, 0.00, -0.52], rot: [0, 0, 0], haft: [1.00, 0.08, 0], curl: 1 },
      item: { p: [-0.03, -0.08, -0.04], r: [0.45, 0.00, 0.00], s: 0.62 }
    },
    pistol: {
      two: 0, hs: 1.16,
      R: { sh: [0.90, -1.20, -0.48], wr: [0.22, -0.32, -0.50], rot: [0, 0, 0], haft: [0.10, 0.95, 0], curl: 1 },
      item: { p: [0.00, 0.00, 0.00], r: [0.20, 3.94, 1.57], s: 1.12 }
    },
    pistolAds: {
      // 1268: centred look-down-the-sights; both hands fist-wrap the grip.
      two: 1, hs: 1.00,
      R: { sh: [0.62, -1.22, -0.50], wr: [0.16, -0.42, -0.52], rot: [0, 0, 0], haft: [0.00, 0.12, -1.00], curl: 1, sleeve: 'linen' },
      L: { sh: [-0.50, -1.22, -0.58], wr: [-0.04, -0.42, -0.58], rot: [0, 0, 0], haft: [0.00, 0.12, -1.00], curl: 1, sleeve: 'linen', hs: 1.00 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 1.10 }
    },
    musket: {
      two: 1, hs: 0.98,
      R: { sh: [1.40, -0.65, -0.56], wr: [0.32, -0.44, -0.58], rot: [0, 0, 0], haft: [-0.74, 0.58, 0], curl: 1 },
      L: { sh: [-1.35, -1.55, -1.15], wr: [-0.42, -0.18, -0.95], rot: [0, 0, 0], haft: [-0.74, 0.58, 0], curl: 1, hs: 0.70 },
      item: { p: [0.06, -0.02, 0.00], r: [0.00, -1.57, 0.00], s: 0.95 }
    },
    musketAds: {
      two: 1, hs: 0.88,
      R: { sh: [0.78, -1.24, -0.54], wr: [0.30, -0.52, -0.54], rot: [0, 0, 0], haft: [0.00, 0.15, -1.00], curl: 1, sleeve: 'linen' },
      L: { sh: [-0.62, -1.26, -0.66], wr: [-0.14, -0.54, -0.64], rot: [0, 0, 0], haft: [0.00, 0.15, -1.00], curl: 1, sleeve: 'tartan', hs: 0.74 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 1.00 }
    },
    axe: null, shovel: null, hoe: null,
    other: {
      two: 0, hs: 1.16,
      R: { sh: [1.20, -1.14, -0.48], wr: [0.42, -0.32, -0.55], rot: [0, 0, 0], haft: [-0.40, 0.80, 0], curl: 1 },
      item: { p: [0, 0, 0], r: [0, 0, 1.57], s: 1 }
    }
  };
  POSES.pick = POSES.p761;
  POSES.p760 = POSES.p761;
  POSES.axe = POSES.sword;
  POSES.shovel = POSES.sword;
  POSES.hoe = POSES.sword;
  U.POSES = POSES;

  let vs, vc, rig, armR, armL, amb, key, fill, hooked = 0;
  let heldParent = null, heldParented = 0, hidden = [];
  const _v = new T.Vector3(), _q = new T.Quaternion(), _y = new T.Vector3(0, 1, 0);

  function kindOf() {
    try {
      const id = (typeof selId !== 'undefined') ? selId : null;
      const mesh = (typeof held !== 'undefined' && held && held.children && held.children[0]) || null;
      if (!mesh && (id == null || id === 0 || id === '0')) return 'empty';
      const H = W.__held1240;
      if (H && typeof H.kindOf === 'function' && mesh) {
        const k = H.kindOf(mesh, id);
        if (k) return k;
      }
      if (typeof IT !== 'undefined' && id != null) {
        if (id === 761 || id === IT.PCPICK) return 'p761';
        if (id === IT.MAP || id === 410) return 'map';
        if (id === IT.TORCH || id === 67) return 'torch';
        if (id === IT.BUCKET || id === IT.WATERB || id === 39 || id === 48) return 'bucket';
        if (id === IT.PISTOL || id === 212) return 'pistol';
        if (id === IT.MUSKET || id === 213) return 'musket';
        if (id === 12 || id === IT.COBBLE || id === IT.COBBLESTONE) return 'block';
      }
      if (!mesh) return 'empty';
      return 'other';
    } catch (e) { ERR('kind', e); return 'other'; }
  }
  function isAds() {
    try {
      if (W.__c340 && +W.__c340.k > 0.45) return true;
      if (typeof S !== 'undefined' && S && S.adsK > 0.45) return true;
      if (W.__c288 && W.__c288.aiming) return true;
      if (W.__c145 && (W.__c145.force || W.__c145.hold)) return true;
    } catch (_) {}
    return false;
  }
  function isTp() {
    try { return !!(W.__thirdPerson || (typeof camMode !== 'undefined' && camMode)); } catch (_) { return false; }
  }

  function ndcCam(nx, ny, z, aspect) {
    const hy = Math.tan(FP_FOV * 0.5 * Math.PI / 180) * Math.abs(z);
    const hx = hy * (aspect || REF_ASPECT);
    return new T.Vector3(nx * hx, ny * hy, z);
  }

  function linen() {
    try { return (W.__hands1249 && W.__hands1249.linenMat && W.__hands1249.linenMat()) || null; } catch (_) { return null; }
  }
  function fpLinen() {
    try { return (W.__hands1249 && W.__hands1249.linenMatFp && W.__hands1249.linenMatFp()) || null; } catch (_) { return null; }
  }
  function fpSkin() {
    try { return (W.__hands1249 && W.__hands1249.skinMatFp && W.__hands1249.skinMatFp()) || null; } catch (_) { return null; }
  }
  function knuckleFp() {
    try { return (W.__hands1249 && W.__hands1249.knuckleMatFp && W.__hands1249.knuckleMatFp()) || null; } catch (_) { return null; }
  }
  function paintFpSkin(root) {
    if (!root) return;
    const sm = fpSkin();
    const lm = fpLinen();
    const km = knuckleFp();
    if (!sm && !lm) return;
    root.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      if (o.userData && o.userData.nail1249) return;
      if (o.userData && o.userData.crease1262) return;
      const n = o.name || '';
      if (lm && (o.userData.fpSleeve1259 || o.userData.fpCuff1259 || /FpSleeve|FpCuff/.test(n))) {
        o.material = lm;
        return;
      }
      if (km && o.userData && o.userData.knuckle1263) { o.material = km; return; }
      if (sm && o.userData && (o.userData.sculptKeep || o.userData.sculpt1249)) o.material = sm;
    });
  }
  function tartan() {
    try { return (W.__hands1249 && W.__hands1249.tartanMat && W.__hands1249.tartanMat()) || null; } catch (_) { return null; }
  }

  function wrinkleCyl(g, amount) {
    const p = g.attributes.position;
    if (!p) return g;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z) || 1e-6;
      const wr = 1 + amount * (0.07 * Math.sin(a * 5 + y * 10) + 0.045 * Math.sin(a * 9 - y * 16) + 0.03 * Math.sin(y * 22 + a * 2));
      p.setX(i, (x / r) * r * wr);
      p.setZ(i, (z / r) * r * wr);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  function unitSleeveGeo() {
    // Height 1 along +Y, from y=0 (shoulder) to y=1 (wrist). More rings
    // so linen folds have something to wrinkle.
    const g = new T.CylinderGeometry(SLEEVE_R, SLEEVE_R * 1.05, 1, 24, 16, false);
    g.translate(0, 0.5, 0);
    return wrinkleCyl(g, 1.0);
  }
  function cuffGeo() {
    // Solid rolled cuff — a short thick band with visible folds.
    const g = new T.CylinderGeometry(CUFF_R, CUFF_R * 0.96, CUFF_H, 24, 3, false);
    return wrinkleCyl(g, 0.7);
  }

  function makeArm(side) {
    const arm = new T.Group();
    arm.name = side > 0 ? 'FpArmR' : 'FpArmL';
    arm.userData.side = side;
    arm.userData.fpArm1259 = 1;
    const lm = fpLinen() || linen() || new T.MeshPhongMaterial({ color: 0xe8e2d6, shininess: 4 });
    const sleeve = new T.Mesh(unitSleeveGeo(), lm);
    sleeve.name = 'FpSleeve';
    sleeve.userData.fpSleeve1259 = 1;
    sleeve.userData.sculptKeep = 1;
    sleeve.frustumCulled = false;
    sleeve.castShadow = false;
    sleeve.renderOrder = 4;
    arm.add(sleeve);
    const cuff = new T.Mesh(cuffGeo(), lm);
    cuff.name = 'FpCuff';
    cuff.userData.fpCuff1259 = 1;
    cuff.userData.sculptKeep = 1;
    cuff.frustumCulled = false;
    cuff.renderOrder = 4;
    arm.add(cuff);
    // A second slightly looser roll just behind the first, still a band.
    const roll = new T.Mesh(
      new T.CylinderGeometry(CUFF_R * 1.06, CUFF_R * 1.02, CUFF_H * 0.55, 20, 1, false),
      lm
    );
    roll.name = 'FpCuffRoll';
    roll.userData.fpCuff1259 = 1;
    roll.userData.sculptKeep = 1;
    roll.frustumCulled = false;
    roll.renderOrder = 4;
    arm.add(roll);
    // Third, slightly looser outer fold of the rolled cuff.
    const roll2 = new T.Mesh(
      wrinkleCyl(new T.CylinderGeometry(CUFF_R * 1.10, CUFF_R * 1.04, CUFF_H * 0.42, 24, 2, false), 0.55),
      lm
    );
    roll2.name = 'FpCuffRoll2';
    roll2.userData.fpCuff1259 = 1;
    roll2.userData.sculptKeep = 1;
    roll2.frustumCulled = false;
    roll2.renderOrder = 4;
    arm.add(roll2);
    const wrist = new T.Group();
    wrist.name = 'FpWrist';
    arm.add(wrist);
    let hand = null;
    try {
      if (W.__hands1249 && typeof W.__hands1249.buildHand === 'function') {
        hand = W.__hands1249.buildHand(side);
      }
    } catch (e) { ERR('hand', e); }
    if (!hand) {
      hand = new T.Group();
      hand.userData.f = [];
    }
    hand.frustumCulled = false;
    wrist.add(hand);
    const grip = new T.Group();
    grip.name = 'FpGrip';
    grip.userData.fpGrip1259 = 1;
    // Sit in the palmar cup: +Y toward fingertips, -Z palm.
    grip.position.set(0, 0.052, -0.010);
    hand.add(grip);
    arm.userData.p = { sleeve: sleeve, cuff: cuff, roll: roll, roll2: roll2, wrist: wrist, h: hand, grip: grip, side: side };
    try { paintFpSkin(hand); } catch (_) {}
    arm.traverse(function (o) {
      if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.renderOrder = 4; }
    });
    return arm;
  }

  function dressSleeve(arm, kind) {
    const p = arm && arm.userData && arm.userData.p;
    if (!p) return;
    const mat = (kind === 'tartan' ? tartan() : (fpLinen() || linen())) || p.sleeve.material;
    if (mat) {
      p.sleeve.material = mat;
      p.cuff.material = mat;
      p.roll.material = mat;
      if (p.roll2) p.roll2.material = mat;
    }
  }

  function curlHand(h, amt, opts) {
    if (!h || !h.userData) return;
    opts = opts || {};
    const mode = opts.mode || 'fist';
    const side = (h.userData && h.userData.side) || 1;
    const fingers = h.userData.f || [];
    // Joint angles in radians, curled toward the palm (-Z). A full grip is
    // ~80-100° (1.4-1.75 rad) per joint so the fingers wrap a handle.
    let p0, k0, d0, spread;
    if (mode === 'relax') { p0 = 1.02; k0 = 1.12; d0 = 0.88; spread = 0.02; }
    else if (mode === 'cup') { p0 = 0.34; k0 = 0.40; d0 = 0.22; spread = 0.12; }
    else if (mode === 'pinch') { p0 = 0.85; k0 = 1.05; d0 = 0.80; spread = 0.02; }
    else { p0 = 1.55; k0 = 1.70; d0 = 1.25; spread = 0.02; } // fist
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      const f = pair && (pair[0] || pair);
      const k = pair && (pair[1] || (f && f.userData && f.userData.k));
      if (!f) continue;
      let pa = p0, ka = k0, da = d0;
      if (opts.trigger && i === 0) { pa = 0.28; ka = 0.22; da = 0.15; }
      if (mode === 'pinch' && i === 0) { pa = 0.90; ka = 1.10; da = 0.85; }
      if (mode === 'pinch' && i > 1) { pa = 1.25; ka = 1.35; da = 1.05; }
      if (opts.support && mode !== 'cup') { pa = Math.min(pa, 0.90); ka = Math.min(ka, 1.00); da = Math.min(da, 0.70); }
      // Negative X curls fingertips toward -Z (the palmar cup).
      f.rotation.x = -pa;
      f.rotation.z = (i - 1.5) * -spread;
      if (k) {
        k.rotation.x = -ka;
        const d = k.userData && k.userData.d;
        if (d) d.rotation.x = -da;
      }
    }
    const th = h.userData.th;
    if (th) {
      if (mode === 'fist') {
        th.rotation.set(-0.20, side * 1.10, side * 0.55);
        if (th.userData && th.userData.k) {
          th.userData.k.rotation.set(-0.75, 0, 0);
          const td = th.userData.k.userData && th.userData.k.userData.d;
          if (td) td.rotation.set(-0.55, 0, 0);
        }
      } else if (mode === 'pinch') {
        th.rotation.set(0.15, side * 1.05, side * 0.45);
        if (th.userData && th.userData.k) th.userData.k.rotation.set(-0.80, 0, 0);
      } else if (mode === 'cup') {
        th.rotation.set(0.25, side * 0.70, side * 0.30);
        if (th.userData && th.userData.k) th.userData.k.rotation.set(-0.25, 0, 0);
      } else {
        th.rotation.set(0.30, side * 0.45, side * 0.22);
        if (th.userData && th.userData.k) th.userData.k.rotation.set(-0.15, 0, 0);
      }
    }
  }

  // Aim the hand in camera space so the dorsum (+Z) faces the camera (we see
  // knuckles) and +X, the palm-width / handle axis, follows spec.haft.
  const _hz = new T.Vector3(), _hx = new T.Vector3(), _hy = new T.Vector3();
  const _hm = new T.Matrix4(), _hq = new T.Quaternion(), _hi = new T.Quaternion();
  function orientHand(arm, spec, side) {
    const p = arm.userData.p;
    const haft = spec.haft || (side > 0 ? [-0.45, 0.80, 0] : [0.45, 0.70, 0]);
    if (spec.face === 'palmUp') _hz.set(0, -0.82, -0.35);
    else _hz.set(0, 0, 1);
    _hx.set(haft[0], haft[1], haft[2] || 0);
    _hx.addScaledVector(_hz, -_hx.dot(_hz));
    if (_hx.lengthSq() < 1e-6) _hx.set(side > 0 ? -0.4 : 0.4, 0.8, 0);
    _hx.normalize();
    _hy.crossVectors(_hz, _hx).normalize();
    _hx.crossVectors(_hy, _hz).normalize();
    _hm.makeBasis(_hx, _hy, _hz);
    _hq.setFromRotationMatrix(_hm);
    _hi.copy(arm.quaternion).invert();
    p.wrist.quaternion.copy(_hi).multiply(_hq);
    const rot = spec.rot || [0, 0, 0];
    p.h.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  }

  function poseArm(arm, spec, aspect, hs, sleeveKind, curlOpts) {
    const p = arm.userData.p;
    const sh = ndcCam(spec.sh[0], spec.sh[1], spec.sh[2], aspect);
    const wr = ndcCam(spec.wr[0], spec.wr[1], spec.wr[2], aspect);
    _v.copy(wr).sub(sh);
    let len = _v.length();
    if (len < 1e-5) { _v.set(0, 1, -0.2); len = _v.length(); }
    _v.multiplyScalar(1 / len);
    if (len < MIN_FORE) {
      sh.copy(wr).addScaledVector(_v, -MIN_FORE);
      len = MIN_FORE;
    }
    arm.position.copy(sh);
    arm.quaternion.setFromUnitVectors(_y, _v);
    arm.scale.set(1, 1, 1);
    // Lengthen the unit sleeve along +Y only; radius may shrink per pose (rs).
    const rs = Math.max(0.55, Math.min(1.4, (spec.rs != null ? spec.rs : 1)));
    p.sleeve.scale.set(rs, len, rs);
    p.sleeve.position.set(0, 0, 0);
    p.sleeve.rotation.set(0, 0, 0);
    p.cuff.position.set(0, len, 0);
    p.cuff.rotation.set(0, 0, 0);
    p.cuff.scale.set(rs, 1, rs);
    p.roll.position.set(0, len - CUFF_H * 0.70, 0);
    p.roll.rotation.set(0, 0, 0);
    p.roll.scale.set(rs, 1, rs);
    if (p.roll2) {
      p.roll2.position.set(0, len - CUFF_H * 1.15, 0);
      p.roll2.rotation.set(0, 0, 0);
      p.roll2.scale.set(rs, 1, rs);
    }
    p.wrist.position.set(0, len, 0);
    p.wrist.scale.set(1, 1, 1);
    orientHand(arm, spec, (arm.userData && arm.userData.side) || 1);
    // 1268: keep the authored pose hand scale on p.h (the grip/held item
    // is parented here — dropping this to 1 shrinks the pick). The extra
    // 1.10 lives only on visual children so the hand reads slightly larger
    // than the sleeve without changing item world size.
    const poseHs = Math.max(0.6, Math.min(2.2, spec.hs || hs || 1));
    const visHs = 1.10;
    p.h.scale.setScalar(poseHs);
    const kids = p.h.children;
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      if (c === p.grip) continue;
      // Palm pads are unit spheres with a tiny authored scale; multiply,
      // do not overwrite, or they engulf the camera (backface-culled).
      if (!c.userData._fpHsBase1268) c.userData._fpHsBase1268 = c.scale.clone();
      const b = c.userData._fpHsBase1268;
      c.scale.set(b.x * visHs, b.y * visHs, b.z * visHs);
    }
    dressSleeve(arm, spec.sleeve || sleeveKind || 'linen');
    curlHand(p.h, spec.curl != null ? spec.curl : 1, curlOpts || {});
    arm.visible = true;
  }

  let rim;
  function makeLights() {
    amb = new T.AmbientLight(0xf3eee6, 0.50);
    key = new T.DirectionalLight(0xfff3e8, 0.92);
    fill = new T.DirectionalLight(0xb8c4d2, 0.28);
    rim = new T.DirectionalLight(0xe8eef4, 0.38);
    vs.add(amb, key, key.target, fill, fill.target, rim, rim.target);
  }
  function placeLights() {
    const cp = new T.Vector3().setFromMatrixPosition(vc.matrixWorld);
    const right = new T.Vector3(), up = new T.Vector3(), fwd = new T.Vector3();
    vc.matrixWorld.extractBasis(right, up, fwd);
    // Soft top-left key (FPS viewmodel convention) and a cool opposite rim.
    key.position.copy(cp).addScaledVector(up, 1.15).addScaledVector(right, -0.85).addScaledVector(fwd, 0.25);
    key.target.position.copy(cp);
    key.target.updateMatrixWorld();
    fill.position.copy(cp).addScaledVector(up, 0.10).addScaledVector(right, 1.05).addScaledVector(fwd, 0.45);
    fill.target.position.copy(cp);
    fill.target.updateMatrixWorld();
    if (rim) {
      rim.position.copy(cp).addScaledVector(up, 0.35).addScaledVector(right, 0.70).addScaledVector(fwd, -0.85);
      rim.target.position.copy(cp).addScaledVector(fwd, 0.20);
      rim.target.updateMatrixWorld();
    }
  }

  function build() {
    if (rig) return true;
    try {
      if (!W.__hands1249 || typeof W.__hands1249.buildHand !== 'function') return false;
      vs = new T.Scene();
      vc = new T.PerspectiveCamera(FP_FOV, REF_ASPECT, FP_NEAR, FP_FAR);
      vs.add(vc);
      makeLights();
      rig = new T.Group();
      rig.name = 'FpVm1259';
      rig.userData.fpVm1259 = 1;
      armR = makeArm(1);
      armL = makeArm(-1);
      armL.visible = false;
      rig.add(armR, armL);
      vc.add(rig);  // camera-space child; overlay cam carries the rig
      U.vs = vs; U.vc = vc; U.rig = rig; U.armR = armR; U.armL = armL;
      U.on = 1;
      return true;
    } catch (e) { ERR('build', e); return false; }
  }

  function hideLegacy(hide) {
    if (!hide) {
      for (let i = 0; i < hidden.length; i++) {
        try { hidden[i].o.visible = hidden[i].v; } catch (_) {}
      }
      hidden = [];
      return;
    }
    const seen = new Set();
    for (let i = 0; i < hidden.length; i++) seen.add(hidden[i].o);
    const mark = function (o) {
      if (!o) return;
      if (seen.has(o)) { o.visible = false; return; }
      seen.add(o);
      hidden.push({ o: o, v: o.visible });
      o.visible = false;
    };
    try {
      const fpa = W.__fpa && W.__fpa.rig && W.__fpa.rig();
      if (fpa) { fpa.visible = false; mark(fpa); }
    } catch (_) {}
    try {
      if (typeof hand !== 'undefined' && hand) {
        // Keep `held` if it is still under hand (until we reparent).
        hand.traverse(function (o) {
          if (o === hand) return;
          if (typeof held !== 'undefined' && (o === held || (held && held.parent === o))) return;
          if (o.userData && (o.userData.fpVm1259 || o.userData.fpArm1259 || o.userData.fpGrip1259)) return;
          if (o.isMesh) mark(o);
        });
        if (typeof held === 'undefined' || (held && held.parent !== hand)) mark(hand);
      }
    } catch (_) {}
    try { if (typeof fist !== 'undefined' && fist) mark(fist); } catch (_) {}
    try { if (typeof armMesh !== 'undefined' && armMesh) mark(armMesh); } catch (_) {}
    try { if (typeof gripHand !== 'undefined' && gripHand) mark(gripHand); } catch (_) {}
    // Hide leftover C322 / __vm gun visuals so the grip-parented item is unique.
    try {
      const vm = W.__vm;
      if (vm) {
        [vm.grp, vm.vs, vm.root].forEach(function (root) {
          if (!root || !root.traverse) return;
          root.traverse(function (o) {
            if (!o.isMesh) return;
            if (o.userData && o.userData.fpVm1259) return;
            let p = o, underHeld = false;
            while (p) { if (typeof held !== 'undefined' && p === held) { underHeld = true; break; } p = p.parent; }
            if (underHeld) return;
            const n = ((o.name || '') + ' ' + ((o.parent && o.parent.name) || '')).toLowerCase();
            if (/pistol|musket|rifle|gun|barrel|stock/.test(n) || (o.userData && (o.userData.gun || o.userData.c322))) {
              mark(o);
            }
          });
        });
      }
    } catch (_) {}
    try { hideStrayGuns(); } catch (_) {}
  }

  function adoptHeld(grip) {
    try {
      if (typeof held === 'undefined' || !held || !grip) return;
      if (held.parent === grip) { heldParented = 1; return; }
      if (!heldParent) heldParent = held.parent || null;
      if (held.parent) held.parent.remove(held);
      grip.add(held);
      heldParented = 1;
    } catch (e) { ERR('adopt', e); }
  }
  function restoreHeld() {
    try {
      if (!heldParented || typeof held === 'undefined' || !held) return;
      if (heldParent && held.parent !== heldParent) {
        if (held.parent) held.parent.remove(held);
        heldParent.add(held);
        held.position.set(0, 0, 0);
        held.rotation.set(0, 0, 0);
        held.scale.set(1, 1, 1);
      }
      heldParented = 0;
    } catch (e) { ERR('restore', e); }
  }

  function straightenHeld() {
    try {
      if (typeof held === 'undefined' || !held || !held.children) return;
      // Stock first-person rest pose lives as a tilt on the direct child of
      // `held` (e.g. pick Rx(-0.75) Rz(0.35)). Zero it so the grip-local
      // Euler is the visual haft / blade axis.
      const c = held.children[0];
      if (c && c.rotation) c.rotation.set(0, 0, 0);
      if (c && c.position) c.position.set(0, 0, 0);
      if (c && c.scale) c.scale.set(1, 1, 1);
    } catch (_) {}
  }
  function poseItem(grip, spec) {
    if (typeof held === 'undefined' || !held) return;
    adoptHeld(grip);
    const it = (spec && spec.item) || { p: [0, 0, 0], r: [0, 0, 0], s: 1 };
    const p = it.p || [0, 0, 0], r = it.r || [0, 0, 0];
    held.position.set(p[0] || 0, p[1] || 0, p[2] || 0);
    held.rotation.set(r[0] || 0, r[1] || 0, r[2] || 0);
    if (Array.isArray(it.s)) {
      held.scale.set(
        Math.max(0.08, Math.min(8.0, it.s[0] != null ? it.s[0] : 1)),
        Math.max(0.08, Math.min(8.0, it.s[1] != null ? it.s[1] : 1)),
        Math.max(0.08, Math.min(8.0, it.s[2] != null ? it.s[2] : 1))
      );
    } else {
      const s = Math.max(0.25, Math.min(8.0, it.s != null ? it.s : 1));
      held.scale.setScalar(s);
    }
    held.visible = true;
    straightenHeld();
    try {
      revealHeldItem(held);
    } catch (_) {}
    try {
      dressHeld(spec);
    } catch (_) {}
  }

  function fpCrescentGeo() {
    // fpHook1262 / fpCrescentGeo / aUpper / arcDeg1263: 1264 FP head is an
    // extruded crescent (THREE.Shape + bevel), not a tube. 1267 keeps those
    // identifiers and the open face-on hook, but replaces the fat two-circle
    // lune (a barely-major ~162° moon) with a slender tapered sickle: the
    // blade grows out of a carved socket at the haft top, widest near the
    // root (~2.5x the haft thickness), tapering smoothly to a needle point.
    // Convex outer edge, concave inner edge, a short lower horn hanging in
    // the air beside the shaft. After Rz(-π/2), item +Y is the haft and
    // item -X is left-of-haft sky. Origin is the inner socket (right edge
    // of the root) so the shaft end is covered by the carved head. TP/world
    // keeps hook 0.42.
    if (U._fpHookGeo) return U._fpHookGeo;
    function crSeg(t, p0, p1, p2, p3) {
      const t2 = t * t, t3 = t2 * t;
      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      };
    }
    function crChain(pts, n) {
      const out = [];
      const nseg = pts.length - 3;
      for (let i = 0; i < nseg; i++) {
        const nn = (i < nseg - 1) ? n : n + 1;
        for (let k = 0; k < nn; k++) {
          const p = crSeg(k / n, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
          // Origin is the inner socket against the haft; never spill right.
          if (p.x > 0) p.x = 0;
          out.push(p);
        }
      }
      return out;
    }
    // 1269: no clockwise rot — that flattened the hook into an axe face
    // against the left edge. Tip stays up (crescent on its side). With the
    // socket moved to frame centre there is room for a ~30% arc.
    // Wider in X (~30% frame) but shorter in Y so the upward tip stays
    // on-screen with a 3% sky margin once the socket sits near centre.
    const HEAD_SX = 1.75, HEAD_SY = 1.28;
    const P = function (x, y) {
      return { x: x * HEAD_SX, y: y * HEAD_SY };
    };
    // Outer (left, convex) then inner (right, concave, back U -> socket -> L).
    // Upright sickle: long horn up, short lower horn, belly to the left.
    const outerPts = [
      P(-0.006, -0.110),
      P(-0.024, -0.088),
      P(-0.058, -0.012),
      P(-0.086,  0.050),
      P(-0.102,  0.108),
      P(-0.088,  0.168),
      P(-0.052,  0.218),
      P(-0.022,  0.245)
    ];
    const innerPts = [
      P(-0.022,  0.245),
      P(-0.052,  0.218),
      P(-0.068,  0.165),
      P(-0.078,  0.108),
      P(-0.048,  0.045),
      P( 0.000,  0.000),
      P(-0.010, -0.042),
      P(-0.024, -0.088),
      P(-0.006, -0.110)
    ];
    const outer = crChain(outerPts, 20);
    const inner = crChain(innerPts, 20);
    const tipU = outer[outer.length - 1];
    const tipL = outer[0];
    // aUpper / arcDeg1263: heading sweep of the outer edge (open hook, ~110°).
    let aUpper = Math.atan2(outer[1].y - outer[0].y, outer[1].x - outer[0].x);
    let dOuter = 0, prev = aUpper;
    for (let i = 1; i < outer.length - 1; i++) {
      const a = Math.atan2(outer[i + 1].y - outer[i].y, outer[i + 1].x - outer[i].x);
      let da = a - prev;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      dOuter += da;
      prev = a;
    }
    const arcDeg = +(Math.abs(dOuter) * 180 / Math.PI).toFixed(1);
    const shape = new T.Shape();
    shape.moveTo(outer[0].x, outer[0].y);
    for (let i = 1; i < outer.length; i++) shape.lineTo(outer[i].x, outer[i].y);
    for (let i = 0; i < inner.length; i++) shape.lineTo(inner[i].x, inner[i].y);
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 28
    });
    geo.translate(0, 0, -0.008);
    geo.computeVertexNormals();
    geo.userData.fpHook1264 = 1;
    geo.userData.fpHook1263 = 1;
    geo.userData.fpHook1262 = 1;
    geo.userData.arcDeg1263 = arcDeg;
    geo.userData.arcDeg1264 = arcDeg;
    geo.userData.aUpper = aUpper;
    U._fpHookGeo = geo;
    U._fpHookArc = arcDeg;
    return geo;
  }
  function tintCrescent(blade) {
    if (!blade) return;
    // 1268: deep violet-purple, not the 1266/1267 magenta 0xb44cff.
    // Base #4b1f8a, highlight #8a4ce0, shadow #1e0c3a. No red-channel
    // boost; env map is blue-violet (not pink) so MeshStandard sheen
    // stays on the violet side under the linear-display r128 renderer.
    const prev = blade.material;
    if (!U._fpEnv1268) {
      const faces = [];
      for (let i = 0; i < 6; i++) {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        const grd = g.createLinearGradient(0, 0, 32, 32);
        // A bright violet streak on two faces, near-black violet elsewhere.
        if (i === 0 || i === 2) {
          grd.addColorStop(0, '#f2e9ff');
          grd.addColorStop(0.22, '#8a4ce0');
          grd.addColorStop(1, '#1e0c3a');
        } else {
          grd.addColorStop(0, '#5a2aa8');
          grd.addColorStop(1, '#1e0c3a');
        }
        g.fillStyle = grd;
        g.fillRect(0, 0, 32, 32);
        faces.push(c);
      }
      const env = new T.CubeTexture(faces);
      env.needsUpdate = true;
      U._fpEnv1268 = env;
    }
    if (!blade.userData.fpStd1267 || !prev || !prev.isMeshStandardMaterial) {
      const mat = new T.MeshStandardMaterial({
        color: 0x4b1f8a,
        emissive: 0x1e0c3a,
        emissiveIntensity: 0.15,
        roughness: 0.22,
        metalness: 0.16,
        envMap: U._fpEnv1268,
        envMapIntensity: 0.90,
        side: T.DoubleSide,
        flatShading: false,
        transparent: false,
        opacity: 1,
        depthWrite: true
      });
      mat.userData = mat.userData || {};
      mat.userData.crystalCore1249 = 1;
      blade.material = mat;
      blade.userData.fpStd1267 = 1;
    } else {
      const mat = prev;
      mat.color.setHex(0x4b1f8a);
      mat.emissive.setHex(0x1e0c3a);
      mat.emissiveIntensity = 0.15;
      mat.roughness = 0.22;
      mat.metalness = 0.16;
      mat.envMap = U._fpEnv1268;
      mat.envMapIntensity = 0.90;
      mat.map = null;
      mat.bumpMap = null;
      mat.normalMap = null;
      mat.blending = T.NormalBlending;
      mat.transparent = false;
      mat.opacity = 1;
      mat.depthWrite = true;
      mat.side = T.DoubleSide;
      if (mat.userData) mat.userData.crystalCore1249 = 1;
    }
  }
  function haftTopY(blade) {
    let yMax = 0.80;
    if (typeof held === 'undefined' || !held) return yMax;
    held.updateWorldMatrix(true, true);
    held.traverse(function (o) {
      if (!o.isMesh || o === blade || o.visible === false) return;
      const ud = o.userData || {};
      if (ud.fpSock1265 || ud.fpHook1264 || ud.keepHidden1263) return;
      const mat = o.material || {};
      const col = mat.color && mat.color.getHex && mat.color.getHex();
      if (col !== 0x4a2c14 && col !== 0x3a2412 && col !== 0x5a3a1e) return;
      if (!o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      const corners = [bb.min.x, bb.max.x, bb.min.y, bb.max.y, bb.min.z, bb.max.z];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          for (let k = 0; k < 2; k++) {
            const pt = new T.Vector3(
              i ? bb.max.x : bb.min.x,
              j ? bb.max.y : bb.min.y,
              k ? bb.max.z : bb.min.z
            ).applyMatrix4(o.matrixWorld);
            held.worldToLocal(pt);
            if (pt.y > yMax) yMax = pt.y;
          }
        }
      }
    });
    // 1267: seat the carved head at the true shaft tip so the shaft does
    // not peek above the socket (the 0.92 cap left a visible gap).
    if (yMax < 0.82) yMax = 0.87;
    if (yMax > 0.98) yMax = 0.98;
    return yMax;
  }
  function alignCrescentFace(blade) {
    // The stock hook lives under an intermediate group whose rotation
    // presents the extruded face edge-on at the 1265 framing. Reparent
    // the blade to `held` and give it identity rotation so the lune sits
    // in held-XY (face toward the camera, item -X = left of the haft)
    // with the socket on the haft top. Do not rotate about a guessed axis.
    if (!blade || typeof held === 'undefined' || !held) return;
    const root = (held.children && held.children[0]) || held;
    if (blade.parent !== root) {
      root.attach(blade);
    }
    const yTop = haftTopY(blade);
    blade.rotation.set(0, 0, 0);
    // Origin stays on the haft; attachX pulls the inner hollow onto the knot.
    blade.position.set(0, yTop, 0);
    blade.scale.set(1, 1, 1);
    blade.updateWorldMatrix(true, true);
    let nDot = null;
    if (vc) {
      const n = new T.Vector3(0, 0, 1).transformDirection(blade.matrixWorld).normalize();
      const camZ = new T.Vector3(), _r = new T.Vector3(), _u = new T.Vector3();
      try {
        vc.matrixWorld.extractBasis(_r, _u, camZ);
        nDot = +n.dot(camZ.normalize()).toFixed(3);
        if (nDot < 0) {
          // Face points away: flip local Z so the silhouette stays put.
          if (!blade.userData.fpFlipZ1266) {
            const g = blade.geometry;
            if (g && U._fpHookGeo && g === U._fpHookGeo) blade.geometry = g.clone();
            if (blade.geometry && blade.geometry.scale) {
              blade.geometry.scale(1, 1, -1);
              blade.geometry.computeVertexNormals();
            }
            blade.userData.fpFlipZ1266 = 1;
          }
        }
      } catch (_) {}
    }
    const arr = function (v) { return v.toArray().slice(0, 3).map(function (n) { return +n.toFixed(4); }); };
    U.pickDump = {
      yTop: +yTop.toFixed(4), rot: arr(blade.rotation), pos: arr(blade.position),
      scl: arr(blade.scale), par: (blade.parent && (blade.parent.name || blade.parent.type)) || null,
      flip: !!blade.userData.fpFlipZ1266, nDot: nDot
    };
  }
  function dressPickHook() {
    if (!held) return;
    let already = false, blade0 = null;
    held.traverse(function (o) {
      if (o.userData && o.userData.fpHook1264 && o.isMesh) { already = true; blade0 = o; }
    });
    if (already && blade0) {
      alignCrescentFace(blade0);
      tintCrescent(blade0);
      return;
    }
    const geo = fpCrescentGeo();
    if (!geo) return;
    let blade = null;
    const hide = [];
    held.traverse(function (o) {
      if (!o.isMesh && !o.isSprite) return;
      const ud = o.userData || {};
      const mat = o.material || {};
      const mud = mat.userData || {};
      if (o.isMesh && (ud.noGrip || mud.crystalCore1249 || (mat.emissive && mat.color && mat.color.b > mat.color.g && mat.color.r > 0.2))) {
        if (!blade && o.geometry) blade = o;
      }
      // Kill every additive / sprite glow (the 1262 white inner core).
      if (ud.glow1249 || mud.glow1249 || o.isSprite) hide.push(o);
      if (o.isMesh && mat.blending === T.AdditiveBlending) hide.push(o);
    });
    if (!blade) return;
    blade.geometry = geo;
    // 1266: face the camera about the haft; brighter shaded purple.
    alignCrescentFace(blade);
    tintCrescent(blade);
    for (let i = 0; i < hide.length; i++) {
      if (hide[i] === blade) continue;
      hide[i].visible = false;
      if (hide[i].userData) hide[i].userData.keepHidden1263 = 1;
    }
    // Hide leftover crystal wrap (tubes/spheres/boxes) so only the haft + sickle remain.
    held.traverse(function (o) {
      if (!o.isMesh || o === blade) return;
      const ud = o.userData || {};
      if (ud.fpHook1263 || ud.fpHook1262 || ud.handle1249) return;
      const mat = o.material || {};
      const col = mat.color && mat.color.getHex && mat.color.getHex();
      if (col === 0x4a2c14 || col === 0x3a2412 || col === 0x5a3a1e) return;
      o.visible = false;
      ud.keepHidden1263 = 1;
      o.userData = ud;
    });
    held.userData.fpHook1264 = 1;
    held.userData.fpHook1263 = 1;
    held.userData.fpHook1262 = 1;
    blade.userData.fpHook1264 = 1;
    blade.userData.fpHook1263 = 1;
    blade.userData.fpHook1262 = 1;
    blade.userData.noGrip = 1;
    // 1267 carved socket AT the origin (haft top): a cap over the shaft
    // end, a collar down the shaft, and a short flare into the blade root
    // only. No knot sitting in the hollow, no shaft tip peeking out.
    if (!blade.userData.fpSock1265) {
      const wood = new T.MeshPhongMaterial({
        color: 0x4a2c14, shininess: 10, specular: 0x2a1a0c
      });
      const knot = new T.Group();
      knot.name = 'FpPickSock';
      function addWood(geo, px, py, pz, sx, sy, sz) {
        const m = new T.Mesh(geo, wood);
        m.position.set(px, py, pz);
        m.scale.set(sx, sy, sz);
        m.userData.handle1249 = 1;
        m.userData.fpSock1265 = 1;
        knot.add(m);
        return m;
      }
      // Cap the true shaft tip so nothing peeks above the head.
      addWood(new T.SphereGeometry(0.032, 14, 12), 0.000, 0.010, 0, 1.05, 0.72, 1.00);
      // Collar down the shaft, flared at the top.
      const collar = addWood(new T.CylinderGeometry(0.026, 0.017, 0.085, 12), 0, -0.036, 0, 1, 1, 1);
      collar.rotation.z = 0.04;
      // Short flare into the 1.3x blade root only (item -X = left), not the hollow.
      addWood(new T.SphereGeometry(0.026, 12, 10), -0.020, 0.000, 0, 1.20, 0.70, 0.82);
      addWood(new T.SphereGeometry(0.018, 10, 8), -0.012, -0.020, 0.006, 1.05, 0.80, 0.75);
      knot.userData.handle1249 = 1;
      knot.userData.fpSock1265 = 1;
      blade.add(knot);
      blade.userData.fpSock1265 = 1;
    }
  }
  function warmFlameTex1265() {
    if (U._warmFlameTex1265) return U._warmFlameTex1265;
    const c = document.createElement('canvas'); c.width = 128; c.height = 256;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 256);
    // Teardrop tongues: rounded (not square) base, warm orange mid and tip.
    // Transparent padding at the canvas edges so the sprite quad does not show.
    const baseY = 236;
    const tongues = [
      {x: 64, w: 32, h: 214, c0: 'rgba(255,150,30,0.96)', c1: 'rgba(255,110,10,0.9)', c2: 'rgba(255,70,0,0)'},
      {x: 42, w: 16, h: 165, c0: 'rgba(255,130,20,0.88)', c1: 'rgba(255,90,0,0.78)', c2: 'rgba(220,50,0,0)'},
      {x: 86, w: 15, h: 158, c0: 'rgba(255,130,20,0.86)', c1: 'rgba(255,85,0,0.76)', c2: 'rgba(220,40,0,0)'},
      {x: 54, w: 11, h: 190, c0: 'rgba(255,140,20,0.8)', c1: 'rgba(255,80,0,0.68)', c2: 'rgba(200,30,0,0)'},
      {x: 76, w: 11, h: 180, c0: 'rgba(255,150,30,0.78)', c1: 'rgba(255,85,0,0.66)', c2: 'rgba(200,30,0,0)'}
    ];
    function widthAt(k, w) {
      if (k < 0.14) return w * Math.sin((k / 0.14) * Math.PI * 0.5);
      return w * (1 - ((k - 0.14) / 0.86) * 0.96);
    }
    for (let t = 0; t < tongues.length; t++) {
      const tg = tongues[t];
      g.beginPath();
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps, y = baseY - tg.h * k;
        const wob = Math.sin(k * 17 + tg.x) * (tg.w * 0.28) * k * (1 - k);
        const x = tg.x - (widthAt(k, tg.w) + wob);
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      for (let i = steps; i >= 0; i--) {
        const k = i / steps, y = baseY - tg.h * k;
        const wob = Math.cos(k * 19 + tg.x) * (tg.w * 0.28) * k * (1 - k);
        g.lineTo(tg.x + (widthAt(k, tg.w) + wob), y);
      }
      g.closePath();
      const grd = g.createLinearGradient(tg.x, baseY, tg.x, baseY - tg.h);
      grd.addColorStop(0, tg.c0);
      grd.addColorStop(0.38, tg.c1);
      grd.addColorStop(1, tg.c2);
      g.fillStyle = grd;
      g.fill();
    }
    // White-yellow core only at the base, inside the orange body.
    const core = g.createRadialGradient(64, 214, 3, 64, 200, 26);
    core.addColorStop(0, 'rgba(255,252,220,0.96)');
    core.addColorStop(0.4, 'rgba(255,220,90,0.7)');
    core.addColorStop(1, 'rgba(255,140,20,0)');
    g.fillStyle = core;
    g.beginPath();
    g.ellipse(64, 210, 18, 26, 0, 0, Math.PI * 2);
    g.fill();
    const tex = new T.CanvasTexture(c);
    tex.needsUpdate = 1;
    U._warmFlameTex1265 = tex;
    return tex;
  }
  function dressTorchFlame(spec) {
    const flameS = (spec && spec.item && spec.item.flameS != null) ? spec.item.flameS : 0.48;
    const shaftS = (spec && spec.item && spec.item.shaftS != null) ? spec.item.shaftS : 0.55;
    try {
      const c = held.children && held.children[0];
      if (c && c.scale && !c.userData.shaftThin1262) {
        c.scale.set(shaftS, 1, shaftS);
        c.userData.shaftThin1262 = 1;
      }
    } catch (_) {}
    // Hide stock torch bloom (unmarked sprites / additive fire, leftover heads).
    held.traverse(function (o) {
      const ud = o.userData || {};
      if (ud.flame1249 || ud.spark1249 || ud.fpFlame1262 || ud.handle1249) return;
      if (o.isSprite) { o.visible = false; ud.keepHidden1263 = 1; return; }
      const mat = o.material || {};
      if (o.isMesh && mat.blending === T.AdditiveBlending && !ud.fpHook1263 && !ud.fpHook1262) {
        o.visible = false; ud.keepHidden1263 = 1;
      }
    });
    // Local +Y of the torch group is the shaft. Find the tip of the solid head.
    let headY = 0.55, found = false;
    try {
      const space = (held.children && held.children[0]) || held;
      space.updateWorldMatrix(true, true);
      const inv = new T.Matrix4().copy(space.matrixWorld).invert();
      const v = new T.Vector3();
      space.traverse(function (o) {
        if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
        const mat = o.material || {};
        if (mat.blending === T.AdditiveBlending) return;
        const ud = o.userData || {};
        if (ud.flame1249 || ud.spark1249 || ud.fpFlame1262 || ud.keepHidden1263) return;
        const pos = o.geometry.attributes.position;
        const step = Math.max(1, Math.floor(pos.count / 50));
        for (let i = 0; i < pos.count; i += step) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
          if (!found || v.y > headY) { headY = v.y; found = true; }
        }
      });
    } catch (_) {}
    if (!found) headY = 0.55;
    const camUpL = new T.Vector3(0, 1, 0), camRightL = new T.Vector3(1, 0, 0), _ignC = new T.Vector3();
    try {
      const sp0 = (held.children && held.children[0]) || held;
      vc.matrixWorld.extractBasis(camRightL, camUpL, _ignC);
      const invC = new T.Matrix4().copy(sp0.matrixWorld).invert();
      camUpL.transformDirection(invC).normalize();
      camRightL.transformDirection(invC).normalize();
    } catch (_) {}
    const roots = [];
    held.traverse(function (o) {
      if (o.userData && (o.userData.flames1249 || o.userData.sparks1249)) roots.push(o);
    });
    if (!roots.length && held.children[0]) roots.push(held.children[0]);
    for (let i = 0; i < roots.length; i++) {
      const g = roots[i];
      const flames = g.userData && g.userData.flames1249;
      if (flames) {
        // 1265: warm orange-yellow throughout; a white-yellow core only at the base.
        // Keep the fire ANCHORED on the tip (1263) and rising camera-up (1264).
        const tints = [0xff8a12, 0xff6a00, 0xff9a18, 0xff7010, 0xff8a12];
        const tongues = [
          { ox: 0.000, sx: 0.34, sy: 0.82, op: 0.95 },
          { ox: -0.022, sx: 0.18, sy: 0.54, op: 0.82 },
          { ox: 0.022, sx: 0.18, sy: 0.58, op: 0.82 },
          { ox: 0.008, sx: 0.14, sy: 0.44, op: 0.72 },
          { ox: 0.000, sx: 0.16, sy: 0.36, op: 0.80 }
        ];
        for (let j = 0; j < flames.length; j++) {
          flames[j]._anchored1263 = 1;
          const spr = flames[j].s;
          if (spr) {
            const tg = tongues[j % tongues.length];
            const sy = tg.sy * flameS, sx = tg.sx * flameS;
            spr.position.set(0, headY, 0);
            spr.position.addScaledVector(camUpL, sy * 0.38);
            spr.position.addScaledVector(camRightL, tg.ox);
            spr.scale.set(sx, sy, 1);
            if (spr.material) {
              spr.material.map = warmFlameTex1265();
              spr.material.color.setHex(tints[j % tints.length]);
              spr.material.opacity = tg.op;
              spr.material.blending = T.NormalBlending;
              spr.material.transparent = true;
              spr.material.depthWrite = false;
              spr.material.needsUpdate = 1;
            }
            spr.visible = true;
            spr.userData.fpFlame1262 = 1;
          }
        }
      }
      const sparks = g.userData && g.userData.sparks1249;
      if (sparks) {
        for (let j = 0; j < sparks.length; j++) {
          if (sparks[j].s && !sparks[j]._sized1264) {
            const k = j % 7;
            sparks[j].sz = 0.035 * flameS * (0.7 + (k % 3) * 0.25);
            sparks[j].s.position.set(0, headY, 0);
            sparks[j].s.position.addScaledVector(camUpL, 0.08 + k * 0.055);
            sparks[j].s.position.addScaledVector(camRightL, ((k % 3) - 1) * 0.03);
            sparks[j].s.scale.setScalar(sparks[j].sz);
            sparks[j]._anchored1263 = 1;
            sparks[j]._sized1264 = 1;
          }
          if (sparks[j].s) {
            sparks[j].s.visible = true;
            sparks[j].s.userData.fpFlame1262 = 1;
            if (sparks[j].s.material) sparks[j].s.material.color.setHex((j % 2) ? 0xff7a12 : 0xffd060);
          }
        }
      }
      if (g.userData) { g.userData.flameDressed1262 = 1; g.userData.flameAnchored1263 = 1; }
    }
  }
  function dressHeld(spec) {
    if (typeof held === 'undefined' || !held) return;
    const k0 = kindOf();
    if (k0 === 'p761' || k0 === 'p760' || k0 === 'pick') {
      try { dressPickHook(); } catch (_) {}
    }
    // Show the illustrated parchment + compass card, and hide the stock
    // lined board. The card may already be a child of the stock mesh
    // (makeItemMesh wrapper); reparent it onto `held` and hide every
    // mesh that is not part of the card.
    if (k0 === 'map') {
      try {
        const hf = W.__held1240;
        let card = null;
        held.traverse(function (o) {
          if (o.userData && o.userData.held1240Map) card = o;
        });
        if (!card && hf && typeof hf.buildMapCard === 'function') {
          let tex = null;
          try { if (W.__c112 && W.__c112.TX) tex = new T.CanvasTexture(W.__c112.TX); } catch (_) {}
          card = hf.buildMapCard(tex);
          held.add(card);
        }
        if (card && card.parent !== held) {
          held.add(card);
          card.position.set(0, 0, 0);
          card.rotation.set(0, 0, 0);
          card.scale.set(1, 1, 1);
        }
        held.traverse(function (o) {
          if (!o.isMesh) return;
          let under = false, n = o;
          while (n) { if (n === card) { under = true; break; } n = n.parent; }
          o.visible = !!under;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (let i = 0; i < mats.length; i++) if (mats[i]) mats[i].visible = !!under;
        });
      } catch (_) {}
    }
    if (k0 === 'torch') {
      try { dressTorchFlame(spec); } catch (_) {}
    }
    if (k0 === 'pistol') {
      try { dressPistolFlintlock(); } catch (_) {}
    }
    if (k0 === 'musket') {
      try { dressMusketFlintlock(); } catch (_) {}
    }
  }

  function aimFlintlockSide(g) {
    if (!g) return;
    if (U.poseKey === 'pistolAds' || U.ads || (typeof isAds === 'function' && isAds() && kindOf() === 'pistol')) {
      // Look down the sights: muzzle (local -Z) recedes away and slightly
      // up, grip (local -Y) rolls toward camera-down.
      g.rotation.set(0, 0, 0);
      if (!vc) return;
      const parentDir = new T.Vector3(0.02, 0.36, -1).normalize();
      g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, -1), parentDir);
      g.updateWorldMatrix(true, true);
      const _r = new T.Vector3(), _u = new T.Vector3(), _z = new T.Vector3();
      try { vc.matrixWorld.extractBasis(_r, _u, _z); } catch (_) { return; }
      const barrelW = new T.Vector3(0, 0, -1).transformDirection(g.matrixWorld).normalize();
      const gripW = new T.Vector3(0, -1, 0).transformDirection(g.matrixWorld).normalize();
      const camDown = _u.clone().multiplyScalar(-1).normalize();
      const gP = gripW.addScaledVector(barrelW, -gripW.dot(barrelW));
      const dP = camDown.addScaledVector(barrelW, -camDown.dot(barrelW));
      if (gP.lengthSq() > 1e-6 && dP.lengthSq() > 1e-6) {
        gP.normalize(); dP.normalize();
        const ang = Math.atan2(new T.Vector3().copy(gP).cross(dP).dot(barrelW), gP.dot(dP));
        g.rotateOnWorldAxis(barrelW, ang);
      }
      return;
    }
    // Start from the proven 1266/1268 local pose, then tilt ~30° in the
    // image plane (around camera Z) so the barrel is no longer near-vertical
    // and the bird's-head stock can read beside the fist.
    // 1268 hip pose (visible upright flintlock). The euler alone lies the
    // gun on its side; the image-plane swing stands the barrel up.
    g.rotation.set(0.10, 1.05, 0.15);
    g.position.set(0, 0, 0);
    g.updateWorldMatrix(true, true);
    if (!vc) return;
    const camZ = new T.Vector3(), _rHip = new T.Vector3(), _uHip = new T.Vector3();
    try { vc.matrixWorld.extractBasis(_rHip, _uHip, camZ); } catch (_) { return; }
    camZ.normalize();
    const qInv = vc.getWorldQuaternion(new T.Quaternion()).invert();
    const barrel = new T.Vector3(0, 0, -1).transformDirection(g.matrixWorld).applyQuaternion(qInv);
    barrel.z = 0;
    if (barrel.lengthSq() < 1e-8) return;
    barrel.normalize();
    const target = new T.Vector3(-0.52, 0.85, 0);
    const ang = Math.atan2(barrel.x * target.y - barrel.y * target.x, barrel.x * target.x + barrel.y * target.y);
    if (Math.abs(ang) < 0.02) return;
    g.rotateOnWorldAxis(camZ, -ang);
  }
  function dressPistolFlintlock() {
    // 1266: rebuild the procedural flintlock as a side-on piece — longer
    // octagonal tapering barrel, curved bird's-head grip at ~110° to the
    // barrel, lock/hammer/frizzen on the camera-facing side, trigger guard.
    // Keep fpFlint1265 / keepHidden1263 so earlier tests stay green.
    if (typeof held === 'undefined' || !held) return;
    let have = false;
    held.traverse(function (o) { if (o.userData && o.userData.fpFlint1266 && o.isMesh) have = true; });
    if (have) {
      held.traverse(function (o) {
        if (!o.isMesh) return;
        if (o.userData && (o.userData.fpFlint1266 || o.userData.fpFlint1265)) { o.visible = true; return; }
        o.visible = false;
        o.userData = o.userData || {};
        o.userData.keepHidden1263 = 1;
      });
      held.traverse(function (o) {
        if (o.name === 'FpFlintlock1265') aimFlintlockSide(o);
      });
      return;
    }
    // Drop the boxy 1265 flint if it is already on the gun.
    const drop = [];
    held.traverse(function (o) {
      if (o.userData && o.userData.fpFlint1265 && o.name === 'FpFlintlock1265') drop.push(o);
    });
    for (let i = 0; i < drop.length; i++) {
      if (drop[i].parent) drop[i].parent.remove(drop[i]);
    }
    held.userData.fpFlint1265 = 0;
    const gun = (held.children && held.children[0]) || held;
    const rig = (gun.userData && gun.userData.rig) || null;
    const parent = rig || gun;
    parent.updateWorldMatrix(true, true);

    const steel = new T.MeshPhongMaterial({ color: 0x4a5562, shininess: 90, specular: 0xc0cad4 });
    const wood = new T.MeshPhongMaterial({ color: 0x6b4226, shininess: 22, specular: 0x3a2210 });
    const brass = new T.MeshPhongMaterial({ color: 0xc4a056, shininess: 90, specular: 0xffe2a0 });
    const flintC = new T.MeshPhongMaterial({ color: 0x3a3a44, shininess: 40, specular: 0x666677 });

    gun.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.userData && (o.userData.fpFlint1265 || o.userData.fpFlint1266)) return;
      o.visible = false;
      o.userData = o.userData || {};
      o.userData.keepHidden1263 = 1;
    });

    const g = new T.Group();
    g.name = 'FpFlintlock1265';
    g.userData.fpFlint1265 = 1;
    g.userData.fpFlint1266 = 1;
    function tag(m) {
      m.userData.fpFlint1265 = 1;
      m.userData.fpFlint1266 = 1;
      m.castShadow = false;
      g.add(m);
      return m;
    }
    function add(geo, mat, x, y, z, rx, ry, rz) {
      const m = new T.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      return tag(m);
    }

    // Local frame: muzzle along -Z, grip raking down in -Y and slightly back
    // (+Z) at ~110° from the barrel. Lock plate on +X (side facing the camera
    // after a slight yaw).
    const barrelLen = 0.30;
    const breechZ = 0.02;
    const muzzleZ = breechZ - barrelLen;
    // 1268: slightly thicker octagonal steel-grey barrel; group scale
    // supplies most of the 1.6x size so the lock does not become a slab.
    const bar = add(new T.CylinderGeometry(0.0085, 0.013, barrelLen, 8), steel, 0, 0.026, breechZ - barrelLen / 2);
    bar.rotation.x = Math.PI / 2;
    add(new T.CylinderGeometry(0.0095, 0.0095, 0.016, 12), steel, 0, 0.026, muzzleZ - 0.004).rotation.x = Math.PI / 2;
    add(new T.CylinderGeometry(0.016, 0.016, 0.038, 8), steel, 0, 0.026, 0.030).rotation.x = Math.PI / 2; // breech
    add(new T.BoxGeometry(0.0045, 0.007, 0.020), steel, 0, 0.042, -0.04); // sight
    add(new T.BoxGeometry(0.0026, 0.009, 0.0026), steel, 0, 0.040, muzzleZ + 0.01);

    // 1267: slim forestock hugging the underside of the barrel, then a
    // one-piece bird's-head grip joining the stock at the wrist. No
    // detached pommel, no boxy upright beside the barrel.
    const fore = add(new T.CylinderGeometry(0.012, 0.009, 0.16, 10), wood, 0, 0.012, -0.08);
    fore.rotation.x = Math.PI / 2;
    const stockSh = new T.Shape();
    // shape.x = local Z (muzzle negative), shape.y = local Y. Grip only.
    stockSh.moveTo(-0.025, 0.020);
    stockSh.lineTo(0.022, 0.024);
    stockSh.bezierCurveTo(0.048, 0.024, 0.052, 0.010, 0.044, -0.010);
    stockSh.bezierCurveTo(0.058, -0.038, 0.056, -0.068, 0.036, -0.084);
    stockSh.bezierCurveTo(0.018, -0.094, 0.000, -0.086, 0.000, -0.060);
    stockSh.bezierCurveTo(0.000, -0.036, 0.006, -0.016, 0.002, -0.002);
    stockSh.bezierCurveTo(-0.010, 0.006, -0.020, 0.012, -0.025, 0.012);
    stockSh.closePath();
    const stockGeo = new T.ExtrudeGeometry(stockSh, {
      depth: 0.026,
      bevelEnabled: true,
      bevelThickness: 0.0045,
      bevelSize: 0.0035,
      bevelSegments: 2,
      curveSegments: 22
    });
    stockGeo.translate(0, 0, -0.013);
    stockGeo.rotateY(-Math.PI / 2);
    stockGeo.computeVertexNormals();
    add(stockGeo, wood, 0, 0, 0);
    // Small brass cap sitting on the pommel (joined, not a detached ball).
    add(new T.SphereGeometry(0.0065, 8, 6), brass, 0, -0.078, 0.026);

    // Brass furniture.
    
    add(new T.BoxGeometry(0.027, 0.006, 0.016), brass, 0, 0.014, 0.030);
    add(new T.BoxGeometry(0.020, 0.005, 0.012), brass, 0, 0.012, -0.08);
    add(new T.BoxGeometry(0.018, 0.004, 0.010), brass, 0, 0.010, -0.15);
    if (typeof T.TorusGeometry === 'function') {
      add(new T.TorusGeometry(0.024, 0.0030, 6, 14, Math.PI * 1.2), brass, 0, -0.020, 0.048, Math.PI / 2, 0, 0);
    }
    add(new T.BoxGeometry(0.0032, 0.016, 0.006), steel, 0, -0.022, 0.042, 0.20, 0, 0); // trigger

    // 1268: lock plate + cocked hammer + frizzen on +X; modest local size
    // so the 1.4x group scale keeps them readable, not slab-like.
    add(new T.BoxGeometry(0.004, 0.028, 0.050), steel, 0.019, 0.018, 0.016);
    add(new T.BoxGeometry(0.005, 0.026, 0.011), steel, 0.024, 0.036, 0.002, 0.70, 0, 0);
    add(new T.BoxGeometry(0.004, 0.010, 0.013), flintC, 0.026, 0.050, -0.002, 0.55, 0, 0);
    add(new T.BoxGeometry(0.004, 0.022, 0.011), brass, 0.022, 0.030, 0.032, -0.45, 0, 0);

    // Yaw the whole piece so the side profile (lock plate) faces the camera
    // and the barrel reads up-left, not end-on. Grip stays at the origin (fist).
    // 1268: 1.40 / 0.92 ≈ 1.52x the 1267 visual size (barrel also a hair thicker).
    g.position.set(0, 0, 0);
    g.scale.setScalar(1.18);
    aimFlintlockSide(g);
    parent.add(g);
    held.userData.fpFlint1265 = 1;
    held.userData.fpFlint1266 = 1;
  }


  function dressMusketFlintlock() {
    // 1267: dress the existing hip/ADS musket with the same flintlock
    // materials (wood stock, brass furniture, steel barrel/lock). Pose
    // stays the 1266 diagonal + BL support; we only retint the meshes.
    if (typeof held === 'undefined' || !held) return;
    if (held.userData.fpMusket1267) return;
    const woodCol = 0x6b4226, steelCol = 0x3a4450, brassCol = 0xc4a056;
    held.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      if (o.userData && (o.userData.fpFlint1265 || o.userData.fpFlint1266 || o.userData.fpHook1264)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (let i = 0; i < mats.length; i++) {
        const mat = mats[i];
        if (!mat || !mat.color || !mat.color.getHex) continue;
        const c = mat.color.getHex();
        const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
        if (r > 160 && g > 100 && b < 130 && r > b + 30) {
          mat.color.setHex(brassCol);
          if (mat.specular) mat.specular.setHex(0xffe2a0);
          if (mat.shininess != null) mat.shininess = 90;
        } else if (r > 55 && r >= b && g > b * 0.7 && r < 190 && g < 150 && b < 120) {
          mat.color.setHex(woodCol);
          if (mat.specular) mat.specular.setHex(0x3a2210);
          if (mat.shininess != null) mat.shininess = 22;
        } else if (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && r + g + b < 520) {
          mat.color.setHex(steelCol);
          if (mat.specular) mat.specular.setHex(0xa8b8c8);
          if (mat.shininess != null) mat.shininess = 80;
        }
      }
    });
    held.userData.fpMusket1267 = 1;

    // 1268: add a visible lock plate, hammer, frizzen, brass trigger guard
    // and butt plate. Pose stays the 1266 diagonal; furniture is parented
    // to the gun rig so ADS still works.
    if (!held.userData.fpMusketLock1268) {
      const gun = (held.children && held.children[0]) || held;
      const parent = (gun.userData && gun.userData.rig) || gun;
      parent.updateWorldMatrix(true, true);
      const box = new T.Box3();
      parent.traverse(function (o) {
        if (!o.isMesh || o.visible === false) return;
        if (o.userData && o.userData.fpMusketLock1268) return;
        if (!o.geometry) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox;
        if (!bb) return;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
          const pt = new T.Vector3(
            i ? bb.max.x : bb.min.x,
            j ? bb.max.y : bb.min.y,
            k ? bb.max.z : bb.min.z
          ).applyMatrix4(o.matrixWorld);
          parent.worldToLocal(pt);
          box.expandByPoint(pt);
        }
      });
      if (!box.isEmpty()) {
        const steelM = new T.MeshPhongMaterial({ color: 0x3a4450, shininess: 80, specular: 0xa8b8c8 });
        const brassM = new T.MeshPhongMaterial({ color: 0xc4a056, shininess: 90, specular: 0xffe2a0 });
        const flintM = new T.MeshPhongMaterial({ color: 0x3a3a44, shininess: 40, specular: 0x666677 });
        const g = new T.Group();
        g.name = 'FpMusketLock1268';
        g.userData.fpMusketLock1268 = 1;
        g.userData.fpMusket1267 = 1;
        function addM(geo, mat, x, y, z, rx, ry, rz) {
          const m = new T.Mesh(geo, mat);
          m.position.set(x, y, z);
          if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
          m.userData.fpMusketLock1268 = 1;
          m.userData.fpMusket1267 = 1;
          g.add(m);
          return m;
        }
        const size = new T.Vector3(); box.getSize(size);
        const mid = new T.Vector3(); box.getCenter(mid);
        const zMuzzle = box.min.z, zButt = box.max.z;
        const zLock = zButt + (zMuzzle - zButt) * 0.32;
        const yMid = mid.y, xSide = box.max.x + 0.004;
        addM(new T.BoxGeometry(0.008, 0.038, 0.072), steelM, xSide, yMid + 0.008, zLock);
        addM(new T.BoxGeometry(0.007, 0.034, 0.014), steelM, xSide + 0.006, yMid + 0.030, zLock - 0.012, 0.70, 0, 0);
        addM(new T.BoxGeometry(0.006, 0.012, 0.016), flintM, xSide + 0.008, yMid + 0.048, zLock - 0.016, 0.55, 0, 0);
        addM(new T.BoxGeometry(0.006, 0.028, 0.014), brassM, xSide + 0.005, yMid + 0.018, zLock + 0.018, -0.45, 0, 0);
        if (typeof T.TorusGeometry === 'function') {
          addM(new T.TorusGeometry(0.028, 0.0034, 6, 16, Math.PI * 1.15), brassM, mid.x, yMid - 0.028, zLock + 0.008, Math.PI / 2, 0, 0);
        }
        addM(new T.BoxGeometry(0.0034, 0.018, 0.007), steelM, mid.x, yMid - 0.026, zLock + 0.004, 0.15, 0, 0);
        const by = Math.max(0.04, size.y * 0.55), bx = Math.max(0.028, size.x * 0.7);
        addM(new T.BoxGeometry(bx, by, 0.010), brassM, mid.x, mid.y - size.y * 0.05, zButt - 0.002);
        parent.add(g);
        held.userData.fpMusketLock1268 = 1;
      }
    }
  }

  function revealHeldItem(root) {
    if (!root) return;
    root.visible = true;
    const gun = root.children && root.children[0];
    const rig = gun && gun.userData && gun.userData.rig;
    const swapped = !!(gun && gun.userData && (gun.userData.c322 || rig));
    root.traverse(function (o) {
      if (o.userData && (o.userData.fpFlint1265 || o.userData.fpFlint1266 || o.userData.fpMusketLock1268)) { if (o.isMesh || o.type === 'Group') o.visible = true; return; }
      if (o.userData && o.userData.keepHidden1263) { o.visible = false; return; }
      if (swapped && o.isMesh) {
        let underRig = false, n = o;
        while (n) { if (n === rig) { underRig = true; break; } n = n.parent; }
        o.visible = underRig;
        return;
      }
      o.visible = true;
    });
    if (gun) {
      gun.visible = true;
      if (swapped && !gun.userData.c322) gun.userData.c322 = 1;
      if (rig) rig.visible = true;
    }
  }

  function curlOptsFor(key, k0, ads) {
    if (k0 === 'empty') return { mode: 'relax' };
    if (k0 === 'block') return { mode: 'cup' };
    if (k0 === 'map') return { mode: 'pinch' };
    if (key === 'pistol' || key === 'pistolAds') return { mode: 'fist', trigger: true };
    return { mode: 'fist' };
  }

  function applyPose() {
    if (U.disabled || isTp()) {
      U.active = 0;
      restoreHeld();
      hideLegacy(false);
      if (rig) rig.visible = false;
      return;
    }
    if (!build()) { U.active = 0; return; }
    const k0 = kindOf();
    const ads = isAds();
    const key = (k0 === 'musket' && ads) ? 'musketAds' : (k0 === 'pistol' && ads) ? 'pistolAds' : k0;
    let spec = POSES[key] || POSES[k0] || POSES.other;
    try {
      const ov = U.override;
      if (ov) {
        spec = {
          two: ov.two != null ? ov.two : spec.two,
          hs: ov.hs != null ? ov.hs : spec.hs,
          R: Object.assign({}, spec.R, ov.R || {}),
          L: spec.L ? Object.assign({}, spec.L, ov.L || {}) : ov.L,
          item: Object.assign({}, spec.item || {}, ov.item || {})
        };
      }
    } catch (_) {}
    const aspect = (typeof camera !== 'undefined' && camera && camera.aspect) ? camera.aspect : REF_ASPECT;
    const hs = spec.hs || 1.12;
    const two = !!spec.two && !!spec.L;
    const curlR = curlOptsFor(key, k0, ads);
    poseArm(armR, spec.R, aspect, hs, (spec.R && spec.R.sleeve) || 'linen', curlR);
    if (two) {
      armL.traverse(function (o) { o.visible = true; });
      const curlL = (key === 'pistolAds')
        ? { mode: 'fist' }
        : { mode: 'fist', support: true };
      poseArm(armL, spec.L, aspect, hs, (spec.L && spec.L.sleeve) || 'linen', curlL);
    } else {
      armL.visible = false;
      armL.traverse(function (o) { o.visible = false; });
    }
    U.kind = k0;
    U.ads = ads ? 1 : 0;
    U.poseKey = key;
    poseItem(armR.userData.p.grip, spec);
    rig.visible = true;
    hideLegacy(true);
    U.active = 1;
    try {
      const worldCam = (typeof camera !== 'undefined' && camera) || W.camera;
      if (worldCam) poseOverlayCam(worldCam);
    } catch (_) {}
  }

  function poseOverlayCam(worldCam) {
    worldCam.updateMatrixWorld(true);
    vc.matrixAutoUpdate = false;
    vc.matrix.copy(worldCam.matrixWorld);
    vc.matrixWorld.copy(worldCam.matrixWorld);
    vc.fov = FP_FOV;
    vc.aspect = worldCam.aspect || REF_ASPECT;
    vc.near = FP_NEAR;
    vc.far = FP_FAR;
    vc.updateProjectionMatrix();
    placeLights();
    rig.updateMatrixWorld(true);
  }

  function underOurRig(o) {
    for (let n = o; n; n = n.parent) {
      if (n === rig || n === vs || (n.userData && n.userData.fpVm1259)) return true;
      if (typeof held !== 'undefined' && held && n === held) return true;
    }
    return false;
  }
  function looksLikeGun(o) {
    if (!o || !o.isMesh) return false;
    const n = ((o.name || '') + ' ' + ((o.parent && o.parent.name) || '')).toLowerCase();
    const u = o.userData || {};
    return !!(u.gun || u.c322 || u.pistol || u.__fb || /pistol|musket|rifle|gun|barrel|stock|service_pistol/.test(n));
  }
  function hideStrayGuns() {
    const roots = [];
    try { if (typeof scene !== 'undefined' && scene) roots.push(scene); } catch (_) {}
    try { if (typeof camera !== 'undefined' && camera) roots.push(camera); } catch (_) {}
    try { const vm = W.__vm; if (vm) { if (vm.vs) roots.push(vm.vs); if (vm.grp) roots.push(vm.grp); if (vm.root) roots.push(vm.root); } } catch (_) {}
    const seen = new Set();
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      if (!root || !root.traverse) continue;
      root.traverse(function (o) {
        if (seen.has(o) || !o.isMesh || o.visible === false) return;
        seen.add(o);
        if (underOurRig(o)) return;
        if (looksLikeGun(o)) o.visible = false;
      });
    }
  }

  function hookRender() {
    if (hooked) return true;
    try {
      const renderer = W.renderer || (typeof renderer !== 'undefined' ? renderer : null);
      // `renderer` as a const shadows the global; use the game renderer.
    } catch (_) {}
    let rd = null, rdr = null;
    try { rdr = (typeof renderer !== 'undefined' && renderer) || W.renderer; } catch (_) { rdr = W.renderer; }
    if (!rdr || !rdr.render) return false;
    rd = rdr.render.bind(rdr);
    rdr.render = function (sc0, cam) {
      let result;
      try { if (U.active && !U.disabled && !isTp()) hideStrayGuns(); } catch (_) {}
      try { result = rd.apply(this, arguments); } catch (e) {
        throw e;
      }
      try {
        if (!U.active || U.disabled || !rig || !vs || !vc) return result;
        const worldCam = (typeof camera !== 'undefined' && camera) || W.camera;
        if (!worldCam || cam !== worldCam || (typeof scene !== 'undefined' && sc0 !== scene)) return result;
        if (isTp()) return result;
        try { applyPose(); } catch (_) {}
        poseOverlayCam(worldCam);
        // Coverage cull on the dedicated viewmodel (barrel may exceed 25% in ADS).
        try {
          if (W.__heldFrame1251 && W.__heldFrame1251.cullVm) W.__heldFrame1251.cullVm(vs, vc);
        } catch (_) {}
        const ac0 = this.autoClear;
        this.autoClear = false;
        this.clearDepth();
        try { rd.call(this, vs, vc); } finally { this.autoClear = ac0; }
      } catch (e) { ERR('pass', e); }
      return result;
    };
    hooked = 1;
    return true;
  }

  function hookUpdate() {
    try {
      if (typeof updateHand !== 'function' || U._uh) return !!U._uh;
      const uh = updateHand;
      updateHand = function (dt, moving) {
        const r = uh.apply(this, arguments);
        try { applyPose(); hookRender(); } catch (e) { ERR('uh', e); U.active = 0; }
        return r;
      };
      U._uh = 1;
      return true;
    } catch (e) { ERR('hookUh', e); return false; }
  }

  // Diagnose contact / sleeve-wrist / entry for tests and the QA studio.
  U.probe = function () {
    const out = { active: !!U.active, kind: U.kind, ads: U.ads, poseKey: U.poseKey, err: U.err };
    try {
      if (!U.active || !armR) return out;
      const pR = armR.userData.p;
      const wpos = function (o) {
        if (!o) return null;
        o.updateWorldMatrix(true, false);
        return o.getWorldPosition(new T.Vector3());
      };
      const hp = wpos(pR.h), gp = wpos(pR.grip);
      let item = (typeof held !== 'undefined' && held) || null;
      const ip = wpos(item);
      out.hasHand = !!pR.h;
      out.hasGrip = !!pR.grip;
      out.hasItem = !!(item && item.children && item.children.length);
      out.chained = false;
      if (item && pR.grip) {
        for (let n = item; n; n = n.parent) if (n === pR.grip) { out.chained = true; break; }
      }
      out.handItem = (hp && ip) ? +hp.distanceTo(ip).toFixed(4) : null;
      out.gripItem = (gp && ip) ? +gp.distanceTo(ip).toFixed(4) : null;
      // Sleeve wrist end is at local (0, len, 0) = cuff position.
      const cuffP = wpos(pR.cuff), wristP = wpos(pR.wrist);
      out.sleeveWrist = (cuffP && wristP) ? +cuffP.distanceTo(wristP).toFixed(4) : null;
      out.foreLen = pR.sleeve ? +pR.sleeve.scale.y.toFixed(4) : null;
      out.minFore = MIN_FORE;
      out.scaleArm = armR.scale.toArray().map(function (n) { return +n.toFixed(4); });
      try {
        const cam = vc;
        const qInv = cam.getWorldQuaternion(new T.Quaternion()).invert();
        const qh = pR.h.getWorldQuaternion(new T.Quaternion());
        const axes = {x: new T.Vector3(1,0,0), y: new T.Vector3(0,1,0), z: new T.Vector3(0,0,1)};
        const outA = {};
        ['x','y','z'].forEach(function (k) {
          axes[k].applyQuaternion(qh).applyQuaternion(qInv);
          outA[k] = [+axes[k].x.toFixed(3), +axes[k].y.toFixed(3), +axes[k].z.toFixed(3)];
        });
        out.handCamAxes = outA;
      } catch (_) {}
      try {
        const item2 = (typeof held !== 'undefined' && held) || null;
        if (item2 && vc) {
          item2.updateWorldMatrix(true, true);
          const qInv2 = vc.getWorldQuaternion(new T.Quaternion()).invert();
          const qi = item2.getWorldQuaternion(new T.Quaternion());
          const ax = function (x, y, z) {
            const v = new T.Vector3(x, y, z).applyQuaternion(qi).applyQuaternion(qInv2);
            return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
          };
          out.itemCamAxes = { x: ax(1,0,0), y: ax(0,1,0), z: ax(0,0,1) };
          out.heldRot = item2.rotation.toArray().slice(0,3).map(function (n) { return +n.toFixed(3); });
          out.heldPos = item2.position.toArray().map(function (n) { return +n.toFixed(3); });
          out.heldScl = item2.scale.toArray().map(function (n) { return +n.toFixed(3); });
          out.heldKids = (item2.children || []).slice(0, 6).map(function (c) {
            return {
              name: c.name || c.type,
              r: c.rotation.toArray().slice(0,3).map(function (n) { return +n.toFixed(3); }),
              p: c.position.toArray().map(function (n) { return +n.toFixed(3); }),
              s: c.scale.toArray().map(function (n) { return +n.toFixed(3); }),
              kids: (c.children || []).length
            };
          });
        }
      } catch (e2) { out.itemProbeErr = String(e2 && e2.message || e2); }
      // Forearm entry: shoulder (sleeve start) in NDC should be at/outside the edge.
      const cam = vc || (typeof camera !== 'undefined' ? camera : W.camera);
      if (cam && pR.sleeve) {
        pR.sleeve.updateWorldMatrix(true, false);
        const s0 = new T.Vector3(0, 0, 0).applyMatrix4(pR.sleeve.matrixWorld).project(cam);
        const s1 = new T.Vector3(0, 1, 0).applyMatrix4(pR.sleeve.matrixWorld).project(cam);
        out.shNdc = [+s0.x.toFixed(3), +s0.y.toFixed(3), +s0.z.toFixed(3)];
        out.wrNdc = [+s1.x.toFixed(3), +s1.y.toFixed(3), +s1.z.toFixed(3)];
        out.entersEdge = (s0.x > 0.85 || s0.y < -0.85 || s0.x < -0.85);
        out.entersBR = s0.x > 0.2 && s0.y < -0.2;
      }
      if (armL && armL.visible) {
        const pL = armL.userData.p;
        const L0 = new T.Vector3(0, 0, 0).applyMatrix4(pL.sleeve.matrixWorld).project(cam);
        out.shNdcL = [+L0.x.toFixed(3), +L0.y.toFixed(3), +L0.z.toFixed(3)];
        out.entersEdgeL = (L0.x < -0.85 || L0.y < -0.85);
        out.two = 1;
        out.leftTartan = !!(pL.sleeve.material && pL.sleeve.material.userData && pL.sleeve.material.userData.tartan1251);
      }
      if (U.pickDump) out.pickDump = U.pickDump;
      out.fov = FP_FOV;
    } catch (e) { out.probeErr = String(e && e.message || e); }
    return out;
  };

  U.apply = applyPose;
  U.disable = function () { U.disabled = 1; U.active = 0; restoreHeld(); hideLegacy(false); };
  U.enable = function () { U.disabled = 0; };

  let n = 0;
  const boot = setInterval(function () {
    n++;
    try { hookUpdate(); hookRender(); if (U.on) applyPose(); } catch (e) { ERR('boot', e); }
    if ((U._uh && hooked && U.on) || n > 80) clearInterval(boot);
  }, 120);
  W.addEventListener && W.addEventListener('load', function () {
    try { hookUpdate(); hookRender(); } catch (e) { ERR('load', e); }
  });
})(typeof window !== 'undefined' ? window : this);
