/* GLX-SCULPT1280 (local WIP): Incremental first-person hand sculpt on 1.2.79.

   Keeps the existing __fpa cube arms, their animations, and the original
   gun models. Does not rebuild the hands, does not delete player geometry,
   and does not wrap held-frame apply / repose, renderer.render, or fpa.step.
   Does not put the pickaxe, bucket or torch back on seatItem — the 1.2.75
   potion grip path and the 1.2.59 / 1.2.74 freeze stay as they are.

   1) A thicker cream linen forearm, open-ended, coming in from the
      bottom-right. WristCap / sleeveCap end discs are hidden, not deleted.
      The long sleeve is tucked only during gun ADS so it cannot become a
      linen wall.
   2) Slightly larger arm scale, in the 1.2.56 direction.
   3) A tighter closed-fist thumb wrap (__thumbAim stays off).
   4) A static bucket rest so the bail sits in a fist, bucket hanging below.
   5) Pistol hip bigger and lower (overrides the 1.2.71 upward nudge).
      The pick stays on the right; the fist and sleeve come in from the
      bottom-right corner.
*/
(function sculpt1280() {
  const U = window.__sculpt1280 = {
    err: null, on: 1, version: 'sculpt-1280',
    arms: 0, hidCap: 0, nudged: 0, thumb: 0, hook: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;

  const LEN = 0.32;
  const SLEEVE_OK = { empty: 1, block: 1, map: 1, torch: 1, bucket: 1 };
  const R_WRIST = 0.044;
  const R_ELBOW = 0.070;
  let armGeo = null;

  function isTp() {
    try { return typeof camMode !== 'undefined' && camMode !== 0; } catch (_) { return false; }
  }
  function isAds() {
    try {
      const H = window.__heldFrame1251;
      if (H && typeof H.isAds === 'function') return !!H.isAds();
    } catch (_) {}
    try { return !!(window.__c288 && __c288.aiming) || !!(window.__c145 && __c145.force); } catch (_) {}
    return false;
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
  function handOf(R, side) {
    try {
      const g = R && R.userData && R.userData[side];
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }
  function cuffMat(h, arm) {
    try {
      const p = arm && arm.userData && arm.userData.p;
      if (p && p.cuff && p.cuff.material) return p.cuff.material;
    } catch (_) {}
    try {
      const H71 = window.__hands1271;
      if (H71 && H71._linen) return H71._linen;
    } catch (_) {}
    let found = null;
    try {
      h.traverse(function (o) {
        if (found || !o.isMesh || !o.material) return;
        const u = o.userData || {};
        if (u.fpForearm1279 || u.fpForearm1280 || u.wristCap1249 || u.sleeveCap) return;
        const n = (o.name || '').toLowerCase();
        if (/cuff|sleeve|linen|fo\b/.test(n) || u.slim1271 || u.folded1249) found = o.material;
      });
    } catch (_) {}
    return found;
  }

  function hideEndDiscs(h, hide) {
    try {
      h.traverse(function (o) {
        if (!o.isMesh || !o.userData) return;
        if (o.userData.fpForearm1280 || o.userData.fpForearm1279) return;
        if (o.userData.wristCap1249 || o.userData.sleeveCap) {
          if (hide) {
            if (o.visible) U.hidCap++;
            o.visible = false;
            o.userData.__hidDisc1280 = 1;
          } else if (o.userData.__hidDisc1280) {
            o.visible = true;
            o.userData.__hidDisc1280 = 0;
          }
        }
      });
    } catch (_) {}
  }


  function creamMat(THREE) {
    if (U._cream) return U._cream;
    U._cream = new THREE.MeshLambertMaterial({ color: 0xf2eee4, side: THREE.FrontSide });
    return U._cream;
  }

  /* Aim the sleeve down and slightly back in camera space so it leaves
     through the bottom of the frame, not across the lens. */
  function aimSleeve(fa, h, R) {
    const THREE = T3();
    const cam = R && R.parent;
    if (!THREE || !fa || !h || !cam) return;
    try {
      h.updateWorldMatrix(true, false);
      const dirC = new THREE.Vector3(0.16, -1.0, 0.22).normalize();
      const dirW = dirC.transformDirection(cam.matrixWorld);
      const inv = new THREE.Matrix4().copy(h.matrixWorld).invert();
      const local = dirW.transformDirection(inv);
      if (local.lengthSq() < 1e-8) return;
      local.normalize();
      fa.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), local);
    } catch (_) {}
  }

  function swallowsCam(fa, R) {
    const THREE = T3();
    const cam = R && R.parent;
    if (!THREE || !fa || !cam) return false;
    try {
      fa.updateWorldMatrix(true, false);
      const elbow = new THREE.Vector3(0, -LEN, 0).applyMatrix4(fa.matrixWorld);
      cam.worldToLocal(elbow);
      if (elbow.length() < 0.10) return true;
      if (elbow.z > -0.06 && Math.abs(elbow.x) < 0.18 && elbow.y > -0.08) return true;
      const wrist = new THREE.Vector3(0, 0, 0).applyMatrix4(fa.matrixWorld);
      cam.worldToLocal(wrist);
      /* Going up in camera space would draw a wall through the view. */
      if (elbow.y > wrist.y + 0.02) return true;
      if (elbow.y > 0.02 || wrist.y > 0.12) return true;
      const mid = new THREE.Vector3(0, -LEN * 0.45, 0).applyMatrix4(fa.matrixWorld);
      cam.worldToLocal(mid);
      if (mid.z > -0.05 && mid.length() < 0.16) return true;
      if (mid.y > 0.04) return true;
    } catch (_) {}
    return false;
  }

  function upgradeArms(R) {
    const THREE = T3();
    if (!THREE || !R || !U.on) return;
    const ads = isAds();
    const kind = kindOf();
    const guns = (kind === 'musket' || kind === 'pistol');
    for (const side of ['R', 'L']) {
      const arm = R.userData && R.userData[side];
      const h = handOf(R, side);
      if (!h) continue;
      const thin = h.userData.forearm1279;
      let fa = h.userData.forearm1280;
      if (!fa) {
        if (!armGeo) {
          armGeo = new THREE.CylinderGeometry(R_WRIST, R_ELBOW, LEN, 20, 7, true);
          armGeo.translate(0, -LEN / 2, 0);
        }
        fa = new THREE.Mesh(armGeo, creamMat(THREE));
        fa.name = 'Forearm1280';
        fa.position.set(0, -0.072, 0.004);
        fa.userData.fpForearm1280 = 1;
        fa.userData.sculptKeep = 1;
        fa.userData.armSwitchKeep = 1;
        fa.frustumCulled = false;
        fa.renderOrder = 2;
        fa.castShadow = false;
        h.add(fa);
        h.userData.forearm1280 = fa;
        U.arms++;
      }
      if (fa.material !== creamMat(THREE)) fa.material = creamMat(THREE);
      aimSleeve(fa, h, R);
      if (swallowsCam(fa, R)) fa.visible = false;
      /* Only on poses where a downward cream sleeve stays off the lens.
         Pick / sword / guns keep the 1.2.79 cuff so we don't draw a wall. */
      const allow = !!SLEEVE_OK[kind] && !(guns && ads) && !isTp();
      fa.visible = allow;
      if (thin) {
        thin.userData.__hidBy1280 = allow ? 1 : 0;
        if (!allow) thin.visible = thin.userData.__hidBy1280 ? false : thin.visible;
      }
      hideEndDiscs(h, allow);
    }
  }

  /* Static FRAME rest offsets. Pick stays on the right; the fist comes
     in from the bottom-right corner. Pistol is bigger and lower. */
  const FRAME_NUDGE = {
    empty:  { dx: 0.00, dy: 0.02, dz: 0.03, fov: 0.74, s: 1.00, armS: 1.24 },
    block:  { dx: 0.02, dy: 0.00, dz: 0.02, fov: 0.74, s: 0.78, armS: 1.20 },
    pick:   { dx: 0.045, dy: 0.05, dz: 0.02, fov: 0.68, s: 0.94, armS: 1.26 },
    p761:   { dx: 0.045, dy: 0.05, dz: 0.02, fov: 0.68, s: 0.94, armS: 1.26 },
    p760:   { dx: 0.045, dy: 0.05, dz: 0.02, fov: 0.68, s: 0.94, armS: 1.26 },
    /* t1230: dz>0 is closer; armS scales the rig around the camera
       (bigger = hand further out). Lower and pull back so the blade
       reads in the play frame instead of a close-up of the fist. */
    sword:  { dx: 0.03, dy: -0.10, dz: -0.14, fov: 0.82, s: 1.28, armS: 1.10 },
    bucket: { dx: -0.02, dy: -0.04, dz: 0.05, fov: 0.68, s: 1.12, armS: 1.22 },
    torch:  { dx: 0.00, dy: -0.02, dz: 0.10, fov: 0.64, s: 1.26, armS: 1.26 },
    /* Vertical readable map, palm supporting it from below. Slightly
       larger armS so the hand sits under the sheet instead of over it. */
    map:    { dx: 0.00, dy: 0.00, dz: -0.04, fov: 0.78, s: 1.06, armS: 1.24 },
    /* t1230: natural hip height, same size, not off the near plane. */
    pistol: { dx: 0.06, dy:  0.02, dz: -0.04, fov: 0.66, s: 1.42, armS: 1.16 },
    musket: { dx: 0.03, dy:  0.00, dz: -0.12, fov: 0.84, s: 1.12, armS: 1.14 }
  };

  function applyFrame() {
    try {
      const HF = window.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      const keys = Object.keys(FRAME_NUDGE);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const F = HF.FRAME[k];
        const n = FRAME_NUDGE[k];
        if (!F || !n) continue;
        F.dx = n.dx; F.dy = n.dy; F.dz = n.dz;
        F.fov = n.fov; F.s = n.s; F.armS = n.armS;
        F._nudge1280 = 1;
      }
      U.nudged = 1;
    } catch (e) { ERR('frame', e); }
  }

  function holdFrame() {
    applyFrame();
    try {
      const H71 = window.__hands1271;
      if (H71 && typeof H71.nudgeFrame === 'function' && !H71._wrap1280) {
        const prev = H71.nudgeFrame.bind(H71);
        H71.nudgeFrame = function () {
          const r = prev.apply(this, arguments);
          applyFrame();
          return r;
        };
        H71._wrap1280 = 1;
      }
    } catch (e) { ERR('holdFrame', e); }
  }

  /* Tighter wrap over the fingers / shaft. __thumbAim stays off. */
  function applyThumb() {
    try {
      const HF = window.__heldFrame1251;
      if (!HF) return;
      HF.__thumbAim = 0;
      HF.__thumbLive = 0;
      HF.__thumbW = [0.20, 0.92, 0.58, 1.38];
      U.thumb = 1;
    } catch (e) { ERR('thumb', e); }
  }

  /* Static potion-path rest offsets (base + delta, not a per-frame chase). */
  const ITEM_REST = {
    bucket: { x: 0.00, y: -0.03, z: 0.00 },
    torch:  { x: 0.00, y: 0.00, z: -0.01 },
    p761:   { x: 0.00, y: 0.00, z: -0.030 },
    pick:   { x: 0.00, y: 0.00, z: -0.030 },
    p760:   { x: 0.00, y: 0.00, z: -0.030 }
  };

  function applyItemRest() {
    try {
      if (isTp() || !U.on) return;
      const kind = kindOf();
      const n = ITEM_REST[kind];
      if (!n || typeof held === 'undefined' || !held) return;
      const mesh = (held.children && held.children[0]) || held;
      if (!mesh || !mesh.position) return;
      const ud = mesh.userData || (mesh.userData = {});
      if (ud._n0_1280 == null) {
        ud._n0_1280 = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z, kind: kind };
      } else if (ud._n0_1280.kind !== kind) {
        ud._n0_1280 = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z, kind: kind };
      }
      const b = ud._n0_1280;
      mesh.position.set(b.x + n.x, b.y + n.y, b.z + n.z);
    } catch (e) { ERR('rest', e); }
  }

  const WRAPPED1280 = (typeof WeakSet === 'function') ? new WeakSet() : { _a: [], has(o) { return this._a.indexOf(o) >= 0; }, add(o) { this._a.push(o); } };
  function install() {
    const THREE = T3();
    const R = rig();
    if (!THREE || !R) return;
    holdFrame();
    applyThumb();
    /* GLX-PERF1286: the wrapped flag lives on the rig (WeakSet), not on the outermost function.
       Before, sculpt1280/1281/1282 each saw the other's wrapper on top every 1s install tick and
       wrapped again, so R.updateMatrixWorld grew by 3 wrappers a second and frame cost kept rising. */
    if (!WRAPPED1280.has(R)) {
      WRAPPED1280.add(R);
      const prev = R.updateMatrixWorld;
      R.updateMatrixWorld = function (force) {
        try { if (U.on) upgradeArms(this); } catch (e) { ERR('pose', e); }
        const r = prev.call(this, force);
        try {
          if (U.on) {
            const k = kindOf();
            for (const side of ['R', 'L']) {
              const h = handOf(this, side);
              const fa = h && h.userData && h.userData.forearm1280;
              if (!fa) continue;
              const ads = isAds();
              const guns = (k === 'musket' || k === 'pistol');
              const allow = !!SLEEVE_OK[k] && !(guns && ads) && !isTp() && !swallowsCam(fa, this);
              fa.visible = allow;
              const thin = h.userData && h.userData.forearm1279;
              if (thin && thin.userData) {
                if (allow) { thin.visible = false; thin.userData.__hidBy1280 = 1; }
                else if (thin.userData.__hidBy1280) { thin.visible = true; thin.userData.__hidBy1280 = 0; }
              }
              hideEndDiscs(h, allow);
            }
            applyItemRest();
          }
        } catch (e) { ERR('cull', e); }
        return r;
      };
      R.updateMatrixWorld.__sculpt1280 = 1;
      R.userData.sculpt1280 = 1;
      U.hook++;
    }
    try { upgradeArms(R); } catch (e) { ERR('arms', e); }
  }
  U.install = install;
  try { install(); } catch (e) { ERR('install', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
