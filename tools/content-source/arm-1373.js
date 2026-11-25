/* GLX-ARM1373 (t1373, v1.2.133): first-person arms look like working arms.
   Keeps the existing __fpa rig, 1285 gloves, 1347 items, 1359 magazine reload,
   1360 pistol finger poses, and the torch/pick jitter locks. This patch only
   reseats the glove on the linen cuff, shows that cuff, and retunes a few
   holds that had come apart (empty, map, block, pick, bucket, musket).
   window.__noArm1373 = 1 puts the previous seats and sleeve visibility back. */
(function arm1373() {
  const W = window;
  const prev = W.__arm1373;
  const U = W.__arm1373 = {
    on: prev && prev.on != null ? prev.on : 1,
    err: null, n: 0, ver: 'arm-1373'
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  U.active = () => !W.__noArm1373 && !!U.on;

  /* Saved originals, restored when the flag is on. */
  const H = W.__handsFp1285;
  if (H && H.seat && !U.seatOld) {
    try { U.seatOld = JSON.parse(JSON.stringify(H.seat)); } catch (_) { U.seatOld = H.seat; }
  }
  if (H && H.POSES && !U.poseOld) {
    try {
      U.poseOld = {};
      for (const k of ['empty', 'block', 'map']) {
        if (H.POSES[k]) U.poseOld[k] = JSON.parse(JSON.stringify(H.POSES[k]));
      }
    } catch (_) {}
  }
  const MH = W.__fp1347 && W.__fp1347.mh;
  if (MH && !U.mhOld) {
    try {
      U.mhOld = {
        lG: MH.lG && MH.lG.slice(), lY: MH.lY && MH.lY.slice(), lZ: MH.lZ && MH.lZ.slice(),
        rG: MH.rG && MH.rG.slice(), rY: MH.rY && MH.rY.slice(), rZ: MH.rZ && MH.rZ.slice(),
        lOff: MH.lOff, lOz: MH.lOz, rOff: MH.rOff, rOz: MH.rOz,
        lFa: MH.lFa, lFaA: MH.lFaA, rFa: MH.rFa, rFaA: MH.rFaA
      };
    } catch (_) {}
  }

  /* New seats in p.h space (Y along the fingers). No X-flip: that mirrored
     the glove and made the wrist look twisted on empty, map and block. The
     pick's old z 0.12 pulled the fist off the cuff. */
  U.SEAT = {
    empty:  { sx: 1, rx: 0.20, ry: 0, rz: 0, x: 0.00, y: 0.00, z: 0.02 },
    block:  { sx: 1, rx: 0.10, ry: 0, rz: 0, x: 0.00, y: 0.00, z: 0.02 },
    map:    { sx: 1, rx: 0.05, ry: 0.15, rz: 0, x: 0.02, y: 0.00, z: 0.02 },
    bucket: { sx: 1, x: 0.00, y: 0.02, z: 0.03 },
    torch:  { sx: 1, x: 0, y: 0.01, z: 0.00 },
    sword:  { sx: 1, x: 0.00, y: 0.01, z: 0.02 },
    pick:   { sx: 1, x: -0.01, y: 0.00, z: 0.03 },
    p761:   { sx: 1, x: -0.01, y: 0.00, z: 0.03 },
    p760:   { sx: 1, x: -0.01, y: 0.00, z: 0.03 },
    pistol: { sx: 1, x: 0.08, y: 0.02, z: 0.00 },
    musket: { sx: 1, x: 0.00, y: 0.00, z: 0.02 }
  };

  /* Empty / map: a relaxed curl, not a splayed wave. Block: a cup. */
  U.POSES = {
    empty: { p: [0.55, 0.62, 0.68, 0.60], d: [0.40, 0.46, 0.50, 0.44], t: [0.28, 0.22], tY: 0.28, tZ: 0.12 },
    map:   { p: [0.70, 0.74, 0.78, 0.72], d: [0.48, 0.52, 0.54, 0.50], t: [0.36, 0.24], tY: 0.16, tZ: 0.08 },
    block: { p: [0.90, 1.00, 1.02, 0.88], d: [0.70, 0.78, 0.80, 0.68], t: [0.58, 0.40], tY: 0.32, tZ: 0.16 }
  };

  /* Musket support frames stay on the 1.2.130 values. Only the linen cuff
     is dressed (see dressSleeves). U.MH can be filled later without a rebuild. */
  U.MH = null;

  function applySeats(on) {
    if (!H || !H.seat) return;
    const src = on ? U.SEAT : U.seatOld;
    if (!src) return;
    for (const k of Object.keys(src)) H.seat[k] = Object.assign({}, src[k]);
    if (H.POSES) {
      if (on) {
        for (const k of Object.keys(U.POSES)) {
          const P = H.POSES[k], R = U.POSES[k];
          if (!P || !R) continue;
          P.p = R.p.slice(); P.d = R.d.slice(); P.t = R.t.slice(); P.tY = R.tY; P.tZ = R.tZ;
        }
      } else if (U.poseOld) {
        for (const k of Object.keys(U.poseOld)) {
          const P = H.POSES[k], R = U.poseOld[k];
          if (!P || !R) continue;
          P.p = R.p.slice(); P.d = R.d.slice(); P.t = R.t.slice(); P.tY = R.tY; P.tZ = R.tZ;
        }
      }
    }
    try { if (H.kind && H.poseKind) H.poseKind(H.kind); } catch (e) { ERR('pose', e); }
  }

  function applyMusket(on) {
    if (!MH || !U.MH) return;
    if (on) {
      const M = U.MH;
      if (M.lG) MH.lG = M.lG.slice();
      if (M.lY) MH.lY = M.lY.slice();
      if (M.lZ) MH.lZ = M.lZ.slice();
      if (M.lOff != null) MH.lOff = M.lOff;
      if (M.lOz != null) MH.lOz = M.lOz;
      if (M.lFa != null) MH.lFa = M.lFa;
      if (M.lFaA != null) MH.lFaA = M.lFaA;
    } else if (U.mhOld) {
      const O = U.mhOld;
      if (O.lG) MH.lG = O.lG.slice();
      if (O.lY) MH.lY = O.lY.slice();
      if (O.lZ) MH.lZ = O.lZ.slice();
      if (O.lOff != null) MH.lOff = O.lOff;
      if (O.lOz != null) MH.lOz = O.lOz;
      if (O.lFa != null) MH.lFa = O.lFa;
      if (O.lFaA != null) MH.lFaA = O.lFaA;
    }
  }

  function dressSleeves() {
    try {
      if (!W.__fpa || !W.__fpa.rig) return;
      const rig = W.__fpa.rig(); if (!rig || !rig.visible) return;
      const ads = !!(W.__c145 && W.__c145.force) || !!(W.__vm && +W.__vm.k > 0.75);
      for (const S of ['R', 'L']) {
        const arm = rig.userData[S];
        if (!arm) continue;
        const h = arm.userData && arm.userData.p && arm.userData.p.h;
        const fa80 = h && h.userData.forearm1280;
        const fa79 = h && h.userData.forearm1279;
        if (!arm.visible) {
          if (fa80) fa80.visible = false;
          if (fa79) fa79.visible = false;
          continue;
        }
        if (ads) continue;
        if (fa80) fa80.visible = true;
        if (fa79) fa79.visible = false;
      }
      /* A leftover held sprite can sit in the empty hand after a sloppy
         item switch; hide the held tree while nothing is selected. */
      try {
        if (typeof selId !== 'undefined' && selId === 0 && typeof held !== 'undefined' && held) {
          for (const c of held.children) c.visible = false;
        }
      } catch (_) {}
    } catch (e) { ERR('sleeve', e); }
  }

  let lastOn = null;
  function tick() {
    const on = U.active();
    if (on !== lastOn) {
      applySeats(on);
      applyMusket(on);
      lastOn = on;
    }
    if (!on) return;
    dressSleeves();
    U.n++;
  }

  /* Late hook on the FPA step so we run after 1285 / 1347 / 1360. */
  function wrap() {
    try {
      if (W.__fpa && typeof W.__fpa.step === 'function' && !W.__fpa.step.__arm1373) {
        const prevStep = W.__fpa.step;
        const f = function (dt) {
          const r = prevStep.apply(this, arguments);
          try { tick(); } catch (e) { ERR('tick', e); }
          return r;
        };
        for (const k of Object.keys(prevStep)) { try { f[k] = prevStep[k]; } catch (_) {} }
        f.__arm1373 = 1;
        W.__fpa.step = f;
        U.wrapped = (U.wrapped || 0) + 1;
      }
      /* FPA's live loop calls the closed-over step from updateHand, not U.step,
         so hook updateHand as well. */
      if (typeof updateHand === 'function' && !updateHand.__arm1373) {
        const prevUH = updateHand;
        updateHand = function (dt) {
          const r = prevUH.apply(this, arguments);
          try { tick(); } catch (e) { ERR('tick', e); }
          return r;
        };
        updateHand.__arm1373 = 1;
        U.uh = 1;
      }
    } catch (e) { ERR('wrap', e); }
  }

  applySeats(U.active());
  applyMusket(U.active());
  wrap();
  U.tick = tick;
  U.wrap = wrap;
  try { setInterval(wrap, 1000); } catch (_) {}
})();
