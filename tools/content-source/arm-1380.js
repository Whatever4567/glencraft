/* GLX-ARM1380 (t1380): remaining first-person arm holds on the existing
   __fpa / 1285 / 1347 rig. The musket support hand is reseated under the
   fore-end as a gloved wrap (the 1347 frames were still in an older model
   space, which left the left hand 30 cm off the barrel as pale sticks).
   The 1285 left glove still carries the third-person arm sleeve (verts
   weighted to frozen ancestor bones); those verts are collapsed to the
   wrist and the sleeve mesh is hidden so ADS does not show a reaching
   arm. The pick fist is scaled up onto the shaft. The bucket hand is
   moved onto the bail so fingers no longer punch through the tub.
   window.__noArm1380 = 1 puts the 1.2.133 seats, poses and MH frames back
   and restores the glove meshes.
   Does not replace the arms model, the guns, or the 1373 seats for other holds. */
(function arm1380() {
  const W = window;
  const prev = W.__arm1380;
  const U = W.__arm1380 = {
    on: prev && prev.on != null ? prev.on : 1,
    err: null, n: 0, ver: 'arm-1380', trim: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack || e)).slice(0, 240); };
  U.active = () => !W.__noArm1380 && !!U.on;

  const H = W.__handsFp1285;
  const MH = W.__fp1347 && W.__fp1347.mh;

  if (H && H.seat && !U.seatOld) {
    try { U.seatOld = JSON.parse(JSON.stringify({
      pick: H.seat.pick, p761: H.seat.p761, p760: H.seat.p760, bucket: H.seat.bucket
    })); } catch (_) { U.seatOld = {}; }
  }
  if (H && H.POSES && H.POSES.support && !U.supportOld) {
    try { U.supportOld = JSON.parse(JSON.stringify(H.POSES.support)); } catch (_) {}
  }
  if (MH && !U.mhOld) {
    try {
      U.mhOld = {
        lG: MH.lG && MH.lG.slice(), lY: MH.lY && MH.lY.slice(), lZ: MH.lZ && MH.lZ.slice(),
        lGA: MH.lGA && MH.lGA.slice(), lYA: MH.lYA && MH.lYA.slice(), lZA: MH.lZA && MH.lZA.slice(),
        rG: MH.rG && MH.rG.slice(), rOz: MH.rOz,
        lOff: MH.lOff, lOz: MH.lOz,
        lPose: MH.lPose && JSON.parse(JSON.stringify(MH.lPose))
      };
    } catch (_) {}
  }

  /* Musket model +X is along the barrel toward the stock, +Y up, +Z to the
     side. 1347 frames still used Z as the long axis, so the support hand
     sat 30 cm off the wood. Palm-up cup under the fore-end, fingers across
     the barrel (FPS support-hand hold). After the leftover sleeve is
     trimmed, the same grip point works in hip-fire and ADS. */
  U.MH = {
    lG: [0, 0, 0], lGA: [0, 0, 0],
    lY: [0.12, 0.18, -1], lYA: [0.10, 0.18, -1],
    lZ: [0, 1, 0], lZA: [0, 1, 0],
    lOff: 0.05, lOz: 0.018,
    rG: [0.02, 0.010, 0.02], rOz: 0.02,
    lPose: { p: [1.48, 1.58, 1.60, 1.50], d: [1.25, 1.40, 1.42, 1.30], t: [0.90, 0.72], tY: 0.50, tZ: 0.30 }
  };

  /* Full-size closed fist mid-shaft. scale lives in 1285 applyTune. */
  U.SEAT = {
    pick:  { sx: 1, x: 0.00, y: 0.05, z: -0.01, scale: 1.42 },
    p761:  { sx: 1, x: 0.00, y: 0.05, z: -0.01, scale: 1.42 },
    p760:  { sx: 1, x: 0.00, y: 0.05, z: -0.01, scale: 1.42 },
    bucket:{ sx: 1, x: 0.03, y: 0.09, z: -0.06, scale: 1.15, rx: 0.15 }
  };

  function copy3(a, b) { if (!a || !b) return; for (let i = 0; i < a.length && i < b.length; i++) a[i] = b[i]; }

  function applySeats(on) {
    if (!H || !H.seat) return;
    const src = on ? U.SEAT : U.seatOld;
    if (!src) return;
    for (const k of Object.keys(src)) {
      if (src[k]) H.seat[k] = Object.assign({}, src[k]);
    }
  }

  function applyMusket(on) {
    if (!MH) return;
    const src = on ? U.MH : U.mhOld;
    if (!src) return;
    copy3(MH.lG, src.lG); copy3(MH.lGA, src.lGA);
    copy3(MH.lY, src.lY); copy3(MH.lYA, src.lYA);
    copy3(MH.lZ, src.lZ); copy3(MH.lZA, src.lZA);
    if (src.lOff != null) MH.lOff = src.lOff;
    if (src.lOz != null) MH.lOz = src.lOz;
    if (src.rG) copy3(MH.rG, src.rG);
    if (src.rOz != null) MH.rOz = src.rOz;
    const pose = src.lPose;
    if (pose && H && H.POSES && H.POSES.support) {
      const P = H.POSES.support;
      P.p = pose.p.slice(); P.d = pose.d.slice(); P.t = pose.t.slice(); P.tY = pose.tY; P.tZ = pose.tZ;
      if (on) { MH.lPose = pose; P.__fp1347 = pose; }
      else if (U.supportOld) {
        const O = U.supportOld;
        P.p = O.p.slice(); P.d = O.d.slice(); P.t = O.t.slice(); P.tY = O.tY; P.tZ = O.tZ;
      }
      try { if (H.kind && H.poseKind) H.poseKind(H.kind); } catch (e) { ERR('pose', e); }
    }
  }

  /* The 1285 FP glove keeps the TP arm chain in bind so the wrist sits at
     the wrap origin. Vertices still weighted to those ancestor bones draw
     a long sleeve from the hand back toward the shoulder — most visible
     when the musket is aimed. Collapse those verts onto the hand and hide
     a mesh that is almost only sleeve. */
  function applyTrim(on) {
    try {
      const st = H && H.sides && H.sides.L;
      if (!st || !st.meshes || !st.skeleton || !st.skeleton.bones) return;
      const bones = st.skeleton.bones;
      const handI = bones.findIndex(function (b) { return b.name === 'handL'; });
      if (handI < 0) return;
      const anc = {};
      for (let i = 0; i < bones.length; i++) {
        if (/^(root|pelvis|spine|clavicle|upper_arm|forearm)/i.test(bones[i].name)) anc[i] = 1;
      }
      let trimmed = 0, hid = 0;
      for (let m = 0; m < st.meshes.length; m++) {
        const mesh = st.meshes[m], geo = mesh.geometry;
        if (!geo || !geo.attributes || !geo.attributes.skinIndex) continue;
        const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, pos = geo.attributes.position;
        if (!geo.userData._arm1380bak) {
          geo.userData._arm1380bak = { si: si.array.slice(), sw: sw.array.slice(), pos: pos.array.slice(), vis: mesh.visible, sc: [mesh.scale.x, mesh.scale.y, mesh.scale.z] };
        }
        const bak = geo.userData._arm1380bak;
        if (!on) {
          if (geo.userData._arm1380trim) {
            si.array.set(bak.si); sw.array.set(bak.sw); pos.array.set(bak.pos);
            si.needsUpdate = true; sw.needsUpdate = true; pos.needsUpdate = true;
            geo.userData._arm1380trim = 0;
          }
          mesh.visible = bak.vis !== false;
          if (bak.sc) mesh.scale.set(bak.sc[0], bak.sc[1], bak.sc[2]);
          continue;
        }
        if (!geo.userData._arm1380trim) {
          let nH = 0, nA = 0, cx = 0, cy = 0, cz = 0;
          for (let i = 0; i < si.count; i++) {
            const ix = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
            const wt = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
            let wH = 0, wA = 0;
            for (let j = 0; j < 4; j++) {
              if (ix[j] === handI) wH += wt[j];
              else if (anc[ix[j]]) wA += wt[j];
            }
            if (wH >= 0.5) { cx += pos.getX(i); cy += pos.getY(i); cz += pos.getZ(i); nH++; }
            if (wA >= 0.5) nA++;
          }
          if (nH) { cx /= nH; cy /= nH; cz /= nH; }
          if (nA > nH * 2) {
            mesh.visible = false;
            mesh.scale.set(0, 0, 0);
            geo.userData._arm1380arm = 1;
            hid++;
          } else {
            for (let i = 0; i < si.count; i++) {
              const ix = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
              const wt = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
              let wA = 0;
              for (let j = 0; j < 4; j++) if (anc[ix[j]]) wA += wt[j];
              if (wA >= 0.35) {
                pos.setXYZ(i, cx, cy, cz);
                si.setXYZW(i, handI, 0, 0, 0);
                sw.setXYZW(i, 1, 0, 0, 0);
              }
            }
            pos.needsUpdate = true; si.needsUpdate = true; sw.needsUpdate = true;
            trimmed++;
          }
          geo.userData._arm1380trim = 1;
        } else if (geo.userData._arm1380arm) {
          mesh.visible = false;
          mesh.scale.set(0, 0, 0);
          hid++;
        }
      }
      U.trim = 1;
      U.trimN = trimmed;
      U.trimHid = hid;
    } catch (e) { ERR('trim', e); }
  }

  function tick() {
    const on = U.active();
    applySeats(on);
    applyMusket(on);
    applyTrim(on);
    U.n++;
  }

  function wrap() {
    try {
      if (typeof updateHand === 'function' && !updateHand.__arm1380) {
        const prevUH = updateHand;
        updateHand = function (dt) {
          const r = prevUH.apply(this, arguments);
          try { tick(); } catch (e) { ERR('tick', e); }
          return r;
        };
        updateHand.__arm1380 = 1;
        U.uh = 1;
      }
    } catch (e) { ERR('wrap', e); }
  }

  applySeats(U.active());
  applyMusket(U.active());
  applyTrim(U.active());
  wrap();
  U.tick = tick;
  U.wrap = wrap;
  U.applyTrim = applyTrim;
  try { setInterval(wrap, 1000); } catch (_) {}
})();
