/* GLX-FIX1276 (v1.2.76): map is held in the hand; cave walls no longer
   go see-through; longer view distance (adaptive, cheap far LOD).

   The live C112 chart is seated in the current __fpa palm-bowl: the
   palm is under the sheet, the thumb and fingers meet its bottom
   edge, and the chart stays tilted up, close and readable, with live
   terrain, the player marker and heading. The hand pose itself is
   not changed and the hands are not replaced. The sheet attaches
   only while the map item is held.

   Cave faces that C79 skipped as "dark closed cave" are always
   meshed for every loaded chunk while you are underground, including
   the full column above you up to the surface, so looking up no
   longer sees through the ceiling. Head-cover is tested all the way
   to the world top (not just 40 blocks). The camera far plane and
   fog are tall enough that vertical distance is not the limit.

   View distance defaults higher (8 chunks on a phone, 12 on a
   desktop, slider up to 24) and can grow further while FPS stays
   healthy. Far chunks use a cheap top-surface LOD mesh (2x / 4x
   downsample); the far ring is dropped if a phone's FPS dips.
   Near chunks keep the existing face-culled Sodium merge (one
   draw per chunk). Far work is near-first and pumped on idle.
   Distance fog hides the LOD seam.

   This IIFE never wraps held-frame apply / repose or
   renderer.render, and it never touches a gun, musket, or the
   1.2.75 potion-style pickaxe / bucket / torch grip. First-person
   hands stay hidden in third person. The gold D-pad is left alone. */
(function fix1276() {
  const U = window.__fix1276 = {
    err: null, on: 1, version: '1.2.76',
    mapSeat: 0, mapStash: 0, skippedGun: 0,
    caveRemesh: 0, under: 0, lod: 0, full: 0,
    R: 0, fps: 0, droppedLod: 0, lastWhy: '',
    callsBefore: 0, callsAfter: 0
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

  /* ===================================================================
     2. Cave see-through fix + longer adaptive view + cheap far LOD.
        Does not touch guns or tool grips.
     =================================================================== */
  function worldH() { return (typeof H === 'number' && H > 0) ? H : 90; }
  function chSize() { return (typeof CH === 'number' && CH > 0) ? CH : 26; }

  function userRdist() {
    try {
      if (typeof SET !== 'undefined' && typeof SET.rdist === 'number') return SET.rdist;
    } catch (_) {}
    return isTouch() ? 8 : 12;
  }

  /* Raised defaults: phones 8 (was 4), desktop 12 (was 8), cap 24. */
  function raiseDefault() {
    try {
      if (typeof SET === 'undefined' || SET._rd1276) return;
      SET._rd1276 = 1;
      const t = isTouch();
      if (typeof SET.rdist !== 'number') SET.rdist = t ? 8 : 12;
      else if (t && SET.rdist === 4) SET.rdist = 8;
      else if (!t && SET.rdist === 8) SET.rdist = 12;
      try { if (typeof saveSet === 'function') saveSet(); } catch (_) {}
      try {
        const rg = document.getElementById('rdRange');
        if (rg) { rg.max = '24'; rg.value = String(SET.rdist); }
        const val = document.getElementById('rdVal');
        if (val) val.textContent = SET.rdist + ' chunks';
      } catch (_) {}
    } catch (e) { ERR('rdDef', e); }
  }

  /* Adaptive 16-block-chunk count. Starts at the (raised) default and
     grows toward 24 while FPS is healthy; shrinks (drops the far LOD
     ring) if a phone dips. Hooked from 1261's rdist() so evict, stream
     and the fog cap all follow. */
  U.adapt = userRdist();
  function rdist1276() {
    const user = userRdist();
    const base = isTouch() ? 8 : 12;
    /* Adaptive may drop below the raised default (the far LOD ring)
       when FPS dips, down to 4 chunks, and grow back to 24. */
    if (U.adapt == null) U.adapt = Math.max(user, base);
    const n = Math.max(4, Math.min(24, U.adapt));
    U.R = n;
    return n;
  }
  window.__rdist1276 = rdist1276;

  function vfBlocks() { return rdist1276() * 16; }
  function capChunks() { return vfBlocks() / chSize() + 0.5; }

  function playerCxCz() {
    const ch = chSize();
    const x = (typeof P !== 'undefined' && P) ? P.x : 0;
    const z = (typeof P !== 'undefined' && P) ? P.z : 0;
    return { cx: Math.floor(x / ch), cz: Math.floor(z / ch), pcx: x / ch - 0.5, pcz: z / ch - 0.5 };
  }

  /* Scan ALL the way to the world top, not just +40. Tall open caves
     were being treated as "on the surface", so neighbouring chunks
     dropped their cave faces and the ceiling went see-through. */
  function headCovered() {
    try {
      if (typeof P === 'undefined' || !P || typeof world === 'undefined' || !world) return false;
      const x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y + 1.6);
      const HH = worldH(), DD = (typeof D === 'number') ? D : 320, WW = (typeof W === 'number') ? W : 320;
      if (x < 0 || z < 0 || x >= WW || z >= DD) return false;
      let c = 0;
      for (let yy = y + 1; yy < HH; yy++) {
        const b = world[(x * HH + yy) * DD + z];
        if (!b) continue;
        let skip = false;
        try { if (typeof LEAFY !== 'undefined' && LEAFY[b]) skip = true; } catch (_) {}
        try { if (b === 134) skip = true; } catch (_) {}
        try { if (typeof chunkST !== 'undefined' && chunkST && chunkST[b] === 1) skip = true; } catch (_) {}
        if (skip) continue;
        c++;
        if (c >= 2) return true;
      }
    } catch (e) { ERR('cover', e); }
    return false;
  }
  function isUnder() {
    try {
      if (typeof P === 'undefined' || !P) return false;
      if (typeof DIM !== 'undefined' && DIM && DIM.cur) return false;
      return headCovered() && P.y < worldH() - 2;
    } catch (_) { return false; }
  }

  /* ---- cave cull: never skip cave faces while underground ---- */
  function installCaveFix() {
    try {
      const prev = window.__caveCull;
      U._prevCaveCull = prev;
      window.__caveCull = function (cx, cz) {
        try {
          if (window.__noCaveCull) return null;
          if (typeof DIM !== 'undefined' && DIM && DIM.cur) return null;
          /* Whole loaded ring is fully meshed (full Y column to the
             surface) while you are in a cave. This is the see-through
             fix. Cave-interior skip stays as a surface-only far LOD. */
          if (isUnder()) return null;
          if (typeof prev === 'function') return prev(cx, cz);
        } catch (e) { ERR('cavFn', e); }
        return null;
      };
    } catch (e) { ERR('cavW', e); }
  }

  function remeshCulledCaves() {
    try {
      if (typeof chunkObjs === 'undefined' || !chunkObjs) return 0;
      if (typeof dirtyCh === 'undefined' || !dirtyCh) return 0;
      if (!isUnder()) { U.under = 0; return 0; }
      U.under = 1;
      let n = 0;
      const p = playerCxCz(), R = capChunks();
      for (const [id, g] of chunkObjs) {
        if (!g || !g.userData) continue;
        const cx = Math.floor(id / 64), cz = id % 64;
        const d = Math.max(Math.abs(cx - p.cx), Math.abs(cz - p.cz));
        /* Remesh any cave-culled or LOD column around the player so
           the full underground, including the ceiling, is drawn. */
        if ((g.userData.cav || g.userData.lod) && d <= R + 0.5) {
          dirtyCh.add(id);
          n++;
        }
      }
      if (n && typeof rebuild === 'function') {
        try { rebuild._unloaded = true; rebuild(10); } catch (_) {}
      }
      U.caveRemesh += n;
      return n;
    } catch (e) { ERR('remesh', e); return 0; }
  }

  /* ---- camera.far / fog: vertical is never the limiting factor ---- */
  function applyFarPlane() {
    try {
      const cam = (typeof camera !== 'undefined' && camera) || window.camera;
      const sc = (typeof scene !== 'undefined' && scene) || window.scene;
      const vf = vfBlocks();
      const HH = worldH();
      /* Always tall enough to see the surface from the floor, and
         wide enough for the (raised) view distance. */
      const want = Math.max(vf + 80, HH + 64, 160);
      if (cam && cam.isPerspectiveCamera) {
        if (cam.far < want - 1 || Math.abs(cam.far - want) > 16) {
          cam.far = want;
          cam.updateProjectionMatrix();
        }
      }
      if (sc && sc.fog) {
        /* Fog reaches almost to the view edge so the LOD seam hides;
           in a cave it is at least as far as the ceiling / surface. */
        let far = Math.max(36, vf - 2);
        if (isUnder()) {
          let ceilD = HH;
          try {
            const x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y + 1.6);
            const DD = (typeof D === 'number') ? D : 320, HH2 = worldH();
            for (let yy = y + 1; yy < HH2; yy++) {
              const b = world[(x * HH2 + yy) * DD + z];
              if (b) { ceilD = (yy - P.y) + 12; break; }
            }
          } catch (_) {}
          far = Math.max(far, ceilD, HH);
        }
        if (sc.fog.far < far) sc.fog.far = far;
        if (sc.fog.near > sc.fog.far * 0.62) sc.fog.near = sc.fog.far * 0.55;
      }
      U.far = want;
    } catch (e) { ERR('far', e); }
  }

  function wrapUpdateSky() {
    try {
      if (typeof updateSky !== 'function' || updateSky._p1276) return;
      const us = updateSky;
      updateSky = function () {
        const r = us.apply(this, arguments);
        try { applyFarPlane(); } catch (e) { ERR('sky', e); }
        return r;
      };
      updateSky._p1276 = 1;
      try { window.updateSky = updateSky; } catch (_) {}
    } catch (e) { ERR('usw', e); }
  }

  /* ---- cheap far LOD: 2x / 4x top-surface heightmap mesh ---- */
  function lodMat() {
    const T = THREE_();
    if (!T) return null;
    if (U._lodMat) return U._lodMat;
    U._lodMat = new T.MeshLambertMaterial({
      vertexColors: true, flatShading: true, side: T.DoubleSide
    });
    return U._lodMat;
  }
  function lodColor(b) {
    const TT = (typeof T !== 'undefined') ? T : {};
    if (b === TT.GRASS || b === 1) return [0.36, 0.55, 0.24];
    if (b === TT.DIRT || b === 2) return [0.45, 0.32, 0.18];
    if (b === TT.STONE || b === 3) return [0.48, 0.48, 0.46];
    if (b === TT.HEATHER || b === 4) return [0.42, 0.32, 0.36];
    if (b === TT.WATER || b === 5) return [0.18, 0.38, 0.62];
    if (b === TT.SAND || b === 6) return [0.76, 0.70, 0.48];
    if (b === TT.PEAT || b === 7) return [0.28, 0.22, 0.14];
    if (b === TT.LEAVES || b === 9 || b === 134) return [0.22, 0.42, 0.18];
    if (b === TT.SNOW || b === TT.PACKSNOW) return [0.90, 0.92, 0.95];
    if (b === TT.SANDSTONE || b === 77) return [0.72, 0.64, 0.42];
    if (b === TT.DEEPSLATE || b === 133) return [0.28, 0.30, 0.34];
    if (b === TT.COBBLE || b === 12) return [0.44, 0.44, 0.42];
    return [0.42, 0.44, 0.38];
  }
  function topSolid(x, z) {
    const HH = worldH(), DD = (typeof D === 'number') ? D : 320;
    const WW = (typeof W === 'number') ? W : 320;
    if (x < 0 || z < 0 || x >= WW || z >= DD) return [0, 0];
    try {
      for (let y = HH - 1; y >= 0; y--) {
        const b = world[(x * HH + y) * DD + z];
        if (!b) continue;
        try { if (typeof PLANT !== 'undefined' && PLANT[b] === 1) continue; } catch (_) {}
        try { if (typeof ENT !== 'undefined' && ENT[b]) continue; } catch (_) {}
        return [y, b];
      }
    } catch (_) {}
    return [0, 0];
  }
  function chunkDist(cx, cz) {
    const p = playerCxCz();
    return Math.max(Math.abs(cx - p.pcx), Math.abs(cz - p.pcz));
  }
  /* Near ring stays full-res. Mid / far become 2x then 4x LOD, and
     only on the surface — underground everything in view is full. */
  function lodStepFor(cx, cz) {
    if (isUnder()) return 0;
    if (U.adapt && U.adapt <= 6 && isTouch()) return 0; /* already dropped the far ring */
    const d = chunkDist(cx, cz);
    if (d <= 4.2) return 0;
    if (d <= 8.5) return 2;
    return 4;
  }
  function disposeGrp(old) {
    try {
      if (!old) return;
      try { if (typeof blockGroup !== 'undefined') blockGroup.remove(old); } catch (_) {}
      old.children.forEach(function (c) {
        try {
          if (c.isInstancedMesh && c.dispose) c.dispose();
          else if (c.geometry && c.geometry.dispose) c.geometry.dispose();
        } catch (_) {}
      });
    } catch (_) {}
  }
  function buildLodChunk(cx, cz, step) {
    const T3 = THREE_();
    if (!T3 || typeof world === 'undefined' || !world) return;
    const ch = chSize(), HH = worldH();
    const WW = (typeof W === 'number') ? W : 320;
    const DD = (typeof D === 'number') ? D : 320;
    const id = cx * 64 + cz;
    const old = (typeof chunkObjs !== 'undefined') ? chunkObjs.get(id) : null;
    disposeGrp(old);
    const x0 = cx * ch, z0 = cz * ch;
    const x1 = Math.min(WW, x0 + ch), z1 = Math.min(DD, z0 + ch);
    const cols = Math.ceil((x1 - x0) / step), rows = Math.ceil((z1 - z0) / step);
    const nq = cols * rows;
    if (nq < 1) return;
    const pos = new Float32Array(nq * 12);
    const nor = new Float32Array(nq * 12);
    const col = new Float32Array(nq * 12);
    const ind = new Uint32Array(nq * 6);
    let f = 0;
    for (let ix = x0; ix < x1; ix += step) for (let iz = z0; iz < z1; iz += step, f++) {
      const xA = ix, xB = Math.min(x1, ix + step);
      const zA = iz, zB = Math.min(z1, iz + step);
      const t00 = topSolid(xA, zA), t10 = topSolid(Math.min(WW - 1, xB - 1), zA);
      const t01 = topSolid(xA, Math.min(DD - 1, zB - 1)), t11 = topSolid(Math.min(WW - 1, xB - 1), Math.min(DD - 1, zB - 1));
      const y00 = t00[0] + 1, y10 = t10[0] + 1, y01 = t01[0] + 1, y11 = t11[0] + 1;
      const o = f * 12;
      pos[o] = xA;     pos[o + 1] = y00; pos[o + 2] = zA;
      pos[o + 3] = xB; pos[o + 4] = y10; pos[o + 5] = zA;
      pos[o + 6] = xB; pos[o + 7] = y11; pos[o + 8] = zB;
      pos[o + 9] = xA; pos[o + 10] = y01; pos[o + 11] = zB;
      /* Rough upward normal; fine at this distance. */
      for (let v = 0; v < 4; v++) { nor[o + v * 3] = 0; nor[o + v * 3 + 1] = 1; nor[o + v * 3 + 2] = 0; }
      const rgb = lodColor(t00[1] || t11[1] || 3);
      for (let v = 0; v < 4; v++) { col[o + v * 3] = rgb[0]; col[o + v * 3 + 1] = rgb[1]; col[o + v * 3 + 2] = rgb[2]; }
      const b4 = f * 4, o6 = f * 6;
      ind[o6] = b4; ind[o6 + 1] = b4 + 1; ind[o6 + 2] = b4 + 2;
      ind[o6 + 3] = b4; ind[o6 + 4] = b4 + 2; ind[o6 + 5] = b4 + 3;
    }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T3.BufferAttribute(nor, 3));
    g.setAttribute('color', new T3.BufferAttribute(col, 3));
    g.setIndex(new T3.BufferAttribute(ind, 1));
    g.computeBoundingSphere();
    const mesh = new T3.Mesh(g, lodMat());
    mesh.frustumCulled = true;
    mesh.userData.lodMesh = 1;
    const grp = new T3.Group();
    grp.add(mesh);
    grp.userData.lod = step;
    grp.userData.cav = 0;
    grp.userData.cavN = 0;
    try { if (typeof blockGroup !== 'undefined') blockGroup.add(grp); } catch (_) {}
    try { chunkObjs.set(id, grp); } catch (_) {}
    try { if (typeof chunkLists !== 'undefined') chunkLists.set(id, {}); } catch (_) {}
    U.lod++;
    return grp;
  }

  function wrapBuildChunk() {
    try {
      if (typeof buildChunk !== 'function' || buildChunk._p1276) return;
      const bc = buildChunk;
      buildChunk = function (cx, cz) {
        try {
          const step = lodStepFor(cx, cz);
          if (step >= 2) {
            const g = buildLodChunk(cx, cz, step);
            if (g) return g;
          }
        } catch (e) { ERR('lodB', e); }
        const r = bc.apply(this, arguments);
        try {
          const id = cx * 64 + cz;
          const g = chunkObjs && chunkObjs.get(id);
          if (g && g.userData) g.userData.lod = 0;
          U.full++;
        } catch (_) {}
        return r;
      };
      buildChunk._p1276 = 1;
      try { window.buildChunk = buildChunk; } catch (_) {}
    } catch (e) { ERR('bcW', e); }
  }

  /* When the player moves or goes under, remesh LOD <-> full. */
  function relodRing() {
    try {
      if (typeof chunkObjs === 'undefined' || !chunkObjs) return;
      if (typeof dirtyCh === 'undefined') return;
      const p = playerCxCz();
      const key = p.cx + ',' + p.cz + ',' + (isUnder() ? 1 : 0) + ',' + Math.round(U.adapt || 0);
      if (key === U._lodKey) return;
      U._lodKey = key;
      for (const [id, g] of chunkObjs) {
        if (!g) continue;
        const cx = Math.floor(id / 64), cz = id % 64;
        const want = lodStepFor(cx, cz);
        const have = (g.userData && g.userData.lod) || 0;
        if (!!want !== !!have || (want && have && want !== have)) dirtyCh.add(id);
      }
    } catch (e) { ERR('relod', e); }
  }

  /* ---- streamRadius follows the adaptive cap; re-apply after 1261 ---- */
  function ourStreamRadius() { return capChunks(); }
  function installStream() {
    try { streamRadius = ourStreamRadius; window.streamRadius = ourStreamRadius; } catch (e) { ERR('sr', e); }
    try {
      if (typeof rebuild === 'function' && !rebuild._p1276) {
        const rb = rebuild;
        rebuild = function (budget) {
          try { streamRadius = ourStreamRadius; } catch (_) {}
          return rb.apply(this, arguments);
        };
        rebuild._p1276 = 1;
        try { window.rebuild = rebuild; } catch (_) {}
      }
    } catch (e) { ERR('rbW', e); }
  }

  /* Idle pump: far dirty chunks mesh in idle time, near-first (rebuild
     already sorts by distance). No worker: the world array and THREE
     live on this thread; a copy would cost more than it saved. */
  function idlePump() {
    const go = function (deadline) {
      try {
        if (typeof dirtyCh !== 'undefined' && dirtyCh && dirtyCh.size && typeof rebuild === 'function') {
          const plenty = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() > 6 : true;
          if (plenty) rebuild(3);
        }
      } catch (e) { ERR('idle', e); }
      if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 400 });
      else setTimeout(go, 200);
    };
    try {
      if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 400 });
      else setTimeout(go, 200);
    } catch (_) {}
  }

  /* ---- adaptive FPS: drop the far LOD ring on a dip, grow when healthy ---- */
  let acc = 0, nF = 0, lastT = 0, ema = 18, hold = 0;
  function tickAdapt(t) {
    if (!lastT) { lastT = t; return; }
    const dt = t - lastT; lastT = t;
    if (dt > 400) return;
    ema = ema * 0.88 + dt * 0.12;
    acc += dt; nF++;
    U.fps = 1000 / Math.max(8, ema);
    if (acc < 1200) return;
    acc = 0; nF = 0;
    if (hold > 0) { hold--; return; }
    const fps = U.fps;
    const user = userRdist();
    const base = isTouch() ? 8 : 12;
    const target = Math.max(user, base);
    if (fps < 26 && U.adapt > Math.max(4, Math.min(user, 6))) {
      U.adapt = Math.max(Math.max(4, Math.min(user, 6)), (U.adapt || target) - 2);
      U.droppedLod++;
      hold = 2;
      U._lodKey = '';
      try { if (typeof dirtyCh !== 'undefined') { /* streamer will evict */ } } catch (_) {}
    } else if (fps > 45 && (U.adapt || 0) < 24 && (U.adapt || 0) < Math.max(target, 24)) {
      U.adapt = Math.min(24, (U.adapt || target) + 1);
      hold = 1;
      U._lodKey = '';
    }
  }

  /* ---- boot ---- */
  function bootTerrain() {
    raiseDefault();
    U.adapt = Math.max(U.adapt || 0, userRdist(), isTouch() ? 8 : 12);
    installCaveFix();
    wrapUpdateSky();
    wrapBuildChunk();
    installStream();
    applyFarPlane();
    idlePump();
    try { remeshCulledCaves(); } catch (_) {}
    /* Keep cave remesh and the LOD ring in sync as you walk / look. */
    try {
      setInterval(function () {
        try {
          const u = isUnder();
          if (u) remeshCulledCaves();
          else U.under = 0;
          relodRing();
          applyFarPlane();
        } catch (e) { ERR('iv', e); }
      }, 400);
    } catch (_) {}
  }

  /* Main rAF: map pose AFTER 1275 (registered later), plus adaptive. */
  function loop(t) {
    try { tickMap(); } catch (e) { ERR('map', e); }
    try { tickAdapt(t || performance.now()); } catch (e) { ERR('ad', e); }
    try { requestAnimationFrame(loop); } catch (_) {}
  }

  function start() {
    try { bootTerrain(); } catch (e) { ERR('bootT', e); }
    try { tickMap(); } catch (e) { ERR('bootM', e); }
    try { requestAnimationFrame(loop); } catch (e) { ERR('raf', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }
  /* Late retries: 1261 / C79 / 1275 wrap some of the same hooks at
     boot, and a world may not exist until Play. */
  setTimeout(function () { try { bootTerrain(); tickMap(); } catch (e) { ERR('late1', e); } }, 600);
  setTimeout(function () { try { bootTerrain(); tickMap(); } catch (e) { ERR('late2', e); } }, 2000);
})();
