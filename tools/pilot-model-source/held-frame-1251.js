/* v1.2.49 held-frame: first-person view transforms so the hand+item sits
   big and low-right, matching t1122 composition. Also hides the duplicate
   c112 map overlay, tightens third-person grip, and eases per-item finger
   wrap. Existing __fpa / fist animation drivers are kept. */
(function heldFrame1251(W) {
  const U = W.__heldFrame1251 = {on: 0, err: null, version: '1.2.57-frame-p7', fovK: 1, kind: '', ads: 0};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  // Per-item camera-space nudge + viewmodel FOV scale.
  // dx>0 right, dy>0 up, dz>0 closer (less-negative z). fov<1 zooms the VM.
  // s scales the held item (not the arm length) so fists stay reachable.
  // armS scales the visible __fpa rig around the camera (use sparingly).
  const FRAME = {
    // Ref 09: larger open palm, mid-right, cuff coming from the bottom-right.
    empty:  {dx:  0.02, dy:  0.04, dz: 0.06, fov: 0.72, s: 1.00, armS: 1.18},
    // Ref 08: cobble sits in a cupped palm, same family as the empty hand.
    block:  {dx:  0.00, dy:  0.02, dz: 0.04, fov: 0.74, s: 0.70, armS: 1.14},
    // t1183-13 POSITION: pick comes in large from the bottom-right corner,
    // head angled up-left, hand at the corner / nearly off-screen.
    pick:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p761:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p760:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    axe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    shovel: {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    hoe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    sword:  {dx: -0.02, dy: -0.04, dz: 0.04, fov: 0.72, s: 1.08, armS: 1.10},
    bucket: {dx: -0.04, dy:  0.06, dz: 0.00, fov: 0.80, s: 1.08, armS: 1.04},
    torch:  {dx: -0.04, dy:  0.04, dz: 0.02, fov: 0.76, s: 1.08, armS: 1.06},
    // Ref 02: supporting palm and sleeve should stay visible under the map.
    map:    {dx: -0.02, dy:  0.02, dz: 0.04, fov: 0.76, s: 1.04, armS: 1.12},
    // t1183-12 POSITION: gun held big and low in the bottom-right, angled
    // in towards the centre, forearm coming up from the bottom edge. ADS
    // rest offsets stay identity so aim animations are unchanged.
    // Keep close to the on-screen pass-2 framing; only a slight bigger/lower push.
    musket: {dx:  0.02, dy: -0.04, dz: 0.04, fov: 0.86, s: 1.10, armS: 1.00},
    pistol: {dx:  0.02, dy: -0.04, dz: 0.06, fov: 0.84, s: 1.16, armS: 1.00},
    musketAds: {dx: 0, dy: 0, dz: 0, fov: 1, s: 1, armS: 1},
    pistolAds: {dx: 0, dy: 0, dz: 0, fov: 1, s: 1, armS: 1},
    other:  {dx: -0.04, dy:  0.08, dz: 0.12, fov: 0.64, s: 1.10, armS: 1.20}
  };
  U.FRAME = FRAME;

  function kindOf() {
    try {
      const id = (typeof selId !== 'undefined') ? selId : null;
      const mesh = (typeof held !== 'undefined' && held && held.children && held.children[0]) || null;
      const H = W.__held1240;
      if (H && typeof H.kindOf === 'function' && mesh) {
        const k = H.kindOf(mesh, id);
        if (k) return k;
      }
      if (mesh && mesh.userData) {
        const u = mesh.userData;
        if (u.p761 || u.crystalPick === 'purple') return 'p761';
        if (u.p760) return 'p760';
        if (u.tool && u.pick) return 'pick';
        if (u.sword) return 'sword';
        if (u.bucket) return 'bucket';
        if (u.torch) return 'torch';
        if (u.map) return 'map';
        if (u.block) return 'block';
        if (u.gun === 212 || (typeof IT !== 'undefined' && u.gun === IT.PISTOL)) return 'pistol';
        if (u.gun === 213 || (typeof IT !== 'undefined' && u.gun === IT.MUSKET)) return 'musket';
        if (u.kind) return u.kind;
      }
      if (typeof IT !== 'undefined' && id != null) {
        if (id === IT.MAP || id === 410) return 'map';
        if (id === IT.TORCH || id === 67) return 'torch';
        if (id === IT.BUCKET || id === IT.WATERB || id === 39 || id === 48) return 'bucket';
        if (id === IT.PISTOL || id === 212) return 'pistol';
        if (id === IT.MUSKET || id === 213) return 'musket';
        if (id === 761 || id === IT.PCPICK) return 'p761';
      }
      if (!mesh) return 'empty';
      if (mesh.userData && mesh.userData.block) return 'block';
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

  function lerpNum(a, b, t) { return a + (b - a) * t; }

  const cur = {dx: 0, dy: 0, dz: 0, fov: 1, s: 1, armS: 1};
  let from = {dx: 0, dy: 0, dz: 0, fov: 1, s: 1, armS: 1};
  let key = '', bt = 1;
  const HS_BASE = {x: 1, y: 1, z: 1};
  let hsCaptured = 0;

  function captureHS() {
    if (hsCaptured) return;
    try {
      if (W.__vm && W.__vm.HS0) {
        HS_BASE.x = W.__vm.HS0.x; HS_BASE.y = W.__vm.HS0.y; HS_BASE.z = W.__vm.HS0.z;
        hsCaptured = 1;
      } else if (typeof hand !== 'undefined' && hand && hand.scale) {
        HS_BASE.x = hand.scale.x || 1; HS_BASE.y = hand.scale.y || 1; HS_BASE.z = hand.scale.z || 1;
        hsCaptured = 1;
      }
    } catch (_) {}
  }

  function applyItemScale(s) {
    try {
      if (typeof held === 'undefined' || !held) return;
      // Scale the item group, not `hand`, so the hidden arm box and __vm HS0 stay stable.
      if (!held.userData) held.userData = {};
      if (held.userData._s0 == null) held.userData._s0 = held.scale.x || 1;
      held.scale.setScalar(held.userData._s0 * s);
    } catch (_) {}
  }

  function applyArmScale(armS, dx, dy, dz) {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
      if (!rig) return;
      rig.position.set(dx, dy, dz);
      rig.scale.setScalar(armS);
    } catch (_) {}
  }

  function hideMapOverlay() {
    try {
      const C = W.__c112;
      if (C && C.g) C.g.visible = false;
      if (C && typeof C.frame === 'function' && !C.__hide1251) {
        const prev = C.frame;
        C.frame = function () {
          try { prev.apply(this, arguments); } catch (_) {}
          try { if (C.g) C.g.visible = false; } catch (_) {}
          return false; // do not hide the first-person hand
        };
        C.__hide1251 = 1;
      }
      if (C && C.g && C.g.parent && !C.__detached1251) {
        try { C.g.parent.remove(C.g); C.g.visible = false; C.__detached1251 = 1; } catch (_) {}
      }
      if (typeof renderer !== 'undefined' && renderer && renderer.render && !renderer.__mapHide1251) {
        const rd = renderer.render.bind(renderer);
        renderer.render = function (sc, cam) {
          try {
            const g = W.__c112 && W.__c112.g;
            if (g) {
              g.visible = false;
              if (g.parent) g.parent.remove(g);
            }
          } catch (_) {}
          // The gun viewmodel re-runs __fpa.step just before drawing its
          // own scene, which re-shows sleeves. Hide them again in that pass
          // so a linen cuff cannot sit in the lens.
          try {
            if (W.__vm && W.__vm.vs && sc === W.__vm.vs) hideGunSleeves();
          } catch (_) {}
          return rd.apply(this, arguments);
        };
        renderer.__mapHide1251 = 1;
      }
    } catch (e) { ERR('map', e); }
  }

  function curlFingers(kind, ads) {
    try {
      // Leave fingers to the existing animation while a swing or reload plays.
      try {
        if (typeof swingT !== 'undefined' && swingT > 0) return;
        if (W.__rl && W.__rl.t > 0) return;
        if (typeof rlT !== 'undefined' && rlT > 0) return;
      } catch (_) {}
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
      if (!rig) return;
      // Static rest curls only (not animation curves). Tools get a closed fist
      // with the thumb wrapped over the top; empty is an open palm; the block
      // is a soft cup so cobble can sit in the hand.
      const tight = {empty: 0.06, block: 0.52, pick: 1.16, p761: 1.16, p760: 1.16, axe: 1.16, shovel: 1.16, hoe: 1.16,
        sword: 1.18, bucket: 1.20, torch: 1.18, map: 0.16, musket: ads ? 0.78 : 1.06, pistol: ads ? 0.72 : 1.08, other: 0.9};
      const gamt = tight[kind] != null ? tight[kind] : 0.9;
      const trigger = (kind === 'pistol');
      function curlArm(arm, isLeft) {
        const p = arm && arm.userData && arm.userData.p;
        const h = p && p.h;
        if (!h || !h.userData) return;
        const fingers = h.userData.f || [];
        for (let i = 0; i < fingers.length; i++) {
          const pair = fingers[i];
          // mkHand stores [proximal, mid] pairs; accept a bare group too.
          const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
          const k = (f && f.userData && f.userData.k) || (pair && pair[1]);
          if (!f || !f.rotation) continue;
          let c = gamt;
          if (trigger && !isLeft && i === 0) c = 0.28;
          if (kind === 'musket' && ads && isLeft) c = 0.40;
          if (kind === 'map') c = 0.18 + i * 0.04;
          if (kind === 'empty') c = 0.04 + i * 0.025;
          if (kind === 'block') c = 0.42 + i * 0.06;
          try {
            f.rotation.x = 0.12 + c * 1.35;
            if (k && k.rotation) {
              k.rotation.x = 0.15 + c * 1.45;
              const d = k.userData && k.userData.d;
              if (d && d.rotation) d.rotation.x = 0.10 + c * 0.70;
            }
          } catch (_) {}
        }
        const th = h.userData.th;
        if (th) {
          const side = (arm.userData && arm.userData.side) || 1;
          if (kind === 'empty' || kind === 'map' || kind === 'block') {
            // Open / supporting / cupped: thumb sits beside the palm, not across it.
            th.rotation.set(0.55, side * 0.70, side * 0.35);
            if (th.userData && th.userData.k) th.userData.k.rotation.set(0.15, 0, 0);
          } else if (kind === 'musket' && ads && isLeft) {
            th.rotation.set(0.3, side * 0.2, side * 0.15);
          } else {
            // Closed fist: thumb wraps over the far side of the fingers.
            const W = [0.45, 0.50, 0.38, 0.28];
            th.rotation.set(W[0], side * W[1], side * W[2]);
            if (th.userData && th.userData.k) th.userData.k.rotation.set(W[3], 0, 0);
          }
        }
      }
      if (rig.userData.R) curlArm(rig.userData.R, 0);
      if (rig.userData.L) curlArm(rig.userData.L, 1);
    } catch (e) { ERR('curl', e); }
  }

  function poseTp() {
    try {
      if (typeof camMode === 'undefined' || !camMode) return;
      if (typeof worldModel === 'undefined' || !worldModel) return;
      const H = W.__held1240;
      if (H && typeof H.poseHeld === 'function') {
        try { H.poseHeld(worldModel); } catch (_) {}
      }
      const arms = worldModel.userData && worldModel.userData.arms;
      const grip = arms && arms[1] && arms[1].userData && arms[1].userData.grip;
      const mesh = (typeof heldMesh3p !== 'undefined') ? heldMesh3p : null;
      if (grip && mesh) {
        if (mesh.parent !== grip) {
          try { if (mesh.parent) mesh.parent.remove(mesh); } catch (_) {}
          grip.add(mesh);
        }
        mesh.visible = true;
        if (!mesh.userData) mesh.userData = {};
        if (!mesh.userData.tpSeat1251) {
          mesh.position.set(0, -0.01, 0.04);
          if (mesh.userData.tool || mesh.userData.p761 || mesh.userData.sword) {
            mesh.rotation.set(-1.15, 0.05, 0.08);
            mesh.scale.setScalar(Math.max(mesh.scale.x || 1, 1.35));
          }
          mesh.userData.tpSeat1251 = 1;
        }
      }
      // Walk with a slight hold bend, not an A-pose.
      if (arms && arms[1] && mesh) {
        const sw = (typeof bobPhase !== 'undefined') ? Math.sin(bobPhase) * 0.55 * (typeof bobAmp !== 'undefined' ? bobAmp : 1) : 0;
        arms[1].rotation.z = (arms[1].rotation.z || 0) * 0.4 + 0.12;
        if (!(typeof swingT !== 'undefined' && swingT > 0)) {
          arms[1].rotation.x = sw * 0.55 - 0.7;
        }
      }
      // Curl visible finger bones on the Scottish model if present.
      try {
        worldModel.traverse(function (o) {
          const n = (o.name || '').toLowerCase();
          if (!/finger|thumb|index|middle|ring|pinky/.test(n)) return;
          if (!/slot1|_r$|right|arm_slot1/.test(n) && !/finger/.test(n)) return;
          if (o.rotation) {
            if (/thumb/.test(n)) o.rotation.x = Math.max(o.rotation.x, 0.25);
            else o.rotation.x = Math.max(o.rotation.x, 0.55);
          }
        });
      } catch (_) {}
    } catch (e) { ERR('tp', e); }
  }


  function eachArm(fn) {
    try {
      const rig = W.__fpa && (typeof W.__fpa.rig === 'function' ? W.__fpa.rig() : null);
      if (!rig) return;
      if (rig.userData.R) fn(rig.userData.R);
      if (rig.userData.L) fn(rig.userData.L);
    } catch (_) {}
  }
  function isLinenMesh(o) {
    if (!o || !o.isMesh) return false;
    const ud = o.userData || {};
    if (ud.folded1249 || ud.tartan1251) return true;
    const n = ((o.name || '') + (o.parent && o.parent.name || '')).toLowerCase();
    if (/cuff|sleeve|shirt|\bup\b|linen/.test(n)) return true;
    const m = [].concat(o.material || [])[0];
    if (!m) return false;
    if (m.userData && (m.userData.folded1249 || m.userData.tartan1251)) return true;
    try {
      const L = W.__hands1249 && W.__hands1249.LINEN_MAP;
      if (L && (m.map === L || m.bumpMap === L)) return true;
    } catch (_) {}
    return false;
  }

  // View-space bbox + projected screen coverage for a mesh (0..1 of the
  // viewport). Used to cull any viewmodel mesh that fills the lens — the
  // giant linen sleeve wall that sat in the top half of gun hip/ADS.
  const _cv = [];
  for (let i = 0; i < 8; i++) _cv.push(new T.Vector3());
  const _inv = new T.Matrix4();
  const COVER_LIMIT = 0.25;
  U.COVER_LIMIT = COVER_LIMIT;

  function viewBox(mesh, cam) {
    const g = mesh && mesh.geometry;
    if (!g) return null;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    cam.updateMatrixWorld(true);
    mesh.updateWorldMatrix(true, false);
    _inv.copy(cam.matrixWorld);
    if (typeof _inv.invert === 'function') _inv.invert();
    else if (typeof _inv.getInverse === 'function') _inv.getInverse(cam.matrixWorld);
    let minx = Infinity, miny = Infinity, minz = Infinity;
    let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
    for (let i = 0; i < 8; i++) {
      const v = _cv[i];
      v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
      v.applyMatrix4(mesh.matrixWorld).applyMatrix4(_inv);
      if (v.x < minx) minx = v.x; if (v.y < miny) miny = v.y; if (v.z < minz) minz = v.z;
      if (v.x > maxx) maxx = v.x; if (v.y > maxy) maxy = v.y; if (v.z > maxz) maxz = v.z;
    }
    return {min: {x: minx, y: miny, z: minz}, max: {x: maxx, y: maxy, z: maxz}};
  }

  function screenCover(mesh, cam) {
    try {
      const g = mesh && mesh.geometry;
      if (!g || !cam) return 0;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      cam.updateMatrixWorld(true);
      mesh.updateWorldMatrix(true, false);
      _inv.copy(cam.matrixWorld);
      if (typeof _inv.invert === 'function') _inv.invert();
      else if (typeof _inv.getInverse === 'function') _inv.getInverse(cam.matrixWorld);
      const near = (cam.near || 0.01);
      const pts = [];
      let minx = Infinity, miny = Infinity, minz = Infinity;
      let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
      let inFront = 0;
      for (let i = 0; i < 8; i++) {
        const v = _cv[i];
        v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
        v.applyMatrix4(mesh.matrixWorld).applyMatrix4(_inv);
        pts.push({x: v.x, y: v.y, z: v.z});
        if (v.x < minx) minx = v.x; if (v.y < miny) miny = v.y; if (v.z < minz) minz = v.z;
        if (v.x > maxx) maxx = v.x; if (v.y > maxy) maxy = v.y; if (v.z > maxz) maxz = v.z;
        if (v.z < 0) inFront++;
      }
      // Entirely behind the camera: not on screen.
      if (inFront === 0) return 0;
      // Mesh swallows the camera (the linen sleeve wall): bbox crosses z=0
      // with a large near-plane footprint.
      const swallows = (minz < -0.001 && maxz > 0) && (maxx - minx) > 0.10 && (maxy - miny) > 0.10;
      if (swallows) return 1;
      const tanHalf = Math.tan(((cam.fov || 70) * Math.PI / 180) * 0.5);
      const aspect = cam.aspect || 1;
      function project(vx, vy, vz) {
        const z = Math.min(vz, -near);
        const ph = Math.max(1e-5, (-z) * tanHalf);
        const pw = ph * aspect;
        return {x: vx / pw, y: vy / ph};
      }
      let ndcMinX = Infinity, ndcMinY = Infinity, ndcMaxX = -Infinity, ndcMaxY = -Infinity;
      let any = false;
      function addP(vx, vy, vz) {
        const p = project(vx, vy, vz);
        if (p.x < ndcMinX) ndcMinX = p.x; if (p.x > ndcMaxX) ndcMaxX = p.x;
        if (p.y < ndcMinY) ndcMinY = p.y; if (p.y > ndcMaxY) ndcMaxY = p.y;
        any = true;
      }
      for (let i = 0; i < 8; i++) {
        if (pts[i].z < -near * 0.5) addP(pts[i].x, pts[i].y, pts[i].z);
      }
      // Clip bbox edges that cross the near plane.
      const edges = [
        [0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]
      ];
      for (let e = 0; e < edges.length; e++) {
        const a = pts[edges[e][0]], b = pts[edges[e][1]];
        const az = a.z, bz = b.z;
        if ((az < -near) === (bz < -near)) continue;
        const t = (-near - az) / (bz - az);
        if (t < 0 || t > 1) continue;
        addP(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, -near);
      }
      if (!any) return 0;
      const x0 = Math.max(-1, ndcMinX), x1 = Math.min(1, ndcMaxX);
      const y0 = Math.max(-1, ndcMinY), y1 = Math.min(1, ndcMaxY);
      if (x1 <= x0 || y1 <= y0) return 0;
      return ((x1 - x0) * (y1 - y0)) / 4;
    } catch (_) { return 0; }
  }

  function isHandPart(o) {
    if (!o) return false;
    const n = (o.name || '') + ' ' + ((o.parent && o.parent.name) || '');
    if (/PalmSculpt|finger|thumb|index|middle|ring|pinky|knuckle|nail|thenar|fist/i.test(n)) return true;
    const u = o.userData || {};
    if (u.sculptKeep || u.sculpt1249 || u.nail1249 || u.__fpaHand) return true;
    return false;
  }
  function isItemMesh(o) {
    const heldRoot = (typeof held !== 'undefined') ? held : null;
    let n = o;
    while (n) {
      const u = n.userData || {};
      if (heldRoot && n === heldRoot) return true;
      if (u.gun || u.c322 || u.__fb || u.tool || u.prismBuilt || u.sword ||
          u.block || u.torch || u.bucket || u.map || u.p761 || u.p760 ||
          u.crystalPick || u.kind === 'sword' || u.kind === 'pick') return true;
      n = n.parent;
    }
    return false;
  }
  function isProtectedMesh(o) {
    // Palm/fingers on the mesh itself only. A linen sleeve parented under
    // the hand group must NOT inherit protection — that was the wall.
    if (o.userData && o.userData.fpTpArm1270) return true;
    if (isHandPart(o) && !isLinenMesh(o)) return true;
    return isItemMesh(o);
  }

  function restoreCulled() {
    const list = U._culled || [];
    for (let i = 0; i < list.length; i++) {
      try { if (list[i]) list[i].visible = true; } catch (_) {}
    }
    U._culled = [];
  }

  // Idempotent: restore last frame's cull, then hide any non-item mesh whose
  // projected coverage exceeds 25% of the viewport. Called in the same path
  // as the viewmodel draw, after objects are parented to the VM camera and
  // after __fpa.step / __vm have posed them — not in a raced earlier hook.
  function cullVm(root, cam) {
    restoreCulled();
    const dump = [];
    if (!root || !cam) { U.lastDump = dump; U.maxCover = 0; return dump; }
    try {
      root.updateMatrixWorld(true);
      cam.updateMatrixWorld(true);
      root.traverse(function (o) {
        if (!o.isMesh || o.visible === false) return;
        const cov = screenCover(o, cam);
        const vsb = cov >= 0.08 ? viewBox(o, cam) : null;
        const rec = {
          name: o.name || '(anon)',
          parent: (o.parent && (o.parent.name || o.parent.type)) || '',
          typ: (o.geometry && o.geometry.type) || '',
          cov: +(+cov).toFixed(4),
          vsb: vsb && {min: [+vsb.min.x.toFixed(3), +vsb.min.y.toFixed(3), +vsb.min.z.toFixed(3)], max: [+vsb.max.x.toFixed(3), +vsb.max.y.toFixed(3), +vsb.max.z.toFixed(3)]},
          prot: isProtectedMesh(o)
        };
        if (cov >= 0.08) dump.push(rec);
        // Hide only wall-like meshes: they swallow the camera (cover==1)
        // or a linen/sleeve sheet covers more than half the frame. Do not
        // hide a close hand, forearm or held item just for exceeding 25%.
        const vsbZ = rec.vsb && rec.vsb.min && rec.vsb.max;
        const swallows = !!(vsbZ && rec.vsb.min[2] < 0 && rec.vsb.max[2] > 0 && (cov > COVER_LIMIT || cov >= 0.999));
        const palm = isHandPart(o) && !isLinenMesh(o);
        const item = isItemMesh(o);
        const tpArm = !!(o.userData && o.userData.fpTpArm1270);
        rec.prot = !!(palm || item || tpArm);
        // Always hide a camera-swallowing linen/sleeve wall, even if it
        // sits under the hand group. Never hide the held item, a finger,
        // or the 1270 Scottish TP arm (its bind AABB is at the camera
        // because cover uses the unskinned box).
        const wall = !item && !palm && !tpArm && (cov >= 0.999 || swallows || (cov > 0.50 && isLinenMesh(o)));
        if (wall) {
          o.visible = false;
          U._culled.push(o);
          rec.hid = 1;
        }
      });
    } catch (e) { ERR('cull', e); }
    U.lastDump = dump;
    U.maxCover = dump.reduce(function (m, r) { return Math.max(m, r.cov || 0); }, 0);
    U.lastKind = U.kind;
    return dump;
  }
  U.screenCover = screenCover;
  U.viewBox = viewBox;
  U.cullVm = cullVm;
  U.restoreCulled = restoreCulled;

  function hideGunSleeves() {
    // Keep a connected cream cuff and forearm on guns. Only tuck the upper
    // arm away during ADS so a sleeve cannot sit in the lens, and hide the
    // bare elbow sphere that read as a floating ball when the sleeve was gone.
    let hid = 0;
    const ads = isAds();
    eachArm(function (arm) {
      const p = arm.userData && arm.userData.p;
      if (!p) return;
      if (p.h) p.h.visible = true;
      if (p.fo) p.fo.visible = true;
      // Bare elbow sphere never reads as a sleeve.
      if (p.el) { p.el.visible = false; p.el.userData.__hidSleeve1252 = 1; hid++; }
      // Hip: keep the cream cuff so the sleeve is connected. ADS: hide the
      // long cuff and upper arm so they cannot fill the sight.
      if (p.cuff) {
        p.cuff.visible = !ads;
        p.cuff.userData.__hidSleeve1252 = ads ? 1 : 0;
        if (ads) hid++;
      }
      if (p.up) {
        p.up.visible = !ads;
        p.up.userData.__hidSleeve1252 = ads ? 1 : 0;
        if (ads) hid++;
      }
      // Palmar spheres read as mannequin blobs in the sight — hide on ADS only.
      if (p.h) {
        p.h.traverse(function (o) {
          if (o.userData && o.userData.pad1249) {
            o.visible = !ads;
            o.userData.__hidSleeve1252 = ads ? 1 : 0;
          }
        });
      }
    });
    U.hidSleeve = hid;
  }
  function showGunSleeves() {
    function unhide(root) {
      if (!root || !root.traverse) return;
      try {
        root.traverse(function (o) {
          if (o.userData && o.userData.__hidSleeve1252) {
            o.visible = true; o.userData.__hidSleeve1252 = 0;
          }
        });
      } catch (_) {}
    }
    eachArm(function (arm) {
      const p = arm.userData && arm.userData.p;
      if (p) {
        if (p.up) p.up.visible = true;
        if (p.el) p.el.visible = true;
        if (p.cuff) p.cuff.visible = true;
      }
      unhide(arm);
    });
    try { if (typeof hand !== 'undefined' && hand) unhide(hand); } catch (_) {}
  }

  // Static item-local rest nudges applied AFTER IK so the fist does not
  // follow the item and the relative grip can change. Not animation curves.
  const ITEM_NUDGE = {
    // Local +Y is along the item's "up" (blade/shaft/block). Nudges are
    // static rest offsets applied after IK so the fist does not follow.
    torch:  {x: 0.00, y: -0.02, z: -0.045},
    bucket: {x: 0.00, y: -0.16, z: -0.02},
    sword:  {x: 0.00, y: 0.07, z: -0.028},
    block:  {x: 0.00, y: 0.01, z: -0.055},
    pick:   {x: 0.00, y: 0.00, z: -0.018},
    p761:   {x: 0.00, y: 0.00, z: -0.018},
    p760:   {x: 0.00, y: 0.00, z: -0.018},
    map:    {x: 0.00, y: 0.05, z: 0.02}
  };
  function nudgeItem(kind) {
    try {
      const n = ITEM_NUDGE[kind];
      if (!n || typeof held === 'undefined' || !held) return;
      const mesh = held.children && held.children[0];
      if (!mesh) return;
      if (mesh.userData._n0 == null) {
        mesh.userData._n0 = {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z};
      }
      const b = mesh.userData._n0;
      mesh.position.set(b.x + n.x, b.y + n.y, b.z + n.z);
    } catch (_) {}
  }

  function apply(dt) {
    try {
      hideMapOverlay();
      if (typeof camMode !== 'undefined' && camMode) {
        U.fovK = 1;
        applyArmScale(1, 0, 0, 0);
        poseTp();
        U.on = 1;
        return;
      }
      captureHS();
      // 1259 dedicated FP viewmodel owns first-person posing. Leave the
      // 1.2.49 path untouched so items not on the 1272 allowlist fall back
      // cleanly when __fpVm1259.active is off.
      if (W.__fpVm1259 && W.__fpVm1259.active && !W.__fpVm1259.disabled) {
        const k0 = kindOf();
        U.fovK = 1;
        U.kind = k0;
        U.ads = isAds() ? 1 : 0;
        U.on = 1;
        return;
      }
      const k = kindOf();
      const ads = isAds();
      const fkey = (k === 'musket' && ads) ? 'musketAds' : (k === 'pistol' && ads) ? 'pistolAds' : k;
      const tgt = FRAME[fkey] || FRAME[k] || FRAME.other;
      if (fkey !== key) {
        key = fkey;
        from = {dx: cur.dx, dy: cur.dy, dz: cur.dz, fov: cur.fov, s: cur.s, armS: cur.armS};
        bt = 0;
      }
      bt = Math.min(1, bt + Math.max(0.016, dt || 0.016) / 0.2);
      const e = bt * bt * (3 - 2 * bt);
      cur.dx = lerpNum(from.dx, tgt.dx, e);
      cur.dy = lerpNum(from.dy, tgt.dy, e);
      cur.dz = lerpNum(from.dz, tgt.dz, e);
      cur.fov = lerpNum(from.fov, tgt.fov, e);
      cur.s = lerpNum(from.s, tgt.s, e);
      cur.armS = lerpNum(from.armS, tgt.armS, e);
      if (typeof hand !== 'undefined' && hand) {
        // Idempotent: apply the rest offset from the pose updateHand just set,
        // never accumulate across apply()/repose() in the same or later frames.
        const b = U._baseP;
        if (b) {
          hand.position.set(b.x + cur.dx, b.y + cur.dy, b.z + cur.dz);
        } else {
          if (hand.userData._hf0 == null) {
            hand.userData._hf0 = {x: hand.position.x, y: hand.position.y, z: hand.position.z};
          }
          const o = hand.userData._hf0;
          hand.position.set(o.x + cur.dx, o.y + cur.dy, o.z + cur.dz);
        }
      }
      applyItemScale(cur.s);
      if (k === 'musket' || k === 'pistol') {
        // Only nudge `hand` (already applied). Leave the __fpa rig at the
        // origin so the hip gun stays on-screen the way it did in pass 2.
        // The cuff stays visible via hideGunSleeves (hip only).
        applyArmScale(1, 0, 0, 0);
        hideGunSleeves();
      } else {
        applyArmScale(cur.armS, cur.dx, cur.dy, cur.dz);
        showGunSleeves();
      }
      curlFingers(k, ads);
      restPalm(k);
      nudgeItem(k);
      hideLeftoverCubes();
      U.fovK = cur.fov;
      U.kind = k;
      U.ads = ads ? 1 : 0;
      U.cur = cur;
      U.on = 1;
    } catch (e) { ERR('apply', e); }
  }

  // Static rest roll so empty / cobble / map show the palm to the camera
  // (ref 09 / 08 / 02). Local +Y is along the fingers, so a Y rotation is
  // pronation/supination. Not an animation curve — re-applied after fpa.step.
  const PALM_ROLL = {empty: -1.55, block: -1.45, map: -1.20};
  U.PALM_ROLL = PALM_ROLL;
  function palmHands(fn) {
    const fpa = W.__fpa;
    const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
    if (!rig) return;
    if (rig.userData.R) fn(rig.userData.R);
    if (rig.userData.L) fn(rig.userData.L);
  }
  // fpa.step overwrites hand quaternions, so any previous roll is already gone.
  function clearPalmTag() {
    palmHands(function (arm) {
      const h = arm && arm.userData && arm.userData.p && arm.userData.p.h;
      if (h && h.userData && h.userData._palmTag) h.userData._palmTag.rolled = 0;
    });
  }
  // Idempotent: undo a roll already applied this frame, then apply the current amount once.
  function restPalm(kind) {
    try {
      try {
        if (typeof swingT !== 'undefined' && swingT > 0) return;
        if (W.__rl && W.__rl.t > 0) return;
        if (typeof rlT !== 'undefined' && rlT > 0) return;
      } catch (_) {}
      const roll = PALM_ROLL[kind] || 0;
      palmHands(function (arm) {
        const h = arm && arm.userData && arm.userData.p && arm.userData.p.h;
        if (!h || !h.rotateY) return;
        const side = (arm.userData && arm.userData.side) || 1;
        if (!h.userData._palmTag) h.userData._palmTag = {rolled: 0};
        const tag = h.userData._palmTag;
        if (tag.rolled) {
          h.rotateY(-tag.rolled);
          tag.rolled = 0;
        }
        if (roll) {
          const amt = side * roll;
          h.rotateY(amt);
          tag.rolled = amt;
        }
      });
    } catch (e) { ERR('palm', e); }
  }

  function hideLeftoverCubes() {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
      if (!rig) return;
      rig.traverse(function (o) {
        if (!o.isMesh) return;
        const u = o.userData || {};
        if (u.sculpt1249 || u.nail1249 || u.sculptKeep || u.sleeve1257 || u.tapered1257 || u.folded1249 || u.roll1257 || u.sculptGeo1249) return;
        const typ = o.geometry && o.geometry.type;
        if (typ === 'BoxGeometry' || typ === 'SphereGeometry' || typ === 'CylinderGeometry' || typ === 'DodecahedronGeometry') {
          o.visible = false;
          u.sculptHidden = 1;
          o.userData = u;
        }
      });
    } catch (_) {}
  }

  function repose() {
    try {
      const k = kindOf();
      const ads = isAds();
      curlFingers(k, ads);
      restPalm(k);
      nudgeItem(k);
      hideLeftoverCubes();
      if (k === 'musket' || k === 'pistol') hideGunSleeves();
      else showGunSleeves();
    } catch (e) { ERR('repose', e); }
  }

  U.apply = apply;
  U.repose = repose;

  function hookFpa() {
    try {
      if (!W.__fpa || typeof W.__fpa.step !== 'function' || W.__fpa.__hide1251) return;
      const prev = W.__fpa.step.bind(W.__fpa);
      W.__fpa.step = function () {
        const r = prev.apply(this, arguments);
        try { clearPalmTag(); U.repose(); } catch (_) {}
        return r;
      };
      W.__fpa.__hide1251 = 1;
    } catch (_) {}
  }
  function hook() {
    if (U._hooked) return !!U._hooked;
    try {
      if (typeof updateHand !== 'function') return false;
      const uh = updateHand;
      updateHand = function (dt, moving) {
        const r = uh.apply(this, arguments);
        try {
          if (typeof hand !== 'undefined' && hand) {
            U._baseP = {x: hand.position.x, y: hand.position.y, z: hand.position.z};
          }
          apply(typeof dt === 'number' ? dt : 0.016);
        } catch (e) { ERR('uh', e); }
        return r;
      };
      hookFpa();
      U._hooked = 1;
      return true;
    } catch (e) { ERR('hook', e); return false; }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hideMapOverlay();
    if (hook() || n > 80) clearInterval(boot);
  }, 120);
  W.addEventListener && W.addEventListener('load', function () { hook(); hideMapOverlay(); });
})(typeof window !== 'undefined' ? window : this);
