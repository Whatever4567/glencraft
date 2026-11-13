/* GLX-HANDS1266 (v1.2.66): sausage fingers sculpted toward realistic
   proportions on the classic 1.2.59 __fpa / 1.2.57 / 1.2.65 hands.
   Taper from a thicker base to a narrower, rounded and slightly flattened
   tip. Three phalanx segments per finger (two for the thumb) with visible
   narrowing at the joints and slight bulges at the knuckles. Realistic
   lengths: middle longest, then ring and index, then pinky. Slightly
   flattened oval cross-section. A natural resting curl that varies per
   finger (pinky curls the most), applied only on the empty hand so item
   grips stay as they are. Nails are thin inset plates on the last segment.
   The thumb has a thicker thenar base, visually lower on the palm. Fingers
   are a bit thinner relative to the palm. 1.2.65 pixel shading (dither,
   crease AO, knuckle highlights) is kept. Same objects, hierarchy, pivots
   and grip poses; every animation still runs. The gold D-pad is left alone.
   The view-model stays hidden in third person. Geometry is cached so there
   are no multi-second hitches. */
(function hands1266(W) {
  const U = W.__hands1266 = {
    on: 0, err: null, version: '1.2.66-fingers', sculpted: 0,
    cached: 0, merged: 0, verts: 0, geos: 0, frames: 0
  };
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const GEO = {};
  function share(key, build) {
    if (!GEO[key]) { GEO[key] = build(); U.geos++; }
    U.cached++;
    return GEO[key];
  }

  /* Anatomical role from finger index i and hand side.
     Thumb sits at +side * 0.038, so on the right hand (side>0) i=3 is
     next to the thumb (index) and i=0 is the pinky. */
  function roleOf(i, side) { return side >= 0 ? (3 - i) : i; }
  /* index, middle, ring, pinky — thinner than 1.2.65 overall */
  const WIDTH = [0.0066, 0.0065, 0.0059, 0.0050];
  /* Visual segment lengths. Joint Groups stay at 0.036 / 0.017 / 0.013.
     Distal `tip` extends past the official length so overall proportions
     read: middle longest, ring ≈ index, pinky clearly shorter. */
  const PROX = [0.0356, 0.0360, 0.0354, 0.0310];
  const MID  = [0.0166, 0.0172, 0.0164, 0.0136];
  const DIST = [0.0138, 0.0162, 0.0140, 0.0098];
  const TIP  = [0.0028, 0.0044, 0.0030, 0.0010];
  /* Resting curl (radians) on the empty hand only. Pinky curls the most. */
  const REST_F = [0.28, 0.34, 0.52, 0.85];
  const REST_K = [0.22, 0.28, 0.48, 0.78];
  const REST_D = [0.16, 0.20, 0.34, 0.55];
  /* Baked palmar curve along a segment, extra on the pinky. */
  const BEND  = [0.10, 0.09, 0.14, 0.22];

  function bagToGeo(bag) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(bag.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(bag.nrm, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(bag.uv, 2));
    if (bag.col && bag.col.length) g.setAttribute('color', new T.Float32BufferAttribute(bag.col, 3));
    U.verts += (bag.pos.length / 3) | 0;
    U.merged++;
    return g;
  }

  /* Flattened-oval phalanx along +Y, 0..len (+ optional rounded tip).
     Tapers r0 → r1, waist at the joints, optional knuckle bulge, palmar
     bend, slightly flattened oval (ovalZ < 1, palmar side a touch flatter). */
  function phalanxGeo(len, r0, r1, ovalZ, knuckle, bend, tipExt) {
    const key = ['phx', len, r0, r1, ovalZ, knuckle ? 1 : 0, bend || 0, tipExt || 0].join(',');
    return share(key, function () {
      const RAD = 8;
      const rings = [];
      function pushRing(t, rm, sh) { rings.push({ t: t, rm: rm, sh: sh }); }
      pushRing(0.00, 1.00, 0.90);                 /* joint face */
      pushRing(0.09, 0.80, 0.62);                 /* waist — visible narrowing */
      if (knuckle) {
        pushRing(0.24, 1.20, 1.08);               /* knuckle bulge */
        pushRing(0.40, 1.02, 0.98);
      } else {
        pushRing(0.28, 0.98, 0.95);
        pushRing(0.48, 0.94, 0.92);
      }
      pushRing(0.72, 0.90, 0.90);
      pushRing(1.00, 0.82, 0.96);                 /* start of tip */
      if (tipExt && tipExt > 0) {
        pushRing(1.00 + tipExt * 0.45 / len, 0.58, 1.00);
        pushRing(1.00 + tipExt * 0.80 / len, 0.32, 1.00);
        pushRing(1.00 + tipExt / len,        0.04, 1.00); /* rounded, slightly flattened tip */
      }
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const oval = ovalZ || 0.48;
      function radiusAt(ring) {
        const tt = Math.min(1, ring.t);
        const r = (r0 + (r1 - r0) * Math.pow(tt, 0.80)) * ring.rm;
        return r;
      }
      function centerAt(t) {
        /* Palmar curve (toward −Z). Small-angle arc. */
        const b = bend || 0;
        if (b < 1e-4) return { y: t * len, z: 0 };
        const R = len / b;
        const a = b * Math.min(t, 1);
        return { y: R * Math.sin(a) + Math.max(0, t - 1) * len, z: -R * (1 - Math.cos(a)) };
      }
      function ringPt(ring, k) {
        const a = (k / RAD) * Math.PI * 2;
        const r = radiusAt(ring);
        /* Palmar (−Z, a≈3π/2) is slightly flatter than the dorsum. */
        const palmar = Math.max(0, -Math.sin(a));
        const oz = oval * (1 - 0.16 * palmar);
        const c = centerAt(ring.t);
        return {
          x: Math.cos(a) * r,
          y: c.y,
          z: c.z + Math.sin(a) * r * oz,
          a: a, u: k / RAD, v: Math.min(1, ring.t)
        };
      }
      /* Keep a mid-tan vertex colour so 1.2.65 maps still read (they multiply). */
      const col = [1, 1, 1];
      for (let i = 0; i < rings.length - 1; i++) {
        for (let k = 0; k < RAD; k++) {
          const A = ringPt(rings[i], k), B = ringPt(rings[i], k + 1);
          const C = ringPt(rings[i + 1], k), D = ringPt(rings[i + 1], k + 1);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          const uvs = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(uvs[v].u, uvs[v].v);
            bag.col.push(col[0], col[1], col[2]);
          }
        }
      }
      /* Proximal cap */
      const r0n = rings[0];
      const c0 = centerAt(r0n.t);
      for (let k = 0; k < RAD; k++) {
        const a = ringPt(r0n, k), b = ringPt(r0n, k + 1);
        const tri = [[0, c0.y, c0.z], [a.x, a.y, a.z], [b.x, b.y, b.z]];
        for (let v = 0; v < 3; v++) {
          bag.pos.push(tri[v][0], tri[v][1], tri[v][2]);
          bag.nrm.push(0, -1, 0);
          bag.uv.push(0.5, 0);
          bag.col.push(col[0], col[1], col[2]);
        }
      }
      return bagToGeo(bag);
    });
  }

  function knuckleGeo(r, ovalZ) {
    return share(['kn', r, ovalZ].join(','), function () {
      /* Tight 8-sided bead, flattened, sits at the joint waist. */
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 8, SEG = 4, oval = ovalZ || 0.50;
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        const y0 = (t0 - 0.5) * r * 1.15, y1 = (t1 - 0.5) * r * 1.15;
        const f0 = Math.sin(t0 * Math.PI), f1 = Math.sin(t1 * Math.PI);
        for (let k = 0; k < RAD; k++) {
          const a0 = (k / RAD) * Math.PI * 2, a1 = ((k + 1) / RAD) * Math.PI * 2;
          function pt(a, y, f) {
            return { x: Math.cos(a) * r * f, y: y, z: Math.sin(a) * r * f * oval, u: a / (Math.PI * 2), v: t0 };
          }
          const A = pt(a0, y0, f0), B = pt(a1, y0, f0), C = pt(a0, y1, f1), D = pt(a1, y1, f1);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(p.u, p.v);
            bag.col.push(1, 1, 1);
          }
        }
      }
      return bagToGeo(bag);
    });
  }

  /* Thin inset nail plate — a very shallow bevelled slab. */
  function nailPlate(w, h, thick) {
    return share(['nail', w, h, thick].join(','), function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const hw = w / 2, hh = h / 2, zt = thick, zb = thick * 0.25;
      /* Dorsal face (slightly tapered toward the tip, +Y). */
      const verts = [
        /* +Z (dorsal) */ [-hw, -hh, zt], [hw, -hh, zt], [hw * 0.88, hh, zt * 0.8], [-hw * 0.88, hh, zt * 0.8],
        /* -Z (inset)  */ [hw, -hh, -zb], [-hw, -hh, -zb], [-hw * 0.88, hh, -zb], [hw * 0.88, hh, -zb]
      ];
      const faces = [
        [0, 1, 2, 0, 2, 3], /* +Z */
        [4, 5, 6, 4, 6, 7], /* -Z */
        [0, 3, 6, 0, 6, 5], /* -X */
        [1, 4, 7, 1, 7, 2], /* +X */
        [3, 2, 7, 3, 7, 6], /* +Y tip */
        [0, 5, 4, 0, 4, 1]  /* -Y root */
      ];
      for (let f = 0; f < faces.length; f++) {
        const F = faces[f];
        const a = verts[F[0]], b = verts[F[1]], c = verts[F[2]];
        const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2];
        const e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
        let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        for (let i = 0; i < 6; i++) {
          const p = verts[F[i]];
          bag.pos.push(p[0], p[1], p[2]);
          bag.nrm.push(nx, ny, nz);
          bag.uv.push((i % 3) * 0.5, i > 2 ? 1 : 0);
          bag.col.push(1, 1, 1);
        }
      }
      return bagToGeo(bag);
    });
  }

  function matOf(mesh, kind) {
    const H = W.__hands1265;
    try { if (H && H.ensureTextures) H.ensureTextures(); } catch (_) {}
    if (H) {
      if (kind === 'finger' && H._finger) return H._finger;
      if (kind === 'knuckle' && H._kn) return H._kn;
      if (kind === 'nail' && H._nail) return H._nail;
      if (kind === 'palm' && H._palm) return H._palm;
      if (kind === 'skin' && H._skin) return H._skin;
    }
    return mesh && mesh.material;
  }

  function directMeshes(group, pred) {
    const out = [];
    if (!group || !group.children) return out;
    for (let i = 0; i < group.children.length; i++) {
      const o = group.children[i];
      if (o && o.isMesh && (!pred || pred(o))) out.push(o);
    }
    return out;
  }

  function setGeo(mesh, geo, kind) {
    if (!mesh) return;
    mesh.geometry = geo;
    const m = matOf(mesh, kind);
    if (m) mesh.material = m;
    mesh.userData = mesh.userData || {};
    mesh.userData.sculpt1266geo = 1;
    mesh.userData.sculpt1266 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
  }

  function refineFinger(f, k, role, isThumb) {
    const r = isThumb ? 0.0082 : (WIDTH[role] || 0.0060);
    const oval = isThumb ? 0.56 : 0.47;
    const bend = isThumb ? 0.08 : (BEND[role] || 0.1);
    if (isThumb) {
      /* Two visual phalanges: a thicker thenar-based proximal, then a
         tapered distal pair (mid + tip) with a knuckle at the joint. */
      const segs = directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; });
      segs.forEach(function (o) {
        setGeo(o, phalanxGeo(0.050, 0.0115, 0.0080, oval, 1, bend, 0), 'finger');
      });
      directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(0.0090, oval), 'knuckle');
      });
      if (k) {
        directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(0.018, 0.0078, 0.0066, oval, 1, bend * 0.8, 0), 'finger');
        });
        const d = k.userData && k.userData.d;
        if (d) {
          directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
            setGeo(o, phalanxGeo(0.014, 0.0066, 0.0050, oval, 0, bend * 0.5, 0.0024), 'finger');
          });
          /* Thin inset nail on the last segment. */
          directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265); }).forEach(function (o) {
            setGeo(o, nailPlate(0.0064, 0.0050, 0.00085), 'nail');
            o.position.set(0, 0.011, 0.0040);
            o.rotation.x = -0.12;
            o.userData.nail1266 = 1;
          });
        }
      }
      return;
    }
    /* Four fingers: three phalanges, tapered, oval, joint waists, knuckle bulges. */
    const lp = PROX[role], lm = MID[role], ld = DIST[role], tip = TIP[role];
    const r0 = r, r1 = r * 0.74, r2 = r * 0.56, r3 = r * 0.40;
    directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
      setGeo(o, phalanxGeo(lp, r0, r1, oval, 1, bend, 0), 'finger');
    });
    directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
      setGeo(o, knuckleGeo(r0 * 1.05, oval), 'knuckle');
      o.position.y = 0.001;
    });
    if (k) {
      directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(lm, r1, r2, oval * 0.98, 1, bend * 0.85, 0), 'finger');
      });
      directMeshes(k, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(r1 * 1.00, oval), 'knuckle');
      });
      const d = k.userData && k.userData.d;
      if (d) {
        directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(ld, r2, r3, oval * 0.95, 0, bend * 0.6, tip), 'finger');
        });
        directMeshes(d, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
          setGeo(o, knuckleGeo(r2 * 0.85, oval), 'knuckle');
        });
        const nailY = ld * 0.62 + tip * 0.15;
        const nailZ = Math.max(r3 * oval * 1.05, 0.0024);
        directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265); }).forEach(function (o) {
          setGeo(o, nailPlate(r2 * 1.40, ld * 0.55 + tip * 0.45, 0.0014), 'nail');
          o.position.set(0, nailY, nailZ);
          o.rotation.x = -0.18;
          o.userData.nail1266 = 1;
        });
      }
    }
  }

  function upgradeThenar(h, side) {
    /* Thicker thenar base, visually a little lower on the palm. The thumb
       Group pivot is not moved. */
    if (!h || h.userData.thenar1266) return;
    const pads = [];
    h.traverse(function (o) {
      if (o.isMesh && o.userData && o.userData.pad1249) pads.push(o);
    });
    /* The 1249 thenar is the pad whose x has the same sign as `side`. */
    pads.forEach(function (o) {
      const x = o.position.x;
      if (x * side > 0.01) {
        /* thenar */
        o.position.set(side * 0.022, 0.022, -0.006);
        o.scale.set(0.014, 0.013, 0.010);
        o.rotation.z = side * -0.35;
        o.rotation.x = 0.25;
        o.userData.thenar1266 = 1;
        const m = matOf(o, 'palm');
        if (m) o.material = m;
      }
    });
    h.userData.thenar1266 = 1;
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1266) return;
    h.userData.sculpt1266 = 1;
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      refineFinger(pair[0], pair[1], roleOf(i, side), false);
    }
    if (h.userData.th) {
      refineFinger(h.userData.th, h.userData.th.userData && h.userData.th.userData.k, 0, true);
    }
    upgradeThenar(h, side);
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    if (arm.userData.sculpt1266) return;
    const p = arm.userData.p;
    const side = arm.userData.side || 1;
    if (p.h) upgradeHand(p.h, side);
    arm.userData.sculpt1266 = 1;
  }

  function isEmptyHand() {
    try {
      if (typeof held !== 'undefined' && held && held.children && held.children.length) return false;
      if (typeof selId !== 'undefined' && selId) return false;
    } catch (_) {}
    return true;
  }
  function isBusyAnim() {
    try { if (typeof swingT !== 'undefined' && swingT > 0) return true; } catch (_) {}
    try { if (W.__rl && W.__rl.t > 0) return true; } catch (_) {}
    try { if (typeof rlT !== 'undefined' && rlT > 0) return true; } catch (_) {}
    return false;
  }

  function applyRestCurl() {
    /* Only the empty / idle hand. Item grips and their wrapping stay exactly
       as __fpa set them this frame. */
    if (!isEmptyHand() || isBusyAnim()) { U._restOn = 0; return; }
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return;
      [rig.userData.R, rig.userData.L].forEach(function (arm) {
        if (!arm || !arm.userData || !arm.userData.p || !arm.userData.p.h) return;
        const h = arm.userData.p.h;
        const side = arm.userData.side || 1;
        const fingers = h.userData.f || [];
        for (let i = 0; i < fingers.length; i++) {
          const pair = fingers[i];
          if (!pair) continue;
          const role = roleOf(i, side);
          const f = pair[0], k = pair[1];
          if (f) f.rotation.x = REST_F[role];
          if (k) k.rotation.x = REST_K[role];
          if (k && k.userData && k.userData.d) k.userData.d.rotation.x = REST_D[role];
        }
      });
      U._restOn = 1;
    } catch (e) { ERR('rest', e); }
  }

  function apply() {
    try {
      const fpa = W.__fpa;
      if (!fpa) return false;
      const rig = (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      try {
        if (W.__hands1265 && typeof W.__hands1265.apply === 'function' && !W.__hands1265.sculpted) {
          W.__hands1265.apply();
        }
      } catch (_) {}
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      U.sculpted = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
  }
  U.apply = apply;
  U.applyRestCurl = applyRestCurl;

  function wrapFun(obj, key, flag) {
    /* Re-wrap whenever someone else (held-frame-1251 repose, etc.)
       has become the outermost wrapper after us. */
    const fn = obj && obj[key];
    if (typeof fn !== 'function') return false;
    if (fn[flag]) return true;
    const prev = fn.bind(obj);
    function wrapped() {
      const r = prev.apply(this, arguments);
      try { if (!U.sculpted) apply(); } catch (_) {}
      try { applyRestCurl(); } catch (_) {}
      U.frames++;
      return r;
    }
    wrapped[flag] = 1;
    obj[key] = wrapped;
    return true;
  }

  function hook() {
    try {
      const fpa = W.__fpa;
      wrapFun(fpa, 'step', '__is1266');
      if (fpa && fpa.step && fpa.step.__is1266) fpa.__step1266 = 1;
      const HF = W.__heldFrame1251;
      wrapFun(HF, 'repose', '__is1266');
      wrapFun(HF, 'apply', '__is1266');
      try {
        if (typeof updateHand === 'function' && !updateHand.__is1266) {
          const uh = updateHand;
          function wrappedUH() {
            const r = uh.apply(this, arguments);
            try { applyRestCurl(); } catch (_) {}
            return r;
          }
          wrappedUH.__is1266 = 1;
          updateHand = wrappedUH;
        }
      } catch (_) {}
      const H65 = W.__hands1265;
      if (H65 && typeof H65.apply === 'function' && !H65.__wrap1266) {
        const pa = H65.apply.bind(H65);
        H65.apply = function () {
          const r = pa.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        H65.__wrap1266 = 1;
      }
      if (H65 && typeof H65.applyMaterials === 'function' && !H65.__wrap1266m) {
        const pm = H65.applyMaterials.bind(H65);
        H65.applyMaterials = function () {
          const r = pm.apply(this, arguments);
          return r;
        };
        H65.__wrap1266m = 1;
      }
    } catch (e) { ERR('hook', e); }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hook();
    try { apply(); } catch (_) {}
    /* Keep re-hooking for a few seconds so a late 1251 wrap cannot sit outside us. */
    if (n > 120) clearInterval(boot);
  }, 50);
  [100, 200, 450, 800, 1250, 1800, 2200, 2900, 4000].forEach(function (ms) {
    setTimeout(function () { try { hook(); apply(); } catch (_) {} }, ms);
  });
  if (W.addEventListener) W.addEventListener('load', function () { hook(); apply(); });
})(typeof window !== 'undefined' ? window : this);
