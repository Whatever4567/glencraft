/* GLX-HANDS1271 (v1.2.71): a second sculpt pass on the classic 1.2.59 __fpa /
   1.2.57 meshes / 1.2.66 fingers / 1.2.70 flesh. The arm is not replaced, and
   no animation (swing, mine, place, idle, hip-fire, aim-down-sights) is
   touched. The open palm is narrower and thinner, with a slight cup and a
   bevel; skin is softened and desaturated toward a natural pink-beige (less
   orange / terracotta), with a palm-centre shade and a rim light. The thumb
   is a proper 2-segment tapered digit angled off the palm, not a sphere.
   Finger cross-sections are rounder, with less ring segmentation, and the
   nails are slightly lighter at the tips. The cuff reads as a white / cream
   shirt sleeve: lighter, with fold shading, a soft hem line, and a slight
   flare rather than a box. A static view-model FRAME nudge (pistol, torch
   only — not ADS, not animation curves) lifts the knuckles and wrapped
   fingers into the bottom-right. Grips still wrap the torch, pistol, sword,
   block and bucket. First-person hands stay hidden in third person. The gold
   D-pad is left alone. Geometry is cached. */
(function hands1271(WIN) {
  const U = WIN.__hands1271 = {
    on: 0, err: null, version: '1.2.71-palm', sculpted: 0,
    cached: 0, verts: 0, geos: 0, slimmed: 0, nudged: 0
  };
  const T = WIN.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const GEO = {};
  function share(key, build) {
    if (!GEO[key]) { GEO[key] = build(); U.geos++; }
    U.cached++;
    return GEO[key];
  }

  function roleOf(i, side) { return side >= 0 ? (3 - i) : i; }
  const WIDTH = [0.0072, 0.0073, 0.0067, 0.0058];
  const PROX = [0.0356, 0.0360, 0.0354, 0.0310];
  const MID  = [0.0166, 0.0172, 0.0164, 0.0136];
  const DIST = [0.0138, 0.0162, 0.0140, 0.0098];
  const BEND = [0.08, 0.07, 0.11, 0.16];

  /* Pink-beige flesh: desaturated vs 1.2.70 terracotta, closer to v1262. */
  const SKIN_RAMP = [
    [0.98, 0.93, 0.90],
    [0.95, 0.88, 0.84],
    [0.92, 0.82, 0.78],
    [0.89, 0.76, 0.72],
    [0.85, 0.71, 0.67],
    [0.80, 0.66, 0.62],
    [0.75, 0.60, 0.56],
    [0.70, 0.55, 0.52]
  ];
  const PALM_RAMP = [
    [0.96, 0.88, 0.84],
    [0.92, 0.81, 0.77],
    [0.87, 0.74, 0.70],
    [0.82, 0.68, 0.64],
    [0.77, 0.62, 0.58],
    [0.72, 0.57, 0.54]
  ];
  const LINEN_RAMP = [
    [0.995, 0.992, 0.980],
    [0.980, 0.975, 0.955],
    [0.960, 0.950, 0.925],
    [0.930, 0.915, 0.885],
    [0.890, 0.870, 0.835],
    [0.840, 0.820, 0.780]
  ];
  const NAIL_RAMP = [
    [0.99, 0.95, 0.93],
    [0.96, 0.90, 0.88],
    [0.92, 0.84, 0.82],
    [0.86, 0.76, 0.74]
  ];
  const SPEC = [0.99, 0.96, 0.94];
  const SPEC_LO = [0.96, 0.92, 0.90];
  const KN_SHADE = [0.80, 0.66, 0.62];
  const OUTLINE = [0.62, 0.50, 0.48];
  const RIM = [0.99, 0.95, 0.93];
  const PALM_CENTRE = [0.80, 0.64, 0.60];
  U.palettes = { skin: SKIN_RAMP.length, palm: PALM_RAMP.length, linen: LINEN_RAMP.length, nail: NAIL_RAMP.length };

  const BAYER8 = [
    [ 0, 32,  8, 40,  2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];
  function bayer(x, y) { return (BAYER8[y & 7][x & 7] + 0.5) / 64; }
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function lerp3(a, b, t) { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rampDither(t, ramp, x, y) {
    const n = ramp.length - 1;
    const u = Math.max(0, Math.min(1, t)) * n;
    const i = Math.min(n - 1, Math.floor(u));
    const f = u - i;
    const mixed = lerp3(ramp[i], ramp[i + 1], f);
    const gate = bayer(x, y);
    const pick = (f > gate) ? (i + 1) : i;
    return lerp3(mixed, ramp[pick], 0.35);
  }
  function put(data, i, c) {
    data[i] = Math.round(c[0] * 255);
    data[i + 1] = Math.round(c[1] * 255);
    data[i + 2] = Math.round(c[2] * 255);
    data[i + 3] = 255;
  }

  function paintSkin(ctx, size, opts) {
    opts = opts || {};
    const img = ctx.getImageData(0, 0, size, size), d = img.data;
    const ramp = opts.palm ? PALM_RAMP : SKIN_RAMP;
    const knuckle = !!opts.knuckle, finger = !!opts.finger, palm = !!opts.palm;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size, u = x / size;
      let shade = 0.28 + 0.58 * (1 - v) + 0.06 * Math.sin(u * Math.PI);
      if (finger) shade += 0.08;
      shade += (hash(x, y) - 0.5) * 0.02;
      /* Soft crease AO — shallow, never terracotta. */
      const crease = Math.pow(Math.abs(Math.sin(v * Math.PI * 2.4)), 10) * 0.10;
      shade = Math.max(0.22, shade - crease);
      /* Palm-centre shade: a soft darker well around mid UV. */
      if (palm) {
        const cx = u - 0.50, cy = v - 0.52;
        const well = Math.exp(-(cx * cx * 7 + cy * cy * 6));
        shade -= well * 0.22;
      }
      /* Rim light: lighter band along the sides. */
      const rim = Math.pow(Math.max(0, Math.abs(u - 0.5) * 2 - 0.55), 1.4);
      shade += rim * 0.18;
      /* Very subtle knuckle bands — much weaker than 1.2.70 rings. */
      if (finger || knuckle) {
        const k1 = Math.exp(-Math.pow((v - 0.34) * 18, 2));
        const k2 = Math.exp(-Math.pow((v - 0.64) * 20, 2));
        shade -= (k1 + k2) * (knuckle ? 0.08 : 0.04);
      }
      let col = rampDither(Math.max(0.12, Math.min(0.98, shade)), ramp, x, y);
      if (palm) {
        const cx = u - 0.50, cy = v - 0.52;
        const well = Math.exp(-(cx * cx * 7 + cy * cy * 6));
        if (well > 0.15) col = lerp3(col, PALM_CENTRE, well * 0.40);
      }
      if (rim > 0.08) col = lerp3(col, RIM, Math.min(0.45, rim * 0.55));
      const spark = hash(x * 3.1, y * 5.7);
      if (shade > 0.62 && spark > 0.993) col = SPEC;
      else if (shade > 0.55 && spark > 0.988) col = SPEC_LO;
      if ((x === 0 || y === 0 || x === size - 1 || y === size - 1) && bayer(x, y) > 0.65) {
        col = lerp3(col, OUTLINE, 0.22);
      }
      put(d, (y * size + x) * 4, col);
    }
    ctx.putImageData(img, 0, 0);
  }
  function paintLinen(ctx, size) {
    const img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size, u = x / size;
      const weave = ((x & 1) !== (y & 1)) ? 0.02 : -0.01;
      const fold = Math.pow(Math.abs(Math.sin(u * Math.PI * 4.0)), 2.4) * 0.22;
      /* Soft hem line — a thin darker band near the cuff lip, not a hard edge. */
      const hem = Math.exp(-Math.pow((v - 0.88) * 28, 2)) * 0.16;
      let shade = 0.88 - fold - hem + weave + (hash(x, y) - 0.5) * 0.025;
      const col = rampDither(Math.max(0.20, Math.min(0.98, shade)), LINEN_RAMP, x, y);
      put(d, (y * size + x) * 4, col);
    }
    ctx.putImageData(img, 0, 0);
  }
  function paintNail(ctx, size) {
    const img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size;
      /* Lighter at the free edge (high V / tip). */
      let shade = 0.42 + 0.50 * v + (hash(x, y) - 0.5) * 0.03;
      let col = rampDither(shade, NAIL_RAMP, x, y);
      if (v > 0.72) col = lerp3(col, [1, 0.97, 0.95], (v - 0.72) / 0.28 * 0.55);
      if (hash(x * 2.2, y * 4.1) > 0.990) col = SPEC;
      put(d, (y * size + x) * 4, col);
    }
    ctx.putImageData(img, 0, 0);
  }

  const TEX = {};
  function makeTex(name, paint) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    paint(g, 128);
    const t = new T.CanvasTexture(c);
    t.magFilter = t.minFilter = T.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    TEX[name] = t;
    return t;
  }
  function ensureTextures() {
    if (TEX.dorsal) return TEX;
    makeTex('dorsal', (g, s) => paintSkin(g, s, {}));
    makeTex('palm', (g, s) => paintSkin(g, s, { palm: 1 }));
    makeTex('finger', (g, s) => paintSkin(g, s, { finger: 1 }));
    makeTex('knuckle', (g, s) => paintSkin(g, s, { knuckle: 1, finger: 1 }));
    makeTex('nail', paintNail);
    makeTex('linen', paintLinen);
    return TEX;
  }
  U.ensureTextures = ensureTextures;
  U.TEX = TEX;

  function mkMat(map, tag) {
    const m = new T.MeshLambertMaterial({
      color: 0xffffff,
      map: map || undefined,
      vertexColors: true,
      flatShading: false,
      emissive: 0x000000
    });
    m.side = T.DoubleSide;
    m.userData.sculpt1271 = 1;
    m.userData.sculptKeep = 1;
    if (tag) m.userData[tag] = 1;
    return m;
  }
  function retint(existing, tex, tag) {
    if (existing && existing.isMaterial) {
      existing.map = tex;
      try { existing.color.setHex(0xffffff); } catch (_) {}
      existing.flatShading = false;
      existing.vertexColors = true;
      existing.side = T.DoubleSide;
      existing.needsUpdate = true;
      existing.userData = existing.userData || {};
      existing.userData.sculpt1271 = 1;
      return existing;
    }
    return mkMat(tex, tag);
  }
  function mats() {
    ensureTextures();
    const H70 = WIN.__hands1270, H65 = WIN.__hands1265;
    U._skin = retint(U._skin || (H70 && H70._skin) || (H65 && H65._skin), TEX.dorsal, 'skin1271');
    U._palm = retint(U._palm || (H70 && H70._palm) || (H65 && H65._palm), TEX.palm, 'palm1271');
    U._finger = retint(U._finger || (H70 && H70._finger) || (H65 && H65._finger), TEX.finger, 'finger1271');
    U._kn = retint(U._kn || (H70 && H70._kn) || (H65 && H65._kn), TEX.knuckle, 'knuckle1271');
    U._nail = retint(U._nail || (H70 && H70._nail) || (H65 && H65._nail), TEX.nail, 'nail1271');
    U._linen = retint(U._linen || (H70 && H70._linen) || (H65 && H65._linen), TEX.linen, 'linen1271');
    [H70, H65].forEach(function (H) {
      if (!H) return;
      if (H._skin) H._skin = U._skin;
      if (H._palm) H._palm = U._palm;
      if (H._finger) H._finger = U._finger;
      if (H._kn) H._kn = U._kn;
      if (H._nail) H._nail = U._nail;
      if (H._linen) H._linen = U._linen;
    });
    return U;
  }
  function matOf(mesh, kind) {
    mats();
    if (kind === 'finger') return U._finger;
    if (kind === 'knuckle') return U._kn;
    if (kind === 'nail') return U._nail;
    if (kind === 'palm') return U._palm;
    if (kind === 'linen') return U._linen;
    if (kind === 'skin') return U._skin;
    return (mesh && mesh.material) || U._skin;
  }

  function bagToGeo(bag) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(bag.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(bag.nrm, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(bag.uv, 2));
    if (bag.col && bag.col.length) g.setAttribute('color', new T.Float32BufferAttribute(bag.col, 3));
    U.verts += (bag.pos.length / 3) | 0;
    return g;
  }

  /* Narrower, thinner palmar slab with a cup, a bevel, a thenar mound,
     a centre shade and a rim light. Same placement as the 1249 palm. */
  function palmGeo(side) {
    const key = 'palm71-' + (side >= 0 ? 'r' : 'l');
    return share(key, function () {
      const W = 0.066, H = 0.100, D = 0.023;
      const g = new T.BoxGeometry(W, H, D, 16, 16, 8);
      const p = g.attributes.position;
      const uv = g.attributes.uv;
      const col = [];
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const yn = (y + H * 0.5) / H;
        const xn = x / (W * 0.5);
        /* Narrower at the wrist, a gentle waist, rounded finger edge. */
        const wrist = 1 - 0.30 * Math.pow(Math.max(0, 1 - yn), 1.55);
        const tip = 1 - 0.08 * Math.pow(Math.max(0, yn - 0.78) / 0.22, 2);
        x *= wrist * tip;
        /* Palmar cup (z<0 hollows at the centre); dorsal camber; thinner overall. */
        const cup = (1 - xn * xn) * Math.sin(Math.max(0.05, Math.min(0.95, yn)) * Math.PI);
        if (z < 0) z = z * 0.78 - 0.007 * cup;
        else z = z * 0.78 + 0.0025 * yn;
        /* Thenar mound on the thumb side, baked in — not a sphere. */
        const ths = (side >= 0 ? 1 : -1);
        if ((x * ths) > 0 && yn > 0.18 && yn < 0.72 && z <= 0.002) {
          const tu = (x * ths) / (W * 0.5);
          const tv = (yn - 0.42) / 0.28;
          const mound = Math.exp(-(Math.pow((tu - 0.62) * 3.2, 2) + tv * tv * 3.4));
          z += -0.006 * mound;
          x += ths * 0.003 * mound;
        }
        /* Bevel / rounded corners so it is not a box. */
        const edge = Math.max(Math.abs(xn) - 0.58, 0) + Math.max(Math.abs(yn - 0.5) - 0.44, 0);
        if (edge > 0) {
          const k = 1 - 0.45 * Math.min(1, edge);
          x *= k; z *= k;
        }
        p.setXYZ(i, x, y, z);
        if (uv) {
          const u = uv.getX(i);
          uv.setX(i, z < 0 ? 0.5 + 0.5 * u : 0.5 * u);
        }
        /* Vertex colours: palm-centre shade, rim light on the edges. */
        const cx = xn, cy = yn - 0.5;
        const well = (z < 0) ? Math.exp(-(cx * cx * 2.8 + cy * cy * 3.2)) : 0;
        const rim = Math.max(0, Math.abs(xn) - 0.55) + Math.max(0, Math.abs(yn - 0.5) - 0.42);
        let cr = 0.97, cg = 0.90, cb = 0.86;
        if (z < 0) { cr = 0.92; cg = 0.80; cb = 0.76; }
        cr -= well * 0.10; cg -= well * 0.12; cb -= well * 0.10;
        const rl = Math.min(1, rim * 1.4);
        cr += rl * 0.06; cg += rl * 0.06; cb += rl * 0.07;
        col.push(cr, cg, cb);
      }
      if (uv) uv.needsUpdate = true;
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const out = g.clone();
      out.type = 'BufferGeometry';
      return out;
    });
  }

  function wristGeo(len, r0, r1) {
    return share(['wr71', len, r0, r1].join(','), function () {
      return sleeveGeo(r0, r1, len, 20, 10, 0, 0.12);
    });
  }

  /* Rounder cross-section (higher RAD, oval near 1), almost no ring pinch. */
  function phalanxGeo(len, r0, r1, ovalZ, knuckle, bend, tipR) {
    const key = ['phx71e', len, r0, r1, ovalZ, knuckle ? 1 : 0, bend || 0, tipR || 0].join(',');
    return share(key, function () {
      const RAD = 14;
      const rings = [];
      function pushRing(t, rm, sh) { rings.push({ t: t, rm: rm, sh: sh }); }
      pushRing(0.00, 1.00, 0.98);
      pushRing(0.16, 0.97, 0.97);
      if (knuckle) {
        pushRing(0.36, 1.03, 0.95);
        pushRing(0.58, 0.99, 0.99);
      } else {
        pushRing(0.40, 0.98, 0.99);
      }
      pushRing(0.80, 0.97, 1.00);
      pushRing(1.00, 0.96, 1.02);
      /* Hemispherical cap — always fully closed at a pole (rm = 0), so an
         end-on view never reads as a hollow tube. Distal tips use tipR;
         other segments get a short rounded lip. */
      const cap = (tipR && tipR > 0) ? tipR : r1 * 0.55;
      const steps = [[0.22, 0.90], [0.45, 0.74], [0.68, 0.50], [0.88, 0.24], [1.00, 0.00]];
      for (let s = 0; s < steps.length; s++) {
        pushRing(1.00 + (cap * steps[s][0]) / Math.max(len, 0.001), steps[s][1], 1.05);
      }
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const oval = ovalZ || 0.90;
      function radiusAt(ring) {
        const tt = Math.min(1, ring.t);
        return (r0 + (r1 - r0) * Math.pow(tt, 0.85)) * ring.rm;
      }
      function centerAt(t) {
        const b = bend || 0;
        if (b < 1e-4) return { y: t * len, z: 0 };
        const R = len / b, a = b * Math.min(t, 1);
        return { y: R * Math.sin(a) + Math.max(0, t - 1) * len, z: -R * (1 - Math.cos(a)) };
      }
      function ringPt(ring, k) {
        const a = (k / RAD) * Math.PI * 2;
        const r = radiusAt(ring);
        const palmar = Math.max(0, -Math.sin(a));
        const oz = oval * (1 - 0.08 * palmar);
        const c = centerAt(ring.t);
        /* End-cap and hemispherical tip rings sample the light skin band
           (v ≈ 0.15), not v = 1 (the darkest crease), so end-on tips read
           as soft pads rather than hollow tubes. */
        const vUv = (ring.t >= 0.995) ? 0.15 : Math.min(0.82, Math.max(0, ring.t));
        return { x: Math.cos(a) * r, y: c.y, z: c.z + Math.sin(a) * r * oz, a: a, u: k / RAD, v: vUv, sh: ring.sh };
      }
      function colOf(ring) {
        if (ring.t >= 0.995) return [1, 0.98, 0.95];
        const s = ring.sh || 1;
        if (s < 0.96) return [0.95, 0.88, 0.85];
        return [1, 0.98, 0.96];
      }
      for (let i = 0; i < rings.length - 1; i++) {
        for (let k = 0; k < RAD; k++) {
          const A = ringPt(rings[i], k), B = ringPt(rings[i], k + 1);
          const C = ringPt(rings[i + 1], k), D = ringPt(rings[i + 1], k + 1);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const pt = verts[v], c = colOf(rings[pt === A || pt === B ? i : i + 1]);
            bag.pos.push(pt.x, pt.y, pt.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(pt.u, pt.v);
            bag.col.push(c[0], c[1], c[2]);
          }
        }
      }
      function capFan(ring, pole, nrm, reverse) {
        for (let k = 0; k < RAD; k++) {
          const a = ringPt(ring, k), b = ringPt(ring, k + 1);
          const verts = reverse ? [pole, b, a] : [pole, a, b];
          for (let vi = 0; vi < 3; vi++) {
            const pt = verts[vi];
            bag.pos.push(pt.x, pt.y, pt.z);
            bag.nrm.push(nrm[0], nrm[1], nrm[2]);
            bag.uv.push(0.5, 0.15);
            bag.col.push(1, 0.98, 0.95);
          }
        }
      }
      const r0n = rings[0], c0 = centerAt(r0n.t);
      capFan(r0n, { x: 0, y: c0.y, z: c0.z, u: 0.5, v: 0.15 }, [0, -1, 0], true);
      /* Solid pole at the tip. The shaft strips already close when the last
         ring has rm = 0 (outward winding A-C-B). A second fan with the
         opposite winding used to win the depth test and, with DoubleSide,
         flip its normals — a black hole at the pad. Only add a fan when
         the last ring is still open, and use the same outward winding
         (reverse = true == [pole, b, a] == A-C-B). */
      const lastRm = rings[rings.length - 1].rm;
      if (lastRm >= 0.05) {
        let tipIdx = rings.length - 1;
        while (tipIdx > 0 && rings[tipIdx].rm < 0.05) tipIdx--;
        const rTn = rings[tipIdx], cT = centerAt(rings[rings.length - 1].t);
        capFan(rTn, { x: 0, y: cT.y, z: cT.z, u: 0.5, v: 0.15 }, [0, 1, 0], true);
      }
      return bagToGeo(bag);
    });
  }

  function knuckleGeo(r, ovalZ) {
    return share(['kn71', r, ovalZ].join(','), function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 14, SEG = 5, oval = ovalZ || 0.90;
      const rr = r * 0.72;
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        const y0 = (t0 - 0.5) * rr * 0.95, y1 = (t1 - 0.5) * rr * 0.95;
        const f0 = Math.sin(t0 * Math.PI), f1 = Math.sin(t1 * Math.PI);
        for (let k = 0; k < RAD; k++) {
          const a0 = (k / RAD) * Math.PI * 2, a1 = ((k + 1) / RAD) * Math.PI * 2;
          function pt(a, y, f) { return { x: Math.cos(a) * rr * f, y: y, z: Math.sin(a) * rr * f * oval, u: a / (Math.PI * 2), v: t0 }; }
          const A = pt(a0, y0, f0), B = pt(a1, y0, f0), C = pt(a0, y1, f1), D = pt(a1, y1, f1);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const ptv = verts[v];
            bag.pos.push(ptv.x, ptv.y, ptv.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(ptv.u, ptv.v);
            bag.col.push(0.96, 0.90, 0.87);
          }
        }
      }
      return bagToGeo(bag);
    });
  }

  function nailPlate(w, h, thick) {
    return share(['nail71', w, h, thick].join(','), function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const hw = w / 2, hh = h / 2, zt = thick, zb = thick * 0.25;
      const verts = [
        [-hw, -hh, zt], [hw, -hh, zt], [hw * 0.90, hh, zt * 0.85], [-hw * 0.90, hh, zt * 0.85],
        [hw, -hh, -zb], [-hw, -hh, -zb], [-hw * 0.90, hh, -zb], [hw * 0.90, hh, -zb]
      ];
      const faces = [
        [0, 1, 2, 0, 2, 3], [4, 5, 6, 4, 6, 7], [0, 3, 6, 0, 6, 5],
        [1, 4, 7, 1, 7, 2], [3, 2, 7, 3, 7, 6], [0, 5, 4, 0, 4, 1]
      ];
      for (let f = 0; f < faces.length; f++) {
        const F = faces[f];
        const a = verts[F[0]], b = verts[F[1]], c = verts[F[2]];
        const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2];
        const e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
        let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        for (let i = 0; i < 6; i++) {
          const pt = verts[F[i]];
          bag.pos.push(pt[0], pt[1], pt[2]);
          bag.nrm.push(nx, ny, nz);
          bag.uv.push((i % 3) * 0.5, pt[1] > 0 ? 1 : 0);
          /* Lighter at the tip (+Y). */
          const tip = (pt[1] + hh) / (h || 1);
          const cr = 0.96 + 0.04 * tip, cg = 0.90 + 0.07 * tip, cb = 0.88 + 0.08 * tip;
          bag.col.push(cr, cg, cb);
        }
      }
      return bagToGeo(bag);
    });
  }

  function sleeveGeo(r0, r1, len, rad, segs, folds, bevel) {
    const key = ['slv71', r0, r1, len, rad, segs, folds, bevel || 0].join(',');
    return share(key, function () {
      rad = rad || 24; segs = segs || 16; folds = folds || 3;
      const bev = bevel || 0.06;
      const pos = [], nrm = [], uv = [], ix = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * len;
        let rBase = r0 + (r1 - r0) * t;
        if (t < bev) rBase *= 0.90 + 0.10 * (t / bev);
        if (t > 1 - bev && bev > 0 && folds === 0) rBase *= 0.90 + 0.10 * ((1 - t) / bev);
        for (let k = 0; k < rad; k++) {
          const a = (k / rad) * Math.PI * 2;
          const wr = folds ? (1
            + 0.040 * Math.sin(a * folds + t * 1.6)
            + 0.018 * Math.sin(a * (folds + 2) - t * 2.2)) : 1;
          const r = rBase * wr;
          const ox = Math.cos(a), oz = Math.sin(a);
          pos.push(ox * r, y, oz * r);
          nrm.push(ox, 0, oz);
          uv.push(k / rad, t);
        }
      }
      for (let i = 0; i < segs; i++) for (let k = 0; k < rad; k++) {
        const a = i * rad + k, b = i * rad + (k + 1) % rad;
        const c = (i + 1) * rad + k, d = (i + 1) * rad + (k + 1) % rad;
        ix.push(a, c, b, b, c, d);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(ix);
      geo.computeVertexNormals();
      return geo;
    });
  }

  /* Cream shirt cuff: slightly flared, soft hem line, cloth folds — not a box. */
  function cuffGeo(r0, r1, len) {
    const key = ['cuff71', r0, r1, len].join(',');
    return share(key, function () {
      const g = sleeveGeo(r0, r1, len, 28, 18, 4, 0.08).clone();
      const pos = g.attributes.position;
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
      const span = (ymax - ymin) || 1;
      for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) - ymin) / span;
        /* Soft rolled hem on the last 20%: flare then a gentle tuck. */
        if (t > 0.80) {
          const k = (t - 0.80) / 0.20;
          const fl = 1 + 0.20 * Math.sin(k * Math.PI) * (0.65 + 0.35 * k);
          pos.setX(i, pos.getX(i) * fl);
          pos.setZ(i, pos.getZ(i) * fl);
        }
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
      return g;
    });
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
    mesh.userData.sculpt1271geo = 1;
    mesh.userData.sculpt1271 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
  }

  function refineFinger(f, k, role, isThumb) {
    const r = isThumb ? 0.0092 : (WIDTH[role] || 0.0066);
    const oval = isThumb ? 0.88 : 0.90;
    const bend = isThumb ? 0.07 : (BEND[role] || 0.09);
    if (isThumb) {
      /* Proper 2-segment tapered digit: a thicker proximal, then one distal
         (mid + a big rounded tip, no ring at the last joint). */
      directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(0.054, 0.0132, 0.0100, oval, 1, bend, 0), 'finger');
      });
      directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(0.0088, oval), 'knuckle');
      });
      if (k) {
        directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(0.028, 0.0100, 0.0082, oval, 0, bend * 0.7, 0), 'finger');
        });
        directMeshes(k, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
          o.visible = false;
          o.scale.set(0.15, 0.15, 0.15);
        });
        const d = k.userData && k.userData.d;
        if (d) {
          directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
            setGeo(o, phalanxGeo(0.022, 0.0082, 0.0068, oval * 0.98, 0, bend * 0.45, 0.0105), 'finger');
          });
          directMeshes(d, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
            o.visible = false;
            o.scale.set(0.15, 0.15, 0.15);
          });
          directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266 || o.userData.nail1270); }).forEach(function (o) {
            setGeo(o, nailPlate(0.0072, 0.0060, 0.0009), 'nail');
            o.position.set(0, 0.012, 0.0046);
            o.rotation.x = -0.12;
            o.userData.nail1271 = 1;
          });
        }
      }
      return;
    }
    const lp = PROX[role], lm = MID[role], ld = DIST[role];
    const r0 = r, r1 = r * 0.92, r2 = r * 0.86, r3 = r * 0.82;
    const tipR = r3 * 0.98;
    directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
      setGeo(o, phalanxGeo(lp, r0, r1, oval, 1, bend, 0), 'finger');
    });
    directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
      setGeo(o, knuckleGeo(r0 * 0.85, oval), 'knuckle');
    });
    if (k) {
      directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(lm, r1, r2, oval * 0.99, 1, bend * 0.85, 0), 'finger');
      });
      directMeshes(k, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(r1 * 0.80, oval), 'knuckle');
      });
      const d = k.userData && k.userData.d;
      if (d) {
        directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(ld, r2, r3, oval * 0.98, 0, bend * 0.55, tipR), 'finger');
        });
        directMeshes(d, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
          o.visible = false;
          o.scale.set(0.2, 0.2, 0.2);
        });
        const nailY = ld * 0.58 + tipR * 0.22;
        const nailZ = Math.max(r3 * oval * 1.02, 0.0026);
        directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266 || o.userData.nail1270); }).forEach(function (o) {
          setGeo(o, nailPlate(r2 * 1.30, ld * 0.50 + tipR * 0.40, 0.0012), 'nail');
          o.position.set(0, nailY, nailZ);
          o.rotation.x = -0.16;
          o.userData.nail1271 = 1;
        });
      }
    }
  }

  function hideSpherePads(h) {
    try {
      h.traverse(function (o) {
        if (!o.isMesh || !o.userData) return;
        const u = o.userData;
        if (u.pad1249 || u.pad1265 || u.thenar1266) {
          o.visible = false;
          try { o.scale.set(0.001, 0.001, 0.001); } catch (_) {}
          u.hidden1271 = 1;
        }
      });
    } catch (_) {}
  }

  function sculptPalm(h, side) {
    if (!h) return;
    try {
      h.traverse(function (o) {
        if (!o.isMesh || !o.userData) return;
        if (o.userData.palmAtlas) {
          setGeo(o, palmGeo(side), 'palm');
          o.position.set(0, 0.05, 0);
          o.scale.set(1, 1, 1);
          o.userData.sculpt1271palm = 1;
        }
      });
    } catch (e) { ERR('palm', e); }
    hideSpherePads(h);
    try {
      const ths = (side >= 0 ? 1 : -1);
      let m = null;
      h.traverse(function (o) { if (o && o.userData && o.userData.thenar1271 && o.isMesh) m = o; });
      if (!m) {
        m = new T.Mesh(phalanxGeo(0.032, 0.0130, 0.0088, 0.62, 0, 0.18, 0.008), matOf(null, 'skin'));
        m.position.set(ths * 0.026, 0.034, -0.003);
        m.rotation.set(0.62, ths * 0.40, ths * 0.75);
        m.userData.thenar1271 = 1;
        m.userData.sculpt1271 = 1;
        m.userData.sculptKeep = 1;
        m.frustumCulled = false;
        h.add(m);
        h.userData.thenar1271 = 1;
      }
      if (m) { m.material = matOf(m, 'skin'); m.material.side = T.DoubleSide; }
    } catch (e) { ERR('thenar', e); }
    /* Decorative dorsal knuckle bumps: pull in to the narrower palm, shrink. */
    try {
      const kn = h.userData && h.userData.kn;
      if (kn && kn.length && !h.userData.kn1271) {
        for (let i = 0; i < kn.length; i++) {
          const b = kn[i];
          if (!b) continue;
          b.position.x = (i - 1.5) * 0.0175;
          b.position.y = 0.094;
          b.position.z = 0.008;
          b.scale.set(0.70, 0.62, 0.62);
          const m = matOf(b, 'skin');
          if (m) b.material = m;
        }
        h.userData.kn1271 = 1;
      }
    } catch (_) {}
    /* Slim the 1249 wrist stump so it matches the narrower palm. */
    try {
      h.children && h.children.forEach(function (o) {
        if (!o || !o.isMesh || !o.userData) return;
        if (o.userData.palmAtlas || o.userData.pad1249 || o.userData.fingerAtlas) return;
        if (o.userData.nail1249 || o.userData.knuckle1249 || o.userData.tendon1265) return;
        if (o.userData.wristCap1249 || o.userData.sleeveCap) {
          o.geometry = sleeveGeo(0.022, 0.022, 0.004, 20, 2, 0, 0);
          const m = matOf(o, 'linen');
          if (m) o.material = m;
          o.userData.sculpt1271 = 1;
          return;
        }
        if (Math.abs((o.position.y || 0) + 0.048) < 0.012 && !o.userData.slimWrist1271) {
          o.geometry = wristGeo(0.048, 0.024, 0.020);
          const m = matOf(o, 'skin');
          if (m) o.material = m;
          o.userData.slimWrist1271 = 1;
          o.userData.sculpt1271 = 1;
        }
      });
    } catch (_) {}
  }

  function slimCuff(arm) {
    const p = arm && arm.userData && arm.userData.p;
    if (!p) return;
    const lm = matOf(null, 'linen');
    if (p.fo && lm) p.fo.material = lm;
    if (p.up && lm) p.up.material = lm;
    if (p.el && lm) p.el.material = lm;
    if (p.cuff && !p.cuff.userData.slim1271) {
      /* Slightly flared cream cuff, soft hem — not a box. Was 0.038→0.044 × 0.11. */
      p.cuff.geometry = cuffGeo(0.036, 0.051, 0.125);
      p.cuff.material = lm;
      p.cuff.userData.slim1271 = 1;
      p.cuff.userData.sculpt1271 = 1;
      p.cuff.userData.sculptKeep = 1;
      U.slimmed++;
      try {
        p.cuff.children && p.cuff.children.forEach(function (ch) {
          if (ch && ch.userData && (ch.userData.roll1265 || ch.userData.sleeveCap)) {
            ch.visible = false;
            try { ch.scale.set(0.001, 0.001, 0.001); } catch (_) {}
          }
        });
      } catch (_) {}
    } else if (p.cuff && lm) p.cuff.material = lm;
  }

  /* Static view-model FRAME nudge only — pistol and torch hip-fire, not ADS,
     not animation curves, not fpa.step. Mutates the existing FRAME table
     that held-frame already applies as a rest offset. */
  function nudgeFrame() {
    try {
      const HF = WIN.__heldFrame1251;
      if (!HF || !HF.FRAME) return;
      const P = HF.FRAME.pistol;
      if (P) {
        if (!P._nudge1271) U.nudged++;
        P.dx = 0.06;
        P.dy = 0.04;
        P.dz = 0.08;
        P.s = 1.16;
        P.fov = 0.76;
        P._nudge1271 = 1;
        U.nudged++;
      }
      const Tr = HF.FRAME.torch;
      if (Tr) {
        /* Mild lift, closer and a touch larger so the wrap is readable —
           the first 1271 push left the torch too small and far. */
        Tr.dx = -0.02;
        Tr.dy = 0.02;
        Tr.dz = 0.14;
        Tr.s = 1.24;
        Tr.armS = 1.20;
        Tr.fov = 0.64;
        if (!Tr._nudge1271) U.nudged++;
        Tr._nudge1271 = 1;
      }
    } catch (e) { ERR('frame', e); }
  }
  U.nudgeFrame = nudgeFrame;

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1271 === '1271e') return;
    h.userData.sculpt1271 = '1271e';
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      refineFinger(pair[0], pair[1], roleOf(i, side), false);
    }
    if (h.userData.th) {
      refineFinger(h.userData.th, h.userData.th.userData && h.userData.th.userData.k, 0, true);
    }
    sculptPalm(h, side);
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    slimCuff(arm);
    const p = arm.userData.p;
    const side = arm.userData.side || 1;
    if (p.h) upgradeHand(p.h, side);
    arm.userData.sculpt1271 = 1;
  }

  function apply() {
    if (U._applying) return !!U.sculpted;
    U._applying = 1;
    try {
      const fpa = WIN.__fpa;
      if (!fpa) return false;
      const rig = (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      try {
        if (WIN.__hands1270 && typeof WIN.__hands1270.apply === 'function' && !WIN.__hands1270.sculpted) {
          WIN.__hands1270.apply();
        }
      } catch (_) {}
      mats();
      nudgeFrame();
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      U.sculpted = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
    finally { U._applying = 0; }
  }
  U.apply = apply;

  function wrapApply(obj, flag) {
    if (!obj || typeof obj.apply !== 'function' || obj[flag]) return;
    const pa = obj.apply.bind(obj);
    obj.apply = function () {
      const r = pa.apply(this, arguments);
      try { apply(); } catch (_) {}
      return r;
    };
    obj[flag] = 1;
  }
  function hook() {
    try {
      wrapApply(WIN.__hands1270, '__wrap1271');
      wrapApply(WIN.__hands1266, '__wrap1271');
      wrapApply(WIN.__hands1265, '__wrap1271');
      const H65 = WIN.__hands1265;
      if (H65 && typeof H65.applyMaterials === 'function' && !H65.__wrap1271m) {
        const pm = H65.applyMaterials.bind(H65);
        H65.applyMaterials = function () {
          const r = pm.apply(this, arguments);
          try { mats(); apply(); } catch (_) {}
          return r;
        };
        H65.__wrap1271m = 1;
      }
      nudgeFrame();
    } catch (e) { ERR('hook', e); }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hook();
    try { apply(); } catch (_) {}
    if (n > 120) clearInterval(boot);
  }, 50);
  [100, 200, 450, 800, 1250, 1800, 2500, 4000].forEach(function (ms) {
    setTimeout(function () { try { hook(); apply(); } catch (_) {} }, ms);
  });
  if (WIN.addEventListener) WIN.addEventListener('load', function () { hook(); apply(); });
})(typeof window !== 'undefined' ? window : this);
