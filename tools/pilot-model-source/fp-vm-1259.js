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
  const CUFF_R = 0.034;
  const CUFF_H = 0.012;
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
      two: 0, hs: 0.95,
      // t1153: open palm up, reaching forward-centre / slightly right,
      // cream linen cuff on the forearm entering from the bottom-right.
      R: { wr: [0.22, -0.16, -0.38], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, haft: [-0.90, 0.18, 0.05], face: 'palmUp', curl: 0, rs: 0.88, hs: 1.15 }
    },
    block: {
      two: 0, hs: 1.18,
      // t1153: cube cradled in the open palm, fingers under, mid-frame.
      R: { wr: [0.22, -0.16, -0.38], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, haft: [-0.90, 0.18, 0.05], face: 'palmUp', curl: 1, rs: 0.88 },
      item: { p: [0.00, 0.016, -0.030], r: [0.10, 0.18, 0.06], s: 0.36 }
    },
    p761: {
      two: 0, hs: 1.20,
      // t1154: Minecraft-style FP. Fist lower-right, haft diagonal up
      // toward the centre, two-sided head large in the upper-right/centre.
      // 1269 wr/HEAD identifiers are kept; framing follows the new refs.
      R: { wr: [0.28, -0.38, -0.38], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.18, 0.96, -0.16], curl: 1, rs: 0.78 },
      item: { p: [-0.045, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.62 }
    },
    pick: null,
    p760: null,
    sword: {
      two: 0, hs: 1.10,
      // t1153: whole sword visible, angled slightly, fist lower-right,
      // cream linen sleeve from the screen edge to the wrist.
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, rs: 0.78 },
      item: { p: [-0.015, 0.00, 0.00], r: [1.57, 0.00, -1.57], s: 0.72 }
    },
    torch: {
      two: 0, hs: 1.16,
      // t1153: vertical torch in a lower-right fist, flame up.
      R: { wr: [0.28, -0.38, -0.38], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.05, 0.98, -0.10], curl: 1, rs: 0.78 },
      item: { p: [-0.050, 0.00, 0.00], r: [0.00, 0.00, -1.57], s: 0.42, flameS: 0.95, shaftS: 0.55 }
    },
    map: {
      two: 0, hs: 1.14,
      // t1153: map held flat up in front, thumb on the bottom edge.
      R: { wr: [0.14, -0.30, -0.50], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, haft: [-0.90, 0.18, 0.05], face: 'palmUp', curl: 1, rs: 0.88 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 0.40 }
    },
    bucket: {
      two: 0, hs: 1.14,
      // t1153: fist grips the wire bail from above, bucket hangs below.
      R: { wr: [0.58, -0.20, -0.40], pitch: 28, yaw: 32, elev: 20, lenFore: 0.30, face: 'dorsumAbove', faceY: 0.18, haft: [0.92, 0.20, -0.10], curl: 1, rs: 0.58, hs: 1.08 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 0.65 }
    },
    pistol: {
      // Exact sword right fist (mesh, wr, dorsum, haft). Gun is adapted
      // to that fixed hand, not the reverse.
      two: 0, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, rs: 0.78, sleeve: 'linen' },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }
    },
    pistolAds: {
      // t1153 ref 6: same sword right fist, cobble cup-palm under the forestock.
      two: 1, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, sleeve: 'linen', rs: 0.78 },
      L: { wr: [-0.22, -0.22, -0.48], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'palmUnder', haft: [-0.90, 0.18, 0.05], curl: 1, sleeve: 'linen', hs: 1.18, rs: 0.88 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }
    },
    musket: {
      // Same sword right fist. Barrel is aimed independently of the
      // upward tunnel so the musket does not stand vertical.
      two: 0, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, sleeve: 'linen', rs: 0.78 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }
    },
    musketAds: {
      two: 1, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, sleeve: 'linen', rs: 0.78 },
      L: { wr: [-0.22, -0.22, -0.50], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'palmUnder', haft: [-0.90, 0.18, 0.05], curl: 1, sleeve: 'linen', hs: 1.18, rs: 0.88 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }
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
  // Build a shoulder NDC from the wrist so the forearm enters from the
  // lower-right (or lower-left) edge, pitched toward the camera and yawed in.
  // pitch/yaw/elev are degrees. side > 0 is the right arm.
  function shFromWrist(wr, yawDeg, pitchDeg, len, aspect, elevDeg, side, minFore) {
    const wrp = ndcCam(wr[0], wr[1], wr[2], aspect);
    const yaw = ((yawDeg != null) ? yawDeg : 28) * Math.PI / 180;
    const pitch = ((pitchDeg != null) ? pitchDeg : 32) * Math.PI / 180;
    const elev = ((elevDeg != null) ? elevDeg : 34) * Math.PI / 180;
    const sx = (side < 0) ? -1 : 1;
    // sh→wr: inward from the side, upward, toward the camera (+Z).
    const dir = new T.Vector3(
      -sx * Math.sin(yaw + 0.45),
      Math.sin(elev),
      Math.sin(pitch)
    );
    if (dir.lengthSq() < 1e-8) dir.set(-sx * 0.7, 0.5, 0.4);
    dir.normalize();
    const floor = (minFore != null) ? minFore : MIN_FORE;
    const L = Math.max(floor, (len != null) ? len : 0.36);
    const sh = wrp.clone().addScaledVector(dir, -L);
    const z = sh.z;
    const hy = Math.tan(FP_FOV * 0.5 * Math.PI / 180) * Math.abs(z || 1);
    const hx = hy * (aspect || REF_ASPECT);
    return [sh.x / hx, sh.y / hy, z];
  }
  U.shFromWrist = shFromWrist;

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
      // Long, soft linen folds — high-frequency sines read as engraved armour.
      const wr = 1 + amount * (
        0.13 * Math.sin(a * 3 + y * 0.9) +
        0.08 * Math.sin(a * 2 - y * 0.6 + 0.5) +
        0.05 * Math.sin(y * 1.7 + a * 0.45) +
        0.035 * Math.sin(a * 5 + y * 2.1) +
        0.025 * Math.sin(y * 3.1 - a * 1.1)
      );
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
    const g = new T.CylinderGeometry(SLEEVE_R * 0.95, SLEEVE_R * 1.28, 1, 28, 24, true);
    g.translate(0, 0.5, 0);
    return wrinkleCyl(g, 0.58);
  }
  function cuffGeo() {
    // Solid rolled cuff — a short thick band with visible folds.
    const g = new T.CylinderGeometry(CUFF_R, CUFF_R * 0.96, CUFF_H, 24, 3, false);
    return wrinkleCyl(g, 0.48);
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
      wrinkleCyl(new T.CylinderGeometry(CUFF_R * 1.10, CUFF_R * 1.04, CUFF_H * 0.42, 24, 2, false), 0.40),
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
    grip.position.set(0, 0.040, -0.012);
    hand.add(grip);
    arm.userData.p = { sleeve: sleeve, cuff: cuff, roll: roll, roll2: roll2, wrist: wrist, h: hand, grip: grip, side: side };
    try { paintFpSkin(hand); } catch (_) {}
    try { ensureFpHands(hand, side); } catch (e) { ERR('ensureHands', e); }
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


  // t1155: dedicated smooth FP fist + open-palm sculpts. The 1249 jointed
  // sausages cannot curl into a clean closed fist (tendon sticks, box palm,
  // fingers beside the haft). These meshes are static in the 1259 bind:
  // +X along the haft, +Y toward the wrap / finger-start (left when the
  // dorsum +Z faces the camera), -Y toward the wrist / sleeve.
  function fpSkinMat1275() {
    if (U._skin1275) return U._skin1275;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#d4a07c';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = (i % 2) ? 'rgba(200,140,110,0.05)' : 'rgba(255,230,210,0.05)';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const tex = new T.CanvasTexture(c);
    const m = new T.MeshPhongMaterial({
      color: 0xf2d2b0, map: tex, shininess: 16, specular: 0x5a4030,
      emissive: 0x2a1810, emissiveIntensity: 0.18
    });
    m.userData.sculptKeep = 1;
    U._skin1275 = m;
    return m;
  }
  function fpNailMat1275() {
    if (U._nail1275) return U._nail1275;
    const m = new T.MeshPhongMaterial({
      color: 0xf0d4c4, shininess: 55, specular: 0x886655
    });
    m.userData.nail1249 = 1;
    m.userData.sculptKeep = 1;
    U._nail1275 = m;
    return m;
  }
  function taperedTube1275(pts, r0, r1, radial, cap) {
    radial = radial || 12;
    const n = pts.length;
    if (n < 2) return new T.BufferGeometry();
    const tans = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const d = b.clone().sub(a);
      if (d.lengthSq() < 1e-12) d.set(0, 1, 0);
      tans.push(d.normalize());
    }
    const pos = [], nrm = [], uv = [], idx = [];
    let hint = new T.Vector3(0, 0, 1);
    const ring = radial + 1;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const r = r0 + (r1 - r0) * t;
      const p = pts[i], tan = tans[i];
      let nn = new T.Vector3().crossVectors(tan, hint);
      if (nn.lengthSq() < 1e-10) {
        hint.set(0, 1, 0);
        nn.crossVectors(tan, hint);
      }
      nn.normalize();
      const bn = new T.Vector3().crossVectors(tan, nn).normalize();
      hint = nn;
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        const nr = nn.clone().multiplyScalar(Math.cos(a)).addScaledVector(bn, Math.sin(a));
        const v = p.clone().addScaledVector(nr, r);
        pos.push(v.x, v.y, v.z);
        nrm.push(nr.x, nr.y, nr.z);
        uv.push(t, j / radial);
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * ring + j, b = a + ring;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    if (cap) {
      const tip = pos.length / 3;
      const last = pts[n - 1], tan = tans[n - 1];
      const v = last.clone().addScaledVector(tan, r1 * 0.65);
      pos.push(v.x, v.y, v.z);
      nrm.push(tan.x, tan.y, tan.z);
      uv.push(1, 0.5);
      const base = (n - 1) * ring;
      for (let j = 0; j < radial; j++) idx.push(base + j, base + j + 1, tip);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }
  function tagHandMesh(mesh) {
    mesh.userData.fpHand1275 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    return mesh;
  }
  function buildFpFist(side) {
    side = side || 1;
    const g = new T.Group();
    g.name = 'FpFist1275';
    g.userData.fpFist1275 = 1;
    g.userData.fpHand1275 = 1;
    g.userData.sculptKeep = 1;
    const sm = fpSkinMat1275();
    const nm = fpNailMat1275();
    function add(mesh) { tagHandMesh(mesh); g.add(mesh); return mesh; }

    // Compact rounded palm around the haft, large enough to read at FP scale.
    const palm = add(new T.Mesh(new T.SphereGeometry(1, 18, 14), sm));
    palm.name = 'FistPalm';
    palm.scale.set(0.042, 0.030, 0.026);
    palm.position.set(0.000, 0.000, 0.006);

    const thenar = add(new T.Mesh(new T.SphereGeometry(1, 12, 10), sm));
    thenar.scale.set(0.020, 0.018, 0.016);
    thenar.position.set(0.010, -0.020, 0.004);

    const hypo = add(new T.Mesh(new T.SphereGeometry(1, 10, 8), sm));
    hypo.scale.set(0.016, 0.014, 0.013);
    hypo.position.set(-0.018, -0.012, 0.002);

    // Wrist stump into the cuff (-Y), short so the cuff does not swallow it.
    const wristPts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      wristPts.push(new T.Vector3(-0.002, -0.020 - t * 0.022, 0.002));
    }
    add(new T.Mesh(taperedTube1275(wristPts, 0.020, 0.017, 12, false), sm));

    // Four fingers wrapped around the haft (axis +X through the origin).
    // a = 0 is +Y (left of the haft). Negative a is toward the camera, so
    // knuckles start on the front-left and curl around the far side.
    const widths = [0.0092, 0.0088, 0.0082, 0.0072];
    for (let i = 0; i < 4; i++) {
      const x = (1.15 - i) * 0.015;
      const rW = 0.024 + i * 0.0008;
      const a0 = -0.55, a1 = -0.55 + 2.55;
      const pts = [];
      const n = 18;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const a = a0 + (a1 - a0) * t;
        pts.push(new T.Vector3(x, Math.cos(a) * rW, 0.004 - Math.sin(a) * rW));
      }
      add(new T.Mesh(taperedTube1275(pts, widths[i], widths[i] * 0.62, 12, true), sm));
      const kn = add(new T.Mesh(new T.SphereGeometry(widths[i] * 1.35, 10, 8), sm));
      kn.position.set(x, Math.cos(a0) * rW * 0.95, 0.008 - Math.sin(a0) * rW * 0.35);
      kn.scale.set(1.05, 0.90, 0.80);
      const aN = a1 - 0.20;
      const nail = add(new T.Mesh(new T.SphereGeometry(1, 8, 6), nm));
      nail.userData.nail1249 = 1;
      nail.scale.set(widths[i] * 0.70, widths[i] * 0.45, widths[i] * 0.22);
      nail.position.set(x, Math.cos(aN) * rW, 0.004 - Math.sin(aN) * rW + widths[i] * 0.28);
    }

    // Thumb wraps over the near-right side of the haft, pad visible.
    const tPts = [];
    const tN = 14;
    for (let k = 0; k <= tN; k++) {
      const t = k / tN;
      const a = 0.10 + t * 1.25;
      const x = 0.006 + t * 0.006;
      const y = -0.004 - Math.cos(a) * 0.018;
      const z = 0.008 + Math.sin(a) * 0.018;
      tPts.push(new T.Vector3(x, y, z));
    }
    add(new T.Mesh(taperedTube1275(tPts, 0.0094, 0.0068, 12, true), sm));
    const tNail = add(new T.Mesh(new T.SphereGeometry(1, 8, 6), nm));
    tNail.userData.nail1249 = 1;
    tNail.scale.set(0.0062, 0.0042, 0.0022);
    const tp = tPts[tPts.length - 2];
    tNail.position.copy(tp).add(new T.Vector3(0, 0, 0.0035));

    return g;
  }
  function buildFpPalm(side) {
    side = side || 1;
    const g = new T.Group();
    g.name = 'FpPalm1275';
    g.userData.fpPalm1275 = 1;
    g.userData.fpHand1275 = 1;
    g.userData.sculptKeep = 1;
    const sm = fpSkinMat1275();
    const nm = fpNailMat1275();
    function add(mesh) { tagHandMesh(mesh); g.add(mesh); return mesh; }

    const palm = add(new T.Mesh(new T.SphereGeometry(1, 18, 14), sm));
    palm.name = 'OpenPalm';
    palm.scale.set(0.032, 0.042, 0.014);
    palm.position.set(0.000, 0.028, 0.000);

    const thenar = add(new T.Mesh(new T.SphereGeometry(1, 12, 10), sm));
    thenar.scale.set(0.016, 0.018, 0.011);
    thenar.position.set(-side * 0.016, 0.016, -0.004);

    const pad = add(new T.Mesh(new T.SphereGeometry(1, 10, 8), sm));
    pad.scale.set(0.022, 0.024, 0.008);
    pad.position.set(0.000, 0.030, -0.006);

    // Wrist stump into the cuff (-Y).
    const wristPts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      wristPts.push(new T.Vector3(0.000, -0.006 - t * 0.030, 0.000));
    }
    add(new T.Mesh(taperedTube1275(wristPts, 0.018, 0.016, 12, false), sm));

    const widths = [0.0074, 0.0071, 0.0066, 0.0058];
    const lens = [0.058, 0.062, 0.058, 0.048];
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.0165;
      const pts = [];
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        // Slight natural curl toward the palm (-Z).
        const y = 0.050 + lens[i] * t;
        const z = 0.004 - 0.012 * t * t;
        pts.push(new T.Vector3(x * (1 - 0.04 * t), y, z));
      }
      add(new T.Mesh(taperedTube1275(pts, widths[i], widths[i] * 0.70, 12, true), sm));
      const kn = add(new T.Mesh(new T.SphereGeometry(widths[i] * 1.2, 10, 8), sm));
      kn.position.set(x, 0.052, 0.006);
      kn.scale.set(1.0, 0.8, 0.7);
      const nail = add(new T.Mesh(new T.SphereGeometry(1, 8, 6), nm));
      nail.userData.nail1249 = 1;
      nail.scale.set(widths[i] * 0.72, widths[i] * 0.40, widths[i] * 0.20);
      const tip = pts[pts.length - 2];
      nail.position.set(tip.x, tip.y, tip.z + widths[i] * 0.35);
    }

    // Thumb abducted, slightly toward the palm.
    const tPts = [];
    const tN = 12;
    for (let k = 0; k <= tN; k++) {
      const t = k / tN;
      const a = 0.15 + t * 0.70;
      const x = -side * (0.022 + 0.028 * Math.sin(a));
      const y = 0.014 + 0.032 * t;
      const z = 0.002 - 0.010 * Math.sin(t * 0.9);
      tPts.push(new T.Vector3(x, y, z));
    }
    add(new T.Mesh(taperedTube1275(tPts, 0.0082, 0.0064, 12, true), sm));
    const tNail = add(new T.Mesh(new T.SphereGeometry(1, 8, 6), nm));
    tNail.userData.nail1249 = 1;
    tNail.scale.set(0.0054, 0.0036, 0.0018);
    const tp = tPts[tPts.length - 2];
    tNail.position.set(tp.x, tp.y, tp.z + 0.003);

    return g;
  }
  function hideLegacySculpt(h) {
    if (!h) return;
    h.traverse(function (o) {
      if (!o.isMesh) return;
      let p = o;
      while (p && p !== h) {
        if (p.userData && p.userData.fpHand1275) return;
        p = p.parent;
      }
      o.visible = false;
      o.userData = o.userData || {};
      o.userData.sculptHidden = 1;
    });
  }
  // 1276: bind the offline-posed MakeHuman HeadSkin hand (not primitive
  // tubes). Scale is in 1259 bind units; the bake is ~20cm wrist-to-tip.
  const BAKE_HAND_SCALE = 0.76;
  function enhanceSkinAtlas1283(image) {
    if (!image || !image.width || typeof document === 'undefined') return image;
    try {
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const d = img.data;
      // Push crease AO down and lift dorsum highlights so the fist has
      // the same shading depth as the sword hand, which uses this atlas
      // but is often read with more of the knuckle row visible.
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const y = r * 0.30 + g * 0.59 + b * 0.11;
        if (y < 8) continue;
        const mid = 128;
        let y2 = mid + (y - mid) * 1.50;
        if (y < mid) y2 -= (mid - y) * 0.22; // deeper knuckle / palm creases
        if (y > mid) y2 += (y - mid) * 0.16; // brighter dorsum highlight
        const k = y2 / y;
        d[i]     = Math.max(0, Math.min(255, r * k + (y2 > mid ? 6 : 0)));
        d[i + 1] = Math.max(0, Math.min(255, g * k + (y2 > mid ? 3 : 0)));
        d[i + 2] = Math.max(0, Math.min(255, b * k * 0.98));
      }
      ctx.putImageData(img, 0, 0);
      return c;
    } catch (_) {
      return image;
    }
  }
  function fpSkinTex1276() {
    if (U._skinTex1276) return U._skinTex1276;
    const B = W.__fpHandsBaked1276;
    const url = (B && (B.skinDataUrl || B.skinUrl)) || 'assets/models/fp-hands-1275/hand-skin.png';
    function finish(t, image) {
      if (!t) return;
      if (image && !(t.userData && t.userData.enhanced1283)) {
        t.image = enhanceSkinAtlas1283(image);
        t.userData = t.userData || {};
        t.userData.enhanced1283 = 1;
        t.needsUpdate = 1;
      }
      t.flipY = false; // glTF / this atlas: v=0 at the top of the PNG
      t.generateMipmaps = true;
      t.minFilter = T.LinearMipmapLinearFilter;
      t.magFilter = T.LinearFilter;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    }
    let t;
    try {
      t = new T.TextureLoader().load(url, function (tex) {
        finish(tex, tex && tex.image);
      });
    } catch (_) {
      t = null;
    }
    if (!t) return null;
    finish(t, t.image);
    U._skinTex1276 = t;
    return t;
  }
  function fpSkinMat1276() {
    if (U._skinMat1276) return U._skinMat1276;
    const map = fpSkinTex1276();
    // MeshBasic keeps the authored HeadSkin tone on SwiftShader (lit Phong
    // crushed midtones / washed the atlas). The texture already has crease
    // AO, a lighter palm, and a warm SSS-like tint.
    const m = new T.MeshBasicMaterial({
      // Warm the atlas toward the HeadSkin face mean (~195,142,107)
      color: 0xffd2aa,
      map: map || undefined,
      side: T.DoubleSide,
      transparent: false,
      opacity: 1,
      // Win depth fights against a haft in the tunnel so the knuckle
      // row stays visible the way it does on the sword.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    m.userData.sculptKeep = 1;
    U._skinMat1276 = m;
    return m;
  }
  function attachBakedHands(h, side) {
    const B = W.__fpHandsBaked1276;
    if (!B || typeof B.makeMesh !== 'function') return false;
    const mat = fpSkinMat1276();
    function addKind(kind, flag) {
      if (h.userData[flag]) return h.userData[flag];
      const mesh = B.makeMesh(kind, mat, T, side || 1);
      mesh.scale.multiplyScalar(BAKE_HAND_SCALE);
      // makeMesh already set scale.x to ±1; preserve the mirror and apply size
      const sx = (side < 0) ? -BAKE_HAND_SCALE : BAKE_HAND_SCALE;
      mesh.scale.set(sx, BAKE_HAND_SCALE, BAKE_HAND_SCALE);
      mesh.renderOrder = 8;
      clampWristStump(mesh);
      h.add(mesh);
      h.userData[flag] = mesh;
      return mesh;
    }
    addKind('fist', 'fpFist1275');
    addKind('open', 'fpPalm1275');
    addKind('cup', 'fpCup1276');
    addKind('hold', 'fpHold1277');
    addKind('wrapPistol', 'fpWrapPistol1280');
    addKind('wrapMusket', 'fpWrapMusket1280');
    ensurePalmPlug(h, side || 1);
    h.userData.fpBaked1276 = 1;
    return true;
  }
  // The MH extract keeps ~5cm of forearm. Flatten that stump at the wrist
  // so it cannot poke through the sleeve wall.
  function ensurePistolCPlug(gun) {
    if (!gun) return null;
    let plug = gun.getObjectByName('FpPistolCPlug1280');
    if (!plug) {
      const mat = fpSkinMat1276();
      mat.side = T.DoubleSide;
      plug = new T.Group();
      plug.name = 'FpPistolCPlug1280';
      plug.userData.fpPistolCPlug1280 = 1;
      function add(mesh, px, py, pz, sx, sy, sz) {
        mesh.userData.fpPistolCPlug1280 = 1;
        mesh.userData.sculptKeep = 1;
        mesh.frustumCulled = false;
        mesh.renderOrder = 6;
        mesh.position.set(px, py, pz);
        if (sx != null) mesh.scale.set(sx, sy, sz);
        plug.add(mesh);
        return mesh;
      }
      // Disc in the hook's profile plane (Y-Z) so the C never reads as a hole
      // when the lock faces the camera.
      const disc = new T.Mesh(new T.CircleGeometry(0.038, 24), mat);
      disc.rotation.y = Math.PI / 2;
      add(disc, 0.001, -0.016, 0.016);
      add(new T.Mesh(new T.CircleGeometry(0.038, 24), mat), -0.001, -0.016, 0.016);
      plug.children[plug.children.length - 1].rotation.y = -Math.PI / 2;
      add(new T.Mesh(new T.SphereGeometry(0.022, 16, 12), mat), 0, -0.022, 0.020, 0.50, 1.35, 1.45);
      add(new T.Mesh(new T.SphereGeometry(0.018, 14, 10), mat), 0, -0.008, 0.012, 0.50, 1.20, 1.20);
      gun.add(plug);
    }
    plug.position.set(0, 0, 0);
    plug.visible = true;
    return plug;
  }
  function ensurePalmPlug(h, side) {
    if (!h) return null;
    if (h.userData.fpPalmPlug1280) return h.userData.fpPalmPlug1280;
    const mat = fpSkinMat1276();
    // Baker-space sphere that fills the wrap tunnel, flush with the
    // inner finger pads, so the bird's-head C never reads as a hole.
    const mesh = new T.Mesh(new T.SphereGeometry(0.019, 18, 12), mat);
    mesh.name = 'FpPalmPlug1280';
    mesh.userData.fpPalmPlug1280 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    const sx = (side < 0) ? -BAKE_HAND_SCALE : BAKE_HAND_SCALE;
    // Slightly flatten along the tunnel (+X) so it sits as a cap in the C.
    mesh.scale.set(sx * 0.72, BAKE_HAND_SCALE, BAKE_HAND_SCALE);
    mesh.position.set(0, 0.050, -0.026);
    mesh.visible = false;
    h.add(mesh);
    h.userData.fpPalmPlug1280 = mesh;
    return mesh;
  }
  function clampWristStump(mesh) {
    const geo = mesh && mesh.geometry;
    const pos = geo && geo.attributes && geo.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < -0.004) pos.setY(i, -0.004);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  function ensureFpHands(h, side) {
    if (!h) return;
    const sd = side || h.userData.side || 1;
    if (!attachBakedHands(h, sd)) {
      if (!h.userData.fpFist1275) {
        const fist = buildFpFist(sd);
        h.add(fist);
        h.userData.fpFist1275 = fist;
      }
      if (!h.userData.fpPalm1275) {
        const palm = buildFpPalm(sd);
        h.add(palm);
        h.userData.fpPalm1275 = palm;
      }
    }
    hideLegacySculpt(h);
  }

  function curlHand(h, amt, opts) {
    if (!h || !h.userData) return;
    opts = opts || {};
    const mode = opts.mode || 'fist';
    try {
      ensureFpHands(h, h.userData.side || 1);
      const useOpen = (mode === 'open' || mode === 'relax');
      const useHold = (mode === 'hold' || mode === 'pinch');
      const useCup = (mode === 'cup');
      const useWrapP = (mode === 'wrapPistol');
      const useWrapM = (mode === 'wrapMusket');
      if (h.userData.fpFist1275) h.userData.fpFist1275.visible = !useOpen && !useCup && !useHold && !useWrapP && !useWrapM;
      if (h.userData.fpPalm1275) h.userData.fpPalm1275.visible = useOpen;
      if (h.userData.fpCup1276) h.userData.fpCup1276.visible = useCup;
      if (h.userData.fpHold1277) h.userData.fpHold1277.visible = useHold;
      if (h.userData.fpWrapPistol1280) h.userData.fpWrapPistol1280.visible = useWrapP;
      if (h.userData.fpWrapMusket1280) h.userData.fpWrapMusket1280.visible = useWrapM;
      if (h.userData.fpPalmPlug1280) h.userData.fpPalmPlug1280.visible = useWrapP || useWrapM;
      const skin = fpSkinMat1276();
      ['fpFist1275','fpPalm1275','fpCup1276','fpHold1277','fpWrapPistol1280','fpWrapMusket1280','fpPalmPlug1280'].forEach(function (k) {
        const m = h.userData[k];
        if (!m) return;
        m.traverse(function (o) {
          if (!o.isMesh) return;
          o.material = skin;
          o.renderOrder = 8;
        });
      });
      hideLegacySculpt(h);
    } catch (e) { ERR('fpHands', e); }
    const side = (h.userData && h.userData.side) || 1;
    const fingers = h.userData.f || [];
    // Joint angles in radians, curled toward the palm (-Z). A full grip is
    // ~80-100° (1.4-1.75 rad) per joint so the fingers wrap a handle.
    let p0, k0, d0, spread;
    if (mode === 'relax') { p0 = 1.02; k0 = 1.12; d0 = 0.88; spread = 0.02; }
    else if (mode === 'open') { p0 = 0.16; k0 = 0.12; d0 = 0.08; spread = 0.11; }
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
      } else if (mode === 'open') {
        th.rotation.set(0.15, side * 0.55, side * 0.28);
        if (th.userData && th.userData.k) {
          th.userData.k.rotation.set(-0.12, 0, 0);
          const td = th.userData.k.userData && th.userData.k.userData.d;
          if (td) td.rotation.set(-0.08, 0, 0);
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
    if (spec.face === 'palmUp') _hz.set(0, -0.22, -0.97);
    else if (spec.face === 'palmUnder') _hz.set(0, -0.92, -0.39);
    else if (spec.face === 'palmUpHigh') _hz.set(0, -0.82, -0.35);
    else if (spec.face === 'palmDown') _hz.set(0, 0.75, 0.45);
    else if (spec.face === 'dorsumAbove') {
      const ty = (spec.faceY != null) ? spec.faceY : 0.30;
      _hz.set(0, ty, Math.sqrt(Math.max(0.2, 1 - ty * ty)));
    } else _hz.set(0, 0, 1);
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
    let shN = spec.sh;
    if (spec.pitch != null && spec.wr) {
      shN = shFromWrist(spec.wr, spec.yaw, spec.pitch, spec.lenFore, aspect, spec.elev, (arm.userData && arm.userData.side) || 1, spec.minFore);
    }
    const sh = ndcCam(shN[0], shN[1], shN[2], aspect);
    const wr = ndcCam(spec.wr[0], spec.wr[1], spec.wr[2], aspect);
    _v.copy(wr).sub(sh);
    let len = _v.length();
    if (len < 1e-5) { _v.set(0, 1, -0.2); len = _v.length(); }
    _v.multiplyScalar(1 / len);
    const minF = (spec.minFore != null) ? spec.minFore : MIN_FORE;
    if (len < minF) {
      sh.copy(wr).addScaledVector(_v, -minF);
      len = minF;
    }
    arm.position.copy(sh);
    arm.quaternion.setFromUnitVectors(_y, _v);
    arm.scale.set(1, 1, 1);
    // Lengthen the unit sleeve along +Y only; radius may shrink per pose (rs).
    const rs = Math.max(0.55, Math.min(1.4, (spec.rs != null ? spec.rs : 1)));
    p.sleeve.scale.set(rs, len, rs);
    p.sleeve.position.set(0, 0, 0);
    p.sleeve.rotation.set(0, 0, 0);
    p.cuff.position.set(0, len + CUFF_H * 0.25, 0);
    p.cuff.rotation.set(0, 0, 0);
    p.cuff.scale.set(rs, 1, rs);
    p.roll.position.set(0, len - CUFF_H * 0.20, 0);
    p.roll.rotation.set(0, 0, 0);
    p.roll.scale.set(rs * 1.04, 0.80, rs * 1.04);
    if (p.roll2) {
      p.roll2.visible = true;
      p.roll2.position.set(0, len - CUFF_H * 0.65, 0);
      p.roll2.rotation.set(0, 0, 0);
      p.roll2.scale.set(rs * 1.08, 0.85, rs * 1.08);
    }
    p.wrist.position.set(0, len, 0);
    p.wrist.scale.set(1, 1, 1);
    if (arm.userData) arm.userData.face = spec.face || '';
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
    arm.userData.curlOpts1271 = curlOpts || {};
    const modeG = (curlOpts && curlOpts.mode) || 'fist';
    if (p.grip) {
      const B = W.__fpHandsBaked1276;
      const tuns = (B && B.tunnels) || {};
      const tun = tuns[modeG] || (B && B.tunnel) || { y: 0.050, z: -0.026 };
      const gsc = BAKE_HAND_SCALE * 1.10;
      if (modeG === 'open' || modeG === 'relax') p.grip.position.set(0, 0.048, -0.010);
      else if (modeG === 'cup') p.grip.position.set(0, 0.042, -0.016);
      else if (modeG === 'pinch' || modeG === 'hold') p.grip.position.set(0, 0.028, -0.010);
      else p.grip.position.set(0, tun.y * gsc, tun.z * gsc);
    }
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
      try { restoreWorldGuns1282(); } catch (_) {}
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
    try {
      const k0 = kindOf();
      if (k0 === 'bucket') hangBucket(held, grip);
      if (k0 === 'block') sitInPalm(held, grip);
      if (k0 === 'map') faceMap(held, grip);
    } catch (_) {}
  }

  function hangBucket(held, grip) {
    if (!held || !grip || !vc) return;
    grip.updateWorldMatrix(true, true);
    const camUp = new T.Vector3(0, 1, 0);
    const camRight = new T.Vector3(1, 0, 0);
    try {
      camUp.set(0, 1, 0).transformDirection(vc.matrixWorld).normalize();
      camRight.set(1, 0, 0).transformDirection(vc.matrixWorld).normalize();
    } catch (_) {}
    // Upright first so the bail is the high torus in a stable frame.
    const qWorld0 = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), camUp);
    const qParent0 = grip.getWorldQuaternion(new T.Quaternion());
    held.quaternion.copy(qParent0.clone().invert().multiply(qWorld0));
    held.position.set(0, 0, 0);
    held.updateWorldMatrix(true, true);

    let bailMesh = null, bailY = -1e9;
    held.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      const typ = o.geometry.type || '';
      if (typ !== 'TorusGeometry' && typ !== 'TorusBufferGeometry') return;
      const p = held.worldToLocal(o.getWorldPosition(new T.Vector3()));
      if (p.y > bailY) { bailY = p.y; bailMesh = o; }
    });

    function wireContact(mesh) {
      const out = { ok: 0, p: new T.Vector3(), tan: new T.Vector3() };
      if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return out;
      mesh.updateWorldMatrix(true, true);
      const pos = mesh.geometry.attributes.position;
      const v = new T.Vector3();
      const best = [];
      let maxS = -1e9;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        mesh.localToWorld(v);
        // Top of the wire, slightly toward camera-right so the cuff
        // stays outside the loop.
        const sc = v.dot(camUp) + 0.45 * v.dot(camRight);
        if (sc > maxS + 1e-5) { maxS = sc; best.length = 0; best.push(v.clone()); }
        else if (Math.abs(sc - maxS) < 0.004) best.push(v.clone());
      }
      if (!best.length) return out;
      out.p.set(0, 0, 0);
      for (let i = 0; i < best.length; i++) out.p.add(best[i]);
      out.p.multiplyScalar(1 / best.length);
      const centre = mesh.getWorldPosition(new T.Vector3());
      const axis = new T.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
      if (axis.lengthSq() < 1e-8) axis.set(0, 0, 1);
      axis.normalize();
      out.tan.copy(out.p).sub(centre).cross(axis);
      if (out.tan.lengthSq() < 1e-8) out.tan.copy(camRight);
      out.tan.normalize();
      const gripX = new T.Vector3(1, 0, 0).transformDirection(grip.matrixWorld);
      if (gripX.lengthSq() > 1e-8 && out.tan.dot(gripX) < 0) out.tan.multiplyScalar(-1);
      out.ok = 1;
      return out;
    }

    let c0 = wireContact(bailMesh);
    if (c0.ok) {
      // Keep the bucket hanging straight down; only yaw around camUp so
      // the bail's horizontal tangent lines up with the fist tunnel.
      const gripX = new T.Vector3(1, 0, 0).transformDirection(grip.matrixWorld);
      const want = gripX.clone().addScaledVector(camUp, -gripX.dot(camUp));
      const cur = c0.tan.clone().addScaledVector(camUp, -c0.tan.dot(camUp));
      if (want.lengthSq() > 1e-8 && cur.lengthSq() > 1e-8) {
        want.normalize();
        cur.normalize();
        const ang = Math.atan2(new T.Vector3().copy(cur).cross(want).dot(camUp), cur.dot(want));
        if (Math.abs(ang) > 1e-4 && Math.abs(ang) < Math.PI * 0.9) {
          const qYaw = new T.Quaternion().setFromAxisAngle(camUp, ang);
          const qHeldW = held.getWorldQuaternion(new T.Quaternion());
          const qNewW = qYaw.multiply(qHeldW);
          const qPar = grip.getWorldQuaternion(new T.Quaternion());
          held.quaternion.copy(qPar.invert().multiply(qNewW));
          held.position.set(0, 0, 0);
          held.updateWorldMatrix(true, true);
        }
      }
    }

    const c1 = wireContact(bailMesh);
    const contactW = c1.ok ? c1.p : (c0.ok ? c0.p : held.localToWorld(new T.Vector3(0, 0.155, 0)));
    const contactG = grip.worldToLocal(contactW.clone());
    held.position.copy(contactG).multiplyScalar(-1);
    held.updateWorldMatrix(true, true);
  }

  function sitInPalm(held, grip) {
    if (!held || !grip || !vc) return;
    grip.updateWorldMatrix(true, true);
    // Grip sits in the palmar cup (+Y fingers, -Z palm). Drop the cube
    // into that cup so the fingers (cup pose) read under it.
    held.rotation.set(0.16, 0.22, 0.08);
    held.position.set(0.00, 0.022, -0.024);
  }
  function faceMap(held, grip) {
    if (!held || !grip || !vc) return;
    grip.updateWorldMatrix(true, true);
    const towardCam = new T.Vector3(0, 0, 1);
    const camUp = new T.Vector3(0, 1, 0);
    try {
      towardCam.set(0, 0, 1).transformDirection(vc.matrixWorld).normalize();
      camUp.set(0, 1, 0).transformDirection(vc.matrixWorld).normalize();
    } catch (_) {}
    const faceDir = towardCam.clone().addScaledVector(camUp, 0.12).normalize();
    const zDir = camUp.clone().addScaledVector(faceDir, -camUp.dot(faceDir));
    if (zDir.lengthSq() < 1e-8) zDir.set(0, 1, 0);
    zDir.normalize();
    const xDir = new T.Vector3().crossVectors(faceDir, zDir).normalize();
    zDir.crossVectors(xDir, faceDir).normalize();
    const m = new T.Matrix4().makeBasis(xDir, faceDir, zDir);
    const qWorld = new T.Quaternion().setFromRotationMatrix(m);
    const qParent = grip.getWorldQuaternion(new T.Quaternion());
    held.quaternion.copy(qParent.clone().invert().multiply(qWorld));
    held.position.set(0, 0, 0);
    held.updateWorldMatrix(true, true);
    // Sit the bottom edge in the thumb/palm, then push the sheet slightly
    // toward the camera so the fingers stay under the map.
    const edgeG = grip.worldToLocal(held.localToWorld(new T.Vector3(0, 0, -0.10)));
    held.position.copy(edgeG).multiplyScalar(-1);
    function addCam(dir, amt) {
      const o = grip.worldToLocal(grip.getWorldPosition(new T.Vector3()));
      const t = grip.worldToLocal(grip.getWorldPosition(new T.Vector3()).addScaledVector(dir, amt));
      held.position.add(t.sub(o));
    }
    // Hold-pose thumb pad is on the radial, palmar side of the grip
    // (~[-0.034, 0.027, -0.051] in hand space after bake scale). Sit the
    // bottom edge just behind that pad so the thumb stays on the front
    // of the edge, then push the sheet toward the camera enough that the
    // fingers and palm stay under it.
    const thumbPad = new T.Vector3(-0.030, 0.004, -0.018);
    held.position.add(thumbPad);
    addCam(towardCam, 0.014);
    addCam(camUp, 0.016);
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
          // t1154: two-sided head may extend to +X (right horn).
          out.push(p);
        }
      }
      return out;
    }
    // t1154 / 1269 identifiers: HEAD_SX, HEAD_SY, aUpper, arcDeg1263.
    // Two-sided slender curved pick: long left horn, shorter right horn,
    // both tapering to a point, crown sitting on the metal collar.
    // Origin is the collar / haft-top centre. No +X clamp.
    const HEAD_SX = 1.75, HEAD_SY = 1.28;
    const P = function (x, y) {
      return { x: x * HEAD_SX, y: y * HEAD_SY };
    };
    // Identifier outlines (HEAD_SX / HEAD_SY / aUpper / arcDeg1263) plus
    // t1154 tapered horns: a bright two-sided crystal pick, long left
    // horn, shorter right horn, both needle-tipped, through the collar.
    const outerPts = [
      P(-0.200, -0.070),
      P(-0.150, -0.090),
      P(-0.080, -0.050),
      P(-0.010, -0.012),
      P( 0.010, -0.012),
      P( 0.060, -0.045),
      P( 0.110, -0.095),
      P( 0.135, -0.080)
    ];
    const innerPts = [
      P( 0.135, -0.080),
      P( 0.090, -0.040),
      P( 0.030,  0.012),
      P( 0.000,  0.022),
      P(-0.040,  0.012),
      P(-0.120, -0.030),
      P(-0.200, -0.070)
    ];
    const outer = crChain(outerPts, 12);
    const inner = crChain(innerPts, 12);
    const tipU = outer[outer.length - 1];
    const tipL = outer[0];
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

    function taperedHorn(side, length, drop, rootR) {
      const segs = 22, rads = 12;
      const pos = [], nrm = [], uv = [], idx = [];
      const pts = [], tans = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = side * (0.010 + length * t);
        // Shallower arch per t1154 LOOK: almost level at the root, a
        // gentle drop toward the tip (t^2.4 instead of t^2).
        const y = 0.010 * Math.sin(t * Math.PI) * (1 - t) - drop * Math.pow(t, 2.4);
        pts.push(new T.Vector3(x, y, 0));
      }
      for (let i = 0; i <= segs; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(segs, i + 1)];
        const d = b.clone().sub(a);
        if (d.lengthSq() < 1e-10) d.set(side, 0, 0);
        tans.push(d.normalize());
      }
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        // Oval cross-section: wider in the curve plane, flatter toward
        // the camera, so the horns read as crystal blades, not tubes.
        const r = rootR * Math.pow(1 - t, 0.72) + 0.0012;
        const rIn = r * 1.45, rOut = r * 0.62;
        const p = pts[i], tan = tans[i];
        const hint = new T.Vector3(0, 0, 1);
        let nn = new T.Vector3().crossVectors(tan, hint);
        if (nn.lengthSq() < 1e-8) nn.set(0, 1, 0);
        nn.normalize();
        const bn = new T.Vector3().crossVectors(tan, nn).normalize();
        for (let j = 0; j <= rads; j++) {
          const ang = (j / rads) * Math.PI * 2;
          const cx = Math.cos(ang), sy = Math.sin(ang);
          const nr = nn.clone().multiplyScalar(cx).addScaledVector(bn, sy);
          const vx = p.clone().addScaledVector(nn, rIn * cx).addScaledVector(bn, rOut * sy);
          pos.push(vx.x, vx.y, vx.z);
          nrm.push(nr.x, nr.y, nr.z);
          uv.push(t * 2.2, j / rads);
        }
      }
      for (let i = 0; i < segs; i++) {
        for (let j = 0; j < rads; j++) {
          const a = i * (rads + 1) + j;
          const b = a + rads + 1;
          idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }
    function mergeGeos(list) {
      let pN = 0, iN = 0;
      for (let i = 0; i < list.length; i++) {
        pN += list[i].getAttribute('position').count;
        iN += list[i].index ? list[i].index.count : 0;
      }
      const pos = new Float32Array(pN * 3), nrm = new Float32Array(pN * 3), uv = new Float32Array(pN * 2);
      const idx = new (pN > 65535 ? Uint32Array : Uint16Array)(iN);
      let po = 0, uo = 0, io = 0, vo = 0;
      for (let i = 0; i < list.length; i++) {
        const g = list[i];
        const pa = g.getAttribute('position').array;
        const na = g.getAttribute('normal').array;
        const ua = g.getAttribute('uv').array;
        pos.set(pa, po); nrm.set(na, po); uv.set(ua, uo);
        const ia = g.index.array;
        for (let k = 0; k < ia.length; k++) idx[io + k] = ia[k] + vo;
        vo += g.getAttribute('position').count;
        po += pa.length; uo += ua.length; io += ia.length;
      }
      const out = new T.BufferGeometry();
      out.setAttribute('position', new T.BufferAttribute(pos, 3));
      out.setAttribute('normal', new T.BufferAttribute(nrm, 3));
      out.setAttribute('uv', new T.BufferAttribute(uv, 2));
      out.setIndex(new T.BufferAttribute(idx, 1));
      return out;
    }
    // Collar-scale yoke so the two horns read as one head through the socket.
    const yoke = new T.CylinderGeometry(0.020, 0.018, 0.040, 12);
    yoke.rotateZ(Math.PI / 2);
    const left = taperedHorn(-1, 0.118 * HEAD_SX, 0.036 * HEAD_SY, 0.024);
    const right = taperedHorn( 1, 0.072 * HEAD_SX, 0.048 * HEAD_SY, 0.022);
    const geo = mergeGeos([left, right, yoke]);
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
  function woodGrainTex1274() {
    if (U._woodGrainTex1274) return U._woodGrainTex1274;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#6b4226';
    g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 48; i++) {
      const x = (i / 48) * 256 + (Math.sin(i * 1.7) * 8);
      g.strokeStyle = i % 3 === 0 ? 'rgba(42,24,10,0.45)' : (i % 3 === 1 ? 'rgba(120,78,40,0.4)' : 'rgba(90,52,24,0.35)');
      g.lineWidth = 1.2 + (i % 5) * 0.6;
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y <= 512; y += 16) {
        g.lineTo(x + Math.sin(y * 0.04 + i) * 6 + Math.sin(y * 0.11 + i * 0.7) * 3, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const y = 30 + i * 48;
      g.strokeStyle = 'rgba(30,16,6,0.18)';
      g.lineWidth = 8;
      g.beginPath();
      g.ellipse(128, y, 90 + (i % 3) * 20, 10, 0, 0, Math.PI * 2);
      g.stroke();
    }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(1, 3);
    U._woodGrainTex1274 = t;
    return t;
  }
  function crystalTex1274() {
    if (U._crystalTex1274) return U._crystalTex1274;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    // V is the horn circumference (taperedHorn uv.y = j/rads). Saturated
    // amethyst body with a bright rim at V=0 and V=1 (the blade edges).
    const bg = g.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0.00, '#f7eeff');
    bg.addColorStop(0.07, '#c56cff');
    bg.addColorStop(0.16, '#8a22e6');
    bg.addColorStop(0.50, '#5a0eb0');
    bg.addColorStop(0.84, '#8a22e6');
    bg.addColorStop(0.93, '#c56cff');
    bg.addColorStop(1.00, '#f7eeff');
    g.fillStyle = bg;
    g.fillRect(0, 0, 256, 256);
    // Darker veins across the body, kept off the bright rim.
    g.save();
    g.beginPath();
    g.rect(0, 28, 256, 200);
    g.clip();
    for (let i = 0; i < 22; i++) {
      g.strokeStyle = i % 3 === 0 ? 'rgba(16,4,40,0.88)' : (i % 3 === 1 ? 'rgba(40,8,90,0.72)' : 'rgba(70,18,140,0.50)');
      g.lineWidth = i % 4 === 0 ? 2.6 : 1.3;
      g.beginPath();
      let x = (i * 37) % 256, y = 28;
      g.moveTo(x, y);
      for (let k = 0; k < 18; k++) {
        x += Math.sin(k * 1.4 + i) * 22 + 3;
        y += 10 + Math.cos(k * 0.85 + i) * 7;
        g.lineTo(((x % 256) + 256) % 256, y);
      }
      g.stroke();
    }
    // A few glossy body facets, not enough to pastel-wash the violet.
    for (let i = 0; i < 5; i++) {
      const x = 48 + (i * 43) % 160, y = 72 + (i * 29) % 100;
      const grd = g.createRadialGradient(x, y, 1, x, y, 14);
      grd.addColorStop(0, 'rgba(255,240,255,0.40)');
      grd.addColorStop(1, 'rgba(255,240,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(x, y, 12, 6, i * 0.8, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    // Bright edge highlight along both blade rims.
    const rim = g.createLinearGradient(0, 0, 0, 256);
    rim.addColorStop(0.00, 'rgba(255,252,255,0.95)');
    rim.addColorStop(0.05, 'rgba(236,210,255,0.70)');
    rim.addColorStop(0.11, 'rgba(160,80,255,0)');
    rim.addColorStop(0.89, 'rgba(160,80,255,0)');
    rim.addColorStop(0.95, 'rgba(236,210,255,0.70)');
    rim.addColorStop(1.00, 'rgba(255,252,255,0.95)');
    g.fillStyle = rim;
    g.fillRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    // One wrap around the horn so the rim sits on the sharp edges.
    t.repeat.set(1, 1);
    U._crystalTex1274 = t;
    return t;
  }
  function tintCrescent(blade) {
    if (!blade) return;
    // 1268: deep violet-purple, not the 1266/1267 magenta 0xb44cff.
    // t1154: veined glossy crystal map on top of that base.
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
    // Unlit MeshBasic + veined canvas. Lit Standard/Phong went near-black
    // under this studio's SwiftShader even with a strong emissive, so the
    // colour and veins are authored in the texture itself. Identifier
    // fpStd1267 / crystalCore1249 kept.
    const tex = crystalTex1274();
    if (!blade.userData.fpStd1267 || !prev || !prev.isMeshBasicMaterial) {
      const mat = new T.MeshBasicMaterial({
        color: 0xffffff,
        map: tex,
        side: T.DoubleSide,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        fog: false
      });
      mat.userData = mat.userData || {};
      mat.userData.crystalCore1249 = 1;
      blade.material = mat;
      blade.userData.fpStd1267 = 1;
      blade.userData.crystalCore1249 = 1;
    } else {
      const mat = prev;
      mat.color.setHex(0xffffff);
      mat.map = tex;
      mat.transparent = false;
      mat.opacity = 1;
      mat.depthWrite = true;
      mat.side = T.DoubleSide;
      if (mat.fog != null) mat.fog = false;
      if (mat.userData) mat.userData.crystalCore1249 = 1;
      mat.needsUpdate = true;
    }
  }
  function isHaftWood(o) {
    const ud = o.userData || {};
    if (ud.fpSock1265 || ud.fpHook1264 || ud.fpHook1263 || ud.keepHidden1263 || ud.glow1249 || ud.crystalCore1249 || ud.noGrip) return false;
    const mat = o.material || {};
    const c = mat.color;
    const col = c && c.getHex && c.getHex();
    if (col === 0x4a2c14 || col === 0x3a2412 || col === 0x5a3a1e) return true;
    if (c && c.r > 0.20 && c.g > 0.08 && c.g < 0.55 && c.b < 0.32 && c.r > c.b + 0.06 && c.r >= c.g) return true;
    if (ud.handle1249 || ud.prism1241Applied) return true;
    return false;
  }
  // Tip of the long wooden haft in `root` local space (the group the
  // blade is parented to). The 1.2.49 prism pick tip sits at ~0.62;
  // a 1267 floor of 0.87 left a floating socket on that mesh.
  function haftTopY(blade) {
    const root = (blade && blade.parent)
      || (typeof held !== 'undefined' && held && held.children && held.children[0])
      || (typeof held !== 'undefined' ? held : null);
    if (!root) return 0.62;
    root.updateWorldMatrix(true, true);
    let bestSpan = 0, tipY = null;
    const v = new T.Vector3();
    root.traverse(function (o) {
      if (!o.isMesh || o === blade || o.visible === false || !o.geometry) return;
      let p = o.parent;
      while (p) { if (p === blade) return; p = p.parent; }
      if (!isHaftWood(o)) return;
      try {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox;
        if (!bb) return;
        let minY = null, maxY = null;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
          v.set(i ? bb.max.x : bb.min.x, j ? bb.max.y : bb.min.y, k ? bb.max.z : bb.min.z)
            .applyMatrix4(o.matrixWorld);
          root.worldToLocal(v);
          if (minY == null || v.y < minY) minY = v.y;
          if (maxY == null || v.y > maxY) maxY = v.y;
        }
        const span = maxY - minY;
        // The shaft is the long wood piece; ignore the short carved socket.
        if (span > bestSpan) { bestSpan = span; tipY = maxY; }
      } catch (_) {}
    });
    return tipY == null ? 0.62 : tipY;
  }
  function measurePickContact(blade) {
    const rec = { pickContact1273: 1, ok: false, gap: null, haftY: null, bladeY: null };
    try {
      const b = blade;
      if (!b) {
        try {
          (typeof held !== 'undefined' && held) && held.traverse(function (o) {
            if (!b && o.isMesh && o.userData && o.userData.fpHook1264) blade = o;
          });
        } catch (_) {}
      }
      if (!blade) { U.pickContact = rec; return rec; }
      const haftY = haftTopY(blade);
      const bladeY = blade.position.y;
      const gap = +(bladeY - haftY).toFixed(4);
      rec.haftY = +(+haftY).toFixed(4);
      rec.bladeY = +(+bladeY).toFixed(4);
      rec.gap = gap;
      rec.ok = Math.abs(gap) <= 0.02;
    } catch (e) { rec.err = String(e && e.message || e); }
    U.pickContact = rec;
    return rec;
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
    measurePickContact(blade);
  }
  function dressHaftShaft() {
    // t1154: replace the twisted prism shaft with a straight grain-mapped
    // wood cylinder of the same length, tip still at the measured haft top.
    if (!held || held.userData.fpHaft1274) return;
    const root = (held.children && held.children[0]) || held;
    root.updateWorldMatrix(true, true);
    let minY = null, maxY = null;
    const v = new T.Vector3();
    const oldWood = [];
    root.traverse(function (o) {
      if (!o.isMesh || o.visible === false || !o.geometry) return;
      if (!isHaftWood(o)) return;
      if (o.userData && o.userData.fpHaftCyl1274) return;
      oldWood.push(o);
      try {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox;
        if (!bb) return;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
          v.set(i ? bb.max.x : bb.min.x, j ? bb.max.y : bb.min.y, k ? bb.max.z : bb.min.z)
            .applyMatrix4(o.matrixWorld);
          root.worldToLocal(v);
          if (minY == null || v.y < minY) minY = v.y;
          if (maxY == null || v.y > maxY) maxY = v.y;
        }
      } catch (_) {}
    });
    if (maxY == null) { maxY = 0.62; minY = -0.02; }
    // Cap the visible shaft so the crystal head stays in the upper-right
    // instead of flying off the top at FP scale.
    if (maxY - minY > 0.50) maxY = minY + 0.48;
    const len = Math.max(0.35, maxY - minY);
    const mid = (maxY + minY) * 0.5;
    const woodMat = new T.MeshPhongMaterial({
      color: 0x6b4226,
      map: woodGrainTex1274(),
      shininess: 18,
      specular: 0x3a2210
    });
    const cyl = new T.Mesh(new T.CylinderGeometry(0.016, 0.020, len, 20), woodMat);
    cyl.position.set(0, mid, 0);
    cyl.userData.handle1249 = 1;
    cyl.userData.fpHaftCyl1274 = 1;
    cyl.userData.prism1241Applied = 1;
    root.add(cyl);
    for (let i = 0; i < oldWood.length; i++) {
      oldWood[i].visible = false;
      oldWood[i].userData = oldWood[i].userData || {};
      oldWood[i].userData.keepHidden1263 = 1;
    }
    held.userData.fpHaft1274 = 1;
    restoreHaftMats();
  }
  function restoreHaftMats() {
    if (!held) return;
    const woodCol = 0x6b4226, metalCol = 0x2a2c32;
    held.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      const ud = o.userData || {};
      if (ud.fpHook1264 || ud.fpHook1263 || ud.fpHook1262 || ud.crystalCore1249 || ud.noGrip || ud.fpStd1267) return;
      if (ud.fpHaftCyl1274 || (ud.handle1249 && !ud.fpSockMetal1274 && !ud.fpSock1265)) {
        const m = o.material;
        if (m.color) m.color.setHex(woodCol);
        if (m.map !== woodGrainTex1274()) m.map = woodGrainTex1274();
        if (m.emissive && m.emissive.setHex) m.emissive.setHex(0x000000);
        if (m.specular && m.specular.setHex) m.specular.setHex(0x3a2210);
        if (m.shininess != null) m.shininess = 18;
        m.needsUpdate = true;
      }
      if (ud.fpSockMetal1274 && !ud.handle1249) {
        const m = o.material;
        if (m.color) m.color.setHex(metalCol);
        m.map = null;
        if (m.emissive && m.emissive.setHex) m.emissive.setHex(0x000000);
        if (m.specular && m.specular.setHex) m.specular.setHex(0xb0b4bc);
        if (m.shininess != null) m.shininess = 80;
        m.needsUpdate = true;
      }
    });
  }
  function ensureMetalCollar(blade) {
    if (!blade) return;
    if (blade.userData.fpSockMetal1274) return;
    // Drop any previous carved-wood socket children.
    const drop = [];
    blade.traverse(function (o) {
      if (o !== blade && o.userData && o.userData.fpSock1265) drop.push(o);
    });
    for (let i = 0; i < drop.length; i++) {
      try { if (drop[i].parent) drop[i].parent.remove(drop[i]); } catch (_) {}
    }
    const metal = new T.MeshPhongMaterial({
      color: 0x2a2c32, shininess: 80, specular: 0xb0b4bc
    });
    const woodMat = new T.MeshPhongMaterial({
      color: 0x6b4226, map: woodGrainTex1274(), shininess: 18, specular: 0x3a2210
    });
    const knot = new T.Group();
    knot.name = 'FpPickSock';
    function add(geo, mat, px, py, pz, tags) {
      const m = new T.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.userData = m.userData || {};
      m.userData.fpSock1265 = 1;
      m.userData.fpSockMetal1274 = 1;
      if (tags) for (const k in tags) m.userData[k] = tags[k];
      knot.add(m);
      return m;
    }
    // Dark metal collar around the haft top; a short wood cap pokes above.
    add(new T.CylinderGeometry(0.028, 0.025, 0.050, 18), metal, 0, -0.006, 0, null);
    add(new T.CylinderGeometry(0.030, 0.028, 0.008, 18), metal, 0, 0.018, 0, null);
    add(new T.CylinderGeometry(0.017, 0.015, 0.022, 12), woodMat, 0, 0.028, 0, { handle1249: 1 });
    add(new T.SphereGeometry(0.015, 12, 8), woodMat, 0, 0.038, 0, { handle1249: 1 }).scale.set(1, 0.65, 1);
    knot.userData.fpSock1265 = 1;
    knot.userData.fpSockMetal1274 = 1;
    blade.add(knot);
    // The blade itself is the crystal head — never tag it as the metal
    // sock. restoreHaftMats used to paint it 0x2a2c32 and strip the map,
    // which is why the head went near-black after the collar landed.
  }
  function dressPickHook() {
    if (!held) return;
    let already = false, blade0 = null;
    held.traverse(function (o) {
      if (o.userData && o.userData.fpHook1264 && o.isMesh) { already = true; blade0 = o; }
    });
    if (already && blade0) {
      try { dressHaftShaft(); } catch (_) {}
      alignCrescentFace(blade0);
      tintCrescent(blade0);
      try { ensureMetalCollar(blade0); } catch (_) {}
      try { restoreHaftMats(); } catch (_) {}
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
    // t1154: dark metal collar + short wood cap at the haft top.
    // Identifier fpSock1265 kept. dressHaftShaft runs first so the blade
    // seats on the new cylinder tip.
    try { dressHaftShaft(); } catch (_) {}
    alignCrescentFace(blade);
    try { ensureMetalCollar(blade); } catch (_) {}
    try { restoreHaftMats(); } catch (_) {}
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
    // t1153: both hip and two-hand aim are a 3/4 left-forward barrel with
    // the bird's-head (local -Y) hanging down in the palm. ADS is a slightly
    // flatter, more centred 3/4 — not an iron-sights camera punch-in.
    // Identifier fpPistolHip1271 is kept so earlier tests stay green.
    const ads = (U.poseKey === 'pistolAds' || U.ads || (typeof isAds === 'function' && isAds() && kindOf() === 'pistol'));
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    if (g.parent) g.parent.updateWorldMatrix(true, true);
    const muzzle = new T.Vector3(0, 0, -1);
    const dir = ads
      ? new T.Vector3(-0.62, 0.12, -0.77)
      : new T.Vector3(-0.72, 0.28, -0.63);
    dir.normalize();
    // dir is in camera space; lift it into the flintlock parent's space.
    if (vc) {
      try {
        const wDir = dir.clone().transformDirection(vc.matrixWorld).normalize();
        const parent = g.parent;
        const inv = parent ? new T.Matrix4().copy(parent.matrixWorld).invert() : new T.Matrix4();
        dir.copy(wDir).transformDirection(inv).normalize();
      } catch (_) {}
    }
    g.quaternion.setFromUnitVectors(muzzle, dir);
    g.updateWorldMatrix(true, true);
    if (vc) {
      const _r = new T.Vector3(), _u = new T.Vector3(), camZ = new T.Vector3();
      try { vc.matrixWorld.extractBasis(_r, _u, camZ); } catch (_) { _u.set(0, 1, 0); }
      const barrelW = new T.Vector3(0, 0, -1).transformDirection(g.matrixWorld).normalize();
      const gripW = new T.Vector3(0, -1, 0).transformDirection(g.matrixWorld).normalize();
      const camDown = _u.clone().multiplyScalar(-1);
      const desired = camDown.addScaledVector(barrelW, -camDown.dot(barrelW));
      if (desired.lengthSq() > 1e-8) {
        desired.normalize();
        const ang = Math.atan2(new T.Vector3().copy(gripW).cross(desired).dot(barrelW), gripW.dot(desired));
        const qWorld = g.getWorldQuaternion(new T.Quaternion());
        const qRoll = new T.Quaternion().setFromAxisAngle(barrelW, ang);
        const qNewWorld = qRoll.multiply(qWorld);
        const qParent = g.parent ? g.parent.getWorldQuaternion(new T.Quaternion()) : new T.Quaternion();
        g.quaternion.copy(qParent.invert().multiply(qNewWorld));
      }
    }
    g.userData.fpPistolHip1271 = 1;
    U.pistolHipQ = [+g.quaternion.x.toFixed(5), +g.quaternion.y.toFixed(5), +g.quaternion.z.toFixed(5), +g.quaternion.w.toFixed(5)];
    // When seating, run the grip through the fist tunnel and roll the
    // barrel to the 3/4 left-forward aim so the cuff can clear the stock.
    const wantSeat = !!(U.useSeat || (U.POSES[U.poseKey] && U.POSES[U.poseKey].seat));
    if (wantSeat && g.parent && vc) {
      const parent = g.parent;
      parent.updateWorldMatrix(true, true);
      const tunnelW = new T.Vector3(1, 0, 0).transformDirection(parent.matrixWorld).normalize();
      const muzCam = ads ? new T.Vector3(-0.62, 0.12, -0.77) : new T.Vector3(-0.72, 0.28, -0.63);
      muzCam.normalize();
      const muzW = muzCam.transformDirection(vc.matrixWorld).normalize();
      const muzP = muzW.clone().addScaledVector(tunnelW, -muzW.dot(tunnelW));
      if (muzP.lengthSq() < 1e-8) muzP.copy(muzW);
      muzP.normalize();
      const yW = tunnelW.clone().multiplyScalar(-1);
      const zW = muzP.clone().multiplyScalar(-1);
      const xW = new T.Vector3().crossVectors(yW, zW).normalize();
      zW.crossVectors(xW, yW).normalize();
      const mW = new T.Matrix4().makeBasis(xW, yW, zW);
      const qW = new T.Quaternion().setFromRotationMatrix(mW);
      const qP = parent.getWorldQuaternion(new T.Quaternion());
      g.quaternion.copy(qP.invert().multiply(qW));
      g.updateWorldMatrix(true, true);
      seatChildPointOnParentOrigin(g, new T.Vector3(0, -0.058, 0.022));
    }
  }
  function seatChildPointOnParentOrigin(g, localPoint) {
    if (!g) return;
    g.updateWorldMatrix(true, true);
    if (!g.parent) {
      const s = (g.scale && g.scale.x) || 1;
      g.position.copy(localPoint.clone().multiplyScalar(s).applyQuaternion(g.quaternion).negate());
      return;
    }
    const gripW = g.localToWorld(localPoint.clone());
    const fistW = g.parent.getWorldPosition(new T.Vector3());
    const newWorld = g.getWorldPosition(new T.Vector3()).add(fistW.sub(gripW));
    g.position.copy(g.parent.worldToLocal(newWorld));
  }
  function seatHeldWorldPoint(heldObj, worldPoint) {
    if (!heldObj || !heldObj.parent || !worldPoint) return;
    heldObj.updateWorldMatrix(true, true);
    const fistW = heldObj.parent.getWorldPosition(new T.Vector3());
    const newWorld = heldObj.getWorldPosition(new T.Vector3()).add(fistW.clone().sub(worldPoint));
    heldObj.position.copy(heldObj.parent.worldToLocal(newWorld));
  }
  // Hand-authored gun anchors, inspected in gun-local space (the
  // flintlock group for the pistol; held/rig local for the musket).
  // grip: where the fist wraps. forestock: left-hand cup. gripAxis:
  // through the fist tunnel (pommel → lock / butt → slightly back).
  // muzzle: along the barrel.
  const GUN_ANCHORS = {
    pistol: {
      // 1282 FP pistol: origin is the mid-fist wrist. Grip axis is down
      // the bird's-head (not colinear with the barrel), so the sword fist
      // can close around a hilt-diameter cylinder.
      grip: new T.Vector3(0.000, 0.000, 0.000),
      forestock: new T.Vector3(0.000, 0.016, -0.130),
      gripAxis: new T.Vector3(0.000, -0.970, 0.240),
      muzzle: new T.Vector3(0.000, 0.000, -1.000),
      lockAxis: new T.Vector3(1.000, 0.000, 0.000),
      muzCamHip: new T.Vector3(-0.50, 0.18, -0.85),
      muzCamAds: new T.Vector3(-0.44, 0.12, -0.89)
    },
    musket: {
      // 1282 FP musket: same non-colinear pistol-grip wrist through the
      // sword fist. Barrel is -Z, hanging butt is +Z with a drop in -Y.
      grip: new T.Vector3(0.000, 0.000, 0.000),
      forestock: new T.Vector3(0.000, 0.018, -0.220),
      gripAxis: new T.Vector3(0.000, -0.970, 0.240),
      muzzle: new T.Vector3(0.000, 0.000, -1.000),
      lockAxis: new T.Vector3(1.000, 0.000, 0.000),
      muzCamHip: new T.Vector3(-0.46, 0.26, -0.85),
      muzCamAds: new T.Vector3(-0.42, 0.18, -0.89)
    }
  };
  U.GUN_ANCHORS = GUN_ANCHORS;

  function gunRoot(kind) {
    if (typeof held === 'undefined' || !held) return null;
    let g = null;
    if (kind === 'pistol' || kind === 'pistolAds') {
      held.traverse(function (o) { if (!g && o.name === 'FpPistol1282') g = o; });
      if (!g) held.traverse(function (o) { if (!g && o.name === 'FpFlintlock1265') g = o; });
      return g;
    }
    held.traverse(function (o) { if (!g && o.name === 'FpMusket1282') g = o; });
    return g || held;
  }

  function alignLocalToWorld(obj, locA, worldA, locB, worldB) {
    if (!obj || !obj.parent) return;
    const a = locA.clone().normalize();
    const wa = worldA.clone().normalize();
    const q1 = new T.Quaternion().setFromUnitVectors(a, wa);
    const b = locB.clone().normalize().applyQuaternion(q1);
    const bWant = worldB.clone().addScaledVector(wa, -worldB.dot(wa));
    const bHave = b.clone().addScaledVector(wa, -b.dot(wa));
    if (bWant.lengthSq() > 1e-8 && bHave.lengthSq() > 1e-8) {
      bWant.normalize();
      bHave.normalize();
      const ang = Math.atan2(new T.Vector3().copy(bHave).cross(bWant).dot(wa), bHave.dot(bWant));
      q1.premultiply(new T.Quaternion().setFromAxisAngle(wa, ang));
    }
    const qP = obj.parent.getWorldQuaternion(new T.Quaternion());
    obj.quaternion.copy(qP.invert().multiply(q1));
    obj.updateWorldMatrix(true, true);
  }


  function restoreGunSlim() {
    const list = U._slimMeshes || [];
    for (let i = 0; i < list.length; i++) {
      const mesh = list[i];
      if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) continue;
      const orig = mesh.userData && mesh.userData._posOrig1280;
      if (!orig) continue;
      const pos = mesh.geometry.attributes.position;
      if (pos.array && orig.length === pos.array.length) pos.array.set(orig);
      pos.needsUpdate = true;
    }
    U._slimMeshes = [];
  }
  function replacePistolHook(gun) {
    if (!gun) return;
    let woodM = null;
    gun.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      const typ = o.geometry.type || '';
      if (typ === 'ExtrudeGeometry' || typ === 'ExtrudeBufferGeometry') {
        o.visible = false;
        o.userData.fpHookHidden1281 = 1;
      }
      // Trigger and guard were attached to the hook; hide them so they
      // do not float beside the slim replacement grip.
      if (typ === 'TorusGeometry' || typ === 'TorusBufferGeometry') {
        o.visible = false;
        o.userData.fpHookHidden1281 = 1;
      }
      if (o.position && o.position.y < -0.015 && typ === 'BoxGeometry') {
        o.visible = false;
        o.userData.fpHookHidden1281 = 1;
      }
      if (!woodM && o.material && o.material.color && typ === 'CylinderGeometry') {
        // Prefer the forestock wood, not steel barrel.
        const hex = o.material.color.getHex && o.material.color.getHex();
        if (hex === 0x6b4226 || hex === 0x6B4226) woodM = o.material;
      }
    });
    // Do not add a through-fist cylinder on the mirrored gun: that shaft
    // missed the tunnel and read as a stick above an open fist. The
    // FpGrip pin is the in-fist haft. A short wood join just above the
    // fingers, in gun local, meets the forestock/barrel.
    let grip = gun.userData.fpPistolGrip1281;
    if (grip && grip.parent && grip.parent !== gun) grip.parent.remove(grip);
    gun.children.slice().forEach(function (ch) {
      if (ch !== grip && (ch.name === 'FpPistolGrip1281' || (ch.userData && ch.userData.fpPistolGrip1281))) gun.remove(ch);
    });
    if (!grip) {
      if (!woodM) woodM = new T.MeshPhongMaterial({ color: 0x6b4226, shininess: 22, specular: 0x3a2210 });
      grip = new T.Mesh(new T.CylinderGeometry(0.011, 0.012, 1, 12), woodM);
      grip.name = 'FpPistolGrip1281';
      grip.userData.fpPistolGrip1281 = 1;
      gun.add(grip);
      gun.userData.fpPistolGrip1281 = grip;
    } else if (!grip.parent) {
      gun.add(grip);
    }
    // From the underside of the lock/barrel down to the grip point so
    // the floating assembly sits on the tunnel haft, like the sword guard.
    const a = new T.Vector3(0, 0.022, -0.008);
    const b = new T.Vector3(0, -0.064, 0.010);
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length(), 1e-4);
    grip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    grip.position.copy(a).add(b).multiplyScalar(0.5);
    grip.scale.set(1, len, 1);
    grip.visible = true;
  }
  function restorePistolHook() {
    const roots = [];
    try { if (typeof held !== 'undefined' && held) roots.push(held); } catch (_) {}
    for (let r = 0; r < roots.length; r++) {
      roots[r].traverse(function (o) {
        if (o.userData && o.userData.fpHookHidden1281) {
          o.visible = true;
          o.userData.fpHookHidden1281 = 0;
        }
        if (o.userData && o.userData.fpPistolGrip1281) o.visible = false;
      });
    }
  }
  function pinToHiltCylinder(gun, axisWorld) {
    // Collapse gun verts inside the fist onto a sword-hilt-radius
    // cylinder along the wood's path through the hand (grip axis /
    // barrel), then taper back to full size just outside the fingers.
    if (!gun || !gun.parent) return;
    gun.updateWorldMatrix(true, true);
    gun.parent.updateWorldMatrix(true, true);
    const origin = new T.Vector3();
    gun.parent.getWorldPosition(origin);
    const axis = (axisWorld && axisWorld.lengthSq() > 1e-8)
      ? axisWorld.clone().normalize()
      : new T.Vector3(1, 0, 0).transformDirection(gun.parent.matrixWorld).normalize();
    const hiltR = 0.0068;
    const halfLen = 0.048;
    const fistR = 0.052;
    const taper = 0.022;
    if (!U._slimMeshes) U._slimMeshes = [];
    let nTouched = 0;
    const tmp = new T.Vector3();
    const rel = new T.Vector3();
    const radial = new T.Vector3();
    gun.traverse(function (mesh) {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
      if (mesh.userData && (mesh.userData.fpHiltPin1281 || mesh.userData.fpCuffCap1281 || mesh.userData.fpMusketButtCap1280)) return;
      if (mesh.name === 'FpHiltPin1281' || mesh.name === 'FpPistolCPlug1280' || mesh.name === 'FpMusketButtCap1280') return;
      const pos = mesh.geometry.attributes.position;
      if (!mesh.userData._posOrig1280) {
        mesh.userData._posOrig1280 = Float32Array.from(pos.array);
        U._slimMeshes.push(mesh);
      }
      const orig = mesh.userData._posOrig1280;
      let touched = false;
      for (let i = 0; i < pos.count; i++) {
        tmp.set(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]);
        mesh.localToWorld(tmp);
        rel.copy(tmp).sub(origin);
        const t = rel.dot(axis);
        radial.copy(rel).addScaledVector(axis, -t);
        const pr = radial.length();
        const tClamped = Math.max(-halfLen, Math.min(halfLen, t));
        const axial = Math.abs(t) - halfLen;
        const off = Math.sqrt(pr * pr + (axial > 0 ? axial * axial : 0));
        let target = pr;
        if (off <= fistR) {
          if (pr > hiltR) target = hiltR;
        } else if (off <= fistR + taper) {
          const u = (off - fistR) / taper;
          const mid = hiltR + (pr - hiltR) * u;
          if (pr > mid) target = mid;
        }
        if (target !== pr && pr > 1e-8) {
          radial.multiplyScalar(target / pr);
          tmp.copy(origin).addScaledVector(axis, t).add(radial);
          mesh.worldToLocal(tmp);
          pos.array[i * 3] = tmp.x;
          pos.array[i * 3 + 1] = tmp.y;
          pos.array[i * 3 + 2] = tmp.z;
          touched = true;
        } else {
          pos.array[i * 3] = orig[i * 3];
          pos.array[i * 3 + 1] = orig[i * 3 + 1];
          pos.array[i * 3 + 2] = orig[i * 3 + 2];
        }
      }
      if (touched) {
        pos.needsUpdate = true;
        if (mesh.geometry.computeVertexNormals) mesh.geometry.computeVertexNormals();
        if (mesh.geometry.computeBoundingBox) mesh.geometry.computeBoundingBox();
        if (mesh.geometry.computeBoundingSphere) mesh.geometry.computeBoundingSphere();
        nTouched++;
      }
    });
    U.pinDiag = { nTouched: nTouched, ok: 1 };
  }
  function ensureHiltPin(parent) {
    // Tunnel-aligned wood haft, parented to FpGrip (hand +X), never to
    // the gun. The pistol X-mirror lives on the gun and must not skew
    // the cylinder the fist closes around. Radius matches the baked
    // sword tunnel so the knuckle row can read the same way.
    if (!parent) return;
    // Walk up to the real FpGrip so a wrapper Group under the pistol
    // held item cannot own the pin.
    let grip = parent;
    while (grip && grip.name !== 'FpGrip' && grip.parent) grip = grip.parent;
    if (grip && grip.name === 'FpGrip') parent = grip;
    parent.updateWorldMatrix(true, true);
    function stripPinsByName(root) {
      if (!root || !root.traverse) return;
      const drop = [];
      root.traverse(function (ch) {
        if (ch !== root && ch.name === 'FpHiltPin1281') drop.push(ch);
      });
      drop.forEach(function (ch) { if (ch.parent) ch.parent.remove(ch); });
      if (root.userData && root.name !== 'FpHiltPin1281') root.userData.fpHiltPin1281 = null;
    }
    try { if (typeof held !== 'undefined' && held) { stripPinsByName(held); held.visible = true; if (held.userData) held.userData.fpHiltPin1281 = null; } } catch (_) {}
    let pin = parent.userData && parent.userData.fpHiltPin1281;
    if (pin && (pin.name !== 'FpHiltPin1281' || (pin.parent && pin.parent !== parent))) parent.userData.fpHiltPin1281 = pin = null;
    parent.children.slice().forEach(function (ch) {
      if (ch !== pin && ch.name === 'FpHiltPin1281') parent.remove(ch);
    });
    if (!pin) {
      const mat = new T.MeshPhongMaterial({ color: 0x5c3a22, shininess: 18, specular: 0x3a2210, side: T.DoubleSide });
      pin = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 14), mat);
      pin.name = 'FpHiltPin1281';
      pin.userData.fpHiltPin1281 = 1;
      pin.rotation.z = -Math.PI / 2;
      parent.add(pin);
      parent.userData.fpHiltPin1281 = pin;
    } else if (!pin.parent) {
      parent.add(pin);
    }
    const r = 0.012 * BAKE_HAND_SCALE * 1.10; // baker tunnel, in grip/hand local
    const len = 0.11 / Math.max(1e-6, (function () {
      const sx = new T.Vector3();
      parent.matrixWorld.decompose(new T.Vector3(), new T.Quaternion(), sx);
      return (Math.abs(sx.x) + Math.abs(sx.y) + Math.abs(sx.z)) / 3;
    })());
    pin.position.set(0, 0, 0);
    pin.scale.set(r, len, r);
    pin.visible = true;
  }
  function slimAroundAnchor(gun, anchorLoc, axisLoc, along, radial, scale) {
    if (!gun || !anchorLoc || !axisLoc) return;
    gun.updateWorldMatrix(true, true);
    const ax = axisLoc.clone().normalize();
    const sc = (scale != null) ? scale : 0.80;
    if (!U._slimMeshes) U._slimMeshes = [];
    gun.traverse(function (mesh) {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
      const pos = mesh.geometry.attributes.position;
      if (!mesh.userData._posOrig1280) mesh.userData._posOrig1280 = Float32Array.from(pos.array);
      const orig = mesh.userData._posOrig1280;
      const tmp = new T.Vector3();
      let touched = false;
      for (let i = 0; i < pos.count; i++) {
        tmp.set(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]);
        mesh.localToWorld(tmp);
        gun.worldToLocal(tmp);
        const relX = tmp.x - anchorLoc.x, relY = tmp.y - anchorLoc.y, relZ = tmp.z - anchorLoc.z;
        const t = relX * ax.x + relY * ax.y + relZ * ax.z;
        const px = relX - ax.x * t, py = relY - ax.y * t, pz = relZ - ax.z * t;
        const pr = Math.sqrt(px * px + py * py + pz * pz);
        if (Math.abs(t) <= along && pr <= radial) {
          const fall = 1 - Math.abs(t) / Math.max(along, 1e-6);
          const k = 1 - (1 - sc) * fall * fall;
          tmp.set(
            anchorLoc.x + ax.x * t + px * k,
            anchorLoc.y + ax.y * t + py * k,
            anchorLoc.z + ax.z * t + pz * k
          );
          gun.localToWorld(tmp);
          mesh.worldToLocal(tmp);
          pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
          touched = true;
        } else {
          pos.setXYZ(i, orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]);
        }
      }
      if (touched) {
        pos.needsUpdate = true;
        if (mesh.geometry.computeVertexNormals) mesh.geometry.computeVertexNormals();
        U._slimMeshes.push(mesh);
      }
    });
  }
  function seatGunOnFist(kind) {
    const an = (kind === 'musket' || kind === 'musketAds') ? GUN_ANCHORS.musket : GUN_ANCHORS.pistol;
    const ads = (kind === 'pistolAds' || kind === 'musketAds');
    const gun = gunRoot(kind);
    if (!gun || !gun.parent || !vc || !an) return;
    vc.updateMatrixWorld(true);
    // Zero the wrapper so only the gun (or held, for the musket) carries
    // the keyframe pose. The gun is moved to the hand, not the reverse.
    if (typeof held !== 'undefined' && held && gun !== held) {
      held.position.set(0, 0, 0);
      held.quaternion.identity();
      held.updateWorldMatrix(true, true);
    }
    gun.parent.updateWorldMatrix(true, true);
    const tunnelW = new T.Vector3(1, 0, 0).transformDirection(gun.parent.matrixWorld).normalize();
    const muzCam = (ads ? an.muzCamAds : an.muzCamHip).clone().normalize();
    const muzW = muzCam.clone().transformDirection(vc.matrixWorld).normalize();
    const lockCam = new T.Vector3(0.55, 0.15, 0.82).normalize();
    const lockW = lockCam.transformDirection(vc.matrixWorld).normalize();
    const colinear = Math.abs(an.gripAxis.clone().normalize().dot(an.muzzle.clone().normalize())) > 0.85;
    if (colinear) {
      // Long gun: muzzle and grip axis share a line, so the fist haft
      // already aims the barrel. Align muzzle to the authored camera
      // direction, then roll the lock toward the camera/right.
      alignLocalToWorld(gun, an.muzzle, muzW, an.lockAxis, lockW);
    } else {
      // Pistol: pommel hangs down toward the wrist (opposite the
      // sword-fist tunnel +X, which points to the fingertips), then
      // roll the barrel to the 3/4 left-forward aim.
      alignLocalToWorld(gun, an.gripAxis, tunnelW.clone().negate(), an.muzzle, muzW);
    }
    const twist = ads ? (an.twistAds || 0) : (an.twistHip || 0);
    if (twist) {
      const muzAxis = an.muzzle.clone().transformDirection(gun.matrixWorld).normalize();
      const qTw = new T.Quaternion().setFromAxisAngle(muzAxis, twist);
      const qP = gun.parent.getWorldQuaternion(new T.Quaternion());
      const qW = gun.getWorldQuaternion(new T.Quaternion());
      gun.quaternion.copy(qP.invert().multiply(qTw.multiply(qW)));
      gun.updateWorldMatrix(true, true);
    }
    // Mirror the pistol in local X so the +X lock faces the camera in a
    // right-hand 3/4 (Y up, barrel left). Grip is on x=0 so the seat holds.
    if (!colinear) {
      const sx = Math.abs((gun.scale && gun.scale.x) || 1) || 1;
      gun.scale.x = -sx;
      gun.updateWorldMatrix(true, true);
    }
    seatChildPointOnParentOrigin(gun, an.grip.clone());
    gun.updateWorldMatrix(true, true);
    // Hide any leftover C-plug from earlier iterations.
    const leftover = gun.getObjectByName('FpPistolCPlug1280');
    if (leftover) leftover.visible = false;
    // 1282 models already have a hilt-diameter wrist, so do not pin,
    // slim, or replace hooks — those paths mutate geometry and fight
    // the closed knuckle row. Hide any leftover pin from earlier WIP.
    if (gun.userData && gun.userData.fpGun1282) {
      gun.traverse(function (o) {
        if (o.name === 'FpHiltPin1281' || (o.userData && o.userData.fpHiltPin1281)) o.visible = false;
      });
      if (gun.parent) {
        gun.parent.traverse(function (o) {
          if (o.name === 'FpHiltPin1281' || (o.userData && o.userData.fpHiltPin1281)) o.visible = false;
        });
      }
    } else {
      if (!colinear) {
        try { replacePistolHook(gun); } catch (e) { U.hookErr = String(e && e.message || e); }
      }
      const pinAxisW = new T.Vector3(1, 0, 0).transformDirection(gun.parent.matrixWorld).normalize();
      try { pinToHiltCylinder(gun, pinAxisW); } catch (e) { U.pinDiag = { ok: 0, err: String(e && e.message || e) }; }
      try { ensureHiltPin(gun.parent); } catch (e) { U.pinPinErr = String(e && e.message || e); }
    }
    gun.updateWorldMatrix(true, true);
    const muzNow = an.muzzle.clone().transformDirection(gun.matrixWorld).normalize();
    const muzNowCam = muzNow.clone().transformDirection(new T.Matrix4().copy(vc.matrixWorld).invert());
    U.gunSeated = {
      kind: kind,
      colinear: colinear ? 1 : 0,
      muzCam: [+muzNowCam.x.toFixed(3), +muzNowCam.y.toFixed(3), +muzNowCam.z.toFixed(3)]
    };
  }

  function poseLeftOnForestock(kind, aspect, hs) {
    U.leftRan = (U.leftRan || 0) + 1;
    U.leftKind = kind || null;
    if (!armL || !vc) { U.leftSkip = 'no-arm'; return; }
    const gun = gunRoot(kind);
    if (!gun) { U.leftSkip = 'no-gun'; return; }
    vc.updateMatrixWorld(true);
    gun.updateWorldMatrix(true, true);
    // Author the cup as a fixed child of the forestock anchor, palm up
    // under the wood. The left sleeve is then posed to meet that cup.
    let cupGrp = null;
    try { cupGrp = ensureForestockCup(gun); } catch (e) { U.leftCupErr = String(e && e.message || e); }
    const anc = findNamed1282(gun, 'FpForestockAnchor1282');
    if (!anc) { U.leftSkip = 'no-anchor:' + (gun && gun.name || 'held'); return; }
    U.leftSkip = null;
    anc.updateWorldMatrix(true, true);
    function worldToWr(worldPt, asp) {
      const v = worldPt.clone();
      const inv = new T.Matrix4().copy(vc.matrixWorld);
      if (typeof inv.invert === 'function') inv.invert();
      else if (typeof inv.getInverse === 'function') inv.getInverse(vc.matrixWorld);
      v.applyMatrix4(inv);
      const z = v.z;
      const hy = Math.tan(FP_FOV * 0.5 * Math.PI / 180) * Math.abs(z || 1);
      const hx = hy * (asp || REF_ASPECT);
      return [v.x / (hx || 1), v.y / (hy || 1), z];
    }
    // Wrist of the cup sits at the cuff (anchor +Z, slightly down).
    const wrLocal = new T.Vector3(0, -0.030, 0.070);
    const wrW = anc.localToWorld(wrLocal.clone());
    const wr0 = worldToWr(wrW, aspect || REF_ASPECT);
    let haftL = [-0.55, 0.12, -0.82];
    try {
      const anL = (kind === 'musketAds') ? GUN_ANCHORS.musket : GUN_ANCHORS.pistol;
      const muzW = anL.muzzle.clone().transformDirection(gun.matrixWorld).normalize();
      const inv = new T.Matrix4().copy(vc.matrixWorld);
      if (typeof inv.invert === 'function') inv.invert();
      const muzC = muzW.clone().transformDirection(inv).normalize();
      haftL = [muzC.x, muzC.y, muzC.z];
    } catch (_) {}
    const specL = {
      wr: wr0,
      pitch: 25, yaw: 35, elev: 44, lenFore: 0.18, minFore: 0.16,
      face: 'palmUnder',
      haft: haftL,
      curl: 1, rs: 0.88, sleeve: 'linen', hs: hs || 1.18
    };
    armL.visible = true;
    armL.traverse(function (o) { o.visible = true; });
    poseArm(armL, specL, aspect || REF_ASPECT, hs || 1.18, 'linen', { mode: 'cup', support: true });
    try { ensureSleeveEndCap(armL); } catch (_) {}
    // Hide the left arm's own baked hand — the cup lives on the gun.
    armL.traverse(function (o) {
      if (o.userData && (o.userData.fpHand1275 || o.userData.fpHand1276 || o.userData.fpPalmPlug1280 || o.userData.fpPistolCPlug1280)) {
        o.visible = false;
      }
    });
    // Slide the sleeve cuff to the cup wrist so the linen meets the cap.
    try {
      const pL = armL.userData && armL.userData.p;
      const cuff = pL && (pL.cuff || pL.roll || pL.sleeve);
      if (cuff && armL.parent) {
        armL.updateWorldMatrix(true, true);
        const have = cuff.getWorldPosition(new T.Vector3());
        const delta = wrW.clone().sub(have);
        const parent = armL.parent;
        parent.updateMatrixWorld(true);
        const w = armL.getWorldPosition(new T.Vector3()).add(delta);
        const inv = new T.Matrix4().copy(parent.matrixWorld);
        if (typeof inv.invert === 'function') inv.invert();
        else if (typeof inv.getInverse === 'function') inv.getInverse(parent.matrixWorld);
        armL.position.copy(w.applyMatrix4(inv));
        armL.updateWorldMatrix(true, true);
        U.leftDelta = [+delta.x.toFixed(3), +delta.y.toFixed(3), +delta.z.toFixed(3)];
      }
    } catch (e) {
      U.leftErr = String(e && e.stack || e).slice(0, 400);
      ERR('leftCup', e);
    }
    U.leftForestockWr = wr0.map(function (n) { return +(+n).toFixed(3); });
    U.leftTarget = [+wrW.x.toFixed(3), +wrW.y.toFixed(3), +wrW.z.toFixed(3)];
    try { console.log('leftCup', U.leftForestockWr, U.leftDelta, U.leftErr || 'ok'); } catch (_) {}
  }

  function restoreTrim(mesh) {
    if (!mesh || !mesh.geometry) return;
    const geo = mesh.geometry;
    if (geo.userData && geo.userData._idxOrig) {
      const src = geo.userData._idxOrig;
      const idx = (src instanceof Uint32Array || src instanceof Uint16Array) ? src.slice() : Array.from(src);
      geo.setIndex(idx);
    }
  }
  function restoreAllSleeveTrim() {
    [armR, armL].forEach(function (arm) {
      if (!arm || !arm.userData || !arm.userData.p) return;
      const q = arm.userData.p;
      restoreTrim(q.sleeve); restoreTrim(q.cuff); restoreTrim(q.roll); restoreTrim(q.roll2);
    });
  }
  function hideFacesNear(mesh, test, maxFrac) {
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    mesh.updateWorldMatrix(true, true);
    let idxArr;
    if (geo.index) {
      if (!geo.userData._idxOrig) geo.userData._idxOrig = geo.index.array.slice();
      idxArr = geo.userData._idxOrig;
    } else {
      const n = pos.count;
      if (!geo.userData._idxOrig) {
        const a = new Uint32Array(n);
        for (let i = 0; i < n; i++) a[i] = i;
        geo.userData._idxOrig = a;
      }
      idxArr = geo.userData._idxOrig;
    }
    const keep = [];
    const v = new T.Vector3();
    const nTri = Math.floor(idxArr.length / 3);
    for (let t = 0; t < nTri; t++) {
      const a = idxArr[t * 3], b = idxArr[t * 3 + 1], c = idxArr[t * 3 + 2];
      let close = false;
      [a, b, c].forEach(function (i) {
        if (close) return;
        v.fromBufferAttribute(pos, i);
        mesh.localToWorld(v);
        if (test(v)) close = true;
      });
      if (!close) keep.push(a, b, c);
    }
    const dropped = (nTri - keep.length / 3) / Math.max(1, nTri);
    if (maxFrac != null && dropped > maxFrac) return; // don't wipe the whole cuff
    if (keep.length < 3) return;
    geo.setIndex(keep);
    geo.computeBoundingSphere();
  }
  function pullCuffBack(arm, back) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const q = arm.userData.p;
    const len = (q.wrist && q.wrist.position) ? q.wrist.position.y : 0;
    const b = back || 0.032;
    if (q.cuff) q.cuff.position.y = len + CUFF_H * 0.25 - b;
    if (q.roll) q.roll.position.y = len - CUFF_H * 0.20 - b;
    if (q.roll2) q.roll2.position.y = len - CUFF_H * 0.65 - b;
  }
  function ensureDarkLining(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const mat = new T.MeshBasicMaterial({ color: 0x1c1510, side: T.BackSide, depthWrite: true });
    function line(mesh, name, inset) {
      if (!mesh) return;
      if (mesh.userData.fpLiningMesh) return mesh.userData.fpLiningMesh;
      const lining = new T.Mesh(mesh.geometry, mat);
      lining.name = name;
      lining.userData.fpLining1280 = 1;
      lining.userData.sculptKeep = 1;
      lining.frustumCulled = false;
      lining.renderOrder = (mesh.renderOrder || 4);
      lining.scale.set(inset, 1, inset);
      lining.visible = false;
      mesh.add(lining);
      mesh.userData.fpLiningMesh = lining;
      return lining;
    }
    line(p.sleeve, 'FpSleeveLining', 0.92);
    line(p.cuff, 'FpCuffLining', 0.88);
    if (p.roll) line(p.roll, 'FpRollLining', 0.88);
    if (p.roll2) line(p.roll2, 'FpRoll2Lining', 0.88);
  }
  function setLiningVisible(arm, on) {
    if (!arm) return;
    arm.traverse(function (o) {
      if (o.userData && o.userData.fpLining1280) o.visible = !!on;
    });
  }
  function tidyMusketButt(heldObj) {
    if (!heldObj) return;
    // 1282 FP musket is already a connected stock; do not sculpt the
    // hidden world mesh or add a box cap.
    let has1282 = false;
    heldObj.traverse(function (o) { if (o.name === 'FpMusket1282') has1282 = true; });
    if (has1282) return;
    heldObj.updateWorldMatrix(true, true);
    const c = new T.Vector3();
    heldObj.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      if (o.userData && o.userData.fpMusketButtCap1280) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      o.geometry.boundingBox.getCenter(c);
      o.localToWorld(c);
      heldObj.worldToLocal(c);
      // Game butt (wide drop, thin finial) and the oversized 1268 brass
      // plate sit past mid-stock. Hide them and finish with a clean cap.
      // Lock plate / guard stay (z ~ 0.11).
      if (c.z > 0.32) {
        o.visible = false;
        o.userData.fpButtHidden1280 = 1;
      }
    });
    let cap = heldObj.userData.fpButtCap1280;
    if (cap && cap.parent) cap.parent.remove(cap);
    heldObj.children.slice().forEach(function (ch) {
      if (ch.name === 'FpMusketButtCap1280') heldObj.remove(ch);
    });
    cap = new T.Group();
    cap.name = 'FpMusketButtCap1280';
    cap.userData.fpMusketButtCap1280 = 1;
    const woodM = new T.MeshPhongMaterial({ color: 0x6b4226, shininess: 22, specular: 0x3a2210 });
    // Connected hanging butt: a tapered drop along +Z, no brass.
    const wrist = new T.Mesh(new T.BoxGeometry(0.024, 0.032, 0.060), woodM);
    wrist.position.set(0, -0.018, 0.290);
    wrist.userData.fpMusketButtCap1280 = 1;
    cap.add(wrist);
    const drop = new T.Mesh(new T.BoxGeometry(0.026, 0.038, 0.055), woodM);
    drop.position.set(0, -0.040, 0.325);
    drop.userData.fpMusketButtCap1280 = 1;
    cap.add(drop);
    const heel = new T.Mesh(new T.BoxGeometry(0.024, 0.024, 0.028), woodM);
    heel.position.set(0, -0.058, 0.350);
    heel.userData.fpMusketButtCap1280 = 1;
    cap.add(heel);
    heldObj.add(cap);
    heldObj.userData.fpButtCap1280 = cap;
    cap.visible = true;
  }
  function restoreMusketButt() {
    const roots = [];
    try { if (typeof held !== 'undefined' && held) roots.push(held); } catch (_) {}
    for (let r = 0; r < roots.length; r++) {
      roots[r].traverse(function (o) {
        if (o.userData && o.userData.fpButtHidden1280) {
          o.visible = true;
          o.userData.fpButtHidden1280 = 0;
        }
        if (o.userData && o.userData.fpMusketButtCap1280 && o.name === 'FpMusketButtCap1280') {
          o.visible = false;
        }
      });
    }
  }
  function ensureSleeveEndCap(arm) {
    if (!arm || !arm.userData || !arm.userData.p || !arm.userData.p.sleeve) return;
    const p = arm.userData.p;
    let cap = p.sleeveEndCap;
    if (!cap || !cap.parent) cap = arm.getObjectByName('FpSleeveEndCap1283');
    if (!cap) {
      const src = p.sleeve.material || (p.cuff && p.cuff.material);
      const mat = src ? src.clone() : new T.MeshPhongMaterial({ color: 0xe8e2d6, shininess: 4 });
      mat.side = T.DoubleSide;
      cap = new T.Mesh(new T.CircleGeometry(1, 24), mat);
      cap.name = 'FpSleeveEndCap1283';
      cap.userData.fpSleeveEndCap1283 = 1;
      cap.userData.sculptKeep = 1;
      cap.rotation.x = Math.PI / 2; // faces back toward the shoulder
      cap.renderOrder = 7;
      p.sleeve.add(cap);
    }
    p.sleeveEndCap = cap;
    const rs = p.sleeve.scale.x || 1;
    cap.position.set(0, 0.002, 0);
    cap.scale.set(1.02, 1.02, 1); // local to the sleeve (already radius-scaled)
    cap.visible = true;
  }
  function ensureCuffCap(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    if (!p.sleeve || !p.cuff) return;
    let cap = p.cuffCap;
    if (!cap || !cap.parent) cap = arm.getObjectByName('FpCuffCap1281');
    if (!cap) {
      const src = p.cuff.material || p.sleeve.material;
      const mat = src ? src.clone() : new T.MeshPhongMaterial({ color: 0xe8e2d6, shininess: 4 });
      mat.side = T.DoubleSide;
      cap = new T.Mesh(new T.CircleGeometry(1, 28), mat);
      cap.name = 'FpCuffCap1281';
      cap.userData.fpCuffCap1281 = 1;
      cap.userData.sculptKeep = 1;
      cap.rotation.x = -Math.PI / 2;
      cap.renderOrder = 7;
      arm.add(cap);
    }
    p.cuffCap = cap;
    const len = p.sleeve.scale.y || 0.34;
    const rs = p.sleeve.scale.x || 1;
    cap.position.set(0, len - 0.001, 0);
    const rad = SLEEVE_R * 1.22 * rs;
    cap.scale.set(rad, rad, 1);
    cap.visible = true;
  }
  function hideCuffCaps() {
    function hide(arm) {
      if (!arm) return;
      arm.traverse(function (o) {
        if (o.name === 'FpCuffCap1281' || o.name === 'FpHiltPin1281') o.visible = false;
      });
    }
    hide(armR);
    hide(armL);
  }
  function trimSleeveNearGun(kind) {
    // Pull the rolled cuff back up the sleeve so it stays clear of the
    // grip/forestock. Do not hide hand or gun faces: the held item is
    // parented under the fist, so a traverse would shred the weapon.
    const back = (kind === 'musket' || kind === 'musketAds') ? 0.048 : 0.062;
    pullCuffBack(armR, back);
    if (kind === 'pistolAds' || kind === 'musketAds') pullCuffBack(armL, back);
    setLiningVisible(armR, false);
    setLiningVisible(armL, false);
    try { ensureCuffCap(armR); } catch (_) {}
    if (kind === 'pistolAds' || kind === 'musketAds') {
      try { ensureCuffCap(armL); } catch (_) {}
    }
    if (kind === 'musket' || kind === 'musketAds') {
      try { tidyMusketButt(typeof held !== 'undefined' ? held : null); } catch (_) {}
    }
  }

  function seatMusketInFist(heldObj) {
    if (!heldObj || !heldObj.parent) return;
    heldObj.updateWorldMatrix(true, true);
    // Measure the stock AABB in held-local units (not world metres).
    const lb = new T.Box3();
    let any = false;
    const tmp = new T.Vector3();
    heldObj.traverse(function (o) {
      if (!o.isMesh || o.visible === false || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
        tmp.set(i ? bb.max.x : bb.min.x, j ? bb.max.y : bb.min.y, k ? bb.max.z : bb.min.z);
        o.localToWorld(tmp);
        heldObj.worldToLocal(tmp);
        lb.expandByPoint(tmp);
        any = true;
      }
    });
    if (!any || lb.isEmpty()) return;
    const size = new T.Vector3(); lb.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!(maxDim > 0.08 && maxDim < 3.5)) {
      U.musketSeatSkip = { maxDim: maxDim };
      return;
    }
    let ax = 'z';
    if (size.x >= size.y && size.x >= size.z) ax = 'x';
    else if (size.y >= size.x && size.y >= size.z) ax = 'y';
    const minA = lb.min[ax], maxA = lb.max[ax];
    let lockL = null;
    heldObj.traverse(function (o) {
      if (o.name === 'FpMusketLock1268') lockL = heldObj.worldToLocal(o.getWorldPosition(new T.Vector3()));
    });
    const mid = new T.Vector3(); lb.getCenter(mid);
    const grip = mid.clone();
    if (lockL) {
      grip.copy(lockL);
      const toMax = Math.abs(maxA - lockL[ax]);
      const toMin = Math.abs(lockL[ax] - minA);
      const butt = (toMax > toMin) ? minA : maxA;
      grip[ax] += (butt - lockL[ax]) * 0.34;
    } else {
      const butt = (Math.abs(minA) < Math.abs(maxA)) ? minA : maxA;
      const muzzle = (butt === minA) ? maxA : minA;
      grip[ax] = butt + (muzzle - butt) * 0.22;
    }
    grip.y = Math.min(grip.y, lb.min.y + size.y * 0.42);
    if (grip.length() > 1.6) {
      U.musketSeatSkip = { gripLen: grip.length(), maxDim: maxDim };
      return;
    }
    seatHeldWorldPoint(heldObj, heldObj.localToWorld(grip.clone()));
    U.musketSeat = { maxDim: +maxDim.toFixed(3), ax: ax, grip: [+grip.x.toFixed(3), +grip.y.toFixed(3), +grip.z.toFixed(3)] };
  }
  function aimMusketHip(heldObj) {
    if (!heldObj || !heldObj.parent || !vc) return;
    heldObj.updateWorldMatrix(true, true);
    const lb = new T.Box3();
    let any = false;
    const tmp = new T.Vector3();
    heldObj.traverse(function (o) {
      if (!o.isMesh || o.visible === false || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
        tmp.set(i ? bb.max.x : bb.min.x, j ? bb.max.y : bb.min.y, k ? bb.max.z : bb.min.z);
        o.localToWorld(tmp);
        heldObj.worldToLocal(tmp);
        lb.expandByPoint(tmp);
        any = true;
      }
    });
    if (!any || lb.isEmpty()) return;
    const size = new T.Vector3(); lb.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!(maxDim > 0.08 && maxDim < 3.5)) {
      U.musketSeatSkip = { maxDim: maxDim };
      return;
    }
    let ax = 'z';
    if (size.x >= size.y && size.x >= size.z) ax = 'x';
    else if (size.y >= size.x && size.y >= size.z) ax = 'y';
    const minA = lb.min[ax], maxA = lb.max[ax];
    let lockL = null;
    heldObj.traverse(function (o) {
      if (o.name === 'FpMusketLock1268') lockL = heldObj.worldToLocal(o.getWorldPosition(new T.Vector3()));
    });
    const mid = new T.Vector3(); lb.getCenter(mid);
    const grip = mid.clone();
    let buttA, muzA;
    if (lockL) {
      grip.copy(lockL);
      const toMax = Math.abs(maxA - lockL[ax]);
      const toMin = Math.abs(lockL[ax] - minA);
      buttA = (toMax > toMin) ? minA : maxA;
      muzA = (buttA === minA) ? maxA : minA;
      // Wrist of the stock: a short way from the lock toward the butt.
      grip[ax] += (buttA - lockL[ax]) * 0.28;
    } else {
      buttA = (Math.abs(minA) < Math.abs(maxA)) ? minA : maxA;
      muzA = (buttA === minA) ? maxA : minA;
      grip[ax] = buttA + (muzA - buttA) * 0.22;
    }
    grip.y = Math.min(grip.y, lb.min.y + size.y * 0.42);
    if (grip.length() > 1.6) {
      U.musketSeatSkip = { gripLen: grip.length(), maxDim: maxDim };
      return;
    }
    const muzL = mid.clone(); muzL[ax] = muzA;
    const buttL = mid.clone(); buttL[ax] = buttA;
    const axisW = heldObj.localToWorld(muzL.clone()).sub(heldObj.localToWorld(buttL.clone()));
    if (axisW.lengthSq() < 1e-10) return;
    axisW.normalize();
    const wantMuz = new T.Vector3(-0.78, 0.22, -0.58).normalize();
    wantMuz.transformDirection(vc.matrixWorld).normalize();
    const qDelta = new T.Quaternion().setFromUnitVectors(axisW, wantMuz);
    const qHeld = heldObj.getWorldQuaternion(new T.Quaternion());
    const qNew = qDelta.multiply(qHeld);
    const qPar = heldObj.parent.getWorldQuaternion(new T.Quaternion());
    heldObj.quaternion.copy(qPar.invert().multiply(qNew));
    heldObj.updateWorldMatrix(true, true);
    const _u = new T.Vector3(0, 1, 0);
    try { vc.matrixWorld.extractBasis(new T.Vector3(), _u, new T.Vector3()); } catch (_) {}
    const camDown = _u.clone().multiplyScalar(-1);
    const downP = camDown.clone().addScaledVector(wantMuz, -camDown.dot(wantMuz));
    if (downP.lengthSq() > 1e-8) {
      downP.normalize();
      const stockDown = new T.Vector3(0, -1, 0).transformDirection(heldObj.matrixWorld).normalize();
      const ang = Math.atan2(new T.Vector3().copy(stockDown).cross(downP).dot(wantMuz), stockDown.dot(downP));
      const qRoll = new T.Quaternion().setFromAxisAngle(wantMuz, ang);
      const qH = heldObj.getWorldQuaternion(new T.Quaternion());
      const qN = qRoll.multiply(qH);
      const qP = heldObj.parent.getWorldQuaternion(new T.Quaternion());
      heldObj.quaternion.copy(qP.invert().multiply(qN));
      heldObj.updateWorldMatrix(true, true);
    }
    seatHeldWorldPoint(heldObj, heldObj.localToWorld(grip.clone()));
    U.musketSeat = { maxDim: +maxDim.toFixed(3), ax: ax, grip: [+grip.x.toFixed(3), +grip.y.toFixed(3), +grip.z.toFixed(3)] };
  }

  function placeSupportUnderForestock(arm, gun) {
    if (!arm || !gun || !arm.userData || !arm.userData.p) return;
    gun.updateWorldMatrix(true, true);
    // Underside of the pistol forestock, a little forward of the lock.
    const local = new T.Vector3(0, 0.002, -0.10);
    const target = gun.localToWorld(local.clone());
    const socket = arm.userData.p.grip || arm.userData.p.h;
    if (!socket) return;
    socket.updateWorldMatrix(true, true);
    const cupW = socket.getWorldPosition(new T.Vector3());
    const delta = target.sub(cupW);
    const parent = arm.parent;
    const newW = arm.getWorldPosition(new T.Vector3()).add(delta);
    if (parent) parent.worldToLocal(newW);
    arm.position.copy(newW);
  }
  function steelTex1282() {
    if (U._steelTex1282) return U._steelTex1282;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#5a636e';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      const x = (i / 90) * 256 + Math.sin(i * 2.1) * 2;
      g.strokeStyle = (i % 3 === 0) ? 'rgba(18,22,26,0.30)' : (i % 3 === 1 ? 'rgba(210,218,226,0.16)' : 'rgba(80,88,96,0.22)');
      g.lineWidth = 0.5 + (i % 4) * 0.25;
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y <= 256; y += 8) g.lineTo(x + Math.sin(y * 0.09 + i) * 1.1, y);
      g.stroke();
    }
    for (let i = 0; i < 10; i++) {
      g.strokeStyle = 'rgba(255,255,255,0.05)';
      g.lineWidth = 0.5;
      g.beginPath();
      g.moveTo(0, 18 + i * 24);
      g.lineTo(256, 14 + i * 24);
      g.stroke();
    }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(1, 3);
    U._steelTex1282 = t;
    return t;
  }
  function brassTex1282() {
    if (U._brassTex1282) return U._brassTex1282;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#b08a3c';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 24; i++) {
      g.strokeStyle = (i % 2) ? 'rgba(80,50,12,0.22)' : 'rgba(240,210,120,0.18)';
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo((i / 24) * 128, 0);
      g.lineTo((i / 24) * 128 + 4, 128);
      g.stroke();
    }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    U._brassTex1282 = t;
    return t;
  }
  function fpWoodMat1282() {
    if (U._fpWoodMat1282) return U._fpWoodMat1282;
    // MeshBasic: the studio SwiftShader drops unlit-less Phong on new
    // programs, which made the first 1282 guns invisible in captures.
    const m = new T.MeshBasicMaterial({
      color: 0x8a5a32,
      map: woodGrainTex1274(),
      side: T.DoubleSide
    });
    U._fpWoodMat1282 = m;
    return m;
  }
  function fpSteelMat1282() {
    if (U._fpSteelMat1282) return U._fpSteelMat1282;
    const m = new T.MeshBasicMaterial({
      color: 0x8a93a0,
      map: steelTex1282(),
      side: T.DoubleSide
    });
    U._fpSteelMat1282 = m;
    return m;
  }
  function fpBrassMat1282() {
    if (U._fpBrassMat1282) return U._fpBrassMat1282;
    const m = new T.MeshBasicMaterial({
      color: 0xc4a056,
      map: brassTex1282(),
      side: T.DoubleSide
    });
    U._fpBrassMat1282 = m;
    return m;
  }
  function fpFlintMat1282() {
    if (U._fpFlintMat1282) return U._fpFlintMat1282;
    U._fpFlintMat1282 = new T.MeshBasicMaterial({
      color: 0x2a2a32, side: T.DoubleSide
    });
    return U._fpFlintMat1282;
  }

  // Sword-hilt radius in gun-local units at held.scale = 1. Slightly under
  // the baker tunnel so the sword fist can close the knuckle row around it.
  const FP_HILT_R1282 = 0.0088;
  const FP_HILT_HALF1282 = 0.050;

  function bevelBoxGeo(sx, sy, sz, bev) {
    const b = Math.max(0.0004, Math.min(bev != null ? bev : Math.min(sx, sy, sz) * 0.22, Math.min(sx, sy, sz) * 0.35));
    const hw = Math.max(0.0004, sx * 0.5 - b);
    const hh = Math.max(0.0004, sy * 0.5 - b);
    const depth = Math.max(0.0008, sz - 2 * b);
    const sh = new T.Shape();
    sh.moveTo(-hw, -hh);
    sh.lineTo(hw, -hh);
    sh.lineTo(hw, hh);
    sh.lineTo(-hw, hh);
    sh.closePath();
    const geo = new T.ExtrudeGeometry(sh, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2
    });
    if (geo.computeBoundingBox) geo.computeBoundingBox();
    if (geo.boundingBox) {
      const c = geo.boundingBox.getCenter(new T.Vector3());
      geo.translate(-c.x, -c.y, -c.z);
    }
    if (geo.computeVertexNormals) geo.computeVertexNormals();
    return geo;
  }
  function applyLongGrainUV(geo, axis, repeatU, repeatV) {
    if (!geo || !geo.attributes || !geo.attributes.position) return;
    if (geo.computeBoundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (!bb) return;
    const pos = geo.attributes.position;
    const n = pos.count;
    const uv = new Float32Array(n * 2);
    const ax = (axis == null) ? 1 : axis;
    const a2 = (ax + 1) % 3, a3 = (ax + 2) % 3;
    const minA = bb.min.getComponent(ax), maxA = bb.max.getComponent(ax);
    const len = Math.max(1e-6, maxA - minA);
    const ru = (repeatU || 1), rv = (repeatV || 2.4);
    for (let i = 0; i < n; i++) {
      const v = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      const along = (v[ax] - minA) / len;
      // Planar wrap in the plane perpendicular to the long axis so a
      // narrow stock face still gets several grain lines, not one stripe.
      uv[i * 2] = (v[a2] * 36 + v[a3] * 36) * ru;
      uv[i * 2 + 1] = along * rv;
    }
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    geo.attributes.uv.needsUpdate = 1;
  }
  function tagFpGun1282(o) {
    o.userData = o.userData || {};
    o.userData.fpGun1282 = 1;
    o.userData.sculptKeep = 1;
    o.castShadow = false;
    o.frustumCulled = false;
    return o;
  }
  function addFpPart(parent, geo, mat, x, y, z, rx, ry, rz) {
    const m = new T.Mesh(geo, mat);
    tagFpGun1282(m);
    m.position.set(x || 0, y || 0, z || 0);
    if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
    parent.add(m);
    return m;
  }
  function hideWorldGunMeshes1282(root) {
    if (!root) return;
    root.traverse(function (o) {
      if (o.userData && o.userData.fpGun1282) return;
      if (o.userData && (o.userData.fpFlint1265 || o.userData.fpFlint1266 || o.userData.fpMusketLock1268 || o.userData.fpHook1264)) {
        o.visible = false;
        return;
      }
      if (!o.isMesh) return;
      o.visible = false;
      o.userData = o.userData || {};
      o.userData.fpWorldHidden1282 = 1;
    });
  }
  function restoreWorldGuns1282() {
    if (typeof held === 'undefined' || !held) return;
    held.traverse(function (o) {
      if (o.userData && o.userData.fpGun1282) o.visible = false;
      if (o.userData && o.userData.fpWorldHidden1282) o.visible = true;
    });
  }
  function addForestockAnchor(g, x, y, z) {
    let anc = g.getObjectByName('FpForestockAnchor1282');
    if (!anc) {
      anc = new T.Group();
      anc.name = 'FpForestockAnchor1282';
      tagFpGun1282(anc);
      g.add(anc);
    }
    anc.position.set(x, y, z);
    anc.rotation.set(0, 0, 0);
    anc.visible = true;
    g.userData.forestockAnchor = anc;
    return anc;
  }
  function findNamed1282(root, name) {
    if (!root) return null;
    if (root.name === name) return root;
    if (root.userData && name === 'FpForestockAnchor1282' && root.userData.forestockAnchor) {
      return root.userData.forestockAnchor;
    }
    let found = null;
    root.traverse(function (o) { if (!found && o.name === name) found = o; });
    return found;
  }
  function hideForestockCup(gun) {
    if (!gun) return;
    gun.traverse(function (o) {
      if (o.name === 'FpForestockCup1282') o.visible = false;
    });
  }
  function ensureForestockCup(gun) {
    if (!gun) return null;
    const anc = findNamed1282(gun, 'FpForestockAnchor1282');
    if (!anc) return null;
    const B = W.__fpHandsBaked1276;
    if (!B || typeof B.makeMesh !== 'function') return null;
    // Strip duplicate cups from earlier ticks (getObjectByName is missing
    // on some THREE builds, so a new group was parented every applyPose).
    const extras = [];
    gun.traverse(function (o) { if (o.name === 'FpForestockCup1282') extras.push(o); });
    let grp = extras.length ? extras[0] : null;
    for (let i = 1; i < extras.length; i++) {
      if (extras[i].parent) extras[i].parent.remove(extras[i]);
    }
    if (!grp) {
      grp = new T.Group();
      grp.name = 'FpForestockCup1282';
      tagFpGun1282(grp);
      const mat = fpSkinMat1276();
      const mesh = B.makeMesh('cup', mat, T, 1);
      mesh.scale.set(BAKE_HAND_SCALE, BAKE_HAND_SCALE, BAKE_HAND_SCALE);
      mesh.renderOrder = 8;
      try { clampWristStump(mesh); } catch (_) {}
      tagFpGun1282(mesh);
      // Baker: +Y fingers, +Z dorsum, palm = -Z.
      // Palm up into the forestock (anchor +Y), fingers toward the muzzle
      // (anchor -Z), dorsum hanging down (anchor -Y).
      // Right-handed basis: fingers along the muzzle (anchor -Z),
      // palm normal up into the forestock (anchor +Y), dorsum down.
      // Using -X for hand +X keeps the basis proper so the palm does
      // not flip to face the camera.
      mesh.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(
        new T.Vector3(-1, 0, 0),
        new T.Vector3(0, 0, -1),
        new T.Vector3(0, -1, 0)
      ));
      mesh.position.set(0, -0.026, 0.006);
      grp.add(mesh);
      // Short linen cuff at the cup wrist (opposite the fingers: +Z).
      let lmat = null;
      try { lmat = fpLinen(); } catch (_) {}
      if (!lmat) lmat = new T.MeshPhongMaterial({ color: 0xe8e2d6, shininess: 4, side: T.DoubleSide });
      else { lmat = lmat.clone(); lmat.side = T.DoubleSide; }
      const cuff = new T.Mesh(new T.CylinderGeometry(0.028, 0.032, 0.046, 16, 1, true), lmat);
      tagFpGun1282(cuff);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, -0.030, 0.048);
      cuff.renderOrder = 7;
      grp.add(cuff);
      const cap = new T.Mesh(new T.CircleGeometry(0.032, 20), lmat);
      tagFpGun1282(cap);
      cap.position.set(0, -0.030, 0.070);
      cap.renderOrder = 7;
      grp.add(cap);
      anc.add(grp);
    }
    grp.visible = true;
    return grp;
  }

  function buildFpPistol1282() {
    const g = new T.Group();
    g.name = 'FpPistol1282';
    tagFpGun1282(g);
    g.userData.fpFlint1265 = 1;
    g.userData.fpFlint1266 = 1;
    const wood = fpWoodMat1282();
    const steel = fpSteelMat1282();
    const brass = fpBrassMat1282();
    const flint = fpFlintMat1282();
    const r = FP_HILT_R1282;

    // Hilt-diameter wrist through the fist, along +Y (lock) / -Y (pommel).
    addFpPart(g, new T.CylinderGeometry(r, r, FP_HILT_HALF1282 * 2, 16), wood, 0, 0, 0);

    // Bird's-head pommel starts only below the fingers so the knuckle
    // row can close around the hilt cylinder, then hooks slightly +Z.
    if (typeof T.LatheGeometry === 'function') {
      const pts = [
        new T.Vector2(r, -0.056),
        new T.Vector2(r * 1.05, -0.062),
        new T.Vector2(0.013, -0.068),
        new T.Vector2(0.012, -0.080),
        new T.Vector2(0.007, -0.088),
        new T.Vector2(0.001, -0.092)
      ];
      addFpPart(g, new T.LatheGeometry(pts, 16), wood, 0, 0, 0.002);
    } else {
      addFpPart(g, new T.SphereGeometry(0.013, 12, 10), wood, 0, -0.076, 0.008);
    }
    addFpPart(g, new T.SphereGeometry(0.009, 10, 8), wood, 0, -0.082, 0.016);
    addFpPart(g, new T.CylinderGeometry(0.006, 0.009, 0.018, 10), wood, 0, -0.076, 0.022, 1.05, 0, 0);

    // Wood tang and barrel sit clearly ABOVE the fist so the knuckle
    // row can close around the hilt the way it does on the sword.
    const barrelY = 0.078;
    addFpPart(g, new T.CylinderGeometry(0.011, r, 0.028, 12), wood, 0, 0.062, 0.002, 0.12, 0, 0);
    const barrelLen = 0.28;
    const breechZ = 0.008;
    const muzZ = breechZ - barrelLen;
    const bar = addFpPart(g, new T.CylinderGeometry(0.0078, 0.0115, barrelLen, 8), steel, 0, barrelY, breechZ - barrelLen / 2);
    bar.rotation.x = Math.PI / 2;
    addFpPart(g, new T.CylinderGeometry(0.0090, 0.0090, 0.016, 12), steel, 0, barrelY, muzZ - 0.004).rotation.x = Math.PI / 2;
    addFpPart(g, new T.CylinderGeometry(0.014, 0.014, 0.028, 8), steel, 0, barrelY, 0.016).rotation.x = Math.PI / 2;
    addFpPart(g, bevelBoxGeo(0.004, 0.006, 0.016, 0.0006), steel, 0, barrelY + 0.014, -0.04);
    addFpPart(g, bevelBoxGeo(0.0024, 0.008, 0.0024, 0.0004), steel, 0, barrelY + 0.012, muzZ + 0.01);

    // Forestock hugging the barrel underside, clear of the fist.
    const fore = addFpPart(g, new T.CylinderGeometry(0.011, 0.008, 0.15, 12), wood, 0, barrelY - 0.014, -0.080);
    fore.rotation.x = Math.PI / 2;
    addFpPart(g, bevelBoxGeo(0.016, 0.010, 0.040, 0.0014), wood, 0, barrelY - 0.016, -0.010);

    // Lock plate, cocked hammer, flint, frizzen on +X, all above the fist.
    addFpPart(g, bevelBoxGeo(0.004, 0.024, 0.040), steel, 0.016, 0.074, -0.004);
    addFpPart(g, bevelBoxGeo(0.0045, 0.022, 0.010), steel, 0.020, 0.090, -0.016, 0.70, 0, 0);
    addFpPart(g, bevelBoxGeo(0.0036, 0.009, 0.012, 0.0006), flint, 0.022, 0.104, -0.020, 0.55, 0, 0);
    addFpPart(g, bevelBoxGeo(0.0036, 0.018, 0.010), brass, 0.019, 0.084, 0.010, -0.45, 0, 0);
    addFpPart(g, bevelBoxGeo(0.008, 0.006, 0.012), brass, 0.014, 0.068, 0.012); // pan

    // Trigger and guard under the lock, toward the muzzle, clear of the knuckles.
    if (typeof T.TorusGeometry === 'function') {
      addFpPart(g, new T.TorusGeometry(0.012, 0.0020, 8, 20, Math.PI * 1.15), steel, 0, 0.058, 0.000, Math.PI / 2, 0, 0);
    }
    addFpPart(g, bevelBoxGeo(0.0030, 0.012, 0.005, 0.0005), steel, 0, 0.062, 0.010, 0.20, 0, 0);

    // Small brass cap on the pommel (joined, not a floating ball).
    addFpPart(g, new T.SphereGeometry(0.0048, 8, 6), brass, 0, -0.090, 0.006);

    addForestockAnchor(g, 0, barrelY - 0.030, -0.120);
    return g;
  }

  function buildFpMusket1282() {
    const g = new T.Group();
    g.name = 'FpMusket1282';
    tagFpGun1282(g);
    const wood = fpWoodMat1282();
    const steel = fpSteelMat1282();
    const brass = fpBrassMat1282();
    const flint = fpFlintMat1282();
    const r = FP_HILT_R1282;

    // Same hilt-diameter wrist as the pistol / sword, along +Y.
    addFpPart(g, new T.CylinderGeometry(r, r, FP_HILT_HALF1282 * 2, 16), wood, 0, 0, 0);

    // One-piece hanging butt in the YZ plane: down the grip (-Y) with a
    // short comb in +Z. Kept shallow toward the camera so it will not
    // read as a close-up sail.
    const stockSh = new T.Shape();
    stockSh.moveTo(0.000, -0.050);
    stockSh.lineTo(0.010, -0.050);
    stockSh.bezierCurveTo(0.015, -0.055, 0.016, -0.075, 0.016, -0.095);
    stockSh.bezierCurveTo(0.016, -0.115, 0.013, -0.128, 0.008, -0.136);
    stockSh.lineTo(0.000, -0.138);
    stockSh.bezierCurveTo(-0.003, -0.120, -0.003, -0.075, 0.000, -0.050);
    stockSh.closePath();
    const stockGeo = new T.ExtrudeGeometry(stockSh, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.0024,
      bevelSize: 0.0020,
      bevelSegments: 3,
      curveSegments: 20
    });
    stockGeo.translate(0, 0, -0.009);
    stockGeo.rotateY(-Math.PI / 2);
    if (stockGeo.computeVertexNormals) stockGeo.computeVertexNormals();
    if (stockGeo.computeBoundingBox) stockGeo.computeBoundingBox();
    if (stockGeo.computeBoundingSphere) stockGeo.computeBoundingSphere();
    applyLongGrainUV(stockGeo, 1, 1, 2.6);
    addFpPart(g, stockGeo, wood, 0, 0, 0);
    addFpPart(g, bevelBoxGeo(0.018, 0.024, 0.004, 0.0006), steel, 0, -0.134, 0.008, 0.12, 0, 0);

    // Lock tang and barrel.
    addFpPart(g, new T.CylinderGeometry(0.014, r, 0.036, 12), wood, 0, 0.050, 0.002, 0.12, 0, 0);
    const barrelLen = 0.62;
    const barrelY = 0.058;
    const breechZ = 0.020;
    const muzZ = breechZ - barrelLen;
    const bar = addFpPart(g, new T.CylinderGeometry(0.0070, 0.0105, barrelLen, 8), steel, 0, barrelY, breechZ - barrelLen / 2);
    bar.rotation.x = Math.PI / 2;
    addFpPart(g, new T.CylinderGeometry(0.0085, 0.0085, 0.018, 12), steel, 0, barrelY, muzZ - 0.004).rotation.x = Math.PI / 2;
    addFpPart(g, new T.CylinderGeometry(0.014, 0.014, 0.036, 8), steel, 0, barrelY, 0.028).rotation.x = Math.PI / 2;
    addFpPart(g, bevelBoxGeo(0.0036, 0.006, 0.014, 0.0005), steel, 0, barrelY + 0.012, -0.06);
    addFpPart(g, bevelBoxGeo(0.0022, 0.007, 0.0022, 0.0003), steel, 0, barrelY + 0.011, muzZ + 0.012);

    // Forestock under the barrel, one connected wood piece.
    const fore = addFpPart(g, new T.CylinderGeometry(0.012, 0.008, 0.42, 12), wood, 0, barrelY - 0.014, -0.200);
    fore.rotation.x = Math.PI / 2;
    addFpPart(g, bevelBoxGeo(0.018, 0.012, 0.080, 0.0016), wood, 0, barrelY - 0.016, 0.000);
    // Barrel bands.
    addFpPart(g, new T.CylinderGeometry(0.013, 0.013, 0.010, 12), brass, 0, barrelY - 0.006, -0.12).rotation.x = Math.PI / 2;
    addFpPart(g, new T.CylinderGeometry(0.011, 0.011, 0.010, 12), brass, 0, barrelY - 0.008, -0.28).rotation.x = Math.PI / 2;
    // Ramrod under the forestock.
    addFpPart(g, new T.CylinderGeometry(0.0024, 0.0024, 0.36, 8), steel, 0, barrelY - 0.026, -0.20).rotation.x = Math.PI / 2;

    // Lock, hammer, flint, frizzen, pan.
    addFpPart(g, bevelBoxGeo(0.004, 0.028, 0.052), steel, 0.017, 0.050, 0.006);
    addFpPart(g, bevelBoxGeo(0.0045, 0.026, 0.010), steel, 0.021, 0.068, -0.006, 0.70, 0, 0);
    addFpPart(g, bevelBoxGeo(0.0036, 0.010, 0.012, 0.0006), flint, 0.023, 0.082, -0.010, 0.55, 0, 0);
    addFpPart(g, bevelBoxGeo(0.0036, 0.022, 0.010), brass, 0.020, 0.060, 0.022, -0.45, 0, 0);
    addFpPart(g, bevelBoxGeo(0.008, 0.006, 0.012), brass, 0.015, 0.042, 0.024);

    if (typeof T.TorusGeometry === 'function') {
      addFpPart(g, new T.TorusGeometry(0.014, 0.0020, 8, 20, Math.PI * 1.15), steel, 0, 0.028, 0.024, Math.PI / 2, 0, 0);
    }
    addFpPart(g, bevelBoxGeo(0.0030, 0.016, 0.005, 0.0005), steel, 0, 0.032, 0.034, 0.20, 0, 0);

    addForestockAnchor(g, 0, barrelY - 0.032, -0.200);
    return g;
  }

  function attachFpGun1282(kind) {
    if (typeof held === 'undefined' || !held) return null;
    const isPistol = (kind === 'pistol' || kind === 'pistolAds');
    const want = isPistol ? 'FpPistol1282' : 'FpMusket1282';
    let g = null;
    held.traverse(function (o) { if (!g && o.name === want) g = o; });
    hideWorldGunMeshes1282(held);
    // Hide the older procedural flintlock / furniture if it is still on the tree.
    held.traverse(function (o) {
      if (o.name === 'FpFlintlock1265' || o.name === 'FpPistolCPlug1280') {
        o.visible = false;
        if (o.parent && o.name === 'FpFlintlock1265') o.parent.remove(o);
      }
    });
    if (g && g.parent) {
      g.visible = true;
      g.traverse(function (o) { if (o.userData && o.userData.fpGun1282) o.visible = (o.name !== 'FpForestockCup1282' ? true : o.visible); });
      // Keep the cup hidden until ADS attaches it.
      hideForestockCup(g);
      return g;
    }
    g = isPistol ? buildFpPistol1282() : buildFpMusket1282();
    held.add(g);
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
    hideForestockCup(g);
    return g;
  }

    function dressPistolFlintlock() {
    // 1282: purpose-made FP flintlock. World / TP pistol meshes are only
    // hidden, never mutated. The wrist through the sword fist is a
    // hilt-diameter cylinder; lock, guard and bird's-head sit outside.
    try { attachFpGun1282('pistol'); } catch (e) { ERR('fpPistol1282', e); }
  }

  function dressMusketFlintlock() {
    // 1282: purpose-made FP musket. Do not tint or sculpt the world /
    // TP musket; hide it and attach a connected curved-stock model
    // designed around the same sword-fist wrist as the pistol.
    try { attachFpGun1282('musket'); } catch (e) { ERR('fpMusket1282', e); }
  }

  function revealHeldItem(root) {
    if (!root) return;
    root.visible = true;
    const gun = root.children && root.children[0];
    const rig = gun && gun.userData && gun.userData.rig;
    const swapped = !!(gun && gun.userData && (gun.userData.c322 || rig));
    root.traverse(function (o) {
      if (o.name === 'FpForestockCup1282') return;
      if (o.userData && o.userData.fpGun1282) {
        if (o.isMesh || o.type === 'Group') o.visible = true;
        return;
      }
      if (o.userData && o.userData.fpWorldHidden1282) { o.visible = false; return; }
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
    if (k0 === 'empty') return { mode: 'open' };
    if (k0 === 'block') return { mode: 'cup' };
    if (k0 === 'map') return { mode: 'hold' };
    if (key === 'pistol' || key === 'pistolAds') return { mode: 'fist', trigger: true };
    if (key === 'musket' || key === 'musketAds') return { mode: 'fist' };
    return { mode: 'fist' };
  }

  // 1272 hybrid (fpHybrid1272): the baked-fist / 1282 FP-gun rig is off
  // for every item in 1.2.56. First-person arms, animations (switch,
  // reload, swing, aim) and grip positions use the 1.2.49 __fpa path,
  // including pistol and musket with their original gun models. Keys
  // stay listed at 0 so a later allowlist can be restored item by item.
  // Toggle is still synchronous in applyPose so a switch never presents
  // both rigs, leftover TP meshes, or a hidden 1.2.49 item.
  const NEW_FP_KINDS = {
    empty: 0, p761: 0, p760: 0, pick: 0,
    sword: 0, claymore: 0,
    torch: 0, block: 0, bucket: 0, map: 0,
    pistol: 0, musket: 0
  };
  function usesNewFp(kind) {
    return !!NEW_FP_KINDS[kind || ''];
  }
  U.usesNewFp = usesNewFp;
  U.newFpKinds = NEW_FP_KINDS;

  function dropNewRig() {
    U.active = 0;
    U.fallback1249 = 1;
    try { restoreHeld(); } catch (_) {}
    try { hideLegacy(false); } catch (_) {}
    if (rig) rig.visible = false;
    try { if (W.__fpTpArm1270 && typeof W.__fpTpArm1270.hideAll === 'function') W.__fpTpArm1270.hideAll(); } catch (_) {}
    // Unhide any world / __vm gun meshes hideStrayGuns tucked away while
    // the new rig was active, so musket/pistol ADS can draw again.
    try {
      const roots = [];
      try { if (typeof scene !== 'undefined' && scene) roots.push(scene); } catch (_) {}
      try { if (typeof camera !== 'undefined' && camera) roots.push(camera); } catch (_) {}
      try {
        const vm = W.__vm;
        if (vm) { if (vm.vs) roots.push(vm.vs); if (vm.grp) roots.push(vm.grp); if (vm.root) roots.push(vm.root); }
      } catch (_) {}
      for (let i = 0; i < roots.length; i++) {
        const root = roots[i];
        if (!root || !root.traverse) continue;
        root.traverse(function (o) {
          if (!o.isMesh || !o.userData || !o.userData.__hidBy1259) return;
          o.visible = o.userData.__visBefore1259 !== false;
          delete o.userData.__hidBy1259;
          delete o.userData.__visBefore1259;
        });
      }
    } catch (_) {}
    // Put the 1.2.49 held pose and procedural arms back now that we
    // have released `held` and un-hidden the legacy rig. Without this,
    // restoreHeld zeroes the item transform and the gun floats.
    try {
      const H = W.__held1240;
      if (H && typeof H.poseHeld === 'function' && typeof worldModel !== 'undefined' && worldModel)
        H.poseHeld(worldModel);
    } catch (_) {}
    try {
      const A = W.__armSwitch1247;
      if (A && typeof A.syncFromFpa === 'function') A.syncFromFpa(0.016);
    } catch (_) {}
  }

  function applyPose() {
    if (U.disabled || isTp()) {
      U.active = 0;
      restoreHeld();
      hideLegacy(false);
      if (rig) rig.visible = false;
      try { if (W.__fpTpArm1270 && W.__fpTpArm1270.hideAll) W.__fpTpArm1270.hideAll(); } catch (_) {}
      return;
    }
    if (!build()) { U.active = 0; return; }
    try { restoreAllSleeveTrim(); } catch (_) {}
    try { restoreGunSlim(); } catch (_) {}
    try { restorePistolHook(); } catch (_) {}
    try { restoreMusketButt(); } catch (_) {}
    try { setLiningVisible(armR, false); setLiningVisible(armL, false); } catch (_) {}
    try { hideCuffCaps(); } catch (_) {}
    const k0 = kindOf();
    const ads = isAds();
    if (!usesNewFp(k0)) {
      U.kind = k0;
      U.ads = ads ? 1 : 0;
      U.poseKey = k0;
      // Only tear down the new rig on the transition off an allowlisted
      // item. Re-running restoreHeld/poseHeld every fallback frame fought
      // the 1.2.49 musket ADS viewmodel and left the item off-screen.
      if (U.active || !U.fallback1249) dropNewRig();
      else {
        U.active = 0;
        U.fallback1249 = 1;
        if (rig) rig.visible = false;
        try { if (W.__fpTpArm1270 && W.__fpTpArm1270.hideAll) W.__fpTpArm1270.hideAll(); } catch (_) {}
      }
      return;
    }
    U.fallback1249 = 0;
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
      const curlL = { mode: 'cup', support: true };
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
    try { if (W.__fpTpArm1270 && W.__fpTpArm1270.sync) W.__fpTpArm1270.sync(); } catch (_) {}
    // Re-aim the hip flintlock now that vc and the grip parent are final.
    // aimFlintlockSide during poseItem ran against a stale camera matrix.
    try {
      if (typeof held !== 'undefined' && held) {
        const pk = U.poseKey;
        if (pk === 'pistol' || pk === 'pistolAds' || pk === 'musket' || pk === 'musketAds') {
          vc.updateMatrixWorld(true);
          seatGunOnFist(pk);
          if (pk === 'pistolAds' || pk === 'musketAds') {
            const aspect = (worldCam && worldCam.aspect) || REF_ASPECT;
            const hs = (U.POSES[pk] && U.POSES[pk].hs) || 1.04;
            poseLeftOnForestock(pk, aspect, hs);
          }
          trimSleeveNearGun(pk);
          try { if (W.__fpTpArm1270 && W.__fpTpArm1270.sync) W.__fpTpArm1270.sync(); } catch (_) {}
        }

      }
    } catch (e) { ERR('gunOverlay', e); try { console.log('gunOverlay', e); } catch (_) {} }
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
        if (looksLikeGun(o)) {
          // Record and restore in dropNewRig so a later fallback gun
          // (especially the 1.2.49 __vm ADS pass) is not left hidden.
          if (!o.userData) o.userData = {};
          if (!o.userData.__hidBy1259) {
            o.userData.__hidBy1259 = 1;
            o.userData.__visBefore1259 = o.visible !== false;
          }
          o.visible = false;
        }
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

  function dumpHandState() {
    function detOf(mx) {
      const e = mx.elements;
      return e[0] * (e[5] * e[10] - e[9] * e[6]) - e[4] * (e[1] * e[10] - e[9] * e[2]) + e[8] * (e[1] * e[6] - e[5] * e[2]);
    }
    function worldScale(o) {
      const sx = new T.Vector3();
      o.matrixWorld.decompose(new T.Vector3(), new T.Quaternion(), sx);
      return [+sx.x.toFixed(4), +sx.y.toFixed(4), +sx.z.toFixed(4)];
    }
    function matInfo(mat) {
      if (!mat) return null;
      const map = mat.map;
      let mapInfo = null;
      if (map) {
        const img = map.image;
        mapInfo = {
          uuid: map.uuid,
          flipY: map.flipY,
          fmt: map.format,
          w: img && img.width,
          h: img && img.height,
          ready: !!(img && (img.width || img.complete))
        };
      }
      return {
        uuid: mat.uuid,
        type: mat.type,
        color: (mat.color && mat.color.getHexString) ? mat.color.getHexString() : null,
        map: mapInfo,
        vertexColors: mat.vertexColors,
        side: mat.side,
        transparent: !!mat.transparent,
        opacity: mat.opacity,
        depthTest: mat.depthTest !== false,
        depthWrite: mat.depthWrite !== false,
        wireframe: !!mat.wireframe,
        skinning: !!mat.skinning,
        morphTargets: !!mat.morphTargets,
        name: mat.name || null
      };
    }
    function meshInfo(o) {
      const g = o.geometry;
      const attr = g && g.attributes;
      o.updateWorldMatrix(true, false);
      return {
        name: o.name || o.type,
        vis: o.visible !== false,
        ro: o.renderOrder,
        fc: !!o.frustumCulled,
        geo: g && g.uuid,
        geoType: g && g.type,
        v: attr && attr.position && attr.position.count,
        uv: !!(attr && attr.uv),
        color: !!(attr && attr.color),
        morph: !!(g && g.morphAttributes && g.morphAttributes.position && g.morphAttributes.position.length),
        mat: matInfo(Array.isArray(o.material) ? o.material[0] : o.material),
        scl: o.scale.toArray().map(function (n) { return +n.toFixed(4); }),
        ws: worldScale(o),
        det: +detOf(o.matrixWorld).toFixed(6),
        parent: (o.parent && (o.parent.name || o.parent.type)) || null
      };
    }
    function walk(root, tag) {
      if (!root) return { tag: tag, missing: 1 };
      root.updateWorldMatrix(true, true);
      const meshes = [];
      root.traverse(function (o) { if (o.isMesh) meshes.push(meshInfo(o)); });
      const kids = (root.children || []).map(function (c) {
        return {
          name: c.name || c.type,
          vis: c.visible !== false,
          scl: c.scale.toArray().map(function (n) { return +n.toFixed(4); }),
          ws: worldScale(c)
        };
      });
      const chain = [];
      for (let n = root; n && chain.length < 8; n = n.parent) {
        n.updateWorldMatrix(true, false);
        chain.push({
          name: n.name || n.type,
          loc: n.scale.toArray().map(function (x) { return +x.toFixed(4); }),
          ws: worldScale(n),
          det: +detOf(n.matrixWorld).toFixed(6)
        });
      }
      return { tag: tag, kids: kids, meshes: meshes, chain: chain };
    }
    const out = {};
    if (armR && armR.userData && armR.userData.p) out.R = walk(armR.userData.p.h, 'R');
    if (armL && armL.userData && armL.userData.p) {
      out.L = walk(armL.userData.p.h, 'L');
      out.Lvis = !!armL.visible;
    }
    try {
      if (typeof hand !== 'undefined' && hand) {
        let nVis = 0;
        hand.traverse(function (o) { if (o.isMesh && o.visible !== false) nVis++; });
        out.legacy = { vis: !!hand.visible, name: hand.name || 'hand', parent: (hand.parent && hand.parent.name) || null, nVis: nVis };
      }
    } catch (_) {}
    return out;
  }

  U.probe = function () {
    const out = { active: !!U.active, kind: U.kind, ads: U.ads, poseKey: U.poseKey, err: U.err, fallback1249: !!U.fallback1249, usesNewFp: usesNewFp(U.kind), fpHybrid1272: 1,
      leftRan: U.leftRan || 0, leftKind: U.leftKind || null, leftSkip: U.leftSkip || null, leftCupErr: U.leftCupErr || null,
      leftForestockWr: U.leftForestockWr || null, leftDelta: U.leftDelta || null, leftErr: U.leftErr || null, leftTarget: U.leftTarget || null,
      gunSeated: U.gunSeated || null, hookErr: U.hookErr || null, pinDiag: U.pinDiag || null };
    try { if (U.pickContact) out.pickContact = U.pickContact; } catch (_) {}
    try { if (U.pickDump) out.pickDump = U.pickDump; } catch (_) {}
    try {
      if (W.__heldFrame1251) out.frameAds = W.__heldFrame1251.ads ? 1 : 0;
    } catch (_) {}
    try {
      const vm = W.__vm;
      if (vm) out.vmOn = vm.on ? 1 : 0;
    } catch (_) {}
    try {
      const g = (typeof held !== 'undefined' && held && held.children && held.children[0]) || null;
      const id = (typeof selId !== 'undefined') ? selId : null;
      let cntV = null;
      try { if (typeof cnt === 'function') cntV = cnt(id); } catch (_) {}
      let fpName = null, fpKids = 0, fpVis = 0, fpMats = [];
      try {
        if (typeof held !== 'undefined' && held) {
          held.traverse(function (o) {
            if (o.name === 'FpPistol1282' || o.name === 'FpMusket1282') {
              fpName = o.name;
              o.traverse(function (c) {
                if (!c.isMesh) return;
                fpKids++;
                if (c.visible) fpVis++;
                const mt = (c.material && c.material.type) || '?';
                if (fpMats.indexOf(mt) < 0) fpMats.push(mt);
              });
            }
          });
        }
      } catch (_) {}
      out.fpGun1282 = { name: fpName, kids: fpKids, vis: fpVis, mats: fpMats };
      out.gunDiag = {
        selId: id,
        hasChild: !!g,
        gunUd: g && g.userData && g.userData.gun,
        gunTable: !!(typeof GUN !== 'undefined' && id != null && GUN[id]),
        cnt: cntV,
        handVis: (typeof hand !== 'undefined' && hand) ? !!hand.visible : null,
        c340: W.__c340 ? +W.__c340.k : null,
        adsK: (typeof S !== 'undefined' && S) ? S.adsK : null,
        c145: !!(W.__c145 && (W.__c145.force || W.__c145.hold)),
        c288: !!(W.__c288 && W.__c288.aiming)
      };
    } catch (_) {}
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
      try { out.handDump = dumpHandState(); } catch (eH) { out.handDumpErr = String(eH && eH.message || eH); }
      out.fov = FP_FOV;
    } catch (e) { out.probeErr = String(e && e.message || e); }
    return out;
  };

  function scorePose() {
    const out = { ok: 0, score: -1e9 };
    try {
      if (!armR || !vc) return out;
      armR.updateWorldMatrix(true, true);
      if (typeof held !== 'undefined' && held) held.updateWorldMatrix(true, true);
      const p = armR.userData && armR.userData.p;
      if (!p || !p.h) return out;
      const camToward = new T.Vector3(0, 0, 1);
      try { camToward.set(0, 0, 1).transformDirection(vc.matrixWorld).normalize(); } catch (_) {}
      const hx = new T.Vector3(), hy = new T.Vector3(), hz = new T.Vector3();
      p.h.matrixWorld.extractBasis(hx, hy, hz);
      if (hx.lengthSq() > 1e-8) hx.normalize();
      if (hy.lengthSq() > 1e-8) hy.normalize();
      if (hz.lengthSq() > 1e-8) hz.normalize();
      const dorsumDot = hz.dot(camToward);
      const palmDot = hz.clone().multiplyScalar(-1).dot(camToward);
      const palm = (U.poseKey === 'empty' || U.poseKey === 'block' || U.poseKey === 'map');
      const faceDot = palm ? palmDot : dorsumDot;
      // Sleeve axis sh→wr in world, vs view-to-wrist (looking down the cuff).
      const wrW = p.wrist.getWorldPosition(new T.Vector3());
      const shW = armR.getWorldPosition(new T.Vector3());
      const sleeveDir = wrW.clone().sub(shW);
      const sleeveLen = sleeveDir.length() || 1;
      sleeveDir.multiplyScalar(1 / sleeveLen);
      const viewToWr = wrW.clone();
      try { viewToWr.sub(vc.getWorldPosition(new T.Vector3())); } catch (_) { viewToWr.set(0, 0, -1); }
      if (viewToWr.lengthSq() > 1e-8) viewToWr.normalize();
      const lookDown = Math.abs(sleeveDir.dot(viewToWr));
      const towardAmt = sleeveDir.dot(camToward);
      // Knuckles: dorsum-side, mid-finger verts of the visible baked hand.
      let fist = null;
      p.h.traverse(function (o) {
        if (o.isMesh && o.visible && o.userData && o.userData.fpHand1276) fist = o;
      });
      const cam = vc;
      const proj = new T.Vector3();
      function toNdc(v) {
        proj.copy(v).project(cam);
        return proj;
      }
      let knOn = 0, knN = 0, knClear = 0, fistMinZ = 1, fistMaxZ = -1, fistMinX = 2, fistMaxX = -2, fistMinY = 2, fistMaxY = -2;
      if (fist && fist.geometry && fist.geometry.attributes && fist.geometry.attributes.position) {
        const pos = fist.geometry.attributes.position;
        const step = Math.max(1, Math.floor(pos.count / 90));
        fist.updateWorldMatrix(true, true);
        const lp = new T.Vector3();
        for (let i = 0; i < pos.count; i += step) {
          lp.fromBufferAttribute(pos, i);
          // Knuckle row: mid-finger, dorsal.
          const isKn = (lp.y > 0.04 && lp.y < 0.10 && lp.z > 0.004);
          const wp = fist.localToWorld(lp.clone());
          toNdc(wp);
          const on = (proj.x > -0.98 && proj.x < 0.98 && proj.y > -0.98 && proj.y < 0.98 && proj.z > -1 && proj.z < 1);
          fistMinX = Math.min(fistMinX, proj.x); fistMaxX = Math.max(fistMaxX, proj.x);
          fistMinY = Math.min(fistMinY, proj.y); fistMaxY = Math.max(fistMaxY, proj.y);
          if (on) { fistMinZ = Math.min(fistMinZ, proj.z); fistMaxZ = Math.max(fistMaxZ, proj.z); }
          if (isKn) {
            knN++;
            if (on) knOn++;
            // Outside the cuff: a wrist/cuff point should not sit in front of the knuckle.
            if (on && p.cuff) {
              const cN = toNdc(p.cuff.getWorldPosition(new T.Vector3()));
              const dx = proj.x - cN.x, dy = proj.y - cN.y;
              const sep = Math.hypot(dx, dy);
              if (sep > 0.08 && proj.z <= cN.z + 0.02) knClear++;
            }
          }
        }
      }
      const knVis = knN ? (knOn / knN) : 0;
      const knOut = knN ? (knClear / knN) : 0;
      // Item fully on screen.
      let itemOn = 1, itemFrac = 1, itemN = 0, itemIn = 0, itemClip = 0;
      if (typeof held !== 'undefined' && held && U.poseKey !== 'empty') {
        held.traverse(function (o) {
          if (!o.isMesh || !o.visible || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          if (!bb) return;
          const v = new T.Vector3();
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
            v.set(i ? bb.max.x : bb.min.x, j ? bb.max.y : bb.min.y, k ? bb.max.z : bb.min.z);
            o.localToWorld(v);
            toNdc(v);
            itemN++;
            const on = (proj.x > -1 && proj.x < 1 && proj.y > -1 && proj.y < 1 && proj.z > -1 && proj.z < 1);
            if (on) itemIn++;
            if (proj.x < -1.02 || proj.x > 1.02 || proj.y < -1.02 || proj.y > 1.02) itemClip++;
          }
        });
        itemFrac = itemN ? (itemIn / itemN) : 1;
        itemOn = (itemClip === 0 && itemFrac > 0.92) ? 1 : itemFrac;
      }
      // Intersection: cuff/rolls vs the item (not the whole sleeve AABB,
      // which falsely overlaps a long musket or hanging bucket).
      let inter = 0, interVol = 0, cuffVol = 0;
      if (typeof held !== 'undefined' && held) {
        const iBox = new T.Box3().setFromObject(held);
        const parts = [p.cuff, p.roll, p.roll2];
        if (armL && armL.visible && armL.userData && armL.userData.p) {
          const q = armL.userData.p;
          parts.push(q.cuff, q.roll, q.roll2);
        }
        for (let i = 0; i < parts.length; i++) {
          const c = parts[i];
          if (!c) continue;
          const cBox = new T.Box3().setFromObject(c);
          if (cBox.isEmpty()) continue;
          const cs = new T.Vector3(); cBox.getSize(cs);
          cuffVol += Math.max(0, cs.x) * Math.max(0, cs.y) * Math.max(0, cs.z);
          if (!iBox.isEmpty() && cBox.intersectsBox(iBox)) {
            const h = cBox.clone().intersect(iBox);
            const hs = new T.Vector3(); h.getSize(hs);
            interVol += Math.max(0, hs.x) * Math.max(0, hs.y) * Math.max(0, hs.z);
          }
        }
        inter = cuffVol > 1e-10 ? Math.min(1, interVol / cuffVol) : 0;
      }
      // Pick head width / clip if present.
      let pickOk = 1;
      if (U.pickContact && U.pickContact.ok === false) pickOk = 0;
      const wrCloser = (wrW.z > shW.z - 0.01) || (towardAmt > 0.15) ? 1 : 0;
      // Sweet-spot look-down: foreshortened, not down the tube and not flat-on.
      const foreshort = 1 - Math.min(1, Math.abs(lookDown - 0.45) / 0.55);
      let score = 0;
      score += 2.6 * faceDot;
      score += 1.4 * knVis;
      score += 1.6 * knOut;
      score += 2.2 * itemOn;
      score += 0.8 * foreshort;
      score += 0.4 * wrCloser;
      score += 0.6 * pickOk;
      score -= 3.2 * inter;
      if (inter > 0.001) score -= 8.0 + 6.0 * inter;
      score -= 1.8 * (1 - knVis);
      if (lookDown > 0.88) score -= 2.5;
      if (faceDot < 0.25) score -= 2.0;
      if (itemOn < 0.85) score -= 2.5;
      // Guns must stay framed: a long musket may clip a hidden butt
      // corner, but the visible body should still be mostly on screen.
      const isGun = (U.poseKey === 'pistol' || U.poseKey === 'pistolAds' || U.poseKey === 'musket' || U.poseKey === 'musketAds');
      if (isGun && itemFrac < 0.55) score -= 3.0;
      if (isGun && itemOn >= 0.92 && inter <= 0.001) score += 1.4;
      let support = 0, supportDist = null, leftIn = 0;
      if (U.poseKey === 'pistolAds' && armL && armL.visible && armL.userData && armL.userData.p) {
        let gun = null;
        if (typeof held !== 'undefined' && held) {
          held.traverse(function (o) { if (!gun && o.name === 'FpFlintlock1265') gun = o; });
        }
        const socket = armL.userData.p.grip || armL.userData.p.h;
        if (gun && socket) {
          gun.updateWorldMatrix(true, true);
          socket.updateWorldMatrix(true, true);
          const target = gun.localToWorld(new T.Vector3(0, 0.002, -0.10));
          const cup = socket.getWorldPosition(new T.Vector3());
          supportDist = cup.distanceTo(target);
          support = Math.max(0, 1 - supportDist / 0.14);
        }
        const wrL = armL.userData.p.wrist.getWorldPosition(new T.Vector3());
        try { vc.worldToLocal(wrL); } catch (_) {}
        if (wrL.x < -0.02) leftIn = 1;
        score += 2.2 * support;
        score += 0.5 * leftIn;
        if (support < 0.35) score -= 2.8;
      }
      out.ok = 1;
      out.score = +score.toFixed(4);
      out.faceDot = +faceDot.toFixed(4);
      out.dorsumDot = +dorsumDot.toFixed(4);
      out.palmDot = +palmDot.toFixed(4);
      out.knVis = +knVis.toFixed(3);
      out.knOut = +knOut.toFixed(3);
      out.itemOn = +itemOn.toFixed(3);
      out.itemFrac = +itemFrac.toFixed(3);
      out.inter = +inter.toFixed(4);
      out.interVol = +interVol.toFixed(6);
      out.cuffVol = +cuffVol.toFixed(6);
      out.support = +support.toFixed(3);
      out.supportDist = (supportDist == null) ? null : +supportDist.toFixed(4);
      out.leftIn = leftIn;
      out.lookDown = +lookDown.toFixed(3);
      out.towardAmt = +towardAmt.toFixed(3);
      out.foreshort = +foreshort.toFixed(3);
      out.poseKey = U.poseKey;
      out.musketSeat = U.musketSeat || null;
      out.musketSeatSkip = U.musketSeatSkip || null;
      out.heldPos = (typeof held !== 'undefined' && held) ? [+held.position.x.toFixed(3), +held.position.y.toFixed(3), +held.position.z.toFixed(3)] : null;
    } catch (e) {
      out.err = String(e && e.stack || e).slice(0, 300);
    }
    return out;
  }
  U.scorePose = scorePose;
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
