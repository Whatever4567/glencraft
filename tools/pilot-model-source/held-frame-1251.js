/* v1.2.49 held-frame: first-person view transforms so the hand+item sits
   big and low-right, matching t1122 composition. Also hides the duplicate
   c112 map overlay, tightens third-person grip, and eases per-item finger
   wrap. Existing __fpa / fist animation drivers are kept. */
(function heldFrame1251(W) {
  const U = W.__heldFrame1251 = {on: 0, err: null, version: '1.2.57-frame-p18', fovK: 1, kind: '', ads: 0};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  // Per-item camera-space nudge + viewmodel FOV scale.
  // dx>0 right, dy>0 up, dz>0 closer (less-negative z). fov<1 zooms the VM.
  // s scales the held item (not the arm length) so fists stay reachable.
  // armS scales the visible __fpa rig around the camera (use sparingly).
  const FRAME = {
    // Ref 09: larger open palm, mid-right, cuff coming from the bottom-right.
    empty:  {dx:  0.00, dy:  0.06, dz: 0.04, fov: 0.76, s: 1.00, armS: 1.14},
    // Ref 08: cobble sits in a cupped palm, same family as the empty hand.
    block:  {dx:  0.00, dy:  0.04, dz: 0.02, fov: 0.76, s: 0.70, armS: 1.12},
    // t1183-13 POSITION: pick comes in large from the bottom-right corner,
    // head angled up-left, hand at the corner / nearly off-screen.
    pick:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p761:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    p760:   {dx:  0.05, dy: -0.10, dz: 0.06, fov: 0.72, s: 1.18, armS: 1.06},
    axe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    shovel: {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    hoe:    {dx: -0.03, dy:  0.00, dz: 0.06, fov: 0.80, s: 1.06, armS: 1.10},
    sword:  {dx: -0.02, dy: -0.06, dz: 0.06, fov: 0.70, s: 1.10, armS: 1.12},
    bucket: {dx: -0.04, dy:  0.06, dz: 0.00, fov: 0.80, s: 1.08, armS: 1.04},
    torch:  {dx: -0.06, dy: -0.02, dz: 0.06, fov: 0.70, s: 1.12, armS: 1.12},
    // Ref 02: supporting palm and sleeve should stay visible under the map.
    map:    {dx: -0.02, dy:  0.04, dz: 0.02, fov: 0.80, s: 1.04, armS: 1.08},
    // t1183-12 POSITION: gun held big and low in the bottom-right, angled
    // in towards the centre, forearm coming up from the bottom edge. ADS
    // rest offsets stay identity so aim animations are unchanged.
    // Keep close to the on-screen pass-2 framing; only a slight bigger/lower push.
    musket: {dx:  0.02, dy: -0.02, dz: 0.04, fov: 0.88, s: 1.12, armS: 1.00},
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
        sword: 1.22, bucket: 1.24, torch: 1.22, map: 0.16, musket: ads ? 0.78 : 1.08, pistol: ads ? 0.72 : 1.32, other: 0.9};
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
          if (kind === 'map') c = 0.10 + i * 0.03;
          if (kind === 'empty') c = 0.14 + i * 0.05;
          if (kind === 'block') c = 0.48 + i * 0.08;
          if (U.__palmBowl && U.__bowl && U.__bowl[kind] && U.__bowl[kind].curl != null) {
            c = U.__bowl[kind].curl + i * (U.__bowl[kind].curlI != null ? U.__bowl[kind].curlI : 0.05);
          }
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
          if (!th.userData._thP0) th.userData._thP0 = th.position.clone();
          const p0 = th.userData._thP0;
          if (kind === 'empty' || kind === 'map' || kind === 'block') {
            // Open / supporting / cupped: thumb sits beside the palm, not across it.
            th.position.copy(p0);
            th.rotation.set(0.55, side * 0.70, side * 0.35);
            if (th.userData && th.userData.k) th.userData.k.rotation.set(0.15, 0, 0);
          } else if (kind === 'musket' && ads && isLeft) {
            th.position.copy(p0);
            th.rotation.set(0.3, side * 0.2, side * 0.15);
          } else {
            // Closed fist. Optional analytical aim: point the thumb +Y at a
            // palmar target over the fingers (hand-local), then curl the mid
            // joint. Falls back to the p14 Euler when __thumbAim is off.
            const P = (U.__thumbP && U.__thumbP.length >= 3) ? U.__thumbP : [0, 0, 0];
            th.position.set(p0.x + side * P[0], p0.y + P[1], p0.z + P[2]);
            const W = (U.__thumbW && U.__thumbW.length >= 4) ? U.__thumbW : [0.28, 1.20, 1.50, 1.10];
            if (U.__thumbAim || U.__thumbLive) {
              let target = null;
              if (U.__thumbLive) {
                // Aim at a point on the palmar side of the index/middle mids,
                // measured live in hand space after the finger curl.
                const fingers = h.userData.f || [];
                const pts = [];
                h.updateMatrixWorld(true);
                for (let i = 0; i < 2 && i < fingers.length; i++) {
                  const pair = fingers[i];
                  const k = pair && pair[1];
                  const d = k && k.userData && k.userData.d;
                  const obj = d || k;
                  if (!obj || !obj.getWorldPosition) continue;
                  obj.updateMatrixWorld(true);
                  const w = new T.Vector3();
                  obj.getWorldPosition(w);
                  pts.push(h.worldToLocal(w));
                }
                if (pts.length) {
                  target = pts[0].clone();
                  if (pts[1]) target.add(pts[1]).multiplyScalar(0.5);
                  const off = U.__thumbOff || [0, 0.010, -0.022];
                  target.x += side * (off[0] || 0);
                  target.y += off[1] || 0;
                  target.z += off[2] || 0;
                }
              }
              if (!target) {
                const tgtA = U.__thumbT || [-0.012, 0.078, -0.024];
                target = new T.Vector3(side * tgtA[0], tgtA[1], tgtA[2]);
              }
              const dir = target.clone().sub(th.position);
              if (dir.lengthSq() > 1e-10) {
                dir.normalize();
                th.quaternion.copy(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir));
              } else {
                th.rotation.set(W[0], side * W[1], side * W[2]);
              }
              const mid = (U.__thumbMid != null) ? U.__thumbMid : 1.25;
              if (th.userData && th.userData.k) th.userData.k.rotation.set(mid, 0, 0);
            } else {
              th.rotation.set(W[0], side * W[1], side * W[2]);
              if (th.userData && th.userData.k) th.userData.k.rotation.set(W[3], side * (W[4] || 0), side * (W[5] || 0));
            }
          }
        }
      }
      if (rig.userData.R) curlArm(rig.userData.R, 0);
      if (rig.userData.L) curlArm(rig.userData.L, 1);
      // Visual-only thumb-box override. Joints (th / tk / td) stay where
      // curl / the rig left them; only the sculpted meshes are moved.
      applyThumbVis(kind);
    } catch (e) { ERR('curl', e); }
  }

  function thumbVisMeshes(th) {
    const out = [];
    if (!th || !th.traverse) return out;
    th.traverse(function (o) {
      if (o.isMesh && o.userData && (o.userData.sculpt1249 || o.userData.nail1249)) out.push(o);
    });
    return out;
  }
  function restoreThumbVis(th) {
    thumbVisMeshes(th).forEach(function (m) {
      if (!m.userData._thVis0) return;
      m.position.copy(m.userData._thVis0.p);
      m.quaternion.copy(m.userData._thVis0.q);
    });
  }
  function applyThumbVis(kind) {
    try {
      const spec = U.__thumbVis && U.__thumbVis[kind];
      eachArm(function (arm) {
        const h = arm && arm.userData && arm.userData.p && arm.userData.p.h;
        const th = h && h.userData && h.userData.th;
        if (!th) return;
        const meshes = thumbVisMeshes(th);
        meshes.forEach(function (m) {
          if (!m.userData._thVis0) m.userData._thVis0 = {p: m.position.clone(), q: m.quaternion.clone()};
          m.position.copy(m.userData._thVis0.p);
          m.quaternion.copy(m.userData._thVis0.q);
        });
        if (!spec || !meshes.length) return;
        const pos = spec.pos || [0, 0, 0];
        const eul = spec.eul || [0, 0, 0];
        const qH = new T.Quaternion().setFromEuler(new T.Euler(eul[0] || 0, eul[1] || 0, eul[2] || 0, 'XYZ'));
        const tH = new T.Vector3(pos[0] || 0, pos[1] || 0, pos[2] || 0);
        h.updateMatrixWorld(true);
        meshes.forEach(function (m) {
          if (m.parent) m.parent.updateMatrixWorld(true);
          m.updateMatrixWorld(true);
          const wP = new T.Vector3(); m.getWorldPosition(wP);
          const wQ = new T.Quaternion(); m.getWorldQuaternion(wQ);
          const loc = h.worldToLocal(wP.clone());
          loc.applyQuaternion(qH).add(tH);
          const worldNew = h.localToWorld(loc);
          const hW = new T.Quaternion(); h.getWorldQuaternion(hW);
          const wQnew = hW.clone().multiply(qH).multiply(hW.clone().invert()).multiply(wQ);
          const parent = m.parent;
          if (!parent) return;
          parent.updateMatrixWorld(true);
          const inv = new T.Matrix4().copy(parent.matrixWorld).invert();
          m.position.copy(worldNew).applyMatrix4(inv);
          const pWq = new T.Quaternion(); parent.getWorldQuaternion(pWq);
          m.quaternion.copy(pWq.invert().multiply(wQnew));
        });
      });
    } catch (e) { ERR('thumbVis', e); }
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

  // Static rest trim on gun arm meshes only (not animation curves, not IK).
  // Shorten or hide forearm segments that enter the sight; always drop the
  // bare elbow / stray limb spheres; keep the hands on the gun.
  function trimGunArms(kind, ads) {
    try {
      const guns = (kind === 'musket' || kind === 'pistol');
      eachArm(function (arm) {
        const p = arm.userData && arm.userData.p;
        if (!p) return;
        if (guns) {
          arm.traverse(function (o) {
            if (!o.isMesh) return;
            const typ = o.geometry && o.geometry.type;
            if (typ !== 'SphereGeometry' && typ !== 'DodecahedronGeometry') return;
            if (o.userData && o.userData.pad1249) return;
            let x = o.parent, underHand = (o === p.h);
            while (x) { if (x === p.h) { underHand = true; break; } x = x.parent; }
            if (underHand) return;
            o.visible = false;
            o.userData.__hidSleeve1252 = 1;
          });
          if (p.el) { p.el.visible = false; p.el.userData.__hidSleeve1252 = 1; }
        }
        if (p.fo) {
          if (p.fo.userData._foS0 == null) {
            p.fo.userData._foS0 = {x: p.fo.scale.x || 1, y: p.fo.scale.y || 1, z: p.fo.scale.z || 1};
          }
          const s0 = p.fo.userData._foS0;
          if (guns && ads) {
            // ADS: hide or shrink the forearm so it cannot fill the sight.
            // Hands stay on the gun. Also shrink the sculpted wrist capsule
            // on the hand (it reads as a flesh column in the lens).
            if (kind === 'musket') p.fo.visible = false;
            else {
              p.fo.visible = true;
              p.fo.scale.set(s0.x * 0.55, s0.y * 0.30, s0.z * 0.55);
            }
            if (p.h) {
              p.h.children.forEach(function (o) {
                if (!o.isMesh) return;
                if (o.position && o.position.y < -0.02) {
                  if (o.userData._wS0 == null) o.userData._wS0 = {x: o.scale.x, y: o.scale.y, z: o.scale.z};
                  const w = o.userData._wS0;
                  o.scale.set(w.x * 0.55, w.y * 0.45, w.z * 0.55);
                  o.userData.__hidSleeve1252 = 0;
                }
              });
            }
          } else if (p.h) {
            p.h.children.forEach(function (o) {
              if (o.userData && o.userData._wS0) o.scale.set(o.userData._wS0.x, o.userData._wS0.y, o.userData._wS0.z);
            });
          } else if (guns && kind === 'musket') {
            // Hip: shorter visible forearm but leave enough to keep the
            // hand on the gun in frame.
            p.fo.visible = true;
            p.fo.scale.set(s0.x * 0.9, s0.y * 0.78, s0.z * 0.9);
          } else if (guns) {
            p.fo.visible = true;
            p.fo.scale.set(s0.x, s0.y, s0.z);
          } else if (p.fo.userData._foS0) {
            p.fo.visible = true;
            p.fo.scale.set(s0.x, s0.y, s0.z);
          }
        }
      });
    } catch (e) { ERR('trim', e); }
  }


  // Fallback local nudges for items that are not analytically seated
  // (cobble / map / pick keep a small rest offset). Not animation curves.
  const ITEM_NUDGE = {
    block:  {x: 0.00, y: 0.02, z: -0.040},
    pick:   {x: 0.00, y: 0.00, z: -0.018},
    p761:   {x: 0.00, y: 0.00, z: -0.018},
    p760:   {x: 0.00, y: 0.00, z: -0.018},
    map:    {x: 0.00, y: 0.06, z: 0.03}
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

  // Grip-space seating: put the item's grip point inside the closed fist
  // by an analytical world-space solve, not a guessed local nudge.
  // local p = grip point in the item's rest frame
  // local axis = shaft / bail tangent / blade in that frame
  // palm = point inside the closed fist in the sculpted hand's local frame
  //   (hand +Y along the fingers, +Z palmar, so the curl wraps a shaft along +X)
  // align: also rotate the item so its axis matches the through-fist axis.
  const GRIP = {
    torch:  {p: [0, -0.016, 0], axis: [0, 1, 0], palm: [0, 0.055, 0.020], align: 0},
    sword:  {p: [0, -0.075, 0], axis: [0, 1, 0], palm: [0, 0.055, 0.020], align: 0},
    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.055, 0.022], align: 0},
    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}
  };
  U.GRIP = GRIP;

  function holdingHand() {
    const fpa = W.__fpa;
    const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
    return rig && rig.userData && rig.userData.R || null;
  }

  function v3(a) { return new T.Vector3(a[0], a[1], a[2]); }

  function toCameraLocal(obj, local) {
    if (typeof camera === 'undefined' || !camera || !obj) return null;
    const v = local.clone();
    const chain = [];
    for (let o = obj; o; o = o.parent) {
      chain.push(o);
      if (o === camera) break;
    }
    if (!chain.length || chain[chain.length - 1] !== camera) return null;
    for (let i = 0; i < chain.length - 1; i++) {
      chain[i].updateMatrix();
      v.applyMatrix4(chain[i].matrix);
    }
    return v;
  }

  function parentCamMatrix(parent) {
    if (typeof camera === 'undefined' || !camera || !parent) return null;
    const m = new T.Matrix4().identity();
    const chain = [];
    for (let o = parent; o; o = o.parent) {
      chain.push(o);
      if (o === camera) break;
    }
    if (!chain.length || chain[chain.length - 1] !== camera) return null;
    // parent.matrix * ... * (child-of-camera).matrix  maps parent-local -> camera
    for (let i = chain.length - 2; i >= 0; i--) {
      chain[i].updateMatrix();
      m.multiply(chain[i].matrix);
    }
    return m;
  }

  function seatItem(kind) {
    const info = {kind: kind, seated: 0, errBefore: null, errAfter: null, why: null};
    U.gripInfo = info;
    try {
      try {
        if (typeof swingT !== 'undefined' && swingT > 0) { info.why = 'swing'; return false; }
        if (W.__rl && W.__rl.t > 0) { info.why = 'reload'; return false; }
        if (typeof rlT !== 'undefined' && rlT > 0) { info.why = 'reload'; return false; }
      } catch (_) {}
      const spec = GRIP[kind];
      if (!spec) { info.why = 'no-spec'; return false; }
      if (typeof held === 'undefined' || !held) { info.why = 'no-held'; return false; }
      const mesh = held.children && held.children[0];
      if (!mesh) { info.why = 'no-mesh'; return false; }
      const arm = holdingHand();
      const h = arm && arm.userData && arm.userData.p && arm.userData.p.h;
      if (!h) { info.why = 'no-hand'; return false; }
      if (typeof camera === 'undefined' || !camera) { info.why = 'no-cam'; return false; }

      const adsNow = isAds() ? 1 : 0;
      const key = kind + ':' + adsNow + ':' + (mesh.uuid || '');
      if (mesh.userData._seatKey !== key) {
        mesh.userData._seatKey = key;
        mesh.userData._seatP0 = mesh.position.clone();
        mesh.userData._seatQ0 = mesh.quaternion.clone();
      }
      // Aim poses already place the gun; do not fight them.
      if (adsNow && (kind === 'pistol' || kind === 'musket')) {
        mesh.position.copy(mesh.userData._seatP0);
        mesh.quaternion.copy(mesh.userData._seatQ0);
        info.why = 'ads';
        return false;
      }
      mesh.position.copy(mesh.userData._seatP0);
      mesh.quaternion.copy(mesh.userData._seatQ0);

      // Camera-local solve so a world-space camera pose cannot throw the
      // item across the map. Both the sculpted fist and the held item must
      // sit under the same camera.
      const palmC = toCameraLocal(h, v3(spec.palm));
      const gripC0 = toCameraLocal(mesh, v3(spec.p));
      const originC = toCameraLocal(mesh, new T.Vector3(0, 0, 0));
      if (!palmC || !gripC0 || !originC) {
        info.why = 'not-under-cam';
        info.palmUnder = !!palmC;
        info.itemUnder = !!gripC0;
        return false;
      }
      const err0 = palmC.distanceTo(gripC0);
      info.errBefore = +err0.toFixed(4);
      info.palmC = [+palmC.x.toFixed(3), +palmC.y.toFixed(3), +palmC.z.toFixed(3)];
      info.gripC = [+gripC0.x.toFixed(3), +gripC0.y.toFixed(3), +gripC0.z.toFixed(3)];
      // A closed fist is ~0.08 across. Anything over half a metre is a
      // mismatched space — refuse rather than throw the item off-screen.
      if (!(err0 < 0.80) || !isFinite(err0)) {
        info.why = 'err-too-large';
        return false;
      }

      if (spec.align && mesh.parent) {
        const axisWant = new T.Vector3(1, 0, 0);
        const axisNow = v3(spec.axis);
        // transform directions through the same camera-local chains
        const palm0 = toCameraLocal(h, new T.Vector3(0, 0, 0));
        const palmX = toCameraLocal(h, new T.Vector3(1, 0, 0));
        const g0 = toCameraLocal(mesh, new T.Vector3(0, 0, 0));
        const gA = toCameraLocal(mesh, v3(spec.axis));
        if (palm0 && palmX && g0 && gA) {
          axisWant.copy(palmX).sub(palm0).normalize();
          axisNow.copy(gA).sub(g0).normalize();
          if (axisNow.lengthSq() > 1e-8 && axisWant.lengthSq() > 1e-8) {
            if (axisNow.dot(axisWant) < 0) axisWant.negate();
            const q = new T.Quaternion().setFromUnitVectors(axisNow, axisWant);
            mesh.quaternion.premultiply(q);
          }
        }
      }

      const gripC = toCameraLocal(mesh, v3(spec.p)) || gripC0;
      const originC2 = toCameraLocal(mesh, new T.Vector3(0, 0, 0)) || originC;
      const palmC2 = toCameraLocal(h, v3(spec.palm)) || palmC;
      const deltaC = palmC2.clone().sub(gripC);
      const targetC = originC2.clone().add(deltaC);
      const pm = parentCamMatrix(mesh.parent);
      if (!pm) { info.why = 'no-parent-cam'; return false; }
      const inv = pm.clone().invert();
      if (!inv) { info.why = 'no-invert'; return false; }
      targetC.applyMatrix4(inv);
      mesh.position.copy(targetC);

      const grip1 = toCameraLocal(mesh, v3(spec.p));
      const palm1 = toCameraLocal(h, v3(spec.palm));
      info.errAfter = (grip1 && palm1) ? +palm1.distanceTo(grip1).toFixed(4) : null;
      info.seated = 1;
      return true;
    } catch (e) {
      info.why = String(e && e.message || e);
      ERR('seat', e);
      return false;
    }
  }

  function placeItem(kind) {
    if (GRIP[kind]) {
      const ok = seatItem(kind);
      if (!ok && ITEM_NUDGE[kind]) nudgeItem(kind);
    } else {
      U.gripInfo = {kind: kind, seated: 0, why: 'nudge'};
      nudgeItem(kind);
    }
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
      let tgt = FRAME[fkey] || FRAME[k] || FRAME.other;
      if (U.__palmBowl && U.__bowl && U.__bowl[k] && U.__bowl[k].frame) {
        tgt = Object.assign({}, tgt, U.__bowl[k].frame);
      }
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
      placeItem(k);
      trimGunArms(k, ads);
      hideLeftoverCubes();
      trimToolCuff(k);
      trimAdsDebris(k, ads);
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
  const PALM_ROLL = {empty: -1.50, block: -1.45, map: -1.30};
  U.PALM_ROLL = PALM_ROLL;
  // Euler pose kept only as a diagnostic fallback. Live empty/cobble/map
  // aim the palmar normal (local -Z — palmGeo hollows z<0) at the camera.
  const PALM_POSE = {
    empty: {y: -1.55, x: 0.00, z: -0.40},
    block: {y: -1.50, x: 0.00, z: -0.35},
    map:   {y: -1.35, x: 0.00, z: -0.20}
  };
  U.PALM_POSE = PALM_POSE;
  const PALM_AIM = {};
  U.PALM_AIM = PALM_AIM;
  U.__palmSwing = 0;
  U.__thumbAim = 0;
  U.__thumbLive = 0;
  U.__palmFlip = 0;
  U.__palmBowl = 0;
  U.__bowl = {};
  U.__thumbVis = {};
  U.__adsHideLeft = 1;
  U.__adsHideWrist = 0;
  U.__adsHideRThumb = 1;
  // Musket ADS only (gated in trimAdsDebris): hide right-hand finger 3
  // (pinky) so the U-shaped loop over the rear sight is gone. Pistol ADS
  // and hip poses are unchanged.
  U.__adsHideFingers = [3];
  U.__adsHideOver = 0;
  // Override from a diagnostic: __palmAxis, __palmWant (camera space).
  U.__palmAxis = [0, 0, -1];
  U.__palmWant = [0, 0.85, 0.55];
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
      const p = arm && arm.userData && arm.userData.p;
      const h = p && p.h;
      if (h && h.userData && h.userData._palmTag) { h.userData._palmTag.applied = 0; h.userData._palmTag.baseQ = null; }
      if (p) p._bowl0 = null;
    });
  }

  function rotateAround(obj, pivot, axis, ang) {
    if (!obj || !ang) return;
    const q = new T.Quaternion().setFromAxisAngle(axis, ang);
    const r = obj.position.clone().sub(pivot);
    r.applyQuaternion(q);
    obj.position.copy(pivot).add(r);
    obj.quaternion.premultiply(q);
  }

  // Per-item rest for empty / cobble / map: drop the wrist and cuff below
  // the frame, pitch the forearm forward, then supinate around the
  // forearm's own long axis (local +Y of p.fo, elbow -> wrist). This is
  // not a camera-axis flip — those kept showing the dorsum.
  function applyPalmBowl(arm, kind) {
    const spec = U.__bowl && U.__bowl[kind];
    if (!spec) return;
    const p = arm && arm.userData && arm.userData.p;
    if (!p || !p.fo || !p.h) return;
    if (!p._bowl0) {
      p._bowl0 = {
        foP: p.fo.position.clone(), foQ: p.fo.quaternion.clone(),
        hP: p.h.position.clone(), hQ: p.h.quaternion.clone(),
        cuffP: p.cuff ? p.cuff.position.clone() : null,
        cuffQ: p.cuff ? p.cuff.quaternion.clone() : null
      };
    } else {
      const s = p._bowl0;
      p.fo.position.copy(s.foP); p.fo.quaternion.copy(s.foQ);
      p.h.position.copy(s.hP); p.h.quaternion.copy(s.hQ);
      if (p.cuff && s.cuffP) { p.cuff.position.copy(s.cuffP); p.cuff.quaternion.copy(s.cuffQ); }
    }
    const foAxis = new T.Vector3(0, 1, 0).applyQuaternion(p.fo.quaternion);
    if (foAxis.lengthSq() < 1e-10) return;
    foAxis.normalize();
    const pitch = spec.pitch || 0;
    const sup = (spec.sup != null) ? spec.sup : 0;
    const parts = [p.fo, p.h];
    if (p.cuff) parts.push(p.cuff);
    if (pitch) {
      const mode = spec.pitchOf || 'palm';
      let pivot, pax;
      if (mode === 'elb' && p.el) pivot = p.el.position.clone();
      else {
        p.h.updateMatrix();
        pivot = new T.Vector3(0, 0.05, 0).applyMatrix4(p.h.matrix);
      }
      if (spec.pax && spec.pax.length === 3) pax = new T.Vector3(spec.pax[0], spec.pax[1], spec.pax[2]);
      else {
        // Horizontal axis perpendicular to the forearm, so a pitch
        // drops the wrist / raises the fingers rather than rolling.
        const upHint = new T.Vector3(0, 1, 0);
        pax = new T.Vector3().crossVectors(foAxis, upHint);
        if (pax.lengthSq() < 1e-8) pax.crossVectors(foAxis, new T.Vector3(1, 0, 0));
      }
      if (pax.lengthSq() > 1e-10) {
        pax.normalize();
        parts.forEach(function (o) { rotateAround(o, pivot, pax, pitch); });
      }
    }
    if (sup) {
      const foAxis2 = new T.Vector3(0, 1, 0).applyQuaternion(p.fo.quaternion);
      if (foAxis2.lengthSq() > 1e-10) {
        foAxis2.normalize();
        const pivot2 = p.el ? p.el.position.clone() : p.fo.position.clone();
        parts.forEach(function (o) { rotateAround(o, pivot2, foAxis2, sup); });
      }
    }
  }
  // Idempotent: undo a roll already applied this frame, then apply the current amount once.
  function restPalm(kind) {
    try {
      try {
        if (typeof swingT !== 'undefined' && swingT > 0) return;
        if (W.__rl && W.__rl.t > 0) return;
        if (typeof rlT !== 'undefined' && rlT > 0) return;
      } catch (_) {}
      const aim = PALM_AIM[kind];
      const pose = (!aim && PALM_POSE[kind]) ? PALM_POSE[kind] : null;
      palmHands(function (arm) {
        const h = arm && arm.userData && arm.userData.p && arm.userData.p.h;
        if (!h || !h.quaternion) return;
        const side = (arm.userData && arm.userData.side) || 1;
        if (!h.userData._palmTag) h.userData._palmTag = {applied: 0, y: 0, x: 0, z: 0, baseQ: null};
        const tag = h.userData._palmTag;
        if (!tag.baseQ) tag.baseQ = h.quaternion.clone();
        else h.quaternion.copy(tag.baseQ);
        tag.applied = 0; tag.y = 0; tag.x = 0; tag.z = 0;
        if (U.__palmBowl && U.__bowl && U.__bowl[kind]) {
          applyPalmBowl(arm, kind);
          tag.applied = 1;
          return;
        }
        if (U.__palmSwing) {
          // Clamped two-step: swing the wrist/elbow axis toward camera-down
          // (so the cap is not presented), then twist around the finger axis
          // to show the palm. Angle is capped so the hand stays on the forearm.
          const maxA = (U.__palmSwingMax != null) ? U.__palmSwingMax : 0.70;
          const wantWristA = U.__palmWristWant || [0.20, -1.00, -0.15];
          const palmar = U.__palmAxis || [0, 0, -1];
          const wantPalmA = U.__palmWant || [0, 0.50, 0.85];
          const originC = toCameraLocal(h, new T.Vector3(0, 0, 0));
          const yNegC = toCameraLocal(h, new T.Vector3(0, -1, 0));
          const palmC = toCameraLocal(h, new T.Vector3(palmar[0], palmar[1], palmar[2]));
          const yC = toCameraLocal(h, new T.Vector3(0, 1, 0));
          if (originC && yNegC && palmC && yC) {
            const wristDir = yNegC.sub(originC.clone());
            if (wristDir.lengthSq() > 1e-10) {
              wristDir.normalize();
              const wantW = new T.Vector3(wantWristA[0], wantWristA[1], wantWristA[2]);
              if (wantW.lengthSq() > 1e-10) wantW.normalize();
              let qSwing = new T.Quaternion().setFromUnitVectors(wristDir, wantW);
              const ea = 2 * Math.acos(Math.min(1, Math.abs(qSwing.w)));
              if (ea > maxA && ea > 1e-6) {
                const t = maxA / ea;
                qSwing = new T.Quaternion().slerpQuaternions(new T.Quaternion(), qSwing, t);
              }
              function toLocal(qCam) {
                const pm = parentCamMatrix(h.parent || h);
                if (!pm) return qCam;
                const rot = new T.Matrix4().extractRotation(pm);
                const qParent = new T.Quaternion().setFromRotationMatrix(rot);
                return qParent.clone().invert().multiply(qCam).multiply(qParent);
              }
              if (ea > 1e-5) h.quaternion.premultiply(toLocal(qSwing));
              // Twist around the (now updated) finger axis.
              const origin2 = toCameraLocal(h, new T.Vector3(0, 0, 0));
              const palm2 = toCameraLocal(h, new T.Vector3(palmar[0], palmar[1], palmar[2]));
              const y2 = toCameraLocal(h, new T.Vector3(0, 1, 0));
              if (origin2 && palm2 && y2) {
                const now = palm2.sub(origin2.clone());
                const axisY = y2.sub(origin2.clone());
                if (now.lengthSq() > 1e-10 && axisY.lengthSq() > 1e-10) {
                  now.normalize(); axisY.normalize();
                  const wantP = new T.Vector3(wantPalmA[0], wantPalmA[1], wantPalmA[2]);
                  if (wantP.lengthSq() > 1e-10) wantP.normalize();
                  const nowP = now.clone().sub(axisY.clone().multiplyScalar(now.dot(axisY)));
                  const wantPP = wantP.clone().sub(axisY.clone().multiplyScalar(wantP.dot(axisY)));
                  if (nowP.lengthSq() > 1e-8 && wantPP.lengthSq() > 1e-8) {
                    nowP.normalize(); wantPP.normalize();
                    const qTw = new T.Quaternion().setFromUnitVectors(nowP, wantPP);
                    h.quaternion.premultiply(toLocal(qTw));
                  }
                }
              }
              const wristC = toCameraLocal(h, new T.Vector3(0, -0.05, 0));
              const palmPt = toCameraLocal(h, new T.Vector3(0, 0.05, 0));
              const presented = !!(wristC && palmPt && wristC.z > palmPt.z + 0.03);
              if (presented) {
                h.quaternion.copy(tag.baseQ);
                const euler = PALM_POSE[kind];
                if (euler) {
                  const y = side * (euler.y || 0);
                  const x = euler.x || 0;
                  const z = side * (euler.z || 0);
                  if (y) h.rotateY(y);
                  if (x) h.rotateX(x);
                  if (z) h.rotateZ(z);
                  tag.y = y; tag.x = x; tag.z = z;
                }
              }
              tag.applied = 1;
            }
          }
        } else if (aim) {
          const palmar = U.__palmAxis || [0, 0, -1];
          const wantA = U.__palmWant || [0, 0.70, 0.70];
          const originC = toCameraLocal(h, new T.Vector3(0, 0, 0));
          const palmC = toCameraLocal(h, new T.Vector3(palmar[0], palmar[1], palmar[2]));
          const yC = toCameraLocal(h, new T.Vector3(0, 1, 0));
          if (originC && palmC && yC) {
            const now = palmC.sub(originC);
            const axisY = yC.sub(originC.clone());
            if (now.lengthSq() > 1e-10 && axisY.lengthSq() > 1e-10) {
              now.normalize();
              axisY.normalize();
              const want = new T.Vector3(wantA[0], wantA[1], wantA[2]);
              if (want.lengthSq() > 1e-10) want.normalize();
              // Twist only: rotate around the finger axis so the wrist
              // cannot pitch into the lens (that was the p14 aim failure).
              const nowP = now.clone().sub(axisY.clone().multiplyScalar(now.dot(axisY)));
              const wantP = want.clone().sub(axisY.clone().multiplyScalar(want.dot(axisY)));
              let qCam = null;
              if (nowP.lengthSq() > 1e-8 && wantP.lengthSq() > 1e-8) {
                nowP.normalize();
                wantP.normalize();
                qCam = new T.Quaternion().setFromUnitVectors(nowP, wantP);
              }
              if (qCam) {
                const pm = parentCamMatrix(h.parent || h);
                let qLocal = qCam;
                if (pm) {
                  const rot = new T.Matrix4().extractRotation(pm);
                  const qParent = new T.Quaternion().setFromRotationMatrix(rot);
                  qLocal = qParent.clone().invert().multiply(qCam).multiply(qParent);
                }
                h.quaternion.premultiply(qLocal);
                // Safety: if the wrist is now closer to the camera than the
                // palm, we presented the cap — undo and use the Euler pose.
                const wristC = toCameraLocal(h, new T.Vector3(0, -0.05, 0));
                const palmPt = toCameraLocal(h, new T.Vector3(0, 0.05, 0));
                const presented = !!(wristC && palmPt && wristC.z > palmPt.z + 0.03);
                if (presented) {
                  h.quaternion.copy(tag.baseQ);
                  const euler = PALM_POSE[kind];
                  if (euler) {
                    const y = side * (euler.y || 0);
                    const x = euler.x || 0;
                    const z = side * (euler.z || 0);
                    if (y) h.rotateY(y);
                    if (x) h.rotateX(x);
                    if (z) h.rotateZ(z);
                    tag.y = y; tag.x = x; tag.z = z;
                  }
                }
                tag.applied = 1;
              }
            }
          }
        } else if (pose) {
          const y = side * (pose.y || 0);
          const x = pose.x || 0;
          const z = side * (pose.z || 0);
          if (y) h.rotateY(y);
          if (x) h.rotateX(x);
          if (z) h.rotateZ(z);
          tag.y = y; tag.x = x; tag.z = z; tag.applied = 1;
        }
        // After a known-good dorsum pose, flip around an axis in the
        // camera plane so the palmar face comes toward the lens while
        // the wrist stays down. Camera-forward (Z) would only invert
        // the dorsum; camera-up / the on-screen finger axis is the
        // flip that reveals the palm.
        if (U.__palmFlip && tag.applied) {
          const originC = toCameraLocal(h, new T.Vector3(0, 0, 0));
          const yC = toCameraLocal(h, new T.Vector3(0, 1, 0));
          let axis = null;
          const mode = U.__palmFlipMode || 'finger';
          if (mode === 'camY') axis = new T.Vector3(0, 1, 0);
          else if (mode === 'camX') axis = new T.Vector3(1, 0, 0);
          else if (mode === 'camZ') axis = new T.Vector3(0, 0, 1);
          else if (originC && yC) {
            axis = yC.sub(originC.clone());
            axis.z = 0; // project onto the camera XY / screen plane
            if (axis.lengthSq() < 1e-8) axis = new T.Vector3(0, 1, 0);
            else axis.normalize();
          } else axis = new T.Vector3(0, 1, 0);
          const ang = (U.__palmFlipA != null) ? U.__palmFlipA : Math.PI;
          const qCam = new T.Quaternion().setFromAxisAngle(axis, ang);
          const pm = parentCamMatrix(h.parent || h);
          let qLocal = qCam;
          if (pm) {
            const rot = new T.Matrix4().extractRotation(pm);
            const qParent = new T.Quaternion().setFromRotationMatrix(rot);
            qLocal = qParent.clone().invert().multiply(qCam).multiply(qParent);
          }
          h.quaternion.premultiply(qLocal);
          const wristC = toCameraLocal(h, new T.Vector3(0, -0.05, 0));
          const palmPt = toCameraLocal(h, new T.Vector3(0, 0.05, 0));
          const presented = !!(wristC && palmPt && wristC.z > palmPt.z + 0.03);
          if (presented) {
            // Undo only the flip; keep the dorsum pose rather than
            // throwing the wrist into the lens.
            h.quaternion.copy(tag.baseQ);
            if (pose) {
              const y = side * (pose.y || 0);
              const x = pose.x || 0;
              const z = side * (pose.z || 0);
              if (y) h.rotateY(y);
              if (x) h.rotateX(x);
              if (z) h.rotateZ(z);
            }
          }
        }
      });
    } catch (e) { ERR('palm', e); }
  }

  function hideLeftoverCubes() {
    try {
      function sweep(root) {
        if (!root || !root.traverse) return;
        root.traverse(function (o) {
          if (!o.isMesh) return;
          if (isItemMesh(o)) return;
          // Never hide the held item even if it lives under `hand`.
          try {
            if (typeof held !== 'undefined' && held) {
              for (let n = o; n; n = n.parent) if (n === held) return;
            }
          } catch (_) {}
          const u = o.userData || {};
          if (u.sculpt1249 || u.nail1249 || u.sculptKeep || u.sleeve1257 || u.tapered1257 || u.folded1249 || u.roll1257 || u.sculptGeo1249) return;
          const typ = o.geometry && o.geometry.type;
          if (typ === 'BoxGeometry' || typ === 'SphereGeometry' || typ === 'CylinderGeometry' || typ === 'DodecahedronGeometry') {
            o.visible = false;
            u.sculptHidden = 1;
            o.userData = u;
          }
        });
      }
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : null);
      sweep(rig);
    } catch (_) {}
  }

  // Torch / sword: hide the long upper-arm linen so it cannot fill the
  // frame as a wall. Keep a short cuff hem at the wrist (scale + slide
  // along +Y so the distal rolled edge stays on the wrist).
  function trimToolCuff(kind) {
    try {
      const tools = (kind === 'sword');
      eachArm(function (arm) {
        const p = arm.userData && arm.userData.p;
        if (!p) return;
        if (p.up) {
          if (tools) { p.up.visible = false; p.up.userData.__hidCuff1252 = 1; }
          else if (p.up.userData && p.up.userData.__hidCuff1252) {
            p.up.visible = true; p.up.userData.__hidCuff1252 = 0;
          }
        }
        if (p.el && tools) { p.el.visible = false; p.el.userData.__hidCuff1252 = 1; }
        else if (p.el && p.el.userData && p.el.userData.__hidCuff1252) {
          p.el.visible = true; p.el.userData.__hidCuff1252 = 0;
        }
        if (p.cuff) {
          if (!p.cuff.userData._cS0) {
            p.cuff.userData._cS0 = {x: p.cuff.scale.x, y: p.cuff.scale.y, z: p.cuff.scale.z};
            p.cuff.userData._cP0 = {x: p.cuff.position.x, y: p.cuff.position.y, z: p.cuff.position.z};
          }
          const s0 = p.cuff.userData._cS0, p0 = p.cuff.userData._cP0;
          if (tools) {
            const kCuff = 0.55;
            p.cuff.visible = true;
            p.cuff.scale.set(s0.x, s0.y * kCuff, s0.z);
            // cuff geo is 0.145 along +Y toward the wrist; keep the hem there.
            p.cuff.position.set(p0.x, p0.y + 0.145 * s0.y * (1 - kCuff), p0.z);
          } else {
            p.cuff.scale.set(s0.x, s0.y, s0.z);
            p.cuff.position.set(p0.x, p0.y, p0.z);
          }
        }
      });
    } catch (e) { ERR('cuff', e); }
  }

  // Musket ADS: hide sculpted wrist capsules and leftover box shards so
  // they cannot sit in the sight. Restored as soon as ADS ends.
  function trimAdsDebris(kind, ads) {
    try {
      eachArm(function (arm) {
        const p = arm.userData && arm.userData.p;
        if (!p || !p.h) return;
        const gunsAds = ads && (kind === 'musket' || kind === 'pistol');
        const keep = {};
        try {
          const fingers = (p.h.userData && p.h.userData.f) || [];
          for (let i = 0; i < fingers.length; i++) {
            const pair = fingers[i];
            const f = pair && (pair.isObject3D ? pair : pair[0]);
            if (f) keep[f.uuid] = 1;
            const k = pair && pair[1];
            if (k) keep[k.uuid] = 1;
            const d = k && k.userData && k.userData.d;
            if (d) keep[d.uuid] = 1;
          }
          if (p.h.userData && p.h.userData.th) keep[p.h.userData.th.uuid] = 1;
        } catch (_) {}
        function underKeep(o) {
          for (let n = o; n && n !== p.h; n = n.parent) if (keep[n.uuid]) return true;
          return false;
        }
        // Gun ADS: by default keep finger / thumb meshes and hide palm,
        // wrist, forearm, cuff and leftover primitives. Optional
        // U.__adsHideLeft hides the whole support (left) arm so sliced
        // scraps cannot sit in the sight; the right hand stays on the gun.
        const side = (arm.userData && arm.userData.side) || 1;
        const hideLeft = !!(gunsAds && U.__adsHideLeft && side < 0);
        const hideWrist = !!(gunsAds && U.__adsHideWrist);
        const hideRThumb = !!(gunsAds && U.__adsHideRThumb && side > 0);
        const hideIdx = (gunsAds && kind === 'musket' && side > 0 && Array.isArray(U.__adsHideFingers)) ? U.__adsHideFingers : null;
        const hideOver = !!(gunsAds && kind === 'musket' && side > 0 && U.__adsHideOver);
        const th = p.h.userData && p.h.userData.th;
        const fingers = (p.h.userData && p.h.userData.f) || [];
        const hideRoots = [];
        if (hideIdx) {
          for (let i = 0; i < hideIdx.length; i++) {
            const pair = fingers[hideIdx[i]];
            const f = pair && (pair.isObject3D ? pair : pair[0]);
            if (f) hideRoots.push(f);
          }
        }
        arm.traverse(function (o) {
          if (!o.isMesh) return;
          if (isItemMesh(o)) return;
          const typ = o.geometry && o.geometry.type;
          const u = o.userData || {};
          const leftover = !u.sculpt1249 && !u.nail1249 && !u.sculptGeo1249 && !u.sleeve1257 && !u.tapered1257 && !u.folded1249 &&
            (typ === 'BoxGeometry' || typ === 'CylinderGeometry' || typ === 'DodecahedronGeometry');
          const cap = !!u.wristCap1249;
          let wristChild = false;
          if (hideWrist && o.parent === p.h && o.position && o.position.y < -0.02) wristChild = true;
          let underThumb = false;
          if (hideRThumb && th) {
            for (let n = o; n && n !== p.h; n = n.parent) if (n === th) { underThumb = true; break; }
          }
          let underFinger = false;
          if (hideRoots.length) {
            for (let n = o; n && n !== p.h; n = n.parent) {
              for (let i = 0; i < hideRoots.length; i++) if (n === hideRoots[i]) { underFinger = true; break; }
              if (underFinger) break;
            }
          }
          let overSight = false;
          if (hideOver && underKeep(o) && !underThumb) {
            const pc = toCameraLocal(o, new T.Vector3(0, 0, 0));
            const limX = (U.__adsOverX != null) ? U.__adsOverX : 0.028;
            const limY = (U.__adsOverY != null) ? U.__adsOverY : -0.045;
            if (pc && Math.abs(pc.x) < limX && pc.y > limY) overSight = true;
          }
          if (gunsAds && (hideLeft || !underKeep(o) || leftover || cap || wristChild || underThumb || underFinger || overSight)) {
            o.visible = false;
            o.userData.__hidAds1252 = 1;
          } else if (o.userData && o.userData.__hidAds1252) {
            o.visible = true;
            o.userData.__hidAds1252 = 0;
          }
        });
      });
    } catch (e) { ERR('ads-debris', e); }
  }

  function repose() {
    try {
      const k = kindOf();
      const ads = isAds();
      curlFingers(k, ads);
      restPalm(k);
      placeItem(k);
      trimGunArms(k, ads);
      hideLeftoverCubes();
      if (k === 'musket' || k === 'pistol') hideGunSleeves();
      else showGunSleeves();
      trimToolCuff(k);
      trimAdsDebris(k, ads);
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
