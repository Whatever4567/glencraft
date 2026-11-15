/* GLX-SCULPT1281 (v1.2.81, perf-gated in 1.2.82): First-person pickaxe grip and slant on 1.2.80.

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
     haft sits in the palm. x/y nudge the fist toward the bottom-right
     corner and help keep the crescent in frame. */
  const CAM_OFF = { x: 0.040, y: -0.045, z: -0.190 };

  /* Desired shaft direction in camera space: diagonally up-left, a
     classic pickaxe slant (~53° from horizontal), slightly into the
     scene, so the head sits in the upper frame and stays readable. */
  const SHAFT_CAM = { x: -0.62, y: 0.72, z: -0.26 };
  /* Slide the mesh along the shaft so the fist sits mid-haft and the head stays in frame. Negative moves the head down toward the camera. */
  const SHAFT_SLIDE = -0.16;
  const FACE_ROLL = 1.57;

  /* Nudge the 1280 pick FRAME so the fist sits nearer the bottom-right
     corner. dx/dy also move the old `hand` group (pick parent) and the
     FPA rig together, so the frozen haft-through-fist rest is kept. */
  const FRAME_PICK = { dx: 0.058, dy: -0.005, dz: 0.02, fov: 0.68, s: 0.94, armS: 1.26 };

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
      const list = U._hidList = [];
      const hidePart = function (o) {
        if (!o) return;
        if (on) {
          if (o.visible) o.userData = o.userData || {}, o.userData.__hidBy1281 = 1;
          o.visible = false;
          list.push(o);
        } else if (o.userData && o.userData.__hidBy1281) {
          o.visible = true;
          o.userData.__hidBy1281 = 0;
        }
      };
      if (p) {
        hidePart(p.fo);
        hidePart(p.cuff);
        /* Upper arm and elbow sphere sit in / through the lens mid-swing
           (the elbow is a DoubleSide SphereGeometry; when it intersects
           camera.near it draws as a solid black mass at the bottom-right). */
        hidePart(p.up);
        hidePart(p.el);
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
        /* Any leftover limb mesh sitting in the lens, including large
           joint spheres whose *origin* is further away than 0.18 but whose
           radius still crosses camera.near (the mid-swing black mass). */
        try {
          if (typeof camera !== 'undefined' && camera && o.matrixWorld) {
            const d = tmp(T3());
            d.cam.setFromMatrixPosition(o.matrixWorld);
            camera.worldToLocal(d.cam);
            if (d.cam.z > -0.18) { hidePart(o); return; }
            const g = o.geometry;
            if (g) {
              if (!g.boundingSphere) g.computeBoundingSphere();
              const bs = g.boundingSphere;
              if (bs) {
                let scl = 1;
                try {
                  o.matrixWorld.decompose(d.pos, d.qWorld, d.scl);
                  scl = Math.max(d.scl.x, d.scl.y, d.scl.z);
                } catch (_) {}
                const wr = bs.radius * scl;
                /* Knuckle / fingertip balls are tiny (~0.01); leave those. */
                if (wr > 0.03 && d.cam.z - wr < -0.02 && d.cam.z + wr > -0.14) hidePart(o);
              }
            }
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

  /* Mesh world from the already-current parent matrixWorld and the
     mesh local we just wrote. Do not call updateMatrix() on ancestors
     — that desyncs pos/quat from a hand-authored matrix and blew
     live Dist to tens of metres. */
  function meshWorld(mesh, out) {
    mesh.updateMatrix();
    if (mesh.parent && mesh.parent.matrixWorld) {
      out.multiplyMatrices(mesh.parent.matrixWorld, mesh.matrix);
    } else {
      out.copy(mesh.matrix);
    }
    return out;
  }

  function wrapFingers() {
    try {
      if (!U.on || isTp()) return;
      const kind = kindOf();
      const HF = window.__heldFrame1251;
      if (HF) {
        HF.__thumbAim = 0;
        HF.__thumbLive = 0;
        if (PICK_KIND[kind]) U.thumb = 1;
      }
      if (!PICK_KIND[kind]) return;
      const h = rightHand();
      if (!h || !h.userData) return;
      const THREE = T3();
      if (!THREE || typeof held === 'undefined' || !held) return;
      const mesh = (held.children && held.children[0]) || held;
      if (!mesh) return;
      const d = tmp(THREE);

      /* Authored shaft in FPA-hand space (frozen rest keeps item +Y along
         hand +X). Live mesh.matrixWorld is often stale inside the rig
         hook — the item is not a rig child — so compose the world matrix
         from local transforms instead of trusting matrixWorld. */
      d.w0.set(-0.4, 0.088, 0.037);
      d.shaftW.set(1, 0, 0);
      let liveUsed = 0, liveD = null, liveDirX = null;
      try {
        meshWorld(mesh, d.mw);
        d.l0.set(0, -0.45, 0).applyMatrix4(d.mw);
        d.l1.set(0, 0.45, 0).applyMatrix4(d.mw);
        h.worldToLocal(d.l0);
        h.worldToLocal(d.l1);
        d.v.copy(d.l1).sub(d.l0);
        const sl = d.v.length() || 1;
        d.v.multiplyScalar(1 / sl);
        const yRef = 0.09, zRef = 0.004;
        const tt = (0 - d.l0.x) * d.v.x + (yRef - d.l0.y) * d.v.y + (zRef - d.l0.z) * d.v.z;
        const ly = d.l0.y + d.v.y * tt, lz = d.l0.z + d.v.z * tt;
        liveD = Math.hypot(ly - yRef, lz - zRef);
        liveDirX = d.v.x;
        /* Trust a composed live shaft whenever it is still roughly along
           hand +X and within reach of a fist. That keeps the wrap on the
           real haft through the mining swing, not a stale idle constant. */
        /* Hook-time live Dist is consistently ~0.07 at idle even when
           the real grip (measured after a full camera update) is 0.033.
           Only adopt a live shaft when it matches that idle grip so a
           stale 0.07 cannot splay the fingers back open. */
        if (d.v.x > 0.85 && liveD > 0.018 && liveD < 0.050) {
          d.w0.copy(d.l0);
          d.shaftW.copy(d.v);
          liveUsed = 1;
        }
      } catch (_) {}
      /* Slight squeeze (true surface is ~0.018): finger centres sit a
         little closer so the mid/distal travel further around the far
         / camera-facing side instead of hanging in a loose C under it. */
      const rHandle = 0.0135;
      const rFinger = 0.0065;
      const wrapR0 = rHandle + rFinger;

      const fingers = h.userData.f || [];
      const angles = [];
      for (let i = 0; i < fingers.length; i++) {
        const pair = fingers[i];
        const f = (pair && pair.isObject3D) ? pair : (pair && pair[0]);
        const k = (f && f.userData && f.userData.k) || (pair && pair[1]);
        const dist = k && k.userData && k.userData.d;
        if (!f || !f.rotation) continue;
        const y0 = f.position.y, z0 = f.position.z;
        const t = (0 - d.w0.x) * d.shaftW.x + (y0 - d.w0.y) * d.shaftW.y + (z0 - d.w0.z) * d.shaftW.z;
        const yS = d.w0.y + d.shaftW.y * t;
        const zS = d.w0.z + d.shaftW.z * t;
        const dy = yS - y0, dz = zS - z0;
        const Dist = Math.hypot(dy, dz) || 1e-4;
        const wrapR = Math.min(wrapR0, Math.max(0.012, Dist - 0.004));

        const L0 = 0.036, L1 = 0.017, L2 = 0.026;
        function inter(c0y, c0z, r0, c1y, c1z, r1) {
          const ddy = c1y - c0y, ddz = c1z - c0z;
          const dd = Math.hypot(ddy, ddz) || 1e-6;
          if (dd > r0 + r1 || dd < Math.abs(r0 - r1)) return null;
          const a = (r0 * r0 - r1 * r1 + dd * dd) / (2 * dd);
          const hh = Math.sqrt(Math.max(0, r0 * r0 - a * a));
          const mx = c0y + a * ddy / dd, mz = c0z + a * ddz / dd;
          return [
            [mx + hh * (-ddz) / dd, mz + hh * ddy / dd],
            [mx - hh * (-ddz) / dd, mz - hh * ddy / dd]
          ];
        }
        const pts = inter(y0, z0, L0, yS, zS, wrapR);
        let p0y, p0z;
        if (pts) {
          /* Take the shorter positive curl (knuckles stay on the far /
             into-the-scene side, pads wrap toward the camera). The larger
             angle is the long way around and splayed the fist open. */
          const a0 = Math.atan2(pts[0][1] - z0, pts[0][0] - y0);
          const a1 = Math.atan2(pts[1][1] - z0, pts[1][0] - y0);
          function score(a) {
            if (a < 0.15) return 1e3 + Math.abs(a);
            return Math.abs(a - 0.95);
          }
          const pick = (score(a0) <= score(a1)) ? pts[0] : pts[1];
          p0y = pick[0]; p0z = pick[1];
        } else {
          const ang = Math.atan2(dz, dy);
          const ta = Math.asin(Math.max(-1, Math.min(1, wrapR / Dist)));
          const a = ang - ta;
          p0y = y0 + L0 * Math.cos(a);
          p0z = z0 + L0 * Math.sin(a);
        }
        let th0 = Math.atan2(p0z - z0, p0y - y0);

        /* Walk mid + distal along the wrap circle (not a chord through
           the wood) so the pads hug the haft and the tip ends further
           around toward the camera-facing side. */
        function nrm(a) {
          while (a > Math.PI) a -= 2 * Math.PI;
          while (a < -Math.PI) a += 2 * Math.PI;
          return a;
        }
        const phi0 = Math.atan2(p0z - zS, p0y - yS);
        const half = 2 * wrapR > 1e-6 ? 2 * wrapR : 1e-6;
        const alpha1 = 2 * Math.asin(Math.max(-1, Math.min(0.999, L1 / half)));
        const alpha2 = 2 * Math.asin(Math.max(-1, Math.min(0.999, L2 / half)));
        let best = null;
        for (let si = 0; si < 2; si++) {
          const sign = si === 0 ? 1 : -1;
          const phi1 = phi0 + sign * alpha1;
          const phiT = phi1 + sign * alpha2;
          const p1y = yS + wrapR * Math.cos(phi1);
          const p1z = zS + wrapR * Math.sin(phi1);
          const ty = yS + wrapR * Math.cos(phiT);
          const tz = zS + wrapR * Math.sin(phiT);
          const t1 = nrm(Math.atan2(p1z - p0z, p1y - p0y) - th0);
          const t2 = nrm(Math.atan2(tz - p1z, ty - p1y) - (th0 + t1));
          /* Prefer continued positive curl (a closed fist, not a fold-back). */
          const sc = ((t1 < 0.05 || t2 < 0) ? 10 : 0) + Math.abs(t1 - 0.85) + Math.abs(t2 - 0.95);
          if (!best || sc < best.s) best = { t1: t1, t2: t2, s: sc, phiT: phiT };
        }
        let th1 = best.t1;
        /* Extra distal tuck so the tip hooks onto the far side. */
        let th2 = best.t2 + 0.32;

        function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
        th0 = clamp(th0, 0.55, 2.20);
        th1 = clamp(th1, 0.35, 1.80);
        th2 = clamp(th2, 0.20, 1.55);

        f.rotation.x = th0;
        if (k && k.rotation) k.rotation.x = th1;
        if (dist && dist.rotation) dist.rotation.x = th2;
        angles.push([+th0.toFixed(3), +th1.toFixed(3), +th2.toFixed(3), +Dist.toFixed(3)]);
      }

      /* Thumb over the camera-facing (smaller hand-Y) side of the haft. */
      const th = h.userData.th;
      if (th) {
        const side = 1;
        const tt = (th.position.x - d.w0.x) * d.shaftW.x +
          (th.position.y - d.w0.y) * d.shaftW.y +
          (th.position.z - d.w0.z) * d.shaftW.z;
        const yS = d.w0.y + d.shaftW.y * tt;
        const zS = d.w0.z + d.shaftW.z * tt;
        /* Aim the thumb's +Y at the camera-facing face, slightly toward
           the fingers, then a moderate mid curl so the pad sits on the
           front of the haft. Heavier mid curl folded the thumb edge-on
           into a thin fin. */
        d.l0.set(th.position.x - side * 0.012, yS - (rHandle + 0.008), zS);
        d.v.copy(d.l0).sub(th.position);
        if (d.v.lengthSq() > 1e-10) {
          d.v.normalize();
          d.y.set(0, 1, 0);
          th.quaternion.copy(d.qRoll.setFromUnitVectors(d.y, d.v));
        } else {
          th.rotation.set(0.32, side * 1.18, side * 1.05);
        }
        if (th.userData && th.userData.k) {
          th.userData.k.rotation.set(1.25, 0, 0);
          if (th.userData.k.userData && th.userData.k.userData.d) {
            th.userData.k.userData.d.rotation.set(0.55, 0, 0);
          }
        }
        U.thumb = 1;
      }
      U.debug = U.debug || {};
      U.debug.wrap = {
        r: +rHandle.toFixed(4),
        live: liveUsed,
        liveD: liveD != null ? +(+liveD).toFixed(3) : null,
        liveDirX: liveDirX != null ? +(+liveDirX).toFixed(3) : null,
        angles: angles
      };
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
    D.mw = new THREE.Matrix4();
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

  function applyPickFrame() {
    try {
      const HF = window.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      const n = FRAME_PICK;
      ['pick', 'p761', 'p760'].forEach(function (k) {
        const F = HF.FRAME[k];
        if (!F) return;
        /* Lock so 1280's once-a-second applyFrame cannot write the
           old pick FRAME back and make 1251 lerp every tick (jitter). */
        if (!F._lock1281) {
          ['dx', 'dy', 'dz', 'fov', 's', 'armS'].forEach(function (key) {
            Object.defineProperty(F, key, {
              configurable: true, enumerable: true,
              get: function () { return n[key]; },
              set: function () {}
            });
          });
          F._lock1281 = 1;
        }
      });
    } catch (e) { ERR('frame', e); }
  }

  /* 1.2.82 perf: this hook runs every time the FPA rig's matrices are
     updated, which can be many times per rendered frame. The full scan
     in hideArtefacts walks every mesh on the camera, so it now runs at
     most once per frame (or when the held kind changes). Later calls in
     the same frame only re-apply the cheap hide flags it already set. */
  let FRAME = 0;
  (function tickFrame() { FRAME++; try { requestAnimationFrame(tickFrame); } catch (_) {} })();
  let lastScanFrame = -1, lastScanOn = null;
  function hideArtefactsOnce(on) {
    if (lastScanFrame === FRAME && lastScanOn === on) {
      if (on && U._hidList) {
        for (let i = 0; i < U._hidList.length; i++) { const o = U._hidList[i]; if (o && o.visible) o.visible = false; }
      }
      return;
    }
    lastScanFrame = FRAME; lastScanOn = on;
    hideArtefacts(on);
  }

  function applyPickRest() {
    try {
      if (!U.on || isTp()) return;
      const kind = kindOf();
      if (PICK_KIND[kind]) applyPickFrame();
      hideArtefactsOnce(!!PICK_KIND[kind]);
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
      if (U._dbgFrame === FRAME) return;
      U._dbgFrame = FRAME;
      const d = tmp(THREE);
      const h = rightHand();
      const p = rightArm() && rightArm().userData && rightArm().userData.p;
      const wrap = U.debug && U.debug.wrap;
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
        err: U.err,
        wrap: wrap || null
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
