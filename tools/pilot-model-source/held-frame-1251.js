/* v1.2.49 held-frame: first-person view transforms so the hand+item sits
   big and low-right, matching t1122 composition. Also hides the duplicate
   c112 map overlay, tightens third-person grip, and eases per-item finger
   wrap. Existing __fpa / fist animation drivers are kept. */
(function heldFrame1251(W) {
  const U = W.__heldFrame1251 = {on: 0, err: null, version: '1.2.49', fovK: 1, kind: '', ads: 0};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  // Per-item camera-space nudge + viewmodel FOV scale.
  // dx>0 right, dy>0 up, dz>0 closer (less-negative z). fov<1 zooms the VM.
  // s scales the held item (not the arm length) so fists stay reachable.
  // armS scales the visible __fpa rig around the camera (use sparingly).
  const FRAME = {
    empty:  {dx:  0.02, dy: -0.12, dz: 0.02, fov: 0.76, s: 1.00, armS: 1.16},
    block:  {dx: -0.04, dy:  0.00, dz: 0.04, fov: 0.76, s: 0.68, armS: 1.20},
    // t1183-13 POSITION: pick comes in large from the bottom-right corner,
    // head angled up-left, hand at the corner / nearly off-screen.
    pick:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p761:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p760:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    axe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    shovel: {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    hoe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    sword:  {dx: -0.02, dy: -0.06, dz: 0.06, fov: 0.68, s: 1.10, armS: 1.16},
    bucket: {dx: -0.06, dy:  0.00, dz: 0.08, fov: 0.68, s: 1.16, armS: 1.12},
    torch:  {dx: -0.06, dy: -0.02, dz: 0.06, fov: 0.70, s: 1.12, armS: 1.12},
    map:    {dx: -0.05, dy:  0.02, dz: 0.08, fov: 0.68, s: 1.55, armS: 1.12},
    // t1183-12 POSITION: gun held big and low in the bottom-right, angled
    // in towards the centre, forearm coming up from the bottom edge. ADS
    // rest offsets stay identity so aim animations are unchanged.
    musket: {dx:  0.03, dy: -0.08, dz: 0.08, fov: 0.78, s: 1.20, armS: 1.00},
    pistol: {dx:  0.03, dy: -0.10, dz: 0.12, fov: 0.70, s: 1.32, armS: 1.00},
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
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
      if (!rig) return;
      const tight = {empty: 0.35, block: 1.05, pick: 1.0, p761: 1.0, p760: 1.0, axe: 1.0, shovel: 1.0, hoe: 1.0,
        sword: 1.05, bucket: 0.95, torch: 0.95, map: 0.45, musket: ads ? 0.7 : 0.85, pistol: ads ? 0.65 : 0.9, other: 0.8};
      const gamt = tight[kind] != null ? tight[kind] : 0.8;
      const trigger = (kind === 'pistol');
      function curlArm(arm, isLeft) {
        const p = arm && arm.userData && arm.userData.p;
        const h = p && p.h;
        if (!h || !h.userData) return;
        const fingers = h.userData.f || [];
        for (let i = 0; i < fingers.length; i++) {
          const f = fingers[i];
          // index (0) stays straighter on a pistol trigger; support hand stays flatter under a musket forestock
          let c = gamt;
          if (trigger && !isLeft && i === 0) c = 0.25;
          if (kind === 'musket' && ads && isLeft) c = 0.35;
          if (kind === 'map') c = 0.35 + i * 0.04;
          try {
            f.rotation.x = 0.15 + c * 0.85;
            if (f.userData.k) {
              f.userData.k.rotation.x = 0.2 + c * 0.9;
              if (f.userData.k.userData && f.userData.k.userData.d) {
                f.userData.k.userData.d.rotation.x = 0.15 + c * 0.55;
              }
            }
          } catch (_) {}
        }
        const th = h.userData.th;
        if (th) {
          const side = (arm.userData && arm.userData.side) || 1;
          if (kind === 'musket' && ads && isLeft) {
            th.rotation.set(0.3, side * 0.2, side * 0.15);
          } else {
            th.rotation.set(0.45 + gamt * 0.2, side * 0.4, side * 0.28);
            if (th.userData && th.userData.k) th.userData.k.rotation.set(0.2 + gamt * 0.3, 0, 0);
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
    let hid = 0;
    eachArm(function (arm) {
      const p = arm.userData && arm.userData.p;
      const keep = new Set();
      if (p) {
        [p.h, p.fo].forEach(function (root) {
          if (!root) return;
          keep.add(root);
          try { root.traverse(function (o) { keep.add(o); }); } catch (_) {}
        });
      }
      try {
        arm.traverse(function (o) {
          if (o.isMesh && !keep.has(o)) { o.userData.__hidSleeve1252 = 1; o.visible = false; hid++; }
        });
      } catch (_) {}
    });
    // The linen wall lives under `hand` (legacy sleeve), not only on __fpa.
    // Hide pale/linen meshes there, but never a gun mesh (the musket is
    // often parented on `hand` rather than `held`).
    try {
      const heldRoot = (typeof held !== 'undefined') ? held : null;
      if (typeof hand !== 'undefined' && hand) {
        hand.traverse(function (o) {
          if (!o.isMesh) return;
          let n = o, skip = false;
          while (n) {
            const u = n.userData || {};
            if (heldRoot && n === heldRoot) { skip = true; break; }
            if (u.gun || u.c322 || u.__fb || u.tool || u.prismBuilt) { skip = true; break; }
            n = n.parent;
          }
          if (skip) return;
          const m = [].concat(o.material || [])[0];
          const pale = m && m.color && m.color.r > 0.7 && m.color.g > 0.7 && m.color.b > 0.62;
          const L = W.__hands1249 && W.__hands1249.LINEN_MAP;
          const nonLinenMap = m && m.map && L && m.map !== L;
          const typ = o.geometry && o.geometry.type;
          // Keep textured gun parts (often colour 0xffffff + a wood/metal map).
          if (nonLinenMap && !pale && !isLinenMesh(o)) return;
          if (isLinenMesh(o) || pale || (typ && /Cylinder|Torus/.test(typ) && !nonLinenMap)) {
            o.userData.__hidSleeve1252 = 1; o.visible = false; hid++;
          }
        });
      }
    } catch (_) {}
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
        hand.position.x += cur.dx;
        hand.position.y += cur.dy;
        hand.position.z += cur.dz;
      }
      applyItemScale(cur.s);
      if (k === 'musket' || k === 'pistol') {
        // Guns: only nudge `hand` (already applied). Leave the __fpa rig unscaled
        // so a sleeve cannot sit in the lens during hip or ADS.
        applyArmScale(1, 0, 0, 0);
        hideGunSleeves();
      } else {
        applyArmScale(cur.armS, cur.dx, cur.dy, cur.dz);
        showGunSleeves();
      }
      curlFingers(k, ads);
      U.fovK = cur.fov;
      U.kind = k;
      U.ads = ads ? 1 : 0;
      U.cur = cur;
      U.on = 1;
    } catch (e) { ERR('apply', e); }
  }
  U.apply = apply;

  function hookFpa() {
    try {
      if (!W.__fpa || typeof W.__fpa.step !== 'function' || W.__fpa.__hide1251) return;
      const prev = W.__fpa.step.bind(W.__fpa);
      W.__fpa.step = function () {
        const r = prev.apply(this, arguments);
        try {
          const k = kindOf();
          if (k === 'musket' || k === 'pistol') hideGunSleeves();
        } catch (_) {}
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
        try { apply(typeof dt === 'number' ? dt : 0.016); } catch (e) { ERR('uh', e); }
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
