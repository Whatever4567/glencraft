/* GLX-FIX1293 (v1.2.93): First-person pickaxe seat and held-map visibility.

   Pick: sculpt-1281 still freezes a camera-space offset from the 1.2.80
   potion-path baseline. After the 1.2.85/1.2.88 FP gloves the fist is no
   longer on that haft, so the pick reads as a huge slanted-down close-up
   that is not being held. This re-seats mid-haft in the current palm with
   a natural upright-forward angle (Minecraft / t1214 ref10), then freezes
   locals so the existing mining swing still carries the pick. The 1281
   finger wrap, the 1.2.88 gloves, the TP hands, the __fpa animations,
   the original models and the torch/pick jitter freeze are left alone.
   No geometry is deleted.

   Map: heldFrame1251.hideMapOverlay still hides and unparents the C112
   HUD group (C.g) every draw — that is correct, the HUD must not cover
   the view. fix-1279 pinches the live 0.34 sheet onto the __fpa rig, but
   the thumb-tip seat parks most of the sheet off the right edge in
   portrait (narrow horizontal FOV), so on a phone the map looks missing;
   the 1285 glove also stays in a light open curl. This re-seats the same
   live sheet facing the camera, held up in view, with the palm on the
   bottom edge. Portrait and landscape both keep the sheet inside the
   frustum. 1275 stash and the C.g hide are left alone.
*/
(function fix1293() {
  const U = window.__pickMap1293 = {
    err: null, on: 1, version: '1.2.93-pick-map',
    hook: 0, pickRest: 0, pickFrozen: 0, mapSeat: 0, last: ''
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;
  const PICK = { p761: 1, pick: 1, p760: 1 };
  const MAP_ID = () => { try { return (typeof IT !== 'undefined' && IT.MAP) || 410; } catch (_) { return 410; } };

  /* Camera-space shaft: mostly up, slightly toward the centre and into
     the scene (~12° from vertical). Face-roll keeps the crescent readable. */
  const SHAFT_CAM = { x: -0.30, y: 0.90, z: -0.22 };
  const FACE_ROLL = 1.57;
  /* Mid-haft in mesh-local Y (model shaft runs along +Y, butt at ~-0.45). */
  const GRIP_Y = -0.06;
  /* Palm point in the 1285 glove's p.h space (Y along the fingers). */
  const PALM = { x: 0.00, y: 0.085, z: 0.000 };

  /* Cup the map sheet's bottom edge; leave other 1285 poses alone. */
  const MAP_CURL = {
    p: [0.92, 1.02, 1.08, 1.00],
    d: [0.78, 0.88, 0.92, 0.84],
    t: [0.72, 0.55], tY: 0.40, tZ: 0.22
  };

  function kindOf() {
    try {
      const H = window.__heldFrame1251;
      if (H && typeof H.kindOf === 'function') return H.kindOf() || H.kind || '';
      if (H && H.kind) return H.kind;
    } catch (_) {}
    try {
      if (typeof selId !== 'undefined' && (selId === MAP_ID() || selId === 410)) return 'map';
    } catch (_) {}
    return '';
  }
  function isTp() {
    try { return typeof camMode !== 'undefined' && camMode !== 0; } catch (_) { return false; }
  }
  function swinging() {
    try { return typeof swingT !== 'undefined' && swingT > 0.02; } catch (_) { return false; }
  }
  function rig() {
    try { return window.__fpa && __fpa.rig ? __fpa.rig() : null; } catch (_) { return null; }
  }
  function rightHand(R) {
    try {
      const g = (R || rig()) && (R || rig()).userData && (R || rig()).userData.R;
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }
  /* The 1.2.85 glove is view-offset from the __fpa p.h root. The visible
     fist is sides.R.hand (or .wrap), which is what the player actually sees. */
  function palmNode() {
    try {
      const H = window.__handsFp1285;
      const st = H && H.sides && H.sides.R;
      const o = st && (st.hand || st.wrap);
      if (o && o.isObject3D) return o;
    } catch (_) {}
    return rightHand();
  }
  function palmWorld(THREE, out) {
    const o = palmNode();
    if (!o) return null;
    try { o.updateWorldMatrix(true, false); } catch (_) {}
    out.set(0, 0, 0).applyMatrix4(o.matrixWorld);
    return out;
  }
  function pickMesh() {
    try {
      if (typeof held === 'undefined' || !held) return null;
      const m = (held.children && held.children[0]) || held;
      return m && m.position && m.quaternion ? m : null;
    } catch (_) { return null; }
  }
  function sheet() {
    try {
      const C = window.__c112; if (!C) return null;
      const p = C.inset && C.inset.parent;
      if (p && p.isMesh && p.geometry && p.geometry.parameters && p.geometry.parameters.width === 0.34) return p;
      const s = C._sheet1274;
      if (s && s.isMesh && s.geometry && s.geometry.parameters && s.geometry.parameters.width === 0.34) return s;
    } catch (_) {}
    return null;
  }

  let D = {};
  function tmp(THREE) {
    if (D.ready) return D;
    D.v = new THREE.Vector3();
    D.y = new THREE.Vector3(0, 1, 0);
    D.shaftW = new THREE.Vector3();
    D.gripL = new THREE.Vector3();
    D.gripW = new THREE.Vector3();
    D.originW = new THREE.Vector3();
    D.palmW = new THREE.Vector3();
    D.palmC = new THREE.Vector3();
    D.qWorld = new THREE.Quaternion();
    D.qRoll = new THREE.Quaternion();
    D.qParent = new THREE.Quaternion();
    D.pos = new THREE.Vector3();
    D.scl = new THREE.Vector3();
    D.inv = new THREE.Matrix4();
    D.camInv = new THREE.Matrix4();
    D.mw = new THREE.Matrix4();
    D.eul = new THREE.Euler();
    D.ready = 1;
    return D;
  }

  function aspectOf(cam) {
    try {
      const el = (typeof renderer !== 'undefined' && renderer && renderer.domElement)
        || document.querySelector('canvas');
      if (el && (el.clientHeight || el.height)) return (el.clientWidth || el.width) / (el.clientHeight || el.height);
    } catch (_) {}
    return (cam && cam.aspect) || 1;
  }

  function applyPickRest(mesh, parent, THREE, opts) {
    const cam = (typeof camera !== 'undefined' && camera) || null;
    if (!cam || !parent || !mesh) return false;
    const d = tmp(THREE);
    try { parent.updateWorldMatrix(true, false); } catch (_) {}
    try { cam.updateWorldMatrix(true, false); } catch (_) {}
    try { mesh.updateWorldMatrix(true, false); } catch (_) {}
    if (!palmWorld(THREE, d.palmW)) return false;
    d.palmC.copy(d.palmW);
    cam.worldToLocal(d.palmC);
    if (!(d.palmC.z < -0.20 && d.palmC.z > -2.2 && Math.abs(d.palmC.x) < 1.8 && Math.abs(d.palmC.y) < 1.8)) return false;

    /* Current grip in camera space (mesh local +Y is the shaft). */
    d.gripW.set(0, GRIP_Y, 0).applyMatrix4(mesh.matrixWorld);
    d.camInv.copy(cam.matrixWorld).invert();
    d.v.copy(d.gripW).applyMatrix4(d.camInv); /* gripC */

    const dx = d.palmC.x - d.v.x, dy = d.palmC.y - d.v.y, dz = d.palmC.z - d.v.z;
    const dist = Math.hypot(dx, dy, dz);
    U._lastPick = { dist: +dist.toFixed(3), palmC: [+d.palmC.x.toFixed(3), +d.palmC.y.toFixed(3), +d.palmC.z.toFixed(3)], swing: swinging() ? 1 : 0 };
    /* Refuse a teleport at idle (stale matrices / IK wind-up). During the
       swing we must still catch the fist, even after a 1281 frozen jump. */
    if (dist > (opts && opts.loose ? 2.5 : 0.55)) return false;

    /* Upright-forward shaft in camera space, roll so the crescent is face-on. */
    d.shaftW.set(SHAFT_CAM.x, SHAFT_CAM.y, SHAFT_CAM.z).normalize();
    d.qWorld.setFromUnitVectors(d.y.set(0, 1, 0), d.shaftW);
    d.qRoll.setFromAxisAngle(d.shaftW, FACE_ROLL);
    d.qWorld.multiply(d.qRoll);

    const O = U._po || (U._po = new THREE.Object3D());
    /* New origin in camera space: current origin + palm-grip delta, after
       re-orienting so local (0,GRIP_Y,0) still maps onto the new origin+shaft. */
    d.originW.set(0, 0, 0).applyMatrix4(mesh.matrixWorld);
    cam.worldToLocal(d.originW);
    d.originW.x += dx; d.originW.y += dy; d.originW.z += dz;
    /* After a rotation change, keep the grip on the palm: origin = palm - R*(0,GRIP_Y,0). */
    d.gripL.set(0, GRIP_Y, 0).applyQuaternion(d.qWorld);
    O.position.copy(d.palmC).sub(d.gripL);
    O.quaternion.copy(d.qWorld);
    O.scale.set(1, 1, 1);
    O.updateMatrix();
    d.mw.copy(cam.matrixWorld).multiply(O.matrix);
    /* Position via worldToLocal (scale-safe). Rotation via parent world
       quaternion — decompose(parentScale * desiredWorld) tilts the shaft. */
    d.originW.setFromMatrixPosition(d.mw);
    try { parent.worldToLocal(d.originW); } catch (_) {
      d.inv.copy(parent.matrixWorld).invert();
      d.originW.applyMatrix4(d.inv);
    }
    mesh.position.copy(d.originW);
    cam.matrixWorld.decompose(d.pos, d.qRoll, d.scl);
    d.qRoll.multiply(O.quaternion);
    parent.matrixWorld.decompose(d.pos, d.qParent, d.scl);
    mesh.quaternion.copy(d.qParent).invert().multiply(d.qRoll);
    try { mesh.updateMatrix(); mesh.updateWorldMatrix(false, false); } catch (_) {}

    d.gripW.set(0, GRIP_Y, 0).applyMatrix4(mesh.matrixWorld);
    const gap = d.gripW.distanceTo(d.palmW);
    U._lastGap = gap;
    if (U._lastPick) U._lastPick.gap = +gap.toFixed(3);
    if (!(opts && opts.loose) && gap > 0.04) return false;
    return true;
  }

  function freezePick(mesh) {
    U.loc = {
      x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
      qx: mesh.quaternion.x, qy: mesh.quaternion.y, qz: mesh.quaternion.z, qw: mesh.quaternion.w,
      kind: kindOf()
    };
    U.pickFrozen = 1;
  }

  function applyFrozen(mesh) {
    const L = U.loc;
    if (!L) return;
    mesh.position.set(L.x, L.y, L.z);
    mesh.quaternion.set(L.qx, L.qy, L.qz, L.qw);
  }


  function bindPickDraw(root) {
    if (!root) return;
    const hook = function (o) {
      if (!o || (o.onBeforeRender && o.onBeforeRender.__pickMap1293)) return;
      o.onBeforeRender = function () {
        try { if (U.on) tickPick(T3()); } catch (e) { ERR('pobr', e); }
      };
      o.onBeforeRender.__pickMap1293 = 1;
    };
    hook(root);
    try {
      if (root.traverse) root.traverse(function (o) { if (o.isMesh) hook(o); });
    } catch (_) {}
  }

  /* Camera-space palm targets. Landscape is the play view (ref10 / ref09). */
  const MAP_PALM_LAND = { x: 0.08, y: -0.28, z: -0.50 };
  const MAP_PALM_PORT = { x: 0.03, y: -0.22, z: -0.52 };
  const PICK_PALM_LAND = { x: 0.18, y: -0.18, z: -0.44 };
  const PICK_PALM_PORT = { x: 0.10, y: -0.10, z: -0.50 };
  function gloveWrap() {
    try {
      const st = window.__handsFp1285 && __handsFp1285.sides && __handsFp1285.sides.R;
      return st && st.wrap;
    } catch (_) { return null; }
  }
  function nudgeGloveCam(THREE, cam, target) {
    const wrap = gloveWrap();
    if (!wrap || !wrap.parent || !cam || !target) return false;
    try {
      wrap.parent.updateWorldMatrix(true, false);
      cam.updateWorldMatrix(true, false);
      const dest = new THREE.Vector3(target.x, target.y, target.z);
      cam.localToWorld(dest);
      wrap.parent.worldToLocal(dest);
      wrap.position.copy(dest);
      wrap.updateWorldMatrix(false, true);
      return true;
    } catch (e) { ERR('nudgeG', e); return false; }
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function nudgeMapHand(THREE, cam) {
    const t = aspectOf(cam) >= 1 ? MAP_PALM_LAND : MAP_PALM_PORT;
    if (nudgeGloveCam(THREE, cam, t)) U.nudge = 1;
  }
  /* Keep the fist in a visible lower-right box by translating the
     whole __fpa rig (the 1285 glove stays on the wrist). The __fpa
     swing still drives the arc, without leaving a landscape frustum. */
  function containPickRig(THREE, cam) {
    const R = rig();
    const palm = palmNode();
    if (!R || !palm || !cam) return;
    try {
      const rest = aspectOf(cam) >= 1 ? PICK_PALM_LAND : PICK_PALM_PORT;
      const sw = swinging();
      const box = sw
        ? { x0: rest.x - 0.10, x1: rest.x + 0.10, y0: rest.y - 0.06, y1: rest.y + 0.18, z0: rest.z - 0.14, z1: rest.z + 0.04 }
        : { x0: rest.x - 0.03, x1: rest.x + 0.03, y0: rest.y - 0.03, y1: rest.y + 0.03, z0: rest.z - 0.04, z1: rest.z + 0.04 };
      cam.updateWorldMatrix(true, false);
      palm.updateWorldMatrix(true, false);
      const cur = new THREE.Vector3().setFromMatrixPosition(palm.matrixWorld);
      cam.worldToLocal(cur);
      const nx = clamp(cur.x, box.x0, box.x1);
      const ny = clamp(cur.y, box.y0, box.y1);
      const nz = clamp(cur.z, box.z0, box.z1);
      const dx = nx - cur.x, dy = ny - cur.y, dz = nz - cur.z;
      if (Math.hypot(dx, dy, dz) < 0.0005) return;
      const a = new THREE.Vector3(0, 0, 0);
      const b = new THREE.Vector3(dx, dy, dz);
      cam.localToWorld(a); cam.localToWorld(b);
      b.sub(a);
      R.updateWorldMatrix(true, false);
      const rp = new THREE.Vector3().setFromMatrixPosition(R.matrixWorld).add(b);
      if (R.parent) { R.parent.updateWorldMatrix(true, false); R.parent.worldToLocal(rp); }
      R.position.copy(rp);
      R.updateWorldMatrix(true, true);
      U.nudgePick = 1;
    } catch (e) { ERR('contain', e); }
  }

  function tickPick(THREE) {
    if (U._inPick) return;
    const kind = kindOf();
    if (!PICK[kind] || isTp() || !U.on) {
      if (U.loc && U.loc.kind && !PICK[kind]) { U.loc = null; U.pickFrozen = 0; }
      return;
    }
    const mesh = pickMesh();
    if (!mesh) return;
    const parent = mesh.parent;
    if (!parent) return;
    U._inPick = 1;
    try {
    const cam = (typeof camera !== 'undefined' && camera) || null;
    if (cam) {
      try { containPickRig(THREE, cam); } catch (e) { ERR('containP', e); }
    }
    try {
      if (parent.updateWorldMatrix) parent.updateWorldMatrix(true, true);
      const pn = palmNode();
      if (pn && pn.updateWorldMatrix) pn.updateWorldMatrix(true, true);
    } catch (_) {}
    /* Always follow the visible palm. Frozen locals relative to `held`
       go stale as the 1285 glove moves, and they do not ride the fist
       through the mining swing. */
    applyPickRest(mesh, parent, THREE, { loose: 1 });
    U.pickFrozen = 0;
    U.loc = null;
    U.pickRest++;
    bindPickDraw(mesh);
    } finally { U._inPick = 0; }
  }

  function unstash(plane, R) {
    try {
      if (!plane) return;
      const st = plane.parent && plane.parent.name === 'mapStash1275';
      if (st || (plane.parent && plane.parent !== R)) {
        if (plane.parent) plane.parent.remove(plane);
      }
      if (R && plane.parent !== R) R.add(plane);
    } catch (e) { ERR('unstash', e); }
  }


  function refreshMapTex(plane, THREE) {
    try {
      try {
        if (window.__c345 && window.__c345.uk) window.__c345.uk.want = 1;
        if (window.__c112 && typeof window.__c112.frame === 'function') window.__c112.frame();
      } catch (_) {}
      const C = window.__c112;
      if (!plane || !C || !C.TX || !THREE) return;
      let mat = plane.material;
      const img = C.TX;
      const map = mat && mat.map;
      if (!map || map.image !== img) {
        const tex = new THREE.CanvasTexture(img);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        if (mat) { mat.map = tex; mat.needsUpdate = true; }
      } else if ((U._texTick = (U._texTick || 0) + 1) % 6 === 1) {
        map.needsUpdate = true;
      }
    } catch (e) { ERR('tex', e); }
  }

  function seatMap(R, THREE) {
    if (!isMapHeld() || isTp() || !U.on || U._inSeat) return;
    const plane = sheet();
    const cam = (typeof camera !== 'undefined' && camera) || (R && R.parent);
    if (!plane || !cam || !R) return;
    U._inSeat = 1;
    try {
    unstash(plane, R);
    cam.updateWorldMatrix(true, false);
    try { nudgeMapHand(THREE, cam); } catch (e) { ERR('nudgeM', e); }
    const d = tmp(THREE);
    if (!palmWorld(THREE, d.palmW)) return;
    d.camInv.copy(cam.matrixWorld).invert();
    d.palmC.copy(d.palmW).applyMatrix4(d.camInv);

    const depth = d.palmC.z < -0.28 ? d.palmC.z : -0.48;
    const vFov = ((cam.fov || 75) * Math.PI) / 180;
    const halfY = Math.tan(vFov * 0.5) * Math.abs(depth);
    const halfX = halfY * aspectOf(cam);
    /* Landscape is the play view: a large, readable sheet. Portrait
       still has to keep the whole face on-screen. */
    const asp = aspectOf(cam);
    const land = asp >= 1;
    const maxHalf = Math.min(halfX, halfY) * (land ? 0.72 : 0.82);
    const sCap = land ? 1.08 : 0.88;
    const s = Math.max(0.42, Math.min(sCap, (2 * maxHalf) / 0.34));
    const hs = 0.17 * s;

    /* Palm under the bottom edge. FRAME_MAP places the hand in the
       lower-centre-right; the sheet grows up from that palm. */
    let cx = d.palmC.x;
    /* Sit the sheet above the palm so the hand is visible under the
       bottom edge (ref09). Keep the sheet a little behind the fist so
       the fingers can pass in front of the chart. */
    let cy = d.palmC.y + hs * 1.14;
    const z = depth - (land ? 0.03 : 0.02);
    const limitX = Math.max(hs + 0.01, halfX * 0.90);
    const limitY = Math.max(hs + 0.01, halfY * 0.90);
    if (cx + hs > limitX) cx = limitX - hs;
    if (cx - hs < -limitX) cx = -limitX + hs;
    if (cy + hs > limitY) cy = limitY - hs;
    if (cy - hs < -limitY) cy = -limitY + hs;
    U.lastSeat = { asp: +asp.toFixed(3), halfX: +halfX.toFixed(3), halfY: +halfY.toFixed(3),
      cx: +cx.toFixed(3), cy: +cy.toFixed(3), z: +z.toFixed(3), s: +s.toFixed(3),
      palm: [+d.palmC.x.toFixed(3), +d.palmC.y.toFixed(3), +d.palmC.z.toFixed(3)] };

    /* Face the camera: +Z toward the eye (same convention as fix-1279).
       Slight tilt so the top of the sheet leans away, like a held chart. */
    const O = U._o || (U._o = new THREE.Object3D());
    O.position.set(cx, cy, z);
    O.quaternion.identity();
    O.up.set(0, 1, 0);
    O.lookAt(0, 0, 0);
    O.rotateX(-0.22);
    O.updateMatrix();

    d.mw.copy(cam.matrixWorld).multiply(O.matrix);
    d.inv.copy(R.matrixWorld).invert().multiply(d.mw);
    d.inv.decompose(plane.position, plane.quaternion, plane.scale);
    plane.scale.set(s, s, s);
    plane.visible = true;
    plane.frustumCulled = false;
    plane.renderOrder = 0;
    try {
      if (plane.material) {
        plane.material.depthTest = true;
        plane.material.depthWrite = true;
        plane.material.transparent = false;
        plane.material.opacity = 1;
        plane.material.side = THREE.DoubleSide;
        if (plane.material.color) plane.material.color.setHex(0xffffff);
        refreshMapTex(plane, THREE);
      }
    } catch (_) {}
    try {
      const C = window.__c112;
      if (C && C.g) C.g.visible = false;
      if (C && C.inset) C.inset.visible = false;
    } catch (_) {}
    try {
      if (typeof held !== 'undefined' && held && held.traverse) {
        held.traverse(function (c) {
          const u = c.userData || {};
          if (u.held1240Map || u.art1249) c.visible = false;
        });
      }
    } catch (_) {}
    if (!plane.onBeforeRender || !plane.onBeforeRender.__pickMap1293) {
      plane.onBeforeRender = function () {
        try { if (U.on) seatMap(rig(), T3()); } catch (e) { ERR('obr', e); }
      };
      plane.onBeforeRender.__pickMap1293 = 1;
    }
    U.mapSeat++;
    } finally { U._inSeat = 0; }
  }

  function isMapHeld() {
    try { return selId === MAP_ID() || selId === 410 || kindOf() === 'map'; } catch (_) { return false; }
  }

  function tightenMapCurl() {
    try {
      const H = window.__handsFp1285;
      if (!H || !H.POSES || !H.POSES.map || H.POSES.map.__curl1293) return;
      const m = H.POSES.map;
      m.p = MAP_CURL.p.slice();
      m.d = MAP_CURL.d.slice();
      m.t = MAP_CURL.t.slice();
      m.tY = MAP_CURL.tY;
      m.tZ = MAP_CURL.tZ;
      m.__curl1293 = 1;
      U.curl = 1;
    } catch (e) { ERR('curl', e); }
  }

  function measure() {
    const THREE = T3();
    const info = { kind: kindOf(), pickFrozen: U.pickFrozen, mapSeat: U.mapSeat, err: U.err };
    try {
      const cam = typeof camera !== 'undefined' ? camera : null;
      const mesh = pickMesh();
      if (PICK[info.kind] && mesh && cam && THREE) {
        mesh.updateWorldMatrix(true, false);
        const shaft = new THREE.Vector3(0, 1, 0).transformDirection(mesh.matrixWorld);
        const inv = cam.matrixWorld.clone().invert();
        shaft.transformDirection(inv);
        info.shaftCam = [+shaft.x.toFixed(3), +shaft.y.toFixed(3), +shaft.z.toFixed(3)];
        const up = Math.acos(Math.max(-1, Math.min(1, shaft.y))) * 180 / Math.PI;
        info.shaftDegFromUp = +up.toFixed(1);
        const palm = new THREE.Vector3();
        if (palmWorld(THREE, palm)) {
          const a = new THREE.Vector3(0, -0.45, 0).applyMatrix4(mesh.matrixWorld);
          const b = new THREE.Vector3(0, 0.45, 0).applyMatrix4(mesh.matrixWorld);
          const ab = b.clone().sub(a);
          const t = Math.max(0, Math.min(1, palm.clone().sub(a).dot(ab) / (ab.lengthSq() || 1)));
          const closest = a.clone().add(ab.multiplyScalar(t));
          info.palmToHaft = +closest.distanceTo(palm).toFixed(4);
        }
        const wp = new THREE.Vector3(); mesh.getWorldPosition(wp);
        cam.worldToLocal(wp);
        info.meshCam = [+wp.x.toFixed(3), +wp.y.toFixed(3), +wp.z.toFixed(3)];
        info.clipsNear = Math.abs(wp.z) < ((cam.near || 0.05) + 0.04);
      }
    } catch (e) { info.pickErr = String(e); }
    try {
      const plane = sheet();
      const cam = typeof camera !== 'undefined' ? camera : null;
      if ((info.kind === 'map' || isMapHeld()) && plane && cam && THREE) {
        plane.updateWorldMatrix(true, false);
        const wp = new THREE.Vector3(); plane.getWorldPosition(wp);
        cam.worldToLocal(wp);
        info.sheetCam = [+wp.x.toFixed(3), +wp.y.toFixed(3), +wp.z.toFixed(3)];
        info.sheetVis = !!plane.visible;
        info.sheetParent = plane.parent ? (plane.parent.name || plane.parent.type) : null;
        info.sheetScale = plane.scale ? +plane.scale.x.toFixed(3) : null;
        const depth = Math.abs(wp.z) || 0.5;
        const vFov = ((cam.fov || 75) * Math.PI) / 180;
        const halfY = Math.tan(vFov * 0.5) * depth;
        const halfX = halfY * aspectOf(cam);
        const hs = 0.17 * (plane.scale && plane.scale.x || 1);
        info.sheetInView = (Math.abs(wp.x) + hs) < halfX * 1.02 && (Math.abs(wp.y) + hs) < halfY * 1.02 && wp.z < -0.2;
        const n = new THREE.Vector3(0, 0, 1).transformDirection(plane.matrixWorld);
        n.transformDirection(cam.matrixWorld.clone().invert());
        info.faceDot = +n.z.toFixed(3); /* +Z toward the eye => n.z > 0 */
      }
    } catch (e) { info.mapErr = String(e); }
    info.lastSeat = U.lastSeat || null;
    info.lastGap = U._lastGap;
    info.lastPick = U._lastPick || null;
    U.debug = info;
    return info;
  }


  function silence1279() {
    try { if (window.__fix1279) window.__fix1279.on = 0; } catch (_) {}
    try {
      if (window.__c345 && window.__c345.uk) window.__c345.uk.want = 1;
    } catch (_) {}
    try {
      const R = rig(); if (!R) return;
      R.traverse(function (o) {
        const u = o.userData || {};
        if (u.fpForearm1279 || o.name === 'Forearm1279') {
          o.visible = false;
          if (!o.onBeforeRender || !o.onBeforeRender.__hide1279) {
            o.onBeforeRender = function () { this.visible = false; };
            o.onBeforeRender.__hide1279 = 1;
          }
        }
      });
    } catch (_) {}
  }

  function tick() {
    if (!U.on || isTp()) return;
    const THREE = T3();
    if (!THREE) return;
    try { silence1279(); } catch (e) { ERR('s1279', e); }
    try { tightenMapCurl(); } catch (e) { ERR('curlTick', e); }
    try { tickPick(THREE); } catch (e) { ERR('pick', e); }
    try {
      const R = rig();
      if (R) seatMap(R, THREE);
    } catch (e) { ERR('map', e); }
  }


  /* Landscape is the play frame. Closer / larger so the purple head fills
     the view; dx kept modest so the fist stays bottom-right, not jammed
     against the edge. */
  const FRAME_PICK = { dx: 0.02, dy: -0.02, dz: 0.14, fov: 0.70, s: 1.20, armS: 1.02 };
  const FRAME_MAP  = { dx: -0.05, dy: -0.10, dz: 0.06, fov: 0.82, s: 1.28, armS: 1.10 };
  function lockFrame(keys, n) {
    try {
      const HF = window.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      keys.forEach(function (k) {
        const F = HF.FRAME[k];
        if (!F) return;
        ['dx', 'dy', 'dz', 'fov', 's', 'armS'].forEach(function (key) {
          try {
            Object.defineProperty(F, key, {
              configurable: true, enumerable: true,
              get: function () { return n[key]; },
              set: function () {}
            });
          } catch (_) { F[key] = n[key]; }
        });
        F._lock1293 = 1;
      });
      U.frame = 1;
    } catch (e) { ERR('frame', e); }
  }
  function lockPickFrame() {
    lockFrame(['pick', 'p761', 'p760'], FRAME_PICK);
    lockFrame(['map'], FRAME_MAP);
  }

  function install() {
    try {
      const R = rig();
      if (R && typeof R.updateMatrixWorld === 'function' && !R.updateMatrixWorld.__pickMap1293) {
        const prev = R.updateMatrixWorld.bind(R);
        R.updateMatrixWorld = function () {
          const r = prev.apply(this, arguments);
          try { if (U.on) tick(); } catch (e) { ERR('hook', e); }
          return r;
        };
        R.updateMatrixWorld.__pickMap1293 = 1;
        U.hook++;
      }
    } catch (e) { ERR('install', e); }
    try {
      if (typeof renderer !== 'undefined' && renderer && renderer.render && !renderer.__pickMap1293) {
        const rd = renderer.render.bind(renderer);
        renderer.render = function (sc, cam) {
          try { if (U.on) tick(); } catch (e) { ERR('rd', e); }
          return rd.apply(this, arguments);
        };
        renderer.__pickMap1293 = 1;
        U.hook++;
      }
    } catch (e) { ERR('render', e); }
    try { lockPickFrame(); } catch (e) { ERR('frameI', e); }
    try { tick(); } catch (e) { ERR('boot', e); }
  }

  U.install = install;
  U.tick = tick;
  U.measure = measure;
  U.SHAFT_CAM = SHAFT_CAM;
  try { install(); } catch (e) { ERR('init', e); }
  [200, 800, 2000, 5000, 12000, 30000, 70000].forEach(function (t) {
    try { setTimeout(install, t); } catch (_) {}
  });
  try {
    setInterval(function () {
      try { install(); } catch (e) { ERR('int', e); }
    }, 1000);
  } catch (_) {}
  /* rAF fallback: the rig only exists after enterWorld (~world load),
     so the short boot timeouts alone never wrap updateMatrixWorld. */
  (function loop() {
    try { if (U.on) { install(); tick(); } } catch (e) { ERR('raf', e); }
    try { requestAnimationFrame(loop); } catch (_) {}
  })();
})();
