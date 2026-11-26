/* GLX-ARM1389 (t1389): first-person hands look more natural on the
   existing __fpa / 1285 / 1347 / 1380 rig. Empty and block fingers take a
   relaxed curl or a cup instead of a splayed open hand. The pick and
   sword fists are scaled to fill the handle. The musket support pose is
   tightened and the left glove is scaled up a little while the musket is
   held (the 1380 linen-sleeve hide is left in place so the sleeve does
   not fill the camera on other holds).
   window.__noArm1389 = 1 puts the 1.2.136 seats and poses back.
   Does not replace the arms model, the guns, or the 1380 flag. */
(function arm1389() {
  const W = window;
  const prev = W.__arm1389;
  const U = W.__arm1389 = {
    on: prev && prev.on != null ? prev.on : 1,
    err: null, n: 0, ver: 'arm-1389'
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack || e)).slice(0, 240); };
  U.active = () => !W.__noArm1389 && !!U.on;

  const H = W.__handsFp1285;
  const MH = W.__fp1347 && W.__fp1347.mh;

  function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (_) { return null; } }
  function applyPose(dst, src) {
    if (!dst || !src) return;
    if (src.p) dst.p = src.p.slice();
    if (src.d) dst.d = src.d.slice();
    if (src.t) dst.t = src.t.slice();
    if (src.tY != null) dst.tY = src.tY;
    if (src.tZ != null) dst.tZ = src.tZ;
  }

  if (H && H.seat && !U.seatOld) {
    try {
      U.seatOld = clone({
        empty: H.seat.empty, block: H.seat.block, map: H.seat.map,
        pick: H.seat.pick, p761: H.seat.p761, p760: H.seat.p760,
        sword: H.seat.sword, bucket: H.seat.bucket
      });
    } catch (_) { U.seatOld = {}; }
  }
  if (H && H.POSES && !U.poseOld) {
    try {
      U.poseOld = clone({
        empty: H.POSES.empty, block: H.POSES.block, map: H.POSES.map,
        support: H.POSES.support, default: H.POSES.default
      });
    } catch (_) { U.poseOld = {}; }
  }
  if (MH && !U.mhPoseOld) {
    try { U.mhPoseOld = MH.lPose ? clone(MH.lPose) : null; } catch (_) {}
  }

  /* Relaxed half-curl idle (not a splayed open hand, not a fist). */
  U.POSE = {
    empty: { p: [0.98, 1.08, 1.12, 1.02], d: [0.78, 0.88, 0.92, 0.82], t: [0.52, 0.40], tY: 0.36, tZ: 0.16 },
    default: { p: [0.98, 1.08, 1.12, 1.02], d: [0.78, 0.88, 0.92, 0.82], t: [0.52, 0.40], tY: 0.36, tZ: 0.16 },
    block: { p: [1.18, 1.28, 1.30, 1.16], d: [0.98, 1.08, 1.10, 0.96], t: [0.82, 0.58], tY: 0.46, tZ: 0.24 },
    map: { p: [0.98, 1.06, 1.10, 1.00], d: [0.72, 0.80, 0.84, 0.76], t: [0.52, 0.36], tY: 0.24, tZ: 0.12 },
    support: { p: [1.58, 1.68, 1.70, 1.60], d: [1.38, 1.52, 1.55, 1.42], t: [1.05, 0.88], tY: 0.58, tZ: 0.38 }
  };

  /* Fist scale fills the pick and sword handles. Empty seat is unchanged
     from 1.2.136. Block seat is a small slide toward the cube. */
  U.SEAT = {
    empty: { sx: 1, rx: 0.2, ry: 0, rz: 0, x: 0, y: 0, z: 0.02 },
    block: { sx: 1, rx: 0.12, ry: 0, rz: 0, x: 0.02, y: 0.02, z: 0.03, scale: 1.08 },
    map: { sx: 1, rx: 0.05, ry: 0.15, rz: 0, x: 0.02, y: 0, z: 0.02 },
    pick: { sx: 1, x: 0.00, y: 0.04, z: 0.00, scale: 1.72 },
    p761: { sx: 1, x: 0.00, y: 0.04, z: 0.00, scale: 1.72 },
    p760: { sx: 1, x: 0.00, y: 0.04, z: 0.00, scale: 1.72 },
    sword: { sx: 1, x: 0.00, y: 0.02, z: 0.01, scale: 1.62 },
    bucket: { sx: 1, x: 0.03, y: 0.08, z: -0.05, scale: 1.22, rx: 0.12 }
  };

  /* Left musket wrap only — applyTune resets this to 1 first. */
  U.LS = 1.28;

  function applySeats(on) {
    if (!H || !H.seat) return;
    const src = on ? U.SEAT : U.seatOld;
    if (!src) return;
    for (const k of Object.keys(src)) {
      if (src[k]) H.seat[k] = Object.assign({}, src[k]);
    }
  }

  function applyPoses(on) {
    if (!H || !H.POSES) return;
    const src = on ? U.POSE : U.poseOld;
    if (!src) return;
    for (const k of Object.keys(src)) {
      if (src[k] && H.POSES[k]) applyPose(H.POSES[k], src[k]);
    }
    if (MH) {
      const pose = on ? U.POSE.support : U.mhPoseOld;
      if (pose) {
        MH.lPose = pose;
        if (H.POSES.support) applyPose(H.POSES.support, pose);
      }
    }
  }

  function applyLeftScale(on) {
    try {
      const st = H && H.sides && H.sides.L;
      if (!st || !st.wrap) return;
      if (on && H.kind === 'musket') {
        const s = U.LS || 1.28;
        st.wrap.scale.set(s, s, s);
        U.lsc = s;
      }
    } catch (e) { ERR('lsc', e); }
  }

  function tick() {
    const on = U.active();
    applySeats(on);
    applyPoses(on);
    applyLeftScale(on);
    U.n++;
  }

  function wrap() {
    try {
      if (typeof updateHand === 'function' && !updateHand.__arm1389) {
        const prevUH = updateHand;
        updateHand = function (dt) {
          const r = prevUH.apply(this, arguments);
          try { tick(); } catch (e) { ERR('tick', e); }
          return r;
        };
        updateHand.__arm1389 = 1;
        U.uh = 1;
      }
    } catch (e) { ERR('wrap', e); }
  }

  applySeats(U.active());
  applyPoses(U.active());
  wrap();
  U.tick = tick;
  U.wrap = wrap;
  try { setInterval(wrap, 1000); } catch (_) {}
})();
