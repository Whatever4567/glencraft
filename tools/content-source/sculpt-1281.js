/* GLX-SCULPT1281 (local WIP): First-person pickaxe grip and slant on 1.2.80.

   The fist should close around the haft (haft visibly through the closed
   hand, thumb over it) and the pick should sit at a readable pickaxe
   angle: haft diagonally up-left from the bottom-right fist, head up
   top. The pick still comes in from the bottom-right corner.

   Keeps the existing pick model, __fpa cube arms and their animations
   (the mining swing is not retimed). Does not delete player geometry,
   does not wrap held-frame apply / repose, renderer.render, or fpa.step,
   and does not put the pick back on seatItem — the 1.2.75 potion path
   and the 1.2.59 / 1.2.74 freeze stay as they are. Offsets are a static
   one-time rest (base + delta), never a per-frame palm chase.
*/
(function sculpt1281() {
  const U = window.__sculpt1281 = {
    err: null, on: 1, version: 'sculpt-1281',
    hook: 0, rest: 0, thumb: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;

  const PICK_KIND = { p761: 1, pick: 1, p760: 1 };

  /* Camera-space translation of the pick, relative to its 1.2.80 rest.
     +X is right (into the bottom-right fist), +Y is up, -Z is toward the
     scene (away from the camera). */
  const CAM_OFF = { x: 0.155, y: -0.035, z: -0.070 };

  /* Desired shaft direction in camera space: diagonally up-left, a
     classic pickaxe slant (~53° from horizontal), slightly into the
     scene, so the head sits in the upper frame and stays readable.
     The crescent is then rolled face-on to the camera. */
  const SHAFT_CAM = { x: -0.62, y: 0.72, z: -0.26 };
  /* Slide the mesh along the shaft so the fist sits mid-haft and the head stays in frame. Negative moves the head down toward the camera. */
  const SHAFT_SLIDE = -0.06;
  const FACE_ROLL = 1.57;

  /* Tighter thumb wrap over the haft. __thumbAim stays off. */
  const THUMB_W = [0.16, 0.98, 0.72, 1.48];
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


  function hidePickCaps(on) {
    try {
      const R = rig();
      if (!R) return;
      for (const side of ['R', 'L']) {
        const g = R.userData && R.userData[side];
        const h = g && g.userData && g.userData.p && g.userData.p.h;
        if (!h) continue;
        const parts = g && g.userData && g.userData.p;
        if (parts && parts.cuff) {
          const c = parts.cuff;
          if (on) {
            if (c.visible) c.userData.__hidBy1281 = 1;
            c.visible = false;
          } else if (c.userData && c.userData.__hidBy1281) {
            c.visible = true;
            c.userData.__hidBy1281 = 0;
          }
        }
        const thin = h.userData && h.userData.forearm1279;
        if (thin) {
          if (on) {
            if (thin.visible) thin.userData.__hidBy1281 = 1;
            thin.visible = false;
          } else if (thin.userData && thin.userData.__hidBy1281) {
            thin.visible = true;
            thin.userData.__hidBy1281 = 0;
          }
        }
        h.traverse(function (o) {
          if (!o.isMesh || !o.userData) return;
          if (!(o.userData.wristCap1249 || o.userData.sleeveCap || o.userData.wristCap || o.userData.fpForearm1279)) return;
          if (on) {
            if (o.visible) o.userData.__hidBy1281 = 1;
            o.visible = false;
          } else if (o.userData.__hidBy1281) {
            o.visible = true;
            o.userData.__hidBy1281 = 0;
          }
        });
      }
    } catch (e) { ERR('caps', e); }
  }

  function applyThumb(kind) {
    try {
      const HF = window.__heldFrame1251;
      if (!HF) return;
      HF.__thumbAim = 0;
      HF.__thumbLive = 0;
      if (PICK_KIND[kind]) {
        HF.__thumbW = THUMB_W.slice();
        U.thumb = 1;
      } else if (HF.__thumbW && HF.__thumbW[0] === THUMB_W[0] && HF.__thumbW[3] === THUMB_W[3]) {
        HF.__thumbW = THUMB_W_1280.slice();
      }
    } catch (e) { ERR('thumb', e); }
  }

  const D = { ready: 0 };

  function tmp(THREE) {
    if (D.ready) return D;
    D.v = new THREE.Vector3();
    D.y = new THREE.Vector3(0, 1, 0);
    D.z = new THREE.Vector3(0, 0, 1);
    D.shaftW = new THREE.Vector3();
    D.zCur = new THREE.Vector3();
    D.zWant = new THREE.Vector3();
    D.zCam = new THREE.Vector3();
    D.w0 = new THREE.Vector3();
    D.w1 = new THREE.Vector3();
    D.l0 = new THREE.Vector3();
    D.l1 = new THREE.Vector3();
    D.qAim = new THREE.Quaternion();
    D.qRoll = new THREE.Quaternion();
    D.qWorld = new THREE.Quaternion();
    D.qParent = new THREE.Quaternion();
    D.pos = new THREE.Vector3();
    D.scl = new THREE.Vector3();
    D.inv = new THREE.Matrix4();
    D.ready = 1;
    return D;
  }

  function applyPickRest() {
    try {
      if (!U.on || isTp()) return;
      const kind = kindOf();
      applyThumb(kind);
      hidePickCaps(!!PICK_KIND[kind]);
      if (!PICK_KIND[kind] || typeof held === 'undefined' || !held) return;
      const mesh = (held.children && held.children[0]) || held;
      if (!mesh || !mesh.position || !mesh.quaternion) return;
      const THREE = T3();
      if (!THREE || typeof camera === 'undefined' || !camera) return;
      const ud = mesh.userData || (mesh.userData = {});
      if (ud._n0_1281 == null || ud._n0_1281.kind !== kind) {
        ud._n0_1281 = {
          x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
          kind: kind
        };
      }
      const b = ud._n0_1281;
      const d = tmp(THREE);
      const parent = mesh.parent || held;

      /* Aim local +Y (the haft) along SHAFT_CAM in camera space, then
         roll around the haft so local +Z faces the camera (crescent
         face-on). All of this is written into the mesh local quaternion
         using already-current parent / camera matrices — no world update,
         so we cannot re-enter the rig hook. */
      d.shaftW.set(SHAFT_CAM.x, SHAFT_CAM.y, SHAFT_CAM.z).normalize();
      d.shaftW.transformDirection(camera.matrixWorld);
      d.qWorld.setFromUnitVectors(d.y.set(0, 1, 0), d.shaftW);
      /* Authored roll around the haft so the crescent reads face-on.
         Auto-aligning local Z to the camera was a 90° miss on this model. */
      d.qRoll.setFromAxisAngle(d.y.set(0, 1, 0), FACE_ROLL);
      d.qWorld.multiply(d.qRoll);
      parent.matrixWorld.decompose(d.pos, d.qParent, d.scl);
      mesh.quaternion.copy(d.qParent).invert().multiply(d.qWorld);

      /* Camera-space translate, converted into held-local. */
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
      U.rest++;
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
    try { applyPickRest(); } catch (e) { ERR('install', e); }
  }
  U.install = install;
  try { install(); } catch (e) { ERR('boot', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
