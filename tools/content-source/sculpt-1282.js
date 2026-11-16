/* GLX-SCULPT1282 (local WIP): Post-1.2.81 first-person grip pass.

   Keeps the 1281 frozen pick rest, original models, and __fpa animations.
   No geometry is deleted. Version stays 1.2.81.

   - Pick: slightly lower FRAME so more of the fist stays on-screen.
   - Musket: hide the FPA elbow / upper-arm / forearm-cuff parts that
     cross camera.near and draw as a solid black mass at the hip. Hide,
     do not delete. Restore those parts on any other item so the 1280
     cream linen cuff is not replaced by a black band.
*/
(function sculpt1282() {
  const U = window.__sculpt1282 = {
    err: null, on: 1, version: 'sculpt-1282', hook: 0, thumb: 0, hid: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;
  const PICK_KIND = { p761: 1, pick: 1, p760: 1 };

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
  function rightArm(R) {
    try { return (R || rig()) && (R || rig()).userData && (R || rig()).userData.R || null; } catch (_) { return null; }
  }
  function rightHand(R) {
    try {
      const g = rightArm(R);
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }
  function sculptOn() {
    if (!U.on || isTp()) return false;
    if (window.__sculpt1281 && !window.__sculpt1281.on) return false;
    return true;
  }

  /* Musket only. The elbow sphere and upper-arm limb cross camera.near
     and draw as a solid black mass at the hip. Hide, do not delete.
     Restore when switching to any other item. */
  function hideNearPlaneMass(kind) {
    try {
      const arm = rightArm();
      if (!arm || !arm.userData || !arm.userData.p) return;
      const p = arm.userData.p;
      const on = (kind === 'musket');
      const parts = [p.el, p.up, p.fo, p.cuff];
      for (let i = 0; i < parts.length; i++) {
        const o = parts[i];
        if (!o) continue;
        if (on) {
          if (o.visible) {
            o.userData = o.userData || {};
            o.userData.__hidBy1282 = 1;
            U.hid++;
          }
          o.visible = false;
        } else if (o.userData && o.userData.__hidBy1282) {
          o.visible = true;
          o.userData.__hidBy1282 = 0;
        }
      }
    } catch (e) { ERR('hide', e); }
  }

  function applyPickFrame() {
    try {
      const HF = window.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      const n = FRAME_PICK;
      ['pick', 'p761', 'p760'].forEach(function (k) {
        const F = HF.FRAME[k];
        if (!F) return;
        /* 1.2.82 perf: define the locked getters once, not on every rig update. */
        if (F._lock1282) return;
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

  function refinePick() {
    const h = rightHand();
    if (!h || !h.userData) return;
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
      if (!f || !f.rotation) continue;
      f.rotation.z = (i - 1.5) * -0.015;
    }
    const th = h.userData.th;
    if (!th) return;
    const side = 1;
    const yS = 0.088, zS = 0.037, rHandle = 0.0135;
    const tx = th.position.x - side * 0.010;
    const ty = yS - (rHandle + 0.007);
    const tz = zS;
    const dx = tx - th.position.x, dy = ty - th.position.y, dz = tz - th.position.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const T = T3();
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

  function refineGrip() {
    try {
      if (!sculptOn()) return;
      const kind = kindOf();
      hideNearPlaneMass(kind);
      if (PICK_KIND[kind]) {
        applyPickFrame();
        refinePick();
      }
    } catch (e) { ERR('grip', e); }
  }

  const WRAPPED1282 = (typeof WeakSet === 'function') ? new WeakSet() : { _a: [], has(o) { return this._a.indexOf(o) >= 0; }, add(o) { this._a.push(o); } };
  function install() {
    const R = rig();
    if (!R) return;
    /* GLX-PERF1286: the wrapped flag lives on the rig (WeakSet), not on the outermost function.
       Before, sculpt1280/1281/1282 each saw the other's wrapper on top every 1s install tick and
       wrapped again, so R.updateMatrixWorld grew by 3 wrappers a second and frame cost kept rising. */
    if (!WRAPPED1282.has(R)) {
      WRAPPED1282.add(R);
      const prev = R.updateMatrixWorld;
      R.updateMatrixWorld = function (force) {
        const r = prev.call(this, force);
        try { if (U.on) refineGrip(); } catch (e) { ERR('hook', e); }
        return r;
      };
      R.updateMatrixWorld.__sculpt1282 = 1;
      R.userData.sculpt1282 = 1;
      U.hook++;
    }
    try { refineGrip(); } catch (e) { ERR('install', e); }
  }
  U.install = install;
  try { install(); } catch (e) { ERR('boot', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
