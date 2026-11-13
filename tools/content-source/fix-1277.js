/* GLX-FIX1277 (v1.2.77): Reverted 1.2.76 cave/view-distance changes (lag).

   Render, chunk meshing, cave culling, stream radius, the far plane,
   fog, the render-distance slider and its defaults are restored to
   exactly how they were in 1.2.75. The 1.2.76 underground full-mesh,
   head-cover-to-world-top, adaptive view distance, LOD heightmap
   ring and idle far-chunk pump are gone — they caused lag.

   The 1.2.76 live-map seating is kept (this IIFE, map parts only).
   Guns, muskets, and the 1.2.75 potion-style pickaxe / bucket /
   torch grip are not touched. This IIFE never wraps held-frame
   apply / repose or renderer.render. First-person hands stay
   hidden in third person. The gold D-pad is left alone. */

/* GLX-FIX1276 (v1.2.76): map is held in the hand.

   The live C112 chart is seated in the current __fpa palm-bowl: the
   palm is under the sheet, the thumb and fingers meet its bottom
   edge, and the chart stays tilted up, close and readable, with live
   terrain, the player marker and heading. The hand pose itself is
   not changed and the hands are not replaced. The sheet attaches
   only while the map item is held.

   v1.2.77 removed every cave / view-distance / LOD / adaptive /
   far-plane / idle-pump / head-cover / remesh path that 1.2.76
   added. This IIFE never wraps held-frame apply / repose or
   renderer.render, and it never touches a gun, musket, or the
   1.2.75 potion-style pickaxe / bucket / torch grip. First-person
   hands stay hidden in third person. The gold D-pad is left alone. */
(function fix1276() {
  const U = window.__fix1276 = {
    err: null, on: 1, version: '1.2.76',
    mapSeat: 0, mapStash: 0, skippedGun: 0,
    lastWhy: ''
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const THREE_ = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;
  const isTouch = () => {
    try { if (typeof touchMode !== 'undefined' && touchMode) return true; } catch (_) {}
    try { return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (_) { return false; }
  };
  function selIdNow() {
    try { if (typeof selId !== 'undefined') return selId; } catch (_) {}
    return null;
  }
  function isWeapon() {
    try {
      if (window.__fix1275 && typeof __fix1275.isWeapon === 'function') return !!__fix1275.isWeapon();
    } catch (_) {}
    try {
      const id = selIdNow();
      if (id == null) return false;
      if (typeof GUN !== 'undefined' && GUN && GUN[id]) return true;
      if (id === 212 || id === 213) return true;
      const IT_ = (typeof IT !== 'undefined') ? IT : {};
      if (IT_.PISTOL && id === IT_.PISTOL) return true;
      if (IT_.MUSKET && id === IT_.MUSKET) return true;
    } catch (_) {}
    return false;
  }
  function isMapId(id) {
    if (id == null) return false;
    try {
      if (id === 410) return true;
      if (typeof IT !== 'undefined' && IT.MAP && id === IT.MAP) return true;
    } catch (_) {}
    return false;
  }
  function isMapHeld() {
    try {
      if (isMapId(selIdNow())) return true;
      const H = window.__heldFrame1251;
      if (H && H.kind === 'map') return true;
    } catch (_) {}
    return false;
  }
  function isTp() {
    try { if (typeof camMode !== 'undefined' && camMode) return true; } catch (_) {}
    try { if (window.__thirdPerson) return true; } catch (_) {}
    return false;
  }

  /* ===================================================================
     1. Live map seated in the current __fpa hand (palm under, fingers
        on the bottom edge). Does not change the hand pose.
     =================================================================== */
  function holdingHand() {
    try {
      const fpa = window.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.rig);
      const arm = rig && rig.userData && rig.userData.R;
      const p = arm && arm.userData && arm.userData.p;
      return p && p.h ? p.h : null;
    } catch (_) { return null; }
  }

  function getLiveSheet() {
    try {
      const C = window.__c112;
      if (!C) return null;
      if (C._sheet1274 && C._sheet1274.isObject3D) return C._sheet1274;
      if (C.inset && C.inset.parent && C.inset.parent.isObject3D) return C.inset.parent;
    } catch (_) {}
    return null;
  }

  function ensureStash() {
    try {
      if (window.__mapStash1274 && window.__mapStash1274.isObject3D) return window.__mapStash1274;
      const T = THREE_();
      const sc = (typeof scene !== 'undefined' && scene) || window.scene;
      if (!T || !sc) return null;
      const st = new T.Group();
      st.name = '__mapStash1276';
      st.visible = false;
      sc.add(st);
      window.__mapStash1274 = st;
      return st;
    } catch (e) { ERR('stashG', e); return null; }
  }

  function stashSheet(sheet) {
    const s = sheet || getLiveSheet();
    if (!s) return;
    const st = ensureStash();
    try {
      if (st && s.parent !== st) st.add(s);
      s.visible = false;
      U.mapStash++;
      try {
        const C = window.__c112;
        if (C && C.inset && C.inset._p1276x != null) {
          C.inset.position.x = C.inset._p1276x;
          C.inset._p1276x = null;
        }
      } catch (_) {}
    } catch (e) { ERR('stash', e); }
  }

  /* World-space point where the fingers meet the bottom edge: average
     of the mid-joints, falling back to the palmar surface. */
  function fingerSupport(hand, T) {
    const pts = [];
    try {
      const fingers = (hand.userData && hand.userData.f) || [];
      for (let i = 0; i < fingers.length; i++) {
        const pair = fingers[i];
        const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
        const k = (pair && pair[1]) || (f && f.userData && f.userData.k);
        const obj = k || f;
        if (!obj || !obj.updateMatrixWorld) continue;
        obj.updateMatrixWorld(true);
        const v = new T.Vector3();
        obj.getWorldPosition(v);
        /* A little along the finger's local +Y puts us on the pad. */
        const along = new T.Vector3(0, 0.018, 0);
        along.transformDirection(obj.matrixWorld);
        v.add(along);
        pts.push(v);
      }
    } catch (e) { ERR('fingers', e); }
    const bottom = new T.Vector3();
    if (pts.length) {
      for (let i = 0; i < pts.length; i++) bottom.add(pts[i]);
      bottom.multiplyScalar(1 / pts.length);
    } else {
      hand.updateMatrixWorld(true);
      hand.localToWorld(bottom.set(0, 0.078, 0.016));
    }
    /* Palm centre, used so the sheet sits ON the palm, not past it. */
    const palm = new T.Vector3();
    hand.updateMatrixWorld(true);
    hand.localToWorld(palm.set(0, 0.045, 0.016));
    return { bottom: bottom, palm: palm, n: pts.length };
  }

  /* E-palm: bottom edge at the __fpa palm, sheet extending up toward
     the eyes. parent.worldToLocal so we never fight 1275's `held`. */
  U.pose = { toward: 0.030, up: 0.000, scale: 1.00, inset: 0.62, tilt: 0.22, depthTest: 1,
    palmX: 0, palmY: 0.05, palmZ: 0.02, right: 0.14 };

  function addWorld(obj, parent, dir, amt, T) {
    const o = parent.worldToLocal(parent.getWorldPosition(new T.Vector3()));
    const t2 = parent.worldToLocal(parent.getWorldPosition(new T.Vector3()).addScaledVector(dir, amt));
    obj.position.add(t2.sub(o));
  }

  function poseInPalm(plane) {
    const T = THREE_();
    const cam = (typeof camera !== 'undefined' && camera) || window.camera;
    const hand = holdingHand();
    const parent = plane && plane.parent;
    if (!T || !plane || !cam || !parent) return false;
    try {
      parent.updateWorldMatrix(true, true);
      cam.updateWorldMatrix(true, true);
      if (hand) hand.updateWorldMatrix(true, true);

      const cfg = U.pose || {};
      const tilt = (cfg.tilt != null) ? cfg.tilt : 0.22;
      const scale = (cfg.scale != null) ? cfg.scale : 1.10;
      const inset = (cfg.inset != null) ? cfg.inset : 0.86;
      const toward = (cfg.toward != null) ? cfg.toward : 0.025;
      const up = (cfg.up != null) ? cfg.up : 0.010;
      const useDepth = !!cfg.depthTest;

      const towardCam = new T.Vector3(0, 0, 1).transformDirection(cam.matrixWorld).normalize();
      const camUp = new T.Vector3(0, 1, 0).transformDirection(cam.matrixWorld).normalize();
      const face = towardCam.clone().addScaledVector(camUp, tilt).normalize();
      const yDir = camUp.clone().addScaledVector(face, -camUp.dot(face));
      if (yDir.lengthSq() < 1e-8) yDir.set(0, 1, 0);
      yDir.normalize();
      const xDir = new T.Vector3().crossVectors(yDir, face).normalize();
      yDir.crossVectors(face, xDir).normalize();
      const qWorld = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(xDir, yDir, face));

      const qParent = parent.getWorldQuaternion(new T.Quaternion());
      plane.quaternion.copy(qParent.clone().invert().multiply(qWorld));
      plane.scale.setScalar(scale);

      const half = 0.34 * scale * 0.5;
      if (hand) {
        /* Bottom edge sits on the palmar surface; the sheet extends up
           so the fingers meet that edge and the palm stays under it. */
        const anchor = hand.localToWorld(new T.Vector3(
          cfg.palmX != null ? cfg.palmX : 0,
          cfg.palmY != null ? cfg.palmY : 0.05,
          cfg.palmZ != null ? cfg.palmZ : 0.02
        ));
        const bottomOff = new T.Vector3(0, -half * inset, 0).applyQuaternion(qWorld);
        const want = anchor.clone().sub(bottomOff);
        want.addScaledVector(towardCam, toward);
        want.addScaledVector(camUp, up);
        const right = (cfg.right != null) ? cfg.right : 0.14;
        if (right) {
          const camRight = new T.Vector3(1, 0, 0).transformDirection(cam.matrixWorld).normalize();
          want.addScaledVector(camRight, right);
        }
        plane.position.copy(parent.worldToLocal(want));
        U._want = [want.x, want.y, want.z];
        /* Hang the compass inset off the bottom-right so it does not
           cover the palm and fingers on the left edge. */
        try {
          const C = window.__c112;
          if (C && C.inset) {
            if (C.inset._p1276x == null) C.inset._p1276x = C.inset.position.x;
            C.inset.position.x = 0.09;
          }
        } catch (_) {}
      } else {
        /* Fallback if the rig is not ready: less of the 1.2.75 "float
           toward the lens", and a left/up nudge toward the visible palm. */
        plane.position.set(0, 0.02, 0);
        addWorld(plane, parent, towardCam, toward, T);
        addWorld(plane, parent, camUp, 0.08, T);
        const camRight = new T.Vector3(1, 0, 0).transformDirection(cam.matrixWorld).normalize();
        addWorld(plane, parent, camRight, -0.14, T);
      }

      plane.visible = true;
      plane.frustumCulled = false;
      plane.renderOrder = 8;
      plane.traverse(function (o) {
        o.visible = true;
        o.frustumCulled = false;
        o.renderOrder = Math.max(o.renderOrder || 0, 8);
        if (o.material) {
          o.material.depthTest = useDepth;
          o.material.depthWrite = false;
          o.material.side = T.DoubleSide;
          o.material.visible = true;
          if (o.material.map) o.material.map.needsUpdate = true;
        }
      });
      if (!plane._p1276hook) {
        plane._p1276hook = 1;
        const prev = plane.onBeforeRender;
        plane.onBeforeRender = function () {
          try { if (U.on && isMapHeld() && !isWeapon() && !isTp()) poseInPalm(plane); } catch (e) { ERR('obr', e); }
          if (typeof prev === 'function') return prev.apply(this, arguments);
        };
      }
      U.mapSeat++;
      U.lastWhy = hand ? 'map-palm' : 'map-nudge';
      return true;
    } catch (e) { ERR('pose', e); return false; }
  }

  function tickMap() {
    if (!U.on) return;
    try {
      if (isWeapon()) {
        U.skippedGun++;
        U.lastWhy = 'gun-skip';
        /* If we parented the sheet to the hand, 1275 will not stash it
           on a weapon switch (it only looks at `held`). Stash ourselves
           and do not touch the gun mesh. */
        const s = getLiveSheet();
        const hand = holdingHand();
        if (s && hand && (s.parent === hand || (s.parent && s.parent.parent === hand))) stashSheet(s);
        return;
      }
      if (!isMapHeld() || isTp()) {
        const s = getLiveSheet();
        const hand = holdingHand();
        if (s && hand && (s.parent === hand || (s.parent && s.parent.parent === hand))) stashSheet(s);
        return;
      }
      const C = window.__c112;
      if (C && C.g) { try { C.g.visible = false; } catch (_) {} }
      const sheet = getLiveSheet();
      if (sheet) poseInPalm(sheet);
    } catch (e) { ERR('tickMap', e); }
  }

  /* v1.2.77: no bootTerrain, no cave wrap, no LOD, no adaptive rdist. */
  function loop() {
    try { tickMap(); } catch (e) { ERR('map', e); }
    try { requestAnimationFrame(loop); } catch (_) {}
  }
  function start() {
    try { tickMap(); } catch (e) { ERR('bootM', e); }
    try { requestAnimationFrame(loop); } catch (e) { ERR('raf', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }
  setTimeout(function () { try { tickMap(); } catch (e) { ERR('late1', e); } }, 600);
  setTimeout(function () { try { tickMap(); } catch (e) { ERR('late2', e); } }, 2000);
})();
