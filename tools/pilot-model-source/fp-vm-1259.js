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
  const SLEEVE_R = 0.048;
  const CUFF_R = 0.058;
  const CUFF_H = 0.032;
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
      two: 0, hs: 1.45,
      R: { sh: [0.42, -1.28, -0.55], wr: [0.24, -0.42, -0.48], rot: [0, 0, 0], haft: [0.95, 0.30, 0], curl: 1 }
    },
    block: {
      two: 0, hs: 1.40,
      R: { sh: [0.38, -1.26, -0.55], wr: [0.16, -0.30, -0.48], rot: [0, 0, 0], haft: [0.55, 0.20, 0], face: 'palmUp', curl: 1 },
      item: { p: [0.00, -0.02, -0.04], r: [0.15, 0.25, 0.08], s: 0.32 }
    },
    p761: {
      two: 0, hs: 1.20,
      R: { sh: [1.22, -1.12, -0.50], wr: [0.38, -0.58, -0.56], rot: [0, 0, 0], haft: [-0.32, 0.95, 0], curl: 1 },
      item: { p: [-0.05, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.34 }
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
      R: { sh: [1.20, -1.12, -0.50], wr: [0.34, -0.52, -0.54], rot: [0, 0, 0], haft: [-0.36, 0.93, 0], curl: 1 },
      item: { p: [-0.05, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.32, flameS: 0.28 }
    },
    map: {
      two: 0, hs: 1.16,
      R: { sh: [0.70, -1.16, -0.50], wr: [0.10, -0.18, -0.50], rot: [0.10, 0.05, 0.00], haft: [0.70, 0.35, 0], curl: 1 },
      item: { p: [0.00, 0.00, 0.00], r: [1.57, 0.12, 0.06], s: 1.05 }
    },
    bucket: {
      two: 0, hs: 1.18,
      R: { sh: [1.25, -0.48, -0.55], wr: [0.16, -0.06, -0.50], rot: [0, 0, 0], haft: [0.00, -1.00, 0], curl: 1 },
      item: { p: [0.12, -0.06, 0.00], r: [0.00, 0.00, 1.57], s: 0.60 }
    },
    pistol: {
      two: 0, hs: 1.16,
      R: { sh: [0.90, -1.20, -0.48], wr: [0.22, -0.32, -0.50], rot: [0, 0, 0], haft: [0.10, 0.95, 0], curl: 1 },
      item: { p: [0.00, 0.00, 0.00], r: [0.20, 3.94, 1.57], s: 1.12 }
    },
    pistolAds: {
      two: 1, hs: 1.12,
      R: { sh: [0.50, -1.24, -0.44], wr: [0.10, -0.28, -0.46], rot: [0, 0, 0], haft: [0.04, 1.00, 0], curl: 1 },
      L: { sh: [-0.48, -1.26, -0.52], wr: [-0.06, -0.36, -0.54], rot: [0, 0, 0], haft: [0.04, 0.90, 0], curl: 1 },
      item: { p: [0.00, 0.02, 0.00], r: [0.20, 3.94, 1.57], s: 1.10 }
    },
    musket: {
      two: 1, hs: 1.08,
      R: { sh: [1.22, -1.10, -0.50], wr: [0.34, -0.40, -0.56], rot: [0, 0, 0], haft: [-0.70, 0.55, 0], curl: 1 },
      L: { sh: [-0.70, -1.16, -0.64], wr: [-0.02, -0.10, -0.70], rot: [0, 0, 0], haft: [-0.70, 0.55, 0], curl: 1, hs: 0.90 },
      item: { p: [0.10, -0.04, 0.00], r: [0.00, -1.57, 0.00], s: 0.95 }
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
  function tartan() {
    try { return (W.__hands1249 && W.__hands1249.tartanMat && W.__hands1249.tartanMat()) || null; } catch (_) { return null; }
  }

  function unitSleeveGeo() {
    // Height 1 along +Y, from y=0 (shoulder) to y=1 (wrist). Open at the
    // shoulder (off-screen), capped toward the wrist so it is not a ring.
    const g = new T.CylinderGeometry(SLEEVE_R, SLEEVE_R, 1, 20, 4, false);
    g.translate(0, 0.5, 0);
    return g;
  }
  function cuffGeo() {
    // Solid rolled cuff — a short thick band, not a hollow torus.
    const g = new T.CylinderGeometry(CUFF_R, CUFF_R * 0.98, CUFF_H, 20, 1, false);
    g.translate(0, 0, 0);
    return g;
  }

  function makeArm(side) {
    const arm = new T.Group();
    arm.name = side > 0 ? 'FpArmR' : 'FpArmL';
    arm.userData.side = side;
    arm.userData.fpArm1259 = 1;
    const lm = linen() || new T.MeshPhongMaterial({ color: 0xf4efe6, shininess: 6 });
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
    arm.userData.p = { sleeve: sleeve, cuff: cuff, roll: roll, wrist: wrist, h: hand, grip: grip, side: side };
    arm.traverse(function (o) {
      if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.renderOrder = 4; }
    });
    return arm;
  }

  function dressSleeve(arm, kind) {
    const p = arm && arm.userData && arm.userData.p;
    if (!p) return;
    const mat = (kind === 'tartan' ? tartan() : linen()) || p.sleeve.material;
    if (mat) {
      p.sleeve.material = mat;
      p.cuff.material = mat;
      p.roll.material = mat;
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
    if (mode === 'relax') { p0 = 0.78; k0 = 0.62; d0 = 0.40; spread = 0.04; }
    else if (mode === 'cup') { p0 = 0.72; k0 = 0.82; d0 = 0.50; spread = 0.10; }
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
    if (spec.face === 'palmUp') _hz.set(0, -0.25, -0.97);
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
    // Lengthen the unit sleeve along +Y only; keep radius on X/Z equal.
    p.sleeve.scale.set(1, len, 1);
    p.sleeve.position.set(0, 0, 0);
    p.sleeve.rotation.set(0, 0, 0);
    p.cuff.position.set(0, len, 0);
    p.cuff.rotation.set(0, 0, 0);
    p.cuff.scale.set(1, 1, 1);
    p.roll.position.set(0, len - CUFF_H * 0.70, 0);
    p.roll.rotation.set(0, 0, 0);
    p.roll.scale.set(1, 1, 1);
    p.wrist.position.set(0, len, 0);
    p.wrist.scale.set(1, 1, 1);
    orientHand(arm, spec, (arm.userData && arm.userData.side) || 1);
    const hscl = Math.max(0.6, Math.min(2.2, spec.hs || hs || 1));
    p.h.scale.setScalar(hscl);
    dressSleeve(arm, spec.sleeve || sleeveKind || 'linen');
    curlHand(p.h, spec.curl != null ? spec.curl : 1, curlOpts || {});
    arm.visible = true;
  }

  function makeLights() {
    amb = new T.AmbientLight(0xffe8d4, 0.38);
    key = new T.DirectionalLight(0xffe2c4, 1.20);
    fill = new T.DirectionalLight(0x9bb4d0, 0.30);
    vs.add(amb, key, key.target, fill, fill.target);
  }
  function placeLights() {
    const cp = new T.Vector3().setFromMatrixPosition(vc.matrixWorld);
    const right = new T.Vector3(), up = new T.Vector3(), fwd = new T.Vector3();
    vc.matrixWorld.extractBasis(right, up, fwd);
    // Top-left key (FPS viewmodel convention).
    key.position.copy(cp).addScaledVector(up, 1.15).addScaledVector(right, -0.85).addScaledVector(fwd, 0.25);
    key.target.position.copy(cp);
    key.target.updateMatrixWorld();
    fill.position.copy(cp).addScaledVector(up, 0.15).addScaledVector(right, 1.05).addScaledVector(fwd, 0.45);
    fill.target.position.copy(cp);
    fill.target.updateMatrixWorld();
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
    const s = Math.max(0.25, Math.min(8.0, it.s != null ? it.s : 1));
    held.scale.setScalar(s);
    held.visible = true;
    straightenHeld();
    try {
      revealHeldItem(held);
    } catch (_) {}
    try {
      dressHeld(spec);
    } catch (_) {}
  }

  function dressHeld(spec) {
    if (typeof held === 'undefined' || !held) return;
    const k0 = kindOf();
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
    // Flame sprites were authored for a tiny torch; shrink them independently
    // so a longer stick does not blow the fire up into a white wall.
    if (k0 === 'torch') {
      const flameS = (spec && spec.item && spec.item.flameS != null) ? spec.item.flameS : 0.28;
      const roots = [];
      held.traverse(function (o) {
        if (o.userData && (o.userData.flames1249 || o.userData.sparks1249) && !o.userData.flameScaled1261) {
          roots.push(o);
        }
      });
      if (!roots.length && held.children[0]) roots.push(held.children[0]);
      for (let i = 0; i < roots.length; i++) {
        const g = roots[i];
        if (g.userData && g.userData.flameScaled1261) continue;
        const flames = g.userData && g.userData.flames1249;
        if (flames) {
          for (let j = 0; j < flames.length; j++) {
            flames[j].sx *= flameS;
            flames[j].sy *= flameS;
          }
        }
        const sparks = g.userData && g.userData.sparks1249;
        if (sparks) {
          for (let j = 0; j < sparks.length; j++) sparks[j].sz = (sparks[j].sz || 0.03) * flameS;
        }
        g.traverse(function (o) {
          if (!o.isSprite) return;
          if (o.userData && (o.userData.flame1249 || o.userData.spark1249 || o.userData.glow1249)) {
            o.scale.multiplyScalar(flameS);
          }
        });
        if (g.userData) g.userData.flameScaled1261 = 1;
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
        ? { mode: 'cup', support: true }
        : { mode: 'fist', support: true };
      poseArm(armL, spec.L, aspect, hs, (spec.L && spec.L.sleeve) || 'linen', curlL);
    } else {
      armL.visible = false;
      armL.traverse(function (o) { o.visible = false; });
    }
    poseItem(armR.userData.p.grip, spec);
    rig.visible = true;
    hideLegacy(true);
    U.kind = k0;
    U.ads = ads ? 1 : 0;
    U.poseKey = key;
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
