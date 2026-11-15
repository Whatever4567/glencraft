/* GLX-SCULPT1281 (local WIP): First-person pickaxe grip and slant on 1.2.80.

   The pick stays on the existing held/`hand` chain (potion path) so __fpa
   can keep using it as a stable IK target. A camera-space rest (shaft
   along SHAFT_CAM, ~50° up-left, crescent face-on, haft pushed through
   the palm) is converted into mesh-local once at idle and then only
   re-applied as frozen locals. That way the pick rides the fist through
   the mining swing without per-frame seat chasing or parenting `held`
   to the FPA hand (which loops IK and blows the matrices).

   Fingers curl around the haft and the thumb sits over the front.
   Arm-limb artefacts (RolledCuff1265 / beige wrist ring; p.up when it
   crosses the lens during the swing) are hidden, not deleted.
   Existing pick model and __fpa animations are kept.
*/
(function sculpt1281() {
  const U = window.__sculpt1281 = {
    err: null, on: 1, version: 'sculpt-1281',
    hook: 0, rest: 0, thumb: 0, frozen: 0, hid: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;

  const PICK_KIND = { p761: 1, pick: 1, p760: 1 };

  /* Camera-space translation of the pick, relative to its 1.2.80 rest.
     +X is right (into the bottom-right fist), +Y is up, -Z is toward the
     scene (away from the camera). z is ~0.13 deeper than 790cf5e so the
     haft sits in the palm instead of in front of the fingers. */
  const CAM_OFF = { x: -0.015, y: 0.030, z: -0.190 };

  /* Desired shaft direction in camera space: diagonally up-left, a
     classic pickaxe slant (~53° from horizontal), slightly into the
     scene, so the head sits in the upper frame and stays readable. */
  const SHAFT_CAM = { x: -0.62, y: 0.72, z: -0.26 };
  /* Slide the mesh along the shaft so the fist sits mid-haft and the head stays in frame. Negative moves the head down toward the camera. */
  const SHAFT_SLIDE = -0.10;
  const FACE_ROLL = 1.57;

  /* Closed-fist curl and thumb over the camera-facing side of the haft.
     __thumbAim stays off. */
  const FINGER_CURL = 1.85;
  const THUMB_W = [0.22, 1.04, 0.88, 1.52];
  const THUMB_W_1280 = [0.20, 0.92, 0.58, 1.38];

  function isTp() {
    try { return typeof camMode !== 'undefined' && camMode !== 0; } catch (_) { return false; }
  }
  function kindOf() {
    try {
      const H = window.__heldFrame1251;
      if (H && typeof H.kindOf === 'function') return H.kindOf() || H.kind || '';
      if (H && H.kind) return H.kind;
    } catch (_) {}
    return '';
  }
  function rig() {
    try { return window.__fpa && __fpa.rig ? __fpa.rig() : null; } catch (_) { return null; }
  }
  function rightArm(R) {
    try { return (R || rig()) && (R || rig()).userData && (R || rig()).userData.R || null; } catch (_) { return null; }
  }
  function rightHand(R) {
    try {
      const g = rightArm(R);
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }
  function swinging() {
    try { return typeof swingT !== 'undefined' && swingT > 0.02; } catch (_) { return false; }
  }

  function hideArtefacts(on) {
    try {
      const R = rig();
      const arm = rightArm(R);
      if (!arm) return;
      const p = arm.userData && arm.userData.p;
      const hidePart = function (o) {
        if (!o) return;
        if (on) {
          if (o.visible) o.userData = o.userData || {}, o.userData.__hidBy1281 = 1;
          o.visible = false;
        } else if (o.userData && o.userData.__hidBy1281) {
          o.visible = true;
          o.userData.__hidBy1281 = 0;
        }
      };
      if (p) {
        hidePart(p.fo);
        hidePart(p.cuff);
        /* Upper arm sits in the lens and becomes the mid-swing black mass. */
        hidePart(p.up);
      }
      arm.traverse(function (o) {
        if (!o.isMesh) return;
        const u = o.userData || {};
        const n = o.name || '';
        const isFinger = u.fingerAtlas || u.palmAtlas || u.nail1249 || u.nail1265 ||
          u.knuckle1249 || u.thenar1271 || u.tendon1265 || n === 'PalmSculpt' || n === 'WristTendons1265';
        if (isFinger) return;
        const hit = u.roll1265 || u.sleeveCuff22 || u.fpForearm1279 || u.fpForearm1280 ||
          u.wristCap1249 || u.sleeveCap || u.wristCap || u.slimWrist1271 ||
          u.sleeve1257 || u.linen1265 ||
          n === 'RolledCuff1265' || n === 'WristCap' || n === 'Forearm1279' || n === 'Forearm1280';
        if (hit) { hidePart(o); return; }
        /* Any leftover limb mesh sitting in the lens. */
        try {
          if (typeof camera !== 'undefined' && camera && o.matrixWorld) {
            const z = tmp(T3()).cam;
            z.setFromMatrixPosition(o.matrixWorld);
            camera.worldToLocal(z);
            if (z.z > -0.18) hidePart(o);
          }
        } catch (_) {}
      });
      try {
        if (typeof camera !== 'undefined' && camera) {
          const d = (T3() && tmp(T3())) || null;
          camera.traverse(function (o) {
            if (!o.isMesh) return;
            if ((o.parent && o.parent.name === 'driveArms1260') || o.name === 'driveArms1260') hidePart(o);
            let onHeld = false, onFingers = false, n = o;
            while (n) {
              if (typeof held !== 'undefined' && n === held) onHeld = true;
              const u = n.userData || {};
              if (u.fingerAtlas || u.palmAtlas || u.thenar1271 || n.name === 'PalmSculpt') onFingers = true;
              n = n.parent;
            }
            if (onHeld || onFingers || !d) return;
            try {
              d.cam.setFromMatrixPosition(o.matrixWorld);
              camera.worldToLocal(d.cam);
              if (d.cam.z > -0.14) hidePart(o);
            } catch (_) {}
          });
        }
      } catch (_) {}
      try {
        if (typeof fist !== 'undefined' && fist) hidePart(fist);
        if (typeof armMesh !== 'undefined' && armMesh) hidePart(armMesh);
      } catch (_) {}
      if (on) U.hid++;
    } catch (e) { ERR('hide', e); }
  }

  function wrapFingers() {
    try {
      if (!U.on || isTp()) return;
      const kind = kindOf();
      const HF = window.__heldFrame1251;
      if (HF) {
        HF.__thumbAim = 0;
        HF.__thumbLive = 0;
        /* Leave 1251/1280 thumb weights; only make sure aim/live stay off. */
        if (PICK_KIND[kind]) U.thumb = 1;
      }
      if (!PICK_KIND[kind]) return;
      /* Haft is now in the finger cluster; a slightly tighter curl than
         1251's 1.62 closes the cubes around it. Re-apply at idle and
         during the swing (1251 skips curls while swinging). */
      const h = rightHand();
      if (!h || !h.userData) return;
      const fingers = h.userData.f || [];
      const c = 1.72;
      for (let i = 0; i < fingers.length; i++) {
        const pair = fingers[i];
        const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
        const k = (f && f.userData && f.userData.k) || (pair && pair[1]);
        if (!f || !f.rotation) continue;
        f.rotation.x = 0.12 + c * 1.35;
        if (k && k.rotation) {
          k.rotation.x = 0.15 + c * 1.45;
          const d = k.userData && k.userData.d;
          if (d && d.rotation) d.rotation.x = 0.10 + c * 0.70;
        }
      }
    } catch (e) { ERR('fingers', e); }
  }

  const D = { ready: 0 };

  function tmp(THREE) {
    if (D.ready) return D;
    D.v = new THREE.Vector3();
    D.y = new THREE.Vector3(0, 1, 0);
    D.z = new THREE.Vector3(0, 0, 1);
    D.shaftW = new THREE.Vector3();
    D.w0 = new THREE.Vector3();
    D.w1 = new THREE.Vector3();
    D.l0 = new THREE.Vector3();
    D.l1 = new THREE.Vector3();
    D.qWorld = new THREE.Quaternion();
    D.qRoll = new THREE.Quaternion();
    D.qParent = new THREE.Quaternion();
    D.pos = new THREE.Vector3();
    D.scl = new THREE.Vector3();
    D.inv = new THREE.Matrix4();
    D.cam = new THREE.Vector3();
    D.ready = 1;
    return D;
  }

  function camOf(o, d) {
    try {
      d.cam.set(0, 0, 0).applyMatrix4(o.matrixWorld);
      if (typeof camera !== 'undefined' && camera) camera.worldToLocal(d.cam);
      return [+d.cam.x.toFixed(3), +d.cam.y.toFixed(3), +d.cam.z.toFixed(3)];
    } catch (_) { return null; }
  }

  function applyCameraRest(mesh, parent, THREE) {
    const kind = kindOf();
    const ud = mesh.userData || (mesh.userData = {});
    if (ud._n0_1281 == null || ud._n0_1281.kind !== kind) {
      ud._n0_1281 = {
        x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
        kind: kind
      };
    }
    const b = ud._n0_1281;
    const d = tmp(THREE);

    d.shaftW.set(SHAFT_CAM.x, SHAFT_CAM.y, SHAFT_CAM.z).normalize();
    d.shaftW.transformDirection(camera.matrixWorld);
    d.qWorld.setFromUnitVectors(d.y.set(0, 1, 0), d.shaftW);
    d.qRoll.setFromAxisAngle(d.y.set(0, 1, 0), FACE_ROLL);
    d.qWorld.multiply(d.qRoll);
    parent.matrixWorld.decompose(d.pos, d.qParent, d.scl);
    mesh.quaternion.copy(d.qParent).invert().multiply(d.qWorld);

    mesh.position.set(b.x, b.y, b.z);
    mesh.updateMatrix();
    d.w0.copy(mesh.position).applyMatrix4(parent.matrixWorld);
    d.w1.set(0, 0, 0).applyMatrix4(camera.matrixWorld);
    d.v.set(
      CAM_OFF.x + SHAFT_CAM.x * SHAFT_SLIDE,
      CAM_OFF.y + SHAFT_CAM.y * SHAFT_SLIDE,
      CAM_OFF.z + SHAFT_CAM.z * SHAFT_SLIDE
    ).applyMatrix4(camera.matrixWorld).sub(d.w1);
    d.w1.copy(d.w0).add(d.v);
    d.inv.copy(parent.matrixWorld).invert();
    d.l0.copy(d.w0).applyMatrix4(d.inv);
    d.l1.copy(d.w1).applyMatrix4(d.inv);
    mesh.position.set(
      b.x + (d.l1.x - d.l0.x),
      b.y + (d.l1.y - d.l0.y),
      b.z + (d.l1.z - d.l0.z)
    );
  }

  function freezeFromMesh(mesh) {
    U.loc = {
      x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
      qx: mesh.quaternion.x, qy: mesh.quaternion.y, qz: mesh.quaternion.z, qw: mesh.quaternion.w
    };
    U.frozen = 1;
  }

  function applyFrozen(mesh) {
    const L = U.loc;
    if (!L) return;
    mesh.position.set(L.x, L.y, L.z);
    mesh.quaternion.set(L.qx, L.qy, L.qz, L.qw);
  }

  function canFreeze(mesh, parent, THREE) {
    if (U.frozen) return false;
    if (swinging()) return false;
    if (!parent || !parent.matrixWorld || !camera || !camera.matrixWorld) return false;
    const d = tmp(THREE);
    const cz = camOf(mesh, d);
    if (!cz) return false;
    /* Mesh should already be in front of the camera at a first-person
       distance before we lock the locals. */
    if (!(cz[2] < -0.25 && cz[2] > -2.2)) return false;
    if (!(Math.abs(cz[0]) < 1.5 && Math.abs(cz[1]) < 1.5)) return false;
    return true;
  }

  function applyPickRest() {
    try {
      if (!U.on || isTp()) return;
      const kind = kindOf();
      hideArtefacts(!!PICK_KIND[kind]);
      if (!PICK_KIND[kind] || typeof held === 'undefined' || !held) {
        wrapFingers();
        return;
      }
      const mesh = (held.children && held.children[0]) || held;
      if (!mesh || !mesh.position || !mesh.quaternion) return;
      const THREE = T3();
      if (!THREE || typeof camera === 'undefined' || !camera) return;
      const parent = mesh.parent || held;

      if (U.frozen && U.loc) applyFrozen(mesh);
      else {
        applyCameraRest(mesh, parent, THREE);
        if (canFreeze(mesh, parent, THREE)) freezeFromMesh(mesh);
      }

      try { mesh.updateMatrix(); } catch (_) {}
      wrapFingers();
      U.rest++;
      const d = tmp(THREE);
      const h = rightHand();
      const p = rightArm() && rightArm().userData && rightArm().userData.p;
      U.debug = {
        frozen: U.frozen,
        rest: U.rest,
        swing: swinging() ? 1 : 0,
        parent: (function () {
          const ch = [];
          for (let o = held; o && ch.length < 6; o = o.parent) ch.push(o.name || o.type || 'obj');
          return ch;
        })(),
        meshCam: camOf(mesh, d),
        heldCam: camOf(held, d),
        handCam: h ? camOf(h, d) : null,
        upCam: p && p.up ? camOf(p.up, d) : null,
        loc: U.loc ? [+U.loc.x.toFixed(3), +U.loc.y.toFixed(3), +U.loc.z.toFixed(3)] : null,
        err: U.err
      };
    } catch (e) { ERR('rest', e); }
  }

  function install() {
    const R = rig();
    if (!R) return;
    if (!R.updateMatrixWorld.__sculpt1281) {
      const prev = R.updateMatrixWorld;
      R.updateMatrixWorld = function (force) {
        const r = prev.call(this, force);
        try { if (U.on) applyPickRest(); } catch (e) { ERR('hook', e); }
        return r;
      };
      R.updateMatrixWorld.__sculpt1281 = 1;
      R.userData.sculpt1281 = 1;
      U.hook++;
    }
    try {
      const HF = window.__heldFrame1251;
      if (HF && typeof HF.repose === 'function' && !HF.repose.__sculpt1281) {
        const prev = HF.repose;
        HF.repose = function () {
          const r = prev.apply(this, arguments);
          try { if (U.on) wrapFingers(); } catch (e) { ERR('repose', e); }
          return r;
        };
        HF.repose.__sculpt1281 = 1;
      }
      if (HF && typeof HF.apply === 'function' && !HF.apply.__sculpt1281) {
        const prevA = HF.apply;
        HF.apply = function () {
          const r = prevA.apply(this, arguments);
          try { if (U.on) wrapFingers(); } catch (e) { ERR('apply', e); }
          return r;
        };
        HF.apply.__sculpt1281 = 1;
      }
    } catch (e) { ERR('wrapHF', e); }
    try { applyPickRest(); } catch (e) { ERR('install', e); }
  }
  U.install = install;
  try { install(); } catch (e) { ERR('boot', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
