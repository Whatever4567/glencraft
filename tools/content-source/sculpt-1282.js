/* GLX-SCULPT1282 (local WIP): Tighter pick fist, cleaner thumb, BR framing on 1.2.81.

   Keeps the 1281 frozen mesh-local rest, pick model, and __fpa animations.
   Re-tunes finger bunch / thumb wrap after 1281, and overrides the pick
   FRAME so the fist sits flush in the bottom-right without going off-screen.
   No geometry is deleted. Version stays 1.2.81.
*/
(function sculpt1282() {
  const U = window.__sculpt1282 = {
    err: null, on: 1, version: 'sculpt-1282', hook: 0, thumb: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const PICK_KIND = { p761: 1, pick: 1, p760: 1 };

  /* A little less right than 1281 (that cropped the palm) and lower, so
     the whole fist sits in the bottom-right corner and stays on-screen. */
  const FRAME_PICK = { dx: 0.046, dy: -0.034, dz: 0.02, fov: 0.68, s: 0.94, armS: 1.26 };

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
  function rightHand() {
    try {
      const R = rig();
      const g = R && R.userData && R.userData.R;
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }

  function applyPickFrame() {
    try {
      const HF = window.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      const n = FRAME_PICK;
      ['pick', 'p761', 'p760'].forEach(function (k) {
        const F = HF.FRAME[k];
        if (!F) return;
        ['dx', 'dy', 'dz', 'fov', 's', 'armS'].forEach(function (key) {
          Object.defineProperty(F, key, {
            configurable: true, enumerable: true,
            get: function () { return n[key]; },
            set: function () {}
          });
        });
        F._lock1282 = 1;
      });
    } catch (e) { ERR('frame', e); }
  }

  function refineGrip() {
    try {
      if (!U.on || isTp()) return;
      if (window.__sculpt1281 && !window.__sculpt1281.on) return;
      const kind = kindOf();
      if (PICK_KIND[kind]) applyPickFrame();
      if (!PICK_KIND[kind]) return;
      const h = rightHand();
      if (!h || !h.userData) return;

      /* Bunch the existing finger cubes into a tighter fist. 1281 already
         set the wrap curl (rotation.x); only close the spread. */
      const fingers = h.userData.f || [];
      for (let i = 0; i < fingers.length; i++) {
        const pair = fingers[i];
        const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
        if (!f || !f.rotation) continue;
        f.rotation.z = (i - 1.5) * -0.015;
      }

      /* Thumb: aim the pad at the camera-facing face and curl moderately
         so it wraps across the front, not along the wood or edge-on. */
      const th = h.userData.th;
      if (th) {
        const side = 1;
        const yS = 0.088, zS = 0.037, rHandle = 0.0135;
        const tx = th.position.x - side * 0.010;
        const ty = yS - (rHandle + 0.007);
        const tz = zS;
        const dx = tx - th.position.x;
        const dy = ty - th.position.y;
        const dz = tz - th.position.z;
        const len = Math.hypot(dx, dy, dz) || 1;
        const T = (typeof window !== 'undefined' && window.THREE) || (typeof THREE !== 'undefined' && THREE) || null;
        if (T) {
          const dir = new T.Vector3(dx / len, dy / len, dz / len);
          th.quaternion.copy(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir));
        } else {
          th.rotation.set(0.30, side * 1.12, side * 0.98);
        }
        if (th.userData && th.userData.k) {
          th.userData.k.rotation.set(1.18, 0, 0);
          if (th.userData.k.userData && th.userData.k.userData.d) {
            th.userData.k.userData.d.rotation.set(0.62, 0, 0);
          }
        }
        U.thumb = 1;
      }
    } catch (e) { ERR('grip', e); }
  }

  function install() {
    const R = rig();
    if (!R) return;
    if (!R.updateMatrixWorld.__sculpt1282) {
      const prev = R.updateMatrixWorld;
      R.updateMatrixWorld = function (force) {
        const r = prev.call(this, force);
        try { if (U.on) refineGrip(); } catch (e) { ERR('hook', e); }
        return r;
      };
      R.updateMatrixWorld.__sculpt1282 = 1;
      U.hook++;
    }
    try { refineGrip(); } catch (e) { ERR('install', e); }
  }
  U.install = install;
  try { install(); } catch (e) { ERR('boot', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
