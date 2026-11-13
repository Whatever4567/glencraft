/* GLX-HANDS1270 (v1.2.70): a solid sculpt pass on the classic 1.2.59 __fpa /
   1.2.57 meshes / 1.2.66 fingers. Skin is a lighter, warmer natural flesh
   (matching the v1262 refs), not dark wood-brown. Fingers are fleshy rather
   than claw-like: rounder padded tips, a subtler knuckle shade, a sparse
   specular highlight, and a limited palette. The forearm and cuff are slimmer
   and less blocky, with a taper and a bevelled, better-shaded sleeve cuff.
   Same objects, hierarchy, pivots and grip poses; every animation (swing,
   mine, place, idle, hip-fire, aim-down-sights) still runs untouched. Grips
   still wrap the torch, pistol, sword, block and bucket. The gold D-pad is
   left alone. The view-model stays hidden in third person. Geometry is cached. */
(function hands1270(WIN) {
  const U = WIN.__hands1270 = {
    on: 0, err: null, version: '1.2.70-flesh', sculpted: 0,
    cached: 0, verts: 0, geos: 0, slimmed: 0
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
  /* A touch fleshier than 1.2.66, still thinner than the old sausages. */
  const WIDTH = [0.0074, 0.0075, 0.0069, 0.0060];
  const PROX = [0.0356, 0.0360, 0.0354, 0.0310];
  const MID  = [0.0166, 0.0172, 0.0164, 0.0136];
  const DIST = [0.0138, 0.0162, 0.0140, 0.0098];
  const BEND = [0.08, 0.07, 0.11, 0.16];

  /* ---------- limited flesh palettes: lighter, warmer, not wood-brown ---------- */
  /* Mid sits around the v1262 ref (≈ 210,165,130). Shadows stay warm. */
  const SKIN_RAMP = [
    [0.995, 0.94, 0.88],
    [0.98, 0.90, 0.82],
    [0.96, 0.85, 0.75],
    [0.93, 0.80, 0.68],
    [0.90, 0.74, 0.61],
    [0.87, 0.69, 0.56],
    [0.82, 0.62, 0.50],
    [0.76, 0.55, 0.44],
    [0.70, 0.48, 0.39],
    [0.64, 0.42, 0.34]
  ];
  const PALM_RAMP = [
    [0.98, 0.88, 0.80],
    [0.95, 0.82, 0.72],
    [0.91, 0.75, 0.64],
    [0.87, 0.68, 0.57],
    [0.82, 0.61, 0.51],
    [0.76, 0.54, 0.45],
    [0.70, 0.48, 0.40],
    [0.64, 0.42, 0.35]
  ];
  const LINEN_RAMP = [
    [0.98, 0.96, 0.92],
    [0.95, 0.93, 0.88],
    [0.91, 0.88, 0.82],
    [0.86, 0.83, 0.76],
    [0.80, 0.76, 0.68],
    [0.72, 0.68, 0.60],
    [0.64, 0.60, 0.52]
  ];
  const NAIL_RAMP = [
    [0.99, 0.94, 0.92],
    [0.95, 0.86, 0.84],
    [0.90, 0.78, 0.76],
    [0.82, 0.68, 0.66],
    [0.72, 0.56, 0.55]
  ];
  const SPEC = [0.995, 0.97, 0.93];
  const SPEC_LO = [0.97, 0.92, 0.86];
  const KN_SHADE = [0.82, 0.60, 0.50];
  const OUTLINE = [0.42, 0.28, 0.22];
  U.palettes = { skin: SKIN_RAMP.length + 3, palm: PALM_RAMP.length, linen: LINEN_RAMP.length, nail: NAIL_RAMP.length };

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
    const gate = bayer(x, y);
    const pick = (f > gate) ? (i + 1) : i;
    return ramp[pick];
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
    const knuckle = !!opts.knuckle, finger = !!opts.finger;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size, u = x / size;
      /* Lighter on the dorsum (low V), a little warmer toward the sides. */
      let shade = 0.22 + 0.62 * (1 - v) + 0.08 * Math.sin(u * Math.PI);
      shade += (hash(x, y) - 0.5) * 0.04;
      /* Subtle crease AO — never drops into wood-brown. */
      const crease = Math.pow(Math.abs(Math.sin(v * Math.PI * 3.0)), 8) * 0.22;
      shade = Math.max(0.18, shade - crease);
      /* Subtle knuckle bands on fingers (two soft darker rings). */
      if (finger || knuckle) {
        const k1 = Math.exp(-Math.pow((v - 0.32) * 14, 2));
        const k2 = Math.exp(-Math.pow((v - 0.62) * 16, 2));
        shade -= (k1 + k2) * (knuckle ? 0.16 : 0.10);
      }
      let col = rampDither(shade, ramp, x, y);
      if (finger || knuckle) {
        const k1 = Math.exp(-Math.pow((v - 0.32) * 14, 2));
        const k2 = Math.exp(-Math.pow((v - 0.62) * 16, 2));
        const k = Math.max(k1, k2);
        if (k > 0.25) col = lerp3(col, KN_SHADE, k * 0.35);
      }
      /* Sparse specular highlight — a few bright pixels, not a sheen sheet. */
      const spark = hash(x * 3.1, y * 5.7);
      if (shade > 0.55 && spark > 0.987) col = SPEC;
      else if (shade > 0.50 && spark > 0.975) col = SPEC_LO;
      /* Very thin dark edge, used sparingly. */
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        if (bayer(x, y) > 0.55) col = lerp3(col, OUTLINE, 0.35);
      }
      put(d, (y * size + x) * 4, col);
    }
    ctx.putImageData(img, 0, 0);
  }
  function paintLinen(ctx, size) {
    const img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size, u = x / size;
      /* Weave: fine cross hatch quantized to the linen ramp. */
      const weave = ((x & 1) !== (y & 1)) ? 0.03 : -0.015;
      /* Longitudinal cuff folds (broad, shaded). */
      const fold = Math.pow(Math.abs(Math.sin(u * Math.PI * 4.0)), 3) * 0.28;
      /* Hem band near the cuff lip. */
      const hem = (v > 0.82) ? (v - 0.82) / 0.18 * 0.18 : 0;
      let shade = 0.78 - fold - hem + weave + (hash(x, y) - 0.5) * 0.04;
      const col = rampDither(shade, LINEN_RAMP, x, y);
      put(d, (y * size + x) * 4, col);
    }
    ctx.putImageData(img, 0, 0);
  }
  function paintNail(ctx, size) {
    const img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size;
      let shade = 0.35 + 0.55 * (1 - v) + (hash(x, y) - 0.5) * 0.05;
      let col = rampDither(shade, NAIL_RAMP, x, y);
      if (hash(x * 2.2, y * 4.1) > 0.982) col = SPEC;
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
    m.userData.sculpt1270 = 1;
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
      existing.needsUpdate = true;
      existing.userData = existing.userData || {};
      existing.userData.sculpt1270 = 1;
      return existing;
    }
    return mkMat(tex, tag);
  }
  function mats() {
    ensureTextures();
    const H = WIN.__hands1265;
    U._skin = retint(U._skin || (H && H._skin), TEX.dorsal, 'skin1270');
    U._palm = retint(U._palm || (H && H._palm), TEX.palm, 'palm1270');
    U._finger = retint(U._finger || (H && H._finger), TEX.finger, 'finger1270');
    U._kn = retint(U._kn || (H && H._kn), TEX.knuckle, 'knuckle1270');
    U._nail = retint(U._nail || (H && H._nail), TEX.nail, 'nail1270');
    U._linen = retint(U._linen || (H && H._linen), TEX.linen, 'linen1270');
    if (H) {
      if (H._skin) H._skin = U._skin;
      if (H._palm) H._palm = U._palm;
      if (H._finger) H._finger = U._finger;
      if (H._kn) H._kn = U._kn;
      if (H._nail) H._nail = U._nail;
      if (H._linen) H._linen = U._linen;
    }
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

  /* Fleshy phalanx: gentle waist, modest knuckle, round padded tip (hemisphere). */
  function phalanxGeo(len, r0, r1, ovalZ, knuckle, bend, tipR) {
    const key = ['phx70', len, r0, r1, ovalZ, knuckle ? 1 : 0, bend || 0, tipR || 0].join(',');
    return share(key, function () {
      const RAD = 8;
      const rings = [];
      function pushRing(t, rm, sh) { rings.push({ t: t, rm: rm, sh: sh }); }
      pushRing(0.00, 1.00, 0.96);
      pushRing(0.10, 0.92, 0.90);                 /* gentle waist, not a pinch */
      if (knuckle) {
        pushRing(0.26, 1.08, 0.86);               /* modest knuckle, subtle shade */
        pushRing(0.42, 1.00, 0.98);
      } else {
        pushRing(0.28, 0.98, 0.97);
        pushRing(0.48, 0.96, 0.98);
      }
      pushRing(0.72, 0.95, 1.00);
      pushRing(1.00, 0.94, 1.02);                 /* almost full radius at the pad */
      /* Hemispherical padded tip — fleshy, not a claw point. */
      const cap = (tipR && tipR > 0) ? tipR : r1 * 0.95;
      const steps = [[0.22, 0.90], [0.45, 0.76], [0.68, 0.54], [0.88, 0.28], [1.00, 0.04]];
      for (let s = 0; s < steps.length; s++) {
        pushRing(1.00 + (cap * steps[s][0]) / len, steps[s][1], 1.04);
      }
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const oval = ovalZ || 0.62;
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
        const oz = oval * (1 - 0.12 * palmar);
        const c = centerAt(ring.t);
        return { x: Math.cos(a) * r, y: c.y, z: c.z + Math.sin(a) * r * oz, a: a, u: k / RAD, v: Math.min(1, ring.t), sh: ring.sh };
      }
      function colOf(ring) {
        /* Subtle knuckle shade in vertex colour (multiplies the light map). */
        const s = ring.sh || 1;
        if (s < 0.92) return [0.94, 0.86, 0.78];
        return [1, 0.99, 0.97];
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
            const p = verts[v], c = colOf(rings[p === A || p === B ? i : i + 1]);
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(p.u, p.v);
            bag.col.push(c[0], c[1], c[2]);
          }
        }
      }
      const r0n = rings[0], c0 = centerAt(r0n.t);
      for (let k = 0; k < RAD; k++) {
        const a = ringPt(r0n, k), b = ringPt(r0n, k + 1);
        const tri = [[0, c0.y, c0.z], [a.x, a.y, a.z], [b.x, b.y, b.z]];
        for (let v = 0; v < 3; v++) {
          bag.pos.push(tri[v][0], tri[v][1], tri[v][2]);
          bag.nrm.push(0, -1, 0);
          bag.uv.push(0.5, 0);
          bag.col.push(1, 0.99, 0.97);
        }
      }
      return bagToGeo(bag);
    });
  }

  function knuckleGeo(r, ovalZ) {
    return share(['kn70', r, ovalZ].join(','), function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 8, SEG = 4, oval = ovalZ || 0.62;
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        const y0 = (t0 - 0.5) * r * 1.05, y1 = (t1 - 0.5) * r * 1.05;
        const f0 = Math.sin(t0 * Math.PI), f1 = Math.sin(t1 * Math.PI);
        for (let k = 0; k < RAD; k++) {
          const a0 = (k / RAD) * Math.PI * 2, a1 = ((k + 1) / RAD) * Math.PI * 2;
          function pt(a, y, f) { return { x: Math.cos(a) * r * f, y: y, z: Math.sin(a) * r * f * oval, u: a / (Math.PI * 2), v: t0 }; }
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
            bag.col.push(0.95, 0.88, 0.80);
          }
        }
      }
      return bagToGeo(bag);
    });
  }

  function nailPlate(w, h, thick) {
    return share(['nail70', w, h, thick].join(','), function () {
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

  /* Slim tapered sleeve with a soft bevel at each end and gentle cloth folds. */
  function sleeveGeo(r0, r1, len, rad, segs, folds, bevel) {
    const key = ['slv70', r0, r1, len, rad, segs, folds, bevel || 0].join(',');
    return share(key, function () {
      rad = rad || 24; segs = segs || 16; folds = folds || 3;
      const bev = bevel || 0.06;
      const pos = [], nrm = [], uv = [], ix = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * len;
        let rBase = r0 + (r1 - r0) * t;
        /* Bevel / chamfer at both lips so the tube is not a raw cylinder. */
        if (t < bev) rBase *= 0.86 + 0.14 * (t / bev);
        if (t > 1 - bev) rBase *= 0.86 + 0.14 * ((1 - t) / bev);
        for (let k = 0; k < rad; k++) {
          const a = (k / rad) * Math.PI * 2;
          const wr = 1
            + 0.045 * Math.sin(a * folds + t * 1.6)
            + 0.022 * Math.sin(a * (folds + 2) - t * 2.2);
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

  function cuffGeo(r0, r1, len) {
    const key = ['cuff70', r0, r1, len].join(',');
    return share(key, function () {
      /* Slim rolled hem: gentle taper, a small bevelled lip, cloth folds. */
      const g = sleeveGeo(r0, r1, len, 24, 14, 3, 0.10).clone();
      const pos = g.attributes.position;
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
      const span = (ymax - ymin) || 1;
      for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) - ymin) / span;
        /* Soft rolled lip on the last 22% — modest, not a life-preserver. */
        if (t > 0.78) {
          const k = (t - 0.78) / 0.22;
          const fl = 1 + 0.16 * k * k;
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
    mesh.userData.sculpt1270geo = 1;
    mesh.userData.sculpt1270 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
  }

  function refineFinger(f, k, role, isThumb) {
    const r = isThumb ? 0.0090 : (WIDTH[role] || 0.0066);
    const oval = isThumb ? 0.66 : 0.62;
    const bend = isThumb ? 0.07 : (BEND[role] || 0.09);
    if (isThumb) {
      directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(0.050, 0.0120, 0.0092, oval, 1, bend, 0), 'finger');
      });
      directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(0.0094, oval), 'knuckle');
      });
      if (k) {
        directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(0.018, 0.0088, 0.0078, oval, 1, bend * 0.8, 0), 'finger');
        });
        const d = k.userData && k.userData.d;
        if (d) {
          directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
            setGeo(o, phalanxGeo(0.015, 0.0078, 0.0070, oval, 0, bend * 0.5, 0.0068), 'finger');
          });
          directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266); }).forEach(function (o) {
            setGeo(o, nailPlate(0.0070, 0.0056, 0.0009), 'nail');
            o.position.set(0, 0.011, 0.0044);
            o.rotation.x = -0.12;
            o.userData.nail1270 = 1;
          });
        }
      }
      return;
    }
    const lp = PROX[role], lm = MID[role], ld = DIST[role];
    const r0 = r, r1 = r * 0.90, r2 = r * 0.82, r3 = r * 0.76;
    const tipR = r3 * 0.95;
    directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
      setGeo(o, phalanxGeo(lp, r0, r1, oval, 1, bend, 0), 'finger');
    });
    directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
      setGeo(o, knuckleGeo(r0 * 1.02, oval), 'knuckle');
    });
    if (k) {
      directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(lm, r1, r2, oval * 0.98, 1, bend * 0.85, 0), 'finger');
      });
      directMeshes(k, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(r1 * 0.98, oval), 'knuckle');
      });
      const d = k.userData && k.userData.d;
      if (d) {
        directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(ld, r2, r3, oval * 0.96, 0, bend * 0.55, tipR), 'finger');
        });
        directMeshes(d, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
          setGeo(o, knuckleGeo(r2 * 0.90, oval), 'knuckle');
        });
        const nailY = ld * 0.58 + tipR * 0.20;
        const nailZ = Math.max(r3 * oval * 1.05, 0.0026);
        directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266); }).forEach(function (o) {
          setGeo(o, nailPlate(r2 * 1.35, ld * 0.50 + tipR * 0.40, 0.0013), 'nail');
          o.position.set(0, nailY, nailZ);
          o.rotation.x = -0.16;
          o.userData.nail1270 = 1;
        });
      }
    }
  }

  function slimSleeve(arm) {
    const p = arm && arm.userData && arm.userData.p;
    if (!p) return;
    const lm = matOf(null, 'linen');
    /* Forearm: slimmer, tapers toward the wrist, bevelled lips. Was 0.056→0.060. */
    if (p.fo && !p.fo.userData.slim1270) {
      p.fo.geometry = sleeveGeo(0.044, 0.036, 0.36, 24, 16, 3, 0.07);
      p.fo.material = lm;
      p.fo.userData.slim1270 = 1;
      p.fo.userData.sculpt1270 = 1;
      p.fo.userData.sculptKeep = 1;
      U.slimmed++;
    } else if (p.fo && lm) p.fo.material = lm;
    /* Upper sleeve, if visible: slimmer taper. Was 0.07→0.06. */
    if (p.up && !p.up.userData.slim1270) {
      p.up.geometry = sleeveGeo(0.050, 0.042, 0.38, 24, 16, 3, 0.07);
      p.up.material = lm;
      p.up.userData.slim1270 = 1;
      p.up.userData.sculpt1270 = 1;
      p.up.userData.sculptKeep = 1;
      U.slimmed++;
    } else if (p.up && lm) p.up.material = lm;
    if (p.el && lm) { p.el.material = lm; }
    /* Cuff: slimmer rolled hem with a modest bevelled lip and fold shading. Was 0.062→0.078 × 0.145. */
    if (p.cuff && !p.cuff.userData.slim1270) {
      p.cuff.geometry = cuffGeo(0.038, 0.044, 0.11);
      p.cuff.material = lm;
      p.cuff.userData.slim1270 = 1;
      p.cuff.userData.sculpt1270 = 1;
      p.cuff.userData.sculptKeep = 1;
      U.slimmed++;
      /* Scale any 1265 rolled-cap child so it matches the slimmer cuff. */
      try {
        p.cuff.children && p.cuff.children.forEach(function (ch) {
          if (ch && ch.userData && (ch.userData.roll1265 || ch.userData.sleeveCap)) {
            ch.scale.set(0.72, 0.78, 0.72);
            if (lm) ch.material = lm;
          }
        });
      } catch (_) {}
    } else if (p.cuff && lm) p.cuff.material = lm;
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1270) return;
    h.userData.sculpt1270 = 1;
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      refineFinger(pair[0], pair[1], roleOf(i, side), false);
    }
    if (h.userData.th) {
      refineFinger(h.userData.th, h.userData.th.userData && h.userData.th.userData.k, 0, true);
    }
    /* Retint palm / pads with the new flesh material. */
    try {
      h.traverse(function (o) {
        if (!o.isMesh) return;
        const u = o.userData || {};
        if (u.palmAtlas || u.pad1249 || u.pad1265 || u.thenar1266) {
          const m = matOf(o, 'palm');
          if (m) o.material = m;
          u.sculpt1270 = 1;
        }
      });
    } catch (_) {}
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    slimSleeve(arm);
    const p = arm.userData.p;
    const side = arm.userData.side || 1;
    if (p.h) upgradeHand(p.h, side);
    arm.userData.sculpt1270 = 1;
  }

  function apply() {
    try {
      const fpa = WIN.__fpa;
      if (!fpa) return false;
      const rig = (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      try {
        if (WIN.__hands1266 && typeof WIN.__hands1266.apply === 'function' && !WIN.__hands1266.sculpted) {
          WIN.__hands1266.apply();
        }
      } catch (_) {}
      try {
        if (WIN.__hands1265 && typeof WIN.__hands1265.apply === 'function' && !WIN.__hands1265.sculpted) {
          WIN.__hands1265.apply();
        }
      } catch (_) {}
      mats();
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      U.sculpted = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
  }
  U.apply = apply;

  function hook() {
    try {
      const H66 = WIN.__hands1266;
      if (H66 && typeof H66.apply === 'function' && !H66.__wrap1270) {
        const pa = H66.apply.bind(H66);
        H66.apply = function () {
          const r = pa.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        H66.__wrap1270 = 1;
      }
      const H65 = WIN.__hands1265;
      if (H65 && typeof H65.apply === 'function' && !H65.__wrap1270) {
        const pa = H65.apply.bind(H65);
        H65.apply = function () {
          const r = pa.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        H65.__wrap1270 = 1;
      }
      if (H65 && typeof H65.applyMaterials === 'function' && !H65.__wrap1270m) {
        const pm = H65.applyMaterials.bind(H65);
        H65.applyMaterials = function () {
          const r = pm.apply(this, arguments);
          try { mats(); apply(); } catch (_) {}
          return r;
        };
        H65.__wrap1270m = 1;
      }
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
